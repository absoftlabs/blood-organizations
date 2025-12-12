import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { BloodRequestStatus } from "@/types/admin";

export const runtime = "nodejs";

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

        const body = await req.json();
        const { doanerId } = body as { doanerId?: string };

        if (!doanerId || !ObjectId.isValid(doanerId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার নির্বাচন করুন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection("blood_requests");
        const doanersCol = db.collection("doaners");

        const request = await requestsCol.findOne({
            _id: new ObjectId(id),
        });

        if (!request) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const donor = await doanersCol.findOne({
            _id: new ObjectId(doanerId),
        });

        if (!donor) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const now = new Date();

        // ✅ Update request
        await requestsCol.updateOne(
            { _id: new ObjectId(id) },
            {
                $set: {
                    status: "completed" as BloodRequestStatus,
                    updatedAt: now,
                },
            }
        );

        // ✅ Update donor stats
        await doanersCol.updateOne(
            { _id: donor._id },
            {
                $set: {
                    lastDonationDate: now,
                    lastDonationPlace: request.hospitalAddress,
                    updatedAt: now,
                },
                $inc: {
                    totalDonations: 1,
                },
            }
        );

        return NextResponse.json(
            {
                success: true,
                message: "ডোনেশন সফলভাবে সম্পন্ন হয়েছে।",
            },
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
