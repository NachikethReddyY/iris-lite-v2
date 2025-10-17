import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function LandingScreen() {
  const handleContinue = () => {
    router.push('/onboarding/about');
  };

  const handleBack = () => {
    router.back();
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#007AFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={80} color="#34C759" />
          </View>
          
          <ThemedText type="title" style={styles.title}>
            Welcome to Iris-Auth
          </ThemedText>
          
          <ThemedText style={styles.subtitle}>
            Your secure biometric authentication solution
          </ThemedText>
          
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons name="eye" size={24} color="#007AFF" />
              <ThemedText style={styles.featureText}>
                Advanced iris scanning technology
              </ThemedText>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="lock-closed" size={24} color="#34C759" />
              <ThemedText style={styles.featureText}>
                PIN fallback for reliability
              </ThemedText>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="phone-portrait" size={24} color="#FF9500" />
              <ThemedText style={styles.featureText}>
                Raspberry Pi integration
              </ThemedText>
            </View>
            
            <View style={styles.featureItem}>
              <Ionicons name="cloud-offline" size={24} color="#AF52DE" />
              <ThemedText style={styles.featureText}>
                On-device processing only
              </ThemedText>
            </View>
          </View>
          
          <ThemedText style={styles.description}>
            Iris-Auth provides secure, reliable biometric authentication using your unique iris pattern. 
            All processing happens on your device for maximum privacy and security.
          </ThemedText>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <ThemedText style={styles.buttonText}>Continue</ThemedText>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 30,
  },
  backButton: {
    padding: 10,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    textAlign: 'center',
    opacity: 0.8,
  },
  featuresList: {
    width: '100%',
    marginBottom: 40,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  featureText: {
    fontSize: 16,
    marginLeft: 15,
    flex: 1,
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
    marginBottom: 40,
  },
  footer: {
    padding: 20,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    width: '100%',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
