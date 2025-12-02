import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

// NEXT 14+ : cookies() must be awaited
async function getUserIdFromCookie(): Promise<ObjectId | null> {
    const cookieStore = await cookies();

    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    try {
        return new ObjectId(token);
    } catch {
        return null;
    }
}

export const runtime = "nodejs";

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
                    address: user.address ?? "",
                    lastDonationDate: user.lastDonationDate
                        ? user.lastDonationDate.toISOString().slice(0, 10)
                        : "",
                    lastDonationPlace: user.lastDonationPlace ?? "",
                    totalDonations: user.totalDonations ?? 0,
                    profileImage: user.profileImage ?? "",
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
//       UPDATE PROFILE
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

        const body = await req.json();

        const {
            name,
            mobile,
            bloodGroup,
            address,
            lastDonationDate,
            lastDonationPlace,
            totalDonations,
            profileImage,
            currentPassword,
            newPassword,
        } = body;

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

        const updateFields: Partial<Doaner> = {
            name,
            mobile,
            bloodGroup,
            address: address ?? "",
            lastDonationPlace: lastDonationPlace ?? "",
            totalDonations: typeof totalDonations === "number" ? totalDonations : 0,
            updatedAt: new Date(),
        };

        // Last donation date
        if (lastDonationDate && lastDonationDate.trim() !== "") {
            updateFields.lastDonationDate = new Date(lastDonationDate);
        } else {
            updateFields.lastDonationDate = null;
        }

        // Profile image
        if (profileImage && profileImage.trim() !== "") {
            updateFields.profileImage = profileImage;
        }

        // Password change
        if (newPassword && newPassword.trim() !== "") {
            if (!currentPassword || currentPassword.trim() === "") {
                return NextResponse.json(
                    {
                        success: false,
                        message: "পাসওয়ার্ড পরিবর্তনের জন্য বর্তমান পাসওয়ার্ড দিন।",
                    },
                    { status: 400 }
                );
            }

            const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
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

        // Save update
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
