import { TripModel } from '@/models/trip/TripModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
import { connectedUsers } from './connectionManager';

/**
 * Push a driver's live location to every passenger currently riding with them
 * (a public-transport vehicle may carry multiple concurrent passengers).
 *
 * Used by BOTH the socket `update-location` handler and the REST
 * `updateDriverLocation` controller, so that a driver who keeps sharing from the
 * background (REST only, no live socket) still updates their onboarded passengers
 * in real time.
 */
export const broadcastDriverLocationToPassengers = async (
    io: any,
    driverId: string,
    currentLocation: { latitude: number; longitude: number }
): Promise<void> => {
    const activeTrips = await TripModel.find({
        driverId,
        status: { $in: ['scheduled', 'in_progress'] }
    });
    if (activeTrips.length === 0) return;

    // Live seat count goes out with each update so passengers see remaining seats change.
    let availableSeats: number | null = null;
    try {
        const vehicle = activeTrips[0].vehicleId
            ? await VehicleModel.findById(activeTrips[0].vehicleId).lean()
            : null;
        availableSeats = vehicle
            ? Number((vehicle.availableSeats ?? vehicle.capacity) ?? null)
            : null;
    } catch (err) {
        console.error('Error loading vehicle seats for location broadcast:', err);
    }

    // Notify each distinct passenger exactly once.
    const seen = new Set<string>();
    for (const trip of activeTrips) {
        const passengerId = trip.passengerId.toString();
        if (seen.has(passengerId)) continue;
        seen.add(passengerId);
        const sid = connectedUsers.get(passengerId);
        if (sid) {
            io.to(sid).emit('driver-location-updated', {
                driverId,
                currentLocation,
                availableSeats,
                seatsUpdated: true,
            });
        }
    }
};
