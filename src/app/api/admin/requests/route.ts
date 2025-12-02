import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { BloodRequest } from "@/types/admin";

export const runtime = "nodejs";

export async function GET() {
    try {
        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");

        const docs = await requestsCol
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const requests = docs.map((r) => ({
            id: r._id?.toString() ?? "",
            patientName: r.patientName,
            bloodGroup: r.bloodGroup,
            units: r.units,
            location: r.location,
            contactNumber: r.contactNumber,
            status: r.status,
            createdAt: r.createdAt.toISOString(),
        }));

        return NextResponse.json(
            { success: true, requests },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/admin/requests error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
