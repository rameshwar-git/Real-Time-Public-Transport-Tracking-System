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
        console.log(`[useLocationSharing Hook ${hookId.current}] Hook mounted/rendered. userId:`, userId);
        return () => {
            console.log(`[useLocationSharing Hook ${hookId.current}] Hook unmounting.`);
            if (globalLocationInterval) {
                clearInterval(globalLocationInterval);
                globalLocationInterval = null;
            }
        };
    }, []);

    const startSharing = async (destination?: any, status?: string) => {
        console.log(`[useLocationSharing Hook ${hookId.current}] startSharing called. Current global interval:`, globalLocationInterval);
        if (!userId) return;

        // Synchronously clear previous interval to prevent concurrent timers
        if (globalLocationInterval) {
            console.log(`[useLocationSharing Hook ${hookId.current}] startSharing clearing existing global interval:`, globalLocationInterval);
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
                    console.log(`[useLocationSharing Hook ${hookId.current}] Sending location update:`, { coords, destination, status: currentStatus });

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
        console.log(`[useLocationSharing Hook ${hookId.current}] Set new global interval:`, globalLocationInterval);
    };

    const stopSharing = async (skipDbUpdate = false) => {
        console.log(`[useLocationSharing Hook ${hookId.current}] stopSharing called. globalLocationInterval:`, globalLocationInterval, "globalLastStatus:", globalLastStatus, "skipDbUpdate:", skipDbUpdate);

        // Synchronously clear interval if it exists
        if (globalLocationInterval) {
            console.log(`[useLocationSharing Hook ${hookId.current}] stopSharing clearing global interval:`, globalLocationInterval);
            clearInterval(globalLocationInterval);
            globalLocationInterval = null;
        }

        if (skipDbUpdate) {
            globalLastStatus = 'inactive';
            return;
        }

        // Idempotency: If already globally inactive, do NOT call database update
        if (globalLastStatus === 'inactive') {
            console.log(`[useLocationSharing Hook ${hookId.current}] stopSharing early exit. Already globally inactive.`);
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
                console.log(`[useLocationSharing Hook ${hookId.current}] Sending final inactive location update.`);
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
