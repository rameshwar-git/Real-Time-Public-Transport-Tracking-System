import PassengerModel from '@/models/users/UserPassengerModel';
import { Request, Response } from 'express';
import { TripModel } from '@/models/trip/TripModel';
import DriverModel from '@/models/users/UserDriverModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
import { createPassengerLocation } from '@controllers/location/LocationController';
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

    //Create Location for Passenger
    const locationId = await createPassengerLocation(req, res);

    const userPassenger = await PassengerModel.create({
      ...rest,
      password: hashedPassword,
      locationId,
    });

    return res.status(201).json({
      message: "USER_CREATED",
      userId: userPassenger._id,
      locationId: userPassenger.locationId,
    });

  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

//Get Passenger
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

//Validate Passenger Login
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
      locationId: passenger.locationId,
      userId: passenger._id,
    });

  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return res.status(500).json({ error: "Server error" });
  }
};

//Validate Passenger
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

export const getUpcomingRides = async (req: AuthRequest, res: Response) => {
  try {
    const passengerId = req.user!.id;

    if (!passengerId) {
      return res.status(400).json({ error: "Passenger ID is required" });
    }

    const upcomingTrips = await TripModel.find({
      passengerId,
      $or: [
        { status: 'scheduled' },
        { status: 'in_progress' }
      ]
    })
      .populate('driverId', 'name')
      .populate('vehicleId', 'model licensePlate')
      .sort({ startDate: 1 })
      .limit(10)
      .lean();

    const rides = upcomingTrips.map(trip => {
      const startDate = new Date(trip.startDate);
      const dayName = startDate.toLocaleDateString('en-US', { weekday: 'long' });
      const isToday = new Date().toDateString() === startDate.toDateString();

      return {
        id: trip._id,
        from: 'Start Location',
        to: 'Destination',
        date: isToday ? 'Today' : dayName,
        time: startDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        driver: (trip.driverId as any)?.name || 'Driver',
        rating: 4.8,
        vehicle: (trip.vehicleId as any)?.model ? `${(trip.vehicleId as any).model} - ${(trip.vehicleId as any).licensePlate}` : 'Vehicle',
        status: trip.status === 'in_progress' ? 'confirmed' : 'scheduled'
      };
    });

    return res.status(200).json(rides);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getRecentRides = async (req: AuthRequest, res: Response) => {
  try {
    const passengerId = req.user!.id;

    if (!passengerId) {
      return res.status(400).json({ error: "Passenger ID is required" });
    }

    const completedTrips = await TripModel.find({
      passengerId,
      status: 'completed'
    })
      .sort({ endDate: -1 })
      .limit(10)
      .lean();

    const rides = completedTrips.map(trip => {
      const endDate = trip.endDate ? new Date(trip.endDate) : new Date();
      return {
        id: trip._id,
        from: 'Start Location',
        to: 'Destination',
        date: endDate.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        fare: '₹120',
        rating: trip.rating || 5
      };
    });

    return res.status(200).json(rides);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const getPassengerStats = async (req: AuthRequest, res: Response) => {
  try {
    const passengerId = req.user!.id;

    if (!passengerId) {
      return res.status(400).json({ error: "Passenger ID is required" });
    }

    const allTrips = await TripModel.find({ passengerId }).lean();
    const completedTrips = allTrips.filter(trip => trip.status === 'completed');
    const totalRides = completedTrips.length;
    const ratings = completedTrips.filter(trip => trip.rating).map(trip => trip.rating as number);
    const averageRating = ratings.length > 0
      ? (ratings.reduce((sum, r) => sum + r, 0) / ratings.length)
      : 0;

    const totalSpent = completedTrips.length * 120;

    return res.status(200).json({
      totalRides,
      averageRating: Number(averageRating.toFixed(1)),
      totalSpent
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

export const updatePassengerProfile = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const updateData = req.body;

    const updatedPassenger = await PassengerModel.findByIdAndUpdate(
      userId,
      { ...updateData, updatedAt: new Date() },
      { new: true }
    ).select('-password');

    if (!updatedPassenger) {
      return res.status(404).json({ error: "Passenger not found" });
    }

    return res.status(200).json({ message: "Profile updated successfully", data: updatedPassenger });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};