import { connectedUsers, userLocations, PROXIMITY_COMPLETION_RADIUS_KM, emitToUser } from '../connectionManager';
import { TripModel } from '@/models/trip/TripModel';
import VehicleModel from '@/models/vehicles/VehicleModel';
import { getDistance } from '@/utils/geometry';
import { restoreSeat } from '../utils/seats';

/**
 * Registers the `update-location` socket event.
 * Stores coords in memory, broadcasts driver location to passenger,
 * and runs proximity-based auto-complete checks.
 */
export function registerLocationHandler(io: any, socket: any, userId: string) {

    socket.on("update-location", async (data: any) => {
        const { userId, currentLocation } = data;
        if (!userId || !currentLocation) return;

        // Always store the latest known location for this user
        userLocations.set(userId, {
            latitude: currentLocation.latitude,
            longitude: currentLocation.longitude,
        });

        try {
            // --- Broadcast driver location to every passenger on the shared vehicle ---
            // A public-transport vehicle can carry MULTIPLE passengers concurrently (they all
            // booked seats on the same driver/vehicle heading to the same destination), so we
            // must consider all of the driver's active trips, not just the first one.
            const activeTrips = await TripModel.find({
                driverId: userId,
                status: { $in: ['scheduled', 'in_progress'] }
            });

            if (activeTrips.length > 0) {
                // Live seat count goes out with every location ping so each passenger sees
                // the remaining seats update in real time while the driver moves.
                let availableSeats: number | null = null;
                try {
                    const vehicle = activeTrips[0].vehicleId
                        ? await VehicleModel.findById(activeTrips[0].vehicleId).lean()
                        : null;
                    availableSeats = vehicle
                        ? ((vehicle.availableSeats ?? vehicle.capacity) ?? null)
                        : null;
                    if (availableSeats != null) availableSeats = Number(availableSeats);
                } catch (err) {
                    console.error("Error loading vehicle seats for location broadcast:", err);
                }

                // Track already-notified passengers so each is pinged exactly once per update.
                const notifiedPassengers = new Set<string>();

                for (const activeTrip of activeTrips) {
                    const passengerId = activeTrip.passengerId.toString();
                    if (notifiedPassengers.has(passengerId)) continue;
                    notifiedPassengers.add(passengerId);

                    const passengerSocketId = connectedUsers.get(passengerId);
                    if (passengerSocketId) {
                        io.to(passengerSocketId).emit("driver-location-updated", {
                            driverId: userId,
                            currentLocation,
                            availableSeats,
                            seatsUpdated: true
                        });
                    }

                    // --- Auto-complete a trip when the driver & its passenger are > 40 m apart ---
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
            }
        } catch (error) {
            console.error("Error in update-location socket broadcast:", error);
        }
    });
}
