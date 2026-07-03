/** Tokenized portal or RC API redirect used by Web Billing management emails. */
export function isRevenueCatWebBillingPortalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "billing.revenuecat.com") return true;
    if (parsed.hostname === "api.revenuecat.com" && /\/rcbilling\//i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}
