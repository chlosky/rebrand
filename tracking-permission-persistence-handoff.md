# Tracking Permission Persistence Handoff

## Current Behavior

- The Help Us Improve Palette Plotting **Yes** button requests Apple ATT through `ATTrackingManager.requestTrackingAuthorization`.
- The **No** button does not request ATT.
- The user pre-permission choice, ATT status, and timestamp are saved into setup draft immediately on tap.
- The same values are sent to `onboarding_sessions.onboarding_answers.setup_journey_v1`.
- No required DB column or migration was added.

Persisted JSON keys:

```json
{
  "setup_journey_v1": {
    "tracking_pre_permission_choice": "yes",
    "tracking_authorization_status": "authorized",
    "tracking_permission_asked_at": "2026-06-02T19:47:00.000Z"
  }
}
```

For No:

```json
{
  "setup_journey_v1": {
    "tracking_pre_permission_choice": "no",
    "tracking_authorization_status": "notRequested",
    "tracking_permission_asked_at": "2026-06-02T19:47:00.000Z"
  }
}
```

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
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [trackingAskedAt, setTrackingAskedAt] = useState<string | null>(null);

  const requestTrackingPermission = async () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("yes");
    setTrackingAskedAt(askedAt);

    if (!showTrackingPermission) return;

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
          trackingPrePermissionChoice: trackingChoice,
          trackingAuthorizationStatus: trackingStatus,
          trackingPermissionAskedAt: trackingAskedAt,
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

## `src/lib/setupDraft.ts`

```ts
export type SetupDraft = {
  firstName?: string;
  email?: string;
  emailMarketingConsent?: boolean;
  appNotificationsConsent?: boolean;
  trackingPrePermissionChoice?: "yes" | "no" | null;
  trackingAuthorizationStatus?:
    | "authorized"
    | "denied"
    | "restricted"
    | "notDetermined"
    | "notRequested"
    | "unavailable"
    | "unknown"
    | null;
  trackingPermissionAskedAt?: string | null;
  // ...other existing setup draft fields...
};

export async function writeSetupDraft(
  patch: Partial<SetupDraft>,
  options?: { awaitBackendSync?: boolean },
): Promise<SetupDraft> {
  const prev = readSetupDraft();
  const next: SetupDraft = { ...prev, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  const syncPromise = import("./setupDraftBackendSync").then(({ syncSetupJourneyToBackend }) =>
    syncSetupJourneyToBackend(next),
  );
  if (options?.awaitBackendSync) {
    await syncPromise;
  } else {
    void syncPromise.catch((e) => {
      console.warn("[writeSetupDraft] backend sync failed:", e);
    });
  }
  return next;
}
```

## `src/lib/setupDraftBackendSync.ts`

```ts
const trackingPatch: Record<string, unknown> = {};
if (draft.trackingPrePermissionChoice === "yes" || draft.trackingPrePermissionChoice === "no") {
  trackingPatch.tracking_pre_permission_choice = draft.trackingPrePermissionChoice;
}
if (typeof draft.trackingAuthorizationStatus === "string") {
  trackingPatch.tracking_authorization_status = draft.trackingAuthorizationStatus;
}
if (typeof draft.trackingPermissionAskedAt === "string") {
  trackingPatch.tracking_permission_asked_at = draft.trackingPermissionAskedAt;
}
if (Object.keys(trackingPatch).length > 0) {
  patch.onboarding_answers = { setup_journey_v1: trackingPatch };
}
```

## Email Session Patch

The same `trackingPatch` block is added in:

- `src/pages/onboarding/setup/Email.tsx`
- `src/pages/onboarding/subliminal/SubliminalEmail.tsx`

It attaches:

```ts
sessionPatch.onboarding_answers = { setup_journey_v1: trackingPatch };
```

## `supabase/functions/update-onboarding-session/index.ts`

The edge function now deep-merges `setup_journey_v1` instead of shallow replacing it when `onboarding_answers.setup_journey_v1` is patched.

```ts
if (
  patchAnswers.setup_journey_v1 &&
  typeof patchAnswers.setup_journey_v1 === "object" &&
  patchAnswers.setup_journey_v1 !== null
) {
  const { setup_journey_v1, ...restPatchAnswers } = patchAnswers;
  updates.onboarding_answers = mergeSetupJourneyV1IntoOnboardingAnswers(
    current,
    { ...current, ...restPatchAnswers },
    setup_journey_v1 as Record<string, unknown>,
  );
} else {
  updates.onboarding_answers = { ...current, ...patchAnswers };
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
func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
    TikTokSdkBootstrap.configureOnLaunch()
    return true
}
```

No ATT request is made from `AppDelegate`.

## `ios/App/App/TikTokSdkBootstrap.swift`

```swift
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
}
```

The old TikTok ATT wrapper was removed. ATT prompting lives only in `TrackingAuthorizationPlugin.swift`.
