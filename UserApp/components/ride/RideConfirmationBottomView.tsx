import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface RideConfirmationBottomViewProps {
    onConfirm: () => void;
}

export const RideConfirmationBottomView = ({ onConfirm }: RideConfirmationBottomViewProps) => {
    return (
        <View style={styles.bottomView}>
            <TouchableOpacity style={styles.btn} onPress={onConfirm}>
                <Text style={styles.btnText}>Confirm Ride</Text>
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
        backgroundColor: "#fff",
        padding: 10,
        borderRadius: 15,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
    },
    btn: {
        backgroundColor: "#000",
        paddingVertical: 15,
        borderRadius: 12,
        alignItems: "center",
    },
    btnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
});
