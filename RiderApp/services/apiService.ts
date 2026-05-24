import { env } from "@/config/env";
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

export const updateLocation = async (userId: string, coords: any, destination?: any, locationId?: string, token?: string | null, status?: string) => {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    await fetch(`${API_BASE}/driver/location/update/${locationId}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({ currentLocation: coords, destination: destination || null, locationId, status: status || 'inactive' }),
    });
};

export const getDriverEarnings = async () => {
    const res = await authFetch("/drivers/earnings");
    if (!res.ok) throw new Error("Failed to fetch driver earnings");
    return await res.json();
};

export const getWeeklyEarnings = async () => {
    const res = await authFetch("/drivers/weekly-earnings");
    if (!res.ok) throw new Error("Failed to fetch weekly earnings breakdown");
    return await res.json();
};

export const getDriverProfile = async () => {
    const res = await authFetch("/drivers/profile");
    if (!res.ok) throw new Error("Failed to fetch driver profile");
    return await res.json();
};

export const updateDriverProfile = async (data: any) => {
    const res = await authFetch("/drivers/profile", {
        method: "PUT",
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update driver profile");
    return await res.json();
};
