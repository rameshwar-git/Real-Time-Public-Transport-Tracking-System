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
import { Mail, Lock, Eye, EyeOff, Navigation } from "lucide-react-native";
import { handleSignIn, validateSession } from "@/hooks/auth/auth";
import { connectSocket } from "@/services/socket";

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

  // AUTO LOGIN
  useEffect(() => {
    const bootstrap = async () => {
      const status = await validateSession();

      if (status === "VALID") {
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
        <ActivityIndicator size="large" color="#4F46E5" />
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
              <Navigation size={34} color="#4F46E5" style={{ transform: [{ rotate: "45deg" }] }} />
            </View>
            <Text style={styles.title}>HopOn!</Text>
            <Text style={styles.subtitle}>InRealTime Passenger Hub</Text>
          </View>

          {/* Email Input */}
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
            <Mail size={20} color={emailFocused ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#94A3B8"
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
            <Lock size={20} color={passwordFocused ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Enter your password"
              placeholderTextColor="#94A3B8"
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
            activeOpacity={0.85}
          >
            {signingIn ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Sign In to Account</Text>
            )}
          </TouchableOpacity>

          {/* Footer Navigation */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => router.push("/auth/signup")}>
              <Text style={styles.link}>Sign Up</Text>
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
    backgroundColor: "#F8FAFC", // Clean slate-light premium background
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
    backgroundColor: "#F8FAFC",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 40,
    shadowColor: "#0F172A",
    shadowOpacity: 0.08,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  logoContainer: {
    alignItems: "center",
    marginBottom: 36,
  },
  logoBg: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.15)",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#0F172A",
    textAlign: "center",
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    marginTop: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
    marginBottom: 8,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    height: 52,
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  inputWrapperFocused: {
    borderColor: "#4F46E5",
    backgroundColor: "#FFFFFF",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: "#0F172A",
    fontSize: 15,
    height: "100%",
  },
  eyeBtn: {
    padding: 4,
  },
  button: {
    backgroundColor: "#4F46E5", // Premium Royal Indigo
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
    shadowColor: "#4F46E5",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: "#CBD5E1",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "#FFFFFF",
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
    color: "#64748B",
  },
  link: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#4F46E5",
  },
});