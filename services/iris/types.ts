export type EyeLabel = 'left' | 'right';

export interface IrisFrame {
  id: string;
  base64: string;
  uri?: string;
  width: number;
  height: number;
  timestamp: number;
}

export interface FrameQuality {
  focus: number;
  gaze: number;
  occlusion: number;
  exposure: number;
  irisRadiusScore: number;
  irisRadiusPx: number;
  composite: number;
}

export interface ScoredFrame {
  frame: IrisFrame;
  quality: FrameQuality;
}

export interface FusionResult {
  fusedBase64: string;
  fusedUri?: string;
  framesUsed: number;
  averageQuality: FrameQuality;
}

export interface IrisEnhancement {
  base64: string;
  source: 'on-device' | 'cloud' | 'none';
  durationMs: number;
  error?: string;
}

export interface IrisCaptureResult {
  eye: EyeLabel;
  frameCount: number;
  usedFrameCount: number;
  fusedBase64: string;
  fusedUri?: string;
  topFrames: ScoredFrame[];
  quality: FrameQuality;
  enhancement?: IrisEnhancement;
  isFallback?: boolean;
  failureReason?: string;
  tips?: string[];
}
