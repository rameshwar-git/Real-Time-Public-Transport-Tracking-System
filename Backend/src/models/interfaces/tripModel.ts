import { Document, Schema } from 'mongoose';
export interface Trip extends Document {
    passengerId: Schema.Types.ObjectId;
    driverId: Schema.Types.ObjectId;
    vehicleId: Schema.Types.ObjectId;
    startLocation: {
        latitude: number;
        longitude: number;
    },
    destination: {
        latitude: number;
        longitude: number;
    },
    status: 'scheduled' | 'in_progress' | 'completed' | 'canceled';
    startDate: Date;
    endDate: Date;
    rating?: number;
}