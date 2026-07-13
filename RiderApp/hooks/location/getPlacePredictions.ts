import { env } from "@/config/env"

const GOOGLE_API_KEY = env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

interface PlacePrediction {
    description: string;
    place_id: string;
}

interface AutocompleteResponse {
    predictions: PlacePrediction[];
    status: string;
}

export async function getPlacePredictions(
    input: string,
    latitude: number,
    longitude: number
): Promise<PlacePrediction[]> {
    if (!input) return [];

    const url =
        "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
        `?input=${encodeURIComponent(input)}` +
        `&location=${latitude},${longitude}` +
        `&radius=5000` + // 5km search radius
        `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("Network error");
    }

    const data: AutocompleteResponse = await res.json();

    if (data.status !== "OK") return [];

    return data.predictions;
}
