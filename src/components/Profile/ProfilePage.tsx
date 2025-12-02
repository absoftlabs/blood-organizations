"use client";

import { useEffect, useState, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";

interface ProfileData {
    name: string;
    email: string;
    mobile: string;
    bloodGroup: string;
    address: string;
    lastDonationDate: string;
    lastDonationPlace: string;
    totalDonations: number;
    profileImage: string; // base64 বা ""
}

export default function ProfilePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [profile, setProfile] = useState<ProfileData>({
        name: "",
        email: "",
        mobile: "",
        bloodGroup: "",
        address: "",
        lastDonationDate: "",
        lastDonationPlace: "",
        totalDonations: 0,
        profileImage: "",
    });

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmNewPassword, setConfirmNewPassword] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await fetch("/api/profile");
                const json = await res.json();

                if (!res.ok) {
                    toast.error(json.message ?? "প্রোফাইল লোড করতে সমস্যা হয়েছে।");
                    setLoading(false);
                    return;
                }

                const data = json.data as ProfileData;
                setProfile({
                    ...data,
                    totalDonations: data.totalDonations ?? 0,
                });
            } catch (error) {
                console.error(error);
                toast.error("প্রোফাইল লোড করতে সমস্যা হয়েছে।");
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;

        if (name === "totalDonations") {
            const num = Number(value);
            setProfile((prev) => ({
                ...prev,
                totalDonations: Number.isNaN(num) ? 0 : num,
            }));
            return;
        }

        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            toast.error("শুধু ইমেজ ফাইল নির্বাচন করুন।");
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const result = typeof reader.result === "string" ? reader.result : "";
            setProfile((prev) => ({
                ...prev,
                profileImage: result,
            }));
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (newPassword || confirmNewPassword) {
            if (newPassword !== confirmNewPassword) {
                toast.error("নতুন পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।");
                return;
            }
        }

        setSaving(true);

        try {
            const payload = {
                name: profile.name,
                mobile: profile.mobile,
                bloodGroup: profile.bloodGroup,
                address: profile.address,
                lastDonationDate: profile.lastDonationDate,
                lastDonationPlace: profile.lastDonationPlace,
                totalDonations: profile.totalDonations,
                profileImage: profile.profileImage,
                currentPassword: currentPassword || undefined,
                newPassword: newPassword || undefined,
            };

            const res = await fetch("/api/profile", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(payload),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "প্রোফাইল আপডেট ব্যর্থ হয়েছে।");
                setSaving(false);
                return;
            }

            toast.success(json.message ?? "প্রোফাইল আপডেট হয়েছে।");

            setCurrentPassword("");
            setNewPassword("");
            setConfirmNewPassword("");
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা, পরে আবার চেষ্টা করুন।");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen flex items-center justify-center bg-base-200">
                <span className="loading loading-spinner loading-lg" />
            </main>
        );
    }

    const avatarSrc =
        profile.profileImage && profile.profileImage.trim() !== ""
            ? profile.profileImage
            : undefined;

    return (
        <main className="min-h-screen bg-base-200 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <h1 className="text-2xl font-bold mb-6 text-center md:text-start">প্রোফাইল সেটিংস</h1>

                <div className="grid gap-6 lg:grid-cols-3">
                    {/* Left: Avatar & summary */}
                    <div className="lg:col-span-1">
                        <div className="card bg-base-100 shadow-md">
                            <div className="card-body items-center text-center">
                                <div className="avatar">
                                    <div className="w-24 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={avatarSrc ?? "/avatar.png"}
                                            alt="Profile"
                                        />
                                    </div>
                                </div>

                                <h2 className="mt-4 text-lg font-semibold">{profile.name}</h2>
                                <p className="text-sm text-base-content/70">
                                    {profile.bloodGroup
                                        ? `ব্লাড গ্রুপ: ${profile.bloodGroup}`
                                        : "ব্লাড গ্রুপ নির্ধারিত নয়"}
                                </p>
                                <p className="text-sm text-base-content/70">
                                    মোট রক্তদান: {profile.totalDonations} বার
                                </p>

                                <div className="form-control w-full mt-4">
                                    <label className="label">
                                        <span className="label-text">প্রোফাইল ছবি পরিবর্তন</span>
                                    </label>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleImageChange}
                                        className="file-input file-input-bordered w-full"
                                    />
                                    <label className="label">
                                        <span className="label-text-alt text-xs text-base-content/60">
                                            ইমেজ সাইজ বেশি বড় না রাখাই ভালো।
                                        </span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Form */}
                    <div className="lg:col-span-2">
                        <div className="card bg-base-100 shadow-md">
                            <div className="card-body">
                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <div className="grid gap-4 md:grid-cols-2">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">পূর্ণ নাম</span>
                                            </label>
                                            <input
                                                name="name"
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={profile.name}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">ইমেইল</span>
                                            </label>
                                            <input
                                                name="email"
                                                type="email"
                                                className="input input-bordered w-full"
                                                value={profile.email}
                                                disabled
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">মোবাইল নম্বর</span>
                                            </label>
                                            <input
                                                name="mobile"
                                                type="tel"
                                                className="input input-bordered w-full"
                                                value={profile.mobile}
                                                onChange={handleInputChange}
                                                required
                                            />
                                        </div>

                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">ব্লাড গ্রুপ</span>
                                            </label>
                                            <select
                                                name="bloodGroup"
                                                className="select select-bordered w-full"
                                                value={profile.bloodGroup}
                                                onChange={handleInputChange}
                                                required
                                            >
                                                <option value="" disabled>
                                                    সিলেক্ট করুন
                                                </option>
                                                <option value="A+">A+</option>
                                                <option value="A-">A-</option>
                                                <option value="B+">B+</option>
                                                <option value="B-">B-</option>
                                                <option value="O+">O+</option>
                                                <option value="O-">O-</option>
                                                <option value="AB+">AB+</option>
                                                <option value="AB-">AB-</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">ঠিকানা</span>
                                        </label>
                                        <textarea
                                            name="address"
                                            className="textarea textarea-bordered w-full"
                                            rows={3}
                                            value={profile.address}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">সর্বশেষ রক্তদানের তারিখ</span>
                                            </label>
                                            <input
                                                name="lastDonationDate"
                                                type="date"
                                                className="input input-bordered w-full"
                                                value={profile.lastDonationDate}
                                                onChange={handleInputChange}
                                            />
                                        </div>

                                        <div className="form-control md:col-span-2">
                                            <label className="label">
                                                <span className="label-text">
                                                    সর্বশেষ রক্তদানের স্থান
                                                </span>
                                            </label>
                                            <input
                                                name="lastDonationPlace"
                                                type="text"
                                                className="input input-bordered w-full"
                                                value={profile.lastDonationPlace}
                                                onChange={handleInputChange}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-control max-w-xs">
                                        <label className="label">
                                            <span className="label-text">মোট কতবার রক্তদান করেছেন</span>
                                        </label>
                                        <input
                                            name="totalDonations"
                                            type="number"
                                            min={0}
                                            className="input input-bordered w-full"
                                            value={profile.totalDonations}
                                            onChange={handleInputChange}
                                        />
                                    </div>

                                    <div className="divider">পাসওয়ার্ড পরিবর্তন (অপশনাল)</div>

                                    <div className="grid gap-4 md:grid-cols-3">
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">বর্তমান পাসওয়ার্ড</span>
                                            </label>
                                            <input
                                                type="password"
                                                className="input input-bordered w-full"
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">নতুন পাসওয়ার্ড</span>
                                            </label>
                                            <input
                                                type="password"
                                                className="input input-bordered w-full"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                            />
                                        </div>
                                        <div className="form-control">
                                            <label className="label">
                                                <span className="label-text">
                                                    নতুন পাসওয়ার্ড কনফার্ম
                                                </span>
                                            </label>
                                            <input
                                                type="password"
                                                className="input input-bordered w-full"
                                                value={confirmNewPassword}
                                                onChange={(e) => setConfirmNewPassword(e.target.value)}
                                            />
                                        </div>
                                    </div>

                                    <div className="form-control mt-4">
                                        <button
                                            type="submit"
                                            className="btn btn-primary btn-wide"
                                            disabled={saving}
                                        >
                                            {saving ? "আপডেট হচ্ছে..." : "প্রোফাইল আপডেট করুন"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
