export interface Coords {
    latitude: number;
    longitude: number;
}

export type MaybeCoords = Coords | null | undefined;

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
        .filter(u => u.currentLocation && u.currentLocation.latitude && u.currentLocation.longitude)
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
