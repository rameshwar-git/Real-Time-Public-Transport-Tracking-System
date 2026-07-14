import React, { useEffect, useRef } from "react";
import { Animated, View, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

interface CenterPinProps {
  isChoosingOnMap: boolean;
  liftAnim: Animated.Value;
}

export const CenterPin: React.FC<CenterPinProps> = ({
  isChoosingOnMap,
  liftAnim,
}) => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isChoosingOnMap) {
      pulseAnim.setValue(0);
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isChoosingOnMap, pulseAnim]);

  const shadowScale = liftAnim.interpolate({
    inputRange: [-18, 0],
    outputRange: [0.5, 1],
    extrapolate: "clamp",
  });

  const shadowOpacity = liftAnim.interpolate({
    inputRange: [-18, 0],
    outputRange: [0.15, 0.4],
    extrapolate: "clamp",
  });

  const pulseScale = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 2.5],
  });

  const pulseOpacity = pulseAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.6, 0],
  });

  // Early return check must go below all hooks!
  if (!isChoosingOnMap) return null;

  return (
    <View style={styles.centerPinContainer} pointerEvents="none">
      {/* Pulse Ring */}
      <Animated.View
        style={[
          styles.pulseRing,
          {
            transform: [{ scale: pulseScale }],
            opacity: pulseOpacity,
          },
        ]}
      />

      {/* Shadow Dot */}
      <Animated.View
        style={[
          styles.shadowDot,
          {
            transform: [{ scaleX: shadowScale }, { scaleY: shadowScale }],
            opacity: shadowOpacity,
          },
        ]}
      />

      {/* Animated Pin */}
      <Animated.View
        style={[
          styles.pinWrapper,
          {
            transform: [{ translateY: liftAnim }],
          },
        ]}
      >
        {/* Pin Head */}
        <View style={styles.pinHead}>
          <Ionicons name="location" size={20} color="#FFFFFF" />
        </View>
        {/* Pin Stem */}
        <View style={styles.pinStem} />
        {/* Pin Tip */}
        <View style={styles.pinTip} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  centerPinContainer: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: -25, // Half of pinHead width (50/2)
    marginTop: -60, // Shift so pin tip aligns with map center
    width: 50,
    height: 70,
    justifyContent: "flex-start",
    alignItems: "center",
    zIndex: 100,
  },
  pinWrapper: {
    alignItems: "center",
    justifyContent: "flex-start",
    width: 50,
    height: 60,
  },
  pinHead: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0F172A", // Slate dark background
    borderWidth: 2,
    borderColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 6,
  },
  pinStem: {
    width: 4,
    height: 16,
    backgroundColor: "#0F172A",
    marginTop: -2,
    zIndex: -1,
  },
  pinTip: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0F172A",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    marginTop: -4,
  },
  shadowDot: {
    position: "absolute",
    top: 58,
    left: 20, // Centered: (50 - 10)/2
    width: 10,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#000000",
  },
  pulseRing: {
    position: "absolute",
    top: 50, // Centered around the tip
    left: 10, // Centered: (50 - 30)/2
    width: 30,
    height: 20,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#3B82F6",
    backgroundColor: "rgba(59, 130, 246, 0.15)",
  },
});
