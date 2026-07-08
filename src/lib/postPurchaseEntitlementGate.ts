import { debugLog } from "@/debugLog";
import { syncWebStripeEntitlementAfterPurchaseWithRetries } from "@/lib/webStripeEntitlementSync";

/** Handoff from Stripe checkout → entitlement sync on `/onboarding/post-paywall`. */
const STORAGE_KEY = "pp_post_paywall_gate_v1";

export type PostPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type PostPurchaseGateResult = "skipped" | "synced" | "failed";

/** One in-flight entitlement sync shared by PostPaywallLoading remounts (e.g. React Strict Mode). */
let entitlementSyncOutcome: Promise<PostPurchaseGateResult> | null = null;

export function armIapPostPurchaseEntitlementLatch(userId: string | null): void {
  try {
    const payload: PostPaywallLatch = { userId, entitlementSynced: false };
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

function readLatch(): PostPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PostPaywallLatch>;
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

function applySubscriptionSessionMarkers(userId: string | null): void {
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

export function markIapSubscriptionConfirmed(userId: string | null): void {
  applySubscriptionSessionMarkers(userId);
}

/**
 * After Stripe checkout, sync subscription to the server before provisioning.
 * Skips when no latch exists or sync already succeeded.
 */
export async function runIapPostPurchaseGateIfNeeded(): Promise<PostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return "skipped";

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<PostPurchaseGateResult> => {
    try {
      const ok = await syncWebStripeEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "postPurchaseEntitlementGate.ts:syncFail",
          message: "Stripe entitlement sync returned false after checkout",
          hypothesisId: "H5",
        });
        clearIapPostPurchaseEntitlementLatch();
        return "failed";
      }
      applySubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ userId, entitlementSynced: true } satisfies PostPaywallLatch),
        );
      } catch {
        /* ignore */
      }
      return "synced";
    } catch (e) {
      console.error("[postPurchaseEntitlementGate]", e);
      clearIapPostPurchaseEntitlementLatch();
      return "failed";
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}
