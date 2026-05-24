import { useEffect } from 'react';
import { Alert } from 'react-native';
import { getDistance } from '@/utils/geometry';

interface UseAutoDropoffProps {
    socket: any;
    origin: any;
    activeTrips: any[];
    setActiveTrips: React.Dispatch<React.SetStateAction<any[]>>;
}

export const useAutoDropoff = ({ socket, origin, activeTrips, setActiveTrips }: UseAutoDropoffProps) => {
    useEffect(() => {
        if (!origin || activeTrips.length === 0) return;

        const checkDropoffs = async () => {
            for (const trip of activeTrips) {
                if (trip.status === 'in_progress') {
                    if (!trip.destination || trip.destination.latitude === undefined) continue;
                    const dist = getDistance(
                        origin.latitude, 
                        origin.longitude, 
                        trip.destination.latitude, 
                        trip.destination.longitude
                    );
                    if (dist <= 0.1) { // 100 meters
                        socket.emit("dropoff-passenger", { tripId: trip.tripId });
                        setActiveTrips(prev => prev.filter(t => t.tripId !== trip.tripId));
                        Alert.alert("Drop-off Complete", `${trip.passengerName} has reached their destination!`);
                    }
                }
            }
        };
        checkDropoffs();
    }, [origin, activeTrips, socket, setActiveTrips]);
};
