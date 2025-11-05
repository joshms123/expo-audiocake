export type Params = {
  category: string;              // e.g., "playAndRecord"
  options?: string[];            // e.g., ["defaultToSpeaker","allowBluetoothA2DP"]
  mode?: string;                 // e.g., "voiceChat"
  active?: boolean;              // default true
  sampleRate?: number;           // e.g., 48000
  ioBufferDuration?: number;     // seconds, e.g., 0.005
  inputOrientation?:
    | 'front'
    | 'back'
    | 'left'
    | 'right'
    | 'top'
    | 'bottom';                  // e.g., 'front'
  preferredInput?: 'builtInMic'; // Set built-in microphone as preferred input
  dataSourceName?: 'front' | 'back'; // Select front or back data source
  polarPattern?: 'stereo';       // Set polar pattern to stereo
};

export type State = {
  category: string;
  mode: string;
  sampleRate: number;
  ioBufferDuration: number;
  route: string;
};
