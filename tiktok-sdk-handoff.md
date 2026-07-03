# TikTok SDK + web ads handoff — Palette Plotting

Generated: 2026-05-30 19:55
Branch: Mobile-app
Commit: 95f57bbb

---

## docs/TIKTOK_IOS_SDK.md

```markdown
# TikTok App Events SDK (iOS native)

Palette Plotting initializes the [TikTok Business iOS SDK](https://github.com/tiktok/tiktok-business-ios-sdk) on app launch. It auto-logs **Install**, **Launch**, **Retention**, and **Purchase** (StoreKit) when configured.

Official references:

- [How to integrate TikTok App Events SDK](https://ads.tiktok.com/help/article/how-to-integrate-tiktok-app-events-sdk)
- [TikTok Business iOS SDK (GitHub)](https://github.com/tiktok/tiktok-business-ios-sdk) — sample init in `TikTokBusinessSDKTestApp/InitViewController.swift`

TikTok does **not** publish Codemagic YAML or custom Info.plist key names. Credentials are passed in code via:

```swift
TikTokConfig(accessToken: appSecret, appId: appId, tiktokAppId: tiktokAppId)
TikTokBusiness.initializeSdk(config)
```

We store the three values in `Info.plist` at CI time so secrets are not committed to git.

## 1. TikTok Events Manager (Initialize app screen)

From **Tools → Events Manager → your iOS app → SDK setup**:

| TikTok UI label | SDK parameter | Info.plist key (CI inject only) |
|-----------------|---------------|----------------------------------|
| **App Secret** | `accessToken` | `TikTokAccessToken` |
| **App ID** (numeric, e.g. `6759469696`) | `appId` | `TikTokAppId` |
| **TikTok App ID** (long numeric id) | `tiktokAppId` | `TikTokTikTokAppId` |

Do **not** use:

- Bundle id (`com.paletteplotting.app`) for `appId` — SDK expects the numeric **App ID** from Events Manager.
- Web pixel id for `tiktokAppId` — that is website-only (`index.html`).

## 2. Local Xcode / Info.plist

Edit `ios/App/App/Info.plist` (or inject via Codemagic for release):

| Key | Value |
|-----|--------|
| `TikTokAccessToken` | App Secret |
| `TikTokAppId` | App ID (numeric) |
| `TikTokTikTokAppId` | TikTok App ID |

While values are `REPLACE_*`, the SDK does not initialize (safe for local dev).

`NSUserTrackingUsageDescription` is required for ATT (same as TikTok test app `Info.plist`).

## 3. Codemagic (recommended for release)

In **Codemagic → Environment variables** (mark **Secure**), on the **Production** group:

| Codemagic variable | TikTok Events Manager source | Info.plist key |
|--------------------|------------------------------|----------------|
| `TIKTOK_IOS_APP_SECRET` | App Secret | `TikTokAccessToken` |
| `TIKTOK_IOS_APP_ID` | App ID (numeric) | `TikTokAppId` |
| `TIKTOK_IOS_TIKTOK_APP_ID` | TikTok App ID | `TikTokTikTokAppId` |

Legacy alias: `TIKTOK_IOS_ACCESS_TOKEN` is still accepted as App Secret if `TIKTOK_IOS_APP_SECRET` is unset.

Both **`ios-workflow`** (App Store) and **`ios-simulator-workflow`** inject after `cap sync ios`, then verify `NSUserTrackingUsageDescription` and that all three keys are non-placeholder. Values are never printed in logs.

**Xcode:** `-ObjC` and `-lc++` in `OTHER_LDFLAGS`; SDK via Swift Package Manager (`tiktok-business-ios-sdk` ≥ 1.6.0).

## 4. Verify in TikTok

1. Ship a TestFlight build with all three secrets injected.
2. On a **physical device**, open the app and accept ATT if prompted.
3. In Events Manager, use **Test event** (recommended) or debug mode — [TikTok help § Step 5](https://ads.tiktok.com/help/article/how-to-integrate-tiktok-app-events-sdk).
4. **Pending verification** should clear after TikTok receives Launch/Install.

## 5. SKAN

If TikTok SDK updates SKAN conversion values (no MMP), configure SKAN schema in Events Manager. If another SDK owns SKAN, call `disableSKAdNetworkSupport()` on config per TikTok docs.

## 6. Web vs app

- **Website:** TikTok Pixel in `index.html` (separate data source).
- **iOS app:** This native SDK only, after a store build with injected credentials.
```

---

## ios/App/App/TikTokSdkBootstrap.swift

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

---

## ios/App/App/AppDelegate.swift

```swift
import UIKit
import Capacitor
import CapApp_SPM

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate {

    var window: UIWindow?

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        TikTokSdkBootstrap.configureOnLaunch()
        MetaSdkBootstrap.configureOnLaunch(application: application, launchOptions: launchOptions)
        return true
    }

    func applicationWillResignActive(_ application: UIApplication) {
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions (such as an incoming phone call or SMS message) or when the user quits the application and it begins the transition to the background state.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore your application to its current state in case it is terminated later.
        // If your application supports background execution, this method is called instead of applicationWillTerminate: when the user quits.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state; here you can undo many of the changes made on entering the background.
    }

    func applicationDidBecomeActive(_ application: UIApplication) {
        TikTokSdkBootstrap.requestTrackingAuthorizationOnBecomeActive()
        MetaSdkBootstrap.activateOnBecomeActive()
    }

    func applicationWillTerminate(_ application: UIApplication) {
        // Called when the application is about to terminate. Save data if appropriate. See also applicationDidEnterBackground:.
    }

    func application(_ app: UIApplication, open url: URL, options: [UIApplication.OpenURLOptionsKey: Any] = [:]) -> Bool {
        // Called when the app was launched with a url. Feel free to add additional processing here,
        // but if you want the App API to support tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(app, open: url, options: options)
    }

    func application(_ application: UIApplication, continue userActivity: NSUserActivity, restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void) -> Bool {
        // Called when the app was launched with an activity, including Universal Links.
        // Feel free to add additional processing here, but if you want the App API to support
        // tracking app url opens, make sure to keep this call
        return ApplicationDelegateProxy.shared.application(application, continue: userActivity, restorationHandler: restorationHandler)
    }

}
```

---

## ios/App/App/Info.plist

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>CAPACITOR_DEBUG</key>
	<string>$(CAPACITOR_DEBUG)</string>
	<key>CFBundleDevelopmentRegion</key>
	<string>en</string>
	<key>CFBundleDisplayName</key>
        <string>Palette Plotting</string>
	<key>CFBundleExecutable</key>
	<string>$(EXECUTABLE_NAME)</string>
	<key>CFBundleIdentifier</key>
	<string>$(PRODUCT_BUNDLE_IDENTIFIER)</string>
	<key>CFBundleInfoDictionaryVersion</key>
	<string>6.0</string>
	<key>CFBundleName</key>
	<string>$(PRODUCT_NAME)</string>
	<key>CFBundlePackageType</key>
	<string>APPL</string>
	<key>CFBundleShortVersionString</key>
	<string>$(MARKETING_VERSION)</string>
	<key>CFBundleVersion</key>
	<string>$(CURRENT_PROJECT_VERSION)</string>
	<key>LSRequiresIPhoneOS</key>
	<true/>
	<key>UILaunchStoryboardName</key>
	<string>LaunchScreen</string>
	<key>UIMainStoryboardFile</key>
	<string>Main</string>
	<key>UIRequiredDeviceCapabilities</key>
	<array>
		<string>armv7</string>
	</array>
	<key>UISupportedInterfaceOrientations</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UISupportedInterfaceOrientations~ipad</key>
	<array>
		<string>UIInterfaceOrientationPortrait</string>
		<string>UIInterfaceOrientationPortraitUpsideDown</string>
		<string>UIInterfaceOrientationLandscapeLeft</string>
		<string>UIInterfaceOrientationLandscapeRight</string>
	</array>
	<key>UIViewControllerBasedStatusBarAppearance</key>
	<true/>
	<key>NSCameraUsageDescription</key>
	<string>Palette Plotting needs access to your camera for Mirror Work practice sessions.</string>
	<key>NSMicrophoneUsageDescription</key>
	<string>Palette Plotting needs access to your microphone to record affirmations for subliminal audio creation.</string>
	<key>NSPhotoLibraryUsageDescription</key>
	<string>Palette Plotting needs access to your photo library to save and use images for vision boards.</string>
	<key>NSLocationWhenInUseUsageDescription</key>
	<string>Palette Plotting does not use your location for app features. An included SDK for notifications and marketing may reference location APIs; we do not collect or store your location.</string>
	<key>UIBackgroundModes</key>
	<array>
		<string>remote-notification</string>
	</array>
	<key>ITSAppUsesNonExemptEncryption</key>
	<false/>
	<key>NSUserTrackingUsageDescription</key>
	<string>Palette Plotting uses this permission to measure app installs and subscriptions from ads on TikTok and Meta so we can improve our marketing. Your data is not sold.</string>
	<key>FacebookAppID</key>
	<string>0</string>
	<key>FacebookClientToken</key>
	<string>REPLACE_WITH_META_CLIENT_TOKEN</string>
	<key>FacebookDisplayName</key>
	<string>Palette Plotting</string>
	<key>LSApplicationQueriesSchemes</key>
	<array>
		<string>fbapi</string>
		<string>fb-messenger-share-api</string>
	</array>
	<key>CFBundleURLTypes</key>
	<array>
		<dict>
			<key>CFBundleURLSchemes</key>
			<array>
				<string>fb0</string>
			</array>
		</dict>
	</array>
	<key>TikTokAccessToken</key>
	<string>REPLACE_WITH_APP_SECRET</string>
	<key>TikTokAppId</key>
	<string>REPLACE_WITH_APP_ID</string>
	<key>TikTokTikTokAppId</key>
	<string>REPLACE_WITH_TIKTOK_APP_ID</string>
</dict>
</plist>
```

---

## codemagic.yaml

```yaml
workflows:
  ios-simulator-workflow:
    name: iOS Simulator Build (Quick Launch)
    max_build_duration: 120
    instance_type: mac_mini_m2
    environment:
      vars:
        XCODE_SCHEME: "App"
        VITE_REVENUECAT_IOS_API_KEY: "appl_mVsxTYvnkpFUmLDLcZgPlzBLzpB"
        # TikTok App Events SDK — Events Manager "Initialize app" → TikTokConfig(accessToken:appId:tiktokAppId:)
        #   TIKTOK_IOS_APP_SECRET     → App Secret      → plist TikTokAccessToken → accessToken
        #   TIKTOK_IOS_APP_ID         → App ID (numeric) → plist TikTokAppId         → appId
        #   TIKTOK_IOS_TIKTOK_APP_ID  → TikTok App ID   → plist TikTokTikTokAppId  → tiktokAppId
        # Legacy: TIKTOK_IOS_ACCESS_TOKEN accepted as App Secret if APP_SECRET unset
        # Meta App Events (optional, same UI):
        #   META_IOS_APP_ID, META_IOS_CLIENT_TOKEN
      groups:
        - Production
      # Use Codemagic-supported Xcode (15.4 was removed from their pool). Paywall uses
      # @revenuecat/purchases-capacitor-ui (RevenueCatUI.presentPaywall).
      node: 22.11.0
      xcode: latest
      cocoapods: default
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Xcode toolchain (verify)
        script: |
          xcodebuild -version
          xcode-select -print-path
      - name: Build web assets
        script: |
          npm run build
      - name: Sync Capacitor
        script: |
          ./node_modules/.bin/cap sync ios
      - name: Inject TikTok SDK credentials
        script: |
          PLIST="ios/App/App/Info.plist"
          APP_SECRET="${TIKTOK_IOS_APP_SECRET:-${TIKTOK_IOS_ACCESS_TOKEN:-}}"
          if [ -n "$APP_SECRET" ] && [ -n "${TIKTOK_IOS_APP_ID:-}" ] && [ -n "${TIKTOK_IOS_TIKTOK_APP_ID:-}" ]; then
            /usr/libexec/PlistBuddy -c "Set :TikTokAccessToken $APP_SECRET" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :TikTokAppId ${TIKTOK_IOS_APP_ID}" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :TikTokTikTokAppId ${TIKTOK_IOS_TIKTOK_APP_ID}" "$PLIST"
            echo "✓ TikTok SDK credentials injected (App Secret, App ID, TikTok App ID)"
          else
            echo "⚠️  Set TIKTOK_IOS_APP_SECRET, TIKTOK_IOS_APP_ID, TIKTOK_IOS_TIKTOK_APP_ID in Codemagic (encrypt)"
          fi
      - name: Verify TikTok SDK configuration
        script: |
          PLIST="ios/App/App/Info.plist"
          TOKEN=$(/usr/libexec/PlistBuddy -c "Print :TikTokAccessToken" "$PLIST" 2>/dev/null || echo "")
          APP_ID=$(/usr/libexec/PlistBuddy -c "Print :TikTokAppId" "$PLIST" 2>/dev/null || echo "")
          TT_APP_ID=$(/usr/libexec/PlistBuddy -c "Print :TikTokTikTokAppId" "$PLIST" 2>/dev/null || echo "")
          ATT=$(/usr/libexec/PlistBuddy -c "Print :NSUserTrackingUsageDescription" "$PLIST" 2>/dev/null || echo "")
          if [ -z "$ATT" ]; then
            echo "✗ NSUserTrackingUsageDescription missing (required per TikTok SDK)"
            exit 1
          fi
          if [ -z "$TOKEN" ] || [ -z "$APP_ID" ] || [ -z "$TT_APP_ID" ] || echo "$TOKEN" | grep -q '^REPLACE_' || echo "$APP_ID" | grep -q '^REPLACE_' || echo "$TT_APP_ID" | grep -q '^REPLACE_'; then
            echo "⚠️  TikTok credentials missing or placeholder — SDK will not initialize"
          else
            echo "✓ TikTok App Secret, App ID, and TikTok App ID present (values not printed)"
          fi
          echo "✓ NSUserTrackingUsageDescription present"
      - name: Inject Meta SDK credentials
        script: |
          PLIST="ios/App/App/Info.plist"
          if [ -n "${META_IOS_APP_ID:-}" ] && [ -n "${META_IOS_CLIENT_TOKEN:-}" ]; then
            /usr/libexec/PlistBuddy -c "Set :FacebookAppID ${META_IOS_APP_ID}" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :FacebookClientToken ${META_IOS_CLIENT_TOKEN}" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 fb${META_IOS_APP_ID}" "$PLIST"
            echo "✓ Meta SDK keys injected into Info.plist"
          else
            echo "⚠️  META_IOS_APP_ID or META_IOS_CLIENT_TOKEN not set — Meta SDK will not initialize in this build"
          fi
      - name: Build for iOS Simulator
        script: |
          cd ios/App
          echo "Selecting an available iPhone Simulator device..."
          SIMULATOR_UDID=$(
            xcrun simctl list devices available |
              awk -F '[()]' '/iPhone/ && $2 ~ /[0-9A-F-]{36}/ { print $2; exit }'
          )
          if [ -z "$SIMULATOR_UDID" ]; then
            echo "Error: No available iPhone Simulator UDID found."
            xcrun simctl list devices available || true
            exit 1
          fi
          echo "Using simulator UDID: $SIMULATOR_UDID"
          if [ -f "App.xcworkspace" ]; then
            echo "Using workspace: App.xcworkspace"
            xcodebuild build \
              -workspace App.xcworkspace \
              -scheme App \
              -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" \
              -configuration Debug \
              CODE_SIGN_IDENTITY="" \
              CODE_SIGNING_REQUIRED=NO \
              CODE_SIGNING_ALLOWED=NO
          else
            echo "Workspace not found, using project directly"
            xcodebuild build \
              -project App.xcodeproj \
              -scheme App \
              -destination "platform=iOS Simulator,id=$SIMULATOR_UDID" \
              -configuration Debug \
              CODE_SIGN_IDENTITY="" \
              CODE_SIGNING_REQUIRED=NO \
              CODE_SIGNING_ALLOWED=NO
          fi
      - name: Find and prepare .app bundle
        script: |
          cd ios/App
          APP_PATH=$(find ~/Library/Developer/Xcode/DerivedData -name "App.app" -type d | head -1)
          if [ -z "$APP_PATH" ]; then
            APP_PATH=$(find build -name "App.app" -type d | head -1)
          fi
          if [ -z "$APP_PATH" ]; then
            echo "Error: App.app not found"
            exit 1
          fi
          echo "Found app at: $APP_PATH"
          mkdir -p ../../build/simulator
          cp -R "$APP_PATH" ../../build/simulator/
    artifacts:
      - build/simulator/*.app
    publishing:
      email:
        recipients:
          - user@example.com
        notify:
          success: true
          failure: false

  # Android: unsigned debug APK for emulator / Quick Launch (no Play signing). Mirror production VITE_* in Codemagic UI.
  android-emulator-workflow:
    name: Android Emulator Build (Quick Launch)
    max_build_duration: 120
    instance_type: linux_x2
    environment:
      node: 22.11.0
      java: 21
      vars:
        PACKAGE_NAME: "com.paletteplotting.app"
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Java and Android SDK (verify)
        script: |
          java -version
          echo "ANDROID_SDK_ROOT=${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
      - name: Build web assets
        script: |
          npm run build
      - name: Sync Capacitor Android
        script: |
          ./node_modules/.bin/cap sync android
      - name: Verify Android project structure
        script: |
          ls -la android/app/ || echo "android/app directory not found"
          test -f android/gradlew || (echo "✗ Error: android/gradlew not found" && exit 1)
          echo "✓ Android project ready"
      - name: Gradle SDK location
        script: |
          echo "sdk.dir=${ANDROID_SDK_ROOT:-$ANDROID_HOME}" > android/local.properties
      - name: Build debug APK for emulator
        script: |
          cd android
          chmod +x gradlew
          ./gradlew assembleDebug --stacktrace
      - name: List APK outputs
        script: |
          find android/app/build/outputs -name "*.apk" -type f | sort
    artifacts:
      - android/app/build/outputs/**/*.apk
    publishing:
      email:
        recipients:
          - user@example.com
        notify:
          success: true
          failure: false

  ios-workflow:
    name: iOS Build Workflow
    max_build_duration: 120
    instance_type: mac_mini_m2
    integrations:
      app_store_connect: Codemagic
    environment:
      vars:
        XCODE_SCHEME: "App"
        CM_APPLE_DEVELOPER_TEAM_ID: "WLPRRC5XX9"
        PROVISIONING_PROFILE_SPECIFIER: "Palette Plotting provisioning"
        VITE_REVENUECAT_IOS_API_KEY: "appl_mVsxTYvnkpFUmLDLcZgPlzBLzpB"
        # OneSignal: set in Codemagic UI (encrypted) for native push + in-app messaging.
        # VITE_ONESIGNAL_APP_ID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
        # TikTok App Events SDK — Events Manager "Initialize app" → TikTokConfig(accessToken:appId:tiktokAppId:)
        #   TIKTOK_IOS_APP_SECRET     → App Secret      → plist TikTokAccessToken → accessToken
        #   TIKTOK_IOS_APP_ID         → App ID (numeric) → plist TikTokAppId         → appId
        #   TIKTOK_IOS_TIKTOK_APP_ID  → TikTok App ID   → plist TikTokTikTokAppId  → tiktokAppId
        # Legacy: TIKTOK_IOS_ACCESS_TOKEN accepted as App Secret if APP_SECRET unset
        # Meta App Events (optional):
        #   META_IOS_APP_ID, META_IOS_CLIENT_TOKEN
      groups:
        - Production
      ios_signing:
        distribution_type: app_store
        bundle_identifier: com.paletteplotting.app
      node: 22.11.0
      xcode: latest
      cocoapods: default
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Xcode toolchain (verify)
        script: |
          xcodebuild -version
          xcode-select -print-path
      - name: Build web assets
        script: |
          npm run build
      - name: Sync Capacitor
        script: |
          ./node_modules/.bin/cap sync ios
      - name: Inject TikTok SDK credentials
        script: |
          PLIST="ios/App/App/Info.plist"
          APP_SECRET="${TIKTOK_IOS_APP_SECRET:-${TIKTOK_IOS_ACCESS_TOKEN:-}}"
          if [ -n "$APP_SECRET" ] && [ -n "${TIKTOK_IOS_APP_ID:-}" ] && [ -n "${TIKTOK_IOS_TIKTOK_APP_ID:-}" ]; then
            /usr/libexec/PlistBuddy -c "Set :TikTokAccessToken $APP_SECRET" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :TikTokAppId ${TIKTOK_IOS_APP_ID}" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :TikTokTikTokAppId ${TIKTOK_IOS_TIKTOK_APP_ID}" "$PLIST"
            echo "✓ TikTok SDK credentials injected (App Secret, App ID, TikTok App ID)"
          else
            echo "✗ Set TIKTOK_IOS_APP_SECRET, TIKTOK_IOS_APP_ID, TIKTOK_IOS_TIKTOK_APP_ID in Codemagic Production group (encrypt)"
            exit 1
          fi
      - name: Verify TikTok SDK configuration
        script: |
          PLIST="ios/App/App/Info.plist"
          TOKEN=$(/usr/libexec/PlistBuddy -c "Print :TikTokAccessToken" "$PLIST" 2>/dev/null || echo "")
          APP_ID=$(/usr/libexec/PlistBuddy -c "Print :TikTokAppId" "$PLIST" 2>/dev/null || echo "")
          TT_APP_ID=$(/usr/libexec/PlistBuddy -c "Print :TikTokTikTokAppId" "$PLIST" 2>/dev/null || echo "")
          ATT=$(/usr/libexec/PlistBuddy -c "Print :NSUserTrackingUsageDescription" "$PLIST" 2>/dev/null || echo "")
          if [ -z "$ATT" ]; then
            echo "✗ NSUserTrackingUsageDescription missing (required per TikTok SDK)"
            exit 1
          fi
          if [ -z "$TOKEN" ] || [ -z "$APP_ID" ] || [ -z "$TT_APP_ID" ] || echo "$TOKEN" | grep -q '^REPLACE_' || echo "$APP_ID" | grep -q '^REPLACE_' || echo "$TT_APP_ID" | grep -q '^REPLACE_'; then
            echo "✗ TikTok credentials missing or placeholder — fix Production group vars"
            exit 1
          fi
          echo "✓ TikTok App Secret, App ID, and TikTok App ID present (values not printed)"
          echo "✓ NSUserTrackingUsageDescription present"
      - name: Inject Meta SDK credentials
        script: |
          PLIST="ios/App/App/Info.plist"
          if [ -n "${META_IOS_APP_ID:-}" ] && [ -n "${META_IOS_CLIENT_TOKEN:-}" ]; then
            /usr/libexec/PlistBuddy -c "Set :FacebookAppID ${META_IOS_APP_ID}" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :FacebookClientToken ${META_IOS_CLIENT_TOKEN}" "$PLIST"
            /usr/libexec/PlistBuddy -c "Set :CFBundleURLTypes:0:CFBundleURLSchemes:0 fb${META_IOS_APP_ID}" "$PLIST"
            echo "✓ Meta SDK keys injected into Info.plist"
          else
            echo "⚠️  META_IOS_APP_ID or META_IOS_CLIENT_TOKEN not set — Meta SDK will not initialize in this build"
          fi
      - name: Verify iOS project structure
        script: |
          ls -la ios/App/ || echo "ios/App directory not found"
          if [ -f "ios/App/App.xcworkspace" ]; then
            echo "✓ Workspace found at ios/App/App.xcworkspace"
          elif [ -d "ios/App/App.xcodeproj" ]; then
            echo "✓ Project found at ios/App/App.xcodeproj"
            echo "Workspace should be created by Capacitor sync"
          else
            echo "✗ Error: iOS project not found"
            exit 1
          fi
      - name: Set up code signing settings on Xcode project
        script: |
          # Check if Apple Developer Team ID is configured
          if [ -z "${CM_APPLE_DEVELOPER_TEAM_ID}" ]; then
            echo "⚠️  WARNING: CM_APPLE_DEVELOPER_TEAM_ID not set"
            echo "⚠️  Code signing will fail. Set up Apple Developer account in Codemagic UI to continue."
            echo "⚠️  You can test the build up to this point without an Apple Developer account."
          else
            echo "✓ Apple Developer Team ID found: ${CM_APPLE_DEVELOPER_TEAM_ID}"
            xcode-project use-profiles
          fi
      - name: Build ipa for distribution
        script: |
          if [ -z "${CM_APPLE_DEVELOPER_TEAM_ID}" ]; then
            echo "⚠️  Skipping archive build - Apple Developer Team ID not configured"
            echo "⚠️  To enable builds:"
            echo "   1. Set up Apple Developer account ($99/year)"
            echo "   2. Configure code signing in Codemagic UI"
            echo "   3. Team ID will be automatically set"
            exit 0
          fi
          cd ios/App
          if [ -f "App.xcworkspace" ]; then
            echo "Using workspace: App.xcworkspace"
            xcodebuild archive \
              -workspace App.xcworkspace \
              -scheme App \
              -archivePath ../../build/App.xcarchive \
              -destination 'generic/platform=iOS' \
              -configuration Release \
              -allowProvisioningUpdates \
              -allowProvisioningDeviceRegistration
          else
            echo "Workspace not found, using project directly"
            xcodebuild archive \
              -project App.xcodeproj \
              -scheme App \
              -archivePath ../../build/App.xcarchive \
              -destination 'generic/platform=iOS' \
              -configuration Release \
              -allowProvisioningUpdates \
              -allowProvisioningDeviceRegistration
          fi
      - name: Export IPA
        script: |
          if [ -z "${CM_APPLE_DEVELOPER_TEAM_ID}" ]; then
            echo "⚠️  Skipping IPA export - Apple Developer Team ID not configured"
            exit 0
          fi
          # Generate export_options.plist dynamically
          cat > export_options.plist << 'PLISTEOF'
          <?xml version="1.0" encoding="UTF-8"?>
          <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
          <plist version="1.0">
          <dict>
              <key>method</key>
              <string>app-store</string>
              <key>teamID</key>
              <string>WLPRRC5XX9</string>
              <key>signingStyle</key>
              <string>manual</string>
              <key>provisioningProfiles</key>
              <dict>
                  <key>com.paletteplotting.app</key>
                  <string>Palette Plotting provisioning</string>
              </dict>
              <key>stripSwiftSymbols</key>
              <true/>
              <key>uploadSymbols</key>
              <true/>
          </dict>
          </plist>
          PLISTEOF
          xcodebuild -exportArchive \
            -archivePath build/App.xcarchive \
            -exportOptionsPlist export_options.plist \
            -exportPath build/ipa
    artifacts:
      - build/ipa/*.ipa
    publishing:
      email:
        recipients:
          - user@example.com  # Change to your email
        notify:
          success: true
          failure: false
      app_store_connect:
        auth: integration
        submit_to_testflight: true

  # Android: build signed AAB (upload to Play optional — see publishing comment below).
  # Prereqs in Codemagic UI:
  # 1) Teams → Code signing identities → Android → add upload keystore; reference name must match `android_signing` below.
  # 2) Environment variables / group: mirror production `VITE_*` from your build (at minimum `VITE_REVENUECAT_ANDROID_API_KEY`, Supabase URL/anon key, etc.).
  #    Push: add android/app/google-services.json (Firebase), then set VITE_ANDROID_PUSH_REGISTER=true in env so Android can call PushNotifications.register() without crashing.
  android-workflow:
    name: Android Release (AAB)
    max_build_duration: 120
    instance_type: linux_x2
    environment:
      android_signing:
        - paletteplotting_android
      node: 22.11.0
      java: 21
      vars:
        PACKAGE_NAME: "com.paletteplotting.app"
    scripts:
      - name: Install dependencies
        script: |
          npm ci
      - name: Build web assets
        script: |
          npm run build
      - name: Sync Capacitor Android
        script: |
          ./node_modules/.bin/cap sync android
      - name: Gradle SDK location
        script: |
          echo "sdk.dir=${ANDROID_SDK_ROOT:-$ANDROID_HOME}" > android/local.properties
      - name: Build Android App Bundle (release)
        script: |
          cd android
          chmod +x gradlew
          ./gradlew bundleRelease
    artifacts:
      - android/app/build/outputs/**/*.aab
    publishing:
      email:
        recipients:
          - user@example.com
        notify:
          success: true
          failure: false
      # Uncomment after adding Play Console API access + Codemagic variable `GCLOUD_SERVICE_ACCOUNT_CREDENTIALS` (service account JSON).
      # google_play:
      #   credentials: $GCLOUD_SERVICE_ACCOUNT_CREDENTIALS
      #   track: internal
      #   submit_as_draft: false
```

---

## index.html

```html
<!doctype html>
<html lang="en">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N6QFTP58');</script>
<!-- End Google Tag Manager -->
<!-- TikTok Pixel Code Start -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D5N27FBC77U6J0PHGJ1G');
  ttq.page({ content_id: window.location.pathname || '/' });
}(window, document, 'ttq');
</script>
<!-- TikTok Pixel Code End -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QQX552G8JN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-QQX552G8JN');
</script>
<meta charset="UTF-8" />
<!--
  `interactive-widget=overlays-content` tells Chrome / Android WebView to overlay the on-screen
  keyboard on top of existing layout instead of shrinking the visual viewport. Stops fixed footers
  (Back / Continue on onboarding form pages) from lifting above the keyboard. iOS WKWebView already
  behaves this way under Capacitor `KeyboardResize.None`, so this is a no-op on iOS.
-->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content" />
<meta name="color-scheme" content="light">
<script>
(function () {
  try {
    if (/Capacitor/i.test(navigator.userAgent)) {
      document.documentElement.classList.add("capacitor-native");
      var stored = localStorage.getItem("theme");
      var isDark = stored !== "light";
      if (isDark) document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      var bg = isDark ? "#0f0d14" : "#ffffff";
      document.documentElement.style.backgroundColor = bg;
    }
  } catch (e) {}
})();
</script>
<style>
/* Font smoothing */
* {
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

html {
-webkit-text-size-adjust: 100%;
text-size-adjust: 100%;
}

/* Prevent Android WebView filters - but allow normal theming */
html, body, #root {
filter: none !important;
}

/* Native app: respect light/dark appearance (dashboard + chat). */
html.capacitor-native.dark,
html.capacitor-native.dark body,
html.capacitor-native.dark #root {
color-scheme: dark;
background-color: #0f0d14 !important;
}

html.capacitor-native:not(.dark),
html.capacitor-native:not(.dark) body,
html.capacitor-native:not(.dark) #root {
color-scheme: light;
background-color: #ffffff !important;
}

html.capacitor-native[data-app-appearance="cosmic"],
html.capacitor-native[data-app-appearance="cosmic"] body,
html.capacitor-native[data-app-appearance="cosmic"] #root {
color-scheme: dark;
background-color: #0a0812 !important;
}

/* Light mode defaults (when no .dark class) */
html:not(.dark):not(.capacitor-native) {
color-scheme: light;
background-color: #ffffff;
}

html:not(.dark):not(.capacitor-native) body {
background-color: #ffffff;
}

/* Dark mode (when .dark class is present) */
html.dark {
color-scheme: dark;
background-color: #09090b;
}

html.dark body {
background-color: #09090b;
}
</style>
<title>Palette Plotting</title>
<meta name="description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta name="author" content="Palette Plotting" />
<meta name="keywords" content="affirmations, self-improvement, personal growth, goal setting, reflection, visualization, audio creation, Mirror Work, subliminal audio, AI affirmations" />
<link rel="canonical" href="https://paletteplot.com" />

<meta property="og:title" content="Palette Plotting" />
<meta property="og:description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://paletteplot.com" />
<meta property="og:site_name" content="Palette Plotting" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@paletteplotting" />
<meta name="twitter:title" content="Palette Plotting" />
<meta name="twitter:description" content="Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools." />

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#000000" />
    <meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Palette Plotting" />

<!--
  Apple Smart App Banner — shows a native banner at the top of mobile Safari
  with one-tap install / open. Only renders when Safari is the active browser
  (it's a no-op in TikTok / IG / FB webviews, but it's a major install lift
  for organic + retargeting traffic that does land in Safari).
  app-id derived from PALETTE_PLOTTING_APP_STORE_URL (id6759469696).
-->
<meta name="apple-itunes-app" content="app-id=6759469696" />

<!-- Manifest: mobile gets real manifest; desktop gets a blank manifest + SW unregister + SW register noop -->
<script>
(function() {
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// Remove any existing manifest links first
document.querySelectorAll('link[rel="manifest"]').forEach(l => l.remove());

const link = document.createElement('link');
link.rel = 'manifest';
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json,{}';
        // For desktop, use a minimal valid manifest to avoid parsing errors
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent('{"name":"","display":"browser"}');
document.head.appendChild(link);

// Unregister stale service workers on all devices (mobile PWA cache can serve old CSS/JS).
if ('serviceWorker' in navigator) {
navigator.serviceWorker.getRegistrations().then(function(regs) {
  regs.forEach(function(reg) { reg.unregister(); });
}).catch(function() {});
var originalRegister = navigator.serviceWorker.register ? navigator.serviceWorker.register.bind(navigator.serviceWorker) : null;
navigator.serviceWorker.register = function() {
console.warn('Service worker registration blocked to prevent stale homepage cache', arguments[0]);
return Promise.reject(new Error('SW registration blocked'));
};
if (navigator.serviceWorker.ready) {
navigator.serviceWorker.ready.catch(function() {});
}
}

// Viewport parity debug — open homepage with ?debug=viewport (console + optional on-screen overlay).
if (/[?&]debug=viewport/.test(window.location.search)) {
function logViewportDebug() {
  var vv = window.visualViewport;
  var moduleScript = document.querySelector('script[type="module"]');
  var cssLink = document.querySelector('link[rel="stylesheet"]');
  var payload = {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: vv ? vv.width : null,
    visualViewportScale: vv ? vv.scale : null,
    devicePixelRatio: window.devicePixelRatio,
    isMobileUa: isMobile,
    isMobileBreakpoint: window.innerWidth < 768,
    assetJs: moduleScript ? moduleScript.getAttribute('src') : null,
    assetCss: cssLink ? cssLink.getAttribute('href') : null,
    viewportMeta: document.querySelector('meta[name="viewport"]') ? document.querySelector('meta[name="viewport"]').getAttribute('content') : null,
  };
  console.info('[paletteplotting viewport debug]', payload);
  var el = document.getElementById('sv-viewport-debug');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'sv-viewport-debug';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:5rem;z-index:9999;margin:0;padding:8px;font:11px/1.35 monospace;background:rgba(0,0,0,0.88);color:#0f0;white-space:pre-wrap;pointer-events:none;max-height:40vh;overflow:auto;';
    document.body.appendChild(el);
  }
  el.textContent = JSON.stringify(payload, null, 2);
}
document.addEventListener('DOMContentLoaded', logViewportDebug);
window.addEventListener('resize', logViewportDebug);
if (window.visualViewport) window.visualViewport.addEventListener('resize', logViewportDebug);
}
})();
</script>
<script>
// Sync meta theme-color with dashboard appearance (PWA status bar, mobile browser chrome, Capacitor WebView).
(function() {
function syncStatusBar() {
var themeMeta = document.querySelector('meta[name="theme-color"]');
if (!themeMeta) return;

// Marketing pages: black chrome (status bar / safe area). Not dashboard, onboarding, or login.
function isMarketingSitePath(pathname) {
var path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
if (path === '/login') return false;
if (path.indexOf('/dashboard') === 0) return false;
if (path.indexOf('/onboarding') === 0) return false;
var exact = ['/', '/faq', '/what-is-palette-plotting', '/terms', '/privacy', '/acceptable-use', '/contact', '/billing', '/dmca'];
if (exact.indexOf(path) !== -1) return true;
if (path.indexOf('/blog') === 0) return true;
return false;
}
if (isMarketingSitePath(window.location.pathname)) {
themeMeta.setAttribute('content', '#000000');
var appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatus) appleStatus.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.backgroundColor = '#000000';
if (document.body) document.body.style.backgroundColor = '#000000';
if (document.documentElement.classList.contains('dark')) {
document.documentElement.classList.remove('dark');
}
return;
}

var path = window.location.pathname.replace(/\/$/, '') || '/';
if (path === '/onboarding/welcome' || path.indexOf('/onboarding/setup/') === 0) {
var onboardingShellBg = 'linear-gradient(180deg, #0a0812 0%, #0f0d14 50%, #0a0812 100%)';
themeMeta.setAttribute('content', '#0f0d14');
var appleOnboarding = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleOnboarding) appleOnboarding.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.setProperty('background', onboardingShellBg, 'important');
document.documentElement.style.setProperty('background-color', '#0f0d14', 'important');
if (document.body) {
document.body.style.setProperty('background', onboardingShellBg, 'important');
document.body.style.setProperty('background-color', '#0f0d14', 'important');
}
var onboardingRoot = document.getElementById('root');
if (onboardingRoot) {
onboardingRoot.style.setProperty('background', onboardingShellBg, 'important');
onboardingRoot.style.setProperty('background-color', '#0f0d14', 'important');
}
return;
}

document.documentElement.style.removeProperty('background');
document.documentElement.style.removeProperty('background-color');
if (document.body) {
document.body.style.removeProperty('background');
document.body.style.removeProperty('background-color');
}
var appRoot = document.getElementById('root');
if (appRoot) {
appRoot.style.removeProperty('background');
appRoot.style.removeProperty('background-color');
}
var appleStatusDefault = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');

var appearance = document.documentElement.getAttribute('data-app-appearance');
if (appearance === 'cosmic') {
themeMeta.setAttribute('content', '#0a0812');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
return;
}

if (path.indexOf('/dashboard') === 0) {
if (appearance === 'dark') {
themeMeta.setAttribute('content', '#0f0d14');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
} else {
themeMeta.setAttribute('content', '#ffffff');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');
document.documentElement.style.colorScheme = 'light';
}
return;
}

var isDark = document.documentElement.classList.contains('dark');
if (isDark) {
themeMeta.setAttribute('content', '#09090b');
return;
}

themeMeta.setAttribute('content', '#ffffff');
}

// Watch for theme / appearance changes (React sets data-app-appearance on the document element)
var observer = new MutationObserver(syncStatusBar);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-app-appearance'] });
syncStatusBar();

// Watch for route changes
let lastPath = window.location.pathname;
const checkRoute = () => {
if (window.location.pathname !== lastPath) {
lastPath = window.location.pathname;
syncStatusBar();
}
};
window.addEventListener('popstate', checkRoute);
setInterval(checkRoute, 100);

// Also sync after DOM is ready and after a delay (React needs time to set theme)
document.addEventListener('DOMContentLoaded', function() {
syncStatusBar();
setTimeout(syncStatusBar, 100);
setTimeout(syncStatusBar, 500);
});
})();
</script>
<link rel="apple-touch-icon" href="/icon-196.png" />
<link rel="icon" type="image/png" sizes="196x196" href="/icon-196.png?v=5" />
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=5" />
<link rel="shortcut icon" href="/icon-196.png?v=5" />

<link rel="preconnect" href="https://fonts.cdnfonts.com">
<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap" rel="stylesheet">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://paletteplot.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Palette Plotting",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today.",
  "url": "https://paletteplot.com"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-847-563-4944",
    "contactType": "customer service",
    "email": "support@paletteplot.com",
    "areaServed": "US",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1 North State Street Ste 1500",
    "addressLocality": "Chicago",
    "addressRegion": "IL",
    "postalCode": "60602",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://twitter.com/paletteplotting"
  ]
}
</script>

</head>

<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N6QFTP58"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<!-- Force remove dark class immediately on page load -->
<script>
(function() {
  // Remove dark class if it exists
  document.documentElement.classList.remove('dark');

  // Store the original add and remove methods
  const originalClassListAdd = DOMTokenList.prototype.add;
  const originalClassListRemove = DOMTokenList.prototype.remove;

  // Get the original classList descriptor
  const originalClassListDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'classList') || 
                                      Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList');
  
  // Override the classList property on Element.prototype
  Object.defineProperty(Element.prototype, 'classList', {
    get: function() {
      const self = this; // Capture the element instance
      
      // Get the actual classList using the original getter
      const actualClassList = originalClassListDescriptor ? 
                              originalClassListDescriptor.get.call(self) : 
                              self.classList;

      // Create a proxy for the classList that calls the original methods
      // with the correct context (the element's actual classList)
      const customClassList = {
        add: function(...args) {
          // Block dark class from being added to html element on non-dashboard pages
          if (self === document.documentElement &&
              args.includes('dark') &&
              !window.location.pathname.startsWith('/dashboard')) {
            console.log('Blocked dark class on non-dashboard page');
            return;
          }
          // Call the original add method, ensuring 'this' context is the actual classList
          return originalClassListAdd.apply(actualClassList, args);
        },
        remove: function(...args) {
          // Call the original remove method, ensuring 'this' context is the actual classList
          return originalClassListRemove.apply(actualClassList, args);
        },
        toggle: function(...args) {
          return actualClassList.toggle.apply(actualClassList, args);
        },
        contains: function(...args) {
          return actualClassList.contains.apply(actualClassList, args);
        },
        item: function(...args) {
          return actualClassList.item.apply(actualClassList, args);
        },
        replace: function(...args) {
          return actualClassList.replace.apply(actualClassList, args);
        },
        get length() {
          return actualClassList.length;
        },
        get value() {
          return actualClassList.value;
        },
        set value(val) {
          actualClassList.value = val;
        },
        forEach: function(...args) {
          return actualClassList.forEach.apply(actualClassList, args);
        },
        entries: function() {
          return actualClassList.entries();
        },
        keys: function() {
          return actualClassList.keys();
        },
        values: function() {
          return actualClassList.values();
        },
        [Symbol.iterator]: function() {
          return actualClassList[Symbol.iterator]();
        },
        toString: function() {
          return actualClassList.toString();
        }
      };

      return customClassList;
    },
    configurable: true, // Allow the property to be redefined
  });
})();
</script>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## src/lib/marketingConversionTrack.ts

```tsx
/**
 * Marketing conversion event helper.
 *
 * Fires the same event into:
 *   1. sessionStorage (debug breadcrumb, last 20 events)
 *   2. Google Analytics (gtag) — already loaded in index.html (G-QQX552G8JN)
 *   3. TikTok Pixel (ttq) — already loaded in index.html (D5N27FBC77U6J0PHGJ1G)
 *   4. dataLayer / GTM — for any downstream tags
 *
 * We map our internal action names to TikTok's standard events so the ads
 * algorithm can optimize. Without this, TikTok only sees PageView and the
 * algo can't learn which clicks lead to outcomes.
 *
 * Actions:
 *   - landing_view              -> ttq ViewContent
 *   - cta_app_store_click       -> ttq ClickButton + ttq Download
 *   - cta_play_store_click      -> ttq ClickButton + ttq Download
 *   - cta_web_onboarding_click  -> ttq ClickButton
 *   - cta_header_app_click      -> ttq ClickButton
 *   - in_app_prompt_shown       -> ttq ClickButton (proxy)
 *   - in_app_open_in_browser    -> ttq ClickButton (proxy)
 *   - newsletter_subscribe      -> ttq Subscribe + ttq CompleteRegistration
 *   - paywall_view              -> ttq InitiateCheckout
 *   - subscription_complete     -> ttq CompletePayment
 */

export type MarketingConversionAction =
  | "landing_view"
  | "cta_app_store_click"
  | "cta_play_store_click"
  | "cta_web_onboarding_click"
  | "cta_header_app_click"
  | "cta_full_features_click"
  | "in_app_prompt_shown"
  | "in_app_open_in_browser"
  | "in_app_copy_link"
  | "newsletter_subscribe"
  | "paywall_view"
  | "subscription_complete"
  /** Legacy / generic — kept so existing callers don't break. */
  | "store_click"
  | "web_onboarding_click";

const SESSION_KEY = "marketing_conversions_v1";

type EventDetail = Record<string, string | number | boolean | undefined>;

type TtqShape = {
  track?: (event: string, params?: EventDetail) => void;
  page?: (params?: EventDetail) => void;
};

type DataLayerShape = Array<Record<string, unknown>>;

function persistBreadcrumb(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ action, detail, at: new Date().toISOString() });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
}

function fireGtag(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", action, {
      event_category: "marketing_conversion",
      ...detail,
    });
  } catch {
    /* ignore */
  }
}

function fireDataLayer(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { dataLayer?: DataLayerShape };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: `marketing_${action}`, ...detail });
  } catch {
    /* ignore */
  }
}

function ttqEventsForAction(action: MarketingConversionAction): string[] {
  switch (action) {
    case "landing_view":
      return ["ViewContent"];
    case "cta_app_store_click":
    case "cta_play_store_click":
      return ["ClickButton", "Download"];
    case "cta_web_onboarding_click":
    case "cta_header_app_click":
    case "cta_full_features_click":
    case "in_app_prompt_shown":
    case "in_app_open_in_browser":
    case "in_app_copy_link":
    case "store_click":
    case "web_onboarding_click":
      return ["ClickButton"];
    case "newsletter_subscribe":
      return ["Subscribe", "CompleteRegistration"];
    case "paywall_view":
      return ["InitiateCheckout"];
    case "subscription_complete":
      return ["CompletePayment"];
  }
}

function fireTtq(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { ttq?: TtqShape };
    if (!w.ttq?.track) return;
    const events = ttqEventsForAction(action);
    for (const e of events) {
      w.ttq.track(e, {
        ...(detail ?? {}),
        action_name: action,
      });
    }
  } catch {
    /* ignore */
  }
}

export function trackMarketingConversion(
  action: MarketingConversionAction,
  detail?: EventDetail,
): void {
  persistBreadcrumb(action, detail);
  fireGtag(action, detail);
  fireTtq(action, detail);
  fireDataLayer(action, detail);
}
```

---

## src/lib/useMarketingAttribution.ts

```tsx
import { useEffect, useMemo, useState } from "react";

/**
 * Marketing attribution: read UTM params on mount, persist for the session,
 * and expose convenience flags (`isPaid`, `isFromTikTok`) for analytics only.
 * The homepage layout is identical for all visitors.
 *
 * Persists in sessionStorage so back-navigation / hash changes / route
 * changes during the session keep the attribution.
 */

const ATTRIBUTION_KEY = "marketing_attribution_v1";

const PAID_SOURCES = new Set([
  "tiktok",
  "tiktok-ads",
  "tiktokads",
  "tt",
  "facebook",
  "fb",
  "meta",
  "instagram",
  "ig",
  "snap",
  "snapchat",
  "reddit",
  "google-ads",
  "googleads",
  "youtube-ads",
  "pinterest-ads",
  "linkedin-ads",
]);

const PAID_MEDIUMS = new Set([
  "paid",
  "cpc",
  "ppc",
  "ads",
  "ad",
  "social-paid",
  "paid-social",
  "paidsocial",
  "display",
  "video",
]);

export type MarketingAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landing: string;
  at: string;
  /** True when source/medium look like a paid ad placement. */
  isPaid: boolean;
  isFromTikTok: boolean;
};

function readPersisted(): MarketingAttribution | null {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarketingAttribution>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmContent: parsed.utmContent ?? null,
      utmTerm: parsed.utmTerm ?? null,
      landing: parsed.landing ?? "/",
      at: parsed.at ?? new Date().toISOString(),
      isPaid: Boolean(parsed.isPaid),
      isFromTikTok: Boolean(parsed.isFromTikTok),
    };
  } catch {
    return null;
  }
}

function classify(source: string | null, medium: string | null) {
  const src = (source ?? "").toLowerCase().trim();
  const med = (medium ?? "").toLowerCase().trim();
  const isFromTikTok = src.includes("tiktok") || src === "tt";
  const isPaid = PAID_SOURCES.has(src) || PAID_MEDIUMS.has(med) || med.startsWith("paid");
  return { isPaid, isFromTikTok };
}

function readFromLocation(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const utmTerm = params.get("utm_term");

    if (!utmSource && !utmMedium && !utmCampaign) return null;

    const { isPaid, isFromTikTok } = classify(utmSource, utmMedium);

    return {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      landing: window.location.pathname || "/",
      at: new Date().toISOString(),
      isPaid,
      isFromTikTok,
    };
  } catch {
    return null;
  }
}

function persist(attribution: MarketingAttribution) {
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
}

export function useMarketingAttribution(): MarketingAttribution | null {
  const initial = useMemo(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = readFromLocation();
    if (fromUrl) {
      persist(fromUrl);
      return fromUrl;
    }
    return readPersisted();
  }, []);

  const [attribution, setAttribution] = useState<MarketingAttribution | null>(initial);

  useEffect(() => {
    const onPop = () => {
      const fromUrl = readFromLocation();
      if (fromUrl) {
        persist(fromUrl);
        setAttribution(fromUrl);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return attribution;
}

/** Read attribution outside React (e.g. inside event handlers or libs). */
export function readMarketingAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  const fromUrl = readFromLocation();
  if (fromUrl) {
    persist(fromUrl);
    return fromUrl;
  }
  return readPersisted();
}
```

---

## src/lib/marketingGetApp.ts

```tsx
import { Capacitor } from "@capacitor/core";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

export type MobileWebStore = "apple" | "google";

/** User-agent store hint for mobile browsers (not Capacitor native). */
export function getMobileWebStore(): MobileWebStore | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "google";
  if (/iPhone|iPad|iPod/i.test(ua)) return "apple";
  return null;
}

/** Desktop web = browser, wide viewport — show QR section instead of a store link. */
export function isDesktopMarketingWeb(isMobileViewport: boolean): boolean {
  return !Capacitor.isNativePlatform() && !isMobileViewport;
}

export type StoreClickResult =
  | { kind: "scrolled_to_qr" }
  | { kind: "opened_store"; store: MobileWebStore; url: string; copyUrl: string };

type StoreClickOptions = {
  isMobileViewport: boolean;
  forceStore?: MobileWebStore;
  source?: string;
  detection?: InAppBrowserDetection;
  /** When false, only track — navigation is handled by a native `<a href>`. */
  navigate?: boolean;
};

function readClickAttributionDetail(): Record<string, string | number | boolean | undefined> {
  const attribution = readMarketingAttribution();
  let ttclid: string | undefined;
  try {
    ttclid = new URLSearchParams(window.location.search).get("ttclid") ?? undefined;
  } catch {
    /* ignore */
  }
  return {
    utm_source: attribution?.utmSource ?? undefined,
    utm_medium: attribution?.utmMedium ?? undefined,
    utm_campaign: attribution?.utmCampaign ?? undefined,
    utm_content: attribution?.utmContent ?? undefined,
    utm_term: attribution?.utmTerm ?? undefined,
    is_paid: Boolean(attribution?.isPaid),
    from_tiktok: Boolean(attribution?.isFromTikTok),
    ttclid,
  };
}

export function trackStoreClick(
  store: MobileWebStore,
  source: string | undefined,
  detection: InAppBrowserDetection,
): { href: string; copyUrl: string } {
  const href = getMobileStoreHref(store, detection);
  const copyUrl = getCopyableStoreUrl(store);
  const action = store === "apple" ? "cta_app_store_click" : "cta_play_store_click";

  trackMarketingConversion(action, {
    source: source ?? "unknown",
    in_app_browser: detection.kind ?? "none",
    blocks_app_store: detection.blocksAppStore,
    store_href_scheme: href.split(":")[0],
    ...readClickAttributionDetail(),
  });

  logStoreHandoff("store_click_tracked", {
    source: source ?? "unknown",
    store,
    href,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    in_app_browser: detection.kind ?? "none",
    platform: detection.isIos ? "ios" : detection.isAndroid ? "android" : "unknown",
  });

  return { href, copyUrl };
}

/**
 * Centralized "user wants the app" handler.
 * Desktop → scroll to QR. Mobile → track (+ optional programmatic open).
 */
export function handleStoreClick(opts: StoreClickOptions): StoreClickResult {
  const { isMobileViewport, forceStore, source, navigate = true } = opts;
  const detection = opts.detection ?? detectInAppBrowser();

  if (isDesktopMarketingWeb(isMobileViewport)) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section",
      source: source ?? "unknown",
      ...readClickAttributionDetail(),
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const store =
    forceStore ??
    getMobileWebStore() ??
    (isMobileViewport ? ("apple" as MobileWebStore) : null);
  if (!store) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section_fallback",
      source: source ?? "unknown",
      ...readClickAttributionDetail(),
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const { href, copyUrl } = trackStoreClick(store, source, detection);

  if (navigate) {
    openMobileStoreViaAnchor(store, detection);
  }

  return { kind: "opened_store", store, url: href, copyUrl };
}

/** Legacy single-arg handler kept for back-compat with existing callers. */
export function handleMarketingGetAppClick(isMobileViewport: boolean): void {
  handleStoreClick({ isMobileViewport, source: "legacy" });
}

/** Whether a post-tap fallback sheet should be scheduled for this visit. */
export function shouldScheduleStoreFallback(
  isMobileViewport: boolean,
  detection: InAppBrowserDetection,
): boolean {
  if (!isMobileViewport || isDesktopMarketingWeb(isMobileViewport)) return false;
  if (!detection.isInAppBrowser) return false;
  return detection.blocksAppStore || detection.kind !== null;
}
```

---

## src/lib/inAppBrowserDetection.ts

```tsx
/**
 * In-app browser (a.k.a. social webview) detection.
 *
 * Why this exists: TikTok, Instagram, Facebook, Snapchat, LinkedIn etc. wrap
 * external links in their own embedded WebView. Those WebViews silently break
 * App Store / Play Store handoff (apps.apple.com / play.google.com), strip
 * referrers, block target="_blank", and disallow itms-apps:// schemes.
 *
 * For paid social traffic (TikTok especially) this is the single biggest
 * conversion leak — users tap "Download" and nothing happens.
 *
 * Mitigation: native store schemes on real `<a href>` tags (`itms-apps://`,
 * Play `intent://`) — see mobileStoreHandoff.ts.
 */

export type InAppBrowserKind =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "linkedin"
  | "twitter"
  | "pinterest"
  | "line"
  | "wechat"
  | "other";

export type InAppBrowserDetection = {
  isInAppBrowser: boolean;
  kind: InAppBrowserKind | null;
  /** True when this in-app browser is known to break apps.apple.com handoff. */
  blocksAppStore: boolean;
  /** Convenience: iOS detection — switches "Open in Safari" vs "Open in Chrome" copy. */
  isIos: boolean;
  /** Convenience: Android detection — switches Play Store fallback. */
  isAndroid: boolean;
};

const NULL_DETECTION: InAppBrowserDetection = {
  isInAppBrowser: false,
  kind: null,
  blocksAppStore: false,
  isIos: false,
  isAndroid: false,
};

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

function detectKind(ua: string): InAppBrowserKind | null {
  // TikTok signatures: "musical_ly", "Bytedance", "BytedanceWebview", "TikTok"
  if (/musical_ly|Bytedance|BytedanceWebview|TikTok/i.test(ua)) return "tiktok";

  // Instagram embeds "Instagram" string in UA
  if (/Instagram/i.test(ua)) return "instagram";

  // Facebook embeds "FBAN" (iOS) / "FBAV" / "FB_IAB" (Android)
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook";

  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/Pinterest/i.test(ua)) return "pinterest";
  if (/Line\//i.test(ua)) return "line";
  if (/MicroMessenger/i.test(ua)) return "wechat";

  return null;
}

/**
 * Detect at call-time. Cheap, no caching — UA can't change mid-session.
 * Server-rendering safe (returns a null detection).
 */
export function detectInAppBrowser(): InAppBrowserDetection {
  const ua = getUserAgent();
  if (!ua) return NULL_DETECTION;

  const kind = detectKind(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (!kind) {
    return { isInAppBrowser: false, kind: null, blocksAppStore: false, isIos, isAndroid };
  }

  /**
   * TikTok / Instagram / Facebook / Snapchat / WeChat WebViews block plain
   * https store URLs — use native schemes when these are detected.
   */
  const blocksAppStore = kind === "tiktok" || kind === "instagram" || kind === "facebook" || kind === "snapchat" || kind === "wechat";

  return { isInAppBrowser: true, kind, blocksAppStore, isIos, isAndroid };
}

/** Human-friendly label for the prompt copy, e.g. "TikTok". */
export function inAppBrowserLabel(kind: InAppBrowserKind): string {
  switch (kind) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "snapchat":
      return "Snapchat";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "X";
    case "pinterest":
      return "Pinterest";
    case "line":
      return "LINE";
    case "wechat":
      return "WeChat";
    case "other":
      return "this app";
  }
}
```

---

## src/lib/mobileStoreHandoff.ts

```tsx
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import type { InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import type { MobileWebStore } from "@/lib/marketingGetApp";

export const PALETTE_PLOTTING_APP_STORE_ID = "6759469696";
export const PALETTE_PLOTTING_ANDROID_PACKAGE = "com.paletteplotting.app";

/** Opens App Store app on iOS — preferred over https in embedded WebViews. */
export const ITMS_APP_STORE_URL = `itms-apps://itunes.apple.com/app/id${PALETTE_PLOTTING_APP_STORE_ID}`;

function buildAndroidPlayIntentUrl(fallbackHttps: string): string {
  const encodedFallback = encodeURIComponent(fallbackHttps);
  return `intent://play.google.com/store/apps/details?id=${PALETTE_PLOTTING_ANDROID_PACKAGE}#Intent;scheme=https;package=com.android.vending;S.browser_fallback_url=${encodedFallback};end`;
}

/**
 * Best href for a store badge / CTA on this device.
 *
 * In TikTok / Meta / IG WebViews, plain https store URLs often do nothing.
 * Native schemes (`itms-apps://`, Play `intent://`) on a real `<a>` tap are
 * the standard handoff — no instruction sheets required.
 */
export function getMobileStoreHref(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): string {
  const inRestrictedWebView = Boolean(detection?.isInAppBrowser && detection.blocksAppStore);

  if (store === "apple") {
    if (inRestrictedWebView && detection?.isIos) return ITMS_APP_STORE_URL;
    return PALETTE_PLOTTING_APP_STORE_URL;
  }

  if (inRestrictedWebView && detection?.isAndroid) {
    return buildAndroidPlayIntentUrl(PALETTE_PLOTTING_GOOGLE_PLAY_URL);
  }
  return PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** HTTPS URL for clipboard — always paste-friendly in Safari/Chrome. */
export function getCopyableStoreUrl(store: MobileWebStore): string {
  return store === "apple" ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** Fallback when a button (not an anchor) triggers store open — clicks a transient link. */
export function openMobileStoreViaAnchor(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): void {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = getMobileStoreHref(store, detection);
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
```

---

## src/lib/mobileStoreFallbackScheduler.ts

```tsx
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";

export const STORE_FALLBACK_DELAY_MS = 900;

type ScheduleStoreFallbackOptions = {
  onShow: () => void;
  meta?: Record<string, string | undefined>;
};

export type StoreFallbackScheduleHandle = {
  cancel: (reason: string) => void;
};

export function scheduleStoreFallbackCheck(
  options: ScheduleStoreFallbackOptions,
): StoreFallbackScheduleHandle {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (reason: string) => {
    if (cancelled) return;
    cancelled = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("blur", onBlur);
    logStoreHandoff("fallback_cancelled", { reason, ...options.meta });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      cancel("visibilitychange");
    }
  };

  const onPageHide = () => cancel("pagehide");
  const onBlur = () => cancel("blur");

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("blur", onBlur);

  logStoreHandoff("fallback_timer_started", {
    delay_ms: STORE_FALLBACK_DELAY_MS,
    ...options.meta,
  });

  timer = setTimeout(() => {
    if (cancelled) return;
    if (document.visibilityState === "visible") {
      logStoreHandoff("fallback_timer_fired_visible", options.meta);
      options.onShow();
    } else {
      logStoreHandoff("fallback_timer_fired_hidden", options.meta);
    }
    cancel("timer-complete");
  }, STORE_FALLBACK_DELAY_MS);

  return { cancel };
}
```

---

## src/lib/mobileStoreHandoffDebug.ts

```tsx
type StoreHandoffDebugPayload = Record<string, string | number | boolean | null | undefined>;

const DEBUG_QUERY = "debug=store";
const DEBUG_STORAGE_KEY = "marketing_store_debug";

export function isStoreHandoffDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    if (window.location.search.includes(DEBUG_QUERY)) return true;
    if (localStorage.getItem(DEBUG_STORAGE_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function logStoreHandoff(event: string, payload?: StoreHandoffDebugPayload): void {
  if (!isStoreHandoffDebugEnabled()) return;
  console.log("[store-handoff]", event, payload ?? {});
}
```

---

## src/hooks/useMarketingStoreCta.tsx

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MobileStoreFallbackSheet } from "@/components/marketing/MobileStoreFallbackSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getMobileWebStore,
  handleStoreClick,
  isDesktopMarketingWeb,
  shouldScheduleStoreFallback,
  type MobileWebStore,
  type StoreClickResult,
} from "@/lib/marketingGetApp";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scheduleStoreFallbackCheck, type StoreFallbackScheduleHandle } from "@/lib/mobileStoreFallbackScheduler";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

type FallbackState = {
  store: MobileWebStore;
  storeUrl: string;
  source: string;
};

export type UseStoreCtaResult = {
  detection: InAppBrowserDetection;
  getStoreHref: (store: MobileWebStore) => string;
  primaryStoreHref: string;
  primaryStore: MobileWebStore;
  onStoreClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
  /** @deprecated use onStoreClick */
  onCtaClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
};

type ProviderState = UseStoreCtaResult & {
  fallbackOpen: boolean;
  fallbackState: FallbackState | null;
  closeFallback: () => void;
  tryAgain: () => void;
  copyStoreLink: () => Promise<boolean>;
};

const MarketingStoreCtaContext = createContext<UseStoreCtaResult | null>(null);

function useMarketingStoreCtaInternal(isMobileViewport: boolean): ProviderState {
  const [detection, setDetection] = useState<InAppBrowserDetection>(() => detectInAppBrowser());
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackState, setFallbackState] = useState<FallbackState | null>(null);
  const fallbackTimerRef = useRef<StoreFallbackScheduleHandle | null>(null);

  useEffect(() => {
    const next = detectInAppBrowser();
    setDetection(next);
    logStoreHandoff("detection_ready", {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      in_app_browser: next.kind ?? "none",
      blocks_app_store: next.blocksAppStore,
      platform: next.isIos ? "ios" : next.isAndroid ? "android" : "unknown",
    });
  }, []);

  const cancelFallbackTimer = useCallback((reason: string) => {
    fallbackTimerRef.current?.cancel(reason);
    fallbackTimerRef.current = null;
  }, []);

  const closeFallback = useCallback(() => {
    setFallbackOpen(false);
    setFallbackState(null);
  }, []);

  const openFallback = useCallback((state: FallbackState) => {
    setFallbackState(state);
    setFallbackOpen(true);
    trackMarketingConversion("in_app_prompt_shown", {
      source: state.source,
      store: state.store,
    });
    logStoreHandoff("fallback_sheet_opened", {
      source: state.source,
      store: state.store,
      storeUrl: state.storeUrl,
    });
  }, []);

  const scheduleFallback = useCallback(
    (store: MobileWebStore, source: string) => {
      if (!shouldScheduleStoreFallback(isMobileViewport, detection)) return;

      cancelFallbackTimer("reschedule");
      const copyUrl = getCopyableStoreUrl(store);

      fallbackTimerRef.current = scheduleStoreFallbackCheck({
        meta: { source, store },
        onShow: () => openFallback({ store, storeUrl: copyUrl, source }),
      });
    },
    [cancelFallbackTimer, detection, isMobileViewport, openFallback],
  );

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  const primaryStore = useMemo(
    () => getMobileWebStore() ?? ("apple" as MobileWebStore),
    [],
  );

  const primaryStoreHref = useMemo(
    () => getMobileStoreHref(primaryStore, detection),
    [detection, primaryStore],
  );

  const onStoreClick = useCallback(
    (source: string, forceStore?: MobileWebStore) => {
      const isDesktop = isDesktopMarketingWeb(isMobileViewport);
      const result = handleStoreClick({
        isMobileViewport,
        forceStore,
        source,
        detection,
        navigate: isDesktop,
      });

      if (!isDesktop && result.kind === "opened_store") {
        scheduleFallback(result.store, source);
      }

      return result;
    },
    [detection, isMobileViewport, scheduleFallback],
  );

  const tryAgain = useCallback(() => {
    if (!fallbackState) return;
    trackMarketingConversion("in_app_open_in_browser", {
      source: fallbackState.source,
      store: fallbackState.store,
      action: "try_again",
    });
    openMobileStoreViaAnchor(fallbackState.store, detection);
    scheduleFallback(fallbackState.store, fallbackState.source);
  }, [detection, fallbackState, scheduleFallback]);

  const copyStoreLink = useCallback(async (): Promise<boolean> => {
    if (!fallbackState) return false;
    try {
      await navigator.clipboard.writeText(fallbackState.storeUrl);
      trackMarketingConversion("in_app_copy_link", {
        source: fallbackState.source,
        store: fallbackState.store,
      });
      return true;
    } catch {
      return false;
    }
  }, [fallbackState]);

  useEffect(() => () => cancelFallbackTimer("unmount"), [cancelFallbackTimer]);

  return {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick: onStoreClick,
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
  };
}

export function MarketingStoreCtaProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const state = useMarketingStoreCtaInternal(isMobile);
  const {
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  } = state;

  const ctxValue: UseStoreCtaResult = {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  };

  return (
    <MarketingStoreCtaContext.Provider value={ctxValue}>
      {children}
      {!isDesktopMarketingWeb(isMobile) && fallbackState ? (
        <MobileStoreFallbackSheet
          open={fallbackOpen}
          store={fallbackState.store}
          storeUrl={fallbackState.storeUrl}
          browserKind={state.detection.kind}
          isIos={state.detection.isIos}
          onClose={closeFallback}
          onTryAgain={tryAgain}
          onCopy={copyStoreLink}
        />
      ) : null}
    </MarketingStoreCtaContext.Provider>
  );
}

export function useMarketingStoreCta(): UseStoreCtaResult {
  const ctx = useContext(MarketingStoreCtaContext);
  if (!ctx) {
    throw new Error("useMarketingStoreCta must be used within MarketingStoreCtaProvider");
  }
  return ctx;
}
```

---

## src/components/marketing/MobileStoreFallbackSheet.tsx

```tsx
import { useEffect, useRef, useState } from "react";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { inAppBrowserLabel, type InAppBrowserKind } from "@/lib/inAppBrowserDetection";

type MobileStoreFallbackSheetProps = {
  open: boolean;
  store: MobileWebStore;
  storeUrl: string;
  browserKind: InAppBrowserKind | null;
  isIos: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onCopy: () => Promise<boolean>;
};

export function MobileStoreFallbackSheet({
  open,
  store,
  storeUrl,
  browserKind,
  isIos,
  onClose,
  onTryAgain,
  onCopy,
}: MobileStoreFallbackSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShowUrlFallback(false);
    }
  }, [open]);

  if (!open) return null;

  const browserName = browserKind ? inAppBrowserLabel(browserKind) : "this app";
  const isApple = store === "apple";
  const title = isApple ? "App Store did not open?" : "Play Store did not open?";
  const bodyCopy = isIos
    ? `${browserName} may have blocked the App Store link. Tap copy, then open Safari and paste.`
    : `${browserName} may have blocked the Play Store link. Tap copy, then open Chrome and paste.`;

  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      return;
    }
    setShowUrlFallback(true);
    requestAnimationFrame(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    });
  };

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-labelledby="store-fallback-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10",
          "bg-[#0a0608]/97 px-4 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]",
          "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 id="store-fallback-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-white/65">{bodyCopy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-full bg-white text-sm font-semibold text-[#120810] hover:bg-white/90"
            onClick={onTryAgain}
          >
            {isApple ? "Try opening App Store again" : "Try opening Play Store again"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-full border-white/20 bg-transparent text-sm font-medium text-white hover:bg-white/10"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy app link"}
          </Button>

          {showUrlFallback ? (
            <input
              ref={urlInputRef}
              readOnly
              value={storeUrl}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80"
              aria-label="App store link"
            />
          ) : null}

          <p className="text-center text-[11px] leading-snug text-white/45">
            If {browserName} keeps blocking it, open {isIos ? "Safari" : "Chrome"} and paste the copied link.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## src/pages/Index.tsx

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MarketingCosmicBackground, MarketingBottomPinkGlow } from "@/components/marketing/MarketingCosmicBackground";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { MarketingToolsStrip } from "@/components/marketing/MarketingToolsStrip";
import { MarketingPracticeTopics } from "@/components/marketing/MarketingPracticeTopics";
import { MarketingStats } from "@/components/marketing/MarketingStats";
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials";
import { MarketingAppScreenshotsTicker } from "@/components/marketing/MarketingAppScreenshotsTicker";
import { SHOW_MARKETING_SCREENSHOTS_TICKER } from "@/components/marketing/marketingLayout";
import { MarketingNewsletterSignup } from "@/components/marketing/MarketingNewsletterSignup";
import { MarketingAppDownload } from "@/components/marketing/MarketingAppDownload";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingStickyDownloadBar } from "@/components/marketing/MarketingStickyDownloadBar";
import { MarketingStoreCtaProvider } from "@/hooks/useMarketingStoreCta";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingAttribution } from "@/lib/useMarketingAttribution";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { scrollToNewsletter } from "@/lib/scrollToNewsletter";
import { MARKETING_COSMIC_BASE } from "@/components/marketing/marketingVisualTheme";
import { logMarketingViewportDebug } from "@/lib/marketingViewportDebug";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const isMobile = useIsMobile();
  const attribution = useMarketingAttribution();

  useEffect(() => {
    logMarketingViewportDebug(isMobile);
  }, [isMobile]);

  useEffect(() => {
    trackMarketingConversion("landing_view", {
      utm_source: attribution?.utmSource ?? "none",
      utm_medium: attribution?.utmMedium ?? "none",
      utm_campaign: attribution?.utmCampaign ?? "none",
      is_paid: Boolean(attribution?.isPaid),
      from_tiktok: Boolean(attribution?.isFromTikTok),
      viewport: isMobile ? "mobile" : "desktop",
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    const scrollIfHash = () => {
      if (window.location.hash === "#download-app") {
        requestAnimationFrame(() => scrollToDownloadApp());
      } else if (window.location.hash === "#newsletter") {
        requestAnimationFrame(() => scrollToNewsletter());
      }
    };

    scrollIfHash();
    window.addEventListener("hashchange", scrollIfHash);
    return () => window.removeEventListener("hashchange", scrollIfHash);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setUserEmail(user.email || "");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        if (profileData.username) setUsername(profileData.username);
        setAvatarUrl(profileData.avatar_url || "");
      }
    };
    void fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "global" });
    await supabase.auth.signOut({ scope: "local" });
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    navigate("/", { replace: true });
  };

  return (
    <main
      className="relative flex min-h-screen flex-col font-sans antialiased text-white"
      style={{
        colorScheme: "dark",
        backgroundColor: MARKETING_COSMIC_BASE,
        paddingBottom: isMobile
          ? "calc(5.25rem + env(safe-area-inset-bottom, 0px))"
          : undefined,
      }}
    >
      {/* Site-wide starfield — black + white specks; pink glow only at bottom */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <MarketingCosmicBackground className="absolute inset-0" />
        <MarketingBottomPinkGlow className="fixed inset-x-0 bottom-0 z-0 h-48 sm:h-56" />
      </div>

      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          background: MARKETING_COSMIC_BASE,
        }}
        aria-hidden
      />
      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingStoreCtaProvider>
          <MarketingHeader
            user={user}
            isLoading={isLoading}
            username={username}
            avatarUrl={avatarUrl}
            userEmail={userEmail}
            onLogout={handleLogout}
          />
          <MarketingHero />

          <MarketingToolsStrip />
          {SHOW_MARKETING_SCREENSHOTS_TICKER ? <MarketingAppScreenshotsTicker /> : null}
          <MarketingTestimonials />
          <MarketingPracticeTopics />
          <MarketingStats />
          <MarketingAppDownload />
          <MarketingNewsletterSignup />
          <MarketingFooter />
          {isMobile ? <MarketingStickyDownloadBar /> : null}
        </MarketingStoreCtaProvider>
      </div>
    </main>
  );
};

export default Index;
```

---

