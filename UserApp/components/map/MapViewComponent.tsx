import React from "react";
import { Platform, View, Image, StyleSheet } from "react-native";
import { UserLocation } from "@/types/map";
import { Region } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { env } from "@/config/env";
import { getDistance, calculateRouteMatch } from "@/utils/geometry";

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
        selectedVehicleType = 'all'
    }) => {
    if (!MapView || !mapRegion) return null;

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
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            rotateEnabled={false}
            pitchEnabled
            provider={Platform.OS === "android" ? MapView.PROVIDER_GOOGLE : undefined}
        >
            {Array.isArray(locations) && locations.map((u: any) => {
                if (!u.currentLocation || typeof u.currentLocation.latitude !== 'number' || typeof u.currentLocation.longitude !== 'number' || isNaN(u.currentLocation.latitude) || isNaN(u.currentLocation.longitude)) return null;
                if (u.userId === currentUserId) return null;

                const isDriver = !!u.vehicleId;
                if (!isDriver) return null;

                if (selectedVehicleType !== 'all') {
                    const type = u.vehicleId && typeof u.vehicleId === 'object' ? u.vehicleId.vehicleType : null;
                    if (type !== selectedVehicleType) return null;
                }

                let title = "Driver";
                let description = "Available";

                if (isDriver) {
                    if (isConfirmed && assignedDriverId) {
                        if (u.userId !== assignedDriverId) return null;
                        const vType = u.vehicleId && typeof u.vehicleId === 'object' && u.vehicleId.vehicleType
                            ? String(u.vehicleId.vehicleType)
                            : (typeof u.vehicleId === 'string' ? u.vehicleId : 'vehicle');
                        const formattedType = vType.charAt(0).toUpperCase() + vType.slice(1);
                        title = `Assigned Driver (${formattedType})`;
                        description = "En route";
                    } else if (origin && destination && u.destination) {
                        const match = calculateRouteMatch(u.currentLocation, u.destination, origin, destination);
                        console.log(`[RouteMatch] Driver ${u.userId}: percentage=${match.percentage.toFixed(1)}%, pickupDist=${match.pickupDist.toFixed(2)}km, isMatch=${match.isMatch}`);
                        if (match.pickupDist > 2) return null;
                        if (match.percentage < 5 || !match.isMatch) return null;
                        title = `Driver (${match.percentage.toFixed(0)}% RouteMatch)`;
                        description = `Pickup: ${match.pickupDist.toFixed(2)} km away`;
                    } else if (origin && !destination && typeof origin.latitude === 'number' && typeof origin.longitude === 'number') {
                        const dist = getDistance(origin.latitude, origin.longitude, u.currentLocation.latitude, u.currentLocation.longitude);
                        if (dist > 2) return null;
                        title = "Driver Nearby";
                        description = `Distance: ${dist.toFixed(2)} km`;
                    }
                }

                return (
                    <React.Fragment key={u.userId || u._id}>
                        <Marker
                            coordinate={u.currentLocation}
                            title={title}
                            description={description}
                            image={
                                isDriver
                                    ? (u.vehicleId?.vehicleType === 'tricycle'
                                        ? require("@assets/map/tricycle.png")
                                        : require("@assets/map/bus.png"))
                                    : require("@assets/map/tricycle.png")
                            }
                        />
                    </React.Fragment>
                );

            })}
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
            {!isChoosingOnMap && destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && !isNaN(destination.latitude) && !isNaN(destination.longitude) && (
                <Marker
                    coordinate={destination}
                    title="Destination"
                    description={destination.description}
                    image={require("@assets/map/destination.png")}
                    onPress={() => onDestinationPress?.()}
                />
            )}
        </MapView>
        {isChoosingOnMap && (
            <View style={styles.centerPinContainer} pointerEvents="none">
                <Image source={require("@assets/map/destination.png")} style={styles.centerPinImage} />
            </View>
        )}
        </View>
    );
};

const styles = StyleSheet.create({
    centerPinContainer: {
        position: 'absolute',
        left: '50%',
        top: '50%',
        marginLeft: -16, // Half of 32
        marginTop: -32, // Height of pin so tip aligns perfectly with map center
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 100,
    },
    centerPinImage: {
        width: 32,
        height: 32,
        resizeMode: 'contain',
    },
});
