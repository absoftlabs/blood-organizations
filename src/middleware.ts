import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    const authToken = request.cookies.get("auth_token")?.value;
    const authRole = request.cookies.get("auth_role")?.value;

    const isLoggedIn = Boolean(authToken);
    const isAdmin = authRole === "admin";

    // 🔒 হোম পেজ প্রোটেক্টেড: লগইন না থাকলে / → /login
    if (!isLoggedIn && pathname === "/") {
        return NextResponse.redirect(new URL("/login", request.url));
    }

    // 🔒 admin routes প্রোটেক্ট
    if (pathname.startsWith("/admin")) {
        if (!isLoggedIn) {
            return NextResponse.redirect(new URL("/login", request.url));
        }

        if (!isAdmin) {
            return NextResponse.redirect(new URL("/", request.url));
        }
    }

    // ✅ লগইন থাকা অবস্থায় login/register এ ঢুকতে না দেয়া
    if (
        isLoggedIn &&
        (pathname === "/login" || pathname === "/register")
    ) {
        return NextResponse.redirect(new URL("/", request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/", "/login", "/register", "/admin/:path*"],
};
