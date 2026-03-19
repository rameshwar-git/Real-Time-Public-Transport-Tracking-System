import { Request, Response } from 'express';
import DriverModel from '@/models/users/UserDriverModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
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
