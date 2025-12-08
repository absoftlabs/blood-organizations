// src/app/api/requests/route.ts
import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { BloodRequest, BloodRequestStatus, Gender } from "@/types/admin";

export const runtime = "nodejs";

interface CreateRequestBody {
    bloodGroup: string;
    donationDateTime: string;
    units: number;

    requesterName: string;
    relationWithPatient?: string;
    requesterPhone: string;

    patientName: string;
    patientAge?: number;
    patientGender?: Gender;
    hemoglobin?: number;
    medicalReason?: string;

    primaryPhone: string;
    alternatePhone?: string;
    hospitalAddress: string;
}

export async function POST(req: Request) {
    try {
        const body = (await req.json()) as CreateRequestBody;

        // --- ভ্যালিডেশন ---
        if (!body.bloodGroup) {
            return NextResponse.json(
                { success: false, message: "রক্তের গ্রুপ প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!body.donationDateTime) {
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

        if (!body.requesterName) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্টকারীর নাম প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!body.requesterPhone) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্টকারীর মোবাইল নম্বর প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!body.patientName) {
            return NextResponse.json(
                { success: false, message: "রোগীর নাম প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!body.primaryPhone) {
            return NextResponse.json(
                { success: false, message: "রোগীর মোবাইল নম্বর প্রয়োজন।" },
                { status: 400 }
            );
        }

        if (!body.hospitalAddress) {
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
        const col = db.collection<BloodRequest>("blood_requests");

        const now = new Date();

        const doc: BloodRequest = {
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

            status: "pending" satisfies BloodRequestStatus,
            createdAt: now,
            updatedAt: now,
        };

        await col.insertOne(doc);

        return NextResponse.json(
            {
                success: true,
                message: "ব্লাড রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে।",
            },
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
