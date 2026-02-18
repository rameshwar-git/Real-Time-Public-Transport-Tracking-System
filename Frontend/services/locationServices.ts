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
