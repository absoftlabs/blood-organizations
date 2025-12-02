"use client";

import Link from "next/link";
import React, { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

function LoginPage() {
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget;

        const formData = new FormData(form);
        const data = Object.fromEntries(formData.entries());

        try {
            setLoading(true);

            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message || "লগইন ব্যর্থ হয়েছে!");
                setLoading(false);
                return;
            }

            toast.success(json.message || "লগইন সফল হয়েছে!");
            form.reset();

            // কুকি সেট হওয়ার পর হোম পেজে পাঠাই
            router.push("/");
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা! কিছুক্ষণ পর আবার চেষ্টা করুন।");
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
                            লগইন করুন
                        </h1>
                        <p className="text-center text-sm text-base-content/70 mb-4">
                            ব্লাড ডোনার হিসেবে আপনার একাউন্টে প্রবেশ করুন।
                        </p>

                        <form onSubmit={handleLogin} className="space-y-4">
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
                                    <span className="label-text">পাসওয়ার্ড</span>
                                </label>
                                <input
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
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
                                {loading ? "লগইন হচ্ছে..." : "লগইন"}
                            </button>
                        </form>

                        <div className="divider my-4">অথবা</div>

                        <p className="text-center text-sm">
                            এখনো একাউন্ট নেই?{" "}
                            <Link href="/register" className="link link-primary font-medium">
                                এখানে রেজিস্টার করুন
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

export default LoginPage;
