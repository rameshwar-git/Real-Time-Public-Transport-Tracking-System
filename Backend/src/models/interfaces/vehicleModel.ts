import { Document } from 'mongoose';

export interface VehicleData extends Document {
    driverId: string; // Reference to the driver
    vehicleType?: string; // e.g., 'car', 'bike', 'scooter'
    vehicleModel?: string;
    vehicleNumber?: string;
    capacity?: number; // Number of passengers the vehicle can accommodate
    color?: string;
    createdAt?: Date;
    updatedAt?: Date;
};