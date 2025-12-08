import { cookies } from "next/headers";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";
import { Doaner } from "@/types/user";

export async function getAdminUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth_token")?.value;
    if (!token) return null;

    let userId: ObjectId;
    try {
        userId = new ObjectId(token);
    } catch {
        return null;
    }

    const db = await getDb();
    const doaners = db.collection<Doaner>("doaners");
    const user = await doaners.findOne({ _id: userId });

    if (!user || !user.isAdmin || user.isBanned) {
        return null;
    }

    return user;
}
