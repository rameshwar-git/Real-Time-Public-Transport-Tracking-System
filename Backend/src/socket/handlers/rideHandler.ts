import { connectedUsers, emitToUser } from '../connectionManager';

/**
 * Registers ride-related socket events:
 *  - request-ride
 *  - cancel-request
 *  - accept-ride
 *  - reject-ride
 */
export function registerRideHandlers(io: any, socket: any, userId: string) {

    socket.on("request-ride", async (data: any) => {
        const { passengerId, driverId, origin, destination, passengerFare } = data;
        const driverSocketId = connectedUsers.get(driverId);

        const VehicleModel = require('@/models/vehicles/VehicleModel').default;
        const vehicle = await VehicleModel.findOne({ driverId: driverId });
        const currentSeats = vehicle ? (vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity) : 0;

        if (currentSeats <= 0) {
            emitToUser(io, passengerId, "ride-rejected", { driverId, reason: "Driver is full" });
            return;
        }

        // Calculate estimated distance and duration
        const { getDistance, calculateRouteMatch } = require('@/utils/geometry');
        let estimatedDistance = 0;
        let estimatedDuration = 0;
        if (origin && destination) {
            estimatedDistance = getDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
            estimatedDuration = Math.max(1, Math.round(estimatedDistance * 2.4));
        }

        // Calculate driver match percentage and fare
        let routeMatchPercentage = 0;
        let fare = 0;
        try {
            const DriverLocationModel = require('@/models/location/DriverLocation').default;
            const driverLocation = await DriverLocationModel.findOne({ userId: driverId }).lean();
            if (driverLocation && driverLocation.currentLocation && driverLocation.destination && origin && destination) {
                const match = calculateRouteMatch(
                    driverLocation.currentLocation,
                    driverLocation.destination,
                    origin,
                    destination
                );
                routeMatchPercentage = match.percentage;
            }

            if (passengerFare !== undefined) {
                fare = passengerFare;
            } else {
                const { calculateFare, roundToNearestFive } = require('@/utils/geometry');
                let baseFare = calculateFare(estimatedDistance);
                fare = baseFare;
                if (vehicle) {
                    if (vehicle.vehicleType === 'tricycle') {
                        fare = Number((baseFare * 0.8).toFixed(2));
                    } else if (vehicle.vehicleType === 'bus') {
                        fare = Number((baseFare * 1.5).toFixed(2));
                    }
                }
                fare = roundToNearestFive(fare);
            }
        } catch (err) {
            console.error("Error calculating driver route match percentage or fare:", err);
        }

        if (driverSocketId) {
            console.log(`Sending ride request to driver ${driverId} for passenger ${passengerId} with ${routeMatchPercentage.toFixed(0)}% match and fare ₹${fare}`);
            io.to(driverSocketId).emit("ride-request", {
                passengerId,
                origin,
                destination,
                estimatedDistance,
                estimatedDuration,
                routeMatchPercentage,
                fare
            });
        } else {
            console.log(`Driver ${driverId} not currently connected to sockets.`);
        }
    });

    socket.on("cancel-request", (data: any) => {
        const { driverId, passengerId } = data;
        emitToUser(io, driverId, "request-canceled", { passengerId });
    });

    socket.on("accept-ride", async (data: any) => {
        let { passengerId, driverId, vehicleId, origin, destination, fare: driverPassedFare } = data;
        const passengerSocketId = connectedUsers.get(passengerId);
        const driverSocketId = connectedUsers.get(driverId);

        if (!vehicleId && driverId) {
            const VehicleModel = require('@/models/vehicles/VehicleModel').default;
            const vehicle = await VehicleModel.findOne({ driverId: driverId }).select('_id');
            if (vehicle) vehicleId = vehicle._id;
        }

        // Decrement available seats
        if (vehicleId) {
            try {
                const VehicleModel = require('@/models/vehicles/VehicleModel').default;
                const vehicle = await VehicleModel.findById(vehicleId);
                if (vehicle) {
                    const currentSeats = vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity;
                    if (currentSeats > 0) {
                        await VehicleModel.findByIdAndUpdate(vehicleId, { availableSeats: currentSeats - 1 });
                    }
                }
            } catch (error) {
                console.error("Error decrementing seats", error);
            }
        }

        // Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Get passenger name
        const PassengerModel = require('@/models/users/UserPassengerModel').default;
        const passenger = await PassengerModel.findById(passengerId);
        const passengerName = passenger?.name || "Passenger";

        // Get driver details
        const DriverModel = require('@/models/users/UserDriverModel').default;
        const driver = await DriverModel.findById(driverId);

        // Get vehicle details
        const VehicleModel = require('@/models/vehicles/VehicleModel').default;
        const vehicle = await VehicleModel.findOne({ driverId: driverId });

        // Calculate estimated distance, duration and fare
        const { getDistance, calculateFare } = require('@/utils/geometry');
        let estimatedDistance = 0;
        let estimatedDuration = 0;
        if (origin && destination) {
            estimatedDistance = getDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude);
            estimatedDuration = Math.max(1, Math.round(estimatedDistance * 2.4));
        }
        let fare = driverPassedFare !== undefined ? driverPassedFare : calculateFare(estimatedDistance);
        if (driverPassedFare === undefined) {
            if (vehicle) {
                if (vehicle.vehicleType === 'tricycle') {
                    fare = Number((fare * 0.8).toFixed(2));
                } else if (vehicle.vehicleType === 'bus') {
                    fare = Number((fare * 1.5).toFixed(2));
                }
            }
            const { roundToNearestFive } = require('@/utils/geometry');
            fare = roundToNearestFive(fare);
        }

        // Create trip
        const { TripModel } = require('@/models/trip/TripModel');
        const trip = await TripModel.create({
            passengerId,
            driverId,
            vehicleId,
            passengerName,
            otp,
            startLocation: origin || { latitude: 0, longitude: 0 },
            destination: destination || { latitude: 0, longitude: 0 },
            estimatedDistance,
            estimatedDuration,
            fare,
            status: 'scheduled'
        });

        if (passengerSocketId) {
            io.to(passengerSocketId).emit("ride-accepted", {
                tripId: trip._id,
                driverId,
                driverName: driver?.name,
                driverPhone: driver?.phone,
                vehicleId,
                vehicleModel: vehicle?.vehicleModel,
                vehicleNumber: vehicle?.vehicleNumber,
                vehicleColor: vehicle?.color,
                vehicleType: vehicle?.vehicleType,
                otp,
                estimatedDistance,
                estimatedDuration,
                fare
            });
        }

        if (driverSocketId) {
            io.to(driverSocketId).emit("trip-created", {
                tripId: trip._id,
                passengerId,
                passengerName,
                origin,
                destination,
                estimatedDistance,
                estimatedDuration,
                fare,
                status: 'scheduled'
            });
        }
    });

    socket.on("reject-ride", (data: any) => {
        const { passengerId, driverId } = data;
        emitToUser(io, passengerId, "ride-rejected", { driverId });
    });
}
