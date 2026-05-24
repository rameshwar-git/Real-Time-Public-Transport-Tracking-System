import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface IncomingRequestCardProps {
    onAccept: () => void;
    onReject: () => void;
}

export const IncomingRequestCard = ({ onAccept, onReject }: IncomingRequestCardProps) => {
    return (
        <View style={styles.incomingRequestCard}>
            <Text style={styles.incomingRequestTitle}>New Ride Request!</Text>
            <Text style={styles.incomingRequestDesc}>A passenger is on your route.</Text>
            <View style={styles.incomingRequestActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
                    <Text style={styles.actionBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
                    <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    incomingRequestCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 90,
        left: 20,
        right: 20,
        backgroundColor: '#fff',
        borderRadius: 15,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 10,
        zIndex: 100,
    },
    incomingRequestTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333',
        textAlign: 'center',
    },
    incomingRequestDesc: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
        textAlign: 'center',
    },
    incomingRequestActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginHorizontal: 5,
    },
    rejectBtn: {
        backgroundColor: '#F44336',
    },
    acceptBtn: {
        backgroundColor: '#4CAF50',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
