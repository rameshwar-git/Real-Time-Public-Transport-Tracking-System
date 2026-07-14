/**
 * Shared state and helpers for socket connection management.
 * All socket handlers import from here instead of keeping their own maps.
 */

// userId -> socketId
export const connectedUsers = new Map<string, string>();

// driverId -> auto-complete timeout
export const disconnectTimeouts = new Map<string, NodeJS.Timeout>();

// userId -> latest coords (in-memory cache for proximity checks)
export const userLocations = new Map<string, { latitude: number; longitude: number }>();

// Radius threshold in km (40 metres = 0.04 km)
export const PROXIMITY_COMPLETION_RADIUS_KM = 0.04;

/** Look up a user's current socket ID. Returns undefined if offline. */
export const getSocketId = (userId: string): string | undefined =>
    connectedUsers.get(userId);

/** Emit an event to a specific user if they are connected. */
export const emitToUser = (io: any, userId: string, event: string, data: any): boolean => {
    const sid = connectedUsers.get(userId);
    if (sid) {
        io.to(sid).emit(event, data);
        return true;
    }
    return false;
};
