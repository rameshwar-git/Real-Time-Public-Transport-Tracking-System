import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";
import { colors, radius, shadow, spacing } from "@/constants/ui";

interface PinLocationCardProps {
    pinAddress: string;
    onConfirm: () => void;
}

export const PinLocationCard = ({ pinAddress, onConfirm }: PinLocationCardProps) => (
    <View style={styles.pinLocationCard}>
        <Text style={styles.pinLocationLabel}>CONFIRM DESTINATION</Text>
        <View style={styles.pinAddressContainer}>
            <MapPin size={18} color="#4F46E5" style={{ marginRight: 8 }} />
            <Text style={styles.pinAddressText} numberOfLines={2}>
                {pinAddress || "Locating..."}
            </Text>
        </View>
        <TouchableOpacity
            style={styles.confirmPinButton}
            onPress={onConfirm}
        >
            <Text style={styles.confirmPinButtonText}>Confirm Destination</Text>
        </TouchableOpacity>
    </View>
);

const styles = StyleSheet.create({
    pinLocationCard: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        padding: spacing.xl,
        ...shadow.pop,
        zIndex: 1000,
    },
    pinLocationLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1.5,
        marginBottom: spacing.md,
    },
    pinAddressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 18,
    },
    pinAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    confirmPinButton: {
        backgroundColor: colors.primary,
        borderRadius: radius.md,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmPinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
});
