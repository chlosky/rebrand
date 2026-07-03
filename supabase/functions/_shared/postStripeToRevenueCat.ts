/**
 * Sends a Stripe subscription or Checkout Session to RevenueCat so web purchases unlock the same
 * entitlements as mobile (Stripe Billing integration).
 *
 * @see https://www.revenuecat.com/docs/web/integrations/stripe
 *
 * Env: REVENUECAT_STRIPE_APP_PUBLIC_API_KEY — "Stripe public API key" from RevenueCat → your app →
 *      API keys (NOT the sk_ secret used for /v1/subscribers). If unset, calls are no-ops.
 *
 * Dashboard: Connect Stripe to RevenueCat; add each Stripe *product* to an entitlement with a
 * product identifier matching Stripe's prod_… id exactly. Your existing Stripe Price IDs on
 * Checkout do not need separate REST setup — RC reads the subscription from Stripe using the token.
 */
/** @returns true when RC accepted the Stripe token, false when skipped or failed (non-throwing). */
export async function postStripePurchaseToRevenueCat(
  appUserId: string,
  fetchToken: string | null | undefined,
): Promise<boolean> {
  if (!fetchToken || typeof fetchToken !== "string" || !fetchToken.trim()) return false;

  const apiKey = Deno.env.get("REVENUECAT_STRIPE_APP_PUBLIC_API_KEY")?.trim();
  if (!apiKey) {
    console.warn("[postStripeToRevenueCat] REVENUECAT_STRIPE_APP_PUBLIC_API_KEY not set; skipping");
    return false;
  }

  try {
    const res = await fetch("https://api.revenuecat.com/v1/receipts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Platform": "stripe",
      },
      body: JSON.stringify({
        app_user_id: appUserId,
        fetch_token: fetchToken.trim(),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn(
        "[postStripeToRevenueCat] RevenueCat /v1/receipts failed:",
        res.status,
        text.slice(0, 800),
      );
      return false;
    }
    console.log("[postStripeToRevenueCat] synced Stripe token for app_user_id", appUserId);
    return true;
  } catch (e) {
    console.warn("[postStripeToRevenueCat] request error (non-fatal):", e);
    return false;
  }
}
