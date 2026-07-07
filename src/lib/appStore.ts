/** Native iOS app link placeholder. */
export const PALETTE_PLOTTING_APP_STORE_ID = "6759469696";

/** Native iOS app link target. */
export const PALETTE_PLOTTING_APP_STORE_URL =
  "https://apps.apple.com/us/app/palette-plotting-app/id6759469696";

/** Native Android app link placeholder. */
export const PALETTE_PLOTTING_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.paletteplotting.app";

/** White badge for dark backgrounds (Apple Marketing Resources API). */
export const APP_STORE_BADGE_WHITE_URL =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83";

/** Native Android badge asset placeholder. */
export const GOOGLE_PLAY_BADGE_URL =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";

/** Display height (px) -- keep in sync with MarketingStoreBadges. */
export const STORE_BADGE_APPLE_HEIGHT_PX = 40;
export const STORE_BADGE_GOOGLE_HEIGHT_PX = 57;
/** Intrinsic assets: 250x83 (Apple), 646x250 (Google). */
export const STORE_BADGE_APPLE_WIDTH_PX = Math.round(
  (250 / 83) * STORE_BADGE_APPLE_HEIGHT_PX,
);
export const STORE_BADGE_GOOGLE_WIDTH_PX = Math.round(
  (646 / 250) * STORE_BADGE_GOOGLE_HEIGHT_PX,
);
export const STORE_BADGE_ROW_HEIGHT_PX = STORE_BADGE_GOOGLE_HEIGHT_PX;

let storeBadgePreloadStarted = false;

/** Warm badge CDN images; Google first -- it is larger and often paints last. */
export function preloadStoreBadgeImages(googleFirst = true): void {
  if (typeof window === "undefined") return;
  const urls = googleFirst
    ? [GOOGLE_PLAY_BADGE_URL, APP_STORE_BADGE_WHITE_URL]
    : [APP_STORE_BADGE_WHITE_URL, GOOGLE_PLAY_BADGE_URL];
  for (const src of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/** Call once per page load (e.g. marketing homepage) so badges are cached before tap. */
export function preloadStoreBadgeImagesOnce(): void {
  if (storeBadgePreloadStarted) return;
  storeBadgePreloadStarted = true;
  preloadStoreBadgeImages(true);
}
