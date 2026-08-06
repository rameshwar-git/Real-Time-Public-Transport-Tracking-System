import { userLocations, PROXIMITY_COMPLETION_RADIUS_KM, emitToUser } from '../connectionManager';
import { TripModel } from '@/models/trip/TripModel';
import { getDistance } from '@/utils/geometry';
import { restoreSeat } from '../utils/seats';
import { broadcastDriverLocationToPassengers } from '../broadcastLocation';
import { broadcastPassengerLocationToDrivers } from '../broadcastLocation';

/**
 * Registers the `update-location` socket event.
 * Stores coords in memory, broadcasts driver location to passenger,
 * and runs proximity-based auto-complete checks.
 */
export function registerLocationHandler(io: any, socket: any, _userId: string) {

    socket.on("update-location", async (data: any) => {
        const { userId, currentLocation } = data;
        if (!userId || !currentLocation) return;

        // Always store the latest known location for this user
        userLocations.set(userId, {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
        });

        try {
            // --- Broadcast driver location (with live seats) to every passenger on the shared vehicle ---
            await broadcastDriverLocationToPassengers(io, userId, currentLocation);

            // --- Broadcast passenger live location to their assigned driver(s), so the driver
            // can show the passenger's live position + distance. No-op for driver emitters. ---
            await broadcastPassengerLocationToDrivers(io, userId, currentLocation);

            // --- Per-trip proximity auto-complete (driver & its passenger > 40 m apart) ---
            const activeTrips = await TripModel.find({
                driverId: userId,
                status: { $in: ['scheduled', 'in_progress'] }
            });

            for (const activeTrip of activeTrips) {
                const passengerId = activeTrip.passengerId.toString();

                if (activeTrip.status === 'in_progress') {
                    const passengerLocation = userLocations.get(passengerId);

                    if (passengerLocation) {
                        const distanceKm = getDistance(
                            currentLocation.latitude,
                            currentLocation.longitude,
                            passengerLocation.latitude,
                            passengerLocation.longitude
                        );

                        console.log(
                            `[Proximity] Trip ${activeTrip._id}: driver-passenger distance = ${(distanceKm * 1000).toFixed(1)} m` +
                            ` (threshold ${PROXIMITY_COMPLETION_RADIUS_KM * 1000} m)`
                        );

                        if (distanceKm > PROXIMITY_COMPLETION_RADIUS_KM) {
                            console.log(`[Proximity] Auto-completing trip ${activeTrip._id} — driver and passenger are more than 40 m apart.`);

                            activeTrip.status = 'completed';
                            activeTrip.endDate = new Date();
                            await activeTrip.save();

                            // Restore the exact number of seats this passenger booked
                            await restoreSeat(activeTrip.vehicleId, activeTrip.seatsRequested ?? 1);

                            // Notify passenger
                            emitToUser(io, passengerId, "trip-completed", {
                                tripId: activeTrip._id,
                                autoCompleted: true,
                                reason: 'proximity'
                            });

                            // Notify driver
                            emitToUser(io, userId, "trip-completed", {
                                tripId: activeTrip._id,
                                autoCompleted: true,
                                reason: 'proximity'
                            });
                        }
                    } else {
                        console.log(`[Proximity] Trip ${activeTrip._id}: passenger location not yet known — skipping proximity check.`);
                    }
                }
            }
        } catch (error) {
            console.error("Error in update-location socket broadcast:", error);
        }
    });
}
