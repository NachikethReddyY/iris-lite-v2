import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function ConnectPiScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [devices, setDevices] = useState<string[]>([]);

  useEffect(() => {
    // Mock Bluetooth scanning
    startBluetoothScan();
  }, []);

  const startBluetoothScan = async () => {
    setIsScanning(true);
    
    // Mock scanning process
    setTimeout(() => {
      setDevices(['Iris-Auth-Pi-001', 'Iris-Auth-Pi-002']);
      setIsScanning(false);
    }, 3000);
  };

  const handleConnect = (deviceName: string) => {
    setIsScanning(true);
    
    // Mock connection process
    setTimeout(() => {
      setIsConnected(true);
      setIsScanning(false);
      Alert.alert(
        'Connected',
        `Successfully connected to ${deviceName}`,
        [
          {
            text: 'Continue',
            onPress: () => router.push('/onboarding/iris-scan')
          }
        ]
      );
    }, 2000);
  };

  const handleSkip = () => {
    Alert.alert(
      'Skip Connection',
      'You can connect to Raspberry Pi later in settings. Continue with device camera?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Continue', onPress: () => router.push('/onboarding/iris-scan') }
      ]
    );
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="bluetooth" size={80} color="#007AFF" />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          Pair Optional Capture Rig
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          Link a Raspberry Pi “Magic Scanner” when you want dedicated optics. You can also skip and continue with the on-device camera — the enhancement pipeline stays entirely offline either way.
        </ThemedText>
        
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <Ionicons name="bluetooth" size={40} color="#007AFF" />
            <ThemedText style={styles.scanningText}>
              {isConnected ? 'Connecting...' : 'Scanning for devices...'}
            </ThemedText>
          </View>
        ) : (
          <View style={styles.devicesContainer}>
            {devices.length > 0 ? (
              <>
                <ThemedText style={styles.devicesTitle}>Available Devices:</ThemedText>
                {devices.map((device, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.deviceButton}
                    onPress={() => handleConnect(device)}
                  >
                    <Ionicons name="hardware-chip" size={24} color="#007AFF" />
                    <ThemedText style={styles.deviceName}>{device}</ThemedText>
                    <Ionicons name="chevron-forward" size={20} color="#999" />
                  </TouchableOpacity>
                ))}
              </>
            ) : (
              <View style={styles.noDevicesContainer}>
                <Ionicons name="bluetooth-disabled" size={40} color="#999" />
                <ThemedText style={styles.noDevicesText}>
                  No capture rigs detected
                </ThemedText>
                <ThemedText style={styles.noDevicesSubtext}>
                  Power on the Pi, enable Bluetooth, and keep it nearby to try again.
                </ThemedText>
              </View>
            )}
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity style={styles.rescanButton} onPress={startBluetoothScan}>
            <Ionicons name="refresh" size={20} color="#007AFF" />
            <ThemedText style={styles.rescanText}>Rescan</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
            <ThemedText style={styles.skipText}>Skip for now</ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
  },
  scanningContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  scanningText: {
    fontSize: 16,
    marginTop: 15,
    opacity: 0.8,
  },
  devicesContainer: {
    width: '100%',
    marginBottom: 40,
  },
  devicesTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  deviceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  deviceName: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 15,
  },
  noDevicesContainer: {
    alignItems: 'center',
    padding: 40,
  },
  noDevicesText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 15,
    marginBottom: 5,
  },
  noDevicesSubtext: {
    fontSize: 14,
    opacity: 0.7,
    textAlign: 'center',
  },
  actionsContainer: {
    width: '100%',
    gap: 15,
  },
  rescanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingVertical: 15,
    borderRadius: 25,
    gap: 10,
  },
  rescanText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  skipButton: {
    alignItems: 'center',
    paddingVertical: 15,
  },
  skipText: {
    fontSize: 16,
    color: '#999',
  },
});
