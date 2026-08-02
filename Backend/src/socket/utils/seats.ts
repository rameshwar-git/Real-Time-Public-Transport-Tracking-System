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

/** Decrement the available seat count of a vehicle by one, if any seats remain. */
export const takeSeat = async (vehicleId: any): Promise<void> => {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) return;
    const currentSeats = seatCount(vehicle);
    if (currentSeats > 0) {
        await VehicleModel.findByIdAndUpdate(vehicleId, { availableSeats: currentSeats - 1 });
    }
};

/** Increment the available seat count of a vehicle by one (after a trip ends/cancels). */
export const restoreSeat = async (vehicleId: any): Promise<void> => {
    const vehicle = await VehicleModel.findById(vehicleId);
    if (!vehicle) return;
    const currentSeats = seatCount(vehicle);
    await VehicleModel.findByIdAndUpdate(vehicleId, { availableSeats: currentSeats + 1 });
};
