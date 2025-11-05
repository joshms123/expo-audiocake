# Testing Plan

> **Purpose:** Comprehensive test cases for expo-audiocake validation  
> **Audience:** Developer testing the implementation

---

## Overview

Testing expo-audiocake requires:
1. **Functional tests** - Each feature works
2. **Integration tests** - Features work together
3. **Real-world validation** - True stereo, auto-reapply, etc.
4. **Cross-platform tests** - iOS, Android, Web

**Critical:** Stereo recording validation requires waveform analysis.

---

## Test Environment Setup

### Required Devices

**iOS:**
- iPhone with stereo microphones (iPhone 7+ or later recommended)
- iPad Pro (has stereo mics)
- Test on iOS 15+ and iOS 17+

**Android:**
- Any Android device (for stub validation)
- Test that build succeeds

**Web:**
- Chrome browser
- Test that build succeeds

### Required Tools

1. **Xcode** - For iOS development and debugging
2. **Audio Editor** - Audacity (free) or similar for waveform analysis
3. **File Transfer** - AirDrop or USB for getting recordings off device
4. **Headphones** - For route change testing
5. **Bluetooth Speaker** - For Bluetooth route testing (optional)

---

## Test Cases

### Category 1: Basic Configuration

#### Test 1.1: Set Polar Pattern

**Objective:** Verify polar pattern can be set

**Steps:**
1. Call setAudioModeAsync() with:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       polarPattern: 'stereo',
       preferredInput: 'builtInMic',
       dataSourceName: 'front'
     }
   });
   ```
2. Check no errors thrown

**Expected:**
- ✅ No errors
- ✅ Function completes successfully

**Pass/Fail:** ___

---

#### Test 1.2: Set Input Orientation

**Objective:** Verify input orientation can be set

**Steps:**
1. Call setAudioModeAsync() with:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       inputOrientation: 'landscapeLeft'
     }
   });
   ```
2. Check no errors thrown

**Expected:**
- ✅ No errors
- ✅ Function completes successfully

**Pass/Fail:** ___

---

#### Test 1.3: Set Sample Rate

**Objective:** Verify sample rate hint can be set

**Steps:**
1. Call setAudioModeAsync() with:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       preferredSampleRate: 48000
     }
   });
   ```
2. Query state:
   ```typescript
   const state = getAudioSessionState();
   console.log('Sample rate:', state?.sampleRate);
   ```

**Expected:**
- ✅ No errors
- ℹ️ Sample rate may differ from requested (system chooses)

**Pass/Fail:** ___

---

### Category 2: Session State Query

#### Test 2.1: Query Session State (iOS)

**Objective:** Verify getAudioSessionState() works on iOS

**Steps:**
1. Configure session:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     playsInSilentMode: true
   });
   ```
2. Query state:
   ```typescript
   const state = getAudioSessionState();
   console.log(state);
   ```

**Expected:**
- ✅ Returns object with: category, mode, sampleRate, ioBufferDuration, outputRoute
- ✅ category includes "PlayAndRecord" (since allowsRecording: true)
- ✅ All properties are populated

**Pass/Fail:** ___

---

#### Test 2.2: Query Session State (Android)

**Objective:** Verify getAudioSessionState() returns null on Android

**Steps:**
1. Run on Android device
2. Call:
   ```typescript
   const state = getAudioSessionState();
   console.log(state);
   ```

**Expected:**
- ✅ Returns null
- ✅ No errors or crashes

**Pass/Fail:** ___

---

### Category 3: Stereo Recording Validation

#### Test 3.1: True Stereo Recording

**Objective:** **CRITICAL TEST** - Verify true stereo (not dual-mono)

**Setup:**
1. Place iPhone in landscape orientation (left hand side up)
2. Configure stereo:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       polarPattern: 'stereo',
       preferredInput: 'builtInMic',
       dataSourceName: 'front',
       inputOrientation: 'landscapeLeft',
       preferredSampleRate: 48000
     }
   });
   ```
3. Start recording
4. Play sound from LEFT side only (e.g., snap fingers near left mic)
5. Wait 2 seconds
6. Play sound from RIGHT side only (e.g., snap fingers near right mic)
7. Stop recording

**Analysis:**
1. Transfer audio file to computer
2. Open in Audacity or similar
3. Split stereo track to separate L/R channels
4. Visual inspection:
   - Left snap should be louder in LEFT channel
   - Right snap should be louder in RIGHT channel
5. Amplitude comparison:
   - Measure peak amplitudes of each snap in each channel
   - Left snap: L channel > R channel (at least 6dB difference)
   - Right snap: R channel > L channel (at least 6dB difference)

**Expected:**
- ✅ File has 2 channels (stereo)
- ✅ Left and right channels have DIFFERENT waveforms
- ✅ Spatial position is captured correctly
- ❌ FAIL if channels are identical (dual-mono)

**Pass/Fail:** ___

**Notes:** ___________________________________________

---

#### Test 3.2: Mono Recording (Cardioid)

**Objective:** Verify mono recording with cardioid pattern

**Steps:**
1. Configure cardioid:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       polarPattern: 'cardioid',
       preferredInput: 'builtInMic',
       dataSourceName: 'back'
     }
   });
   ```
2. Record audio
3. Check file properties

**Expected:**
- ✅ File is mono (1 channel) OR stereo with identical channels
- ✅ Directional pickup (rejects rear sound)

**Pass/Fail:** ___

---

### Category 4: Auto-Reapply on Route Changes

#### Test 4.1: Headphone Plug - Auto-Reapply Enabled

**Objective:** Verify config persists after headphone plug

**Steps:**
1. Configure stereo with auto-reapply:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       polarPattern: 'stereo',
       preferredInput: 'builtInMic',
       dataSourceName: 'front',
       autoReapplyOnRouteChange: true  // Default, but explicit
     }
   });
   ```
2. Start recording (stereo)
3. While recording, plug in headphones
4. Wait 1 second
5. Unplug headphones
6. Wait 1 second
7. Stop recording
8. Analyze recording (should remain stereo throughout)

**Expected:**
- ✅ Recording continues during route changes
- ✅ Stereo is maintained (check waveform)
- ✅ No quality degradation
- ✅ No clicks/pops at route change points

**Pass/Fail:** ___

---

#### Test 4.2: Headphone Plug - Auto-Reapply Disabled

**Objective:** Verify config does NOT reapply when disabled

**Steps:**
1. Configure stereo WITHOUT auto-reapply:
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       polarPattern: 'stereo',
       preferredInput: 'builtInMic',
       dataSourceName: 'front',
       autoReapplyOnRouteChange: false  // Disabled!
     }
   });
   ```
2. Start recording (stereo)
3. While recording, plug in headphones
4. Wait 1 second
5. Make sound (snap fingers on each side)
6. Stop recording
7. Analyze recording

**Expected:**
- ⚠️ Stereo MAY be lost after route change
- ⚠️ Config is NOT automatically reapplied
- ℹ️ This is expected behavior when disabled

**Pass/Fail:** ___

---

#### Test 4.3: Bluetooth Connection

**Objective:** Verify config persists after Bluetooth route change

**Steps:**
1. Configure stereo with auto-reapply
2. Connect Bluetooth speaker/headphones
3. Check session state:
   ```typescript
   const state = getAudioSessionState();
   console.log('Route:', state?.outputRoute);
   ```
4. Disconnect Bluetooth
5. Check session state again

**Expected:**
- ✅ Route changes to Bluetooth, then back to speaker
- ✅ Configuration persists (check by starting recording)

**Pass/Fail:** ___

---

### Category 5: Interruptions

#### Test 5.1: Phone Call Interruption

**Objective:** Verify recording handles phone call gracefully

**Steps:**
1. Configure and start recording
2. Receive phone call (use another phone to call test device)
3. Answer call
4. Talk for 10 seconds
5. End call
6. Check recording state

**Expected:**
- ✅ Recording pauses during call
- ✅ Recording resumes after call (if autoResume enabled in recorder)
- ✅ Session config maintained
- ✅ No crashes

**Pass/Fail:** ___

---

#### Test 5.2: Siri Interruption

**Objective:** Verify recording handles Siri interruption

**Steps:**
1. Configure and start recording
2. Activate Siri (hold home button or say "Hey Siri")
3. Ask Siri a question
4. Dismiss Siri
5. Check recording state

**Expected:**
- ✅ Recording pauses during Siri
- ✅ Recording resumes after Siri dismissed
- ✅ Session config maintained

**Pass/Fail:** ___

---

### Category 6: Error Handling

#### Test 6.1: Missing Required Parameters

**Objective:** Verify clear error when polarPattern set without dataSourceName

**Steps:**
1. Try invalid config:
   ```typescript
   try {
     await setAudioModeAsync({
       allowsRecording: true,
       ios: {
         polarPattern: 'stereo',
         preferredInput: 'builtInMic'
         // Missing dataSourceName!
       }
     });
   } catch (error) {
     console.log('Error:', error.name, error.message);
   }
   ```

**Expected:**
- ✅ Throws exception
- ✅ Error name: "MissingDataSourceName"
- ✅ Clear error message explaining requirement

**Pass/Fail:** ___

---

#### Test 6.2: Invalid Polar Pattern

**Objective:** Verify clear error for invalid polar pattern

**Steps:**
1. Try invalid pattern:
   ```typescript
   try {
     await setAudioModeAsync({
       allowsRecording: true,
       ios: {
         polarPattern: 'invalid',
         preferredInput: 'builtInMic',
         dataSourceName: 'front'
       }
     });
   } catch (error) {
     console.log('Error:', error.name, error.message);
   }
   ```

**Expected:**
- ✅ Throws exception
- ✅ Error name: "InvalidPolarPattern"
- ✅ Error message mentions "invalid"

**Pass/Fail:** ___

---

#### Test 6.3: Unsupported Polar Pattern on Device

**Objective:** Verify graceful handling when device doesn't support pattern

**Steps:**
1. Try setting pattern device doesn't support
2. Catch error
3. Fallback to supported pattern

**Expected:**
- ✅ Throws "PolarPatternNotSupported" if device lacks capability
- ✅ App can catch and fallback

**Pass/Fail:** ___

---

### Category 7: Integration with expo-audio Features

#### Test 7.1: Recording with Pause/Resume

**Objective:** Verify stereo config works with pause/resume

**Steps:**
1. Configure stereo
2. Start recording
3. Record 5 seconds
4. Pause recording
5. Wait 2 seconds
6. Resume recording
7. Record 5 more seconds
8. Stop recording
9. Analyze: Should have 10 seconds of stereo audio with 2-second gap

**Expected:**
- ✅ Pause/resume works
- ✅ Stereo maintained throughout
- ✅ No quality issues

**Pass/Fail:** ___

---

#### Test 7.2: Multiple Record/Stop Cycles

**Objective:** Verify config persists across multiple recordings

**Steps:**
1. Configure stereo once
2. Record 5 seconds, stop
3. Record 5 seconds, stop
4. Record 5 seconds, stop
5. Analyze all three recordings

**Expected:**
- ✅ All three recordings are stereo
- ✅ No degradation across cycles
- ✅ Config only set once (not per recording)

**Pass/Fail:** ___

---

### Category 8: Cross-Platform Builds

#### Test 8.1: iOS Build

**Objective:** Verify iOS build succeeds

**Steps:**
```bash
cd your-test-app
npm install
npx expo prebuild --clean --platform ios
cd ios
xcodebuild -workspace App.xcworkspace -scheme App -configuration Debug
```

**Expected:**
- ✅ Build succeeds
- ✅ No Swift compilation errors
- ✅ App launches on device/simulator

**Pass/Fail:** ___

---

#### Test 8.2: Android Build

**Objective:** Verify Android build succeeds

**Steps:**
```bash
cd your-test-app
npm install
npx expo prebuild --clean --platform android
cd android
./gradlew assembleDebug
```

**Expected:**
- ✅ Build succeeds
- ✅ No Kotlin compilation errors
- ✅ App launches on device/emulator
- ℹ️ iOS config ignored (no-op)

**Pass/Fail:** ___

---

#### Test 8.3: Web Build

**Objective:** Verify Web build succeeds

**Steps:**
```bash
cd your-test-app
npx expo export:web
```

**Expected:**
- ✅ Build succeeds
- ✅ No TypeScript errors
- ✅ App loads in browser
- ℹ️ iOS config ignored (no-op)

**Pass/Fail:** ___

---

## Validation Checklist

Before considering implementation complete:

### Functional Requirements
- [ ] Polar pattern can be set and persists
- [ ] Input orientation can be set
- [ ] Sample rate hint is applied
- [ ] getAudioSessionState() returns correct values
- [ ] iOS config is properly ignored on Android/Web

### Critical Validations
- [ ] **TRUE STEREO:** L/R channels differ, spatial position captured
- [ ] **AUTO-REAPPLY:** Stereo maintained after headphone plug/unplug
- [ ] **INTERRUPTIONS:** Config persists after phone calls
- [ ] **ERROR HANDLING:** Clear errors for invalid config

### Integration
- [ ] Works with expo-audio recorder
- [ ] Works with pause/resume
- [ ] Works across multiple record cycles
- [ ] No conflicts or race conditions

### Cross-Platform
- [ ] iOS builds and runs with all features
- [ ] Android builds and runs (stubs work)
- [ ] Web builds and runs (stubs work)

### Documentation
- [ ] API documentation complete
- [ ] Examples are runnable
- [ ] Error messages are clear

---

## Stereo Validation: Detailed Procedure

### Equipment Needed
- iPhone with stereo mics
- Computer with audio editor
- Quiet room

### Test Recording Procedure

1. **Device Setup**
   - Place iPhone flat on table
   - Orient in landscape (left edge up)
   - Identify mic locations (usually on bottom edge, left and right)

2. **Record Test Tones**
   ```typescript
   await setAudioModeAsync({
     allowsRecording: true,
     ios: {
       polarPattern: 'stereo',
       preferredInput: 'builtInMic',
       dataSourceName: 'front',
       inputOrientation: 'landscapeLeft',
       preferredSampleRate: 48000
     }
   });
   
   await recorder.record();
   // 0-2s: silence
   // 2-4s: tone/snap near LEFT mic only
   // 4-6s: silence
   // 6-8s: tone/snap near RIGHT mic only
   // 8-10s: silence
   await recorder.stop();
   ```

3. **Transfer Recording**
   - AirDrop file to Mac
   - Or use Xcode → Devices → Download Container

4. **Analyze in Audacity**
   - Import audio file
   - Click track name → "Split Stereo to Mono"
   - You now have two tracks: L and R
   - Zoom to the tone regions

5. **Visual Inspection**
   - Left tone (2-4s): Should be much louder in L channel
   - Right tone (6-8s): Should be much louder in R channel
   - If both tones are identical in both channels → DUAL-MONO (FAIL)

6. **Amplitude Measurement**
   - Select left tone in L channel → Analyze → Contrast → Measure
   - Select left tone in R channel → Analyze → Contrast → Measure
   - Calculate difference: L_amp - R_amp should be > 6dB
   - Repeat for right tone (R_amp - L_amp should be > 6dB)

7. **Pass Criteria**
   - ✅ Visual difference between L/R channels
   - ✅ At least 6dB amplitude difference for spatial tones
   - ✅ Channels are NOT identical

### Example Pass Result

```
Left Tone Analysis:
  L channel: -12.0 dBFS
  R channel: -24.3 dBFS
  Difference: 12.3 dB ✅ (> 6dB)

Right Tone Analysis:
  L channel: -26.1 dBFS
  R channel: -14.5 dBFS
  Difference: 11.6 dB ✅ (> 6dB)

Result: PASS - True stereo separation confirmed
```

### Example Fail Result

```
Left Tone Analysis:
  L channel: -15.0 dBFS
  R channel: -15.0 dBFS
  Difference: 0.0 dB ❌

Right Tone Analysis:
  L channel: -15.0 dBFS
  R channel: -15.0 dBFS
  Difference: 0.0 dB ❌

Result: FAIL - Dual-mono (channels identical)
Cause: Polar pattern not set correctly or not supported
```

---

## Test Report Template

```
EXPO-AUDIOCAKE TEST REPORT
Date: _______________
Tester: _______________
Device: _______________
iOS Version: _______________

RESULTS:
Category 1 (Basic Configuration):      [__/3] Pass
Category 2 (Session State Query):      [__/2] Pass
Category 3 (Stereo Validation):        [__/2] Pass  ⚠️ CRITICAL
Category 4 (Auto-Reapply):             [__/3] Pass  ⚠️ CRITICAL
Category 5 (Interruptions):            [__/2] Pass
Category 6 (Error Handling):           [__/3] Pass
Category 7 (Integration):              [__/2] Pass
Category 8 (Cross-Platform):           [__/3] Pass

TOTAL: [__/20] Pass

CRITICAL TEST STATUS:
  Stereo Validation (3.1):  [ ] PASS  [ ] FAIL
  Auto-Reapply (4.1):       [ ] PASS  [ ] FAIL

OVERALL STATUS: [ ] PASS  [ ] FAIL

NOTES:
_____________________________________________
_____________________________________________
_____________________________________________

APPROVAL:
Implementation is ready for: [ ] Staging  [ ] Production  [ ] Needs Work

Signed: _______________  Date: _______________
```

---

## Automated Testing (Future)

Consider creating automated tests for:

1. **Unit Tests (Swift)**
   - Helper function tests (mapPolarPattern, mapOrientation)
   - Error throwing tests

2. **Integration Tests (TypeScript)**
   - API contract tests
   - Error handling tests

3. **E2E Tests (Detox)**
   - Record/stop flows
   - Route change scenarios

**Note:** Stereo validation must be manual (requires audio analysis).

---

## Questions?

**Q: How can I tell if stereo is working without Audacity?**  
A: Play recording in headphones - spatial position should be obvious if working.

**Q: Test fails on simulator?**  
A: Simulator doesn't have real mics. Must test on physical device.

**Q: How to test auto-reapply?**  
A: Add logging in reapplyAdvancedConfig(), monitor console during route changes.

**Q: Which test is most critical?**  
A: Test 3.1 (True Stereo Recording) - this is the core value of the fork.

---

For bug fixes, see `docs/COMMON_ISSUES.md`.  
For implementation, see `IMPLEMENTATION_PLAN.md`.
