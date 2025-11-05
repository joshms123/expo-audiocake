package expo.modules.avsessionoverride

import android.content.Context
import android.media.AudioAttributes
import android.media.AudioFocusRequest
import android.media.AudioManager
import android.os.Handler
import android.os.Looper
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.exception.Exceptions

class AVSessionOverrideModule : Module() {
  private var audioManager: AudioManager? = null
  private var focusRequest: AudioFocusRequest? = null

  override fun definition() = ModuleDefinition {
    Name("AVSessionOverride")

    OnCreate {
      audioManager = appContext.reactContext?.getSystemService(Context.AUDIO_SERVICE) as AudioManager
    }

    AsyncFunction("set") { params: Map<String, Any?> ->
      val am = audioManager ?: return@AsyncFunction
      val category = params["category"] as? String
      when (category) {
        null, "playAndRecord" -> {
          am.mode = AudioManager.MODE_IN_COMMUNICATION
          am.isSpeakerphoneOn = (params["speakerphoneOn"] as? Boolean) ?: true

          // Request focus for voice comms
          val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
          val fr = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(attrs)
            .setOnAudioFocusChangeListener {}
            .build()
          focusRequest?.let { am.abandonAudioFocusRequest(it) }
          focusRequest = fr
          am.requestAudioFocus(fr)
        }
        "playback" -> {
          am.mode = AudioManager.MODE_NORMAL
          am.isSpeakerphoneOn = (params["speakerphoneOn"] as? Boolean) ?: false
          focusRequest?.let { am.abandonAudioFocusRequest(it) }
          focusRequest = null
        }
        else -> throw Exceptions.IllegalArgument("Unsupported category: $category")
      }
    }

    AsyncFunction("temporaryOverride") { params: Map<String, Any?> ->
      val am = audioManager ?: return@AsyncFunction

      // Preserve current state
      val prevMode = am.mode
      val prevSpeaker = am.isSpeakerphoneOn
      val prevFocus = focusRequest

      // Apply requested override using same logic as set
      val category = params["category"] as? String
      when (category) {
        null, "playAndRecord" -> {
          am.mode = AudioManager.MODE_IN_COMMUNICATION
          am.isSpeakerphoneOn = (params["speakerphoneOn"] as? Boolean) ?: true

          val attrs = AudioAttributes.Builder()
            .setUsage(AudioAttributes.USAGE_VOICE_COMMUNICATION)
            .setContentType(AudioAttributes.CONTENT_TYPE_SPEECH)
            .build()
          val fr = AudioFocusRequest.Builder(AudioManager.AUDIOFOCUS_GAIN_TRANSIENT_EXCLUSIVE)
            .setAudioAttributes(attrs)
            .setOnAudioFocusChangeListener {}
            .build()
          focusRequest?.let { am.abandonAudioFocusRequest(it) }
          focusRequest = fr
          am.requestAudioFocus(fr)
        }
        "playback" -> {
          am.mode = AudioManager.MODE_NORMAL
          am.isSpeakerphoneOn = (params["speakerphoneOn"] as? Boolean) ?: false
          focusRequest?.let { am.abandonAudioFocusRequest(it) }
          focusRequest = null
        }
        else -> throw Exceptions.IllegalArgument("Unsupported category: $category")
      }
      // Revert to previous state on the next loop
      Handler(Looper.getMainLooper()).post {
        am.mode = prevMode
        am.isSpeakerphoneOn = prevSpeaker
        focusRequest?.let { am.abandonAudioFocusRequest(it) }
        if (prevFocus != null) {
          focusRequest = prevFocus
          am.requestAudioFocus(prevFocus)
        } else {
          focusRequest = null
        }
      }
    }

    AsyncFunction("setActive") { active: Boolean ->
      // No direct equivalent; you can drop/reacquire focus
      val am = audioManager ?: return@AsyncFunction
      if (!active) {
        focusRequest?.let { am.abandonAudioFocusRequest(it) }
        focusRequest = null
      }
    }

    AsyncFunction("enableAutoReapply") { /* no-op on Android by default */ }
    AsyncFunction("disableAutoReapply") { /* no-op on Android by default */ }

    Function("getState") {
      val am = audioManager
      mapOf(
        "mode" to am?.mode,
        "speaker" to am?.isSpeakerphoneOn
      )
    }
  }
}