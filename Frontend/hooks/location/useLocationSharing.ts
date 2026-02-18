import { useRef } from "react";
import { watchUserLocation } from "@/services/locationServices";
import { updateLocation } from "@/services/apiService";

export const useLocationSharing = (userId: string | null) => {
    const locationSub = useRef<any>(null);

    const startSharing = async () => {
        if (!userId) return;

        locationSub.current = await watchUserLocation(async (loc: any) => {
            const coords = {
                latitude: loc.coords.latitude,
                longitude: loc.coords.longitude,
            };

            await updateLocation(userId, coords);
        });
    };

    const stopSharing = () => {
        locationSub.current?.remove();
        locationSub.current = null;
    };

    return { startSharing, stopSharing };
};
