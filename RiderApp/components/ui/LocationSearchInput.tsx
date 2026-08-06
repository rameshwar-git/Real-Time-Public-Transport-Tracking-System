import React from "react";
import {View, TextInput, StyleSheet, TouchableOpacity} from "react-native";
import { MapPin, X } from "lucide-react-native";
import { colors, radius, spacing } from "@/constants/ui";

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
        backgroundColor: colors.surface,
        borderRadius: radius.md,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    input: {
        flex: 1,
        fontSize: 15,
        color: colors.text,
        paddingHorizontal: spacing.sm,
        height: 36,
    },
    leftIcon: {
        marginRight: 2,
    },
    clearButton: {
        padding: 4,
    },
});
