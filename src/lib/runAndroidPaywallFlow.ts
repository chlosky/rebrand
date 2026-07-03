import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import {
  presentRevenueCatPaywall,
  getLastPaywallError,
  setLastPaywallErrorMessage,
} from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { armAndroidPostPurchaseEntitlementLatch } from "@/lib/androidPostPurchaseEntitlementGate";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import i18n from "@/i18n";

export type AndroidPaywallFlowOutcome =
  | "success"
  | "present_failed"
  | "error"
  | "skipped";

let presentationInFlight = false;

export function resetAndroidPaywallPresentationFlightLock() {
  presentationInFlight = false;
}

const PAYWALL_PRESENT_TIMEOUT_MS = 120_000;

/**
 * Presents RevenueCat paywall on Android. After a purchase/restored result, routes to
 * `/onboarding/android-post-paywall` where entitlement sync + provisioning runs.
 *
 * Android-only. Does not touch iOS code or paths.
 */
export async function runAndroidPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
  bypassPresentationLock?: boolean;
}): Promise<AndroidPaywallFlowOutcome> {
  const canNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!canNative) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:skipped",
      message: "Flow skipped — not native Android",
      data: {
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    return "skipped";
  }

  const useLock = !options.bypassPresentationLock;

  if (useLock && presentationInFlight) {
    setLastPaywallErrorMessage(i18n.t("paywall:flow.subscriptionScreenMayBeOpening"));
    toast.error(i18n.t("paywall:flow.subscriptionAlreadyOpening"), { duration: 8000 });
    return "present_failed";
  }
  if (useLock) {
    presentationInFlight = true;
  }

  try {
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => {
        setLastPaywallErrorMessage(i18n.t("paywall:flow.openingSubscriptionsTimedOut"));
        resolve(false);
      }, PAYWALL_PRESENT_TIMEOUT_MS);
    });

    trackMarketingConversion("paywall_view", {
      source: "android_revenuecat_paywall",
      page_path: "/onboarding/android-paywall",
      content_id: "/onboarding/android-paywall",
      content_name: "android_revenuecat_paywall",
    });

    const presentPromise = presentRevenueCatPaywall(options.userId).finally(
      () => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    );

    const result = await Promise.race([presentPromise, timeoutPromise]);

    if (!result) {
      toast.error(
        getLastPaywallError() || i18n.t("paywall:webWrapper.subscriptionNotCompleted"),
        { duration: 8000 }
      );
      return "present_failed";
    }

    armAndroidPostPurchaseEntitlementLatch(options.userId);
    trackMarketingConversion("subscription_complete", {
      source: "android_revenuecat_paywall",
      target_path: "/onboarding/android-post-paywall",
      content_id: "premium_subscription",
      content_name: "premium_subscription",
    });
    options.navigate("/onboarding/android-post-paywall", { replace: true });
    return "success";
  } catch (err) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:catch",
      message: "Exception during Android paywall flow",
      data: {
        err: String((err as Error)?.message ?? err),
        stack: (err as Error)?.stack?.slice(0, 800) ?? null,
        lastPaywallError: getLastPaywallError(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    toast.error(i18n.t("paywall:flow.couldNotOpenSubscription"), { duration: 8000 });
    return "error";
  } finally {
    if (useLock) {
      presentationInFlight = false;
    }
  }
}
