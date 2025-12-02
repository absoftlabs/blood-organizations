import Link from "next/link";
import {
    IconLayoutDashboard,
    IconUsers,
    IconDroplet,
    IconHistory,
    IconUserCircle,
} from "@tabler/icons-react";

export default function Sidebar() {
    return (
        <aside className="w-64 bg-base-100 shadow-md hidden md:flex flex-col">
            {/* Header */}
            <div className="p-5 border-b">
                <h1 className="text-xl font-bold tracking-tight">Admin Panel</h1>
                <p className="text-xs text-base-content/60 mt-1">
                    মানবতায় রক্তদান ব্লাড ব্যাংক
                </p>
            </div>

            {/* Menu */}
            <nav className="p-4 flex flex-col gap-1">
                <Link
                    href="/admin/dashboard"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition"
                >
                    <IconLayoutDashboard size={20} stroke={1.7} />
                    <span className="text-sm font-medium">ড্যাশবোর্ড</span>
                </Link>

                <Link
                    href="/admin/doaners"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition"
                >
                    <IconUsers size={20} stroke={1.7} />
                    <span className="text-sm font-medium">ডোনার লিস্ট</span>
                </Link>

                <Link
                    href="/admin/requests"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition"
                >
                    <IconDroplet size={20} stroke={1.7} />
                    <span className="text-sm font-medium">ব্লাড রিকোয়েস্ট</span>
                </Link>

                <Link
                    href="/admin/donations"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition"
                >
                    <IconHistory size={20} stroke={1.7} />
                    <span className="text-sm font-medium">ডোনেশন হিস্ট্রি</span>
                </Link>

                <Link
                    href="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition"
                >
                    <IconUserCircle size={20} stroke={1.7} />
                    <span className="text-sm font-medium">আমার প্রোফাইল</span>
                </Link>
            </nav>
        </aside>
    );
}
