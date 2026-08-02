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
import { colors, radius, shadow, spacing, type } from '@/constants/ui';

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
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <View style={styles.avatarRing}>
              <MaterialCommunityIcons name="account" size={48} color={colors.primary} />
            </View>
            <Text style={styles.greeting}>{driverData.name || 'Driver'}</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Editing your profile' : 'View your personal and vehicle details'}
            </Text>
          </View>

          {/* Personal Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="card-account-details-outline" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Personal Details</Text>
              {!isEditing && (
                <TouchableOpacity style={styles.editBadge} onPress={handleEnableEdit}>
                  <MaterialCommunityIcons name="pencil" size={13} color={colors.primary} />
                  <Text style={styles.editBadgeText}>Edit</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Full Name</Text>
              <View style={[styles.inputWrap, styles.inputDisabled]}>
                <MaterialCommunityIcons name="account-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={driverData.name}
                  editable={false}
                  placeholder="John Doe"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Phone Number</Text>
              <View style={[styles.inputWrap, !isEditing && styles.inputDisabled]}>
                <MaterialCommunityIcons name="phone-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={driverData.phone}
                  onChangeText={(text) => setDriverData({ ...driverData, phone: text })}
                  editable={isEditing}
                  keyboardType="phone-pad"
                  placeholder="+1234567890"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrap, styles.inputDisabled]}>
                <MaterialCommunityIcons name="email-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={driverData.email}
                  editable={false}
                  placeholder="john@example.com"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
          </View>

          {/* Vehicle Information */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="car-info" size={20} color={colors.primary} />
              <Text style={styles.sectionTitle}>Vehicle Details</Text>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Vehicle Type</Text>
              <View style={[styles.typeSelector, !isEditing && { opacity: 0.7 }]}>
                {['tricycle', 'bus'].map((typeOption) => (
                  <Text
                    key={typeOption}
                    style={[
                      styles.typeOption,
                      vehicleData.vehicleType === typeOption && styles.typeOptionSelected
                    ]}
                    onPress={() => isEditing && setVehicleData({ ...vehicleData, vehicleType: typeOption })}
                  >
                    {typeOption.charAt(0).toUpperCase() + typeOption.slice(1)}
                  </Text>
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Vehicle Model</Text>
              <View style={[styles.inputWrap, !isEditing && styles.inputDisabled]}>
                <MaterialCommunityIcons name="car-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={vehicleData.vehicleModel}
                  onChangeText={(text) => setVehicleData({ ...vehicleData, vehicleModel: text })}
                  editable={isEditing}
                  placeholder="e.g. Honda Civic, Bajaj RE"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Vehicle Number (Plate)</Text>
              <View style={[styles.inputWrap, !isEditing && styles.inputDisabled]}>
                <MaterialCommunityIcons name="newspaper-variant-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={vehicleData.vehicleNumber}
                  onChangeText={(text) => setVehicleData({ ...vehicleData, vehicleNumber: text })}
                  editable={isEditing}
                  placeholder="e.g. MH12 AB 1234"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="characters"
                />
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>Seating Capacity</Text>
              <View style={[styles.inputWrap, !isEditing && styles.inputDisabled]}>
                <MaterialCommunityIcons name="seat-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={vehicleData.capacity}
                  onChangeText={(text) => setVehicleData({ ...vehicleData, capacity: text })}
                  editable={isEditing}
                  keyboardType="number-pad"
                  placeholder="e.g. 4"
                  placeholderTextColor="#9CA3AF"
                />
              </View>
            </View>
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
    backgroundColor: colors.bg,
  },
  center: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xxl,
    paddingVertical: spacing.xxl,
    backgroundColor: colors.primarySoft,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
  },
  avatarRing: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadow.elevated,
  },
  greeting: {
    fontSize: type.title.fontSize,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.xl,
    ...shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: type.h2.fontSize,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
  },
  editBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  editBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    ...type.label,
    marginBottom: 6,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    gap: spacing.sm,
  },
  inputDisabled: {
    backgroundColor: '#EEF0F4',
    opacity: 0.9,
  },
  input: {
    flex: 1,
    fontSize: type.body.fontSize,
    color: colors.text,
    padding: 0,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  typeOption: {
    flex: 1,
    textAlign: 'center',
    paddingVertical: 13,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    fontSize: 15,
    color: colors.textSecondary,
    fontWeight: '600',
    overflow: 'hidden',
  },
  typeOptionSelected: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.primary,
    color: colors.primaryDark,
  },
  editActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.inputBg,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFF',
  },
  logoutContainer: {
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
});
