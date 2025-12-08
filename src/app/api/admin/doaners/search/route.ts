// src/app/api/admin/doaners/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const bloodGroup = searchParams.get("bloodGroup");
        const query = searchParams.get("query") ?? "";

        if (!bloodGroup) {
            return NextResponse.json(
                { success: false, message: "ব্লাড গ্রুপ প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const col = db.collection<Doaner>("doaners");

        const filter: Record<string, unknown> = {
            bloodGroup,
            isApproved: true,
            isBanned: { $ne: true },
        };

        if (query.trim() !== "") {
            const regex = new RegExp(query.trim(), "i");
            filter.$or = [
                { name: regex },
                { mobile: regex },
                { email: regex },
            ];
        }

        const docs = await col
            .find(filter)
            .sort({ totalDonations: -1, createdAt: -1 })
            .limit(50)
            .toArray();

        const donors = docs.map((d) => ({
            _id: d._id?.toString() ?? "",
            name: d.name,
            email: d.email,
            mobile: d.mobile,
            bloodGroup: d.bloodGroup,
            totalDonations: d.totalDonations ?? 0,
            lastDonationDate: d.lastDonationDate
                ? d.lastDonationDate.toISOString()
                : null,
        }));

        return NextResponse.json(
            { success: true, data: donors },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/admin/doaners/search error:", error);
        return NextResponse.json(
            { success: false, message: "ডোনার লোড করতে সমস্যা হয়েছে।" },
            { status: 500 }
        );
    }
}
