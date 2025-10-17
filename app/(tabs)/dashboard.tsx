import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { authService, AuthStats, AuthLog } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function DashboardScreen() {
  const { logout, user, sessionExpiry } = useAuth();
  const [stats, setStats] = useState<AuthStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<AuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
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
  };

  const handleAuthenticate = () => {
    router.push('/iris-verification');
  };

  const handleSignOut = async () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await logout();
              router.replace('/onboarding/start');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

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
            <ThemedText style={styles.welcomeText}>Welcome back!</ThemedText>
          </View>
          <View style={styles.headerRight}>
            <ThemedText style={styles.dayText}>{currentDateInfo.day}</ThemedText>
            <ThemedText style={styles.dateText}>{currentDateInfo.date}</ThemedText>
          </View>
        </View>

        {/* Authentication Status */}
        <View style={styles.statusSection}>
          <ThemedText style={styles.statusTitle}>Authenticated</ThemedText>
          <ThemedText style={styles.statusSubtitle}>Tap to verify your identity</ThemedText>

          {/* Large Eye Icon Circle */}
          <TouchableOpacity style={styles.eyeButton} onPress={handleAuthenticate}>
            <View style={styles.eyeCircle}>
              <Ionicons name="eye" size={60} color="white" />
            </View>
          </TouchableOpacity>

          {/* Magic Scanner Status */}
          <View style={styles.warningBadge}>
            <Ionicons name="warning" size={16} color="white" />
            <ThemedText style={styles.warningText}>Magic Scanner: Not Connected</ThemedText>
          </View>
        </View>

        {/* Statistics */}
        <View style={styles.statsSection}>
          <ThemedText style={styles.sectionTitle}>Statistics</ThemedText>

          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>100%</ThemedText>
              <ThemedText style={styles.statLabel}>Success Rate</ThemedText>
            </View>

            <View style={styles.statCard}>
              <ThemedText style={styles.statValue}>0</ThemedText>
              <ThemedText style={styles.statLabel}>Total Attempts</ThemedText>
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
                <View key={log.id} style={styles.logItem}>
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
                    <ThemedText style={styles.logTime}>
                      {new Date(log.timestamp).toLocaleString()}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <ThemedText style={styles.noLogsText}>No recent activity</ThemedText>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#000',
    marginBottom: 5,
  },
  welcomeText: {
    fontSize: 16,
    color: '#666',
  },
  dayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  statusSection: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  statusTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 5,
  },
  statusSubtitle: {
    fontSize: 14,
    color: '#666',
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
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF3B30',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  warningText: {
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
    color: '#000',
    marginBottom: 15,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  logsSection: {
    paddingHorizontal: 20,
    marginBottom: 100,
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
    backgroundColor: 'white',
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
    color: '#000',
  },
  logTime: {
    fontSize: 12,
    opacity: 0.6,
    color: '#666',
  },
  noLogsText: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
    padding: 20,
    color: '#666',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 15,
  },
  navText: {
    fontSize: 12,
    color: '#007AFF',
    marginTop: 2,
  },
  navTextInactive: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
});
