import AVFAudio
import ExpoModulesCore

// MARK: - DTOs

struct SetParams: Record {
  @Field var category: String
  @Field var options: [String]? = nil
  @Field var mode: String? = nil
  @Field var active: Bool? = nil
  @Field var sampleRate: Double? = nil
  @Field var ioBufferDuration: Double? = nil
  @Field var inputOrientation: String? = nil
  @Field var preferredInput: String? = nil
  @Field var dataSourceName: String? = nil
  @Field var polarPattern: String? = nil
}

struct DesiredState: Codable {
  var category: String
  var options: [String]
  var mode: String
  var active: Bool
  var sampleRate: Double?
  var ioBufferDuration: Double?
  var inputOrientation: String?
  var preferredInput: String?
  var dataSourceName: String?
  var polarPattern: String?
}

// MARK: - Module

public class AVSessionOverrideModule: Module {
  private var keepEnforced = true
  private var desired: DesiredState? = nil

  public func definition() -> ModuleDefinition {
    Name("AVSessionOverride")

    // Lifecycle
    OnStartObserving {
      self.registerObservers()
    }
    OnStopObserving {
      self.unregisterObservers()
    }

    // Set + persist desired session. Auto-reapply will use this.
    AsyncFunction("set") { (params: SetParams) in
      let desired = self.paramsToDesired(params)
      try self.apply(desired: desired)
      self.desired = desired
      self.keepEnforced = true
    }

    // Temporary override that does NOT change the stored desired state.
    // Useful when you intentionally let expo-av pick something else briefly.
    AsyncFunction("temporaryOverride") { (params: SetParams) in
      let temp = self.paramsToDesired(params)
      try self.apply(desired: temp)
      // keepEnforced stays as is; we do not change self.desired.
    }

    AsyncFunction("setActive") { (active: Bool) in
      let session = AVAudioSession.sharedInstance()
      try session.setActive(active, options: [])
    }

    // Control auto-reapply
    AsyncFunction("enableAutoReapply") {
      self.keepEnforced = true
      // Optionally reapply immediately if desired is set
      if let desired = self.desired {
        try self.apply(desired: desired)
      }
    }
    AsyncFunction("disableAutoReapply") {
      self.keepEnforced = false
    }

    // Read back current simple snapshot
    Function("getState") {
      let s = AVAudioSession.sharedInstance()
      return [
        "category": s.category.rawValue,
        "mode": s.mode.rawValue,
        "sampleRate": s.sampleRate,
        "ioBufferDuration": s.ioBufferDuration,
        "route": s.currentRoute.outputs.first?.portType.rawValue ?? "unknown"
      ]
    }
  }

  // MARK: - Observers

  private var observers: [NSObjectProtocol] = []

  private func registerObservers() {
    let center = NotificationCenter.default
    let session = AVAudioSession.sharedInstance()

    let route = center.addObserver(
      forName: AVAudioSession.routeChangeNotification,
      object: session,
      queue: .main
    ) { [weak self] _ in
      self?.maybeReapply(reason: "routeChange")
    }
    let interrupt = center.addObserver(
      forName: AVAudioSession.interruptionNotification,
      object: session,
      queue: .main
    ) { [weak self] _ in
      self?.maybeReapply(reason: "interruption")
    }
    let reset = center.addObserver(
      forName: AVAudioSession.mediaServicesWereResetNotification,
      object: nil,
      queue: .main
    ) { [weak self] _ in
      self?.maybeReapply(reason: "mediaServicesReset")
    }
    observers = [route, interrupt, reset]
  }

  private func unregisterObservers() {
    let center = NotificationCenter.default
    for o in observers {
      center.removeObserver(o)
    }
    observers.removeAll()
  }

  // MARK: - Reapply logic

  private func maybeReapply(reason: String) {
    guard keepEnforced, let desired = desired else { return }
    do {
      try apply(desired: desired)
    } catch {
      // Swallow but log with NSLog for debugging
      NSLog("[AVSessionOverride] Reapply failed (\(reason)): \(error.localizedDescription)")
    }
  }

  // MARK: - Apply

  private func apply(desired: DesiredState) throws {
    let session = AVAudioSession.sharedInstance()
    let category = try mapCategory(desired.category)
    let options = try mapOptions(desired.options)
    let mode = try mapMode(desired.mode)

    // Order matters:
    try session.setCategory(category, mode: mode, options: options)

    if let sr = desired.sampleRate {
      try session.setPreferredSampleRate(sr)
    }
    if let dur = desired.ioBufferDuration {
      try session.setPreferredIOBufferDuration(dur)
    }
    
    // Configure stereo recording if requested
    if let preferredInputType = desired.preferredInput {
      try configurePreferredInput(session: session, inputType: preferredInputType)
    }
    
    if let dataSourceName = desired.dataSourceName, let polarPattern = desired.polarPattern {
      try configureStereoDataSource(session: session, dataSourceName: dataSourceName, polarPattern: polarPattern)
    }
    
    if let inputOrientation = desired.inputOrientation {
      let orientation = try mapOrientation(inputOrientation)
      try session.setPreferredInputOrientation(orientation)
    }

    try session.setActive(desired.active, options: [])
  }

  // MARK: - Stereo Configuration
  
  private func configurePreferredInput(session: AVAudioSession, inputType: String) throws {
    guard inputType.lowercased() == "builtinmic" else {
      throw Exception(name: "InvalidInputType", description: "Only 'builtInMic' is supported")
    }
    
    guard let availableInputs = session.availableInputs,
          let builtInMicInput = availableInputs.first(where: { $0.portType == .builtInMic }) else {
      throw Exception(name: "NoBuiltInMic", description: "The device must have a built-in microphone")
    }
    
    try session.setPreferredInput(builtInMicInput)
  }
  
  private func configureStereoDataSource(session: AVAudioSession, dataSourceName: String, polarPattern: String) throws {
    guard polarPattern.lowercased() == "stereo" else {
      throw Exception(name: "InvalidPolarPattern", description: "Only 'stereo' polar pattern is supported")
    }
    
    guard let preferredInput = session.preferredInput,
          let dataSources = preferredInput.dataSources,
          let dataSource = dataSources.first(where: { $0.dataSourceName.lowercased() == dataSourceName.lowercased() }),
          let supportedPolarPatterns = dataSource.supportedPolarPatterns else {
      throw Exception(name: "DataSourceNotFound", description: "Could not find data source '\(dataSourceName)' or it has no supported polar patterns")
    }
    
    guard supportedPolarPatterns.contains(.stereo) else {
      throw Exception(name: "StereoNotSupported", description: "The selected data source does not support stereo recording")
    }
    
    try dataSource.setPreferredPolarPattern(.stereo)
    try preferredInput.setPreferredDataSource(dataSource)
  }

  // MARK: - Mapping

  private func paramsToDesired(_ p: SetParams) -> DesiredState {
    return DesiredState(
      category: p.category,
      options: p.options ?? [],
      mode: (p.mode ?? "default"),
      active: (p.active ?? true),
      sampleRate: p.sampleRate,
      ioBufferDuration: p.ioBufferDuration,
      inputOrientation: p.inputOrientation,
      preferredInput: p.preferredInput,
      dataSourceName: p.dataSourceName,
      polarPattern: p.polarPattern
    )
  }

  private func mapCategory(_ s: String) throws -> AVAudioSession.Category {
    switch s.lowercased() {
      case "ambient": return .ambient
      case "soloambient", "solo-ambient": return .soloAmbient
      case "playback": return .playback
      case "record", "recording": return .record
      case "playandrecord", "play-and-record", "play_record": return .playAndRecord
      case "multiroute", "multi-route": return .multiRoute
      default: throw Exception(name: "InvalidCategory", description: "Unknown AVAudioSession category: \(s)")
    }
  }

  private func mapMode(_ s: String) throws -> AVAudioSession.Mode {
    switch s.lowercased() {
      case "default": return .default
      case "voicechat", "voice-chat": return .voiceChat
      case "videorecording", "video-recording": return .videoRecording
      case "measurement": return .measurement
      case "movieplayback", "movie-playback": return .moviePlayback
      case "spokenaudio", "spoken-audio": return .spokenAudio
      case "gamechat", "game-chat": return .gameChat
      default: throw Exception(name: "InvalidMode", description: "Unknown AVAudioSession mode: \(s)")
    }
  }

  private func mapOrientation(_ s: String) throws -> AVAudioSession.StereoOrientation {
    switch s.lowercased() {
      // Device orientation mappings for stereo input
      case "portrait": return .portrait
      case "portraitupsidedown", "portrait-upside-down": return .portraitUpsideDown
      case "landscapeleft", "landscape-left": return .landscapeLeft
      case "landscaperight", "landscape-right": return .landscapeRight
      case "none", "default": return .none
      // Legacy directional mappings - map to reasonable stereo orientations
      case "front", "back", "top", "bottom": return .portrait
      case "left": return .landscapeLeft
      case "right": return .landscapeRight
      // Legacy face mappings
      case "faceup", "face-up": return .portrait
      case "facedown", "face-down": return .portraitUpsideDown
      default: throw Exception(name: "InvalidOrientation", description: "Unknown AVAudioSession stereo orientation: \(s)")
    }
  }

  private func mapOptions(_ list: [String]) throws -> AVAudioSession.CategoryOptions {
    var opts: AVAudioSession.CategoryOptions = []
    for raw in list {
      switch raw.lowercased() {
        case "mixwithothers", "mix": opts.insert(.mixWithOthers)
        case "duckothers", "duck": opts.insert(.duckOthers)
        case "allowbluetooth", "bt": opts.insert(.allowBluetooth)
        case "allowbluetootha2dp", "a2dp": opts.insert(.allowBluetoothA2DP)
        case "defaulttospeaker", "speaker": opts.insert(.defaultToSpeaker)
        case "interruptspokes": opts.insert(.interruptSpokenAudioAndMixWithOthers)
        case "allowairplay", "airplay": opts.insert(.allowAirPlay)
        default: throw Exception(name: "InvalidOption", description: "Unknown AVAudioSession option: \(raw)")
      }
    }
    return opts
  }
}