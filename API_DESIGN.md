# API Design Specification

> **Purpose:** Complete TypeScript API for expo-audiocake  
> **Audience:** Developers implementing or using the package

---

## Overview

expo-audiocake extends expo-audio's `AudioMode` with iOS-specific advanced configuration and adds a session state query function.

**All existing expo-audio APIs remain unchanged.**

---

## Extended AudioMode Type

### Base AudioMode (Unchanged)

```typescript
type AudioMode = {
  /** Whether audio should continue in silent mode. Default: false */
  playsInSilentMode?: boolean;
  
  /** Whether recording is allowed. Default: false */
  allowsRecording?: boolean;
  
  /** How to handle other audio sources. Default: 'mixWithOthers' */
  interruptionMode?: InterruptionMode;
  
  /** Whether audio continues in background. Default: false */
  shouldPlayInBackground?: boolean;
  
  /** Route audio through earpiece instead of speaker. Default: false */
  shouldRouteThroughEarpiece?: boolean;
  
  /** Android-specific interruption mode */
  interruptionModeAndroid?: InterruptionModeAndroid;
  
  // NEW: iOS advanced configuration
  ios?: IOSAudioConfig;
};
```

### NEW: IOSAudioConfig

```typescript
/**
 * iOS-specific advanced audio session configuration.
 * All properties are optional.
 * @platform ios
 */
type IOSAudioConfig = {
  /**
   * Polar pattern for directional audio capture.
   * 
   * - 'stereo': Two-channel stereo recording (L/R separation)
   * - 'cardioid': Heart-shaped pickup pattern (rejects rear sound)
   * - 'omnidirectional': Equal sensitivity in all directions
   * - 'subcardioid': Wide pickup with some rear rejection
   * 
   * **Requires:** `preferredInput` and `dataSourceName` must also be set.
   * 
   * **Example:**
   * ```ts
   * {
   *   polarPattern: 'stereo',
   *   preferredInput: 'builtInMic',
   *   dataSourceName: 'front'
   * }
   * ```
   * 
   * @platform ios
   */
  polarPattern?: AudioSessionPolarPattern;
  
  /**
   * Preferred audio input device type.
   * 
   * Currently supported:
   * - 'builtInMic': Device's built-in microphone
   * 
   * Future: May support external inputs (USB, Lightning, etc.)
   * 
   * **Required when:** `polarPattern` is specified
   * 
   * @platform ios
   */
  preferredInput?: string;
  
  /**
   * Data source name for the selected input.
   * 
   * Common values:
   * - 'front': Front-facing microphones (stereo on many devices)
   * - 'back': Back-facing microphone (mono, typically)
   * - 'bottom': Bottom microphone
   * 
   * **Note:** Available data sources vary by device.
   * Check device documentation for specific model.
   * 
   * **Required when:** `polarPattern` is specified
   * 
   * @platform ios
   */
  dataSourceName?: string;
  
  /**
   * Input orientation for stereo field alignment.
   * 
   * Determines which physical microphone maps to L/R channels:
   * - 'portrait': Device held upright
   * - 'portraitUpsideDown': Device held upside-down
   * - 'landscapeLeft': Device rotated left (home button right)
   * - 'landscapeRight': Device rotated right (home button left)
   * - 'none': No specific orientation
   * 
   * **Use case:** Ensures stereo field matches physical orientation.
   * E.g., 'landscapeLeft' makes left mic → left channel.
   * 
   * @platform ios
   */
  inputOrientation?: AudioSessionOrientation;
  
  /**
   * Preferred sample rate in Hz.
   * 
   * Common values:
   * - 16000: Phone quality
   * - 44100: CD quality
   * - 48000: Professional audio (recommended)
   * 
   * **Note:** This is a HINT to the system. Actual sample rate
   * may differ based on hardware. System may use hardware rate
   * and resample if needed.
   * 
   * @platform ios
   */
  preferredSampleRate?: number;
  
  /**
   * IO buffer duration in seconds.
   * 
   * Smaller = Lower latency, more CPU
   * Larger = Higher latency, less CPU
   * 
   * Common values:
   * - 0.005 (5ms): Very low latency
   * - 0.010 (10ms): Low latency
   * - 0.020 (20ms): Balanced
   * 
   * **Note:** This is a HINT. System chooses actual value.
   * 
   * @platform ios
   */
  ioBufferDuration?: number;
  
  /**
   * Enable automatic reapplication of configuration on route changes.
   * 
   * When true (default), session config is reapplied when:
   * - Headphones plugged/unplugged
   * - Bluetooth device connected/disconnected
   * - Audio route changes for any reason
   * - Media services are reset
   * 
   * When false, config is only applied once at setAudioModeAsync().
   * 
   * **Why you might disable:** You want to handle route changes manually
   * or apply different configs for different routes.
   * 
   * @default true
   * @platform ios
   */
  autoReapplyOnRouteChange?: boolean;
};
```

### Supporting Types

```typescript
/**
 * Polar pattern types for directional audio capture.
 * @platform ios
 */
type AudioSessionPolarPattern = 
  | 'stereo'           // Two-channel L/R recording
  | 'cardioid'         // Heart-shaped, rejects rear
  | 'omnidirectional'  // Equal all directions
  | 'subcardioid';     // Wide with some rear rejection

/**
 * Device orientation for stereo field alignment.
 * @platform ios
 */
type AudioSessionOrientation = 
  | 'portrait'              // Upright
  | 'portraitUpsideDown'    // Upside-down
  | 'landscapeLeft'         // Rotated left (home button right)
  | 'landscapeRight'        // Rotated right (home button left)
  | 'none';                 // No specific orientation
```

---

## NEW: getAudioSessionState()

### Function Signature

```typescript
/**
 * Get current audio session state (iOS only).
 * 
 * Returns information about the current audio session including
 * category, mode, sample rate, and output route.
 * 
 * **Platforms:**
 * - iOS: Returns current state
 * - Android: Returns null
 * - Web: Returns null
 * 
 * **Use cases:**
 * - Debugging: Check if config applied correctly
 * - Conditional logic: Different behavior based on output route
 * - Logging: Track session state changes
 * 
 * @returns Audio session state or null if not available
 * 
 * @example
 * ```ts
 * import { getAudioSessionState } from 'expo-audiocake';
 * 
 * const state = getAudioSessionState();
 * if (state) {
 *   console.log('Category:', state.category);
 *   console.log('Sample rate:', state.sampleRate, 'Hz');
 *   console.log('Output:', state.outputRoute);
 *   
 *   if (state.outputRoute === 'Speaker') {
 *     // Audio going to speaker
 *   } else if (state.outputRoute === 'Receiver') {
 *     // Audio going to earpiece
 *   }
 * }
 * ```
 * 
 * @platform ios
 */
function getAudioSessionState(): AudioSessionState | null;
```

### Return Type

```typescript
/**
 * Audio session state information (iOS only).
 * @platform ios
 */
type AudioSessionState = {
  /**
   * Current audio session category.
   * 
   * Possible values:
   * - 'AVAudioSessionCategoryAmbient'
   * - 'AVAudioSessionCategorySoloAmbient'
   * - 'AVAudioSessionCategoryPlayback'
   * - 'AVAudioSessionCategoryRecord'
   * - 'AVAudioSessionCategoryPlayAndRecord'
   * - 'AVAudioSessionCategoryMultiRoute'
   */
  category: string;
  
  /**
   * Current audio session mode.
   * 
   * Possible values:
   * - 'AVAudioSessionModeDefault'
   * - 'AVAudioSessionModeVoiceChat'
   * - 'AVAudioSessionModeVideoChat'
   * - 'AVAudioSessionModeGameChat'
   * - 'AVAudioSessionModeVideoRecording'
   * - 'AVAudioSessionModeMeasurement'
   * - 'AVAudioSessionModeMoviePlayback'
   * - 'AVAudioSessionModeSpokenAudio'
   */
  mode: string;
  
  /**
   * Current sample rate in Hz.
   * 
   * Note: May differ from requested preferredSampleRate.
   * This is the ACTUAL hardware sample rate.
   */
  sampleRate: number;
  
  /**
   * Current IO buffer duration in seconds.
   * 
   * Note: May differ from requested ioBufferDuration.
   * This is the ACTUAL buffer duration.
   */
  ioBufferDuration: number;
  
  /**
   * Current output route port type.
   * 
   * Common values:
   * - 'Speaker': Built-in speaker (loud)
   * - 'Receiver': Earpiece (quiet, for calls)
   * - 'Headphones': Wired headphones
   * - 'BluetoothA2DPOutput': Bluetooth headphones/speaker
   * - 'BluetoothHFP': Bluetooth hands-free
   * - 'HDMI': HDMI output
   * - 'AirPlay': AirPlay device
   * - 'unknown': Unknown/no output
   */
  outputRoute: string;
};
```

---

## Usage Examples

### Example 1: Stereo Recording

```typescript
import { setAudioModeAsync, useAudioRecorder } from 'expo-audiocake';

async function setupStereoRecording() {
  // Configure for stereo recording
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    shouldPlayInBackground: true,
    ios: {
      polarPattern: 'stereo',              // Enable true stereo
      preferredInput: 'builtInMic',        // Use built-in mics
      dataSourceName: 'front',             // Use front mics
      inputOrientation: 'landscapeLeft',   // Landscape orientation
      preferredSampleRate: 48000,          // 48kHz (pro audio)
      autoReapplyOnRouteChange: true       // Persist config
    }
  });
  
  // Now recording will be true stereo with L/R separation
  const recorder = useAudioRecorder({
    /* recorder config */
  });
  
  await recorder.record();
}
```

### Example 2: High-Quality Mono

```typescript
import { setAudioModeAsync, useAudioRecorder } from 'expo-audiocake';

async function setupHighQualityMono() {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true,
    ios: {
      polarPattern: 'cardioid',            // Directional (rejects background)
      preferredInput: 'builtInMic',
      dataSourceName: 'back',              // Back microphone
      preferredSampleRate: 48000,
      ioBufferDuration: 0.005              // Low latency
    }
  });
  
  const recorder = useAudioRecorder({
    /* recorder config */
  });
  
  await recorder.record();
}
```

### Example 3: Session State Monitoring

```typescript
import { 
  setAudioModeAsync, 
  getAudioSessionState 
} from 'expo-audiocake';

async function monitorAudioRouting() {
  await setAudioModeAsync({
    allowsRecording: true,
    playsInSilentMode: true
  });
  
  // Check where audio is routed
  const state = getAudioSessionState();
  
  if (state) {
    console.log('Audio routing to:', state.outputRoute);
    console.log('Sample rate:', state.sampleRate, 'Hz');
    
    if (state.outputRoute === 'Speaker') {
      console.log('Using speaker - good for hands-free');
    } else if (state.outputRoute === 'Receiver') {
      console.log('Using earpiece - good for privacy');
    } else if (state.outputRoute === 'Headphones') {
      console.log('Using headphones - best quality');
    }
  }
}

// Monitor route changes
import { AppState } from 'react-native';

AppState.addEventListener('change', (nextAppState) => {
  if (nextAppState === 'active') {
    const state = getAudioSessionState();
    console.log('App became active, audio route:', state?.outputRoute);
  }
});
```

### Example 4: Conditional Configuration

```typescript
import { 
  setAudioModeAsync,
  getAudioSessionState 
} from 'expo-audiocake';

async function configureBasedOnRoute() {
  // Check current route
  const state = getAudioSessionState();
  
  if (state?.outputRoute === 'Headphones') {
    // Headphones: Use stereo
    await setAudioModeAsync({
      allowsRecording: true,
      ios: {
        polarPattern: 'stereo',
        preferredInput: 'builtInMic',
        dataSourceName: 'front'
      }
    });
  } else {
    // Speaker/Earpiece: Use mono
    await setAudioModeAsync({
      allowsRecording: true,
      ios: {
        polarPattern: 'cardioid',
        preferredInput: 'builtInMic',
        dataSourceName: 'back'
      }
    });
  }
}
```

### Example 5: Disable Auto-Reapply

```typescript
import { setAudioModeAsync } from 'expo-audiocake';

async function manualRouteHandling() {
  // Don't auto-reapply - handle route changes manually
  await setAudioModeAsync({
    allowsRecording: true,
    ios: {
      polarPattern: 'stereo',
      preferredInput: 'builtInMic',
      dataSourceName: 'front',
      autoReapplyOnRouteChange: false  // Disable auto-reapply
    }
  });
  
  // Later, handle route changes yourself
  // (e.g., different config for headphones vs speaker)
}
```

---

## Error Handling

### Possible Errors

#### 1. Missing Required Parameters

```typescript
// ❌ ERROR: polarPattern requires preferredInput and dataSourceName
await setAudioModeAsync({
  ios: {
    polarPattern: 'stereo'
    // Missing preferredInput and dataSourceName!
  }
});

// Error thrown:
// Exception: MissingDataSourceName
// Description: dataSourceName is required when polarPattern is specified
```

#### 2. Invalid Enum Values

```typescript
// ❌ ERROR: Invalid polar pattern
await setAudioModeAsync({
  ios: {
    polarPattern: 'invalid',  // Not a valid pattern
    preferredInput: 'builtInMic',
    dataSourceName: 'front'
  }
});

// Error thrown:
// Exception: InvalidPolarPattern
// Description: Unknown polar pattern: invalid
```

#### 3. Unsupported Hardware

```typescript
// ❌ ERROR: Device doesn't support stereo
await setAudioModeAsync({
  ios: {
    polarPattern: 'stereo',
    preferredInput: 'builtInMic',
    dataSourceName: 'front'  // This device's front mic doesn't support stereo
  }
});

// Error thrown:
// Exception: PolarPatternNotSupported
// Description: The selected data source does not support polar pattern 'stereo'
```

### Error Handling Best Practices

```typescript
import { setAudioModeAsync } from 'expo-audiocake';

async function safeAudioConfig() {
  try {
    await setAudioModeAsync({
      allowsRecording: true,
      ios: {
        polarPattern: 'stereo',
        preferredInput: 'builtInMic',
        dataSourceName: 'front'
      }
    });
    console.log('Stereo recording configured');
  } catch (error) {
    if (error.name === 'PolarPatternNotSupported') {
      // Fallback to mono
      console.warn('Stereo not supported, using cardioid');
      await setAudioModeAsync({
        allowsRecording: true,
        ios: {
          polarPattern: 'cardioid',
          preferredInput: 'builtInMic',
          dataSourceName: 'back'
        }
      });
    } else {
      console.error('Audio config failed:', error);
      throw error;
    }
  }
}
```

---

## Platform Differences

### iOS
- ✅ All features supported
- ✅ Polar pattern configuration
- ✅ Input orientation
- ✅ Auto-reapply on route changes
- ✅ Session state query

### Android
- ✅ Basic AudioMode features work
- ❌ `ios?:` config ignored (gracefully)
- ❌ `getAudioSessionState()` returns null
- ℹ️ No equivalent APIs in Android

### Web
- ✅ Basic AudioMode features work (where applicable)
- ❌ `ios?:` config ignored
- ❌ `getAudioSessionState()` returns null
- ℹ️ Web Audio API doesn't have session concept

---

## TypeScript Types Summary

```typescript
// Main extension
type AudioMode = {
  // ... existing properties ...
  ios?: IOSAudioConfig;
};

// iOS config
type IOSAudioConfig = {
  polarPattern?: AudioSessionPolarPattern;
  preferredInput?: string;
  dataSourceName?: string;
  inputOrientation?: AudioSessionOrientation;
  preferredSampleRate?: number;
  ioBufferDuration?: number;
  autoReapplyOnRouteChange?: boolean;
};

// Supporting types
type AudioSessionPolarPattern = 'stereo' | 'cardioid' | 'omnidirectional' | 'subcardioid';
type AudioSessionOrientation = 'portrait' | 'portraitUpsideDown' | 'landscapeLeft' | 'landscapeRight' | 'none';

// Session state
type AudioSessionState = {
  category: string;
  mode: string;
  sampleRate: number;
  ioBufferDuration: number;
  outputRoute: string;
};

// New function
function getAudioSessionState(): AudioSessionState | null;
```

---

## Migration from expo-audio

### If You're Using Basic expo-audio

**No changes needed!** All existing code continues to work:

```typescript
// This still works exactly the same
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true
});
```

### If You're Using av-session-override

**Before (two separate packages):**

```typescript
import AVSessionOverride from 'av-session-override';
import { setAudioModeAsync } from 'expo-audio';

// Configure session
await AVSessionOverride.set({
  category: 'playAndRecord',
  options: ['defaultToSpeaker'],
  polarPattern: 'stereo',
  inputOrientation: 'landscapeLeft'
});

// Configure expo-audio
await setAudioModeAsync({
  allowsRecording: true
});
```

**After (unified in expo-audiocake):**

```typescript
import { setAudioModeAsync } from 'expo-audiocake';

// Everything in one call
await setAudioModeAsync({
  allowsRecording: true,
  ios: {
    polarPattern: 'stereo',
    preferredInput: 'builtInMic',
    dataSourceName: 'front',
    inputOrientation: 'landscapeLeft'
  }
});
```

---

## Questions?

**Q: Do I need to specify all iOS config properties?**  
A: No, all are optional. Specify only what you need.

**Q: What if I only want to set sample rate?**  
A: Just set that property:
```typescript
await setAudioModeAsync({
  allowsRecording: true,
  ios: {
    preferredSampleRate: 48000
  }
});
```

**Q: Can I change config while recording?**  
A: Yes, call `setAudioModeAsync()` again. Session will be reconfigured.

**Q: How do I know if stereo is working?**  
A: Record audio, check waveform. L/R channels should differ. See `TESTING_PLAN.md`.

**Q: What if device doesn't support stereo?**  
A: You'll get `PolarPatternNotSupported` error. Catch and fallback to mono.

---

For implementation details, see `IMPLEMENTATION_PLAN.md`.  
For usage examples, see `SAMPLE_USAGE.md`.  
For testing, see `TESTING_PLAN.md`.
