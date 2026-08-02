export const upsertDriverLocation = (locations: any[], driverId: string, location: any, vehicleType: any): any[] => {
    const exists = locations.some((l: any) => l.userId === driverId);
    if (exists) {
        return locations.map((l: any) =>
            l.userId === driverId
                ? { ...l, currentLocation: location, vehicleId: l.vehicleId || { vehicleType } }
                : l
        );
    }
    return [...locations, { userId: driverId, currentLocation: location, vehicleId: { vehicleType } }];
};
