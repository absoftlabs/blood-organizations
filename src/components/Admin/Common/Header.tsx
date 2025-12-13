"use client";

import React, { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import avatar from "../../../../public/avatar.png";
import Link from "next/link";
import Drawer from "@/components/Admin/Common/Drawer";

interface HeaderProfileData {
    profileImage?: string;
    isAdmin?: boolean;
    name?: string;
    bloodGroup?: string;
}

type BloodRequestStatus = "pending" | "approved" | "rejected" | "completed";

interface HeaderNotification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;

    // 🔽 ব্লাড রিকুয়েস্টের জন্য অতিরিক্ত ফিল্ডগুলো
    bloodGroup?: string;
    units?: number;
    hemoglobin?: number | null;
    donationDateTime?: string;
    hospitalAddress?: string;
    requesterName?: string;
    requesterPhone?: string;
    medicalReason?: string | null;
    status?: BloodRequestStatus;
}

function Header() {
    const router = useRouter();
    const pathname = usePathname();

    const [loggingOut, setLoggingOut] = useState(false);
    const [profileImage, setProfileImage] = useState<string>("");
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [loadingUser, setLoadingUser] = useState(true);
    const [userName, setUserName] = useState<string>("");
    const [bloodGroup, setBloodGroup] = useState<string>("");

    // 🔔 Notifications
    const [notifications, setNotifications] = useState<HeaderNotification[]>([]);
    const [loadingNotifications, setLoadingNotifications] = useState(false);

    useEffect(() => {
        const fetchProfileAvatar = async () => {
            try {
                setLoadingUser(true);

                const res = await fetch("/api/profile", {
                    cache: "no-store",
                });

                if (!res.ok) {
                    setIsLoggedIn(false);
                    setIsAdmin(false);
                    setProfileImage("");
                    setUserName("");
                    setBloodGroup("");
                    setLoadingUser(false);
                    return;
                }

                const json = await res.json();
                const data = json.data as HeaderProfileData;

                setIsLoggedIn(true);
                setIsAdmin(Boolean(data?.isAdmin));

                setProfileImage(data?.profileImage ?? "");
                setUserName(data?.name ?? "");
                setBloodGroup(data?.bloodGroup ?? "");
            } catch (error) {
                console.error(error);
                setIsLoggedIn(false);
                setIsAdmin(false);
                setProfileImage("");
                setUserName("");
                setBloodGroup("");
            } finally {
                setLoadingUser(false);
            }
        };

        const fetchNotifications = async () => {
            try {
                setLoadingNotifications(true);
                const res = await fetch("/api/notifications", {
                    cache: "no-store",
                });

                if (!res.ok) {
                    return;
                }

                const json = await res.json();
                if (!json.success) return;

                const data = json.data as HeaderNotification[];
                setNotifications(Array.isArray(data) ? data : []);
            } catch (error) {
                console.error(error);
            } finally {
                setLoadingNotifications(false);
            }
        };

        // আগে প্রোফাইল, পরে নোটিফিকেশন
        fetchProfileAvatar().then(() => {
            fetchNotifications().catch(() => undefined);
        });
    }, [pathname]);

    const handleLogout = async () => {
        try {
            setLoggingOut(true);

            const res = await fetch("/api/auth/logout", {
                method: "POST",
            });

            const json = await res.json();

            if (!res.ok) {
                toast.error(json.message ?? "লগআউট করতে সমস্যা হয়েছে।");
                setLoggingOut(false);
                return;
            }

            toast.success(json.message ?? "সফলভাবে লগআউট হয়েছে।");

            setIsLoggedIn(false);
            setIsAdmin(false);
            setProfileImage("");
            setUserName("");
            setBloodGroup("");

            router.push("/login");
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা! কিছুক্ষণ পর আবার চেষ্টা করুন।");
        } finally {
            setLoggingOut(false);
        }
    };

    const avatarSrc =
        profileImage && profileImage.trim() !== "" ? profileImage : "";

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    // 🔄 নোটিফিকেশন কপি ফাংশন
    const handleCopyNotification = async (n: HeaderNotification) => {
        // তারিখ/সময় ফরম্যাট
        let donationDateTimeText = "";
        if (n.donationDateTime) {
            const d = new Date(n.donationDateTime);
            if (!Number.isNaN(d.getTime())) {
                donationDateTimeText = d.toLocaleString("bn-BD", {
                    dateStyle: "medium",
                    timeStyle: "short",
                });
            }
        }

        const text = [
            "‎একটি মানবিক আবেদন",
            `‎♦️রোগির সমস্যাঃ ${n.medicalReason ?? "-"}`,
            `‎🩸রক্তের গ্রুপঃ ${n.bloodGroup ?? "-"}`,
            `‎🖲️রক্তের পরিমাণঃ ${n.units ?? "-"} ব্যাগ`,
            `‎⭕হিমোগ্লোবিনঃ ${typeof n.hemoglobin === "number" ? n.hemoglobin : "-"
            }`,
            `‎📅রক্তদানের তারিখ ও সময়: ${donationDateTimeText || "-"
            }`,
            `‎🏥রক্তদানের স্থানঃ ${n.hospitalAddress ?? "-"}`,
            `🤝রেফারেন্সঃ ${n.requesterName ?? "-"}`,
            `‎☎️যোগাযোগ: ${n.requesterPhone ?? "-"}`,
        ].join("\n");

        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(text);
                toast.success("রিকুয়েস্ট ডিটেইল ক্লিপবোর্ডে কপি হয়েছে।");
            } else {
                // fallback (ব্রাউজার সাপোর্ট না করলে)
                const textarea = document.createElement("textarea");
                textarea.value = text;
                textarea.style.position = "fixed";
                textarea.style.left = "-9999px";
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand("copy");
                document.body.removeChild(textarea);
                toast.success("রিকুয়েস্ট ডিটেইল ক্লিপবোর্ডে কপি হয়েছে।");
            }
        } catch (error) {
            console.error(error);
            toast.error("কপি করতে সমস্যা হয়েছে, আবার চেষ্টা করুন।");
        }
    };

    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <Drawer/>
                <button
                    type="button"
                    onClick={() => router.push("/")}
                    className="btn btn-ghost text-xl"
                >
                    মানবতায় রক্তদান
                </button>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1 gap-2">
                    <li>
                        <Link className="btn btn-ghost btn-sm" href={'/'}>হোম</Link>
                    </li>
                    <li>
                        <Link className="btn btn-ghost btn-sm" href={'/'}>সহযোগী সংগঠন</Link>
                    </li>
                    <li>
                        <Link className="btn btn-ghost btn-sm" href={'/'}>ডোনার পোস্ট কার্ড</Link>
                    </li>
                </ul>
            </div>

            <div className="navbar-end gap-2">
                {/* 🔔 Notification bell (শুধু লগইন থাকলে) */}
                {!loadingUser && isLoggedIn && (
                    <div className="dropdown dropdown-end">
                        <button
                            type="button"
                            tabIndex={0}
                            className="btn btn-ghost btn-circle"
                        >
                            <div className="indicator">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    className="h-5 w-5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                                    />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="badge badge-error badge-xs indicator-item">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>
                        </button>
                        <div
                            tabIndex={-1}
                            className="mt-3 card card-compact dropdown-content w-80 bg-base-100 shadow z-20"
                        >
                            <div className="card-body max-h-80 overflow-y-auto">
                                <h2 className="card-title text-sm">
                                    নোটিফিকেশন
                                    {unreadCount > 0 && (
                                        <span className="badge badge-error badge-sm">
                                            {unreadCount}
                                        </span>
                                    )}
                                </h2>

                                {loadingNotifications ? (
                                    <div className="flex justify-center py-4">
                                        <span className="loading loading-spinner" />
                                    </div>
                                ) : notifications.length === 0 ? (
                                    <p className="text-xs text-base-content/70">
                                        কোনো নোটিফিকেশন নেই।
                                    </p>
                                ) : (
                                    <ul className="space-y-3 text-xs">
                                        {notifications.map((n) => (
                                            <li
                                                key={n.id}
                                                className="border-b last:border-0 pb-2 last:pb-0"
                                            >
                                                <p className="font-semibold">{n.title}</p>
                                                <p className="text-base-content/80">{n.message}</p>
                                                <p className="text-[10px] text-base-content/60 mt-1">
                                                    {new Date(n.createdAt).toLocaleString("bn-BD", {
                                                        dateStyle: "medium",
                                                        timeStyle: "short",
                                                    })}
                                                </p>

                                                {/* 🔘 কপি বাটন */}
                                                <button
                                                    type="button"
                                                    className="btn btn-xs btn-outline btn-primary mt-2"
                                                    onClick={() => handleCopyNotification(n)}
                                                >
                                                    কপি করুন
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {loadingUser ? (
                    <div className="w-24 h-8" />
                ) : !isLoggedIn ? (
                    <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => router.push("/login")}
                    >
                        লগইন করুন
                    </button>
                ) : (
                    <div className="flex items-center gap-3">
                        <div className="hidden sm:flex flex-col items-end text-right">
                            <span className="text-sm font-semibold">
                                {userName || "ডোনার"}
                            </span>
                            {bloodGroup && (
                                <span className="badge badge-sm badge-outline mt-0.5">
                                    {bloodGroup}
                                </span>
                            )}
                        </div>

                        <div className="dropdown dropdown-end">
                            <div
                                tabIndex={0}
                                role="button"
                                className="btn btn-ghost btn-circle avatar"
                            >
                                <div className="w-10 rounded-full overflow-hidden">
                                    {avatarSrc ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img src={avatarSrc} alt="Avatar" />
                                    ) : (
                                        <Image src={avatar} alt="Avatar" />
                                    )}
                                </div>
                            </div>
                            <ul
                                tabIndex={-1}
                                className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
                            >
                                <li>
                                    <Link href={"/profile"} className="justify-between">
                                        প্রোফাইল
                                        <span className="badge">New</span>
                                    </Link>
                                </li>
                                <li>
                                    <Link href={"/request-blood"} className="justify-between">
                                        ব্লাড রিকোয়েস্ট করুন
                                    </Link>
                                </li>

                                {isAdmin && (
                                    <li>
                                        <Link href={"/admin/dashboard"}>এ্যাডমিন ড্যাসবোর্ড</Link>
                                    </li>
                                )}

                                <li>
                                    <button type="button" onClick={handleLogout}>
                                        Logout {loggingOut && "..."}
                                    </button>
                                </li>
                            </ul>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default Header;
