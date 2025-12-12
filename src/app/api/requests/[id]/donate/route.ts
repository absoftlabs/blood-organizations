// src/app/api/requests/[id]/donate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import type { BloodRequest } from "@/types/admin";

export const runtime = "nodejs";

export async function POST(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> } // ✅ Next.js 16 expects Promise
) {
    try {
        const { id: rawId } = await context.params;
        const requestId = (rawId ?? "").trim();

        if (!ObjectId.isValid(requestId)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");

        const reqOid = new ObjectId(requestId);
        const existing = await requestsCol.findOne({ _id: reqOid });

        if (!existing) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        // এই endpoint আপনি কীভাবে ব্যবহার করবেন সেটার উপর নির্ভর করে লজিক বদলাতে হবে।
        // আপাতত safe response:
        return NextResponse.json(
            { success: true, message: "OK" },
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
