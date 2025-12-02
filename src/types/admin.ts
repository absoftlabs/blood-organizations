import { ObjectId } from "mongodb";

export type BloodRequestStatus = "pending" | "accepted" | "completed" | "cancelled";

export interface BloodRequest {
    _id?: ObjectId;
    patientName: string;
    bloodGroup: string;
    units: number;
    location: string;
    contactNumber: string;
    status: BloodRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

export interface DonationRecord {
    _id?: ObjectId;
    donorId: ObjectId;
    donorName: string;
    bloodGroup: string;
    units: number;
    date: Date;
    location: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
