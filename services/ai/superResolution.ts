import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import type { InferenceSession } from 'onnxruntime-react-native';

type EnhancementSource = 'on-device' | 'cloud' | 'none';

export interface EnhancementResult {
  base64: string;
  source: EnhancementSource;
  durationMs: number;
  error?: string;
}

const MODEL_REQUIRE = () => require('@/assets/models/espcn_x2_int8.onnx');
const MODEL_SCALE = 2;
const ON_DEVICE_TIME_BUDGET_MS = 500;

let sessionPromise: Promise<InferenceSession | null> | null = null;

const loadModelAssetAsync = async (): Promise<string | null> => {
  try {
    const asset = Asset.fromModule(MODEL_REQUIRE());
    await asset.downloadAsync();
    return asset.localUri ?? asset.uri ?? null;
  } catch (error) {
    console.warn('[SR] Failed to resolve model asset', error);
    return null;
  }
};

const loadSessionAsync = async (): Promise<InferenceSession | null> => {
  if (sessionPromise) {
    return sessionPromise;
  }

  sessionPromise = (async () => {
    try {
      const { InferenceSession } = await import('onnxruntime-react-native');
      const modelUri = await loadModelAssetAsync();
      if (!modelUri) {
        console.warn('[SR] Model URI is unavailable, skipping on-device enhancement.');
        return null;
      }

      const session = await InferenceSession.create(modelUri, {
        executionProviders: Platform.select({
          ios: ['coreml', 'cpu'],
          android: ['nnapi', 'cpu'],
          default: ['cpu'],
        }),
      });

      console.log('[SR] On-device super-resolution session initialised.');
      return session;
    } catch (error) {
      console.warn('[SR] Unable to create ONNX runtime session. Falling back.', error);
      return null;
    }
  })();

  return sessionPromise;
};

export const ensureOnDeviceSuperResolutionReady = async () => {
  await loadSessionAsync();
};

const enhanceFrameOnDevice = async (base64: string): Promise<EnhancementResult> => {
  const start = Date.now();
  const session = await loadSessionAsync();

  if (!session) {
    return {
      base64,
      source: 'none',
      durationMs: Date.now() - start,
      error: 'On-device model unavailable',
    };
  }

  try {
    // TODO: Implement tensor conversion + inference once the chosen model is finalised.
    // Returning original frame for now to keep pipeline flowing.
    return {
      base64,
      source: 'on-device',
      durationMs: Date.now() - start,
      error: 'Super-resolution inference not yet implemented',
    };
  } catch (error) {
    console.warn('[SR] On-device enhancement failed, will consider fallback.', error);
    return {
      base64,
      source: 'none',
      durationMs: Date.now() - start,
      error: (error as Error).message ?? 'On-device enhancement error',
    };
  }
};

const enhanceFrameInCloud = async (base64: string): Promise<EnhancementResult> => {
  const start = Date.now();
  try {
    // TODO: Integrate remote enhancement endpoint. For now just echo the original data.
    return {
      base64,
      source: 'cloud',
      durationMs: Date.now() - start,
      error: 'Cloud enhancement not configured',
    };
  } catch (error) {
    console.warn('[SR] Cloud enhancement failed.', error);
    return {
      base64,
      source: 'none',
      durationMs: Date.now() - start,
      error: (error as Error).message ?? 'Cloud enhancement error',
    };
  }
};

export const enhanceIrisFrame = async (
  base64: string,
  options: { allowCloudFallback?: boolean } = {},
): Promise<EnhancementResult> => {
  const onDeviceResult = await enhanceFrameOnDevice(base64);

  if (onDeviceResult.source === 'on-device' && !onDeviceResult.error) {
    return onDeviceResult;
  }

  // Respect time budget before attempting fallback
  if (onDeviceResult.durationMs > ON_DEVICE_TIME_BUDGET_MS) {
    console.warn('[SR] On-device enhancement exceeded time budget.');
  }

  if (options.allowCloudFallback) {
    const cloudResult = await enhanceFrameInCloud(base64);
    if (cloudResult.source === 'cloud' && !cloudResult.error) {
      return cloudResult;
    }
    return cloudResult;
  }

  return onDeviceResult;
};

export const enhanceMultipleFrames = async (
  frames: string[],
  options: { allowCloudFallback?: boolean } = {},
) => {
  const results: EnhancementResult[] = [];

  for (const frame of frames) {
    // eslint-disable-next-line no-await-in-loop
    const result = await enhanceIrisFrame(frame, options);
    results.push(result);
  }

  return results;
};

export const SR_METADATA = {
  scale: MODEL_SCALE,
  onDeviceTimeBudgetMs: ON_DEVICE_TIME_BUDGET_MS,
};
