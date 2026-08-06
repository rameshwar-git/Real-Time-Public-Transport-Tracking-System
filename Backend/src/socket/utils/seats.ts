import VehicleModel from '@/models/vehicles/VehicleModel';

/**
 * Seat helpers shared by all socket handlers.
 * Handles the same available-seats / capacity fallback logic that was
 * previously duplicated inline in every handler (no behavior change).
 */

/** Seat count fallback: use availableSeats, else capacity, else 0. */
const seatCount = (vehicle: any): number => (vehicle.availableSeats ?? vehicle.capacity) ?? 0;

/** Get the current number of available seats for a vehicle (falling back to capacity). */
export const getSeats = async (vehicleId: any): Promise<number> => {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) return 0;
    return seatCount(vehicle);
};

/**
 * Decrement a vehicle's available seat count by `count` (default 1), if enough
 * seats remain. Returns the new available-seat count, or null when the vehicle
 * is missing / there are insufficient seats (nothing is changed).
 */
export const takeSeat = async (vehicleId: any, count: number = 1): Promise<number | null> => {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) return null;
    const currentSeats = seatCount(vehicle);
    const requested = Math.max(1, Math.floor(count) || 1);
    if (currentSeats < requested) return null;
    const newSeats = currentSeats - requested;
    await VehicleModel.findByIdAndUpdate(vehicleId, { availableSeats: newSeats });
    return newSeats;
};

/** Increment the available seat count of a vehicle by `count` (default 1, for legacy callers). */
export const restoreSeat = async (vehicleId: any, count: number = 1): Promise<number | null> => {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) return null;
    const currentSeats = seatCount(vehicle);
    const newSeats = currentSeats + (Math.max(1, Math.floor(count) || 1));
    await VehicleModel.findByIdAndUpdate(vehicleId, { availableSeats: newSeats });
    return newSeats;
};
