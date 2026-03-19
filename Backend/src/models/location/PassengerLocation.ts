import { Schema, model } from 'mongoose';
import { GPSData } from '@/models/interfaces/userLocationModel';

const passengerLocationSchema = new Schema<GPSData>({
    userId: { type: Schema.Types.ObjectId, ref: 'Passenger' },
    status: { type: String, enum: ['active', 'inactive', 'confirmed'], default: 'inactive' },
    currentLocation: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    destination: {
        latitude: { type: Number },
        longitude: { type: Number },
    },
    timestamp: { type: Date, default: Date.now },
});

const PassengerLocationModel = model<GPSData>('PassengerLocation', passengerLocationSchema);
export default PassengerLocationModel;
