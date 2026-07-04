import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import i18n from "@/i18n";

export type WebPaywallFlowOutcome = "success" | "skipped";

/**
 * After web signup, route to the web paywall (Stripe Checkout by default).
 * RevenueCat Web Billing stays available when `VITE_WEB_CHECKOUT_PROVIDER=revenuecat`.
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
