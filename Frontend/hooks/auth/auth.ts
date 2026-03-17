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
  user?: {
    id: string;
    email: string;
    name: string;
  };
};



// 🔐 SIGN IN
export const handleSignIn = async ({ email, password }: AuthPayload) => {
  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        return data?.error || data?.message || "Login failed";
    }
    if (data.message !== "SUCCESS" || !data.token) {
        return "Login failed";
    }

    // Save token to SecureStore
    await saveToken(data.token);

    // Save userId to AsyncStorage for socket auth and other services
    if (data.user?.id) {
      await AsyncStorage.setItem("userId", data.user.id);
    }

    router.replace("/(tabs)");
    return "SUCCESS";
  } catch (error: any) {
    console.log("SIGN IN ERROR:", error);
    return error?.message || "Network error";
  }
};



// ✅ VALIDATE TOKEN (auto login check)
export const validateSession = async () => {
  try {
    const token = await getToken();

    if (!token) return "NO_TOKEN";

    const response = await fetch(`${API_URL}/validate`, {
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
  router.replace("/auth/signin");
};