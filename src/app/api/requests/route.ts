// src/app/api/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { BloodRequest, Gender } from "@/types/admin";

export const runtime = "nodejs";

interface CreateRequestBody {
    bloodGroup: string;
    donationDateTime: string; // datetime-local string
    units: number;

    requesterName: string;
    relationWithPatient?: string;
    requesterPhone: string; // required

    patientName: string;
    patientAge?: number;
    patientGender?: Gender;
    hemoglobin?: number;
    medicalReason?: string; // রোগীর সমস্যা

    primaryPhone: string; // রোগীর ফোন
    alternatePhone?: string;
    hospitalAddress: string; // রক্তদানের স্থান
}

function isNonEmptyString(v: unknown): v is string {
    return typeof v === "string" && v.trim().length > 0;
}

function isValidPhone(v: unknown): v is string {
    return typeof v === "string" && v.trim().length >= 6;
}

export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as CreateRequestBody;

        // ✅ validations
        if (!isNonEmptyString(body.bloodGroup)) {
            return NextResponse.json(
                { success: false, message: "রক্তের গ্রুপ প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!isNonEmptyString(body.donationDateTime)) {
            return NextResponse.json(
                { success: false, message: "রক্ত দানের তারিখ ও সময় উল্লেখ করুন।" },
                { status: 400 }
            );
        }

        if (!body.units || body.units <= 0) {
            return NextResponse.json(
                { success: false, message: "মোট ইউনিট (ব্যাগ) সঠিকভাবে দিন।" },
                { status: 400 }
            );
        }

        if (!isNonEmptyString(body.requesterName)) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্টকারীর নাম প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!isValidPhone(body.requesterPhone)) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্টকারীর মোবাইল নম্বর প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!isNonEmptyString(body.patientName)) {
            return NextResponse.json(
                { success: false, message: "রোগীর নাম প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!isValidPhone(body.primaryPhone)) {
            return NextResponse.json(
                { success: false, message: "রোগীর ফোন নম্বর প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!isNonEmptyString(body.hospitalAddress)) {
            return NextResponse.json(
                { success: false, message: "হাসপাতালের নাম ও ঠিকানা প্রয়োজন।" },
                { status: 400 }
            );
        }

        const donationDate = new Date(body.donationDateTime);
        if (Number.isNaN(donationDate.getTime())) {
            return NextResponse.json(
                { success: false, message: "রক্ত দানের তারিখ সঠিক নয়।" },
                { status: 400 }
            );
        }

        const db = await getDb();

        // ✅ insert document should NOT require _id
        const col = db.collection<Omit<BloodRequest, "_id">>("blood_requests");

        const now = new Date();

        const doc: Omit<BloodRequest, "_id"> = {
            bloodGroup: body.bloodGroup,
            donationDateTime: donationDate,
            units: body.units,

            requesterName: body.requesterName,
            relationWithPatient: body.relationWithPatient,
            requesterPhone: body.requesterPhone,

            patientName: body.patientName,
            patientAge: body.patientAge,
            patientGender: body.patientGender,
            hemoglobin: body.hemoglobin,
            medicalReason: body.medicalReason,

            primaryPhone: body.primaryPhone,
            alternatePhone: body.alternatePhone,
            hospitalAddress: body.hospitalAddress,

            status: "pending",
            createdAt: now,
            updatedAt: now,
        };

        await col.insertOne(doc);

        return NextResponse.json(
            { success: true, message: "ব্লাড রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে।" },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/requests error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
