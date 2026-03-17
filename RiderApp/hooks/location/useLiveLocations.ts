import { useEffect, useRef, useState } from "react";
import { fetchAllLocations } from "@/services/apiService";

export const useLiveLocations = () => {
    const [locations, setLocations] = useState<any[]>([]);
    const pollRef = useRef<any>(null);

    const load = async () => {
        const data = await fetchAllLocations();
        setLocations(data);
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
