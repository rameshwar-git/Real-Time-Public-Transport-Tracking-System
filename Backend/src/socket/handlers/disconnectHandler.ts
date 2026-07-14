import { connectedUsers, disconnectTimeouts, emitToUser } from '../connectionManager';

/**
 * Registers the `disconnect` socket event.
 * Marks user offline, and sets a 5-minute auto-complete timer
 * for any active driver trips.
 */
export function registerDisconnectHandler(io: any, socket: any, userId: string) {

    socket.on("disconnect", async () => {
        if (userId) {
            connectedUsers.delete(userId);

            const PassengerModel = require('@/models/users/UserPassengerModel').default;
            await PassengerModel.findByIdAndUpdate(userId, {
                status: "OFFLINE",
                lastSeen: new Date(),
            });

            const DriverModel = require('@/models/users/UserDriverModel').default;
            await DriverModel.findByIdAndUpdate(userId, {
                status: "OFFLINE",
                lastSeen: new Date(),
            });

            // Auto-complete ongoing rides if a driver stays offline for more than 5 minutes
            try {
                const { TripModel } = require('@/models/trip/TripModel');
                const activeTripsCount = await TripModel.countDocuments({
                    driverId: userId,
                    status: { $in: ['scheduled', 'in_progress'] }
                });

                if (activeTripsCount > 0) {
                    console.log(`Driver ${userId} went offline with ${activeTripsCount} active ongoing trip(s). Starting 5-minute auto-complete timer...`);

                    if (disconnectTimeouts.has(userId)) {
                        clearTimeout(disconnectTimeouts.get(userId)!);
                    }

                    const timeout = setTimeout(async () => {
                        disconnectTimeouts.delete(userId);
                        console.log(`Driver ${userId} remained offline for >5 minutes. Auto-completing ongoing rides...`);

                        try {
                            const activeTrips = await TripModel.find({
                                driverId: userId,
                                status: { $in: ['scheduled', 'in_progress'] }
                            });

                            for (const trip of activeTrips) {
                                trip.status = 'completed';
                                trip.endDate = new Date();
                                await trip.save();

                                // Restore vehicle seat
                                const VehicleModel = require('@/models/vehicles/VehicleModel').default;
                                const vehicle = await VehicleModel.findById(trip.vehicleId);
                                if (vehicle) {
                                    const currentSeats = vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity;
                                    await VehicleModel.findByIdAndUpdate(trip.vehicleId, { availableSeats: currentSeats + 1 });
                                }

                                // Notify passenger if connected
                                emitToUser(io, trip.passengerId.toString(), "trip-completed", { tripId: trip._id, autoCompleted: true });
                            }
                        } catch (err) {
                            console.error(`Error auto-completing rides for offline driver ${userId}:`, err);
                        }
                    }, 5 * 60 * 1000); // 5 minutes

                    disconnectTimeouts.set(userId, timeout);
                }
            } catch (error) {
                console.error("Error setting offline timer for driver:", error);
            }
        }
        console.log("User disconnected");
    });
}
