import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform, Dimensions, Button, TouchableOpacity, } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { DestinationSearch } from "@components/map/DestinationSearch";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPermission } from "@/services/locationServices";
import { getCurrentLocation } from "@/hooks/location/getCurrentLocation";


export default function App() {
    const { locations } = useLiveLocations();
    const [userId, setUserId] = useState<string | null>(null);
    const [mapRegion, setMapRegion] = useState<any>({
        latitude: 15,
        longitude: 83,
        latitudeDelta: 30,
        longitudeDelta: 30,
    });
    const [destination, setDestination] = useState<any>(null);
    const [origin, setOrigin] = useState<any>(null);
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
        requestPermission();
        const current = locations.find((u) => u.userId === userId && u.currentLocation);
        if (current) {
            setOrigin(current.currentLocation);
        }

        const first = locations.find((u) => u.currentLocation);
        if (first && !mapRegion) {
            setMapRegion({
                latitude: first.currentLocation.latitude,
                longitude: first.currentLocation.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            });
        }
    }, [locations, userId]);

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                <DestinationSearch
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
                    />
                </View>
                <View style={styles.bottomView}>
                    <TouchableOpacity style={styles.btn} onPress={() => console.log("Pressed")}>
                        <Text style={styles.btnText}>Confirm</Text>
                    </TouchableOpacity>
                </View>

            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 5 },

    bottomView: {
        position: 'absolute',
        bottom: -10,
        left: 5,
        right: 5,
        backgroundColor: "#fff",
    },
    btn: {
        backgroundColor: "#000",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 10,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "600",
    },
});

