import { Schema, model } from 'mongoose';
import { Trip } from '../interfaces/tripModel';

// Extending the interface locally since we are adding new fields
export interface ExtendedTrip extends Trip {
    otp?: string;
    passengerName?: string;
    estimatedDuration?: number;
    estimatedDistance?: number;
    fare?: number;
}

const TripSchema = new Schema<ExtendedTrip>({
    passengerId: { type: Schema.Types.ObjectId, ref: 'Passenger', required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'Driver', required: true },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    passengerName: { type: String },
    otp: { type: String },
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
    rating: { type: Number, min: 1, max: 5 },
    estimatedDuration: { type: Number },
    estimatedDistance: { type: Number },
    fare: { type: Number }
});

export const TripModel = model<ExtendedTrip>('Trip', TripSchema);
