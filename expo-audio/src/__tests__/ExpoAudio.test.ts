/**
 * Tests for expo-audiocake module exports and API surface
 * These tests verify the module structure without requiring native execution
 */

import * as ExpoAudio from '../ExpoAudio';
import type { AudioSessionState } from '../Audio.types';

// Mock the native module
jest.mock('../AudioModule', () => ({
  default: {
    setAudioModeAsync: jest.fn(),
    setIsAudioActiveAsync: jest.fn(),
    getAudioSessionState: jest.fn(() => null),
  },
}));

describe('ExpoAudio Module', () => {
  describe('Module Exports', () => {
    it('should export setAudioModeAsync function', () => {
      expect(typeof ExpoAudio.setAudioModeAsync).toBe('function');
    });

    it('should export setIsAudioActiveAsync function', () => {
      expect(typeof ExpoAudio.setIsAudioActiveAsync).toBe('function');
    });

    it('should export getAudioSessionState function', () => {
      expect(typeof ExpoAudio.getAudioSessionState).toBe('function');
    });
  });

  describe('getAudioSessionState', () => {
    it('should be callable and return null when not on iOS', () => {
      const result = ExpoAudio.getAudioSessionState();
      expect(result).toBeNull();
    });

    it('should have correct return type', () => {
      const result = ExpoAudio.getAudioSessionState();
      // TypeScript should accept this as AudioSessionState | null
      const typed: AudioSessionState | null = result;
      expect(typed).toBeNull();
    });
  });

  describe('setAudioModeAsync', () => {
    it('should accept mode without iOS config', async () => {
      await expect(
        ExpoAudio.setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
        })
      ).resolves.not.toThrow();
    });

    it('should accept mode with iOS config', async () => {
      await expect(
        ExpoAudio.setAudioModeAsync({
          playsInSilentMode: true,
          allowsRecording: true,
          ios: {
            polarPattern: 'stereo',
            inputOrientation: 'landscapeLeft',
            preferredSampleRate: 48000,
          },
        })
      ).resolves.not.toThrow();
    });

    it('should accept empty mode object', async () => {
      await expect(
        ExpoAudio.setAudioModeAsync({})
      ).resolves.not.toThrow();
    });
  });
});

describe('Type Exports', () => {
  it('should allow importing types', () => {
    // These imports should not cause TypeScript errors
    const testImports = () => {
      const _: {
        AudioMode: typeof import('../Audio.types').AudioMode;
        AudioModeIOSConfig: typeof import('../Audio.types').AudioModeIOSConfig;
        AudioSessionPolarPattern: typeof import('../Audio.types').AudioSessionPolarPattern;
        AudioSessionOrientation: typeof import('../Audio.types').AudioSessionOrientation;
        AudioSessionState: typeof import('../Audio.types').AudioSessionState;
      };
    };
    
    expect(testImports).not.toThrow();
  });
});

describe('API Contract', () => {
  it('should maintain backward compatibility', async () => {
    // Old API usage (without iOS config) should still work
    await expect(
      ExpoAudio.setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        interruptionMode: 'mixWithOthers',
        shouldPlayInBackground: false,
      })
    ).resolves.not.toThrow();
  });

  it('should support new iOS features', async () => {
    // New API usage (with iOS config) should work
    await expect(
      ExpoAudio.setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
        ios: {
          polarPattern: 'stereo',
          preferredInput: 'builtInMic',
          dataSourceName: 'bottom',
          inputOrientation: 'landscapeLeft',
          preferredSampleRate: 48000,
          ioBufferDuration: 0.005,
          autoReapplyOnRouteChange: true,
        },
      })
    ).resolves.not.toThrow();
  });

  it('should support partial iOS config', async () => {
    // Partial iOS config should work (all fields optional)
    await expect(
      ExpoAudio.setAudioModeAsync({
        allowsRecording: true,
        ios: {
          polarPattern: 'stereo',
        },
      })
    ).resolves.not.toThrow();
  });
});
