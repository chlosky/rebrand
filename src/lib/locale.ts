import { enUS, type Locale } from "date-fns/locale";

/** Supported app UI locale. English is the only supported language. */
export type AppLocale = "en";

export const APP_LOCALES: readonly AppLocale[] = ["en"] as const;

export const PREFERRED_LOCALE_STORAGE_KEY = "sv_preferred_locale";

export function isAppLocale(value: string): value is AppLocale {
  return value === "en";
}

/** Canonical app locale (English-only). */
export function resolveAppLocale(_raw: string | null | undefined): AppLocale {
  return "en";
}

/** Map device / browser locale to a supported app locale (English-only). */
export function mapDeviceLocaleToAppLocale(_raw: string | null | undefined): AppLocale {
  return "en";
}

export function readStoredPreferredLocale(): AppLocale | null {
  return null;
}

export function writeStoredPreferredLocale(_locale: AppLocale): void {
  /* English-only: nothing to persist. */
}

/** Locale to send on AI edge-function calls. */
export function resolveLocaleForApi(_draftLocale?: string | null): AppLocale {
  return "en";
}

/** date-fns locale for formatting month/day labels. */
export function dateFnsLocaleForApp(_locale: AppLocale): Locale {
  return enUS;
}

/**
 * RevenueCat paywall locale ID — must match keys in the RC Paywall Localization tab.
 * @see https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/localization
 */
export function revenueCatUILocaleForApp(_locale: AppLocale): string {
  return "en_US";
}

/** OneSignal subscription language (2-letter) for push template selection. */
export function oneSignalLanguageForApp(_locale: AppLocale): string {
  return "en";
}

export const LEGAL_SITE_ORIGIN = "https://paletteplot.com";

export function legalTermsPath(): string {
  return "/terms";
}

export function legalPrivacyPath(): string {
  return "/privacy";
}

export function legalTermsUrl(): string {
  return `${LEGAL_SITE_ORIGIN}${legalTermsPath()}`;
}

export function legalPrivacyUrl(): string {
  return `${LEGAL_SITE_ORIGIN}${legalPrivacyPath()}`;
}

export function detectInitialAppLocale(): AppLocale {
  return "en";
}
