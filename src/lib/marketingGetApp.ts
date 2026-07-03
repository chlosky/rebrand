import { Capacitor } from "@capacitor/core";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { logMarketingHomepageEvent } from "@/lib/logMarketingHomepageEvent";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

export type MobileWebStore = "apple" | "google";

/** User-agent store hint for mobile browsers (not Capacitor native). */
export function getMobileWebStore(): MobileWebStore | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "google";
  if (/iPhone|iPad|iPod/i.test(ua)) return "apple";
  return null;
}

/** Desktop web = browser, wide viewport — show QR section instead of a store link. */
export function isDesktopMarketingWeb(isMobileViewport: boolean): boolean {
  return !Capacitor.isNativePlatform() && !isMobileViewport;
}

export type StoreClickResult =
  | { kind: "scrolled_to_qr" }
  | { kind: "opened_store"; store: MobileWebStore; url: string; copyUrl: string };

type StoreClickOptions = {
  isMobileViewport: boolean;
  forceStore?: MobileWebStore;
  source?: string;
  detection?: InAppBrowserDetection;
  /** When false, only track — navigation is handled by a native `<a href>`. */
  navigate?: boolean;
};

function readClickAttributionDetail(): Record<string, string | number | boolean | undefined> {
  const attribution = readMarketingAttribution();
  let ttclid: string | undefined;
  try {
    ttclid = new URLSearchParams(window.location.search).get("ttclid") ?? undefined;
  } catch {
    /* ignore */
  }
  return {
    utm_source: attribution?.utmSource ?? undefined,
    utm_medium: attribution?.utmMedium ?? undefined,
    utm_campaign: attribution?.utmCampaign ?? undefined,
    utm_content: attribution?.utmContent ?? undefined,
    utm_term: attribution?.utmTerm ?? undefined,
    is_paid: Boolean(attribution?.isPaid),
    from_tiktok: Boolean(attribution?.isFromTikTok),
    ttclid,
  };
}

export function trackStoreClick(
  store: MobileWebStore,
  source: string | undefined,
  detection: InAppBrowserDetection,
): { href: string; copyUrl: string } {
  const href = getMobileStoreHref(store, detection);
  const copyUrl = getCopyableStoreUrl(store);
  const action = store === "apple" ? "cta_app_store_click" : "cta_play_store_click";

  trackMarketingConversion(action, {
    source: source ?? "unknown",
    page_path: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
    content_id: store === "apple" ? "app_store" : "google_play",
    content_name: store === "apple" ? "App Store" : "Google Play",
    in_app_browser: detection.kind ?? "none",
    blocks_app_store: detection.blocksAppStore,
    store_href_scheme: href.split(":")[0],
    ...readClickAttributionDetail(),
  });

  logStoreHandoff("store_click_tracked", {
    source: source ?? "unknown",
    store,
    href,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    in_app_browser: detection.kind ?? "none",
    platform: detection.isIos ? "ios" : detection.isAndroid ? "android" : "unknown",
  });

  return { href, copyUrl };
}

function logHomepageStoreClick(opts: {
  isMobileViewport: boolean;
  clickSource: string | undefined;
  storeTarget: "apple" | "google" | "qr_scroll";
  routedStoreUrl?: string;
}) {
  logMarketingHomepageEvent({
    eventType: "store_click",
    isMobileViewport: opts.isMobileViewport,
    clickSource: opts.clickSource,
    storeTarget: opts.storeTarget,
    routedStoreUrl: opts.routedStoreUrl,
  });
}

/**
 * Centralized "user wants the app" handler.
 * Desktop → scroll to QR. Mobile → track (+ optional programmatic open).
 */
export function handleStoreClick(opts: StoreClickOptions): StoreClickResult {
  const { isMobileViewport, forceStore, source, navigate = true } = opts;
  const detection = opts.detection ?? detectInAppBrowser();

  if (isDesktopMarketingWeb(isMobileViewport)) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section",
      source: source ?? "unknown",
      page_path: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
      content_id: "qr_section",
      content_name: "Download app (QR)",
      ...readClickAttributionDetail(),
    });
    logHomepageStoreClick({
      isMobileViewport,
      clickSource: source,
      storeTarget: "qr_scroll",
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const store =
    forceStore ??
    getMobileWebStore() ??
    (isMobileViewport ? ("apple" as MobileWebStore) : null);
  if (!store) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section_fallback",
      source: source ?? "unknown",
      page_path: typeof window !== "undefined" ? window.location.pathname || "/" : "/",
      content_id: "qr_section",
      content_name: "Download app (QR)",
      ...readClickAttributionDetail(),
    });
    logHomepageStoreClick({
      isMobileViewport,
      clickSource: source,
      storeTarget: "qr_scroll",
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const { href, copyUrl } = trackStoreClick(store, source, detection);
  logHomepageStoreClick({
    isMobileViewport,
    clickSource: source,
    storeTarget: store,
    routedStoreUrl: href,
  });

  if (navigate) {
    openMobileStoreViaAnchor(store, detection);
  }

  return { kind: "opened_store", store, url: href, copyUrl };
}

/** Legacy single-arg handler kept for back-compat with existing callers. */
export function handleMarketingGetAppClick(isMobileViewport: boolean): void {
  handleStoreClick({ isMobileViewport, source: "legacy" });
}

/** Whether a post-tap fallback sheet should be scheduled for this visit. */
export function shouldScheduleStoreFallback(
  isMobileViewport: boolean,
  detection: InAppBrowserDetection,
): boolean {
  if (!isMobileViewport || isDesktopMarketingWeb(isMobileViewport)) return false;
  if (!detection.isInAppBrowser) return false;
  return detection.blocksAppStore || detection.kind !== null;
}
