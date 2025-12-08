// src/app/api/admin/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { BloodRequest, BloodRequestStatus } from "@/types/admin";

export const runtime = "nodejs";

interface UpdateRequestBody {
    units?: number;
    donationDateTime?: string;
    hospitalAddress?: string;
    status?: BloodRequestStatus;
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body = (await req.json()) as UpdateRequestBody;

        if (!id) {
            return NextResponse.json(
                { success: false, message: "আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        const filter = { _id: new ObjectId(id) };

        const update: Partial<BloodRequest> = {};
        if (typeof body.units === "number" && body.units > 0) {
            update.units = body.units;
        }

        if (body.donationDateTime && body.donationDateTime.trim() !== "") {
            const dt = new Date(body.donationDateTime);
            if (!Number.isNaN(dt.getTime())) {
                update.donationDateTime = dt;
            }
        }

        if (typeof body.hospitalAddress === "string") {
            update.hospitalAddress = body.hospitalAddress;
        }

        if (body.status) {
            update.status = body.status;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json(
                { success: false, message: "কোনো valid আপডেট ডাটা পাওয়া যায়নি।" },
                { status: 400 }
            );
        }

        update.updatedAt = new Date();

        const result = await col.updateOne(filter, { $set: update });

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "রিকুয়েস্ট আপডেট হয়েছে।" },
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

export async function DELETE(
    _req: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        if (!id) {
            return NextResponse.json(
                { success: false, message: "আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        const result = await col.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "রিকুয়েস্ট ডিলিট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE /api/admin/requests/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
