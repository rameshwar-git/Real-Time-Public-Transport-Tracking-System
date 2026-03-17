import { Request, Response } from 'express';
import LocationModel from '@/models/location/UserLocation';

//creating new location entry in DB
export const createLocation = async (req: Request, res: Response) => {
    try {
        const location = await LocationModel.create({ ...req.body });
        return location._id;
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

//update user location by userId
export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "UserId is required" });
        }
        const location = await LocationModel.findOneAndUpdate({ userId }, { ...req.body, timestamp: new Date() });
        res.status(200).json({ 'Status': 'SUCCESS' });
    } catch (err: any) {
        res.status(500).json({ 'Status': 'FAILED' });
    }
};

//get user Location by userId
export const getLocation = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        if (!userId) {
            return res.status(400).json({ error: "UserId is required" });
        }
        const location = await LocationModel.findOne({ userId })
            .select("currentLocation");
        res.status(200).json(location);
    } catch (err: any) {
        res.status(500).json({ 'Status': 'FAILED' });
    }
}

export const getAllLocation = async (req: Request, res: Response) => {
    try {
        const allLocation =await LocationModel.find({}).select("userId currentLocation vehicleId destination -_id").lean();
        return res.status(200).json(allLocation);
    } catch (err: any) {
        res.status(500).json(err.message);
    }
}