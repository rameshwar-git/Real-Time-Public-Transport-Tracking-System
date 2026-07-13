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

            if (match.pickupDist <= 2 && match.isMatch) {
                const driverInfo = await DriverModel.findById(driver.userId).lean();
                const driverName = driverInfo ? driverInfo.name : 'Unknown Driver';
                const driverPhone = driverInfo ? driverInfo.phone : '';

                validDrivers.push({ 
                    ...driver, 
                    pickupDist: match.pickupDist, 
                    routeMatchPercentage: match.percentage,
                    availableSeats: seats,
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
        
        // Sort by RouteMatch percentage (descending) first, then by pickup distance (ascending)
        validDrivers.sort((a, b) => {
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
