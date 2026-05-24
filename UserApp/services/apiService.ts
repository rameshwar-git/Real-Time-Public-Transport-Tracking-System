import {env} from "@/config/env";
import { authFetch } from "@/utils/authFetch";

const API_BASE = env.API_URL;
export const fetchAllLocations = async (token?: string | null, origin?: { latitude: number, longitude: number } | null) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    let urlDriver = `${API_BASE}/driver/location/all`;
    let urlPassenger = `${API_BASE}/passenger/location/all`;
    if (origin) {
        urlDriver += `?lat=${origin.latitude}&lng=${origin.longitude}`;
        urlPassenger += `?lat=${origin.latitude}&lng=${origin.longitude}`;
    }

    try {
        const [resDriver, resPassenger] = await Promise.all([
            fetch(urlDriver, { headers }),
            fetch(urlPassenger, { headers })
        ]);

        const drivers = resDriver.ok ? await resDriver.json() : [];
        const passengers = resPassenger.ok ? await resPassenger.json() : [];

        return [...drivers, ...passengers];
    } catch (e) {
        return [];
    }
};

export const updateLocation = async (userId: string, coords: any, destination?: any, locationId?: string | null, token?: string | null, status?: string) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE}/passenger/location/update/${locationId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ currentLocation: coords, destination: destination || null, locationId, status: status || 'inactive' }),
    });
};

export const getUpcomingRides = async () => {
    const res = await authFetch("/passengers/upcoming-rides");
    if (!res.ok) throw new Error("Failed to fetch upcoming rides");
    return await res.json();
};

export const getRecentRides = async () => {
    const res = await authFetch("/passengers/recent-rides");
    if (!res.ok) throw new Error("Failed to fetch recent rides");
    return await res.json();
};

export const getPassengerStats = async () => {
    const res = await authFetch("/passengers/stats");
    if (!res.ok) throw new Error("Failed to fetch passenger statistics");
    return await res.json();
};

export const getCurrentUser = async () => {
    const res = await authFetch("/me");
    if (!res.ok) throw new Error("Failed to fetch current user profile");
    return await res.json();
};

export const updatePassengerProfile = async (data: any) => {
    const res = await authFetch("/me", {
        method: "PUT",
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update passenger profile");
    return await res.json();
};

export const findDrivers = async (origin: any, destination: any, token?: string | null) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE}/trips/find-drivers`, {
        method: "POST",
        headers,
        body: JSON.stringify({ origin, destination }),
    });

    if (!res.ok) throw new Error("Failed to find drivers");
    return await res.json();
};

