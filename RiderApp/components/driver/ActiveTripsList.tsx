import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ActiveTripsListProps {
    activeTrips: any[];
    onOpenOtp: (trip: any) => void;
    onCancelTrip: (trip: any) => void;
}

export const ActiveTripsList = ({ activeTrips, onOpenOtp, onCancelTrip }: ActiveTripsListProps) => {
    if (activeTrips.length === 0) return null;

    return (
        <ScrollView style={styles.activeTripsContainer}>
            <Text style={styles.tripsHeader}>Current Trips ({activeTrips.length})</Text>
            {activeTrips.map((trip, idx) => (
                <View key={idx} style={styles.tripCard}>
                    <View>
                        <Text style={styles.tripPassenger}>{trip.passengerName}</Text>
                        <Text style={styles.tripStatus}>{trip.status === 'scheduled' ? 'Awaiting Pickup' : 'In Progress'}</Text>
                    </View>
                    <View style={styles.tripActions}>
                        {trip.status === 'scheduled' && (
                            <TouchableOpacity style={styles.otpBtn} onPress={() => onOpenOtp(trip)}>
                                <Text style={styles.btnTextSmall}>Enter OTP</Text>
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity style={[styles.otpBtn, { backgroundColor: '#F44336', marginLeft: 8 }]} onPress={() => onCancelTrip(trip)}>
                            <Text style={styles.btnTextSmall}>Cancel</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            ))}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    activeTripsContainer: {
        maxHeight: 150,
        marginBottom: 15
    },
    tripsHeader: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 10,
        color: '#333'
    },
    tripCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#f9f9f9',
        padding: 10,
        borderRadius: 8,
        marginBottom: 8
    },
    tripPassenger: {
        fontSize: 16,
        fontWeight: 'bold'
    },
    tripStatus: {
        fontSize: 12,
        color: '#666'
    },
    tripActions: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    otpBtn: {
        backgroundColor: '#2196F3',
        paddingVertical: 8,
        paddingHorizontal: 15,
        borderRadius: 6
    },
    btnTextSmall: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    }
});
