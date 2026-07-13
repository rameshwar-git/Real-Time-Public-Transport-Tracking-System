import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';

interface IncomingRequestCardProps {
    onAccept: () => void;
    onReject: () => void;
    incomingRequest?: any;
}

export const IncomingRequestCard = ({ onAccept, onReject, incomingRequest }: IncomingRequestCardProps) => {
    return (
        <View style={styles.incomingRequestCard}>
            <Text style={styles.incomingRequestTitle}>New Ride Request!</Text>
            <Text style={styles.incomingRequestDesc}>A passenger is on your route.</Text>

            {incomingRequest?.routeMatchPercentage !== undefined && (
                <View style={styles.matchContainer}>
                    <Text style={styles.matchText}>
                        🔥 {incomingRequest.routeMatchPercentage.toFixed(0)}% Route Match
                    </Text>
                </View>
            )}

            <View style={styles.routeContainer}>
                <View style={styles.routeRow}>
                    <View style={styles.iconColumn}>
                        <View style={styles.pickupDot} />
                        <View style={styles.connectorLine} />
                        <View style={styles.destDot} />
                    </View>
                    <View style={styles.addressColumn}>
                        <View style={styles.addressBlock}>
                            <Text style={styles.locationLabel}>PICKUP LOCATION</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {incomingRequest?.origin?.description || "Current Location"}
                            </Text>
                        </View>
                        <View style={[styles.addressBlock, { marginTop: 16 }]}>
                            <Text style={styles.locationLabel}>DESTINATION</Text>
                            <Text style={styles.locationText} numberOfLines={2}>
                                {incomingRequest?.destination?.description || "Unknown Destination"}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            {incomingRequest?.estimatedDistance !== undefined && incomingRequest?.estimatedDuration !== undefined && (
                <View style={styles.estimateContainer}>
                    <Text style={styles.estimateLabel}>RIDE ESTIMATE</Text>
                    <View style={styles.estimatePill}>
                        <Text style={styles.estimateText}>
                            📏 {incomingRequest.estimatedDistance.toFixed(1)} km  •  ⏱️ {incomingRequest.estimatedDuration} min
                            {incomingRequest.fare !== undefined && `  •  💰 ₹${Number(incomingRequest.fare).toFixed(2)}`}
                        </Text>
                    </View>
                </View>
            )}

            <View style={styles.incomingRequestActions}>
                <TouchableOpacity style={[styles.actionBtn, styles.rejectBtn]} onPress={onReject}>
                    <Text style={styles.actionBtnText}>Decline</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, styles.acceptBtn]} onPress={onAccept}>
                    <Text style={styles.actionBtnText}>Accept</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    incomingRequestCard: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 120 : 90,
        left: 20,
        right: 20,
        backgroundColor: '#1E293B',
        borderRadius: 20,
        padding: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
        elevation: 10,
        zIndex: 100,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    incomingRequestTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 8,
        color: '#F8FAFC',
        textAlign: 'center',
        letterSpacing: 0.3,
    },
    incomingRequestDesc: {
        fontSize: 14,
        color: '#94A3B8',
        marginBottom: 16,
        textAlign: 'center',
    },
    estimateContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    estimateLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 6,
    },
    estimatePill: {
        backgroundColor: '#334155',
        borderColor: '#475569',
        borderWidth: 1,
        borderRadius: 20,
        paddingHorizontal: 16,
        paddingVertical: 8,
    },
    estimateText: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: 'bold',
    },
    incomingRequestActions: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    actionBtn: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 12,
        alignItems: 'center',
        marginHorizontal: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 3,
        elevation: 2,
    },
    rejectBtn: {
        backgroundColor: '#EF4444',
    },
    acceptBtn: {
        backgroundColor: '#10B981',
    },
    actionBtnText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    matchContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 0.25)',
        borderWidth: 1,
        borderRadius: 12,
        paddingVertical: 6,
        paddingHorizontal: 12,
        marginBottom: 16,
        alignSelf: 'center',
    },
    matchText: {
        color: '#10B981',
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 0.2,
    },
    routeContainer: {
        backgroundColor: '#0F172A',
        borderColor: '#334155',
        borderWidth: 1.5,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        width: '100%',
    },
    routeRow: {
        flexDirection: 'row',
    },
    iconColumn: {
        alignItems: 'center',
        width: 16,
        paddingVertical: 6,
    },
    pickupDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#10B981',
    },
    connectorLine: {
        width: 2,
        flex: 1,
        backgroundColor: '#334155',
        marginVertical: 4,
    },
    destDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: '#EF4444',
    },
    addressColumn: {
        flex: 1,
        marginLeft: 12,
    },
    addressBlock: {
        justifyContent: 'center',
    },
    locationLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 4,
    },
    locationText: {
        color: '#F8FAFC',
        fontSize: 14,
        fontWeight: '600',
    },
});
