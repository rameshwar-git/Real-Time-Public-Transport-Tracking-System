import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, TextInput } from 'react-native';

interface OtpVerificationModalProps {
    visible: boolean;
    passengerName: string;
    otpInput: string;
    setOtpInput: (text: string) => void;
    onCancel: () => void;
    onVerify: () => void;
}

export const OtpVerificationModal = ({ visible, passengerName, otpInput, setOtpInput, onCancel, onVerify }: OtpVerificationModalProps) => {
    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    <Text style={styles.modalTitle}>Enter OTP for {passengerName}</Text>
                    <TextInput 
                        style={styles.otpInput} 
                        placeholder="0000" 
                        keyboardType="number-pad"
                        maxLength={4}
                        value={otpInput}
                        onChangeText={setOtpInput}
                    />
                    <View style={styles.modalActions}>
                        <TouchableOpacity style={styles.cancelBtn} onPress={onCancel}>
                            <Text style={styles.actionBtnText}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.verifyBtn} onPress={onVerify}>
                            <Text style={styles.actionBtnText}>Verify</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },
    modalContent: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 15,
        width: '80%',
        alignItems: 'center'
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15
    },
    otpInput: {
        borderWidth: 1,
        borderColor: '#ccc',
        width: '100%',
        fontSize: 24,
        textAlign: 'center',
        padding: 10,
        borderRadius: 8,
        marginBottom: 20,
        letterSpacing: 5
    },
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    cancelBtn: {
        backgroundColor: '#F44336',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginRight: 5,
        alignItems: 'center'
    },
    verifyBtn: {
        backgroundColor: '#4CAF50',
        padding: 12,
        borderRadius: 8,
        flex: 1,
        marginLeft: 5,
        alignItems: 'center'
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
