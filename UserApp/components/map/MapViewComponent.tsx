import React from "react";
import { Platform } from "react-native";
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
        assignedDriverId
    }) => {
    if (!MapView || !mapRegion) return null;

    // Helper to calculate distance in km using Haversine formula

    return (
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
                if (!u.currentLocation) return null;
                if (u.userId === currentUserId) return null;

                const isDriver = !!u.vehicleId;

                // FILTERING LOGIC
                if (!isDriver) return null; // Always hide simple passengers to keep map clean

                if (isConfirmed && assignedDriverId) {
                    if (u.userId !== assignedDriverId) return null; // Isolate assigned driver
                } else if (origin && destination && u.destination) {
                    const match = calculateRouteMatch(u.currentLocation, u.destination, origin, destination);
                    
                    // If driver is far from the pickup (> 50km), ignore them
                    if (match.pickupDist > 50) return null;

                    if (!match.isMatch) return null;
                } else if (origin && !destination) {
                    // If passenger hasn't set destination, only show nearby drivers (within 1.5km)
                    const dist = getDistance(origin.latitude, origin.longitude, u.currentLocation.latitude, u.currentLocation.longitude);
                    if (dist > 1.5) return null;
                }

                return (
                    <React.Fragment key={u.userId || u._id}>
                        <Marker
                            coordinate={u.currentLocation}
                            image={isDriver ? require("@assets/map/bus.png") : require("@assets/map/passenger.png")}
                        />
                    </React.Fragment>
                );

            })}
            {origin && destination && (
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
            {destination && (
                <Marker
                    coordinate={destination}
                    title="Destination"
                    description={destination.description}
                    image={require("@assets/map/destination.png")}
                />
            )}
        </MapView>
    );
};
