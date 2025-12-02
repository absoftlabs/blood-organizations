import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const email = (body.email || "").toLowerCase().trim();
        const password = body.password || "";

        if (!email || !password) {
            return NextResponse.json(
                { success: false, message: "ইমেইল এবং পাসওয়ার্ড দিন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const doanersCollection = db.collection<Doaner>("doaners");

        const user = await doanersCollection.findOne({ email });

        if (!user) {
            return NextResponse.json(
                { success: false, message: "ইমেইল বা পাসওয়ার্ড ভুল।" },
                { status: 401 }
            );
        }

        // ⬇ এখানে Approval চেক
        if (!user.isApproved) {
            return NextResponse.json(
                {
                    success: false,
                    message:
                        "আপনার রেজিস্ট্রেশন এখনো অনুমোদিত নয়। অনুগ্রহ করে অনুমোদনের জন্য অপেক্ষা করুন।",
                },
                { status: 403 }
            );
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);
        if (!isMatch) {
            return NextResponse.json(
                { success: false, message: "ইমেইল বা পাসওয়ার্ড ভুল।" },
                { status: 401 }
            );
        }

        const response = NextResponse.json(
            {
                success: true,
                message: "লগইন সফল হয়েছে!",
                user: {
                    id: user._id?.toString(),
                    name: user.name,
                    email: user.email,
                    mobile: user.mobile,
                    bloodGroup: user.bloodGroup,
                },
            },
            { status: 200 }
        );

        response.cookies.set("auth_token", user._id?.toString() ?? "", {
            httpOnly: true,
            path: "/",
            maxAge: 60 * 60 * 24 * 7,
        });

        return response;
    } catch (err) {
        console.error("Login Error:", err);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
