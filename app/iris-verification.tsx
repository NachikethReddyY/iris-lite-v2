import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { authService } from '@/services/authService';
import { IRIS_CAPTURE_CONFIG } from '@/services/iris/config';
import type { EyeLabel, IrisCaptureResult } from '@/services/iris/types';

import { useIrisCaptureSession } from './onboarding/hooks/useIrisCaptureSession';

export const options = {
  headerShown: false,
};

type Eye = EyeLabel;

interface CapturedEyes {
  left?: IrisCaptureResult;
  right?: IrisCaptureResult;
}

const EYE_COPY: Record<Eye, { instruction: string; cta: string }> = {
  left: {
    instruction: 'Align your LEFT eye inside the guide. We will capture 5 rapid frames.',
    cta: 'Capture Left Eye',
  },
  right: {
    instruction: 'Align your RIGHT eye. Hold steady while we capture 5 frames.',
    cta: 'Capture Right Eye',
  },
};

const getPreviewBase64 = (capture: IrisCaptureResult) =>
  capture.enhancement?.base64 ?? capture.fusedBase64;

export default function IrisVerificationScreen() {
  const { markAuthenticated } = useAuth();
  const cameraRef = useRef<CameraView>(null);

  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [currentEye, setCurrentEye] = useState<Eye>('left');
  const [captures, setCaptures] = useState<CapturedEyes>({});
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResult, setVerificationResult] = useState<{
    success: boolean;
    confidence: number;
    details: string;
  } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [improvements, setImprovements] = useState<string[]>([]);

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

  const bothEyesCaptured = Boolean(captures.left && captures.right);
  const frameProgressCount = useMemo(() => {
    if (!isSessionBusy || phase !== 'capturing') {
      return 0;
    }
    return Math.max(
      1,
      Math.min(IRIS_CAPTURE_CONFIG.burstFrameCount, Math.round(progress * IRIS_CAPTURE_CONFIG.burstFrameCount)),
    );
  }, [isSessionBusy, phase, progress]);

  const overlayLabel = useMemo(() => {
    if (!isCameraReady) {
      return 'Initializing camera…';
    }
    if (isSessionBusy) {
      if (phase === 'capturing') {
        return `Capturing ${frameProgressCount}/${IRIS_CAPTURE_CONFIG.burstFrameCount}`;
      }
      return 'Selecting best frame & enhancing…';
    }
    if (isVerifying) {
      return 'Verifying your iris…';
    }
    return 'Hold steady inside the guide';
  }, [frameProgressCount, isCameraReady, isSessionBusy, isVerifying, phase]);

  const instructionText = useMemo(() => {
    if (isVerifying) {
      return 'Analyzing enhanced frames against your enrollment template.';
    }
    if (!isCameraReady) {
      return 'Please wait while the camera starts.';
    }
    if (isSessionBusy) {
      return phase === 'capturing'
        ? 'Capturing 5-frame burst…'
        : 'Evaluating quality and upscaling the best frame.';
    }
    if (bothEyesCaptured) {
      return 'Review the enhanced previews, then verify.';
    }
    return EYE_COPY[currentEye].instruction;
  }, [bothEyesCaptured, currentEye, isCameraReady, isSessionBusy, isVerifying, phase]);

  const captureDisabled =
    !hasPermission || !isCameraReady || isSessionBusy || isVerifying;

  const applyCaptureResult = useCallback(
    async (result: IrisCaptureResult) => {
      setCaptures(prev => ({ ...prev, [result.eye]: result }));
      setVerificationResult(null);
      setErrors([]);
      setImprovements([]);

      if (result.eye === 'left') {
        setCurrentEye('right');
      } else {
        setCurrentEye('right');
      }
    },
    [],
  );

  useEffect(() => {
    if (phase === 'error' && sessionError) {
      const buttons = fallbackResult
        ? [
            { text: 'Retake', style: 'cancel' as const, onPress: () => reset() },
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
        : [{ text: 'OK', onPress: () => reset() }];

      Alert.alert('Capture Quality', sessionError, buttons, { cancelable: false });
    }
  }, [acceptFallback, applyCaptureResult, fallbackResult, phase, reset, sessionError]);

  const handleCapture = useCallback(async () => {
    if (captureDisabled) {
      return;
    }

    try {
      const result = await captureEye(currentEye);
      if (result) {
        await applyCaptureResult(result);
      }
    } catch (error) {
      console.error('Capture failed:', error);
      Alert.alert('Capture Error', 'Unable to capture image, please try again.');
    }
  }, [applyCaptureResult, captureDisabled, captureEye, currentEye]);

  const handleRetake = useCallback(
    (eye: Eye) => {
      reset();
      setCaptures(prev => ({ ...prev, [eye]: undefined }));
      setVerificationResult(null);
      setErrors([]);
      setImprovements([]);
      setCurrentEye(eye);
    },
    [reset],
  );

  const handleClose = useCallback(() => {
    setCaptures({});
    setVerificationResult(null);
    setErrors([]);
    setImprovements([]);
    setCurrentEye('left');
    reset();
    router.replace('/(tabs)/dashboard');
  }, [reset]);

  const buildErrors = (confidence: number) => {
    const items: string[] = [];
    if (confidence < 0.8) items.push('Capture clarity could be improved.');
    if (confidence < 0.7) items.push('Lighting appears uneven.');
    if (confidence < 0.6) items.push('Eye alignment may be off-center.');
    if (confidence < 0.5) items.push('Movement detected during capture.');
    return items;
  };

  const buildImprovements = (confidence: number) => {
    const items: string[] = [];
    if (confidence < 0.8) items.push('Use brighter, indirect lighting.');
    if (confidence < 0.7) items.push('Hold the device steady at eye level.');
    if (confidence < 0.6) items.push('Center the iris fully within the guide.');
    if (confidence < 0.5) items.push('Avoid blinking during capture.');
    return items;
  };

  const runVerification = useCallback(
    async (left: IrisCaptureResult, right: IrisCaptureResult) => {
      const leftFrame = getPreviewBase64(left);
      const rightFrame = getPreviewBase64(right);

      setIsVerifying(true);
      setErrors([]);
      setImprovements([]);
      setVerificationResult(null);

      try {
        const result = await authService.verifyIrisMatch([leftFrame, rightFrame]);
        setVerificationResult(result);
        setErrors(buildErrors(result.confidence));
        setImprovements(buildImprovements(result.confidence));

        await authService.addAuthLog({
          timestamp: Date.now(),
          type: result.success ? 'success' : 'failure',
          details: `${result.details} (${left.enhancement?.source ?? 'none'} / ${right.enhancement?.source ?? 'none'})`,
          confidence: result.confidence,
        });

        if (result.success) {
          const expiry = Date.now() + authService.getSessionTimeout();
          await authService.setSessionExpiry();
          markAuthenticated(expiry);
        }
      } catch (error) {
        console.error('Verification error:', error);
        Alert.alert('Verification Error', 'Unable to verify your iris. Please try again.');
      } finally {
        setIsVerifying(false);
      }
    },
    [markAuthenticated],
  );

  const handleVerify = useCallback(async () => {
    if (!captures.left || !captures.right || isVerifying) {
      return;
    }
    await runVerification(captures.left, captures.right);
  }, [captures.left, captures.right, isVerifying, runVerification]);

  const renderCameraContent = () => {
    if (hasPermission === null) {
      return (
        <View style={styles.cameraFallback}>
          <ActivityIndicator color="#007AFF" />
          <ThemedText style={styles.cameraFallbackText}>
            Requesting camera access…
          </ThemedText>
        </View>
      );
    }

    if (hasPermission === false) {
      return (
        <View style={styles.cameraFallback}>
          <Ionicons name="alert-circle" size={32} color="#FF3B30" />
          <ThemedText style={styles.cameraFallbackText}>
            Camera permission is required for verification.
          </ThemedText>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() =>
              Camera.requestCameraPermissionsAsync().then(({ status }) =>
                setHasPermission(status === 'granted'),
              )
            }
          >
            <Ionicons name="reload" size={18} color="#FFFFFF" />
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

  const renderPreview = (eye: Eye) => {
    const capture = captures[eye];
    if (!capture) return null;

    const uri = capture.fusedUri
      ? capture.fusedUri
      : `data:image/jpeg;base64,${getPreviewBase64(capture)}`;
    const qualityPercent = Math.round(capture.quality.composite * 100);

    return (
      <View style={styles.previewItem}>
        <Image source={{ uri }} style={styles.previewImage} />
        <View style={styles.previewHeader}>
          <ThemedText style={styles.previewLabel}>{eye === 'left' ? 'Left Eye' : 'Right Eye'}</ThemedText>
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
        <ThemedText style={styles.previewMetric}>Quality {qualityPercent}%</ThemedText>
        <TouchableOpacity
          style={styles.retakeButton}
          onPress={() => handleRetake(eye)}
          disabled={isSessionBusy || isVerifying}
        >
          <Ionicons name="refresh" size={16} color="#2563EB" />
          <ThemedText style={styles.retakeText}>Retake</ThemedText>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#007AFF" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>iris-verification</ThemedText>
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
            </View>
          </View>
          <ThemedText style={styles.overlayLabel}>{overlayLabel}</ThemedText>
          <ThemedText style={styles.instructionText}>{instructionText}</ThemedText>
        </View>

        <TouchableOpacity
          style={[styles.captureButton, captureDisabled && styles.disabledButton]}
          onPress={handleCapture}
          disabled={captureDisabled}
        >
          {captureDisabled && isSessionBusy ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="camera" size={22} color="#FFFFFF" />
              <ThemedText style={styles.captureText}>{EYE_COPY[currentEye].cta}</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {(captures.left || captures.right) && (
          <View style={styles.previewRow}>
            {renderPreview('left')}
            {renderPreview('right')}
          </View>
        )}

        {verificationResult && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Ionicons
                name={verificationResult.success ? 'checkmark-circle' : 'close-circle'}
                size={24}
                color={verificationResult.success ? '#34C759' : '#FF3B30'}
              />
              <ThemedText
                style={[
                  styles.resultTitle,
                  { color: verificationResult.success ? '#111827' : '#B91C1C' },
                ]}
              >
                {verificationResult.success ? 'Verification Successful' : 'Verification Failed'}
              </ThemedText>
            </View>
            <ThemedText style={styles.resultDetails}>{verificationResult.details}</ThemedText>
            <ThemedText style={styles.resultConfidence}>
              Confidence {Math.round(verificationResult.confidence * 100)}%
            </ThemedText>

            {(errors.length > 0 || improvements.length > 0) && (
              <View style={styles.feedbackGrid}>
                {errors.length > 0 && (
                  <View style={styles.feedbackColumn}>
                    <ThemedText style={styles.feedbackTitle}>Issues Detected</ThemedText>
                    {errors.map(issue => (
                      <ThemedText key={issue} style={styles.feedbackItem}>
                        • {issue}
                      </ThemedText>
                    ))}
                  </View>
                )}
                {improvements.length > 0 && (
                  <View style={styles.feedbackColumn}>
                    <ThemedText style={styles.feedbackTitle}>Suggested Improvements</ThemedText>
                    {improvements.map(tip => (
                      <ThemedText key={tip} style={styles.feedbackItem}>
                        • {tip}
                      </ThemedText>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>
        )}

        {verificationResult?.success && (
          <TouchableOpacity style={styles.finishButton} onPress={handleClose}>
            <ThemedText style={styles.finishText}>Return to Dashboard</ThemedText>
          </TouchableOpacity>
        )}

        {bothEyesCaptured && !verificationResult && (
          <TouchableOpacity
            style={[styles.verifyButton, (isVerifying || isSessionBusy) && styles.disabledButton]}
            onPress={handleVerify}
            disabled={isVerifying || isSessionBusy}
          >
            {isVerifying ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <ThemedText style={styles.verifyText}>Verify Now</ThemedText>
                <Ionicons name="shield-checkmark" size={20} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        )}
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
    paddingTop: 0,
    paddingBottom: 80,
    gap: 24,
  },
  cameraSection: {
    alignItems: 'center',
    gap: 12,
  },
  cameraFrame: {
    width: 260,
    height: 260,
    borderRadius: 130,
    overflow: 'hidden',
    borderWidth: 4,
    borderColor: 'rgba(37, 99, 235, 0.4)',
    alignSelf: 'center',
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  overlayRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.7)',
  },
  overlayLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.6)',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 12,
  },
  instructionText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#4B5563',
    fontWeight: '600',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#2563EB',
    paddingHorizontal: 32,
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
  },
  previewItem: {
    alignItems: 'center',
    gap: 8,
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  previewImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: '#2563EB',
    backgroundColor: '#E0E7FF',
  },
  previewLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1F2937',
  },
  previewMetric: {
    fontSize: 12,
    fontWeight: '600',
    color: '#2563EB',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  retakeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '600',
  },
  enhancedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(37, 99, 235, 0.12)',
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderRadius: 12,
  },
  enhancedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#2563EB',
  },
  resultCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 18,
    padding: 20,
    gap: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  resultDetails: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  resultConfidence: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },
  feedbackGrid: {
    flexDirection: 'row',
    gap: 16,
    flexWrap: 'wrap',
  },
  feedbackColumn: {
    flexGrow: 1,
    minWidth: 140,
    gap: 6,
  },
  feedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  feedbackItem: {
    fontSize: 13,
    color: '#4B5563',
    lineHeight: 18,
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#111827',
    paddingHorizontal: 34,
    paddingVertical: 16,
    borderRadius: 30,
  },
  verifyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  finishButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 16,
    borderRadius: 28,
  },
  finishText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  cameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
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
    backgroundColor: '#2563EB',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
});
