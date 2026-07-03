/**
 * Single tier: Premium (full-featured). Monthly, annual, and weekly via RevenueCat/Apple.
 * Product IDs: com.paletteplotting.app.monthly, com.paletteplotting.app.annual, com.paletteplotting.app.weekly
 */
export const IAP_PRODUCT_IDS: Record<string, string> = {
  premium_monthly:
    (import.meta.env.VITE_IAP_PRODUCT_PREMIUM_MONTHLY as string) ||
    "com.paletteplotting.app.monthly",
  premium_annual:
    (import.meta.env.VITE_IAP_PRODUCT_PREMIUM_ANNUAL as string) ||
    "com.paletteplotting.app.annual",
  premium_weekly:
    (import.meta.env.VITE_IAP_PRODUCT_PREMIUM_WEEKLY as string) ||
    "com.paletteplotting.app.weekly",
};

export type Tier = "basic" | "plus" | "premium";
export type BillingPeriod = "monthly" | "annual" | "weekly";

export function getIAPProductId(tier: Tier, billing: BillingPeriod): string {
  if (tier !== "premium") return "";
  const key = `premium_${billing}` as keyof typeof IAP_PRODUCT_IDS;
  return IAP_PRODUCT_IDS[key] || "";
}

export function getAllIAPProductIds(): string[] {
  return [
    IAP_PRODUCT_IDS.premium_monthly,
    IAP_PRODUCT_IDS.premium_annual,
    IAP_PRODUCT_IDS.premium_weekly,
  ].filter(Boolean);
}
