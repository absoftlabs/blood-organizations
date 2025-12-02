import { ObjectId } from "mongodb";

export interface Doaner {
    _id?: ObjectId;
    name: string;
    email: string;
    mobile: string;
    bloodGroup: string;
    passwordHash: string;

    // approval + profile related
    isApproved: boolean; // নতুন ফিল্ড
    address?: string;
    lastDonationDate?: Date | null;
    lastDonationPlace?: string;
    totalDonations?: number;
    profileImage?: string;

    createdAt: Date;
    updatedAt: Date;
}
