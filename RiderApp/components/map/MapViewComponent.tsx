import React from "react";
import {Platform} from "react-native";
import {UserLocation} from "@/types/map";
import {Region} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {env} from "@/config/env";

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
    }) => {
    if (!MapView || !mapRegion) return null;

    // Helper to calculate distance in km using Haversine formula
    const getDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2); 
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
        return R * c; // Distance in km
    };

    return (
        <MapView
            ref={mapRef}
            style={{flex: 1}}
            region={mapRegion}
            onRegionChangeComplete={setMapRegion}
            showsUserLocation
            showsMyLocationButton
            showsCompass
            rotateEnabled={false}
            pitchEnabled
            provider={Platform.OS === "android" ? MapView.PROVIDER_GOOGLE : undefined}
        >
            {locations.map((u: any) => {
                if (!u.currentLocation) return null;
                if (u.userId === currentUserId) return null;

                const isDriver = !!u.vehicleId;

                // FILTERING LOGIC
                // If the user has confirmed the ride, only show DRIVERS within 500m (0.5km) of the origin
                if (isConfirmed && isDriver) {
                    if (!origin || !u.currentLocation) return null;

                    const distance = getDistance(
                        origin.latitude,
                        origin.longitude,
                        u.currentLocation.latitude,
                        u.currentLocation.longitude
                    );

                    // If driver is > 0.5km (500m) away from the user's origin, filter them out
                    if (distance > 0.5) return null;
                } else if (isConfirmed && !isDriver) {
                    // Hide other ordinary passengers if ride is confirmed
                    return null;
                } else if (!isConfirmed && !isDriver) {
                    // Before confirmation, hide other ordinary passengers anyway to keep map clean (optional, keeping Uber style)
                    return null;
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
