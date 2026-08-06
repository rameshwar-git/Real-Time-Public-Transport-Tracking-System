import { Document, Schema } from 'mongoose';

export interface SavedPlace extends Document {
    userId: Schema.Types.ObjectId; // Reference to the passenger who owns this place
    label: string; //  e.g. 'Home', 'Work', 'Gym'
    address: string; // Human readable address
    latitude: number;
    longitude: number;
    createdAt: Date;
}
