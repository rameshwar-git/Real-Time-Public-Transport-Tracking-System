import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface SearchingDriversBottomViewProps {
    onCancel: () => void;
}

export const SearchingDriversBottomView = ({ onCancel }: SearchingDriversBottomViewProps) => {
    return (
        <View style={styles.bottomView}>
            <Text style={styles.searchingText}>Looking for drivers nearby...</Text>
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
    cancelBtn: {
        backgroundColor: "#D32F2F",
        marginTop: 15,
    },
    btnText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "bold",
    },
    searchingText: {
        fontSize: 16,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 5,
        color: "#333",
    },
});
