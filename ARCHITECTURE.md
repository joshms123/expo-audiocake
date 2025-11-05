# Architecture & Design Decisions

> **Purpose:** Explain WHY we made specific design choices  
> **Audience:** Developers who need to understand the reasoning

---

## Core Problem

### The Conflict

Applications using expo-audio often need fine-grained control over iOS's AVAudioSession, particularly for:

1. **True stereo recording** (not dual-mono)
2. **Input orientation** for proper stereo field
3. **Persistent configuration** across route changes
4. **Session state inspection** for debugging

The standard expo-audio package doesn't expose these iOS-specific APIs, leading developers to create separate packages (like av-session-override) that then **conflict** with expo-audio's own session management.

### The Problem Pattern

```
┌─────────────────────┐
│   Your App          │
└──────┬──────────────┘
       │
       ├─────────────────┐
       │                 │
       ▼                 ▼
┌──────────────┐  ┌──────────────────┐
│  expo-audio  │  │ av-session-      │
│              │  │ override         │
└──────┬───────┘  └────────┬─────────┘
       │                   │
       │  CONFLICT!        │
       ▼                   ▼
┌──────────────────────────────┐
│   AVAudioSession             │
│   (iOS Native)               │
└──────────────────────────────┘
```

**Result:**
- Race conditions (which package sets category last?)
- Polar pattern resets when expo-audio reconfigures
- Difficult to debug (two systems fighting)
- Brittle coordination code

---

## Solution: Unified Package

### Design Philosophy

**Integrate, don't coordinate.**

Instead of two packages trying to coordinate, extend expo-audio to include the advanced features natively.

```
┌─────────────────────┐
│   Your App          │
└──────┬──────────────┘
       │
       ▼
┌──────────────────────────────┐
│  expo-audiocake              │
│  (expo-audio + advanced)     │
└──────┬───────────────────────┘
       │  Single source of truth
       ▼
┌──────────────────────────────┐
│   AVAudioSession             │
│   (iOS Native)               │
└──────────────────────────────┘
```

**Benefits:**
- No conflicts (single package controls session)
- Proper ordering guaranteed (polar pattern after category)
- Easier to maintain
- Cleaner API

---

## Design Decisions

### 1. iOS-Only Advanced Features

**Decision:** Put advanced features in `ios?:` optional property of AudioMode.

**Why:**
- Android doesn't need/support polar patterns or input orientation
- Web has no audio session concept
- Keeps API clean for cross-platform code
- Graceful degradation (feature only used where supported)

**Example:**
```typescript
await setAudioModeAsync({
  allowsRecording: true,      // Cross-platform
  playsInSilentMode: true,   // Cross-platform
  ios: {                      // iOS-only
    polarPattern: 'stereo',
    inputOrientation: 'landscapeLeft'
  }
});
```

On Android/Web, the `ios` property is simply ignored.

---

### 2. Extend Existing API (Not Replace)

**Decision:** Add features to existing `setAudioModeAsync()`, don't create new functions.

**Why:**
- Backward compatible (existing code still works)
- Single configuration call
- Atomic operation (all settings applied together)
- Familiar to expo-audio users

**Alternative Considered:** New function like `setAdvancedAudioSessionAsync()`

**Why Rejected:**
- Two functions = potential for conflicts
- Users would need to coordinate order
- More complex API surface

---

### 3. Auto-Reapply by Default

**Decision:** `autoReapplyOnRouteChange: true` by default.

**Why:**
- Most common use case (want config to persist)
- Prevents unexpected loss of stereo recording
- Matches developer expectations
- Can be disabled if needed

**When to Disable:**
- You want system to handle route changes
- You're implementing custom route change handling
- You need different configs for different routes

---

### 4. Store Desired State

**Decision:** Store all advanced config in module properties (`desiredPolarPattern`, etc.).

**Why:**
- Enables auto-reapply on route changes
- Session state can be queried
- Debugging is easier
- Clear source of truth

**Alternative Considered:** Query session each time

**Why Rejected:**
- Some properties can't be queried from session
- Session might be in unexpected state
- Would need to reverse-map enums to strings

---

### 5. Polar Pattern Requires Data Source

**Decision:** Make `dataSourceName` required when `polarPattern` is specified.

**Why:**
- iOS API requires it (data source has polar pattern)
- Clearer error messages
- Prevents silent failures
- Matches iOS mental model

**Example:**
```typescript
ios: {
  polarPattern: 'stereo',         // Requires...
  preferredInput: 'builtInMic',   // ...these two
  dataSourceName: 'front'         // ...to work
}
```

---

### 6. Apply Advanced Config AFTER Category

**Decision:** Call `applyAdvancedSessionConfig()` after `setCategory()`.

**Why:**
- iOS behavior: `setCategory()` resets some session state
- Polar pattern must be set after category is established
- Input orientation requires category to be set
- Ordering matters in iOS AVAudioSession

**Implementation:**
```swift
// 1. Set category/mode/options (existing expo-audio logic)
try session.setCategory(category, options: sessionOptions)

// 2. THEN apply advanced config (NEW)
try applyAdvancedSessionConfig(iosConfig)
```

---

### 7. Minimal Changes to Existing Code

**Decision:** Extend existing functions, don't refactor expo-audio architecture.

**Why:**
- Easier to maintain fork
- Smaller diff with upstream
- Less likely to introduce bugs
- Easier to merge upstream changes

**What We DON'T Change:**
- AudioPlayer/AudioRecorder classes
- Existing interruption handling
- Android/Web implementations
- Public API (except additions)

**What We ADD:**
- iOS-specific properties
- New helper methods
- Auto-reapply observers
- Session state query

---

### 8. Reference Implementation as Guide

**Decision:** Use av-session-override as reference, not dependency.

**Why:**
- av-session-override is a separate package (would still conflict)
- We want features integrated into expo-audio
- Reference code is well-tested
- Proves the approach works

**How to Use Reference:**
- Copy proven implementations (polar pattern setup)
- Use same mapping functions (orientation, pattern)
- Follow same error handling patterns
- But adapt to expo-audio's structure

---

## Technical Details

### Session Configuration Order

**Critical:** This order must be maintained:

1. **Set category/mode/options** (existing expo-audio)
2. **Set sample rate** (NEW - hint to system)
3. **Set IO buffer duration** (NEW - hint to system)
4. **Set preferred input** (NEW - select microphone)
5. **Set data source with polar pattern** (NEW - CRITICAL for stereo)
6. **Set input orientation** (NEW - stereo field alignment)

**Why This Order:**
- Category must be set before input selection
- Input must be set before data source selection
- Data source must be set before polar pattern
- iOS enforces some of these dependencies

### Auto-Reapply Strategy

**When to Reapply:**

1. **Route changes** (headphone plug/unplug, Bluetooth connect)
   - Most common case
   - Session may reset some properties
   - Polar pattern often lost

2. **Media services reset** (rare, but happens)
   - iOS audio services restarted
   - All session config lost
   - Must fully reconfigure

3. **Interruption end** (phone call ends)
   - expo-audio already handles this
   - We piggyback on existing logic
   - Just reapply advanced config

**What to Reapply:**
- Sample rate
- IO buffer duration
- Input orientation
- **Polar pattern** (most critical!)

**What NOT to Reapply:**
- Category/mode/options (expo-audio handles this)
- Active state (expo-audio handles this)

### State Management

**Stored State:**
```swift
// These store the USER'S desired configuration
private var desiredPolarPattern: AVAudioSession.PolarPattern?
private var desiredInputOrientation: AVAudioSession.StereoOrientation?
private var desiredSampleRate: Double?
private var desiredIOBufferDuration: Double?
```

**Why Store:**
- Needed for auto-reapply
- User's intent, not current state
- Session might be in different state temporarily

**Current State:**
- Queried from AVAudioSession.sharedInstance()
- Returned by `getAudioSessionState()`
- May differ from desired state

---

## Error Handling

### Philosophy

**Fail fast with clear errors.**

**Examples:**

```swift
// Bad: Silent failure
if polarPattern != nil {
  try? dataSource.setPreferredPolarPattern(polarPattern)
}

// Good: Clear error
guard dataSourceName != nil else {
  throw Exception(
    name: "MissingDataSourceName",
    description: "dataSourceName is required when polarPattern is specified"
  )
}
```

**Why:**
- Developers need to know what's wrong
- Silent failures lead to "stereo doesn't work" issues
- Clear errors guide to solution

### Error Categories

1. **Invalid configuration** (user error)
   - Missing required parameters
   - Invalid enum values
   - Throw immediately

2. **Device limitations** (hardware issue)
   - Polar pattern not supported
   - Input not available
   - Throw with explanation

3. **Reapply failures** (transient)
   - Route change in progress
   - Log but don't throw
   - Try again next time

---

## Performance Considerations

### Why Delay Reapply?

```swift
DispatchQueue.main.asyncAfter(deadline: .now() + 0.1) {
  try self?.reapplyAdvancedConfig()
}
```

**Why 0.1 second delay?**
- Route changes take time to complete
- Immediate reapply may fail (session busy)
- Too long delay = user notices
- 0.1s is imperceptible but sufficient

**Media services reset:**
- Use 0.5s delay (longer process)

### Configuration Cost

**What's expensive:**
- `setCategory()` - Moderate (existing)
- `setPreferredInput()` - Moderate (NEW)
- `setPreferredPolarPattern()` - Cheap (NEW)

**When expensive:**
- Session activation (existing)
- Input switching (NEW, but rare)

**Mitigation:**
- Only configure when needed
- Cache desired state
- Don't reconfigure if already correct (future optimization)

---

## Security & Privacy

### Microphone Access

**No change from expo-audio:**
- Still requires microphone permission
- Still shows permission prompt
- Still respects user denial

**New capabilities:**
- Can select which microphone (front/back)
- Can enable stereo polar pattern
- BUT still requires same permission

### Data Collection

**We don't:**
- Store audio data
- Send telemetry
- Track usage

**Same as expo-audio.**

---

## Backward Compatibility

### Existing Apps

**No breaking changes:**
- All existing expo-audio code works
- `ios?:` property is optional
- Default behavior unchanged

### New Features Opt-In

```typescript
// Works today (no change)
await setAudioModeAsync({
  allowsRecording: true
});

// New features (opt-in)
await setAudioModeAsync({
  allowsRecording: true,
  ios: {
    polarPattern: 'stereo'  // NEW, optional
  }
});
```

---

## Future Considerations

### Potential Enhancements

1. **More polar patterns**
   - Currently: stereo, cardioid, omnidirectional, subcardioid
   - Future: All AVAudioSession polar patterns

2. **External input support**
   - Currently: Only built-in mic
   - Future: USB, Lightning, wireless

3. **Session state change events**
   - Currently: Must poll `getAudioSessionState()`
   - Future: Event emitter for state changes

4. **Config presets**
   - Currently: Manual configuration
   - Future: Presets like "highQualityStereo", "podcast", etc.

5. **Android equivalents**
   - Currently: iOS only
   - Future: Android-specific features if API exists

### Upstream Contribution

**Goal:** Eventually contribute back to expo-audio

**Requirements:**
- Proven in production
- Well-tested
- Community feedback incorporated
- Expo team approval

**Timeline:** 6-12 months after launch

---

## Testing Strategy

### What to Test

1. **Functional tests**
   - Each feature works in isolation
   - Features work together
   - Edge cases handled

2. **Integration tests**
   - Works with expo-audio features
   - Works with interruptions
   - Works with route changes

3. **Real-world scenarios**
   - True stereo recording validated
   - Auto-reapply tested with real devices
   - Multiple record/stop cycles

See `TESTING_PLAN.md` for detailed test cases.

---

## Maintenance Strategy

### Keeping Fork Updated

**Regular upstream merges:**
- Monitor expo-audio releases
- Merge changes monthly
- Test after each merge

**Conflict resolution:**
- Our changes are additive
- Low conflict likelihood
- Focus on AudioModule.swift

See `MAINTENANCE.md` for detailed strategy.

---

## Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-11 | Fork expo-audio | Eliminate conflicts with separate packages |
| 2024-11 | iOS-only features | Android/Web don't support these APIs |
| 2024-11 | Extend AudioMode | Backward compatible, single config call |
| 2024-11 | Auto-reapply default | Most common use case, prevents issues |
| 2024-11 | Use av-session-override as reference | Proven implementation, well-tested |

---

## Summary

**Core principle:** Integrate advanced features INTO expo-audio rather than coordinating external packages.

**Result:**
- No conflicts
- Clean API
- Maintainable
- Backward compatible

**Trade-off:**
- Must maintain fork
- ~8 hours per SDK update

**Worth it?** Yes, if you need stereo recording or advanced session control.

---

## Questions?

- Why fork instead of separate package? → Eliminates conflicts
- Why not contribute upstream first? → Faster iteration, proven first
- Why iOS-only? → Platform APIs differ significantly
- Will this work with my app? → If you use expo-audio, yes

For implementation details, see `IMPLEMENTATION_PLAN.md`.
