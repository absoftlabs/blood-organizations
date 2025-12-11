"use client";

import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import toast from "react-hot-toast";

interface RequestFormData {
    bloodGroup: string;

    patientName: string;
    patientAge?: number;
    patientGender?: "male" | "female" | "other";
    medicalReason?: string;
    hemoglobin?: number;

    donationDateTime: string;
    units: number;

    primaryPhone: string;
    alternatePhone?: string;
    hospitalAddress: string;

    requesterName: string;
    requesterPhone: string;
    relationWithPatient?: string;
}

export default function BloodRequestForm() {
    const [loading, setLoading] = useState(false);
    const [userPhone, setUserPhone] = useState<string>("");

    const [form, setForm] = useState<RequestFormData>({
        bloodGroup: "",
        patientName: "",
        medicalReason: "",
        hemoglobin: undefined,
        patientGender: undefined,
        patientAge: undefined,

        donationDateTime: "",
        units: 1,

        primaryPhone: "",
        alternatePhone: "",
        hospitalAddress: "",

        requesterName: "",
        requesterPhone: "",
        relationWithPatient: "",
    });

    // লগইন করা ইউজারের নাম + মোবাইল অটোফিল
    useEffect(() => {
        async function loadProfile() {
            try {
                const res = await fetch("/api/profile");
                if (!res.ok) return;

                const json = await res.json();
                const profile = json.data;

                if (profile?.mobile) {
                    setUserPhone(profile.mobile);
                    setForm((prev) => ({
                        ...prev,
                        requesterPhone: profile.mobile,
                    }));
                }
                if (profile?.name) {
                    setForm((prev) => ({
                        ...prev,
                        requesterName: profile.name,
                    }));
                }
            } catch {
                // নীরবে ignore
            }
        }

        loadProfile();
    }, []);

    const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
    ) => {
        const { name, value } = e.target;

        setForm((prev) => ({
            ...prev,
            [name]:
                name === "units" ||
                    name === "hemoglobin" ||
                    name === "patientAge"
                    ? value === "" ? undefined : Number(value)
                    : value,
        }));
    };

    const submitForm = async (e: FormEvent) => {
        e.preventDefault();

        if (!form.requesterPhone.trim()) {
            toast.error("আপনার ফোন নম্বর প্রয়োজন।");
            return;
        }

        if (!form.primaryPhone.trim()) {
            toast.error("রোগীর প্রাইমারী ফোন নম্বর প্রয়োজন।");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch("/api/requests", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(form),
            });

            const json = await res.json();

            if (!res.ok || !json.success) {
                toast.error(json.message ?? "রিকুয়েস্ট সাবমিট করা যায়নি।");
                setLoading(false);
                return;
            }

            toast.success("ব্লাড রিকুয়েস্ট সাবমিট হয়েছে!");

            setForm({
                bloodGroup: "",
                patientName: "",
                patientAge: undefined,
                patientGender: undefined,
                hemoglobin: undefined,
                medicalReason: "",
                donationDateTime: "",
                units: 1,
                primaryPhone: "",
                alternatePhone: "",
                hospitalAddress: "",
                requesterName: "",
                requesterPhone: userPhone || "",
                relationWithPatient: "",
            });
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা। পরে চেষ্টা করুন।");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-base-200 py-8">
            <div className="max-w-5xl mx-auto px-4">
                <h1 className="text-2xl font-bold text-green-700 mb-2 text-center md:text-left">
                    ব্লাড রিকুয়েস্ট ফরম
                </h1>
                <p className="text-sm text-base-content/70 mb-6 text-center md:text-left">
                    জরুরি ব্লাড রিকুয়েস্টের জন্য নিচের তথ্যগুলো সঠিকভাবে পূরণ করুন।
                </p>

                <div className="card bg-base-100 shadow-md">
                    <div className="card-body">
                        <form onSubmit={submitForm} className="space-y-8">

                            {/* রক্তের গ্রুপ + ডোনেশন ইনফো */}
                            <section>
                                <h2 className="font-semibold mb-3 border-l-4 border-primary pl-2">
                                    রক্তের তথ্য
                                </h2>
                                <div className="grid gap-4 md:grid-cols-3">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">রক্তের গ্রুপ</span>
                                        </label>
                                        <select
                                            name="bloodGroup"
                                            className="select select-bordered w-full"
                                            value={form.bloodGroup}
                                            onChange={handleChange}
                                            required
                                        >
                                            <option value="">সিলেক্ট করুন</option>
                                            {["A+", "A-", "B+", "B-", "O+", "O-", "AB+", "AB-"].map(
                                                (g) => (
                                                    <option key={g} value={g}>
                                                        {g}
                                                    </option>
                                                )
                                            )}
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">
                                                রক্ত দানের তারিখ ও সময়
                                            </span>
                                        </label>
                                        <input
                                            name="donationDateTime"
                                            type="datetime-local"
                                            className="input input-bordered w-full"
                                            value={form.donationDateTime}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">মোট ইউনিট (ব্যাগ)</span>
                                        </label>
                                        <input
                                            name="units"
                                            type="number"
                                            min={1}
                                            placeholder="উদাহরণ: ২ ব্যাগ"
                                            className="input input-bordered w-full"
                                            value={form.units}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* রোগীর তথ্য */}
                            <section>
                                <h2 className="font-semibold mb-3 border-l-4 border-primary pl-2">
                                    রোগীর তথ্য
                                </h2>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">রোগীর নাম</span>
                                        </label>
                                        <input
                                            name="patientName"
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={form.patientName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">রোগীর বয়স (ঐচ্ছিক)</span>
                                        </label>
                                        <input
                                            name="patientAge"
                                            type="number"
                                            className="input input-bordered w-full"
                                            value={form.patientAge ?? ""}
                                            onChange={handleChange}
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">রোগীর লিঙ্গ (ঐচ্ছিক)</span>
                                        </label>
                                        <select
                                            name="patientGender"
                                            className="select select-bordered w-full"
                                            value={form.patientGender ?? ""}
                                            onChange={handleChange}
                                        >
                                            <option value="">সিলেক্ট করুন</option>
                                            <option value="male">পুরুষ</option>
                                            <option value="female">মহিলা</option>
                                            <option value="other">অন্যান্য</option>
                                        </select>
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">হিমোগ্লোবিন (ঐচ্ছিক)</span>
                                        </label>
                                        <input
                                            name="hemoglobin"
                                            type="number"
                                            step="0.1"
                                            className="input input-bordered w-full"
                                            value={form.hemoglobin ?? ""}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-control mt-3">
                                    <label className="label">
                                        <span className="label-text">রোগীর সমস্যা</span>
                                    </label>
                                    <textarea
                                        name="medicalReason"
                                        className="textarea textarea-bordered w-full"
                                        rows={3}
                                        value={form.medicalReason ?? ""}
                                        onChange={handleChange}
                                        placeholder="রোগী কী সমস্যা বা রোগের জন্য রক্ত প্রয়োজন, সংক্ষেপে লিখুন (ঐচ্ছিক)"
                                    />
                                </div>
                            </section>

                            {/* যোগাযোগের তথ্য */}
                            <section>
                                <h2 className="font-semibold mb-3 border-l-4 border-primary pl-2">
                                    যোগাযোগের তথ্য
                                </h2>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">রোগীর ফোন নম্বর</span>
                                        </label>
                                        <input
                                            name="primaryPhone"
                                            type="tel"
                                            className="input input-bordered w-full"
                                            value={form.primaryPhone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">
                                                অন্য একটি নম্বর (ঐচ্ছিক)
                                            </span>
                                        </label>
                                        <input
                                            name="alternatePhone"
                                            type="tel"
                                            className="input input-bordered w-full"
                                            value={form.alternatePhone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div className="form-control mt-3">
                                    <label className="label">
                                        <span className="label-text">হাসপাতালের নাম ও ঠিকানা</span>
                                    </label>
                                    <textarea
                                        name="hospitalAddress"
                                        className="textarea textarea-bordered w-full"
                                        rows={2}
                                        value={form.hospitalAddress}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>
                            </section>

                            {/* রিকুয়েস্টকারীর তথ্য */}
                            <section>
                                <h2 className="font-semibold mb-3 border-l-4 border-primary pl-2">
                                    আপনার তথ্য
                                </h2>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">আপনার নাম</span>
                                        </label>
                                        <input
                                            name="requesterName"
                                            type="text"
                                            className="input input-bordered w-full"
                                            value={form.requesterName}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="form-control">
                                        <label className="label">
                                            <span className="label-text">আপনার ফোন নম্বর</span>
                                        </label>
                                        <input
                                            name="requesterPhone"
                                            type="tel"
                                            className="input input-bordered w-full"
                                            value={form.requesterPhone}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="form-control mt-3">
                                    <label className="label">
                                        <span className="label-text">
                                            রোগীর সাথে সম্পর্ক (ঐচ্ছিক)
                                        </span>
                                    </label>
                                    <input
                                        name="relationWithPatient"
                                        type="text"
                                        className="input input-bordered w-full"
                                        value={form.relationWithPatient ?? ""}
                                        onChange={handleChange}
                                        placeholder="যেমন: ভাই, বোন, বন্ধু, সহকর্মী ইত্যাদি"
                                    />
                                </div>
                            </section>

                            <div className="form-control mt-4">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="btn btn-primary w-full md:w-60"
                                >
                                    {loading ? "সাবমিট হচ্ছে..." : "ব্লাড রিকুয়েস্ট সাবমিট করুন"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </main>
    );
}
