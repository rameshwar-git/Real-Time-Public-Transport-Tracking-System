import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

interface ActiveTripsListProps {
    activeTrips: any[];
    onStartTrip: (trip: any) => void;
    onCancelTrip: (trip: any) => void;
    onEndTrip: (trip: any) => void;
}

export const ActiveTripsList = ({ activeTrips, onStartTrip, onCancelTrip, onEndTrip }: ActiveTripsListProps) => {
    if (activeTrips.length === 0) return null;

    return (
        <ScrollView style={styles.activeTripsContainer}>
            <Text style={styles.tripsHeader}>Current Trips ({activeTrips.length})</Text>
            {activeTrips.map((trip, idx) => (
                <View key={idx} style={styles.tripCard}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.tripPassenger}>{trip.passengerName}</Text>
                        <Text style={styles.tripStatus}>
                            {trip.status === 'scheduled' ? 'Awaiting Pickup' : 'In Progress'}
                            {trip.estimatedDistance !== undefined && trip.estimatedDuration !== undefined && (
                                ` • ${trip.estimatedDistance.toFixed(1)} km (${trip.estimatedDuration} min)`
                            )}
                            {trip.fare !== undefined && (
                                ` • ₹${Number(trip.fare).toFixed(2)}`
                            )}
                        </Text>
                    </View>
                    <View style={styles.tripActions}>
                        {trip.status === 'scheduled' && (
                            <TouchableOpacity style={styles.otpBtn} onPress={() => onStartTrip(trip)}>
                                <Text style={styles.btnTextSmall}>Start Trip</Text>
                            </TouchableOpacity>
                        )}
                        {trip.status === 'scheduled' && (
                            <TouchableOpacity style={[styles.otpBtn, { backgroundColor: '#EF4444', marginLeft: 8 }]} onPress={() => onCancelTrip(trip)}>
                                <Text style={styles.btnTextSmall}>Cancel</Text>
                            </TouchableOpacity>
                        )}
                        {trip.status === 'in_progress' && (
                            <TouchableOpacity style={[styles.otpBtn, { backgroundColor: '#10B981' }]} onPress={() => onEndTrip(trip)}>
                                <Text style={styles.btnTextSmall}>End Trip</Text>
                            </TouchableOpacity>
                        )}
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
        color: '#F8FAFC'
    },
    tripCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#334155',
        padding: 12,
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#475569',
    },
    tripPassenger: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#F8FAFC'
    },
    tripStatus: {
        fontSize: 12,
        color: '#94A3B8',
        marginTop: 4
    },
    tripActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10
    },
    otpBtn: {
        backgroundColor: '#3B82F6',
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: 8
    },
    btnTextSmall: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 12
    }
});
