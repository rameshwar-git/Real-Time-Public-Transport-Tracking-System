/**
 * Calculate the distance between two points on Earth using the Haversine formula.
 * @param lat1 Latitude of point 1
 * @param lon1 Longitude of point 1
 * @param lat2 Latitude of point 2
 * @param lon2 Longitude of point 2
 * @returns Distance in kilometers
 */
export const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // Radius of the Earth in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

/**
 * Interface representing a simple geographic coordinate.
 */
export interface Coords {
    latitude: number;
    longitude: number;
}

/**
 * Handle null or undefined coordinates safely.
 */
export type MaybeCoords = Coords | null | undefined;

/**
 * Checks if a driver's route matches a passenger's desired route.
 * @param driverLoc Current location of the driver
 * @param driverDest Destination of the driver
 * @param passOrigin Pickup point of the passenger
 * @param passDest Drop-off point of the passenger
 * @returns Boolean indicating a match and the match percentage
 */
export const calculateRouteMatch = (
    driverLoc: Coords,
    driverDest: Coords,
    passOrigin: Coords,
    passDest: Coords
) => {
    const driverRouteDist = getDistance(driverLoc.latitude, driverLoc.longitude, driverDest.latitude, driverDest.longitude) || 1;
    const passRouteDist = getDistance(passOrigin.latitude, passOrigin.longitude, passDest.latitude, passDest.longitude);
    
    const distToPassenger = getDistance(driverLoc.latitude, driverLoc.longitude, passOrigin.latitude, passOrigin.longitude);
    const distToDest = getDistance(driverDest.latitude, driverDest.longitude, passDest.latitude, passDest.longitude);

    // Percentage of driver route overlap
    const destinationMatchPercentage = Math.max(0, 100 - (distToDest / driverRouteDist) * 100);
    
    // Detour logic: driver goes to passenger -> destination -> final destination
    const totalDetourDist = distToPassenger + passRouteDist + distToDest;
    const isRouteMatch = totalDetourDist <= (driverRouteDist * 1.5);

    return {
        isMatch: destinationMatchPercentage >= 80 || isRouteMatch,
        percentage: destinationMatchPercentage,
        detourDist: totalDetourDist,
        pickupDist: distToPassenger
    };
};

/**
 * Finds the nearest user from a list of users based on current location.
 * @param users List of user objects with currentLocation
 * @param origin Source location to measure from
 * @returns The nearest user object or null
 */
export const findNearestUser = <T extends { currentLocation?: MaybeCoords }>(users: T[], origin: Coords): T | null => {
    if (users.length === 0) return null;

    let nearest: T | null = null;
    let minDistance = Infinity;

    for (const u of users) {
        if (!u.currentLocation) continue;
        const dist = getDistance(origin.latitude, origin.longitude, u.currentLocation.latitude, u.currentLocation.longitude);
        if (dist < minDistance) {
            minDistance = dist;
            nearest = u;
        }
    }

    return nearest;
};

/**
 * Finds the top N nearest users from a list.
 * @param users List of user objects with currentLocation
 * @param origin Source location to measure from
 * @param n Number of users to return
 * @returns Array of nearest users (original objects with an added dist property)
 */
export const getNearestNUsers = <T extends { currentLocation?: MaybeCoords }>(
    users: T[],
    origin: Coords,
    n: number
): (T & { dist: number })[] => {
    if (!users.length) return [];

    return users
        .filter(u => u.currentLocation)
        .map(u => ({
            ...u,
            dist: getDistance(
                origin.latitude,
                origin.longitude,
                u.currentLocation!.latitude,
                u.currentLocation!.longitude
            )
        }))
        .sort((a, b) => a.dist - b.dist)
        .slice(0, n);
};
