import { useEffect } from 'react';
import { Alert } from 'react-native';

interface UseRideSocketEventsProps {
    socket: any;
    userId: string | null;
    origin: any;
    destination: any;
    searchTimeoutRef: React.MutableRefObject<any>;
    currentDriverIndexRef: React.MutableRefObject<number>;
    requestNextDriver: (index: number) => void;
    setAssignedDriverId: (id: string | null) => void;
    setDriverDetails: (details: any) => void;
    setTripId: (id: string | null) => void;
    setOtp: (otp: string | null) => void;
    setTripStatus: (status: string | null) => void;
    setIsSearching: (isSearching: boolean) => void;
    setIsConfirmed: (isConfirmed: boolean) => void;
    setDestination: (dest: any) => void;
    stopSharing: () => void;
}

export const useRideSocketEvents = ({
    socket,
    userId,
    origin,
    destination,
    searchTimeoutRef,
    currentDriverIndexRef,
    requestNextDriver,
    setAssignedDriverId,
    setDriverDetails,
    setTripId,
    setOtp,
    setTripStatus,
    setIsSearching,
    setIsConfirmed,
    setDestination,
    stopSharing
}: UseRideSocketEventsProps) => {
    useEffect(() => {
        if (!userId || !origin || !destination) return;

        const onRideAccepted = (data: any) => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            setAssignedDriverId(data.driverId);
            setDriverDetails({ name: data.driverName });
            setTripId(data.tripId);
            setOtp(data.otp);
            setTripStatus('scheduled');
            setIsSearching(false);
        };

        const onRideRejected = (data: any) => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            requestNextDriver(currentDriverIndexRef.current + 1);
        };

        const onTripStarted = (data: any) => {
            setTripStatus('in_progress');
        };

        const onTripCompleted = (data: any) => {
            Alert.alert("Trip Completed!", "You have reached your destination.");
            setAssignedDriverId(null);
            setDriverDetails(null);
            setTripId(null);
            setOtp(null);
            setTripStatus(null);
            setIsConfirmed(false);
            setDestination(null);
            stopSharing();
        };

        const onTripCanceled = (data: any) => {
            Alert.alert("Trip Canceled", data.reason);
            setAssignedDriverId(null);
            setDriverDetails(null);
            setTripId(null);
            setOtp(null);
            setTripStatus(null);
            setIsConfirmed(false);
            setIsSearching(false);
            setDestination(null);
            stopSharing();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };

        socket.on("ride-accepted", onRideAccepted);
        socket.on("ride-rejected", onRideRejected);
        socket.on("trip-started", onTripStarted);
        socket.on("trip-completed", onTripCompleted);
        socket.on("trip-canceled", onTripCanceled);

        return () => {
            socket.off("ride-accepted", onRideAccepted);
            socket.off("ride-rejected", onRideRejected);
            socket.off("trip-started", onTripStarted);
            socket.off("trip-completed", onTripCompleted);
            socket.off("trip-canceled", onTripCanceled);
        };
    }, [userId, origin, destination, socket, requestNextDriver, stopSharing]);
};
