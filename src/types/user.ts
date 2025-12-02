import { ObjectId } from "mongodb";

export interface Doaner {
    _id?: ObjectId;
    name: string;
    email: string;
    mobile: string;
    bloodGroup: string;
    passwordHash: string;

    isApproved: boolean;
    isAdmin?: boolean;  // ✅ admin flag
    isBanned?: boolean; // ✅ banned flag

    address?: string;
    lastDonationDate?: Date | null;
    lastDonationPlace?: string;
    totalDonations?: number;
    profileImage?: string;

    createdAt: Date;
    updatedAt: Date;
}
