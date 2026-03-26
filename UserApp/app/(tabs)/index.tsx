import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform, Dimensions, Button, TouchableOpacity, KeyboardAvoidingView, } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { LocationSearchBox } from "@/components/map/LocationSearchBox";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPermission, reverseGeocode, getCurrentLocation } from "@/services/locationServices";
import { socket } from "@/services/socket";
import { getDistance, calculateRouteMatch, findNearestUser } from "@/utils/geometry";

export default function App() {
    const [userId, setUserId] = useState<string | null>(null);
    const [mapRegion, setMapRegion] = useState<any>({
        latitude: 15,
        longitude: 83,
        latitudeDelta: 30,
        longitudeDelta: 30,
    });
    const [destination, setDestination] = useState<any>(null);
    const [origin, setOrigin] = useState<any>(null);
    const [originText, setOriginText] = useState<string>("");
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    
    // Fetch live locations based on current origin
    const { locations } = useLiveLocations(origin);

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
            const handleOriginSelect = (coords: any) => {
                setOrigin({
                    latitude: coords.lat,
                    longitude: coords.lng,
                });
                mapRef.current?.animateToRegion(
                    { latitude: coords.lat, longitude: coords.lng, latitudeDelta: 0.007, longitudeDelta: 0.007 },
                    700
                );
            }
        }
    }, []);

    useEffect(() => {
        const initGPS = async () => {
            const hasPermission = await requestPermission();
            if (hasPermission) {
                const myLoc = await getCurrentLocation();
                if (myLoc) {
                    setOrigin(myLoc);
                    // Optionally center the map to the user's current GPS location right away
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

    // Broadcast live location on map before confirming
    useEffect(() => {
        if (userId && origin && !isConfirmed) {
            startSharing();
        }
    }, [userId, origin, isConfirmed]);

    // Reverse geocode the origin coordinates to populate the search bar
    useEffect(() => {
        const fetchAddress = async () => {
            if (origin && !originText) {
                const address = await reverseGeocode(origin.latitude, origin.longitude);
                if (address) setOriginText(address);
            }
        };
        fetchAddress();
    }, [origin, originText]);


    const handleConfirmRide = () => {
        if (!origin || !destination) {
            alert("Please set both origin and destination.");
            return;
        }

        const validDrivers = locations.filter((u: any) => {
            if (!u.vehicleId || !u.currentLocation || !u.destination) return false;

            const match = calculateRouteMatch(u.currentLocation, u.destination, origin, destination);

            // If driver is far from pickup (> 50km), ignore them
            if (match.pickupDist > 50) return false;

            return match.isMatch;
        });

        if (validDrivers.length === 0) {
            alert("No available drivers heading your way at the moment.");
            return;
        }

        const nearestDriver = findNearestUser(validDrivers, origin);

        if (!nearestDriver) {
            alert("Unexpected error finding nearest driver.");
            return;
        }

        setIsConfirmed(true);
        setAssignedDriverId(nearestDriver.userId);

        // Start broadcasting our passenger location to the backend
        startSharing(destination, 'confirmed');

        // Ask Backend to assign the passenger to this driver
        socket.emit("request-ride", {
            passengerId: userId,
            driverId: nearestDriver.userId,
            origin,
            destination
        });
    };

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.container}>
                    {!isConfirmed && (
                        <View style={styles.searchCard}>
                            <LocationSearchBox
                                placeholder="Destination"
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
                            destination={destination}
                            origin={origin}
                            mapRef={mapRef}
                            isConfirmed={isConfirmed}
                            assignedDriverId={assignedDriverId}
                        />
                    </View>

                    {/* BOTTOM UI STATES */}
                    {destination && !isConfirmed && (
                        <View style={styles.bottomView}>
                            <TouchableOpacity style={styles.btn} onPress={handleConfirmRide}>
                                <Text style={styles.btnText}>Confirm Ride</Text>
                            </TouchableOpacity>
                        </View>
                    )}

                    {isConfirmed && (
                        <View style={styles.bottomView}>
                            <Text style={styles.searchingText}>Looking for drivers nearby...</Text>
                            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={() => setIsConfirmed(false)}>
                                <Text style={styles.btnText}>Cancel Search</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 5, backgroundColor: "#fff" },

    searchCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 5,
        left: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 2,
        zIndex: 10,
        padding: 8,
    },
    originInput: {
        marginBottom: 5,
    },
    divider: {
        height: 1,
        backgroundColor: '#EAEAEA',
        marginHorizontal: 10,
        marginVertical: 5,
    },

    bottomView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    btn: {
        backgroundColor: "#000",
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    cancelBtn: {
        backgroundColor: "#D32F2F",
        marginTop: 15,
    },
    btnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    searchingText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 5,
        color: "#333",
    },
});