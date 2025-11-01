# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Starting Development
```bash
npm install              # Install dependencies after cloning or lockfile updates
npm run start            # Launch Expo dev server with bundler, hot reload (alias: expo start)
npm run ios              # Open on iOS simulator
npm run android          # Open on Android emulator/device
```

### Code Quality
```bash
npm run lint             # Run ESLint to catch style and TypeScript issues
```

### Testing on Physical Devices
- Run `npm run start` and scan the QR code with Expo Go app
- Camera and biometric features require physical devices (simulators have limited support)

## Architecture Overview

### File-Based Routing (Expo Router)
The app uses Expo Router v6 with file-based navigation. Key routing logic:

- **`/app/index.tsx`** - Smart entry point that checks for `iris_template` in SecureStore
  - Template exists → Navigate to `/(tabs)/dashboard`
  - No template → Force user through onboarding flow starting at `/onboarding/start`

- **`/app/(tabs)/`** - Tab navigation for authenticated users (dashboard, settings)

- **`/app/onboarding/`** - Linear enrollment flow:
  ```
  start → landing → about → terms → create-pin → connect-pi → iris-scan → dashboard
  ```

- **`/app/iris-verification.tsx`** - Standalone screen for re-authentication

### State Management Pattern

**Context + Service Layer Architecture:**

```
UI Components
    ↓
Custom Hooks (useIrisCaptureSession)
    ↓
Service Layer (authService, iris processing)
    ↓
Expo APIs (SecureStore, Camera, LocalAuthentication)
```

**AuthContext** (`/contexts/AuthContext.tsx`):
- Wraps entire app at root level
- Manages global auth state: `isAuthenticated`, `sessionExpiry`, `user`
- **Critical behavior**: `checkAuth()` always logs out on app mount (forces fresh authentication on restart)

**Service Layer** (`/services/`):
- All business logic and data persistence
- Never call SecureStore/LocalAuthentication directly from components
- Services are singletons (e.g., `authService`)

### Iris Authentication Pipeline

**Enrollment Flow** (`/app/onboarding/iris-scan.tsx`):
1. Request camera permissions
2. For each eye (left, then right):
   - Capture 5-frame burst at 80ms intervals via `useIrisCaptureSession`
   - Score each frame on focus, gaze, exposure, occlusion, iris radius (see `/services/iris/metrics.ts`)
   - Filter frames through quality gate (configurable thresholds in `/services/iris/config.ts`)
   - If no frames pass: show fallback dialog with improvement tips
   - Fuse best frame(s) and run AI super-resolution (on-device ONNX → cloud fallback)
3. Build `IrisTemplate` with enhanced frames + quality metadata
4. Store via `authService.storeIrisTemplate()` in SecureStore
5. Navigate to dashboard

**Verification Flow** (`/app/iris-verification.tsx`):
- Same capture pipeline as enrollment
- Call `authService.verifyIrisMatch([leftFrame, rightFrame])`
- **Note**: Current implementation uses mock matching logic (random 70-100% confidence)
- If confidence > 85%: mark authenticated, set 10-minute session, navigate to dashboard
- If failed: show detailed feedback and allow retry

### Key Services

**`authService.ts`** - Central authentication hub:
- Biometric integration (Face ID/Touch ID via Expo LocalAuthentication)
- PIN management (store/verify/change using SecureStore)
- Iris template CRUD operations
- Session management (default 10-minute timeout)
- Authentication logging with timestamps, confidence scores, failure reasons
- Fully offline by design (no external AI dependencies)

**`/services/iris/`** - Multi-frame capture pipeline:
- `config.ts` - Capture tuning parameters (burst count, intervals, quality thresholds)
- `metrics.ts` - Frame quality scoring algorithm with weighted composite (focus 35%, gaze 20%, exposure 20%, occlusion 15%, iris radius 10%)
- `processing.ts` - Frame evaluation, filtering, fusion logic
- `types.ts` - TypeScript interfaces for frames, quality metrics, capture results

**`/services/ai/superResolution.ts`** - Image enhancement:
- On-device super-resolution via ONNX Runtime (CoreML on iOS, NNAPI on Android, CPU fallback)
- 500ms time budget for on-device processing
- QuickSRNet x2 INT8 model bundled under `assets/models/job_jgje2lm15_optimized_onnx`
- Emits enhanced base64 plus timing metadata for capture flows

**`useIrisCaptureSession`** hook (`/app/onboarding/hooks/useIrisCaptureSession.ts`):
- Encapsulates complex multi-frame capture state machine
- Phases: `idle` → `capturing` → `processing` → `idle` (or `error`)
- Exposes: `captureEye()`, `acceptFallback()`, `reset()`, `progress`, `error`, `fallbackResult`
- Provides detailed error messages with actionable tips (e.g., "focus 45%, needs improvement on lighting")

## Module Resolution

The codebase uses `@/` as an alias for the project root:

```typescript
import { authService } from '@/services/authService'
import { ThemedText } from '@/components/themed-text'
```

**Configured in:**
- `babel.config.js` - `babel-plugin-module-resolver` with alias `'@': '.'`
- `metro.config.js` - `extraNodeModules: { '@': __dirname }`
- `tsconfig.json` - `paths: { "@/*": ["./*"] }`

## Critical Configuration

### Secure Storage Keys (expo-secure-store)
All sensitive data uses hardware-backed encryption:
- `iris_template` - Biometric enrollment data (IrisTemplate JSON)
- `user_pin` - Security PIN
- `auth_logs` - Authentication history (last 50 entries)
- `session_expiry` - Temporary session timestamp
- `isAuthenticated` - Auth flag

### Expo Configuration (`app.json`)
- New Architecture enabled: `"newArchEnabled": true`
- Typed routes: `"experiments": { "typedRoutes": true }`
- React Compiler: `"reactCompiler": true`
- Required plugins: `expo-router`, `expo-local-authentication`, `expo-secure-store`

### Metro Bundler (`metro.config.js`)
- Custom asset extension: `.onnx` files bundled as assets
- Path alias resolution for `@/` imports

### Environment Variables (`.env`)
- No API keys required; pipeline runs entirely offline.

## Important Conventions

### Component Patterns
- **Themed Components**: Use `<ThemedView>` and `<ThemedText>` for automatic light/dark mode adaptation
- **Icons**: Use `<IconSymbol>` for platform-specific icons (SF Symbols on iOS)
- **Haptics**: Use `<HapticTab>` for tactile feedback on tab navigation

### Data Flow
- **Never** call SecureStore or LocalAuthentication directly from UI components
- Always route data operations through service layer methods
- Use context for global state, custom hooks for component-level state machines

### Error Handling
- Services use try-catch with `console.error()` logging
- UI shows `Alert.alert()` for user-facing errors
- Implement graceful degradation (e.g., AI enhancement falls back to original image)

### Session Management
- Sessions expire after 10 minutes (configurable via `authService.setSessionTimeout()`)
- Session expiry displayed on dashboard
- `AuthContext.checkAuth()` clears auth on mount → forces fresh authentication on app restart

## Non-Obvious Implementation Details

### Mock Biometric Matching
`authService.verifyIrisMatch()` returns a **mock random confidence** between 70-100%. Real implementation requires:
- Feature extraction from iris images
- Template encoding (e.g., IrisCode algorithm)
- Hamming distance calculation for matching
- Liveness detection to prevent spoofing

### Quality Gate with Fallback
If no frames pass quality thresholds (`passesQualityGate()` in `metrics.ts`):
1. Show detailed error with specific metrics (e.g., "focus 45%, exposure 55%")
2. Provide actionable tips (e.g., "Move to brighter lighting", "Hold device steady")
3. Offer fallback button: "OK - Continue Anyway" to proceed with best available frame
4. Mark capture as `isFallback: true` for audit tracking

This balances quality requirements with usability (prevents infinite retry loops).

### Dual-Eye Capture
Always captures left and right eyes separately:
- Improves accuracy (two independent biometric samples)
- Allows per-eye enhancement strategies
- Stored as separate frames in `IrisTemplate.frames[]`

### AI Enhancement Strategy
1. **Try on-device first**: Privacy-preserving, low-latency ONNX inference
2. **Cloud fallback**: Only if on-device fails or exceeds 500ms budget
3. **Graceful degradation**: Return original image if both fail
4. **Metadata tracking**: `enhancement.source` logged as `'on-device'`, `'cloud'`, or `'none'`

## Common Development Tasks

### Modifying Capture Quality Thresholds
Edit `/services/iris/config.ts`:
```typescript
QUALITY_GATE: {
  focus: 0.65,      // Minimum focus score (0-1)
  exposure: 0.60,   // Minimum exposure score
  occlusion: 0.60,  // Minimum occlusion score
  irisRadiusMin: 100 // Minimum iris size in pixels
}
```

Edit `/services/iris/metrics.ts` to adjust scoring weights in `computeFrameQuality()`.

### Changing Session Timeout
```typescript
// In authService.ts or before first auth call
authService.setSessionTimeout(600000) // 10 minutes in milliseconds
```

### Adding New Onboarding Steps
1. Create new screen in `/app/onboarding/your-step.tsx`
2. Add export to `/app/onboarding/_layout.tsx`
3. Update navigation chain (usually from previous step's continue button)
4. Follow file-based routing conventions (kebab-case for file names)

### Implementing Real ONNX Model
1. Train or obtain ESPCN x2 super-resolution model (ONNX format)
2. Place model file at `/assets/models/espcn_x2_int8.onnx` (currently empty placeholder)
3. Implement tensor conversion in `/services/ai/superResolution.ts`:
   - Convert base64 → image → tensor (NCHW format)
   - Run `session.run()` with input tensor
   - Convert output tensor → image → base64
4. Test latency on target devices, adjust `ON_DEVICE_TIME_BUDGET_MS` if needed

### Implementing Real Iris Matching
Replace mock logic in `authService.verifyIrisMatch()`:
1. Extract iris features from captured frames (e.g., using Gabor filters)
2. Encode into IrisCode template (2048-bit binary template)
3. Compare with stored template using Hamming distance
4. Calculate confidence score based on matching bits
5. Implement liveness detection (check for video replay attacks)

### Accessing Raspberry Pi Integration
Placeholder screen at `/app/onboarding/connect-pi.tsx` is intended for Bluetooth pairing with external iris scanner hardware. Current implementation is mock UI only.

## Testing Notes

### Manual Testing Requirements
- **Camera permissions**: Test denial and retry flows
- **Biometric failures**: Test low-quality captures, fallback acceptance
- **Session expiry**: Verify 10-minute timeout and re-authentication
- **Onboarding**: Always test full onboarding flow on fresh install
- **Platform-specific**: Test Face ID on iOS, fingerprint on Android

### Known Limitations
- Simulators have limited biometric support (use physical devices)
- ONNX inference not implemented (returns original frame)
- Iris matching is mock logic (random confidence)
- Cloud enhancement endpoint not configured
- Raspberry Pi integration is placeholder UI

## Project Structure (Key Files)

```
/app
  index.tsx                          # Entry point with onboarding check
  _layout.tsx                        # Root layout with AuthProvider
  (tabs)/
    dashboard.tsx                    # Main authenticated view
    settings.tsx                     # Privacy, device management
  onboarding/
    iris-scan.tsx                    # Enrollment UI
    hooks/useIrisCaptureSession.ts   # Capture state machine
  iris-verification.tsx              # Re-authentication UI

/services
  authService.ts                     # Central authentication hub
  iris/
    config.ts                        # Capture tuning parameters
    metrics.ts                       # Frame quality scoring
    processing.ts                    # Frame fusion pipeline
    types.ts                         # TypeScript interfaces
  ai/
    superResolution.ts               # ONNX-based enhancement

/contexts
  AuthContext.tsx                    # Global authentication state

/assets/models
  espcn_x2_int8.onnx                 # Super-resolution model (placeholder)
```

## Commit Guidelines

From `agents.md`:
- Write concise, present-tense commit messages (e.g., "Add dual-eye capture to onboarding")
- Include summary of functional changes and impacted screens/routes
- Mention steps to reproduce or test (commands, devices used)
- Add screenshots or recordings for UI updates (especially onboarding/verification flows)
- Ensure `npm run lint` passes before committing
- Verify app boots via `npm run start`
