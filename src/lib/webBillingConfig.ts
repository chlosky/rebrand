/**
 * Web checkout provider for browser onboarding + resubscribe.
 *
 * - `stripe` — Stripe Checkout (launch default; RC web billing dormant).
 * - `revenuecat` — RevenueCat Web Billing (`@revenuecat/purchases-js`).
 *
 * Set `VITE_WEB_CHECKOUT_PROVIDER=revenuecat` to re-enable RC web without code changes.
 */
export type WebCheckoutProvider = "stripe" | "revenuecat";

const envProvider = (import.meta.env.VITE_WEB_CHECKOUT_PROVIDER as string | undefined)?.trim().toLowerCase();

export const WEB_CHECKOUT_PROVIDER: WebCheckoutProvider =
  envProvider === "revenuecat" ? "revenuecat" : "stripe";

export function isWebStripeCheckoutEnabled(): boolean {
  return WEB_CHECKOUT_PROVIDER === "stripe";
}

export function isWebRevenueCatBillingEnabled(): boolean {
  return WEB_CHECKOUT_PROVIDER === "revenuecat";
}
