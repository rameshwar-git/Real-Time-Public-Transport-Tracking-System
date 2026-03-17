import { Document, Schema } from "mongoose";

export interface users extends Document {
    name: string;
    dob: Date;
    gender: string;
    email: string;
    phone: string;
    password: string;
    locationId: Schema.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
    status: String;
    lastSeen: Date;
}