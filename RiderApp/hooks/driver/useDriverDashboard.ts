import { useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { requestPermission, getCurrentLocation, reverseGeocode } from "@/services/locationServices";
import { socket } from "@/services/socket";
import { getActiveDriverTrips, getDriverProfile } from "@/services/apiService";
import { useDriverSocketEvents } from "@/hooks/driver/useDriverSocketEvents";
import { useAutoDropoff } from "@/hooks/driver/useAutoDropoff";
import { useDriveMode } from "@/hooks/driver/useDriveMode";

export function useDriverDashboard() {
    const [userId, setUserId] = useState<string | null>(null);
    const [mapRegion, setMapRegion] = useState<any>({
        latitude: 15,
        longitude: 83,
        latitudeDelta: 30,
        longitudeDelta: 30,
    });

    const [origin, setOrigin] = useState<any>(null);
    const { locations } = useLiveLocations(origin);
    const [destination, setDestination] = useState<any>(null);
    const [destinationText, setDestinationText] = useState<string>("");
    const [isOnDuty, setIsOnDuty] = useState<boolean>(false);
    const [activeTrips, setActiveTrips] = useState<any[]>([]);
    const [incomingRequest, setIncomingRequest] = useState<any>(null);

    const [isChoosingOnMap, setIsChoosingOnMap] = useState<boolean>(false);
    const [pinAddress, setPinAddress] = useState<string>("");
    const [pinCoords, setPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    // Live passenger locations, keyed by passengerId, streamed over the socket while a trip
    // is scheduled/in progress. Used for the live passenger marker + "distance to passenger".
    const [passengerLocations, setPassengerLocations] = useState<{ [passengerId: string]: { latitude: number; longitude: number } }>({});
    const setPassengerLocation = (data: { passengerId: string; currentLocation: { latitude: number; longitude: number } }) => {
        setPassengerLocations(prev => {
            if (!data.currentLocation) return prev;
            return { ...prev, [data.passengerId]: data.currentLocation };
        });
    };

    const requestTimeoutRef = useRef<any>(null);
    const [mapComponents, setMapComponents] = useState<any>(null);
    const mapRef = useRef<any>(null);

    const { startSharing, stopSharing } = useLocationSharing(userId);

    // --- Effects ---

    useEffect(() => {
        getUserId().then(setUserId);
        if (Platform.OS !== "web") {
            const Maps = require("react-native-maps");
            setMapComponents({
                MapView: Maps.default || Maps.MapView || Maps,
                Marker: Maps.Marker,
            });
        }
    }, []);

    useEffect(() => {
        const initGPS = async () => {
            const hasPermission = await requestPermission();
            if (hasPermission) {
                const myLoc = await getCurrentLocation();
                if (myLoc) {
                    setOrigin(myLoc);
                    setMapRegion({
                        latitude: myLoc.latitude,
                        longitude: myLoc.longitude,
                        latitudeDelta: 0.01,
                        longitudeDelta: 0.01,
                    });
                }
            }
        };
        initGPS();
    }, []);

    useEffect(() => {
        if (userId) {
            if (isOnDuty) {
                startSharing(destination, 'on-duty');
            } else {
                stopSharing();
            }
        }
        return () => {
            stopSharing();
        };
    }, [userId, isOnDuty, destination]);

    useEffect(() => {
        const recoverActiveTrips = async () => {
            try {
                const data = await getActiveDriverTrips();
                if (Array.isArray(data) && data.length > 0) {
                    setActiveTrips(data);
                    setIsOnDuty(true);

                    const firstTrip = data[0];
                    if (firstTrip.status === 'scheduled') {
                        setDestination(firstTrip.origin);
                    } else if (firstTrip.status === 'in_progress') {
                        setDestination(firstTrip.destination);
                    }

                    const targetLocation = firstTrip.status === 'scheduled' ? firstTrip.origin : firstTrip.destination;
                    if (targetLocation) {
                        setMapRegion({
                            latitude: targetLocation.latitude,
                            longitude: targetLocation.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        });
                    }
                } else {
                    // Recover last saved custom destination upon restart if no active trip exists
                    const profileData = await getDriverProfile();
                    if (profileData && profileData.lastDestination && profileData.lastDestination.latitude && profileData.lastDestination.longitude) {
                        setDestination(profileData.lastDestination);
                        setIsOnDuty(true);
                        setMapRegion({
                            latitude: profileData.lastDestination.latitude,
                            longitude: profileData.lastDestination.longitude,
                            latitudeDelta: 0.01,
                            longitudeDelta: 0.01,
                        });
                    }
                }
            } catch (error) {
                console.log("Error recovering driver trips or destination on restart:", error);
            }
        };

        if (userId) {
            recoverActiveTrips();
        }
    }, [userId]);

    useDriverSocketEvents({
        socket,
        isOnDuty,
        setIncomingRequest,
        setActiveTrips,
        requestTimeoutRef,
        userId,
        onPassengerLocation: setPassengerLocation
    });

    useAutoDropoff({
        socket,
        origin,
        activeTrips,
        setActiveTrips
    });

    // Turn-by-turn drive mode. Uses the driver's LIVE location for step advancement.
    const driverLiveLocation = locations.find((u: any) => u.userId === userId)?.currentLocation || origin;
    const hasActiveInProgressTrip = activeTrips.some((t: any) => t.status === 'in_progress');
    const driveMode = useDriveMode({
        origin: driverLiveLocation,
        destination,
        isOnDuty,
        hasActiveInProgressTrip,
    });

    // --- Event Handlers ---

    const handleAcceptRide = () => {
        if (!incomingRequest) return;
        if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);

        socket.emit("accept-ride", {
            passengerId: incomingRequest.passengerId,
            driverId: userId,
            origin: incomingRequest.origin,
            destination: incomingRequest.destination,
            fare: incomingRequest.fare,
            // Echo the seat count the passenger asked for so the vehicle decrements
            // exactly that many seats and can reject if they were booked out meanwhile.
            seats: Math.max(1, Number(incomingRequest.seats) || 1)
        });

        setIncomingRequest(null);

        if (incomingRequest.origin) {
            mapRef.current?.animateToRegion({
                latitude: incomingRequest.origin.latitude,
                longitude: incomingRequest.origin.longitude,
                latitudeDelta: 0.05,
                longitudeDelta: 0.05,
            });
        }
    };

    const handleRejectRide = () => {
        if (!incomingRequest) return;
        if (requestTimeoutRef.current) clearTimeout(requestTimeoutRef.current);

        socket.emit("reject-ride", {
            passengerId: incomingRequest.passengerId,
            driverId: userId
        });

        setIncomingRequest(null);
    };

    const toggleDutyStatus = async () => {
        if (isOnDuty) {
            setIsOnDuty(false);
            setActiveTrips([]);
        } else {
            if (!destination) {
                Alert.alert("Destination Required", "Please set your destination before going on duty.");
                return;
            }
            const hasPermission = await requestPermission();
            if (!hasPermission) {
                Alert.alert("Permission Required", "Background location is required to go on duty.");
                return;
            }
            setIsOnDuty(true);
        }
    };

    const startTrip = (trip: any) => {
        if (!trip || !trip.tripId) return;
        socket.emit("start-trip", { tripId: trip.tripId });
        setActiveTrips(prev => prev.map(t => t.tripId === trip.tripId ? { ...t, status: 'in_progress' } : t));
    };

    const completeTrip = (trip: any) => {
        if (!trip || !trip.tripId) return;
        socket.emit("dropoff-passenger", { tripId: trip.tripId });
        // Keep the trip visible in a "Completed" state so the driver can rate
        // the passenger before dismissing the card.
        setActiveTrips(prev => prev.map(t => t.tripId === trip.tripId ? { ...t, status: 'completed' } : t));
    };

    const dismissCompletedTrip = (trip: any) => {
        if (!trip || !trip.tripId) return;
        // Remove a completed trip from the list once the driver is done with it
        // (after rating / dismissing the completion card).
        setActiveTrips(prev => prev.filter(t => t.tripId !== trip.tripId));
    };

    const handleCancelTrip = (trip: any) => {
        Alert.alert("Cancel Trip", `Are you sure you want to cancel the trip for ${trip.passengerName}?`, [
            { text: "No", style: "cancel" },
            {
                text: "Yes", onPress: () => {
                    socket.emit('cancel-trip', { tripId: trip.tripId, canceledBy: 'driver' });
                    setActiveTrips(prev => prev.filter(t => t.tripId !== trip.tripId));
                }, style: 'destructive'
            }
        ]);
    };

    // Update the map-pin coordinates and reverse-geocode the given lat/lng so the
    // pin card can show the address under the crosshair.
    const updatePinFromCoords = async (latitude: number, longitude: number) => {
        setPinCoords({ latitude, longitude });
        const address = await reverseGeocode(latitude, longitude);
        if (address) {
            setPinAddress(address);
        }
    };

    const handleChooseOnMap = async () => {
        setIsChoosingOnMap(true);
        await updatePinFromCoords(mapRegion.latitude, mapRegion.longitude);
    };

    const handleConfirmPinLocation = async () => {
        if (pinCoords) {
            const hasPermission = await requestPermission();
            if (hasPermission) {
                const destinationCoords = {
                    latitude: pinCoords.latitude,
                    longitude: pinCoords.longitude,
                    description: pinAddress,
                };
                setDestination(destinationCoords);
                setDestinationText(pinAddress);
                setIsOnDuty(true);
                mapRef.current?.animateToRegion(
                    { ...destinationCoords, latitudeDelta: 0.007, longitudeDelta: 0.007 },
                    700
                );
                setIsChoosingOnMap(false);
            } else {
                Alert.alert("Permission Required", "Background location permission is required to go on duty.");
            }
        }
    };

    const handleRegionChangeComplete = async (region: any) => {
        setMapRegion(region);
        if (isChoosingOnMap) {
            await updatePinFromCoords(region.latitude, region.longitude);
        }
    };

    const handleDestinationSelect = async (coords: any) => {
        if (!coords) {
            setDestination(null);
            setDestinationText("");
            return;
        }
        const hasPermission = await requestPermission();
        if (hasPermission) {
            const destinationCoords = {
                latitude: coords.lat,
                longitude: coords.lng,
                description: coords.description || "",
            };
            setDestination(destinationCoords);
            setDestinationText(coords.description || "");
            setIsOnDuty(true);

            mapRef.current?.animateToRegion(
                { ...destinationCoords, latitudeDelta: 0.007, longitudeDelta: 0.007 },
                700
            );
        } else {
            Alert.alert("Permission Required", "Background location permission is required to go on duty.");
        }
    };

    const handleDestinationSearchFocus = () => {
        if (isOnDuty) {
            setIsOnDuty(false);
        }
    };

    const handleDestinationPress = () => {
        if (activeTrips.length === 0) {
            setDestination(null);
            setDestinationText("");
            setIsOnDuty(false);
        }
    };



    return {
        // State
        userId,
        mapRegion,
        origin,
        locations,
        destination,
        destinationText,
        isOnDuty,
        activeTrips,
        incomingRequest,
        passengerLocations,
        isChoosingOnMap,
        pinAddress,
        pinCoords,
        mapComponents,
        mapRef,

        // Drive mode (turn-by-turn)
        driveMode,

        // Setters needed by UI
        setIsChoosingOnMap,

        // Handlers
        handleAcceptRide,
        handleRejectRide,
        toggleDutyStatus,
        handleCancelTrip,
        handleChooseOnMap,
        handleConfirmPinLocation,
        handleRegionChangeComplete,
        handleDestinationSelect,
        handleDestinationSearchFocus,
        handleDestinationPress,
        startTrip,
        completeTrip,
        dismissCompletedTrip,
    };
}
