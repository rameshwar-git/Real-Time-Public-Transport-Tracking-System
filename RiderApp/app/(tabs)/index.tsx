import React from "react";
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { colors, radius, shadow, spacing } from "@/constants/ui";

import { useDriverDashboard } from "@/hooks/driver/useDriverDashboard";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { DestinationSearch } from "@components/map/DestinationSearch";
import { IncomingRequestCard } from "@/components/driver/IncomingRequestCard";
import { ActiveTripsList } from "@/components/driver/ActiveTripsList";
import { DutyToggle } from "@/components/driver/DutyToggle";
import { PinLocationCard } from "@/components/driver/PinLocationCard";

export default function DriverDashboard() {
    const {
        userId,
        locations,
        destination,
        destinationText,
        isOnDuty,
        activeTrips,
        incomingRequest,
        isChoosingOnMap,
        pinAddress,
        mapComponents,
        mapRef,
        origin,
        mapRegion,
        setIsChoosingOnMap,
        handleAcceptRide,
        handleRejectRide,
        toggleDutyStatus,
        startTrip,
        completeTrip,
        handleCancelTrip,
        handleChooseOnMap,
        handleConfirmPinLocation,
        handleRegionChangeComplete,
        handleDestinationSelect,
        handleDestinationSearchFocus,
        handleDestinationPress,
    } = useDriverDashboard();

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;
    const mapHeight = Math.round(Dimensions.get("window").height);

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <View style={styles.container}>
                {!isChoosingOnMap && (
                    <View style={styles.unifiedTopBar}>
                        <View style={styles.searchWrapper}>
                            <DestinationSearch
                                placeholder="Set your destination..."
                                initialQuery={destinationText}
                                onSelect={handleDestinationSelect}
                                onFocus={handleDestinationSearchFocus}
                                onChooseOnMap={handleChooseOnMap}
                            />
                        </View>
                    </View>
                )}

                {isChoosingOnMap && (
                    <TouchableOpacity
                        style={styles.backButton}
                        onPress={() => setIsChoosingOnMap(false)}
                    >
                        <ArrowLeft size={16} color="#F8FAFC" />
                        <Text style={styles.backButtonText}>Cancel</Text>
                    </TouchableOpacity>
                )}

                {incomingRequest && (
                    <IncomingRequestCard
                        incomingRequest={incomingRequest}
                        onAccept={handleAcceptRide}
                        onReject={handleRejectRide}
                    />
                )}

                <View style={{ height: mapHeight }}>
                    <MapViewComponent
                        MapView={MapView}
                        Marker={Marker}
                        mapRegion={mapRegion}
                        setMapRegion={handleRegionChangeComplete}
                        locations={locations}
                        currentUserId={userId}
                        destination={activeTrips.length > 0 ? (activeTrips.find(t => t.status === 'scheduled')?.origin || destination) : destination}
                        origin={origin}
                        mapRef={mapRef}
                        activeTrips={activeTrips}
                        isOnDuty={isOnDuty}
                        onDestinationPress={handleDestinationPress}
                        isChoosingOnMap={isChoosingOnMap}
                    />
                </View>

                {!isChoosingOnMap && activeTrips.length === 0 && (
                    <View style={styles.floatingDutyPanel}>
                        <Text style={[styles.dutyPanelText, { color: isOnDuty ? '#10B981' : '#94A3B8' }]}>
                            {isOnDuty ? "ONLINE" : "OFFLINE"}
                        </Text>
                        <DutyToggle
                            isOnDuty={isOnDuty}
                            onToggle={toggleDutyStatus}
                            disabled={activeTrips.length > 0}
                        />
                    </View>
                )}

                {isChoosingOnMap && (
                    <PinLocationCard
                        pinAddress={pinAddress}
                        onConfirm={handleConfirmPinLocation}
                    />
                )}



                {activeTrips.length > 0 && (
                    <View style={styles.bottomView}>
                        <ActiveTripsList
                            activeTrips={activeTrips}
                            onStartTrip={startTrip}
                            onCancelTrip={handleCancelTrip}
                            onCompleteTrip={completeTrip}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 15,
        backgroundColor: colors.surface,
        borderRadius: radius.pill,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        ...shadow.elevated,
        zIndex: 1000,
    },
    backButtonText: {
        color: colors.text,
        fontWeight: '700',
        marginLeft: 6,
        fontSize: 14,
    },
    unifiedTopBar: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 50 : 20,
        left: 15,
        right: 15,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: radius.lg,
        padding: spacing.sm,
        borderWidth: 1,
        borderColor: colors.border,
        ...shadow.elevated,
        zIndex: 999,
        gap: spacing.md,
    },
    searchWrapper: {
        flex: 1,
    },
    bottomView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: colors.surface,
        padding: spacing.xl,
        paddingBottom: Platform.OS === 'ios' ? 40 : spacing.xl,
        borderTopLeftRadius: radius.xl,
        borderTopRightRadius: radius.xl,
        elevation: 10,
        shadowColor: colors.shadow,
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        borderWidth: 1,
        borderColor: colors.border,
    },
    floatingDutyPanel: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 25,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingVertical: 10,
        paddingHorizontal: spacing.xl,
        gap: spacing.md,
        ...shadow.elevated,
        zIndex: 999,
    },
    dutyPanelText: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
