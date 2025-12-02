import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

export async function GET() {
    try {
        const db = await getDb();
        const doaners = db.collection<Doaner>("doaners");

        const docs = await doaners
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const donors = docs.map((d) => ({
            id: d._id?.toString() ?? "",
            name: d.name,
            email: d.email,                // ⬅ এটা অবশ্যই থাকবে
            mobile: d.mobile,
            bloodGroup: d.bloodGroup,
            isApproved: d.isApproved,
            isBanned: d.isBanned,
            totalDonations: d.totalDonations ?? 0,
            createdAt: d.createdAt.toISOString(),
        }));



        return NextResponse.json(
            { success: true, donors },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/admin/doaners error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
