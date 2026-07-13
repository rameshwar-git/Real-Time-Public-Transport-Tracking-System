import { useEffect, useRef } from 'react';
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
    setDestinationText: (text: string) => void;
    setRouteDetails: (details: { distance: number; duration: number } | null) => void;
    stopSharing: () => void;
    assignedDriverId: string | null;
    setLocations: React.Dispatch<React.SetStateAction<any[]>>;
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
    setDestinationText,
    setRouteDetails,
    stopSharing,
    assignedDriverId,
    setLocations
}: UseRideSocketEventsProps) => {
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
            setOtp(data.otp);
            setTripStatus('scheduled');
            setIsSearching(false);
            acceptedVehicleTypeRef.current = data.vehicleType || null;
        };

        const onRideRejected = (_data: any) => {
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
            requestNextDriver(currentDriverIndexRef.current + 1);
        };

        const onTripStarted = (_data: any) => {
            setTripStatus('in_progress');
        };

        const onTripCompleted = (_data: any) => {
            Alert.alert("Trip Completed!", "You have reached your destination.");
            setAssignedDriverId(null);
            setDriverDetails(null);
            setTripId(null);
            setOtp(null);
            setTripStatus(null);
            setIsConfirmed(false);
            setDestination(null);
            setDestinationText("");
            setRouteDetails(null);
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
            setDestinationText("");
            setRouteDetails(null);
            stopSharing();
            if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
        };

        const onDriverLocationUpdated = (data: any) => {
            if (data.driverId === assignedDriverId) {
                setLocations((prev: any[]) => {
                    const exists = prev.some((loc: any) => loc.userId === data.driverId);
                    if (exists) {
                        return prev.map((loc: any) =>
                            loc.userId === data.driverId
                                ? { ...loc, currentLocation: data.currentLocation, vehicleId: loc.vehicleId || { vehicleType: acceptedVehicleTypeRef.current } }
                                : loc
                        );
                    }
                    // Seed driver entry if not yet in locations list (happens on reopen)
                    return [...prev, { userId: data.driverId, currentLocation: data.currentLocation, vehicleId: { vehicleType: acceptedVehicleTypeRef.current } }];
                });
            }
        };

        socket.on("ride-accepted", onRideAccepted);
        socket.on("ride-rejected", onRideRejected);
        socket.on("trip-started", onTripStarted);
        socket.on("trip-completed", onTripCompleted);
        socket.on("trip-canceled", onTripCanceled);
        socket.on("driver-location-updated", onDriverLocationUpdated);

        return () => {
            socket.off("ride-accepted", onRideAccepted);
            socket.off("ride-rejected", onRideRejected);
            socket.off("trip-started", onTripStarted);
            socket.off("trip-completed", onTripCompleted);
            socket.off("trip-canceled", onTripCanceled);
            socket.off("driver-location-updated", onDriverLocationUpdated);
        };
    }, [userId, socket, requestNextDriver, stopSharing, assignedDriverId, setLocations]);
};
