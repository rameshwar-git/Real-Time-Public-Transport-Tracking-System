import React, { useEffect, useRef, useState } from "react";
import { View, StyleSheet, Platform, Dimensions, KeyboardAvoidingView } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPermission, reverseGeocode, getCurrentLocation } from "@/services/locationServices";
import { socket } from "@/services/socket";

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
    const [origin, setOrigin] = useState<any>(null);
    const [originText, setOriginText] = useState<string>("");
    const [isConfirmed, setIsConfirmed] = useState<boolean>(false);
    const [isSearching, setIsSearching] = useState<boolean>(false);

    const [tripId, setTripId] = useState<string | null>(null);
    const [driverDetails, setDriverDetails] = useState<any>(null);
    const [otp, setOtp] = useState<string | null>(null);
    const [tripStatus, setTripStatus] = useState<string | null>(null);

    const pendingDriversRef = useRef<any[]>([]);
    const currentDriverIndexRef = useRef<number>(0);
    const searchTimeoutRef = useRef<any>(null);

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
        if (userId && origin && !isConfirmed) {
            startSharing(destination, destination ? 'active' : 'inactive');
        }
    }, [userId, origin, isConfirmed, destination, startSharing]);

    useEffect(() => {
        const fetchAddress = async () => {
            if (origin && !originText) {
                const address = await reverseGeocode(origin.latitude, origin.longitude);
                if (address) setOriginText(address);
            }
        };
        fetchAddress();
    }, [origin, originText]);

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
        stopSharing,
    });

    const handleCancelSearch = () => {
        const currentDriver = pendingDriversRef.current[currentDriverIndexRef.current];
        if (currentDriver && currentDriver.userId) {
            socket.emit('cancel-request', { driverId: currentDriver.userId, passengerId: userId });
        }
        setIsConfirmed(false);
        setIsSearching(false);
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };

    const handleCancelTrip = () => {
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
        stopSharing();
        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);
    };

    const handleDestinationSelect = (coords: any) => {
        const destinationCoords = {
            latitude: coords.lat,
            longitude: coords.lng,
        };
        setDestination(destinationCoords);
        startSharing(destinationCoords, 'active');
        mapRef.current?.animateToRegion(
            { ...destinationCoords, latitudeDelta: 0.007, longitudeDelta: 0.007 },
            700
        );
    };

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.container}>
                    {!isConfirmed && (
                        <LocationSearchCard onSelect={handleDestinationSelect} />
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

                    {destination && !isConfirmed && (
                        <RideConfirmationBottomView onConfirm={handleConfirmRide} />
                    )}

                    {isConfirmed && isSearching && (
                        <SearchingDriversBottomView onCancel={handleCancelSearch} />
                    )}

                    {isConfirmed && !isSearching && assignedDriverId && (
                        <RideStatusBottomSheet 
                            tripStatus={tripStatus}
                            otp={otp}
                            driverDetails={driverDetails}
                            onCancelTrip={handleCancelTrip}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 5, backgroundColor: "#fff" }
});