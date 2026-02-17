const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY!;

export async function getPlacePredictions(input: string) {
    if (!input) return [];

    const url =
        "https://maps.googleapis.com/maps/api/place/autocomplete/json" +
        `?input=${encodeURIComponent(input)}` +
        `&key=${GOOGLE_API_KEY}`;

    const res = await fetch(url);
    const data: AutocompleteResponse = await res.json();

    if (data.status !== "OK") return [];

    return data.predictions;
}
