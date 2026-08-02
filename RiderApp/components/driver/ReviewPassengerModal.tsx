import React, { useEffect, useState } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { colors, radius, spacing, shadow } from '@/constants/ui';
import { ratePassenger } from '@/services/apiService';

interface ReviewPassengerModalProps {
    trip: any | null;
    onDismiss: (trip: any) => void;
}

export const ReviewPassengerModal = ({ trip, onDismiss }: ReviewPassengerModalProps) => {
    const [rating, setRating] = useState(0);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Reset the selection whenever a new completed ride is presented.
    useEffect(() => {
        if (trip) {
            setRating(0);
            setError(null);
        }
    }, [trip?.tripId]);

    const handleSubmit = async () => {
        if (!trip || !rating || submitting) return;
        setSubmitting(true);
        setError(null);
        try {
            await ratePassenger(trip.tripId, rating);
            // Submit directly — close the card without any confirmation popup.
            onDismiss(trip);
        } catch (err) {
            setError('Failed to submit rating. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleSkip = () => {
        if (!trip) return;
        onDismiss(trip);
    };

    return (
        <Modal
            visible={!!trip}
            transparent
            animationType="fade"
            onRequestClose={handleSkip}
        >
            <View style={styles.overlay}>
                <View style={styles.card}>
                    <View style={styles.headerRow}>
                        <View style={styles.badge}>
                            <MaterialIcons name="check-circle" size={18} color={colors.success} />
                            <Text style={styles.badgeText}>Ride Completed</Text>
                        </View>
                    </View>

                    <Text style={styles.title}>Rate your passenger</Text>
                    <Text style={styles.passengerName}>{trip?.passengerName}</Text>
                    <Text style={styles.subtitle}>How was your trip with them?</Text>

                    <View style={styles.starsRow}>
                        {[1, 2, 3, 4, 5].map((star) => (
                            <TouchableOpacity
                                key={star}
                                onPress={() => setRating(star)}
                                activeOpacity={0.7}
                                disabled={submitting}
                            >
                                <MaterialIcons
                                    name={star <= rating ? 'star' : 'star-border'}
                                    size={38}
                                    color={star <= rating ? '#F59E0B' : '#CBD5E1'}
                                />
                            </TouchableOpacity>
                        ))}
                    </View>

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <View style={styles.actions}>
                        <TouchableOpacity
                            style={[styles.submitBtn, !rating && styles.submitBtnDisabled]}
                            onPress={handleSubmit}
                            disabled={!rating || submitting}
                        >
                            {submitting ? (
                                <ActivityIndicator color="#fff" size="small" />
                            ) : (
                                <Text style={styles.submitText}>
                                    {rating ? `Submit ${rating}★ Rating` : 'Select a rating'}
                                </Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} disabled={submitting}>
                            <Text style={styles.skipText}>Skip</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(11, 18, 32, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: spacing.lg,
    },
    card: {
        width: '100%',
        maxWidth: 360,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.lg,
        alignItems: 'center',
        ...shadow.elevated,
    },
    headerRow: {
        width: '100%',
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: spacing.md,
    },
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.successSoft,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: radius.pill,
    },
    badgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.success,
    },
    title: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.xs,
        textAlign: 'center',
    },
    passengerName: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.text,
        marginBottom: spacing.xs,
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        marginBottom: spacing.md,
        textAlign: 'center',
    },
    starsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        marginBottom: spacing.md,
    },
    errorText: {
        color: colors.danger,
        fontSize: 12,
        marginBottom: spacing.sm,
        textAlign: 'center',
    },
    actions: {
        width: '100%',
        flexDirection: 'row',
        gap: spacing.sm,
    },
    submitBtn: {
        flex: 1,
        backgroundColor: colors.warning,
        paddingVertical: 14,
        borderRadius: radius.md,
        alignItems: 'center',
    },
    submitBtnDisabled: {
        backgroundColor: colors.border,
    },
    submitText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 14,
    },
    skipBtn: {
        paddingVertical: 14,
        paddingHorizontal: 20,
        borderRadius: radius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.inputBg,
        borderWidth: 1,
        borderColor: colors.border,
    },
    skipText: {
        color: colors.textSecondary,
        fontWeight: '700',
        fontSize: 14,
    },
});
