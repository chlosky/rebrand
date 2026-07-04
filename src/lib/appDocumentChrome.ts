import { Capacitor } from "@capacitor/core";
import type { Appearance } from "@/contexts/ThemeContext";
import {
  applyMarketingSiteDocumentChrome,
  clearMarketingSiteDocumentChrome,
} from "@/lib/marketingSiteChrome";

const APP_LIGHT_BG = "#ffffff";
const TOOL_DARK_BG = "#0f0d14";

function applyNativeRootSurfaces(bg: string): void {
  const appRoot = document.getElementById("root");
  document.body.style.backgroundColor = bg;
  if (appRoot) appRoot.style.backgroundColor = bg;
}

function applyDashboardChrome(root: HTMLElement, theme: Appearance): void {
  if (theme === "dark") {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    root.dataset.appAppearance = "dark";
    root.style.backgroundColor = TOOL_DARK_BG;
    applyNativeRootSurfaces(TOOL_DARK_BG);
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    root.dataset.appAppearance = "light";
    root.style.backgroundColor = APP_LIGHT_BG;
    applyNativeRootSurfaces(APP_LIGHT_BG);
  }
}

function applyNeutralAppChrome(root: HTMLElement, theme: Appearance): void {
  applyDashboardChrome(root, theme);
}

/** Android only — iOS keeps web safe-area strips + plist (unchanged since ~205). */
function applyAndroidStatusBarChrome(pathname: string, theme: Appearance): void {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "android") return;

  void import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
    let color: string;
    let style: (typeof Style)["Dark"];

    if (pathname.startsWith("/dashboard")) {
      if (theme === "dark") {
        color = TOOL_DARK_BG;
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
    applyDashboardChrome(root, theme);
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  applyNeutralAppChrome(root, theme);
  applyAndroidStatusBarChrome(pathname, theme);
}
