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
        backgroundColor: "#fff",
        borderWidth: 2,
        borderColor: "#000",
        borderRadius: 20,
        paddingHorizontal: 10,
        paddingVertical: 4,
    },
    input: {
        flex: 1,
        fontSize: 15,
        paddingHorizontal: 8,
    },
    leftIcon: {
        marginRight: 8,
    },
});
