# Original Splash-Timed ATT Trigger

This is the earlier code path that successfully surfaced the Apple ATT prompt, but at the wrong time: during app activation/splash instead of after the in-app permission screen.

## `ios/App/App/AppDelegate.swift`

The key behavior was calling TikTok's ATT request from `applicationDidBecomeActive`.

```swift
import UIKit
import Capacitor
import CapApp_SPM

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        TikTokSdkBootstrap.configureOnLaunch()
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, etc.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        TikTokSdkBootstrap.requestTrackingAuthorizationOnBecomeActive()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }
}
```

## `ios/App/App/TikTokSdkBootstrap.swift`

The TikTok helper initialized the SDK on launch and exposed a method that called TikTok's tracking authorization request.

```swift
import Foundation
import TikTokBusinessSDK

/// Initializes TikTok App Events SDK (install / launch / retention / StoreKit purchase auto-events).
///
/// Maps to TikTok Events Manager + official sample (`InitViewController.swift`):
///   TikTokConfig(accessToken:appSecret, appId:appId, tiktokAppId:tiktokAppId)
///   - accessToken ← App Secret
///   - appId ← App ID (numeric, e.g. App Store id6759469696 → 6759469696)
///   - tiktokAppId ← TikTok App ID
enum TikTokSdkBootstrap {
    private static var didConfigure = false

    static func configureOnLaunch() {
        guard !didConfigure else { return }

        guard
            let accessToken = plistString("TikTokAccessToken"),
            let appId = plistString("TikTokAppId"),
            let tiktokAppId = plistString("TikTokTikTokAppId"),
            !accessToken.isEmpty,
            !appId.isEmpty,
            !tiktokAppId.isEmpty,
            !accessToken.hasPrefix("REPLACE_"),
            !appId.hasPrefix("REPLACE_"),
            !tiktokAppId.hasPrefix("REPLACE_")
        else {
            return
        }

        guard let config = TikTokConfig(accessToken: accessToken, appId: appId, tiktokAppId: tiktokAppId) else {
            return
        }

        #if DEBUG
        config.enableDebugMode()
        #endif

        TikTokBusiness.initializeSdk(config)
        didConfigure = true
    }

    /// Required for IDFA on iOS 14+ — call from `applicationDidBecomeActive` per TikTok sample AppDelegate.
    static func requestTrackingAuthorizationOnBecomeActive() {
        guard didConfigure else { return }
        TikTokBusiness.requestTrackingAuthorization(completionHandler: nil)
    }

    private static func plistString(_ key: String) -> String? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
```

## Why It Appeared Too Early

`applicationDidBecomeActive` runs when the app becomes active, including initial launch after the splash transition. Because it directly called `TikTokSdkBootstrap.requestTrackingAuthorizationOnBecomeActive()`, the ATT system prompt could appear before the user reached the in-app "Help Us Improve Palette Plotting" screen.

## Current Replacement

The current implementation removed this splash trigger. ATT now lives in:

`ios/App/CapApp-SPM/Sources/CapApp-SPM/TrackingAuthorizationPlugin.swift`

and is called only after the user taps **Yes** on the in-app permissions screen.
