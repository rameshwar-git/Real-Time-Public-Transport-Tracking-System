import React from "react";
import { Image, StyleSheet } from "react-native";

const MARKER_SIZE = 40;

export const renderDriverMarker = (
  Marker: any,
  driverKey: string,
  coordinate: { latitude: number; longitude: number },
  vehicleType?: string
) => {
  const isTricycle = vehicleType === "tricycle";
  return (
    <Marker
      key={driverKey}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
    >
      <Image
        source={
          isTricycle
            ? require("@assets/map/tricycle.png")
            : require("@assets/map/bus.png")
        }
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
