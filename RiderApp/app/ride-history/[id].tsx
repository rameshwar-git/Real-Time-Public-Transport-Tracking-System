import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDriverRideHistory } from '@/services/apiService';
import { Ride, STATUS_META } from '@/types/ride';
import { formatFare } from '@/utils/format';

const fmt = (v?: string) => {
  if (!v) return '—';
  const d = new Date(v);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function RideDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [ride, setRide] = useState<Ride | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await getDriverRideHistory();
        const list: Ride[] = Array.isArray(data) ? data : [];
        const found = list.find((r) => r.id === id);
        setRide(found || null);
      } catch (err) {
        Alert.alert('Error', 'Failed to load ride details');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const coord = (lat?: number, lng?: number) =>
    lat == null || lng == null ? '—' : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (!ride) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#D1D5DB" />
        <Text style={styles.notFound}>Ride not found</Text>
        <TouchableOpacity style={styles.backBtnWide} onPress={() => router.back()}>
          <Text style={styles.backBtnWideText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const meta = STATUS_META[ride.status] || STATUS_META.completed;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride Details</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
          <Text style={styles.summaryAmount}>{formatFare(ride.fare)}</Text>
          <Text style={styles.summaryLabel}>Total Fare</Text>
          {ride.rating ? (
            <View style={styles.ratingRow}>
              <MaterialCommunityIcons name="star" size={16} color="#F59E0B" />
              <Text style={styles.ratingText}>{ride.rating.toFixed(1)}</Text>
            </View>
          ) : null}
        </View>

        {/* Passenger */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passenger</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="account-circle" size={22} color="#10B981" />
            <Text style={styles.infoText}>{ride.passengerName || 'Passenger'}</Text>
          </View>
        </View>

        {/* Trip details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trip Details</Text>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={22} color="#3B82F6" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Pickup</Text>
              <Text style={styles.infoText}>{fmt(ride.startDate)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="flag-checkered" size={22} color="#3B82F6" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Drop-off</Text>
              <Text style={styles.infoText}>{fmt(ride.endDate)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-radius" size={22} color="#3B82F6" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Pickup location</Text>
              <Text style={styles.infoText}>{coord(ride.from?.latitude, ride.from?.longitude)}</Text>
            </View>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="map-marker-check" size={22} color="#3B82F6" />
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoLabel}>Destination</Text>
              <Text style={styles.infoText}>{coord(ride.to?.latitude, ride.to?.longitude)}</Text>
            </View>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="map-marker-distance" size={22} color="#10B981" />
            <Text style={styles.statValue}>{ride.distance?.toFixed(1) || '0'} km</Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="clock-outline" size={22} color="#10B981" />
            <Text style={styles.statValue}>{Math.round(ride.duration || 0)} min</Text>
            <Text style={styles.statLabel}>Duration</Text>
          </View>
          <View style={styles.statBox}>
            <MaterialCommunityIcons name="cash" size={22} color="#10B981" />
            <Text style={styles.statValue}>{formatFare(ride.fare)}</Text>
            <Text style={styles.statLabel}>Fare</Text>
          </View>
        </View>
      </ScrollView>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSpacer: {
    width: 40,
  },
  notFound: {
    marginTop: 12,
    fontSize: 16,
    color: '#6B7280',
  },
  backBtnWide: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  backBtnWideText: {
    color: '#FFF',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  summaryCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  summaryAmount: {
    fontSize: 34,
    fontWeight: '800',
    color: '#1F2937',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F59E0B',
  },
  section: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  infoTextWrap: {
    marginLeft: 12,
    flex: 1,
  },
  infoText: {
    fontSize: 15,
    color: '#1F2937',
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 2,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statValue: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
});
