import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LocationSearchBox } from '@/components/map/LocationSearchBox';

interface LocationSearchCardProps {
    onSelect: (coords: any) => void;
}

export const LocationSearchCard = ({ onSelect }: LocationSearchCardProps) => {
    return (
        <View style={styles.searchCard}>
            <LocationSearchBox
                placeholder="Destination"
                onSelect={onSelect}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    searchCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 5,
        left: 5,
        right: 5,
        backgroundColor: '#fff',
        borderRadius: 15,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 5,
        elevation: 2,
        zIndex: 10,
        padding: 8,
    },
});
