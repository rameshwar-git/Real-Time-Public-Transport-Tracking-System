import { connectedUsers, userLocations, PROXIMITY_COMPLETION_RADIUS_KM, emitToUser } from '../connectionManager';

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
            const { TripModel } = require('@/models/trip/TripModel');
            const { getDistance } = require('@/utils/geometry');

            // --- Broadcast driver location to passenger ---
            const activeTrip = await TripModel.findOne({
                driverId: userId,
                status: { $in: ['scheduled', 'in_progress'] }
            });

            if (activeTrip) {
                const passengerSocketId = connectedUsers.get(activeTrip.passengerId.toString());
                if (passengerSocketId) {
                    io.to(passengerSocketId).emit("driver-location-updated", {
                        driverId: userId,
                        currentLocation
                    });
                }

                // --- Auto-complete trip when driver & passenger are > 40 m apart ---
                if (activeTrip.status === 'in_progress') {
                    const passengerLocation = userLocations.get(activeTrip.passengerId.toString());

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

                            // Restore vehicle seat
                            const VehicleModel = require('@/models/vehicles/VehicleModel').default;
                            const vehicle = await VehicleModel.findById(activeTrip.vehicleId);
                            if (vehicle) {
                                const currentSeats = vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity;
                                await VehicleModel.findByIdAndUpdate(activeTrip.vehicleId, { availableSeats: currentSeats + 1 });
                            }

                            // Notify passenger
                            emitToUser(io, activeTrip.passengerId.toString(), "trip-completed", {
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
