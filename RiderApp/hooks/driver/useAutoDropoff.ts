import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { getDistance } from '@/utils/geometry';

interface UseAutoDropoffProps {
    socket: any;
    origin: any;
    activeTrips: any[];
    setActiveTrips: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useAutoDropoff = ({ socket, origin, activeTrips, setActiveTrips }: UseAutoDropoffProps) => {
    // Keep a ref so the effect can read the latest activeTrips without
    // needing it in the dependency array (which would cause a self-triggering
    // loop: setActiveTrips → new ref → effect re-runs → setActiveTrips → ...)
    const activeTripsRef = useRef(activeTrips);
    useEffect(() => {
        activeTripsRef.current = activeTrips;
    }, [activeTrips]);

    useEffect(() => {
        if (!origin) return;

        const checkDropoffs = async () => {
            for (const trip of activeTripsRef.current) {
                if (trip.status === 'in_progress') {
                    if (!trip.destination || trip.destination.latitude === undefined) continue;
                    const dist = getDistance(
                        origin.latitude,
                        origin.longitude,
                        trip.destination.latitude,
                        trip.destination.longitude
                    );
                    if (dist <= 0.3) { // 100 meters
                        socket.emit("dropoff-passenger", { tripId: trip.tripId });
                    }
                }
            }
        };

        checkDropoffs();
        // Only re-run when origin or socket changes — NOT when activeTrips changes
    }, [origin, socket]);
};
