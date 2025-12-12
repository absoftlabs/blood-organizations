export const dynamic = "force-dynamic";
export const revalidate = 0;

import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";
import { IconCalendar, IconDroplet, IconTrophy, IconUserPlus, IconUsers } from "@tabler/icons-react";

type LeaderItem = {
    id: string;
    name: string;
    mobile?: string;
    bloodGroup: string;
    totalDonations: number;
    profileImage: string;
    lastDonationDate?: Date | null;
    lastDonationPlace?: string;
};

// ---------- Small SVG icons (Tabler-ish) ----------

function StatCard(props: {
    title: string;
    value: number;
    subtitle: string;
    icon: React.ReactNode;
}) {
    const { title, value, subtitle, icon } = props;

    return (
        <div className="card bg-base-100 shadow-md hover:scale-105 transition-transform">
            <div className="card-body p-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <p className="text-xs text-base-content/60">{title}</p>
                        <p className="mt-2 text-3xl font-bold leading-none">{value}</p>
                        <p className="mt-2 text-xs text-base-content/60">{subtitle}</p>
                    </div>

                    <div className="rounded-xl bg-primary/15 p-3 text-primary">
                        {icon}
                    </div>
                </div>
            </div>
        </div>
    );
}

function getInitials(name: string): string {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return "D";
    const first = parts[0]?.[0] ?? "D";
    const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? "") : "";
    return (first + last).toUpperCase();
}

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
                    mobile: 1,
                    bloodGroup: 1,
                    totalDonations: 1,
                    profileImage: 1,
                    lastDonationDate: 1,
                    lastDonationPlace: 1,
                },
            }
        )
        .sort({ totalDonations: -1 })
        .limit(3)
        .toArray();


    const leaderboard: LeaderItem[] = leaderboardDocs.map((d) => ({
        id: d._id?.toString() ?? "",
        mobile: d.mobile,
        lastDonationDate: d.lastDonationDate,
        lastDonationPlace: d.lastDonationPlace,
        name: d.name,
        bloodGroup: d.bloodGroup,
        totalDonations: d.totalDonations ?? 0,
        profileImage: d.profileImage ?? "",
    }));

    return (
        <main className="min-h-screen bg-base-200 py-8">
            <div className="w-full px-4 space-y-6">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold">অ্যাডমিন ড্যাশবোর্ড</h1>
                        <p className="text-sm text-base-content/60 mt-1">
                            ডোনার ও ডোনেশন সংক্ষিপ্ত পরিসংখ্যান
                        </p>
                    </div>
                </div>

                {/* Top stats cards */}
                <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-4">
                    <StatCard
                        title="মোট ডোনার"
                        value={totalDonors}
                        subtitle="অনুমোদিত ডোনারের সংখ্যা"
                        icon={<IconUsers />}
                    />

                    <StatCard
                        title="এ মাসে নতুন ডোনার"
                        value={thisMonthDonors}
                        subtitle="চলতি মাসে অনুমোদিত নতুন ডোনার"
                        icon={<IconUserPlus />}
                    />

                    <StatCard
                        title="মোট ব্লাড ডোনেশন"
                        value={totalDonations}
                        subtitle="মোট নিবন্ধিত রক্তদান সংখ্যা"
                        icon={<IconDroplet />}
                    />

                    <StatCard
                        title="এ মাসে ব্লাড ডোনেশন"
                        value={thisMonthDonations}
                        subtitle="এই মাসে সর্বশেষ রক্তদান করা ডোনার সংখ্যা"
                        icon={<IconCalendar />}
                    />
                </div>

                {/* Leaderboard */}
                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <div className="flex items-center justify-between gap-3">
                            <h2 className="card-title">
                                <span className="inline-flex items-center gap-2">
                                    <IconTrophy size={45} className="text-warning bg-success rounded-full p-2" />
                                    ডোনার লিডারবোর্ড (Top 3)
                                </span>
                            </h2>
                        </div>

                        {leaderboard.length === 0 ? (
                            <p className="text-sm text-base-content/60 mt-2">
                                এখনও কোনো রক্তদানের তথ্য নেই।
                            </p>
                        ) : (
                            <div className="overflow-x-auto mt-3">
                                <table className="table table-zebra border border-neutral rounded-t-none">
                                    <thead className="bg-primary text-white">
                                        <tr>
                                            <th>র‍্যাঙ্ক</th>
                                            <th>ডোনার</th>
                                            <th>শেষ রক্তদানের স্থান ও তারিখ</th>
                                            <th>ব্লাড গ্রুপ</th>
                                            <th className="text-right">মোট রক্তদান</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {leaderboard.map((d, index) => {
                                            const rankLabel =
                                                index === 0 ? "১ম" : index === 1 ? "২য়" : "৩য়";

                                            const rankBadge =
                                                index === 0
                                                    ? "btn btn-warning btn-circle"
                                                    : index === 1
                                                        ? "btn btn-info btn-circle"
                                                        : "btn btn-success btn-circle";

                                            const hasImage =
                                                d.profileImage && d.profileImage.trim() !== "";

                                            return (
                                                <tr key={d.id}>
                                                    <td>
                                                        <span className={rankBadge}>{rankLabel}</span>
                                                    </td>

                                                    <td>
                                                        <div className="flex items-center gap-3">
                                                            <div className="avatar placeholder">
                                                                <div className="bg-base-200 text-base-content rounded-full w-10 h-10 overflow-hidden flex items-center justify-center">
                                                                    {hasImage ? (
                                                                        // eslint-disable-next-line @next/next/no-img-element
                                                                        <img src={d.profileImage} alt={d.name} />
                                                                    ) : (
                                                                        <span className="text-sm font-semibold">
                                                                            {getInitials(d.name)}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="flex flex-col">
                                                                <span className="font-semibold">{d.name}</span>
                                                                <span className="text-xs text-base-content/60">
                                                                    মোবাইল: {d.mobile}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td>
                                                        {d.lastDonationPlace ? (
                                                            <span>
                                                                <b>তারিখ:</b> {d.lastDonationDate ? new Date(d.lastDonationDate).toLocaleDateString() : "তারিখ নেই"} <br></br>
                                                                <b>স্থান:</b> {d.lastDonationPlace}
                                                            </span>
                                                        ) : (
                                                            <span>তথ্য নেই</span>
                                                        )}
                                                    </td>

                                                    <td>
                                                        <span className="btn btn-circle btn-primary">
                                                            {d.bloodGroup}
                                                        </span>
                                                    </td>

                                                    <td className="text-right font-semibold">
                                                        {d.totalDonations}
                                                    </td>
                                                </tr>
                                            );
                                        })}
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
