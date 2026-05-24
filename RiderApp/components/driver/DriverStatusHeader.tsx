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
        backgroundColor: '#fff',
        borderRadius: 30,
        paddingHorizontal: 20,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 5,
        zIndex: 10,
    },
    statusLabel: {
        fontSize: 14,
        fontWeight: '600',
        marginRight: 8,
        color: '#555',
    },
    statusText: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
