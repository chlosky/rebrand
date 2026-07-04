import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

const VISIT_ID_KEY = "sv_marketing_homepage_visit_v1";

export type MarketingHomepageEventType = "page_view" | "store_click";

export type MarketingHomepageStoreTarget = "apple" | "google" | "qr_scroll";

function normalizeMarketingPagePath(pathname: string): string {
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";
}

function resolveMarketingHomepagePagePath(): string {
  if (typeof window === "undefined") return "/";
  return normalizeMarketingPagePath(window.location.pathname || "/");
}

function shouldLogMarketingHomepageEvent(pagePath: string): boolean {
  return (
    pagePath === "/" ||
    pagePath === "/mobilelanding" ||
    pagePath === "/mobilelandingmimi" ||
    pagePath === "/mobilelandingjonni"
  );
}

function readDeviceOs(): string {
  if (typeof navigator === "undefined") return "unknown";
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "android";
  if (/iPhone|iPad|iPod/i.test(ua)) return "ios";
  if (/Windows/i.test(ua)) return "windows";
  if (/Mac OS X|Macintosh/i.test(ua)) return "macos";
  if (/CrOS/i.test(ua)) return "chromeos";
  if (/Linux/i.test(ua)) return "linux";
  return "unknown";
}

export function getMarketingHomepageVisitId(): string {
  try {
    const existing = sessionStorage.getItem(VISIT_ID_KEY);
    if (existing && existing.trim()) return existing.trim();
    const id = crypto.randomUUID();
    sessionStorage.setItem(VISIT_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export function logMarketingHomepageEvent(opts: {
  eventType: MarketingHomepageEventType;
  isMobileViewport: boolean;
  clickSource?: string;
  storeTarget?: MarketingHomepageStoreTarget;
  routedStoreUrl?: string;
}): void {
  if (Capacitor.isNativePlatform()) return;
  if (typeof window === "undefined") return;

  const attribution = readMarketingAttribution();
  const detection = detectInAppBrowser();
  const pagePath = resolveMarketingHomepagePagePath();

  if (!shouldLogMarketingHomepageEvent(pagePath)) return;

  let landingQuery: string | null = null;
  try {
    const q = window.location.search;
    landingQuery = q && q !== "?" ? q.slice(0, 2000) : null;
  } catch {
    /* ignore */
  }

  const payload = {
    event_type: opts.eventType,
    visit_id: getMarketingHomepageVisitId(),
    page_path: pagePath,
    landing_query: landingQuery,
    referrer: typeof document !== "undefined" && document.referrer ? document.referrer : null,
    utm_source: attribution?.utmSource ?? null,
    utm_medium: attribution?.utmMedium ?? null,
    utm_campaign: attribution?.utmCampaign ?? null,
    utm_content: attribution?.utmContent ?? null,
    utm_term: attribution?.utmTerm ?? null,
    click_source: opts.clickSource ?? null,
    store_target: opts.storeTarget ?? null,
    routed_store_url: opts.routedStoreUrl ?? null,
    is_mobile_viewport: opts.isMobileViewport,
    device_os: readDeviceOs(),
    browser_language:
      typeof navigator !== "undefined" && navigator.language ? navigator.language : null,
    timezone: (() => {
      try {
        return Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
      } catch {
        return null;
      }
    })(),
    screen_width: typeof window !== "undefined" ? window.screen?.width ?? null : null,
    screen_height: typeof window !== "undefined" ? window.screen?.height ?? null : null,
    pixel_ratio: typeof window !== "undefined" ? window.devicePixelRatio ?? null : null,
    user_agent: typeof navigator !== "undefined" ? navigator.userAgent || null : null,
    in_app_browser: detection.kind ?? null,
    is_from_tiktok: Boolean(attribution?.isFromTikTok),
  };

  void supabase.functions.invoke("log-marketing-homepage-event", { body: payload }).catch(() => {
    /* non-fatal analytics */
  });
}
