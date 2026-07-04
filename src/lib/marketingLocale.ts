/** Marketing site is English-only. Legal path helpers kept for shared call sites. */

/** Stable i18n keys for `pricing.features.*` — identifiers, not translatable copy. */
export const MARKETING_FEATURE_KEYS = [
  "boards",
  "journal",
  "tracking",
] as const;

export function marketingLegalTermsPath(): string {
  return "/terms";
}

export function marketingLegalPrivacyPath(): string {
  return "/privacy";
}

export function marketingLegalAcceptableUsePath(): string {
  return "/acceptable-use";
}

export function marketingLegalBillingPath(): string {
  return "/billing";
}

export function marketingLegalDmcaPath(): string {
  return "/dmca";
}
