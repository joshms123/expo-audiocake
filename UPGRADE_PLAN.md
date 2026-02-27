# Upgrade Plan: expo-audiocake → SDK 55 expo-audio

## Overview

This plan upgrades `@joshms123/expo-audiocake` (forked from an older expo-audio) to the SDK 55 version of `expo-audio`, while **preserving all custom iOS advanced audio session features** that are the raison d'être of this fork.

### Your Custom Features to Preserve
- **Polar pattern support** (`stereo`, `cardioid`, `omnidirectional`, `subcardioid`)
- **Preferred input selection** (`builtInMic`)
- **Data source selection** (`front`, `back`, `bottom`)
- **Input orientation** (`portrait`, `landscapeLeft`, etc.)
- **Preferred sample rate** and **IO buffer duration**
- **Auto-reapply on route changes**
- **Audio session mode** (`measurement`, `voiceChat`, etc.)
- **Default to speaker** and **Bluetooth A2DP** options
- **`getAudioSessionState()`** — query current iOS audio session
- **`forceResetSession()`** — reset session from VoIP/LiveKit state
- **Smart session reuse** (skip reconfig if already `.playAndRecord`)

### New Features from SDK 55 to Add
- **AudioPlaylist** — full queue/playlist player with loop modes (none/single/all)
- **Preload system** — pre-buffer audio for instant playback
- **Media services reset recovery** — automatic player/recorder rebuild after iOS daemon crash
- **Background recording** — foreground service on Android, `allowsBackgroundRecording` flag
- **Lock screen controls rearchitecture** — bound service pattern on Android, web MediaSession API
- **Web audio sampling** — real Web Audio API waveform data (currently a no-op)
- **Web recorder improvements** — real device enumeration, metering, device selection
- **Web playlist support** — gapless playback with track management
- **Web MediaSession controller** — browser lock screen/notification controls
- **`preferredForwardBufferDuration`** — configurable buffer on player creation
- **`requestNotificationPermissionsAsync()`** — Android notification permission
- **`shouldRouteThroughEarpiece`** and `allowsBackgroundRecording` on `AudioMode`
- **NaN protection** — safe duration/currentTime on all platforms
- **ID type change** — `number` → `string` throughout
- **`InterruptionMode` unification** — now cross-platform (Android supports `mixWithOthers`)
- **`Playable` interface** — shared interface for player and playlist on Android
- **Bound service architecture** — proper service lifecycle on Android

---

## Phase 1: TypeScript Layer ✅ COMPLETED

**Completed:** 2026-02-26 on branch `claude/typescript-layer-upgrade-Ym9aq`

**Summary:** All TypeScript types, event keys, module declarations, hooks, and utilities have been updated to match SDK 55 expo-audio while preserving all custom iOS advanced audio session features. Key changes:
- `AudioStatus.id` and `RecordingStatus.id` changed from `number` → `string` (breaking)
- New `AudioSourceInfo`, `PreloadOptions`, `AudioPlaylistLoopMode`, `AudioPlaylistOptions`, `AudioPlaylistStatus` types added
- `name` field added to `AudioSource` object variant
- `preferredForwardBufferDuration` added to `AudioPlayerOptions` and `AudioPlayer` constructor
- `RecordingOptions.web` made required (minor breaking)
- `allowsBackgroundRecording` added to `AudioMode`
- `interruptionModeAndroid` deprecated (optional); unified `interruptionMode` now used cross-platform
- `InterruptionModeAndroid` gains `'mixWithOthers'` value
- New event keys: `PLAYLIST_STATUS_UPDATE`, `TRACK_CHANGED`
- New native module methods: preload API (`preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources`), `requestNotificationPermissionsAsync`
- `AudioPlaylist` class declaration + `AudioPlaylistEvents` type added
- New hooks: `useAudioPlaylist`, `useAudioPlaylistStatus`; new factories: `createAudioPlaylist`
- New preload exports: `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources`
- `utils/options.ts`: web platform branch added, explicit return type
- `utils/resolveSource.ts`: asset `name` propagated, `resolveSources()` array helper added
- `AudioModule.web.ts` updated for `string` id types
- `ExpoAudio.web.ts` updated with stubs for all new Phase 1 APIs

---

### 1.1 Types (`Audio.types.ts`)

| Task | Details |
|------|---------|
| Add `AudioSourceInfo` type | `{ uri?: string; name?: string }` |
| Add `name` field to `AudioSource` | Optional display name |
| Add `preferredForwardBufferDuration` to `AudioPlayerOptions` | Default 0 (system default) |
| Add `PreloadOptions` type | `{ preferredForwardBufferDuration?: number }` (default 10) |
| Change `AudioStatus.id` from `number` to `string` | Breaking change |
| Add `mediaServicesDidReset` to `AudioStatus` | iOS only, boolean |
| Change `RecordingStatus.id` from `number` to `string` | Breaking change |
| Add `mediaServicesDidReset` to `RecordingStatus` | iOS only, boolean |
| Make `RecordingOptions.web` required (not optional) | Minor breaking change |
| Add `allowsBackgroundRecording` to `AudioMode` | `@default false`, iOS+Android |
| Add `shouldRouteThroughEarpiece` to `AudioMode` | `@default false` |
| Deprecate `interruptionModeAndroid` | Make optional, alias to `InterruptionMode` |
| Add `AudioPlaylistLoopMode` type | `'none' \| 'single' \| 'all'` |
| Add `AudioPlaylistOptions` type | sources, updateInterval, loop, crossOrigin |
| Add `AudioPlaylistStatus` type | Full playlist status object |
| Add `PitchCorrectionQuality` type | `'low' \| 'medium' \| 'high'` (iOS) |
| Add `RecordingStartOptions` type | `forDuration`, `atTime` (iOS) |
| Add `RecordingInput` type | `{ name, type, uid }` |
| **PRESERVE** `AudioModeIOSConfig` | Keep `ios?` field on `AudioMode` |
| **PRESERVE** `AudioSessionPolarPattern` | Keep polar pattern type |
| **PRESERVE** `AudioSessionOrientation` | Keep orientation type |
| **PRESERVE** `AudioSessionState` | Keep session state type |

### 1.2 Event Keys (`AudioEventKeys.ts`)

| Task | Details |
|------|---------|
| Add `PLAYLIST_STATUS_UPDATE` | `'playlistStatusUpdate'` |
| Add `TRACK_CHANGED` | `'trackChanged'` |

### 1.3 Module Types (`AudioModule.types.ts`)

| Task | Details |
|------|---------|
| Add `requestNotificationPermissionsAsync()` | Android notification perms |
| Add preload functions | `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources` |
| Add `AudioPlaylist` class | Full playlist SharedObject definition |
| Add `AudioPlaylistEvents` type | Status update + track changed events |
| Update `AudioPlayer` constructor | Add 4th param `preferredForwardBufferDuration` |
| Change `id` types from `number` to `string` | Player + Recorder |
| Add `seekTo` with tolerance params | `toleranceMillisBefore?`, `toleranceMillisAfter?` |
| Add `setPlaybackRate` with pitch quality | `pitchCorrectionQuality?` param |
| Add `setActiveForLockScreen` | Lock screen control method |
| Add `updateLockScreenMetadata` | Metadata update method |
| Add `clearLockScreenControls` | Clear lock screen |
| Add recorder `getAvailableInputs` | Returns `RecordingInput[]` |
| Add recorder `getCurrentInput` | Returns `Promise<RecordingInput>` |
| Add recorder `setInput` | Takes `inputUid: string` |
| **PRESERVE** `getAudioSessionState()` | Keep iOS session query |
| **PRESERVE** `forceResetSession()` | Keep on both player and recorder |

### 1.4 Main Hooks (`ExpoAudio.ts`)

| Task | Details |
|------|---------|
| Update `useAudioPlayer` | Destructure `preferredForwardBufferDuration`, pass to constructor |
| Update `createAudioPlayer` | Same buffer duration support |
| Update `setAudioModeAsync` | Pass `interruptionMode` (fallback to deprecated), `allowsBackgroundRecording` |
| Add `useAudioPlaylist(options)` | Hook with auto-cleanup |
| Add `useAudioPlaylistStatus(playlist)` | Real-time playlist status |
| Add `createAudioPlaylist(options)` | Non-hook factory |
| Add `requestNotificationPermissionsAsync()` | Android notification perms |
| Add `preload(source, options)` | Pre-buffer audio source |
| Add `clearPreloadedSource(source)` | Release specific preload |
| Add `clearAllPreloadedSources()` | Release all preloads |
| Add `getPreloadedSources()` | List preloaded URIs |
| **PRESERVE** `getAudioSessionState()` | Keep iOS session query function |

### 1.5 Recording Constants (`RecordingConstants.ts`)

No changes needed — files are identical.

### 1.6 Utils

| Task | Details |
|------|---------|
| Update `options.ts` | Add web platform branch, explicit return type |
| Update `resolveSource.ts` | Add `name` from asset, add `resolveSources()` for arrays, simplify web blob handling |

---

## Phase 2: iOS Native Layer ✅ COMPLETED

**Completed:** 2026-02-27 on branch `claude/ios-native-layer-upgrade-0i6F0`

**Summary:** All iOS Swift native layer files updated to match SDK 55 expo-audio while preserving all custom iOS advanced audio session features. Key changes:
- `AudioPlaylist.swift` created: full `AVQueuePlayer`-backed playlist with loop modes (none/single/all), track navigation, queue management, and status events
- `AudioPlayer.swift`: added `source` property for reset recovery, NaN protection on `duration`/`currentTime`, `replaceWithPreloadedItem()`, `onReady` callback in `replaceCurrentSource`, full media services reset recovery (`handleMediaServicesReset`, `replacePlayer`, `teardownPlayer`, `restorePlaybackState`), `teardownPlayer()` used in `sharedObjectWillRelease`
- `AudioRecorder.swift`: added `mediaServicesDidReset` property, `currentOptions`/`currentSessionOptions` for re-creation, updated `init` to accept options, NaN protection, `handleMediaServicesReset()`, dynamic `mediaServicesDidReset` in status; **PRESERVED** `forceResetSession()` and smart session reuse (`.playAndRecord` check)
- `AudioComponentRegistry.swift`: added `playlists` dict, `preloadedPlayers` dict, full playlist CRUD and preload cache methods, `AVFoundation` import
- `AudioModule.swift`: added `lastConfiguredMode`, `allowsBackgroundRecording`, preload functions (`preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources`), `AudioPlaylist` class block with all properties/functions, updated `AudioPlayer` constructor (preload cache + `preferredForwardBufferDuration`), `replace` checks preload cache, updated `AudioRecorder` constructor to pass options, playlist interruption handling, background recorder pause/resume, `reconfigureAudioSession()` with `lastConfiguredMode`, `mediaServicesWereResetNotification` wrapped in `#if os(iOS)`; **PRESERVED** `getAudioSessionState()`, `applyAdvancedSessionConfig()`, `configurePreferredInput()`, `configureStereoDataSource()`, all `mapPolarPattern/Orientation/Mode` helpers, `handleAudioSessionRouteChange` auto-reapply, `forceResetSession` in recorder class block
- **MERGED** `setAudioMode`: added `shouldRouteThroughEarpiece` (overrides `defaultToSpeaker` when true), `allowsBackgroundRecording`, `lastConfiguredMode` tracking; kept custom `ios?` config parsing, `desiredMode` for advanced session mode, `desiredDefaultToSpeaker`/`desiredAllowBluetoothA2DP` from ios config
- `AudioRecords.swift`: added `shouldRouteThroughEarpiece` and `allowsBackgroundRecording` to `AudioMode`, added `LoopMode` enum; **PRESERVED** `AudioModeIOSConfig` struct and `ios` field
- `AudioSource.swift`: added `name` field
- `AudioUtils.swift`: refactored `createAVPlayer` to delegate to `createAVPlayerItem`, added `automaticallyLoadedAssetKeys: [.tracks, .duration]`
- `AudioRecordingRequester.swift`: updated `EXFatal`→`RCTFatal`, `EXErrorWithMessage`→`RCTErrorWithMessage`
---


### 2.1 New File: `AudioPlaylist.swift`

Create the full 375-line playlist implementation:
- `AudioPlaylist: SharedRef<AVQueuePlayer>` with events
- Loop modes (none/single/all)
- Track navigation (next/previous/skipTo)
- Queue management (add/insert/remove/clear)
- Status reporting with `playlistStatusUpdate` and `trackChanged` events

### 2.2 `AudioModule.swift`

| Task | Details |
|------|---------|
| Add `lastConfiguredMode` property | For media reset recovery |
| Add `allowsBackgroundRecording` property | For background recording |
| Add preload functions | `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources` |
| Add `AudioPlaylist` class block | Constructor + all properties + all functions |
| Update `AudioPlayer` constructor | Add `preferredForwardBufferDuration` param, preload cache lookup |
| Update `replace` function | Check preload cache before creating new item |
| Update `AudioRecorder` constructor | Pass options to recorder |
| Add playlist handling to interruption | `handleInterruptionBegan/Ended` for playlists |
| Add playlist handling to background | `OnAppEntersBackground/Foreground` for playlists |
| Add recorder background handling | Pause/resume recorders on background transitions |
| Add `pauseAllRecorders()` / `resumeAllRecorders()` | New helper methods |
| Update `deactivateSession` | Check for active playlists too |
| Update `setIsAudioActive` | Only `notifyOthersOnDeactivation` when deactivating |
| Update media services reset handler | Full player rebuild + recorder re-prepare |
| Update `reconfigureAudioSession` | Use `lastConfiguredMode` |
| Wrap `mediaServicesWereResetNotification` in `#if os(iOS)` | TV OS compat |
| Update `OnDestroy` | Remove preloaded players |
| **PRESERVE** all advanced iOS session properties | `desiredPolarPattern`, `desiredPreferredInput`, etc. |
| **PRESERVE** `getAudioSessionState()` function | Keep session state query |
| **PRESERVE** `applyAdvancedSessionConfig()` | Keep advanced config |
| **PRESERVE** `configurePreferredInput()` | Keep input selection |
| **PRESERVE** `configureStereoDataSource()` | Keep stereo config |
| **PRESERVE** `mapPolarPattern/Orientation/Mode` | Keep all mappers |
| **PRESERVE** `handleAudioSessionRouteChange` auto-reapply | Keep route change handling |
| **MERGE** `setAudioMode` | SDK 55 adds `shouldRouteThroughEarpiece` + `allowsBackgroundRecording`; keep custom `ios?` config parsing alongside |

### 2.3 `AudioPlayer.swift`

| Task | Details |
|------|---------|
| Add `source` property | Store current AudioSource for reset recovery |
| Update `init` signature | Add `source: AudioSource? = nil` param |
| Add NaN protection | `duration` and `currentTime` getters |
| Add `replaceWithPreloadedItem()` | For preload cache items |
| Update `replaceCurrentSource()` | Use `onReady` callback pattern, update `source` |
| Add media services reset recovery | `handleMediaServicesReset()`, `replacePlayer()`, `teardownPlayer()`, `onReady()`, `restorePlaybackState()` |
| Update `sharedObjectWillRelease` | Use `teardownPlayer()` helper |

### 2.4 `AudioRecorder.swift`

| Task | Details |
|------|---------|
| Add `mediaServicesDidReset` property | Track reset state |
| Add `currentOptions` / `currentSessionOptions` | Store for re-creation |
| Update `init` | Accept and store `options` |
| Add NaN protection | `currentTime` and `deviceCurrentTime` |
| Add `handleMediaServicesReset()` | Re-prepare recorder after reset |
| Update `getRecordingStatus` | Dynamic `mediaServicesDidReset` value |
| **PRESERVE** `forceResetSession()` | Keep custom session reset |
| **PRESERVE** smart session reuse | Keep `.playAndRecord` check optimization |

### 2.5 `AudioComponentRegistry.swift`

| Task | Details |
|------|---------|
| Add `playlists` storage | `[String: AudioPlaylist]` |
| Add `preloadedPlayers` storage | `[String: AVPlayer]` |
| Add playlist CRUD methods | `add`, `remove`, `allPlaylists`, `getPlaylist` |
| Add preload cache methods | `addPreloadedPlayer`, `hasPreloadedPlayer`, `removePreloadedPlayer`, `removeAllPreloadedPlayers`, `preloadedPlayerKeys` |
| Update `removeAll` | Clean up playlists too |
| Add `import AVFoundation` | Needed for `AVPlayer` type |

### 2.6 `AudioRecords.swift`

| Task | Details |
|------|---------|
| Add `shouldRouteThroughEarpiece` field | To `AudioMode` |
| Add `allowsBackgroundRecording` field | To `AudioMode` |
| Add `LoopMode` enum | `none`, `single`, `all` |
| **PRESERVE** `AudioModeIOSConfig` struct | Keep all 10 fields |
| **PRESERVE** `ios` field on `AudioMode` | Keep optional iOS config |

### 2.7 `AudioSource.swift`

| Task | Details |
|------|---------|
| Add `name` field | `@Field var name: String?` |

### 2.8 `AudioUtils.swift`

| Task | Details |
|------|---------|
| Add `createAVPlayerItem` function | Extracted from `createAVPlayer` |
| Refactor `createAVPlayer` | Delegate to `createAVPlayerItem` |
| Add `automaticallyLoadedAssetKeys` | `.tracks`, `.duration` on player items |

### 2.9 `AudioRecordingRequester.swift`

| Task | Details |
|------|---------|
| Update `EXFatal` → `RCTFatal` | `EXErrorWithMessage` → `RCTErrorWithMessage` |

### 2.10 `AudioExceptions.swift`

| Task | Details |
|------|---------|
| **PRESERVE** `AudioException` | Keep generic exception for advanced config |

---

## Phase 3: Android Native Layer ✅ COMPLETED

**Completed:** 2026-02-27 on branch `claude/android-native-layer-upgrade-Ce9GS`

**Summary:** All Android Kotlin native layer files updated to match SDK 55 expo-audio while preserving all custom Android-specific features. Key changes:
- `AudioPlaylist.kt` created: full `ExoPlayer`-backed playlist with loop modes (NONE/SINGLE/ALL), track navigation, queue management, status events (`playlistStatusUpdate`, `trackChanged`), and `DataSource.Factory` injection
- `AudioPreloadManager.kt` created: in-memory audio caching singleton with `InMemoryDataSourceFactory` for instant preloaded playback
- `Playable.kt` created: shared interface for `AudioPlayer` and `AudioPlaylist` with default implementations for `play()`, `pause()`, `seekTo()`, `setVolume()`, and computed `currentTime`/`duration`/`isPlaying`/`volume`
- `service/BaseServiceConnection.kt` created: abstract base with `ServiceBindingState` enum, thread-safe state management, `startServiceAndBind()` companion helper, and unified bind/unbind lifecycle
- `service/AudioRecordingService.kt` created: foreground service for background recording with `FOREGROUND_SERVICE_TYPE_MICROPHONE`, recorder registry, notification management, and `AudioRecordingServiceBinder`
- `service/AudioPlaybackServiceConnection.kt` created: bound service connection for lock screen controls with `AudioPlaybackServiceBinder`, state-aware binding, and `onServiceConnected` delegation to `AudioControlsService`
- `service/AudioRecordingServiceConnection.kt` created: suspend-based bound service connection for recording with timeout detection, coroutine continuation, and `cleanup()` lifecycle
- `AudioControlsService.kt`: refactored from static singleton to bound service with `AudioPlaybackServiceBinder`, `weakContext` for lifecycle safety, cancellable `artworkLoadJob`, `registerPlayer`, `setPlayerMetadata`, `setPlayerOptions`, `unregisterPlayer` methods, `appContext` setter, and session built on main queue
- `AudioPlayer.kt`: implements `Playable`, adds `bufferDurationMs` constructor param with `DefaultLoadControl`, adds `mediaSession` (player owns its own basic session), adds `serviceConnection` (`AudioPlaybackServiceConnection`), adds `intendedPlayingState`/`previousPlaybackState` for transient filtering, rearchitects lock screen controls to use bound service, adds `setPlaybackRate()` with pitch clamping, adds `assignBasicMediaSession()` for fallback, migrates `playerScope` to `Dispatchers.Main`
- `AudioRecorder.kt`: adds `useForegroundService` flag, `serviceConnection` (`AudioRecordingServiceConnection`), `suspend prepareRecording()` with foreground service binding, notification permission check (`hasNotificationPermissions()`), updated `record()` to register with service, updated `stopRecording()` with better error handling, `getCurrentTimeSeconds()` method, updated `sharedObjectDidRelease()` for service cleanup; **PRESERVED** `forceResetSession()` custom method
- `AudioModule.kt`: adds `playlists` ConcurrentHashMap, `allPlayables` property (players + playlists), `allowsBackgroundRecording` flag, preload functions (`preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources`), `requestNotificationPermissionsAsync`, `AudioPlaylist` class block with all properties/functions, updated `AudioPlayer` constructor with `preferredForwardBufferDuration`, `MIX_WITH_OTHERS` early return in `requestAudioFocus`, updated background transitions (separate playable vs recorder), updated `OnDestroy` with preload cleanup, `createMediaItem` checks preload cache; **PRESERVED** `forceResetSession` on recorder, **PRESERVED** recording-specific audio focus config (exclusive gain + speech content type via `isRecordingMode`)
- `AudioRecords.kt`: adds `name` to `AudioSource`, `LoopMode` enum (NONE/SINGLE/ALL), renames `allowsRecording`→`allowsBackgroundRecording` on `AudioMode`, adds `MIX_WITH_OTHERS` to `InterruptionMode`
- `AudioExceptions.kt`: adds `NotificationPermissionsException`, `getPlaybackServiceErrorMessage()`, `getRecordingServiceErrorMessage()` helpers, `AudioRecordingServiceException`, `AudioPlaybackServiceException`; **PRESERVED** `AudioRecorderException` for `forceResetSession()`
- `AudioUtils.kt`: adds `buildBasicMediaSession()` helper and required `Context`/`ExoPlayer`/`MediaSession` imports
- `build.gradle`: adds `androidx.core:core-ktx:1.15.0` and `media3-datasource` dependencies
- `AndroidManifest.xml`: removed service declarations (delegated to config plugin in Phase 5), kept only `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` permissions

### 3.1 New Files

| File | Description |
|------|-------------|
| `AudioPlaylist.kt` | Full playlist on ExoPlayer (347 lines) |
| `AudioPreloadManager.kt` | In-memory audio caching (55 lines) |
| `Playable.kt` | Common interface for player/playlist (48 lines) |
| `service/AudioRecordingService.kt` | Foreground service for background recording (202 lines) |
| `service/AudioPlaybackServiceConnection.kt` | Bound service connection for playback (100 lines) |
| `service/AudioRecordingServiceConnection.kt` | Bound service connection for recording (153 lines) |
| `service/BaseServiceConnection.kt` | Abstract base for service connections (141 lines) |

### 3.2 `build.gradle`

| Task | Details |
|------|---------|
| Add `androidx.core:core-ktx:1.15.0` | New dependency |
| Add `media3-datasource` | Separate datasource dependency |
| Update version | Match SDK 55 scheme |

### 3.3 `AndroidManifest.xml`

| Task | Details |
|------|---------|
| Remove service declarations | Delegate to config plugin |
| Keep only permission declarations | `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS` |

### 3.4 `AudioModule.kt`

| Task | Details |
|------|---------|
| Add `playlists` ConcurrentHashMap | Playlist storage |
| Add `allPlayables` property | Combines players and playlists |
| Add `allowsBackgroundRecording` flag | Propagate to recorders |
| Add preload functions | `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources` |
| Add `requestNotificationPermissionsAsync` | Android notification permission |
| Add `AudioPlaylist` class block | Full constructor + properties + functions |
| Update `AudioPlayer` constructor | Add `preferredForwardBufferDuration` param |
| Update audio focus handling | Use `allPlayables`, add `MIX_WITH_OTHERS` early return, fix transient gain |
| Update `setAudioModeAsync` | Pass `allowsBackgroundRecording` to recorders |
| Update background transitions | Separate playable vs recorder handling |
| Update `OnDestroy` | Stop playlists, clear preloads |
| Update `createMediaItem` | Check `AudioPreloadManager` cache first |
| **PRESERVE** `forceResetSession` on recorder | Keep custom function |
| **PRESERVE** recording-specific audio focus config | Keep exclusive gain + speech content type |

### 3.5 `AudioPlayer.kt`

| Task | Details |
|------|---------|
| Implement `Playable` interface | Move shared properties to interface |
| Add `preferredForwardBufferDuration` constructor param | Custom `DefaultLoadControl` |
| Add `mediaSession` property | Player owns its own session |
| Add `serviceConnection` | `AudioPlaybackServiceConnection` |
| Add `intendedPlayingState` / `previousPlaybackState` | Better state tracking |
| Rearchitect lock screen controls | Use bound service pattern instead of static singleton |
| Add `setPlaybackRate()` method | Rate clamping + pitch control |
| Update player listener | `onIsPlayingChanged` with transient filtering, `onPositionDiscontinuity` |
| Update `currentStatus()` | Use `intendedPlayingState`, emit `didJustFinish` as event |
| Change `playerScope` dispatcher | `Dispatchers.Default` → `Dispatchers.Main` |
| Update `sharedObjectDidRelease` | Use service connection lifecycle |
| Add `assignBasicMediaSession()` | Fallback session when unregistered |

### 3.6 `AudioRecorder.kt`

| Task | Details |
|------|---------|
| Add `useForegroundService` flag | Toggle background recording |
| Add `serviceConnection` | `AudioRecordingServiceConnection` |
| Make `prepareRecording()` suspend | Async service binding |
| Add notification permission check | `hasNotificationPermissions()` |
| Update `record()` | Register with foreground service |
| Update `stopRecording()` | Unregister from service, better error handling |
| Add `getCurrentTimeSeconds()` | Seconds instead of millis |
| Update `sharedObjectDidRelease` | Service cleanup |
| **PRESERVE** `forceResetSession()` | Keep custom method |

### 3.7 `AudioRecords.kt`

| Task | Details |
|------|---------|
| Add `name` to `AudioSource` | Optional string field |
| Add `LoopMode` enum | NONE, SINGLE, ALL |
| Add `allowsBackgroundRecording` to `AudioMode` | Boolean field |
| Add `MIX_WITH_OTHERS` to `InterruptionMode` | New enum value |

### 3.8 `AudioExceptions.kt`

| Task | Details |
|------|---------|
| Add service tip constants | Help text for service errors |
| Add `NotificationPermissionsException` | POST_NOTIFICATIONS error |
| Add service error message helpers | `getPlaybackServiceErrorMessage()`, `getRecordingServiceErrorMessage()` |
| Add service exception classes | `AudioRecordingServiceException`, `AudioPlaybackServiceException` |
| **PRESERVE** `AudioRecorderException` | Keep for `forceResetSession` |

### 3.9 `AudioUtils.kt`

| Task | Details |
|------|---------|
| Add `buildBasicMediaSession()` | Basic media session builder |

### 3.10 `AudioControlsService.kt`

| Task | Details |
|------|---------|
| Rearchitect from static singleton to bound service | Major refactor |
| Remove static companion object methods | `setActivePlayer`, `updateMetadata`, `clearSession` |
| Add `artworkLoadJob` for cancellable artwork loading | Memory safety |
| Add `weakContext` for AppContext reference | Lifecycle safety |
| Update `setActivePlayerInternal` | Replace player session, add listener on main queue |
| Add new public methods | `registerPlayer`, `setPlayerMetadata`, `setPlayerOptions`, `unregisterPlayer` |
| Update `onBind` | Always return binder |

---

## Phase 4: Web Layer ✅ COMPLETED

**Completed:** 2026-02-27 on branch `claude/phase-4-web-layer-kdTW1`

**Summary:** Web layer fully modernised to match SDK 55 expo-audio while preserving the custom `forceResetSession()` web stub. Key changes:
- **Split** monolithic `AudioModule.web.ts` into five focused files: `AudioUtils.web.ts`, `MediaSessionController.web.ts`, `AudioPlayer.web.ts`, `AudioRecorder.web.ts`, `AudioPlaylist.web.ts`
- **`AudioUtils.web.ts`**: shared utilities — `nextId()`, `getAudioContext()`, `safeDuration()` (NaN protection), `getStatusFromMedia()`, `getSourceUri()`, `preloadCache` (blob-URL map)
- **`MediaSessionController.web.ts`**: singleton browser Media Session API controller — `setActivePlayer()`, `updateMetadata()`, `clear()`, `updatePlaybackState()`, `updatePositionState()`, seek-forward/backward action handlers
- **`AudioPlayer.web.ts`**: full real Web Audio API sampling via `AnalyserNode`, preload cache lookup in `_createMediaElement`, `activePlayers` set, `isAudioActive` gate on `play()`, Media Session integration on play/pause/seek/end, `setActiveForLockScreen` / `updateLockScreenMetadata` / `clearLockScreenControls` wired to `mediaSessionController`, `release()` alias for `remove()`
- **`AudioRecorder.web.ts`**: real device enumeration (`enumerateDevices`), metering via `AnalyserNode` (`getMeteringLevel()` in dBFS), device selection (`setInput()` + `selectedDeviceId`), `devicechange` listener, device-specific stream constraints; **PRESERVED** `forceResetSession()` as no-op web stub
- **`AudioPlaylist.web.ts`**: full gapless playlist with `_nextMedia` preload buffer, loop modes (none/single/all), track navigation (`next/previous/skipTo`), queue management (`add/insert/remove/clear`), `_attachMediaHandlers` for timeupdate/play/pause/ended/loadedmetadata/waiting/canplaythrough/error events, `PLAYLIST_STATUS_UPDATE` + `TRACK_CHANGED` events
- **`AudioModule.web.ts`**: refactored to re-export the three web classes, `isAudioActive` flag, `setIsAudioActiveAsync` pauses all `activePlayers`, full preload API (`preloadAsync`, `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources`), permission helpers
- **`ExpoAudio.web.ts`**: `useAudioPlayer` migrated to `useReleasingSharedObject`, `createAudioPlayer` uses `preloadAsync` for `downloadFirst`, `useAudioPlaylist` / `useAudioPlaylistStatus` / `createAudioPlaylist` fully implemented, all preload functions wired through to `AudioModule`, **PRESERVED** `requestNotificationPermissionsAsync` web stub (always granted)
- **`Audio.types.ts`**: `AudioPlaylistStatus` expanded with `trackCount`, `isBuffering`, `playbackRate`, `muted`, `volume`, `didJustFinish`; `AudioPlaylistOptions.sources` made optional (`@default []`)
- **`AudioModule.types.ts`**: `AudioPlaylist` class updated to match upstream interface (`add/insert/remove/clear/destroy/seekTo`, `trackCount`, `isBuffering`, `playbackRate`, `muted`, `volume`, `duration`, `currentTime`); `AudioPlaylistEvents.trackChanged` payload updated to `{ previousIndex, currentIndex }`

### 4.1 Split Monolithic `AudioModule.web.ts`

Extract into separate files:
- `AudioPlayer.web.ts` — Player class with real audio sampling, preload cache, media session
- `AudioRecorder.web.ts` — Recorder class with device enumeration, metering, device selection
- `AudioPlaylist.web.ts` — New playlist class with gapless playback
- `AudioUtils.web.ts` — Shared utilities (`nextId()`, `getAudioContext()`, `safeDuration()`, etc.)
- `MediaSessionController.web.ts` — Browser Media Session API singleton

### 4.2 Update `AudioModule.web.ts`

| Task | Details |
|------|---------|
| Re-export classes from split files | `AudioPlayerWeb`, `AudioRecorderWeb`, `AudioPlaylistWeb` |
| Add `isAudioActive` state | Gate `play()` calls |
| Update `setIsAudioActiveAsync` | Pause all active players when deactivating |
| Add preload functions | `preloadAsync`, `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources` |

### 4.3 Update `ExpoAudio.web.ts`

| Task | Details |
|------|---------|
| Add playlist hooks | `useAudioPlaylist`, `useAudioPlaylistStatus`, `createAudioPlaylist` |
| Add preload functions | `preload`, `clearPreloadedSource`, `clearAllPreloadedSources`, `getPreloadedSources` |
| Update `useAudioPlayer` | Use `useReleasingSharedObject`, preload-based approach |
| Update `createAudioPlayer` | Use preload instead of download |

---

## Phase 5: Plugin & Config

### 5.1 `plugin/src/withAudio.ts`

| Task | Details |
|------|---------|
| Update for background service declarations | Add service entries via config plugin (not hardcoded in manifest) |
| Add `enableBackgroundPlayback` flag | Conditional service registration |
| Add `enableBackgroundRecording` flag | Conditional recording service registration |

### 5.2 `expo-module.config.json`

Review and update if needed for new class registrations.

### 5.3 `package.json`

| Task | Details |
|------|---------|
| Update `expo-module-scripts` | `^5.0.7` → `^55.0.2` |
| Review peer dependencies | Ensure compatibility with SDK 55 |
| Bump version | New major version |

---

## Phase 6: Testing & Validation

| Task | Details |
|------|---------|
| Update existing tests | Adapt for ID type changes (`number` → `string`) |
| Add playlist tests | New hook and function tests |
| Add preload tests | Test preload/clear lifecycle |
| Test iOS advanced config | Verify polar patterns, orientation, etc. still work |
| Test `forceResetSession` | Verify custom function preserved |
| Test `getAudioSessionState` | Verify session query preserved |
| Test media services reset recovery | Verify new recovery logic works with advanced config |
| Test background recording | Verify Android foreground service |
| Test lock screen controls | Verify new bound service architecture |

---

## Implementation Order

We recommend the following order to minimize broken states:

1. **Phase 1** (TypeScript) — Foundation types and exports
2. **Phase 2** (iOS) — Native iOS with preserved custom features
3. **Phase 3** (Android) — Native Android with new architecture
4. **Phase 4** (Web) — Web platform updates
5. **Phase 5** (Plugin/Config) — Build configuration
6. **Phase 6** (Testing) — Validation

Within each phase, the order in the tables above is roughly the recommended sequence.

---

## Risk Areas

1. **`setAudioMode` merge** — The most complex merge point. SDK 55 simplified the iOS audio mode handling while your fork added extensive advanced config. These must be carefully merged so both `shouldRouteThroughEarpiece` (SDK 55) and `ios?.polarPattern` etc. (your fork) coexist.

2. **Android service rearchitecture** — Moving from static singleton to bound service pattern is a significant refactor. The `AudioControlsService` rewrite touches lock screen controls, which must continue working.

3. **ID type change (`number` → `string`)** — This is a breaking change that affects any consumer code comparing IDs.

4. **Media services reset + advanced config** — SDK 55's reset recovery needs to also re-apply your advanced iOS session configuration (polar patterns, etc.), not just the basic `lastConfiguredMode`.

5. **`interruptionMode` unification** — Ensuring the deprecated `interruptionModeAndroid` still works while the new unified `interruptionMode` takes precedence.
