import { env } from "@/config/env"
const GOOGLE_API_KEY = env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

export async function getPlaceDetails(placeId: string) {
    if (!placeId) return null;

    const url =
        "https://maps.googleapis.com/maps/api/place/details/json" +
        `?place_id=${placeId}` +
        `&fields=geometry` +
        `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Network error");
    }

    const data = await res.json();

    if (data.status !== "OK") return null;

    return data.result.geometry.location;
}
