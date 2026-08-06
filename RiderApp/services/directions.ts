import { env } from "@/config/env";

export interface DirectionsStep {
    /** Google maneuver tag, e.g. "turn-right", "straight", "uturn-left". Null if absent. */
    maneuver?: string | null;
    /** Human-readable instruction with HTML tags stripped, e.g. "Turn right onto Main St". */
    instruction: string;
    /** Localized distance text, e.g. "200 m". */
    distanceText: string;
    startLocation?: { latitude: number; longitude: number };
    endLocation?: { latitude: number; longitude: number };
}

export interface DirectionsResult {
    steps: DirectionsStep[];
    distanceText: string;
    durationText: string;
}

// Strip HTML tags and HTML entities from Google's html_instructions field.
const cleanInstruction = (html: string): string =>
    html
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/gi, ' ')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/\s+/g, ' ')
        .trim();

/**
 * Fetch Google Directions (driving) and return the step-by-step maneuvers needed for a
 * lightweight turn-by-turn navigation banner. This complements `react-native-maps-directions`
 * (which only exposes overall distance/duration, not individual maneuvers).
 */
export const fetchDirections = async (
    origin: { latitude: number; longitude: number },
    destination: { latitude: number; longitude: number }
): Promise<DirectionsResult | null> => {
    try {
        const url =
            `https://maps.googleapis.com/maps/api/directions/json` +
            `?origin=${origin.latitude},${origin.longitude}` +
            `&destination=${destination.latitude},${destination.longitude}` +
            `&mode=driving` +
            `&key=${env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY}`;

        const res = await fetch(url);
        const json = await res.json();

        if (json.status !== 'OK' || !json.routes || json.routes.length === 0) {
            console.warn('[directions] non-OK response:', json.status);
            return null;
        }

        const leg = json.routes[0].legs?.[0];
        if (!leg) return null;

        const steps: DirectionsStep[] = (leg.steps || []).map((s: any) => ({
            maneuver: s.maneuver || null,
            instruction: cleanInstruction(s.html_instructions || ''),
            distanceText: s.distance?.text || '',
            startLocation: {
                latitude: s.start_location?.lat,
                longitude: s.start_location?.lng,
            },
            endLocation: {
                latitude: s.end_location?.lat,
                longitude: s.end_location?.lng,
            },
        }));

        return {
            steps,
            distanceText: leg.distance?.text || '',
            durationText: leg.duration?.text || '',
        };
    } catch (e) {
        console.warn('[directions] fetch failed:', e);
        return null;
    }
};
