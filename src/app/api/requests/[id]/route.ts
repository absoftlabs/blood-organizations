// app/api/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { BloodRequest, BloodRequestStatus } from "@/types/admin";

export const runtime = "nodejs";

interface UpdateRequestBody {
    units?: number;
    donationDateTime?: string;
    hospitalAddress?: string;
    status?: BloodRequestStatus;
}

function badIdResponse() {
    return NextResponse.json(
        { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
        { status: 400 }
    );
}

export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> } // ✅ Next.js 16 expects Promise
) {
    try {
        const { id: rawId } = await context.params;
        const id = (rawId ?? "").trim();

        if (!ObjectId.isValid(id)) return badIdResponse();

        const body = (await req.json()) as UpdateRequestBody;

        const update: Partial<BloodRequest> = {};

        if (typeof body.units === "number" && body.units > 0) {
            update.units = body.units;
        }

        if (typeof body.donationDateTime === "string" && body.donationDateTime.trim() !== "") {
            const dt = new Date(body.donationDateTime);
            if (!Number.isNaN(dt.getTime())) {
                update.donationDateTime = dt;
            }
        }

        if (typeof body.hospitalAddress === "string") {
            update.hospitalAddress = body.hospitalAddress;
        }

        if (typeof body.status === "string" && body.status.trim() !== "") {
            update.status = body.status;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json(
                { success: false, message: "কোনো valid আপডেট ডাটা পাওয়া যায়নি।" },
                { status: 400 }
            );
        }

        update.updatedAt = new Date();

        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        const result = await col.updateOne(
            { _id: new ObjectId(id) },
            { $set: update }
        );

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
        console.error("PATCH /api/requests/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> } // ✅ Next.js 16 expects Promise
) {
    try {
        const { id: rawId } = await context.params;
        const id = (rawId ?? "").trim();

        if (!ObjectId.isValid(id)) return badIdResponse();

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
        console.error("DELETE /api/requests/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
