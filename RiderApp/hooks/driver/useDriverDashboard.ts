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
        userId
    });

    useAutoDropoff({
        socket,
        origin,
        activeTrips,
        setActiveTrips
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
            fare: incomingRequest.fare
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

    const handleChooseOnMap = async () => {
        setIsChoosingOnMap(true);
        const centerCoords = { latitude: mapRegion.latitude, longitude: mapRegion.longitude };
        setPinCoords(centerCoords);
        const address = await reverseGeocode(mapRegion.latitude, mapRegion.longitude);
        if (address) {
            setPinAddress(address);
        }
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
            const centerCoords = { latitude: region.latitude, longitude: region.longitude };
            setPinCoords(centerCoords);
            const address = await reverseGeocode(region.latitude, region.longitude);
            if (address) {
                setPinAddress(address);
            }
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
        isChoosingOnMap,
        pinAddress,
        pinCoords,
        mapComponents,
        mapRef,

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
    };
}
