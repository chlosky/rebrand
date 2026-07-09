import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import i18n from "@/i18n";

export type WebPaywallFlowOutcome = "success" | "skipped";

/**
 * After signup, route to the Stripe web paywall.
 */
export async function runWebPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
}): Promise<WebPaywallFlowOutcome> {
  if (!options.userId) {
    toast.error(i18n.t("paywall:flow.signInRequiredBeforeSubscribing"));
    options.navigate("/login", { replace: true });
    return "skipped";
  }

  options.navigate("/onboarding/web-paywall", { replace: true });
  return "success";
}
