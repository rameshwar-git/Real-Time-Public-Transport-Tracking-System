import React from "react";
import { Platform } from "react-native";
import { UserLocation } from "@/typs/map";
import { Region } from "react-native-maps";

type Props = {
    MapView: any;
    Marker: any;
    mapRegion: Region;
    setMapRegion: (r: Region) => void;
    locations: UserLocation[];
    currentUserId: string | null;
    destination: any;
    mapRef: any;
};

export const MapViewComponent3: React.FC<Props> = (
    {
        MapView,
        Marker,
        mapRegion,
        setMapRegion,
        locations,
        currentUserId,
        destination,
        mapRef,
    }) => {
    if (!MapView || !mapRegion) return null;

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
            {destination && (
                <Marker coordinate={destination} title="Destination" pinColor="green" />
            )}

            {locations.map((u) => {
                if (!u.currentLocation) return null;
                if (u.userId === currentUserId) return null;

                return (
                    <Marker
                        key={u.userId}
                        coordinate={u.currentLocation}
                        image={require("@assets/images/passenger_x100.png")}
                    />);

            })}
        </MapView>
    );
};
