import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card, ActivityIndicator } from "react-native-paper";
import { ThemedText } from "@/components/themed-text";
import TextInputComponent from "@ui/textinput";
import ButtonComponent from "@/components/button";
import { handleSignIn, validateSession } from "@/hooks/auth/auth";
import { connectSocket } from "@/services/socket";

export default function SigninScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(true);   // checking existing session
  const [signingIn, setSigningIn] = useState(false);

  // SIGN IN
  const signin = async () => {
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

  // Splash loader while checking token
  if (loading) {
    return (
      <SafeAreaView style={styles.loader}>
        <ActivityIndicator size="large" color="blue" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={styles.container}
      >
        <Card style={styles.card}>
          <ThemedText type="title" style={styles.title}>
            HopOn!
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            Sign in to continue
          </ThemedText>

          <TextInputComponent
            placeholderText="Email"
            value={email}
            onChangeText={setEmail}
          />

          <TextInputComponent
            placeholderText="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <ButtonComponent
            title={signingIn ? "Signing in..." : "Sign In"}
            isDisabled={!email || !password || signingIn}
            onPress={signin}
          />

          <View style={styles.footer}>
            <ThemedText>Don’t have an account?</ThemedText>
            <ThemedText
              style={styles.link}
              onPress={() => router.push("/auth/signup")}
            >
              Sign Up
            </ThemedText>
          </View>

          {signingIn && (
            <ActivityIndicator
              size="small"
              color="blue"
              style={{ marginTop: 10 }}
            />
          )}
        </Card>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f4f6f8",
  },
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  card: {
    padding: 24,
    borderRadius: 18,
    elevation: 10,
  },
  title: {
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    textAlign: "center",
    marginBottom: 24,
    opacity: 0.7,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 16,
  },
  link: {
    marginLeft: 6,
    fontWeight: "bold",
    color: "#007AFF",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});