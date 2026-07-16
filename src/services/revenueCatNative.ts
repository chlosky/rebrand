import { Capacitor } from "@capacitor/core";
import {
  NATIVE_REVENUECAT_ENABLED,
  REVENUECAT_ENTITLEMENT_ID,
  revenueCatPublicApiKey,
} from "@/services/revenueCatConfig";
import { resolveRevenueCatUILocale } from "@/lib/locale";

export type RevenueCatConfigureResult =
  | { ok: true }
  | { ok: false; reason: "disabled" | "not_native" | "missing_api_key" | "error"; message?: string };

let configurePromise: Promise<RevenueCatConfigureResult> | null = null;

/**
 * Configure Purchases SDK when NATIVE_REVENUECAT_ENABLED. No-op otherwise — does not touch Stripe.
 */
export async function configureRevenueCatIfEnabled(appUserId?: string | null): Promise<RevenueCatConfigureResult> {
  if (!NATIVE_REVENUECAT_ENABLED) {
    return { ok: false, reason: "disabled" };
  }
  if (!Capacitor.isNativePlatform()) {
    return { ok: false, reason: "not_native" };
  }

  const apiKey = revenueCatPublicApiKey();
  if (!apiKey) {
    return { ok: false, reason: "missing_api_key" };
  }

  if (configurePromise) return configurePromise;

  configurePromise = (async () => {
    try {
      const { Purchases, LOG_LEVEL } = await import("@revenuecat/purchases-capacitor");
      await Purchases.setLogLevel({ level: LOG_LEVEL.DEBUG });
      await Purchases.configure({
        apiKey,
        appUserID: appUserId?.trim() || undefined,
        preferredUILocaleOverride: resolveRevenueCatUILocale(),
      });
      return { ok: true };
    } catch (error) {
      configurePromise = null;
      const message = error instanceof Error ? error.message : String(error);
      console.warn("[RevenueCat] configure failed:", message);
      return { ok: false, reason: "error", message };
    }
  })();

  return configurePromise;
}

/** Login RevenueCat subscriber to Supabase user id. Inert when disabled. */
export async function revenueCatLoginIfEnabled(appUserId: string): Promise<void> {
  if (!NATIVE_REVENUECAT_ENABLED || !Capacitor.isNativePlatform()) return;
  const configured = await configureRevenueCatIfEnabled(appUserId);
  if (!configured.ok) return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.logIn({ appUserID: appUserId });
  } catch (error) {
    console.warn("[RevenueCat] logIn failed:", error);
  }
}

/** Sync device purchases to RevenueCat. Does not call Supabase edge functions. */
export async function syncRevenueCatPurchasesIfEnabled(): Promise<void> {
  if (!NATIVE_REVENUECAT_ENABLED || !Capacitor.isNativePlatform()) return;
  const configured = await configureRevenueCatIfEnabled();
  if (!configured.ok) return;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    await Purchases.syncPurchases();
  } catch (error) {
    console.warn("[RevenueCat] syncPurchases failed:", error);
  }
}

/** Whether the Palette Plotting Pro entitlement is active on device (native RC only). */
export async function hasRevenueCatProEntitlementIfEnabled(): Promise<boolean> {
  if (!NATIVE_REVENUECAT_ENABLED || !Capacitor.isNativePlatform()) return false;
  const configured = await configureRevenueCatIfEnabled();
  if (!configured.ok) return false;
  try {
    const { Purchases } = await import("@revenuecat/purchases-capacitor");
    const { customerInfo } = await Purchases.getCustomerInfo();
    return Boolean(customerInfo.entitlements.active[REVENUECAT_ENTITLEMENT_ID]);
  } catch {
    return false;
  }
}
