import { Schema, model } from 'mongoose';
import { Trip } from '../interfaces/tripModel';

const TripSchema = new Schema<Trip>({
    passengerId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    startLocation: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    destination: {
        latitude: { type: Number, required: true },
        longitude: { type: Number, required: true }
    },
    startDate: { type: Date, default: Date.now },
    endDate: { type: Date },
    status: { type: String, enum: ['scheduled', 'in_progress', 'completed', 'canceled'], default: 'scheduled' },
    rating: { type: Number, min: 1, max: 5 }
});

export const TripModel = model<Trip>('Trip', TripSchema);
