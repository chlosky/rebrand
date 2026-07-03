import { isMarketingSitePath } from "@/lib/siteRoutes";
import { MARKETING_SURFACE } from "@/components/marketing/marketingVisualTheme";

export const MARKETING_SITE_CHROME_BG = MARKETING_SURFACE;

function normalizeMarketingPath(pathname: string): string {
  return pathname === "/" ? "/" : pathname.replace(/\/$/, "") || "/";
}

/** Status bar / safe-area / browser chrome for public marketing pages (not app shell). */
export function applyMarketingSiteDocumentChrome(pathname: string): boolean {
  if (!isMarketingSitePath(pathname)) return false;

  const baseBg = MARKETING_SITE_CHROME_BG;

  const root = document.documentElement;
  const body = document.body;
  const appRoot = document.getElementById("root");
  root.classList.remove("dark");
  root.style.colorScheme = "light";
  root.dataset.marketingSite = "true";
  root.dataset.appAppearance = "light";
  root.style.backgroundColor = baseBg;
  root.style.background = baseBg;
  body.style.backgroundColor = baseBg;
  body.style.background = baseBg;
  if (appRoot) {
    appRoot.style.backgroundColor = baseBg;
    appRoot.style.background = baseBg;
  }

  const themeMeta = document.querySelector('meta[name="theme-color"]');
  if (themeMeta) themeMeta.setAttribute("content", baseBg);

  const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
  if (appleStatus) appleStatus.setAttribute("content", "default");

  return true;
}

export function clearMarketingSiteDocumentChrome(): void {
  const root = document.documentElement;
  const body = document.body;
  delete root.dataset.marketingSite;
  root.style.backgroundColor = "";
  root.style.background = "";
  body.style.backgroundColor = "";
  body.style.background = "";
  const appRoot = document.getElementById("root");
  if (appRoot) {
    appRoot.style.backgroundColor = "";
    appRoot.style.background = "";
  }
}
