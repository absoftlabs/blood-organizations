"use client";

import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";

function RegisterPage() {
    const [loading, setLoading] = useState(false);

    const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        // 👉 ইখানেই form reference ধরে রাখো
        const form = e.currentTarget;

        setLoading(true);

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            const res = await fetch("/api/auth/register", {
                method: "POST",
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message || "রেজিস্ট্রেশন ব্যর্থ হয়েছে!");
                setLoading(false);
                return;
            }

            toast.success(json.message || "রেজিস্ট্রেশন সফল হয়েছে!");

            // ❌ e.currentTarget.reset()
            // ✅ এখন form.reset() ব্যবহার করো
            form.reset();

        } catch (err) {
            console.error(err);
            toast.error("সার্ভার সমস্যা! পরে আবার চেষ্টা করুন।");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center bg-base-200">
            <div className="w-full max-w-md px-4">
                <div className="card bg-base-100 shadow-xl">
                    <div className="card-body">
                        <h1 className="text-2xl font-bold text-center mb-2">
                            একটি একাউন্ট তৈরি করুন
                        </h1>
                        <p className="text-center text-sm text-base-content/70 mb-4">
                            ডোনার হতে বা এ্যাপে প্রবেশ করতে এখনই রেজিস্টার করুন।
                        </p>

                        <form onSubmit={handleRegister} className="space-y-4">
                            {/* Name */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">পূর্ণ নাম</span>
                                </label>
                                <input
                                    name="name"
                                    type="text"
                                    placeholder="মোঃ সেলিম রেজা"
                                    className="input input-bordered w-full"
                                    required
                                />
                            </div>

                            {/* Mobile */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">মোবাইল নম্বর</span>
                                </label>
                                <input
                                    name="mobile"
                                    type="tel"
                                    pattern="01[0-9]{9}"
                                    placeholder="০১XXXXXXXXX"
                                    className="input input-bordered w-full"
                                    required
                                />
                            </div>

                            {/* Blood Group */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">ব্লাড গ্রুপ</span>
                                </label>
                                <select
                                    name="bloodGroup"
                                    className="select select-bordered w-full"
                                    required
                                    defaultValue=""
                                >
                                    <option value="" disabled>
                                        ব্লাড গ্রুপ সিলেক্ট করুন
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

                            {/* Email */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">ইমেইল</span>
                                </label>
                                <input
                                    name="email"
                                    type="email"
                                    placeholder="you@example.com"
                                    className="input input-bordered w-full"
                                    required
                                />
                            </div>

                            {/* Password */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">পাসওয়ার্ড</span>
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    className="input input-bordered w-full"
                                    required
                                    minLength={6}
                                />
                            </div>

                            {/* Confirm Password */}
                            <div className="form-control">
                                <label className="label">
                                    <span className="label-text">পাসওয়ার্ড নিশ্চিত করুন</span>
                                </label>
                                <input
                                    name="confirmPassword"
                                    type="password"
                                    className="input input-bordered w-full"
                                    required
                                    minLength={6}
                                />
                            </div>

                            <button
                                type="submit"
                                className="btn btn-primary w-full mt-4"
                                disabled={loading}
                            >
                                {loading ? "লোড হচ্ছে..." : "রেজিস্টার"}
                            </button>
                        </form>

                        <div className="divider my-4">অথবা</div>

                        <p className="text-center text-sm">
                            ইতিমধ্যে একটি একাউন্ট আছে?{" "}
                            <Link href="/login" className="link link-primary font-medium">
                                এখানে লগইন করুন
                            </Link>
                        </p>
                    </div>
                </div>

                <p className="text-center text-xs mt-4 text-base-content/60">
                    © {new Date().getFullYear()} মানবতায় রক্তদান ব্লাড ব্যাংক, নবাবগঞ্জ,
                    দিনাজপুর। সকল অধিকার সংরক্ষিত।
                </p>
            </div>
        </main>
    );
}

export default RegisterPage;
