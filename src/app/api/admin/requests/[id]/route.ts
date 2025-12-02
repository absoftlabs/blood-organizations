import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { BloodRequest, BloodRequestStatus } from "@/types/admin";

export const runtime = "nodejs";

interface UpdateRequestBody {
    status?: BloodRequestStatus;
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body: UpdateRequestBody = await req.json();

        if (!body.status) {
            return NextResponse.json(
                { success: false, message: "স্ট্যাটাস প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");

        const filter = { _id: new ObjectId(id) };
        const update: Partial<BloodRequest> = {
            status: body.status,
            updatedAt: new Date(),
        };

        const result = await requestsCol.updateOne(filter, { $set: update });

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "রিকোয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "রিকোয়েস্ট আপডেট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/admin/requests/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
