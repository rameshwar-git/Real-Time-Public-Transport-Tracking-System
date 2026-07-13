import { Tabs, router } from "expo-router";
import { HapticTab } from "@/components/haptic-tab";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { connectSocket, disconnectSocket } from "@/services/socket";
import { AppState, View, ActivityIndicator, Platform } from "react-native";
import { getToken } from "@/services/storageService";
import { validateSession } from "@/hooks/auth/auth";

export default function TabLayout() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = await getToken();
        if (!token) {
          setIsAuthenticated(false);
          router.replace("/auth/signin");
          return;
        }

        const sessionStatus = await validateSession();
        if (sessionStatus === "VALID") {
          setIsAuthenticated(true);
          connectSocket(); // connect when app starts
        } else {
          setIsAuthenticated(false);
          router.replace("/auth/signin");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        setIsAuthenticated(false);
        router.replace("/auth/signin");
      }
    };

    checkAuth();
  }, []);

  useEffect(() => {
    if (isAuthenticated !== true) return;

    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        console.log("App active");
        connectSocket();
      }
    });

    return () => {
      sub.remove();
      disconnectSocket();
    };
  }, [isAuthenticated]);

  if (isAuthenticated === null) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" }}>
        <ActivityIndicator size="large" color="#0286FF" />
      </View>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarActiveTintColor: "#10B981", // Rich emerald green active
        tabBarInactiveTintColor: "#64748B", // Clean slate inactive
        tabBarStyle: {
          backgroundColor: "#1E293B",
          borderTopWidth: 1,
          borderTopColor: "#334155",
          height: Platform.OS === 'ios' ? 88 : 68,
          paddingBottom: Platform.OS === 'ios' ? 28 : 12,
          paddingTop: 8,
        }
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="home" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="paper-plane" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <Ionicons size={28} name="person" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
