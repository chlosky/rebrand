import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";

export type WebStripeBillingPeriod = "monthly" | "annual";

export type StartWebStripeCheckoutResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persists plan choice on the onboarding session and redirects to Stripe Checkout.
 * Requires the user to be signed in so `update-onboarding-session` can attach `user_id`.
 */
export async function startWebStripeCheckout(options: {
  billing: WebStripeBillingPeriod;
}): Promise<StartWebStripeCheckoutResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in is required before subscribing." };
  }

  try {
    const creds = await ensureOnboardingSessionCreds();

    const { error: patchError } = await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: {
          selected_tier: "premium",
          billing: options.billing,
          paywall_id: "web_stripe_checkout",
          paywall_variant: options.billing,
        },
      },
    });
    if (patchError) {
      console.warn("[startWebStripeCheckout] update-onboarding-session:", patchError.message);
      return { ok: false, error: "Could not save your plan choice. Please try again." };
    }

    const { data, error } = await supabase.functions.invoke("create-onboarding-checkout-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
      },
    });

    if (error) {
      console.warn("[startWebStripeCheckout] create-onboarding-checkout-session:", error.message);
      return { ok: false, error: "Could not open checkout. Please try again." };
    }

    const url = typeof data?.url === "string" ? data.url.trim() : "";
    if (!url) {
      return { ok: false, error: "Checkout URL was missing. Please try again." };
    }

    window.location.assign(url);
    return { ok: true };
  } catch (e) {
    console.error("[startWebStripeCheckout]", e);
    return { ok: false, error: "Could not open checkout. Please try again." };
  }
}
