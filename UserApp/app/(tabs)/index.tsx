import React from "react";
import { View, StyleSheet, Platform, Dimensions, KeyboardAvoidingView, Text, TouchableOpacity } from "react-native";
import { ArrowLeft } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { usePassengerDashboard } from "@/hooks/ride/usePassengerDashboard";
import { MapViewComponent } from "@components/map/MapViewComponent";
import { PinLocationCard } from "@/components/map/PinLocationCard";
import { TripReceipt } from "@/components/ride/TripReceipt";

// Ride Components
import { LocationSearchCard } from "@/components/ride/LocationSearchCard";
import { RideConfirmationBottomView } from "@/components/ride/RideConfirmationBottomView";
import { SearchingDriversBottomView } from "@/components/ride/SearchingDriversBottomView";
import { RideStatusBottomSheet } from "@/components/ride/RideStatusBottomSheet";

export default function App() {
    const {
        userId,
        origin,
        destination,
        destinationText,
        isConfirmed,
        isSearching,
        isChoosingOnMap,
        pinAddress,
        driverDetails,
        otp,
        tripStatus,
        routeDetails,
        matchedDrivers,
        currentDriverIndex,
        selectedVehicleType,
        locations,
        assignedDriverId,
        mapComponents,
        mapRef,
        mapRegion,
        routeRefreshKey,
        setSelectedVehicleType,
        setIsChoosingOnMap,
        setRouteDetails,
        assignedDriverLocation,
        computedDistance,
        handleConfirmRide,
        handleCancelSearch,
        handleCancelTrip,
        handleDismissReceipt,
        handleDestinationSelect,
        handleClearRoute,
        handleChooseOnMap,
        handleConfirmPinLocation,
        handleRegionChangeComplete,
        handleDestinationPress,
    } = usePassengerDashboard();

    const MapView = mapComponents?.MapView;
    const Marker = mapComponents?.Marker;
    const mapHeight = Math.round(Dimensions.get("window").height);

    return (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
            <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
                <View style={styles.container}>
                    {!isConfirmed && !isChoosingOnMap && (
                        <LocationSearchCard
                            onSelect={handleDestinationSelect}
                            onClear={handleClearRoute}
                            initialQuery={destinationText}
                            onChooseOnMap={handleChooseOnMap}
                        />
                    )}

                    {isChoosingOnMap && (
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => setIsChoosingOnMap(false)}
                        >
                            <ArrowLeft size={16} color="#1E293B" />
                            <Text style={styles.backButtonText}>Cancel</Text>
                        </TouchableOpacity>
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
                            isConfirmed={isConfirmed}
                            assignedDriverId={assignedDriverId}
                            assignedDriverLocation={assignedDriverLocation}
                            tripStatus={tripStatus}
                            onRouteDetailsUpdated={setRouteDetails}
                            onDestinationPress={handleDestinationPress}
                            isChoosingOnMap={isChoosingOnMap}
                            selectedVehicleType={selectedVehicleType}
                            routeRefreshKey={routeRefreshKey}
                        />
                    </View>

                    {isChoosingOnMap && (
                        <PinLocationCard
                            pinAddress={pinAddress}
                            onConfirm={handleConfirmPinLocation}
                        />
                    )}

                    {destination && !isConfirmed && !isChoosingOnMap && (
                        <RideConfirmationBottomView
                            onConfirm={handleConfirmRide}
                            selectedVehicleType={selectedVehicleType}
                            setSelectedVehicleType={setSelectedVehicleType}
                            distance={computedDistance}
                        />
                    )}

                    {isConfirmed && isSearching && (
                        <SearchingDriversBottomView
                            onCancel={handleCancelSearch}
                            drivers={matchedDrivers}
                            currentDriverIndex={currentDriverIndex}
                        />
                    )}

                    {isConfirmed && !isSearching && assignedDriverId && tripStatus !== 'completed' && (
                        <RideStatusBottomSheet
                            tripStatus={tripStatus}
                            otp={otp}
                            driverDetails={driverDetails}
                            onCancelTrip={handleCancelTrip}
                            assignedDriverLocation={assignedDriverLocation}
                            origin={origin}
                            destination={destination}
                            routeDetails={routeDetails}
                        />
                    )}

                    {tripStatus === 'completed' && (
                        <TripReceipt
                            driverDetails={driverDetails}
                            origin={origin}
                            destination={destination}
                            onDismiss={handleDismissReceipt}
                        />
                    )}
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, paddingTop: 5, backgroundColor: "#fff" },
    backButton: {
        position: 'absolute',
        top: Platform.OS === 'ios' ? 60 : 20,
        left: 15,
        backgroundColor: '#FFFFFF',
        borderRadius: 25,
        paddingHorizontal: 16,
        paddingVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
        zIndex: 1000,
    },
    backButtonText: {
        color: '#1E293B',
        fontWeight: 'bold',
        marginLeft: 6,
        fontSize: 14,
    },
});