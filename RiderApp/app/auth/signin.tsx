import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TextInput,
  TouchableOpacity,
  Text,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";
import { Mail, Lock, Eye, EyeOff, Shield } from "lucide-react-native";
import { handleSignIn } from "@/hooks/auth/auth";
import { connectSocket } from "@/services/socket";
import { getToken } from "@/services/storageService";

export default function SigninScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [loading, setLoading] = useState(true); // checking existing session
  const [signingIn, setSigningIn] = useState(false);

  // SIGN IN
  const signin = async () => {
    if (!email || !password) return;
    setSigningIn(true);

    const result = await handleSignIn({ email, password });

    setSigningIn(false);

    if (result.status === "SUCCESS") {
      connectSocket();
    } else {
      Alert.alert("Login Failed", result.message || "An unknown error occurred.");
    }
  };

  // AUTO LOGIN — if token exists, go straight to tabs
  useEffect(() => {
    const bootstrap = async () => {
      const token = await getToken();

      if (token) {
        connectSocket();
        router.replace("/(tabs)");
        return;
      }

      setLoading(false);
    };

    bootstrap();
  }, []);

  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <View style={styles.card}>
          <View style={styles.logoContainer}>
            <View style={styles.logoBg}>
              <Shield size={36} color="#10B981" />
            </View>
            <Text style={styles.title}>InRealTime</Text>
            <Text style={styles.subtitle}>Rider Dashboard & Console</Text>
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
            <Mail size={20} color={emailFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#64748B"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          {/* Password Input */}
          <Text style={styles.label}>Password</Text>
          <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
            <Lock size={20} color={passwordFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#64748B"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              value={password}
              onChangeText={setPassword}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
              {showPassword ? (
                <EyeOff size={20} color="#64748B" />
              ) : (
                <Eye size={20} color="#64748B" />
              )}
            </TouchableOpacity>
          </View>

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, (!email || !password || signingIn) && styles.buttonDisabled]}
            disabled={!email || !password || signingIn}
            onPress={signin}
            activeOpacity={0.8}
          >
            {signingIn ? (
              <ActivityIndicator size="small" color="#0F172A" />
            ) : (
              <Text style={styles.buttonText}>Sign In to Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>New to InRealTime? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={styles.link}>Create Account</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#0F172A", // Sleek dark theme slate background
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#0F172A",
  },
  card: {
    backgroundColor: "#1E293B", // Darker card background
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 36,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  logoBg: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.25)",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#F8FAFC",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E2E8F0",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#334155",
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputWrapperFocused: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.02)",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#F8FAFC",
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },
  button: {
    backgroundColor: "#10B981", // Rich emerald green primary
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#10B981",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#334155",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#0F172A",
    fontSize: 16,
    fontWeight: "bold",
    letterSpacing: 0.3,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#94A3B8",
  },
  link: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#10B981",
  },
});