import { Tabs } from "expo-router";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { useEffect } from "react";
import { connectSocket, disconnectSocket } from "@/services/socket";
import { AppState } from "react-native";


export default function TabLayout() {
  useEffect(() => {
    connectSocket(); // connect when app starts

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.log("App active");
        connectSocket();
      }

      if (state === "background" || state === "inactive") {
      }
    });

    return () => {
      sub.remove();
      disconnectSocket();
    };
  }, []);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="house.fill" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="paperplane.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
