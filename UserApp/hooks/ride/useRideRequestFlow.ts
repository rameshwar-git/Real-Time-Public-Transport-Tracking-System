import { Alert } from 'react-native';
import { findDrivers } from '@/services/apiService';
import { getToken } from '@/services/storageService';
import { getDistance } from '@/utils/geometry';
import { calculateEstimatedFare, roundToNearestFive } from '@/utils/fare';

interface UseRideRequestFlowProps {
    socket: any;
    userId: string | null;
    origin: any;
    destination: any;
    pendingDriversRef: React.MutableRefObject<any[]>;
    currentDriverIndexRef: React.MutableRefObject<number>;
    searchTimeoutRef: React.MutableRefObject<any>;
    setIsSearching: (val: boolean) => void;
    setIsConfirmed: (val: boolean) => void;
    startSharing: (dest: any, status: string) => void;
    setMatchedDrivers?: (val: any[]) => void;
    setCurrentDriverIndex?: (val: number) => void;
    selectedVehicleType?: 'all' | 'tricycle' | 'bus';
    routeDetails?: { distance: number; duration: number } | null;
    /** How many seats this passenger wants to book (defaults to 1). */
    seatsNeeded?: number;
}

export const useRideRequestFlow = ({
    socket,
    userId,
    origin,
    destination,
    pendingDriversRef,
    currentDriverIndexRef,
    searchTimeoutRef,
    setIsSearching,
    setIsConfirmed,
    startSharing,
    setMatchedDrivers,
    setCurrentDriverIndex,
    selectedVehicleType = 'all',
    routeDetails,
    seatsNeeded = 1
}: UseRideRequestFlowProps) => {

    // Number of seats the passenger wants on this shared/public-transport vehicle.
    const requestedSeats = Math.max(1, Math.floor(seatsNeeded) || 1);

    const requestNextDriver = (index: number) => {
        const drivers = pendingDriversRef.current;
        if (index >= drivers.length) {
            Alert.alert("No Drivers Found", "No drivers accepted the ride.");
            setIsSearching(false);
            setIsConfirmed(false);
            return;
        }

        currentDriverIndexRef.current = index;
        if (setCurrentDriverIndex) setCurrentDriverIndex(index);
        
        const driver = drivers[index];
        startSharing(destination, 'confirmed');

        // Calculate passenger fare based on passenger math to send to driver to match fare
        const calculatedDistance = routeDetails?.distance || (origin && destination ? getDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude) : 0);
        const baseFare = calculateEstimatedFare(calculatedDistance);
        
        let passengerFare = baseFare;
        const vType = driver.vehicleDetails?.vehicleType;
        if (vType === 'tricycle') {
            passengerFare = Number((baseFare * 0.8).toFixed(2));
        } else if (vType === 'bus') {
            passengerFare = Number((baseFare * 1.5).toFixed(2));
        }
        passengerFare = roundToNearestFive(passengerFare);

        socket.emit("request-ride", {
            passengerId: userId,
            driverId: driver.userId,
            origin,
            destination,
            passengerFare,
            seats: requestedSeats
        });

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            requestNextDriver(index + 1);
        }, 8000);
    };

    // Per-driver selection: clear any pending auto-advance and contact a specific
    // vehicle (e.g. the one the passenger tapped with enough seats). Auto-advance
    // still kicks in if that chosen driver rejects, so the search keeps moving.
    const requestSpecificDriver = (index: number) => {
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        requestNextDriver(index);
    };

    // Tap-to-board from the pre-ride browse list: the drivers were already fetched and
    // stored in pendingDriversRef, so jump straight to contacting the chosen vehicle
    // (instead of starting the auto-iterate search from driver 0).
    const requestDriverAt = (index: number) => {
        const drivers = pendingDriversRef.current;
        if (!Array.isArray(drivers) || drivers.length === 0) return;
        if (setMatchedDrivers) setMatchedDrivers(drivers);
        setIsSearching(true);
        setIsConfirmed(true);
        requestSpecificDriver(index);
    };

    const handleConfirmRide = async () => {
        if (!origin || !destination) {
            Alert.alert("Missing Locations", "Please set both origin and destination.");
            return;
        }

        setIsSearching(true);
        setIsConfirmed(true);

        const token = await getToken();
        let validDrivers: any[] = [];
        try {
            validDrivers = await findDrivers(origin, destination, token as string);
            if (selectedVehicleType !== 'all') {
                validDrivers = validDrivers.filter(
                    d => d.vehicleDetails?.vehicleType === selectedVehicleType
                );
            }
        } catch(e) {
            console.error(e);
        }

        if (validDrivers.length === 0) {
            Alert.alert("No Drivers", "No available drivers heading your way at the moment.");
            setIsSearching(false);
            setIsConfirmed(false);
            return;
        }

        pendingDriversRef.current = validDrivers;
        if (setMatchedDrivers) setMatchedDrivers(validDrivers);
        if (setCurrentDriverIndex) setCurrentDriverIndex(0);
        requestNextDriver(0);
    };

    return { requestNextDriver, requestSpecificDriver, requestDriverAt, handleConfirmRide };
};
