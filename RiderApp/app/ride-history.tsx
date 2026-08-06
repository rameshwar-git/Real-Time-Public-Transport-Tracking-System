import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDriverRideHistory } from '@/services/apiService';
import { Ride, STATUS_META } from '@/types/ride';
import { formatFare } from '@/utils/format';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatCoord = (lat?: number, lng?: number) => {
  if (lat == null || lng == null) return '—';
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
};

// Show the saved location name when available; fall back to raw coordinates
// for older trips that predate name persistence.
const formatLocation = (ride: Ride, key: 'from' | 'to') => {
  const name = key === 'from' ? ride.fromName : ride.toName;
  const coord = ride[key];
  if (name && name.trim()) return name;
  return formatCoord(coord?.latitude, coord?.longitude);
};

export default function RideHistoryScreen() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await getDriverRideHistory();
      setRides(Array.isArray(data) ? data : []);
    } catch (err) {
      Alert.alert('Error', 'Failed to load ride history');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [fetchHistory])
  );

  const renderRide = ({ item }: { item: Ride }) => {
    const meta = STATUS_META[item.status] || STATUS_META.completed;
    return (
      <TouchableOpacity
        style={styles.rideCard}
        onPress={() => router.push({ pathname: '/ride-history/[id]', params: { id: item.id } })}
      >
        <View style={styles.rideTop}>
          <View style={styles.passengerRow}>
            <MaterialCommunityIcons name="account" size={20} color="#10B981" />
            <Text style={styles.passengerName}>{item.passengerName || 'Passenger'}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: meta.bg }]}>
            <Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text>
          </View>
        </View>

        <View style={styles.routeRow}>
          <MaterialCommunityIcons name="map-marker" size={16} color="#3B82F6" />
          <Text style={styles.routeText} numberOfLines={1}>
            {formatLocation(item, 'from')}
          </Text>
        </View>
        <View style={styles.routeRow}>
          <MaterialCommunityIcons name="map-marker-check" size={16} color="#10B981" />
          <Text style={styles.routeText} numberOfLines={1}>
            {formatLocation(item, 'to')}
          </Text>
        </View>

        <View style={styles.rideFooter}>
          <Text style={styles.rideDate}>{formatDate(item.endDate || item.startDate)}</Text>
          <View style={styles.fareBox}>
            <Text style={styles.fare}>{formatFare(item.fare)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ride History</Text>
        <View style={styles.headerSpacer} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      ) : (
        <FlatList
          data={rides}
          keyExtractor={(item) => item.id}
          renderItem={renderRide}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="history" size={48} color="#D1D5DB" />
              <Text style={styles.emptyTitle}>No rides yet</Text>
              <Text style={styles.emptyDesc}>
                Your completed trips will appear here once you start driving.
              </Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
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
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  rideCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  rideTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  passengerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  passengerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  routeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  routeText: {
    fontSize: 13,
    color: '#6B7280',
    marginLeft: 8,
    flex: 1,
  },
  rideFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  rideDate: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  fareBox: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  fare: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 6,
  },
});
