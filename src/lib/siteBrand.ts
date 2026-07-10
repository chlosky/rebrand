/** Public brand for palette plotting app + marketing (paletteplotting.com). */
export const SITE_NAME = "palette plotting";
export const SITE_NAME_LOWER = "palette plotting";
export const SITE_SLUG = "palette-plotting";
export const SITE_ORIGIN = "https://paletteplotting.com";
export const PRIVACY_POLICY_URL = `${SITE_ORIGIN}/policies/privacy`;
export const SUPPORT_EMAIL = "support@paletteplotting.com";
export const BUSINESS_NAME = "palette plotting";
export const APP_ID = "com.paletteplotting.app";
export const APP_URL_SCHEME = "paletteplotting";
export const JSON_LD_SCRIPT_ID = "palette-plotting-json-ld";

/** Matches vel / palette plotting content grid. */
export const SITE_CONTAINER = "mx-auto w-full max-w-5xl px-4 sm:px-6";

/** Company wordmark in headers — sans semibold, not Georgia. */
export const BRAND_LOGO_CLASS = "font-sans text-lg font-semibold tracking-tight";

export function replaceLegacyBrandName(text: string): string {
  return text
    .replace(/\bpalette plotting\b/gi, SITE_NAME)
    .replace(/\bpalette plotting\b/g, SITE_NAME)
    .replace(/support@paletteplot\.com/gi, SUPPORT_EMAIL)
    .replace(/\bpaletteplot\.com\b/gi, "paletteplotting.com")
    .replace(/\bVeligrid\b/gi, SITE_NAME_LOWER);
}

export function pageTitle(suffix: string): string {
  return `${suffix} | ${SITE_NAME}`;
}
