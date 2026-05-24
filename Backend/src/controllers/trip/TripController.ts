import { Request, Response } from 'express';
import { TripModel } from '@models/trip/TripModel';

// Create a new trip
export const createTrip = async (req: Request, res: Response) => {
	try {
		const trip = await TripModel.create(req.body);
		res.status(201).json(trip);
	} catch (err: any) {
		res.status(500).json({ error: err.message });
	}
};

// Update trip by passengerId
export const putTripPassenger = async (req: Request, res: Response) => {
	try {
		const { passengerId } = req.params;
		if (!passengerId) {
			return res.status(400).json({ error: 'TripId is required' });
		}
		const trip = await TripModel.findOneAndUpdate({ passengerId }, { ...req.body });
		res.status(200).json({ Status: 'SUCCESS' });
	} catch (err: any) {
		res.status(500).json({ Status: 'FAILED' });
	}
};

// Update trip by driverId
export const putTripDriver = async (req: Request, res: Response) => {
	try {
		const { driverId } = req.params;
		if (!driverId) {
			return res.status(400).json({ error: 'TripId is required' });
		}
		const trip = await TripModel.findOneAndUpdate({ driverId }, { ...req.body });
		res.status(200).json({ Status: 'SUCCESS' });
	} catch (err: any) {
		res.status(500).json({ Status: 'FAILED' });
	}
};

import DriverLocationModel from '@/models/location/DriverLocation';
import VehicleModel from '@/models/vehicles/VehicleModel';
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

        const validDrivers = [];
        for (const driver of onlineDrivers) {
            if (!driver.vehicleId) continue;
            
            const vehicle = await VehicleModel.findById(driver.vehicleId).lean();
            if (!vehicle) continue;
            
            const seats: number = (vehicle.availableSeats != null) ? Number(vehicle.availableSeats) : Number(vehicle.capacity || 4);
            if (seats <= 0) continue;

            const match = calculateRouteMatch(
                driver.currentLocation as any, 
                driver.destination as any, 
                origin, 
                destination
            );

            if (match.pickupDist <= 2 && match.isMatch) {
                validDrivers.push({ ...driver, pickupDist: match.pickupDist, availableSeats: seats });
            }
        }

        validDrivers.sort((a, b) => a.pickupDist - b.pickupDist);

        res.status(200).json(validDrivers);
    } catch (err: any) {
        res.status(500).json({ error: err.message });
    }
};
