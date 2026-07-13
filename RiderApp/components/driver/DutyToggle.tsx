import React, { useEffect, useMemo, useRef } from 'react';
import {
    Animated,
    Easing,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

interface DutyToggleProps {
    isOnDuty: boolean;
    onToggle: () => void;
    /** Disable interactions (e.g., while a request is pending) */
    disabled?: boolean;
}

const TRACK_WIDTH = 60;
const TRACK_HEIGHT = 30;
const THUMB_SIZE = 30;
const THUMB_TRAVEL = TRACK_WIDTH - THUMB_SIZE - 6; // 6 = 2×padding inside track

export const DutyToggle: React.FC<DutyToggleProps> = ({ isOnDuty, onToggle, disabled }) => {
    const thumbAnim = useRef(new Animated.Value(isOnDuty ? THUMB_TRAVEL : 0)).current;
    const glowAnim = useRef(new Animated.Value(isOnDuty ? 1 : 0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;

    // Animate thumb + glow when duty state changes
    useEffect(() => {
        // Native driver for thumb translation
        Animated.spring(thumbAnim, {
            toValue: isOnDuty ? THUMB_TRAVEL : 0,
            useNativeDriver: true,
            damping: 16,
            stiffness: 180,
        }).start();

        // Non-native for background/glow color interpolation
        Animated.timing(glowAnim, {
            toValue: isOnDuty ? 1 : 0,
            duration: 250,
            easing: Easing.out(Easing.quad),
            useNativeDriver: false,
        }).start();
    }, [isOnDuty]);

    // Continuous pulse on the live dot while on duty
    useEffect(() => {
        if (!isOnDuty) {
            pulseAnim.setValue(1);
            return;
        }
        const pulse = Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.6, duration: 700, useNativeDriver: true }),
                Animated.timing(pulseAnim, { toValue: 1.0, duration: 700, useNativeDriver: true }),
            ])
        );
        pulse.start();
        return () => pulse.stop();
    }, [isOnDuty]);

    // Memoize interpolations — creating new Animated.interpolate() objects
    // on every render causes infinite re-render loops in React Native Fabric.
    const trackBg = useMemo(() => glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#1E293B', '#065F46'],
    }), []);

    const trackBorderColor = useMemo(() => glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#334155', '#10B981'],
    }), []);

    const thumbBg = useMemo(() => glowAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ['#475569', '#10B981'],
    }), []);

    return (
        <View style={styles.wrapper}>
            {/* Toggle track */}
            <TouchableOpacity
                activeOpacity={0.9}
                onPress={disabled ? undefined : onToggle}
                style={{ opacity: disabled ? 0.5 : 1 }}
                accessibilityRole="switch"
                accessibilityState={{ checked: isOnDuty, disabled }}
                accessibilityLabel="Duty status toggle"
            >
                <Animated.View
                    style={[
                        styles.track,
                        { backgroundColor: trackBg, borderColor: trackBorderColor },
                    ]}
                >
                    {/* Sliding thumb — two nested Animated.Views to avoid
                        mixing native-driven (translateX) and JS-driven
                        (backgroundColor) props on the same node */}
                    <Animated.View
                        style={{
                            transform: [{ translateX: thumbAnim }],
                        }}
                    >
                        <Animated.View
                            style={[
                                styles.thumb,
                                {
                                    backgroundColor: thumbBg,
                                    shadowColor: isOnDuty ? '#10B981' : 'transparent',
                                },
                            ]}
                        >
                            <MaterialIcons
                                name={isOnDuty ? 'radio-button-on' : 'radio-button-off'}
                                size={16}
                                color={isOnDuty ? '#ECFDF5' : '#94A3B8'}
                            />
                        </Animated.View>
                    </Animated.View>
                </Animated.View>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    wrapper: {
        alignItems: 'center',
        justifyContent: 'center',
    },

    track: {
        width: TRACK_WIDTH,
        height: TRACK_HEIGHT,
        borderRadius: TRACK_HEIGHT / 2,
        borderWidth: 1.5,
        justifyContent: 'center',
        paddingHorizontal: 3,
        overflow: 'hidden',
        position: 'relative',
    },

    thumb: {
        width: THUMB_SIZE,
        height: THUMB_SIZE,
        borderRadius: THUMB_SIZE / 2,
        justifyContent: 'center',
        alignItems: 'center',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 6,
        elevation: 4,
    },
});
