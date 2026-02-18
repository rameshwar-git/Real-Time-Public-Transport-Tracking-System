import React, { useEffect, useState } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Card } from "react-native-paper";
import { ThemedText } from "@/components/themed-text";
import TextInputComponent from "@ui/textinput";
import ButtonComponent from "@/components/button";
import { handleSignIn, validate } from "@/hooks/auth/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function SigninScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const signin = async () => {
    const status = await handleSignIn({ email, password });
  };

  useEffect(() => {
    const checkUser = async () => {
      try {
        const userId = await AsyncStorage.getItem("userId");
        if(!userId) {
          return;
        }      
        const status = await validate(userId.toString());
        if(status===400){
          router.replace("/(tabs)")
        }
      } catch (err: any) {
        console.error(err.message);
      }
    };
    checkUser();
  }, []);
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
            placeholderText="Email or Username"
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
            title="Sign In"
            isDisabled={!email || !password}
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
});

