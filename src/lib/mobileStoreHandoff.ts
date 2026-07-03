import {
  PALETTE_PLOTTING_APP_STORE_ID,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import type { InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import type { MobileWebStore } from "@/lib/marketingGetApp";

export { PALETTE_PLOTTING_APP_STORE_ID };
export const PALETTE_PLOTTING_ANDROID_PACKAGE = "com.paletteplotting.app";

/** Opens App Store app on iOS — preferred over https in embedded WebViews. */
export const ITMS_APP_STORE_URL = `itms-apps://itunes.apple.com/app/id${PALETTE_PLOTTING_APP_STORE_ID}`;

function buildAndroidPlayIntentUrl(fallbackHttps: string): string {
  const encodedFallback = encodeURIComponent(fallbackHttps);
  return `intent://play.google.com/store/apps/details?id=${PALETTE_PLOTTING_ANDROID_PACKAGE}#Intent;scheme=https;package=com.android.vending;S.browser_fallback_url=${encodedFallback};end`;
}

/**
 * Best href for a store badge / CTA on this device.
 *
 * In TikTok / Meta / IG WebViews, plain https store URLs often do nothing.
 * Native schemes (`itms-apps://`, Play `intent://`) on a real `<a>` tap are
 * the standard handoff — no instruction sheets required.
 */
export function getMobileStoreHref(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): string {
  const inRestrictedWebView = Boolean(detection?.isInAppBrowser && detection.blocksAppStore);

  if (store === "apple") {
    if (inRestrictedWebView && detection?.isIos) return ITMS_APP_STORE_URL;
    return PALETTE_PLOTTING_APP_STORE_URL;
  }

  if (inRestrictedWebView && detection?.isAndroid) {
    return buildAndroidPlayIntentUrl(PALETTE_PLOTTING_GOOGLE_PLAY_URL);
  }
  return PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** HTTPS URL for clipboard — always paste-friendly in Safari/Chrome. */
export function getCopyableStoreUrl(store: MobileWebStore): string {
  return store === "apple" ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** Fallback when a button (not an anchor) triggers store open — clicks a transient link. */
export function openMobileStoreViaAnchor(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): void {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = getMobileStoreHref(store, detection);
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
