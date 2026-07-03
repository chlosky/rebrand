# ATT Code Handoff

## Summary

ATT is requested from the onboarding permissions screen only.

- Yes on "Help Us Improve Palette Plotting" requests Apple ATT.
- No records the choice and does not request ATT.
- Apple ATT is requested directly with `ATTrackingManager.requestTrackingAuthorization` from a user-initiated pending request.
- `TrackingAuthorizationPlugin` is explicitly registered in `NativeBridgeViewController`.
- TikTok SDK initialization is separate and does not gate ATT.
- Codemagic injects TikTok SDK credentials into `Info.plist` during iOS builds.

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
  const showTrackingPermission = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  /** No default — user must tap an option; native prompt only after “Turn on reminders”. */
  const [choice, setChoice] = useState<"on" | "off" | null>(null);
  const [trackingChoice, setTrackingChoice] = useState<"yes" | "no" | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [trackingAskedAt, setTrackingAskedAt] = useState<string | null>(null);

  const requestTrackingPermission = async () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("yes");
    setTrackingAskedAt(askedAt);

    if (!showTrackingPermission) {
      return;
    }

    try {
      const result = await TrackingAuthorization.request();
      setTrackingStatus(result.status);
      void writeSetupDraft({
        trackingPrePermissionChoice: "yes",
        trackingAuthorizationStatus: result.status,
        trackingPermissionAskedAt: askedAt,
      });
      console.log("[TrackingAuthorization] status:", result.status);
    } catch (error) {
      setTrackingStatus("unknown");
      void writeSetupDraft({
        trackingPrePermissionChoice: "yes",
        trackingAuthorizationStatus: "unknown",
        trackingPermissionAskedAt: askedAt,
      });
      console.warn("[TrackingAuthorization] request failed:", error);
    }
  };

  const declineTrackingPermission = () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("no");
    setTrackingStatus("notRequested");
    setTrackingAskedAt(askedAt);
    void writeSetupDraft({
      trackingPrePermissionChoice: "no",
      trackingAuthorizationStatus: "notRequested",
      trackingPermissionAskedAt: askedAt,
    });
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
          trackingPrePermissionChoice: trackingChoice ?? d.trackingPrePermissionChoice ?? null,
          trackingAuthorizationStatus: trackingStatus ?? d.trackingAuthorizationStatus ?? null,
          trackingPermissionAskedAt: trackingAskedAt ?? d.trackingPermissionAskedAt ?? null,
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
            ? "We’ll only ask for reminder permission if you tap “Turn on reminders.”"
            : isNative && Capacitor.getPlatform() === "android"
              ? isAndroidPushRegisterEnabled()
                ? "We’ll only ask for reminder permission if you tap “Turn on reminders.”"
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
                onClick={() => requestTrackingPermission()}
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
                onClick={declineTrackingPermission}
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

## `ios/App/CapApp-SPM/Sources/CapApp-SPM/NativeBridgeViewController.swift`

```swift
import UIKit
import Capacitor

@objc(NativeBridgeViewController)
public class NativeBridgeViewController: CAPBridgeViewController {
    public override func capacitorDidLoad() {
        super.capacitorDidLoad()
        bridge?.registerPluginInstance(NativeMirrorPlugin())
        bridge?.registerPluginInstance(OpenExternalSystemUrlPlugin())
        bridge?.registerPluginInstance(TrackingAuthorizationPlugin())
    }
}
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

    private var pendingCall: CAPPluginCall?
    private var didAddActiveObserver = false

    @objc func request(_ call: CAPPluginCall) {
        guard #available(iOS 14, *) else {
            call.resolve(["status": "unavailable"])
            return
        }

        DispatchQueue.main.async {
            let currentStatus = ATTrackingManager.trackingAuthorizationStatus
            NSLog("[TrackingAuthorization] request called. status=\(self.mapStatus(currentStatus)), appState=\(UIApplication.shared.applicationState.rawValue)")

            guard currentStatus == .notDetermined else {
                call.resolve(["status": self.mapStatus(currentStatus)])
                return
            }

            self.pendingCall = call
            self.addActiveObserverIfNeeded()

            if UIApplication.shared.applicationState == .active {
                self.firePendingRequestAfterDelay()
            } else {
                NSLog("[TrackingAuthorization] app not active, waiting for didBecomeActive")
            }
        }
    }

    private func addActiveObserverIfNeeded() {
        guard !didAddActiveObserver else { return }
        didAddActiveObserver = true

        NotificationCenter.default.addObserver(
            self,
            selector: #selector(handleDidBecomeActive),
            name: UIApplication.didBecomeActiveNotification,
            object: nil
        )
    }

    @objc private func handleDidBecomeActive() {
        NSLog("[TrackingAuthorization] didBecomeActive received")
        firePendingRequestAfterDelay()
    }

    private func firePendingRequestAfterDelay() {
        guard #available(iOS 14, *) else { return }
        guard pendingCall != nil else { return }

        DispatchQueue.main.asyncAfter(deadline: .now() + 0.75) {
            guard #available(iOS 14, *) else { return }
            guard let call = self.pendingCall else { return }

            let currentStatus = ATTrackingManager.trackingAuthorizationStatus
            NSLog("[TrackingAuthorization] firing after delay. status=\(self.mapStatus(currentStatus)), appState=\(UIApplication.shared.applicationState.rawValue)")

            guard UIApplication.shared.applicationState == .active else {
                NSLog("[TrackingAuthorization] still not active, waiting")
                return
            }

            guard currentStatus == .notDetermined else {
                self.pendingCall = nil
                call.resolve(["status": self.mapStatus(currentStatus)])
                return
            }

            ATTrackingManager.requestTrackingAuthorization { status in
                DispatchQueue.main.async {
                    NSLog("[TrackingAuthorization] final status=\(self.mapStatus(status))")
                    self.pendingCall = nil
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
<key>NSUserTrackingUsageDescription</key>
<string>Palette Plotting uses this permission to measure app installs and subscriptions from ads on TikTok so we can improve our marketing. Your data is not sold.</string>
<key>TikTokAccessToken</key>
<string>REPLACE_WITH_APP_SECRET</string>
<key>TikTokAppId</key>
<string>REPLACE_WITH_APP_ID</string>
<key>TikTokTikTokAppId</key>
<string>REPLACE_WITH_TIKTOK_APP_ID</string>
```

## `codemagic.yaml` Credential Injection

```yaml
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
```
