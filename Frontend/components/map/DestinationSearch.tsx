import React, {useEffect, useState} from "react";
import { TextInput, FlatList, Text, View, StyleSheet } from "react-native";
import { getPlacePredictions } from "@/hooks/location/getPlacePredictions";
import { getPlaceDetails } from "@/hooks/location/getPlaceDetails";
import {getCurrentLocation} from "@/hooks/location/getCurrentLocation";
import LocationSearchInput from "@ui/LocationSearchInput";


interface PlacePrediction {
    description: string;
    place_id: string;
}

interface Props {
    onSelect?: (coords: { lat: number, lng: number }) => void;
}
interface Cord {
    latitude: number;
    longitude: number;
}

export const DestinationSearch: React.FC<Props> = ({ onSelect }) => {
    const [query, setQuery] = useState<string>("");
    const [results, setResults] = useState<PlacePrediction[]>([]);
    const [cord, setCord] = useState<Cord | null>(null);

    useEffect(() => {
        const fetchLocation = async () => {
            const location = await getCurrentLocation();
            setCord(location)
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
        <View style={styles.container}>
            <LocationSearchInput
                placeholder="Search destination"
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
        backgroundColor: "white",
    },
    input: {
        height: 40,
        borderRadius: 15,
        paddingHorizontal: 20,
        backgroundColor: "#dcdfe3",
    },
    resultItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#eee",
    },
});
