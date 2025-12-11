// src/app/api/admin/requests/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { BloodRequest, BloodRequestStatus, Notification } from "@/types/admin";
import { Doaner } from "@/types/user";

export const runtime = "nodejs";

interface UpdateRequestBody {
    units?: number;
    donationDateTime?: string;
    hospitalAddress?: string;
    status?: BloodRequestStatus;
}

// ---------- PATCH: রিকুয়েস্ট আপডেট ----------
export async function PATCH(
    req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await context.params;
        const id = (rawId ?? "").trim();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const body = (await req.json()) as UpdateRequestBody;

        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        // আগের রিকুয়েস্ট ডাটা বের করি
        const existing = await col.findOne({ _id: new ObjectId(id) });
        if (!existing) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        const update: Partial<BloodRequest> = {};

        if (typeof body.units === "number" && body.units > 0) {
            update.units = body.units;
        }

        if (body.donationDateTime && body.donationDateTime.trim() !== "") {
            const dt = new Date(body.donationDateTime);
            if (!Number.isNaN(dt.getTime())) {
                update.donationDateTime = dt;
            }
        }

        if (typeof body.hospitalAddress === "string") {
            update.hospitalAddress = body.hospitalAddress;
        }

        if (body.status) {
            update.status = body.status;
        }

        if (Object.keys(update).length === 0) {
            return NextResponse.json(
                { success: false, message: "কোনো valid আপডেট ডাটা পাওয়া যায়নি।" },
                { status: 400 }
            );
        }

        update.updatedAt = new Date();

        const result = await col.updateOne(
            { _id: existing._id },
            { $set: update }
        );

        if (result.matchedCount === 0) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        // 🔔 যদি status 'approved' হলো এবং আগে approved ছিল না → notification পাঠাই
        const newStatus: BloodRequestStatus | undefined = body.status;
        const wasApprovedBefore = existing.status === "approved";
        const becameApproved = newStatus === "approved" && !wasApprovedBefore;

        if (becameApproved) {
            await createNotificationsForApprovedRequest(db, existing._id, {
                patientName: existing.patientName,
                bloodGroup: existing.bloodGroup,
                hospitalAddress: existing.hospitalAddress,
            });
        }

        return NextResponse.json(
            { success: true, message: "রিকুয়েস্ট আপডেট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("PATCH /api/admin/requests/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}

// ---------- DELETE: রিকুয়েস্ট ডিলিট ----------
export async function DELETE(
    _req: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: rawId } = await context.params;
        const id = (rawId ?? "").trim();

        if (!ObjectId.isValid(id)) {
            return NextResponse.json(
                { success: false, message: "সঠিক রিকুয়েস্ট আইডি প্রয়োজন।" },
                { status: 400 }
            );
        }

        const db = await getDb();
        const col = db.collection<BloodRequest>("blood_requests");

        const result = await col.deleteOne({ _id: new ObjectId(id) });

        if (result.deletedCount === 0) {
            return NextResponse.json(
                { success: false, message: "রিকুয়েস্ট পাওয়া যায়নি।" },
                { status: 404 }
            );
        }

        return NextResponse.json(
            { success: true, message: "রিকুয়েস্ট ডিলিট হয়েছে।" },
            { status: 200 }
        );
    } catch (error) {
        console.error("DELETE /api/admin/requests/[id] error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}

// ---------- helper: approved হলে notification তৈরী ----------
async function createNotificationsForApprovedRequest(
    db: Awaited<ReturnType<typeof getDb>>,
    requestId: ObjectId,
    opts: {
        patientName: string;
        bloodGroup: string;
        hospitalAddress?: string;
    }
): Promise<void> {
    const doanersCol = db.collection<Doaner>("doaners");
    const notificationsCol = db.collection<Notification>("notifications");

    // সব approved, banned না এমন ডোনার
    const donors = await doanersCol
        .find(
            {
                isApproved: true,
                $or: [{ isBanned: { $exists: false } }, { isBanned: false }],
            },
            { projection: { _id: 1 } }
        )
        .toArray();

    if (donors.length === 0) return;

    const title = "নতুন ব্লাড রিকুয়েস্ট এপ্রুভ হয়েছে";
    const locationText =
        opts.hospitalAddress && opts.hospitalAddress.trim() !== ""
            ? opts.hospitalAddress
            : "স্থান উল্লেখ নেই";

    const message = `${opts.patientName} নামের রোগীর জন্য ${opts.bloodGroup} রক্তের রিকুয়েস্ট এপ্রুভ হয়েছে। রক্তদানের স্থান: ${locationText}`;

    const now = new Date();

    const docs: Notification[] = donors.map((d) => ({
        userId: d._id as ObjectId,
        title,
        message,
        requestId,
        isRead: false,
        createdAt: now,
    }));

    await notificationsCol.insertMany(docs);
}
