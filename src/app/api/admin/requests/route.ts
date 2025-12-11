// src/app/api/admin/requests/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import {
    BloodRequest,
    BloodRequestStatus,
    Gender,
    AdminBloodRequest,
} from "@/types/admin";

export const runtime = "nodejs";

interface CreateRequestBody {
    bloodGroup: string;
    donationDateTime: string; // datetime-local string
    units: number;

    requesterName: string;
    relationWithPatient?: string;
    requesterPhone: string; // আপনার তথ্যের মোবাইল

    patientName: string;
    patientAge?: number;
    patientGender?: Gender;
    hemoglobin?: number;
    medicalReason?: string;

    primaryPhone: string; // রোগীর ফোন
    alternatePhone?: string;
    hospitalAddress: string;
}

type NewBloodRequest = Omit<BloodRequest, "_id">;

// ---------- GET: সব রিকুয়েস্ট ----------
export async function GET() {
    try {
        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        const docs = await col
            .find({})
            .sort({ createdAt: -1 })
            .toArray();

        const requests: AdminBloodRequest[] = docs.map((doc) => ({
            id: doc._id.toString(),
            bloodGroup: doc.bloodGroup,
            patientName: doc.patientName,
            medicalReason: doc.medicalReason ?? undefined,
            donationDateTime:
                doc.donationDateTime instanceof Date
                    ? doc.donationDateTime.toISOString()
                    : typeof doc.donationDateTime === "string"
                        ? doc.donationDateTime
                        : "",
            hospitalAddress: doc.hospitalAddress ?? "",
            primaryPhone: doc.primaryPhone,
            requesterPhone: doc.requesterPhone,
            units: doc.units,
            status: doc.status,
            createdAt:
                doc.createdAt instanceof Date
                    ? doc.createdAt.toISOString()
                    : String(doc.createdAt),
            updatedAt:
                doc.updatedAt instanceof Date
                    ? doc.updatedAt.toISOString()
                    : String(doc.updatedAt),
        }));

        return NextResponse.json(
            { success: true, requests },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/admin/requests error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}

// ---------- POST: নতুন রিকুয়েস্ট ----------
export async function POST(req: NextRequest) {
    try {
        const body = (await req.json()) as CreateRequestBody;

        // ভ্যালিডেশন
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
                { success: false, message: "রোগীর ফোন নম্বর প্রয়োজন।" },
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

        const doc: NewBloodRequest = {
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

        await col.insertOne(doc as unknown as BloodRequest);

        return NextResponse.json(
            {
                success: true,
                message: "ব্লাড রিকুয়েস্ট সফলভাবে সাবমিট হয়েছে।",
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("POST /api/admin/requests error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
