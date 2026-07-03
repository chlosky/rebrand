import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapRevenueCat, resolveRevenueCatUILocale, syncRevenueCatUILocale } from "@/services/revenueCat";
import { bootstrapRevenueCatWeb, isRevenueCatWebConfigured } from "@/services/revenueCatWeb";

function managementUrlFromCustomerInfo(managementURL: string | null | undefined): string | null {
  const url = typeof managementURL === "string" ? managementURL.trim() : "";
  return url || null;
}

async function resolveRevenueCatWebBillingManagementUrlFromSdk(
  appUserId: string,
): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    await bootstrapRevenueCat(appUserId);
    const { customerInfo } = await Purchases.getCustomerInfo();
    return managementUrlFromCustomerInfo(customerInfo.managementURL);
  }

  if (!isRevenueCatWebConfigured()) return null;

  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) return null;

  const customerInfo = await purchases.getCustomerInfo();
  return managementUrlFromCustomerInfo(customerInfo.managementURL);
}

async function resolveRevenueCatWebBillingStatusFromBackend(): Promise<{
  webBilling: boolean;
  managementUrl: string | null;
}> {
  const { data, error } = await supabase.functions.invoke("get-revenuecat-billing-portal", {
    body: {},
  });
  if (error) {
    console.warn("[Billing] get-revenuecat-billing-portal:", error.message);
    return { webBilling: false, managementUrl: null };
  }

  const payload = data as { url?: string | null; webBilling?: boolean } | null;
  const url = typeof payload?.url === "string" ? payload.url.trim() : "";
  return {
    webBilling: payload?.webBilling === true,
    managementUrl: url || null,
  };
}

export type RevenueCatWebBillingStatus = {
  webBilling: boolean;
  managementUrl: string | null;
};

/**
 * Whether the user has RC Web Billing and (when available) a portal URL.
 * SDK first for URL; RC REST for reliable webBilling flag on existing customers.
 */
export async function resolveRevenueCatWebBillingStatus(
  appUserId: string,
): Promise<RevenueCatWebBillingStatus> {
  let managementUrl: string | null = null;
  let webBilling = false;

  try {
    managementUrl = await resolveRevenueCatWebBillingManagementUrlFromSdk(appUserId);
    if (managementUrl) webBilling = true;
  } catch (error) {
    console.warn("[Billing] RC web billing SDK lookup failed:", error);
  }

  try {
    const fromBackend = await resolveRevenueCatWebBillingStatusFromBackend();
    webBilling = webBilling || fromBackend.webBilling;
    managementUrl = managementUrl ?? fromBackend.managementUrl;
  } catch (error) {
    console.warn("[Billing] RC web billing backend lookup failed:", error);
  }

  return { webBilling, managementUrl };
}

/** Active RC Web Billing portal URL when available. */
export async function resolveRevenueCatWebBillingManagementUrl(
  appUserId: string,
): Promise<string | null> {
  const { managementUrl } = await resolveRevenueCatWebBillingStatus(appUserId);
  return managementUrl;
}

/** Opens the RC Web Billing customer portal when the user subscribed via web billing. */
export async function openRevenueCatWebBillingPortal(appUserId: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    await bootstrapRevenueCat(appUserId);
    await syncRevenueCatUILocale();
    console.info("[Billing] RC UI locale before web billing portal", {
      locale: resolveRevenueCatUILocale(),
    });
  }

  const url = await resolveRevenueCatWebBillingManagementUrl(appUserId);
  if (!url) return false;

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.location.href = url;
  }
  return true;
}
