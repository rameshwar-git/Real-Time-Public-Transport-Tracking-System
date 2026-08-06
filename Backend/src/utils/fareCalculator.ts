/**
 * Rounds a fare value to the nearest multiple of 5:
 * - If remainder of value % 5 is < 3, round down to the nearest multiple of 5.
 * - If remainder of value % 5 is >= 3, round up to the nearest multiple of 5.
 * @param value Price value to round
 * @returns Rounded value
 */
export const roundToNearestFive = (value: number): number => {
    const rem = value % 5;
    if (rem < 3) {
        return Math.floor(value / 5) * 5;
    } else {
        return Math.ceil(value / 5) * 5;
    }
};

/**
 * Calculates fare based on distance and vehicle type:
 * - 10 Rs for up to 2.5 km
 * - 2 Rs per km for additional distance over 2.5 km
 * - 0.8 modifier for tricycle
 * - 1.5 modifier for bus
 * @param distanceKm Distance in kilometers
 * @param vehicleType Optional vehicle type ('tricycle' | 'bus' etc.)
 * @returns Rounded fare in Rupees
 */
export const calculateFare = (distanceKm: number, vehicleType?: string): number => {
    if (!distanceKm || isNaN(distanceKm)) {
        return roundToNearestFive(10);
    }
    
    let fare = distanceKm <= 2.5 ? 10 : 10 + (distanceKm - 2.5) * 2;
    
    if (vehicleType === 'tricycle') {
        fare *= 0.8;
    } else if (vehicleType === 'bus') {
        fare *= 1.5;
    }

    return roundToNearestFive(Number(fare.toFixed(2)));
};

/**
 * Returns a trip's fare, falling back to a computed fare from its distance
 * when no fare was stored. Used across earnings/report endpoints.
 * @param trip Trip-like object with optional fare and estimatedDistance
 * @returns The stored or computed fare
 */
export const fareFor = (trip: { fare?: number; estimatedDistance?: number }): number =>
    trip.fare !== undefined ? trip.fare : calculateFare(trip.estimatedDistance || 0);

/**
 * Applies the per-vehicle fare modifier (tricycle 0.8x, bus 1.5x) to an
 * already-calculated base fare, then rounds to the nearest 5.
 * Used where the fare is computed and the modifier applied as separate steps.
 * @param baseFare Base fare (already rounded)
 * @param vehicleType Optional vehicle type ('tricycle' | 'bus' etc.)
 * @returns Modified and rounded fare
 */
export const applyVehicleFareModifier = (baseFare: number, vehicleType?: string | null): number => {
    let fare = baseFare;
    if (vehicleType === 'tricycle') {
        fare = Number((baseFare * 0.8).toFixed(2));
    } else if (vehicleType === 'bus') {
        fare = Number((baseFare * 1.5).toFixed(2));
    }
    return roundToNearestFive(fare);
};
