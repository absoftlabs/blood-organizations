// src/app/api/admin/requests/[id]/donate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId, type Db } from "mongodb";
import { cookies } from "next/headers";
import { getDb } from "@/lib/mongodb";
import type { BloodRequest } from "@/types/admin";
import type { Doaner } from "@/types/user";

export const runtime = "nodejs";

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

async function requireAdmin(db: Db): Promise<{ ok: true } | { ok: false; res: NextResponse }> {
    const userId = await getUserIdFromCookie();
    if (!userId) {
        return {
            ok: false,
            res: NextResponse.json({ success: false, message: "অননুমোদিত অনুরোধ।" }, { status: 401 }),
        };
    }

    const doaners = db.collection<Doaner>("doaners");
    const me = await doaners.findOne({ _id: userId });

    if (!me) {
        return {
            ok: false,
            res: NextResponse.json({ success: false, message: "ইউজার পাওয়া যায়নি।" }, { status: 404 }),
        };
    }

    if (!me.isAdmin) {
        return {
            ok: false,
            res: NextResponse.json({ success: false, message: "আপনার এই এক্সেস নেই।" }, { status: 403 }),
        };
    }

    return { ok: true };
}

interface DonateBody {
    doanerId: string;
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // ✅ Next.js 16 expects Promise here
) {
    try {
        const { id: rawId } = await context.params;
        const requestId = (rawId ?? "").trim();

        if (!ObjectId.isValid(requestId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const body = (await req.json()) as DonateBody;

        if (!body?.doanerId || !ObjectId.isValid(body.doanerId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();

        // ✅ Admin guard
        const adminCheck = await requireAdmin(db);
        if (!adminCheck.ok) return adminCheck.res;

        const requestsCol = db.collection<BloodRequest>("blood_requests");
        const doanersCol = db.collection<Doaner>("doaners");

        const reqOid = new ObjectId(requestId);
        const donorOid = new ObjectId(body.doanerId);

        const existingRequest = await requestsCol.findOne({ _id: reqOid });
        if (!existingRequest) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        if (existingRequest.status === "completed") {
            return NextResponse.json(
                { success: false, message: "এই রিকুয়েস্ট আগেই কমপ্লিট করা হয়েছে।" },
                { status: 400 }
            );
        }

        const donor = await doanersCol.findOne({ _id: donorOid });
        if (!donor) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        if (!donor.isApproved) {
            return NextResponse.json(
                { success: false, message: "এই ডোনার অনুমোদিত নয়।" },
                { status: 400 }
            );
        }

        if (donor.isBanned) {
            return NextResponse.json(
                { success: false, message: "এই ডোনার ব্যান করা আছে।" },
                { status: 400 }
            );
        }

        const now = new Date();

        // ✅ Donation completion rules:
        // - request.status => completed
        // - donor.lastDonationDate => today
        // - donor.lastDonationPlace => request.hospitalAddress
        // - donor.totalDonations => +1
        // (Optional) donation history collection can be added later
        const session = db.client.startSession();

        try {
            await session.withTransaction(async () => {
                await requestsCol.updateOne(
                    { _id: reqOid },
                    {
                        $set: {
                            status: "completed",
                            updatedAt: now,
                        },
                    },
                    { session }
                );

                await doanersCol.updateOne(
                    { _id: donorOid },
                    {
                        $set: {
                            lastDonationDate: now,
                            lastDonationPlace: existingRequest.hospitalAddress ?? "",
                            updatedAt: now,
                        },
                        $inc: { totalDonations: 1 },
                    },
                    { session }
                );
            });

            return NextResponse.json(
                { success: true, message: "ডোনেশন সফলভাবে কমপ্লিট হয়েছে।" },
                { status: 200 }
            );
        } finally {
            await session.endSession();
        }
    } catch (error) {
        console.error("POST /api/admin/requests/[id]/donate error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
