import { Capacitor } from "@capacitor/core";
import { debugLog } from "@/debugLog";
import { syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";

const STORAGE_KEY = "sv_android_post_paywall_gate_v1";

export type AndroidPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type AndroidPostPurchaseGateResult =
  | { status: "skipped" }
  | { status: "verified" }
  /** Play purchase succeeded but Google/RevenueCat entitlement sync is not confirmed yet. */
  | { status: "delayed"; reason: string };

let entitlementSyncOutcome: Promise<AndroidPostPurchaseGateResult> | null = null;

export function armAndroidPostPurchaseEntitlementLatch(
  userId: string | null
): void {
  try {
    const payload: AndroidPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearAndroidPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): AndroidPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AndroidPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

export function getAndroidPostPurchaseLatchUserId(): string | null {
  return readLatch()?.userId ?? null;
}

/** Optimistic dashboard access when Google Play → RevenueCat sync is still in flight. */
export function markAndroidSubscriptionConfirmed(userId: string | null): void {
  applyAndroidSubscriptionSessionMarkers(userId);
}

function applyAndroidSubscriptionSessionMarkers(userId: string | null): void {
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
        JSON.stringify({ ts: Date.now(), active: true })
      );
    }
  } catch {
    /* ignore */
  }
  (
    window as unknown as { __subscriptionConfirmed?: boolean }
  ).__subscriptionConfirmed = true;
}

/**
 * Background RevenueCat/server sync after optimistic dashboard handoff.
 * Does not block UI or bounce the user back to paywall.
 */
export function retryAndroidPostPurchaseEntitlementSyncInBackground(
  attempts = 6
): void {
  void (async () => {
    const start = performance.now();
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts);
      const syncMs = Math.round(performance.now() - start);
      debugLog({
        location: "androidPostPurchaseEntitlementGate.ts:backgroundRetry",
        message: ok
          ? "Background entitlement sync succeeded"
          : "Background entitlement sync still unverified",
        data: { ok, syncMs, attempts },
        hypothesisId: "ANDROID-GATE",
      });
      console.info("[android-post-paywall] background entitlement sync", { ok, syncMs, attempts });
    } catch (e) {
      console.warn("[android-post-paywall] background entitlement sync error:", e);
    }
  })();
}

/**
 * Android-only post-purchase entitlement sync. Mirrors the iOS gate but uses
 * its own storage key and platform check. Shares no code with the iOS gate.
 *
 * After a successful Play purchase, sync failure is reported as `delayed` — not
 * a hard failure — because entitlement can lag behind the purchase receipt.
 */
export async function runAndroidPostPurchaseGateIfNeeded(): Promise<AndroidPostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return { status: "skipped" };

  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!isNativeAndroid) {
    clearAndroidPostPurchaseEntitlementLatch();
    return { status: "skipped" };
  }

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<AndroidPostPurchaseGateResult> => {
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "androidPostPurchaseEntitlementGate.ts:syncDelayed",
          message:
            "syncRevenueCatEntitlementAfterPurchaseWithRetries unverified after Google Play purchase — treating as delayed",
          hypothesisId: "ANDROID-GATE",
        });
        return {
          status: "delayed",
          reason: "revenuecat_sync_retries_exhausted",
        };
      }
      applyAndroidSubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            userId,
            entitlementSynced: true,
          } satisfies AndroidPaywallLatch)
        );
      } catch {
        /* ignore */
      }
      return { status: "verified" };
    } catch (e) {
      console.error("[androidPostPurchaseEntitlementGate]", e);
      return {
        status: "delayed",
        reason: e instanceof Error ? e.message : "sync_threw",
      };
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}
