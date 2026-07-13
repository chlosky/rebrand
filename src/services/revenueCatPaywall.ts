import { Capacitor } from "@capacitor/core";
import { NATIVE_REVENUECAT_ENABLED } from "@/services/revenueCatConfig";
import { configureRevenueCatIfEnabled } from "@/services/revenueCatNative";
import { resolveRevenueCatUILocale } from "@/lib/locale";

export type NativePaywallPresentResult =
  | { presented: true }
  | { presented: false; reason: "disabled" | "not_native" | "not_configured" | "error"; message?: string };

/**
 * Present RevenueCat dashboard paywall on native. Inert when disabled — web Stripe paywall unchanged.
 * Not imported by live onboarding; call only when flipping NATIVE_REVENUECAT_ENABLED.
 */
export async function presentNativeRevenueCatPaywallIfEnabled(): Promise<NativePaywallPresentResult> {
  if (!NATIVE_REVENUECAT_ENABLED) {
    return { presented: false, reason: "disabled" };
  }
  if (!Capacitor.isNativePlatform()) {
    return { presented: false, reason: "not_native" };
  }

  const configured = await configureRevenueCatIfEnabled();
  if (!configured.ok) {
    return { presented: false, reason: "not_configured", message: configured.message };
  }

  try {
    const { RevenueCatUI, PAYWALL_RESULT } = await import("@revenuecat/purchases-capacitor-ui");
    const locale = resolveRevenueCatUILocale();
    const result = await RevenueCatUI.presentPaywall({
      displayCloseButton: true,
      preferredUILocaleOverride: locale,
    });

    if (result.result === PAYWALL_RESULT.PURCHASED || result.result === PAYWALL_RESULT.RESTORED) {
      return { presented: true };
    }
    return { presented: false, reason: "error", message: String(result.result) };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn("[RevenueCat] presentPaywall failed:", message);
    return { presented: false, reason: "error", message };
  }
}
