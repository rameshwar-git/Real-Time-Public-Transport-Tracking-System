import { useRef } from "react";
import { watchUserLocation } from "@/services/locationServices";
import { updateLocation } from "@/services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { socket } from "@/services/socket";

export const useLocationSharing = (userId: string | null) => {
    const locationSub = useRef<any>(null);

    const startSharing = async (destination?: any, status?: string) => {
        if (!userId) return;
        if (locationSub.current) stopSharing();

        const token = await AsyncStorage.getItem("userToken");
        const locationId = await AsyncStorage.getItem("locationId");

        locationSub.current = await watchUserLocation(async (loc: any) => {
            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };

            await updateLocation(userId, coords, destination, locationId, token, status);

            // Emit real-time position so the backend can run proximity checks
            if (socket.connected) {
                socket.emit("update-location", {
                    userId,
                    currentLocation: coords,
                });
            }
        });
    };

    const stopSharing = () => {
        locationSub.current?.remove();
        locationSub.current = null;
    };

    return { startSharing, stopSharing };
};
