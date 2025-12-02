import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

interface UpdateDonerBody {
    isApproved?: boolean;
}

export async function PATCH(
    req: Request,
    { params }: { params: { id: string } }
) {
    try {
        const { id } = params;
        const body: UpdateDonerBody = await req.json();

        const db = await getDb();
        const doaners = db.collection<Doaner>("doaners");

        const filter = { _id: new ObjectId(id) };
        const update: Partial<Doaner> = {};

        if (typeof body.isApproved === "boolean") {
            update.isApproved = body.isApproved;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json(
                { success: false, message: "কোনো valid ডাটা পাঠানো হয়নি।" },
                { status: 400 }
            );
        }

        update.updatedAt = new Date();

        const result = await doaners.updateOne(filter, { $set: update });

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "ডোনার আপডেট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/admin/doaners/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
