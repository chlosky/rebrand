import { enUS, es, ptBR, type Locale } from "date-fns/locale";

/** Supported app UI locales. English strings are the source of truth in JSON. */
export type AppLocale = "en" | "es-419" | "pt-BR";

export const APP_LOCALES: readonly AppLocale[] = ["en", "es-419", "pt-BR"] as const;

export const PREFERRED_LOCALE_STORAGE_KEY = "sv_preferred_locale";

/** Inline switcher labels — always shown in these forms (not translated). */
export const LANGUAGE_SWITCHER_OPTIONS: { code: AppLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es-419", label: "Español" },
  { code: "pt-BR", label: "Português" },
];

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

/** Canonical app locale from i18n.language / resolvedLanguage (es → es-419, pt → pt-BR). */
export function resolveAppLocale(raw: string | null | undefined): AppLocale {
  if (raw && isAppLocale(raw)) return raw;
  return mapDeviceLocaleToAppLocale(raw);
}

/** Map device / browser locale to a supported app locale. */
export function mapDeviceLocaleToAppLocale(raw: string | null | undefined): AppLocale {
  const tag = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (!tag) return "en";
  if (tag === "en" || tag.startsWith("en-")) return "en";
  if (tag === "es-419" || tag.startsWith("es")) return "es-419";
  if (tag === "pt-br" || tag.startsWith("pt")) return "pt-BR";
  return "en";
}

export function readStoredPreferredLocale(): AppLocale | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY);
  return stored && isAppLocale(stored) ? stored : null;
}

export function writeStoredPreferredLocale(locale: AppLocale): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, locale);
}

/** Locale to send on AI edge-function calls (stored pref → draft → device). */
export function resolveLocaleForApi(draftLocale?: string | null): AppLocale {
  const stored = readStoredPreferredLocale();
  if (stored) return stored;
  if (draftLocale && isAppLocale(draftLocale)) return draftLocale;
  return detectInitialAppLocale();
}

/** date-fns locale for formatting month/day labels in the active app language. */
export function dateFnsLocaleForApp(locale: AppLocale): Locale {
  switch (locale) {
    case "es-419":
      return es;
    case "pt-BR":
      return ptBR;
    default:
      return enUS;
  }
}

/**
 * RevenueCat paywall locale IDs (underscores) — must match keys in the RC Paywall Localization tab.
 * App i18n stays BCP-47 (en, es-419, pt-BR); only RC SDK calls use this adapter.
 * @see https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/localization
 */
export function revenueCatUILocaleForApp(locale: AppLocale): string {
  switch (locale) {
    case "es-419":
      return "es_419";
    case "pt-BR":
      return "pt_BR";
    default:
      return "en_US";
  }
}

/** URL segment for localized legal pages (RevenueCat / App Store / public web). */
export type LegalRouteLocale = "ES" | "PT" | "DE" | "FR" | "IT" | "NL" | "ZH" | "AR";

export const LEGAL_ROUTE_LOCALES: readonly LegalRouteLocale[] = [
  "ES",
  "PT",
  "DE",
  "FR",
  "IT",
  "NL",
  "ZH",
  "AR",
] as const;

export function isLegalRouteLocale(value: string): value is LegalRouteLocale {
  return (LEGAL_ROUTE_LOCALES as readonly string[]).includes(value);
}

export function appLocaleToLegalRouteLocale(locale: AppLocale): LegalRouteLocale | null {
  if (locale === "es-419") return "ES";
  if (locale === "pt-BR") return "PT";
  return null;
}

export const LEGAL_SITE_ORIGIN = "https://paletteplot.com";

export function legalTermsPath(locale: AppLocale): string {
  const suffix = appLocaleToLegalRouteLocale(locale);
  return suffix ? `/terms/${suffix}` : "/terms";
}

export function legalPrivacyPath(locale: AppLocale): string {
  const suffix = appLocaleToLegalRouteLocale(locale);
  return suffix ? `/privacy/${suffix}` : "/privacy";
}

export function legalTermsUrl(locale: AppLocale): string {
  return `${LEGAL_SITE_ORIGIN}${legalTermsPath(locale)}`;
}

export function legalPrivacyUrl(locale: AppLocale): string {
  return `${LEGAL_SITE_ORIGIN}${legalPrivacyPath(locale)}`;
}

/** OneSignal subscription language (2-letter) for push template selection. */
export function oneSignalLanguageForApp(locale: AppLocale): string {
  if (locale === "es-419") return "es";
  if (locale === "pt-BR") return "pt";
  return "en";
}

export function detectInitialAppLocale(): AppLocale {
  const stored = readStoredPreferredLocale();
  if (stored) return stored;
  const draftRaw =
    typeof localStorage !== "undefined" ? localStorage.getItem("sv_setup_draft_v1") : null;
  if (draftRaw) {
    try {
      const draft = JSON.parse(draftRaw) as { locale?: string };
      if (draft.locale && isAppLocale(draft.locale)) return draft.locale;
    } catch {
      /* ignore */
    }
  }
  const nav =
    typeof navigator !== "undefined"
      ? navigator.language || (navigator.languages && navigator.languages[0])
      : null;
  return mapDeviceLocaleToAppLocale(nav);
}
