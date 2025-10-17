import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function SettingsScreen() {
  const { logout } = useAuth();
  const [sessionTimeout, setSessionTimeout] = useState(10);
  const [livenessDetection, setLivenessDetection] = useState(true);
  const [multiFactor, setMultiFactor] = useState(false);
  const [hasIrisTemplate, setHasIrisTemplate] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const timeout = authService.getSessionTimeout();
      setSessionTimeout(timeout / (60 * 1000)); // Convert to minutes
      
      const template = await authService.getIrisTemplate();
      setHasIrisTemplate(!!template);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleChangePIN = () => {
    Alert.alert('Change PIN', 'PIN change functionality will be implemented in a future update.');
  };

  const handleReenrollIris = () => {
    Alert.alert(
      'Re-enroll Iris',
      'This will delete your current iris template and require you to scan again. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Continue', 
          style: 'destructive',
          onPress: () => {
            router.push('/onboarding/iris-scan');
          }
        }
      ]
    );
  };

  const handleDeleteAllData = () => {
    Alert.alert(
      'Delete All Data',
      'This will permanently delete all your iris data, PIN, and logs. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete All Data',
          style: 'destructive',
          onPress: () => {
            // First verify PIN before allowing deletion
            Alert.prompt(
              'Verify PIN',
              'Please enter your PIN to confirm deletion of all data:',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Verify & Delete',
                  style: 'destructive',
                  onPress: async (enteredPIN?: string) => {
                    if (!enteredPIN) {
                      Alert.alert('Error', 'PIN is required to delete data.');
                      return;
                    }

                    try {
                      const isValidPIN = await authService.verifyPIN(enteredPIN);
                      if (!isValidPIN) {
                        Alert.alert('Error', 'Invalid PIN. Please try again.');
                        return;
                      }

                      // PIN verified, proceed with deletion
                      await authService.deleteIrisTemplate();
                      await authService.clearAuthLogs();
                      await SecureStore.deleteItemAsync('user_pin');
                      await SecureStore.deleteItemAsync('isAuthenticated');
                      await SecureStore.deleteItemAsync('session_expiry');

                      Alert.alert(
                        'Data Deleted',
                        'All data has been permanently deleted.',
                        [{ text: 'OK', onPress: logout }]
                      );
                    } catch (error) {
                      Alert.alert('Error', 'Failed to delete data. Please try again.');
                    }
                  }
                }
              ],
              'secure-text'
            );
          }
        }
      ]
    );
  };

  const handleSessionTimeoutChange = (value: number) => {
    setSessionTimeout(value);
    authService.setSessionTimeout(value * 60 * 1000); // Convert to milliseconds
  };

  const handleSignOut = () => {
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

  const SettingItem = ({ 
    icon, 
    title, 
    subtitle, 
    onPress, 
    rightElement, 
    destructive = false 
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    onPress?: () => void;
    rightElement?: React.ReactNode;
    destructive?: boolean;
  }) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons 
          name={icon as any} 
          size={24} 
          color={destructive ? '#FF3B30' : '#007AFF'} 
        />
        <View style={styles.settingText}>
          <ThemedText style={[styles.settingTitle, destructive && styles.destructiveText]}>
            {title}
          </ThemedText>
          {subtitle && (
            <ThemedText style={styles.settingSubtitle}>{subtitle}</ThemedText>
          )}
        </View>
      </View>
      {rightElement || (onPress && (
        <Ionicons name="chevron-forward" size={20} color="#999" />
      ))}
    </TouchableOpacity>
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={styles.headerTitle}>
            Settings
          </ThemedText>
        </View>

        {/* Authentication Settings */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Authentication
          </ThemedText>
          
          <SettingItem
            icon="key"
            title="Change PIN"
            subtitle="Update your security PIN"
            onPress={handleChangePIN}
          />
          
          <SettingItem
            icon="eye"
            title="Re-enroll Iris"
            subtitle={hasIrisTemplate ? "Update your iris template" : "No iris template found"}
            onPress={handleReenrollIris}
          />
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="time" size={24} color="#007AFF" />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>Session Timeout</ThemedText>
                <ThemedText style={styles.settingSubtitle}>
                  {sessionTimeout} minutes
                </ThemedText>
              </View>
            </View>
          </View>
          <View style={styles.timeoutContainer}>
            {[1, 5, 10, 30].map((minutes) => (
              <TouchableOpacity
                key={minutes}
                style={[
                  styles.timeoutButton,
                  sessionTimeout === minutes && styles.timeoutButtonActive
                ]}
                onPress={() => handleSessionTimeoutChange(minutes)}
              >
                <ThemedText style={[
                  styles.timeoutButtonText,
                  sessionTimeout === minutes && styles.timeoutButtonTextActive
                ]}>
                  {minutes}m
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="scan" size={24} color="#007AFF" />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>Liveness Detection</ThemedText>
                <ThemedText style={styles.settingSubtitle}>
                  Detect if user is alive during scan
                </ThemedText>
              </View>
            </View>
            <Switch
              value={livenessDetection}
              onValueChange={setLivenessDetection}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={livenessDetection ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Ionicons name="shield-checkmark" size={24} color="#007AFF" />
              <View style={styles.settingText}>
                <ThemedText style={styles.settingTitle}>Multi-Factor Authentication</ThemedText>
                <ThemedText style={styles.settingSubtitle}>
                  Require both iris and PIN
                </ThemedText>
              </View>
            </View>
            <Switch
              value={multiFactor}
              onValueChange={setMultiFactor}
              trackColor={{ false: '#E0E0E0', true: '#007AFF' }}
              thumbColor={multiFactor ? '#FFFFFF' : '#FFFFFF'}
            />
          </View>
        </ThemedView>

        {/* Privacy & Security */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Privacy & Security
          </ThemedText>
          
          <SettingItem
            icon="document-text"
            title="Privacy Policy"
            subtitle="View our privacy policy"
            onPress={() => Alert.alert('Privacy Policy', 'Privacy policy will be displayed here in a future update.')}
          />
          
          <SettingItem
            icon="trash"
            title="Delete All Data"
            subtitle="Permanently remove all stored data"
            onPress={handleDeleteAllData}
            destructive
          />
        </ThemedView>

        {/* Device Settings */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle" style={styles.sectionTitle}>
            Device
          </ThemedText>
          
          <SettingItem
            icon="bluetooth"
            title="Bluetooth Settings"
            subtitle="Manage Magic Scanner connection"
            onPress={() => Alert.alert('Bluetooth', 'Bluetooth settings will be implemented in a future update.')}
          />

          <SettingItem
            icon="information-circle"
            title="About"
            subtitle="App version and information"
            onPress={() => Alert.alert('About', 'Iris-Auth v1.0.0\nSecure biometric authentication powered by AI')}
          />
        </ThemedView>

        {/* Sign Out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          <ThemedText style={styles.signOutText}>Sign Out</ThemedText>
        </TouchableOpacity>
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
      padding: 20,
    },
    header: {
      marginBottom: 30,
      paddingTop: 60,
    },
    headerTitle: {
      fontSize: 32,
      fontWeight: 'bold',
      color: '#000',
    },
  section: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#007AFF',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 15,
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
    opacity: 0.7,
  },
  destructiveText: {
    color: '#FF3B30',
  },
  timeoutContainer: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    paddingLeft: 39, // Align with the text
  },
  timeoutButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  timeoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    backgroundColor: '#E0E0E0',
  },
  timeoutButtonActive: {
    backgroundColor: '#007AFF',
  },
  timeoutButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#666',
  },
  timeoutButtonTextActive: {
    color: 'white',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 59, 48, 0.1)',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    marginBottom: 30,
  },
  signOutText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FF3B30',
  },
});
