# Implementation Plan

> **Target Audience:** Developer implementing the expo-audiocake fork  
> **Estimated Time:** 8-11 days  
> **Prerequisites:** Swift, TypeScript, Expo modules experience

## Overview

This plan guides you through forking expo-audio and integrating advanced iOS AVAudioSession features. Each phase includes specific tasks, acceptance criteria, and reference code.

---

## Phase 1: Fork Setup and Preparation (Day 1)

### Tasks

#### 1.1 Fork expo Repository
```bash
# Fork https://github.com/expo/expo on GitHub
# Clone your fork
git clone https://github.com/YOUR_USERNAME/expo.git
cd expo
```

#### 1.2 Create Feature Branch
```bash
git checkout -b feat/advanced-audio-session-control
cd packages/expo-audio
```

#### 1.3 Understand Current Structure
Familiarize yourself with:
- `ios/AudioModule.swift` - Main iOS module (focus here)
- `ios/AudioRecorder.swift` - Recorder implementation
- `ios/AudioUtils.swift` - Utility functions
- `src/AudioModule.types.ts` - TypeScript types
- `src/ExpoAudio.ts` - Main TypeScript exports

#### 1.4 Study Reference Implementation
Review `reference/av-session-override/` in this repo:
- `ios/AVSessionOverrideModule.swift` - Your primary reference
- Study `configureStereoDataSource()` (lines 197-215)
- Study `mapPolarPattern()`, `mapOrientation()` helpers
- Study observer pattern for auto-reapply (lines 99-125)

### Acceptance Criteria
- [ ] Fork created and cloned
- [ ] Feature branch exists
- [ ] You understand expo-audio's current structure
- [ ] You've read through AVSessionOverrideModule.swift

### Time Estimate: 1 day

---

## Phase 2: TypeScript Type Definitions (Day 2)

### Tasks

#### 2.1 Extend AudioMode Type

**File:** `src/AudioModule.types.ts`

Add after the existing AudioMode definition:

```typescript
// Add these new type definitions
export type AudioSessionPolarPattern = 
  | 'stereo' 
  | 'cardioid' 
  | 'omnidirectional' 
  | 'subcardioid';

export type AudioSessionOrientation = 
  | 'portrait' 
  | 'portraitUpsideDown' 
  | 'landscapeLeft' 
  | 'landscapeRight' 
  | 'none';

// Extend AudioMode interface
export type AudioMode = {
  playsInSilentMode?: boolean;
  allowsRecording?: boolean;
  interruptionMode?: InterruptionMode;
  shouldPlayInBackground?: boolean;
  shouldRouteThroughEarpiece?: boolean;
  interruptionModeAndroid?: InterruptionModeAndroid;
  
  // NEW: Add iOS advanced configuration
  ios?: {
    /** 
     * Configure polar pattern for stereo/directional recording.
     * Requires preferredInput and dataSourceName to be set.
     * @platform ios
     */
    polarPattern?: AudioSessionPolarPattern;
    
    /** 
     * Select preferred audio input device (e.g., 'builtInMic').
     * @platform ios
     */
    preferredInput?: string;
    
    /** 
     * Select data source name (e.g., 'front', 'back').
     * Used with polarPattern for stereo recording.
     * @platform ios
     */
    dataSourceName?: string;
    
    /** 
     * Set input orientation for stereo field alignment.
     * @platform ios
     */
    inputOrientation?: AudioSessionOrientation;
    
    /** 
     * Preferred sample rate in Hz (e.g., 48000).
     * System may use different rate; this is a hint.
     * @platform ios
     */
    preferredSampleRate?: number;
    
    /** 
     * IO buffer duration in seconds (e.g., 0.005).
     * @platform ios
     */
    ioBufferDuration?: number;
    
    /** 
     * Enable auto-reapply of session config on route changes.
     * Default: true
     * @platform ios
     */
    autoReapplyOnRouteChange?: boolean;
  };
};
```

#### 2.2 Add AudioSessionState Type

```typescript
/**
 * Current audio session state (iOS only)
 */
export type AudioSessionState = {
  /** Current session category */
  category: string;
  /** Current session mode */
  mode: string;
  /** Current sample rate in Hz */
  sampleRate: number;
  /** Current IO buffer duration in seconds */
  ioBufferDuration: number;
  /** Current output route port type */
  outputRoute: string;
};
```

#### 2.3 Update AudioModule Interface

```typescript
export interface AudioModule {
  // ... existing methods ...
  
  /**
   * Get current audio session state (iOS only).
   * Returns null on Android/Web.
   * @platform ios
   */
  getAudioSessionState(): AudioSessionState | null;
}
```

### Reference Code
- See `API_DESIGN.md` for complete type specifications
- See `reference/av-session-override/src/AvSessionOverrideModule.ts` for similar types

### Acceptance Criteria
- [ ] AudioMode type extended with `ios?:` property
- [ ] All new types (PolarPattern, Orientation) defined
- [ ] AudioSessionState type added
- [ ] AudioModule interface includes getAudioSessionState()
- [ ] TypeScript compiles without errors

### Time Estimate: 0.5 day

---

## Phase 3: iOS Implementation - Core Extension (Days 3-4)

### Tasks

#### 3.1 Add Properties to AudioModule

**File:** `ios/AudioModule.swift`

Add after line ~14 (after `private var sessionOptions`):

```swift
// NEW: Properties for advanced session configuration
private var desiredPolarPattern: AVAudioSession.PolarPattern?
private var desiredInputOrientation: AVAudioSession.StereoOrientation?
private var desiredSampleRate: Double?
private var desiredIOBufferDuration: Double?
private var desiredPreferredInput: String?
private var desiredDataSourceName: String?
private var autoReapplyOnRouteChange: Bool = true
```

#### 3.2 Extend setupInterruptionHandling()

**File:** `ios/AudioModule.swift`

Modify the existing `setupInterruptionHandling()` function (~line 326):

```swift
private func setupInterruptionHandling() {
  let center = NotificationCenter.default
  let session = AVAudioSession.sharedInstance()

  center.addObserver(
    self,
    selector: #selector(handleInterruption),
    name: AVAudioSession.interruptionNotification,
    object: session
  )

  center.addObserver(
    self,
    selector: #selector(handleRouteChange),
    name: AVAudioSession.routeChangeNotification,
    object: session
  )
  
  // NEW: Add media services reset observer
  center.addObserver(
    self,
    selector: #selector(handleMediaServicesReset),
    name: AVAudioSession.mediaServicesWereResetNotification,
    object: nil
  )
}
```

#### 3.3 Extend setAudioMode()

**File:** `ios/AudioModule.swift`

After the existing `setAudioMode()` logic (~line 550), add:

```swift
private func setAudioMode(mode: AudioMode) throws {
  // ... existing code for category/options/mode ...
  // (keep all existing logic up to line 549)
  
  if sessionOptions.isEmpty {
    try session.setCategory(category, mode: .default)
  } else {
    try session.setCategory(category, options: sessionOptions)
  }
  
  // NEW: Apply iOS advanced configuration if provided
  if let iosConfig = mode.ios {
    try applyAdvancedSessionConfig(iosConfig)
  }
}
```

### Reference Code
- See `reference/av-session-override/ios/AVSessionOverrideModule.swift` lines 34-93
- Property declarations similar to `desiredState` in reference (lines 19-30)

### Acceptance Criteria
- [ ] New properties added to AudioModule class
- [ ] setupInterruptionHandling() includes all three observers
- [ ] setAudioMode() calls applyAdvancedSessionConfig()
- [ ] Code compiles in Xcode

### Time Estimate: 1 day

---

## Phase 4: iOS Implementation - Advanced Config Methods (Day 5)

### Tasks

#### 4.1 Implement applyAdvancedSessionConfig()

**File:** `ios/AudioModule.swift`

Add this new method after `setAudioMode()`:

```swift
/**
 * Applies advanced iOS audio session configuration.
 * Called after basic category/mode/options are set.
 */
private func applyAdvancedSessionConfig(_ config: AudioModeIOSConfig) throws {
  let session = AVAudioSession.sharedInstance()
  
  // Sample rate
  if let sampleRate = config.preferredSampleRate {
    try session.setPreferredSampleRate(sampleRate)
    self.desiredSampleRate = sampleRate
  }
  
  // IO buffer duration
  if let bufferDuration = config.ioBufferDuration {
    try session.setPreferredIOBufferDuration(bufferDuration)
    self.desiredIOBufferDuration = bufferDuration
  }
  
  // Store values for later reapply
  self.desiredPreferredInput = config.preferredInput
  self.desiredDataSourceName = config.dataSourceName
  
  // Input orientation
  if let orientation = config.inputOrientation {
    let avOrientation = try mapOrientation(orientation)
    try session.setPreferredInputOrientation(avOrientation)
    self.desiredInputOrientation = avOrientation
  }
  
  // Polar pattern (requires preferred input + data source)
  // This MUST be done AFTER setCategory() to work correctly
  if let polarPattern = config.polarPattern,
     let preferredInputType = config.preferredInput {
    try configurePreferredInput(session: session, inputType: preferredInputType)
    
    if let dataSourceName = config.dataSourceName {
      try configureStereoDataSource(
        session: session,
        dataSourceName: dataSourceName,
        polarPattern: polarPattern
      )
    } else {
      throw Exception(
        name: "MissingDataSourceName",
        description: "dataSourceName is required when polarPattern is specified"
      )
    }
  }
  
  // Auto-reapply setting
  if let autoReapply = config.autoReapplyOnRouteChange {
    self.autoReapplyOnRouteChange = autoReapply
  }
}
```

#### 4.2 Implement configurePreferredInput()

Copy from `reference/av-session-override/ios/AVSessionOverrideModule.swift` lines 184-195:

```swift
/**
 * Configures the preferred audio input device.
 * Currently only supports built-in microphone.
 */
private func configurePreferredInput(session: AVAudioSession, inputType: String) throws {
  guard inputType.lowercased() == "builtinmic" else {
    throw Exception(name: "InvalidInputType", description: "Only 'builtInMic' is supported")
  }
  
  guard let availableInputs = session.availableInputs,
        let builtInMicInput = availableInputs.first(where: { $0.portType == .builtInMic }) else {
    throw Exception(name: "NoBuiltInMic", description: "The device must have a built-in microphone")
  }
  
  try session.setPreferredInput(builtInMicInput)
}
```

#### 4.3 Implement configureStereoDataSource()

Copy from `reference/av-session-override/ios/AVSessionOverrideModule.swift` lines 197-215:

```swift
/**
 * Configures stereo recording by setting polar pattern on data source.
 * This is the CRITICAL method for true stereo recording.
 */
private func configureStereoDataSource(
  session: AVAudioSession,
  dataSourceName: String,
  polarPattern: String
) throws {
  let avPolarPattern = try mapPolarPattern(polarPattern)
  
  guard let preferredInput = session.preferredInput,
        let dataSources = preferredInput.dataSources,
        let dataSource = dataSources.first(where: { 
          $0.dataSourceName.lowercased() == dataSourceName.lowercased() 
        }),
        let supportedPolarPatterns = dataSource.supportedPolarPatterns else {
    throw Exception(
      name: "DataSourceNotFound",
      description: "Could not find data source '\(dataSourceName)' or it has no supported polar patterns"
    )
  }
  
  guard supportedPolarPatterns.contains(avPolarPattern) else {
    throw Exception(
      name: "PolarPatternNotSupported",
      description: "The selected data source does not support polar pattern '\(polarPattern)'"
    )
  }
  
  // This is the key call that enables true stereo recording
  try dataSource.setPreferredPolarPattern(avPolarPattern)
  try preferredInput.setPreferredDataSource(dataSource)
  
  // Store for reapply
  self.desiredPolarPattern = avPolarPattern
}
```

### Reference Code
- See `reference/av-session-override/ios/AVSessionOverrideModule.swift`
- Lines 149-180 for `apply()` method (similar structure)
- Lines 184-215 for input/data source configuration

### Acceptance Criteria
- [ ] applyAdvancedSessionConfig() method implemented
- [ ] configurePreferredInput() method implemented
- [ ] configureStereoDataSource() method implemented
- [ ] Methods follow reference implementation logic
- [ ] Code compiles in Xcode

### Time Estimate: 1 day

---

## Phase 5: iOS Implementation - Mapping & Auto-Reapply (Day 6)

### Tasks

#### 5.1 Implement Mapping Functions

Copy these from `reference/av-session-override/ios/AVSessionOverrideModule.swift`:

```swift
/**
 * Maps string polar pattern to AVAudioSession.PolarPattern enum.
 */
private func mapPolarPattern(_ pattern: String) throws -> AVAudioSession.PolarPattern {
  switch pattern.lowercased() {
    case "stereo": return .stereo
    case "cardioid": return .cardioid
    case "omnidirectional": return .omnidirectional
    case "subcardioid": return .subcardioid
    default: throw Exception(
      name: "InvalidPolarPattern",
      description: "Unknown polar pattern: \(pattern)"
    )
  }
}

/**
 * Maps string orientation to AVAudioSession.StereoOrientation enum.
 */
private func mapOrientation(_ orientation: String) throws -> AVAudioSession.StereoOrientation {
  switch orientation.lowercased() {
    case "portrait": return .portrait
    case "portraitupsidedown", "portrait-upside-down": return .portraitUpsideDown
    case "landscapeleft", "landscape-left": return .landscapeLeft
    case "landscaperight", "landscape-right": return .landscapeRight
    case "none", "default": return .none
    default: throw Exception(
      name: "InvalidOrientation",
      description: "Unknown stereo orientation: \(orientation)"
    )
  }
}
```

#### 5.2 Implement reapplyAdvancedConfig()

```swift
/**
 * Reapplies advanced session configuration.
 * Called after route changes or interruptions to maintain settings.
 */
private func reapplyAdvancedConfig() throws {
  let session = AVAudioSession.sharedInstance()
  
  // Reapply sample rate
  if let sampleRate = desiredSampleRate {
    try session.setPreferredSampleRate(sampleRate)
  }
  
  // Reapply buffer duration
  if let bufferDuration = desiredIOBufferDuration {
    try session.setPreferredIOBufferDuration(bufferDuration)
  }
  
  // Reapply input orientation
  if let orientation = desiredInputOrientation {
    try session.setPreferredInputOrientation(orientation)
  }
  
  // Reapply polar pattern (CRITICAL for maintaining stereo recording)
  // This is the most important part of auto-reapply
  if let polarPattern = desiredPolarPattern,
     let preferredInput = desiredPreferredInput,
     let dataSourceName = desiredDataSourceName {
    
    // Reconfigure input and data source
    try configurePreferredInput(session: session, inputType: preferredInput)
    
    // Find and set data source with polar pattern
    if let input = session.preferredInput,
       let dataSources = input.dataSources,
       let dataSource = dataSources.first(where: { 
         $0.dataSourceName.lowercased() == dataSourceName.lowercased() 
       }) {
      try dataSource.setPreferredPolarPattern(polarPattern)
      try input.setPreferredDataSource(dataSource)
    }
  }
}
```

#### 5.3 Extend handleRouteChange()

Modify the existing `handleRouteChange()` method to add reapply:

```swift
@objc private func handleRouteChange(_ notification: Notification) {
  // ... existing route change logic ...
  
  // NEW: Reapply advanced config after route change
  if autoReapplyOnRouteChange {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      do {
        try self?.reapplyAdvancedConfig()
      } catch {
        // Log but don't crash
        print("expo-audiocake: Failed to reapply session config after route change: \(error)")
      }
    }
  }
}
```

#### 5.4 Add handleMediaServicesReset()

```swift
/**
 * Handles media services reset notification.
 * iOS sends this when audio services are restarted.
 */
@objc private func handleMediaServicesReset(_ notification: Notification) {
  guard autoReapplyOnRouteChange else { return }
  
  DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
    do {
      try self?.reapplyAdvancedConfig()
    } catch {
      print("expo-audiocake: Failed to reapply session config after media services reset: \(error)")
    }
  }
}
```

### Reference Code
- See `reference/av-session-override/ios/AVSessionOverrideModule.swift`
- Lines 234-276 for mapping functions
- Lines 99-133 for observer pattern and reapply logic

### Acceptance Criteria
- [ ] mapPolarPattern() implemented
- [ ] mapOrientation() implemented
- [ ] reapplyAdvancedConfig() implemented
- [ ] handleRouteChange() extended with reapply
- [ ] handleMediaServicesReset() implemented
- [ ] Auto-reapply works after headphone plug/unplug

### Time Estimate: 1 day

---

## Phase 6: iOS Implementation - Session State Query (Day 7)

### Tasks

#### 6.1 Add getAudioSessionState() Function

**File:** `ios/AudioModule.swift`

Add to `definition()` section (around line 35):

```swift
Function("getAudioSessionState") { () -> [String: Any]? in
  #if os(iOS)
  let session = AVAudioSession.sharedInstance()
  return [
    "category": session.category.rawValue,
    "mode": session.mode.rawValue,
    "sampleRate": session.sampleRate,
    "ioBufferDuration": session.ioBufferDuration,
    "outputRoute": session.currentRoute.outputs.first?.portType.rawValue ?? "unknown"
  ]
  #else
  return nil
  #endif
}
```

### Reference Code
- See `reference/av-session-override/ios/AVSessionOverrideModule.swift` lines 83-92

### Acceptance Criteria
- [ ] getAudioSessionState() function added to definition()
- [ ] Returns correct session information
- [ ] Returns nil on non-iOS platforms
- [ ] Can be called from TypeScript

### Time Estimate: 0.5 day

---

## Phase 7: Android & Web Stubs (Day 7)

### Tasks

#### 7.1 Android Stub

**File:** `android/src/main/java/expo/modules/audio/AudioModule.kt`

Add:

```kotlin
@ExpoMethod
fun getAudioSessionState(): Map<String, Any>? {
  // Android doesn't need advanced session control
  // Return null to indicate not available
  return null
}
```

Note: The `ios?:` config in AudioMode is optional, so Android will ignore it.

#### 7.2 Web Stub

**File:** `src/AudioModule.web.ts`

Add:

```typescript
export function getAudioSessionState(): AudioSessionState | null {
  // Web doesn't have audio session concept
  return null;
}
```

**File:** `src/ExpoAudio.web.ts`

Export the function:

```typescript
export { getAudioSessionState } from './AudioModule.web';
```

### Acceptance Criteria
- [ ] Android stub returns null
- [ ] Web stub returns null
- [ ] No TypeScript/Kotlin errors
- [ ] Platforms build successfully

### Time Estimate: 0.5 day

---

## Phase 8: TypeScript Exports (Day 8)

### Tasks

#### 8.1 Export getAudioSessionState()

**File:** `src/ExpoAudio.ts`

Add after `setAudioModeAsync()`:

```typescript
/**
 * Get the current audio session state (iOS only).
 * 
 * Returns information about the current audio session including
 * category, mode, sample rate, and output route.
 * 
 * @returns Audio session state or null on Android/Web
 * 
 * @example
 * ```ts
 * import { getAudioSessionState } from 'expo-audio';
 * 
 * const state = getAudioSessionState();
 * if (state) {
 *   console.log('Category:', state.category);
 *   console.log('Sample rate:', state.sampleRate);
 *   console.log('Output route:', state.outputRoute);
 * }
 * ```
 * 
 * @platform ios
 */
export function getAudioSessionState(): AudioSessionState | null {
  return AudioModule.getAudioSessionState();
}
```

#### 8.2 Update Package Exports

Ensure the function is exported from the main entry point.

### Acceptance Criteria
- [ ] getAudioSessionState() exported from src/ExpoAudio.ts
- [ ] Function has proper JSDoc comments
- [ ] TypeScript compilation succeeds
- [ ] Can be imported by users

### Time Estimate: 0.5 day

---

## Phase 9: Documentation & Examples (Day 9)

### Tasks

#### 9.1 Update README

Create comprehensive README for expo-audiocake explaining:
- What's different from expo-audio
- When to use this fork
- How to install
- Basic usage examples
- API reference link

#### 9.2 Create Usage Examples

**File:** `examples/stereo-recording.ts`

```typescript
import { useAudioRecorder, setAudioModeAsync } from 'expo-audiocake';

// Configure for stereo recording
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
  ios: {
    polarPattern: 'stereo',
    preferredInput: 'builtInMic',
    dataSourceName: 'front',
    inputOrientation: 'landscapeLeft',
    preferredSampleRate: 48000,
    autoReapplyOnRouteChange: true
  }
});

const recorder = useAudioRecorder(/* config */);
await recorder.record();
// Records true stereo audio with L/R separation
```

**File:** `examples/session-state-query.ts`

```typescript
import { getAudioSessionState } from 'expo-audiocake';

const state = getAudioSessionState();
if (state) {
  console.log('Audio routing to:', state.outputRoute);
  console.log('Sample rate:', state.sampleRate);
}
```

#### 9.3 Create Migration Guide

Document how to migrate from expo-audio to expo-audiocake.

### Acceptance Criteria
- [ ] README is comprehensive
- [ ] Examples are clear and runnable
- [ ] Migration guide exists
- [ ] API documentation is complete

### Time Estimate: 1 day

---

## Phase 10: Testing (Days 10-11)

### Tasks

Follow `TESTING_PLAN.md` for comprehensive test procedures.

#### 10.1 Basic Recording Tests
- Mono recording works
- Stereo recording works
- True stereo validation (L/R differ)

#### 10.2 Session Configuration Tests
- Polar pattern is set correctly
- Input orientation is applied
- Sample rate hint is respected

#### 10.3 Auto-Reapply Tests
- Headphone plug maintains config
- Headphone unplug maintains config
- Bluetooth connect/disconnect works

#### 10.4 Interruption Tests
- Phone call interruption
- Recording resumes correctly
- Session config maintained

#### 10.5 State Query Tests
- getAudioSessionState() returns correct values
- Values update after configuration changes

#### 10.6 Cross-Platform Tests
- iOS works with all features
- Android builds and runs (stubs)
- Web builds and runs (stubs)

### Acceptance Criteria
- [ ] All tests pass (see TESTING_PLAN.md)
- [ ] True stereo validated (waveform analysis)
- [ ] Auto-reapply confirmed working
- [ ] No crashes or errors

### Time Estimate: 2 days

---

## Phase 11: Package Setup & Publishing (Day 11)

### Tasks

#### 11.1 Package Configuration

**Option A: Local Package (Development)**

```json
{
  "name": "expo-audiocake",
  "version": "1.0.0"
}
```

**Option B: NPM Package (Production)**

```json
{
  "name": "@your-username/expo-audiocake",
  "version": "1.0.0",
  "description": "expo-audio fork with advanced iOS AVAudioSession control"
}
```

#### 11.2 Build

```bash
cd packages/expo-audio
yarn build
```

#### 11.3 Publish (Optional)

```bash
npm publish --access public
```

### Acceptance Criteria
- [ ] Package builds successfully
- [ ] Can be installed as dependency
- [ ] Works in test app
- [ ] (Optional) Published to npm

### Time Estimate: 0.5 day

---

## Success Criteria

You're done when:

- ✅ All 11 phases completed
- ✅ All acceptance criteria met
- ✅ Tests pass (TESTING_PLAN.md)
- ✅ True stereo recording validated
- ✅ Auto-reapply works on route changes
- ✅ Documentation complete
- ✅ Package published/ready for use

---

## Troubleshooting

### Common Issues

1. **Polar pattern doesn't persist after route change**
   - Check `autoReapplyOnRouteChange` is true
   - Verify `reapplyAdvancedConfig()` is called in route change handler
   - Ensure `desiredPolarPattern` is stored correctly

2. **Stereo recording is dual-mono**
   - Verify `configureStereoDataSource()` is called
   - Check that `setPreferredPolarPattern(.stereo)` succeeds
   - Validate data source supports stereo (check `supportedPolarPatterns`)

3. **Session resets after interruption**
   - Ensure interruption handler calls `reapplyAdvancedConfig()`
   - Check that desired values are stored in properties

See `docs/COMMON_ISSUES.md` for more solutions.

---

## Next Steps After Completion

1. Deploy to staging environment
2. Test with real users
3. Monitor crash reports
4. Set up upstream merge schedule (see MAINTENANCE.md)
5. Consider contributing back to Expo

---

## Questions?

- Check `ARCHITECTURE.md` for design decisions
- Review `REFERENCE_IMPLEMENTATION.md` for code guidance
- See `docs/` for iOS audio session concepts
- Open an issue if stuck

---

**Ready to start?** Begin with Phase 1! 🚀
