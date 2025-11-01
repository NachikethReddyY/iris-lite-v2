import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { authService, AuthStats, AuthLog } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const surfaceColor = isDark ? 'rgba(28, 33, 40, 0.92)' : '#FFFFFF';
  const cardBorderColor = isDark ? 'rgba(236, 237, 238, 0.08)' : 'rgba(17, 24, 28, 0.08)';
  const mutedTextColor = isDark ? 'rgba(236, 237, 238, 0.7)' : '#666666';
  const secondaryTextColor = isDark ? 'rgba(236, 237, 238, 0.6)' : '#666666';
  const listBackgroundColor = isDark ? 'rgba(33, 39, 48, 0.9)' : '#FFFFFF';
  const { isAuthenticated, sessionExpiry } = useAuth();
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadDashboardData = useCallback(async () => {
    try {
      setIsLoading(true);
      const [authStats, logs] = await Promise.all([
        authService.getAuthStats(),
        authService.getAuthLogs()
      ]);
      setStats(authStats);
      setRecentLogs(logs.slice(0, 10));
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  useFocusEffect(
    useCallback(() => {
      loadDashboardData();
    }, [loadDashboardData])
  );

  const handleAuthenticate = () => {
    router.push('/iris-verification');
  };

  const authStatusColor = isAuthenticated ? '#34C759' : '#FF3B30';
  const authStatusTitle = isAuthenticated ? 'Authenticated' : 'Not authenticated';
  const authStatusSubtitle = isAuthenticated
    ? (sessionExpiry
      ? `Session expires at ${new Date(sessionExpiry).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : 'Session active. Tap to re-verify any time.')
    : 'Tap verify to confirm your identity.';
  const sessionBadgeText = isAuthenticated ? 'Session Active' : 'Session Inactive';
  const sessionBadgeIcon = isAuthenticated ? 'shield-checkmark' : 'warning';

  const successRateDisplay = stats ? `${stats.successRate}%` : '0%';
  const totalAttemptsDisplay = stats ? `${stats.totalAttempts}` : '0';
  const weeklyAttemptsDisplay = stats ? `${stats.weeklyAttempts}` : '0';

  const getCurrentDate = () => {
    const date = new Date();
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    return {
      day: days[date.getDay()],
      date: `${date.getDate()} ${months[date.getMonth()]}`,
      time: date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
  };

  const currentDateInfo = getCurrentDate();

  if (isLoading) {
    return (
      <ThemedView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <ThemedText style={styles.loadingText}>Loading dashboard...</ThemedText>
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <ThemedText style={styles.title}>Dashboard</ThemedText>
            <ThemedText style={[styles.welcomeText, { color: mutedTextColor }]}>
              Welcome back!
            </ThemedText>
          </View>
          <View style={styles.headerRight}>
            <ThemedText style={styles.dayText}>{currentDateInfo.day}</ThemedText>
            <ThemedText style={[styles.dateText, { color: secondaryTextColor }]}>
              {currentDateInfo.date}
            </ThemedText>
          </View>
        </View>

        {/* Authentication Status */}
        <View style={styles.statusSection}>
          <ThemedText style={[styles.statusTitle, { color: authStatusColor }]}>
            {authStatusTitle}
          </ThemedText>
          <ThemedText style={[styles.statusSubtitle, { color: secondaryTextColor }]}>
            {authStatusSubtitle}
          </ThemedText>

          {/* Large Eye Icon Circle */}
          <TouchableOpacity style={styles.eyeButton} onPress={handleAuthenticate}>
            <View style={styles.eyeCircle}>
              <Ionicons name="eye" size={60} color="white" />
            </View>
          </TouchableOpacity>

          {/* Session Status */}
          <View style={[styles.sessionBadge, { backgroundColor: authStatusColor }]}>
            <Ionicons name={sessionBadgeIcon} size={16} color="white" />
            <ThemedText style={styles.sessionBadgeText}>{sessionBadgeText}</ThemedText>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>

          <View style={styles.statsGrid}>
            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: surfaceColor,
                  borderColor: cardBorderColor,
                  borderWidth: StyleSheet.hairlineWidth,
                  shadowOpacity: isDark ? 0 : 0.1,
                  elevation: isDark ? 0 : 3,
                },
              ]}
            >
              <ThemedText style={styles.statValue}>{successRateDisplay}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                Success Rate
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: surfaceColor,
                  borderColor: cardBorderColor,
                  borderWidth: StyleSheet.hairlineWidth,
                  shadowOpacity: isDark ? 0 : 0.1,
                  elevation: isDark ? 0 : 3,
                },
              ]}
            >
              <ThemedText style={styles.statValue}>{totalAttemptsDisplay}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                Total Attempts
              </ThemedText>
            </View>

            <View
              style={[
                styles.statCard,
                {
                  backgroundColor: surfaceColor,
                  borderColor: cardBorderColor,
                  borderWidth: StyleSheet.hairlineWidth,
                  shadowOpacity: isDark ? 0 : 0.1,
                  elevation: isDark ? 0 : 3,
                },
              ]}
            >
              <ThemedText style={styles.statValue}>{weeklyAttemptsDisplay}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: mutedTextColor }]}>
                Attempts (Last 7 Days)
              </ThemedText>
            </View>
          </View>
        </View>

        {/* Recent Logs */}
        <View style={styles.logsSection}>
          <View style={styles.logsHeader}>
            <ThemedText style={styles.sectionTitle}>Recent Logs</ThemedText>
            <TouchableOpacity onPress={() => router.push('/logs')}>
              <ThemedText style={styles.viewAllText}>View All</ThemedText>
            </TouchableOpacity>
          </View>

          {recentLogs.length > 0 ? (
            <View style={styles.logsList}>
              {recentLogs.slice(0, 3).map((log) => (
                <View
                  key={log.id}
                  style={[
                    styles.logItem,
                    {
                      backgroundColor: listBackgroundColor,
                      borderColor: cardBorderColor,
                      borderWidth: StyleSheet.hairlineWidth,
                    },
                  ]}
                >
                  <Ionicons
                    name={
                      log.type === 'success' || log.type === 'pin_success' ? 'checkmark-circle' :
                      log.type === 'failure' || log.type === 'pin_failure' ? 'close-circle' :
                      'time'
                    }
                    size={16}
                    color={
                      log.type === 'success' || log.type === 'pin_success' ? '#34C759' :
                      log.type === 'failure' || log.type === 'pin_failure' ? '#FF3B30' :
                      '#FF9500'
                    }
                  />
                  <View style={styles.logContent}>
                    <ThemedText style={styles.logDetails}>{log.details}</ThemedText>
                    <ThemedText style={[styles.logTime, { color: secondaryTextColor }]}>
                      {new Date(log.timestamp).toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={[styles.noLogsText, { color: mutedTextColor }]}>
              No recent activity
            </ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    opacity: 0.7,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    alignItems: 'flex-end',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
  },
  statusSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 30,
  },
  eyeButton: {
    marginBottom: 20,
  },
  eyeCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  sessionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  sessionBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  statsSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  statCard: {
    flexGrow: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minWidth: 150,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  logsSection: {
    paddingHorizontal: 20,
    marginBottom: 80,
  },
  logsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  viewAllText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  logsList: {
    gap: 10,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    gap: 12,
  },
  logContent: {
    flex: 1,
  },
  logDetails: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  logTime: {
    fontSize: 12,
    opacity: 0.6,
  },
  noLogsText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    padding: 20,
  },
});
