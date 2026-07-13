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
