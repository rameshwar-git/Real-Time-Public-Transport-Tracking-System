import * as Location from "expo-location";

export const requestPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === "granted";
};

export const watchUserLocation = async (callback: any) => {
    return await Location.watchPositionAsync(
        {
            accuracy: Location.Accuracy.High,
            timeInterval: 3000,
            distanceInterval: 5,
        },
        callback
    );
};

export const getCurrentLocation = async () => {
    try {
        const { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
            console.log("Permission denied");
            return null;
        }

        // First try last known location (instant, no GPS needed)
        const lastKnown = await Location.getLastKnownPositionAsync();

        if (lastKnown) {
            return {
                latitude: lastKnown.coords.latitude,
                longitude: lastKnown.coords.longitude
            };
        }

        const { coords } = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 15000,
            distanceInterval: 5,
        });
        return {
            latitude: coords.latitude,
            longitude: coords.longitude,
        };
    } catch (error) {
        console.log("Location Error:", error);
        return null
    }
};

export const reverseGeocode = async (latitude: number, longitude: number) => {
    try {
        const addressMap = await Location.reverseGeocodeAsync({ latitude, longitude });
        if (addressMap && addressMap.length > 0) {
            const first = addressMap[0];
            const parts = [];
            if (first.name) parts.push(first.name);
            if (first.street && first.street !== first.name) parts.push(first.street);
            if (first.city || first.district) parts.push(first.city || first.district);
            return parts.join(", ");
        }
        return "Current Location";
    } catch (error) {
        console.log("Reverse Geocode Error:", error);
        return "Current Location";
    }
};