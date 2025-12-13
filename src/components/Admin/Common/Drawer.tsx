import React from 'react';
import Sidebar from './Sidebar';
import Link from 'next/link';
import { IconDroplet, IconHistory, IconLayoutDashboard, IconUserCircle, IconUsers } from '@tabler/icons-react';

const Drawer = () => {
    return (
        <div className='z-50'>
            <div role="button" className="btn btn-ghost lg:hidden">
                <label htmlFor="my-drawer-4" className='drawer-button'>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor">
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M4 6h16M4 12h8m-8 6h16" />
                    </svg>
                </label>
            </div>
            <div className="drawer drawer-start">
                <input id="my-drawer-4" type="checkbox" className="drawer-toggle" />
                <div className="drawer-content">
                    {/* Page content here */}
                    {/* <label htmlFor="my-drawer-4" className="drawer-button btn btn-primary">Open drawer</label> */}
                </div>
                <div className="drawer-side bg-primary/10">
                    <label htmlFor="my-drawer-4" aria-label="close sidebar" className="drawer-overlay"></label>
                    <div className="menu bg-primary text-primary-content min-h-full w-80 p-4">
                        <div className="p-5 border-b">
                            <h1 className="text-xl font-bold tracking-tight">এ্যাডমিন প্যানেল</h1>
                            <p className="text-xs text-white/90 mt-1">
                                মানবতায় রক্তদান ব্লাড ব্যাংক
                            </p>
                        </div>
                        {/* Sidebar content here */}
                        <Link
                            href="/admin/dashboard"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition hover:text-primary"
                        >
                            <IconLayoutDashboard size={20} stroke={1.7} />
                            <span className="text-sm font-medium">ড্যাশবোর্ড</span>
                        </Link>

                        <Link
                            href="/admin/doaners"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition hover:text-primary"
                        >
                            <IconUsers size={20} stroke={1.7} />
                            <span className="text-sm font-medium">ডোনার লিস্ট</span>
                        </Link>

                        <Link
                            href="/admin/requests"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition hover:text-primary"
                        >
                            <IconDroplet size={20} stroke={1.7} />
                            <span className="text-sm font-medium">ব্লাড রিকোয়েস্ট</span>
                        </Link>

                        <Link
                            href="/admin/donations"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition hover:text-primary"
                        >
                            <IconHistory size={20} stroke={1.7} />
                            <span className="text-sm font-medium">ডোনেশন হিস্ট্রি</span>
                        </Link>

                        <Link
                            href="/profile"
                            className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-base-200 transition hover:text-primary"
                        >
                            <IconUserCircle size={20} stroke={1.7} />
                            <span className="text-sm font-medium">আমার প্রোফাইল</span>
                        </Link>
                        <Sidebar />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Drawer;