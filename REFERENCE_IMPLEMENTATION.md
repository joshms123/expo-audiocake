# Reference Implementation Guide

> **Purpose:** Explain how to use av-session-override as implementation reference  
> **Audience:** Developer implementing expo-audiocake

---

## Overview

The `reference/av-session-override/` directory contains a working Expo module that demonstrates all the advanced AVAudioSession features we want to integrate into expo-audio.

**Why it's valuable:**
- ✅ Proven implementation (works in production app)
- ✅ Handles all edge cases
- ✅ Shows correct API usage
- ✅ Demonstrates error handling

**How to use it:**
- Copy proven implementations
- Adapt to expo-audio's structure
- Reference for iOS API usage

---

## Reference Code Structure

```
reference/av-session-override/
├── ios/
│   └── AVSessionOverrideModule.swift    ← **YOUR PRIMARY REFERENCE**
├── android/
│   └── AVSessionOverrideModule.kt       ← Android stub (simple)
├── src/
│   ├── AvSessionOverrideModule.ts       ← TypeScript types
│   └── index.ts                          ← Exports
└── expo-module.config.json              ← Module config
```

**Focus on:** `ios/AVSessionOverrideModule.swift` (294 lines)

---

## Key Code Sections to Study

### 1. Data Structures (Lines 4-30)

```swift
struct SetParams: Record {
  @Field var category: String
  @Field var options: [String]? = nil
  @Field var mode: String? = nil
  @Field var active: Bool? = nil
  @Field var sampleRate: Double? = nil
  @Field var ioBufferDuration: Double? = nil
  @Field var inputOrientation: String? = nil
  @Field var preferredInput: String? = nil
  @Field var dataSourceName: String? = nil
  @Field var polarPattern: String? = nil
}

struct DesiredState: Codable {
  var category: String
  var options: [String]
  var mode: String
  var active: Bool
  var sampleRate: Double?
  var ioBufferDuration: Double?
  var inputOrientation: String?
  var preferredInput: String?
  var dataSourceName: String?
  var polarPattern: String?
}
```

**What to learn:**
- How to structure config data
- What properties are needed
- Optional vs required fields

**How to adapt:**
- In expo-audiocake, this becomes the `IOSAudioConfig` TypeScript type
- Store in module properties instead of `DesiredState` struct
- Keep same property names for consistency

---

### 2. Observer Pattern (Lines 95-145)

**Setting up observers:**

```swift
private func registerObservers() {
  let center = NotificationCenter.default
  let session = AVAudioSession.sharedInstance()

  // Route changes (headphone plug/unplug)
  let route = center.addObserver(
    forName: AVAudioSession.routeChangeNotification,
    object: session,
    queue: .main
  ) { [weak self] _ in
    self?.maybeReapply(reason: "routeChange")
  }
  
  // Interruptions (phone calls)
  let interrupt = center.addObserver(
    forName: AVAudioSession.interruptionNotification,
    object: session,
    queue: .main
  ) { [weak self] _ in
    self?.maybeReapply(reason: "interruption")
  }
  
  // Media services reset (rare)
  let reset = center.addObserver(
    forName: AVAudioSession.mediaServicesWereResetNotification,
    object: nil,
    queue: .main
  ) { [weak self] _ in
    self?.maybeReapply(reason: "mediaServicesReset")
  }
  
  observers = [route, interrupt, reset]
}
```

**What to learn:**
- Three notification types to observe
- Using `[weak self]` to avoid retain cycles
- Storing observers for later removal

**How to adapt:**
- expo-audio ALREADY observes interruptions (keep that)
- ADD route change observer to existing `setupInterruptionHandling()`
- ADD media services reset observer
- Call `reapplyAdvancedConfig()` in handlers

**Example for expo-audio:**

```swift
// In AudioModule.swift setupInterruptionHandling()
private func setupInterruptionHandling() {
  let center = NotificationCenter.default
  let session = AVAudioSession.sharedInstance()

  // ... existing interruption observer ...
  
  // ADD: Route change observer
  center.addObserver(
    self,
    selector: #selector(handleRouteChange),
    name: AVAudioSession.routeChangeNotification,
    object: session
  )
  
  // ADD: Media services reset observer
  center.addObserver(
    self,
    selector: #selector(handleMediaServicesReset),
    name: AVAudioSession.mediaServicesWereResetNotification,
    object: nil
  )
}
```

---

### 3. Auto-Reapply Logic (Lines 135-145)

```swift
private func maybeReapply(reason: String) {
  guard keepEnforced, let desired = desired else { return }
  do {
    try apply(desired: desired)
  } catch {
    // Log but don't crash
    NSLog("[AVSessionOverride] Reapply failed (\(reason)): \(error.localizedDescription)")
  }
}
```

**What to learn:**
- Check if auto-reapply is enabled (`keepEnforced`)
- Check if we have desired state (`desired`)
- Swallow errors but log them (don't crash)
- Include reason in logs for debugging

**How to adapt:**

```swift
// In expo-audio
private func reapplyAdvancedConfig() throws {
  guard autoReapplyOnRouteChange else { return }
  
  // Only reapply if we have stored config
  guard desiredPolarPattern != nil || desiredSampleRate != nil else {
    return
  }
  
  let session = AVAudioSession.sharedInstance()
  
  // Reapply sample rate
  if let sampleRate = desiredSampleRate {
    try session.setPreferredSampleRate(sampleRate)
  }
  
  // ... etc ...
}

// Call from route change handler
@objc private func handleRouteChange(_ notification: Notification) {
  // ... existing logic ...
  
  if autoReapplyOnRouteChange {
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) { [weak self] in
      do {
        try self?.reapplyAdvancedConfig()
      } catch {
        print("expo-audiocake: Reapply failed: \(error)")
      }
    }
  }
}
```

---

### 4. Apply Logic (Lines 148-180)

**Core session configuration:**

```swift
private func apply(desired: DesiredState) throws {
  let session = AVAudioSession.sharedInstance()
  let category = try mapCategory(desired.category)
  let options = try mapOptions(desired.options)
  let mode = try mapMode(desired.mode)

  // Order matters: Category first
  try session.setCategory(category, mode: mode, options: options)

  // Then sample rate
  if let sr = desired.sampleRate {
    try session.setPreferredSampleRate(sr)
  }
  
  // Then buffer duration
  if let dur = desired.ioBufferDuration {
    try session.setPreferredIOBufferDuration(dur)
  }
  
  // Then input configuration
  if let preferredInputType = desired.preferredInput {
    try configurePreferredInput(session: session, inputType: preferredInputType)
  }
  
  // Then polar pattern (AFTER input is set)
  if let dataSourceName = desired.dataSourceName, let polarPattern = desired.polarPattern {
    try configureStereoDataSource(session: session, dataSourceName: dataSourceName, polarPattern: polarPattern)
  }
  
  // Then orientation
  if let inputOrientation = desired.inputOrientation {
    let orientation = try mapOrientation(inputOrientation)
    try session.setPreferredInputOrientation(orientation)
  }

  // Finally, activate
  try session.setActive(desired.active, options: [])
}
```

**What to learn:**
- **ORDER MATTERS** - Category must be set before other properties
- Sample rate and buffer duration are hints (may differ)
- Input must be configured before data source
- Data source must be set before polar pattern
- Orientation can be set anytime after category

**How to adapt:**

In expo-audio, `setCategory()` is already called in `setAudioMode()`. Add advanced config AFTER that:

```swift
private func setAudioMode(mode: AudioMode) throws {
  // ... existing category/mode/options logic ...
  
  try session.setCategory(category, options: sessionOptions)
  
  // NEW: Apply advanced config AFTER category
  if let iosConfig = mode.ios {
    try applyAdvancedSessionConfig(iosConfig)
  }
}
```

---

### 5. Stereo Configuration (Lines 182-215)

**This is the CRITICAL code for true stereo:**

```swift
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

private func configureStereoDataSource(session: AVAudioSession, dataSourceName: String, polarPattern: String) throws {
  guard polarPattern.lowercased() == "stereo" else {
    throw Exception(name: "InvalidPolarPattern", description: "Only 'stereo' polar pattern is supported")
  }
  
  guard let preferredInput = session.preferredInput,
        let dataSources = preferredInput.dataSources,
        let dataSource = dataSources.first(where: { $0.dataSourceName.lowercased() == dataSourceName.lowercased() }),
        let supportedPolarPatterns = dataSource.supportedPolarPatterns else {
    throw Exception(name: "DataSourceNotFound", description: "Could not find data source '\(dataSourceName)' or it has no supported polar patterns")
  }
  
  guard supportedPolarPatterns.contains(.stereo) else {
    throw Exception(name: "StereoNotSupported", description: "The selected data source does not support stereo recording")
  }
  
  // THIS IS THE KEY CALL FOR TRUE STEREO
  try dataSource.setPreferredPolarPattern(.stereo)
  try preferredInput.setPreferredDataSource(dataSource)
}
```

**What to learn:**
- Must select preferred input first
- Then find data source by name
- Check if polar pattern is supported
- Set polar pattern on data source (NOT on session!)
- Set data source on preferred input

**Critical line:**
```swift
try dataSource.setPreferredPolarPattern(.stereo)
```
Without this, you get dual-mono!

**How to adapt:**

Copy these functions almost verbatim into expo-audio:

```swift
// Add to AudioModule.swift
private func configurePreferredInput(session: AVAudioSession, inputType: String) throws {
  // Copy from reference (lines 184-195)
}

private func configureStereoDataSource(
  session: AVAudioSession,
  dataSourceName: String,
  polarPattern: String
) throws {
  // Copy from reference (lines 197-215)
  // But update to support all polar patterns, not just stereo
  let avPolarPattern = try mapPolarPattern(polarPattern)
  
  guard let preferredInput = session.preferredInput,
        let dataSources = preferredInput.dataSources,
        let dataSource = dataSources.first(where: { 
          $0.dataSourceName.lowercased() == dataSourceName.lowercased() 
        }),
        let supportedPolarPatterns = dataSource.supportedPolarPatterns else {
    throw Exception(
      name: "DataSourceNotFound",
      description: "Could not find data source '\(dataSourceName)'"
    )
  }
  
  guard supportedPolarPatterns.contains(avPolarPattern) else {
    throw Exception(
      name: "PolarPatternNotSupported",
      description: "Data source does not support polar pattern '\(polarPattern)'"
    )
  }
  
  try dataSource.setPreferredPolarPattern(avPolarPattern)
  try preferredInput.setPreferredDataSource(dataSource)
  
  // Store for reapply
  self.desiredPolarPattern = avPolarPattern
}
```

---

### 6. Mapping Functions (Lines 233-293)

**Converting strings to iOS enums:**

```swift
private func mapCategory(_ s: String) throws -> AVAudioSession.Category {
  switch s.lowercased() {
    case "ambient": return .ambient
    case "soloambient", "solo-ambient": return .soloAmbient
    case "playback": return .playback
    case "record", "recording": return .record
    case "playandrecord", "play-and-record", "play_record": return .playAndRecord
    case "multiroute", "multi-route": return .multiRoute
    default: throw Exception(name: "InvalidCategory", description: "Unknown category: \(s)")
  }
}

private func mapMode(_ s: String) throws -> AVAudioSession.Mode {
  switch s.lowercased() {
    case "default": return .default
    case "voicechat", "voice-chat": return .voiceChat
    case "videorecording", "video-recording": return .videoRecording
    case "measurement": return .measurement
    case "movieplayback", "movie-playback": return .moviePlayback
    case "spokenaudio", "spoken-audio": return .spokenAudio
    case "gamechat", "game-chat": return .gameChat
    default: throw Exception(name: "InvalidMode", description: "Unknown mode: \(s)")
  }
}

private func mapOrientation(_ s: String) throws -> AVAudioSession.StereoOrientation {
  switch s.lowercased() {
    case "portrait": return .portrait
    case "portraitupsidedown", "portrait-upside-down": return .portraitUpsideDown
    case "landscapeleft", "landscape-left": return .landscapeLeft
    case "landscaperight", "landscape-right": return .landscapeRight
    case "none", "default": return .none
    case "front", "back", "top", "bottom": return .portrait  // Legacy mappings
    case "left": return .landscapeLeft
    case "right": return .landscapeRight
    case "faceup", "face-up": return .portrait
    case "facedown", "face-down": return .portraitUpsideDown
    default: throw Exception(name: "InvalidOrientation", description: "Unknown orientation: \(s)")
  }
}

private func mapOptions(_ list: [String]) throws -> AVAudioSession.CategoryOptions {
  var opts: AVAudioSession.CategoryOptions = []
  for raw in list {
    switch raw.lowercased() {
      case "mixwithothers", "mix": opts.insert(.mixWithOthers)
      case "duckothers", "duck": opts.insert(.duckOthers)
      case "allowbluetooth", "bt": opts.insert(.allowBluetooth)
      case "allowbluetootha2dp", "a2dp": opts.insert(.allowBluetoothA2DP)
      case "defaulttospeaker", "speaker": opts.insert(.defaultToSpeaker)
      case "interruptspokes": opts.insert(.interruptSpokenAudioAndMixWithOthers)
      case "allowairplay", "airplay": opts.insert(.allowAirPlay)
      default: throw Exception(name: "InvalidOption", description: "Unknown option: \(raw)")
    }
  }
  return opts
}
```

**What to learn:**
- Accept multiple string variations (lowercase, with/without hyphens)
- Throw clear errors for invalid values
- Use Swift enums for type safety

**How to adapt:**

Add these NEW mapping functions (expo-audio doesn't have orientation or polar pattern yet):

```swift
// Add to AudioModule.swift
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

private func mapOrientation(_ orientation: String) throws -> AVAudioSession.StereoOrientation {
  // Copy from reference (lines 259-276)
}
```

---

### 7. Session State Query (Lines 83-92)

```swift
Function("getState") {
  let s = AVAudioSession.sharedInstance()
  return [
    "category": s.category.rawValue,
    "mode": s.mode.rawValue,
    "sampleRate": s.sampleRate,
    "ioBufferDuration": s.ioBufferDuration,
    "route": s.currentRoute.outputs.first?.portType.rawValue ?? "unknown"
  ]
}
```

**What to learn:**
- Query session directly
- Return dictionary with key session properties
- Use `.rawValue` to convert enums to strings
- Handle optional output route gracefully

**How to adapt:**

Add to expo-audio's `definition()`:

```swift
// In AudioModule.swift definition()
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

---

## Implementation Checklist

Use reference code to implement:

### From Lines 4-30: Data Structures
- [ ] Understand config structure
- [ ] Create `IOSAudioConfig` TypeScript type
- [ ] Add module properties for storing desired state

### From Lines 95-145: Observer Pattern
- [ ] Add route change observer to `setupInterruptionHandling()`
- [ ] Add media services reset observer
- [ ] Implement reapply handlers with error logging

### From Lines 148-180: Apply Logic
- [ ] Understand configuration order
- [ ] Implement `applyAdvancedSessionConfig()` method
- [ ] Call AFTER `setCategory()` in `setAudioMode()`

### From Lines 182-215: Stereo Configuration
- [ ] Copy `configurePreferredInput()` method
- [ ] Copy `configureStereoDataSource()` method
- [ ] Understand polar pattern API usage
- [ ] Store configured values for reapply

### From Lines 233-293: Mapping Functions
- [ ] Add `mapPolarPattern()` function
- [ ] Add `mapOrientation()` function
- [ ] Accept multiple string variations
- [ ] Throw clear errors

### From Lines 83-92: State Query
- [ ] Add `getAudioSessionState()` function to definition()
- [ ] Return session properties
- [ ] Handle iOS-only with `#if os(iOS)`

---

## Testing Against Reference

**Validate your implementation matches reference behavior:**

1. **Same config, same result**
   - Configure stereo with reference package
   - Record audio → Analyze waveform
   - Configure stereo with expo-audiocake
   - Record audio → Analyze waveform
   - Should be identical (true stereo in both)

2. **Auto-reapply works**
   - Reference: Stereo persists after headphone plug
   - expo-audiocake: Stereo persists after headphone plug
   - Should behave identically

3. **Error messages**
   - Reference: Clear errors for invalid config
   - expo-audiocake: Clear errors for invalid config
   - Should throw same exception names

---

## Common Pitfalls

### ❌ Wrong: Setting polar pattern on session

```swift
// This does NOT work
try session.setPreferredPolarPattern(.stereo)  // No such method!
```

### ✅ Right: Setting polar pattern on data source

```swift
// This is correct
try dataSource.setPreferredPolarPattern(.stereo)
try preferredInput.setPreferredDataSource(dataSource)
```

---

### ❌ Wrong: Setting polar pattern before input

```swift
// Wrong order - will fail
try configureStereoDataSource(...)  // No preferred input yet!
try configurePreferredInput(...)
```

### ✅ Right: Input first, then data source/pattern

```swift
// Correct order
try configurePreferredInput(...)
try configureStereoDataSource(...)  // Now preferred input exists
```

---

### ❌ Wrong: Not storing config for reapply

```swift
// Auto-reapply won't work - no stored state
private func applyAdvancedSessionConfig(_ config: IOSAudioConfig) throws {
  if let polarPattern = config.polarPattern {
    try dataSource.setPreferredPolarPattern(polarPattern)
    // Forgot to store!
  }
}
```

### ✅ Right: Store config in properties

```swift
// Auto-reapply will work
private func applyAdvancedSessionConfig(_ config: IOSAudioConfig) throws {
  if let polarPattern = config.polarPattern {
    let avPolarPattern = try mapPolarPattern(polarPattern)
    try dataSource.setPreferredPolarPattern(avPolarPattern)
    self.desiredPolarPattern = avPolarPattern  // Stored for reapply!
  }
}
```

---

## Summary

**Reference code shows you:**
1. How to structure config (lines 4-30)
2. How to observe and reapply (lines 95-145)
3. Correct order of operations (lines 148-180)
4. **Critical stereo setup** (lines 182-215)
5. String-to-enum mapping (lines 233-293)
6. Session state query (lines 83-92)

**Your job:**
- Study reference implementation
- Copy proven patterns
- Adapt to expo-audio structure
- Test that behavior matches

**Most important:**
- Lines 197-215: True stereo configuration
- Lines 99-125: Auto-reapply observers

---

## Questions?

**Q: Should I copy code verbatim?**  
A: For stereo config (lines 197-215), yes - it's proven. For structure, adapt to expo-audio.

**Q: Can I simplify the reference code?**  
A: Don't skip the polar pattern code - that's critical. Other parts can be adapted.

**Q: What if I don't understand Swift?**  
A: Focus on the logic flow. Ask for help with Swift syntax specifics.

**Q: Which lines are most important?**  
A: Lines 197-215 (stereo config) and 99-125 (auto-reapply). Get these right and everything else follows.

---

For implementation steps, see `IMPLEMENTATION_PLAN.md`.  
For API design, see `API_DESIGN.md`.
