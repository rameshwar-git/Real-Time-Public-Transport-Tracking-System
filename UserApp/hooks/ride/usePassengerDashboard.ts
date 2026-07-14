import { useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { requestPermission, reverseGeocode, getCurrentLocation } from "@/services/locationServices";
import { socket } from "@/services/socket";
import { getDistance } from "@/utils/geometry";
import { getActiveTrip } from "@/services/apiService";
import { useRideSocketEvents } from "@/hooks/ride/useRideSocketEvents";
import { useRideRequestFlow } from "@/hooks/ride/useRideRequestFlow";

export function usePassengerDashboard() {
    const [userId, setUserId] = useState<string | null>(null);
    const [mapRegion, setMapRegion] = useState<any>({
        latitude: 15,
        longitude: 83,
        latitudeDelta: 30,
        longitudeDelta: 30,
    });
    const [destination, setDestination] = useState<any>(null);
    const [destinationText, setDestinationText] = useState<string>("");
    const [origin, setOrigin] = useState<any>(null);
    const [originText, setOriginText] = useState<string>("");
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [isChoosingOnMap, setIsChoosingOnMap] = useState<boolean>(false);
    const [pinAddress, setPinAddress] = useState<string>("");
    const [pinCoords, setPinCoords] = useState<{ latitude: number; longitude: number } | null>(null);

    const [tripId, setTripId] = useState<string | null>(null);
    const [driverDetails, setDriverDetails] = useState<any>(null);
    const [otp, setOtp] = useState<string | null>(null);
    const [tripStatus, setTripStatus] = useState<string | null>(null);
    const [routeDetails, setRouteDetails] = useState<{ distance: number; duration: number } | null>(null);
    const [matchedDrivers, setMatchedDrivers] = useState<any[]>([]);
    const [currentDriverIndex, setCurrentDriverIndex] = useState<number>(0);
    const [selectedVehicleType, setSelectedVehicleType] = useState<'all' | 'tricycle' | 'bus'>('all');

    const pendingDriversRef = useRef<any[]>([]);
    const currentDriverIndexRef = useRef<number>(0);
    const searchTimeoutRef = useRef<any>(null);

    const { locations, setLocations } = useLiveLocations(origin);

    const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
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
        const recoverActiveTrip = async () => {
            try {
                const data = await getActiveTrip();
                if (data && data.active) {
                    setTripId(data.tripId);
                    setAssignedDriverId(data.driverId);
                    setOtp(data.otp);
                    setTripStatus(data.tripStatus);
                    setOrigin(data.origin);
                    setDestination(data.destination);
                    setDriverDetails(data.driverDetails);
                    setIsConfirmed(true);
                    setIsSearching(false);

                    // Immediately seed driver location so the route renders without waiting for socket
                    if (data.driverCurrentLocation) {
                        setLocations((prev: any[]) => {
                            const exists = prev.some((l: any) => l.userId === data.driverId);
                            if (exists) {
                                return prev.map((l: any) =>
                                    l.userId === data.driverId
                                        ? { ...l, currentLocation: data.driverCurrentLocation, vehicleId: l.vehicleId || { vehicleType: data.driverDetails?.vehicleType } }
                                        : l
                                );
                            }
                            return [...prev, { userId: data.driverId, currentLocation: data.driverCurrentLocation, vehicleId: { vehicleType: data.driverDetails?.vehicleType } }];
                        });
                    }

                    // Fit map to show driver ↔ destination (or driver ↔ pickup) route
                    const focusPoint = data.driverCurrentLocation ?? data.origin;
                    if (focusPoint) {
                        const coords = [
                            focusPoint,
                            data.tripStatus === 'in_progress' ? data.destination : data.origin,
                        ].filter(Boolean);
                        if (mapRef.current && coords.length > 1) {
                            mapRef.current.fitToCoordinates(coords, {
                                edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
                                animated: true,
                            });
                        } else {
                            setMapRegion({
                                latitude: focusPoint.latitude,
                                longitude: focusPoint.longitude,
                                latitudeDelta: 0.03,
                                longitudeDelta: 0.03,
                            });
                        }
                    }
                }
            } catch (error) {
                console.log("No ongoing trip found on restart:", error);
            }
        };

        if (userId) {
            recoverActiveTrip();
        }
    }, [userId]);

    useEffect(() => {
        if (userId && origin) {
            // Share location during active trip too (for proximity auto-complete)
            startSharing(destination, destination ? 'active' : 'inactive');
        }
    }, [userId, origin, destination, startSharing]);

    useEffect(() => {
        const fetchAddress = async () => {
            if (origin && !origin.description) {
                const address = await reverseGeocode(origin.latitude, origin.longitude);
                if (address) {
                    setOriginText(address);
                    setOrigin((prev: any) => prev ? { ...prev, description: address } : prev);
                }
            }
        };
        fetchAddress();
    }, [origin]);

    const { requestNextDriver, handleConfirmRide } = useRideRequestFlow({
        socket,
        userId,
        origin,
        destination,
        pendingDriversRef,
        currentDriverIndexRef,
        searchTimeoutRef,
        setIsSearching,
        setIsConfirmed,
        startSharing,
        setMatchedDrivers,
        setCurrentDriverIndex,
        selectedVehicleType,
        routeDetails,
    });

    useRideSocketEvents({
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
        setLocations,
    });

    // --- Event Handlers ---

    const handleCancelSearch = () => {
        const currentDriver = pendingDriversRef.current[currentDriverIndexRef.current];
        if (currentDriver && currentDriver.userId) {
            socket.emit('cancel-request', { driverId: currentDriver.userId, passengerId: userId });
        }
        setIsConfirmed(false);
        setIsSearching(false);
        setRouteDetails(null);
        setMatchedDrivers([]);
        setCurrentDriverIndex(0);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };

    const handleCancelTrip = () => {
        Alert.alert(
            "Cancel Trip",
            "Are you sure you want to cancel this trip? Your driver is already en route.",
            [
                {
                    text: "No, Keep Ride",
                    style: "cancel"
                },
                {
                    text: "Yes, Cancel",
                    style: "destructive",
                    onPress: () => {
                        if (tripId) {
                            socket.emit('cancel-trip', { tripId, canceledBy: 'passenger' });
                        }
                        setIsConfirmed(false);
                        setIsSearching(false);
                        setAssignedDriverId(null);
                        setDriverDetails(null);
                        setTripId(null);
                        setOtp(null);
                        setTripStatus(null);
                        setDestination(null);
                        setDestinationText("");
                        setRouteDetails(null);
                        setMatchedDrivers([]);
                        setCurrentDriverIndex(0);
                        stopSharing();
                        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
                    }
                }
            ]
        );
    };

    const handleDestinationSelect = (coords: any) => {
        if (!coords) {
            setDestination(null);
            setDestinationText("");
            setRouteDetails(null);
            return;
        }
        const destinationCoords = {
            latitude: coords.lat,
            longitude: coords.lng,
            description: coords.description || "",
        };
        setDestination(destinationCoords);
        setDestinationText(coords.description || "");
        startSharing(destinationCoords, 'active');
        mapRef.current?.animateToRegion(
            { ...destinationCoords, latitudeDelta: 0.007, longitudeDelta: 0.007 },
            700
        );
    };

    const handleClearRoute = () => {
        setDestination(null);
        setRouteDetails(null);
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

    const handleConfirmPinLocation = () => {
        if (pinCoords) {
            handleDestinationSelect({
                lat: pinCoords.latitude,
                lng: pinCoords.longitude,
                description: pinAddress,
            });
            setIsChoosingOnMap(false);
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

    const handleDestinationPress = () => {
        if (!isConfirmed) {
            setDestination(null);
            setRouteDetails(null);
        }
    };

    // Derived values
    const assignedDriverLocation = locations.find((u: any) => u.userId === assignedDriverId)?.currentLocation;
    const computedDistance = routeDetails?.distance || (origin && destination ? getDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude) : undefined);

    return {
        // State
        userId,
        mapRegion,
        origin,
        destination,
        destinationText,
        isConfirmed,
        isSearching,
        isChoosingOnMap,
        pinAddress,
        tripId,
        driverDetails,
        otp,
        tripStatus,
        routeDetails,
        matchedDrivers,
        currentDriverIndex,
        selectedVehicleType,
        locations,
        assignedDriverId,
        mapComponents,
        mapRef,

        // Setters needed by UI
        setSelectedVehicleType,
        setIsChoosingOnMap,
        setRouteDetails,

        // Derived
        assignedDriverLocation,
        computedDistance,

        // Handlers
        handleConfirmRide,
        handleCancelSearch,
        handleCancelTrip,
        handleDestinationSelect,
        handleClearRoute,
        handleChooseOnMap,
        handleConfirmPinLocation,
        handleRegionChangeComplete,
        handleDestinationPress,
    };
}
