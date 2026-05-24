import { Alert } from 'react-native';
import { findDrivers } from '@/services/apiService';
import { getToken } from '@/services/storageService';

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
    startSharing
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
        const driver = drivers[index];
        startSharing(destination, 'confirmed');

        socket.emit("request-ride", {
            passengerId: userId,
            driverId: driver.userId,
            origin,
            destination
        });

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        searchTimeoutRef.current = setTimeout(() => {
            requestNextDriver(index + 1);
        }, 5000);
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
        requestNextDriver(0);
    };

    return { requestNextDriver, handleConfirmRide };
};
