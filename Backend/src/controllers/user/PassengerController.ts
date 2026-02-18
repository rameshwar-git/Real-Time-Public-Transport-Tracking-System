import PassengerModel from '@/models/users/UserPassengerModel';
import { Request, Response } from 'express';
import { createLocation } from '@controllers/location/LocationController';
import bcrypt from "bcryptjs";
import mongoose from 'mongoose';

//Register New Passenger
export const createPassenger = async (req: Request, res: Response) => {
    try {
        const { password, ...rest } = req.body;

        if (!password) {
            return res.status(400).json({ error: "Password is required." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const userPassenger = await PassengerModel.create({
            ...rest,
            password: hashedPassword,
        });

        await createLocation(req, res, userPassenger._id);

        return res.status(201).json({ userId: userPassenger._id });

    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

export const getPassenger = async (req: Request, res: Response) => {
    try {
        const { userId } = req.params;
        const data = await PassengerModel.findById({ userId });
        if (!data)
            return res.status(401).json({ "Status": "No Data Found." });
        return res.status(200).json(data);
    } catch (err: any) {
        return res.status(500).json(err.message);
    }
};

export const validateLogin = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }
        const passenger = await PassengerModel
            .findOne({ email })
            .select("+password");
        if (!passenger) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        const isValid = await bcrypt.compare(password, passenger.password);
        if (!isValid) {
            return res.status(401).json({ error: "Invalid credentials." });
        }
        return res.status(200).json({ userId: passenger._id, message: "SUCCESS" });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Server error." });
    }
};

export const validateUser = async (req: Request, res: Response) => {

    try {
        const { _id } = req.params;
        // @ts-ignore
        if (!_id || !mongoose.Types.ObjectId.isValid(_id))
            return res.status(400).json({ error: "Invalid ID." });
        const exists = await PassengerModel.exists({ _id:_id });
        if (exists)
            return res.status(302).json({message:"VALIDE"});
        return res.status(404).json({message:"INVALID"});
    } catch (err: any) {
        return res.status(400).json(err.message);
    }
}