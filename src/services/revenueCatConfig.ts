import { Capacitor } from "@capacitor/core";

/**
 * Native App Store / Play billing via RevenueCat. Off by default — web Stripe stays live.
 * Flip VITE_NATIVE_REVENUECAT_ENABLED when ready to wire onboarding (do not mix with Stripe checkout).
 */
export const NATIVE_REVENUECAT_ENABLED =
  import.meta.env.VITE_NATIVE_REVENUECAT_ENABLED === "true" ||
  import.meta.env.VITE_NATIVE_REVENUECAT_ENABLED === "1";

/** RevenueCat entitlement identifier (dashboard). */
export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";

export const REVENUECAT_PRODUCT_MONTHLY = "com.paletteplotting.app.monthly";
export const REVENUECAT_PRODUCT_ANNUAL = "com.paletteplotting.app.annual";

export function revenueCatPublicApiKey(): string | null {
  if (!NATIVE_REVENUECAT_ENABLED) return null;
  if (!Capacitor.isNativePlatform()) return null;

  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    const key = import.meta.env.VITE_REVENUECAT_IOS_API_KEY;
    return typeof key === "string" && key.trim() ? key.trim() : null;
  }
  if (platform === "android") {
    const key = import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY;
    return typeof key === "string" && key.trim() ? key.trim() : null;
  }
  return null;
}
