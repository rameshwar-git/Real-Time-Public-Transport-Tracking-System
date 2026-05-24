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
  Platform,
  TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ButtonComponent from '@/components/button';
import { getDriverProfile, updateDriverProfile } from '@/services/apiService';
import { handleLogout } from '@/hooks/auth/auth';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [driverData, setDriverData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  const [vehicleData, setVehicleData] = useState({
    vehicleType: '',
    vehicleModel: '',
    vehicleNumber: '',
    capacity: '4',
  });

  // Store original data so we can revert on cancel
  const [originalDriverData, setOriginalDriverData] = useState(driverData);
  const [originalVehicleData, setOriginalVehicleData] = useState(vehicleData);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getDriverProfile();
      if (res.driver) {
        const d = {
          name: res.driver.name || '',
          phone: res.driver.phone || '',
          email: res.driver.email || '',
        };
        setDriverData(d);
        setOriginalDriverData(d);
      }
      if (res.vehicle) {
        const v = {
          vehicleType: res.vehicle.vehicleType || '',
          vehicleModel: res.vehicle.vehicleModel || '',
          vehicleNumber: res.vehicle.vehicleNumber || '',
          capacity: res.vehicle.capacity ? String(res.vehicle.capacity) : '4',
        };
        setVehicleData(v);
        setOriginalVehicleData(v);
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleEnableEdit = () => {
    Alert.alert(
      'Edit Profile',
      'Are you sure you want to update your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes, Edit', onPress: () => setIsEditing(true) },
      ]
    );
  };

  const handleCancelEdit = () => {
    setDriverData(originalDriverData);
    setVehicleData(originalVehicleData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!driverData.phone) {
      Alert.alert('Error', 'Phone is required.');
      return;
    }
    if (!vehicleData.vehicleType || !vehicleData.vehicleNumber) {
      Alert.alert('Error', 'Vehicle Type and Number are required.');
      return;
    }

    Alert.alert(
      'Confirm Changes',
      'Are you sure you want to save these changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
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
              setOriginalDriverData(driverData);
              setOriginalVehicleData(vehicleData);
              setIsEditing(false);
              Alert.alert('Success', 'Profile updated successfully!');
            } catch (err) {
              Alert.alert('Error', 'Failed to update profile');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
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
            <Text style={styles.subtitle}>
              {isEditing ? 'Editing your profile' : 'View your personal and vehicle details'}
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="card-account-details-outline" size={24} color="#1F2937" />
              <Text style={styles.sectionTitle}>Personal Details</Text>
              {!isEditing && (
                <TouchableOpacity style={styles.editBadge} onPress={handleEnableEdit}>
                  <MaterialCommunityIcons name="pencil" size={14} color="#10B981" />
                  <Text style={styles.editBadgeText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <Text style={styles.label}>Full Name</Text>
            <TextInput
              style={[styles.input, styles.disabledInput]}
              value={driverData.name}
              editable={false}
              placeholder="John Doe"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Phone Number</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={driverData.phone}
              onChangeText={(text) => setDriverData({ ...driverData, phone: text })}
              editable={isEditing}
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
            <View style={[styles.typeSelector, !isEditing && { opacity: 0.6 }]}>
              {['tricycle', 'bus'].map((type) => (
                <Text
                  key={type}
                  style={[
                    styles.typeOption,
                    vehicleData.vehicleType === type && styles.typeOptionSelected
                  ]}
                  onPress={() => isEditing && setVehicleData({ ...vehicleData, vehicleType: type })}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Text>
              ))}
            </View>

            <Text style={styles.label}>Vehicle Model</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={vehicleData.vehicleModel}
              onChangeText={(text) => setVehicleData({ ...vehicleData, vehicleModel: text })}
              editable={isEditing}
              placeholder="e.g. Honda Civic, Bajaj RE"
              placeholderTextColor="#9CA3AF"
            />

            <Text style={styles.label}>Vehicle Number (Plate)</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={vehicleData.vehicleNumber}
              onChangeText={(text) => setVehicleData({ ...vehicleData, vehicleNumber: text })}
              editable={isEditing}
              placeholder="e.g. MH12 AB 1234"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="characters"
            />

            <Text style={styles.label}>Seating Capacity</Text>
            <TextInput
              style={[styles.input, !isEditing && styles.disabledInput]}
              value={vehicleData.capacity}
              onChangeText={(text) => setVehicleData({ ...vehicleData, capacity: text })}
              editable={isEditing}
              keyboardType="number-pad"
              placeholder="e.g. 4"
              placeholderTextColor="#9CA3AF"
            />
          </View>

          {isEditing && (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelEdit}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && { opacity: 0.6 }]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>
                  {saving ? 'Saving...' : 'Save Changes'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.logoutContainer}>
            <ButtonComponent 
              title="Logout" 
              onPress={handleLogout} 
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
    flex: 1,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10B981',
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
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#10B981',
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutContainer: {
    marginTop: 8,
    marginBottom: 10,
  },
});
