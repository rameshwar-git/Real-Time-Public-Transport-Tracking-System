import { connectedUsers, emitToUser } from '../connectionManager';

/**
 * Registers trip lifecycle socket events:
 *  - verify-otp
 *  - dropoff-passenger
 *  - cancel-trip
 */
export function registerTripHandlers(io: any, socket: any, userId: string) {

    socket.on("verify-otp", async (data: any) => {
        const { tripId, otp } = data;
        const { TripModel } = require('@/models/trip/TripModel');
        const trip = await TripModel.findById(tripId);

        if (trip && trip.otp === otp) {
            trip.status = 'in_progress';
            await trip.save();

            emitToUser(io, trip.passengerId.toString(), "trip-started", { tripId });

            // Confirm to the driver that OTP was verified
            socket.emit("otp-verified", { tripId, status: 'in_progress' });
        } else {
            // Notify the driver that OTP verification failed
            socket.emit("otp-failed", { tripId, message: "Invalid OTP. Please try again." });
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
            trip.status = 'canceled';
            trip.endDate = new Date();
            await trip.save();

            // Restore seat
            const VehicleModel = require('@/models/vehicles/VehicleModel').default;
            const vehicle = await VehicleModel.findById(trip.vehicleId);
            if (vehicle) {
                const currentSeats = vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity;
                await VehicleModel.findByIdAndUpdate(trip.vehicleId, { availableSeats: currentSeats + 1 });
            }

            if (canceledBy === 'driver') {
                emitToUser(io, trip.passengerId.toString(), "trip-canceled", { tripId, reason: 'Driver canceled the trip' });
            } else if (canceledBy === 'passenger') {
                emitToUser(io, trip.driverId.toString(), "trip-canceled", { tripId, reason: 'Passenger canceled the trip' });
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
