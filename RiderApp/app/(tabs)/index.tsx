import React from "react";
import { View, StyleSheet, Platform, Dimensions, TouchableOpacity, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ArrowLeft } from "lucide-react-native";

import { useDriverDashboard } from "@/hooks/driver/useDriverDashboard";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { DestinationSearch } from "@components/map/DestinationSearch";
import { IncomingRequestCard } from "@/components/driver/IncomingRequestCard";
import { ActiveTripsList } from "@/components/driver/ActiveTripsList";
import { DutyToggle } from "@/components/driver/DutyToggle";
import { PinLocationCard } from "@/components/driver/PinLocationCard";
import { OtpVerificationModal } from "@/components/driver/OtpVerificationModal";

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
        otpModalVisible,
        currentOtpTrip,
        otpInput,
        mapComponents,
        mapRef,
        origin,
        mapRegion,
        setOtpInput,
        setIsChoosingOnMap,
        handleAcceptRide,
        handleRejectRide,
        toggleDutyStatus,
        verifyOtp,
        handleCancelTrip,
        handleEndTrip,
        handleChooseOnMap,
        handleConfirmPinLocation,
        handleRegionChangeComplete,
        handleDestinationSelect,
        handleDestinationSearchFocus,
        handleDestinationPress,
        openOtpModal,
        closeOtpModal,
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

                <OtpVerificationModal
                    visible={otpModalVisible}
                    passengerName={currentOtpTrip?.passengerName || ''}
                    otpInput={otpInput}
                    setOtpInput={setOtpInput}
                    onCancel={closeOtpModal}
                    onVerify={verifyOtp}
                />

                {activeTrips.length > 0 && (
                    <View style={styles.bottomView}>
                        <ActiveTripsList
                            activeTrips={activeTrips}
                            onOpenOtp={openOtpModal}
                            onCancelTrip={handleCancelTrip}
                            onEndTrip={handleEndTrip}
                        />
                    </View>
                )}
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#0F172A" },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 15,
        backgroundColor: '#1E293B',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
        borderWidth: 1.5,
        borderColor: '#334155',
    },
    backButtonText: {
        color: '#F8FAFC',
        fontWeight: 'bold',
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
        backgroundColor: '#1E293B',
        borderRadius: 14,
        padding: 10,
        borderWidth: 1.5,
        borderColor: '#334155',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 8,
        zIndex: 999,
        gap: 12,
    },
    searchWrapper: {
        flex: 1,
    },
    bottomView: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: "#1E293B",
        padding: 20,
        paddingBottom: Platform.OS === 'ios' ? 40 : 20,
        borderTopLeftRadius: 30,
        borderTopRightRadius: 30,
        elevation: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -5 },
        shadowOpacity: 0.2,
        shadowRadius: 10,
        borderWidth: 1.5,
        borderColor: "#334155",
    },
    floatingDutyPanel: {
        position: 'absolute',
        bottom: Platform.OS === 'ios' ? 40 : 25,
        alignSelf: 'center',
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#1E293B',
        borderColor: '#334155',
        borderWidth: 1.5,
        borderRadius: 30,
        paddingVertical: 10,
        paddingHorizontal: 20,
        gap: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
        elevation: 8,
        zIndex: 999,
    },
    dutyPanelText: {
        fontSize: 14,
        fontWeight: 'bold',
        letterSpacing: 1,
    },
});
