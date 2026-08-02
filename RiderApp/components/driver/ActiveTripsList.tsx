import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, LayoutAnimation } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, radius, spacing } from '@/constants/ui';

interface ActiveTripsListProps {
    activeTrips: any[];
    onStartTrip: (trip: any) => void;
    onCancelTrip: (trip: any) => void;
    onCompleteTrip: (trip: any) => void;
}

export const ActiveTripsList = ({ activeTrips, onStartTrip, onCancelTrip, onCompleteTrip }: ActiveTripsListProps) => {
    const [isExpanded, setIsExpanded] = useState(false);

    if (activeTrips.length === 0) return null;

    const toggleExpanded = () => {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setIsExpanded(!isExpanded);
    };

    // Completed trips are handled by the popup review modal, so they are
    // excluded from the inline list (the expand/collapse logic only shows
    // scheduled / in-progress trips).
    const completedTrips = activeTrips.filter(t => t.status === 'completed');
    const activeTripsRunning = activeTrips.filter(t => t.status !== 'completed');

    let displayedTrips: any[];
    if (isExpanded) {
        displayedTrips = activeTripsRunning;
    } else {
        const scheduledTrips = activeTripsRunning.filter(t => t.status === 'scheduled')
            .sort((a, b) => (a.estimatedDistance || Number.MAX_VALUE) - (b.estimatedDistance || Number.MAX_VALUE));
        const inProgressTrips = activeTripsRunning.filter(t => t.status === 'in_progress')
            .sort((a, b) => (a.estimatedDistance || Number.MAX_VALUE) - (b.estimatedDistance || Number.MAX_VALUE));
        const activeShown = [scheduledTrips[0], inProgressTrips[0]].filter(Boolean);
        displayedTrips = activeShown;
    }

    const renderActiveTrip = (trip: any, idx: number) => (
        <View key={trip.tripId || idx} style={styles.tripCard}>
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
                    <TouchableOpacity style={[styles.otpBtn, { backgroundColor: colors.danger, marginLeft: 8 }]} onPress={() => onCancelTrip(trip)}>
                        <Text style={styles.btnTextSmall}>Cancel</Text>
                    </TouchableOpacity>
                )}
                {trip.status === 'in_progress' && (
                    <TouchableOpacity style={[styles.otpBtn, { backgroundColor: colors.primary }]} onPress={() => onCompleteTrip(trip)}>
                        <Text style={styles.btnTextSmall}>✅ Complete Ride</Text>
                    </TouchableOpacity>
                )}
            </View>
        </View>
    );

    const tripCountLabel = completedTrips.length > 0
        ? `Trips (${activeTrips.length})`
        : `Current Trips (${activeTrips.length})`;

    return (
        <View style={styles.container}>
            <TouchableOpacity
                style={styles.headerRow}
                onPress={toggleExpanded}
                activeOpacity={0.7}
            >
                <Text style={styles.tripsHeader}>{tripCountLabel}</Text>
                <MaterialIcons
                    name={isExpanded ? "expand-more" : "expand-less"}
                    size={24}
                    color={colors.textSecondary}
                />
            </TouchableOpacity>

            <ScrollView style={[styles.activeTripsContainer, isExpanded && { maxHeight: 250 }]}>
                {displayedTrips.map((trip, idx) => renderActiveTrip(trip, idx))}
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        width: '100%',
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
        marginBottom: 8,
    },
    activeTripsContainer: {
        maxHeight: 150,
        marginBottom: 5
    },
    tripsHeader: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text
    },
    tripCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        padding: spacing.md,
        borderRadius: radius.md,
        marginBottom: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
    },
    tripPassenger: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text
    },
    tripStatus: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 4
    },
    tripActions: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 10
    },
    otpBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 14,
        borderRadius: radius.sm
    },
    btnTextSmall: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 12
    },
});
