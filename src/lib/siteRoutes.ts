/** Public marketing/legal pages that share the bright palette plot chrome (not app shell). */

import { LEGAL_ROUTE_LOCALES } from "@/lib/locale";

const LOCALIZED_LEGAL_PATHS = LEGAL_ROUTE_LOCALES.flatMap((locale) => [
  `/terms/${locale}`,
  `/privacy/${locale}`,
  `/acceptable-use/${locale}`,
  `/billing/${locale}`,
  `/dmca/${locale}`,
]);

const MARKETING_SITE_EXACT = new Set([
  "/",
  "/mobilelanding",
  "/mobilelandingBR",
  "/mobilelandingmimi",
  "/mobilelandingjonni",
  "/faq",
  "/what-is-palette-plotting",
  "/terms",
  "/privacy",
  "/acceptable-use",
  "/contact",
  "/community",
  "/billing",
  "/pricingplans",
  "/dmca",
  "/quiz/blocking-manifestation",
  ...LOCALIZED_LEGAL_PATHS,
]);

const MARKETING_SITE_PREFIXES = ["/blog"];

const APP_ROUTE_PREFIXES = ["/dashboard", "/onboarding"];

export function isMarketingSitePath(pathname: string): boolean {
  const path =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";

  if (path === "/login") return false;
  if (APP_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;

  if (MARKETING_SITE_EXACT.has(path)) return true;
  return MARKETING_SITE_PREFIXES.some((prefix) => path.startsWith(prefix));
}
