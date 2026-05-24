import { Request, Response } from 'express';
import DriverModel from '@/models/users/UserDriverModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
import { TripModel } from '@/models/trip/TripModel';
import { createDriverLocation } from '@/controllers/location/LocationController';
import { createVehicle } from '@/controllers/vehicle/VehicleController';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "@/middleware/verifyToken";

//New Driver Regestration
export const createDriver = async (req: Request, res: Response) => {
    try {
        const { password, ...rest } = req.body;
        if (!password) {
            return res.status(400).json({ error: "Password is required." });
        }
        const hashedPassword = await bcrypt.hash(password, 10);

        //Create location entry for the new driver
        const userLocation = await createDriverLocation(req, res);
        if (!userLocation) throw new Error("Could not create location");

        const userDriver = await DriverModel.create({
            ...rest,
            password: hashedPassword,
            locationId: userLocation._id
        });

        //Create vehicle entry for the new driver
        const userVehicle = await createVehicle(req, res, userDriver._id);
        res.status(201).json({
            userId: userDriver._id,
            locationId: userLocation?._id,
            vehicleid: userVehicle?._id
        });
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

//Validate Driver Login
export const validateDriverLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: "Email and password required" });
        }

        const driver = await DriverModel.findOne({ email }).select("+password");

        if (!driver) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = await bcrypt.compare(password, driver.password);

        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const token = jwt.sign(
            { id: driver._id, role: "driver" },
            process.env.JWT_SECRET as string,
            { expiresIn: "7d" }
        );

        return res.status(200).json({
            message: "SUCCESS",
            token,
            userId: driver._id,
            locationId: driver.locationId
        });
    } catch (error) {
        console.error("LOGIN ERROR:", error);
        return res.status(500).json({ error: "Server error" });
    }
};

//Set Vehicle Date for Driver
export const setDriverVehicle = async (req: Request, res: Response) => {
    try {
        const { driverId } = req.params;
        if (!driverId) {
            return res.status(400).json({ error: "DriverId is required" });
        }
        const driver = await VehicleModel.findOneAndUpdate({ driverId }, { ...req.body, timestamp: new Date() });
        res.status(200).json({ 'Status': 'SUCCESS' });
    } catch (err: any) {
        res.status(500).json({ 'Status': 'FAILED' });
    }
};

export const validateDriver = async (req: AuthRequest, res: Response) => {
    try {
        const userId = req.user!.id;

        const exists = await DriverModel.exists({ _id: userId });

        if (!exists) {
            return res.status(404).json({ message: "INVALID" });
        }

        return res.status(200).json({ message: "VALID" });

    } catch (err: any) {
        return res.status(500).json(err.message);
    }
};

export const getDriverEarnings = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.user!.id;

        if (!driverId) {
            return res.status(400).json({ error: "Driver ID is required" });
        }

        const completedTrips = await TripModel.find({
            driverId,
            status: 'completed'
        }).lean();

        const allTrips = await TripModel.find({ driverId }).lean();
        const acceptanceRate = allTrips.length > 0
            ? Math.round((completedTrips.length / allTrips.length) * 100)
            : 0;

        const now = new Date();
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const weeklyTrips = completedTrips.filter(trip =>
            trip.endDate && new Date(trip.endDate) >= weekAgo
        );

        const weeklyEarnings = weeklyTrips.length * 150; // Assume ₹150 per trip
        const totalEarnings = completedTrips.length * 150;

        const lastWeekTrips = completedTrips.filter(trip => {
            const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
            return trip.endDate && new Date(trip.endDate) < weekAgo && new Date(trip.endDate) >= twoWeeksAgo;
        });
        const lastWeekEarnings = lastWeekTrips.length * 150;
        const weeklyChange = lastWeekEarnings > 0
            ? ((weeklyEarnings - lastWeekEarnings) / lastWeekEarnings * 100).toFixed(1)
            : 0;

        return res.status(200).json({
            totalEarnings: Number(totalEarnings.toFixed(2)),
            weeklyEarnings: Number(weeklyEarnings.toFixed(2)),
            weeklyChange: Number(weeklyChange),
            completedRides: completedTrips.length,
            acceptanceRate
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export const getWeeklyEarnings = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.user!.id;

        if (!driverId) {
            return res.status(400).json({ error: "Driver ID is required" });
        }

        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        const trips = await TripModel.find({
            driverId,
            status: 'completed',
            endDate: { $gte: sevenDaysAgo }
        }).lean();

        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dailyEarnings: { [key: string]: number } = {};

        for (let i = 0; i < 7; i++) {
            const date = new Date(now.getTime() - (6 - i) * 24 * 60 * 60 * 1000);
            const dayName = dayNames[date.getDay()];
            dailyEarnings[dayName] = 0;
        }

        trips.forEach(trip => {
            if (trip.endDate) {
                const tripDate = new Date(trip.endDate);
                const dayName = dayNames[tripDate.getDay()];
                dailyEarnings[dayName] = (dailyEarnings[dayName] || 0) + 150;
            }
        });

        const result = Object.entries(dailyEarnings).map(([day, amount]) => ({
            day,
            amount: Number(amount.toFixed(2))
        }));

        return res.status(200).json(result);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export const getDriverProfile = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.user!.id;
        
        const driver = await DriverModel.findById(driverId).select('-password').lean();
        if (!driver) {
            return res.status(404).json({ error: "Driver not found" });
        }

        const vehicle = await VehicleModel.findOne({ driverId }).lean();
        
        return res.status(200).json({
            driver,
            vehicle: vehicle || null
        });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export const updateDriverProfile = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.user!.id;
        const { driverData, vehicleData } = req.body;

        if (driverData) {
            await DriverModel.findByIdAndUpdate(driverId, { ...driverData, updatedAt: new Date() });
        }

        if (vehicleData) {
            const existingVehicle = await VehicleModel.findOne({ driverId });
            if (existingVehicle) {
                await VehicleModel.findOneAndUpdate({ driverId }, { ...vehicleData, updatedAt: new Date() });
            } else {
                await VehicleModel.create({ ...vehicleData, driverId });
            }
        }

        return res.status(200).json({ message: "Profile updated successfully" });
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};
