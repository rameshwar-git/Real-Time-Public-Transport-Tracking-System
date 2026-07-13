import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { getDistance } from '@/utils/geometry';

interface RideStatusBottomSheetProps {
    tripStatus: string | null;
    otp: string | null;
    driverDetails: {
        name?: string;
        phone?: string;
        vehicleModel?: string;
        vehicleNumber?: string;
        vehicleColor?: string;
        vehicleType?: string;
        estimatedDistance?: number;
        estimatedDuration?: number;
        fare?: number;
    } | null;
    onCancelTrip: () => void;
    assignedDriverLocation?: { latitude: number; longitude: number } | null;
    origin?: { latitude: number; longitude: number } | null;
    destination?: { latitude: number; longitude: number } | null;
    routeDetails?: { distance: number; duration: number } | null;
}

export const RideStatusBottomSheet = ({
    tripStatus,
    otp,
    driverDetails,
    onCancelTrip,
    assignedDriverLocation,
    origin,
    destination,
    routeDetails
}: RideStatusBottomSheetProps) => {

    // 1. Calculate Real-Time Distance & ETA
    let distanceKm: number | null = null;
    let etaMinutes: number | null = null;

    if (routeDetails) {
        distanceKm = routeDetails.distance;
        etaMinutes = Math.max(1, Math.round(routeDetails.duration));
    } else if (assignedDriverLocation) {
        if (tripStatus === 'scheduled' && origin) {
            distanceKm = getDistance(
                assignedDriverLocation.latitude,
                assignedDriverLocation.longitude,
                origin.latitude,
                origin.longitude
            );
        } else if (tripStatus === 'in_progress' && destination) {
            distanceKm = getDistance(
                assignedDriverLocation.latitude,
                assignedDriverLocation.longitude,
                destination.latitude,
                destination.longitude
            );
        }

        if (distanceKm !== null && distanceKm >= 0) {
            // Speed of 25 km/h in city traffic -> Time (min) = dist * 2.4 + buffer
            etaMinutes = Math.max(1, Math.round(distanceKm * 2.4));
        }
    }

    if ((distanceKm === null || etaMinutes === null) && driverDetails?.estimatedDistance !== undefined && driverDetails?.estimatedDuration !== undefined) {
        distanceKm = driverDetails.estimatedDistance;
        etaMinutes = driverDetails.estimatedDuration;
    }

    const formattedDistance = distanceKm !== null 
        ? distanceKm < 1 
            ? `${Math.round(distanceKm * 1000)} m`
            : `${distanceKm.toFixed(1)} km`
        : null;

    // 2. Action Handlers
    const handleCallDriver = () => {
        const phone = driverDetails?.phone || '+1 (555) 019-2834';
        Alert.alert(
            "Contacting Driver",
            `Connecting a simulated secure call to ${driverDetails?.name || 'your driver'} at ${phone}...`,
            [{ text: "OK" }]
        );
    };

    const handleMessageDriver = () => {
        Alert.alert(
            "Message Driver",
            `Open chat screen with ${driverDetails?.name || 'your driver'}?`,
            [
                { text: "Cancel", style: "cancel" },
                { text: "Chat", onPress: () => Alert.alert("Chat Info", "Chat module: 'I have arrived!'") }
            ]
        );
    };

    const handleSOS = () => {
        Alert.alert(
            "⚠️ EMERGENCY SOS",
            "This will immediately trigger an emergency alert to dispatch. Are you in danger?",
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "YES, TRIGGER", 
                    style: "destructive", 
                    onPress: () => Alert.alert("SOS Triggered", "Emergency services notified! A support agent is contacting you.") 
                }
            ]
        );
    };

    return (
        <View style={styles.bottomSheetContainer}>
            {/* Top Drag Indicator */}
            <View style={styles.handleBar} />
            
            {/* Real-time Distance & ETA Indicator Banner */}
            <View style={[styles.realTimeBanner, tripStatus === 'in_progress' ? styles.bannerProgress : styles.bannerScheduled]}>
                <View style={styles.liveIndicatorContainer}>
                    <View style={styles.livePulseDot} />
                    <Text style={styles.liveIndicatorText}>LIVE</Text>
                </View>
                <View style={styles.bannerStats}>
                    {distanceKm !== null && etaMinutes !== null ? (
                        <View style={styles.bannerRow}>
                            <Text style={styles.etaText}>
                                {tripStatus === 'in_progress' ? 'Arriving in ' : 'Arriving to pickup in '}
                                <Text style={styles.boldText}>{etaMinutes} min</Text>
                            </Text>
                            <Text style={styles.distanceText}>({formattedDistance})</Text>
                        </View>
                    ) : (
                        <Text style={styles.calculatingText}>Calculating real-time distance...</Text>
                    )}
                </View>
            </View>

            {/* OTP Section (Shown only when waiting for pickup) */}
            {tripStatus === 'scheduled' && otp && (
                <View style={styles.otpTicket}>
                    <View style={styles.ticketLeftDot} />
                    <View style={styles.ticketRightDot} />
                    <Text style={styles.otpLabel}>SHARE THIS OTP WITH DRIVER TO START RIDE</Text>
                    <View style={styles.otpCard}>
                        <Text style={styles.otpValue}>{otp}</Text>
                    </View>
                </View>
            )}

            {/* Driver Profile Card */}
            <View style={styles.driverCard}>
                <View style={styles.driverHeader}>
                    {/* Avatar with dynamic brand colors */}
                    <View style={styles.avatar}>
                        <Text style={styles.avatarText}>{driverDetails?.name?.[0] || 'D'}</Text>
                    </View>
                    <View style={styles.driverMeta}>
                        <Text style={styles.driverName}>{driverDetails?.name || 'Driver'}</Text>
                        <View style={styles.ratingRow}>
                            <MaterialIcons name="star" size={16} color="#F59E0B" />
                            <Text style={styles.ratingText}>4.9 • Verified Captain</Text>
                        </View>
                    </View>
                    {/* License Plate Badge */}
                    {driverDetails?.vehicleNumber && (
                        <View style={styles.plateContainer}>
                            <Text style={styles.plateText}>{driverDetails.vehicleNumber.toUpperCase()}</Text>
                        </View>
                    )}
                </View>

                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                    {/* Vehicle details pill */}
                    <View style={[styles.vehicleDetailsBadge, { marginBottom: 0 }]}>
                        <MaterialIcons 
                            name={driverDetails?.vehicleType === 'tricycle' ? 'pedal-bike' : 'directions-car'} 
                            size={16} 
                            color="#64748B" 
                        />
                        <Text style={styles.vehicleModelText}>
                            {driverDetails?.vehicleColor || 'Active'} {driverDetails?.vehicleModel || 'Vehicle'}
                        </Text>
                    </View>

                    {/* Fare badge */}
                    {driverDetails?.fare !== undefined && (
                        <View style={[styles.vehicleDetailsBadge, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE', borderWidth: 1, marginBottom: 0 }]}>
                            <MaterialIcons name="monetization-on" size={16} color="#4F46E5" />
                            <Text style={[styles.vehicleModelText, { color: '#4F46E5' }]}>
                                Fare: ₹{Number(driverDetails.fare).toFixed(2)}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Dynamic Subtext */}
                <Text style={styles.statusDescription}>
                    {tripStatus === 'in_progress' 
                        ? 'Heading safely towards your destination.' 
                        : 'Your captain is en-route. Please meet them at the pickup point.'}
                </Text>
            </View>

            {/* Interactive Actions Grid */}
            <View style={styles.actionsContainer}>
                <TouchableOpacity style={[styles.actionBtn, styles.callBtn]} onPress={handleCallDriver}>
                    <MaterialIcons name="call" size={20} color="#4F46E5" />
                    <Text style={styles.actionBtnText}>Call</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.messageBtn]} onPress={handleMessageDriver}>
                    <MaterialIcons name="chat" size={20} color="#4F46E5" />
                    <Text style={styles.actionBtnText}>Message</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.actionBtn, styles.sosBtn]} onPress={handleSOS}>
                    <MaterialIcons name="security" size={20} color="#EF4444" />
                    <Text style={[styles.actionBtnText, styles.sosBtnText]}>Safety SOS</Text>
                </TouchableOpacity>
            </View>

            {/* Cancel Button (Hide during active transit) */}
            {tripStatus !== 'in_progress' && (
                <TouchableOpacity style={styles.cancelBtn} onPress={onCancelTrip}>
                    <MaterialIcons name="close" size={18} color="#FFFFFF" />
                    <Text style={styles.cancelBtnText}>Cancel Trip</Text>
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
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 30,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 24,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.15,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    handleBar: {
        width: 44,
        height: 5,
        backgroundColor: '#E2E8F0',
        borderRadius: 5,
        alignSelf: 'center',
        marginBottom: 16,
    },
    realTimeBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 16,
        marginBottom: 18,
        borderWidth: 1,
    },
    bannerScheduled: {
        backgroundColor: '#EEF2FF', // soft indigo tint
        borderColor: '#C7D2FE',
    },
    bannerProgress: {
        backgroundColor: '#ECFDF5', // soft emerald tint
        borderColor: '#A7F3D0',
    },
    liveIndicatorContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 20,
        marginRight: 12,
    },
    livePulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#10B981', // emerald green glowing dot
        marginRight: 6,
    },
    liveIndicatorText: {
        color: '#FFFFFF',
        fontSize: 10,
        fontWeight: 'bold',
        letterSpacing: 0.8,
    },
    bannerStats: {
        flex: 1,
    },
    bannerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        flexWrap: 'wrap',
    },
    etaText: {
        fontSize: 14,
        color: '#1E293B',
    },
    boldText: {
        fontWeight: '800',
        color: '#0F172A',
    },
    distanceText: {
        fontSize: 14,
        color: '#64748B',
        marginLeft: 6,
        fontWeight: '600',
    },
    calculatingText: {
        fontSize: 13,
        color: '#64748B',
        fontStyle: 'italic',
    },
    otpTicket: {
        backgroundColor: '#F8FAFC',
        borderWidth: 1.5,
        borderColor: '#E2E8F0',
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginBottom: 18,
        position: 'relative',
        borderStyle: 'dashed',
    },
    ticketLeftDot: {
        position: 'absolute',
        left: -8,
        top: '50%',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FFFFFF',
        borderRightWidth: 1.5,
        borderColor: '#E2E8F0',
        transform: [{ translateY: -7 }],
    },
    ticketRightDot: {
        position: 'absolute',
        right: -8,
        top: '50%',
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: '#FFFFFF',
        borderLeftWidth: 1.5,
        borderColor: '#E2E8F0',
        transform: [{ translateY: -7 }],
    },
    otpLabel: {
        fontSize: 10,
        fontWeight: 'bold',
        color: '#64748B',
        letterSpacing: 1.2,
        marginBottom: 8,
        textAlign: 'center',
    },
    otpCard: {
        backgroundColor: '#EEF2FF',
        paddingHorizontal: 24,
        paddingVertical: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C7D2FE',
    },
    otpValue: {
        fontSize: 28,
        fontWeight: '900',
        color: '#4F46E5',
        letterSpacing: 6,
    },
    driverCard: {
        backgroundColor: '#F8FAFC',
        borderRadius: 20,
        padding: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 18,
    },
    driverHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    avatar: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#4F46E5', // vibrant premium brand color
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    avatarText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: 'bold',
    },
    driverMeta: {
        flex: 1,
    },
    driverName: {
        fontSize: 16,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 2,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    ratingText: {
        fontSize: 12,
        color: '#64748B',
        marginLeft: 4,
        fontWeight: '600',
    },
    plateContainer: {
        backgroundColor: '#F1F5F9',
        borderWidth: 1.5,
        borderColor: '#CBD5E1',
        borderRadius: 8,
        paddingHorizontal: 10,
        paddingVertical: 5,
        alignItems: 'center',
        justifyContent: 'center',
    },
    plateText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#0F172A',
        letterSpacing: 1,
    },
    vehicleDetailsBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8,
        alignSelf: 'flex-start',
        marginBottom: 10,
    },
    vehicleModelText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#475569',
        marginLeft: 6,
    },
    statusDescription: {
        fontSize: 13,
        color: '#64748B',
        lineHeight: 18,
    },
    actionsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 18,
    },
    actionBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#F1F5F9',
        paddingVertical: 12,
        borderRadius: 14,
        marginHorizontal: 4,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    actionBtnText: {
        marginLeft: 6,
        fontSize: 13,
        fontWeight: '700',
        color: '#1E293B',
    },
    callBtn: {
        backgroundColor: '#EEF2FF',
        borderColor: '#E0E7FF',
    },
    messageBtn: {
        backgroundColor: '#EEF2FF',
        borderColor: '#E0E7FF',
    },
    sosBtn: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FEE2E2',
    },
    sosBtnText: {
        color: '#EF4444',
    },
    cancelBtn: {
        flexDirection: 'row',
        backgroundColor: "#EF4444",
        paddingVertical: 15,
        borderRadius: 14,
        alignItems: "center",
        justifyContent: 'center',
        shadowColor: "#EF4444",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 4,
    },
    cancelBtnText: {
        color: "#FFFFFF",
        fontSize: 15,
        fontWeight: "800",
        marginLeft: 6,
    },
});
