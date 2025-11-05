/**
 * Type-level tests for expo-audiocake iOS audio session extensions
 * These tests verify TypeScript type definitions without requiring device execution
 */

import type {
  AudioMode,
  AudioModeIOSConfig,
  AudioSessionPolarPattern,
  AudioSessionOrientation,
  AudioSessionState,
} from '../Audio.types';

describe('Audio Types', () => {
  describe('AudioSessionPolarPattern', () => {
    it('should accept valid polar pattern values', () => {
      const patterns: AudioSessionPolarPattern[] = [
        'stereo',
        'cardioid',
        'omnidirectional',
        'subcardioid',
      ];
      expect(patterns).toHaveLength(4);
    });
  });

  describe('AudioSessionOrientation', () => {
    it('should accept valid orientation values', () => {
      const orientations: AudioSessionOrientation[] = [
        'portrait',
        'portraitUpsideDown',
        'landscapeLeft',
        'landscapeRight',
        'none',
      ];
      expect(orientations).toHaveLength(5);
    });
  });

  describe('AudioModeIOSConfig', () => {
    it('should accept minimal iOS config', () => {
      const config: AudioModeIOSConfig = {
        polarPattern: 'stereo',
      };
      expect(config.polarPattern).toBe('stereo');
    });

    it('should accept complete iOS config', () => {
      const config: AudioModeIOSConfig = {
        polarPattern: 'stereo',
        preferredInput: 'builtInMic',
        dataSourceName: 'bottom',
        inputOrientation: 'landscapeLeft',
        preferredSampleRate: 48000,
        ioBufferDuration: 0.005,
        autoReapplyOnRouteChange: true,
      };
      expect(config.polarPattern).toBe('stereo');
      expect(config.preferredSampleRate).toBe(48000);
      expect(config.autoReapplyOnRouteChange).toBe(true);
    });

    it('should accept empty iOS config', () => {
      const config: AudioModeIOSConfig = {};
      expect(config).toBeDefined();
    });
  });

  describe('AudioMode', () => {
    it('should accept AudioMode without iOS config (backward compatible)', () => {
      const mode: AudioMode = {
        playsInSilentMode: true,
        allowsRecording: true,
      };
      expect(mode.playsInSilentMode).toBe(true);
      expect(mode.allowsRecording).toBe(true);
      expect(mode.ios).toBeUndefined();
    });

    it('should accept AudioMode with iOS config', () => {
      const mode: AudioMode = {
        playsInSilentMode: true,
        allowsRecording: true,
        ios: {
          polarPattern: 'stereo',
          inputOrientation: 'landscapeLeft',
          preferredSampleRate: 48000,
        },
      };
      expect(mode.ios?.polarPattern).toBe('stereo');
      expect(mode.ios?.inputOrientation).toBe('landscapeLeft');
      expect(mode.ios?.preferredSampleRate).toBe(48000);
    });

    it('should accept AudioMode with minimal config', () => {
      const mode: AudioMode = {};
      expect(mode).toBeDefined();
    });
  });

  describe('AudioSessionState', () => {
    it('should have correct structure', () => {
      const state: AudioSessionState = {
        category: 'AVAudioSessionCategoryPlayAndRecord',
        mode: 'AVAudioSessionModeDefault',
        sampleRate: 48000,
        ioBufferDuration: 0.005,
        outputRoute: 'Speaker',
      };
      expect(state.category).toBe('AVAudioSessionCategoryPlayAndRecord');
      expect(state.sampleRate).toBe(48000);
      expect(state.outputRoute).toBe('Speaker');
    });
  });
});

// Real-world usage examples as tests
describe('Real-World Usage Examples', () => {
  it('should support stereo video recording config', () => {
    const mode: AudioMode = {
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
    
    expect(mode.ios?.polarPattern).toBe('stereo');
    expect(mode.ios?.inputOrientation).toBe('landscapeLeft');
  });

  it('should support low-latency monitoring config', () => {
    const mode: AudioMode = {
      allowsRecording: true,
      ios: {
        polarPattern: 'stereo',
        ioBufferDuration: 0.005, // 5ms
        preferredSampleRate: 48000,
      },
    };
    
    expect(mode.ios?.ioBufferDuration).toBe(0.005);
    expect(mode.ios?.preferredSampleRate).toBe(48000);
  });

  it('should support directional recording config', () => {
    const mode: AudioMode = {
      allowsRecording: true,
      ios: {
        polarPattern: 'cardioid',
        preferredInput: 'builtInMic',
        dataSourceName: 'front',
      },
    };
    
    expect(mode.ios?.polarPattern).toBe('cardioid');
    expect(mode.ios?.dataSourceName).toBe('front');
  });
});
