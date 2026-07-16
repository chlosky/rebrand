import Foundation
import TikTokBusinessSDK

/// Initializes TikTok App Events SDK (install / launch / retention / StoreKit purchase auto-events).
///
/// Maps to TikTok Events Manager + official sample (`InitViewController.swift`):
///   TikTokConfig(accessToken:appSecret, appId:appId, tiktokAppId:tiktokAppId)
///   - accessToken ← App Secret
///   - appId ← App ID (numeric from TikTok Events Manager, not the bundle id)
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

    private static func plistString(_ key: String) -> String? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
