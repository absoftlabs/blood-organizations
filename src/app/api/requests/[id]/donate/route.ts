import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

interface DonateBody {
    doanerId?: string;
}

export async function POST(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const body = (await req.json()) as DonateBody;

        if (!body.doanerId || !ObjectId.isValid(body.doanerId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার নির্বাচন করুন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection("blood_requests");
        const doanersCol = db.collection("doaners");

        const requestId = new ObjectId(id);
        const donorId = new ObjectId(body.doanerId);

        const requestDoc = await requestsCol.findOne({ _id: requestId });
        if (!requestDoc) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const donorDoc = await doanersCol.findOne({ _id: donorId });
        if (!donorDoc) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const now = new Date();

        // 1) Request -> completed
        await requestsCol.updateOne(
            { _id: requestId },
            {
                $set: {
                    status: "completed",
                    updatedAt: now,
                },
            }
        );

        // 2) Donor stats update
        await doanersCol.updateOne(
            { _id: donorId },
            {
                $set: {
                    lastDonationDate: now,
                    lastDonationPlace:
                        typeof requestDoc.hospitalAddress === "string"
                            ? requestDoc.hospitalAddress
                            : "",
                    updatedAt: now,
                },
                $inc: {
                    totalDonations: 1,
                },
            }
        );

        return NextResponse.json(
            { success: true, message: "ডোনেশন সফলভাবে সম্পন্ন হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("POST /api/admin/requests/[id]/donate error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
