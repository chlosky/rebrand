# Tracking Permission Handoff

## `src/pages/onboarding/setup/NotificationPrePermission.tsx`

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { TrackingAuthorization } from "@/plugins/trackingAuthorization";
import {
  isAndroidPushRegisterEnabled,
  requestNativePushPermission,
} from "@/services/pushNotifications";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";

export default function SetupNotificationPrePermission() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showTrackingPermission = isNative && Capacitor.getPlatform() === "ios";
  /** No default — user must tap an option; native prompt only after “Turn on reminders”. */
  const [choice, setChoice] = useState<"on" | "off" | null>(null);
  const [trackingChoice, setTrackingChoice] = useState<"yes" | "no" | null>(null);

  const requestTrackingPermission = async (nextChoice: "yes" | "no") => {
    setTrackingChoice(nextChoice);

    if (!showTrackingPermission) return;

    try {
      const result = await TrackingAuthorization.request();
      console.log("[TrackingAuthorization] status:", result.status);
    } catch (error) {
      console.warn("[TrackingAuthorization] request failed:", error);
    }
  };

  return (
    <SetupPage
      canContinue={choice !== null && (!showTrackingPermission || trackingChoice !== null)}
      onBack={() =>
        navigate(isSuiteFunnel ? `${setupBase}/guide` : `${setupBase}/begin-journey`)
      }
      onContinue={() => {
        if (!choice) return;
        const d = readSetupDraft();
        const prev =
          d.conditionalSpecificity && typeof d.conditionalSpecificity === "object"
            ? d.conditionalSpecificity
            : {};
        writeSetupDraft({
          conditionalSpecificity: { ...prev, notifications: choice },
          appNotificationsConsent: choice === "on",
        });
        navigate(
          isSuiteFunnel ? `${setupBase}/tool-preference` : `${setupBase}/plot-loading`,
        );
      }}
      continueText="Continue"
    >
      <SetupHeadingBlock
        centered
        title={showTrackingPermission ? "Turn on Permissions" : "Want reminders from Palette Plotting?"}
        subtitle={
          showTrackingPermission
            ? "Choose how Palette Plotting can support your app experience."
            : "Palette Plotting can remind you to return to the app to continue to affirm, listen to subliminals and more."
        }
      />

      <div className="relative z-[1] pt-8 space-y-3">
        {showTrackingPermission && (
          <div className="space-y-1 pb-1">
            <p className="font-sans text-sm font-semibold text-white">Notification Permissions</p>
            <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
              Palette Plotting can remind you to return to the app to continue to affirm, listen to subliminals and more.
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => {
            setChoice("on");
            if (Capacitor.isNativePlatform()) {
              void requestNativePushPermission();
            }
          }}
          className={setupTextChoiceTileClass(choice === "on")}
          style={choice === "on" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
        >
          <span className="font-sans text-base font-medium text-white">Turn on reminders</span>
          {choice === "on" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-white/35" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setChoice("off")}
          className={setupTextChoiceTileClass(choice === "off")}
          style={choice === "off" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
        >
          <span className="font-sans text-base font-medium text-white">Not now</span>
          {choice === "off" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-white/35" />
          )}
        </button>

        <p className={cn("pt-2 text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {isNative && Capacitor.getPlatform() === "ios"
            ? "We’ll only show the native permission prompt if you tap “Turn on reminders.”"
            : isNative && Capacitor.getPlatform() === "android"
              ? isAndroidPushRegisterEnabled()
                ? "We’ll only show the native permission prompt if you tap “Turn on reminders.”"
                : "We’ll save your choice when you tap Continue."
              : "Reminder permissions are available in the native app."}
        </p>

        {showTrackingPermission && (
          <div className="space-y-3 pt-7">
            <div className="space-y-1 pb-1">
              <p className="font-sans text-sm font-semibold text-white">
                Help Us Improve Palette Plotting
              </p>
              <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
                Palette Plotting uses app activity data to measure ad performance and improve experience. Will you help us improve Palette Plotting?
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => requestTrackingPermission("yes")}
                className={setupTextChoiceTileClass(trackingChoice === "yes")}
                style={trackingChoice === "yes" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className="font-sans text-base font-medium text-white">Yes</span>
                {trackingChoice === "yes" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/35" />
                )}
              </button>
              <button
                type="button"
                onClick={() => setTrackingChoice("no")}
                className={setupTextChoiceTileClass(trackingChoice === "no")}
                style={trackingChoice === "no" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className="font-sans text-base font-medium text-white">No</span>
                {trackingChoice === "no" ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/35" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </SetupPage>
  );
}
```

## `src/plugins/trackingAuthorization.ts`

```ts
import { registerPlugin } from "@capacitor/core";

export type TrackingAuthorizationStatus =
  | "authorized"
  | "denied"
  | "restricted"
  | "notDetermined"
  | "requested"
  | "unavailable"
  | "unknown";

export interface TrackingAuthorizationPlugin {
  request(): Promise<{ status: TrackingAuthorizationStatus }>;
}

export const TrackingAuthorization = registerPlugin<TrackingAuthorizationPlugin>(
  "TrackingAuthorization",
  {
    web: () => ({
      request: async () => ({ status: "unavailable" }),
    }),
  },
);
```

## `ios/App/CapApp-SPM/Sources/CapApp-SPM/TrackingAuthorizationPlugin.swift`

```swift
import AppTrackingTransparency
import Capacitor
import Foundation
import UIKit

@objc(TrackingAuthorizationPlugin)
public class TrackingAuthorizationPlugin: CAPPlugin, CAPBridgedPlugin {
    public let identifier = "TrackingAuthorizationPlugin"
    public let jsName = "TrackingAuthorization"
    public let pluginMethods: [CAPPluginMethod] = [
        CAPPluginMethod(name: "request", returnType: CAPPluginReturnPromise)
    ]

    @objc func request(_ call: CAPPluginCall) {
        guard #available(iOS 14, *) else {
            call.resolve(["status": "unavailable"])
            return
        }

        DispatchQueue.main.async {
            guard UIApplication.shared.applicationState == .active else {
                call.resolve(["status": "unavailable"])
                return
            }

            let currentStatus = ATTrackingManager.trackingAuthorizationStatus

            guard currentStatus == .notDetermined else {
                call.resolve(["status": self.mapStatus(currentStatus)])
                return
            }

            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    call.resolve(["status": self.mapStatus(status)])
                }
            }
        }
    }

    private func mapStatus(_ status: ATTrackingManager.AuthorizationStatus) -> String {
        switch status {
        case .authorized:
            return "authorized"
        case .denied:
            return "denied"
        case .restricted:
            return "restricted"
        case .notDetermined:
            return "notDetermined"
        @unknown default:
            return "unknown"
        }
    }
}
```

## `ios/App/App/AppDelegate.swift`

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
        // Sent when the application is about to move from active to inactive state. This can occur for certain types of temporary interruptions such as an incoming phone call or SMS message or when the user quits.
        // Use this method to pause ongoing tasks, disable timers, and invalidate graphics rendering callbacks. Games should use this method to pause the game.
    }

    func applicationDidEnterBackground(_ application: UIApplication) {
        // Use this method to release shared resources, save user data, invalidate timers, and store enough application state information to restore the app later.
    }

    func applicationWillEnterForeground(_ application: UIApplication) {
        // Called as part of the transition from the background to the active state.
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

    private static func plistString(_ key: String) -> String? {
        guard let value = Bundle.main.object(forInfoDictionaryKey: key) as? String else { return nil }
        let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
        return trimmed.isEmpty ? nil : trimmed
    }
}
```

## `ios/App/App/Info.plist`

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
	<string>Palette Plotting uses this permission to measure app installs and subscriptions from ads on TikTok so we can improve our marketing. Your data is not sold.</string>
	<key>TikTokAccessToken</key>
	<string>REPLACE_WITH_APP_SECRET</string>
	<key>TikTokAppId</key>
	<string>REPLACE_WITH_APP_ID</string>
	<key>TikTokTikTokAppId</key>
	<string>REPLACE_WITH_TIKTOK_APP_ID</string>
</dict>
</plist>
```
