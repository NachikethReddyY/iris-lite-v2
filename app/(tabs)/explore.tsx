import React, { useState } from 'react';
import { Image } from 'expo-image';
import { Platform, StyleSheet, TouchableOpacity, Alert, ActivityIndicator, View } from 'react-native';

import { Collapsible } from '@/components/ui/collapsible';
import { ExternalLink } from '@/components/external-link';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Fonts } from '@/constants/theme';
import { authService } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';

export default function TabTwoScreen() {
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState('');

  const handleAIScan = async () => {
    try {
      setIsScanning(true);
      // For demo purposes, we'll use a sample prompt instead of actual image scanning
      const samplePrompt = "Analyze this sample image: A modern smartphone with biometric authentication features, showing a fingerprint scanner and facial recognition technology.";
      const result = await authService.generateAIResponse(samplePrompt);
      setScanResult(result);
    } catch (error) {
      Alert.alert('Error', 'Failed to perform AI scan. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
      headerImage={
        <IconSymbol
          size={310}
          color="#808080"
          name="chevron.left.forwardslash.chevron.right"
          style={styles.headerImage}
        />
      }>
      <ThemedView style={styles.titleContainer}>
        <ThemedText
          type="title"
          style={{
            fontFamily: Fonts.rounded,
          }}>
          Iris Scanner
        </ThemedText>
      </ThemedView>
      <ThemedText>Advanced iris scanning technology for secure authentication.</ThemedText>
      {/* AI Scan Section */}
      <ThemedView style={styles.scanSection}>
        <ThemedText type="subtitle" style={styles.sectionTitle}>
          Iris Authentication
        </ThemedText>
        <ThemedText style={styles.sectionDescription}>
          Use your iris pattern for secure authentication
        </ThemedText>
        
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonDisabled]}
          onPress={handleAIScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="eye" size={24} color="white" />
              <ThemedText style={styles.scanButtonText}>
                Scan Iris
              </ThemedText>
            </>
          )}
        </TouchableOpacity>

        {scanResult ? (
          <View style={styles.resultContainer}>
            <ThemedText style={styles.resultLabel}>Scan Result:</ThemedText>
            <ThemedText style={styles.resultText}>{scanResult}</ThemedText>
          </View>
        ) : null}
      </ThemedView>

      <Collapsible title="Biometric Authentication">
        <ThemedText>
          Iris-Auth uses advanced biometric authentication including fingerprint scanning and facial recognition.
        </ThemedText>
        <ThemedText>
          Your biometric data is processed securely on-device and never leaves your device.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/versions/latest/sdk/local-authentication/">
          <ThemedText type="link">Learn more about biometric auth</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Android, iOS, and web support">
        <ThemedText>
          You can open this project on Android, iOS, and the web. To open the web version, press{' '}
          <ThemedText type="defaultSemiBold">w</ThemedText> in the terminal running this project.
        </ThemedText>
      </Collapsible>
      <Collapsible title="Images">
        <ThemedText>
          For static images, you can use the <ThemedText type="defaultSemiBold">@2x</ThemedText> and{' '}
          <ThemedText type="defaultSemiBold">@3x</ThemedText> suffixes to provide files for
          different screen densities
        </ThemedText>
        <Image
          source={require('@/assets/images/react-logo.png')}
          style={{ width: 100, height: 100, alignSelf: 'center' }}
        />
        <ExternalLink href="https://reactnative.dev/docs/images">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Light and dark mode components">
        <ThemedText>
          This template has light and dark mode support. The{' '}
          <ThemedText type="defaultSemiBold">useColorScheme()</ThemedText> hook lets you inspect
          what the user&apos;s current color scheme is, and so you can adjust UI colors accordingly.
        </ThemedText>
        <ExternalLink href="https://docs.expo.dev/develop/user-interface/color-themes/">
          <ThemedText type="link">Learn more</ThemedText>
        </ExternalLink>
      </Collapsible>
      <Collapsible title="Animations">
        <ThemedText>
          This template includes an example of an animated component. The{' '}
          <ThemedText type="defaultSemiBold">components/HelloWave.tsx</ThemedText> component uses
          the powerful{' '}
          <ThemedText type="defaultSemiBold" style={{ fontFamily: Fonts.mono }}>
            react-native-reanimated
          </ThemedText>{' '}
          library to create a waving hand animation.
        </ThemedText>
        {Platform.select({
          ios: (
            <ThemedText>
              The <ThemedText type="defaultSemiBold">components/ParallaxScrollView.tsx</ThemedText>{' '}
              component provides a parallax effect for the header image.
            </ThemedText>
          ),
        })}
      </Collapsible>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: '#808080',
    bottom: -90,
    left: -35,
    position: 'absolute',
  },
  titleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  scanSection: {
    marginVertical: 20,
    padding: 20,
    borderRadius: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 5,
  },
  sectionDescription: {
    fontSize: 14,
    opacity: 0.7,
    marginBottom: 20,
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 18,
    borderRadius: 30,
    marginBottom: 20,
    gap: 10,
    width: '100%',
  },
  scanButtonDisabled: {
    opacity: 0.6,
  },
  scanButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#34C759',
  },
  resultLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#34C759',
  },
  resultText: {
    fontSize: 14,
    lineHeight: 20,
  },
});
