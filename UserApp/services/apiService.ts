import {env} from "@/config/env";

const API_BASE = env.API_URL;
export const fetchAllLocations = async (token?: string | null, origin?: { latitude: number, longitude: number } | null) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let url = `${API_BASE}/location/driver/all`;
    if (origin) {
        url += `?lat=${origin.latitude}&lng=${origin.longitude}`;
    }

    const res = await fetch(url, {
        headers
    });
    
    if (!res.ok) return [];
    return res.json();
};

export const updateLocation = async (userId: string, coords: any, destination?: any, locationId?: string | null, token?: string | null, status?: string) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE}/location/passenger/update/${userId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ currentLocation: coords, destination, locationId, status }),
    });
};

