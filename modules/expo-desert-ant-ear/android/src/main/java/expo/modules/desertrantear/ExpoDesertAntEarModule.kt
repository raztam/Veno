package expo.modules.desertrantear

import ai.desertant.ear.Ear
import android.content.Context
import expo.modules.kotlin.exception.CodedException
import expo.modules.kotlin.exception.Exceptions
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File
import java.net.URLDecoder
import kotlinx.coroutines.runBlocking

class EarAudioException(message: String) : CodedException(message)

class ExpoDesertAntEarModule : Module() {
  private val context: Context
    get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

  private var ear: Ear? = null
  private val earLock = Any()

  override fun definition() = ModuleDefinition {
    Name("ExpoDesertAntEar")

    Function("isDownloaded") {
      getEar().isDownloaded()
    }

    AsyncFunction("download") {
      runBlocking {
        getEar().download()
      }
    }

    AsyncFunction("identify") Coroutine { fileUri: String ->
      val (samples, sampleRate) = WavPcmDecoder.decode(toFilesystemPath(fileUri))
      val detection = getEar().identify(samples, sampleRate)
      mapOf(
        "language" to detection.language,
        "confidence" to detection.confidence,
        "isReliable" to detection.isReliable,
      )
    }

    OnDestroy {
      synchronized(earLock) {
        ear?.close()
        ear = null
      }
    }
  }

  private fun getEar(): Ear {
    synchronized(earLock) {
      val existing = ear
      if (existing != null) {
        return existing
      }
      val created = Ear(context.applicationContext)
      ear = created
      return created
    }
  }

  private fun toFilesystemPath(uri: String): String {
    val path = if (uri.startsWith("file://")) {
      URLDecoder.decode(uri.removePrefix("file://"), "UTF-8")
    } else {
      uri
    }
    if (!File(path).exists()) {
      throw EarAudioException("Recording file was not found.")
    }
    return path
  }
}
