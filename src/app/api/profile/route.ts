import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

// =======================
// Cookie → User ID
// =======================
async function getUserIdFromCookie(): Promise<ObjectId | null> {
    const store = await cookies();
    const token = store.get("auth_token")?.value;
    if (!token) return null;

    try {
        return new ObjectId(token);
    } catch {
        return null;
    }
}

export const runtime = "nodejs";

// =======================
// Allowed genders
// =======================
const GENDERS = ["male", "female", "other"] as const;
type GenderType = (typeof GENDERS)[number];

// =======================
//       GET PROFILE
// =======================
export async function GET() {
    try {
        const userId = await getUserIdFromCookie();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "অননুমোদিত অনুরোধ।" },
                { status: 401 }
            );
        }

        const db = await getDb();
        const doaners = db.collection<Doaner>("doaners");

        const user = await doaners.findOne({ _id: userId });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "ইউজার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            {
                success: true,
                data: {
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    bloodGroup: user.bloodGroup,

                    // ✅ Address (4 fields)
                    village: user.village ?? "",
                    union: user.union ?? "",
                    upazila: user.upazila ?? "",
                    district: user.district ?? "",

                    lastDonationDate: user.lastDonationDate
                        ? user.lastDonationDate.toISOString().slice(0, 10)
                        : "",
                    lastDonationPlace: user.lastDonationPlace ?? "",
                    totalDonations: user.totalDonations ?? 0,
                    profileImage: user.profileImage ?? "",
                    isAdmin: user.isAdmin ?? false,

                    gender: user.gender ?? "",
                    birthDate: user.birthDate
                        ? user.birthDate.toISOString().slice(0, 10)
                        : "",
                },
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/profile error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}

// =======================
//     UPDATE PROFILE
// =======================
export async function PUT(req: Request) {
    try {
        const userId = await getUserIdFromCookie();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "অননুমোদিত অনুরোধ।" },
                { status: 401 }
            );
        }

        const body: unknown = await req.json();

        if (typeof body !== "object" || body === null) {
            return NextResponse.json(
                { success: false, message: "অবৈধ ডাটা।" },
                { status: 400 }
            );
        }

        const {
            name,
            mobile,
            bloodGroup,

            // ✅ Address fields
            village,
            union,
            upazila,
            district,

            lastDonationDate,
            lastDonationPlace,
            totalDonations,
            profileImage,

            gender,
            birthDate,

            currentPassword,
            newPassword,
        } = body as {
            name?: string;
            mobile?: string;
            bloodGroup?: string;

            village?: string;
            union?: string;
            upazila?: string;
            district?: string;

            lastDonationDate?: string;
            lastDonationPlace?: string;
            totalDonations?: number;
            profileImage?: string;

            gender?: string;
            birthDate?: string;

            currentPassword?: string;
            newPassword?: string;
        };

        if (!name || !mobile || !bloodGroup) {
            return NextResponse.json(
                { success: false, message: "নাম, মোবাইল এবং ব্লাড গ্রুপ আবশ্যক।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const doaners = db.collection<Doaner>("doaners");

        const user = await doaners.findOne({ _id: userId });
        if (!user) {
            return NextResponse.json(
                { success: false, message: "ইউজার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        // =======================
        // Update object (type-safe)
        // =======================
        const updateFields: Partial<Doaner> = {
            name,
            mobile,
            bloodGroup,

            village: village ?? "",
            union: union ?? "",
            upazila: upazila ?? "",
            district: district ?? "",

            lastDonationPlace: lastDonationPlace ?? "",
            totalDonations:
                typeof totalDonations === "number" ? totalDonations : 0,

            updatedAt: new Date(),
        };

        // Last Donation Date
        if (typeof lastDonationDate === "string" && lastDonationDate.trim()) {
            const d = new Date(lastDonationDate);
            if (!isNaN(d.getTime())) {
                updateFields.lastDonationDate = d;
            }
        } else {
            updateFields.lastDonationDate = null;
        }

        // Profile Image
        if (typeof profileImage === "string" && profileImage.trim()) {
            updateFields.profileImage = profileImage;
        }

        // Gender (validated)
        if (typeof gender === "string" && GENDERS.includes(gender as GenderType)) {
            updateFields.gender = gender as GenderType;
        }

        // Birth Date
        if (typeof birthDate === "string" && birthDate.trim()) {
            const d = new Date(birthDate);
            if (!isNaN(d.getTime())) {
                updateFields.birthDate = d;
            }
        }

        // =======================
        // Password change
        // =======================
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword) {
                return NextResponse.json(
                    { success: false, message: "বর্তমান পাসওয়ার্ড দিন।" },
                    { status: 400 }
                );
            }

            const isMatch = await bcrypt.compare(
                currentPassword,
                user.passwordHash
            );

            if (!isMatch) {
                return NextResponse.json(
                    { success: false, message: "বর্তমান পাসওয়ার্ড সঠিক নয়।" },
                    { status: 400 }
                );
            }

            if (newPassword.length < 6) {
                return NextResponse.json(
                    {
                        success: false,
                        message: "নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।",
                    },
                    { status: 400 }
                );
            }

            const salt = await bcrypt.genSalt(10);
            updateFields.passwordHash = await bcrypt.hash(newPassword, salt);
        }

        await doaners.updateOne({ _id: userId }, { $set: updateFields });

        return NextResponse.json(
            { success: true, message: "প্রোফাইল সফলভাবে আপডেট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("PUT /api/profile error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
