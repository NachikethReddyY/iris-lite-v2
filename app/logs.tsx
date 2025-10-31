import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService, AuthLog } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';

export const options = {
  title: 'Authentication Logs',
};

export default function LogsScreen() {
  const [logs, setLogs] = useState<AuthLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setIsLoading(true);
      const authLogs = await authService.getAuthLogs();
      setLogs(authLogs);
    } catch (error) {
      console.error('Error loading logs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
      case 'pin_success':
        return 'checkmark-circle';
      case 'failure':
      case 'pin_failure':
        return 'close-circle';
      case 'expired':
        return 'time';
      default:
        return 'information-circle';
    }
  };

  const getLogColor = (type: string) => {
    switch (type) {
      case 'success':
      case 'pin_success':
        return '#34C759';
      case 'failure':
      case 'pin_failure':
        return '#FF3B30';
      case 'expired':
        return '#FF9500';
      default:
        return '#007AFF';
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ThemedText>Loading logs...</ThemedText>
          </View>
        ) : logs.length > 0 ? (
          <View style={styles.contentWrapper}>
            <View style={styles.logsList}>
              {logs.map((log) => (
                <View key={log.id} style={styles.logItem}>
                  <View style={styles.logLeft}>
                    <Ionicons
                      name={getLogIcon(log.type)}
                      size={20}
                      color={getLogColor(log.type)}
                    />
                    <View style={styles.logContent}>
                      <ThemedText style={styles.logDetails}>{log.details}</ThemedText>
                      <ThemedText style={styles.logTime}>
                        {new Date(log.timestamp).toLocaleString()}
                      </ThemedText>
                      {log.confidence && (
                        <ThemedText style={styles.logConfidence}>
                          Confidence: {Math.round(log.confidence * 100)}%
                        </ThemedText>
                      )}
                    </View>
                  </View>
                  <ThemedText style={[styles.logType, { color: getLogColor(log.type) }]}>
                    {log.type.replace('_', ' ').toUpperCase()}
                  </ThemedText>
                </View>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.contentWrapper}>
            <View style={styles.emptyContainer}>
              <Ionicons name="document-text-outline" size={48} color="#999" />
              <ThemedText style={styles.emptyText}>No authentication logs found</ThemedText>
            </View>
          </View>
        )}
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  contentWrapper: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    paddingTop: 16,
    gap: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logsList: {
    gap: 15,
  },
  logItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  logContent: {
    marginLeft: 15,
    flex: 1,
  },
  logDetails: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#000',
  },
  logTime: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  logConfidence: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  logType: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 15,
  },
});
