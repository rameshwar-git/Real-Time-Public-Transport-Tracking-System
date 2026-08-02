import { Request, Response } from 'express';
import DriverModel from '@/models/users/UserDriverModel';
import PassengerModel from '@/models/users/UserPassengerModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
import { TripModel } from '@/models/trip/TripModel';
import { createDriverLocation } from '@/controllers/location/LocationController';
import { createVehicle } from '@/controllers/vehicle/VehicleController';
import { calculateFare } from '@/utils/geometry';
import { driverAvgRating } from '@/utils/rating';
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

        const weeklyEarnings = weeklyTrips.reduce((sum, trip) => sum + (trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0)), 0);
        const totalEarnings = completedTrips.reduce((sum, trip) => sum + (trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0)), 0);

        const lastWeekTrips = completedTrips.filter(trip => {
            const twoWeeksAgo = new Date(weekAgo.getTime() - 7 * 24 * 60 * 60 * 1000);
            return trip.endDate && new Date(trip.endDate) < weekAgo && new Date(trip.endDate) >= twoWeeksAgo;
        });
        const lastWeekEarnings = lastWeekTrips.reduce((sum, trip) => sum + (trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0)), 0);
        const weeklyChange = lastWeekEarnings > 0
            ? ((weeklyEarnings - lastWeekEarnings) / lastWeekEarnings * 100).toFixed(1)
            : 0;

        // Driver's average rating (given by passengers), drives matching priority.
        let rating: number | null = null;
        try {
            rating = await driverAvgRating(driverId);
        } catch (err) {
            console.error("Error loading driver rating:", err);
        }

        return res.status(200).json({
            totalEarnings: Number(totalEarnings.toFixed(2)),
            weeklyEarnings: Number(weeklyEarnings.toFixed(2)),
            weeklyChange: Number(weeklyChange),
            completedRides: completedTrips.length,
            acceptanceRate,
            rating
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
                dailyEarnings[dayName] = (dailyEarnings[dayName] || 0) + (trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0));
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

        const DriverLocationModel = require('@/models/location/DriverLocation').default;
        const driverLocation = await DriverLocationModel.findOne({ userId: driverId }).lean();
        const lastDestination = driverLocation?.destination || null;

        return res.status(200).json({
            driver,
            vehicle: vehicle || null,
            lastDestination
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

export const getActiveDriverTrips = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.user!.id;
        if (!driverId) {
            return res.status(400).json({ error: "Driver ID is required" });
        }

        const activeTrips = await TripModel.find({
            driverId,
            status: { $in: ['scheduled', 'in_progress'] }
        }).lean();

        const formattedTrips = activeTrips.map(trip => ({
            tripId: trip._id,
            passengerId: trip.passengerId,
            passengerName: trip.passengerName,
            origin: trip.startLocation,
            destination: trip.destination,
            status: trip.status,
            estimatedDistance: (trip as any).estimatedDistance,
            estimatedDuration: (trip as any).estimatedDuration,
            fare: (trip as any).fare !== undefined ? (trip as any).fare : calculateFare((trip as any).estimatedDistance || 0)
        }));

        return res.status(200).json(formattedTrips);
    } catch (err: any) {
        return res.status(500).json({ error: err.message });
    }
};

//Get Driven Ride History (past / completed trips)
export const getDriverRideHistory = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    const trips = await TripModel.find({ driverId })
      .sort({ startDate: -1 })
      .limit(100)
      .lean();

    const rides = await Promise.all(trips.map(async (trip) => {
      let passengerName = (trip as any).passengerName;
      if (!passengerName) {
        const passenger = await PassengerModel.findById(trip.passengerId).lean();
        passengerName = passenger ? passenger.name : 'Passenger';
      }
      return {
        id: trip._id,
        passengerId: trip.passengerId,
        passengerName: passengerName || 'Passenger',
        from: trip.startLocation,
        to: trip.destination,
        distance: (trip as any).estimatedDistance || 0,
        duration: (trip as any).estimatedDuration || 0,
        fare: (trip as any).fare !== undefined ? (trip as any).fare : calculateFare((trip as any).estimatedDistance || 0),
        status: trip.status,
        startDate: trip.startDate,
        endDate: trip.endDate,
        rating: trip.rating || null,
      };
    }));

    return res.status(200).json(rides);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};

//Get Detailed Earnings / Trip Report
export const getDriverReports = async (req: AuthRequest, res: Response) => {
  try {
    const driverId = req.user!.id;
    if (!driverId) {
      return res.status(400).json({ error: 'Driver ID is required' });
    }

    const completedTrips = await TripModel.find({
      driverId,
      status: 'completed',
    }).lean();

    const totalEarnings = completedTrips.reduce(
      (sum, trip) => sum + ((trip as any).fare !== undefined ? (trip as any).fare : calculateFare((trip as any).estimatedDistance || 0)),
      0
    );
    const totalTrips = completedTrips.length;
    const avgFare = totalTrips > 0 ? totalEarnings / totalTrips : 0;
    const totalDistance = completedTrips.reduce(
      (sum, trip) => sum + ((trip as any).estimatedDistance || 0),
      0
    );

    // Monthly breakdown for the last 6 months
    const now = new Date();
    const months: { label: string; earnings: number; trips: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        label: d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' }),
        earnings: 0,
        trips: 0,
      });
    }

    completedTrips.forEach((trip) => {
      const end = trip.endDate ? new Date(trip.endDate) : new Date();
      const idx = (end.getFullYear() - now.getFullYear()) * 12 + (end.getMonth() - now.getMonth()) + 5;
      if (idx >= 0 && idx <= 5) {
        months[idx].earnings += (trip as any).fare !== undefined ? (trip as any).fare : calculateFare((trip as any).estimatedDistance || 0);
        months[idx].trips += 1;
      }
    });

    // Best day (day of week) by earnings
    const dayTotals: { [key: string]: number } = {};
    const dayCounts: { [key: string]: number } = {};
    completedTrips.forEach((trip) => {
      const end = trip.endDate ? new Date(trip.endDate) : new Date();
      const dayName = end.toLocaleDateString('en-US', { weekday: 'short' });
      dayTotals[dayName] = (dayTotals[dayName] || 0) +
        ((trip as any).fare !== undefined ? (trip as any).fare : calculateFare((trip as any).estimatedDistance || 0));
      dayCounts[dayName] = (dayCounts[dayName] || 0) + 1;
    });
    let topDay = 'N/A';
    let topDayEarnings = 0;
    Object.entries(dayTotals).forEach(([day, amount]) => {
      if (amount > topDayEarnings) {
        topDayEarnings = amount;
        topDay = day;
      }
    });

    return res.status(200).json({
      totalEarnings: Number(totalEarnings.toFixed(2)),
      totalTrips,
      avgFare: Number(avgFare.toFixed(2)),
      totalDistance: Number(totalDistance.toFixed(2)),
      topDay,
      topDayEarnings: Number(topDayEarnings.toFixed(2)),
      monthBreakdown: months.map((m) => ({
        ...m,
        earnings: Number(m.earnings.toFixed(2)),
      })),
      dayCounts,
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};
