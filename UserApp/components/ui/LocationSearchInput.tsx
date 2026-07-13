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
            <MapPin size={18} color="#4F46E5" style={styles.leftIcon} />
            <TextInput
                placeholder={placeholder}
                placeholderTextColor="#94A3B8"
                value={value}
                onChangeText={onChangeText}
                style={styles.input}
                onFocus={onFocus}
                onBlur={onBlur}
            />
            {value.length > 0 && (
                <TouchableOpacity onPress={() => onChangeText("")} style={styles.clearButton}>
                    <X size={18} color="#64748B" />
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
        backgroundColor: "#F8FAFC",
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderWidth: 1,
        borderColor: "#E2E8F0",
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: "#0F172A",
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
