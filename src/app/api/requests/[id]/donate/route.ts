// src/app/api/admin/requests/[id]/donate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { BloodRequest } from "@/types/admin";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

interface DonateBody {
    doanerId: string;
}

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = (await req.json()) as DonateBody;

        if (!id || !body.doanerId) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট আইডি ও ডোনার আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");
        const doanersCol = db.collection<Doaner>("doaners");

        const request = await requestsCol.findOne({ _id: new ObjectId(id) });
        if (!request) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const donor = await doanersCol.findOne({ _id: new ObjectId(body.doanerId) });
        if (!donor) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const newTotalDonations = (donor.totalDonations ?? 0) + 1;

        const donationDate =
            request.donationDateTime instanceof Date
                ? request.donationDateTime
                : new Date(request.donationDateTime);

        // ডোনার আপডেট
        await doanersCol.updateOne(
            { _id: donor._id as ObjectId },
            {
                $set: {
                    lastDonationDate: donationDate,
                    lastDonationPlace: request.hospitalAddress,
                    totalDonations: newTotalDonations,
                    updatedAt: new Date(),
                },
            }
        );

        // রিকুয়েস্ট স্ট্যাটাস completed
        await requestsCol.updateOne(
            { _id: request._id as ObjectId },
            {
                $set: {
                    status: "completed",
                    updatedAt: new Date(),
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
