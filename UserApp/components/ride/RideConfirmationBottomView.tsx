import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { colors, radius, shadow, spacing, type } from '@/constants/ui';
import { calculateEstimatedFare, formatCurrency, roundToNearestFive } from '@/utils/fare';

interface DriverLite {
    userId?: string;
    availableSeats?: number;
    routeMatchPercentage?: number;
    pickupDist?: number;
    driverDetails?: { name?: string };
    vehicleDetails?: { vehicleType?: string; vehicleModel?: string; color?: string };
}

interface RideConfirmationBottomViewProps {
    onConfirm: () => void;
    selectedVehicleType: 'all' | 'tricycle' | 'bus';
    setSelectedVehicleType: (type: 'all' | 'tricycle' | 'bus') => void;
    distance?: number;
    /** Matched drivers, used to show real (non-decoy) seat availability per vehicle type. */
    drivers?: DriverLite[];
    /** Pre-ride browse list: shared vehicles heading this way with live seats (tap to board). */
    browseDrivers?: DriverLite[];
    onRequestDriver?: (index: number) => void;
    /** How many seats this passenger wants to book. */
    seatsNeeded?: number;
    setSeatsNeeded?: (n: number) => void;
}

export const RideConfirmationBottomView = ({
    onConfirm,
    selectedVehicleType,
    setSelectedVehicleType,
    distance,
    drivers = [],
    browseDrivers = [],
    onRequestDriver,
    seatsNeeded = 1,
    setSeatsNeeded
}: RideConfirmationBottomViewProps) => {
    const vehicleTypes = [
        { id: 'all', title: 'Any Ride', description: 'Fastest match', type: 'any' },
        { id: 'tricycle', title: 'Tricycle', description: 'Economical, fast', type: 'tricycle' },
        { id: 'bus', title: 'Bus / Coaster', description: 'Spacious, group', type: 'bus' },
    ] as const;

    // Availability is computed from the pre-ride browse list (fresh, live seats) when
    // available, otherwise from the matched-driver set.
    const listing = browseDrivers && browseDrivers.length ? browseDrivers : drivers;

    // Real availability: the most seats any matched driver of this type can offer.
    const maxSeatsFor = (type: string): number => {
        const relevant = listing.filter(d =>
            type === 'any' || (d.vehicleDetails?.vehicleType || '').toLowerCase() === type
        );
        const seats = relevant.map(d => Number(d.availableSeats) || 0).filter(n => n > 0);
        return seats.length ? Math.max(...seats) : 0;
    };
    const cardSeatLabel = (type: string): string => {
        const m = maxSeatsFor(type);
        return type === 'any' ? (m ? `${m} seats max` : 'Unavailable') : (m ? `${m} seats` : 'Full');
    };
    // Max seats this passenger can request for the selected type (lower-bound 1).
    const maxRequestable = Math.max(1, maxSeatsFor(selectedVehicleType));
    const canChangeSeats = !!setSeatsNeeded && !!selectedVehicleType && maxRequestable > 0;
    const boardedSeats = Math.max(1, Math.min(seatsNeeded, maxRequestable));

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
                                {cardSeatLabel(type.id)}
                            </Text>
                            {finalCardFare !== null && (
                                <Text style={[styles.cardPrice, isSelected && styles.selectedPriceText]}>
                                    {formatCurrency(finalCardFare)}
                                </Text>
                            )}
                            <Text style={[styles.cardDesc, isSelected && styles.selectedDescText]}>
                                {type.description}
                            </Text>
                        </TouchableOpacity>
                    );
                })}
            </View>

            {onRequestDriver && listing.length > 0 && (
                <View style={styles.browseContainer}>
                    <Text style={styles.browseTitle}>VEHICLES HEADING YOUR WAY</Text>
                    <Text style={styles.browseSub}>Tap a vehicle to request it directly — available seats update live.</Text>
                    {listing.map((d, i) => {
                        const available = Number(d.availableSeats) || 0;
                        const enough = available >= boardedSeats;
                        return (
                            <TouchableOpacity
                                key={d.userId || i}
                                style={styles.browseCard}
                                activeOpacity={0.8}
                                onPress={() => onRequestDriver(i)}
                            >
                                <View style={styles.browseLeft}>
                                    <View style={styles.browseAvatar}>
                                        <Text style={styles.browseAvatarText}>
                                            {(d.driverDetails?.name || 'D').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.browseName}>
                                            {d.driverDetails?.name || `Driver #${(d.userId || '').slice(-4)}`}
                                        </Text>
                                        <Text style={styles.browseMeta}>
                                            {d.vehicleDetails?.color || ''} {d.vehicleDetails?.vehicleModel || 'Vehicle'}
                                        </Text>
                                    </View>
                                </View>
                                <View style={styles.browseRight}>
                                    <Text style={[styles.browseSeats, { color: enough ? '#059669' : colors.textMuted }]}>
                                        {available ? `${available} seat${available !== 1 ? 's' : ''}` : 'FULL'}
                                    </Text>
                                    <Text style={styles.browseMatch}>
                                        {Math.round(d.routeMatchPercentage || 0)}% • {d.pickupDist ? `${d.pickupDist.toFixed(1)} km` : 'nearby'}
                                    </Text>
                                </View>
                                <View style={[styles.boardBtn, !enough && styles.boardBtnDisabled]}>
                                    <Text style={styles.boardBtnText}>{enough ? 'REQUEST' : 'FULL'}</Text>
                                </View>
                            </TouchableOpacity>
                        );
                    })}
                </View>
            )}

            {canChangeSeats && (
                <View style={styles.seatsContainer}>
                    <View style={styles.seatsRow}>
                        <Text style={styles.seatsLabel}>SEATS NEEDED (SHARED RIDE)</Text>
                        <View style={styles.seatsStepper}>
                            <TouchableOpacity
                                style={[styles.stepBtn, seatsNeeded <= 1 && styles.stepBtnDisabled]}
                                disabled={seatsNeeded <= 1}
                                onPress={() => setSeatsNeeded!(Math.max(1, seatsNeeded - 1))}
                            >
                                <Text style={styles.stepBtnText}>−</Text>
                            </TouchableOpacity>
                            <Text style={styles.seatsValue}>{Math.max(1, Math.min(seatsNeeded, maxRequestable))}</Text>
                            <TouchableOpacity
                                style={[styles.stepBtn, seatsNeeded >= maxRequestable && styles.stepBtnDisabled]}
                                disabled={seatsNeeded >= maxRequestable}
                                onPress={() => setSeatsNeeded!(Math.min(maxRequestable, seatsNeeded + 1))}
                            >
                                <Text style={styles.stepBtnText}>+</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                    <Text style={styles.seatsHint}>
                        {maxRequestable} seat{maxRequestable !== 1 ? 's' : ''} available on this type
                    </Text>
                </View>
            )}

            {estimatedFare !== null && (
                <View style={styles.fareContainer}>
                    <Text style={styles.fareLabel}>ESTIMATED TRIP COST ({selectedVehicleType.toUpperCase()})</Text>
                    <Text style={styles.fareValue}>
                        {formatCurrency(roundToNearestFive(estimatedFare * (selectedVehicleType === 'tricycle' ? 0.8 : selectedVehicleType === 'bus' ? 1.5 : 1.0)))}
                    </Text>
                    <Text style={styles.fareSubtext}>Base ₹10 for 2.5km + ₹2/km after</Text>
                </View>
            )}

            <TouchableOpacity style={styles.btn} onPress={onConfirm} activeOpacity={0.9}>
                <Text style={styles.btnText}>Confirm Ride Selection{canChangeSeats ? ` • ${boardedSeats} seat(s)` : ''}</Text>
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
        backgroundColor: colors.surface,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.xl,
        paddingBottom: 28,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        elevation: 15,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
    },
    titleText: {
        ...type.h2,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    selectorContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: spacing.xl,
        gap: spacing.sm,
    },
    optionCard: {
        flex: 1,
        backgroundColor: colors.inputBg,
        borderRadius: radius.md,
        paddingVertical: 14,
        paddingHorizontal: 10,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
        minHeight: 100,
    },
    selectedCard: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primary,
        shadowColor: colors.primary,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    cardTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
        textAlign: 'center',
    },
    selectedCardText: {
        color: colors.primary,
    },
    cardSeats: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.success,
        backgroundColor: colors.successSoft,
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
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 12,
    },
    selectedDescText: {
        color: colors.primary,
    },
    btn: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        borderRadius: radius.md,
        alignItems: "center",
        shadowColor: colors.primary,
        shadowOpacity: 0.2,
        shadowRadius: 6,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    btnText: {
        color: "#fff",
        fontSize: 17,
        fontWeight: "700",
    },
    fareContainer: {
        backgroundColor: colors.inputBg,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    fareLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    fareValue: {
        fontSize: 22,
        fontWeight: '900',
        color: colors.primary,
    },
    fareSubtext: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 2,
    },
    cardPrice: {
        fontSize: 13,
        fontWeight: 'bold',
        color: colors.text,
        marginVertical: 4,
    },
    selectedPriceText: {
        color: colors.primary,
    },
    seatsContainer: {
        backgroundColor: colors.inputBg,
        borderRadius: radius.md,
        padding: spacing.md,
        marginBottom: spacing.lg,
        borderWidth: 1.5,
        borderColor: colors.border,
    },
    seatsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    seatsLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        letterSpacing: 1.2,
        flex: 1,
    },
    seatsStepper: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    stepBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepBtnDisabled: {
        backgroundColor: colors.border,
    },
    stepBtnText: {
        color: '#FFFFFF',
        fontSize: 20,
        fontWeight: '700',
        lineHeight: 22,
    },
    seatsValue: {
        fontSize: 20,
        fontWeight: '900',
        color: colors.text,
        marginHorizontal: 16,
        minWidth: 22,
        textAlign: 'center',
    },
    seatsHint: {
        width: '100%',
        marginTop: spacing.sm,
        color: colors.textSecondary,
        fontSize: 11,
        textAlign: 'center',
    },
    browseContainer: {
        marginBottom: spacing.lg,
    },
    browseTitle: {
        fontSize: 11,
        fontWeight: '800',
        color: colors.textSecondary,
        letterSpacing: 1.2,
        marginBottom: 2,
    },
    browseSub: {
        fontSize: 11,
        color: colors.textMuted,
        marginBottom: spacing.md,
    },
    browseCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: radius.md,
        padding: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: colors.border,
    },
    browseLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    browseAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: colors.borderStrong,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    browseAvatarText: {
        fontSize: 15,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    browseName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
    },
    browseMeta: {
        fontSize: 12,
        color: colors.textSecondary,
    },
    browseRight: {
        alignItems: 'flex-end',
        marginRight: 10,
    },
    browseSeats: {
        fontSize: 13,
        fontWeight: '800',
    },
    browseMatch: {
        fontSize: 11,
        color: colors.textSecondary,
    },
    boardBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
    },
    boardBtnDisabled: {
        backgroundColor: colors.border,
    },
    boardBtnText: {
        color: '#FFFFFF',
        fontSize: 11,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
