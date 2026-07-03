import type { LegalRouteLocale } from "@/lib/locale";

/** Website marketing pages only — separate from in-app locale (en / es-419 / pt-BR). */
export type MarketingLocale = "ar" | "es-419" | "pt-BR" | "fr" | "de" | "it" | "zh-Hans" | "nl";

export type MarketingDisplayLocale = MarketingLocale | "en";

export const MARKETING_LOCALE_STORAGE_KEY = "sv_marketing_locale";

/** Stable i18n keys for `pricing.features.*` — identifiers, not translatable copy. */
export const MARKETING_FEATURE_KEYS = [
  "boards",
  "subliminal",
  "mirror",
  "affirmations",
  "beliefs",
  "journal",
  "coach",
] as const;

/** Globe menu — English first so visitors can switch back from a translated locale. */
export const MARKETING_LANGUAGE_OPTIONS: { code: MarketingDisplayLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "de", label: "Deutsch" },
  { code: "ar", label: "العربية" },
  { code: "zh-Hans", label: "中文" },
  { code: "nl", label: "Nederlands" },
  { code: "fr", label: "Français" },
  { code: "it", label: "Italiano" },
  { code: "pt-BR", label: "Português (BR)" },
  { code: "es-419", label: "Español" },
];

const MARKETING_LOCALE_SET = new Set<string>(
  MARKETING_LANGUAGE_OPTIONS.map((o) => o.code).filter((code) => code !== "en"),
);

export const MARKETING_LOCALE_TRANSLATED_PATHS = new Set([
  "/",
  "/what-is-palette-plotting",
  "/quiz/blocking-manifestation",
  "/faq",
  "/contact",
  "/pricingplans",
  "/community",
]);

export function isMarketingLocale(value: string): value is MarketingLocale {
  return MARKETING_LOCALE_SET.has(value);
}

export function normalizeMarketingPath(pathname: string): string {
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";
}

export function isMarketingLocaleTranslatedPath(pathname: string): boolean {
  return MARKETING_LOCALE_TRANSLATED_PATHS.has(normalizeMarketingPath(pathname));
}

export function readStoredMarketingLocale(): MarketingLocale | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(MARKETING_LOCALE_STORAGE_KEY);
  return stored && isMarketingLocale(stored) ? stored : null;
}

export function writeStoredMarketingLocale(locale: MarketingLocale): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(MARKETING_LOCALE_STORAGE_KEY, locale);
}

export function clearStoredMarketingLocale(): void {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(MARKETING_LOCALE_STORAGE_KEY);
}

function mapLanguageTagToMarketingLocale(tag: string): MarketingLocale | null {
  const normalized = tag.trim().toLowerCase().replace(/_/g, "-");
  if (!normalized) return null;
  if (normalized.startsWith("ar")) return "ar";
  if (normalized.startsWith("es")) return "es-419";
  if (normalized === "pt-br" || normalized.startsWith("pt")) return "pt-BR";
  if (normalized.startsWith("fr")) return "fr";
  if (normalized.startsWith("de")) return "de";
  if (normalized.startsWith("it")) return "it";
  if (normalized.startsWith("zh")) return "zh-Hans";
  if (normalized.startsWith("nl")) return "nl";
  return null;
}

const COUNTRY_TO_MARKETING_LOCALE: Record<string, MarketingLocale> = {
  SA: "ar",
  AE: "ar",
  EG: "ar",
  QA: "ar",
  KW: "ar",
  BH: "ar",
  OM: "ar",
  JO: "ar",
  LB: "ar",
  MA: "ar",
  DZ: "ar",
  TN: "ar",
  AR: "es-419",
  BO: "es-419",
  CL: "es-419",
  CO: "es-419",
  CR: "es-419",
  CU: "es-419",
  DO: "es-419",
  EC: "es-419",
  ES: "es-419",
  GT: "es-419",
  HN: "es-419",
  MX: "es-419",
  NI: "es-419",
  PA: "es-419",
  PE: "es-419",
  PR: "es-419",
  PY: "es-419",
  SV: "es-419",
  UY: "es-419",
  VE: "es-419",
  BR: "pt-BR",
  PT: "pt-BR",
  FR: "fr",
  BE: "fr",
  LU: "fr",
  MC: "fr",
  DE: "de",
  AT: "de",
  CH: "de",
  IT: "it",
  NL: "nl",
  CN: "zh-Hans",
  TW: "zh-Hans",
  HK: "zh-Hans",
  SG: "zh-Hans",
};

const TIMEZONE_TO_MARKETING_LOCALE: Record<string, MarketingLocale> = {
  "America/Sao_Paulo": "pt-BR",
  "America/Fortaleza": "pt-BR",
  "America/Recife": "pt-BR",
  "America/Manaus": "pt-BR",
  "America/Mexico_City": "es-419",
  "America/Bogota": "es-419",
  "America/Lima": "es-419",
  "America/Santiago": "es-419",
  "America/Buenos_Aires": "es-419",
  "Europe/Madrid": "es-419",
  "Europe/Paris": "fr",
  "Europe/Berlin": "de",
  "Europe/Rome": "it",
  "Europe/Amsterdam": "nl",
  "Asia/Riyadh": "ar",
  "Asia/Dubai": "ar",
  "Asia/Shanghai": "zh-Hans",
  "Asia/Taipei": "zh-Hans",
  "Asia/Hong_Kong": "zh-Hans",
};

function readBrowserLanguageTags(): string[] {
  if (typeof navigator === "undefined") return [];
  const tags: string[] = [];
  if (Array.isArray(navigator.languages)) {
    for (const lang of navigator.languages) {
      if (typeof lang === "string" && lang.trim()) tags.push(lang);
    }
  }
  if (navigator.language?.trim()) tags.push(navigator.language);
  return tags;
}

function readAttributionCountry(): string | null {
  try {
    const raw = localStorage.getItem("sv_attribution_last_touch_v2");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { country?: string | null };
    const country = parsed?.country?.trim().toUpperCase();
    return country && country.length === 2 ? country : null;
  } catch {
    return null;
  }
}

function readTimezoneLocaleHint(): MarketingLocale | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    return tz ? (TIMEZONE_TO_MARKETING_LOCALE[tz] ?? null) : null;
  } catch {
    return null;
  }
}

/** Resolve website marketing locale (stored → browser language → country → timezone → English). */
export function detectMarketingLocale(): MarketingDisplayLocale {
  const stored = readStoredMarketingLocale();
  if (stored) return stored;

  for (const tag of readBrowserLanguageTags()) {
    const mapped = mapLanguageTagToMarketingLocale(tag);
    if (mapped) return mapped;
  }

  const country = readAttributionCountry();
  if (country && COUNTRY_TO_MARKETING_LOCALE[country]) {
    return COUNTRY_TO_MARKETING_LOCALE[country];
  }

  const tzHint = readTimezoneLocaleHint();
  if (tzHint) return tzHint;

  return "en";
}

export function marketingLocaleForPath(
  pathname: string,
  locale: MarketingDisplayLocale,
): MarketingDisplayLocale {
  if (!isMarketingLocaleTranslatedPath(pathname)) return "en";
  return locale;
}

export function marketingLocaleToLegalRoute(locale: MarketingDisplayLocale): LegalRouteLocale | null {
  switch (locale) {
    case "es-419":
      return "ES";
    case "pt-BR":
      return "PT";
    case "fr":
      return "FR";
    case "de":
      return "DE";
    case "it":
      return "IT";
    case "nl":
      return "NL";
    case "zh-Hans":
      return "ZH";
    case "ar":
      return "AR";
    default:
      return null;
  }
}

export function marketingLegalTermsPath(locale: MarketingDisplayLocale): string {
  const route = marketingLocaleToLegalRoute(locale);
  return route ? `/terms/${route}` : "/terms";
}

export function marketingLegalPrivacyPath(locale: MarketingDisplayLocale): string {
  const route = marketingLocaleToLegalRoute(locale);
  return route ? `/privacy/${route}` : "/privacy";
}

export function marketingLegalAcceptableUsePath(locale: MarketingDisplayLocale): string {
  const route = marketingLocaleToLegalRoute(locale);
  return route ? `/acceptable-use/${route}` : "/acceptable-use";
}

export function marketingLegalBillingPath(locale: MarketingDisplayLocale): string {
  const route = marketingLocaleToLegalRoute(locale);
  return route ? `/billing/${route}` : "/billing";
}

export function marketingLegalDmcaPath(locale: MarketingDisplayLocale): string {
  const route = marketingLocaleToLegalRoute(locale);
  return route ? `/dmca/${route}` : "/dmca";
}
