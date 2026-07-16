import { connectedUsers, emitToUser } from '../connectionManager';

/**
 * Registers trip lifecycle socket events:
 *  - verify-otp
 *  - dropoff-passenger
 *  - cancel-trip
 */
export function registerTripHandlers(io: any, socket: any, userId: string) {

    socket.on("start-trip", async (data: any) => {
        const { tripId } = data;
        console.log(`[start-trip] Driver initiated start-trip for tripId: ${tripId}`);
        try {
            const { TripModel } = require('@/models/trip/TripModel');
            const trip = await TripModel.findById(tripId);

            if (!trip) {
                console.error(`[start-trip] Trip not found: ${tripId}`);
                socket.emit("trip-start-error", { message: "Trip not found." });
                return;
            }

            console.log(`[start-trip] Trip found. passengerId: ${trip.passengerId}, current status: ${trip.status}`);

            trip.status = 'in_progress';
            await trip.save();

            const passengerId = trip.passengerId.toString();
            const emitted = emitToUser(io, passengerId, "trip-started", { tripId });
            console.log(`[start-trip] Emitted trip-started to passenger ${passengerId}: ${emitted ? 'SUCCESS' : 'FAILED (passenger offline)'}`);

            // Confirm to the driver that trip was started
            socket.emit("trip-started", { tripId, status: 'in_progress' });
        } catch (err) {
            console.error(`[start-trip] Error:`, err);
        }
    });

    socket.on("dropoff-passenger", async (data: any) => {
        const { tripId } = data;
        const { TripModel } = require('@/models/trip/TripModel');
        const trip = await TripModel.findById(tripId);

        if (trip && trip.status === 'in_progress') {
            trip.status = 'completed';
            trip.endDate = new Date();
            await trip.save();

            // Restore seat
            const VehicleModel = require('@/models/vehicles/VehicleModel').default;
            const vehicle = await VehicleModel.findById(trip.vehicleId);
            if (vehicle) {
                const currentSeats = vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity;
                await VehicleModel.findByIdAndUpdate(trip.vehicleId, { availableSeats: currentSeats + 1 });
            }

            emitToUser(io, trip.passengerId.toString(), "trip-completed", { tripId });
        }
    });

    socket.on("cancel-trip", async (data: any) => {
        const { tripId, canceledBy } = data;
        const { TripModel } = require('@/models/trip/TripModel');
        const trip = await TripModel.findById(tripId);

        if (trip && trip.status !== 'completed' && trip.status !== 'canceled') {
            if (trip.status === 'in_progress' && canceledBy === 'passenger') {
                socket.emit("trip-cancel-error", { message: "Cannot cancel a trip that is already in progress." });
                return;
            }

            trip.status = 'canceled';
            trip.endDate = new Date();
            await trip.save();

            // Restore seat
            if (trip.vehicleId) {
                const VehicleModel = require('@/models/vehicles/VehicleModel').default;
                const vehicle = await VehicleModel.findById(trip.vehicleId);
                if (vehicle) {
                    const currentSeats = vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity;
                    await VehicleModel.findByIdAndUpdate(trip.vehicleId, { availableSeats: currentSeats + 1 });
                }
            }

            // Notify both parties
            const reason = canceledBy === 'driver' ? 'Driver canceled the trip' : 'Passenger canceled the trip';
            emitToUser(io, trip.passengerId.toString(), "trip-canceled", { tripId, reason });
            emitToUser(io, trip.driverId.toString(), "trip-canceled", { tripId, reason });

            if (canceledBy === 'passenger') {
                try {
                    const DriverLocationModel = require('@/models/location/DriverLocation').default;
                    await DriverLocationModel.findOneAndUpdate(
                        { userId: trip.driverId },
                        { status: 'on-duty' }
                    );
                } catch (err) {
                    console.error("Error keeping driver on-duty status:", err);
                }
            }
        }
    });
}
