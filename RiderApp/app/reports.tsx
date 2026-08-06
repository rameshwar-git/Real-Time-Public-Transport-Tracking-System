import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getDriverReports, getWeeklyEarnings } from '@/services/apiService';
import { formatFare } from '@/utils/format';

interface Report {
  totalEarnings: number;
  totalTrips: number;
  avgFare: number;
  totalDistance: number;
  topDay: string;
  topDayEarnings: number;
  monthBreakdown: { label: string; earnings: number; trips: number }[];
}

interface Weekly {
  day: string;
  amount: number;
}

export default function ReportsScreen() {
  const [report, setReport] = useState<Report | null>(null);
  const [weekly, setWeekly] = useState<Weekly[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    try {
      const [r, w] = await Promise.all([getDriverReports(), getWeeklyEarnings()]);
      setReport(r);
      setWeekly(Array.isArray(w) ? w : []);
      setError(false);
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const onRefresh = () => {
    setRefreshing(true);
    load();
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
        <ActivityIndicator size="large" color="#10B981" />
      </SafeAreaView>
    );
  }

  if (error || !report) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top', 'left', 'right']}>
        <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
        <Text style={styles.errorText}>Failed to load reports</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={load}>
          <Text style={styles.retryBtnText}>Retry</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const maxMonth = Math.max(1, ...report.monthBreakdown.map((m) => m.earnings));

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={26} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Detailed Reports</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Overview */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryLabel}>Total Earnings</Text>
          <Text style={styles.summaryAmount}>{formatFare(report.totalEarnings)}</Text>
          <Text style={styles.summarySub}>{report.totalTrips} completed trips</Text>
        </View>

        <View style={styles.metricsGrid}>
          <View style={styles.metricBox}>
            <MaterialCommunityIcons name="routes" size={22} color="#6366F1" />
            <Text style={styles.metricValue}>{report.totalTrips}</Text>
            <Text style={styles.metricLabel}>Trips</Text>
          </View>
          <View style={styles.metricBox}>
            <MaterialCommunityIcons name="receipt" size={22} color="#10B981" />
            <Text style={styles.metricValue}>{formatFare(report.avgFare)}</Text>
            <Text style={styles.metricLabel}>Avg Fare</Text>
          </View>
          <View style={styles.metricBox}>
            <MaterialCommunityIcons name="map-marker-distance" size={22} color="#F59E0B" />
            <Text style={styles.metricValue}>{report.totalDistance.toFixed(1)}km</Text>
            <Text style={styles.metricLabel}>Distance</Text>
          </View>
          <View style={styles.metricBox}>
            <MaterialCommunityIcons name="calendar-star" size={22} color="#EC4899" />
            <Text style={styles.metricValue}>{report.topDay}</Text>
            <Text style={styles.metricLabel}>Best Day</Text>
          </View>
        </View>

        {report.topDayEarnings > 0 && (
          <Text style={styles.topDayNote}>
            Your best day is {report.topDay} earning {formatFare(report.topDayEarnings)}.
          </Text>
        )}

        {/* Monthly breakdown */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>Earnings (Last 6 Months)</Text>
        <View style={styles.chartCard}>
          <View style={styles.chartRow}>
            {report.monthBreakdown.map((m) => (
              <View key={m.label} style={styles.barCol}>
                <Text style={styles.barAmount}>
                  {m.earnings > 0 ? `₹${Math.round(m.earnings / 1000)}k` : ''}
                </Text>
                <View
                  style={[
                    styles.bar,
                    {
                      height: m.earnings > 0 ? Math.max(8, (m.earnings / maxMonth) * 120) : 4,
                      backgroundColor: m.earnings === maxMonth && m.earnings > 0 ? '#10B981' : '#D1D5DB',
                    },
                  ]}
                />
                <Text style={styles.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
            <Text style={styles.legendText}>Highest Month</Text>
            <View style={[styles.legendDot, { backgroundColor: '#D1D5DB' }]} />
            <Text style={styles.legendText}>Other Months</Text>
          </View>
        </View>

        {/* Weekly */}
        <Text style={[styles.sectionTitle, styles.sectionGap]}>This Week</Text>
        <View style={styles.chartCard}>
          {weekly.length === 0 ? (
            <Text style={styles.noData}>No earnings recorded this week yet.</Text>
          ) : (
            <View style={styles.chartRow}>
              {weekly.map((item) => {
                const maxW = Math.max(1, ...weekly.map((w) => w.amount));
                return (
                  <View key={item.day} style={styles.barCol}>
                    <Text style={styles.barAmount}>
                      {item.amount > 0 ? `₹${Math.round(item.amount)}` : ''}
                    </Text>
                    <View
                      style={[
                        styles.bar,
                        {
                          height: item.amount > 0 ? Math.max(8, (item.amount / maxW) * 120) : 4,
                          backgroundColor:
                            item.amount === maxW && item.amount > 0 ? '#10B981' : '#D1D5DB',
                        },
                      ]}
                    />
                    <Text style={styles.barLabel}>{item.day}</Text>
                  </View>
                );
              })}
            </View>
          )}
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
  errorText: {
    marginTop: 12,
    fontSize: 16,
    color: '#EF4444',
  },
  retryBtn: {
    marginTop: 16,
    backgroundColor: '#10B981',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryBtnText: {
    color: '#FFF',
    fontWeight: '600',
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
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  sectionGap: {
    marginTop: 24,
  },
  summaryCard: {
    backgroundColor: '#10B981',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#D1FAE5',
    fontWeight: '500',
  },
  summaryAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFF',
    marginTop: 4,
  },
  summarySub: {
    fontSize: 13,
    color: '#D1FAE5',
    marginTop: 6,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricBox: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  metricValue: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  topDayNote: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 12,
  },
  chartCard: {
    backgroundColor: '#FFF',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 160,
  },
  barCol: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    height: 160,
  },
  barAmount: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  bar: {
    width: 22,
    borderRadius: 6,
  },
  barLabel: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 8,
    fontWeight: '500',
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginLeft: 12,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
  noData: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    paddingVertical: 20,
  },
});
