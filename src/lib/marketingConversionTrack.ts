/**
 * Marketing conversion event helper.
 *
 * Fires the same event into:
 *   1. sessionStorage (debug breadcrumb, last 20 events)
 *   2. Google Analytics (gtag) — G-64SFCH1EBW in index.html
 *   3. TikTok Pixel (ttq) — Pixel 062026 in index.html
 *   4. TikTok Events API (server) — supabase/functions/tiktok-events + revenuecat-webhook
 *   5. TikTok App Events SDK (Android native) — TikTokEvents Capacitor plugin
 *   6. Meta Pixel (web) — VITE_META_PIXEL_ID
 *   7. Meta App Events (native) — @capgo/capacitor-facebook-analytics
 *   8. AppsFlyer SDK (iOS + Android native) — appsflyer-capacitor-plugin
 *
 * Browser + server share event_id for TikTok deduplication.
 * Meta / AppsFlyer are additive and no-op until their env credentials are set.
 *
 * Web funnel server events:
 *   - web_onboarding_welcome_view / landing_view -> ViewContent
 *   - web_onboarding_signup_complete -> CompleteRegistration
 *   - paywall_view -> InitiateCheckout
 *   - subscription_complete -> Purchase
 */

import { supabase } from "@/integrations/supabase/client";
import { readMarketingTtclid } from "@/lib/useMarketingAttribution";
import { readWebOnboardingClientVisitId } from "@/lib/webOnboardingSessionInsert";
import { Capacitor } from "@capacitor/core";
import { TikTokEvents } from "@/plugins/tikTokEvents";
import { isAppsFlyerConfigured } from "@/lib/appsFlyer";
import { AppsFlyer } from "appsflyer-capacitor-plugin";
import {
  FacebookAnalytics,
  FacebookEventName,
  FacebookEventParameterName,
  isMetaNativeConfigured,
  isMetaPixelConfigured,
} from "@/lib/metaFacebook";

export type MarketingConversionAction =
  | "landing_view"
  | "cta_app_store_click"
  | "cta_play_store_click"
  | "cta_header_app_click"
  | "in_app_prompt_shown"
  | "in_app_open_in_browser"
  | "in_app_copy_link"
  | "newsletter_subscribe"
  | "paywall_view"
  | "subscription_complete"
  | "web_onboarding_welcome_view"
  | "web_onboarding_attribution_view"
  | "web_onboarding_attribution_submit"
  | "web_onboarding_signup_complete"
  | "quiz_start"
  | "quiz_question_view"
  | "quiz_email_capture"
  | "quiz_complete"
  | "quiz_guide_click"
  | "quiz_cta_click"
  /** Legacy / generic — kept so existing callers don't break. */
  | "store_click"
  | "web_onboarding_click";

const SESSION_KEY = "marketing_conversions_v1";

type EventDetail = Record<string, string | number | boolean | undefined>;

type TtqShape = {
  track?: (event: string, params?: Record<string, unknown>) => void;
  page?: (params?: Record<string, unknown>) => void;
};

function persistBreadcrumb(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ action, detail, at: new Date().toISOString() });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
}

function fireGtag(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", action, {
      event_category: "marketing_conversion",
      ...detail,
    });
  } catch {
    /* ignore */
  }
}

function ttqEventsForAction(action: MarketingConversionAction): string[] {
  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
      return ["ViewContent"];
    case "cta_app_store_click":
    case "cta_play_store_click":
      return ["ClickButton", "Download"];
    case "cta_header_app_click":
    case "in_app_prompt_shown":
    case "in_app_open_in_browser":
    case "in_app_copy_link":
    case "store_click":
    case "web_onboarding_click":
      return ["ClickButton"];
    case "newsletter_subscribe":
      return ["Subscribe", "CompleteRegistration"];
    case "quiz_start":
    case "quiz_question_view":
      return ["ViewContent"];
    case "quiz_email_capture":
      return ["Subscribe"];
    case "quiz_complete":
      return ["CompleteRegistration"];
    case "quiz_guide_click":
    case "quiz_cta_click":
      return ["ClickButton"];
    case "web_onboarding_signup_complete":
      return ["CompleteRegistration"];
    case "paywall_view":
      return ["InitiateCheckout"];
    case "subscription_complete":
      return ["Purchase"];
  }
}

function tikTokServerEventForAction(action: MarketingConversionAction): string | null {
  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
      return "ViewContent";
    case "web_onboarding_signup_complete":
      return "CompleteRegistration";
    case "quiz_start":
    case "quiz_question_view":
      return "ViewContent";
    case "quiz_email_capture":
      return "Subscribe";
    case "quiz_complete":
      return "CompleteRegistration";
    case "paywall_view":
      return "InitiateCheckout";
    case "subscription_complete":
      return "Purchase";
    default:
      return null;
  }
}

function readTtpCookie(): string | undefined {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_ttp=([^;]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

function ensureEventId(detail?: EventDetail): EventDetail {
  if (detail?.event_id != null && String(detail.event_id).trim()) {
    return detail;
  }
  return { ...(detail ?? {}), event_id: `sv_${crypto.randomUUID()}` };
}

function resolveContentId(detail?: EventDetail): string {
  if (typeof detail?.content_id === "string" && detail.content_id.trim()) {
    return detail.content_id.trim();
  }
  if (typeof detail?.page_path === "string" && detail.page_path.trim()) {
    return detail.page_path.trim();
  }
  if (typeof window !== "undefined") {
    return window.location.pathname || "/";
  }
  return "/";
}

function buildTtqTrackParams(detail?: EventDetail): Record<string, unknown> {
  const contentId = resolveContentId(detail);
  const contentName =
    typeof detail?.content_name === "string"
      ? detail.content_name
      : typeof detail?.source === "string"
      ? detail.source
      : contentId;

  const ttclid = readMarketingTtclid();
  const eventId = detail?.event_id != null ? String(detail.event_id) : undefined;
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname || "/"}`
      : undefined;

  const rawValue =
    typeof detail?.value === "number" && Number.isFinite(detail.value) ? detail.value : null;
  const hasValue = rawValue != null && rawValue > 0;
  const currency = typeof detail?.currency === "string" ? detail.currency : "USD";

  const contentItem: Record<string, unknown> = {
    content_id: contentId,
    content_type: "product",
    content_name: contentName,
    quantity: 1,
  };
  if (hasValue) {
    contentItem.price = rawValue;
  }

  // TikTok pixel: pass only standard catalog params (do not spread utm_*, source, page_path, etc.).
  const params: Record<string, unknown> = {
    content_id: contentId,
    content_type: "product",
    content_name: contentName,
    contents: [contentItem],
    ...(pageUrl ? { url: pageUrl } : {}),
    ...(ttclid ? { ttclid } : {}),
    ...(eventId ? { event_id: eventId } : {}),
  };
  if (hasValue) {
    params.value = rawValue;
    params.currency = currency;
  }

  return params;
}

function fireTtq(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { ttq?: TtqShape };
    if (!w.ttq?.track) return;
    const events = ttqEventsForAction(action);
    const params = buildTtqTrackParams(detail);
    for (const e of events) {
      w.ttq.track(e, params);
    }
  } catch {
    /* ignore */
  }
}

function fireTikTokEventsApi(action: MarketingConversionAction, detail?: EventDetail) {
  const serverEvent = tikTokServerEventForAction(action);
  if (!serverEvent) return;

  const eventId = detail?.event_id != null ? String(detail.event_id) : "";
  if (!eventId) return;

  const pagePath =
    typeof detail?.page_path === "string"
      ? detail.page_path
      : typeof window !== "undefined"
      ? window.location.pathname || "/"
      : "/";

  const body: Record<string, string | number | undefined> = {
    event: serverEvent,
    event_id: eventId,
    page_path: pagePath,
    content_id: pagePath,
    ttclid: readMarketingTtclid() ?? undefined,
    ttp: readTtpCookie(),
    client_visit_id: readWebOnboardingClientVisitId() ?? undefined,
    referrer: typeof document !== "undefined" && document.referrer ? document.referrer : undefined,
  };

  if (typeof detail?.content_name === "string") {
    body.content_name = detail.content_name;
  } else if (typeof detail?.source === "string") {
    body.content_name = detail.source;
  }

  if (typeof detail?.value === "number" && Number.isFinite(detail.value) && detail.value > 0) {
    body.value = detail.value;
  }
  if (typeof detail?.currency === "string" && body.value != null) {
    body.currency = detail.currency;
  }

  void supabase.functions.invoke("tiktok-events", { body }).catch(() => {
    /* non-blocking */
  });
}

function fireAndroidNativeTikTok(
  action: MarketingConversionAction,
  detail?: EventDetail,
): void {
  if (Capacitor.getPlatform() !== "android") return;

  const contentId = resolveContentId(detail);
  const contentName =
    typeof detail?.content_name === "string"
      ? detail.content_name
      : typeof detail?.source === "string"
        ? detail.source
        : contentId;
  const priced =
    typeof detail?.value === "number" && Number.isFinite(detail.value) && detail.value > 0
      ? {
          value: detail.value,
          currency: typeof detail?.currency === "string" ? detail.currency : "USD",
          price: detail.value,
        }
      : {};

  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
    case "quiz_start":
    case "quiz_question_view":
      void TikTokEvents.trackEvent({
        eventName: "ViewContent",
        contentId,
        contentName,
        contentType: "product",
        ...priced,
      }).catch(() => {});
      return;
    case "web_onboarding_signup_complete":
    case "quiz_complete":
      void TikTokEvents.trackEvent({ eventName: "REGISTRATION" }).catch(() => {});
      return;
    case "newsletter_subscribe":
      void TikTokEvents.trackEvent({ eventName: "SUBSCRIBE" }).catch(() => {});
      return;
    case "paywall_view":
      void TikTokEvents.trackEvent({
        eventName: "Checkout",
        contentId,
        contentName,
        contentType: "product",
        ...priced,
      }).catch(() => {});
      return;
    case "subscription_complete":
      void TikTokEvents.trackEvent({
        eventName: "Purchase",
        contentId: typeof detail?.content_id === "string" ? detail.content_id : "subscription",
        contentName: typeof detail?.content_name === "string" ? detail.content_name : "subscription",
        contentType: "product",
        quantity: 1,
        ...priced,
      }).catch(() => {});
      void TikTokEvents.trackEvent({ eventName: "SUBSCRIBE" }).catch(() => {});
      return;
    default:
      return;
  }
}

type FbqShape = {
  (...args: unknown[]): void;
};

function pricedDetail(detail?: EventDetail): { value?: number; currency: string } {
  const value =
    typeof detail?.value === "number" && Number.isFinite(detail.value) && detail.value > 0
      ? detail.value
      : undefined;
  return {
    value,
    currency: typeof detail?.currency === "string" ? detail.currency : "USD",
  };
}

function buildMetaPixelParams(detail?: EventDetail): Record<string, unknown> {
  const contentId = resolveContentId(detail);
  const contentName =
    typeof detail?.content_name === "string"
      ? detail.content_name
      : typeof detail?.source === "string"
        ? detail.source
        : contentId;
  const { value, currency } = pricedDetail(detail);

  const params: Record<string, unknown> = {
    content_ids: [contentId],
    content_type: "product",
    content_name: contentName,
  };
  if (value != null) {
    params.value = value;
    params.currency = currency;
  }
  return params;
}

function fireMetaPixel(action: MarketingConversionAction, detail?: EventDetail): void {
  if (!isMetaPixelConfigured() || typeof window === "undefined") return;

  try {
    const w = window as Window & { fbq?: FbqShape };
    if (!w.fbq) return;
    const params = buildMetaPixelParams(detail);

    switch (action) {
      case "landing_view":
      case "web_onboarding_welcome_view":
      case "web_onboarding_attribution_view":
      case "quiz_start":
      case "quiz_question_view":
        w.fbq("track", "ViewContent", params);
        return;
      case "web_onboarding_signup_complete":
      case "web_onboarding_attribution_submit":
      case "quiz_complete":
        w.fbq("track", "CompleteRegistration", params);
        return;
      case "newsletter_subscribe":
        w.fbq("track", "Subscribe", params);
        return;
      case "paywall_view":
        w.fbq("track", "InitiateCheckout", params);
        return;
      case "subscription_complete":
        w.fbq("track", "Purchase", params);
        w.fbq("track", "Subscribe", params);
        return;
      default:
        return;
    }
  } catch {
    /* ignore */
  }
}

function fireNativeMetaAppEvents(action: MarketingConversionAction, detail?: EventDetail): void {
  if (!Capacitor.isNativePlatform() || !isMetaNativeConfigured()) return;

  const contentId = resolveContentId(detail);
  const contentName =
    typeof detail?.content_name === "string"
      ? detail.content_name
      : typeof detail?.source === "string"
        ? detail.source
        : contentId;
  const { value, currency } = pricedDetail(detail);
  const contentParams = {
    [FacebookEventParameterName.ContentId]: contentId,
    [FacebookEventParameterName.ContentType]: "product",
    ...(contentName ? { [FacebookEventParameterName.Description]: contentName } : {}),
  };

  const logEvent = (event: string, extra?: { valueToSum?: number; currency?: string }) => {
    void FacebookAnalytics.logEvent({
      event,
      valueToSum: extra?.valueToSum,
      currency: extra?.currency,
      params: contentParams,
    }).catch(() => {});
  };

  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
    case "web_onboarding_attribution_view":
    case "quiz_start":
    case "quiz_question_view":
      logEvent(FacebookEventName.ViewedContent);
      return;
    case "web_onboarding_signup_complete":
    case "web_onboarding_attribution_submit":
    case "quiz_complete":
      logEvent(FacebookEventName.CompletedRegistration);
      return;
    case "newsletter_subscribe":
      logEvent(FacebookEventName.Subscribe);
      return;
    case "paywall_view":
      logEvent(FacebookEventName.InitiatedCheckout, value != null ? { valueToSum: value, currency } : undefined);
      return;
    case "subscription_complete":
      if (value != null) {
        void FacebookAnalytics.logPurchase({ amount: value, currency, params: contentParams }).catch(() => {});
      }
      logEvent(FacebookEventName.Subscribe, value != null ? { valueToSum: value, currency } : undefined);
      return;
    default:
      return;
  }
}

function fireNativeAppsFlyer(action: MarketingConversionAction, detail?: EventDetail): void {
  if (!Capacitor.isNativePlatform() || !isAppsFlyerConfigured()) return;

  const priced =
    typeof detail?.value === "number" && Number.isFinite(detail.value) && detail.value > 0
      ? {
          af_revenue: detail.value,
          af_currency: typeof detail?.currency === "string" ? detail.currency : "USD",
        }
      : undefined;

  const cid =
    typeof detail?.content_id === "string" && detail.content_id.trim()
      ? detail.content_id.trim()
      : typeof detail?.page_path === "string" && detail.page_path.trim()
        ? detail.page_path.trim()
        : undefined;

  const log = (eventName: string, eventValue?: Record<string, string | number>) => {
    void AppsFlyer.logEvent({
      eventName,
      eventValue: {
        ...(cid ? { af_content_id: cid } : {}),
        ...(typeof detail?.content_name === "string" ? { af_content: detail.content_name } : {}),
        ...(typeof detail?.source === "string" ? { af_content: detail.source } : {}),
        ...eventValue,
      },
    }).catch(() => {});
  };

  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
    case "web_onboarding_attribution_view":
    case "quiz_start":
    case "quiz_question_view":
      log("af_content_view");
      return;
    case "web_onboarding_signup_complete":
    case "web_onboarding_attribution_submit":
    case "quiz_complete":
      log("af_complete_registration");
      return;
    case "newsletter_subscribe":
      log("af_subscribe");
      return;
    case "paywall_view":
      log("af_initiated_checkout", priced);
      return;
    case "subscription_complete":
      log("af_purchase", {
        ...(priced ?? { af_currency: "USD" }),
        af_content_id: cid ?? "subscription",
        af_content_type: "subscription",
      });
      log("af_subscribe", priced);
      return;
    default:
      return;
  }
}

export function trackMarketingConversion(
  action: MarketingConversionAction,
  detail?: EventDetail,
): void {
  const withEventId = tikTokServerEventForAction(action) ? ensureEventId(detail) : detail;

  persistBreadcrumb(action, withEventId);
  fireGtag(action, withEventId);
  fireTtq(action, withEventId);
  fireTikTokEventsApi(action, withEventId);
  fireAndroidNativeTikTok(action, withEventId);
  fireMetaPixel(action, withEventId);
  fireNativeMetaAppEvents(action, withEventId);
  fireNativeAppsFlyer(action, withEventId);
}
