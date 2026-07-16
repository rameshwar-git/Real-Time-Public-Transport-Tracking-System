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
  Briefcase,
  Car,
  Palette,
  Hash,
  Users,
} from "lucide-react-native";

import { env } from "@/config/env";
import { UserData } from "@/datatypes/userdata";
import { handleSignIn } from "@/hooks/auth/auth";
import { connectSocket } from "@/services/socket";

const SignUpScreen: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date | null>(null);
  const [registering, setRegistering] = useState(false);

  // Field focus states
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [phoneFocused, setPhoneFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Step 2 field focus states
  const [modelFocused, setModelFocused] = useState(false);
  const [numberFocused, setNumberFocused] = useState(false);
  const [colorFocused, setColorFocused] = useState(false);
  const [capacityFocused, setCapacityFocused] = useState(false);

  const [userData, setFormData] = useState<UserData>({
    name: "",
    dob: "",
    gender: "",
    email: "",
    phone: "",
    password: "",
  });

  const [vehicleData, setVehicleData] = useState({
    vehicleType: "tricycle",
    vehicleModel: "",
    vehicleNumber: "",
    color: "",
    capacity: "3",
  });

  const handleChange = (key: keyof UserData, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const isStep1Valid = !!(
    userData.name &&
    userData.dob &&
    userData.gender &&
    userData.email &&
    userData.phone &&
    userData.password
  );

  const isStep2Valid = !!(
    vehicleData.vehicleType &&
    vehicleData.vehicleModel &&
    vehicleData.vehicleNumber &&
    vehicleData.color &&
    vehicleData.capacity
  );

  const handleSubmit = async () => {
    if (
      !userData.name ||
      !userData.email ||
      !userData.phone ||
      !userData.password ||
      !userData.dob ||
      !userData.gender
    ) {
      Alert.alert("Required Fields", "Please fill in all personal details to continue.");
      return;
    }

    if (
      !vehicleData.vehicleType ||
      !vehicleData.vehicleModel ||
      !vehicleData.vehicleNumber ||
      !vehicleData.color ||
      !vehicleData.capacity
    ) {
      Alert.alert("Required Fields", "Please fill in all vehicle details to complete registration.");
      return;
    }

    try {
      setRegistering(true);
      const API_URI = env.API_URL;

      const response = await fetch(`${API_URI}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...userData,
          ...vehicleData,
          capacity: parseInt(vehicleData.capacity, 10) || 3,
        }),
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
            <ChevronLeft size={24} color="#10B981" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Rider Application</Text>
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
                <Briefcase size={30} color="#10B981" />
              </View>
              <Text style={styles.cardTitle}>Create Account</Text>
              <Text style={styles.cardSubtitle}>Join the real-time driver network</Text>
            </View>

            {/* Step Progress Indicator */}
            <View style={styles.stepProgressContainer}>
              <View style={styles.stepProgressHeader}>
                <Text style={styles.stepProgressText}>
                  Step {step} of 2: {step === 1 ? "Personal Info" : "Vehicle Details"}
                </Text>
              </View>
              <View style={styles.stepProgressBarOutline}>
                <View style={[styles.stepProgressBarFill, { width: step === 1 ? "50%" : "100%" }]} />
              </View>
            </View>

            {step === 1 && (
              <View>
                {/* Full Name */}
                <Text style={styles.label}>Full Name</Text>
                <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                  <User size={20} color={nameFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your full name"
                    placeholderTextColor="#64748B"
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
                  <Calendar size={20} color={userData.dob ? "#10B981" : "#64748B"} style={styles.inputIcon} />
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
                  <Mail size={20} color={emailFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your email"
                    placeholderTextColor="#64748B"
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
                  <Smartphone size={20} color={phoneFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Enter your phone number"
                    placeholderTextColor="#64748B"
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
                  <Lock size={20} color={passwordFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor="#64748B"
                    secureTextEntry
                    value={userData.password}
                    onChangeText={(text) => handleChange("password", text)}
                    onFocus={() => setPasswordFocused(true)}
                    onBlur={() => setPasswordFocused(false)}
                  />
                </View>

                {/* Next Button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    !isStep1Valid && styles.buttonDisabled,
                  ]}
                  onPress={() => setStep(2)}
                  disabled={!isStep1Valid}
                  activeOpacity={0.85}
                >
                  <Text style={styles.buttonText}>Next: Vehicle Details</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 2 && (
              <View>
                {/* Vehicle Type Selector */}
                <Text style={styles.label}>Vehicle Type</Text>
                <View style={styles.genderContainer}>
                  {["tricycle", "bus"].map((type) => (
                    <TouchableOpacity
                      key={type}
                      activeOpacity={0.8}
                      style={[
                        styles.genderChip,
                        vehicleData.vehicleType === type && styles.genderChipActive,
                      ]}
                      onPress={() => setVehicleData(prev => ({ ...prev, vehicleType: type }))}
                    >
                      <Text
                        style={[
                          styles.genderChipText,
                          vehicleData.vehicleType === type && styles.genderChipTextActive,
                        ]}
                      >
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Vehicle Model */}
                <Text style={styles.label}>Vehicle Model</Text>
                <View style={[styles.inputWrapper, modelFocused && styles.inputWrapperFocused]}>
                  <Car size={20} color={modelFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Bajaj RE, Tata Winger"
                    placeholderTextColor="#64748B"
                    value={vehicleData.vehicleModel}
                    onChangeText={(text) => setVehicleData(prev => ({ ...prev, vehicleModel: text }))}
                    onFocus={() => setModelFocused(true)}
                    onBlur={() => setModelFocused(false)}
                  />
                </View>

                {/* Vehicle Number */}
                <Text style={styles.label}>Vehicle Number (Plate)</Text>
                <View style={[styles.inputWrapper, numberFocused && styles.inputWrapperFocused]}>
                  <Hash size={20} color={numberFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. MH12 AB 1234"
                    placeholderTextColor="#64748B"
                    autoCapitalize="characters"
                    value={vehicleData.vehicleNumber}
                    onChangeText={(text) => setVehicleData(prev => ({ ...prev, vehicleNumber: text }))}
                    onFocus={() => setNumberFocused(true)}
                    onBlur={() => setNumberFocused(false)}
                  />
                </View>

                {/* Vehicle Color */}
                <Text style={styles.label}>Vehicle Color</Text>
                <View style={[styles.inputWrapper, colorFocused && styles.inputWrapperFocused]}>
                  <Palette size={20} color={colorFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. Red, Black, White"
                    placeholderTextColor="#64748B"
                    value={vehicleData.color}
                    onChangeText={(text) => setVehicleData(prev => ({ ...prev, color: text }))}
                    onFocus={() => setColorFocused(true)}
                    onBlur={() => setColorFocused(false)}
                  />
                </View>

                {/* Seating Capacity */}
                <Text style={styles.label}>Seating Capacity</Text>
                <View style={[styles.inputWrapper, capacityFocused && styles.inputWrapperFocused]}>
                  <Users size={20} color={capacityFocused ? "#10B981" : "#64748B"} style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 3, 15"
                    placeholderTextColor="#64748B"
                    keyboardType="number-pad"
                    value={vehicleData.capacity}
                    onChangeText={(text) => setVehicleData(prev => ({ ...prev, capacity: text }))}
                    onFocus={() => setCapacityFocused(true)}
                    onBlur={() => setCapacityFocused(false)}
                  />
                </View>

                {/* Submit Registration Button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    (!isStep2Valid || registering) && styles.buttonDisabled,
                  ]}
                  onPress={handleSubmit}
                  disabled={!isStep2Valid || registering}
                  activeOpacity={0.8}
                >
                  {registering ? (
                    <ActivityIndicator size="small" color="#0F172A" />
                  ) : (
                    <Text style={styles.buttonText}>Submit Registration</Text>
                  )}
                </TouchableOpacity>

                {/* Back Button */}
                <TouchableOpacity
                  style={styles.backStepButton}
                  onPress={() => setStep(1)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.backStepButtonText}>Back to Personal Info</Text>
                </TouchableOpacity>
              </View>
            )}

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
    backgroundColor: "#0F172A", // Dark theme matches sign in
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
    borderColor: "#1E293B",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#1E293B",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 24,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  iconHeader: {
    alignItems: "center",
    marginBottom: 28,
  },
  iconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.12)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#F8FAFC",
  },
  cardSubtitle: {
    fontSize: 13,
    color: "#94A3B8",
    marginTop: 2,
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
    height: 50,
    paddingHorizontal: 16,
    marginBottom: 16,
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
  dateText: {
    color: "#F8FAFC",
    fontSize: 15,
  },
  placeholderText: {
    color: "#64748B",
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
    borderColor: "#334155",
    backgroundColor: "#0F172A",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 4,
  },
  genderChipActive: {
    borderColor: "#10B981",
    backgroundColor: "rgba(16, 185, 129, 0.12)",
  },
  genderChipText: {
    color: "#94A3B8",
    fontSize: 14,
    fontWeight: "600",
  },
  genderChipTextActive: {
    color: "#10B981",
  },
  button: {
    backgroundColor: "#10B981",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 16,
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
  },
  loginBackLink: {
    marginTop: 20,
    alignItems: "center",
  },
  loginBackText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "600",
  },
  stepProgressContainer: {
    marginBottom: 24,
  },
  stepProgressHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  stepProgressText: {
    fontSize: 13,
    color: "#10B981",
    fontWeight: "600",
  },
  stepProgressBarOutline: {
    height: 4,
    width: "100%",
    backgroundColor: "#334155",
    borderRadius: 2,
  },
  stepProgressBarFill: {
    height: "100%",
    backgroundColor: "#10B981",
    borderRadius: 2,
  },
  backStepButton: {
    borderWidth: 1.5,
    borderColor: "#334155",
    borderRadius: 14,
    height: 52,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 12,
  },
  backStepButtonText: {
    color: "#94A3B8",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default SignUpScreen;
