import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Markdown from 'react-native-markdown-display';

export default function TermsScreen() {
  const [termsContent, setTermsContent] = useState('');
  const [accepted, setAccepted] = useState(false);

  React.useEffect(() => {
    loadTermsContent();
  }, []);

  const loadTermsContent = async () => {
    // Hardcoded terms and conditions content
    setTermsContent(`
# Terms and Conditions - Iris Auth Lite

## Privacy Promise

### Data Collection & Storage
- **Iris Templates**: Captured frames are fused, enhanced with the on-device QuickSRNet model, and converted into templates that never leave your device.
- **Auth Logs**: Verification summaries are stored locally so you can review activity. No remote telemetry is collected.
- **PIN Codes**: Stored with hardware-backed encryption using Expo Secure Store.

### Processing Pipeline
- **Offline Verified**: Capture, quality scoring, fusion, super-resolution, and matching all run on-device. There are no cloud calls or third-party services.
- **Optional Hardware**: If you pair a Raspberry Pi capture rig, frames still process locally on your phone after transfer.
- **Data Retention**: Raw frames are discarded once enhancement completes. Templates and logs remain until you remove them from Settings.

## Terms of Use

### Acceptable Use
1. **Single-User Focus**: Designed for personal authentication scenarios.
2. **Lawful Use Only**: Do not scan users without their explicit consent.
3. **Respect the App**: Avoid reverse-engineering or bypassing security safeguards.

### Your Responsibilities
1. **Safeguard Your PIN**: Keep your fallback PIN private.
2. **Maintain Device Security**: Use a passcode and keep your OS updated.
3. **Bluetooth Awareness**: When pairing hardware, ensure you are connecting to trusted devices.

### Limitations
1. **No Warranty**: Provided “as is”. Accuracy can vary with lighting, distance, and movement.
2. **Hardware Variance**: Performance depends on camera quality and device processing power.
3. **Session Control**: Authentication sessions auto-expire; re-authentication may be required.

By continuing, you confirm you have read and agree to these terms and the privacy commitments above.
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
