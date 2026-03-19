import { Schema, model } from 'mongoose';
import { GPSData } from '@/models/interfaces/userLocationModel';

const driverLocationSchema = new Schema<GPSData>({
    userId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    status: { type: String, enum: ['active', 'inactive', 'on-duty', 'confirmed'], default: 'inactive' },
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

const DriverLocationModel = model<GPSData>('DriverLocation', driverLocationSchema);
export default DriverLocationModel;
