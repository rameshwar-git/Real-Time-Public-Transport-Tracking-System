import { Schema, model } from 'mongoose';
import { GPSData } from '@/models/interfaces/userLocationModel';

const locationSchema = new Schema<GPSData>({
    vehicleId: { type: Schema.Types.ObjectId },
    status: { type: String, enum : ['active', 'inactive'], default: 'inactive' },
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

const LocationModel = model<GPSData>('Location', locationSchema);
export default LocationModel;