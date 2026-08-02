import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, radius, shadow, spacing } from '@/constants/ui';
import { rateDriver } from '@/services/apiService';

interface TripReceiptProps {
    driverDetails: {
        name?: string;
        vehicleModel?: string;
        vehicleNumber?: string;
        fare?: number;
    } | null;
    origin?: { description?: string } | null;
    destination?: { description?: string } | null;
    onDismiss: () => void;
    tripId?: string | null;
}

export const TripReceipt = ({ driverDetails, origin, destination, onDismiss, tripId }: TripReceiptProps) => {
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const handleRate = async () => {
        if (!rating) {
            Alert.alert('Select a rating', 'Please tap a star to rate your driver.');
            return;
        }
        if (!tripId) return;
        setSubmitting(true);
        try {
            await rateDriver(tripId, rating);
            setSubmitted(true);
        } catch (err) {
            Alert.alert('Error', 'Failed to submit rating');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <View style={styles.overlay}>
            <View style={styles.card}>
                <View style={styles.headerIcon}>
                    <MaterialIcons name="check-circle" size={64} color="#10B981" />
                </View>
                <Text style={styles.title}>Trip Completed</Text>
                <Text style={styles.subtitle}>You have reached your destination safely.</Text>

                <View style={styles.detailsContainer}>
                    <View style={styles.detailRow}>
                        <MaterialIcons name="person" size={20} color="#64748B" />
                        <Text style={styles.detailText}>{driverDetails?.name || 'Driver'}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <MaterialIcons name="directions-car" size={20} color="#64748B" />
                        <Text style={styles.detailText}>
                            {driverDetails?.vehicleModel || 'Vehicle'} • {driverDetails?.vehicleNumber?.toUpperCase() || ''}
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.locationRow}>
                        <View style={styles.dotOrigin} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {origin?.description || 'Pickup Location'}
                        </Text>
                    </View>
                    <View style={styles.locationLine} />
                    <View style={styles.locationRow}>
                        <View style={styles.dotDestination} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {destination?.description || 'Dropoff Location'}
                        </Text>
                    </View>

                    {driverDetails?.fare !== undefined && (
                        <>
                            <View style={styles.divider} />
                            <View style={styles.fareRow}>
                                <Text style={styles.fareLabel}>Total Fare</Text>
                                <Text style={styles.fareValue}>₹{Number(driverDetails.fare).toFixed(2)}</Text>
                            </View>
                        </>
                    )}
                </View>

                {/* Rate the driver */}
                {!submitted ? (
                    <View style={styles.ratingBox}>
                        <Text style={styles.ratingTitle}>Rate your driver</Text>
                        <View style={styles.starsRow}>
                            {[1, 2, 3, 4, 5].map((star) => (
                                <TouchableOpacity key={star} onPress={() => setRating(star)} activeOpacity={0.7}>
                                    <MaterialIcons
                                        name={star <= rating ? 'star' : 'star-border'}
                                        size={36}
                                        color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                        <TouchableOpacity
                            style={[styles.rateBtn, submitting && { opacity: 0.6 }]}
                            onPress={handleRate}
                            disabled={submitting}
                        >
                            <Text style={styles.rateBtnText}>
                                {submitting ? 'Submitting...' : `Submit ${rating ? rating + '★' : ''} Rating`}
                            </Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={[styles.ratingBox, styles.ratedBox]}>
                        <MaterialIcons name="star" size={22} color="#F59E0B" />
                        <Text style={styles.ratedText}>Thank you for rating {rating}★</Text>
                    </View>
                )}

                <TouchableOpacity style={styles.doneBtn} onPress={onDismiss}>
                    <Text style={styles.doneBtnText}>Done</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    overlay: {
        position: 'absolute',
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.7)',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 2000,
        padding: 20,
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: radius.xl,
        padding: spacing.xxl,
        width: '100%',
        maxWidth: 400,
        alignItems: 'center',
        ...shadow.pop,
    },
    headerIcon: {
        marginBottom: spacing.lg,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.sm,
    },
    subtitle: {
        fontSize: 15,
        color: colors.textSecondary,
        marginBottom: spacing.xxl,
        textAlign: 'center',
    },
    detailsContainer: {
        width: '100%',
        backgroundColor: colors.inputBg,
        borderRadius: radius.lg,
        padding: spacing.lg,
        marginBottom: spacing.xxl,
        borderWidth: 1,
        borderColor: colors.border,
    },
    detailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.md,
    },
    detailText: {
        marginLeft: spacing.md,
        fontSize: 15,
        color: colors.text,
        fontWeight: '600',
    },
    divider: {
        height: 1,
        backgroundColor: colors.border,
        marginVertical: spacing.md,
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    dotOrigin: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.primary,
        marginHorizontal: 5,
    },
    dotDestination: {
        width: 10,
        height: 10,
        backgroundColor: colors.danger,
        marginHorizontal: 5,
    },
    locationLine: {
        width: 2,
        height: 12,
        backgroundColor: '#CBD5E1',
        marginLeft: 9,
        marginVertical: 4,
    },
    locationText: {
        marginLeft: spacing.md,
        fontSize: 14,
        color: colors.textSecondary,
        flex: 1,
    },
    fareRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 4,
    },
    fareLabel: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    fareValue: {
        fontSize: 24,
        fontWeight: '900',
        color: colors.success,
    },
    doneBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 16,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    doneBtnText: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
    },
    ratingBox: {
        width: '100%',
        alignItems: 'center',
        marginBottom: spacing.xl,
        padding: spacing.lg,
        backgroundColor: colors.inputBg,
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    ratedBox: {
        flexDirection: 'row',
        justifyContent: 'center',
        gap: spacing.sm,
    },
    ratingTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
        marginBottom: spacing.md,
    },
    starsRow: {
        flexDirection: 'row',
        gap: spacing.sm,
        marginBottom: spacing.lg,
    },
    ratedText: {
        fontSize: 15,
        fontWeight: '600',
        color: colors.text,
    },
    rateBtn: {
        backgroundColor: colors.warning,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: radius.md,
    },
    rateBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700',
    },
});
