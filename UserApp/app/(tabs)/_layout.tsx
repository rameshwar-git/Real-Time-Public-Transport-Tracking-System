import { Tabs, router } from "expo-router";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
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
        tabBarActiveTintColor: "#4F46E5", // Premium Royal Indigo active
        tabBarInactiveTintColor: "#94A3B8", // Clean slate inactive
        tabBarStyle: {
          backgroundColor: "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: "#E2E8F0",
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
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="person.fill" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
