// src/app/api/notifications/route.ts
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Notification } from "@/types/admin";

export const runtime = "nodejs";

async function getUserIdFromCookie(): Promise<ObjectId | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    try {
        return new ObjectId(token);
    } catch {
        return null;
    }
}

interface NotificationDto {
    id: string;
    title: string;
    message: string;
    createdAt: string;
    isRead: boolean;
}

export async function GET() {
    try {
        const userId = await getUserIdFromCookie();
        if (!userId) {
            return NextResponse.json(
                { success: false, message: "অননুমোদিত অনুরোধ।" },
                { status: 401 }
            );
        }

        const db = await getDb();
        const notificationsCol = db.collection<Notification>("notifications");

        const docs = await notificationsCol
            .find({ userId })
            .sort({ createdAt: -1 })
            .limit(20)
            .toArray();

        const data: NotificationDto[] = docs.map((n) => ({
            id: (n._id as ObjectId).toHexString(),
            title: n.title,
            message: n.message,
            createdAt: n.createdAt.toISOString(),
            isRead: n.isRead,
        }));

        return NextResponse.json(
            { success: true, data },
            { status: 200 }
        );
    } catch (error) {
        console.error("GET /api/notifications error:", error);
        return NextResponse.json(
            { success: false, message: "সার্ভার সমস্যা, পরে চেষ্টা করুন।" },
            { status: 500 }
        );
    }
}
