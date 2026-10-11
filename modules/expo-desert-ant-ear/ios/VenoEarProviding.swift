import Foundation

public struct EarDetectionResult: Sendable {
  public let language: String?
  public let confidence: Double
  public let isReliable: Bool

  public init(language: String?, confidence: Double, isReliable: Bool) {
    self.language = language
    self.confidence = confidence
    self.isReliable = isReliable
  }
}

public protocol VenoEarProviding: AnyObject {
  func isDownloaded() -> Bool
  func download() async throws
  func identify(fileUri: String) async throws -> EarDetectionResult
}

public enum VenoEarProvider {
  nonisolated(unsafe) public static var current: VenoEarProviding?
}
