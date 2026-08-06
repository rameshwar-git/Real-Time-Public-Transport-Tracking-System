import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { updateLocation } from '@/services/apiService';

/**
 * Background location sharing.
 *
 * Uses expo-location's background task (via expo-task-manager) so the driver keeps reporting
 * their position while backgrounded / screen locked / removed from recents. The task posts via
 * the REST endpoint (a background task has no live Socket.IO connection). Works on dev/release
 * NATIVE builds — NOT in Expo Go.
 */

export const BACKGROUND_LOCATION_TASK = 'background-location-sharing';
const CONTEXT_KEY = 'bg-location-context';

export interface BgSharingContext {
    userId: string;
    token?: string | null;
    destination?: any;
    status?: string;
}

// Registered at module load so it exists before startLocationUpdatesAsync is called.
TaskManager.defineTask(BACKGROUND_LOCATION_TASK, async ({ data, error }: any) => {
    if (error) {
        console.warn('[bg-location] task error:', error);
        return;
    }
    const loc = data?.locations?.[0];
    if (!loc || !loc.coords) return;

    const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
    };

    try {
        const raw = await AsyncStorage.getItem(CONTEXT_KEY);
        if (!raw) return; // sharing was stopped; nothing to send
        const ctx: BgSharingContext = JSON.parse(raw);
        await updateLocation(ctx.userId, coords, ctx.destination, undefined, ctx.token, ctx.status);
    } catch (e) {
        console.warn('[bg-location] POST failed:', e);
    }
});

/** Begin background location sharing. Returns false when unavailable/denied. */
export const startBackgroundLocation = async (ctx: BgSharingContext): Promise<boolean> => {
    try {
        // Background permission requires foreground permission granted first.
        const fg = await Location.requestForegroundPermissionsAsync();
        if (fg.status !== 'granted') return false;

        if (!(await Location.isBackgroundLocationAvailableAsync())) {
            console.warn('[bg-location] Background location unavailable (Expo Go / unsupported).');
            return false;
        }

        const bg = await Location.requestBackgroundPermissionsAsync();
        if (bg.status !== 'granted') return false;

        await AsyncStorage.setItem(CONTEXT_KEY, JSON.stringify(ctx));

        if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) {
            return true;
        }

        await Location.startLocationUpdatesAsync(BACKGROUND_LOCATION_TASK, {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
            activityType: Location.ActivityType.OtherNavigation,
            pausesUpdatesAutomatically: false,
            showsBackgroundLocationIndicator: true,
            // Android: this foreground-service notification is what keeps the task alive when
            // the app is backgrounded / removed from recents / screen locked.
            foregroundService: {
                notificationTitle: 'Live location sharing',
                notificationBody: 'Sharing your location to let passengers track your ride.',
                notificationColor: '#4338CA',
            },
        });
        return true;
    } catch (e) {
        console.warn('[bg-location] startBackgroundLocation error:', e);
        return false;
    }
};

/** Stop background location sharing. */
export const stopBackgroundLocation = async (): Promise<void> => {
    try {
        await AsyncStorage.removeItem(CONTEXT_KEY);
        if (await Location.hasStartedLocationUpdatesAsync(BACKGROUND_LOCATION_TASK)) {
            await Location.stopLocationUpdatesAsync(BACKGROUND_LOCATION_TASK);
        }
    } catch (e) {
        console.warn('[bg-location] stopBackgroundLocation error:', e);
    }
};
