import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator } from "react-native-paper";
import {
  User,
  Calendar,
  Mail,
  Smartphone,
  Lock,
  ChevronLeft,
  UserPlus,
} from "lucide-react-native";

import { env } from "@/config/env";
import { UserData } from "@/datatypes/userdata";
import { handleSignIn } from "@/hooks/auth/auth";
import { connectSocket } from "@/services/socket";

const SignUpScreen: React.FC = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [registering, setRegistering] = useState(false);

  // Field focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const [userData, setFormData] = useState<UserData>({
    name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    password: "",
  });

  const handleChange = (key: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!userData.name || !userData.email || !userData.phone || !userData.password || !userData.dob || !userData.gender) {
      Alert.alert("Required Fields", "Please fill in all details to continue.");
      return;
    }

    try {
      setRegistering(true);
      const API_URI = env.API_URL;

      const response = await fetch(`${API_URI}/passengers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      setRegistering(false);

      if (!response.ok) {
        const message = data?.error || data?.message || "Registration failed";
        Alert.alert("Registration Failed", message);
        return;
      }

      await AsyncStorage.setItem("userId", data.userId);

      // Auto-signin: login the user directly after registration
      const signInResult = await handleSignIn({
        email: userData.email,
        password: userData.password,
      });

      if (signInResult.status === "SUCCESS") {
        connectSocket();
      } else {
        Alert.alert("Success", "Account created successfully! Please sign in.");
        router.replace("/auth/signin");
      }
    } catch (error: any) {
      setRegistering(false);
      console.error(error);
      Alert.alert("Error", error?.message ?? "Something went wrong. Check your connection.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 40 : 0}
      >
        {/* Top Header Row */}
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ChevronLeft size={24} color="#4F46E5" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Passenger Sign Up</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <View style={styles.iconHeader}>
              <View style={styles.iconBg}>
                <UserPlus size={30} color="#4F46E5" />
              </View>
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Get rides on demand, instantly</Text>
            </View>

            {/* Full Name */}
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
              <User size={20} color={nameFocused ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your full name"
                placeholderTextColor="#94A3B8"
                value={userData.name}
                onChangeText={(text) => handleChange("name", text)}
                onFocus={() => setNameFocused(true)}
                onBlur={() => setNameFocused(false)}
              />
            </View>

            {/* DOB Picker */}
            <Text style={styles.label}>Date of Birth</Text>
            <TouchableOpacity
              activeOpacity={0.7}
              style={[styles.inputWrapper, showDatePicker && styles.inputWrapperFocused]}
              onPress={() => setShowDatePicker(true)}
            >
              <Calendar size={20} color={userData.dob ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
              <Text style={[styles.dateText, !userData.dob && styles.placeholderText]}>
                {userData.dob || "Select your date of birth"}
              </Text>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date || new Date(2000, 0, 1)}
                mode="date"
                maximumDate={new Date()}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) {
                    setDate(selectedDate);
                    const year = selectedDate.getFullYear();
                    const month = String(selectedDate.getMonth() + 1).padStart(2, "0");
                    const day = String(selectedDate.getDate()).padStart(2, "0");
                    const formatted = `${year}-${month}-${day}`;
                    handleChange("dob", formatted);
                  }
                }}
              />
            )}

            {/* Custom Gender Chip Selector */}
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {["male", "female", "other"].map((g) => (
                <TouchableOpacity
                  key={g}
                  activeOpacity={0.8}
                  style={[
                    styles.genderChip,
                    userData.gender === g && styles.genderChipActive,
                  ]}
                  onPress={() => handleChange("gender", g)}
                >
                  <Text
                    style={[
                      styles.genderChipText,
                      userData.gender === g && styles.genderChipTextActive,
                    ]}
                  >
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Email Address */}
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Mail size={20} color={emailFocused ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#94A3B8"
                keyboardType="email-address"
                autoCapitalize="none"
                value={userData.email}
                onChangeText={(text) => handleChange("email", text)}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
              />
            </View>

            {/* Phone Number */}
            <Text style={styles.label}>Phone Number</Text>
            <View style={[styles.inputWrapper, phoneFocused && styles.inputWrapperFocused]}>
              <Smartphone size={20} color={phoneFocused ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Enter your phone number"
                placeholderTextColor="#94A3B8"
                keyboardType="phone-pad"
                value={userData.phone}
                onChangeText={(text) => handleChange("phone", text)}
                onFocus={() => setPhoneFocused(true)}
                onBlur={() => setPhoneFocused(false)}
              />
            </View>

            {/* Password */}
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Lock size={20} color={passwordFocused ? "#4F46E5" : "#64748B"} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor="#94A3B8"
                secureTextEntry
                value={userData.password}
                onChangeText={(text) => handleChange("password", text)}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
              />
            </View>

            {/* Register Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (!userData.email || !userData.password || registering) && styles.buttonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!userData.email || !userData.password || registering}
              activeOpacity={0.85}
            >
              {registering ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={styles.buttonText}>Submit Registration</Text>
              )}
            </TouchableOpacity>

            {/* Back to login */}
            <TouchableOpacity
              onPress={() => router.replace("/auth/signin")}
              style={styles.loginBackLink}
            >
              <Text style={styles.loginBackText}>Already have an account? Sign In</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#F8FAFC", // Light premium background
  },
  flex: {
    flex: 1,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#0F172A",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 28,
    padding: 24,
    shadowColor: "#0F172A",
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  iconHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(79, 70, 229, 0.08)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(79, 70, 229, 0.15)",
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#0F172A",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
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
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  dateText: {
    color: "#0F172A",
    fontSize: 15,
  },
  placeholderText: {
    color: "#94A3B8",
  },
  genderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  genderChip: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#E2E8F0",
    backgroundColor: "#F8FAFC",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  genderChipActive: {
    borderColor: "#4F46E5",
    backgroundColor: "rgba(79, 70, 229, 0.08)",
  },
  genderChipText: {
    color: "#64748B",
    fontSize: 14,
    fontWeight: "600",
  },
  genderChipTextActive: {
    color: "#4F46E5",
  },
  button: {
    backgroundColor: "#4F46E5",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
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
  },
  loginBackLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginBackText: {
    color: "#4F46E5",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default SignUpScreen;
