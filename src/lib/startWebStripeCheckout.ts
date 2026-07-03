import type { NavigateFunction } from "react-router-dom";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

/**
 * @deprecated Web uses RevenueCat Web Billing (`runWebPaywallFlowAfterSignup`). Kept for callers migrating off Stripe Checkout.
 */
export async function startWebStripeCheckout(
  navigate?: NavigateFunction,
  userId?: string | null,
): Promise<boolean> {
  if (!navigate) {
    console.warn("[startWebStripeCheckout] navigate required for RevenueCat web paywall");
    return false;
  }
  const outcome = await runWebPaywallFlowAfterSignup({ userId: userId ?? null, navigate });
  return outcome === "success";
}
