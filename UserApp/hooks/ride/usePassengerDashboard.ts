import { useEffect, useRef, useState } from "react";
import { Platform, Alert } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId, getToken } from "@/services/storageService";
import { requestPermission, reverseGeocode, getCurrentLocation } from "@/services/locationServices";
import { socket } from "@/services/socket";
import { getDistance } from "@/utils/geometry";
import { getActiveTrip, findDrivers } from "@/services/apiService";
import { useRideSocketEvents } from "@/hooks/ride/useRideSocketEvents";
import { useRideRequestFlow } from "@/hooks/ride/useRideRequestFlow";
import { upsertDriverLocation } from "@/utils/location";

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
    const [, setOriginText] = useState<string>("");
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

    // Number of seats this passenger wants (shared/public-transport booking).
    const [seatsNeeded, setSeatsNeeded] = useState<number>(1);
    // Live available-seat count for the accepted driver, streamed over the socket.
    const [availableSeats, setAvailableSeats] = useState<number | null>(null);

    // Shared vehicles heading this passenger's way, loaded once a destination is set so
    // they can be browsed (with live seats) BEFORE the search begins, and board via tap.
    const [browseDrivers, setBrowseDrivers] = useState<any[]>([]);

    const pendingDriversRef = useRef<any[]>([]);
    const currentDriverIndexRef = useRef<number>(0);
    const searchTimeoutRef = useRef<any>(null);

    const { locations, setLocations, startPolling, stopPolling } = useLiveLocations(origin);

    const [assignedDriverId, setAssignedDriverId] = useState<string | null>(null);
    const [mapComponents, setMapComponents] = useState<any>(null);
    const mapRef = useRef<any>(null);

    const { startSharing, stopSharing } = useLocationSharing(userId);

    // Route refresh key — increments every 10 seconds during active trips
    // to force MapViewDirections to re-fetch the route from Google
    const [routeRefreshKey, setRouteRefreshKey] = useState(0);

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
                        setLocations(prev => upsertDriverLocation(prev, data.driverId, data.driverCurrentLocation, data.driverDetails?.vehicleType));
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

    // Start/stop location polling & route refresh based on active trip
    useEffect(() => {
        const hasActiveTrip = !!assignedDriverId && (tripStatus === 'scheduled' || tripStatus === 'in_progress');
        if (hasActiveTrip) {
            startPolling();
            const routeInterval = setInterval(() => {
                setRouteRefreshKey(prev => prev + 1);
            }, 10000);
            return () => {
                stopPolling();
                clearInterval(routeInterval);
            };
        } else {
            stopPolling();
        }
    }, [assignedDriverId, tripStatus]);

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

    // Pre-ride browse: while a destination is set (but nothing confirmed yet), load the
    // shared vehicles going that way and keep their live seats fresh by re-polling.
    useEffect(() => {
        if (!origin || !destination || isConfirmed) {
            setBrowseDrivers([]);
            pendingDriversRef.current = [];
            return;
        }
        let cancelled = false;
        const load = async () => {
            try {
                const token = await getToken();
                let drivers: any[] = await findDrivers(origin, destination, token as string);
                if (selectedVehicleType !== 'all') {
                    drivers = (drivers || []).filter(
                        d => d.vehicleDetails?.vehicleType === selectedVehicleType
                    );
                }
                if (cancelled) return;
                setBrowseDrivers(drivers || []);
                pendingDriversRef.current = drivers || [];
            } catch (e) {
                console.error("Browse load error:", e);
            }
        };
        load();
        const browseInterval = setInterval(load, 10000);
        return () => { cancelled = true; clearInterval(browseInterval); };
    }, [origin, destination, isConfirmed, selectedVehicleType, getToken]);

    const { requestNextDriver, requestSpecificDriver, requestDriverAt, handleConfirmRide } = useRideRequestFlow({
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
        seatsNeeded,
    });

    useRideSocketEvents({
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
        setAvailableSeats,
    });

    // --- Event Handlers ---

    // Reset all ride/trip state back to defaults
    const resetRideState = () => {
        setAssignedDriverId(null);
        setDriverDetails(null);
        setTripId(null);
        setOtp(null);
        setTripStatus(null);
        setIsConfirmed(false);
        setDestination(null);
        setDestinationText("");
        setRouteDetails(null);
        setAvailableSeats(null);
    };

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

    const handleDismissReceipt = () => {
        resetRideState();
    };

    const handleCancelTrip = () => {
        if (tripStatus === 'in_progress') {
            Alert.alert("Cannot Cancel", "This trip is already in progress and cannot be canceled.");
            return;
        }
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

                        // Optimistic immediate UI reset so the user isn't stuck
                        // if the server's "trip-canceled" echo is delayed or lost
                        resetRideState();
                        setIsSearching(false);
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
            await updatePinFromCoords(region.latitude, region.longitude);
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
        seatsNeeded,
        availableSeats,
        browseDrivers,
        locations,
        assignedDriverId,
        mapComponents,
        mapRef,
        routeRefreshKey,

        // Setters needed by UI
        setSelectedVehicleType,
        setIsChoosingOnMap,
        setRouteDetails,
        setSeatsNeeded,

        // Derived
        assignedDriverLocation,
        computedDistance,

        // Handlers
        handleConfirmRide,
        requestSpecificDriver,
        requestDriverAt,
        handleCancelSearch,
        handleCancelTrip,
        handleDismissReceipt,
        handleDestinationSelect,
        handleClearRoute,
        handleChooseOnMap,
        handleConfirmPinLocation,
        handleRegionChangeComplete,
        handleDestinationPress,
    };
}
