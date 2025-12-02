// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const authToken = request.cookies.get("auth_token")?.value;
    const isLoggedIn = Boolean(authToken);

    // 🔒 হোম পেজ প্রোটেক্টেড: লগইন না থাকলে / থেকে /login এ পাঠাবে
    if (!isLoggedIn && pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // ✅ যদি already লগইন করা থাকে:
    // /login বা /register এ গেলে → হোম পেজে পাঠাবে
    if (isLoggedIn && (pathname === "/login" || pathname === "/register")) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    // বাকি সব রুট normal কাজ করবে
    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/register"],
};
