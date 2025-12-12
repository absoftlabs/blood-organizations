import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { Doaner } from "@/types/user";
import type { BloodRequest } from "@/types/admin";

export const runtime = "nodejs";

interface DonateBody {
    doanerId?: string;
}

type RouteContext = {
    params: Promise<{ id: string }>;
};

export async function POST(req: NextRequest, { params }: RouteContext) {
    try {
        const { id } = await params;

        if (!id || typeof id !== "string") {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        let requestObjectId: ObjectId;
        try {
            requestObjectId = new ObjectId(id);
        } catch {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const body = (await req.json()) as DonateBody;

        if (!body.doanerId || typeof body.doanerId !== "string") {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        let donorObjectId: ObjectId;
        try {
            donorObjectId = new ObjectId(body.doanerId);
        } catch {
            return NextResponse.json(
                { success: false, message: "সঠিক ডোনার আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");
        const doanersCol = db.collection<Doaner>("doaners");

        const requestDoc = await requestsCol.findOne({ _id: requestObjectId });
        if (!requestDoc) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        if (requestDoc.status === "completed") {
            return NextResponse.json(
                { success: false, message: "এই রিকুয়েস্ট ইতিমধ্যে Completed।" },
                { status: 400 }
            );
        }

        const donor = await doanersCol.findOne({ _id: donorObjectId });
        if (!donor) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const donationDate =
            requestDoc.donationDateTime instanceof Date
                ? requestDoc.donationDateTime
                : new Date(requestDoc.donationDateTime);

        const donationPlace = requestDoc.hospitalAddress ?? "";

        const now = new Date();

        await requestsCol.updateOne(
            { _id: requestObjectId },
            { $set: { status: "completed", updatedAt: now } }
        );

        await doanersCol.updateOne(
            { _id: donorObjectId },
            {
                $set: {
                    lastDonationDate: donationDate,
                    lastDonationPlace: donationPlace,
                    updatedAt: now,
                },
                $inc: { totalDonations: 1 },
            }
        );

        return NextResponse.json(
            { success: true, message: "ডোনেশন সফলভাবে কমপ্লিট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("POST /api/requests/[id]/donate error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
