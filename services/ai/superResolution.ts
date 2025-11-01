import { Buffer } from 'buffer';
import { Asset } from 'expo-asset';
import { Platform } from 'react-native';
import type { InferenceSession } from 'onnxruntime-react-native';

import { decodeJpeg, encodeJpeg } from '@/services/ai/jpegCodec';

type EnhancementSource = 'on-device' | 'cloud' | 'none';

export interface EnhancementResult {
  base64: string;
  source: EnhancementSource;
  durationMs: number;
  error?: string;
}

const MODEL_NAME = 'QuickSRNet x2 INT8';
const MODEL_REQUIRE = () =>
  require('@/assets/models/job_jgje2lm15_optimized_onnx/model.onnx');
const MODEL_COMPANION_ASSETS = [
  () => require('@/assets/models/job_jgje2lm15_optimized_onnx/model.data'),
];
const MODEL_SCALE = 2;
const ON_DEVICE_TIME_BUDGET_MS = 500;

let runtimeModulePromise: Promise<typeof import('onnxruntime-react-native')> | null = null;
let sessionPromise: Promise<InferenceSession | null> | null = null;

const loadRuntimeModule = async () => {
  if (!runtimeModulePromise) {
    runtimeModulePromise = import('onnxruntime-react-native');
  }
  return runtimeModulePromise;
};

const clampToByte = (value: number) => {
  if (!Number.isFinite(value)) {
    return 0;
  }
  if (value <= 0) {
    return 0;
  }
  if (value >= 255) {
    return 255;
  }
  return Math.round(value);
};

const loadModelAssetAsync = async (): Promise<string | null> => {
  try {
    const primary = Asset.fromModule(MODEL_REQUIRE());
    const companions = MODEL_COMPANION_ASSETS.map(factory =>
      Asset.fromModule(factory()),
    );

    await Promise.all(
      [primary, ...companions].map(candidate => candidate.downloadAsync()),
    );

    return primary.localUri ?? primary.uri ?? null;
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
      const { InferenceSession } = await loadRuntimeModule();
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

      console.log(
        `[SR] On-device super-resolution session initialised with ${MODEL_NAME}.`,
      );
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
    const ort = await loadRuntimeModule();
    const { Tensor } = ort;

    const frameBytes = Buffer.from(base64, 'base64');
    const decoded = decodeJpeg(frameBytes, {
      useTArray: true,
      formatAsRGBA: true,
      tolerantDecoding: true,
    });

    const width = decoded.width;
    const height = decoded.height;
    if (!width || !height || !decoded.data) {
      throw new Error('Decoded frame is missing dimensions or pixel data');
    }

    const rgba =
      decoded.data instanceof Uint8Array ? decoded.data : new Uint8Array(decoded.data);
    const pixelCount = width * height;
    const inputData = new Float32Array(pixelCount * 3);

    for (let i = 0, channelIndex = 0; i < rgba.length; i += 4, channelIndex += 3) {
      inputData[channelIndex] = rgba[i] / 255;
      inputData[channelIndex + 1] = rgba[i + 1] / 255;
      inputData[channelIndex + 2] = rgba[i + 2] / 255;
    }

    const inputName = session.inputNames[0] ?? 'image';
    const feeds = {
      [inputName]: new Tensor('float32', inputData, [1, 3, height, width]),
    };

    const inferenceStart = Date.now();
    const outputs = await session.run(feeds);
    const inferenceDuration = Date.now() - inferenceStart;

    const outputName = session.outputNames[0] ?? Object.keys(outputs)[0];
    if (!outputName) {
      throw new Error('Model did not return any outputs');
    }

    const outputTensor = outputs[outputName];
    if (!outputTensor) {
      throw new Error(`Missing tensor for output "${outputName}"`);
    }

    const [batch, channels, outHeight, outWidth] = outputTensor.dims;
    if (batch !== 1) {
      console.warn('[SR] Unexpected batch dimension from model output:', batch);
    }
    if (channels !== 3) {
      throw new Error(`Unexpected channel count from model output: ${channels}`);
    }

    const outputBuffer = outputTensor.data as Float32Array | undefined;
    if (!outputBuffer) {
      throw new Error('Model output data is unavailable');
    }

    const outputPixelCount = outHeight * outWidth;
    const rgbaOutput = new Uint8Array(outputPixelCount * 4);

    for (let i = 0, src = 0; i < outputPixelCount; i += 1, src += 3) {
      const dst = i * 4;
      rgbaOutput[dst] = clampToByte(outputBuffer[src] * 255);
      rgbaOutput[dst + 1] = clampToByte(outputBuffer[src + 1] * 255);
      rgbaOutput[dst + 2] = clampToByte(outputBuffer[src + 2] * 255);
      rgbaOutput[dst + 3] = 255;
    }

    const encodedImage = encodeJpeg(
      {
        data: rgbaOutput,
        width: outWidth,
        height: outHeight,
      },
      85,
    );

    const encodedBytes =
      encodedImage && typeof encodedImage === 'object' && 'data' in encodedImage
        ? (encodedImage.data as Uint8Array)
        : (encodedImage as Uint8Array);

    const enhancedBase64 = Buffer.from(
      encodedBytes instanceof Uint8Array ? encodedBytes : new Uint8Array(encodedBytes),
    ).toString('base64');

    const durationMs = Date.now() - start;

    console.log(
      `[SR] QuickSRNet inference completed in ${durationMs}ms (model ${inferenceDuration}ms).`,
    );

    return {
      base64: enhancedBase64,
      source: 'on-device',
      durationMs,
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
  model: MODEL_NAME,
  scale: MODEL_SCALE,
  onDeviceTimeBudgetMs: ON_DEVICE_TIME_BUDGET_MS,
};
