import { AudioQuality, IOSOutputFormat } from './RecordingConstants';

/**
 * Minimal information about an audio source, used for preload tracking and display.
 */
export type AudioSourceInfo = {
  /** URI of the audio resource. */
  uri?: string;
  /** Human-readable display name for the audio source. */
  name?: string;
};

// @docsMissing
export type AudioSource =
  | string
  | number
  | null
  | {
      /**
       * A string representing the resource identifier for the audio,
       * which could be an HTTPS address, a local file path, or the name of a static audio file resource.
       */
      uri?: string;
      /**
       * The asset ID of a local audio asset, acquired with the `require` function.
       * This property is exclusive with the `uri` property. When both are present, the `assetId` will be ignored.
       */
      assetId?: number;
      /**
       * An object representing the HTTP headers to send along with the request for a remote audio source.
       * On web requires the `Access-Control-Allow-Origin` header returned by the server to include the current domain.
       */
      headers?: Record<string, string>;
      /**
       * Optional human-readable display name for the audio source.
       * Useful for lock screen metadata and playlist displays.
       */
      name?: string;
    };

/**
 * Options for configuring audio player behavior.
 */
export type AudioPlayerOptions = {
  /**
   * How often (in milliseconds) to emit playback status updates. Defaults to 500ms.
   *
   * @example
   * ```tsx
   * import { useAudioPlayer } from 'expo-audio';
   *
   * export default function App() {
   *   const player = useAudioPlayer(source);
   *
   *   // High-frequency updates for smooth progress bars
   *   const player = useAudioPlayer(source, { updateInterval: 100 });
   *
   *   // Standard updates (default behavior)
   *   const player = useAudioPlayer(source, { updateInterval: 500 });
   *
   *   // Low-frequency updates for better performance
   *   const player = useAudioPlayer(source, { updateInterval: 1000 });
   * }
   * ```
   *
   * @default 500ms
   *
   * @platform ios
   * @platform android
   * @platform web
   */
  updateInterval?: number;
  /**
   * If set to `true`, the system will attempt to download the resource to the device before loading.
   * This value defaults to `false`.
   *
   * Works with:
   * - Local assets from `require('path/to/file')`
   * - Remote HTTP/HTTPS URLs
   * - Asset objects
   *
   * When enabled, this ensures the audio file is fully downloaded before playback begins.
   * This can improve playback performance and reduce buffering, especially for users
   * managing multiple audio players simultaneously.
   *
   * On Android and iOS, this will download the audio file to the device's tmp directory before playback begins.
   * The system will purge the file at its discretion.
   *
   * On web, this will download the audio file to the user's device memory and make it available for the user to play.
   * The system will usually purge the file from memory after a reload or on memory pressure.
   * On web, CORS restrictions apply to the blob url, so you need to make sure the server returns the `Access-Control-Allow-Origin` header.
   *
   * @platform ios
   * @platform web
   * @platform android
   */
  downloadFirst?: boolean;
  /**
   * Determines the [cross origin policy](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/crossorigin) used by the underlying native view on web.
   * If `undefined` (default), does not use CORS at all. If set to `'anonymous'`, the audio will be loaded with CORS enabled.
   * Note that some audio may not play if CORS is enabled, depending on the CDN settings.
   * If you encounter issues, consider adjusting the `crossOrigin` property.
   *
   *
   * @platform web
   * @default undefined
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
  /**
   * If set to `true`, the audio session will not be deactivated when this player pauses or finishes playback.
   * This prevents interrupting other audio sources (like videos) when the audio ends.
   *
   * Useful for sound effects that should not interfere with ongoing video playback or other audio.
   * The audio session for this player will not be deactivated automatically when the player finishes playback.
   *
   * > **Note:** If needed, you can manually deactivate the audio session using `setIsAudioActiveAsync(false)`.
   *
   * @platform ios
   * @default false
   */
  keepAudioSessionActive?: boolean;
  /**
   * The preferred number of seconds to pre-buffer from the network ahead of the playback head.
   * A value of `0` uses the system default. This only affects network-sourced assets.
   *
   * @default 0
   * @platform ios
   * @platform android
   */
  preferredForwardBufferDuration?: number;
};

/**
 * Options for pre-buffering an audio source before creating a player.
 */
export type PreloadOptions = {
  /**
   * The number of seconds to pre-buffer ahead of the playback head.
   * @default 10
   */
  preferredForwardBufferDuration?: number;
};

/**
 * @deprecated Use `AudioPlayerOptions` instead.
 * Options for audio loading behavior.
 */
export type AudioLoadOptions = AudioPlayerOptions;

/**
 * Represents an available audio input device for recording.
 *
 * This type describes audio input sources like built-in microphones, external microphones,
 * or other audio input devices that can be used for recording. Each input has an identifying
 * information that can be used to select the preferred recording source.
 */
export type RecordingInput = {
  /** Human-readable name of the audio input device. */
  name: string;
  /** Type or category of the input device (for example, 'Built-in Microphone', 'External Microphone'). */
  type: string;
  /** Unique identifier for the input device, used to select the input ('Built-in Microphone', 'External Microphone') for recording. */
  uid: string;
};

/**
 * Pitch correction quality settings for audio playback rate changes.
 *
 * When changing playback rate, pitch correction can be applied to maintain the original pitch.
 * Different quality levels offer trade-offs between processing power and audio quality.
 *
 * @platform ios
 */
export type PitchCorrectionQuality = 'low' | 'medium' | 'high';

/**
 * Comprehensive status information for an `AudioPlayer`.
 *
 * This object contains all the current state information about audio playback,
 * including playback position, duration, loading state, and playback settings.
 * Used by `useAudioPlayerStatus()` to provide real-time status updates.
 */
export type AudioStatus = {
  /** Unique identifier for the player instance. */
  id: string;
  /** Current playback position in seconds. */
  currentTime: number;
  /** String representation of the player's internal playback state. */
  playbackState: string;
  /** String representation of the player's time control status (playing/paused/waiting). */
  timeControlStatus: string;
  /** Reason why the player is waiting to play (if applicable). */
  reasonForWaitingToPlay: string;
  /** Whether the player is currently muted. */
  mute: boolean;
  /** Total duration of the audio in seconds, or 0 if not yet determined. */
  duration: number;
  /** Whether the audio is currently playing. */
  playing: boolean;
  /** Whether the audio is set to loop when it reaches the end. */
  loop: boolean;
  /** Whether the audio just finished playing. */
  didJustFinish: boolean;
  /** Whether the player is currently buffering data. */
  isBuffering: boolean;
  /** Whether the audio has finished loading and is ready to play. */
  isLoaded: boolean;
  /** Current playback rate (1.0 = normal speed). */
  playbackRate: number;
  /**
   * Whether pitch correction is enabled for rate changes.
   * @default true
   */
  shouldCorrectPitch: boolean;
  /**
   * Whether the media services have been reset (iOS only).
   * Indicates the audio subsystem was restarted by the OS.
   *
   * @platform ios
   */
  mediaServicesDidReset?: boolean;
};

/**
 * Status information for recording operations from the event system.
 *
 * This type represents the status data emitted by `recordingStatusUpdate` events.
 * It contains high-level information about the recording session and any errors.
 * Used internally by the event system. Most users should use `useAudioRecorderState()` instead.
 */
export type RecordingStatus = {
  /** Unique identifier for the recording session. */
  id: string;
  /** Whether the recording has finished (stopped). */
  isFinished: boolean;
  /** Whether an error occurred during recording. */
  hasError: boolean;
  /** Error message if an error occurred, `null` otherwise. */
  error: string | null;
  /** File URL of the completed recording, if available. */
  url: string | null;
  /**
   * Whether the media services have been reset (iOS only).
   * Indicates the audio subsystem was restarted by the OS.
   *
   * @platform ios
   */
  mediaServicesDidReset?: boolean;
};

/**
 * Current state information for an `AudioRecorder`.
 *
 * This object contains detailed information about the recorder's current state,
 * including recording status, duration, and technical details. This is what you get
 * when calling `recorder.getStatus()` or using `useAudioRecorderState()`.
 */
export type RecorderState = {
  /** Whether the recorder is ready and able to record. */
  canRecord: boolean;
  /** Whether recording is currently in progress. */
  isRecording: boolean;
  /** Duration of the current recording in milliseconds. */
  durationMillis: number;
  /** Whether the media services have been reset (typically indicates a system interruption). */
  mediaServicesDidReset: boolean;
  /** Current audio level/volume being recorded (if metering is enabled). */
  metering?: number;
  /** File URL where the recording will be saved, if available. */
  url: string | null;
};

/**
 * Audio output format options for Android recording.
 *
 * Specifies the container format for recorded audio files on Android.
 * Different formats have different compatibility and compression characteristics.
 *
 * @platform android
 */
export type AndroidOutputFormat =
  | 'default'
  | '3gp'
  | 'mpeg4'
  | 'amrnb'
  | 'amrwb'
  | 'aac_adts'
  | 'mpeg2ts'
  | 'webm';

/**
 * Audio encoder options for Android recording.
 *
 * Specifies the audio codec used to encode recorded audio on Android.
 * Different encoders offer different quality, compression, and compatibility trade-offs.
 *
 * @platform android
 */
export type AndroidAudioEncoder = 'default' | 'amr_nb' | 'amr_wb' | 'aac' | 'he_aac' | 'aac_eld';

/**
 * Bit rate strategies for audio encoding.
 *
 * Determines how the encoder manages bit rate during recording, affecting
 * file size consistency and quality characteristics.
 */
export type BitRateStrategy = 'constant' | 'longTermAverage' | 'variableConstrained' | 'variable';

/**
 * Options for controlling how audio recording is started.
 */
export type RecordingStartOptions = {
  /**
   * The duration in seconds after which recording should automatically stop.
   * If not provided, recording continues until manually stopped.
   *
   * @platform ios
   * @platform android
   * @platform web
   */
  forDuration?: number;
  /**
   * The time in seconds to wait before starting the recording.
   * If not provided, recording starts immediately.
   *
   * **Platform behavior:**
   * - Android: Ignored, recording starts immediately
   * - iOS: Uses native AVAudioRecorder.record(atTime:) for precise timing.
   * - Web: Ignored, recording starts immediately
   *
   * > **warning** On iOS, the recording process starts immediately (you'll see status updates),
   * but actual audio capture begins after the specified delay. This is not a countdown, since
   * the recorder is active but silent during the delay period.
   *
   * @platform ios
   */
  atTime?: number;
};

export type RecordingOptions = {
  /**
   * A boolean that determines whether audio level information will be part of the status object under the "metering" key.
   */
  isMeteringEnabled?: boolean;
  /**
   * The desired file extension.
   *
   * @example .caf
   */
  extension: string;
  /**
   * The desired sample rate.
   *
   * @example 44100
   */
  sampleRate: number;
  /**
   * The desired number of channels.
   *
   * @example 2
   */
  numberOfChannels: number;
  /**
   * The desired bit rate.
   *
   * @example 128000
   */
  bitRate: number;
  /**
   * Recording options for the Android platform.
   * @platform android
   */
  android: RecordingOptionsAndroid;
  /**
   * Recording options for the iOS platform.
   * @platform ios
   */
  ios: RecordingOptionsIos;
  /**
   * Recording options for the Web platform.
   * @platform web
   */
  web: RecordingOptionsWeb;
};

/**
 * Recording options for the web.
 *
 * Web recording uses the `MediaRecorder` API, which has different capabilities
 * compared to native platforms. These options map directly to `MediaRecorder` settings.
 *
 * @platform web
 */
export type RecordingOptionsWeb = {
  /** MIME type for the recording (for example, 'audio/webm', 'audio/mp4'). */
  mimeType?: string;
  /** Target bits per second for the recording. */
  bitsPerSecond?: number;
};

/**
 * Recording configuration options specific to iOS.
 *
 * iOS recording uses `AVAudioRecorder` with extensive format and quality options.
 * These settings provide fine-grained control over the recording characteristics.
 *
 * @platform ios
 */
export type RecordingOptionsIos = {
  /**
   * The desired file extension.
   *
   * @example .caf
   */
  extension?: string;
  /**
   * The desired sample rate.
   *
   * @example 44100
   */
  sampleRate?: number;
  /**
   * The desired file format. See the [`IOSOutputFormat`](#iosoutputformat) enum for all valid values.
   */
  outputFormat?: string | IOSOutputFormat | number;
  /**
   * The desired audio quality. See the [`AudioQuality`](#audioquality) enum for all valid values.
   */
  audioQuality: AudioQuality | number;
  /**
   * The desired bit rate strategy. See the next section for an enumeration of all valid values of `bitRateStrategy`.
   */
  bitRateStrategy?: number;
  /**
   * The desired bit depth hint.
   *
   * @example 16
   */
  bitDepthHint?: number;
  /**
   * The desired PCM bit depth.
   *
   * @example 16
   */
  linearPCMBitDepth?: number;
  /**
   * A boolean describing if the PCM data should be formatted in big endian.
   */
  linearPCMIsBigEndian?: boolean;
  /**
   * A boolean describing if the PCM data should be encoded in floating point or integral values.
   */
  linearPCMIsFloat?: boolean;
};

/**
 * Recording configuration options specific to Android.
 *
 * Android recording uses `MediaRecorder` with options for format, encoder, and file constraints.
 * These settings control the output format and quality characteristics.
 *
 * @platform android
 */
export type RecordingOptionsAndroid = {
  /**
   * The desired file extension.
   *
   * @example .caf
   */
  extension?: string;
  /**
   * The desired sample rate.
   *
   * @example 44100
   */
  sampleRate?: number;
  /**
   * The desired file format. See the [`AndroidOutputFormat`](#androidoutputformat) enum for all valid values.
   */
  outputFormat: AndroidOutputFormat;
  /**
   * The desired audio encoder. See the [`AndroidAudioEncoder`](#androidaudioencoder) enum for all valid values.
   */
  audioEncoder: AndroidAudioEncoder;
  /**
   * The desired maximum file size in bytes, after which the recording will stop (but `stopAndUnloadAsync()` must still
   * be called after this point).
   *
   * @example
   * `65536`
   */
  maxFileSize?: number;
  /**
   * The desired audio Source. See the [`AndroidAudioSource`](#androidaudiosource) enum for all valid values.
   */
  audioSource?: RecordingSource;
};

/**
 * iOS-specific advanced audio session configuration.
 * 
 * Provides fine-grained control over iOS AVAudioSession for advanced audio features
 * like true stereo recording, input selection, and session state management.
 *
 * @platform ios
 */
export type AudioModeIOSConfig = {
  /**
   * Configure polar pattern for stereo/directional recording.
   * Requires `preferredInput` and `dataSourceName` to be set.
   * This enables true stereo recording (not just dual-mono).
   *
   * @example
   * ```tsx
   * ios: {
   *   polarPattern: 'stereo',
   *   preferredInput: 'builtInMic',
   *   dataSourceName: 'bottom'
   * }
   * ```
   */
  polarPattern?: AudioSessionPolarPattern;

  /**
   * Select preferred audio input device (e.g., 'builtInMic').
   * Currently only 'builtInMic' is supported.
   *
   * @example 'builtInMic'
   */
  preferredInput?: string;

  /**
   * Select data source name (e.g., 'front', 'back', 'bottom').
   * Used with `polarPattern` for stereo recording.
   * The available data sources depend on the device hardware.
   *
   * @example 'bottom'
   */
  dataSourceName?: string;

  /**
   * Set input orientation for stereo field alignment.
   * Ensures proper left/right channel mapping based on device orientation.
   *
   * @example 'landscapeLeft'
   */
  inputOrientation?: AudioSessionOrientation;

  /**
   * Preferred sample rate in Hz (e.g., 48000).
   * The system may use a different rate; this is a hint to iOS.
   *
   * @example 48000
   */
  preferredSampleRate?: number;

  /**
   * IO buffer duration in seconds (e.g., 0.005).
   * Smaller values reduce latency but increase CPU usage.
   *
   * @example 0.005
   */
  ioBufferDuration?: number;

  /**
   * Enable auto-reapply of session config on route changes.
   * When enabled, the advanced configuration will be automatically
   * reapplied when audio routes change (e.g., headphones plug/unplug).
   *
   * @default true
   */
  autoReapplyOnRouteChange?: boolean;

  /**
   * Audio session mode - controls audio routing and processing behavior.
   *
   * - 'default': Standard audio processing
   * - 'voiceChat': Optimized for voice, routes to speaker by default
   * - 'videoRecording': Optimized for video recording with audio
   * - 'measurement': Minimal processing for accurate audio measurement
   * - 'moviePlayback': Optimized for movie/video playback
   * - 'spokenAudio': Optimized for spoken content (podcasts, audiobooks)
   * - 'gameChat': Optimized for game voice chat
   *
   * @default 'default'
   * @platform ios
   */
  mode?: 'default' | 'voiceChat' | 'videoRecording' | 'measurement' | 'moviePlayback' | 'spokenAudio' | 'gameChat';

  /**
   * Force audio to route through speaker instead of earpiece.
   * Only applies when allowsRecording is true (playAndRecord category).
   *
   * When true, audio will play through:
   * - Speaker (when no accessories connected)
   * - Headphones (when plugged in)
   * - Bluetooth speaker/headphones (when connected)
   *
   * When false, audio routes to earpiece by default (phone call style).
   *
   * @default false
   * @platform ios
   */
  defaultToSpeaker?: boolean;

  /**
   * Allow audio to route to Bluetooth A2DP devices (high-quality stereo).
   * Useful for stereo recording or high-quality playback over Bluetooth.
   *
   * @default false
   * @platform ios
   */
  allowBluetoothA2DP?: boolean;
};

export type AudioMode = {
  /**
   * Determines if audio playback is allowed when the device is in silent mode.
   *
   * @platform ios
   */
  playsInSilentMode: boolean;
  /**
   * Determines how the audio session interacts with other sessions.
   * On Android, this is the unified interruption mode (replaces `interruptionModeAndroid`).
   *
   * @platform ios
   * @platform android
   */
  interruptionMode: InterruptionMode;
  /**
   * Determines how the audio session interacts with other sessions on Android.
   *
   * @deprecated Use `interruptionMode` instead, which is now cross-platform.
   * @platform android
   */
  interruptionModeAndroid?: InterruptionModeAndroid;
  /**
   * Whether the audio session allows recording.
   *
   * @default false
   * @platform ios
   */
  allowsRecording: boolean;
  /**
   * Whether the audio session stays active when the app moves to the background.
   * @default false
   */
  shouldPlayInBackground: boolean;
  /**
   * Whether the audio should route through the earpiece instead of the speaker.
   *
   * @default false
   * @platform ios
   * @platform android
   */
  shouldRouteThroughEarpiece: boolean;
  /**
   * Whether audio recording is allowed to continue in the background.
   * On Android, this starts a foreground service to keep recording alive.
   * On iOS, this sets the background audio recording capability.
   *
   * @default false
   * @platform ios
   * @platform android
   */
  allowsBackgroundRecording?: boolean;

  /**
   * iOS-specific advanced audio session configuration.
   * 
   * Enables features like:
   * - True stereo recording with polar patterns
   * - Input orientation control
   * - Preferred input/data source selection
   * - Auto-reapply on route changes
   * - Session state queries
   *
   * @platform ios
   * @example
   * ```tsx
   * await setAudioModeAsync({
   *   allowsRecording: true,
   *   playsInSilentMode: true,
   *   ios: {
   *     polarPattern: 'stereo',
   *     preferredInput: 'builtInMic',
   *     dataSourceName: 'bottom',
   *     inputOrientation: 'landscapeLeft',
   *     preferredSampleRate: 48000,
   *     autoReapplyOnRouteChange: true
   *   }
   * });
   * ```
   */
  ios?: AudioModeIOSConfig;
};

/**
 * Audio interruption behavior modes for iOS.
 *
 * Controls how your app's audio interacts with other apps' audio when interruptions occur.
 * This affects what happens when phone calls, notifications, or other apps play audio.
 *
 * @platform ios
 */
export type InterruptionMode = 'mixWithOthers' | 'doNotMix' | 'duckOthers';

/**
 * @deprecated Use `InterruptionMode` instead, which now works on both platforms.
 */
export type InterruptionModeAndroid = InterruptionMode;

/**
 * Polar pattern options for stereo/directional recording.
 * 
 * Polar patterns control how the microphone captures sound from different directions:
 * - `stereo`: Captures true stereo audio (left/right channels)
 * - `cardioid`: Heart-shaped pickup pattern, focuses on sound from front
 * - `omnidirectional`: Captures sound equally from all directions
 * - `subcardioid`: Wider pickup than cardioid but still directional
 *
 * @platform ios
 */
export type AudioSessionPolarPattern =
  | 'stereo'
  | 'cardioid'
  | 'omnidirectional'
  | 'subcardioid';

/**
 * Input orientation options for stereo field alignment.
 * 
 * Controls how the stereo field is oriented relative to device orientation:
 * - `portrait`: Stereo field aligned for portrait mode
 * - `portraitUpsideDown`: Stereo field aligned for upside-down portrait
 * - `landscapeLeft`: Stereo field aligned for landscape left
 * - `landscapeRight`: Stereo field aligned for landscape right
 * - `none`: No specific orientation (system default)
 *
 * @platform ios
 */
export type AudioSessionOrientation =
  | 'portrait'
  | 'portraitUpsideDown'
  | 'landscapeLeft'
  | 'landscapeRight'
  | 'none';

/**
 * Recording source for android.
 *
 * An audio source defines both a default physical source of audio signal, and a recording configuration.
 *
 * - `camcorder`: Microphone audio source tuned for video recording, with the same orientation as the camera if available.
 * - `default`: The default audio source.
 * - `mic`: Microphone audio source.
 * - `unprocessed`: Microphone audio source tuned for unprocessed (raw) sound if available, behaves like `default` otherwise.
 * - `voice_communication`: Microphone audio source tuned for voice communications such as VoIP. It will for instance take advantage of echo cancellation or automatic gain control if available.
 * - `voice_performance`: Source for capturing audio meant to be processed in real time and played back for live performance (e.g karaoke). The capture path will minimize latency and coupling with playback path.
 * - `voice_recognition`: Microphone audio source tuned for voice recognition.
 *
 * @see https://developer.android.com/reference/android/media/MediaRecorder.AudioSource
 * @platform android
 */
export type RecordingSource =
  | 'camcorder'
  | 'default'
  | 'mic'
  | 'remote_submix'
  | 'unprocessed'
  | 'voice_communication'
  | 'voice_performance'
  | 'voice_recognition';

/**
 * Loop mode for audio playlists.
 *
 * - `'none'`: No looping — stop at end of playlist.
 * - `'single'`: Repeat the current track indefinitely.
 * - `'all'`: Loop through all tracks continuously.
 */
export type AudioPlaylistLoopMode = 'none' | 'single' | 'all';

/**
 * Options for creating an `AudioPlaylist`.
 */
export type AudioPlaylistOptions = {
  /**
   * Initial audio sources forming the playlist.
   * @default []
   */
  sources?: AudioSource[];
  /**
   * How often (in milliseconds) to emit playlist status updates.
   * @default 500
   */
  updateInterval?: number;
  /**
   * Loop mode for the playlist.
   * @default 'none'
   */
  loop?: AudioPlaylistLoopMode;
  /**
   * Cross-origin policy for web. See `AudioPlayerOptions.crossOrigin`.
   * @platform web
   */
  crossOrigin?: 'anonymous' | 'use-credentials';
};

/**
 * Comprehensive status information for an `AudioPlaylist`.
 */
export type AudioPlaylistStatus = {
  /** Unique identifier for the playlist instance. */
  id: string;
  /** Index of the currently active track in the playlist. */
  currentIndex: number;
  /** Total number of tracks in the playlist. */
  trackCount: number;
  /** Current playback position within the current track, in seconds. */
  currentTime: number;
  /** Total duration of the current track in seconds. */
  duration: number;
  /** Whether the playlist is currently playing. */
  playing: boolean;
  /** Whether the player is currently buffering. */
  isBuffering: boolean;
  /** Whether the current track has finished loading. */
  isLoaded: boolean;
  /** Current playback rate (1.0 = normal speed). */
  playbackRate: number;
  /** Whether the player is muted. */
  muted: boolean;
  /** Current volume level (0.0 to 1.0). */
  volume: number;
  /** Current loop mode for the playlist. */
  loop: AudioPlaylistLoopMode;
  /** Whether the current track just finished playing. */
  didJustFinish: boolean;
  /**
   * Whether the media services have been reset (iOS only).
   * @platform ios
   */
  mediaServicesDidReset?: boolean;
};

// @docsMissing
export type AudioMetadata = {
  title?: string;
  artist?: string;
  albumTitle?: string;
  artworkUrl?: string;
};

/**
 * Current audio session state (iOS only).
 * 
 * Provides information about the current AVAudioSession configuration.
 * Use `getAudioSessionState()` to retrieve this information for debugging
 * or conditional logic.
 *
 * @platform ios
 * @example
 * ```tsx
 * const state = getAudioSessionState();
 * if (state) {
 *   console.log('Category:', state.category);
 *   console.log('Sample Rate:', state.sampleRate, 'Hz');
 *   console.log('Output Route:', state.outputRoute);
 * }
 * ```
 */
export type AudioSessionState = {
  /** Current AVAudioSession category (e.g., 'AVAudioSessionCategoryPlayAndRecord') */
  category: string;
  /** Current AVAudioSession mode (e.g., 'AVAudioSessionModeDefault') */
  mode: string;
  /** Current sample rate in Hz (e.g., 48000) */
  sampleRate: number;
  /** Current IO buffer duration in seconds (e.g., 0.005) */
  ioBufferDuration: number;
  /** Current output route port type (e.g., 'Speaker', 'BluetoothA2DPOutput') */
  outputRoute: string;
};
