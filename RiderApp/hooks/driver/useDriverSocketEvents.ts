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

        socket.on("ride-request", handleRideRequest);
        socket.on("trip-created", handleTripCreated);
        socket.on("trip-canceled", handleTripCanceled);
        socket.on("request-canceled", handleRequestCanceled);

        return () => {
            socket.off("ride-request", handleRideRequest);
            socket.off("trip-created", handleTripCreated);
            socket.off("trip-canceled", handleTripCanceled);
            socket.off("request-canceled", handleRequestCanceled);
            if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);
        };
    }, [isOnDuty, socket, setIncomingRequest, setActiveTrips, requestTimeoutRef, userId]);
};
