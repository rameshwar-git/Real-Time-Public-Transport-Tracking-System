import PassengerModel from '@/models/users/UserPassengerModel';
import { Request, Response } from 'express';
import { TripModel } from '@/models/trip/TripModel';
import DriverModel from '@/models/users/UserDriverModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
import DriverLocationModel from '@/models/location/DriverLocation';
import PassengerLocationModel from '@/models/location/PassengerLocation';
import { calculateFare } from '@/utils/geometry';
import { createPassengerLocation } from '@controllers/location/LocationController';
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AuthRequest } from "@/middleware/verifyToken";

/** Returns true only when a coordinate pair is a real, routable location */
const isValidCoord = (c: any): boolean =>
  c != null &&
  typeof c.latitude === 'number' &&
  typeof c.longitude === 'number' &&
  !isNaN(c.latitude) &&
  !isNaN(c.longitude) &&
  !(c.latitude === 0 && c.longitude === 0);

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
      const calculatedFare = trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0);
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
        fare: `₹${calculatedFare.toFixed(2)}`,
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

    const totalSpent = completedTrips.reduce((sum, trip) => sum + (trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0)), 0);
 
    return res.status(200).json({
      totalRides,
      averageRating: Number(averageRating.toFixed(1)),
      totalSpent: Number(totalSpent.toFixed(2))
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

export const getActiveTrip = async (req: AuthRequest, res: Response) => {
  try {
    const passengerId = req.user!.id;
    if (!passengerId) {
      return res.status(400).json({ error: "Passenger ID is required" });
    }

    // Find the single active/ongoing trip
    const activeTrip = await TripModel.findOne({
      passengerId,
      status: { $in: ['scheduled', 'in_progress'] }
    }).lean();

    if (!activeTrip) {
      return res.status(200).json({ active: false });
    }

    const tripDestination = activeTrip.destination;
    const tripStartLocation = activeTrip.startLocation;

    // ──────────────────────────────────────────────────────────────────────────
    // Restore destination into BOTH location records so startSharing on reopen
    // sends valid coords to the REST API and route matching works correctly.
    // ──────────────────────────────────────────────────────────────────────────
    const locationUpdates: Promise<any>[] = [];

    // Passenger's location record → destination = trip.destination (final stop)
    if (isValidCoord(tripDestination)) {
      locationUpdates.push(
        PassengerLocationModel.findOneAndUpdate(
          { userId: passengerId },
          { destination: tripDestination },
          { new: true }
        )
      );
    }

    // Driver's location record →
    //   • scheduled  : driver is heading to the pickup (startLocation)
    //   • in_progress: driver is heading to the final destination
    const driverDestinationToRestore =
      activeTrip.status === 'in_progress' ? tripDestination : tripStartLocation;

    if (isValidCoord(driverDestinationToRestore)) {
      locationUpdates.push(
        DriverLocationModel.findOneAndUpdate(
          { userId: activeTrip.driverId },
          { destination: driverDestinationToRestore },
          { new: true }
        )
      );
    }

    await Promise.all(locationUpdates);

    // Get driver profile details
    const driver = await DriverModel.findById(activeTrip.driverId).lean();
    const vehicle = await VehicleModel.findOne({ driverId: activeTrip.driverId }).lean();

    // Get driver's latest GPS position for immediate route rendering on reopen
    const driverLocationRecord = await DriverLocationModel.findOne({ userId: activeTrip.driverId }).lean();
    const rawDriverLoc = driverLocationRecord?.currentLocation;
    const driverCurrentLocation = isValidCoord(rawDriverLoc)
      ? { latitude: rawDriverLoc!.latitude, longitude: rawDriverLoc!.longitude }
      : null;

    // Only return valid (non-zero) coordinates to the frontend
    const safeOrigin = isValidCoord(tripStartLocation) ? tripStartLocation : null;
    const safeDestination = isValidCoord(tripDestination) ? tripDestination : null;

    return res.status(200).json({
      active: true,
      tripId: activeTrip._id,
      driverId: activeTrip.driverId,
      otp: activeTrip.otp,
      tripStatus: activeTrip.status,
      origin: safeOrigin,
      destination: safeDestination,
      driverCurrentLocation,
      driverDetails: {
        name: driver?.name,
        phone: driver?.phone,
        vehicleModel: vehicle?.vehicleModel,
        vehicleNumber: vehicle?.vehicleNumber,
        vehicleColor: vehicle?.color,
        vehicleType: vehicle?.vehicleType,
        estimatedDistance: activeTrip.estimatedDistance,
        estimatedDuration: activeTrip.estimatedDuration,
        fare: activeTrip.fare !== undefined ? activeTrip.fare : calculateFare(activeTrip.estimatedDistance || 0)
      }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
};