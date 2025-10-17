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
            About Iris-Auth
          </ThemedText>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              How It Works
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              Iris-Auth captures 8 high-quality frames of your iris using advanced camera technology. 
              These frames are processed using AI enhancement and stored securely on your device.
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Privacy & Security
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              • All biometric data stays on your device{'\n'}
              • No data is transmitted to external servers{'\n'}
              • PIN fallback ensures reliable access{'\n'}
              • Session timeouts protect against unauthorized use
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              Raspberry Pi Integration
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              Connect to your Raspberry Pi via Bluetooth for enhanced iris capture capabilities. 
              The Pi provides specialized camera hardware for optimal biometric scanning.
            </ThemedText>
          </View>
          
          <View style={styles.section}>
            <ThemedText type="subtitle" style={styles.sectionTitle}>
              AI Enhancement
            </ThemedText>
            <ThemedText style={styles.sectionText}>
              Low-quality camera inputs are enhanced using on-device AI processing to improve 
              recognition accuracy and reliability.
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
