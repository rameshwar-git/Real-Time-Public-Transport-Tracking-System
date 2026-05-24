import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, Alert, Text } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { DestinationSearch } from "@components/map/DestinationSearch";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPermission, getCurrentLocation } from "@/services/locationServices";
import { socket } from "@/services/socket";

// Driver Hooks
import { useDriverSocketEvents } from "@/hooks/driver/useDriverSocketEvents";
import { useAutoDropoff } from "@/hooks/driver/useAutoDropoff";

// Driver Components
import { DriverStatusHeader } from "@/components/driver/DriverStatusHeader";
import { IncomingRequestCard } from "@/components/driver/IncomingRequestCard";
import { OtpVerificationModal } from "@/components/driver/OtpVerificationModal";
import { ActiveTripsList } from "@/components/driver/ActiveTripsList";

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
    const [isOnDuty, setIsOnDuty] = useState<boolean>(false);
    const [activeTrips, setActiveTrips] = useState<any[]>([]);
    const [incomingRequest, setIncomingRequest] = useState<any>(null);
    
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
        if (userId && origin && !isOnDuty) {
            startSharing();
        }
    }, [userId, origin, isOnDuty, startSharing]);

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
            destination: incomingRequest.destination
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
            stopSharing();
            setIsOnDuty(false);
            setActiveTrips([]);
            setDestination(null);
            Alert.alert("Status Updated", "You are now Offline.");
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
            await startSharing(destination, 'on-duty');
            setIsOnDuty(true);
            Alert.alert("Status Updated", "You are now ONLINE and sharing your location.");
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
            { text: "Yes", onPress: () => {
                socket.emit('cancel-trip', { tripId: trip.tripId, canceledBy: 'driver' });
                setActiveTrips(prev => prev.filter(t => t.tripId !== trip.tripId));
            }, style: 'destructive' }
        ]);
    };

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <DriverStatusHeader isOnDuty={isOnDuty} />

                {incomingRequest && (
                    <IncomingRequestCard 
                        onAccept={handleAcceptRide} 
                        onReject={handleRejectRide} 
                    />
                )}

                {!isOnDuty && (
                    <View style={styles.searchCard}>
                        <DestinationSearch
                            placeholder="Set your destination..."
                            style={styles.destInput}
                            onSelect={(coords: any) => {
                                const destinationCoords = {
                                    latitude: coords.lat,
                                    longitude: coords.lng,
                                };
                                setDestination(destinationCoords);
                                mapRef.current?.animateToRegion(
                                    { ...destinationCoords, latitudeDelta: 0.007, longitudeDelta: 0.007 },
                                    700
                                );
                            }}
                        />
                    </View>
                )}

                <View style={{ height: mapHeight }}>
                    <MapViewComponent
                        MapView={MapView}
                        Marker={Marker}
                        mapRegion={mapRegion}
                        setMapRegion={setMapRegion}
                        locations={locations}
                        currentUserId={userId}
                        destination={activeTrips.length > 0 ? (activeTrips.find(t => t.status === 'scheduled')?.origin || destination) : destination}
                        origin={origin}
                        mapRef={mapRef}
                        activeTrips={activeTrips}
                        isOnDuty={isOnDuty}
                    />
                </View>

                <OtpVerificationModal 
                    visible={otpModalVisible}
                    passengerName={currentOtpTrip?.passengerName || ''}
                    otpInput={otpInput}
                    setOtpInput={setOtpInput}
                    onCancel={() => setOtpModalVisible(false)}
                    onVerify={verifyOtp}
                />

                <View style={styles.bottomView}>
                    <ActiveTripsList 
                        activeTrips={activeTrips}
                        onOpenOtp={(trip) => {
                            setCurrentOtpTrip(trip);
                            setOtpModalVisible(true);
                        }}
                        onCancelTrip={handleCancelTrip}
                    />
                    
                    <TouchableOpacity
                        style={[styles.btn, isOnDuty ? styles.offlineBtn : styles.onlineBtn]}
                        onPress={toggleDutyStatus}
                    >
                        <Text style={styles.btnText}>
                            {isOnDuty ? "GO OFFLINE" : "GO ON DUTY"}
                        </Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#fff" },

    searchCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 90,
        left: 15,
        right: 15,
        backgroundColor: '#fff',
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 10,
        padding: 10,
    },
    destInput: {
        marginTop: 5,
    },

    bottomView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    btn: {
        paddingVertical: 18,
        borderRadius: 15,
        alignItems: "center",
    },
    onlineBtn: {
        backgroundColor: "#000",
    },
    offlineBtn: {
        backgroundColor: "#F44336",
    },
    btnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});
