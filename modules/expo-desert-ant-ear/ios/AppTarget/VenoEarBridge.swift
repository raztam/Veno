internal import Ear
internal import ExpoDesertAntEar
import Foundation

/// Linked into the app target (not the Expo pod) so Ear can be imported via SPM
/// without putting a Swift package on a static Expo module.
final class VenoEarBridge: VenoEarProviding {
  private let ear = Ear()

  func isDownloaded() -> Bool {
    Ear.isDownloaded()
  }

  func download() async throws {
    try await ear.download()
  }

  func identify(fileUri: String) async throws -> EarDetectionResult {
    let detection = try await ear.identify(contentsOf: resolveFileURL(fileUri))
    return EarDetectionResult(
      language: detection.language,
      confidence: detection.confidence,
      isReliable: detection.isReliable
    )
  }

  private func resolveFileURL(_ uri: String) -> URL {
    if let url = URL(string: uri), url.isFileURL {
      return url
    }

    if uri.hasPrefix("file://") {
      let path = String(uri.dropFirst("file://".count)).removingPercentEncoding
        ?? String(uri.dropFirst("file://".count))
      return URL(fileURLWithPath: path)
    }

    return URL(fileURLWithPath: uri)
  }
}

@objc(VenoEarLoader)
public final class VenoEarLoader: NSObject {
  private static let bridge = VenoEarBridge()

  @objc public static func registerBridge() {
    VenoEarProvider.current = bridge
  }
}
