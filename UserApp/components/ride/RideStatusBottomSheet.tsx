import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface RideStatusBottomSheetProps {
    tripStatus: string | null;
    otp: string | null;
    driverDetails: any;
    onCancelTrip: () => void;
}

export const RideStatusBottomSheet = ({ tripStatus, otp, driverDetails, onCancelTrip }: RideStatusBottomSheetProps) => {
    return (
        <View style={styles.bottomSheetContainer}>
            <View style={styles.handleBar} />
            
            <Text style={styles.sheetTitle}>
                {tripStatus === 'in_progress' ? 'On Route to Destination' : 'Driver is Arriving'}
            </Text>

            {tripStatus === 'scheduled' && otp && (
                <View style={styles.otpContainer}>
                    <Text style={styles.otpLabel}>Share this OTP with driver to start ride</Text>
                    <Text style={styles.otpValue}>{otp}</Text>
                </View>
            )}
            
            <View style={styles.driverInfoCard}>
                <View style={styles.avatarPlaceholder}>
                    <Text style={styles.avatarText}>{driverDetails?.name?.[0] || 'D'}</Text>
                </View>
                <View style={styles.driverTextContent}>
                    <Text style={styles.driverName}>{driverDetails?.name || 'Driver'}</Text>
                    <Text style={styles.vehicleText}>Vehicle is on the way</Text>
                </View>
            </View>

            {tripStatus !== 'in_progress' && (
                <TouchableOpacity style={[styles.btn, styles.cancelBtn]} onPress={onCancelTrip}>
                    <Text style={styles.btnText}>Cancel Trip</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    bottomSheetContainer: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#fff",
        padding: 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    handleBar: {
        width: 50,
        height: 5,
        backgroundColor: '#e0e0e0',
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 15,
    },
    sheetTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#111',
        marginBottom: 15,
        textAlign: 'center',
    },
    otpContainer: {
        backgroundColor: '#f5f5f5',
        padding: 15,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 20,
    },
    otpLabel: {
        fontSize: 12,
        color: '#666',
        marginBottom: 5,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    otpValue: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#000',
        letterSpacing: 8,
    },
    driverInfoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        backgroundColor: '#fafafa',
        padding: 15,
        borderRadius: 15,
    },
    avatarPlaceholder: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#000',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: '#fff',
        fontSize: 20,
        fontWeight: 'bold',
    },
    driverTextContent: {
        flex: 1,
    },
    driverName: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 2,
    },
    vehicleText: {
        fontSize: 14,
        color: '#777',
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
});
