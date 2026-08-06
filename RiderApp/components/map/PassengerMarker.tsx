import React from "react";
import { Image, StyleSheet } from "react-native";
const MARKER_SIZE = 40;

export const renderPassengerMarker = (
  Marker: any,
  passengerKey: string,
  coordinate: { latitude: number; longitude: number }
) => {
  return (
    <Marker
      key={passengerKey}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }} >
      <Image
            source={require("@assets/map/passenger.png")}
            style={styles.markerImage}
            resizeMode="contain"
          />
        </Marker>
      );
};

const styles = StyleSheet.create({
  markerImage: {
    width: MARKER_SIZE,
    height: MARKER_SIZE,
  },
});
