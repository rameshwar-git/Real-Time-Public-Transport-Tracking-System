import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ButtonComponent from '@/components/button';
import { getDriverProfile, updateDriverProfile } from '@/services/apiService';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [driverData, setDriverData] = useState({
    name: '',
    phone: '',
    email: '', // Disabled for edit
  });

  const [vehicleData, setVehicleData] = useState({
    vehicleType: '',
    vehicleModel: '',
    vehicleNumber: '',
    capacity: '4',
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getDriverProfile();
      if (res.driver) {
        setDriverData({
          name: res.driver.name || '',
          phone: res.driver.phone || '',
          email: res.driver.email || '',
        });
      }
      if (res.vehicle) {
        setVehicleData({
          vehicleType: res.vehicle.vehicleType || '',
          vehicleModel: res.vehicle.vehicleModel || '',
          vehicleNumber: res.vehicle.vehicleNumber || '',
          capacity: res.vehicle.capacity ? String(res.vehicle.capacity) : '4',
        });
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!driverData.name || !driverData.phone) {
      Alert.alert('Error', 'Name and Phone are required.');
      return;
    }
    if (!vehicleData.vehicleType || !vehicleData.vehicleNumber) {
      Alert.alert('Error', 'Vehicle Type and Number are required.');
      return;
    }

    setSaving(true);
    try {
      await updateDriverProfile({
        driverData: {
          name: driverData.name,
          phone: driverData.phone,
        },
        vehicleData: {
          ...vehicleData,
          capacity: parseInt(vehicleData.capacity, 10) || 4
        }
      });
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (err) {
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#10B981" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.profileIconContainer}>
              <MaterialCommunityIcons name="account-circle" size={80} color="#10B981" />
            </View>
            <Text style={styles.greeting}>{driverData.name || 'Driver'}</Text>
            <Text style={styles.subtitle}>Update your personal and vehicle details</Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Personal Details</Text>
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={styles.input}
              value={driverData.name}
              onChangeText={(text) => setDriverData({ ...driverData, name: text })}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={driverData.phone}
              onChangeText={(text) => setDriverData({ ...driverData, phone: text })}
              keyboardType="phone-pad"
              placeholder="+1234567890"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Email Address</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={driverData.email}
              editable={false}
              placeholder="john@example.com"
            />
          </View>

          {/* Vehicle Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="car-info" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
            </View>

            <Text style={styles.label}>Vehicle Type</Text>
            <View style={styles.typeSelector}>
              {['tricycle', 'bus'].map((type) => (
                <Text
                  key={type}
                  style={[
                    styles.typeOption,
                    vehicleData.vehicleType === type && styles.typeOptionSelected
                  ]}
                  onPress={() => setVehicleData({ ...vehicleData, vehicleType: type })}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              ))}
            </View>

            <Text style={styles.label}>Vehicle Model</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.vehicleModel}
              onChangeText={(text) => setVehicleData({ ...vehicleData, vehicleModel: text })}
              placeholder="e.g. Honda Civic, Bajaj RE"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Vehicle Number (Plate)</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.vehicleNumber}
              onChangeText={(text) => setVehicleData({ ...vehicleData, vehicleNumber: text })}
              placeholder="e.g. MH12 AB 1234"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Seating Capacity</Text>
            <TextInput
              style={styles.input}
              value={vehicleData.capacity}
              onChangeText={(text) => setVehicleData({ ...vehicleData, capacity: text })}
              keyboardType="number-pad"
              placeholder="e.g. 4"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          <View style={styles.buttonContainer}>
            <ButtonComponent 
              title={saving ? "Saving..." : "Save Changes"} 
              onPress={handleSave} 
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 30,
  },
  profileIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: '#4B5563',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1F2937',
  },
  disabledInput: {
    backgroundColor: '#E5E7EB',
    color: '#6B7280',
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeOption: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    fontSize: 15,
    color: '#4B5563',
    fontWeight: '500',
    overflow: 'hidden',
  },
  typeOptionSelected: {
    backgroundColor: '#ECFDF5',
    borderColor: '#10B981',
    color: '#10B981',
  },
  buttonContainer: {
    marginTop: 10,
  }
});
