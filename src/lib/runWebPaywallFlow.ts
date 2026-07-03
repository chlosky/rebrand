import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import i18n from "@/i18n";

export type WebPaywallFlowOutcome = "success" | "skipped";

/**
 * After web signup, route to the RevenueCat web paywall (purchases-js).
 * Entitlement sync runs on `/onboarding/post-paywall` (same edge function as native).
 */
export async function runWebPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
}): Promise<WebPaywallFlowOutcome> {
  if (Capacitor.isNativePlatform()) {
    return "skipped";
  }

  if (!options.userId) {
    toast.error(i18n.t("paywall:flow.signInRequiredBeforeSubscribing"));
    options.navigate("/login", { replace: true });
    return "skipped";
  }

  armIapPostPurchaseEntitlementLatch(options.userId);
  options.navigate("/onboarding/web-paywall", { replace: true });
  return "success";
}
