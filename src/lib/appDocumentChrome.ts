import { Capacitor } from "@capacitor/core";
import type { Appearance } from "@/contexts/ThemeContext";
import { WELCOME_DEEP_BLACK_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import {
  applyMarketingSiteDocumentChrome,
  clearMarketingSiteDocumentChrome,
} from "@/lib/marketingSiteChrome";

const COSMIC_SHELL_PREFIXES = ["/onboarding"] as const;

function normalizePath(pathname: string): string {
  if (pathname === "/") return "/";
  return pathname.replace(/\/$/, "") || "/";
}

export function isCosmicShellPath(pathname: string): boolean {
  const path = normalizePath(pathname);
  return COSMIC_SHELL_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`),
  );
}

const APP_LIGHT_BG = "#ffffff";
const DASHBOARD_HOME_DARK_BG = "#0a0812";
const TOOL_DARK_BG = "#0f0d14";

function applyNativeRootSurfaces(bg: string): void {
  const appRoot = document.getElementById("root");
  document.body.style.backgroundColor = bg;
  if (appRoot) appRoot.style.backgroundColor = bg;
}

function applyDashboardChrome(root: HTMLElement, theme: Appearance, pathname: string): void {
  const isHome = normalizePath(pathname) === "/dashboard";
  if (theme === "dark") {
    const darkBg = isHome ? DASHBOARD_HOME_DARK_BG : TOOL_DARK_BG;
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    root.dataset.appAppearance = "dark";
    root.style.backgroundColor = darkBg;
    applyNativeRootSurfaces(darkBg);
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    root.dataset.appAppearance = "light";
    root.style.backgroundColor = APP_LIGHT_BG;
    applyNativeRootSurfaces(APP_LIGHT_BG);
  }
}

function applyCosmicShellChrome(root: HTMLElement): void {
  root.classList.remove("dark");
  root.style.colorScheme = "dark";
  root.dataset.appAppearance = "cosmic";
  root.style.backgroundColor = WELCOME_DEEP_BLACK_BASE;
  applyNativeRootSurfaces(WELCOME_DEEP_BLACK_BASE);
}

function applyNeutralAppChrome(root: HTMLElement, theme: Appearance, pathname: string): void {
  applyDashboardChrome(root, theme, pathname);
}

/** Android only — iOS keeps web safe-area strips + plist (unchanged since ~205). */
function applyAndroidStatusBarChrome(pathname: string, theme: Appearance): void {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  void import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    let color: string;
    let style: (typeof Style)["Dark"];

    if (isCosmicShellPath(pathname)) {
      color = WELCOME_DEEP_BLACK_BASE;
      style = Style.Dark;
    } else if (pathname.startsWith("/dashboard")) {
      if (theme === "dark") {
        color = normalizePath(pathname) === "/dashboard" ? DASHBOARD_HOME_DARK_BG : TOOL_DARK_BG;
        style = Style.Dark;
      } else {
        color = APP_LIGHT_BG;
        style = Style.Light;
      }
    } else if (theme === "dark") {
      color = TOOL_DARK_BG;
      style = Style.Dark;
    } else {
      color = APP_LIGHT_BG;
      style = Style.Light;
    }

    void StatusBar.setOverlaysWebView({ overlay: true });
    void StatusBar.setBackgroundColor({ color });
    void StatusBar.setStyle({ style });
  }).catch(() => {});
}

/**
 * Single source of truth for <html> / <body> chrome by route.
 * Does not write appearance to localStorage — only reflects the active route + preference.
 */
export function applyAppDocumentChrome(pathname: string, theme: Appearance): void {
  if (applyMarketingSiteDocumentChrome(pathname)) {
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  clearMarketingSiteDocumentChrome();

  const root = document.documentElement;

  if (pathname.startsWith("/dashboard")) {
    applyDashboardChrome(root, theme, pathname);
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  if (isCosmicShellPath(pathname)) {
    applyCosmicShellChrome(root);
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  applyNeutralAppChrome(root, theme, pathname);
  applyAndroidStatusBarChrome(pathname, theme);
}
