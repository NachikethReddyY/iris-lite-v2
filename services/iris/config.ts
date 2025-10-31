export interface IrisCaptureConfig {
  burstFrameCount: number;
  captureIntervalMs: number;
  fusionFrameCount: number;
  irisRadiusMin: number;
  irisRadiusIdeal: number;
  gazeAngleMax: number;
  occlusionMax: number;
  captureQuality: number;
}

export const IRIS_CAPTURE_CONFIG: IrisCaptureConfig = {
  burstFrameCount: 5,
  captureIntervalMs: 80,
  fusionFrameCount: 1,
  irisRadiusMin: 100,
  irisRadiusIdeal: 160,
  gazeAngleMax: 15,
  occlusionMax: 0.3,
  captureQuality: 0.6,
};
