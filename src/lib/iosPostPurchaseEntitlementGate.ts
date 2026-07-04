import { Capacitor } from "@capacitor/core";
import { debugLog } from "@/debugLog";
import { syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";
import { syncWebRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCatWeb";
import { isWebRevenueCatBillingEnabled, isWebStripeCheckoutEnabled } from "@/lib/webBillingConfig";
import { syncWebStripeEntitlementAfterPurchaseWithRetries } from "@/lib/webStripeEntitlementSync";

/** Handoff from native paywall dismissal → entitlement sync happens on `/onboarding/post-paywall`. */
const STORAGE_KEY = "sv_iap_post_paywall_gate_v1";

export type IapPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type IapPostPurchaseGateResult = "skipped" | "synced" | "delayed" | "failed";

/** One in-flight entitlement sync shared by PostPaywallLoading remounts (e.g. React Strict Mode). */
let entitlementSyncOutcome: Promise<IapPostPurchaseGateResult> | null = null;

export function armIapPostPurchaseEntitlementLatch(userId: string | null): void {
  try {
    const payload: IapPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearIapPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): IapPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<IapPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

export function getIapPostPurchaseLatchUserId(): string | null {
  return readLatch()?.userId ?? null;
}

function applyIapSubscriptionSessionMarkers(userId: string | null): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("subscription_check_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    if (userId) {
      sessionStorage.setItem(
        `subscription_check_${userId}`,
        JSON.stringify({ ts: Date.now(), active: true }),
      );
    }
  } catch {
    /* ignore */
  }
  (window as unknown as { __subscriptionConfirmed?: boolean }).__subscriptionConfirmed = true;
}

/** Optimistic dashboard access when StoreKit → RevenueCat sync is still in flight. */
export function markIapSubscriptionConfirmed(userId: string | null): void {
  applyIapSubscriptionSessionMarkers(userId);
}

/**
 * Background RevenueCat/server sync after optimistic dashboard handoff.
 * Does not block UI or bounce the user back to paywall.
 */
export function retryIosPostPurchaseEntitlementSyncInBackground(attempts = 6): void {
  void (async () => {
    const start = performance.now();
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts);
      const syncMs = Math.round(performance.now() - start);
      debugLog({
        location: "iosPostPurchaseEntitlementGate.ts:backgroundRetry",
        message: ok
          ? "Background entitlement sync succeeded"
          : "Background entitlement sync still unverified",
        data: { ok, syncMs, attempts },
        hypothesisId: "H5",
      });
      console.info("[post-paywall] background entitlement sync", { ok, syncMs, attempts });
    } catch (e) {
      console.warn("[post-paywall] background entitlement sync error:", e);
    }
  })();
}

/**
 * If the user just completed the native IAP paywall, retries entitlement sync then marks subscription
 * confirmation. Stripe / refreshes skip when no latch exists or sync already succeeded.
 *
 * Uses a shared promise so remounting the loading route does not start parallel sync/work.
 *
 * Native iOS: sync failure after purchase is `delayed` (not `failed`) so buyers are not bounced
 * back to paywall while Apple/RevenueCat catches up.
 */
export async function runIapPostPurchaseGateIfNeeded(): Promise<IapPostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return "skipped";

  const isWeb = !Capacitor.isNativePlatform();
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  if (!isNativeIos && !isWeb) {
    clearIapPostPurchaseEntitlementLatch();
    return "skipped";
  }

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<IapPostPurchaseGateResult> => {
    try {
      const ok = isWeb
        ? isWebStripeCheckoutEnabled()
          ? await syncWebStripeEntitlementAfterPurchaseWithRetries()
          : isWebRevenueCatBillingEnabled()
            ? await syncWebRevenueCatEntitlementAfterPurchaseWithRetries()
            : true
        : await syncRevenueCatEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "iosPostPurchaseEntitlementGate.ts:syncFail",
          message: isNativeIos
            ? "syncRevenueCatEntitlementAfterPurchaseWithRetries unverified after IAP — treating as delayed"
            : "syncRevenueCatEntitlementAfterPurchaseWithRetries returned false after IAP",
          hypothesisId: "H5",
        });
        if (isNativeIos) {
          return "delayed";
        }
        clearIapPostPurchaseEntitlementLatch();
        return "failed";
      }
      applyIapSubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ userId, entitlementSynced: true } satisfies IapPaywallLatch),
        );
      } catch {
        /* ignore */
      }
      return "synced";
    } catch (e) {
      console.error("[iosPostPurchaseEntitlementGate]", e);
      if (isNativeIos) {
        return "delayed";
      }
      clearIapPostPurchaseEntitlementLatch();
      return "failed";
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}
