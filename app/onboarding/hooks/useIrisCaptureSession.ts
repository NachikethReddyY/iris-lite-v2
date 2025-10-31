import { useCallback, useMemo, useRef, useState } from 'react';
import type { CameraView } from 'expo-camera';

import { IRIS_CAPTURE_CONFIG, type IrisCaptureConfig } from '@/services/iris/config';
import { enhanceIrisFrame } from '@/services/ai/superResolution';
import { evaluateFrames, filterPassingFrames, fuseTopFrames } from '@/services/iris/processing';
import type { EyeLabel, IrisCaptureResult, IrisFrame } from '@/services/iris/types';

type SessionPhase = 'idle' | 'capturing' | 'processing' | 'error';

const delay = (ms: number) =>
  new Promise(resolve => {
    setTimeout(resolve, ms);
  });

const toFrame = (base64: string, index: number, width?: number, height?: number, uri?: string): IrisFrame => ({
  id: `${Date.now()}-${index}`,
  base64,
  width: width ?? 0,
  height: height ?? 0,
  uri,
  timestamp: Date.now(),
});

export interface IrisSessionController {
  phase: SessionPhase;
  progress: number;
  error: string | null;
  lastResult: IrisCaptureResult | null;
  fallbackResult: IrisCaptureResult | null;
  isBusy: boolean;
  captureEye: (eye: EyeLabel) => Promise<IrisCaptureResult | null>;
  acceptFallback: () => IrisCaptureResult | null;
  reset: () => void;
}

export const useIrisCaptureSession = (
  cameraRef: React.RefObject<CameraView>,
  overrides?: Partial<IrisCaptureConfig>,
): IrisSessionController => {
  const config = useMemo<IrisCaptureConfig>(
    () => ({
      ...IRIS_CAPTURE_CONFIG,
      ...overrides,
    }),
    [overrides],
  );

  const [phase, setPhase] = useState<SessionPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<IrisCaptureResult | null>(null);
  const [fallbackResult, setFallbackResult] = useState<IrisCaptureResult | null>(null);
  const busyRef = useRef(false);

  const buildQualityFailureMessage = useCallback(
    (eye: EyeLabel, qualitySummary: IrisCaptureResult['quality']) => {
      const focusPercent = Math.round(qualitySummary.focus * 100);
      const exposurePercent = Math.round(qualitySummary.exposure * 100);
      const occlusionPercent = Math.round(qualitySummary.occlusion * 100);
      const compositePercent = Math.round(qualitySummary.composite * 100);
      const radiusPx = Math.round(qualitySummary.irisRadiusPx);

      const targetSummary = `Target focus ≥ 65%, exposure ≥ 60%, occlusion ≥ 60%, iris radius ≥ ${config.irisRadiusMin}px.`;

      const issues: string[] = [];
      if (qualitySummary.focus < 0.65) {
        issues.push(`focus ${focusPercent}%`);
      }
      if (qualitySummary.exposure < 0.6) {
        issues.push(`exposure ${exposurePercent}%`);
      }
      if (qualitySummary.occlusion < 0.6) {
        issues.push(`occlusion ${occlusionPercent}%`);
      }
      if (qualitySummary.irisRadiusPx < config.irisRadiusMin) {
        issues.push(`iris radius ${radiusPx}px`);
      }

      const issueLine = issues.length
        ? `Needs improvement on ${issues.join(', ')}.`
        : 'Overall quality was just below the acceptance gate.';

      const tips: string[] = [];

      if (qualitySummary.focus < 0.65) {
        tips.push('Stabilize the phone and look straight ahead to reduce motion blur.');
      }
      if (qualitySummary.exposure < 0.6) {
        tips.push('Move to brighter, even lighting or tilt to avoid shadows across the eye.');
      }
      if (qualitySummary.occlusion < 0.6) {
        tips.push('Make sure lashes and lids are clear of the iris by opening eyes wider.');
      }
      if (qualitySummary.irisRadiusPx < config.irisRadiusMin) {
        tips.push(`Bring the device slightly closer so the iris fills more of the frame (aim for ≥ ${config.irisRadiusMin}px radius).`);
      }
      if (!tips.length) {
        tips.push('Hold steady for a few seconds while the burst completes.');
      }

      const tipLines = tips.map(tip => `• ${tip}`).join('\n');

      const message = [
        `Best ${eye} eye frame scored ${compositePercent}%.`,
        targetSummary,
        issueLine,
        '',
        'Tips:',
        tipLines,
      ].join('\n');

      return { message, tips };
    },
    [config],
  );

  const captureEye = useCallback(
    async (eye: EyeLabel): Promise<IrisCaptureResult | null> => {
      if (busyRef.current) {
        return null;
      }
      if (!cameraRef.current) {
        setError('Camera is not ready yet.');
        setPhase('error');
        return null;
      }

      busyRef.current = true;
      setPhase('capturing');
      setProgress(0);
      setError(null);
      setLastResult(null);
      setFallbackResult(null);

      const frames: IrisFrame[] = [];

      try {
        for (let index = 0; index < config.burstFrameCount; index += 1) {
          const photo = await cameraRef.current.takePictureAsync({
            base64: true,
            quality: config.captureQuality,
            skipProcessing: true,
          });

          if (photo?.base64) {
            frames.push(toFrame(photo.base64, index, photo.width, photo.height, photo.uri));
          }

          setProgress((index + 1) / config.burstFrameCount);

          if (index < config.burstFrameCount - 1) {
            await delay(config.captureIntervalMs);
          }
        }
      } catch (captureError) {
        console.error('Burst capture failed', captureError);
        setError('Unable to capture iris burst. Please hold steady and try again.');
        setPhase('error');
        busyRef.current = false;
        return null;
      }

      if (!frames.length) {
        setError('No frames were captured.');
        setPhase('error');
        busyRef.current = false;
        return null;
      }

      setPhase('processing');

      const scored = evaluateFrames(frames, config);
      const passing = filterPassingFrames(scored, config);

      if (!passing.length) {
        const topFrame = scored[0];
        if (topFrame) {
          const { message, tips } = buildQualityFailureMessage(eye, topFrame.quality);
          setError(message);
          setFallbackResult({
            eye,
            frameCount: frames.length,
            usedFrameCount: 1,
            fusedBase64: topFrame.frame.base64,
            fusedUri: topFrame.frame.uri,
            topFrames: [topFrame],
            quality: topFrame.quality,
            isFallback: true,
            failureReason: message,
            tips,
          });
        } else {
          setError('Frames did not pass quality checks. Please try again.');
          setFallbackResult(null);
        }
        setPhase('error');
        busyRef.current = false;
        return null;
      }

      const fusion = fuseTopFrames(passing, config);

      if (!fusion) {
        setError('Unable to generate a fused frame. Please retry.');
        setPhase('error');
        busyRef.current = false;
        return null;
      }

      const enhancement = await enhanceIrisFrame(fusion.fusedBase64);

      const result: IrisCaptureResult = {
        eye,
        frameCount: frames.length,
        usedFrameCount: fusion.framesUsed,
        fusedBase64: fusion.fusedBase64,
        fusedUri: fusion.fusedUri,
        topFrames: passing.slice(0, config.fusionFrameCount),
        quality: fusion.averageQuality,
        enhancement,
        isFallback: false,
      };

      setLastResult(result);
      setPhase('idle');
      setProgress(1);
      busyRef.current = false;

      return result;
    },
    [buildQualityFailureMessage, cameraRef, config],
  );

  const reset = useCallback(() => {
    setPhase('idle');
    setProgress(0);
    setError(null);
    setLastResult(null);
    setFallbackResult(null);
    busyRef.current = false;
  }, []);

  const acceptFallback = useCallback((): IrisCaptureResult | null => {
    if (!fallbackResult) {
      return null;
    }
    const result = fallbackResult;
    setLastResult(result);
    setError(null);
    setFallbackResult(null);
    setPhase('idle');
    return result;
  }, [fallbackResult]);

  return {
    phase,
    progress,
    error,
    lastResult,
    fallbackResult,
    isBusy: phase === 'capturing' || phase === 'processing',
    captureEye,
    acceptFallback,
    reset,
  };
};
