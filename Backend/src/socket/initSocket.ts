import PassengerModel from "@/models/users/UserPassengerModel";
import { connectedUsers, disconnectTimeouts } from './connectionManager';
import { registerRideHandlers } from './handlers/rideHandler';
import { registerTripHandlers } from './handlers/tripHandler';
import { registerLocationHandler } from './handlers/locationHandler';
import { registerDisconnectHandler } from './handlers/disconnectHandler';

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

        // Register all modular handlers
        registerRideHandlers(io, socket, userId);
        registerTripHandlers(io, socket, userId);
        registerLocationHandler(io, socket, userId);
        registerDisconnectHandler(io, socket, userId);
    });
}