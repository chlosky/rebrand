import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, Purchases } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import {
  getIosMajorVersionForNative,
  shouldUseRevenueCatPaywallUi,
  IOS_REVENUECAT_UI_MIN_MAJOR,
} from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { gatherOnboardingPrefs } from "@/lib/gatherOnboardingPrefs";
import {
  detectInitialAppLocale,
  resolveAppLocale,
  revenueCatUILocaleForApp,
} from "@/lib/locale";
import i18n from "@/i18n";

/** Active app UI language for RevenueCat paywall — not stale localStorage alone. */
export function resolveRevenueCatUILocale(): string {
  const raw = i18n.resolvedLanguage || i18n.language;
  const locale = raw ? resolveAppLocale(raw) : detectInitialAppLocale();
  return revenueCatUILocaleForApp(locale);
}

const PAYWALL_ERROR_I18N_KEYS: Record<string, string> = {
  "Cancelled": "errors.cancelled",
  "Paywall error": "errors.paywallError",
  "Not presented": "errors.notPresented",
  "No RevenueCat API key configured.": "errors.noApiKey",
  "RevenueCat could not be configured.": "errors.notConfigured",
  "Purchase was not completed.": "errors.purchaseNotCompleted",
  "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.": "errors.billingUnavailable",
  "No offerings in RevenueCat. Add a default offering and paywall in the dashboard.": "errors.noOfferings",
  "Could not complete checkout.": "errors.checkoutFailed",
  "Subscription was not completed.": "errors.subscriptionNotCompleted",
  "RevenueCat Web is not configured (missing API key).": "errors.webNotConfigured",
};

function localizeStoredPaywallError(raw: string): string {
  const key = PAYWALL_ERROR_I18N_KEYS[raw];
  if (key) return i18n.t(key, { ns: "paywall", defaultValue: raw });
  if (raw.startsWith("Unknown result:")) {
    const detail = raw.slice("Unknown result:".length).trim();
    return i18n.t("errors.unknownResultDetail", { ns: "paywall", detail, defaultValue: raw });
  }
  return raw;
}

/** Compat StoreKit path only; ignored when RevenueCat paywall UI is shown. */
export type PresentPaywallOptions = {
  billingPeriod?: BillingPeriod;
};

let hasConfigured = false;
let configuredAppUserId: string | null = null;
let bootstrapInFlight: Promise<void> | null = null;

const PAYWALL_RC_UI_SETTLE_MS = 150;
const REVENUECAT_OFFERING_ID = "Production Offering";

/** Last reason presentRevenueCatPaywall returned false (for debugging UI). */
let lastPaywallError: string | null = null;

export function getLastPaywallError(): string | null {
  if (!lastPaywallError) return null;
  return localizeStoredPaywallError(lastPaywallError);
}

/** True when the user explicitly dismissed the paywall (not timeout/error/not-presented). */
export function isLastPaywallUserCancelled(): boolean {
  return lastPaywallError === "Cancelled";
}

/** UI / flow helpers when RevenueCat is not invoked (e.g. global in-flight guard). */
export function setLastPaywallErrorMessage(message: string) {
  lastPaywallError = message;
}

// #region agent log (dev-only: loopback ingest triggers Chrome "apps on device" prompt on production HTTPS)
function agentLogF33356(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  if (import.meta.env.DEV !== true) return;

  const payload = {
    sessionId: "f33356",
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33356" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  try {
    const line = JSON.stringify(payload);
    const cur = typeof localStorage !== "undefined" ? localStorage.getItem("debug_f33356_log") ?? "" : "";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("debug_f33356_log", cur ? `${cur}\n${line}` : line);
    }
  } catch {
    // ignore
  }
}
// #endregion

const getRevenueCatApiKey = () => {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
  }
  return undefined;
};

/** Match onboarding language to RevenueCat paywall localizations (not device system locale). */
export async function syncRevenueCatUILocale(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) return;
    await Purchases.overridePreferredUILocale({ locale: resolveRevenueCatUILocale() });
  } catch (error) {
    console.warn("[RevenueCat] overridePreferredUILocale failed:", error);
  }
}

async function bootstrapRevenueCatCore(appUserId?: string | null): Promise<void> {
  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] Missing platform API key. Skipping setup.");
    return;
  }

  try {
    if (!hasConfigured) {
      await Purchases.setLogLevel({
        level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
      });

      await Purchases.configure({
        apiKey,
        appUserID: appUserId ?? undefined,
        preferredUILocaleOverride: resolveRevenueCatUILocale(),
      });

      hasConfigured = true;
      configuredAppUserId = appUserId ?? null;
      await syncRevenueCatUILocale();
      return;
    }

    const nextUserId = appUserId ?? null;
    if (nextUserId === configuredAppUserId) {
      await syncRevenueCatUILocale();
      return;
    }

    if (nextUserId) {
      await Purchases.logIn({ appUserID: nextUserId });
      configuredAppUserId = nextUserId;
      await syncRevenueCatUILocale();
      return;
    }

    await Purchases.logOut();
    configuredAppUserId = null;
  } catch (error) {
    console.error("[RevenueCat] Bootstrap failed:", error);
  }
}

/** Serialize configure/logIn so AuthContext and paywall open cannot race. */
export const bootstrapRevenueCat = async (appUserId?: string | null): Promise<void> => {
  if (!Capacitor.isNativePlatform()) return;

  const targetUserId = appUserId ?? null;

  const needsBootstrap = () =>
    !hasConfigured ||
    targetUserId !== configuredAppUserId;

  if (bootstrapInFlight) {
    await bootstrapInFlight;
    if (!needsBootstrap()) return;
  }

  bootstrapInFlight = bootstrapRevenueCatCore(targetUserId).finally(() => {
    bootstrapInFlight = null;
  });
  await bootstrapInFlight;
};

export const hasRevenueCatEntitlement = async (entitlementId: string) => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[entitlementId] !== "undefined";
  } catch (error) {
    console.error("[RevenueCat] Failed to fetch customer info:", error);
    return false;
  }
};

export const presentRevenueCatPaywall = async (
  appUserId?: string | null,
  paywallOptions?: PresentPaywallOptions
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  const platform = Capacitor.getPlatform();
  const apiKey = getRevenueCatApiKey();
  const hasApiKey = !!apiKey;
  const compatBilling: BillingPeriod = paywallOptions?.billingPeriod ?? "monthly";
  debugLog({
    location: "revenueCat.ts:presentPaywall",
    message: "presentRevenueCatPaywall entry",
    data: {
      platform,
      isNative: Capacitor.isNativePlatform(),
      hasApiKey,
      compatBillingRequested: compatBilling,
    },
    hypothesisId: "H3",
  });

  if (!hasApiKey) {
    lastPaywallError = "No RevenueCat API key configured.";
    console.warn("[RevenueCat] No API key; skipping presentPaywall to avoid native crash.");
    return false;
  }

  lastPaywallError = null;
  try {
    const userId = appUserId ?? configuredAppUserId ?? undefined;
    await bootstrapRevenueCat(userId ?? null);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      lastPaywallError = "RevenueCat could not be configured.";
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "RevenueCat not configured",
        data: { lastPaywallError },
        hypothesisId: "H3",
      });
      return false;
    }

    const iosMajor = await getIosMajorVersionForNative();
    const useRcUi = await shouldUseRevenueCatPaywallUi();
    // #region agent log
    agentLogF33356(
      "revenueCat.ts:presentPaywall:branch",
      "iOS paywall path",
      {
        iosMajor,
        useRcUi,
        rcUiMinMajor: IOS_REVENUECAT_UI_MIN_MAJOR,
        platform,
      },
      "H1"
    );
    // #endregion

    if (platform === "ios" && !useRcUi) {
      const { purchasePremiumViaNativeStoreKit } = await import("@/lib/nativeIosPremiumPurchase");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compat",
        "StoreKit direct (skip RevenueCat UI)",
        { plan: compatBilling },
        "H1"
      );
      // #endregion
      const outcome = await purchasePremiumViaNativeStoreKit(compatBilling);
      if (outcome.success) {
        lastPaywallError = null;
        // #region agent log
        agentLogF33356("revenueCat.ts:presentPaywall:compatResult", "compat purchase ok", {}, "H4");
        // #endregion
        return true;
      }
      const rawErr = outcome.error ?? "";
      lastPaywallError =
        rawErr === "cancelled"
          ? "Cancelled"
          : rawErr || "Purchase was not completed.";
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatResult",
        "compat purchase failed",
        { lastPaywallError, rawErr },
        "H4"
      );
      // #endregion
      return false;
    }

    await syncRevenueCatUILocale();

    try {
      await Purchases.getOfferings();
    } catch (offeringsErr) {
      const msg = (offeringsErr as Error)?.message ?? String(offeringsErr);
      lastPaywallError = msg.includes("offerings") || msg.includes("Offering")
        ? "No offerings in RevenueCat. Add a default offering and paywall in the dashboard."
        : msg;
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "getOfferings failed",
        data: { lastPaywallError, raw: msg },
        hypothesisId: "H3",
      });
      console.error("[RevenueCat] getOfferings failed:", offeringsErr);
      return false;
    }

    await new Promise((r) => setTimeout(r, PAYWALL_RC_UI_SETTLE_MS));

    // #region agent log
    agentLogF33356("revenueCat.ts:presentPaywall:beforeRcUi", "calling RevenueCatUI.presentPaywall", {}, "H2");
    // #endregion
    const { RevenueCatUI, PAYWALL_RESULT } = await import("@revenuecat/purchases-capacitor-ui");
    const { result } = await RevenueCatUI.presentPaywall({
      offering: { identifier: REVENUECAT_OFFERING_ID },
    } as import("@revenuecat/purchases-capacitor-ui").PresentPaywallOptions);

    const resultStr = String(result);
    const failReason =
      result === PAYWALL_RESULT.NOT_PRESENTED
        ? "Not presented"
        : result === PAYWALL_RESULT.ERROR
          ? "Paywall error"
          : result === PAYWALL_RESULT.CANCELLED
            ? "Cancelled"
            : result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED
              ? `Unknown result: ${resultStr}`
              : null;
    if (failReason) lastPaywallError = failReason;
    debugLog({
      location: "revenueCat.ts:presentResult",
      message: "presentPaywall result",
      data: { result: resultStr, failReason, lastPaywallError: lastPaywallError ?? undefined },
      hypothesisId: "H2",
    });

    switch (result) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        lastPaywallError = result === PAYWALL_RESULT.ERROR ? "Paywall error" : result === PAYWALL_RESULT.CANCELLED ? "Cancelled" : "Not presented";
        return false;
      case PAYWALL_RESULT.PURCHASED:
        lastPaywallError = null;
        return true;
      case PAYWALL_RESULT.RESTORED:
        lastPaywallError = null;
        return true;
      default:
        lastPaywallError = "Unknown result";
        return false;
    }
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    lastPaywallError = errMsg;
    debugLog({ location: "revenueCat.ts:presentCatch", message: "presentRevenueCatPaywall catch", data: { err: String((error as Error)?.message ?? error) }, hypothesisId: "H2" });
    console.error("[RevenueCat] Failed to present paywall:", error);
    return false;
  }
};

/** Onboarding prefs to send so backend can write to user_preferences, profiles, and user_plans (iOS path). */
export type { OnboardingPrefsPayload } from "@/lib/gatherOnboardingPrefs";

const APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS = 6 * 60 * 60 * 1000;
const appleRcBillingSyncStorageKey = (userId: string) => `apple_rc_billing_sync_${userId}`;

function isAppleOrRevenueCatBilledPlan(row: {
  last_payment_source?: string | null;
  stripe_customer_id?: string | null;
} | null): boolean {
  if (!row) return false;
  const cid = row.stripe_customer_id ?? "";
  return (
    row.last_payment_source === "apple" ||
    row.last_payment_source === "google_play" ||
    cid.startsWith("apple:") ||
    cid.startsWith("revenuecat:")
  );
}

/**
 * For users billed via Apple / RevenueCat, refresh user_plans (e.g. current_period_end) via the
 * sync-revenuecat-entitlement Edge Function. Safe on web/PWA and native; no-op for Stripe-only users.
 */
export async function refreshAppleRevenueCatPlanOnServer(
  mode: "session_start" | "background" = "session_start",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const uid = session.user.id;

  const { data: plan, error } = await supabase
    .from("user_plans")
    .select("last_payment_source, stripe_customer_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error || !isAppleOrRevenueCatBilledPlan(plan)) return;

  if (mode === "background") {
    const raw = sessionStorage.getItem(appleRcBillingSyncStorageKey(uid));
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS) return;
    }
  }

  try {
    const { error: invokeErr } = await supabase.functions.invoke("sync-revenuecat-entitlement", { method: "POST" });
    if (invokeErr) {
      console.warn("[Billing] RevenueCat server sync:", invokeErr.message);
      return;
    }
    try {
      sessionStorage.setItem(appleRcBillingSyncStorageKey(uid), String(Date.now()));
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn("[Billing] RevenueCat server sync failed:", e);
  }
}

/**
 * Push StoreKit state to RevenueCat, then sync `user_plans` via `sync-revenuecat-entitlement`.
 * Use after Capgo NativePurchases purchase/restore or RC paywall purchase so the edge function sees an up-to-date subscriber.
 */
export const syncRevenueCatEntitlementToBackend = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  const plat = Capacitor.getPlatform();
  if (plat !== "ios" && plat !== "android") return false;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("[RevenueCat] Backend sync skipped: no session.");
      return false;
    }

    await bootstrapRevenueCat(session.user.id);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      console.warn("[RevenueCat] Not configured; cannot sync entitlement to backend.");
      return false;
    }

    try {
      await Purchases.syncPurchases();
    } catch (e) {
      console.warn("[RevenueCat] syncPurchases failed (continuing with edge sync):", e);
    }

    const onboarding_prefs = await gatherOnboardingPrefs();
    const body: Record<string, unknown> = {};
    if (onboarding_prefs && Object.keys(onboarding_prefs).length > 0) {
      body.onboarding_prefs = onboarding_prefs;
    }
    const { error, data } = await supabase.functions.invoke("sync-revenuecat-entitlement", {
      method: "POST",
      body,
    });

    const payload = data as {
      success?: boolean;
      active?: boolean;
      downgraded?: boolean;
      preservedExisting?: boolean;
      preservedStripeBilling?: boolean;
      error?: string;
    } | null;

    const syncOk =
      !error &&
      !payload?.downgraded &&
      (payload?.preservedExisting === true ||
        payload?.preservedStripeBilling === true ||
        (payload?.success === true && payload?.active === true));

    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: syncOk ? "sync ok" : "sync failed",
      data: {
        invokeError: error?.message ?? null,
        dataBody: data ?? null,
      },
      hypothesisId: "H5",
    });

    if (!syncOk) {
      const errMsg = payload?.error || error?.message || String(error ?? "Sync rejected");
      console.error("[RevenueCat] Backend entitlement sync failed:", error || payload?.error, "data:", data);
      return false;
    }

    return true;
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: "sync exception",
      data: { err: errMsg },
      hypothesisId: "H5",
    });
    console.error("[RevenueCat] Entitlement sync exception:", error);
    return false;
  }
};

const POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS = 500;
const POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS = 500;

/** Short settle delay, then repeated `syncRevenueCatEntitlementToBackend` (post–StoreKit / RC paywall). */
export async function syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS));
  }
  return false;
}
