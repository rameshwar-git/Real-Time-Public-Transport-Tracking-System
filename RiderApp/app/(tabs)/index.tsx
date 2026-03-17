import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Platform, Dimensions, TouchableOpacity, Alert } from "react-native";
import { useLiveLocations } from "@/hooks/location/useLiveLocations";
import { useLocationSharing } from "@/hooks/location/useLocationSharing";
import { getUserId } from "@/services/storageService";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { SafeAreaView } from "react-native-safe-area-context";
import { requestPermission, getCurrentLocation } from "@/services/locationServices";

export default function DriverDashboard() {
    const { locations } = useLiveLocations();
    const [userId, setUserId] = useState<string | null>(null);
    const [mapRegion, setMapRegion] = useState<any>({
        latitude: 15,
        longitude: 83,
        latitudeDelta: 30,
        longitudeDelta: 30,
    });
    
    // Driver States
    const [origin, setOrigin] = useState<any>(null);
    const [isOnDuty, setIsOnDuty] = useState<boolean>(false);
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

    const toggleDutyStatus = async () => {
        if (isOnDuty) {
            stopSharing();
            setIsOnDuty(false);
            Alert.alert("Status Updated", "You are now Offline.");
        } else {
            const hasPermission = await requestPermission();
            if (!hasPermission) {
                Alert.alert("Permission Required", "Background location is required to go on duty.");
                return;
            }
            await startSharing();
            setIsOnDuty(true);
            Alert.alert("Status Updated", "You are now ONLINE and sharing your location.");
        }
    };

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;

    return (
        <SafeAreaView style={{ flex: 1 }}>
            <View style={styles.container}>
                {/* STATUS BAR TOP */}
                <View style={styles.statusHeaderCard}>
                    <Text style={styles.statusLabel}>Current Status:</Text>
                    <Text style={[styles.statusText, { color: isOnDuty ? "#4CAF50" : "#F44336" }]}>
                        {isOnDuty ? "ONLINE (ON DUTY)" : "OFFLINE"}
                    </Text>
                </View>

                {/* MAP VIEW */}
                <View style={{ height: mapHeight }}>
                    <MapViewComponent
                        MapView={MapView}
                        Marker={Marker}
                        mapRegion={mapRegion}
                        setMapRegion={setMapRegion}
                        locations={locations}
                        currentUserId={userId}
                        destination={null}
                        origin={origin}
                        mapRef={mapRef}
                    />
                </View>

                {/* BOTTOM ACTION BUTTON */}
                <View style={styles.bottomView}>
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

    statusHeaderCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 30,
        alignSelf: 'center',
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 10,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
        color: '#555',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
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

