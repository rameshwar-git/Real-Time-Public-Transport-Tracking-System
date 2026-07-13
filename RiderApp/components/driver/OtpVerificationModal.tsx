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
        backgroundColor: 'rgba(15, 23, 42, 0.7)' // Slate dark overlay
    },
    modalContent: {
        backgroundColor: '#1E293B',
        padding: 24,
        borderRadius: 24,
        width: '85%',
        alignItems: 'center',
        borderWidth: 1.5,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.3,
        shadowRadius: 16,
        elevation: 12,
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 16,
        color: '#F8FAFC',
        textAlign: 'center',
    },
    otpInput: {
        borderWidth: 1.5,
        borderColor: '#334155',
        backgroundColor: '#0F172A',
        color: '#10B981', // Neon emerald digits
        width: '100%',
        fontSize: 26,
        fontWeight: 'bold',
        textAlign: 'center',
        padding: 12,
        borderRadius: 14,
        marginBottom: 20,
        letterSpacing: 8
    },
    modalActions: {
        flexDirection: 'row',
        width: '100%',
        justifyContent: 'space-between'
    },
    cancelBtn: {
        backgroundColor: '#EF4444',
        paddingVertical: 14,
        borderRadius: 12,
        flex: 1,
        marginRight: 6,
        alignItems: 'center'
    },
    verifyBtn: {
        backgroundColor: '#10B981',
        paddingVertical: 14,
        borderRadius: 12,
        flex: 1,
        marginLeft: 6,
        alignItems: 'center'
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
