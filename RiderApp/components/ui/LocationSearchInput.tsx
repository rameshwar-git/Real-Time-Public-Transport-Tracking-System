import React, {useEffect, useState} from "react";
import {View, TextInput, StyleSheet, TouchableOpacity} from "react-native";
import { MapPin, X } from "lucide-react-native";

type Props = {
    placeholder?: string;
    value: string;
    onChangeText: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
};

const LocationSearchInput: React.FC<Props> = (
    {
        placeholder = "Search location",
        value,
        onChangeText,
        onFocus,
        onBlur,
    }
) => {
    return (
        <View style={styles.container}>
            <MapPin size={18} color="#10B981" style={styles.leftIcon} />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#64748B"
                value={value}
                onChangeText={onChangeText}
                style={styles.input}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText("")} style={styles.clearButton}>
                    <X size={18} color="#94A3B8" />
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
        backgroundColor: "#0F172A",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#334155",
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#F1F5F9",
        paddingHorizontal: 8,
        height: 36,
    },
    leftIcon: {
        marginRight: 2,
    },
    clearButton: {
        padding: 4,
    },
});
