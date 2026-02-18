import React from "react";
import {Platform} from "react-native";
import {UserLocation} from "@/typs/map";
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
            {locations.map((u) => {
                if (!u.currentLocation) return null;
                if (u.userId === currentUserId) return null;

                return (
                    <Marker
                        key={u.userId}
                        coordinate={u.currentLocation}
                        image={require("@assets/map/passenger.png")}
                    />);

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
