import React, { useState, useRef } from "react";
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, Text, Pressable, Keyboard } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";
import { colors, radius, shadow, spacing } from "@/constants/ui";

import { useDriverDashboard } from "@/hooks/driver/useDriverDashboard";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { DestinationSearch, DestinationSearchHandle } from "@components/map/DestinationSearch";
import { IncomingRequestCard } from "@/components/driver/IncomingRequestCard";
import { ActiveTripsList } from "@/components/driver/ActiveTripsList";
import { DutyToggle } from "@/components/driver/DutyToggle";
import { PinLocationCard } from "@/components/driver/PinLocationCard";
import { ReviewPassengerModal } from "@/components/driver/ReviewPassengerModal";

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
        dismissCompletedTrip,
    } = useDriverDashboard();

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;
    const mapHeight = Math.round(Dimensions.get("window").height);

    // The driver's live position (from their shared location feed, falling back to GPS origin).
    const driverLocation =
        locations.find((u: any) => u.userId === userId)?.currentLocation || origin;

    // The most recently completed trip is shown in a popup review card.
    const completedTrip = activeTrips.find(t => t.status === 'completed') || null;

    // When the destination search dropdown is open, a tap-away overlay covers
    // the screen so tapping outside the box closes it.
    const searchRef = useRef<DestinationSearchHandle>(null);
    const [searchOpen, setSearchOpen] = useState(false);

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <View style={styles.container}>
                {!isChoosingOnMap && (
                    <View style={styles.unifiedTopBar}>
                        <View style={styles.searchWrapper}>
                            <DestinationSearch
                                ref={searchRef}
                                placeholder="Set your destination..."
                                initialQuery={destinationText}
                                onSelect={handleDestinationSelect}
                                onFocus={handleDestinationSearchFocus}
                                onChooseOnMap={() => {
                                    // Close the search dropdown so its transparent tap-away
                                    // overlay doesn't keep covering the map and blocking drags
                                    // during "choose on map" mode.
                                    Keyboard.dismiss();
                                    searchRef.current?.close();
                                    setSearchOpen(false);
                                    handleChooseOnMap();
                                }}
                                onFocusChange={setSearchOpen}
                            />
                        </View>
                    </View>
                )}

                {searchOpen && !isChoosingOnMap && (
                    <Pressable
                        style={styles.searchDismissOverlay}
                        onPress={() => {
                            Keyboard.dismiss();
                            searchRef.current?.close();
                        }}
                    />
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
                        destination={destination}
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
                            driverLocation={driverLocation}
                            onStartTrip={startTrip}
                            onCancelTrip={handleCancelTrip}
                            onCompleteTrip={completeTrip}
                        />
                    </View>
                )}

                <ReviewPassengerModal
                    trip={completedTrip}
                    onDismiss={dismissCompletedTrip}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.bg },
    searchDismissOverlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        backgroundColor: 'transparent',
    },
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
