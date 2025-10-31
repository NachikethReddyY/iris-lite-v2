# Super-Resolution Models

This directory should contain the on-device super-resolution model files used by
`onnxruntime-react-native`. A placeholder `espcn_x2_int8.onnx` file is created so
Metro can resolve the asset during development. Replace it with the actual model
weights before running the app:

1. Download or export the desired model (for example an ESPCN/FSRCNN x2 model).
2. Save the file as `assets/models/espcn_x2_int8.onnx` (or adjust the constant in
   `services/ai/superResolution.ts`).
3. Rebuild the custom Expo dev client (`npx expo prebuild` then `npx expo run:ios`
   or `npx expo run:android`) so the native bundles include the updated asset.

Keep production-ready models under ~10 MB for acceptable startup times and
on-device inference latency.
