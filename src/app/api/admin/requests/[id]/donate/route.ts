import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export async function POST(
    req: NextRequest,
    context: { params: { id: string } }   // <-- FIXED: Promise নয়, normal object
) {
    try {
        const requestId = context.params.id;

        if (!requestId || !ObjectId.isValid(requestId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const { doanerId } = await req.json();

        if (!doanerId || !ObjectId.isValid(doanerId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection("blood_requests");
        const donorsCol = db.collection("doaners");

        const requestDoc = await requestsCol.findOne({ _id: new ObjectId(requestId) });

        if (!requestDoc) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const donorDoc = await donorsCol.findOne({ _id: new ObjectId(doanerId) });

        if (!donorDoc) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        // Update donation record
        const now = new Date();

        await donorsCol.updateOne(
            { _id: donorDoc._id },
            {
                $set: {
                    lastDonationDate: now,
                    lastDonationPlace: requestDoc.hospitalAddress ?? "",
                },
                $inc: {
                    totalDonations: 1,
                },
            }
        );

        await requestsCol.updateOne(
            { _id: new ObjectId(requestId) },
            {
                $set: {
                    status: "completed",
                    updatedAt: now,
                },
            }
        );

        return NextResponse.json({
            success: true,
            message: "ডোনেশন সফলভাবে সম্পন্ন হয়েছে।",
        });
    } catch (error) {
        console.error("Donate API Error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
