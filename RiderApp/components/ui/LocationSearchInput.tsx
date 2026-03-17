import React, {useEffect, useState} from "react";
import {View, TextInput, StyleSheet, TouchableOpacity} from "react-native";
import { MapPin, X } from "lucide-react-native";

type Props = {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
};

const LocationSearchInput: React.FC<Props> = (
    {
        placeholder = "Search location",
        value,
        onChangeText,
    }
) => {
    const [mvalue, setValue] = useState("");

    return (
        <View style={styles.container}>
            <TextInput
                placeholder={placeholder}
                value={value}
                onChangeText={onChangeText}
                style={styles.input}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText("")}>
                    <X size={20} color="#000" />
                </TouchableOpacity>
            )}
        </View>
    );
};

export default LocationSearchInput;

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        alignItems: "center",
        width: "auto",
        backgroundColor: "#f5f6f8",
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 10,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: "#333",
        paddingHorizontal: 8,
    },
    leftIcon: {
        marginRight: 8,
    },
});
