import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function AboutScreen() {
  const handleContinue = () => {
    router.push('/onboarding/terms');
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
            <Ionicons name="information-circle" size={80} color="#FF9500" />
          </View>
          
          <ThemedText type="title" style={styles.title}>
            About Iris Auth Lite
          </ThemedText>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              How the pipeline works
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              We capture a five-frame burst for each eye, grade every frame with focus, exposure, occlusion, and iris size metrics, then fuse the best pick. The fused frame runs through our bundled QuickSRNet ONNX model for on-device super-resolution before verification.
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Built for offline privacy
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              • Frames, templates, and logs never leave your device{'\n'}
              • No external APIs or cloud calls are required{'\n'}
              • Secure Store keeps PINs and templates encrypted{'\n'}
              • Sessions auto-expire to prevent lingering access
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Optional hardware boost
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              Pair a Raspberry Pi capture rig over Bluetooth when you need dedicated imaging hardware. Prefer to stay lightweight? Skip it and use the device camera — the enhancement pipeline stays the same.
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Transparent diagnostics
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              Detailed quality summaries, fallback tips, and authentication logs help you tune lighting, distance, and stability without leaving the app.
            </ThemedText>
          </View>
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
  },
  iconContainer: {
    alignSelf: 'center',
    marginBottom: 30,
    padding: 20,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#007AFF',
  },
  sectionText: {
    fontSize: 16,
    lineHeight: 24,
    opacity: 0.8,
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
