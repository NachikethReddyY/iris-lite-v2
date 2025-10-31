import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { authService } from '@/services/authService';
import { IRIS_CAPTURE_CONFIG } from '@/services/iris/config';
import type { EyeLabel, IrisCaptureResult } from '@/services/iris/types';

import { useIrisCaptureSession } from './hooks/useIrisCaptureSession';

type Eye = EyeLabel;

interface CapturedEyes {
  left?: IrisCaptureResult;
  right?: IrisCaptureResult;
}

const EYE_COPY: Record<Eye, { title: string; instruction: string }> = {
  left: {
    title: 'Capture Left Eye',
    instruction: 'Align your LEFT eye inside the frame and hold still.',
  },
  right: {
    title: 'Capture Right Eye',
    instruction: 'Align your RIGHT eye inside the frame and hold still.',
  },
};

export default function IrisScanScreen() {
  const cameraRef = useRef<CameraView>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentEye, setCurrentEye] = useState<Eye>('left');
  const [captures, setCaptures] = useState<CapturedEyes>({});
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const {
    phase,
    progress,
    error: sessionError,
    fallbackResult,
    isBusy: isSessionBusy,
    captureEye,
    acceptFallback,
    reset,
  } = useIrisCaptureSession(cameraRef);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const finalizeEnrollment = useCallback(async (results: CapturedEyes) => {
    const left = results.left;
    const right = results.right;

    if (!left || !right) {
      Alert.alert('Capture Required', 'Please capture both eyes to continue.');
      return;
    }

    try {
      setIsEnrolling(true);
      const leftFrame = left.enhancement?.base64 ?? left.fusedBase64;
      const rightFrame = right.enhancement?.base64 ?? right.fusedBase64;
      const frames = [leftFrame, rightFrame];
      const compositeScore = (left.quality.composite + right.quality.composite) / 2;
      const quality = Math.max(0, Math.min(1, compositeScore));
      const template = {
        id: Date.now().toString(),
        frames,
        rawFrames: [left.fusedBase64, right.fusedBase64],
        enhancement: {
          left: left.enhancement
            ? {
                source: left.enhancement.source,
                durationMs: left.enhancement.durationMs,
                error: left.enhancement.error,
              }
            : undefined,
          right: right.enhancement
            ? {
                source: right.enhancement.source,
                durationMs: right.enhancement.durationMs,
                error: right.enhancement.error,
              }
            : undefined,
        },
        quality,
        createdAt: Date.now(),
      };

      await authService.storeIrisTemplate(template);
      await authService.addAuthLog({
        timestamp: Date.now(),
        type: 'success',
        details: 'Iris enrollment completed',
        confidence: quality,
      });

      setQualityScore(quality);
      setIsComplete(true);
    } catch (error) {
      console.error('Enrollment error:', error);
      Alert.alert('Enrollment Error', 'Unable to process iris data. Please try again.');
    } finally {
      setIsEnrolling(false);
    }
  }, [setIsComplete, setIsEnrolling, setQualityScore]);

  const applyCaptureResult = useCallback(
    async (result: IrisCaptureResult) => {
      const updatedCaptures: CapturedEyes = {
        ...captures,
        [result.eye]: result,
      };

      setCaptures(updatedCaptures);
      setIsComplete(false);

      if (result.eye === 'left') {
        setCurrentEye('right');
      } else {
        await finalizeEnrollment(updatedCaptures);
      }
    },
    [captures, finalizeEnrollment],
  );

  useEffect(() => {
    if (phase === 'error' && sessionError) {
      const buttons = fallbackResult
        ? [
            {
              text: 'Retake',
              style: 'cancel' as const,
              onPress: () => {
                reset();
              },
            },
            {
              text: 'OK – Continue Anyway',
              onPress: async () => {
                const fallback = acceptFallback();
                if (fallback) {
                  await applyCaptureResult(fallback);
                }
              },
            },
          ]
        : [
            {
              text: 'OK',
              onPress: () => {
                reset();
              },
            },
          ];

      Alert.alert('Capture Quality', sessionError, buttons, { cancelable: false });
    }
  }, [acceptFallback, applyCaptureResult, fallbackResult, phase, reset, sessionError]);

  const bothEyesCaptured = Boolean(captures.left && captures.right);
  const frameProgressCount = Math.min(
    IRIS_CAPTURE_CONFIG.burstFrameCount,
    Math.max(0, Math.round(progress * IRIS_CAPTURE_CONFIG.burstFrameCount)),
  );
  const overlayLabel = (() => {
    if (isEnrolling) {
      return 'Saving enrollment...';
    }
    if (!isCameraReady) {
      return 'Initializing camera';
    }
    if (isSessionBusy) {
      if (phase === 'capturing') {
        const frameCount = Math.max(1, frameProgressCount);
        return `Capturing ${frameCount}/${IRIS_CAPTURE_CONFIG.burstFrameCount}`;
      }
      return 'Analyzing frames...';
    }
    return EYE_COPY[currentEye].title;
  })();
  const captureDisabled =
    !hasPermission || !isCameraReady || isSessionBusy || isEnrolling;
  const showCaptureSpinner = (isSessionBusy || isEnrolling) && !!hasPermission && isCameraReady;
  const finalizeDisabled = isEnrolling || isSessionBusy;

  const handleCapture = async () => {
    if (isSessionBusy || isEnrolling) {
      return;
    }

    try {
      const result = await captureEye(currentEye);

      if (!result) {
        return;
      }

      await applyCaptureResult(result);
    } catch (error) {
      console.error('Camera capture failed:', error);
      Alert.alert('Capture Error', 'Unable to capture image. Please try again.');
    }
  };

  const handleRetake = (eye: Eye) => {
    reset();
    setCaptures(prev => {
      const updated = { ...prev, [eye]: undefined };
      return updated;
    });
    setIsComplete(false);
    setQualityScore(null);
    setCurrentEye(eye);
  };

  const handleComplete = () => {
    router.replace('/(tabs)/dashboard');
  };

  const handleBack = () => {
    if (isSessionBusy || isEnrolling) {
      Alert.alert(
        'Processing In Progress',
        'Please wait for enrollment to finish.',
        [{ text: 'OK', style: 'default' }],
      );
      return;
    }

    if (bothEyesCaptured && !isComplete) {
      Alert.alert(
        'Discard Captures?',
        'If you go back now, your current captures will be lost.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Discard', style: 'destructive', onPress: () => router.back() },
        ],
      );
      return;
    }

    router.back();
  };

  const renderEyePreview = (eye: Eye) => {
    const capture = captures[eye];
    if (!capture) return null;

    const previewBase64 = capture.enhancement?.base64 ?? capture.fusedBase64;
    const source = capture.fusedUri
      ? { uri: capture.fusedUri }
      : { uri: `data:image/jpeg;base64,${previewBase64}` };
    const qualityPercent = Math.round(capture.quality.composite * 100);
    const focusPercent = Math.round(capture.quality.focus * 100);
    const occlusionPercent = Math.round(capture.quality.occlusion * 100);

    return (
      <View style={styles.previewItem}>
        <Image source={source} style={styles.previewImage} />
        <View style={styles.previewHeader}>
          <ThemedText style={styles.previewLabel}>
            {eye === 'left' ? 'Left Eye' : 'Right Eye'}
          </ThemedText>
          {capture.enhancement && (
            <View style={styles.enhancedBadge}>
              <Ionicons
                name={capture.enhancement.source === 'cloud' ? 'cloud-upload' : 'flash'}
                size={12}
                color="#2563EB"
              />
              <ThemedText style={styles.enhancedBadgeText}>AI Enhanced</ThemedText>
            </View>
          )}
        </View>
        <View style={styles.previewMetrics}>
          <ThemedText style={styles.previewMetric}>Quality {qualityPercent}%</ThemedText>
          <ThemedText style={styles.previewMetricDetail}>
            Focus {focusPercent}% • Occlusion {occlusionPercent}%
          </ThemedText>
        </View>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => handleRetake(eye)}
          disabled={isSessionBusy || isEnrolling}
        >
          <Ionicons name="refresh" size={16} color="#007AFF" />
          <ThemedText style={styles.retakeText}>Retake</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  const renderCameraContent = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.cameraFallback}>
          <ActivityIndicator color="#007AFF" />
          <ThemedText style={styles.cameraFallbackText}>Requesting camera access…</ThemedText>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.cameraFallback}>
          <Ionicons name="alert-circle" size={32} color="#FF3B30" />
          <ThemedText style={styles.cameraFallbackText}>
            Camera access is required for enrollment.
          </ThemedText>
          <TouchableOpacity style={styles.retryButton} onPress={() => Camera.requestCameraPermissionsAsync().then(({ status }) => setHasPermission(status === 'granted'))}>
            <Ionicons name="reload" size={18} color="white" />
            <ThemedText style={styles.retryText}>Retry Permission</ThemedText>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing="front"
        mode="picture"
        onCameraReady={() => setIsCameraReady(true)}
      />
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Iris Enrollment</ThemedText>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.cameraSection}>
          <View style={styles.cameraFrame}>
            {renderCameraContent()}
            <View style={styles.cameraOverlay}>
              <View style={styles.overlayRing} />
              <ThemedText style={styles.overlayLabel}>
                {overlayLabel}
              </ThemedText>
            </View>
          </View>

          <ThemedText style={styles.instructionsHeadline}>
            {isComplete
              ? 'Enrollment Complete!'
              : isEnrolling
              ? 'Finalizing your enrollment…'
              : isSessionBusy
              ? phase === 'capturing'
                ? 'Hold steady while we capture a burst of frames.'
                : 'Evaluating frame quality…'
              : bothEyesCaptured
              ? 'Review your captures before finishing.'
              : EYE_COPY[currentEye].instruction}
          </ThemedText>

          {isSessionBusy && (
            <ThemedText style={styles.captureStatus}>
              {phase === 'capturing'
                ? `Burst progress ${Math.max(1, frameProgressCount)}/${IRIS_CAPTURE_CONFIG.burstFrameCount}`
                : 'Selecting the best frames for fusion…'}
            </ThemedText>
          )}

          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.captureButton, captureDisabled && styles.disabledButton]}
              onPress={handleCapture}
              disabled={captureDisabled}
            >
              {showCaptureSpinner ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <Ionicons name="camera" size={22} color="white" />
                  <ThemedText style={styles.captureText}>
                    {currentEye === 'left' ? 'Capture Left Eye' : 'Capture Right Eye'}
                  </ThemedText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {(captures.left || captures.right) && (
            <View style={styles.previewRow}>
              {renderEyePreview('left')}
              {renderEyePreview('right')}
            </View>
          )}

          {qualityScore !== null && (
            <View style={styles.qualityBadge}>
              <Ionicons name="ribbon" size={18} color="#34C759" />
              <ThemedText style={styles.qualityText}>
                Capture quality {Math.round(qualityScore * 100)}%
              </ThemedText>
            </View>
          )}

          <View style={styles.instructionsCard}>
            <ThemedText style={styles.cardTitle}>Capture Tips</ThemedText>
            <ThemedText style={styles.cardCopy}>
              • Hold the device at eye level using the selfie camera{'\n'}
              • Keep both eyes open and steady in the frame{'\n'}
              • Ensure even lighting without glare or shadows{'\n'}
              • Capture each eye once, retaking if the preview looks blurry
            </ThemedText>
          </View>

          {bothEyesCaptured && !isComplete && (
            <TouchableOpacity
              style={[styles.completeButton, finalizeDisabled && styles.disabledButton]}
              onPress={() => finalizeEnrollment(captures)}
              disabled={finalizeDisabled}
            >
              {isEnrolling ? (
                <ActivityIndicator color="white" />
              ) : (
                <>
                  <ThemedText style={styles.completeText}>Process & Save</ThemedText>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </>
              )}
            </TouchableOpacity>
          )}

          {isComplete && (
            <TouchableOpacity style={styles.finishButton} onPress={handleComplete}>
              <ThemedText style={styles.finishText}>Finish Enrollment</ThemedText>
              <Ionicons name="checkmark-circle" size={20} color="white" />
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
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  headerSpacer: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  cameraSection: {
    alignItems: 'center',
    gap: 24,
  },
  cameraFrame: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(0, 122, 255, 0.4)',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
  },
  overlayRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.6)',
  },
  overlayLabel: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  cameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
  },
  cameraFallbackText: {
    fontSize: 14,
    textAlign: 'center',
    color: '#4B5563',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#007AFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  instructionsHeadline: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    color: '#111827',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#007AFF',
    paddingHorizontal: 28,
    paddingVertical: 16,
    borderRadius: 28,
  },
  captureText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    opacity: 0.6,
  },
  previewRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    width: '100%',
  },
  previewItem: {
    alignItems: 'center',
    gap: 8,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#007AFF',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111827',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewMetrics: {
    alignItems: 'center',
    gap: 4,
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enhancedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  previewMetric: {
    fontSize: 12,
    fontWeight: '600',
    color: '#007AFF',
  },
  previewMetricDetail: {
    fontSize: 11,
    color: '#4B5563',
    textAlign: 'center',
    marginTop: 2,
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeText: {
    color: '#007AFF',
    fontSize: 12,
    fontWeight: '600',
  },
  qualityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(52, 199, 89, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  qualityText: {
    color: '#1F9D55',
    fontWeight: '600',
  },
  instructionsCard: {
    width: '100%',
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    padding: 20,
    gap: 10,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  cardCopy: {
    fontSize: 14,
    lineHeight: 20,
    color: '#4B5563',
  },
  captureStatus: {
    fontSize: 13,
    color: '#4B5563',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 28,
  },
  completeText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#34C759',
    paddingHorizontal: 32,
    paddingVertical: 18,
    borderRadius: 30,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
});
