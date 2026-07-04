/** Public brand for paletteplot.com */
export const SITE_NAME = "palette plot";
export const SITE_ORIGIN = "https://paletteplot.com";
export const PRIVACY_POLICY_URL = `${SITE_ORIGIN}/policies/privacy`;
export const SUPPORT_EMAIL = "support@paletteplot.com";
export const BUSINESS_NAME = "palette plot";
export const JSON_LD_SCRIPT_ID = "palette-plot-json-ld";

/** Matches home/content grid — logo lines up with hero text, nav with hero image edge. */
export const SITE_CONTAINER = "mx-auto w-full max-w-5xl px-4 sm:px-6";

/** Replace legacy Veligrid copy from Shopify or old assets with the current brand. */
export function replaceLegacyBrandName(text: string): string {
  return text
    .replace(/\bVeligrid\b/gi, SITE_NAME)
    .replace(/support@veligrid\.com/gi, SUPPORT_EMAIL)
    .replace(/\bveligrid\.com\b/gi, "paletteplot.com");
}

export function pageTitle(suffix: string): string {
  return `${suffix} | ${SITE_NAME}`;
}
