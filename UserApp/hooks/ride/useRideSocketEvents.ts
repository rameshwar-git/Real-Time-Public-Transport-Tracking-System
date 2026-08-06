import { useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { upsertDriverLocation } from '@/utils/location';

interface UseRideSocketEventsProps {
    socket: any;
    userId: string | null;
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
    setDestinationText: (text: string) => void;
    setRouteDetails: (details: { distance: number; duration: number } | null) => void;
    stopSharing: () => void;
    assignedDriverId: string | null;
    setLocations: React.Dispatch<React.SetStateAction<any[]>>;
    /** Optional state setter to receive the latest available-seat count in real time. */
    setAvailableSeats?: (val: number | null) => void;
}

export const useRideSocketEvents = ({
    socket,
    userId,
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
    setDestinationText,
    setRouteDetails,
    stopSharing,
    assignedDriverId,
    setLocations,
    setAvailableSeats
}: UseRideSocketEventsProps) => {
    // Use refs for callback props that change every render
    // so the useEffect doesn't constantly re-register listeners
    const requestNextDriverRef = useRef(requestNextDriver);
    const stopSharingRef = useRef(stopSharing);

    useEffect(() => { requestNextDriverRef.current = requestNextDriver; }, [requestNextDriver]);
    useEffect(() => { stopSharingRef.current = stopSharing; }, [stopSharing]);

    useEffect(() => {
        // Only require userId — origin and destination may be recovered asynchronously
        if (!userId) return;

        // Track the accepted driver's vehicleType so seeded location entries show the correct icon
        const acceptedVehicleTypeRef = { current: null as string | null };

        const onRideAccepted = (data: any) => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            setAssignedDriverId(data.driverId);
            setDriverDetails({
                name: data.driverName,
                phone: data.driverPhone,
                vehicleModel: data.vehicleModel,
                vehicleNumber: data.vehicleNumber,
                vehicleColor: data.vehicleColor,
                vehicleType: data.vehicleType,
                estimatedDistance: data.estimatedDistance,
                estimatedDuration: data.estimatedDuration,
                fare: data.fare,
            });
            setTripId(data.tripId);
            setOtp(data.otp || null);
            setTripStatus('scheduled');
            setIsSearching(false);
            acceptedVehicleTypeRef.current = data.vehicleType || null;
            if (setAvailableSeats && data.availableSeats != null) {
                setAvailableSeats(Number(data.availableSeats));
            }
        };

        const onRideRejected = (_data: any) => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            requestNextDriverRef.current(currentDriverIndexRef.current + 1);
        };

        // Real-time seat stream: sent right after a booking (accept) and carried on every
        // driver-location-updated ping while the ride is active.
        const onSeatsUpdated = (data: any) => {
            if (setAvailableSeats && data.availableSeats != null) {
                setAvailableSeats(Number(data.availableSeats));
            }
        };

        const onTripStarted = (data: any) => {
            console.log('[UserApp] trip-started event received:', data);
            setTripStatus('in_progress');
        };

        const onTripCompleted = (_data: any) => {
            setTripStatus('completed');
            stopSharingRef.current();
        };

        const onTripCanceled = (data: any) => {
            if (data.reason !== 'Passenger canceled the trip') {
                Alert.alert("Trip Canceled", data.reason);
            }
            setAssignedDriverId(null);
            setDriverDetails(null);
            setTripId(null);
            setOtp(null);
            setTripStatus(null);
            setIsConfirmed(false);
            setIsSearching(false);
            setDestination(null);
            setDestinationText("");
            setRouteDetails(null);
            if (setAvailableSeats) setAvailableSeats(null);
            stopSharingRef.current();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };

        const onDriverLocationUpdated = (data: any) => {
            if (data.driverId === assignedDriverId) {
                setLocations(prev => upsertDriverLocation(prev, data.driverId, data.currentLocation, acceptedVehicleTypeRef.current));
                if (setAvailableSeats && data.availableSeats != null) {
                    setAvailableSeats(Number(data.availableSeats));
                }
            }
        };

        const onTripCancelError = (data: any) => {
            Alert.alert("Cancellation Failed", data.message || "Cannot cancel this trip.");
        };

        socket.on("ride-accepted", onRideAccepted);
        socket.on("ride-rejected", onRideRejected);
        socket.on("trip-started", onTripStarted);
        socket.on("trip-completed", onTripCompleted);
        socket.on("trip-canceled", onTripCanceled);
        socket.on("trip-cancel-error", onTripCancelError);
        socket.on("driver-location-updated", onDriverLocationUpdated);
        socket.on("seats-updated", onSeatsUpdated);

        return () => {
            socket.off("ride-accepted", onRideAccepted);
            socket.off("ride-rejected", onRideRejected);
            socket.off("trip-started", onTripStarted);
            socket.off("trip-completed", onTripCompleted);
            socket.off("trip-canceled", onTripCanceled);
            socket.off("trip-cancel-error", onTripCancelError);
            socket.off("driver-location-updated", onDriverLocationUpdated);
            socket.off("seats-updated", onSeatsUpdated);
        };
    }, [userId, socket, assignedDriverId, setLocations, setAvailableSeats]);
};
