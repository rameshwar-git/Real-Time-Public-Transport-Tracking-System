import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface DriverStatusHeaderProps {
    isOnDuty: boolean;
}

export const DriverStatusHeader = ({ isOnDuty }: DriverStatusHeaderProps) => {
    return (
        <View style={styles.statusHeaderCard}>
            <Text style={styles.statusLabel}>Current Status:</Text>
            <Text style={[styles.statusText, { color: isOnDuty ? "#4CAF50" : "#F44336" }]}>
                {isOnDuty ? "ONLINE (ON DUTY)" : "OFFLINE"}
            </Text>
        </View>
    );
};

const styles = StyleSheet.create({
    statusHeaderCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 30,
        alignSelf: 'center',
        backgroundColor: '#1E293B',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 6,
        zIndex: 10,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
        color: '#94A3B8',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
