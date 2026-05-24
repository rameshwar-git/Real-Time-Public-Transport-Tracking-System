import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { getUpcomingRides, getRecentRides, getPassengerStats, getCurrentUser } from '@/services/apiService';
import { router, useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');

export default function UserDashboard() {
  const [upcomingRides, setUpcomingRides] = useState<any[]>([]);
  const [recentRides, setRecentRides] = useState<any[]>([]);
  const [userName, setUserName] = useState<string>("Traveler");
  const [stats, setStats] = useState({
    totalRides: 0,
    averageRating: 0,
    totalSpent: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const [upcoming, recent, passengerStats, profile] = await Promise.all([
        getUpcomingRides(),
        getRecentRides(),
        getPassengerStats(),
        getCurrentUser().catch((err) => {
          console.error("Error fetching user profile:", err);
          return null;
        }),
      ]);

      if (upcoming && Array.isArray(upcoming)) {
        setUpcomingRides(upcoming);
      }
      if (recent && Array.isArray(recent)) {
        setRecentRides(recent);
      }
      if (passengerStats) {
        setStats({
          totalRides: passengerStats.totalRides || 0,
          averageRating: passengerStats.averageRating || 0,
          totalSpent: passengerStats.totalSpent || 0,
        });
      }
      if (profile && profile.name) {
        setUserName(profile.name);
      }
    } catch (err: any) {
      console.error("Error fetching passenger dashboard data:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();

      // Silent refreshing every 8 seconds to make the dashboard dynamic in real-time
      const interval = setInterval(() => {
        fetchDashboardData(true);
      }, 8000);

      return () => clearInterval(interval);
    }, [])
  );

  const onRefresh = () => {
    fetchDashboardData(true);
  };

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text style={styles.loadingText}>Loading dashboard...</Text>
      </SafeAreaView>
    );
  }

  if (error && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => fetchDashboardData()}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Show current ride only when trip is in_progress (OTP verified) or confirmed
  const currentRide = upcomingRides.find((ride) => ride.status === 'in_progress' || ride.status === 'confirmed');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#3B82F6"]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hello, {userName}! 👋</Text>
            <Text style={styles.date}>
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <TouchableOpacity style={styles.profileIcon} onPress={() => router.push('/profile')}>
            <MaterialCommunityIcons name="account-circle" size={32} color="#1F2937" />
          </TouchableOpacity>
        </View>

        {/* Quick Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="car" size={24} color="#3B82F6" />
            </View>
            <View>
              <Text style={styles.statNumber}>{stats.totalRides}</Text>
              <Text style={styles.statLabel}>Total Rides</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="star" size={24} color="#F59E0B" />
            </View>
            <View>
              <Text style={styles.statNumber}>{stats.averageRating.toFixed(1)}</Text>
              <Text style={styles.statLabel}>My Rating</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.statBox}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="wallet" size={24} color="#10B981" />
            </View>
            <View>
              <Text style={styles.statNumber}>
                {stats.totalSpent >= 1000 ? `₹${(stats.totalSpent / 1000).toFixed(1)}K` : `₹${stats.totalSpent}`}
              </Text>
              <Text style={styles.statLabel}>Total Spent</Text>
            </View>
          </View>
        </View>

        {/* Current Ride — only shown when the rider has accepted the OTP */}
        {currentRide ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Ride</Text>
              <View style={[styles.statusBadge, styles.statusConfirmed]}>
                <Text style={[styles.statusText, styles.statusTextConfirmed]}>
                  {currentRide.status === 'in_progress' ? '🚗 In Progress' : 'Active'}
                </Text>
              </View>
            </View>

            <View style={styles.rideCard}>
              <View style={styles.rideHeader}>
                <View style={styles.rideRoute}>
                  <View style={styles.routeDot} />
                  <View style={styles.routeLine} />
                  <MaterialCommunityIcons name="map-marker" size={20} color="#EF4444" />
                </View>

                <View style={styles.rideInfo}>
                  <Text style={styles.rideFrom} numberOfLines={1}>
                    {currentRide.from}
                  </Text>
                  <Text style={styles.rideTo} numberOfLines={1}>
                    {currentRide.to}
                  </Text>
                  <View style={styles.rideDateTime}>
                    <MaterialCommunityIcons name="clock-outline" size={14} color="#6B7280" />
                    <Text style={styles.dateTime}>
                      {currentRide.date} • {currentRide.time}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.rideFooter}>
                <View style={styles.driverInfo}>
                  <MaterialCommunityIcons name="face-man" size={16} color="#3B82F6" />
                  <Text style={styles.driverName}>{currentRide.driver}</Text>
                  <View style={styles.rating}>
                    <MaterialCommunityIcons name="star" size={12} color="#F59E0B" />
                    <Text style={styles.ratingText}>{currentRide.rating}</Text>
                  </View>
                </View>
                <TouchableOpacity style={styles.viewDetailsBtn}>
                  <Text style={styles.viewDetailsText}>Details</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Current Ride</Text>
            </View>
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="car-off" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No active ride</Text>
              <Text style={styles.emptyDesc}>Book a ride to get started</Text>
            </View>
          </View>
        )}

        {/* Recent Rides */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Rides</Text>
            <TouchableOpacity>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>

          {recentRides.length > 0 ? (
            recentRides.map((ride) => (
              <View key={ride.id} style={styles.recentRideCard}>
                <View style={styles.recentRideContent}>
                  <View>
                    <Text style={styles.recentRideTitle}>{ride.from} → {ride.to}</Text>
                    <Text style={styles.recentRideDate}>{ride.date}</Text>
                  </View>
                  <View style={styles.recentRideRight}>
                    <Text style={styles.recentRidePrice}>{ride.fare}</Text>
                    <View style={styles.smallRating}>
                      {ride.rating && ride.rating > 0 ? (
                        [...Array(Math.round(ride.rating))].map((_, i) => (
                          <MaterialCommunityIcons
                            key={i}
                            name="star"
                            size={12}
                            color="#F59E0B"
                          />
                        ))
                      ) : (
                        <MaterialCommunityIcons
                          name="star-outline"
                          size={12}
                          color="#6B7280"
                        />
                      )}
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="car-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>No recent rides</Text>
              <Text style={styles.emptyDesc}>Your completed trips will show up here</Text>
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="card-outline"
                size={24}
                color="#3B82F6"
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>My Wallet</Text>
              <Text style={styles.actionDesc}>Manage payment methods</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="map-outline"
                size={24}
                color="#8B5CF6"
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Saved Places</Text>
              <Text style={styles.actionDesc}>Your favorite locations</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={24}
                color="#EC4899"
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Help & Support</Text>
              <Text style={styles.actionDesc}>Contact our support team</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
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
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  profileIcon: {
    padding: 8,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  statBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: '#111827',
  },
  statLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 12,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  seeAll: {
    fontSize: 12,
    color: '#3B82F6',
    fontWeight: '600',
  },
  rideCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  rideHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  rideRoute: {
    width: 32,
    marginRight: 12,
    alignItems: 'center',
  },
  routeDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#10B981',
    marginBottom: 4,
  },
  routeLine: {
    width: 2,
    height: 40,
    backgroundColor: '#D1D5DB',
    marginVertical: 2,
  },
  rideInfo: {
    flex: 1,
  },
  rideFrom: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  rideTo: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 6,
  },
  rideDateTime: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateTime: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusConfirmed: {
    backgroundColor: '#ECFDF5',
  },
  statusScheduled: {
    backgroundColor: '#EFF6FF',
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  statusTextConfirmed: {
    color: '#10B981',
  },
  statusTextScheduled: {
    color: '#3B82F6',
  },
  rideFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  driverName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111827',
  },
  viewDetailsBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F3F4F6',
  },
  viewDetailsText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#3B82F6',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 12,
  },
  emptyDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  recentRideCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  recentRideContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentRideTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111827',
  },
  recentRideDate: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '400',
    marginTop: 2,
  },
  recentRideRight: {
    alignItems: 'flex-end',
  },
  recentRidePrice: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  smallRating: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionContent: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  actionDesc: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '400',
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
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
