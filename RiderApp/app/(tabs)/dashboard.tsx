import React, { useState, useEffect } from 'react';
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
import ButtonComponent from '@/components/button';
import { handleLogout } from '@/hooks/auth/auth';
import { getDriverEarnings, getWeeklyEarnings } from '@/services/apiService';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

export default function RiderDashboard() {
  const [earnings, setEarnings] = useState({
    totalEarnings: 0,
    weeklyEarnings: 0,
    weeklyChange: 0,
    completedRides: 0,
    acceptanceRate: 0,
  });

  const [chartData, setChartData] = useState<Array<{ day: string; amount: number }>>([]);
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
      const [earningsData, weeklyData] = await Promise.all([
        getDriverEarnings(),
        getWeeklyEarnings(),
      ]);

      if (earningsData) {
        setEarnings({
          totalEarnings: earningsData.totalEarnings || 0,
          weeklyEarnings: earningsData.weeklyEarnings || 0,
          weeklyChange: earningsData.weeklyChange || 0,
          completedRides: earningsData.completedRides || 0,
          acceptanceRate: earningsData.acceptanceRate || 0,
        });
      }

      if (weeklyData && Array.isArray(weeklyData)) {
        setChartData(weeklyData);
      }
    } catch (err: any) {
      console.error("Error fetching dashboard data:", err);
      setError(err?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const onRefresh = () => {
    fetchDashboardData(true);
  };

  const maxAmount = chartData.length > 0 ? Math.max(...chartData.map((d) => d.amount), 1) : 1;

  if (loading && !refreshing) {
    return (
      <SafeAreaView style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#10B981" />
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

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={["#10B981"]} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome Back! 👋</Text>
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

        {/* Primary Earnings Card */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsTop}>
            <View>
              <Text style={styles.earningsLabel}>Total Earnings</Text>
              <Text style={styles.totalEarnings}>
                ₹{earnings.totalEarnings.toFixed(2)}
              </Text>
            </View>
            <View style={styles.earningsIconContainer}>
              <MaterialCommunityIcons
                name="wallet"
                size={32}
                color="#10B981"
              />
            </View>
          </View>

          <View style={styles.earningsStats}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>₹{earnings.weeklyEarnings.toFixed(2)}</Text>
              <Text style={styles.statLabel}>This Week</Text>
            </View>
            <View style={[styles.statItem, styles.divider]}>
              <View style={styles.changeContainer}>
                <MaterialCommunityIcons 
                  name={earnings.weeklyChange >= 0 ? "trending-up" : "trending-down"} 
                  size={16} 
                  color={earnings.weeklyChange >= 0 ? "#10B981" : "#EF4444"} 
                />
                <Text style={[styles.changeText, { color: earnings.weeklyChange >= 0 ? "#10B981" : "#EF4444" }]}>
                  {earnings.weeklyChange >= 0 ? `+${earnings.weeklyChange}%` : `${earnings.weeklyChange}%`}
                </Text>
              </View>
              <Text style={styles.statLabel}>Week Change</Text>
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Performance</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <MaterialCommunityIcons name="check-circle" size={28} color="#6366F1" />
              </View>
              <Text style={styles.metricValue}>{earnings.completedRides}</Text>
              <Text style={styles.metricLabel}>Rides Complete</Text>
            </View>

            <View style={styles.metricCard}>
              <View style={styles.metricIconContainer}>
                <MaterialCommunityIcons name="percent" size={28} color="#F59E0B" />
              </View>
              <Text style={styles.metricValue}>{earnings.acceptanceRate}%</Text>
              <Text style={styles.metricLabel}>Acceptance Rate</Text>
            </View>
          </View>
        </View>

        {/* Weekly Earnings Chart */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Weekly Earnings</Text>
          <View style={styles.chartCard}>
            <View style={styles.chart}>
              {chartData.map((item, index) => (
                <View key={index} style={styles.barContainer}>
                  <View style={styles.barWrapper}>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: (item.amount / maxAmount) * 120,
                          backgroundColor: item.amount === maxAmount && item.amount > 0 ? '#10B981' : '#D1D5DB',
                        },
                      ]}
                    />
                  </View>
                  <Text style={styles.barLabel}>{item.day}</Text>
                </View>
              ))}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#10B981' }]}
                />
                <Text style={styles.legendText}>Highest Day</Text>
              </View>
              <View style={styles.legendItem}>
                <View
                  style={[styles.legendColor, { backgroundColor: '#D1D5DB' }]}
                />
                <Text style={styles.legendText}>Other Days</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <TouchableOpacity style={styles.actionCard}>
            <View style={styles.actionIconContainer}>
              <MaterialCommunityIcons
                name="file-document-outline"
                size={24}
                color="#3B82F6"
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>View Detailed Reports</Text>
              <Text style={styles.actionDesc}>Monthly & yearly analytics</Text>
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
                name="history"
                size={24}
                color="#8B5CF6"
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Ride History</Text>
              <Text style={styles.actionDesc}>All completed rides</Text>
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
                name="bank-transfer"
                size={24}
                color="#EC4899"
              />
            </View>
            <View style={styles.actionContent}>
              <Text style={styles.actionTitle}>Withdraw Earnings</Text>
              <Text style={styles.actionDesc}>Instant withdrawal available</Text>
            </View>
            <MaterialCommunityIcons
              name="chevron-right"
              size={24}
              color="#9CA3AF"
            />
          </TouchableOpacity>
        </View>

        {/* Logout Button */}
        <View style={styles.buttonContainer}>
          <ButtonComponent title="Logout" onPress={handleLogout} />
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
  earningsCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  earningsTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  earningsLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
    marginBottom: 8,
  },
  totalEarnings: {
    fontSize: 32,
    fontWeight: '800',
    color: '#111827',
  },
  earningsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    flex: 1,
  },
  divider: {
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB',
    paddingLeft: 16,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  changeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  metricIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#111827',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
    textAlign: 'center',
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  chart: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: 160,
    marginBottom: 16,
  },
  barContainer: {
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  barWrapper: {
    height: 120,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  bar: {
    width: 20,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '500',
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
  buttonContainer: {
    marginTop: 12,
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
    backgroundColor: '#10B981',
  },
  retryButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
