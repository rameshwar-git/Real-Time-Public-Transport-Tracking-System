import React from "react";
import {Platform} from "react-native";
import {UserLocation} from "@/types/map";
import {Region} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import {env} from "@/config/env";
import {getDistance, getNearestNUsers, calculateRouteMatch} from "@/utils/geometry";

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
                if (!isOnDuty && (!activeTrips || activeTrips.length === 0)) return null;

                if (!Array.isArray(locations)) return null;

                const passengers = locations.filter((u: any) => {
                    if (!u.currentLocation || u.userId === currentUserId || !!u.vehicleId || (u.status !== 'confirmed' && u.status !== 'active')) {
                        return false;
                    }
                    
                    if (destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && u.destination && typeof u.destination.latitude === 'number' && typeof u.destination.longitude === 'number' && u.currentLocation && typeof u.currentLocation.latitude === 'number' && typeof u.currentLocation.longitude === 'number') {
                        try {
                            const match = calculateRouteMatch(origin, destination, u.currentLocation, u.destination);
                            if (match.pickupDist > 2) return false;
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
                        return (
                            <Marker 
                                key={`p_${u.userId || u._id}`} 
                                coordinate={u.currentLocation} 
                                image={require("@assets/map/passenger.png")} 
                            />
                        );
                    }).filter(Boolean),
                    ...activeTripPassengers.map((u: any) => {
                        if (!u.currentLocation || typeof u.currentLocation.latitude !== 'number' || typeof u.currentLocation.longitude !== 'number' || isNaN(u.currentLocation.latitude) || isNaN(u.currentLocation.longitude)) return null;
                        return (
                            <Marker 
                                key={`act_${u.userId}`} 
                                coordinate={u.currentLocation} 
                                image={require("@assets/map/passenger.png")} 
                            />
                        );
                    }).filter(Boolean),
                    ...drivers.map((u: any) => {
                        if (!u.currentLocation || typeof u.currentLocation.latitude !== 'number' || typeof u.currentLocation.longitude !== 'number' || isNaN(u.currentLocation.latitude) || isNaN(u.currentLocation.longitude)) return null;
                        const isTricycle = u.vehicleId && u.vehicleId.vehicleType === 'tricycle';
                        return (
                            <Marker 
                                key={`d_${u.userId || u._id}`} 
                                coordinate={u.currentLocation} 
                                image={isTricycle ? require("@assets/map/tricycle.png") : require("@assets/map/bus.png")} 
                            />
                        );
                    }).filter(Boolean)
                ];
            })()}
            {origin && typeof origin.latitude === 'number' && typeof origin.longitude === 'number' && !isNaN(origin.latitude) && !isNaN(origin.longitude) && destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && !isNaN(destination.latitude) && !isNaN(destination.longitude) && (
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
            {destination && typeof destination.latitude === 'number' && typeof destination.longitude === 'number' && !isNaN(destination.latitude) && !isNaN(destination.longitude) && (
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
