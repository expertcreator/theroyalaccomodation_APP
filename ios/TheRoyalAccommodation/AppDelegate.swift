import UIKit
import React
import React_RCTAppDelegate
import ReactAppDependencyProvider

@main
class AppDelegate: UIResponder, UIApplicationDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ReactNativeDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = RCTReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

    window = UIWindow(frame: UIScreen.main.bounds)

    // Match native launch appearance to the saved theme (avoids white flash in dark mode).
    // Flag is written by ThemePreference.swift when the user toggles the theme.
    let darkModeEnabled = UserDefaults.standard.bool(forKey: "darkMode")
    window?.backgroundColor = darkModeEnabled
      ? UIColor(red: 0.055, green: 0.09, blue: 0.063, alpha: 1)   // near-black forest (dark bg)
      : UIColor(red: 0.98, green: 0.972, blue: 0.953, alpha: 1)    // cream (#FAF8F3, light bg)
    window?.overrideUserInterfaceStyle = darkModeEnabled ? .dark : .light

    factory.startReactNative(
      withModuleName: "TheRoyalAccommodation",
      in: window,
      launchOptions: launchOptions
    )

    showSplashScreen()

    return true
  }

  private func showSplashScreen() {
    if let splashClass = NSClassFromString("SplashView") as? NSObject.Type,
       let splashInstance = splashClass.perform(NSSelectorFromString("sharedInstance"))?.takeUnretainedValue() as? NSObject {
      splashInstance.perform(NSSelectorFromString("showSplash"))
      print("✅ Splash Screen Shown Successfully")
    } else {
      print("⚠️ SplashView module not found")
    }
  }
}

class ReactNativeDelegate: RCTDefaultReactNativeFactoryDelegate {
  override func sourceURL(for bridge: RCTBridge) -> URL? {
    self.bundleURL()
  }

  override func bundleURL() -> URL? {
#if DEBUG
    RCTBundleURLProvider.sharedSettings().jsBundleURL(forBundleRoot: "index")
#else
    Bundle.main.url(forResource: "main", withExtension: "jsbundle")
#endif
  }
}