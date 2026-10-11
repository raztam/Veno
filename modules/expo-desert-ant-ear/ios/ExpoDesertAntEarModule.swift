import ExpoModulesCore
import Foundation

internal final class EarUnavailableException: Exception {
  override var reason: String {
    "On-device language detection is not available."
  }
}

public class ExpoDesertAntEarModule: Module {
  public func definition() -> ModuleDefinition {
    Name("ExpoDesertAntEar")

    Function("isDownloaded") { () -> Bool in
      VenoEarProvider.current?.isDownloaded() ?? false
    }

    AsyncFunction("download") { () async throws in
      guard let provider = VenoEarProvider.current else {
        throw EarUnavailableException()
      }
      try await provider.download()
    }

    AsyncFunction("identify") { (fileUri: String) async throws -> [String: Any] in
      guard let provider = VenoEarProvider.current else {
        throw EarUnavailableException()
      }
      let detection = try await provider.identify(fileUri: fileUri)
      return [
        "language": detection.language ?? NSNull(),
        "confidence": detection.confidence,
        "isReliable": detection.isReliable,
      ]
    }
  }
}
