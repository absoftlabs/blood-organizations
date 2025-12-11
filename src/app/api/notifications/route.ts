import { NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { BloodRequest, BloodRequestStatus } from "@/types/admin";

export const runtime = "nodejs";

interface HeaderNotification {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;

    bloodGroup?: string;
    units?: number;
    hemoglobin?: number | null;
    donationDateTime?: string;
    hospitalAddress?: string;
    requesterName?: string;
    requesterPhone?: string;
    medicalReason?: string | null;
    status?: BloodRequestStatus;
}

export async function GET() {
    try {
        const db = await getDb();
        const requestsCol = db.collection<BloodRequest>("blood_requests");

        // আপাতত শেষ ৫০টা approved/pending রিকুয়েস্ট নোটিফিকেশন হিসেবে ধরছি
        const docs = await requestsCol
            .find({
                status: { $in: ["approved", "pending"] as BloodRequestStatus[] },
            })
            .sort({ createdAt: -1 })
            .limit(50)
            .toArray();

        const notifications: HeaderNotification[] = docs.map((req) => {
            const created =
                req.updatedAt instanceof Date
                    ? req.updatedAt
                    : req.createdAt instanceof Date
                        ? req.createdAt
                        : new Date(req.createdAt);

            const donationDate =
                req.donationDateTime instanceof Date
                    ? req.donationDateTime
                    : new Date(req.donationDateTime);

            return {
                id: req._id.toHexString(),
                title: "নতুন ব্লাড রিকুয়েস্ট",
                message: `${req.patientName} এর জন্য ${req.bloodGroup} রক্ত প্রয়োজন।`,
                createdAt: created.toISOString(),
                isRead: false, // এখন আপাতত সবকে unread ধরি

                bloodGroup: req.bloodGroup,
                units: req.units,
                hemoglobin: typeof req.hemoglobin === "number" ? req.hemoglobin : null,
                donationDateTime: !Number.isNaN(donationDate.getTime())
                    ? donationDate.toISOString()
                    : created.toISOString(),
                hospitalAddress: req.hospitalAddress,
                requesterName: req.requesterName,
                requesterPhone: req.requesterPhone,
                medicalReason: req.medicalReason ?? null,
                status: req.status,
            };
        });

        return NextResponse.json(
            {
                success: true,
                data: notifications,
            },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/notifications error:", error);
        return NextResponse.json(
            { success: false, message: "নোটিফিকেশন লোড করতে সমস্যা হয়েছে।" },
            { status: 500 }
        );
    }
}
