/**
 * Calculates fare based on distance:
 * - 10 Rs for up to 2.5 km
 * - 2 Rs per km for additional distance over 2.5 km
 * @param distanceKm Distance in kilometers
 * @returns Fare in Rupees (rounded to 2 decimal places)
 */
export const calculateFare = (distanceKm: number): number => {
    if (!distanceKm || isNaN(distanceKm)) return 10;
    if (distanceKm <= 2.5) {
        return 10;
    } else {
        return Number((10 + (distanceKm - 2.5) * 2).toFixed(2));
    }
};

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
