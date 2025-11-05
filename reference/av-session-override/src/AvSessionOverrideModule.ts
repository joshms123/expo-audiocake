import { NativeModule, requireNativeModule } from 'expo';
import { Platform } from 'react-native';
import { Params, State } from './AvSessionOverride.types';

declare class AvSessionOverrideNativeModule extends NativeModule {
  set(params: Params): Promise<void>;
  temporaryOverride(params: Params): Promise<void>;
  setActive(active: boolean): Promise<void>;
  enableAutoReapply(): Promise<void>;
  disableAutoReapply(): Promise<void>;
  getState(): State;
}

// Mock implementation for web platform
const createWebMock = () => ({
  set: async (params: Params): Promise<void> => {
    console.log('[AVSessionOverride Web Mock] set called with:', params);
  },
  temporaryOverride: async (params: Params): Promise<void> => {
    console.log('[AVSessionOverride Web Mock] temporaryOverride called with:', params);
  },
  setActive: async (active: boolean): Promise<void> => {
    console.log('[AVSessionOverride Web Mock] setActive called with:', active);
  },
  enableAutoReapply: async (): Promise<void> => {
    console.log('[AVSessionOverride Web Mock] enableAutoReapply called');
  },
  disableAutoReapply: async (): Promise<void> => {
    console.log('[AVSessionOverride Web Mock] disableAutoReapply called');
  },
  getState: (): State => {
    console.log('[AVSessionOverride Web Mock] getState called');
    return {
      category: 'playback',
      mode: 'default',
      sampleRate: 44100,
      ioBufferDuration: 0.005,
      route: 'Speaker'
    };
  },
});

// This call loads the native module object from the JSI, or uses web mock
const Native = Platform.OS === 'web' 
  ? createWebMock() 
  : requireNativeModule<AvSessionOverrideNativeModule>('AVSessionOverride');

export default {
  set(params: Params): Promise<void> {
    return Native.set(params);
  },
  temporaryOverride(params: Params): Promise<void> {
    return Native.temporaryOverride(params);
  },
  setActive(active: boolean): Promise<void> {
    return Native.setActive(active);
  },
  enableAutoReapply(): Promise<void> {
    return Native.enableAutoReapply();
  },
  disableAutoReapply(): Promise<void> {
    return Native.disableAutoReapply();
  },
  getState(): State {
    return Native.getState();
  },
};
