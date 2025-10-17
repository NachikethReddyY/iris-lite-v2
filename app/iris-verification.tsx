import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService, AuthLog } from '@/services/authService';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

export default function IrisVerificationScreen() {
  const [currentFrame, setCurrentFrame] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [frames, setFrames] = useState<string[]>([]);
  const [quality, setQuality] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    confidence: number;
    details: string;
    errors: string[];
    improvements: string[];
  } | null>(null);

  const totalFrames = 8;

  useEffect(() => {
    if (isScanning && currentFrame < totalFrames) {
      const timer = setTimeout(() => {
        captureFrame();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isScanning, currentFrame]);

  const captureFrame = async () => {
    try {
      // Mock frame capture
      const frameData = `mock_verification_frame_${currentFrame}_${Date.now()}`;
      const newFrames = [...frames, frameData];
      setFrames(newFrames);

      // Mock quality assessment
      const frameQuality = Math.random() * 0.3 + 0.7; // 70-100%
      setQuality(frameQuality);

      if (currentFrame < totalFrames - 1) {
        setCurrentFrame(currentFrame + 1);
      } else {
        // All frames captured
        setIsScanning(false);
        setIsComplete(true);
        await processVerification(newFrames);
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
      Alert.alert('Error', 'Failed to capture frame. Please try again.');
      setIsScanning(false);
    }
  };

  const processVerification = async (capturedFrames: string[]) => {
    try {
      // Verify iris match
      const result = await authService.verifyIrisMatch(capturedFrames);
      setVerificationResult({
        ...result,
        errors: generateErrors(result.confidence),
        improvements: generateImprovements(result.confidence)
      });

      // Add verification log
      await authService.addAuthLog({
        timestamp: Date.now(),
        type: result.success ? 'success' : 'failure',
        details: result.details,
        confidence: result.confidence
      });

    } catch (error) {
      console.error('Error processing verification:', error);
      Alert.alert('Error', 'Failed to process iris verification. Please try again.');
    }
  };

  const generateErrors = (confidence: number): string[] => {
    const errors: string[] = [];
    if (confidence < 0.7) errors.push('Low image quality detected');
    if (confidence < 0.6) errors.push('Poor lighting conditions');
    if (confidence < 0.5) errors.push('Eye not properly positioned');
    if (confidence < 0.4) errors.push('Movement detected during scan');
    return errors;
  };

  const generateImprovements = (confidence: number): string[] => {
    const improvements: string[] = [];
    if (confidence < 0.7) improvements.push('Ensure better lighting');
    if (confidence < 0.6) improvements.push('Keep your eye steady and open');
    if (confidence < 0.5) improvements.push('Position your eye in the center of the circle');
    if (confidence < 0.4) improvements.push('Avoid blinking during the scan');
    return improvements;
  };

  const startScanning = () => {
    setIsScanning(true);
    setCurrentFrame(0);
    setFrames([]);
    setQuality(0);
    setIsComplete(false);
    setVerificationResult(null);
  };

  const handleComplete = () => {
    if (verificationResult?.success) {
      router.replace('/(tabs)/dashboard');
    } else {
      // Reset for retry
      setIsComplete(false);
      setVerificationResult(null);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const getStatusText = () => {
    if (isComplete && verificationResult) {
      return verificationResult.success ? 'Verification Successful!' : 'Verification Failed';
    }
    if (isScanning) return `Capturing frame ${currentFrame + 1} of ${totalFrames}`;
    return 'Ready to verify iris';
  };

  const getStatusColor = () => {
    if (isComplete && verificationResult) {
      return verificationResult.success ? '#34C759' : '#FF3B30';
    }
    if (isScanning) return '#007AFF';
    return '#999';
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <ThemedText style={styles.title}>
            Iris Verification
          </ThemedText>

          <ThemedText style={styles.subtitle}>
            {isComplete && verificationResult
              ? (verificationResult.success
                  ? 'Your iris has been successfully verified!'
                  : 'Verification failed. Please review the errors and try again.')
              : 'Position your eye in the center and look directly at the camera'
            }
          </ThemedText>

          {/* Camera Frame */}
          <View style={styles.cameraContainer}>
            <View style={[styles.cameraFrame, { borderColor: getStatusColor() }]}>
              <Ionicons name="eye" size={80} color={getStatusColor()} />
            </View>
          </View>

          {/* Progress */}
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${((currentFrame + (isComplete ? 1 : 0)) / totalFrames) * 100}%` }
                ]}
              />
            </View>
            <ThemedText style={styles.progressText}>
              {currentFrame + (isComplete ? 1 : 0)} / {totalFrames} frames
            </ThemedText>
          </View>

          {/* Status */}
          <View style={styles.statusContainer}>
            <Ionicons
              name={isComplete ? (verificationResult?.success ? "checkmark-circle" : "close-circle") : "scan"}
              size={24}
              color={getStatusColor()}
            />
            <ThemedText style={[styles.statusText, { color: getStatusColor() }]}>
              {getStatusText()}
            </ThemedText>
          </View>

          {/* Verification Result */}
          {isComplete && verificationResult && (
            <View style={styles.resultContainer}>
              <View style={styles.confidenceContainer}>
                <ThemedText style={styles.confidenceLabel}>Confidence:</ThemedText>
                <ThemedText style={[styles.confidenceValue, { color: verificationResult.success ? '#34C759' : '#FF3B30' }]}>
                  {Math.round(verificationResult.confidence * 100)}%
                </ThemedText>
              </View>

              {verificationResult.errors.length > 0 && (
                <View style={styles.errorsContainer}>
                  <ThemedText style={styles.errorsTitle}>Issues Detected:</ThemedText>
                  {verificationResult.errors.map((error, index) => (
                    <View key={index} style={styles.errorItem}>
                      <Ionicons name="warning" size={16} color="#FF3B30" />
                      <ThemedText style={styles.errorText}>{error}</ThemedText>
                    </View>
                  ))}
                </View>
              )}

              {verificationResult.improvements.length > 0 && (
                <View style={styles.improvementsContainer}>
                  <ThemedText style={styles.improvementsTitle}>How to Improve:</ThemedText>
                  {verificationResult.improvements.map((improvement, index) => (
                    <View key={index} style={styles.improvementItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                      <ThemedText style={styles.improvementText}>{improvement}</ThemedText>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Instructions */}
          <View style={styles.instructionsContainer}>
            <ThemedText style={styles.instructionsTitle}>Instructions:</ThemedText>
            <ThemedText style={styles.instructionText}>
              • Keep your eye steady and open{'\n'}
              • Look directly at the camera{'\n'}
              • Ensure good lighting{'\n'}
              • Don't blink during capture
            </ThemedText>
          </View>

          {/* Action Button */}
          {!isScanning && !isComplete && (
            <TouchableOpacity style={styles.startButton} onPress={startScanning}>
              <Ionicons name="scan" size={24} color="white" />
              <ThemedText style={styles.buttonText}>Start Verification</ThemedText>
            </TouchableOpacity>
          )}

          {isComplete && (
            <TouchableOpacity
              style={[
                styles.completeButton,
                verificationResult?.success ? styles.successButton : styles.retryButton
              ]}
              onPress={handleComplete}
            >
              <ThemedText style={styles.buttonText}>
                {verificationResult?.success ? 'Continue to Dashboard' : 'Try Again'}
              </ThemedText>
              <Ionicons
                name={verificationResult?.success ? "checkmark" : "refresh"}
                size={20}
                color="white"
              />
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
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
    color: '#000',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#000',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.8,
    lineHeight: 22,
    paddingHorizontal: 20,
    color: '#666',
  },
  cameraContainer: {
    marginBottom: 30,
    alignItems: 'center',
  },
  cameraFrame: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    position: 'relative',
    overflow: 'hidden',
  },
  progressContainer: {
    width: '100%',
    marginBottom: 20,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    marginTop: 10,
    fontSize: 14,
    opacity: 0.7,
    color: '#666',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 10,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '500',
  },
  resultContainer: {
    width: '100%',
    marginBottom: 30,
  },
  confidenceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 10,
  },
  confidenceLabel: {
    fontSize: 16,
    color: '#666',
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  errorsContainer: {
    marginBottom: 20,
  },
  errorsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF3B30',
    marginBottom: 10,
  },
  errorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    flex: 1,
  },
  improvementsContainer: {
    marginBottom: 20,
  },
  improvementsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#34C759',
    marginBottom: 10,
  },
  improvementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  improvementText: {
    fontSize: 14,
    color: '#34C759',
    flex: 1,
  },
  instructionsContainer: {
    width: '100%',
    marginBottom: 30,
    padding: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 15,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#000',
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 22,
    opacity: 0.8,
    color: '#666',
  },
  startButton: {
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
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 50,
    paddingVertical: 18,
    borderRadius: 30,
    gap: 10,
    width: '100%',
  },
  successButton: {
    backgroundColor: '#34C759',
  },
  retryButton: {
    backgroundColor: '#FF3B30',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});
