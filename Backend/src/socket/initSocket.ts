import PassengerModel from "@/models/users/UserPassengerModel";

const connectedUsers = new Map<string, string>(); // userId -> socketId
const disconnectTimeouts = new Map<string, NodeJS.Timeout>(); // driverId -> timeout map
const userLocations = new Map<string, { latitude: number; longitude: number }>(); // userId -> latest coords

// Radius threshold in km (40 metres = 0.04 km)
const PROXIMITY_COMPLETION_RADIUS_KM = 0.04;

export default function initSocket(io: any) {
    io.on("connection", (socket: any) => {
        console.log("User connected");

        const userId = socket.handshake.auth.userId;
        if (userId) {
            connectedUsers.set(userId, socket.id);

            // Cancel any pending auto-completion timeout if driver reconnects within 5 minutes
            if (disconnectTimeouts.has(userId)) {
                clearTimeout(disconnectTimeouts.get(userId)!);
                disconnectTimeouts.delete(userId);
                console.log(`Driver ${userId} reconnected within 5 minutes. Auto-completion timer cleared.`);
            }
        }

        // ONLINE
        socket.on("go-online", async () => {
            if (userId) {
                await PassengerModel.findByIdAndUpdate(userId, {
                    status: "ONLINE",
                    lastSeen: new Date(),
                });
            }
        });

        socket.on("request-ride", async (data: any) => {
            const { passengerId, driverId, origin, destination, passengerFare } = data;
            const driverSocketId = connectedUsers.get(driverId);

            const VehicleModel = require('@/models/vehicles/VehicleModel').default;
            const vehicle = await VehicleModel.findOne({ driverId: driverId });
            const currentSeats = vehicle ? (vehicle.availableSeats !== undefined ? vehicle.availableSeats : vehicle.capacity) : 0;

            if (currentSeats <= 0) {
                const passengerSocketId = connectedUsers.get(passengerId);
                if (passengerSocketId) {
                    io.to(passengerSocketId).emit("ride-rejected", { driverId, reason: "Driver is full" });
                }
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
            const driverSocketId = connectedUsers.get(driverId);
            if (driverSocketId) {
                io.to(driverSocketId).emit("request-canceled", { passengerId });
            }
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

        socket.on("verify-otp", async (data: any) => {
            const { tripId, otp } = data;
            const { TripModel } = require('@/models/trip/TripModel');
            const trip = await TripModel.findById(tripId);

            if (trip && trip.otp === otp) {
                trip.status = 'in_progress';
                await trip.save();

                const passengerSocketId = connectedUsers.get(trip.passengerId.toString());
                if (passengerSocketId) {
                    io.to(passengerSocketId).emit("trip-started", { tripId });
                }

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

                const passengerSocketId = connectedUsers.get(trip.passengerId.toString());
                if (passengerSocketId) {
                    io.to(passengerSocketId).emit("trip-completed", { tripId });
                }
            }
        });

        socket.on("reject-ride", (data: any) => {
            const { passengerId, driverId } = data;
            const passengerSocketId = connectedUsers.get(passengerId);
            if (passengerSocketId) {
                io.to(passengerSocketId).emit("ride-rejected", { driverId });
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

                const passengerSocketId = connectedUsers.get(trip.passengerId.toString());
                const driverSocketId = connectedUsers.get(trip.driverId.toString());

                if (canceledBy === 'driver' && passengerSocketId) {
                    io.to(passengerSocketId).emit("trip-canceled", { tripId, reason: 'Driver canceled the trip' });
                } else if (canceledBy === 'passenger' && driverSocketId) {
                    io.to(driverSocketId).emit("trip-canceled", { tripId, reason: 'Passenger canceled the trip' });
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
                                if (passengerSocketId) {
                                    io.to(passengerSocketId).emit("trip-completed", {
                                        tripId: activeTrip._id,
                                        autoCompleted: true,
                                        reason: 'proximity'
                                    });
                                }

                                // Notify driver
                                const driverSocketId = connectedUsers.get(userId);
                                if (driverSocketId) {
                                    io.to(driverSocketId).emit("trip-completed", {
                                        tripId: activeTrip._id,
                                        autoCompleted: true,
                                        reason: 'proximity'
                                    });
                                }
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

        // OFFLINE
        socket.on("disconnect", async () => {
            if (userId) {
                connectedUsers.delete(userId);
                
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
                                    const passengerSocketId = connectedUsers.get(trip.passengerId.toString());
                                    if (passengerSocketId) {
                                        io.to(passengerSocketId).emit("trip-completed", { tripId: trip._id, autoCompleted: true });
                                    }
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
    });
}