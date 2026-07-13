import { Alert } from 'react-native';
import { findDrivers } from '@/services/apiService';
import { getToken } from '@/services/storageService';
import { getDistance } from '@/utils/geometry';

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
    routeDetails
}: UseRideRequestFlowProps) => {

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
        const roundToNearestFive = (val: number): number => {
            const rem = val % 5;
            if (rem < 3) {
                return Math.floor(val / 5) * 5;
            } else {
                return Math.ceil(val / 5) * 5;
            }
        };

        const calculateEstimatedFare = (dist: number): number => {
            if (!dist || isNaN(dist)) return 10;
            if (dist <= 2.5) return 10;
            return Number((10 + (dist - 2.5) * 2).toFixed(2));
        };
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
            passengerFare
        });

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            requestNextDriver(index + 1);
        }, 8000);
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

    return { requestNextDriver, handleConfirmRide };
};
