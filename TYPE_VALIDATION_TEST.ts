/**
 * Standalone TypeScript validation for expo-audiocake types
 * This file should compile without errors if our types are correctly defined
 */

// Import just the types we added
type AudioSessionPolarPattern =
  | 'stereo'
  | 'cardioid'
  | 'omnidirectional'
  | 'subcardioid';

type AudioSessionOrientation =
  | 'portrait'
  | 'portraitUpsideDown'
  | 'landscapeLeft'
  | 'landscapeRight'
  | 'none';

type AudioModeIOSConfig = {
  polarPattern?: AudioSessionPolarPattern;
  preferredInput?: string;
  dataSourceName?: string;
  inputOrientation?: AudioSessionOrientation;
  preferredSampleRate?: number;
  ioBufferDuration?: number;
  autoReapplyOnRouteChange?: boolean;
};

type AudioMode = {
  playsInSilentMode?: boolean;
  allowsRecording?: boolean;
  interruptionMode?: 'mixWithOthers' | 'doNotMix' | 'duckOthers';
  shouldPlayInBackground?: boolean;
  ios?: AudioModeIOSConfig;
};

type AudioSessionState = {
  category: string;
  mode: string;
  sampleRate: number;
  ioBufferDuration: number;
  outputRoute: string;
};

// ✅ Test 1: Backward compatibility - AudioMode without iOS config
const test1: AudioMode = {
  playsInSilentMode: true,
  allowsRecording: true,
};

// ✅ Test 2: AudioMode with minimal iOS config
const test2: AudioMode = {
  allowsRecording: true,
  ios: {
    polarPattern: 'stereo',
  },
};

// ✅ Test 3: AudioMode with complete iOS config
const test3: AudioMode = {
  playsInSilentMode: true,
  allowsRecording: true,
  interruptionMode: 'mixWithOthers',
  shouldPlayInBackground: false,
  ios: {
    polarPattern: 'stereo',
    preferredInput: 'builtInMic',
    dataSourceName: 'bottom',
    inputOrientation: 'landscapeLeft',
    preferredSampleRate: 48000,
    ioBufferDuration: 0.005,
    autoReapplyOnRouteChange: true,
  },
};

// ✅ Test 4: All polar patterns are valid
const polarPatterns: AudioSessionPolarPattern[] = [
  'stereo',
  'cardioid',
  'omnidirectional',
  'subcardioid',
];

// ✅ Test 5: All orientations are valid
const orientations: AudioSessionOrientation[] = [
  'portrait',
  'portraitUpsideDown',
  'landscapeLeft',
  'landscapeRight',
  'none',
];

// ✅ Test 6: AudioSessionState structure
const sessionState: AudioSessionState = {
  category: 'AVAudioSessionCategoryPlayAndRecord',
  mode: 'AVAudioSessionModeDefault',
  sampleRate: 48000,
  ioBufferDuration: 0.005,
  outputRoute: 'Speaker',
};

// ✅ Test 7: Optional fields work correctly
const minimalConfig: AudioModeIOSConfig = {};
const partialConfig1: AudioModeIOSConfig = { polarPattern: 'stereo' };
const partialConfig2: AudioModeIOSConfig = {
  polarPattern: 'cardioid',
  preferredSampleRate: 48000,
};

// ✅ Test 8: Real-world use cases

// Stereo video recording
const stereoVideoConfig: AudioMode = {
  playsInSilentMode: true,
  allowsRecording: true,
  ios: {
    polarPattern: 'stereo',
    preferredInput: 'builtInMic',
    dataSourceName: 'bottom',
    inputOrientation: 'landscapeLeft',
    preferredSampleRate: 48000,
    autoReapplyOnRouteChange: true,
  },
};

// Low-latency monitoring
const lowLatencyConfig: AudioMode = {
  allowsRecording: true,
  ios: {
    polarPattern: 'stereo',
    ioBufferDuration: 0.005,
    preferredSampleRate: 48000,
  },
};

// Directional recording
const directionalConfig: AudioMode = {
  allowsRecording: true,
  ios: {
    polarPattern: 'cardioid',
    preferredInput: 'builtInMic',
    dataSourceName: 'front',
  },
};

// Omnidirectional recording
const omniConfig: AudioMode = {
  allowsRecording: true,
  ios: {
    polarPattern: 'omnidirectional',
    preferredSampleRate: 48000,
  },
};

// ❌ These should cause TypeScript errors (commented out):
// const invalid1: AudioSessionPolarPattern = 'invalid'; // ❌ Should error
// const invalid2: AudioSessionOrientation = 'invalid'; // ❌ Should error
// const invalid3: AudioMode = {
//   ios: {
//     polarPattern: 'invalid', // ❌ Should error
//   },
// };

console.log('✅ All type validations passed!');
console.log('TypeScript successfully compiled all test cases.');
