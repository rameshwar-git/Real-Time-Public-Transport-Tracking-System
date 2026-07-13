import { Request, Response } from 'express';
import PassengerLocationModel from '@/models/location/PassengerLocation';
import DriverLocationModel from '@/models/location/DriverLocation';
import DriverModel from '@/models/users/UserDriverModel';
import PassengerModel from '@/models/users/UserPassengerModel';
import { AuthRequest } from "@/middleware/verifyToken";
import { getNearestNUsers } from '@/utils/geometry';

// Creating new location entry specifically for Passengers
export const createPassengerLocation = async (req: Request, res: Response) => {
    try {
        const location = await PassengerLocationModel.create({ ...req.body });
        return location._id;
    } catch (err: any) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
};

// Creating new location entry specifically for Drivers
export const createDriverLocation = async (req: Request, res: Response) => {
    try {
        const location = await DriverLocationModel.create({ ...req.body });
        return location._id;
    } catch (err: any) {
        if (!res.headersSent) res.status(500).json({ error: err.message });
    }
};

// Update Passenger location
export const updatePassengerLocation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; // from verifyToken middleware
        const { locationId } = req.params;
        const locationData = req.body;

        // If not stored locally or skipped, fall back to fetching from user model
        let currentLocId = locationId;
        if (!currentLocId) {
            const passenger = await PassengerModel.findById(userId).select('locationId');
            if (!passenger?.locationId) {
                return res.status(404).json({ error: "Passenger or location not found" });
            }
            currentLocId = passenger.locationId.toString();
        }

        await PassengerLocationModel.findByIdAndUpdate(
            currentLocId,
            { ...locationData, userId, timestamp: new Date() },
            { new: true }
        );
        res.status(200).json({ 'Status': 'SUCCESS' });
    } catch (err: any) {
        res.status(500).json({ 'Status': 'FAILED' });
    }
};

// Update Driver location
export const updateDriverLocation = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id; // from verifyToken middleware
        const { locationId } = req.params;
        const locationData = req.body;
        console.log("DRIVER UPDATE BODY:", req.body);

        let currentLocId = locationId;
        let vehicleId = undefined;

        const driver = await DriverModel.findById(userId).select('locationId');
        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        const VehicleModel = require('@/models/vehicles/VehicleModel').default;
        const vehicle = await VehicleModel.findOne({ driverId: userId }).select('_id');
        if (vehicle) {
            vehicleId = vehicle._id;
        }

        if (!currentLocId || currentLocId === "undefined" || currentLocId === "null") {
            if (!driver.locationId) {
                return res.status(404).json({ error: "Driver location not found" });
            }
            currentLocId = driver.locationId.toString();
        }

        await DriverLocationModel.findByIdAndUpdate(
            currentLocId,
            { ...locationData, userId, vehicleId, timestamp: new Date() },
            { new: true }
        );
        res.status(200).json({ 'Status': 'SUCCESS' });
    } catch (err: any) {
        res.status(500).json({ 'Status': 'FAILED' });
    }
};

// Get all passenger locations
export const getAllPassengerLocations = async (req: Request, res: Response) => {
    try {
        const { lat, lng } = req.query;
        let allLocation = await PassengerLocationModel.find({ status: { $nin: ['inactive', 'offline'] } }).select("userId currentLocation destination status -_id").lean();

        if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
            const origin = { latitude: Number(lat), longitude: Number(lng) };
            allLocation = getNearestNUsers(allLocation as any, origin, 20);
        }

        return res.status(200).json(allLocation);
    } catch (err: any) {
        res.status(500).json(err.message);
    }
};

// Get all driver locations
export const getAllDriverLocations = async (req: Request, res: Response) => {
    try {
        const { lat, lng } = req.query;
        let allLocation = await DriverLocationModel.find({ status: { $nin: ['inactive', 'offline'] } })
            .select("userId currentLocation vehicleId destination status -_id")
            .populate('vehicleId', 'vehicleType')
            .lean();

        if (lat && lng && !isNaN(Number(lat)) && !isNaN(Number(lng))) {
            const origin = { latitude: Number(lat), longitude: Number(lng) };
            allLocation = getNearestNUsers(allLocation as any, origin, 20);
        }

        return res.status(200).json(allLocation);
    } catch (err: any) {
        res.status(500).json(err.message);
    }
};
