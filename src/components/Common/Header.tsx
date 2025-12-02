"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import avatar from "../../../public/avatar.png";
import Link from "next/link";

interface HeaderProfileData {
    profileImage: string;
}

function Header() {
    const router = useRouter();
    const [loggingOut, setLoggingOut] = useState(false);
    const [profileImage, setProfileImage] = useState<string>("");

    useEffect(() => {
        const fetchProfileAvatar = async () => {
            try {
                const res = await fetch("/api/profile");
                if (!res.ok) return;
                const json = await res.json();
                const data = json.data as HeaderProfileData;
                if (data && data.profileImage) {
                    setProfileImage(data.profileImage);
                }
            } catch (error) {
                // নীরবে ignore করলাম, avatar না পেলেও ডিফল্ট থাকবে
                console.error(error);
            }
        };

        fetchProfileAvatar();
    }, []);

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

            router.push("/login");
        } catch (error) {
            console.error(error);
            toast.error("সার্ভার সমস্যা! কিছুক্ষণ পর আবার চেষ্টা করুন।");
        } finally {
            setLoggingOut(false);
        }
    };

    const avatarSrc = profileImage && profileImage.trim() !== "" ? profileImage : avatar;

    return (
        <div className="navbar bg-base-100 shadow-sm">
            <div className="navbar-start">
                <div className="dropdown">
                    <div tabIndex={0} role="button" className="btn btn-ghost lg:hidden">
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
                                d="M4 6h16M4 12h8m-8 6h16"
                            />
                        </svg>
                    </div>
                    <ul
                        tabIndex={-1}
                        className="menu menu-sm dropdown-content bg-base-100 rounded-box z-10 mt-3 w-52 p-2 shadow"
                    >
                        <li>
                            <a>Item 1</a>
                        </li>
                        <li>
                            <a>Parent</a>
                            <ul className="p-2">
                                <li>
                                    <a>Submenu 1</a>
                                </li>
                                <li>
                                    <a>Submenu 2</a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a>Item 3</a>
                        </li>
                    </ul>
                </div>
                <a className="btn btn-ghost text-xl">মানবতায় রক্তদান</a>
            </div>

            <div className="navbar-center hidden lg:flex">
                <ul className="menu menu-horizontal px-1">
                    <li>
                        <a>হোম</a>
                    </li>
                    <li>
                        <details>
                            <summary>মেনু</summary>
                            <ul className="p-2 bg-base-100 w-40 z-10">
                                <li>
                                    <a>Submenu 1</a>
                                </li>
                                <li>
                                    <a>Submenu 2</a>
                                </li>
                            </ul>
                        </details>
                    </li>
                    <li>
                        <a>যোগাযোগ</a>
                    </li>
                </ul>
            </div>

            <div className="navbar-end">
                <div className="dropdown dropdown-end">
                    <div
                        tabIndex={0}
                        role="button"
                        className="btn btn-ghost btn-circle avatar"
                    >
                        <div className="w-10 rounded-full overflow-hidden">
                            {typeof avatarSrc === "string" ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={typeof avatarSrc === "string" ? avatarSrc : ""} alt="Avatar" />
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
                                Profile
                                <span className="badge">New</span>
                            </Link>
                        </li>
                        <li>
                            <a>Settings</a>
                        </li>
                        <li>
                            <button type="button" onClick={handleLogout}>
                                Logout {loggingOut && "..."}
                            </button>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}

export default Header;
