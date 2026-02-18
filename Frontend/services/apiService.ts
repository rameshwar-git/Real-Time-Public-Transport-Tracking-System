import {env} from "@/config/env";

const API_BASE = env.API_URL;
export const fetchAllLocations = async () => {
    const res = await fetch(`${API_BASE}/location/allLocation`);
    return res.json();
};

export const updateLocation = async (userId: string, coords: any) => {
    await fetch(`${API_BASE}/location/updateLocation/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentLocation: coords }),
    });
};
