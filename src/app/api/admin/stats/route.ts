import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

export async function GET() {
    try {
        const db = await getDb();
        const doaners = db.collection<Doaner>("doaners");

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

        // মোট Approved donor
        const totalDonors = await doaners.countDocuments({ isApproved: true });

        // এ মাসে নতুন Approved donor (createdAt এই মাসে)
        const thisMonthDonors = await doaners.countDocuments({
            isApproved: true,
            createdAt: { $gte: startOfMonth, $lt: endOfMonth },
        });

        // মোট মোট Blood donation (সব doaner-এর totalDonations যোগ)
        const totalDonationsAgg = await doaners
            .aggregate<{ total: number }>([
                { $match: { isApproved: true } },
                {
                    $group: {
                        _id: null,
                        total: { $sum: { $ifNull: ["$totalDonations", 0] } },
                    },
                },
            ])
            .toArray();

        const totalDonations =
            totalDonationsAgg.length > 0 ? totalDonationsAgg[0].total : 0;

        // এ মাসে blood donation: এখানে সহজভাবে ধরা হয়েছে
        // যাদের lastDonationDate এই মাসে, তাদের সংখ্যা = এ মাসের donation count
        const thisMonthDonations = await doaners.countDocuments({
            isApproved: true,
            lastDonationDate: { $gte: startOfMonth, $lt: endOfMonth },
        });

        // Leaderboard: top 3 by totalDonations
        const leaderboard = await doaners
            .find(
                { isApproved: true, totalDonations: { $gt: 0 } },
                {
                    projection: {
                        name: 1,
                        bloodGroup: 1,
                        totalDonations: 1,
                        profileImage: 1,
                    },
                }
            )
            .sort({ totalDonations: -1 })
            .limit(3)
            .toArray();

        const leaderboardData = leaderboard.map((d) => ({
            id: d._id?.toString() ?? "",
            name: d.name,
            bloodGroup: d.bloodGroup,
            totalDonations: d.totalDonations ?? 0,
            profileImage: d.profileImage ?? "",
        }));

        return NextResponse.json(
            {
                success: true,
                stats: {
                    totalDonors,
                    thisMonthDonors,
                    totalDonations,
                    thisMonthDonations,
                },
                leaderboard: leaderboardData,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/admin/stats error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
