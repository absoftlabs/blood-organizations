import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { BloodRequest } from "@/types/admin";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

interface DonateBody {
    doanerId?: string;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> } // 🔴 এখানে এখন Promise
) {
    try {
        const { id } = await params; // 🔴 Promise resolve করে id নিচ্ছি

        if (!id || !ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const body: DonateBody = await req.json();

        if (!body.doanerId || !ObjectId.isValid(body.doanerId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const requestId = new ObjectId(id);
        const doanerId = new ObjectId(body.doanerId);

        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");
        const doanersCol = db.collection<Doaner>("doaners");
        const donationsCol = db.collection("donations"); // চাইলে আলাদা collection

        // 👉 রিকুয়েস্টটা নিন
        const requestDoc = await requestsCol.findOne({ _id: requestId });
        if (!requestDoc) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        // 👉 ডোনারটা নিন
        const doanerDoc = await doanersCol.findOne({ _id: doanerId });
        if (!doanerDoc) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const now = new Date();

        // 1) ডোনারের প্রোফাইল আপডেট
        const currentTotal = typeof doanerDoc.totalDonations === "number"
            ? doanerDoc.totalDonations
            : 0;

        await doanersCol.updateOne(
            { _id: doanerId },
            {
                $set: {
                    lastDonationDate:
                        requestDoc.donationDateTime instanceof Date
                            ? requestDoc.donationDateTime
                            : new Date(requestDoc.donationDateTime),
                    lastDonationPlace: requestDoc.hospitalAddress ?? "",
                    updatedAt: now,
                },
                $inc: {
                    totalDonations: 1,
                },
            }
        );

        // 2) চাইলে আলাদা ডোনেশন হিস্ট্রি কালেকশনে ইনসার্ট করতে পারেন
        await donationsCol.insertOne({
            donorId: doanerId,
            donorName: doanerDoc.name,
            bloodGroup: doanerDoc.bloodGroup,
            units: requestDoc.units,
            date:
                requestDoc.donationDateTime instanceof Date
                    ? requestDoc.donationDateTime
                    : new Date(requestDoc.donationDateTime),
            location: requestDoc.hospitalAddress ?? "",
            notes: requestDoc.medicalReason ?? "",
            createdAt: now,
            updatedAt: now,
        });

        // 3) রিকুয়েস্টকে completed মার্ক করা
        await requestsCol.updateOne(
            { _id: requestId },
            {
                $set: {
                    status: "completed",
                    updatedAt: now,
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
