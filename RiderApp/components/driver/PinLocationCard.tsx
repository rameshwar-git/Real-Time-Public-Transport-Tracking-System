import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { MapPin } from "lucide-react-native";

interface PinLocationCardProps {
    pinAddress: string;
    onConfirm: () => void;
}

export const PinLocationCard = ({ pinAddress, onConfirm }: PinLocationCardProps) => (
    <View style={styles.pinLocationCard}>
        <Text style={styles.pinLocationLabel}>CONFIRM DESTINATION</Text>
        <View style={styles.pinAddressContainer}>
            <MapPin size={18} color="#10B981" style={{ marginRight: 8 }} />
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
        backgroundColor: '#1E293B',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 1000,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    pinLocationLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: '#94A3B8',
        letterSpacing: 1.5,
        marginBottom: 12,
    },
    pinAddressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        borderWidth: 1.5,
        borderRadius: 14,
        padding: 14,
        marginBottom: 18,
    },
    pinAddressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#F8FAFC',
        flex: 1,
    },
    confirmPinButton: {
        backgroundColor: '#10B981',
        borderRadius: 14,
        paddingVertical: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmPinButtonText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
