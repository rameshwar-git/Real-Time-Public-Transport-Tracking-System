import React, { useEffect, useRef, useState } from "react";
import { Platform, View, StyleSheet, Animated, TouchableOpacity } from "react-native";
import { UserLocation } from "@/types/map";
import { Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { env } from "@/config/env";
import { getNearestNUsers, calculateRouteMatch, isValidCoord } from "@/utils/geometry";
import Ionicons from "@expo/vector-icons/Ionicons";

// Modular subcomponents
import { CenterPin } from "./CenterPin";
import { renderDestinationMarker } from "./DestinationMarker";
import { renderPassengerMarker } from "./PassengerMarker";
import { renderDriverMarker } from "./DriverMarker";

// GPS current-position view: animate to show ~100m of radius around the driver.
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
    activeTrips?: any[];
    isOnDuty?: boolean;
    onDestinationPress?: () => void;
    isChoosingOnMap?: boolean;
    incomingRequest?: any;
    passengerLocations?: { [passengerId: string]: { latitude: number; longitude: number } };
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
        activeTrips,
        isOnDuty,
        onDestinationPress,
        isChoosingOnMap,
        incomingRequest,
        passengerLocations
    }) => {
    const isLifted = useRef(false);
    const liftAnim = useRef(new Animated.Value(0)).current;

    // The driver's own live coordinate (from their shared location feed). The driver app shows
    // it as the standard blue current-location dot, and the camera follows it along the route.
    const ownLocation = locations.find((u: any) => u.userId === currentUserId)?.currentLocation;

    // Route refresh key — bumped every 10s while a route is on screen to force
    // MapViewDirections to re-fetch the route from Google as the driver moves.
    const [routeRefreshKey, setRouteRefreshKey] = useState(0);

    // Whether a live route polyline should be drawn and periodically refreshed.
    const isRouting = !!isOnDuty && isValidCoord(origin) && isValidCoord(destination) && !isChoosingOnMap;

    useEffect(() => {
        if (!isRouting) return;
        const id = setInterval(() => setRouteRefreshKey(k => k + 1), 10000);
        return () => clearInterval(id);
    }, [isRouting]);

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
        // Center on the driver's LIVE position (kept fresh by the location feed), falling
        // back to the one-time GPS origin. This keeps the GPS button following the driver
        // instead of snapping back to the stale startup fix.
        const center = ownLocation || origin;
        if (center && center.latitude && center.longitude && mapRef.current) {
            mapRef.current.animateToRegion(toGpsRegion(center), 2000);
        }
    };

    // Keep the camera centered on the driver whenever a route is on screen (on duty with a
    // destination), so upcoming street turns stay in view. Constant deltas mean the camera only
    // pans (never re-zooms), so live location updates don't cause auto zoom in/out.
    const shouldFollow = !!isOnDuty && !!origin && !!destination && !isChoosingOnMap;
    useEffect(() => {
        if (!shouldFollow || !ownLocation || !mapRef.current) return;
        if (
            typeof ownLocation.latitude !== 'number' ||
            typeof ownLocation.longitude !== 'number' ||
            isNaN(ownLocation.latitude) ||
            isNaN(ownLocation.longitude)
        ) return;
        mapRef.current.animateToRegion(toGpsRegion({ latitude: ownLocation.latitude, longitude: ownLocation.longitude }), 800);
    }, [ownLocation?.latitude, ownLocation?.longitude, shouldFollow]);

    // Accepted-but-not-yet-picked-up passengers become route waypoints, so the navigation
    // line reroutes through their pickup points on the way to the final destination.
    const scheduledPickups = (Array.isArray(activeTrips) ? activeTrips : [])
        .filter((t: any) => t.status === 'scheduled')
        .map((t: any) => t.origin)
        .filter((o: any) =>
            o && typeof o.latitude === 'number' && typeof o.longitude === 'number' &&
            !isNaN(o.latitude) && !isNaN(o.longitude) &&
            !(o.latitude === 0 && o.longitude === 0)
        );

    // A distinct "incoming request" pickup marker. Shown when a new passenger asks for a
    // ride while the driver is on duty, WITHOUT altering the existing route polyline.
    const renderRequestMarker = (Marker: any, key: string, coordinate: { latitude: number; longitude: number }) => (
        <Marker key={key} coordinate={coordinate} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.requestMarker}>
                <Ionicons name="person-add" size={16} color="#fff" />
            </View>
        </Marker>
    );

    if (!MapView || !mapRegion) {
        // We still need to return null if components are missing,
        // but we must ensure all hooks are declared before this point.
        return null;
    }

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
                        activeTripPassengers = activeTrips.map(t => {
                            if (t.status === 'scheduled') {
                                // Prefer the passenger's live position (falls back to booked
                                // pickup) so the driver sees them approach the pickup in real time.
                                const live = passengerLocations?.[t.passengerId];
                                return { userId: t.passengerId, currentLocation: live || t.origin };
                            }
                            if (t.status === 'in_progress') {
                                // Live passenger position (if known) so the driver sees them
                                // move toward/away from the vehicle in real time.
                                const live = passengerLocations?.[t.passengerId];
                                return { userId: t.passengerId, currentLocation: live || null };
                            }
                            return { userId: t.passengerId, currentLocation: null };
                        }).filter(u => u.currentLocation !== null);
                    }

                    const drivers = locations.filter((u: any) => u.currentLocation && u.userId !== currentUserId && !!u.vehicleId);

                    return [
                        ...(incomingRequest && incomingRequest.origin &&
                            typeof incomingRequest.origin.latitude === 'number' &&
                            typeof incomingRequest.origin.longitude === 'number' &&
                            !isNaN(incomingRequest.origin.latitude) && !isNaN(incomingRequest.origin.longitude)
                            ? [renderRequestMarker(Marker, `req_${incomingRequest.passengerId}`, incomingRequest.origin)]
                            : []),
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
                        key={`route-refresh-${routeRefreshKey}`}
                        origin={ownLocation || origin}
                        destination={destination}
                        waypoints={scheduledPickups}
                        apikey={env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}
                        strokeWidth={5}
                        strokeColor="blue"
                        mode="DRIVING"
                        onError={(err) => console.warn('[MapViewDirections] Route error:', err)}
                    />
                )}
                {isOnDuty && !isChoosingOnMap && !!destination && isValidCoord(destination) && renderDestinationMarker(
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
    requestMarker: {
        width: 30,
        height: 30,
        borderRadius: 15,
        backgroundColor: '#F59E0B',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.3,
        shadowRadius: 2,
        elevation: 4,
    },
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
