import type { IrisCaptureConfig } from './config';
import { averageQuality, computeFrameQuality, passesQualityGate } from './metrics';
import type { FusionResult, IrisFrame, ScoredFrame } from './types';

export const evaluateFrames = (frames: IrisFrame[], config: IrisCaptureConfig): ScoredFrame[] => {
  return frames
    .map(frame => {
      const quality = computeFrameQuality(frame, config);
      return { frame, quality };
    })
    .sort((a, b) => b.quality.composite - a.quality.composite);
};

export const filterPassingFrames = (scoredFrames: ScoredFrame[], config: IrisCaptureConfig) =>
  scoredFrames.filter(scored => passesQualityGate(scored.quality, config));

export const fuseTopFrames = (scoredFrames: ScoredFrame[], config: IrisCaptureConfig): FusionResult | null => {
  if (!scoredFrames.length) {
    return null;
  }

  const framesToFuse = scoredFrames.slice(0, Math.min(config.fusionFrameCount, scoredFrames.length));
  const qualities = framesToFuse.map(item => item.quality);
  const averaged = averageQuality(qualities);
  const representative = framesToFuse[0].frame;

  return {
    fusedBase64: representative.base64,
    fusedUri: representative.uri,
    framesUsed: framesToFuse.length,
    averageQuality: averaged,
  };
};
