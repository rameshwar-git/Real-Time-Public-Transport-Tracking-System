import React, { useEffect, useRef } from "react";
import { Platform, View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { UserLocation } from "@/types/map";
import { Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { env } from "@/config/env";
import { isValidCoord } from "@/utils/geometry";
import Ionicons from "@expo/vector-icons/Ionicons";

// Modular subcomponents
import { CenterPin } from "./CenterPin";
import { renderDestinationMarker } from "./DestinationMarker";
import { renderDriverMarker } from "./DriverMarker";

// GPS current-position view: animate to show ~100m of radius around the user.
const GPS_RADIUS_METERS = 100;

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

    // Once a ride is accepted the map switches out of "current-location" mode into
    // vehicle-tracking mode: the blue current-location dot is hidden and the camera
    // follows the assigned driver's vehicle along the route.
    const isTracking =
        isConfirmed &&
        tripStatus != null &&
        tripStatus !== 'completed' &&
        tripStatus !== 'cancelled';

    // Follow the assigned vehicle at a stable street-level zoom while the trip is active.
    // Each live driver-location update re-centers on the vehicle along the route WITHOUT
    // changing the zoom (toGpsRegion keeps constant deltas = pure pan), so the map never
    // auto zooms in/out as coordinates stream in.
    useEffect(() => {
        if (!isTracking || !assignedDriverLocation || !mapRef.current) return;
        if (
            typeof assignedDriverLocation.latitude !== 'number' ||
            typeof assignedDriverLocation.longitude !== 'number' ||
            isNaN(assignedDriverLocation.latitude) ||
            isNaN(assignedDriverLocation.longitude)
        ) return;

        isAnimatingRef.current = true;
        mapRef.current.animateToRegion(toGpsRegion(assignedDriverLocation), 800);
        const release = setTimeout(() => {
            isAnimatingRef.current = false;
        }, 900);
        return () => clearTimeout(release);
    }, [assignedDriverLocation?.latitude, assignedDriverLocation?.longitude, isConfirmed, tripStatus]);

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

    // Build a map region that shows GPS_RADIUS_METERS of radius around a coordinate.
    // Using degree spans (not a pixel-based zoom) keeps the same spatial scale on any device.
    const toGpsRegion = (center: { latitude: number; longitude: number }): Region => {
        const latDelta = (GPS_RADIUS_METERS * 2) / 111320;
        const lonDelta = latDelta / Math.max(Math.cos((center.latitude * Math.PI) / 180), 0.01);
        return {
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta: latDelta,
            longitudeDelta: lonDelta,
        };
    };

    const handleCenterOnUser = () => {
        // While a ride is active, the GPS button follows the assigned VEHICLE (driver's live
        // position), so tapping it brings the car back into view. Otherwise it centers on the
        // passenger's own (origin) location.
        const center = isTracking && assignedDriverLocation
            ? assignedDriverLocation
            : origin;
        if (center && center.latitude && center.longitude && mapRef.current) {
            isAnimatingRef.current = true;
            mapRef.current.animateToRegion(toGpsRegion(center), 2000);
            // Release the guard after the animation completes
            setTimeout(() => {
                isAnimatingRef.current = false;
            }, 1100);
        }
    };

    return (
        <View style={{ flex: 1 }}>
            <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={mapRegion}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation={!isTracking}
                showsMyLocationButton={!isTracking}
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
                )}
                {isConfirmed && isValidCoord(assignedDriverLocation) && isValidCoord(tripStatus === 'in_progress' ? destination : origin) && (
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
                            // NOTE: no fitToCoordinates here on purpose. The auto-follow effect
                            // above owns the camera — it pans at a constant street zoom to keep the
                            // vehicle tracked. Fitting here would zoom out to the whole route on
                            // every 10s route refresh and fight the follow, causing the map to
                            // auto zoom in and out. We only report the live route distance/duration.
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
                {!isChoosingOnMap && !!destination && isValidCoord(destination) && renderDestinationMarker(
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
