import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { getIAPProductId, type BillingPeriod } from "@/lib/appleIAP";

/**
 * StoreKit purchase without RevenueCat Paywalls UI (older iOS compat).
 * Does not call sync-revenuecat-entitlement — callers (e.g. runIosPaywallFlow) sync once after
 * presentRevenueCatPaywall returns true. A duplicate sync here sent multiple welcome emails.
 */
export async function purchasePremiumViaNativeStoreKit(
  plan: BillingPeriod
): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return { success: false, error: "Not iOS native" };
  }
  const productId = getIAPProductId("premium", plan);
  if (!productId) return { success: false, error: "Product not configured" };

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) return { success: false, error: "Billing not supported on this device." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Could not check billing." };
  }

  try {
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.SUBS,
      quantity: 1,
    });
    const transactionId = (result as { transactionId?: string }).transactionId;
    if (!transactionId) return { success: false, error: "No transaction ID returned" };

    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Purchase failed";
    if (message.includes("cancelled") || message.includes("canceled")) {
      return { success: false, error: "cancelled" };
    }
    return { success: false, error: message };
  }
}
