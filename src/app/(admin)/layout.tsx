import Sidebar from "@/components/Admin/Common/Sidebar";
import type { ReactNode } from "react";

export default function AdminLayout({
    children,
}: {
    children: ReactNode;
}) {
    return (
        <div className="min-h-screen bg-base-200 flex">
            {/* Sidebar */}
            <Sidebar/>
            {/* Main content */}
            <main className="flex-1">
                <div className="navbar bg-base-100 shadow-sm md:hidden">
                    <div className="flex-1 px-4">
                        <span className="font-bold">Admin Panel</span>
                    </div>
                </div>

                <div className="p-4 md:p-8">{children}</div>
            </main>
        </div>
    );
}
