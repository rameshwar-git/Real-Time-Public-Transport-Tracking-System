import { useRef } from "react";
import { getCurrentLocation } from "@/services/locationServices";
import { updateLocation } from "@/services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/services/storageService";

export const useLocationSharing = (userId: string | null) => {
    const locationInterval = useRef<any>(null);

    const startSharing = async (destination?: any, status?: string) => {
        if (!userId) return;
        if (locationInterval.current) stopSharing();

        const token = await getToken();
        const locationId = await AsyncStorage.getItem("locationId");

        const updateFn = async () => {
            const loc = await getCurrentLocation();
            if (loc) {
                const coords = {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                };
                await updateLocation(userId!, coords, destination, locationId || undefined, token, status || 'inactive');
            }
        };

        // Immediate update
        await updateFn();

        // 5-second polling
        locationInterval.current = setInterval(updateFn, 5000);
    };

    const stopSharing = () => {
        if (locationInterval.current) {
            clearInterval(locationInterval.current);
            locationInterval.current = null;
        }
    };

    return { startSharing, stopSharing };
};
