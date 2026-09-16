import ExpoModulesCore
import UIKit

public class VenoEarAppDelegate: ExpoAppDelegateSubscriber {
  public func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?
  ) -> Bool {
    if let loader = NSClassFromString("VenoEarLoader") as? NSObject.Type {
      loader.perform(NSSelectorFromString("registerBridge"))
    }
    return false
  }
}
