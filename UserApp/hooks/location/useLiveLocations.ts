import { useEffect, useRef, useState } from "react";
import { fetchAllLocations } from "@/services/apiService";
import { getToken } from "@/services/storageService";

export const useLiveLocations = (origin?: { latitude: number, longitude: number } | null) => {
    const [locations, setLocations] = useState<any[]>([]);
    const pollRef = useRef<any>(null);
    const originRef = useRef(origin);

    useEffect(() => {
        originRef.current = origin;
    }, [origin]);

    const load = async () => {
        const token = await getToken();
        const data = await fetchAllLocations(token, originRef.current);
        if (Array.isArray(data)) {
            setLocations(data);
        }
    };

    const startPolling = () => {
        load();
        pollRef.current = setInterval(load, 3000);
    };

    const stopPolling = () => clearInterval(pollRef.current);

    useEffect(() => {
        load();
        return stopPolling;
    }, []);

    return { locations, startPolling, stopPolling };
};
