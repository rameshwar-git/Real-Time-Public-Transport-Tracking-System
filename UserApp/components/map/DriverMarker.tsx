import React from "react";
import { getDistance, calculateRouteMatch } from "@/utils/geometry";

export const renderDriverMarker = (
  Marker: any,
  driver: any,
  currentUserId: string | null,
  selectedVehicleType: "all" | "tricycle" | "bus" = "all",
  isConfirmed?: boolean,
  assignedDriverId?: string | null,
  origin?: any,
  destination?: any
) => {
  const u = driver;
  if (
    !u.currentLocation ||
    typeof u.currentLocation.latitude !== "number" ||
    typeof u.currentLocation.longitude !== "number" ||
    isNaN(u.currentLocation.latitude) ||
    isNaN(u.currentLocation.longitude)
  )
    return null;

  if (u.userId === currentUserId) return null;

  const isDriver = !!u.vehicleId;
  if (!isDriver) return null;

  if (selectedVehicleType !== "all") {
    const type =
      u.vehicleId && typeof u.vehicleId === "object"
        ? u.vehicleId.vehicleType
        : null;
    if (type !== selectedVehicleType) return null;
  }

  let title = "Driver";
  let description = "Available";

  if (isDriver) {
    if (isConfirmed && assignedDriverId) {
      if (u.userId !== assignedDriverId) return null;
      const vType =
        u.vehicleId &&
          typeof u.vehicleId === "object" &&
          u.vehicleId.vehicleType
          ? String(u.vehicleId.vehicleType)
          : typeof u.vehicleId === "string"
            ? u.vehicleId
            : "vehicle";
      const formattedType = vType.charAt(0).toUpperCase() + vType.slice(1);
      title = `Assigned Driver (${formattedType})`;
      description = "En route";
    } else if (origin && destination && u.destination) {
      const match = calculateRouteMatch(
        u.currentLocation,
        u.destination,
        origin,
        destination
      );
      console.log(
        `[RouteMatch] Driver ${u.userId
        }: percentage=${match.percentage.toFixed(
          1
        )}%, pickupDist=${match.pickupDist.toFixed(2)}km, isMatch=${match.isMatch
        }`
      );
      if (match.pickupDist > 5) return null;
      if (!match.isMatch) return null;
      title = `Driver (${match.percentage.toFixed(0)}% RouteMatch)`;
      description = `Pickup: ${match.pickupDist.toFixed(2)} km away`;
    } else if (
      origin &&
      !destination &&
      typeof origin.latitude === "number" &&
      typeof origin.longitude === "number"
    ) {
      const dist = getDistance(
        origin.latitude,
        origin.longitude,
        u.currentLocation.latitude,
        u.currentLocation.longitude
      );
      if (dist > 2) return null;
      title = "Driver Nearby";
      description = `Distance: ${dist.toFixed(2)} km`;
    }
  }

  return (
    <Marker
      key={u.userId || u._id}
      coordinate={u.currentLocation}
      title={title}
      description={description}
      image={
        isDriver
          ? u.vehicleId?.vehicleType === "tricycle"
            ? require("@assets/map/tricycle.png")
            : require("@assets/map/bus.png")
          : require("@assets/map/tricycle.png")
      }
    />
  );
};
