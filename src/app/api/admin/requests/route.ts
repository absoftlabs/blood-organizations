// src/app/api/admin/requests/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { BloodRequest, AdminBloodRequest } from "@/types/admin";

export const runtime = "nodejs";

export async function GET() {
    try {
        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        const docs = await col.find({}).sort({ createdAt: -1 }).toArray();

        const requests: AdminBloodRequest[] = docs.map((r) => ({
            id: r._id!.toString(),
            bloodGroup: r.bloodGroup,

            patientName: r.patientName,
            medicalReason: r.medicalReason ?? undefined,

            donationDateTime: r.donationDateTime
                ? r.donationDateTime.toISOString()
                : undefined,
            hospitalAddress: r.hospitalAddress ?? undefined,

            primaryPhone: r.primaryPhone,
            requesterPhone: r.requesterPhone,

            units: r.units,
            status: r.status,

            createdAt: r.createdAt.toISOString(),
            updatedAt: r.updatedAt ? r.updatedAt.toISOString() : undefined,
        }));

        // ডিবাগের জন্য একবার কনসোলে দেখে নিন
        console.log("ADMIN REQUESTS:", requests);

        return NextResponse.json(
            { success: true, requests },
            { status: 200 }
        );
    } catch (err) {
        console.error("GET /api/admin/requests error:", err);
        return NextResponse.json(
            { success: false, message: "রিকুয়েস্ট লোড করতে সমস্যা হয়েছে।" },
            { status: 500 }
        );
    }
}
