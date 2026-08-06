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
import { getCurrentUser, updatePassengerProfile } from '@/services/apiService';
import { handleLogout } from '@/hooks/auth/auth';
import { colors, radius, shadow, spacing, type } from '@/constants/ui';

export default function ProfileScreen() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [userData, setUserData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Store original data so we can revert on cancel
  const [originalData, setOriginalData] = useState(userData);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await getCurrentUser();
      if (res) {
        const d = {
          name: res.name || '',
          phone: res.phone || '',
          email: res.email || '',
        };
        setUserData(d);
        setOriginalData(d);
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
    setUserData(originalData);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!userData.phone) {
      Alert.alert('Error', 'Phone is required.');
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
              await updatePassengerProfile({
                name: userData.name,
                phone: userData.phone,
              });
              setOriginalData(userData);
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
            <Text style={styles.greeting}>{userData.name || 'Passenger'}</Text>
            <Text style={styles.subtitle}>
              {isEditing ? 'Editing your profile' : 'View your personal details'}
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
              <View style={[styles.inputWrap, !isEditing && styles.inputDisabled]}>
                <MaterialCommunityIcons name="account-outline" size={18} color={colors.textMuted} />
                <TextInput
                  style={styles.input}
                  value={userData.name}
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
                  value={userData.phone}
                  onChangeText={(text) => setUserData({ ...userData, phone: text })}
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
                  value={userData.email}
                  editable={false}
                  placeholder="john@example.com"
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
