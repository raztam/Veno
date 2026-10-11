package expo.modules.desertrantear

import java.io.EOFException
import java.io.File
import java.io.RandomAccessFile
import java.nio.ByteBuffer
import java.nio.ByteOrder

internal object WavPcmDecoder {
  fun decode(path: String): Pair<FloatArray, Double> {
    val file = File(path)
    if (!file.exists() || file.length() < 44L) {
      throw IllegalArgumentException("Audio file was not found or is not a valid WAV.")
    }

    RandomAccessFile(file, "r").use { raf ->
      val riff = readFourCc(raf)
      skipFully(raf, 4)
      val wave = readFourCc(raf)
      if (riff != "RIFF" || wave != "WAVE") {
        throw IllegalArgumentException("Language detection requires a WAV file.")
      }

      var audioFormat = 1
      var channels = 1
      var sampleRate = 16_000
      var bitsPerSample = 16
      var dataOffset = -1L
      var dataSize = 0

      while (raf.filePointer < raf.length()) {
        val chunkId = readFourCc(raf)
        val chunkSize = readInt32(raf).toLong() and 0xFFFF_FFFFL
        val nextChunk = raf.filePointer + chunkSize + (chunkSize % 2)

        when (chunkId) {
          "fmt " -> {
            audioFormat = readInt16(raf)
            channels = readInt16(raf)
            sampleRate = readInt32(raf)
            skipFully(raf, 6)
            bitsPerSample = readInt16(raf)
            if (audioFormat == 0xFFFE && chunkSize >= 40) {
              skipFully(raf, 8)
              audioFormat = readInt16(raf)
            }
          }
          "data" -> {
            dataOffset = raf.filePointer
            dataSize = chunkSize.toInt()
          }
        }

        if (nextChunk > raf.length()) {
          break
        }
        raf.seek(nextChunk)
      }

      if (dataOffset < 0 || dataSize <= 0) {
        throw IllegalArgumentException("WAV file has no audio data.")
      }
      if (channels <= 0 || sampleRate <= 0) {
        throw IllegalArgumentException("WAV file has an invalid format header.")
      }

      val bytes = ByteArray(dataSize)
      raf.seek(dataOffset)
      raf.readFully(bytes)
      val samples = pcmToMonoFloats(bytes, channels, bitsPerSample, audioFormat)
      if (samples.isEmpty()) {
        throw IllegalArgumentException("WAV file decoded to no samples.")
      }
      return samples to sampleRate.toDouble()
    }
  }

  private fun pcmToMonoFloats(
    bytes: ByteArray,
    channels: Int,
    bitsPerSample: Int,
    audioFormat: Int,
  ): FloatArray {
    val buffer = ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN)
    val isFloat = audioFormat == 3
    val bytesPerSample = bitsPerSample / 8
    if (bytesPerSample <= 0) {
      throw IllegalArgumentException("Unsupported WAV sample size.")
    }

    val frameCount = bytes.size / (bytesPerSample * channels)
    val samples = FloatArray(frameCount)

    for (i in 0 until frameCount) {
      var mixed = 0f
      for (channel in 0 until channels) {
        mixed += when {
          isFloat && bitsPerSample == 32 -> buffer.float
          bitsPerSample == 8 -> (buffer.get().toInt() and 0xFF) / 128f - 1f
          bitsPerSample == 16 -> buffer.short / 32768f
          bitsPerSample == 32 -> buffer.int / 2147483648f
          else -> throw IllegalArgumentException("Unsupported WAV encoding.")
        }
      }
      samples[i] = mixed / channels
    }

    return samples
  }

  private fun readFourCc(raf: RandomAccessFile): String {
    val bytes = ByteArray(4)
    raf.readFully(bytes)
    return String(bytes, Charsets.US_ASCII)
  }

  private fun readInt16(raf: RandomAccessFile): Int {
    val bytes = ByteArray(2)
    raf.readFully(bytes)
    return ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).short.toInt() and 0xFFFF
  }

  private fun readInt32(raf: RandomAccessFile): Int {
    val bytes = ByteArray(4)
    raf.readFully(bytes)
    return ByteBuffer.wrap(bytes).order(ByteOrder.LITTLE_ENDIAN).int
  }

  private fun skipFully(raf: RandomAccessFile, byteCount: Long) {
    if (byteCount <= 0) {
      return
    }
    val target = raf.filePointer + byteCount
    if (target > raf.length()) {
      throw EOFException("Unexpected end of WAV file.")
    }
    raf.seek(target)
  }
}
