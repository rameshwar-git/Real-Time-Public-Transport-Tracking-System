import * as Location from "expo-location";

export const getCurrentLocation = async () => {
    const { coords } = await Location.getCurrentPositionAsync({});
    return {
        latitude: coords.latitude,
        longitude: coords.longitude,
    };
};