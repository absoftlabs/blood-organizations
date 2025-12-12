import { ObjectId } from "mongodb";

export interface Doaner {
    _id?: ObjectId;
    name: string;
    email: string;
    mobile: string;
    bloodGroup: string;
    passwordHash: string;
    isApproved: boolean;
    isAdmin?: boolean;
    isBanned?: boolean;
    village?: string;
    union?: string;
    upazila?: string;
    district?: string;
    lastDonationDate?: Date | null;
    lastDonationPlace?: string;
    totalDonations?: number;
    profileImage?: string;
    createdAt: Date;
    updatedAt: Date;
    gender?: "male" | "female" | "other";
    birthDate?: Date | null;
}
