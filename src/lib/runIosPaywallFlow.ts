import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import {
  presentRevenueCatPaywall,
  getLastPaywallError,
  hasRevenueCatEntitlement,
  isLastPaywallUserCancelled,
  setLastPaywallErrorMessage,
} from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import type { BillingPeriod } from "@/lib/appleIAP";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import i18n from "@/i18n";

export type IosPaywallFlowOutcome =
  | "success"
  | "present_failed"
  | "error"
  /** Not native iOS — caller should route to web pricing */
  | "skipped";

let presentationInFlight = false;

/** Clears stuck global lock (e.g. native sheet hung, or JS continued without settling). */
export function resetPaywallPresentationFlightLock() {
  presentationInFlight = false;
}

const PAYWALL_PRESENT_TIMEOUT_MS = 120_000;
const REVENUECAT_PRO_ENTITLEMENT_ID = "Palette Plotting Pro";

/**
 * Presents RevenueCat paywall. After a native purchase/restored result, swaps to
 * `/onboarding/post-paywall` immediately while the entitlement sync + provisioning pipeline
 * runs there (web Stripe checkout success handling is separate from this path).
 *
 * Call from signup email step or `IOSPaywall` — not used on web.
 */
export async function runIosPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
  /** When true, skip module presentation lock (debugging / IOSPaywall “no guards” mode). */
  bypassPresentationLock?: boolean;
  /** Compat StoreKit path only (older iOS without RevenueCat paywall UI). Defaults to monthly. */
  billingPeriod?: BillingPeriod;
}): Promise<IosPaywallFlowOutcome> {
  const canNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  if (!canNative) {
    debugLog({
      location: "runIosPaywallFlow.ts:skipped",
      message: "Flow skipped — not native iOS",
      data: {
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
        explain: "EmailCollection/IOSPaywall should not call this on web; got non-iOS native",
      },
      hypothesisId: "H2",
    });
    return "skipped";
  }

  const useLock = !options.bypassPresentationLock;

  if (useLock && presentationInFlight) {
    setLastPaywallErrorMessage(i18n.t("paywall:flow.subscriptionScreenMayBeOpening"));
    debugLog({
      location: "runIosPaywallFlow.ts:blocked",
      message: "Global paywall already in flight (another screen or double invoke)",
      data: {
        reason: "GLOBAL_PAYWALL_IN_FLIGHT",
        userIdPresent: !!options.userId,
      },
      hypothesisId: "H2",
    });
    toast.error(i18n.t("paywall:flow.subscriptionAlreadyOpening"), { duration: 8000 });
    return "present_failed";
  }
  if (useLock) {
    presentationInFlight = true;
  }

  try {
    debugLog({
      location: "runIosPaywallFlow.ts:beforePresent",
      message: "Calling presentRevenueCatPaywall",
      data: {
        userIdPresent: !!options.userId,
        userIdLength: options.userId?.length ?? 0,
        billingPeriod: options.billingPeriod ?? "monthly",
      },
      hypothesisId: "H2",
    });
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => {
        setLastPaywallErrorMessage(i18n.t("paywall:flow.openingSubscriptionsTimedOut"));
        debugLog({
          location: "runIosPaywallFlow.ts:presentTimeout",
          message: "presentRevenueCatPaywall timed out",
          data: { ms: PAYWALL_PRESENT_TIMEOUT_MS },
          hypothesisId: "H2",
        });
        resolve(false);
      }, PAYWALL_PRESENT_TIMEOUT_MS);
    });

    const presentPromise = presentRevenueCatPaywall(options.userId, {
      billingPeriod: options.billingPeriod,
    }).finally(() => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    });

    const result = await Promise.race([presentPromise, timeoutPromise]);

    if (!result) {
      if (!isLastPaywallUserCancelled()) {
        try {
          const hasEntitlement = await hasRevenueCatEntitlement(REVENUECAT_PRO_ENTITLEMENT_ID);
          if (hasEntitlement) {
            debugLog({
              location: "runIosPaywallFlow.ts:entitlementRescue",
              message:
                "presentRevenueCatPaywall returned false but active entitlement found — routing to post-paywall",
              data: {
                lastPaywallError: getLastPaywallError(),
                userIdPresent: !!options.userId,
              },
              hypothesisId: "H2",
            });
            armIapPostPurchaseEntitlementLatch(options.userId);
            options.navigate("/onboarding/post-paywall", { replace: true });
            return "success";
          }
        } catch (e) {
          debugLog({
            location: "runIosPaywallFlow.ts:entitlementRescue",
            message: "Entitlement rescue check failed",
            data: { err: String((e as Error)?.message ?? e) },
            hypothesisId: "H2",
          });
        }
      }

      const detail = getLastPaywallError() || i18n.t("paywall:flow.paymentNotCompleted");
      debugLog({
        location: "runIosPaywallFlow.ts:afterPresent",
        message: "presentRevenueCatPaywall returned false",
        data: {
          lastPaywallError: detail,
          hints: [
            "No RC API key in build",
            "RC not configured / logIn failed",
            "getOfferings failed",
            "RevenueCatUI NOT_PRESENTED or ERROR (offering id mismatch?)",
            "Compat StoreKit: billing not supported or purchase failed",
          ],
        },
        hypothesisId: "H2",
      });
      toast.error(getLastPaywallError() || i18n.t("paywall:webWrapper.subscriptionNotCompleted"), { duration: 8000 });
      return "present_failed";
    }

    armIapPostPurchaseEntitlementLatch(options.userId);
    debugLog({
      location: "runIosPaywallFlow.ts:presentSuccess",
      message: "Paywall dismissed with purchase/restored — routing to post-paywall loading; entitlement sync runs there",
      data: { userIdPresent: !!options.userId },
      hypothesisId: "H2",
    });
    options.navigate("/onboarding/post-paywall", { replace: true });
    return "success";
  } catch (err) {
    debugLog({
      location: "runIosPaywallFlow.ts:catch",
      message: "Exception during paywall flow",
      data: {
        err: String((err as Error)?.message ?? err),
        stack: (err as Error)?.stack?.slice(0, 800) ?? null,
        lastPaywallError: getLastPaywallError(),
      },
      hypothesisId: "H2",
    });
    toast.error(i18n.t("paywall:flow.couldNotOpenSubscription"), { duration: 8000 });
    return "error";
  } finally {
    if (useLock) {
      presentationInFlight = false;
    }
  }
}
