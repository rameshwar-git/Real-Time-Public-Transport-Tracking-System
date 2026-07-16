import React, { useRef } from "react";
import { Platform, View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { UserLocation } from "@/types/map";
import { Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { env } from "@/config/env";
import Ionicons from "@expo/vector-icons/Ionicons";

// Modular subcomponents
import { CenterPin } from "./CenterPin";
import { renderDestinationMarker } from "./DestinationMarker";
import { renderDriverMarker } from "./DriverMarker";

type Props = {
    MapView: any;
    Marker: any;
    mapRegion: Region;
    setMapRegion: (r: Region) => void;
    locations: UserLocation[];
    currentUserId: string | null;
    destination: any;
    origin: any;
    mapRef: any;
    isConfirmed?: boolean;
    assignedDriverId?: string | null;
    assignedDriverLocation?: { latitude: number; longitude: number } | null;
    tripStatus?: string | null;
    onRouteDetailsUpdated?: (details: { distance: number; duration: number }) => void;
    onDestinationPress?: () => void;
    isChoosingOnMap?: boolean;
    selectedVehicleType?: 'all' | 'tricycle' | 'bus';
    routeRefreshKey?: number;
};

export const MapViewComponent: React.FC<Props> = (
    {
        MapView,
        Marker,
        mapRegion,
        setMapRegion,
        locations,
        currentUserId,
        destination,
        origin,
        mapRef,
        isConfirmed,
        assignedDriverId,
        assignedDriverLocation,
        tripStatus,
        onRouteDetailsUpdated,
        onDestinationPress,
        isChoosingOnMap,
        selectedVehicleType = 'all',
        routeRefreshKey = 0
    }) => {
    const isLifted = useRef(false);
    const liftAnim = useRef(new Animated.Value(0)).current;
    const isAnimatingRef = useRef(false);

    if (!MapView || !mapRegion) return null;

    const handleRegionChange = () => {
        if (!isLifted.current) {
            isLifted.current = true;
            Animated.timing(liftAnim, {
                toValue: -18,
                duration: 150,
                useNativeDriver: true
            }).start();
        }
    };

    const handleRegionChangeComplete = (region: Region) => {
        // Skip state updates during programmatic camera animations to avoid fighting the zoom
        if (isAnimatingRef.current) return;
        setMapRegion(region);
        isLifted.current = false;
        Animated.spring(liftAnim, {
            toValue: 0,
            friction: 4,
            tension: 50,
            useNativeDriver: true
        }).start();
    };

    const handleCenterOnUser = () => {
        if (origin && origin.latitude && origin.longitude && mapRef.current) {
            isAnimatingRef.current = true;
            mapRef.current.animateCamera(
                {
                    center: {
                        latitude: origin.latitude,
                        longitude: origin.longitude,
                    },
                    zoom: 18, // street-level zoom (~100m radius)
                },
                { duration: 1000 }
            );
            // Release the guard after animation completes
            setTimeout(() => {
                isAnimatingRef.current = false;
            }, 1100);
        }
    };

    // Reject any coordinate that is 0,0 / NaN / missing — sends NOT_FOUND to Google
    const isValidCoord = (c: any): boolean =>
        c != null &&
        typeof c.latitude === 'number' &&
        typeof c.longitude === 'number' &&
        !isNaN(c.latitude) &&
        !isNaN(c.longitude) &&
        !(c.latitude === 0 && c.longitude === 0);

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={mapRegion}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass
                rotateEnabled={false}
                pitchEnabled
                provider={Platform.OS === "android" ? MapView.PROVIDER_GOOGLE : undefined}
            >
                {Array.isArray(locations) && locations.map((u: any) => 
                    renderDriverMarker(
                        Marker,
                        u,
                        currentUserId,
                        selectedVehicleType,
                        isConfirmed,
                        assignedDriverId,
                        origin,
                        destination
                    )
                )}
                {!isConfirmed && isValidCoord(origin) && isValidCoord(destination) && (
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor="blue"
                        onReady={(result) => {
                            mapRef.current?.fitToCoordinates(result.coordinates);
                        }}
                    />
                )}                {isConfirmed && isValidCoord(assignedDriverLocation) && isValidCoord(tripStatus === 'in_progress' ? destination : origin) && (
                    <MapViewDirections
                        key={`route-refresh-${routeRefreshKey}`}
                        origin={assignedDriverLocation!}
                        destination={(tripStatus === 'in_progress' ? destination : origin)!}
                        apikey={env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor="#4F46E5"
                        mode="DRIVING"
                        precision="high"
                        timePrecision="now"
                        onReady={(result) => {
                            // Always fit map to the live route so it's visible on reopen
                            if (result.coordinates?.length > 1) {
                                mapRef.current?.fitToCoordinates(result.coordinates, {
                                    edgePadding: { top: 80, right: 60, bottom: 300, left: 60 },
                                    animated: true,
                                });
                            }
                            if (onRouteDetailsUpdated) {
                                onRouteDetailsUpdated({
                                    distance: result.distance,
                                    duration: result.duration,
                                });
                            }
                        }}
                        onError={(err) => console.warn('[MapViewDirections] Route error:', err)}
                    />
                )}
                {!isChoosingOnMap && destination && isValidCoord(destination) && renderDestinationMarker(
                    Marker,
                    destination,
                    onDestinationPress
                )}
            </MapView>
            <CenterPin
                isChoosingOnMap={!!isChoosingOnMap}
                liftAnim={liftAnim}
            />
            {origin && (
                <TouchableOpacity
                    style={styles.gpsButton}
                    onPress={handleCenterOnUser}
                    activeOpacity={0.8}
                >
                    <Ionicons name="locate" size={24} color="#4F46E5" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gpsButton: {
        position: 'absolute',
        bottom: 140, // Positioned above the bottom card elements
        right: 16,
        backgroundColor: '#FFFFFF',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 999,
    }
});
