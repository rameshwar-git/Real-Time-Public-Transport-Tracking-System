import React, { useEffect, useState } from "react";
import { TextInput, FlatList, Text, View, StyleSheet } from "react-native";
import { getPlacePredictions } from "@/hooks/location/getPlacePredictions";
import { getPlaceDetails } from "@/hooks/location/getPlaceDetails";
import { getCurrentLocation } from "@/services/locationServices";
import LocationSearchInput from "@ui/LocationSearchInput";


interface PlacePrediction {
    description: string;
    place_id: string;
}

interface Props {
    onSelect?: (coords: { lat: number, lng: number }) => void;
    placeholder?: string;
    style?: any;
    initialQuery?: string;
}
interface Cord {
    latitude: number;
    longitude: number;
}

export const LocationSearchBox: React.FC<Props> = ({ onSelect, placeholder = "Search destination", style, initialQuery = "" }) => {
    const [query, setQuery] = useState<string>(initialQuery);
    const [results, setResults] = useState<PlacePrediction[]>([]);

    useEffect(() => {
        if (initialQuery) {
            setQuery(initialQuery);
        }
    }, [initialQuery]);
    const [cord, setCord] = useState<Cord | null>(null);

    useEffect(() => {
        const fetchLocation = async () => {
            const location = await getCurrentLocation();
            setCord(location);
        };
        fetchLocation();
    }, []);

    const handleChange = async (text: string) => {
        setQuery(text);

        if (text.length < 2) {
            setResults([]);
            return;
        }

        try {
            if (!cord) return;

            const predictions = await getPlacePredictions(
                text,
                cord.latitude,
                cord.longitude
            );
            setResults(predictions);
        } catch (error) {
            console.log("Autocomplete error:", error);
        }
    };

    const handleSelect = async (item: PlacePrediction) => {
        setQuery(item.description);
        setResults([]);
        try {
            const coords = await getPlaceDetails(item.place_id);
            if (coords && onSelect) {
                onSelect(coords);
            }
        } catch (error) {
            console.log("Place details error:", error);
        }
    };

    return (
        <View style={[styles.container, style]}>
            <LocationSearchInput
                placeholder={placeholder}
                value={query}
                onChangeText={handleChange}
            />

            {results.length > 0 && (
                <FlatList
                    data={results}
                    keyExtractor={(item) => item.place_id}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                        <Text
                            style={styles.resultItem}
                            onPress={() => handleSelect(item)}
                        >
                            {item.description}
                        </Text>
                    )}
                />
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "transparent",
    },
    input: {
        height: 40,
        borderRadius: 25,
        paddingHorizontal: 10,
        backgroundColor: "#f0f0f0",
        fontSize: 13,
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
        fontSize: 13,
        color: "#333",
    },
});
