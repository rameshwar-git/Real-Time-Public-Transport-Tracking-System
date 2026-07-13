import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';

interface RideConfirmationBottomViewProps {
    onConfirm: () => void;
    selectedVehicleType: 'all' | 'tricycle' | 'bus';
    setSelectedVehicleType: (type: 'all' | 'tricycle' | 'bus') => void;
    distance?: number;
}

export const RideConfirmationBottomView = ({
    onConfirm,
    selectedVehicleType,
    setSelectedVehicleType,
    distance
}: RideConfirmationBottomViewProps) => {
    const vehicleTypes = [
        { id: 'all', title: 'Any Ride', description: 'Fastest match', seats: 'All nearby' },
        { id: 'tricycle', title: 'Tricycle', description: 'Economical, fast', seats: '3 seats' },
        { id: 'bus', title: 'Bus / Coaster', description: 'Spacious, group', seats: '15 seats' },
    ] as const;

    const roundToNearestFive = (val: number): number => {
        const rem = val % 5;
        if (rem < 3) {
            return Math.floor(val / 5) * 5;
        } else {
            return Math.ceil(val / 5) * 5;
        }
    };

    const calculateEstimatedFare = (dist: number): number => {
        if (!dist || isNaN(dist)) return 10;
        if (dist <= 2.5) return 10;
        return Number((10 + (dist - 2.5) * 2).toFixed(2));
    };

    const estimatedFare = distance ? calculateEstimatedFare(distance) : null;

    return (
        <View style={styles.bottomView}>
            <Text style={styles.titleText}>Choose Vehicle Type</Text>

            <View style={styles.selectorContainer}>
                {vehicleTypes.map((type) => {
                    const isSelected = selectedVehicleType === type.id;
                    const multiplier = type.id === 'tricycle' ? 0.8 : type.id === 'bus' ? 1.5 : 1.0;
                    const finalCardFare = estimatedFare ? roundToNearestFive(estimatedFare * multiplier) : null;
                    return (
                        <TouchableOpacity
                            key={type.id}
                            style={[
                                styles.optionCard,
                                isSelected && styles.selectedCard
                            ]}
                            onPress={() => setSelectedVehicleType(type.id)}
                            activeOpacity={0.8}
                        >
                            <Text style={[styles.cardTitle, isSelected && styles.selectedCardText]}>
                                {type.title}
                            </Text>
                            <Text style={[styles.cardSeats, isSelected && styles.selectedSeatsText]}>
                                {type.seats}
                            </Text>
                            {finalCardFare !== null && (
                                <Text style={[styles.cardPrice, isSelected && styles.selectedPriceText]}>
                                    ₹{finalCardFare.toFixed(2)}
                                </Text>
                            )}
                            <Text style={[styles.cardDesc, isSelected && styles.selectedDescText]}>
                                {type.description}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {estimatedFare !== null && (
                <View style={styles.fareContainer}>
                    <Text style={styles.fareLabel}>ESTIMATED TRIP COST ({selectedVehicleType.toUpperCase()})</Text>
                    <Text style={styles.fareValue}>
                        ₹{roundToNearestFive(estimatedFare * (selectedVehicleType === 'tricycle' ? 0.8 : selectedVehicleType === 'bus' ? 1.5 : 1.0)).toFixed(2)}
                    </Text>
                    <Text style={styles.fareSubtext}>Base ₹10 for 2.5km + ₹2/km after</Text>
                </View>
            )}

            <TouchableOpacity style={styles.btn} onPress={onConfirm} activeOpacity={0.9}>
                <Text style={styles.btnText}>Confirm Ride Selection</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    bottomView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        elevation: 15,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    titleText: {
        fontSize: 16,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 12,
        textAlign: 'center',
    },
    selectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 20,
        gap: 8,
    },
    optionCard: {
        flex: 1,
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        minHeight: 100,
    },
    selectedCard: {
        backgroundColor: '#F5F3FF', // Indigo active accent
        borderColor: '#818CF8',
        shadowColor: '#818CF8',
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: '#1E293B',
        marginBottom: 4,
        textAlign: 'center',
    },
    selectedCardText: {
        color: '#4F46E5',
    },
    cardSeats: {
        fontSize: 11,
        fontWeight: '600',
        color: '#059669', // Elegant emerald capacity badge
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        marginBottom: 6,
        overflow: 'hidden',
    },
    selectedSeatsText: {
        backgroundColor: '#D1FAE5',
    },
    cardDesc: {
        fontSize: 10,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 12,
    },
    selectedDescText: {
        color: '#6366F1',
    },
    btn: {
        backgroundColor: "#4F46E5", // Premium Royal Indigo brand
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: "center",
        shadowColor: "#4F46E5",
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    btnText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "bold",
    },
    fareContainer: {
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
    },
    fareLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    fareValue: {
        fontSize: 22,
        fontWeight: '900',
        color: '#4F46E5',
    },
    fareSubtext: {
        fontSize: 10,
        color: '#94A3B8',
        marginTop: 2,
    },
    cardPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: '#0F172A',
        marginVertical: 4,
    },
    selectedPriceText: {
        color: '#4F46E5',
    },
});
