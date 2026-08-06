import { useEffect, useRef } from 'react';
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
                    if (dist <= 0.3) { // 300 meters
                        socket.emit("dropoff-passenger", { tripId: trip.tripId });
                        // Mark the trip completed locally so the completion card
                        // (with the passenger rating option) appears, matching the
                        // manual "Complete Ride" flow.
                        setActiveTrips(prev =>
                            prev.map(t =>
                                t.tripId === trip.tripId ? { ...t, status: 'completed' } : t
                            )
                        );
                    }
                }
            }
        };

        checkDropoffs();
        // Only re-run when origin or socket changes — NOT when activeTrips changes
    }, [origin, socket]);
};
