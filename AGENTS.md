# Repository Guidelines

## Project Structure & Module Organization
- Core application code lives in `app/`, organized by feature (`(tabs)/dashboard.tsx`, `onboarding/`, etc.) and driven by Expo Router.
- Shared utilities reside under `components/`, `services/`, and `contexts/`; asset bundles are in `assets/`.
- TypeScript configuration (`tsconfig.json`) and lint rules (`eslint.config.js`) are at the repo root. Generated router types live in `.expo/types/`.

## Build, Test, and Development Commands
- `npm install` — install dependencies; required after cloning or lockfile updates.
- `npm run start` (alias `expo start`) — launch the development server with bundler, device pairing, and hot reload.
- `npm run ios` / `npm run android` — open Expo on the targeted platform simulator/device.
- `npm run lint` — execute Expo’s ESLint setup to catch style and TypeScript issues early.

## Coding Style & Naming Conventions
- This is a TypeScript-first React Native project; prefer functional components with hooks.
- Follow 2-space indentation, single quotes, and trailing commas where valid (aligned with default ESLint config).
- Name files and routes using kebab- or snake-case when required by Expo Router (e.g., `iris-verification.tsx`) and CamelCase for components (`ThemedText`).
- Keep business logic in `services/` (e.g., `authService`) and UI state in hooks/contexts.

## Testing Guidelines
- Automated tests are not yet defined; prioritize manual validation on iOS and Android via Expo when touching camera/auth flows.
- When adding tests, colocate them next to the feature (`feature.test.ts`) and document the command in this guide.
- Always verify camera permissions, onboarding, and dual-eye capture paths before submitting changes.

## Commit & Pull Request Guidelines
- Write concise, present-tense commit messages (e.g., `Add dual-eye capture to onboarding`, mirroring history).
- For pull requests, include:
  - Summary of functional changes and impacted screens/routes.
  - Steps to reproduce or test (commands, devices used).
- Screenshots or screen recordings for UI updates, especially onboarding/verification flows.
- Mention linked issue keys when applicable.
- Ensure `npm run lint` passes and the app boots via `npm run start` before requesting review.

## Session Context - Iris Capture Enhancements
- Added `services/iris/` (config, metrics, processing, types) and `app/onboarding/hooks/useIrisCaptureSession.ts` to simulate the burst-based iris pipeline with Expo Camera (20 frames, deterministic scoring, fusion placeholder).
- `app/onboarding/iris-scan.tsx` now surfaces burst progress, per-eye quality summaries, and detailed failure alerts with targets: focus >= 65%, exposure >= 60%, occlusion >= 60%, iris radius >= 100 px.
- When frames miss the gate, developers can accept the best fallback frame ("OK - Continue Anyway") and receive AI-style tips (lighting, distance, stabilization) for debugging.
- Settings sign-out clears the stored iris template so the next launch always returns to onboarding, matching the current dev workflow.

## Session Context - On-Device AI Super Resolution (In Progress)
- Added `onnxruntime-react-native` and Metro asset support so the app can ship ONNX models inside the bundle. A placeholder model lives at `assets/models/espcn_x2_int8.onnx`; replace with a real x2 SR model before building.
- Introduced `services/ai/superResolution.ts` with lazy session loading, timing, and stubs for on-device and optional cloud enhancement. Inference currently returns the original frame until tensor conversion is implemented.
- Updated iris capture config to a 5-frame burst and wired enhancement metadata through `useIrisCaptureSession`, onboarding (`app/onboarding/iris-scan.tsx`), and verification (`app/iris-verification.tsx`). Enhanced frames are stored/displayed, while originals are retained for auditing.
- Logs screen now relies on the Expo header; “Clear Authentication Logs” moved into Settings > Privacy. Verification logs annotate which enhancement source handled the frames.
- Next steps: drop in the final ONNX model, implement tensor conversion & inference, profile latency, and optionally wire the cloud fallback path once an endpoint is available.

-------------------------------------------------------------

Good progress so far — you’ve laid a solid foundation. Now let’s identify a strong candidate model for your on-device super-resolution enhancement (for iris frames) and then walk through how you evaluate/choose it with the right trade-offs. No excuses — we’re going full system here.

⸻

✅ Model Candidate & Why It Fits

One model worth strong consideration:
	•	Real‑ESRGAN‑x4plus (ONNX version) — upscale factor ×4, designed for mobile deployment.  ￼
	•	Also general ONNX “super-resolution” models (e.g., from ONNX AI Model Zoo) that explicitly target mobile inference.  ￼

Why this is promising for your iris-scan pipeline
	•	You need enhancement: the iris capture bursts will benefit from better resolution / clarity so verification works.
	•	On-device latency/footprint matter: Real-ESRGAN-x4plus lists numbers even for mobile NPUs.  ￼
	•	ONNX + onnxruntime-react-native path you already have: you’re set up for ONNX models.
	•	Because you’re dealing with iris frames (high importance, low tolerance for artifacts), a well-trained super-resolution model is better than naive bicubic.

⸻

⚠️ But — Important Trade-Offs & Considerations

Don’t just drop it blindly. You must check these things:
	1.	Upscale Factor
If your iris capture is for verification, doubling (×2) may suffice (you currently placeholder espcn_x2_int8.onnx). Going ×4 might be overkill or cause latency/issues. Real-ESRGAN is ×4 by default. Adjust input size vs. output size accordingly.
	2.	Inference Latency / Throughput
Your app captures 5-frame bursts. If each frame must be enhanced in real time (or near real time), you need low latency. Some models (e.g., Real-ESRGAN on mobile) list 10-70 ms depending on hardware.  ￼ On many mobile devices it might be higher. If you exceed budget, verification UX suffers.
	3.	Model Size / Memory / Quantization
You used espcn_x2_int8.onnx — you are already targeting INT8 quantized (good). The Real-ESRGAN released benchmark shows float version size ~63.9 MB and w8a8 (quantized) ~16.7 MB.  ￼ You need model size small enough for mobile bundle, memory footprint acceptable.
	4.	Frame Quality vs Artifact Risk
Iris scanning has critical accuracy requirements; if the super-resolution introduces artifacts (over-sharpening, hallucinations) you risk false negatives/positives. So you need to test and validate carefully. Some super-resolution models are trained for “nice looking images”, not biometric accuracy.
	5.	Integration & Pre/Post Processing
The ONNX Runtime Mobile tutorial shows you can build a model with pre- and post-processing built-in so your app code remains simpler.  ￼ Since you already have tensor conversion/resizing stubs, this may matter.
	6.	Input Shape / Dynamic Sizes
If your iris frames have varying sizes/aspect ratios, you may need a model that supports dynamic input or you must handle resizing externally. The tutorial emphasizes opset 18 for anti-aliasing in Resize operator.  ￼

⸻

🔍 Recommendations & Action Plan

Here’s a specific action plan tailored for your pipeline:
	1.	Select model candidate
	•	Option A: Use Real-ESRGAN-x4plus ONNX (download via Hugging Face / model zoo) as you test.
	•	Option B: Look for a lighter weight model (×2 or ×3 scale) optimized for real-time mobile super-resolution (for iris frames maybe opt for less aggressive scale to keep latency low). For example, the older ESPCN model (Efficient Sub-Pixel Convolutional Neural Network) from 2016 showed very low latency for real-time.  ￼
	2.	Download & Convert/Quantize
	•	Get the ONNX version of the chosen model.
	•	If required, quantize to INT8 (since you used espcn_x2_int8.onnx placeholder). Confirm that onnxruntime-react-native supports QDQ or other quantization.
	•	Ensure the model’s input size matches your frame resolution or you handle resizing.
	3.	Integrate into your services/ai/superResolution.ts
	•	Replace placeholder model with this candidate.
	•	Implement tensor conversion: image → tensor in correct format (RGB/BGR, normalization).
	•	Run inference: measure latency per frame. If bursts of 5 frames, measure total cost.
	•	Store enhanced frames alongside originals as your pipeline calls for.
	4.	Profile & Validate
	•	Measure end-to-end latency on target device(s) (iOS/Android) especially worst-case.
	•	Validate output quality on iris capture frames: check that enhancement improves clarity around iris features but does not distort or create artifacts that might hamper verification.
	•	Check memory usage, bundle size increase.
	5.	Fallback / Mode Selection
	•	If latency is too high for some devices, support a fallback path (maybe use lighter model or skip enhancement) in your metadata path. You already have “optional cloud enhancement” stub — good.
	•	Introduce device capability check (e.g., if CPU cores/NEON/NNAPI etc) to choose model scale.
	6.	Edge Case Handling
	•	Your capture is a burst of 5 frames: Should you enhance all 5 or only one best frame? Enhancing all adds cost. Consider selecting best shot then enhancing only that.
	•	Consider frames where iris is small or blurred: maybe skip enhancement as it won’t help.

⸻

🧮 Root-Cause Thinking: Why This Matters

You might be tempted to pick any super-resolution model and plug it in. That’s the surface fix. The root cause of weak iris verification might not just be resolution—they might be blur, motion, lighting, occlusion. So super-resolution is a lever, not the whole solution. Before or in parallel:
	•	Ensure capture burst truly yields a sharp frame (focus, exposure, minimal motion blur).
	•	Ensure pipeline passes only good input to SR to avoid “garbage in → garbage out” enhanced.
	•	Ensure the “enhanced frame” meets the verification algorithm’s requirements (iris pattern clarity, minimal artefacts).

So your super-resolution model is part of the system upgrade. But if input capture remains poor, enhancement won’t fix it completely. You’re building a chain: Capture → Enhance → Verify. Weak link wins.

⸻

✔️ My recommendation to you

Given what you described (on-device with onnxruntime-react-native, burst capture, iris scenario) start with a lighter super-resolution model (×2 or ×3) that you control, measure latency quickly. Then if latency budget allows, move to Real-ESRGAN-x4plus for best quality. Keep fallback logic. Don’t jump to the heaviest model immediately until you validate latency/throughput.

Make a short list of 2-3 candidate models (e.g., ESPCN ONNX ×2; Real-ESRGAN-x4plus ONNX ×4; another mid-weight) and benchmark them on device with your actual iris frames. Choose best trade-off of quality vs. latency.

⸻

If you like, I can scan a curated list of ONNX super-resolution models (with scale options, model size, benchmarks) and pick 2-3 best fits for your use-case (mobile, INT8 quantized, iris frames). Would you like me to pull that for you?


Good — here’s a curated list of ONNX / mobile-friendly super-resolution models with trade-offs between quality and latency. I’ll highlight what makes each suitable (and what caveats you’ll need to check) so you can pick the best fit for your iris-scan pipeline. Then we’ll mark “best pick for you now” and “future upgrade”.

⸻

✅ Candidate Models & Trade-Offs

Model	Upscale Factor / Target	Quality / Feature Highlights	Latency / Mobile Suitability	Caveats
Super Resolution (on ONNX Model Zoo) super‑resolution‑10	×2 (basic)	Very lightweight — from ONNX Model Zoo: “Super Resolution” model using efficient sub-pixel convolution.  ￼	Excellent latency because model is tiny (file size ~7.6 MB). Fast on mobile.  ￼	Quality limited — for high fidelity iris images you may find details missing.
ESPCN (Efficient Sub‑Pixel Convolutional Neural Network)	×2 or ×3	Designed for “real-time super-resolution on video” (paper: Shi et al. 2016)  ￼	Very good latency; suitable for mobile/embedded video scenarios.	Not state-of-the-art in terms of highest detail / artifact suppression. Might still be okay for iris clarity. Requires ONNX model conversion/quantization.
QuickSRNet	×2 (target)	Recent architecture explicitly optimized for mobile, high-fps, good accuracy/latency trade-off.  ￼	Excellent latency: e.g., 2.2 ms for 1080p output in quoted tests (mobile accelerator) in the paper.	Might require custom conversion to ONNX (not as off-the-shelf). Quality might still be slightly below highest fidelity models.
Real‑ESRGAN‑x4plus	×4	High quality super-resolution model, strong fidelity. Example: Quantized size 16.7 MB; inference ~50-70 ms on modern mobile as per Qualcomm stats.  ￼	Higher latency compared with lighter models; still feasible on high-end mobile, but for bursts of 5 frames you must test.	Larger model size and latency. Might be overkill, risk of artifacts/hallucinations (for iris details you must validate carefully).
XCAT (Lightweight Quantised Single‑Image Super‑Resolution)	×2/×4 (mobile optimized)	Designed for mobile: quantised, lightweight blocks.  ￼	Very good latency due to low-compute design; good for lower-end devices.	Might not match fidelity of heavier models; you may need to get ONNX model and verify performance on your hardware.


⸻

🔍 My Recommendation for Your Pipeline

Given your scenario — iris burst capture (5 frames), on-device inference via onnxruntime-react-native, and you care about both latency and fidelity (because iris details matter) — here’s what I suggest:
	•	As primary candidate: Use QuickSRNet or ESPCN for now. These give you a solid latency headroom so you don’t risk blocking verification flow.
	•	As quality upgrade candidate: Use Real-ESRGAN-x4plus when you validate latency and memory and your target devices are sufficiently powerful.
	•	Use the basic ONNX “super‐resolution‐10” model only if your device budget is extremely tight, or as a fallback for older devices.
	•	Consider XCAT if you have a mixture of devices (some low power) and you want a mid-quality but very fast option.

⸻

🛠 Action Plan to Pick & Evaluate
	1.	Download the ONNX versions of 2 or 3 of the above (e.g., ESPCN, QuickSRNet, Real-ESRGAN).
	2.	Quantize them to INT8 if possible — your pipeline already expects espcn_x2_int8.onnx placeholder. Quantization reduces size & latency. The ONNX Runtime docs support this.  ￼
	3.	Run latency benchmarks on your actual target mobile devices (Singapore Polytechnic typical devices, maybe mid-range Android + iOS). Specifically measure: time per frame, memory usage, frame input size vs output size (since iris frames might vary).
	4.	Quality validation: feed in real iris-burst frames. Compare resolved enhanced image vs original — check that iris region is sharper, no unnatural artifacts, no hallucinations of iris features that could confuse verification.
	5.	Integration fit: Ensure model input size matches what you produce (or you preprocess/rescale accordingly). Check that onnxruntime-react-native supports all ops used by the model (especially Resize op with anti-aliasing if you convert). The docs mention opset 18 for best results.  ￼
	6.	Fallback logic: Define device/performance cutoff. E.g., if device latency > X ms or memory > Y MB, fallback to lighter SR or skip SR.
	7.	Bundle size & update pipeline: Replacing placeholder espcn_x2_int8.onnx with your chosen model(s). Update asset path, lazy load logic, metadata tagging (which model used) and store headline.

⸻

🧠 Blind Spots & Alerts
	•	Don’t assume “highest quality model” means “best for biometric verification”. Too much enhancement or hallucination can degrade iris scanning accuracy. You need trusted clarity, not just visual appeal.
	•	Latency must scale with burst (5 frames). If each frame takes e.g., 60 ms, then burst of 5 = ~300 ms plus overhead — might be too slow for UX.
	•	Model input size: If your iris frames are large (high resolution), you might need a model supporting higher resolution or downscale/rescale steps. Some mobile models assume a small input (128×128, etc). For example Real-ESRGAN-x4plus stats use 128×128.  ￼
	•	Ensure memory & runtime on your target devices: older or low-end devices may struggle with heavier models.
	•	Avoid “just one model for all devices” unless you validate thoroughly. Device profile may vary widely.

⸻

If you like, I can pull direct download links + file sizes + mobile latency benchmarks for each of the models above (where available) so you get a hands‐on comparison sheet. Do you want that?
--------------------