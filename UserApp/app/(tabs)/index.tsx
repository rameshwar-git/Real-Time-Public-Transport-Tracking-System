import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Dimensions, KeyboardAvoidingView, Text, TouchableOpacity, Alert } from "react-native";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPermission, reverseGeocode, getCurrentLocation } from "@/services/locationServices";
import { socket } from "@/services/socket";
import { getDistance } from "@/utils/geometry";
import { getActiveTrip } from "@/services/apiService";

// Ride Components
import { LocationSearchCard } from "@/components/ride/LocationSearchCard";
import { RideConfirmationBottomView } from "@/components/ride/RideConfirmationBottomView";
import { SearchingDriversBottomView } from "@/components/ride/SearchingDriversBottomView";
import { RideStatusBottomSheet } from "@/components/ride/RideStatusBottomSheet";

// Ride Hooks
import { useRideSocketEvents } from "@/hooks/ride/useRideSocketEvents";
import { useRideRequestFlow } from "@/hooks/ride/useRideRequestFlow";

export default function App() {
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
    const mapHeight = Math.round(Dimensions.get("window").height);

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

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.container}>
                    {!isConfirmed && !isChoosingOnMap && (
                        <LocationSearchCard
                            onSelect={handleDestinationSelect}
                            onClear={handleClearRoute}
                            initialQuery={destinationText}
                            onChooseOnMap={handleChooseOnMap}
                        />
                    )}

                    {isChoosingOnMap && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setIsChoosingOnMap(false)}
                        >
                            <ArrowLeft size={16} color="#1E293B" />
                            <Text style={styles.backButtonText}>Cancel</Text>
                        </TouchableOpacity>
                    )}

                    <View style={{ height: mapHeight }}>
                        <MapViewComponent
                            MapView={MapView}
                            Marker={Marker}
                            mapRegion={mapRegion}
                            setMapRegion={handleRegionChangeComplete}
                            locations={locations}
                            currentUserId={userId}
                            destination={destination}
                            origin={origin}
                            mapRef={mapRef}
                            isConfirmed={isConfirmed}
                            assignedDriverId={assignedDriverId}
                            assignedDriverLocation={locations.find((u: any) => u.userId === assignedDriverId)?.currentLocation}
                            tripStatus={tripStatus}
                            onRouteDetailsUpdated={setRouteDetails}
                            onDestinationPress={() => {
                                if (!isConfirmed) {
                                    setDestination(null);
                                    setRouteDetails(null);
                                }
                            }}
                            isChoosingOnMap={isChoosingOnMap}
                            selectedVehicleType={selectedVehicleType}
                        />
                    </View>

                    {isChoosingOnMap && (
                        <View style={styles.pinLocationCard}>
                            <Text style={styles.pinLocationLabel}>CONFIRM DESTINATION</Text>
                            <View style={styles.pinAddressContainer}>
                                <MapPin size={18} color="#4F46E5" style={{ marginRight: 8 }} />
                                <Text style={styles.pinAddressText} numberOfLines={2}>
                                    {pinAddress || "Locating..."}
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.confirmPinButton}
                                onPress={handleConfirmPinLocation}
                            >
                                <Text style={styles.confirmPinButtonText}>Confirm Destination</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {destination && !isConfirmed && !isChoosingOnMap && (
                        <RideConfirmationBottomView
                            onConfirm={handleConfirmRide}
                            selectedVehicleType={selectedVehicleType}
                            setSelectedVehicleType={setSelectedVehicleType}
                            distance={routeDetails?.distance || (origin && destination ? getDistance(origin.latitude, origin.longitude, destination.latitude, destination.longitude) : undefined)}
                        />
                    )}

                    {isConfirmed && isSearching && (
                        <SearchingDriversBottomView
                            onCancel={handleCancelSearch}
                            drivers={matchedDrivers}
                            currentDriverIndex={currentDriverIndex}
                        />
                    )}

                    {isConfirmed && !isSearching && assignedDriverId && (
                        <RideStatusBottomSheet
                            tripStatus={tripStatus}
                            otp={otp}
                            driverDetails={driverDetails}
                            onCancelTrip={handleCancelTrip}
                            assignedDriverLocation={locations.find((u: any) => u.userId === assignedDriverId)?.currentLocation}
                            origin={origin}
                            destination={destination}
                            routeDetails={routeDetails}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 5, backgroundColor: "#fff" },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
    },
    backButtonText: {
        color: '#1E293B',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    pinLocationCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
    },
    pinLocationLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    pinAddressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderColor: '#E2E8F0',
        borderWidth: 1,
        borderRadius: 14,
        padding: 14,
        marginBottom: 18,
    },
    pinAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#1E293B',
        flex: 1,
    },
    confirmPinButton: {
        backgroundColor: '#4F46E5',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmPinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});