import type { IrisCaptureConfig } from './config';
import type { FrameQuality, IrisFrame } from './types';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const pseudoRandomFromString = (input: string, seed: number) => {
  let hash = seed;
  const slice = input.slice(0, 120);
  for (let index = 0; index < slice.length; index += 1) {
    hash = (hash * 31 + slice.charCodeAt(index)) % 1000;
  }
  return hash / 1000;
};

export const computeFrameQuality = (frame: IrisFrame, config: IrisCaptureConfig): FrameQuality => {
  const width = frame.width || 0;
  const height = frame.height || 0;
  const irisRadiusPx = Math.max(1, Math.min(width, height) / 2);
  const irisRadiusScore = clamp(irisRadiusPx / config.irisRadiusIdeal, 0, 1);

  const focusSeed = pseudoRandomFromString(frame.base64, 13);
  const gazeSeed = pseudoRandomFromString(frame.base64, 23);
  const exposureSeed = pseudoRandomFromString(frame.base64, 37);
  const occlusionSeed = pseudoRandomFromString(frame.base64, 47);

  const focus = clamp(0.55 + focusSeed * 0.45, 0, 1);
  const gaze = clamp(0.6 + gazeSeed * 0.4, 0, 1);
  const exposure = clamp(0.6 + exposureSeed * 0.4, 0, 1);
  const occlusion = clamp(0.6 + (1 - occlusionSeed) * 0.4, 0, 1);

  const composite =
    focus * 0.35 +
    gaze * 0.2 +
    exposure * 0.2 +
    occlusion * 0.15 +
    irisRadiusScore * 0.1;

  return {
    focus,
    gaze,
    exposure,
    occlusion,
    irisRadiusScore,
    irisRadiusPx,
    composite,
  };
};

export const passesQualityGate = (quality: FrameQuality, config: IrisCaptureConfig) => {
  return (
    quality.focus >= 0.65 &&
    quality.exposure >= 0.6 &&
    quality.occlusion >= 0.6 &&
    quality.irisRadiusPx >= config.irisRadiusMin
  );
};

export const averageQuality = (qualities: FrameQuality[]): FrameQuality => {
  if (!qualities.length) {
    return {
      focus: 0,
      gaze: 0,
      occlusion: 0,
      exposure: 0,
      irisRadiusScore: 0,
      irisRadiusPx: 0,
      composite: 0,
    };
  }

  const total = qualities.reduce(
    (acc, quality) => ({
      focus: acc.focus + quality.focus,
      gaze: acc.gaze + quality.gaze,
      occlusion: acc.occlusion + quality.occlusion,
      exposure: acc.exposure + quality.exposure,
      irisRadiusScore: acc.irisRadiusScore + quality.irisRadiusScore,
      irisRadiusPx: acc.irisRadiusPx + quality.irisRadiusPx,
      composite: acc.composite + quality.composite,
    }),
    {
      focus: 0,
      gaze: 0,
      occlusion: 0,
      exposure: 0,
      irisRadiusScore: 0,
      irisRadiusPx: 0,
      composite: 0,
    },
  );

  const count = qualities.length;

  return {
    focus: total.focus / count,
    gaze: total.gaze / count,
    occlusion: total.occlusion / count,
    exposure: total.exposure / count,
    irisRadiusScore: total.irisRadiusScore / count,
    irisRadiusPx: total.irisRadiusPx / count,
    composite: total.composite / count,
  };
};
