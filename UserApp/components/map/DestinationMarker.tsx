import React from "react";
import { View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export const renderDestinationMarker = (
  Marker: any,
  destination: any,
  onPress?: () => void
) => {
  if (!destination) return null;

  return (
    <Marker
      coordinate={destination}
      title="Destination"
      description={destination.description}
      onPress={onPress}
    >
      <View style={styles.markerContainer}>
        <View style={styles.destinationPinHead}>
          <Ionicons name="location" size={16} color="#FFFFFF" />
        </View>
        <View style={styles.destinationPinStem} />
        <View style={styles.destinationPinTip} />
      </View>
    </Marker>
  );
};

const styles = StyleSheet.create({
  markerContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 50,
  },
  destinationPinHead: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#EF4444",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 4,
  },
  destinationPinStem: {
    width: 3,
    height: 10,
    backgroundColor: "#EF4444",
    marginTop: -2,
    zIndex: -1,
  },
  destinationPinTip: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
    marginTop: -3,
  },
});
