import { connectedUsers, emitToUser } from '../connectionManager';
import VehicleModel from '@/models/vehicles/VehicleModel';
import DriverLocationModel from '@/models/location/DriverLocation';
import PassengerModel from '@/models/users/UserPassengerModel';
import DriverModel from '@/models/users/UserDriverModel';
import { TripModel } from '@/models/trip/TripModel';
import { calculateRouteMatch, calculateFare, applyVehicleFareModifier, estimateTripMetrics } from '@/utils/geometry';
import { passengerAvgRating } from '@/utils/rating';
import { getSeats, takeSeat } from '../utils/seats';

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

        const vehicle = await VehicleModel.findOne({ driverId: driverId });
        const currentSeats = vehicle ? (vehicle.availableSeats ?? vehicle.capacity) ?? 0 : 0;

        if (currentSeats <= 0) {
            emitToUser(io, passengerId, "ride-rejected", { driverId, reason: "Driver is full" });
            return;
        }

        // Calculate estimated distance and duration
        const { estimatedDistance, estimatedDuration } = estimateTripMetrics(origin, destination);

        // Calculate driver match percentage and fare
        let routeMatchPercentage = 0;
        let fare = 0;
        try {
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
                fare = applyVehicleFareModifier(calculateFare(estimatedDistance), vehicle?.vehicleType);
            }
        } catch (err) {
            console.error("Error calculating driver route match percentage or fare:", err);
        }

        // Passenger's average rating (drivers see this on the incoming request)
        let passengerRating: number | null = null;
        try {
            passengerRating = await passengerAvgRating(passengerId);
        } catch (err) {
            console.error("Error loading passenger rating:", err);
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
                fare,
                passengerRating
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
            const vehicle = await VehicleModel.findOne({ driverId: driverId }).select('_id');
            if (vehicle) vehicleId = vehicle._id;
        }

        // Decrement available seats
        if (vehicleId) {
            try {
                await takeSeat(vehicleId);
            } catch (error) {
                console.error("Error decrementing seats", error);
            }
        }

        // Generate OTP
        const otp = Math.floor(1000 + Math.random() * 9000).toString();

        // Get passenger name
        const passenger = await PassengerModel.findById(passengerId);
        const passengerName = passenger?.name || "Passenger";

        // Get driver details
        const driver = await DriverModel.findById(driverId);

        // Get vehicle details
        const vehicle = await VehicleModel.findOne({ driverId: driverId });

        // Calculate estimated distance, duration and fare
        const { estimatedDistance, estimatedDuration } = estimateTripMetrics(origin, destination);
        let fare = driverPassedFare !== undefined ? driverPassedFare : calculateFare(estimatedDistance);
        if (driverPassedFare === undefined) {
            fare = applyVehicleFareModifier(fare, vehicle?.vehicleType);
        }

        // Create trip
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
