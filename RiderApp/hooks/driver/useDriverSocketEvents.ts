import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';

interface UseDriverSocketEventsProps {
    socket: any;
    isOnDuty: boolean;
    setIncomingRequest: React.Dispatch<React.SetStateAction<any>>;
    setActiveTrips: React.Dispatch<React.SetStateAction<any[]>>;
    requestTimeoutRef: React.MutableRefObject<any>;
    userId: string | null;
    /** Called on every live passenger location update (`passenger-location-updated`). */
    onPassengerLocation?: (data: { passengerId: string; currentLocation: { latitude: number; longitude: number } }) => void;
}

export const useDriverSocketEvents = ({
    socket,
    isOnDuty,
    setIncomingRequest,
    setActiveTrips,
    requestTimeoutRef,
    userId,
    onPassengerLocation
}: UseDriverSocketEventsProps) => {

    // Keep the latest callback without re-registering the socket listeners on every render
    // (the callback is a new identity each render when passed inline from the parent hook).
    const onPassengerLocationRef = useRef(onPassengerLocation);
    useEffect(() => {
        onPassengerLocationRef.current = onPassengerLocation;
    }, [onPassengerLocation]);

    useEffect(() => {
        if (!isOnDuty) {
            setIncomingRequest(null);
            return;
        }

        const handleRideRequest = (data: any) => {
            setIncomingRequest(data);

            if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
            requestTimeoutRef.current = setTimeout(() => {
                socket.emit("reject-ride", {
                    passengerId: data.passengerId,
                    driverId: userId
                });
                setIncomingRequest(null);
            }, 5000);
        };

        const handleTripCreated = (data: any) => {
            setActiveTrips(prev => [...prev, data]);
        };

        const handleTripCanceled = (data: any) => {
            setActiveTrips(prev => prev.filter(t => t.tripId !== data.tripId));
            Alert.alert("Trip Canceled", data.reason);
        };

        const handleRequestCanceled = (data: any) => {
            setIncomingRequest((prev: any) => {
                if (prev && prev.passengerId === data.passengerId) {
                    return null;
                }
                return prev;
            });
        };

        const handleTripStarted = (data: any) => {
            setActiveTrips(prev => prev.map(t => 
                t.tripId === data.tripId ? { ...t, status: 'in_progress' } : t
            ));
        };

        const handleTripCompleted = (data: any) => {
            setActiveTrips(prev => prev.filter(t => t.tripId !== data.tripId));
            Alert.alert("Trip Completed", "The trip has been successfully completed.");
        };

        const handlePassengerLocationUpdated = (data: any) => {
            if (!data || !data.passengerId || !data.currentLocation) return;
            onPassengerLocationRef.current?.({
                passengerId: data.passengerId,
                currentLocation: {
                    latitude: data.currentLocation.latitude,
                    longitude: data.currentLocation.longitude,
                },
            });
        };

        socket.on("ride-request", handleRideRequest);
        socket.on("trip-created", handleTripCreated);
        socket.on("trip-canceled", handleTripCanceled);
        socket.on("request-canceled", handleRequestCanceled);
        socket.on("trip-started", handleTripStarted);
        socket.on("trip-completed", handleTripCompleted);
        socket.on("passenger-location-updated", handlePassengerLocationUpdated);

        return () => {
            socket.off("ride-request", handleRideRequest);
            socket.off("trip-created", handleTripCreated);
            socket.off("trip-canceled", handleTripCanceled);
            socket.off("request-canceled", handleRequestCanceled);
            socket.off("trip-started", handleTripStarted);
            socket.off("trip-completed", handleTripCompleted);
            socket.off("passenger-location-updated", handlePassengerLocationUpdated);
            if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
        };
        // socket, isOnDuty, userId are the only values that should trigger re-registration.
        // setIncomingRequest and setActiveTrips are stable React dispatch refs.
    }, [isOnDuty, socket, userId]);
};
