// src/app/api/auth/logout/route.ts
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST() {
    // কুকি ক্লিয়ার করতে maxAge = 0 সেট করলাম
    const response = NextResponse.json(
        {
            success: true,
            message: "সফলভাবে লগআউট হয়েছে।",
        },
        { status: 200 }
    );

    response.cookies.set("auth_token", "", {
        httpOnly: true,
        path: "/",
        maxAge: 0,
    });

    return response;
}
