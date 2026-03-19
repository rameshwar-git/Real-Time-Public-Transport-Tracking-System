import React from "react";
import {Platform} from "react-native";
import {UserLocation} from "@/types/map";
import {Region} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {env} from "@/config/env";
import {getDistance, getNearestNUsers} from "@/utils/geometry";

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
    assignedPassengerId?: string | null;
    isOnDuty?: boolean;
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
        assignedPassengerId,
        isOnDuty
    }) => {
    if (!MapView || !mapRegion) return null;


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
            {(() => {
                if (!origin) return null;

                // Stop rendering passengers if the driver is offline.
                if (!isOnDuty && !assignedPassengerId) return null;

                if (!Array.isArray(locations)) return null;

                const passengers = locations.filter((u: any) => 
                    u.currentLocation && 
                    u.userId !== currentUserId && 
                    !u.vehicleId && u.status === 'confirmed'
                );

                const nearestPassengers = getNearestNUsers(passengers, origin, 5);

                if (assignedPassengerId) {
                    const assignedIsIncluded = nearestPassengers.some(p => p.userId === assignedPassengerId);
                    if (!assignedIsIncluded) {
                        const assignedPassenger = passengers.find(p => p.userId === assignedPassengerId);
                        if (assignedPassenger) {
                            const dist = getDistance(origin.latitude, origin.longitude, assignedPassenger.currentLocation!.latitude, assignedPassenger.currentLocation!.longitude);
                            nearestPassengers.push({ ...assignedPassenger, dist });
                        }
                    }
                }

                return nearestPassengers.map((u: any) => (
                    <Marker 
                        key={u.userId || u._id} 
                        coordinate={u.currentLocation} 
                        image={require("@assets/map/passenger.png")} 
                    />
                ));
            })()}
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
