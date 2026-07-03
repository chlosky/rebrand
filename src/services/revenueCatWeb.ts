import { Purchases, type Offering, type Package, type Price } from "@revenuecat/purchases-js";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import { gatherOnboardingPrefs } from "@/lib/gatherOnboardingPrefs";
import { resolveRevenueCatUILocale } from "@/services/revenueCat";
import i18n from "@/i18n";

const WEB_PAYWALL_ERROR_I18N_KEYS: Record<string, string> = {
  "Cancelled": "errors.cancelled",
  "Could not complete checkout.": "errors.checkoutFailed",
  "Subscription was not completed.": "errors.subscriptionNotCompleted",
  "RevenueCat Web is not configured (missing API key).": "errors.webNotConfigured",
};

function localizeStoredWebPaywallError(raw: string): string {
  const key = WEB_PAYWALL_ERROR_I18N_KEYS[raw];
  if (key) return i18n.t(key, { ns: "paywall", defaultValue: raw });
  return raw;
}

export const REVENUECAT_WEB_ENTITLEMENT_ID = "Palette Plotting Pro";

let webPurchases: Purchases | null = null;
let configuredAppUserId: string | null = null;

let lastWebPaywallError: string | null = null;

export function getLastWebPaywallError(): string | null {
  if (!lastWebPaywallError) return null;
  return localizeStoredWebPaywallError(lastWebPaywallError);
}

export function setLastWebPaywallError(message: string): void {
  lastWebPaywallError = message;
}

function getRevenueCatWebApiKey(): string | undefined {
  return import.meta.env.VITE_REVENUECAT_WEB_API_KEY as string | undefined;
}

let warnedMissingWebKey = false;

export function isRevenueCatWebConfigured(): boolean {
  const apiKey = getRevenueCatWebApiKey();
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function warnMissingWebKeyOnce(context: string): void {
  if (warnedMissingWebKey) return;
  warnedMissingWebKey = true;
  console.warn(
    `[RevenueCat Web] Missing VITE_REVENUECAT_WEB_API_KEY (${context}). Set it in the build environment and redeploy.`,
  );
}

/**
 * Configure RevenueCat Web Billing (purchases-js). Call after the user is known on web.
 */
export async function bootstrapRevenueCatWeb(appUserId: string | null): Promise<Purchases | null> {
  if (!appUserId || appUserId === "[Not provided]") {
    return null;
  }

  if (!isRevenueCatWebConfigured()) {
    return null;
  }

  const apiKey = getRevenueCatWebApiKey()!.trim();

  try {
    if (!Purchases.isConfigured()) {
      webPurchases = Purchases.configure({
        apiKey,
        appUserId: appUserId ?? undefined,
      });
      configuredAppUserId = appUserId;
      return webPurchases;
    }

    webPurchases = Purchases.getSharedInstance();
    const nextId = appUserId ?? null;
    if (nextId && nextId !== configuredAppUserId) {
      await webPurchases.changeUser(nextId);
      configuredAppUserId = nextId;
    }
    return webPurchases;
  } catch (error) {
    console.error("[RevenueCat Web] Bootstrap failed:", error);
    return null;
  }
}

function customerHasProEntitlement(customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean {
  return typeof customerInfo.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID] !== "undefined";
}

const WEB_DISCOUNT_URL_PARAMS = ["discount_code", "promo_code", "coupon"] as const;

/** Pre-apply RC Web Billing discount from URL (?discount_code=SUMMER30). Web only. */
export function readWebRevenueCatDiscountCodeFromUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  for (const key of WEB_DISCOUNT_URL_PARAMS) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return undefined;
}

export type WebRevenueCatPaywallResult =
  | {
      ok: true;
      purchaseEventId: string;
      purchaseValue: number;
      purchaseCurrency: string;
      productId: string;
      productName: string;
    }
  | { ok: false; cancelled?: boolean };

export type WebRevenueCatCheckoutQuote = {
  value: number;
  currency: string;
  contentId: string;
  contentName: string;
};

function tikTokValueFromPrice(price: Price): { value: number; currency: string } | null {
  const value = price.amountMicros / 1_000_000;
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, currency: price.currency };
}

function defaultPaywallPackage(offering: Offering): Package | null {
  return (
    offering.weekly ??
    offering.monthly ??
    offering.annual ??
    offering.availablePackages[0] ??
    null
  );
}

function checkoutQuoteFromPackage(pkg: Package): WebRevenueCatCheckoutQuote | null {
  const product = pkg.webBillingProduct;
  const priced = tikTokValueFromPrice(product.price);
  if (!priced) return null;
  return {
    value: priced.value,
    currency: priced.currency,
    contentId: product.identifier,
    contentName: product.title || pkg.identifier,
  };
}

/** Stripe / RC Web Billing list price for the default paywall package (weekly first). */
export async function getWebRevenueCatCheckoutQuote(
  appUserId: string | null,
): Promise<WebRevenueCatCheckoutQuote | null> {
  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) return null;

  try {
    const offerings = await purchases.getOfferings();
    const offering = offerings.current;
    if (!offering) return null;
    const pkg = defaultPaywallPackage(offering);
    if (!pkg) return null;
    return checkoutQuoteFromPackage(pkg);
  } catch (error) {
    console.warn("[RevenueCat Web] getOfferings for TikTok quote failed:", error);
    return null;
  }
}

function purchaseQuoteFromPackage(pkg: Package): Omit<WebRevenueCatCheckoutQuote, never> | null {
  return checkoutQuoteFromPackage(pkg);
}

function purchaseEventIdFromCustomerInfo(
  customerInfo: { entitlements: { active: Record<string, unknown> } },
  appUserId: string | null,
): string {
  try {
    const ent = customerInfo.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID] as
      | { productIdentifier?: string; originalPurchaseDate?: string }
      | undefined;
    const pid = ent?.productIdentifier;
    if (pid) {
      const subs = (customerInfo as {
        subscriptionsByProductIdentifier?: Record<
          string,
          { storeTransactionId?: string; originalPurchaseDate?: string }
        >;
      }).subscriptionsByProductIdentifier;
      const tx = subs?.[pid]?.storeTransactionId?.trim();
      if (tx) return `rc_${tx}`;
      const purchaseDate = subs?.[pid]?.originalPurchaseDate ?? ent?.originalPurchaseDate;
      if (purchaseDate) return `rc_${appUserId ?? "web"}_${purchaseDate}`;
    }
  } catch {
    /* ignore */
  }
  return `rc_${appUserId ?? "web"}_${crypto.randomUUID()}`;
}

/**
 * Renders the RevenueCat web paywall (Web Billing checkout).
 * Pass `htmlTarget` (max-w-md host on WebPaywall) so the paywall stays phone-width on desktop.
 */
export async function presentWebRevenueCatPaywall(
  appUserId: string | null,
  options?: {
    htmlTarget?: HTMLElement | null;
    customerEmail?: string | null;
    /** Overrides URL discount params when set. */
    discountCode?: string | null;
  },
): Promise<WebRevenueCatPaywallResult> {
  lastWebPaywallError = null;
  if (!isRevenueCatWebConfigured()) {
    warnMissingWebKeyOnce("web paywall");
    lastWebPaywallError = "RevenueCat Web is not configured (missing API key).";
    return { ok: false };
  }
  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) {
    lastWebPaywallError = "RevenueCat Web is not configured (missing API key).";
    return { ok: false };
  }

  try {
    const discountCode =
      options?.discountCode?.trim() || readWebRevenueCatDiscountCodeFromUrl();

    const selectedLocale = resolveRevenueCatUILocale();
    const result = await purchases.presentPaywall({
      ...(options?.htmlTarget ? { htmlTarget: options.htmlTarget } : {}),
      customerEmail: options?.customerEmail ?? undefined,
      showDiscountCodeField: true,
      selectedLocale,
      defaultLocale: "en_US",
      ...(discountCode ? { discountCode } : {}),
    });

    if (customerHasProEntitlement(result.customerInfo)) {
      lastWebPaywallError = null;
      const quote = purchaseQuoteFromPackage(result.selectedPackage);
      return {
        ok: true,
        purchaseEventId: purchaseEventIdFromCustomerInfo(result.customerInfo, appUserId),
        purchaseValue: quote?.value ?? 0,
        purchaseCurrency: quote?.currency ?? "USD",
        productId: quote?.contentId ?? result.selectedPackage.webBillingProduct.identifier,
        productName: quote?.contentName ?? result.selectedPackage.webBillingProduct.title,
      };
    }

    const entitled = await purchases.isEntitledTo(REVENUECAT_WEB_ENTITLEMENT_ID);
    if (entitled) {
      lastWebPaywallError = null;
      const info = await purchases.getCustomerInfo();
      const ent = info.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID];
      const pid = ent?.productIdentifier;
      let quote: WebRevenueCatCheckoutQuote | null = null;
      if (pid) {
        try {
          const offerings = await purchases.getOfferings();
          const pkg =
            offerings.current?.packagesById[pid] ??
            offerings.current?.availablePackages.find(
              (p) => p.webBillingProduct.identifier === pid,
            ) ??
            null;
          if (pkg) quote = checkoutQuoteFromPackage(pkg);
        } catch {
          /* ignore */
        }
      }
      return {
        ok: true,
        purchaseEventId: purchaseEventIdFromCustomerInfo(info, appUserId),
        purchaseValue: quote?.value ?? 0,
        purchaseCurrency: quote?.currency ?? "USD",
        productId: quote?.contentId ?? pid ?? "web_subscription",
        productName: quote?.contentName ?? "web_subscription",
      };
    }

    lastWebPaywallError = "Subscription was not completed.";
    return { ok: false };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(msg)) {
      lastWebPaywallError = "Cancelled";
      return { ok: false, cancelled: true };
    }
    lastWebPaywallError = msg || "Could not complete checkout.";
    debugLog({
      location: "revenueCatWeb.ts:presentPaywall",
      message: "Web paywall error",
      data: { err: msg },
      hypothesisId: "WEB_RC",
    });
    return { ok: false };
  }
}

/**
 * Sync web purchase to Supabase via existing `sync-revenuecat-entitlement` (same as native).
 */
export async function syncWebRevenueCatEntitlementToBackend(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    console.warn("[RevenueCat Web] Backend sync skipped: no session.");
    return false;
  }

  try {
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

    if (!syncOk) {
      console.warn("[RevenueCat Web] sync-revenuecat-entitlement:", error?.message ?? payload?.error);
    }
    return syncOk;
  } catch (e) {
    console.warn("[RevenueCat Web] Backend sync failed:", e);
    return false;
  }
}

const POST_PURCHASE_INITIAL_DELAY_MS = 800;
const POST_PURCHASE_RETRY_DELAY_MS = 1200;

export async function syncWebRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncWebRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_RETRY_DELAY_MS));
  }
  return false;
}
