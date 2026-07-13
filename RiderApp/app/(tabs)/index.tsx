import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, Alert, Text } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { DestinationSearch } from "@components/map/DestinationSearch";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft, MapPin } from "lucide-react-native";
import { requestPermission, getCurrentLocation, reverseGeocode } from "@/services/locationServices";
import { socket } from "@/services/socket";
import { getActiveDriverTrips, getDriverProfile } from "@/services/apiService";

// Driver Hooks
import { useDriverSocketEvents } from "@/hooks/driver/useDriverSocketEvents";
import { useAutoDropoff } from "@/hooks/driver/useAutoDropoff";

// Driver Components
import { IncomingRequestCard } from "@/components/driver/IncomingRequestCard";
import { OtpVerificationModal } from "@/components/driver/OtpVerificationModal";
import { ActiveTripsList } from "@/components/driver/ActiveTripsList";
import { DutyToggle } from "@/components/driver/DutyToggle";

export default function DriverDashboard() {
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
    const [otpModalVisible, setOtpModalVisible] = useState(false);
    const [currentOtpTrip, setCurrentOtpTrip] = useState<any>(null);
    const [otpInput, setOtpInput] = useState('');
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

    const verifyOtp = () => {
        if (!currentOtpTrip || !otpInput) return;
        socket.emit("verify-otp", { tripId: currentOtpTrip.tripId, otp: otpInput });

        setActiveTrips(prev => prev.map(t => t.tripId === currentOtpTrip.tripId ? { ...t, status: 'in_progress' } : t));
        setOtpModalVisible(false);
        setOtpInput('');
        setCurrentOtpTrip(null);
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



    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <View style={styles.container}>
                {/* Unified Floating Top Bar (Destination Search + Duty Toggle) */}
                {!isChoosingOnMap && (
                    <View style={styles.unifiedTopBar}>
                        <View style={styles.searchWrapper}>
                            <DestinationSearch
                                placeholder="Set your destination..."
                                initialQuery={destinationText}
                                onSelect={async (coords: any) => {
                                    if (!coords) {
                                        setDestination(null);
                                        setDestinationText("");
                                        return;
                                    }
                                    // Automatically go on duty in background - check permission first
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
                                }}
                                onFocus={() => {
                                    // Tapping the search input turns off duty so the driver can edit it
                                    if (isOnDuty) {
                                        setIsOnDuty(false);
                                    }
                                }}
                                onChooseOnMap={handleChooseOnMap}
                            />
                        </View>
                    </View>
                )}

                {isChoosingOnMap && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setIsChoosingOnMap(false)}
                    >
                        <ArrowLeft size={16} color="#F8FAFC" />
                        <Text style={styles.backButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}

                {incomingRequest && (
                    <IncomingRequestCard
                        incomingRequest={incomingRequest}
                        onAccept={handleAcceptRide}
                        onReject={handleRejectRide}
                    />
                )}

                <View style={{ height: mapHeight }}>
                    <MapViewComponent
                        MapView={MapView}
                        Marker={Marker}
                        mapRegion={mapRegion}
                        setMapRegion={handleRegionChangeComplete}
                        locations={locations}
                        currentUserId={userId}
                        destination={activeTrips.length > 0 ? (activeTrips.find(t => t.status === 'scheduled')?.origin || destination) : destination}
                        origin={origin}
                        mapRef={mapRef}
                        activeTrips={activeTrips}
                        isOnDuty={isOnDuty}
                        onDestinationPress={() => {
                            if (activeTrips.length === 0) {
                                setDestination(null);
                                setDestinationText("");
                                setIsOnDuty(false);
                            }
                        }}
                        isChoosingOnMap={isChoosingOnMap}
                    />
                </View>

                {!isChoosingOnMap && activeTrips.length === 0 && (
                    <View style={styles.floatingDutyPanel}>
                        <Text style={[styles.dutyPanelText, { color: isOnDuty ? '#10B981' : '#94A3B8' }]}>
                            {isOnDuty ? "ONLINE" : "OFFLINE"}
                        </Text>
                        <DutyToggle
                            isOnDuty={isOnDuty}
                            onToggle={toggleDutyStatus}
                            disabled={activeTrips.length > 0}
                        />
                    </View>
                )}

                {isChoosingOnMap && (
                    <View style={styles.pinLocationCard}>
                        <Text style={styles.pinLocationLabel}>CONFIRM DESTINATION</Text>
                        <View style={styles.pinAddressContainer}>
                            <MapPin size={18} color="#10B981" style={{ marginRight: 8 }} />
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

                <OtpVerificationModal
                    visible={otpModalVisible}
                    passengerName={currentOtpTrip?.passengerName || ''}
                    otpInput={otpInput}
                    setOtpInput={setOtpInput}
                    onCancel={() => setOtpModalVisible(false)}
                    onVerify={verifyOtp}
                />

                {activeTrips.length > 0 && (
                    <View style={styles.bottomView}>
                        <ActiveTripsList
                            activeTrips={activeTrips}
                            onOpenOtp={(trip) => {
                                setCurrentOtpTrip(trip);
                                setOtpModalVisible(true);
                            }}
                            onCancelTrip={handleCancelTrip}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 15,
        backgroundColor: '#1E293B',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    backButtonText: {
        color: '#F8FAFC',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
    pinLocationCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    pinLocationLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    pinAddressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        marginBottom: 18,
    },
    pinAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F8FAFC',
        flex: 1,
    },
    confirmPinButton: {
        backgroundColor: '#10B981',
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

    unifiedTopBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 10,
        borderWidth: 1.5,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999,
        gap: 12,
    },
    searchWrapper: {
        flex: 1,
    },
    bottomView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#1E293B",
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        borderWidth: 1.5,
        borderColor: "#334155",
    },
    floatingDutyPanel: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 25,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        borderWidth: 1.5,
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 999,
    },
    dutyPanelText: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});

