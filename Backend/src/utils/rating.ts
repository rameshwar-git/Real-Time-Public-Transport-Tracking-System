/**
 * Rating helpers.
 *
 * Each trip holds two ratings:
 *  - `rating`        → driver's rating of the passenger (used for passenger's average)
 *  - `driverRating`  → passenger's rating of the driver (used for driver's average)
 */
import { TripModel } from '@models/trip/TripModel';

/** Average rating a passenger has received from drivers (driver's ratings of them). */
export const passengerAvgRating = async (passengerId: string): Promise<number | null> => {
    const trips = await TripModel.find({
        passengerId,
        rating: { $exists: true, $ne: null },
    })
        .select('rating')
        .lean();

    if (trips.length === 0) return null;

    const total = trips.reduce((sum, trip) => sum + (trip.rating as number), 0);
    return Number((total / trips.length).toFixed(1));
};

/** Average rating a driver has received from passengers (passengers' ratings of them). */
export const driverAvgRating = async (driverId: string): Promise<number | null> => {
    const trips = await TripModel.find({
        driverId,
        driverRating: { $exists: true, $ne: null },
    })
        .select('driverRating')
        .lean();

    if (trips.length === 0) return null;

    const total = trips.reduce((sum, trip) => sum + (trip.driverRating as number), 0);
    return Number((total / trips.length).toFixed(1));
};
