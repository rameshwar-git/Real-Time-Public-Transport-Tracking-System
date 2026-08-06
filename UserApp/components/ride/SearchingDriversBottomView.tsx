import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, radius, shadow, spacing } from '@/constants/ui';

interface Driver {
    userId: string;
    pickupDist: number;
    routeMatchPercentage: number;
    availableSeats: number;
    rating?: number | null;
    driverDetails?: {
        name: string;
        phone: string;
    };
    vehicleDetails?: {
        vehicleType: string;
        vehicleModel: string;
        vehicleNumber: string;
        color: string;
    };
}

interface SearchingDriversBottomViewProps {
    onCancel: () => void;
    drivers?: Driver[];
    currentDriverIndex?: number;
    /** Tap a specific vehicle (e.g. one with enough seats) to request it directly. */
    onSelectDriver?: (index: number) => void;
    /** How many seats this passenger wants, shown against each driver's availability. */
    seatsNeeded?: number;
}

export const SearchingDriversBottomView = ({
    onCancel,
    drivers = [],
    currentDriverIndex = 0,
    onSelectDriver,
    seatsNeeded = 1
}: SearchingDriversBottomViewProps) => {
    const hasDrivers = Array.isArray(drivers) && drivers.length > 0;

    const getMatchColor = (pct: number) => {
        if (pct >= 90) return { bg: '#ECFDF5', text: '#059669' }; // Emerald Green
        if (pct >= 75) return { bg: '#EEF2FF', text: '#4F46E5' }; // Indigo
        if (pct >= 50) return { bg: '#EFF6FF', text: '#2563EB' }; // Blue
        return { bg: '#F8FAFC', text: '#64748B' }; // Slate
    };

    return (
        <View style={styles.bottomView}>
            <View style={styles.header}>
                <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                </View>
                <Text style={styles.searchingText}>
                    {hasDrivers ? `Locating Best Matches` : `Searching for drivers...`}
                </Text>
            </View>

            {hasDrivers && (
                <Text style={styles.subtext}>
                    Found {drivers.length} drivers heading your way. Contacting them in order:
                </Text>
            )}

            {hasDrivers ? (
                <ScrollView
                    style={styles.listContainer}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    {drivers.map((driver, idx) => {
                        const isCurrent = idx === currentDriverIndex;
                        const isPassed = idx < currentDriverIndex;
                        const matchStyle = getMatchColor(driver.routeMatchPercentage || 0);
                        const available = driver.availableSeats != null ? Number(driver.availableSeats) : 4;
                        // Enough seats to fulfil this passenger's request?
                        const hasEnoughSeats = available >= seatsNeeded;
                        const canSelect = !!onSelectDriver;
                        const Card = canSelect ? TouchableOpacity : View;

                        return (
                            <Card
                                key={driver.userId || idx}
                                style={[
                                    styles.driverCard,
                                    isCurrent && styles.activeCard,
                                    isPassed && styles.passedCard,
                                    canSelect && !isPassed && styles.selectableCard
                                ]}
                                activeOpacity={0.8}
                                onPress={canSelect && !isPassed ? () => onSelectDriver!(idx) : undefined}
                            >
                                <View style={styles.leftCol}>
                                    <View style={[styles.avatarCircle, isCurrent && styles.activeAvatarCircle]}>
                                        <Text style={styles.avatarText}>
                                            {(driver.driverDetails?.name || 'D').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailsCol}>
                                        <Text style={[styles.driverName, isPassed && styles.mutedText]}>
                                            {driver.driverDetails?.name || `Driver #${(driver.userId || '').slice(-4)}`}
                                        </Text>
                                        <Text style={styles.vehicleInfo}>
                                            {driver.vehicleDetails?.color || ''} {driver.vehicleDetails?.vehicleModel || 'Vehicle'}
                                            {driver.vehicleDetails?.vehicleNumber ? ` • ${driver.vehicleDetails.vehicleNumber}` : ''}
                                        </Text>
                                        <Text style={[styles.seatsInfo, { color: hasEnoughSeats ? '#059669' : colors.textMuted }]}>
                                            {available} seat{available !== 1 ? 's' : ''} available
                                            {!hasEnoughSeats && ` — not enough for ${seatsNeeded} requested`}
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rightCol}>
                                    {driver.rating ? (
                                        <View style={styles.ratingRow}>
                                            <MaterialIcons name="star" size={14} color="#F59E0B" />
                                            <Text style={styles.ratingText}>{driver.rating.toFixed(1)}</Text>
                                        </View>
                                    ) : null}
                                    <View style={[styles.badge, { backgroundColor: matchStyle.bg }]}>
                                        <Text style={[styles.badgeText, { color: matchStyle.text }]}>
                                            {Math.round(driver.routeMatchPercentage || 0)}% Match
                                        </Text>
                                    </View>

                                    <Text style={styles.distText}>
                                        {driver.pickupDist ? `${driver.pickupDist.toFixed(2)} km` : 'Nearby'}
                                    </Text>

                                    {isCurrent && (
                                        <View style={styles.statusBadgeCurrent}>
                                            <Text style={styles.statusTextCurrent}>CONNECTING</Text>
                                        </View>
                                    )}
                                    {isPassed && (
                                        <View style={styles.statusBadgePassed}>
                                            <Text style={styles.statusTextPassed}>PASSED</Text>
                                        </View>
                                    )}
                                    {!isCurrent && !isPassed && (
                                        <View style={styles.statusBadgeQueue}>
                                            <Text style={styles.statusTextQueue}>QUEUED</Text>
                                        </View>
                                    )}
                                    {canSelect && !isCurrent && !isPassed && hasEnoughSeats && (
                                        <View style={styles.pickBadge}>
                                            <Text style={styles.pickText}>REQUEST THIS</Text>
                                        </View>
                                    )}
                                </View>
                            </Card>
                        );
                    })}
                </ScrollView>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingSubtext}>Analyzing route matches, detours, and distances...</Text>
                </View>
            )}

            <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancel}>
                <Text style={styles.btnText}>Cancel Search</Text>
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
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: spacing.sm,
    },
    pulseContainer: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primarySoft,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.sm,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    searchingText: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        color: colors.text,
    },
    subtext: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: "center",
        marginBottom: spacing.lg,
    },
    listContainer: {
        maxHeight: Dimensions.get('window').height * 0.35,
        marginBottom: spacing.sm,
    },
    listContent: {
        paddingVertical: 4,
    },
    driverCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: colors.inputBg,
        borderRadius: radius.md,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    activeCard: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primaryBorder,
        borderWidth: 1.5,
    },
    passedCard: {
        backgroundColor: '#FAFAFA',
        opacity: 0.6,
        borderColor: colors.border,
    },
    selectableCard: {
        borderColor: colors.border,
        borderWidth: 1.5,
    },
    pickBadge: {
        marginTop: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 6,
    },
    pickText: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.borderStrong,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: spacing.md,
    },
    activeAvatarCircle: {
        backgroundColor: colors.primary,
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: colors.textSecondary,
    },
    detailsCol: {
        flex: 1,
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 2,
    },
    mutedText: {
        color: colors.textSecondary,
        textDecorationLine: 'line-through',
    },
    vehicleInfo: {
        fontSize: 12,
        color: colors.textSecondary,
        marginBottom: 2,
    },
    seatsInfo: {
        fontSize: 11,
        color: colors.textMuted,
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 10,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 4,
    },
    ratingText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
        marginLeft: 4,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    distText: {
        fontSize: 12,
        fontWeight: '500',
        color: colors.text,
        marginBottom: 6,
    },
    statusBadgeCurrent: {
        backgroundColor: colors.primary,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextCurrent: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadgePassed: {
        backgroundColor: colors.textMuted,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextPassed: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadgeQueue: {
        backgroundColor: colors.border,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextQueue: {
        color: colors.textSecondary,
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSubtext: {
        fontSize: 13,
        color: colors.textMuted,
        textAlign: 'center',
    },
    btn: {
        backgroundColor: colors.text,
        paddingVertical: 15,
        borderRadius: radius.md,
        alignItems: "center",
    },
    cancelBtn: {
        backgroundColor: colors.danger,
        marginTop: 10,
        shadowColor: colors.danger,
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    btnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "700",
    },
});
