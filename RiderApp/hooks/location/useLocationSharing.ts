import { useRef, useEffect } from "react";
import { getCurrentLocation } from "@/services/locationServices";
import { updateLocation } from "@/services/apiService";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getToken } from "@/services/storageService";
import { socket } from "@/services/socket";
import { getDistance } from "@/utils/geometry";

// Module-level singletons to enforce absolute idempotency across ALL hook instances
let globalLocationInterval: any = null;
let globalLastStatus: string | null = null;

export const useLocationSharing = (userId: string | null) => {
    const hookId = useRef(Math.random().toString(36).substring(7));
    const lastLocationRef = useRef<{ latitude: number; longitude: number } | null>(null);
    const lastStatusRef = useRef<string | null>(null);
    const lastDestinationRef = useRef<any>(null);

    useEffect(() => {
        return () => {
            if (globalLocationInterval) {
                clearInterval(globalLocationInterval);
                globalLocationInterval = null;
            }
        };
    }, []);

    const startSharing = async (destination?: any, status?: string) => {
        if (!userId) return;

        // Synchronously clear previous interval to prevent concurrent timers
        if (globalLocationInterval) {
            clearInterval(globalLocationInterval);
            globalLocationInterval = null;
        }

        const updateFn = async () => {
            const token = await getToken();
            const locationId = await AsyncStorage.getItem("locationId");
            const loc = await getCurrentLocation();
            if (loc) {
                const coords = {
                    latitude: loc.latitude,
                    longitude: loc.longitude,
                };

                let hasLocationChanged = !lastLocationRef.current;
                if (lastLocationRef.current) {
                    const distanceKm = getDistance(
                        lastLocationRef.current.latitude,
                        lastLocationRef.current.longitude,
                        coords.latitude,
                        coords.longitude
                    );
                    hasLocationChanged = distanceKm > 0.01; // filter out stationary drift <= 10m
                }

                const currentStatus = status || 'inactive';
                const hasStatusChanged = lastStatusRef.current !== currentStatus;

                const hasDestChanged = JSON.stringify(lastDestinationRef.current) !== JSON.stringify(destination);

                if (hasLocationChanged || hasStatusChanged || hasDestChanged) {
                    lastLocationRef.current = coords;
                    lastStatusRef.current = currentStatus;
                    lastDestinationRef.current = destination;

                    globalLastStatus = currentStatus; // Sync to global
                    console.log(`Sending location update:`, { coords, destination, status: currentStatus });

                    await updateLocation(userId!, coords, destination, locationId || undefined, token, currentStatus);

                    // Real-time Socket Broadcast
                    if (socket.connected) {
                        socket.emit("update-location", {
                            userId,
                            currentLocation: coords,
                            destination,
                            status: currentStatus
                        });
                    }
                }
            }
        };

        // Immediate update
        updateFn();

        // 5-second polling (synchronously assign pointer to prevent multiple concurrent timers)
        globalLocationInterval = setInterval(updateFn, 5000);
    };

    const stopSharing = async (skipDbUpdate = false) => {

        // Synchronously clear interval if it exists
        if (globalLocationInterval) {
            clearInterval(globalLocationInterval);
            globalLocationInterval = null;
        }

        if (skipDbUpdate) {
            globalLastStatus = 'inactive';
            return;
        }

        // Idempotency: If already globally inactive, do NOT call database update
        if (globalLastStatus === 'inactive') {
            return;
        }

        // Mark as inactive globally to prevent concurrent execution
        globalLastStatus = 'inactive';

        // Reset cached tracking refs when clean stop happens
        lastLocationRef.current = null;
        lastStatusRef.current = null;
        lastDestinationRef.current = null;

        if (userId) {
            const token = await getToken();
            const locationId = await AsyncStorage.getItem("locationId");
            const loc = await getCurrentLocation();
            if (loc) {
                const coords = { latitude: loc.latitude, longitude: loc.longitude };
                await updateLocation(userId, coords, null, locationId || undefined, token, 'inactive');
                if (socket.connected) {
                    socket.emit("update-location", {
                        userId,
                        currentLocation: coords,
                        destination: null,
                        status: 'inactive'
                    });
                }
            }
        }
    };

    return { startSharing, stopSharing };
};
