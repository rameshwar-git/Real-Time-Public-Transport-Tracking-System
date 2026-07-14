import React, { useRef } from "react";
import { Platform, View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { UserLocation } from "@/types/map";
import { Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { env } from "@/config/env";
import { getNearestNUsers, calculateRouteMatch } from "@/utils/geometry";
import Ionicons from "@expo/vector-icons/Ionicons";

// Modular subcomponents
import { CenterPin } from "./CenterPin";
import { renderDestinationMarker } from "./DestinationMarker";
import { renderPassengerMarker } from "./PassengerMarker";
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
    activeTrips?: any[];
    isOnDuty?: boolean;
    onDestinationPress?: () => void;
    isChoosingOnMap?: boolean;
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
        activeTrips,
        isOnDuty,
        onDestinationPress,
        isChoosingOnMap
    }) => {
    const isLifted = useRef(false);
    const liftAnim = useRef(new Animated.Value(0)).current;

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
            mapRef.current.animateToRegion({
                latitude: origin.latitude,
                longitude: origin.longitude,
                latitudeDelta: 0.0040, // zoom level for radius
                longitudeDelta: 0.0040,
            }, 1000);
        }
    };

    // Reject 0,0 / NaN / null coords — prevents Google Maps NOT_FOUND errors
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
                region={mapRegion}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass
                rotateEnabled={false}
                pitchEnabled
                provider={Platform.OS === "android" ? MapView.PROVIDER_GOOGLE : undefined}
            >
                {(() => {
                    if (!origin) return null;

                    // Stop rendering passengers if the driver is offline.
                    if (!isOnDuty && (!activeTrips || activeTrips.length === 0)) return null;

                    if (!Array.isArray(locations)) return null;

                    const passengers = locations.filter((u: any) => {
                        if (!u.currentLocation || u.userId === currentUserId || !!u.vehicleId || (u.status !== 'confirmed' && u.status !== 'active')) {
                            return false;
                        }

                        if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && u.destination && typeof u.destination.latitude === 'number' && typeof u.destination.longitude === 'number' && u.currentLocation && typeof u.currentLocation.latitude === 'number' && typeof u.currentLocation.longitude === 'number') {
                            try {
                                const match = calculateRouteMatch(origin, destination, u.currentLocation, u.destination);
                                if (match.pickupDist > 5) return false;
                                return match.isMatch;
                            } catch (e) {
                                return false;
                            }
                        }
                        return true;
                    });

                    const nearestPassengers = getNearestNUsers(passengers, origin, 5);

                    let activeTripPassengers: any[] = [];
                    if (activeTrips && activeTrips.length > 0) {
                        activeTripPassengers = activeTrips.map(t => ({
                            userId: t.passengerId,
                            currentLocation: t.status === 'scheduled' ? t.origin : null,
                        })).filter(u => u.currentLocation !== null);
                    }

                    const drivers = locations.filter((u: any) => u.currentLocation && u.userId !== currentUserId && !!u.vehicleId);

                    return [
                        ...nearestPassengers.map((u: any) => {
                            if (!u.currentLocation || typeof u.currentLocation.latitude !== 'number' || typeof u.currentLocation.longitude !== 'number' || isNaN(u.currentLocation.latitude) || isNaN(u.currentLocation.longitude)) return null;
                            return renderPassengerMarker(
                                Marker,
                                `p_${u.userId || u._id}`,
                                u.currentLocation
                            );
                        }).filter(Boolean),
                        ...activeTripPassengers.map((u: any) => {
                            if (!u.currentLocation || typeof u.currentLocation.latitude !== 'number' || typeof u.currentLocation.longitude !== 'number' || isNaN(u.currentLocation.latitude) || isNaN(u.currentLocation.longitude)) return null;
                            return renderPassengerMarker(
                                Marker,
                                `act_${u.userId}`,
                                u.currentLocation
                            );
                        }).filter(Boolean),
                        ...drivers.map((u: any) => {
                            if (!u.currentLocation || typeof u.currentLocation.latitude !== 'number' || typeof u.currentLocation.longitude !== 'number' || isNaN(u.currentLocation.latitude) || isNaN(u.currentLocation.longitude)) return null;
                            return renderDriverMarker(
                                Marker,
                                `d_${u.userId || u._id}`,
                                u.currentLocation,
                                u.vehicleId?.vehicleType
                            );
                        }).filter(Boolean)
                    ];
                })()}
                {isOnDuty && isValidCoord(origin) && isValidCoord(destination) && (
                    <MapViewDirections
                        origin={origin}
                        destination={destination}
                        apikey={env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor="blue"
                        mode="DRIVING"
                        onReady={(result) => {
                            mapRef.current?.fitToCoordinates(result.coordinates, {
                                edgePadding: { top: 80, right: 60, bottom: 220, left: 60 },
                                animated: true,
                            });
                        }}
                        onError={(err) => console.warn('[MapViewDirections] Route error:', err)}
                    />
                )}
                {isOnDuty && !isChoosingOnMap && isValidCoord(destination) && renderDestinationMarker(
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
                    <Ionicons name="locate" size={24} color="#10B981" />
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1 },
    gpsButton: {
        position: 'absolute',
        bottom: 140, // Float above bottom panels
        right: 16,
        backgroundColor: '#1E293B',
        width: 48,
        height: 48,
        borderRadius: 24,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 5,
        zIndex: 999,
    }
});
