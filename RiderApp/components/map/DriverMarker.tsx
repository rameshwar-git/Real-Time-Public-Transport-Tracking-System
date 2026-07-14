import React from "react";

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
      image={
        isTricycle
          ? require("@assets/map/tricycle.png")
          : require("@assets/map/bus.png")
      }
    />
  );
};
