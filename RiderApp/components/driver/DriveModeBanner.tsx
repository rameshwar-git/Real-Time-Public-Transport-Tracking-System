import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import { colors, radius, spacing, shadow } from "@/constants/ui";
import type { DirectionsStep } from "@/services/directions";

interface DriveModeBannerProps {
    /** Destination is set + driver on duty → banner may show. */
    isAvailable: boolean;
    /** Turn-by-turn is actively running. */
    isDriveActive: boolean;
    currentStep: DirectionsStep | null;
    /** Meters remaining until the next maneuver. */
    distanceToNext: number;
    remainingDistanceText: string;
    remainingDurationText: string;
    onStart: () => void;
    onEnd: () => void;
}

// Map a Google maneuver tag to an icon for the instruction banner.
const maneuverIcon = (maneuver?: string | null): keyof typeof Ionicons.glyphMap => {
    switch (maneuver) {
        case 'turn-right':
        case 'ramp-right':
            return 'arrow-redo';
        case 'turn-left':
        case 'ramp-left':
            return 'arrow-undo';
        case 'turn-slight-right':
            return 'arrow-forward';
        case 'turn-slight-left':
            return 'arrow-back';
        case 'turn-sharp-right':
            return 'arrow-forward-circle';
        case 'turn-sharp-left':
            return 'arrow-back-circle';
        case 'uturn-right':
        case 'uturn-left':
            return 'repeat';
        case 'straight':
        case 'merge':
            return 'trending-up';
        case 'roundabout-left':
        case 'roundabout-right':
            return 'sync';
        case 'ferry':
            return 'boat';
        default:
            return 'navigate';
    }
};

export const DriveModeBanner = ({
    isAvailable,
    isDriveActive,
    currentStep,
    distanceToNext,
    remainingDistanceText,
    remainingDurationText,
    onStart,
    onEnd,
}: DriveModeBannerProps) => {
    if (!isAvailable) return null;

    return (
        <View style={styles.banner}>
            {isDriveActive ? (
                <>
                    <View style={styles.stepRow}>
                        <View style={styles.iconCircle}>
                            <Ionicons
                                name={maneuverIcon(currentStep?.maneuver)}
                                size={22}
                                color="#fff"
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.instruction} numberOfLines={2}>
                                {currentStep?.instruction || 'Proceed to destination'}
                            </Text>
                            <Text style={styles.eta}>
                                {distanceToNext > 0
                                    ? `in ${distanceToNext >= 1000 ? `${(distanceToNext / 1000).toFixed(1)} km` : `${distanceToNext} m`}`
                                    : 'Arriving'}
                                {remainingDurationText ? ` • ${remainingDurationText}` : ''}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.footerRow}>
                        <Text style={styles.remainingText}>
                            {remainingDistanceText ? `${remainingDistanceText} remaining` : ''}
                        </Text>
                        <TouchableOpacity style={styles.endBtn} onPress={onEnd} activeOpacity={0.8}>
                            <Text style={styles.endBtnText}>End Nav</Text>
                        </TouchableOpacity>
                    </View>
                </>
            ) : (
                <View style={styles.stepRow}>
                    <View style={styles.iconCircle}>
                        <Ionicons name="navigate" size={22} color="#fff" />
                    </View>
                    <Text style={[styles.instruction, { flex: 1 }]}>
                        Turn-by-turn navigation is available for this route.
                    </Text>
                    <TouchableOpacity style={styles.startBtn} onPress={onStart} activeOpacity={0.8}>
                        <Text style={styles.startBtnText}>Start Nav</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    banner: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 90,
        left: 15,
        right: 15,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.md,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow.elevated,
        zIndex: 1000,
    },
    stepRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
    },
    iconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    instruction: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.text,
    },
    eta: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: spacing.sm,
    },
    remainingText: {
        fontSize: 13,
        color: colors.textSecondary,
    },
    endBtn: {
        backgroundColor: colors.danger,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
    },
    endBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
    startBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: radius.pill,
    },
    startBtnText: {
        color: '#fff',
        fontWeight: '700',
        fontSize: 13,
    },
});
