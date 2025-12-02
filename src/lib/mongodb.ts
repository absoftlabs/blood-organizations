// lib/mongodb.ts
import { MongoClient, Db } from "mongodb";

const uri = process.env.MONGODB_URI!;
const dbName = process.env.MONGODB_DB!;

if (!uri) throw new Error("❌ MONGODB_URI missing in .env.local");
if (!dbName) throw new Error("❌ MONGODB_DB missing in .env.local");

// Global caching so Next.js does NOT create multiple DB connections
let client: MongoClient;
let clientPromise: Promise<MongoClient>;

declare global {
    var _mongoClientPromise: Promise<MongoClient> | undefined;
}

if (process.env.NODE_ENV === "development") {
    // Dev mode → reuse the same connection
    if (!global._mongoClientPromise) {
        client = new MongoClient(uri);
        global._mongoClientPromise = client.connect();
    }
    clientPromise = global._mongoClientPromise;
} else {
    // Prod mode → new connection
    client = new MongoClient(uri);
    clientPromise = client.connect();
}

// Helper: get the DB instance
export async function getDb(): Promise<Db> {
    const client = await clientPromise;
    return client.db(dbName);
}
