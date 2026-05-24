import PassengerModel from "@/models/users/UserPassengerModel";

const connectedUsers = new Map<string, string>(); // userId -> socketId

export default function initSocket(io:any) {
  io.on("connection", (socket:any) => {
    console.log("User connected");

    const userId = socket.handshake.auth.userId;
    if (userId) {
        connectedUsers.set(userId, socket.id);
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
        const { passengerId, driverId, origin, destination } = data;
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

        if (driverSocketId) {
            console.log(`Sending ride request to driver ${driverId} for passenger ${passengerId}`);
            io.to(driverSocketId).emit("ride-request", { passengerId, origin, destination });
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
        let { passengerId, driverId, vehicleId, origin, destination } = data;
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
            status: 'scheduled'
        });

        if (passengerSocketId) {
            io.to(passengerSocketId).emit("ride-accepted", { 
                tripId: trip._id, 
                driverId, 
                driverName: driver?.name, 
                vehicleId,
                otp
            });
        }
        
        if (driverSocketId) {
            io.to(driverSocketId).emit("trip-created", {
                tripId: trip._id,
                passengerId,
                passengerName,
                origin,
                destination,
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
            }
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
      }
      console.log("User disconnected");
    });
  });
}