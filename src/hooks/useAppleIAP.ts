import { useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { OpenExternalSystemUrl } from "@/plugins/openExternalSystemUrl";
import {
  bootstrapRevenueCat,
  resolveRevenueCatUILocale,
  syncRevenueCatEntitlementToBackend,
  syncRevenueCatUILocale,
} from "@/services/revenueCat";
import {
  shouldUseRevenueCatCustomerCenterUi,
  getIosMajorVersionForNative,
  IOS_REVENUECAT_UI_MIN_MAJOR,
} from "@/lib/iosRevenueCatUiGate";
import {
  getIAPProductId,
  getAllIAPProductIds,
  type BillingPeriod,
} from "@/lib/appleIAP";

/** Apple subscription management — system handoff only via `UIApplication.shared.open` (native plugin). */
const APPLE_MANAGE_SUBSCRIPTIONS_ITMS = "itms-apps://apps.apple.com/account/subscriptions";

async function openAppleSubscriptionManagementItmsOnly(): Promise<void> {
  await OpenExternalSystemUrl.open({ url: APPLE_MANAGE_SUBSCRIPTIONS_ITMS });
}

export interface IAPProduct {
  identifier: string;
  title: string;
  priceString: string;
  description?: string;
}

export function useAppleIAP() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [billingSupported, setBillingSupported] = useState<boolean | null>(null);

  const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const loadProducts = useCallback(async () => {
    if (!isIOSNative) return;

    setIsLoading(true);
    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      setBillingSupported(isBillingSupported);

      if (!isBillingSupported) {
        setProducts([]);
        return;
      }

      const productIds = getAllIAPProductIds();
      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

      const { products: list } = await NativePurchases.getProducts({
        productIdentifiers: productIds,
        productType: PURCHASE_TYPE.SUBS,
      });

      setProducts(
        (list || []).map((p: { identifier: string; title?: string; priceString?: string; description?: string }) => ({
          identifier: p.identifier,
          title: p.title || p.identifier,
          priceString: p.priceString || "",
          description: p.description,
        }))
      );
    } catch (e) {
      console.error("Apple IAP loadProducts:", e);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isIOSNative]);

  useEffect(() => {
    if (isIOSNative) {
      void loadProducts();
    }
  }, [isIOSNative, loadProducts]);

  const purchase = useCallback(
    async (plan: BillingPeriod): Promise<{ success: boolean; error?: string }> => {
      if (!isIOSNative) return { success: false, error: "Not iOS native" };

      const productId = getIAPProductId("premium", plan);
      if (!productId) return { success: false, error: "Product not configured" };

      setIsPurchasing(true);
      try {
        const result = await NativePurchases.purchaseProduct({
          productIdentifier: productId,
          productType: PURCHASE_TYPE.SUBS,
          quantity: 1,
        });

        const transactionId = (result as { transactionId?: string }).transactionId;
        if (!transactionId) {
          return { success: false, error: "No transaction ID returned" };
        }

        const synced = await syncRevenueCatEntitlementToBackend();
        if (!synced) {
          return {
            success: false,
            error: "Could not sync subscription to server. Check RevenueCat and try again.",
          };
        }

        return { success: true };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Purchase failed";
        if (message.includes("cancelled") || message.includes("canceled")) {
          return { success: false, error: "cancelled" };
        }
        return { success: false, error: message };
      } finally {
        setIsPurchasing(false);
      }
    },
    [isIOSNative]
  );

  const restore = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isIOSNative) return { success: false, error: "Not iOS native" };

    setIsRestoring(true);
    try {
      await NativePurchases.restorePurchases();

      const synced = await syncRevenueCatEntitlementToBackend();
      if (!synced) {
        return {
          success: false,
          error: "Could not restore subscription on server. Check RevenueCat and try again.",
        };
      }

      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Restore failed";
      return { success: false, error: message };
    } finally {
      setIsRestoring(false);
    }
  }, [isIOSNative]);

  const openSubscriptionManagement = useCallback(async (appUserId?: string | null) => {
    if (!isIOSNative) return;

    const iosMajor = await getIosMajorVersionForNative();
    console.log("[Billing] openSubscriptionManagement", { iosMajor });

    // Hard guard first: unknown major or below cutoff → only itms native open, then return.
    // RevenueCat Customer Center is not evaluated on this path (e.g. iOS 17 never reaches RC UI here).
    if (iosMajor == null || iosMajor < IOS_REVENUECAT_UI_MIN_MAJOR) {
      await openAppleSubscriptionManagementItmsOnly();
      return;
    }

    const useRcCustomerCenter = await shouldUseRevenueCatCustomerCenterUi();

    console.log("[Billing] manage billing gate", {
      iosMajor,
      useRcCustomerCenter,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
    });

    if (!useRcCustomerCenter) {
      await openAppleSubscriptionManagementItmsOnly();
      return;
    }

    await bootstrapRevenueCat(appUserId ?? null);
    await syncRevenueCatUILocale();
    console.info("[Billing] Customer Center locale", {
      locale: resolveRevenueCatUILocale(),
    });

    const { RevenueCatUI } = await import("@revenuecat/purchases-capacitor-ui");
    await RevenueCatUI.presentCustomerCenter();
  }, [isIOSNative]);

  return {
    isAvailable: isIOSNative && billingSupported === true,
    /** Native iOS app — enables Manage billing entry; not a guarantee of RevenueCat Customer Center. */
    canManageBillingNatively: isIOSNative,
    products,
    isLoading,
    isPurchasing,
    isRestoring,
    purchase,
    restore,
    openSubscriptionManagement,
    getProductId: (plan: BillingPeriod) => getIAPProductId("premium", plan),
    getProduct: (plan: BillingPeriod) =>
      products.find((p) => p.identifier === getIAPProductId("premium", plan)),
  };
}
