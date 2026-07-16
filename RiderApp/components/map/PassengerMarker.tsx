import React from "react";

export const renderPassengerMarker = (
  Marker: any,
  passengerKey: string,
  coordinate: { latitude: number; longitude: number }
) => {
  return (
    <Marker
      key={passengerKey}
      coordinate={coordinate}
      image={require("@assets/map/passenger.png")}
    />
  );
};
