/** Public marketing/legal pages that share the bright palette plotting chrome (not app shell). */

const MARKETING_SITE_EXACT = new Set([
  "/",
  "/about",
  "/cart",
  "/palette-plotting-guide",
  "/dry-erase-boards",
  "/home-decor-boards",
  "/vision-boards",
  "/neon-boards",
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
  "/quiz/life-rebrand",
  "/help/plotting",
]);

const MARKETING_SITE_PREFIXES = ["/policies"];

const APP_ROUTE_PREFIXES = ["/dashboard", "/onboarding"];

export function isMarketingSitePath(pathname: string): boolean {
  const path =
    pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";

  if (path === "/login") return false;
  if (APP_ROUTE_PREFIXES.some((prefix) => path.startsWith(prefix))) return false;

  if (MARKETING_SITE_EXACT.has(path)) return true;
  return MARKETING_SITE_PREFIXES.some((prefix) => path.startsWith(prefix));
}
