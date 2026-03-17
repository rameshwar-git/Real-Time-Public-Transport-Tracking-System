import PassengerModel from '@/models/users/UserPassengerModel';
import { Request, Response } from 'express';
import { createLocation } from '@controllers/location/LocationController';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "@/middleware/verifyToken";

//Register New Passenger
export const createPassenger = async (req: Request, res: Response) => {
  try {
    const { password, ...rest } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const locationId = await createLocation(req, res);

    const userPassenger = await PassengerModel.create({
      ...rest,
      password: hashedPassword,
      locationId,
    });

    return res.status(201).json({
      message: "USER_CREATED",
      userId: userPassenger._id,
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPassenger = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const data = await PassengerModel.findById(userId).select("-password");

    if (!data) {
      return res.status(404).json({ message: "No data found" });
    }

    return res.status(200).json(data);
  } catch (err: any) {
    return res.status(500).json(err.message);
  }
};

export const validateLogin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    const passenger = await PassengerModel
      .findOne({ email })
      .select("+password");

    if (!passenger) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const isValid = await bcrypt.compare(password, passenger.password);

    if (!isValid) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      {
        id: passenger._id,
        role: "passenger",
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "7d" }
    );

    return res.status(200).json({
      message: "SUCCESS",
      token,
      user: {
        id: passenger._id,
        email: passenger.email,
        name: passenger.name,
      },
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

export const validateUser = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;

    const exists = await PassengerModel.exists({ _id: userId });

    if (!exists) {
      return res.status(404).json({ message: "INVALID" });
    }

    return res.status(200).json({ message: "VALID" });

  } catch (err: any) {
    return res.status(500).json(err.message);
  }
};