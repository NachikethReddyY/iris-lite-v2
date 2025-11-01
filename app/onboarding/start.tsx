import React from 'react';
import { View, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function StartScreen() {
  const handleGetStarted = () => {
    router.push('/onboarding/landing');
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>
        
        <ThemedText type="title" style={styles.title}>
          Iris Auth Lite
        </ThemedText>
        
        <ThemedText style={styles.subtitle}>
          On-device iris security from capture to match
        </ThemedText>
        
        <ThemedText style={styles.description}>
          Capture dual-eye bursts, enhance them with our QuickSRNet super-resolution model, and verify locally — no cloud services required.
        </ThemedText>
        
        <TouchableOpacity style={styles.getStartedButton} onPress={handleGetStarted}>
          <ThemedText style={styles.buttonText}>Get Started</ThemedText>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 300,
  },
  logoContainer: {
    marginBottom: 40,
    padding: 30,
    borderRadius: 80,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    marginBottom: 20,
    textAlign: 'center',
    opacity: 0.8,
  },
  description: {
    fontSize: 16,
    marginBottom: 50,
    textAlign: 'center',
    lineHeight: 24,
    opacity: 0.7,
  },
  getStartedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 50,
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
