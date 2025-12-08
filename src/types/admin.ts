import { ObjectId } from "mongodb";

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


export type BloodRequestStatus = "pending" | "approved" | "rejected" | "completed";
export type Gender = "male" | "female" | "other";

export interface BloodRequest {
    _id?: ObjectId;

    bloodGroup: string;
    donationDateTime: Date;

    units: number;

    requesterName: string;
    relationWithPatient?: string;
    requesterPhone: string;

    patientName: string;
    patientAge?: number;
    patientGender?: Gender;
    hemoglobin?: number;
    medicalReason?: string;

    primaryPhone: string;   // রোগীর ফোন
    alternatePhone?: string;
    hospitalAddress: string;

    status: BloodRequestStatus;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * অ্যাডমিন টেবিলের জন্য DTO
 */
export interface AdminBloodRequest {
    id: string;

    bloodGroup: string;
    patientName: string;
    medicalReason?: string;

    donationDateTime?: string;
    hospitalAddress?: string;

    primaryPhone: string;
    requesterPhone: string;

    units: number;
    status: BloodRequestStatus;

    createdAt: string;
    updatedAt?: string;
}
