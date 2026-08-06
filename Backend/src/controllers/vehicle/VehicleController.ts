import {Request, Response} from 'express';
import VehicleModel from '@/models/vehicles/VehicleModel';

// Create a new vehicle
export const createVehicle = async (req: Request, res: Response, driverId:any) => {
    try {
        const vehicle = VehicleModel.create({...req.body, driverId});
        return vehicle
    } catch (error:any) {
        res.status(500).json({message: 'Server error', error});
    }
};