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
    totalDonations: number;
    createdAt: string;
}

export default function AdminDonorListPage() {
    const [donors, setDonors] = useState<DonorRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [approvingId, setApprovingId] = useState<string | null>(null);

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

    const handleApprove = async (id: string) => {
        try {
            setApprovingId(id);
            const res = await fetch(`/api/admin/doaners/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ isApproved: true }),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "ডোনার অনুমোদন ব্যর্থ হয়েছে।");
                setApprovingId(null);
                return;
            }

            toast.success("ডোনার অনুমোদন সফল হয়েছে।");
            await fetchDonors();
            setApprovingId(null);
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে আবার চেষ্টা করুন।");
            setApprovingId(null);
        }
    };

    return (
        <main className="min-h-screen bg-base-200 py-8">
            <div className="max-w-6xl mx-auto px-4">
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
                                        {donors.map((d, index) => (
                                            <tr key={d.id}>
                                                <td>{index + 1}</td>
                                                <td>{d.name}</td>
                                                <td>{d.email}</td>
                                                <td>{d.mobile}</td>
                                                <td>{d.bloodGroup}</td>
                                                <td>
                                                    {d.isApproved ? (
                                                        <span className="badge badge-success">Approved</span>
                                                    ) : (
                                                        <span className="badge badge-warning">Pending</span>
                                                    )}
                                                </td>
                                                <td>{d.totalDonations}</td>
                                                <td>
                                                    {!d.isApproved && (
                                                        <button
                                                            type="button"
                                                            className="btn btn-xs btn-primary"
                                                            onClick={() => handleApprove(d.id)}
                                                            disabled={approvingId === d.id}
                                                        >
                                                            {approvingId === d.id
                                                                ? "Approving..."
                                                                : "Approve"}
                                                        </button>
                                                    )}
                                                </td>
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
