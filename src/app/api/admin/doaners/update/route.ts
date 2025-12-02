import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

interface UpdateDonerBody {
    email?: string;
    isApproved?: boolean;
    isBanned?: boolean;
}

export async function PATCH(req: Request) {
    try {
        const body: UpdateDonerBody = await req.json();

        if (!body.email) {
            return NextResponse.json(
                { success: false, message: "ইমেইল প্রয়োজন।" },
                { status: 400 }
            );
        }

        const rawEmail = body.email;
        const normalizedEmail = rawEmail.toLowerCase().trim();

        const db = await getDb();
        const doaners = db.collection<Doaner>("doaners");

        const update: Partial<Doaner> = {};

        if (typeof body.isApproved === "boolean") {
            update.isApproved = body.isApproved;
        }

        if (typeof body.isBanned === "boolean") {
            update.isBanned = body.isBanned;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json(
                { success: false, message: "কোনো valid ডাটা পাঠানো হয়নি।" },
                { status: 400 }
            );
        }

        update.updatedAt = new Date();

        // ⚠️ দুইভাবে match করবো: normalized এবং raw – যাতে case issue না থাকে
        const result = await doaners.updateOne(
            {
                $or: [
                    { email: normalizedEmail },
                    { email: rawEmail },
                ],
            },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "ডোনার পাওয়া যায় নি" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "ডোনার আপডেট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/admin/doaners/update error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
