import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { env } from "@/config/env";
import { saveToken, getToken, removeToken } from "@/services/storageService";

const API_URL = env.API_URL;

type AuthPayload = {
  email: string;
  password: string;
};

type LoginResponse = {
  message: string;
  token?: string;
  userId?: string;
  locationId?: string;
};



// 🔐 SIGN IN
export const handleSignIn = async ({ email, password }: AuthPayload) => {
  try {
    const response = await fetch(`${API_URL}/drivers/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { status: "FAILED", message: data?.error || data?.message || "Login failed" };
    }
    if (data.message !== "SUCCESS" || !data.token) {
      return { status: "FAILED", message: "Login failed" };
    }

    // Save token to SecureStore
    await saveToken(data.token);

    // Save userId and locationId to AsyncStorage for location tracking
    if (data.userId) await AsyncStorage.setItem("userId", data.userId);
    if (data.locationId) await AsyncStorage.setItem("locationId", data.locationId);
    
    router.replace("/(tabs)");
    return { status: "SUCCESS", message: "Login successful" };
  } catch (error: any) {
    console.log("SIGN IN ERROR:", error);
    return { status: "FAILED", message: error?.message || "Network error" };
  }
};



// VALIDATE TOKEN (auto login check)
export const validateSession = async () => {
  try {
    const token = await getToken();

    if (!token) return "NO_TOKEN";

    const response = await fetch(`${API_URL}/drivers/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.ok ? "VALID" : "INVALID";
  } catch (error) {
    console.log("VALIDATE ERROR:", error);
    return "ERROR";
  }
};



// 🚪 LOGOUT
export const handleLogout = async () => {
  await removeToken();
  await AsyncStorage.removeItem("userId");
  await AsyncStorage.removeItem("locationId");
  router.replace("/auth/signin");
};