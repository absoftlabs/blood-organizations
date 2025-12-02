"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type BloodRequestStatus = "pending" | "accepted" | "completed" | "cancelled";

interface RequestRow {
    id: string;
    patientName: string;
    bloodGroup: string;
    units: number;
    location: string;
    contactNumber: string;
    status: BloodRequestStatus;
    createdAt: string;
}

export default function AdminRequestsPage() {
    const [requests, setRequests] = useState<RequestRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/requests");
            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "রিকোয়েস্ট লোড করতে সমস্যা হয়েছে।");
                setLoading(false);
                return;
            }

            setRequests(json.requests as RequestRow[]);
        } catch (error) {
            console.error(error);
            toast.error("রিকোয়েস্ট লোড করতে সমস্যা হয়েছে।");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const updateStatus = async (id: string, status: BloodRequestStatus) => {
        try {
            setActionId(id);
            const res = await fetch(`/api/admin/requests/${id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ status }),
            });
            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।");
                setActionId(null);
                return;
            }

            toast.success("স্ট্যাটাস আপডেট হয়েছে।");
            await fetchRequests();
            setActionId(null);
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে আবার চেষ্টা করুন।");
            setActionId(null);
        }
    };

    const statusBadge = (status: BloodRequestStatus) => {
        if (status === "pending") return <span className="badge badge-warning">Pending</span>;
        if (status === "accepted") return <span className="badge badge-info">Accepted</span>;
        if (status === "completed") return <span className="badge badge-success">Completed</span>;
        if (status === "cancelled") return <span className="badge badge-error">Cancelled</span>;
        return status;
    };

    return (
        <main className="min-h-screen">
            <h1 className="text-2xl font-bold mb-6">ব্লাড রিকোয়েস্ট ম্যানেজমেন্ট</h1>

            <div className="card bg-base-100 shadow-md">
                <div className="card-body">
                    {loading ? (
                        <div className="flex justify-center py-10">
                            <span className="loading loading-spinner loading-lg"></span>
                        </div>
                    ) : requests.length === 0 ? (
                        <p className="text-sm text-base-content/60">
                            এখনো কোনো রিকোয়েস্ট নেই।
                        </p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="table table-zebra">
                                <thead>
                                    <tr>
                                        <th>#</th>
                                        <th>পেশেন্টের নাম</th>
                                        <th>ব্লাড গ্রুপ</th>
                                        <th>ইউনিট</th>
                                        <th>লোকেশন</th>
                                        <th>কন্টাক্ট</th>
                                        <th>স্ট্যাটাস</th>
                                        <th>অ্যাকশন</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {requests.map((r, index) => (
                                        <tr key={r.id}>
                                            <td>{index + 1}</td>
                                            <td>{r.patientName}</td>
                                            <td>{r.bloodGroup}</td>
                                            <td>{r.units}</td>
                                            <td>{r.location}</td>
                                            <td>{r.contactNumber}</td>
                                            <td>{statusBadge(r.status)}</td>
                                            <td className="space-x-2">
                                                <button
                                                    className="btn btn-xs btn-info"
                                                    disabled={actionId === r.id}
                                                    onClick={() => updateStatus(r.id, "accepted")}
                                                >
                                                    Accept
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-success"
                                                    disabled={actionId === r.id}
                                                    onClick={() => updateStatus(r.id, "completed")}
                                                >
                                                    Complete
                                                </button>
                                                <button
                                                    className="btn btn-xs btn-error"
                                                    disabled={actionId === r.id}
                                                    onClick={() => updateStatus(r.id, "cancelled")}
                                                >
                                                    Cancel
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
