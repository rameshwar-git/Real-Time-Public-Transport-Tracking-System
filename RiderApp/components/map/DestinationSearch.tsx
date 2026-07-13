import React, { useEffect, useState } from "react";
import { FlatList, Text, View, StyleSheet, TouchableOpacity, Keyboard } from "react-native";
import { getPlacePredictions } from "@/hooks/location/getPlacePredictions";
import { getPlaceDetails } from "@/hooks/location/getPlaceDetails";
import { getCurrentLocation } from "@/services/locationServices";
import LocationSearchInput from "@ui/LocationSearchInput";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Clock, MapPin } from "lucide-react-native";


interface PlacePrediction {
    description: string;
    place_id: string;
}

interface Props {
    onSelect?: (coords: { lat: number, lng: number }) => void;
    placeholder?: string;
    style?: any;
    initialQuery?: string;
    onFocus?: () => void;
    onChooseOnMap?: () => void;
}
interface Cord {
    latitude: number;
    longitude: number;
}

export const DestinationSearch: React.FC<Props> = ({ onSelect, placeholder = "Search destination", style, initialQuery = "", onFocus, onChooseOnMap }) => {
    const [query, setQuery] = useState<string>(initialQuery);
    const [results, setResults] = useState<PlacePrediction[]>([]);
    const [recentSearches, setRecentSearches] = useState<PlacePrediction[]>([]);
    const [isFocused, setIsFocused] = useState<boolean>(false);

    useEffect(() => {
        const loadRecent = async () => {
            try {
                const stored = await AsyncStorage.getItem('@recent_searches_driver');
                if (stored) {
                    setRecentSearches(JSON.parse(stored));
                }
            } catch (e) {
                console.error(e);
            }
        };
        loadRecent();
    }, []);

    const saveRecentSearch = async (item: PlacePrediction) => {
        try {
            let updated = [item, ...recentSearches.filter(s => s.place_id !== item.place_id)];
            if (updated.length > 5) updated = updated.slice(0, 5);
            setRecentSearches(updated);
            await AsyncStorage.setItem('@recent_searches_driver', JSON.stringify(updated));
        } catch (e) {
            console.error(e);
        }
    };

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
        Keyboard.dismiss();
        setQuery(item.description);
        setResults([]);
        setIsFocused(false);
        saveRecentSearch(item);
        try {
            const coords = await getPlaceDetails(item.place_id);
            if (coords && onSelect) {
                onSelect(coords);
            }
        } catch (error) {
            console.log("Place details error:", error);
        }
    };

    const handleBlur = () => {
        // Safe delay to let list onPress trigger before unmounting results list
        setTimeout(() => {
            setIsFocused(false);
        }, 220);
    };

    return (
        <View style={[styles.container, style]}>
            <LocationSearchInput
                placeholder={placeholder}
                value={query}
                onChangeText={handleChange}
                onFocus={() => {
                    setIsFocused(true);
                    setQuery('');
                    setResults([]);
                    if (onSelect) onSelect(null as any);
                    if (onFocus) onFocus();
                }}
                onBlur={handleBlur}
            />

            {isFocused && (
                <View style={styles.dropdownContainer}>
                    <TouchableOpacity
                        style={styles.chooseOnMapItem}
                        onPress={() => {
                            Keyboard.dismiss();
                            setIsFocused(false);
                            onChooseOnMap?.();
                        }}
                    >
                        <MapPin size={16} color="#10B981" style={styles.itemIcon} />
                        <Text style={styles.chooseOnMapText}>Choose on Map</Text>
                    </TouchableOpacity>

                    {results.length > 0 && (
                        <FlatList
                            data={results}
                            keyExtractor={(item) => item.place_id}
                            keyboardShouldPersistTaps="handled"
                            style={styles.list}
                            renderItem={({ item }) => (
                                <TouchableOpacity
                                    style={styles.resultItem}
                                    onPress={() => handleSelect(item)}
                                >
                                    <MapPin size={16} color="#10B981" style={styles.itemIcon} />
                                    <Text style={styles.resultText} numberOfLines={1}>
                                        {item.description}
                                    </Text>
                                </TouchableOpacity>
                            )}
                        />
                    )}

                    {query.length < 2 && recentSearches.length > 0 && (
                        <>
                            <View style={styles.recentHeader}>
                                <Clock size={14} color="#64748B" style={styles.headerIcon} />
                                <Text style={styles.recentTitle}>Recent Searches</Text>
                            </View>
                            <FlatList
                                data={recentSearches}
                                keyExtractor={(item) => item.place_id}
                                keyboardShouldPersistTaps="handled"
                                style={styles.list}
                                renderItem={({ item }) => (
                                    <TouchableOpacity
                                        style={styles.resultItem}
                                        onPress={() => handleSelect(item)}
                                    >
                                        <Clock size={16} color="#64748B" style={styles.itemIcon} />
                                        <Text style={styles.resultText} numberOfLines={1}>
                                            {item.description}
                                        </Text>
                                    </TouchableOpacity>
                                )}
                            />
                        </>
                    )}
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: "transparent",
        width: "100%",
    },
    dropdownContainer: {
        backgroundColor: "#0F172A",
        borderRadius: 12,
        marginTop: 8,
        borderWidth: 1,
        borderColor: "#334155",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        elevation: 5,
        overflow: "hidden",
    },
    list: {
        maxHeight: 220,
    },
    resultItem: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: "#1E293B",
    },
    itemIcon: {
        marginRight: 12,
    },
    resultText: {
        fontSize: 14,
        color: "#E2E8F0",
        flex: 1,
    },
    recentHeader: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        paddingTop: 12,
        paddingBottom: 6,
        backgroundColor: "#0F172A",
        borderBottomWidth: 1,
        borderBottomColor: "#1E293B",
    },
    headerIcon: {
        marginRight: 6,
    },
    recentTitle: {
        fontSize: 12,
        fontWeight: "700",
        color: "#64748B",
        textTransform: "uppercase",
        letterSpacing: 0.5,
    },
    chooseOnMapItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        paddingHorizontal: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#1E293B',
    },
    chooseOnMapText: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#10B981',
    },
});
