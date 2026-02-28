# Fix Fork vs Upstream SDK 55 Comparison

**Date**: 2026-02-28
**Upstream version**: `expo-audio@55.0.8` (expo/expo main branch)
**Fork version**: `@joshms123/expo-audiocake@2.0.3`

## Method

1. Cloned `github.com/expo/expo` (shallow clone, HEAD of main)
2. Copied fork's `expo-audio/` over `packages/expo-audio/` in the cloned repo
3. Ran `git diff` to isolate every change

**22 files changed**, ~887 insertions, ~496 deletions.

---

## Summary

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | 2 | Will crash or produce wrong behavior at runtime |
| Significant | 5 | Incorrect behavior, regressions, or type unsafety |
| Safe (custom feature) | 8 | Fork-specific additions that are working correctly |
| Cosmetic / docs | 7 | Formatting, JSDoc, or comment-only changes |

---

## Critical Issues (MUST FIX)

### 1. `defaultToSpeaker` behavior is broken in playAndRecord mode

**File**: `ios/AudioModule.swift`

The upstream code **always** routes audio to the speaker when in `.playAndRecord` mode (unless `shouldRouteThroughEarpiece` is true):

```swift
// UPSTREAM
if !mode.shouldRouteThroughEarpiece {
    categoryOptions.insert(.defaultToSpeaker)
}
```

The fork added an extra condition that **breaks this default**:

```swift
// FORK (broken)
if !mode.shouldRouteThroughEarpiece && desiredDefaultToSpeaker {
    categoryOptions.insert(.defaultToSpeaker)
}
```

This means audio will silently route to the **earpiece** (phone-call style) in `.playAndRecord` mode unless the user explicitly passes `ios: { defaultToSpeaker: true }`. Most users would never know to do this — their audio would just sound quiet and tinny.

**Fix**: Restore the upstream default. Only check `desiredDefaultToSpeaker` as an *override*, not a gate:

```swift
if !mode.shouldRouteThroughEarpiece {
    // Default to speaker unless explicitly disabled via ios config
    if mode.ios == nil || desiredDefaultToSpeaker {
        categoryOptions.insert(.defaultToSpeaker)
    }
}
```

### 2. `requestNotificationPermissionsAsync` crashes on iOS

**File**: `src/ExpoAudio.ts`

The upstream has a platform guard that throws a helpful error on non-Android:

```typescript
// UPSTREAM
export async function requestNotificationPermissionsAsync() {
    if (Platform.OS !== 'android') {
        throw new Error('expo-audio: `requestNotificationPermissionsAsync` is only available on Android.');
    }
    return await AudioModule.requestNotificationPermissionsAsync();
}
```

The fork removed this guard:

```typescript
// FORK (will crash on iOS)
export async function requestNotificationPermissionsAsync() {
    return await AudioModule.requestNotificationPermissionsAsync();
}
```

The iOS native module (`AudioModule.swift`) does **not** declare `requestNotificationPermissionsAsync`. Calling this on iOS will throw an unhandled native exception. The web version (`ExpoAudio.web.ts`) has a stub that returns `granted`, but iOS has nothing.

**Fix**: Copy the upstream `requestNotificationPermissionsAsync` from `src/ExpoAudio.ts` — restore the platform guard:

```typescript
export async function requestNotificationPermissionsAsync(): Promise<PermissionResponse> {
    if (Platform.OS !== 'android') {
        throw new Error(
            'expo-audio: `requestNotificationPermissionsAsync` is only available on Android.'
        );
    }
    return await AudioModule.requestNotificationPermissionsAsync();
}
```

---

## Significant Issues (SHOULD FIX)

### 3. `AudioUtils.swift` reverted upstream asset loading optimization

**File**: `ios/AudioUtils.swift`

The upstream added `automaticallyLoadedAssetKeys` to pre-load track and duration metadata:

```swift
// UPSTREAM
return AVPlayerItem(asset: asset, automaticallyLoadedAssetKeys: [.tracks, .duration])
```

The fork reverted this:

```swift
// FORK
return AVPlayerItem(asset: asset)
```

Without this, accessing `duration` or track info may return `NaN` or block until the metadata is lazily loaded. This was added upstream specifically to fix the web NaN duration bug and improve load reliability.

**Fix**: Copy `ios/AudioUtils.swift` from the upstream repo. The fork has no custom changes in this file.

### 4. `resolveSources` no longer filters nulls

**File**: `src/utils/resolveSource.ts`

Upstream filters out null entries so native code never receives them:

```typescript
// UPSTREAM
export function resolveSources(sources: AudioSource[]): NonNullable<AudioSource>[] {
    return sources
        .map((source) => resolveSource(source))
        .filter((source): source is NonNullable<AudioSource> => source != null);
}
```

The fork preserves nulls:

```typescript
// FORK
export function resolveSources(
    sources: (AudioSource | string | number | null)[]
): (AudioSource | null)[] {
    return sources.map(resolveSource);
}
```

Passing `null` entries to the native `AudioPlaylist` constructor could cause crashes or undefined behavior on iOS/Android, since the native implementations likely don't expect null sources in the queue.

**Fix**: Restore the null-filtering behavior:

```typescript
export function resolveSources(
    sources: (AudioSource | string | number | null)[]
): NonNullable<AudioSource>[] {
    return sources
        .map(resolveSource)
        .filter((source): source is NonNullable<AudioSource> => source != null);
}
```

### 5. `getPreloadedSources` sync/async mismatch

**File**: `src/ExpoAudio.ts`, `src/AudioModule.types.ts`

The native modules (iOS and Android) declare `getPreloadedSources` as `AsyncFunction`, which returns a `Promise` from JavaScript. The upstream correctly types and calls it as async:

```typescript
// UPSTREAM
export async function getPreloadedSources(): Promise<string[]> {
    return AudioModule.getPreloadedSources();
}
```

The fork changed it to sync:

```typescript
// FORK (type mismatch — actually returns a Promise at runtime)
export function getPreloadedSources(): string[] {
    return AudioModule.getPreloadedSources();
}
```

At runtime, `getPreloadedSources()` returns a `Promise<string[]>`, but TypeScript thinks it's `string[]`. Code like `getPreloadedSources().length` or `getPreloadedSources().forEach(...)` will fail silently or throw.

**Fix**: Restore the async signature in both `src/ExpoAudio.ts` and `src/AudioModule.types.ts`:

```typescript
// AudioModule.types.ts
getPreloadedSources(): Promise<string[]>;

// ExpoAudio.ts
export async function getPreloadedSources(): Promise<string[]> {
    return AudioModule.getPreloadedSources();
}
```

### 6. `isRecordingMode` conflates with `allowsBackgroundRecording`

**File**: `android/src/main/java/expo/modules/audio/AudioModule.kt`

The fork sets `isRecordingMode = mode.allowsBackgroundRecording`, but `allowsBackgroundRecording` and "recording mode" are different concepts. A user might enable recording (`allowsRecording: true`) without enabling *background* recording, and they'd still want exclusive audio focus to avoid VoIP interference.

```kotlin
// FORK
isRecordingMode = mode.allowsBackgroundRecording  // Wrong — should track allowsRecording
```

**Fix**: Track `allowsRecording` instead:

```kotlin
isRecordingMode = mode.allowsRecording
```

### 7. `AudioRecorder.prepare` skips session options when already `.playAndRecord`

**File**: `ios/AudioRecorder.swift`

**Status**: ~~Significant~~ **NOT A BUG — fork behavior is correct**

The fork's "smart session reuse" intentionally skips `setCategory` when the session is already `.playAndRecord`. This is correct because:
- If the session is already `.playAndRecord`, it was configured by `setAudioModeAsync` with the correct `desiredMode` and advanced config (polar patterns, preferred input, etc.)
- Re-calling `setCategory` with `mode: .default` would overwrite `desiredMode` (e.g. `.measurement`) and reset all advanced session configuration
- The `sessionOptions` were already applied during `setAudioModeAsync`, so they don't need re-applying

**No fix needed.**

---

## Minor Issues (NICE TO FIX)

### 8. `options.ts` lost TypeScript type safety

**File**: `src/utils/options.ts`

The upstream has specific typed imports and a union return type. The fork replaced this with `Record<string, unknown>` and `Partial<RecordingOptions>`, losing compile-time checks for platform-specific recording options.

**Fix**: Copy `src/utils/options.ts` from the upstream repo. The fork has no custom changes that need preserving in this file.

### 9. `forceResetSession` uses blocking `usleep` on iOS

**File**: `ios/AudioRecorder.swift`

The fork's `forceResetSession()` uses `usleep(100000)` (100ms blocking sleep). This blocks the thread it runs on. If called from the main thread or an important dispatch queue, this could cause UI hitches.

**Fix** (low priority): Replace with non-blocking async sleep:

```swift
func forceResetSession() async throws {
    let session = AVAudioSession.sharedInstance()
    try session.setActive(false, options: .notifyOthersOnDeactivation)
    try await Task.sleep(nanoseconds: 100_000_000) // 100ms non-blocking
    try session.setCategory(.playAndRecord, mode: .default)
    try session.setActive(true)
}
```

### 10. `InterruptionModeAndroid` decoupled from `InterruptionMode`

**File**: `src/Audio.types.ts`

Upstream aliases them: `export type InterruptionModeAndroid = InterruptionMode`. The fork duplicates the union values instead. If `InterruptionMode` ever gains new values, `InterruptionModeAndroid` won't automatically include them.

**Fix**: Restore the alias:

```typescript
export type InterruptionModeAndroid = InterruptionMode;
```

### 11. `MediaController.swift` formatting changes

**File**: `ios/MediaController.swift`

The fork added trailing semicolons to `removeTarget` calls and changed some whitespace. While valid Swift, semicolons are non-standard style and the whitespace changes are noise.

**Fix**: Copy `ios/MediaController.swift` from the upstream repo. The fork has no functional changes in this file.

---

## Safe Custom Features (NO FIX NEEDED)

These are intentional fork additions that work correctly. No action required.

| Feature | Files | Notes |
|---------|-------|-------|
| `AudioModeIOSConfig` type | `src/Audio.types.ts`, `ios/AudioRecords.swift` | Polar patterns, orientation, sample rate, buffer config |
| `AudioSessionState` type | `src/Audio.types.ts` | Session state query return type |
| `AudioSessionPolarPattern` type | `src/Audio.types.ts` | Stereo/cardioid/omni/subcardioid |
| `AudioSessionOrientation` type | `src/Audio.types.ts` | Portrait/landscape stereo alignment |
| `getAudioSessionState()` | `ios/AudioModule.swift`, `src/ExpoAudio.ts`, `src/AudioModule.types.ts` | iOS session state query |
| `forceResetSession()` | iOS/Android/Web implementations, `src/AudioModule.types.ts` | Clear VoIP/LiveKit audio state |
| Advanced session config (`applyAdvancedSessionConfig`, `configurePreferredInput`, `configureStereoDataSource`, etc.) | `ios/AudioModule.swift` | Core fork functionality |
| Auto-reapply on route change | `ios/AudioModule.swift` (`handleAudioSessionRouteChange`) | Re-applies config on headphone plug/unplug |
| `ios` field on `AudioMode` | `ios/AudioRecords.swift`, `src/Audio.types.ts` | Passes iOS config to native |
| `AudioException` class | `ios/AudioExceptions.swift` | Generic exception for advanced config errors |
| `AudioRecorderException` class | `android/AudioExceptions.kt` | Exception for `forceResetSession()` |
| Recording-specific audio focus (Android) | `android/AudioModule.kt` | Exclusive focus + speech content type for recording |
| Player error status on `.failed` | `ios/AudioPlayer.swift` | Emits error status when player item fails to load |
| `ios.mode` session mode support | `ios/AudioModule.swift` (`mapMode`, `desiredMode`) | Measurement/voiceChat/etc. modes |
| `ios.allowBluetoothA2DP` | `ios/AudioModule.swift` | High-quality Bluetooth stereo routing |
| Web `requestNotificationPermissionsAsync` stub | `src/ExpoAudio.web.ts` | Always returns granted on web |
| Web blob URL for downloaded sources | `src/utils/resolveSource.ts` | Creates blob URLs on web for offline access |

---

## Files Safe to Copy from Upstream

These files have **only** cosmetic/doc changes or unintentional regressions in the fork. Copying them from the upstream will fix issues without losing any custom functionality:

| File | Reason |
|------|--------|
| `ios/AudioUtils.swift` | Restores `automaticallyLoadedAssetKeys` optimization (fix #3) |
| `ios/MediaController.swift` | Removes spurious semicolons and whitespace changes (fix #11) |
| `src/utils/options.ts` | Restores full type safety (fix #8) |
| `CHANGELOG.md` | Restores complete patch history |

---

## Recommended Fix Priority

1. **Fix `defaultToSpeaker` logic** (Critical #1) — Most users will hit this silently
2. **Fix `requestNotificationPermissionsAsync` platform guard** (Critical #2) — iOS crash
3. **Restore `automaticallyLoadedAssetKeys`** (Significant #3) — Copy file from upstream
4. **Fix `resolveSources` null filtering** (Significant #4) — Potential native crash
5. **Fix `getPreloadedSources` async signature** (Significant #5) — Type mismatch at runtime
6. **Fix `isRecordingMode` tracking** (Significant #6) — Wrong audio focus behavior
7. **Fix `AudioRecorder.prepare` session options** (Significant #7) — Stale session config
8. Copy `options.ts` from upstream (Minor #8)
9. Copy `MediaController.swift` from upstream (Minor #11)
10. Fix `InterruptionModeAndroid` alias (Minor #10)
11. Fix `forceResetSession` usleep (Minor #9)
