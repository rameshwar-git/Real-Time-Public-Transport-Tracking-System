import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LocationSearchBox } from '@/components/map/LocationSearchBox';
import { colors, radius, shadow, spacing } from '@/constants/ui';

interface LocationSearchCardProps {
    onSelect: (coords: any) => void;
    onClear?: () => void;
    initialQuery?: string;
    onChooseOnMap?: () => void;
}

export const LocationSearchCard = ({ onSelect, onClear, initialQuery, onChooseOnMap }: LocationSearchCardProps) => {
    return (
        <View style={styles.searchCard}>
            <LocationSearchBox
                placeholder="Destination"
                onSelect={onSelect}
                onClear={onClear}
                initialQuery={initialQuery}
                onChooseOnMap={onChooseOnMap}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    searchCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 5,
        left: 8,
        right: 8,
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        ...shadow.elevated,
        zIndex: 10,
        padding: spacing.sm,
    },
});
