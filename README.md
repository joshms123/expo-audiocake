# expo-audiocake 🎂

> A fork of expo-audio with advanced iOS AVAudioSession control, including stereo recording with polar patterns, input orientation, and auto-reapply on route changes.

[![CI](https://github.com/joshms123/expo-audiocake/actions/workflows/ci.yml/badge.svg)](https://github.com/joshms123/expo-audiocake/actions/workflows/ci.yml)
[![npm package](https://img.shields.io/badge/npm-@joshms123%2Fexpo--audiocake-blue)](https://github.com/joshms123/expo-audiocake/packages)

## 🚀 Quick Start

```bash
# Install directly from GitHub (no authentication needed)
npm install joshms123/expo-audiocake#main

# Or install from GitHub Packages (requires authentication)
npm install @joshms123/expo-audiocake

# Prebuild for iOS
npx expo prebuild --platform ios --clean
```

📦 **See [INSTALLATION.md](INSTALLATION.md) for detailed installation options and troubleshooting.**

## Why This Exists

The official `expo-audio` package provides basic audio recording and playback, but lacks fine-grained control over iOS's AVAudioSession. This limits applications that need:

- **True stereo recording** with polar pattern configuration (not just dual-mono)
- **Input orientation** control for proper stereo field alignment
- **Preferred input/data source** selection (front vs back microphones)
- **Auto-reapply** session configuration after route changes (headphone plug/unplug)
- **Session state queries** for debugging and conditional logic

This fork integrates those advanced capabilities directly into expo-audio, eliminating conflicts and providing a unified API.

## What's Different from expo-audio

### New Features

1. **Polar Pattern Configuration**
   - Set `.stereo`, `.cardioid`, `.omnidirectional`, etc.
   - Enables true L/R stereo recording on iOS devices

2. **Input Orientation**
   - Configure stereo field orientation (portrait, landscape)
   - Ensures proper L/R channel mapping

3. **Preferred Input Selection**
   - Select specific microphones (built-in, external, etc.)
   - Choose data sources (front, back microphones)

4. **Auto-Reapply on Route Changes**
   - Automatically reconfigure session when audio route changes
   - Maintains polar pattern and advanced settings after headphone plug/unplug

5. **Session State Query**
   - New `getAudioSessionState()` function
   - Returns current category, mode, sample rate, output route

### API Extensions

```typescript
// Standard expo-audio
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true
});

// expo-audiocake with iOS advanced config
await setAudioModeAsync({
  allowsRecording: true,
  playsInSilentMode: true,
  ios: {
    polarPattern: 'stereo',              // NEW: True stereo recording
    preferredInput: 'builtInMic',        // NEW: Select microphone
    dataSourceName: 'front',             // NEW: Choose data source
    inputOrientation: 'landscapeLeft',   // NEW: Stereo field orientation
    preferredSampleRate: 48000,          // NEW: Sample rate hint
    ioBufferDuration: 0.005,             // NEW: Buffer duration
    autoReapplyOnRouteChange: true       // NEW: Auto-reapply config
  }
});

// NEW: Query session state
const state = getAudioSessionState();
console.log(state.category, state.sampleRate, state.outputRoute);
```

## Project Status

⚠️ **THIS PROJECT IS IN PLANNING PHASE**

- ✅ Architecture designed
- ✅ API specified
- ✅ Reference implementation provided
- ✅ Test plan documented
- ⏳ **Implementation needed** (see IMPLEMENTATION_PLAN.md)
- ⏳ Testing needed
- ⏳ Production validation needed

## For Developers: Getting Started

If you're a developer tasked with implementing this fork:

1. **Read the documentation** (in order):
   - `IMPLEMENTATION_PLAN.md` - Your main guide (step-by-step tasks)
   - `ARCHITECTURE.md` - Understand design decisions
   - `API_DESIGN.md` - TypeScript API you'll implement
   - `REFERENCE_IMPLEMENTATION.md` - Learn from existing code

2. **Set up development environment**:
   - Follow `DEVELOPMENT_SETUP.md`

3. **Start implementing**:
   - Work through phases in `IMPLEMENTATION_PLAN.md`
   - Refer to `reference/av-session-override/` for iOS code examples
   - Check `examples/` for usage patterns

4. **Test thoroughly**:
   - Follow `TESTING_PLAN.md`
   - Validate stereo recording (critical!)

5. **Maintain the fork**:
   - See `MAINTENANCE.md` for upstream merge strategy

## Reference Implementation

The `reference/av-session-override/` directory contains a working Expo module that demonstrates:

- How to configure polar patterns in Swift
- How to select preferred input and data sources
- How to auto-reapply session config on route changes
- How to query current session state

**This is your primary reference for iOS implementation.**

## Documentation

| Document | Purpose |
|----------|---------|
| `README.md` | This file - project overview |
| `IMPLEMENTATION_PLAN.md` | Step-by-step implementation guide with tasks |
| `ARCHITECTURE.md` | Technical architecture and design decisions |
| `API_DESIGN.md` | Complete TypeScript API specification |
| `REFERENCE_IMPLEMENTATION.md` | Guide to av-session-override reference code |
| `SAMPLE_USAGE.md` | Example code for end users |
| `DEVELOPMENT_SETUP.md` | Development environment setup |
| `TESTING_PLAN.md` | Test cases and validation procedures |
| `MAINTENANCE.md` | Ongoing fork maintenance strategy |
| `docs/IOS_AUDIO_SESSION.md` | iOS AVAudioSession primer |
| `docs/STEREO_RECORDING.md` | How stereo recording works on iOS |
| `docs/COMMON_ISSUES.md` | Known issues and solutions |

## Target Platforms

- **iOS:** Full support (primary focus)
- **Android:** Stubs (no advanced session control needed)
- **Web:** Stubs (no advanced session control available)

## License

Same as expo-audio (MIT License)

## Credits

- Based on [expo-audio](https://github.com/expo/expo/tree/main/packages/expo-audio)
- Reference implementation from av-session-override package
- Developed to solve real-world stereo recording requirements

## Questions?

See `COMMON_ISSUES.md` or open an issue.

---

**Ready to implement?** Start with `IMPLEMENTATION_PLAN.md` 🚀
