import { useEffect } from 'react';
import { Alert } from 'react-native';

interface UseDriverSocketEventsProps {
    socket: any;
    isOnDuty: boolean;
    setIncomingRequest: React.Dispatch<React.SetStateAction<any>>;
    setActiveTrips: React.Dispatch<React.SetStateAction<any[]>>;
    requestTimeoutRef: React.MutableRefObject<any>;
    userId: string | null;
}

export const useDriverSocketEvents = ({
    socket,
    isOnDuty,
    setIncomingRequest,
    setActiveTrips,
    requestTimeoutRef,
    userId
}: UseDriverSocketEventsProps) => {

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

        const handleOtpVerified = (data: any) => {
            setActiveTrips(prev => prev.map(t => 
                t.tripId === data.tripId ? { ...t, status: 'in_progress' } : t
            ));
        };

        const handleOtpFailed = (data: any) => {
            // Revert the optimistic status update
            setActiveTrips(prev => prev.map(t =>
                t.tripId === data.tripId ? { ...t, status: 'scheduled' } : t
            ));
            Alert.alert("OTP Failed", data.message || "Invalid OTP. Please try again.");
        };

        socket.on("ride-request", handleRideRequest);
        socket.on("trip-created", handleTripCreated);
        socket.on("trip-canceled", handleTripCanceled);
        socket.on("request-canceled", handleRequestCanceled);
        socket.on("otp-verified", handleOtpVerified);
        socket.on("otp-failed", handleOtpFailed);

        return () => {
            socket.off("ride-request", handleRideRequest);
            socket.off("trip-created", handleTripCreated);
            socket.off("trip-canceled", handleTripCanceled);
            socket.off("request-canceled", handleRequestCanceled);
            socket.off("otp-verified", handleOtpVerified);
            socket.off("otp-failed", handleOtpFailed);
            if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
        };
        // socket, isOnDuty, userId are the only values that should trigger re-registration.
        // setIncomingRequest and setActiveTrips are stable React dispatch refs.
    }, [isOnDuty, socket, userId]);
};
