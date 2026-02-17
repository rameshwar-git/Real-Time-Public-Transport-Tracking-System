export type UserLocation = {
    userId: string;
    currentLocation: {
        latitude: number;
        longitude: number;
    } | null;
};
