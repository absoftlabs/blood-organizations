// src/app/(admin)/admin/requests/page.tsx
"use client";

import { useEffect, useState, ChangeEvent } from "react";
import toast from "react-hot-toast";
import { AdminBloodRequest, BloodRequestStatus } from "@/types/admin";

interface DoanerListItem {
    _id: string;
    name: string;
    email: string;
    mobile: string;
    bloodGroup: string;
    totalDonations?: number;
    lastDonationDate?: string | null;
}

export default function AdminRequestsPage() {
    const [loading, setLoading] = useState(true);
    const [requests, setRequests] = useState<AdminBloodRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<AdminBloodRequest | null>(null);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [donateModalOpen, setDonateModalOpen] = useState(false);

    const [editForm, setEditForm] = useState<{
        units: string;
        donationDateTime: string;
        hospitalAddress: string;
        status: BloodRequestStatus;
    }>({
        units: "",
        donationDateTime: "",
        hospitalAddress: "",
        status: "pending",
    });

    const [donorSearch, setDonorSearch] = useState("");
    const [donors, setDonors] = useState<DoanerListItem[]>([]);
    const [donorLoading, setDonorLoading] = useState(false);
    const [selectedDonorId, setSelectedDonorId] = useState<string>("");

    const fetchRequests = async () => {
        try {
            setLoading(true);
            const res = await fetch("/api/admin/requests");
            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message ?? "রিকুয়েস্ট লোড করতে ব্যর্থ।");
                setRequests([]);
                return;
            }

            const data = json.requests as AdminBloodRequest[];
            setRequests(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে চেষ্টা করুন।");
            setRequests([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    // ---------- Edit ----------
    const handleEditClick = (req: AdminBloodRequest) => {
        setSelectedRequest(req);
        setEditForm({
            units: String(req.units ?? ""),
            donationDateTime: req.donationDateTime
                ? req.donationDateTime.slice(0, 16)
                : "",
            hospitalAddress: req.hospitalAddress ?? "",
            status: req.status,
        });
        setEditModalOpen(true);
    };

    const handleEditFormChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;
        setEditForm((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const submitEdit = async () => {
        if (!selectedRequest) return;

        const unitsNumber = Number(editForm.units);
        if (!unitsNumber || unitsNumber <= 0) {
            toast.error("মোট ইউনিট সঠিকভাবে দিন।");
            return;
        }

        try {
            const res = await fetch(`/api/admin/requests/${selectedRequest.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    units: unitsNumber,
                    donationDateTime: editForm.donationDateTime || undefined,
                    hospitalAddress: editForm.hospitalAddress || undefined,
                    status: editForm.status,
                }),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message ?? "রিকুয়েস্ট আপডেট করতে ব্যর্থ।");
                return;
            }

            toast.success(json.message ?? "রিকুয়েস্ট আপডেট হয়েছে।");
            setEditModalOpen(false);
            setSelectedRequest(null);
            await fetchRequests();
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে চেষ্টা করুন।");
        }
    };

    // ---------- Delete ----------
    const handleDelete = async (req: AdminBloodRequest) => {
        const confirmDelete = window.confirm(
            `আপনি কি নিশ্চিত যে, "${req.patientName}" এর রিকুয়েস্ট ডিলিট করতে চান?`
        );
        if (!confirmDelete) return;

        try {
            const res = await fetch(`/api/admin/requests/${req.id}`, {
                method: "DELETE",
            });
            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message ?? "রিকুয়েস্ট ডিলিট করতে ব্যর্থ।");
                return;
            }

            toast.success(json.message ?? "রিকুয়েস্ট ডিলিট হয়েছে।");
            setRequests((prev) => prev.filter((r) => r.id !== req.id));
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে চেষ্টা করুন।");
        }
    };

    // ---------- Donate ----------
    const handleDonateClick = (req: AdminBloodRequest) => {
        setSelectedRequest(req);
        setDonateModalOpen(true);
        setDonorSearch("");
        setSelectedDonorId("");
        loadDonors(req.bloodGroup, "");
    };

    const loadDonors = async (bloodGroup: string, query: string) => {
        try {
            setDonorLoading(true);
            const params = new URLSearchParams();
            params.set("bloodGroup", bloodGroup);
            if (query.trim() !== "") {
                params.set("query", query.trim());
            }

            const res = await fetch(`/api/admin/doaners/search?${params.toString()}`);
            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message ?? "ডোনার লোড করতে ব্যর্থ।");
                setDonors([]);
                return;
            }

            const data = json.data as DoanerListItem[];
            setDonors(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error(error);
            toast.error("ডোনার লোড করতে সমস্যা হয়েছে।");
            setDonors([]);
        } finally {
            setDonorLoading(false);
        }
    };

    const handleDonorSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setDonorSearch(value);
        if (selectedRequest) {
            loadDonors(selectedRequest.bloodGroup, value);
        }
    };

    const handleCompleteDonation = async () => {
        if (!selectedRequest) return;
        if (!selectedDonorId) {
            toast.error("একজন ডোনার সিলেক্ট করুন।");
            return;
        }

        try {
            const res = await fetch(
                `/api/admin/requests/${selectedRequest.id}/donate`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ doanerId: selectedDonorId }),
                }
            );

            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message ?? "ডোনেশন কমপ্লিট করতে ব্যর্থ।");
                return;
            }

            toast.success(json.message ?? "ডোনেশন সফলভাবে সম্পন্ন হয়েছে।");
            setDonateModalOpen(false);
            setSelectedRequest(null);
            setSelectedDonorId("");
            await fetchRequests();
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে চেষ্টা করুন।");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[50vh]">
                <span className="loading loading-spinner loading-lg" />
            </div>
        );
    }

    return (
        <div>
            <h1 className="text-xl font-bold mb-4">ব্লাড রিকুয়েস্ট লিস্ট</h1>

            {/* Main table */}
            <div className="overflow-x-auto bg-base-100 rounded-box shadow">
                <table className="table table-zebra table-sm md:table-md">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>রক্তের গ্রুপ</th>
                            <th>রোগীর নাম</th>
                            <th>রোগীর সমস্যা</th>
                            <th>রক্ত দানের তারিখ ও সময়</th>
                            <th>রক্তদানের স্থান</th>
                            <th>রোগীর ফোন নম্বর</th>
                            <th>রিকুয়েস্টকারীর ফোন</th>
                            <th>স্ট্যাটাস</th>
                            <th>একশন</th>
                        </tr>
                    </thead>
                    <tbody>
                        {requests.length === 0 && (
                            <tr>
                                <td colSpan={10} className="text-center py-4">
                                    কোনো রিকুয়েস্ট পাওয়া যায়নি।
                                </td>
                            </tr>
                        )}

                        {requests.map((req, index) => (
                            <tr key={req.id}>
                                <td>{index + 1}</td>
                                <td>{req.bloodGroup}</td>
                                <td>{req.patientName}</td>
                                <td className="max-w-xs">
                                    {req.medicalReason ?? "-"}
                                </td>
                                <td>
                                    {req.donationDateTime
                                        ? new Date(req.donationDateTime).toLocaleString("bn-BD", {
                                            dateStyle: "medium",
                                            timeStyle: "short",
                                        })
                                        : "-"}
                                </td>
                                <td className="max-w-xs">
                                    {req.hospitalAddress ?? "-"}
                                </td>
                                <td>{req.primaryPhone}</td>
                                <td>{req.requesterPhone}</td>
                                <td>
                                    <span className="badge badge-sm">
                                        {req.status === "pending"
                                            ? "Pending"
                                            : req.status === "approved"
                                                ? "Approved"
                                                : req.status === "rejected"
                                                    ? "Rejected"
                                                    : "Completed"}
                                    </span>
                                </td>
                                <td>
                                    <div className="flex flex-wrap gap-1">
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-outline"
                                            onClick={() => handleEditClick(req)}
                                        >
                                            এডিট
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-error btn-outline"
                                            onClick={() => handleDelete(req)}
                                        >
                                            ডিলিট
                                        </button>
                                        <button
                                            type="button"
                                            className="btn btn-xs btn-success"
                                            onClick={() => handleDonateClick(req)}
                                        >
                                            ডোনেট
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Edit Modal */}
            {editModalOpen && selectedRequest && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-xl">
                        <h3 className="font-bold text-lg mb-4">
                            রিকুয়েস্ট আপডেট করুন ({selectedRequest.patientName})
                        </h3>

                        <div className="space-y-3">
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">মোট ইউনিট (ব্যাগ)</span>
                                </label>
                                <input
                                    name="units"
                                    type="number"
                                    min={1}
                                    className="input input-bordered w-full"
                                    value={editForm.units}
                                    onChange={handleEditFormChange}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">রক্ত দানের তারিখ ও সময়</span>
                                </label>
                                <input
                                    name="donationDateTime"
                                    type="datetime-local"
                                    className="input input-bordered w-full"
                                    value={editForm.donationDateTime}
                                    onChange={handleEditFormChange}
                                />
                            </div>

                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">হাসপাতাল / ঠিকানা</span>
                                </label>
                                <textarea
                                    name="hospitalAddress"
                                    className="textarea textarea-bordered w-full"
                                    rows={2}
                                    value={editForm.hospitalAddress}
                                    onChange={handleEditFormChange}
                                />
                            </div>

                            <div className="form-control max-w-xs">
                                <label className="label">
                                    <span className="label-text">স্ট্যাটাস</span>
                                </label>
                                <select
                                    name="status"
                                    className="select select-bordered w-full"
                                    value={editForm.status}
                                    onChange={handleEditFormChange}
                                >
                                    <option value="pending">Pending</option>
                                    <option value="approved">Approved</option>
                                    <option value="rejected">Rejected</option>
                                    <option value="completed">Completed</option>
                                </select>
                            </div>
                        </div>

                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setEditModalOpen(false);
                                    setSelectedRequest(null);
                                }}
                            >
                                বন্ধ করুন
                            </button>
                            <button
                                type="button"
                                className="btn btn-primary"
                                onClick={submitEdit}
                            >
                                আপডেট
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            setEditModalOpen(false);
                            setSelectedRequest(null);
                        }}
                    />
                </div>
            )}

            {/* Donate Modal */}
            {donateModalOpen && selectedRequest && (
                <div className="modal modal-open">
                    <div className="modal-box max-w-3xl">
                        <h3 className="font-bold text-lg mb-2">
                            ডোনার সিলেক্ট করুন ({selectedRequest.bloodGroup})
                        </h3>
                        <p className="text-sm text-base-content/70 mb-4">
                            রোগী: {selectedRequest.patientName} | হাসপাতাল:{" "}
                            {selectedRequest.hospitalAddress ?? "-"}
                        </p>

                        <div className="form-control mb-3">
                            <input
                                type="text"
                                className="input input-bordered"
                                placeholder="ডোনারের নাম / মোবাইল সার্চ করুন"
                                value={donorSearch}
                                onChange={handleDonorSearchChange}
                            />
                        </div>

                        <div className="overflow-x-auto max-h-72 bg-base-100 rounded-lg border">
                            {donorLoading ? (
                                <div className="flex justify-center items-center py-6">
                                    <span className="loading loading-spinner" />
                                </div>
                            ) : donors.length === 0 ? (
                                <div className="p-4 text-center text-sm">
                                    এই গ্রুপের কোনো ডোনার পাওয়া যায়নি।
                                </div>
                            ) : (
                                <table className="table table-sm">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>নাম</th>
                                            <th>মোবাইল</th>
                                            <th>মোট রক্তদান</th>
                                            <th>সর্বশেষ রক্তদান</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {donors.map((d) => (
                                            <tr key={d._id}>
                                                <td>
                                                    <input
                                                        type="radio"
                                                        name="selectedDonor"
                                                        className="radio radio-sm"
                                                        checked={selectedDonorId === d._id}
                                                        onChange={() => setSelectedDonorId(d._id)}
                                                    />
                                                </td>
                                                <td>{d.name}</td>
                                                <td>{d.mobile}</td>
                                                <td>{d.totalDonations ?? 0}</td>
                                                <td>
                                                    {d.lastDonationDate
                                                        ? new Date(d.lastDonationDate).toLocaleDateString(
                                                            "bn-BD"
                                                        )
                                                        : "-"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div className="modal-action">
                            <button
                                type="button"
                                className="btn btn-ghost"
                                onClick={() => {
                                    setDonateModalOpen(false);
                                    setSelectedRequest(null);
                                }}
                            >
                                বন্ধ করুন
                            </button>
                            <button
                                type="button"
                                className="btn btn-success"
                                onClick={handleCompleteDonation}
                                disabled={!selectedDonorId}
                            >
                                ডোনেশন কমপ্লিট করুন
                            </button>
                        </div>
                    </div>
                    <div
                        className="modal-backdrop"
                        onClick={() => {
                            setDonateModalOpen(false);
                            setSelectedRequest(null);
                        }}
                    />
                </div>
            )}
        </div>
    );
}
