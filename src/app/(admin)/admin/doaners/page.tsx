"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface DonorRow {
    id: string;
    name: string;
    email: string;
    mobile: string;
    bloodGroup: string;
    isApproved: boolean;
    isBanned?: boolean;
    totalDonations: number;
    createdAt: string;
}

export default function AdminDonorListPage() {
    const [donors, setDonors] = useState<DonorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionEmail, setActionEmail] = useState<string | null>(null);

    const fetchDonors = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/doaners");
            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "ডোনার লোড করতে সমস্যা হয়েছে।");
                setLoading(false);
                return;
            }

            setDonors(json.donors as DonorRow[]);
        } catch (error) {
            console.error(error);
            toast.error("ডোনার লোড করতে সমস্যা হয়েছে।");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDonors();
    }, []);

    const updateDonor = async (
        email: string,
        payload: Record<string, unknown>
    ) => {
        try {
            setActionEmail(email);

            const res = await fetch("/api/admin/doaners/update", {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, ...payload }),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "ডোনার আপডেট ব্যর্থ হয়েছে।");
                setActionEmail(null);
                return;
            }

            toast.success(json.message ?? "ডোনার আপডেট সফল হয়েছে।");
            await fetchDonors();
            setActionEmail(null);
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে আবার চেষ্টা করুন।");
            setActionEmail(null);
        }
    };

    const handleApprove = (email: string) => {
        updateDonor(email, { isApproved: true, isBanned: false });
    };

    const handleBan = (email: string) => {
        updateDonor(email, { isBanned: true });
    };

    const handleUnban = (email: string) => {
        updateDonor(email, { isBanned: false });
    };

    return (
        <main className="min-h-screen">
            <h1 className="text-2xl font-bold mb-6">ডোনার লিস্ট</h1>

            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : donors.length === 0 ? (
                        <p className="text-sm text-base-content/60">
                            এখনো কোনো ডোনার রেজিস্ট্রেশন নেই।
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>নাম</th>
                                        <th>ইমেইল</th>
                                        <th>মোবাইল</th>
                                        <th>ব্লাড গ্রুপ</th>
                                        <th>স্ট্যাটাস</th>
                                        <th>মোট রক্তদান</th>
                                        <th>অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {donors.map((d, index) => {
                                        const isPending = !d.isApproved;
                                        const isBanned = d.isBanned === true;
                                        const busy = actionEmail === d.email;

                                        return (
                                            <tr key={d.id}>
                                                <td>{index + 1}</td>
                                                <td>{d.name}</td>
                                                <td>{d.email}</td>
                                                <td>{d.mobile}</td>
                                                <td>{d.bloodGroup}</td>
                                                <td>
                                                    {isBanned ? (
                                                        <span className="badge badge-error">Banned</span>
                                                    ) : isPending ? (
                                                        <span className="badge badge-warning">Pending</span>
                                                    ) : (
                                                        <span className="badge badge-success">
                                                            Approved
                                                        </span>
                                                    )}
                                                </td>
                                                <td>{d.totalDonations}</td>
                                                <td className="space-x-2">
                                                    {isPending && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() => handleApprove(d.email)}
                                                            disabled={busy}
                                                        >
                                                            {busy ? "..." : "Approve"}
                                                        </button>
                                                    )}
                                                    {!isPending && !isBanned && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-error"
                                                            onClick={() => handleBan(d.email)}
                                                            disabled={busy}
                                                        >
                                                            {busy ? "..." : "Ban"}
                                                        </button>
                                                    )}
                                                    {isBanned && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-success"
                                                            onClick={() => handleUnban(d.email)}
                                                            disabled={busy}
                                                        >
                                                            {busy ? "..." : "Unban"}
                                                        </button>
                                                    )}
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
        </main>
    );
}
