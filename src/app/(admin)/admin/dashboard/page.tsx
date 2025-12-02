export const dynamic = "force-dynamic";
export const revalidate = 0; 
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

// Server component
export default async function AdminDashboardPage() {
    const db = await getDb();
    const doaners = db.collection<Doaner>("doaners");

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

    const totalDonors = await doaners.countDocuments({ isApproved: true });

    const thisMonthDonors = await doaners.countDocuments({
        isApproved: true,
        createdAt: { $gte: startOfMonth, $lt: endOfMonth },
    });

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

    const thisMonthDonations = await doaners.countDocuments({
        isApproved: true,
        lastDonationDate: { $gte: startOfMonth, $lt: endOfMonth },
    });

    const leaderboardDocs = await doaners
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

    const leaderboard = leaderboardDocs.map((d) => ({
        id: d._id?.toString() ?? "",
        name: d.name,
        bloodGroup: d.bloodGroup,
        totalDonations: d.totalDonations ?? 0,
        profileImage: d.profileImage ?? "",
    }));

    return (
        <main className="min-h-screen bg-base-200 py-8">
            <div className="max-w-6xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-6">অ্যাডমিন ড্যাশবোর্ড</h1>

                {/* Top stats cards */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title text-sm">মোট ডোনার</h2>
                            <p className="text-3xl font-bold">{totalDonors}</p>
                            <p className="text-xs text-base-content/60">
                                অনুমোদিত ডোনারের সংখ্যা
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title text-sm">এ মাসে নতুন ডোনার</h2>
                            <p className="text-3xl font-bold">{thisMonthDonors}</p>
                            <p className="text-xs text-base-content/60">
                                চলতি মাসে অনুমোদিত নতুন ডোনার
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title text-sm">মোট ব্লাড ডোনেশন</h2>
                            <p className="text-3xl font-bold">{totalDonations}</p>
                            <p className="text-xs text-base-content/60">
                                মোট নিবন্ধিত রক্তদান সংখ্যা
                            </p>
                        </div>
                    </div>

                    <div className="card bg-base-100 shadow-md">
                        <div className="card-body">
                            <h2 className="card-title text-sm">এ মাসে ব্লাড ডোনেশন</h2>
                            <p className="text-3xl font-bold">{thisMonthDonations}</p>
                            <p className="text-xs text-base-content/60">
                                এই মাসে সর্বশেষ রক্তদান করা ডোনার সংখ্যা
                            </p>
                        </div>
                    </div>
                </div>

                {/* Leaderboard */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <h2 className="card-title mb-4">ডোনার লিডারবোর্ড (Top 3)</h2>

                        {leaderboard.length === 0 ? (
                            <p className="text-sm text-base-content/60">
                                এখনও কোনো রক্তদানের তথ্য নেই।
                            </p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>পজিশন</th>
                                            <th>নাম</th>
                                            <th>ব্লাড গ্রুপ</th>
                                            <th>মোট রক্তদান</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((d, index) => (
                                            <tr key={d.id}>
                                                <td>
                                                    {index + 1 === 1 && (
                                                        <span className="badge badge-warning">১ম</span>
                                                    )}
                                                    {index + 1 === 2 && (
                                                        <span className="badge badge-info">২য়</span>
                                                    )}
                                                    {index + 1 === 3 && (
                                                        <span className="badge badge-success">৩য়</span>
                                                    )}
                                                </td>
                                                <td>{d.name}</td>
                                                <td>{d.bloodGroup}</td>
                                                <td>{d.totalDonations}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
}
