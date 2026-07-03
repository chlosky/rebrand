/** Public brand for Palette Plotting app + marketing (from paletteplot.com / vel). */
export const SITE_NAME = "Palette Plotting";
export const SITE_NAME_LOWER = "palette plotting";
export const SITE_SLUG = "palette-plotting";
export const SITE_ORIGIN = "https://paletteplot.com";
export const PRIVACY_POLICY_URL = `${SITE_ORIGIN}/privacy`;
export const SUPPORT_EMAIL = "support@paletteplot.com";
export const BUSINESS_NAME = "Palette Plotting";
export const APP_ID = "com.paletteplotting.app";
export const APP_URL_SCHEME = "paletteplotting";
export const JSON_LD_SCRIPT_ID = "palette-plotting-json-ld";
export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";

/** Matches vel / palette plot content grid. */
export const SITE_CONTAINER = "mx-auto w-full max-w-5xl px-4 sm:px-6";

export function replaceLegacyBrandName(text: string): string {
  return text
    .replace(/\bPalette Plotting\b/gi, SITE_NAME)
    .replace(/\bPalette Plotting\b/g, SITE_NAME)
    .replace(/support@paletteplotting\.com/gi, SUPPORT_EMAIL)
    .replace(/\bpaletteplotting\.com\b/gi, "paletteplot.com")
    .replace(/\bpaletteplotting\.com\b/gi, "paletteplot.com")
    .replace(/\bVeligrid\b/gi, SITE_NAME_LOWER);
}

export function pageTitle(suffix: string): string {
  return `${suffix} | ${SITE_NAME}`;
}
