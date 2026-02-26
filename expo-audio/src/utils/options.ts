import { Platform } from 'expo-modules-core';

import { RecordingOptions } from '../Audio.types';

export function createRecordingOptions(options: RecordingOptions): Partial<RecordingOptions> {
  let commonOptions: Record<string, unknown> = {
    extension: options.extension,
    sampleRate: options.sampleRate,
    numberOfChannels: options.numberOfChannels,
    bitRate: options.bitRate,
    isMeteringEnabled: options.isMeteringEnabled ?? false,
  };

  if (Platform.OS === 'ios') {
    commonOptions = {
      ...commonOptions,
      ...options.ios,
    };
  } else if (Platform.OS === 'android') {
    commonOptions = {
      ...commonOptions,
      ...options.android,
    };
  } else if (Platform.OS === 'web') {
    commonOptions = {
      ...commonOptions,
      ...options.web,
    };
  }
  return commonOptions as Partial<RecordingOptions>;
}
