import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { colors, radius, shadow, spacing } from '@/constants/ui';

interface IncomingRequestCardProps {
    onAccept: () => void;
    onReject: () => void;
    incomingRequest?: any;
}

export const IncomingRequestCard = ({ onAccept, onReject, incomingRequest }: IncomingRequestCardProps) => {
    return (
        <View style={styles.incomingRequestCard}>
            <Text style={styles.incomingRequestTitle}>New Ride Request!</Text>
            <Text style={styles.incomingRequestDesc}>A passenger is on your route.</Text>

            {incomingRequest?.routeMatchPercentage !== undefined && (
                <View style={styles.matchContainer}>
                    <Text style={styles.matchText}>
                        🔥 {incomingRequest.routeMatchPercentage.toFixed(0)}% Route Match
                    </Text>
                </View>
            )}

            <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                    <View style={styles.iconColumn}>
                        <View style={styles.pickupDot} />
                        <View style={styles.connectorLine} />
                        <View style={styles.destDot} />
                    </View>
                    <View style={styles.addressColumn}>
                        <View style={styles.addressBlock}>
                            <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {incomingRequest?.origin?.description || "Current Location"}
                            </Text>
                        </View>
                        <View style={[styles.addressBlock, { marginTop: 16 }]}>
                            <Text style={styles.locationLabel}>DESTINATION</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {incomingRequest?.destination?.description || "Unknown Destination"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {incomingRequest?.estimatedDistance !== undefined && incomingRequest?.estimatedDuration !== undefined && (
                <View style={styles.estimateContainer}>
                    <Text style={styles.estimateLabel}>RIDE ESTIMATE</Text>
                    <View style={styles.estimatePill}>
                        <Text style={styles.estimateText}>
                            📏 {incomingRequest.estimatedDistance.toFixed(1)} km  •  ⏱️ {incomingRequest.estimatedDuration} min
                            {incomingRequest.fare !== undefined && `  •  💰 ₹${Number(incomingRequest.fare).toFixed(2)}`}
                        </Text>
                    </View>
                </View>
            )}

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
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.xl,
        ...shadow.elevated,
        zIndex: 100,
        borderWidth: 1,
        borderColor: colors.border,
    },
    incomingRequestTitle: {
        fontSize: 20,
        fontWeight: '800',
        marginBottom: spacing.sm,
        color: colors.text,
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    incomingRequestDesc: {
        fontSize: 14,
        color: colors.textSecondary,
        marginBottom: spacing.lg,
        textAlign: 'center',
    },
    estimateContainer: {
        alignItems: 'center',
        marginBottom: spacing.xl,
    },
    estimateLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textSecondary,
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    estimatePill: {
        backgroundColor: colors.primarySoft,
        borderColor: colors.primaryBorder,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.lg,
        paddingVertical: spacing.sm,
    },
    estimateText: {
        color: colors.primaryDark,
        fontSize: 14,
        fontWeight: '700',
    },
    incomingRequestActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: radius.md,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    rejectBtn: {
        backgroundColor: colors.danger,
    },
    acceptBtn: {
        backgroundColor: colors.primary,
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 16,
    },
    matchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.successSoft,
        borderColor: colors.primaryBorder,
        borderWidth: 1,
        borderRadius: radius.md,
        paddingVertical: 6,
        paddingHorizontal: spacing.md,
        marginBottom: spacing.lg,
        alignSelf: 'center',
    },
    matchText: {
        color: colors.primary,
        fontSize: 14,
        fontWeight: '700',
        letterSpacing: 0.2,
    },
    routeContainer: {
        backgroundColor: colors.inputBg,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.lg,
        width: '100%',
    },
    routeRow: {
        flexDirection: 'row',
    },
    iconColumn: {
        alignItems: 'center',
        width: 16,
        paddingVertical: 6,
    },
    pickupDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
    },
    connectorLine: {
        width: 2,
        flex: 1,
        backgroundColor: colors.borderStrong,
        marginVertical: 4,
    },
    destDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.danger,
    },
    addressColumn: {
        flex: 1,
        marginLeft: spacing.md,
    },
    addressBlock: {
        justifyContent: 'center',
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: colors.textSecondary,
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    locationText: {
        color: colors.text,
        fontSize: 14,
        fontWeight: '600',
    },
});
