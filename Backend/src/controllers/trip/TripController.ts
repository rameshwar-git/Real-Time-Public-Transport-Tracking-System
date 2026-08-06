import { Request, Response } from 'express';
import { TripModel } from '@models/trip/TripModel';
import { AuthRequest } from '@/middleware/verifyToken';
import { driverAvgRating } from '@/utils/rating';

// Create a new trip
export const createTrip = async (req: Request, res: Response) => {
    try {
        const trip = await TripModel.create(req.body);
        res.status(201).json(trip);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Update trip by a single user field (passengerId or driverId)
const updateTripBy = async (field: 'passengerId' | 'driverId', req: Request, res: Response) => {
    try {
        const { [field]: id } = req.params;
        if (!id) {
            return res.status(400).json({ error: 'TripId is required' });
        }
        await TripModel.findOneAndUpdate({ [field]: id }, { ...req.body });
        res.status(200).json({ Status: 'SUCCESS' });
    } catch (err: any) {
        res.status(500).json({ Status: 'FAILED' });
    }
};

// Update trip by passengerId
export const putTripPassenger = (req: Request, res: Response) => updateTripBy('passengerId', req, res);

// Update trip by driverId
export const putTripDriver = (req: Request, res: Response) => updateTripBy('driverId', req, res);

import DriverLocationModel from '@/models/location/DriverLocation';
import VehicleModel from '@/models/vehicles/VehicleModel';
import DriverModel from '@/models/users/UserDriverModel';
import { calculateRouteMatch } from '@/utils/geometry';

export const findDrivers = async (req: Request, res: Response) => {
    try {
        const { origin, destination } = req.body;
        if (!origin || !destination) {
            return res.status(400).json({ error: 'Origin and destination are required' });
        }

        const onlineDrivers = await DriverLocationModel.find({
            status: { $in: ['on-duty', 'active', 'confirmed'] },
            'currentLocation.latitude': { $exists: true },
            'destination.latitude': { $exists: true }
        }).lean();

        console.log(`[findDrivers] Passenger origin: ${JSON.stringify(origin)}, dest: ${JSON.stringify(destination)}`);
        console.log(`[findDrivers] Found ${onlineDrivers.length} on-duty drivers with destinations`);

        const validDrivers = [];
        for (const driver of onlineDrivers) {
            if (!driver.vehicleId) { console.log(`[findDrivers] Driver ${driver.userId}: SKIP (no vehicleId)`); continue; }

            const vehicle = await VehicleModel.findById(driver.vehicleId).lean();
            if (!vehicle) { console.log(`[findDrivers] Driver ${driver.userId}: SKIP (vehicle not found)`); continue; }

            const seats: number = (vehicle.availableSeats != null) ? Number(vehicle.availableSeats) : Number(vehicle.capacity || 4);
            if (seats <= 0) { console.log(`[findDrivers] Driver ${driver.userId}: SKIP (no seats)`); continue; }

            const match = calculateRouteMatch(
                driver.currentLocation as any,
                driver.destination as any,
                origin,
                destination
            );

            console.log(`[findDrivers] Driver ${driver.userId}: percentage=${match.percentage.toFixed(1)}%, pickupDist=${match.pickupDist.toFixed(2)}km, isMatch=${match.isMatch}`);

            if (match.pickupDist <= 5 && match.isMatch) {
                const driverInfo = await DriverModel.findById(driver.userId).lean();
                const driverName = driverInfo ? driverInfo.name : 'Unknown Driver';
                const driverPhone = driverInfo ? driverInfo.phone : '';

                // Driver's average rating from passenger ratings (higher-rated drivers get priority)
                const rating = await driverAvgRating(driver.userId as any);

                validDrivers.push({
                    ...driver,
                    pickupDist: match.pickupDist,
                    routeMatchPercentage: match.percentage,
                    availableSeats: seats,
                    rating,
                    driverDetails: {
                        name: driverName,
                        phone: driverPhone
                    },
                    vehicleDetails: {
                        vehicleType: vehicle.vehicleType,
                        vehicleModel: vehicle.vehicleModel,
                        vehicleNumber: vehicle.vehicleNumber,
                        color: vehicle.color
                    }
                });
            }
        }

        console.log(`[findDrivers] Result: ${validDrivers.length} valid drivers`);

        // Sort by rating (descending) first so higher-rated drivers get the request
        // first, then by RouteMatch percentage (descending), then pickup distance.
        validDrivers.sort((a, b) => {
            const ra = a.rating ?? 0;
            const rb = b.rating ?? 0;
            if (rb !== ra) {
                return rb - ra;
            }
            if (b.routeMatchPercentage !== a.routeMatchPercentage) {
                return b.routeMatchPercentage - a.routeMatchPercentage;
            }
            return a.pickupDist - b.pickupDist;
        });

        // Limit to top 10 drivers
        const top10Drivers = validDrivers.slice(0, 10);
        console.log(`[findDrivers] Returning top ${top10Drivers.length} drivers`);

        res.status(200).json(top10Drivers);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};

// Validate rating input; returns an error message string or null when valid
const validateRatingInput = (tripId: any, rating: any): string | null => {
    if (!tripId) {
        return 'Trip ID is required';
    }
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return 'Rating must be a number between 1 and 5';
    }
    return null;
};

// Passenger rates a driver (sets driverRating on the trip)
export const rateDriver = async (req: AuthRequest, res: Response) => {
    try {
        const passengerId = req.user!.id;
        const { tripId } = req.params;
        const { rating } = req.body;

        const validationError = validateRatingInput(tripId, rating);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Atomically set the rating ONLY if it hasn't been set yet — this enforces
        // one review per trip per direction (a passenger can't rate the same driver
        // many times and keep skewing the driver's running average), and is safe
        // against concurrent duplicate submits.
        const trip = await TripModel.findOneAndUpdate(
            { _id: tripId, passengerId, driverRating: { $exists: false } },
            { $set: { driverRating: Math.round(rating) } },
            { new: true }
        );

        if (!trip) {
            const owned = await TripModel.exists({ _id: tripId, passengerId });
            if (!owned) {
                return res.status(404).json({ error: 'Trip not found for this passenger' });
            }
            return res.status(400).json({ error: 'You have already rated this driver for this trip' });
        }

        return res.status(200).json({ Status: 'SUCCESS', driverRating: trip.driverRating });
    } catch (err: any) {
        return res.status(500).json({ Status: 'FAILED', error: err.message });
    }
};

// Driver rates a passenger (sets rating on the trip)
export const ratePassenger = async (req: AuthRequest, res: Response) => {
    try {
        const driverId = req.user!.id;
        const { tripId } = req.params;
        const { rating } = req.body;

        const validationError = validateRatingInput(tripId, rating);
        if (validationError) {
            return res.status(400).json({ error: validationError });
        }

        // Atomically set the rating ONLY if it hasn't been set yet — this enforces
        // one review per trip per direction (a driver can't rate the same passenger
        // many times and keep skewing the passenger's running average), and is safe
        // against concurrent duplicate submits.
        const trip = await TripModel.findOneAndUpdate(
            { _id: tripId, driverId, rating: { $exists: false } },
            { $set: { rating: Math.round(rating) } },
            { new: true }
        );

        if (!trip) {
            const owned = await TripModel.exists({ _id: tripId, driverId });
            if (!owned) {
                return res.status(404).json({ error: 'Trip not found for this driver' });
            }
            return res.status(400).json({ error: 'You have already rated this passenger for this trip' });
        }

        return res.status(200).json({ Status: 'SUCCESS', rating: trip.rating });
    } catch (err: any) {
        return res.status(500).json({ Status: 'FAILED', error: err.message });
    }
};
