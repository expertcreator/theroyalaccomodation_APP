import Foundation
import React

@objc(ThemePreference)
class ThemePreference: NSObject {
  
  private let darkModeKey = "darkMode"

  @objc
  func setDarkModeEnabled(_ enabled: Bool) {
    UserDefaults.standard.set(enabled, forKey: darkModeKey)
  }

  @objc
  func getDarkModeEnabled(_ resolve: @escaping RCTPromiseResolveBlock,
                          rejecter reject: @escaping RCTPromiseRejectBlock) {
    let value = UserDefaults.standard.bool(forKey: darkModeKey)
    resolve(value)
  }

  @objc static func requiresMainQueueSetup() -> Bool {
    return true
  }
}