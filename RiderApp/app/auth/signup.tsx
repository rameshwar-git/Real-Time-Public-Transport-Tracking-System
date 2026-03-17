import { styles } from "../../css/css";
import React, { useState } from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { router } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import { Card } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { SafeAreaView } from "react-native-safe-area-context";

import { env } from "@/config/env";
import { UserData } from "@/datatypes/userdata";

const SignUpScreen: React.FC = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [date, setDate] = useState<Date | null>(null);

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
    try {
      const API_URI = env.API_URL;

      const response = await fetch(`${API_URI}/drivers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(userData),
      });

      const data = await response.json();

      if (!response.ok) {
        const message = data?.error || data?.message || "Registration failed";
        Alert.alert("Registration Failed", message);
        return;
      }

      await AsyncStorage.setItem("userId", data.userId);

      Alert.alert("Success", "Account created! Please sign in.");
      router.replace("/auth/signin");
    } catch (error: any) {
      console.error(error);
      Alert.alert("Error", error?.message ?? "Something went wrong. Check your connection.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Text style={styles.title}>Register</Text>

            <TextInput
              style={styles.input}
              placeholder="Full Name"
              value={userData.name}
              onChangeText={(text) => handleChange("name", text)}
            />

            {/* DOB Picker Trigger */}
            <TouchableOpacity
              style={styles.input}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={{ color: userData.dob ? "#000" : "#999" }}>
                {userData.dob || "Date of Birth"}
              </Text>
            </TouchableOpacity>

            {/* DOB Picker */}
            {showDatePicker && (
              <DateTimePicker
                value={date || new Date()}
                mode="date"
                maximumDate={new Date()}
                display="default"
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);

                  if (selectedDate) {
                    setDate(selectedDate);
                    const formatted =
                      selectedDate.toISOString().split("T")[0];
                    handleChange("dob", formatted);
                  }
                }}
              />
            )}

            {/* Gender Picker */}
            <Picker
              selectedValue={userData.gender}
              onValueChange={(value) => handleChange("gender", value)}
              style={styles.picker}
            >
              <Picker.Item label="Select Gender" value="" />
              <Picker.Item label="Male" value="male" />
              <Picker.Item label="Female" value="female" />
              <Picker.Item label="Other" value="other" />
            </Picker>

            <TextInput
              style={styles.input}
              placeholder="Email"
              keyboardType="email-address"
              autoCapitalize="none"
              value={userData.email}
              onChangeText={(text) => handleChange("email", text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Phone"
              keyboardType="phone-pad"
              value={userData.phone}
              onChangeText={(text) => handleChange("phone", text)}
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={userData.password}
              onChangeText={(text) => handleChange("password", text)}
            />

            <TouchableOpacity
              style={[
                styles.button,
                !userData.email || !userData.password
                  ? styles.buttonDisabled
                  : null,
              ]}
              onPress={handleSubmit}
              disabled={!userData.email || !userData.password}
            >
              <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

export default SignUpScreen;
