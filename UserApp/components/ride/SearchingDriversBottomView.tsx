import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions } from 'react-native';

interface Driver {
    userId: string;
    pickupDist: number;
    routeMatchPercentage: number;
    availableSeats: number;
    driverDetails?: {
        name: string;
        phone: string;
    };
    vehicleDetails?: {
        vehicleType: string;
        vehicleModel: string;
        vehicleNumber: string;
        color: string;
    };
}

interface SearchingDriversBottomViewProps {
    onCancel: () => void;
    drivers?: Driver[];
    currentDriverIndex?: number;
}

export const SearchingDriversBottomView = ({ 
    onCancel, 
    drivers = [], 
    currentDriverIndex = 0 
}: SearchingDriversBottomViewProps) => {
    const hasDrivers = Array.isArray(drivers) && drivers.length > 0;

    const getMatchColor = (pct: number) => {
        if (pct >= 90) return { bg: '#ECFDF5', text: '#059669' }; // Emerald Green
        if (pct >= 75) return { bg: '#EEF2FF', text: '#4F46E5' }; // Indigo
        if (pct >= 50) return { bg: '#EFF6FF', text: '#2563EB' }; // Blue
        return { bg: '#F8FAFC', text: '#64748B' }; // Slate
    };

    return (
        <View style={styles.bottomView}>
            <View style={styles.header}>
                <View style={styles.pulseContainer}>
                    <View style={styles.pulseDot} />
                </View>
                <Text style={styles.searchingText}>
                    {hasDrivers ? `Locating Best Matches` : `Searching for drivers...`}
                </Text>
            </View>

            {hasDrivers && (
                <Text style={styles.subtext}>
                    Found {drivers.length} drivers heading your way. Contacting them in order:
                </Text>
            )}

            {hasDrivers ? (
                <ScrollView 
                    style={styles.listContainer} 
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listContent}
                >
                    {drivers.map((driver, idx) => {
                        const isCurrent = idx === currentDriverIndex;
                        const isPassed = idx < currentDriverIndex;
                        const matchStyle = getMatchColor(driver.routeMatchPercentage || 0);

                        return (
                            <View 
                                key={driver.userId || idx} 
                                style={[
                                    styles.driverCard, 
                                    isCurrent && styles.activeCard,
                                    isPassed && styles.passedCard
                                ]}
                            >
                                <View style={styles.leftCol}>
                                    <View style={[styles.avatarCircle, isCurrent && styles.activeAvatarCircle]}>
                                        <Text style={styles.avatarText}>
                                            {(driver.driverDetails?.name || 'D').charAt(0).toUpperCase()}
                                        </Text>
                                    </View>
                                    <View style={styles.detailsCol}>
                                        <Text style={[styles.driverName, isPassed && styles.mutedText]}>
                                            {driver.driverDetails?.name || `Driver #${(driver.userId || '').slice(-4)}`}
                                        </Text>
                                        <Text style={styles.vehicleInfo}>
                                            {driver.vehicleDetails?.color || ''} {driver.vehicleDetails?.vehicleModel || 'Vehicle'} 
                                            {driver.vehicleDetails?.vehicleNumber ? ` • ${driver.vehicleDetails.vehicleNumber}` : ''}
                                        </Text>
                                        <Text style={styles.seatsInfo}>
                                            Seats: {driver.availableSeats || 4} available
                                        </Text>
                                    </View>
                                </View>

                                <View style={styles.rightCol}>
                                    <View style={[styles.badge, { backgroundColor: matchStyle.bg }]}>
                                        <Text style={[styles.badgeText, { color: matchStyle.text }]}>
                                            {Math.round(driver.routeMatchPercentage || 0)}% Match
                                        </Text>
                                    </View>
                                    
                                    <Text style={styles.distText}>
                                        {driver.pickupDist ? `${driver.pickupDist.toFixed(2)} km` : 'Nearby'}
                                    </Text>

                                    {isCurrent && (
                                        <View style={styles.statusBadgeCurrent}>
                                            <Text style={styles.statusTextCurrent}>CONNECTING</Text>
                                        </View>
                                    )}
                                    {isPassed && (
                                        <View style={styles.statusBadgePassed}>
                                            <Text style={styles.statusTextPassed}>PASSED</Text>
                                        </View>
                                    )}
                                    {!isCurrent && !isPassed && (
                                        <View style={styles.statusBadgeQueue}>
                                            <Text style={styles.statusTextQueue}>QUEUED</Text>
                                        </View>
                                    )}
                                </View>
                            </View>
                        );
                    })}
                </ScrollView>
            ) : (
                <View style={styles.loadingContainer}>
                    <Text style={styles.loadingSubtext}>Analyzing route matches, detours, and distances...</Text>
                </View>
            )}

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
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 28,
        borderTopLeftRadius: 32,
        borderTopRightRadius: 32,
        elevation: 15,
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: -8 },
        shadowOpacity: 0.1,
        shadowRadius: 16,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8,
    },
    pulseContainer: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 8,
    },
    pulseDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#3B82F6',
    },
    searchingText: {
        fontSize: 18,
        fontWeight: "700",
        textAlign: "center",
        color: "#0F172A",
    },
    subtext: {
        fontSize: 13,
        color: "#64748B",
        textAlign: "center",
        marginBottom: 16,
    },
    listContainer: {
        maxHeight: Dimensions.get('window').height * 0.35,
        marginBottom: 8,
    },
    listContent: {
        paddingVertical: 4,
    },
    driverCard: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: '#F8FAFC',
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    activeCard: {
        backgroundColor: '#F5F3FF', // Sleek violet/purple gradient accent
        borderColor: '#C7D2FE',
        borderWidth: 1.5,
    },
    passedCard: {
        backgroundColor: '#FAFAFA',
        opacity: 0.6,
        borderColor: '#E2E8F0',
    },
    leftCol: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatarCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E2E8F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    activeAvatarCircle: {
        backgroundColor: '#818CF8',
    },
    avatarText: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#475569',
    },
    detailsCol: {
        flex: 1,
        justifyContent: 'center',
    },
    driverName: {
        fontSize: 15,
        fontWeight: '600',
        color: '#1E293B',
        marginBottom: 2,
    },
    mutedText: {
        color: '#64748B',
        textDecorationLine: 'line-through',
    },
    vehicleInfo: {
        fontSize: 12,
        color: '#64748B',
        marginBottom: 2,
    },
    seatsInfo: {
        fontSize: 11,
        color: '#94A3B8',
    },
    rightCol: {
        alignItems: 'flex-end',
        justifyContent: 'center',
        marginLeft: 10,
    },
    badge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 4,
    },
    badgeText: {
        fontSize: 11,
        fontWeight: 'bold',
    },
    distText: {
        fontSize: 12,
        fontWeight: '500',
        color: '#334155',
        marginBottom: 6,
    },
    statusBadgeCurrent: {
        backgroundColor: '#4F46E5',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextCurrent: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadgePassed: {
        backgroundColor: '#94A3B8',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextPassed: {
        color: '#FFFFFF',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    statusBadgeQueue: {
        backgroundColor: '#E2E8F0',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 4,
    },
    statusTextQueue: {
        color: '#475569',
        fontSize: 9,
        fontWeight: 'bold',
        letterSpacing: 0.5,
    },
    loadingContainer: {
        height: 120,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingSubtext: {
        fontSize: 13,
        color: '#94A3B8',
        textAlign: 'center',
    },
    btn: {
        backgroundColor: "#000",
        paddingVertical: 15,
        borderRadius: 16,
        alignItems: "center",
    },
    cancelBtn: {
        backgroundColor: "#EF4444", 
        marginTop: 10,
        shadowColor: "#EF4444",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
        elevation: 3,
    },
    btnText: {
        color: "#fff",
        fontSize: 16,
        fontWeight: "bold",
    },
});
