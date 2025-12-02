// app/api/auth/register/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function POST(req: Request) {
    try {
        const body = await req.json();

        const name = (body.name || "").trim();
        const email = (body.email || "").toLowerCase().trim();
        const password = body.password || "";
        const confirmPassword = body.confirmPassword || "";
        const mobile = (body.mobile || "").trim();
        const bloodGroup = (body.bloodGroup || "").trim();

        // Validation
        if (!name || !email || !password || !confirmPassword || !mobile || !bloodGroup) {
            return NextResponse.json(
                { success: false, message: "সবগুলো প্রয়োজনীয় তথ্য পূরণ করুন।" },
                { status: 400 }
            );
        }

        if (password !== confirmPassword) {
            return NextResponse.json(
                { success: false, message: "পাসওয়ার্ড এবং নিশ্চিত পাসওয়ার্ড মিলছে না।" },
                { status: 400 }
            );
        }

        if (password.length < 6) {
            return NextResponse.json(
                { success: false, message: "পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।" },
                { status: 400 }
            );
        }

        // Mobile validation BD format
        const mobileRegex = /^01[0-9]{9}$/;
        if (!mobileRegex.test(mobile)) {
            return NextResponse.json(
                { success: false, message: "সঠিক বাংলাদেশি মোবাইল নম্বর দিন (০১XXXXXXXXX)।" },
                { status: 400 }
            );
        }

        // MongoDB DB & Collection
        const db = await getDb();
        const doanersCollection = db.collection("doaners");

        // Check existing email
        const existingUser = await doanersCollection.findOne({ email });

        if (existingUser) {
            return NextResponse.json(
                { success: false, message: "এই ইমেইল দিয়ে আগে থেকেই একাউন্ট তৈরি আছে।" },
                { status: 409 }
            );
        }

        // Password hashing
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Insert donor
        const now = new Date();
        const result = await doanersCollection.insertOne({
            name,
            email,
            mobile,
            bloodGroup,
            passwordHash,
            isApproved: false,
            isAdmin: false,
            isBanned: false,

            totalDonations: 0,
            address: "",
            lastDonationDate: null,
            lastDonationPlace: "",
            profileImage: "",
            createdAt: now,
            updatedAt: now,
        });

        if (!result.insertedId) {
            return NextResponse.json(
                { success: false, message: "একাউন্ট তৈরি করতে সমস্যা হয়েছে।" },
                { status: 500 }
            );
        }

        return NextResponse.json(
            { success: true, message: "রেজিস্ট্রেশন সফল হয়েছে!" },
            { status: 201 }
        );
    } catch (error) {
        console.error("Register API Error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
