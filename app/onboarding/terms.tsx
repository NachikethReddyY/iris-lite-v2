import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';
import * as FileSystem from 'expo-file-system/legacy';

export default function TermsScreen() {
  const [termsContent, setTermsContent] = useState('');
  const [accepted, setAccepted] = useState(false);

  React.useEffect(() => {
    loadTermsContent();
  }, []);

  const loadTermsContent = async () => {
    // Hardcoded terms and conditions content
    setTermsContent(`
# Terms and Conditions - Iris-Auth

## Privacy Policy

### Data Collection and Storage
- **Biometric Data**: Your iris templates are processed and stored exclusively on your device. No biometric data is transmitted to external servers.
- **Authentication Logs**: Anonymous authentication attempts are logged locally for security monitoring.
- **PIN Data**: Your PIN is encrypted and stored securely on-device using industry-standard encryption.

### Data Processing
- **On-Device Processing**: All iris scanning and verification occurs locally on your device.
- **AI Enhancement**: Low-quality camera inputs may be enhanced using on-device AI processing.
- **No Cloud Storage**: Your biometric data never leaves your device or is stored in cloud services.

## Terms of Service

### Acceptable Use
1. **Single User**: This application is designed for single-user authentication only.
2. **Personal Use**: Intended for personal access control and device security.
3. **No Misuse**: Users may not attempt to reverse engineer, modify, or exploit the application.

### Security Responsibilities
1. **PIN Security**: Users are responsible for maintaining the confidentiality of their PIN.
2. **Device Security**: Users must ensure their device remains secure and updated.
3. **Bluetooth Security**: Users are responsible for maintaining secure Bluetooth connections to their Magic Scanner.

### Limitations
1. **No Warranty**: The application is provided "as is" without warranty of any kind.
2. **Accuracy**: While designed for high accuracy, biometric authentication may have false positives/negatives.
3. **Device Compatibility**: Performance may vary based on device capabilities and camera quality.

By using Iris-Auth, you acknowledge that you have read, understood, and agree to be bound by these Terms and Conditions and Privacy Policy.
    `);
  };

  const handleAccept = () => {
    if (!accepted) {
      Alert.alert(
        'Accept Terms',
        'Please read and accept the terms and conditions to continue.',
        [{ text: 'OK' }]
      );
      return;
    }
    router.push('/onboarding/create-pin');
  };

  const handleBack = () => {
    router.back();
  };

  const markdownStyles = {
    body: {
      color: '#333',
      fontSize: 16,
      lineHeight: 24,
    },
    heading1: {
      color: '#007AFF',
      fontSize: 24,
      fontWeight: 'bold' as const,
      marginBottom: 16,
    },
    heading2: {
      color: '#007AFF',
      fontSize: 20,
      fontWeight: '600' as const,
      marginTop: 20,
      marginBottom: 12,
    },
    heading3: {
      color: '#007AFF',
      fontSize: 18,
      fontWeight: '600' as const,
      marginTop: 16,
      marginBottom: 8,
    },
    paragraph: {
      marginBottom: 12,
    },
    list_item: {
      marginBottom: 8,
    },
    strong: {
      fontWeight: 'bold' as const,
    },
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText type="title" style={styles.headerTitle}>
          Terms & Conditions
        </ThemedText>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {termsContent ? (
            <Markdown style={markdownStyles}>
              {termsContent}
            </Markdown>
          ) : (
            <ThemedText>Loading terms and conditions...</ThemedText>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.acceptButton, accepted && styles.acceptButtonActive]}
          onPress={() => setAccepted(!accepted)}
        >
          <Ionicons 
            name={accepted ? "checkmark-circle" : "ellipse-outline"} 
            size={24} 
            color={accepted ? "#34C759" : "#999"} 
          />
          <ThemedText style={[styles.acceptText, accepted && styles.acceptTextActive]}>
            I have read and accept the Terms and Conditions
          </ThemedText>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.continueButton, !accepted && styles.continueButtonDisabled]} 
          onPress={handleAccept}
          disabled={!accepted}
        >
          <ThemedText style={styles.buttonText}>Accept & Continue</ThemedText>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  content: {
    paddingBottom: 20,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingVertical: 10,
  },
  acceptButtonActive: {
    // Active state styling
  },
  acceptText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#999',
  },
  acceptTextActive: {
    color: '#34C759',
    fontWeight: '500',
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
  continueButtonDisabled: {
    backgroundColor: '#E0E0E0',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
