================================================================================
src/lib/appDocumentChrome.ts
================================================================================
import { Capacitor } from "@capacitor/core";
import type { Appearance } from "@/contexts/ThemeContext";
import { WELCOME_COSMIC_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
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

import { TOOL_PAGE_DARK_BG, TOOL_PAGE_LIGHT_BG } from "@/lib/toolPageThemeStyles";

const DASHBOARD_LIGHT_BG = TOOL_PAGE_LIGHT_BG;
const DASHBOARD_DARK_BG = TOOL_PAGE_DARK_BG;

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
    root.style.backgroundColor = DASHBOARD_DARK_BG;
    applyNativeRootSurfaces(DASHBOARD_DARK_BG);
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    root.dataset.appAppearance = "light";
    root.style.backgroundColor = DASHBOARD_LIGHT_BG;
    applyNativeRootSurfaces(DASHBOARD_LIGHT_BG);
  }
}

function applyCosmicShellChrome(root: HTMLElement): void {
  root.classList.remove("dark");
  root.style.colorScheme = "dark";
  root.dataset.appAppearance = "cosmic";
  root.style.backgroundColor = WELCOME_COSMIC_BASE;
  applyNativeRootSurfaces(WELCOME_COSMIC_BASE);
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

    if (isCosmicShellPath(pathname)) {
      color = WELCOME_COSMIC_BASE;
      style = Style.Dark;
    } else if (pathname.startsWith("/dashboard")) {
      if (theme === "dark") {
        color = DASHBOARD_DARK_BG;
        style = Style.Dark;
      } else {
        color = DASHBOARD_LIGHT_BG;
        style = Style.Light;
      }
    } else if (theme === "dark") {
      color = DASHBOARD_DARK_BG;
      style = Style.Dark;
    } else {
      color = DASHBOARD_LIGHT_BG;
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

  if (isCosmicShellPath(pathname)) {
    applyCosmicShellChrome(root);
    applyAndroidStatusBarChrome(pathname, theme);
    return;
  }

  applyNeutralAppChrome(root, theme);
  applyAndroidStatusBarChrome(pathname, theme);
}


================================================================================
src/lib/nativeSafeArea.ts
================================================================================
import { Capacitor } from "@capacitor/core";

/**
 * Android WebView often reports `env(safe-area-inset-top)` as 0 while the status bar
 * overlays content (`StatusBar.setOverlaysWebView`). iOS keeps real inset values via plist.
 */
export const ANDROID_NATIVE_STATUS_BAR_MIN_PX = 28;

/** Use in inline styles / Tailwind arbitrary values — set on `:root` in index.css. */
export const APP_SAFE_AREA_TOP_VAR = "var(--app-safe-area-top)";

export function appSafeAreaTopCalc(extra: string): string {
  return `calc(${APP_SAFE_AREA_TOP_VAR} + ${extra})`;
}

/** Call once at startup (see main.tsx). */
export function applyNativePlatformDocumentClasses(): void {
  const root = document.documentElement;
  if (!Capacitor.isNativePlatform()) return;
  root.classList.add("capacitor-native");
  if (Capacitor.getPlatform() === "android") {
    root.classList.add("capacitor-android");
  }
}


================================================================================
src/index.css
================================================================================
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Definition of the design system. All colors, gradients, fonts, etc should be defined here. 
All colors MUST be HSL.
*/

@layer base {
  :root {
    color-scheme: light only;
    --background: 0 0% 100%;
    --foreground: 0 0% 0%;

    --card: 0 0% 100%;
    --card-foreground: 0 0% 0%;

    --popover: 0 0% 100%;
    --popover-foreground: 0 0% 0%;

    --primary: 0 0% 20%;
    --primary-foreground: 0 0% 100%;

    --secondary: 0 0% 92%;
    --secondary-foreground: 0 0% 0%;

    --muted: 0 0% 94%;
    --muted-foreground: 0 0% 45%;

    --accent: 0 0% 30%;
    --accent-foreground: 0 0% 100%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 100%;

    --border: 0 0% 20%;
    --input: 0 0% 20%;
    --ring: 0 0% 20%;

    --radius: 0.75rem;

    --gradient-primary: linear-gradient(135deg, hsl(0 0% 20%), hsl(0 0% 30%));
    --gradient-secondary: linear-gradient(135deg, hsl(0 0% 25%), hsl(0 0% 35%));
    --gradient-hero: linear-gradient(180deg, hsl(0 0% 100%) 0%, hsl(0 0% 96%) 100%);
    
    --glow-primary: 0 0 40px hsla(0 0% 0% / 0.15);
    --glow-secondary: 0 0 30px hsla(0 0% 0% / 0.2);

    /* Sliders: soft track + glowing fill (not heavy near-black primary) */
    --slider-track: 0 0% 91%;
    --slider-range: 0 0% 58%;
    --slider-range-glow: 0 0% 72%;
    --slider-thumb-border: 0 0% 82%;
    
    --transition-smooth: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

    /* Subliminal canvas visualizer (defaults: neutral greys) */
    --sv-visualizer-top: 0 0% 18%;
    --sv-visualizer-bottom: 0 0% 35%;
  }

  .dark {
    color-scheme: dark;
    --background: 0 0% 8%;
    --foreground: 0 0% 98%;

    --card: 0 0% 12%;
    --card-foreground: 0 0% 98%;

    --popover: 0 0% 12%;
    --popover-foreground: 0 0% 98%;

    --primary: 0 0% 85%;
    --primary-foreground: 0 0% 8%;

    --secondary: 0 0% 20%;
    --secondary-foreground: 0 0% 98%;

    --muted: 0 0% 18%;
    --muted-foreground: 0 0% 65%;

    --accent: 0 0% 25%;
    --accent-foreground: 0 0% 98%;

    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;

    --border: 0 0% 25%;
    --input: 0 0% 25%;
    --ring: 0 0% 85%;

    --gradient-primary: linear-gradient(135deg, hsl(0 0% 85%), hsl(0 0% 75%));
    --gradient-secondary: linear-gradient(135deg, hsl(0 0% 80%), hsl(0 0% 70%));
    --gradient-hero: linear-gradient(180deg, hsl(0 0% 8%) 0%, hsl(0 0% 12%) 100%);
    
    --glow-primary: 0 0 40px hsla(0 0% 100% / 0.1);
    --glow-secondary: 0 0 30px hsla(0 0% 100% / 0.15);

    /* Track = unfilled (right of thumb); range = filled (left of thumb) */
    --slider-track: 0 0% 38%;
    --slider-range: 0 0% 8%;
    --slider-range-glow: 0 0% 22%;
    --slider-thumb-border: 0 0% 72%;

    /* Dark mode: light grey visualizer */
    --sv-visualizer-top: 0 0% 82%;
    --sv-visualizer-bottom: 0 0% 55%;
  }
}

@layer components {
  .slider-range-fill {
    background-color: hsl(var(--slider-range));
    box-shadow:
      0 0 18px hsl(var(--slider-range-glow) / 0.42),
      0 0 8px hsl(var(--slider-range-glow) / 0.28),
      inset 0 1px 0 hsl(var(--slider-range-glow) / 0.35);
  }
}

@layer base {
  * {
    @apply border-border;
  }

  html, body {
    @apply bg-background text-foreground;
    overflow-x: hidden;
    max-width: 100vw;
  }

  /* Hide scrollbars globally while keeping functionality */
  * {
    scrollbar-width: none; /* Firefox */
    -ms-overflow-style: none; /* IE and Edge */
  }

  *::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
  }

  /* Smooth page transitions */
  #root {
    transition: opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1);
    overflow-x: hidden;
    max-width: 100vw;
  }
}

@layer utilities {
  /* Smooth navigation transitions */
  .transition-smooth {
    transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  .transition-soft {
    transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
  }
  
  /* Smooth page transitions */
  body {
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
  
  /* Safe area padding for PWA status bar (not used on tool-page-shell — see ToolPageSafeAreaInlet) */
  .safe-area-top:not(.tool-page-shell) {
    padding-top: env(safe-area-inset-top);
    position: relative;
  }

  .tool-page-shell {
    position: relative;
  }
  
  /* Marketing site: black safe-area (not app --background white) */
  :root[data-marketing-site="true"] .safe-area-top::before {
    background-color: #000000 !important;
  }

  /* Top safe area follows active appearance tokens (light stays white via --background) */
  .safe-area-top:not(.tool-page-shell)::before {
    content: '';
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: env(safe-area-inset-top, 0px);
    background-color: hsl(var(--background));
    z-index: 40;
    pointer-events: none;
  }
  
  /* Dark tool pages — match toolPageHeader / shell (#0f0d14) */
  .dark .safe-area-top:not(.tool-page-shell)::before {
    background-color: #0f0d14;
  }
}

/* Mobile dashboard tiles — glassmorphism (TEMP: all appearances). */
.dashboard-glass-tile {
  --glass-blur: 24px;
  --glass-saturate: 185%;
  --glass-border: rgba(255, 255, 255, 0.58);
  --glass-bg-top: rgba(255, 255, 255, 0.44);
  --glass-bg-mid: rgba(255, 255, 255, 0.16);
  --glass-bg-bottom: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 12px 40px rgba(15, 23, 42, 0.14), 0 4px 12px rgba(15, 23, 42, 0.08);
  --glass-inset-top: inset 0 1px 0 rgba(255, 255, 255, 0.82);
  --glass-inset-bottom: inset 0 -1px 0 rgba(255, 255, 255, 0.22);

  background: linear-gradient(
    145deg,
    var(--glass-bg-top) 0%,
    var(--glass-bg-mid) 52%,
    var(--glass-bg-bottom) 100%
  ) !important;
  -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  backdrop-filter: blur(var(--glass-blur)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border) !important;
  box-shadow: var(--glass-shadow), var(--glass-inset-top), var(--glass-inset-bottom) !important;
}

.dashboard-glass-tile:active,
.dashboard-glass-tile:hover {
  --glass-bg-top: rgba(255, 255, 255, 0.52);
  --glass-bg-mid: rgba(255, 255, 255, 0.22);
  --glass-shadow: 0 16px 48px rgba(15, 23, 42, 0.18), 0 6px 16px rgba(15, 23, 42, 0.1);
}

/* Tool board tiles: original 56px / 64px footprint — tighter shadow so rows don't look taller */
.dashboard-glass-tile.dashboard-glass-tile--compact {
  --glass-shadow: 0 4px 14px rgba(15, 23, 42, 0.1), 0 1px 4px rgba(15, 23, 42, 0.06);
}

.dashboard-glass-tile.dashboard-glass-tile--compact:active,
.dashboard-glass-tile.dashboard-glass-tile--compact:hover {
  --glass-shadow: 0 6px 18px rgba(15, 23, 42, 0.12), 0 2px 6px rgba(15, 23, 42, 0.08);
}

/* Light + dark — same glass tokens on dashboard tiles */
:root[data-app-appearance="light"] .dashboard-glass-tile,
:root.dark .dashboard-glass-tile,
:root[data-app-appearance="dark"] .dashboard-glass-tile {
  --glass-border: rgba(255, 255, 255, 0.22);
  --glass-bg-top: rgba(255, 255, 255, 0.14);
  --glass-bg-mid: rgba(255, 255, 255, 0.07);
  --glass-bg-bottom: rgba(255, 255, 255, 0.03);
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.28);
  --glass-inset-top: inset 0 1px 0 rgba(255, 255, 255, 0.28);
  --glass-inset-bottom: inset 0 -1px 0 rgba(255, 255, 255, 0.06);
}

/* Mobile dashboard (native + mobile web): dark glass tiles always — not tied to local night. */
.dashboard-mobile-dark-tiles .dashboard-glass-tile {
  --glass-border: rgba(255, 255, 255, 0.22) !important;
  --glass-bg-top: rgba(255, 255, 255, 0.14) !important;
  --glass-bg-mid: rgba(255, 255, 255, 0.07) !important;
  --glass-bg-bottom: rgba(255, 255, 255, 0.03) !important;
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.45), 0 4px 12px rgba(0, 0, 0, 0.28) !important;
  --glass-inset-top: inset 0 1px 0 rgba(255, 255, 255, 0.28) !important;
  --glass-inset-bottom: inset 0 -1px 0 rgba(255, 255, 255, 0.06) !important;
}

.dashboard-mobile-dark-tiles .dashboard-glass-tile:active,
.dashboard-mobile-dark-tiles .dashboard-glass-tile:hover {
  --glass-bg-top: rgba(255, 255, 255, 0.18) !important;
  --glass-bg-mid: rgba(255, 255, 255, 0.09) !important;
  --glass-shadow: 0 16px 48px rgba(0, 0, 0, 0.52), 0 6px 16px rgba(0, 0, 0, 0.32) !important;
}

/* Outside Tailwind layers: Android WebView / Chrome default video overlay (huge play button).
   Prior rules lived under @utilities with a typo (::--) so the overlay selector never matched. */
video::-webkit-media-controls,
video::-webkit-media-controls-enclosure,
video::-webkit-media-controls-overlay-enclosure,
video::-webkit-media-controls-panel,
video::-webkit-media-controls-play-button,
video::-webkit-media-controls-start-playback-button,
video::-webkit-media-controls-overlay-play-button,
video::-webkit-media-controls-timeline,
video::-webkit-media-controls-current-time-display,
video::-webkit-media-controls-time-remaining-display {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

video.mirror-live-video {
  -webkit-appearance: none;
  appearance: none;
}

video.mirror-live-video::-webkit-media-controls,
video.mirror-live-video::-webkit-media-controls-enclosure,
video.mirror-live-video::-webkit-media-controls-overlay-enclosure,
video.mirror-live-video::-webkit-media-controls-panel,
video.mirror-live-video::-webkit-media-controls-play-button,
video.mirror-live-video::-webkit-media-controls-start-playback-button,
video.mirror-live-video::-webkit-media-controls-overlay-play-button {
  display: none !important;
  opacity: 0 !important;
  visibility: hidden !important;
  pointer-events: none !important;
}

/* WebPaywall only: keep RevenueCat embed at onboarding width on desktop */
.web-rc-paywall-host {
  width: 100%;
  max-width: 28rem;
  margin-left: auto;
  margin-right: auto;
}

/* Broken/missing RevenueCat dashboard hero images (see revenueCatPaywallMedia.ts) */
.web-rc-paywall-host [data-rc-hidden-paywall-media="true"] {
  display: none !important;
}

/* Marketing site pages (FAQ, blog, legal) on black — not dashboard/login */
.marketing-site .marketing-site-body .text-muted-foreground {
  color: rgb(255 255 255 / 0.6);
}

.marketing-site .marketing-site-body .text-foreground {
  color: rgb(255 255 255);
}

.marketing-site .marketing-site-body .bg-card {
  background-color: rgb(255 255 255 / 0.05);
  border-color: rgb(255 255 255 / 0.1);
  color: rgb(255 255 255);
}

.marketing-site .marketing-site-body .border-border,
.marketing-site .marketing-site-body .border-border\/60 {
  border-color: rgb(255 255 255 / 0.12);
}

.marketing-site .marketing-site-body .bg-muted\/30 {
  background-color: rgb(255 255 255 / 0.06);
}

.marketing-site .marketing-site-body .bg-muted\/50 {
  background-color: rgb(255 255 255 / 0.08);
}

.marketing-site .marketing-site-body .hover\:bg-muted\/50:hover {
  background-color: rgb(255 255 255 / 0.1);
}

.marketing-site .marketing-site-body .prose {
  color: rgb(255 255 255 / 0.85);
}

.marketing-site .marketing-site-body .prose :where(h1, h2, h3, h4, strong) {
  color: rgb(255 255 255);
}

.marketing-site .marketing-site-body .prose :where(a) {
  color: rgb(251 113 133);
}


================================================================================
src/main.tsx
================================================================================
import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import App from "./App.tsx";
import "./index.css";
import { readStoredAppearance } from "@/lib/appearancePreference";

if (Capacitor.isNativePlatform()) {
  document.documentElement.classList.add("capacitor-native");
  const appearance = readStoredAppearance();
  const isDark = appearance === "dark";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  const bg = isDark ? "#0f0d14" : "#ffffff";
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.documentElement.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;
  const root = document.getElementById("root");
  if (root) root.style.backgroundColor = bg;
  void Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {
    /* plugin may be unavailable in some web previews */
  });
}

createRoot(document.getElementById("root")!).render(<App />);


================================================================================
src/components/ToolPageSafeAreaInlet.tsx
================================================================================
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { getToolPageMobileSafeAreaInlet } from "@/lib/dashboardThemeStyles";

type ToolPageSafeAreaInletProps = {
  className?: string;
};

/** Fixed strip under the status bar on mobile tool pages. */
export function ToolPageSafeAreaInlet({ className }: ToolPageSafeAreaInletProps) {
  const isMobile = useIsMobile();
  const { theme } = useTheme();
  if (!isMobile) return null;

  const inset = getToolPageMobileSafeAreaInlet(theme);

  return (
    <div
      className={cn(
        "fixed left-0 right-0 top-0 z-[45] pointer-events-none",
        inset.className,
        className,
      )}
      style={{ height: "env(safe-area-inset-top, 0px)", ...inset.style }}
      aria-hidden
    />
  );
}


================================================================================
src/lib/toolPageThemeStyles.ts
================================================================================
import type { CSSProperties } from "react";
import type { Appearance } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";

/** Dark tool pages + settings — same chrome as cosmic `DesktopToolSidebar` (`isWebVariant`). */
export function toolPageUsesCosmicShell(theme: Appearance): boolean {
  return theme === "dark";
}

/** Sidebar / page shell background */
export const TOOL_PAGE_DARK_BG = "#0f0d14";

/** Light tool pages — flat white (native WebView + chat header). */
export const TOOL_PAGE_LIGHT_BG = "#ffffff";

/** @deprecated Dashboard-only glass — tool pages use `TOOL_PAGE_DARK_CARD` */
export const TOOL_PAGE_GLASS_CARD =
  "rounded-2xl border border-white/12 bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md shadow-sm text-white";

/** @deprecated Dashboard-only — tool pages use `TOOL_PAGE_DARK_CARD_OVERRIDE` */
export const TOOL_PAGE_GLASS_CARD_OVERRIDE =
  "!rounded-2xl !border-white/12 !bg-gradient-to-b !from-white/14 !to-white/[0.06] !text-white backdrop-blur-md !shadow-sm";

/** Dark tool page cards — transparent outline (Subliminal Maker, Belief Work, etc.) */
export const TOOL_PAGE_DARK_CARD =
  "rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm";

/** Overrides shadcn `Card` default `bg-card` on dark tool pages */
export const TOOL_PAGE_DARK_CARD_OVERRIDE =
  "!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm";

/** Nested panels — transparent with outline only */
export const TOOL_PAGE_TRANSPARENT_PANEL =
  "border border-white/12 bg-transparent text-white backdrop-blur-sm";

/** @deprecated Use `TOOL_PAGE_GLASS_CARD` */
export const TOOL_PAGE_DARK_PANEL = TOOL_PAGE_GLASS_CARD;

/** @deprecated Use `TOOL_PAGE_GLASS_CARD` */
export const TOOL_PAGE_BLACK_GLASS = TOOL_PAGE_GLASS_CARD;

/** Unselected sidebar nav — secondary rows / idle tabs */
export const TOOL_PAGE_DARK_OUTLINE_TILE =
  "border border-transparent text-white/55 transition-colors hover:bg-white/8 hover:text-white/80";

/** @deprecated Use `TOOL_PAGE_DARK_OUTLINE_TILE` */
export const TOOL_PAGE_TRANSPARENT_TILE = TOOL_PAGE_DARK_OUTLINE_TILE;

export function toolPageBoardCardClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return TOOL_PAGE_DARK_CARD;
  return "border border-zinc-200/75 bg-card/75 backdrop-blur-sm";
}

export function toolPageBoardCardHoverClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "hover:bg-white/8";
  return "hover:bg-card/90";
}

export function toolPageInsetPanelClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(TOOL_PAGE_TRANSPARENT_PANEL, "rounded-lg");
  }
  return "bg-card/50 backdrop-blur-sm border border-border/50 rounded-lg";
}

/** Quota cards revealed under the limits gear on tool pages */
export function toolPageGateLimitCardClass(theme: Appearance): string {
  return cn(toolPageInsetPanelClass(theme), "flex-1 px-3 py-2 min-w-0");
}

/** Gear / limits toggle beside tool page subtitles */
export function toolPageLimitsGearButtonClass(theme: Appearance): string {
  return cn(
    "shrink-0 -mt-0.5 p-1.5 rounded-md transition-colors",
    toolPageUsesCosmicShell(theme)
      ? "text-white/55 hover:text-white hover:bg-white/[0.06]"
      : "text-muted-foreground hover:text-foreground hover:bg-muted/60",
  );
}

/** Solid black + white outline — use sparingly */
export const TOOL_PAGE_DARK_ACTION_BUTTON =
  "bg-black border border-white text-white shadow-sm hover:bg-white/8 active:bg-black disabled:opacity-50";

/** Transparent + light outline (Create, New Set, Create New, etc.) */
export const TOOL_PAGE_GHOST_BUTTON =
  "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50";

export function toolPageGhostButtonClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return TOOL_PAGE_GHOST_BUTTON;
  return cn(
    "bg-transparent border border-border/50 text-foreground",
    "hover:bg-muted/50 hover:text-foreground active:text-foreground",
  );
}

export function toolPageOutlineButtonClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return TOOL_PAGE_GHOST_BUTTON;
  return cn(
    "bg-card text-card-foreground border border-border/50",
    "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground",
    "focus-visible:text-card-foreground",
  );
}

/** Alias for outline CTAs (New Set, Create, etc.) */
export function toolPageActionButtonClass(theme: Appearance): string {
  return toolPageOutlineButtonClass(theme);
}

/** List row / track card — panel + hover */
export function toolPageListRowClass(theme: Appearance): string {
  return cn(
    "overflow-hidden rounded-xl shadow-sm",
    toolPageBoardCardClass(theme),
    toolPageBoardCardHoverClass(theme),
    "transition-colors",
  );
}

/** Fixed bottom now-playing bar */
export function toolPageNowPlayingBarClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "fixed inset-x-0 bottom-0 z-[55] rounded-t-xl border-t border-white/20 bg-black backdrop-blur-md",
      "px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom,0px))]",
      "shadow-[0_-8px_32px_rgba(0,0,0,0.5)] text-white",
    );
  }
  return cn(
    "fixed inset-x-0 bottom-0 z-[55] rounded-t-xl border-t border-t-zinc-200/70 bg-background/95 backdrop-blur-md",
    "px-3 pt-2 pb-[max(12px,env(safe-area-inset-bottom,0px))]",
    "shadow-[0_-8px_32px_rgba(0,0,0,0.08)]",
  );
}

export function toolPageNowPlayingIconShellClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-white/20 bg-black/55";
  }
  return "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-muted";
}

export function toolPageNowPlayingRowHoverClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "hover:bg-white/8";
  return "hover:bg-muted/50";
}

/** Embody / Your Double practice tiles */
export function toolPageEmbodyActionButtonClass(theme: Appearance, done: boolean): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "rounded-xl backdrop-blur-sm shadow-lg pointer-events-auto disabled:cursor-not-allowed",
      "border border-white/12 bg-transparent text-white",
      done ? "opacity-60" : "hover:bg-white/[0.06]",
    );
  }
  return cn(
    "rounded-xl backdrop-blur-sm border border-muted-foreground/30 shadow-lg pointer-events-auto disabled:cursor-not-allowed",
    done ? "bg-card/60 hover:bg-card/60 opacity-60" : "bg-card text-card-foreground hover:bg-card/90",
  );
}

export function toolPageEmbodyActionIconClass(theme: Appearance, done: boolean): string {
  if (toolPageUsesCosmicShell(theme)) return done ? "text-white/45" : "text-white";
  return done ? "text-muted-foreground" : "text-card-foreground";
}

export function toolPageEmbodyActionLabelClass(theme: Appearance, done: boolean): string {
  if (toolPageUsesCosmicShell(theme)) return done ? "text-white/45" : "text-white";
  return done ? "text-muted-foreground" : "text-card-foreground";
}

export function toolPageEmbodyPowerCardClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(TOOL_PAGE_DARK_CARD, "flex flex-row items-center justify-start gap-3 px-4");
  }
  return "w-full rounded-xl backdrop-blur-sm border border-muted-foreground/30 shadow-lg flex flex-row items-center justify-start gap-3 px-4 bg-card";
}

/** Mirror Work keeps light controls over the preview — do not cosmic-theme the footer strip */
export function toolPageMirrorShellCardClass(_theme: Appearance): string {
  return "overflow-hidden border border-border bg-white/50 backdrop-blur-sm";
}

export function toolPageFlowStepCardClass(theme: Appearance, accentBorderClass: string): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(TOOL_PAGE_DARK_CARD, "!shadow-none");
  }
  return cn("border bg-card text-card-foreground backdrop-blur-sm", accentBorderClass);
}

/** Belief Work analysis shell — transparent canvas on dark */
export function toolPageBeliefAnalysisCardClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(TOOL_PAGE_DARK_CARD_OVERRIDE, "!shadow-none");
  }
  return "bg-card border border-border";
}

export function toolPageVizCanvasClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "w-full min-h-[600px] border border-zinc-300 rounded-lg bg-white p-4 sm:p-8 overflow-auto";
  }
  return "w-full min-h-[600px] border rounded-lg bg-card p-4 sm:p-8 overflow-auto";
}

export function toolPageBeliefAssumptionNodeClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "bg-zinc-200 border-2 border-zinc-300 rounded-lg px-4 py-3 shadow-md w-full text-center relative text-zinc-900";
  }
  return "bg-secondary border-2 border-border rounded-lg px-4 py-3 shadow-md w-full text-center relative";
}

export function toolPageBeliefSubNodeClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "bg-white border-2 border-black rounded px-3 py-2 shadow-sm w-full text-center text-zinc-900";
  }
  return "bg-card border border-border rounded px-3 py-2 shadow-sm w-full text-center";
}

export function toolPageBeliefConnectorClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "bg-zinc-800";
  return "bg-border";
}

/** Mirror Work settings strip under preview */
export function toolPageMirrorControlsPanelClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "absolute inset-x-0 bottom-0 border-t border-white/20 bg-black/55 backdrop-blur-md p-4 space-y-3 text-white",
    );
  }
  return "absolute inset-x-0 bottom-0 bg-white/90 backdrop-blur-md border-t border-border p-4 space-y-3";
}

export function toolPageMirrorControlLabelClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "text-sm font-medium text-white";
  return "text-sm font-medium text-black";
}

export function toolPageMirrorSelectTriggerClass(theme: Appearance, extra?: string): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "w-full h-10 border border-white/20 bg-black/55 text-white text-left",
      "[&>span]:line-clamp-none [&>span]:whitespace-nowrap [&>span]:overflow-hidden [&>span]:text-ellipsis",
      extra,
    );
  }
  return cn(
    "w-full h-10 bg-white/80 border-border text-black text-left",
    "[&>span]:line-clamp-none [&>span]:whitespace-nowrap [&>span]:overflow-hidden [&>span]:text-ellipsis",
    extra,
  );
}

export function toolPageMirrorSelectContentClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "z-50 border border-white/12 bg-[#0f0d14] text-white";
  }
  return "bg-white z-50 border-border text-black";
}

export function toolPageMirrorSelectItemClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "text-white focus:bg-white/10 focus:text-white";
  }
  return "text-black focus:bg-gray-100 focus:text-black";
}

/** Shadcn Button override so variant default does not win over black glass */
export function toolPagePrimaryButtonClass(theme: Appearance, sizeClass?: string): string {
  return cn(
    toolPageActionButtonClass(theme),
    "!bg-black !text-white !border-white hover:!bg-white/8 hover:!text-white",
    sizeClass,
  );
}

export function toolPageCardClass(theme: Appearance, extra?: string): string {
  return cn("rounded-xl shadow-sm", toolPageBoardCardClass(theme), extra);
}

/** Tool shells: no `safe-area-top` padding — mobile uses `ToolPageSafeAreaInlet` only. */
export function toolPageShellRootClass(theme: Appearance): string {
  return cn(
    "tool-page-shell relative overflow-x-hidden",
    toolPageUsesCosmicShell(theme) ? "text-white bg-[#0f0d14]" : "text-foreground bg-background",
  );
}

/** Page shell background. Light mode: flat white (`bg-background`). Dark: solid cosmic shell. */
export function toolPageShellGradientClass(
  theme: Appearance,
  _tint: "blue" | "purple" | "primary" = "blue",
): string {
  if (toolPageUsesCosmicShell(theme)) return "min-h-screen";
  return "min-h-screen bg-background";
}

/** Solid shell fill — light: white; dark: cosmic. Prevents native WebView chrome bleed-through. */
export function toolPageShellRootStyle(theme: Appearance): CSSProperties {
  if (toolPageUsesCosmicShell(theme)) {
    return { backgroundColor: TOOL_PAGE_DARK_BG };
  }
  return { backgroundColor: TOOL_PAGE_LIGHT_BG };
}

export function toolPageReadabilityOverlayClass(theme: Appearance): string {
  return "hidden";
}

/** Sticky mobile header offset — one notch gap (pairs with `ToolPageSafeAreaInlet`). */
export const TOOL_PAGE_MOBILE_HEADER_STICKY_CLASS =
  "sticky z-50 left-0 right-0 w-full max-md:mt-[env(safe-area-inset-top,0px)] max-md:top-[env(safe-area-inset-top,0px)]";

export function toolPageHeaderClass(theme: Appearance): string {
  const chrome = toolPageMobileHeaderChrome(theme);
  return cn(
    "md:h-16 flex items-center md:py-0 z-50 border-b",
    toolPageUsesCosmicShell(theme) ? "py-2.5 border-white/10" : "py-3 border-primary/10",
    chrome.className,
  );
}

export function toolPageHeaderLayoutClass(isMobile: boolean): string {
  return isMobile ? TOOL_PAGE_MOBILE_HEADER_STICKY_CLASS : "fixed top-0 left-0 right-0";
}

export function toolPageHeaderStyle(
  theme: Appearance,
  isMobile: boolean,
  desktop?: { sidebarCollapsed?: boolean },
): CSSProperties | undefined {
  const chrome = toolPageMobileHeaderChrome(theme);
  if (isMobile) return chrome.style;
  return {
    ...chrome.style,
    top: "env(safe-area-inset-top, 0px)",
    left: desktop?.sidebarCollapsed ? "64px" : "256px",
    right: "0",
    transition: "left 300ms ease-in-out",
  };
}

/** Bottom composer / message input bar on tool pages (e.g. Talk to Guide). */
export function toolPageComposerFooterClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "border-t border-white/10 p-4 z-[48]";
  }
  return cn("border-t border-border bg-background p-4 z-[48]");
}

export function toolPageComposerFooterStyle(theme: Appearance): CSSProperties | undefined {
  if (toolPageUsesCosmicShell(theme)) return { backgroundColor: TOOL_PAGE_DARK_BG };
  return { backgroundColor: TOOL_PAGE_LIGHT_BG };
}

export function toolPageHeaderTitleClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity";
  }
  return "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity";
}

export function toolPageMutedTextClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "text-white/55";
  return "text-muted-foreground";
}

export function toolPageBodyTextClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "text-white";
  return "text-foreground";
}

export function toolPageSafeAreaInletSurface(theme: Appearance): {
  className: string;
  style?: CSSProperties;
} {
  if (toolPageUsesCosmicShell(theme)) {
    return { className: "", style: { backgroundColor: TOOL_PAGE_DARK_BG } };
  }
  return { className: "bg-background", style: { backgroundColor: TOOL_PAGE_LIGHT_BG } };
}

export function toolPageMobileHeaderChrome(theme: Appearance): {
  className: string;
  style?: CSSProperties;
} {
  if (toolPageUsesCosmicShell(theme)) {
    return { className: "border-b border-white/10 bg-[#0f0d14]", style: { backgroundColor: TOOL_PAGE_DARK_BG } };
  }
  return { className: "bg-background", style: { backgroundColor: TOOL_PAGE_LIGHT_BG } };
}

export function toolPageTopSafeAreaStripClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "fixed top-0 left-0 right-0 z-40 bg-[#0f0d14]";
  return "fixed top-0 left-0 right-0 bg-white z-40";
}

export function toolPageShadcnCardClass(theme: Appearance, padding?: string): string {
  if (!toolPageUsesCosmicShell(theme)) return padding ?? "";
  return cn(TOOL_PAGE_DARK_CARD_OVERRIDE, padding);
}

export function toolPageInputClass(theme: Appearance, opts?: { readOnly?: boolean }): string {
  if (!toolPageUsesCosmicShell(theme)) {
    return opts?.readOnly ? "bg-muted opacity-100 cursor-default" : "";
  }
  return cn(
    "!bg-transparent !border-white/12 !text-white placeholder:!text-white/40",
    opts?.readOnly && "!opacity-100 cursor-default",
  );
}

/** Radix `Switch` — transparent track with white outline on dark tool pages */
export function toolPageSwitchClass(theme: Appearance): string {
  if (!toolPageUsesCosmicShell(theme)) return "";
  return cn(
    "border-2 border-white/12 !bg-transparent",
    "data-[state=checked]:!border-white/30 data-[state=checked]:!bg-white/10",
    "data-[state=unchecked]:!bg-transparent",
    "[&>span]:!bg-white/90 [&>span]:shadow-none",
  );
}

/** Radix `Slider` — transparent track + outlined thumb on dark tool pages */
export function toolPageSliderClass(theme: Appearance): string {
  if (!toolPageUsesCosmicShell(theme)) return "";
  return cn(
    "[&>span:first-child]:!bg-transparent [&>span:first-child]:border [&>span:first-child]:!border-white/12",
    "[&>span:first-child_.slider-range-fill]:!bg-white/30 [&>span:first-child_.slider-range-fill]:!shadow-none",
    "[&>span:last-child]:!bg-transparent [&>span:last-child]:!border-white/40 [&>span:last-child]:!shadow-none",
  );
}

/** Short recommendation callouts (e.g. binaural theta hint) */
export function toolPageRecommendHintClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "text-xs font-semibold text-white";
  return "text-xs font-semibold text-foreground";
}

export function toolPageMutedLabelClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "text-white/55";
  return "text-muted-foreground";
}

export function toolPageJourneyLinkClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "rounded-2xl border border-white/12 bg-transparent text-white transition-colors hover:bg-white/[0.06]",
    );
  }
  return "rounded-2xl border border-zinc-200/75 bg-card/75 backdrop-blur-sm hover:bg-card/90";
}

export function toolPageMilestonePanelClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "w-full rounded-xl bg-transparent text-white";
  }
  return cn(
    "w-full rounded-xl border bg-card text-card-foreground backdrop-blur-sm shadow-sm",
    "border-zinc-200/75",
  );
}

export function toolPageMilestoneInnerSurfaceClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "rounded-lg border border-white/12 bg-transparent";
  }
  return "rounded-lg border border-border/70 bg-card shadow-sm";
}

export function toolPageMilestoneTabsListClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "flex w-full h-12 gap-1 p-1 rounded-lg border border-white/12 bg-transparent mb-2";
  }
  return "flex w-full h-12 gap-1 p-1 rounded-lg border border-zinc-200/70 bg-muted mb-2";
}

export function toolPageMilestoneTabsTriggerClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-white/55",
      "border border-transparent hover:bg-white/[0.06] hover:text-white/80",
      "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white",
    );
  }
  return cn(
    "h-full py-2.5 px-3 text-center text-sm font-medium transition-all rounded-md text-muted-foreground data-[state=active]:shadow-sm",
    "data-[state=active]:bg-background data-[state=active]:text-foreground",
  );
}

export function toolPageMilestoneDayIncompleteClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "border border-white/12 bg-transparent";
  }
  return "bg-zinc-100/90 border-neutral-300/85";
}

export function toolPageMilestoneDayCompleteClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "border border-white/30 bg-transparent";
  }
  return "";
}

export function toolPageMilestoneDayHoverClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) return "hover:bg-white/8 hover:text-white/80";
  return "hover:bg-zinc-50/90";
}

export function toolPageMobileMenuPanelClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "border border-white/10 bg-[#0f0d14] text-white backdrop-blur-xl";
  }
  return "bg-gray-100/95 backdrop-blur-xl";
}

export function toolPageTabsListClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return "grid w-full gap-1 p-1 rounded-lg border border-white/12 bg-transparent text-white mb-4";
  }
  return "grid w-full mb-4";
}

export function toolPageTabsTriggerClass(theme: Appearance): string {
  if (toolPageUsesCosmicShell(theme)) {
    return cn(
      "rounded-md border border-transparent text-white/55 transition-colors",
      "hover:bg-white/[0.06] hover:text-white/80",
      "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none",
    );
  }
  return "";
}

export function toolPageRouteUsesCosmicChrome(pathname: string): boolean {
  return (
    pathname === "/dashboard" ||
    pathname.startsWith("/dashboard/") ||
    pathname === "/settings" ||
    pathname.startsWith("/settings")
  );
}


================================================================================
src/pages/Dashboard.tsx
================================================================================
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Moon, Sun, Check, Zap, CircleAlert, ChevronRight, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// import { usePageVisitTracker, useActivityTracker } from "@/hooks/useActivityTracker"; // Disabled
// import { useGamification } from "@/hooks/useGamification"; // Disabled
import { useAuth } from "@/contexts/AuthContext";
import { useEmbodyActivePractices } from "@/hooks/useEmbodyActivePractices";
import confetti from "canvas-confetti";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { dashboardFeatures } from "@/lib/featuresData";
import { useTheme } from "@/contexts/ThemeContext";
import {
  manifestationMeterBarStyle,
  manifestationChargeCheckpointsFromSignalRows,
  manifestationPowerCalendarDateToday,
  MANIFESTATION_POWER_METER_REFRESH_EVENT,
} from "@/lib/manifestationPowerSignals";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { DashboardSkyBackground } from "@/components/dashboard/DashboardSkyBackground";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { DashboardToolIcon } from "@/components/dashboard/DashboardToolIcon";
import {
  dashboardHomeGreetingSubtitleClass,
  dashboardHomeGreetingTitleClass,
  dashboardHomeInspiredDividerClass,
  dashboardHomeInspiredFooterClass,
  dashboardHomeInspiredLabelClass,
  dashboardHomeManifestationMutedClass,
  dashboardHomeManifestationTitleClass,
  dashboardHomeSectionLabelClass,
  dashboardHomeToolChevronClass,
  dashboardHomeToolDescriptionClass,
  dashboardHomeToolTitleClass,
  dashboardHomeUsesCosmicShell,
  dashboardSectionAccentIconClass,
  dashboardMobileManifestationCardClass,
  dashboardMobileToolCardClass,
  dashboardMobileToolCardInnerClass,
  dashboardMobileToolCardStyle,
  dashboardMobileToolGridClass,
  dashboardMobileManifestationDailyLabelClass,
  dashboardMobileManifestationDividerClass,
  dashboardMobileManifestationFooterClass,
  dashboardMobileManifestationHeadingClass,
  dashboardMobileManifestationMeterTrackClass,
  dashboardMobileToolCardHoverClass,
  dashboardMobileToolTitleClass,
  dailyPracticeCellClass,
  dailyPracticeIconClass,
  dailyPracticeLabelClass,
  dashboardHeaderAvatarFallbackClass,
  dashboardHeaderAvatarShellClass,
  dashboardHeaderAvatarTriggerClass,
  dashboardHeaderIconButtonClass,
  dashboardHeaderPillButtonClass,
  getDashboardMobileSafeAreaInlet,
  getDashboardMobileCardSurface,
  manifestationChargeZapIconClass,
  manifestationMeterBarClass,
  manifestationStatusBadgeClass,
  webDashboardManifestationCardClass,
  webDashboardToolCardClass,
} from "@/lib/dashboardThemeStyles";

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function manifestationChargePercent(checkpoints: number): number {
  return Math.min(100, Math.round((Math.min(checkpoints, 3) / 3) * 100));
}

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isBrowserDesktop = !Capacitor.isNativePlatform() && !isMobile;
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobileDashboard = !isBrowserDesktop;
  const mobileCardSurface = getDashboardMobileCardSurface(theme, isMobileDashboard);
  const { activePractices } = useEmbodyActivePractices();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Native: tell the splash gate after first meaningful paint (avoids white flash under splash).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  
  // Character grass overlay: native app only (not mobile web or desktop browser).
  const shouldShowCharacterImage = Capacitor.isNativePlatform();
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  // Initialize firstName from sessionStorage to prevent flash on navigation
  const [firstName, setFirstName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [dashboardAppPowerCheckpoints, setDashboardAppPowerCheckpoints] = useState(0);
  const [dailyPracticeActions, setDailyPracticeActions] = useState<Set<string>>(() => new Set());

  const dailyPracticeCount = dailyPracticeActions.size;
  const dailyPracticeStatus =
    dailyPracticeCount >= 2 && dashboardAppPowerCheckpoints >= 2
      ? "Energetic Match"
      : dailyPracticeCount >= 1 && dashboardAppPowerCheckpoints >= 1
        ? "Aligned"
        : "Needs Alignment";

  // Temporarily disabled for performance - will re-enable with proper logic later
  // const { trackActivity } = useActivityTracker();
  // const { stats, weeklyGoal, trackToolUsage } = useGamification();
  const trackActivity = async () => {}; // Stub
  const stats = null; // Stub
  const weeklyGoal = 7; // Default value
  const trackToolUsage = () => {}; // Stub
  const hasShownConfetti = useRef(false);

  // usePageVisitTracker('dashboard'); // Disabled

  // Set a clean tab title when on the dashboard
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Palette Plotting";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // Note: post-paywall provisioning is handled by the paywall/checkout success flows.

  const refreshManifestationChargeMeter = useCallback(async () => {
    if (!user?.id) return;
    const todayLocal = manifestationPowerCalendarDateToday();
    const powerSignalsRes = await supabase
      .from("manifestation_power_daily_signals")
      .select("signal_kind")
      .eq("user_id", user.id)
      .eq("signal_date", todayLocal);
    const rows = powerSignalsRes.data ?? [];
    setDashboardAppPowerCheckpoints(manifestationChargeCheckpointsFromSignalRows(rows));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    void refreshManifestationChargeMeter();
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshManifestationChargeMeter();
    };
    const onSignal = () => void refreshManifestationChargeMeter();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(MANIFESTATION_POWER_METER_REFRESH_EVENT, onSignal);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(MANIFESTATION_POWER_METER_REFRESH_EVENT, onSignal);
    };
  }, [user?.id, refreshManifestationChargeMeter]);

  useEffect(() => {
    if (!user?.id) return;

    const loadDailyPractice = async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { data } = await supabase
        .from("user_double_progress")
        .select("completed_actions")
        .eq("user_id", user.id)
        .eq("progress_date", today)
        .maybeSingle();

      const actions = Array.isArray(data?.completed_actions) ? (data!.completed_actions as string[]) : [];
      setDailyPracticeActions(new Set(actions));
    };

    void loadDailyPractice();
    const onVis = () => {
      if (document.visibilityState === "visible") void loadDailyPractice();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user?.id]);

  // Load firstName from sessionStorage when user is available
  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      const cachedFirstName = sessionStorage.getItem(`dashboard_firstName_${user.id}`);
      if (cachedFirstName) {
        setFirstName(cachedFirstName);
      }
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        setUserEmail(user.email || "");

        const profileQuery = supabase
          .from('profiles')
          .select('first_name, username, avatar_url')
          .eq('id', user.id)
          .maybeSingle();

        const prefsQuery = supabase
          .from('user_preferences')
          .select('selected_character')
          .eq('user_id', user.id)
          .maybeSingle();

        const [{ data: profileData }, { data: preferences }] = await Promise.all([profileQuery, prefsQuery]);

        if (profileData) {
          const name = profileData.first_name || "";
          setFirstName(name);
          setUsername(profileData.username || "");
          setAvatarUrl(profileData.avatar_url || "");
          if (typeof window !== 'undefined' && user.id) {
            sessionStorage.setItem(`dashboard_firstName_${user.id}`, name);
          }
        }

        if (preferences?.selected_character) {
          setSelectedCharacter(preferences.selected_character);
        }

      }
    };

    fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    // await trackActivity({ action: 'user_logout' }); // Disabled
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/");
    }
  };
  
  const handleToolClick = (path: string) => {
    setTimeout(() => navigate(path), 100);
  };


  // Confetti celebration when weekly goal is reached
  useEffect(() => {
    if (stats?.tools_used_this_week?.length === weeklyGoal && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [stats?.tools_used_this_week?.length, weeklyGoal]);

  if (isBrowserDesktop) {
    const chargePct = manifestationChargePercent(dashboardAppPowerCheckpoints);
    const displayName = firstName.trim() || "there";
    const sidebarWidth = sidebarCollapsed ? 64 : 256;
    const cosmicHome = dashboardHomeUsesCosmicShell(theme);

    return (
      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden font-sans antialiased",
          cosmicHome ? "text-white" : "bg-background text-foreground",
        )}
        style={cosmicHome ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
      >
        {cosmicHome ? (
          <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
        ) : (
          <DashboardSkyBackground fixedBackground />
        )}
        <DesktopToolSidebar
          variant={cosmicHome ? "web" : "default"}
          appearance={theme}
          onCollapsedChange={setSidebarCollapsed}
          className="!top-0 h-screen"
        />

        <div
          className="relative z-10 flex min-h-screen flex-col overflow-y-auto transition-[margin-left] duration-300 ease-in-out"
          style={{ marginLeft: sidebarWidth }}
        >
          <header
            className={cn(
              "fixed top-0 right-0 z-50 flex h-16 shrink-0 items-center border-b backdrop-blur-md",
              cosmicHome ? "border-white/[0.06] bg-[#0a0812]/80" : "border-border/80 bg-background/80",
            )}
            style={{
              top: "env(safe-area-inset-top, 0px)",
              left: sidebarWidth,
              transition: "left 300ms ease-in-out",
            }}
          >
            <div className="flex w-full items-center justify-end gap-2 px-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/your-journey/chat")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderPillButtonClass(theme)}
              >
                Talk to Guide
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderIconButtonClass(theme)}
                    aria-label="Appearance"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Moon className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-52 z-50",
                    theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-white shadow-sm" aria-hidden />
                    <span className="flex-1">Light</span>
                    {theme === "light" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-border bg-[hsl(0_0%_12%)] shadow-sm"
                      aria-hidden
                    />
                    <span className="flex-1">Dark</span>
                    {theme === "dark" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={dashboardHeaderAvatarTriggerClass(theme)}
                  >
                    <Avatar className={dashboardHeaderAvatarShellClass(theme)}>
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={username || userEmail} /> : null}
                      <AvatarFallback className={dashboardHeaderAvatarFallbackClass(theme)}>
                        {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-56 z-50",
                    theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username || "User"}</p>
                      <p
                        className={cn(
                          "text-xs leading-none",
                          theme === "dark" ? "text-white/55" : "text-muted-foreground",
                        )}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Your Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/report-issue")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderIconButtonClass(theme)}
                aria-label="Report an issue or request a feature"
              >
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </header>

          <main
            className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 sm:py-6"
            style={{
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 4rem + 1.5rem)",
            }}
          >
            <div className="mb-6 sm:mb-8">
              <h1 className={dashboardHomeGreetingTitleClass(theme)}>
                {timeOfDayGreeting()}, {displayName}.
              </h1>
              <p className={cn("mt-2 sm:mt-3", dashboardHomeGreetingSubtitleClass(theme))}>
                Everything you need to manifest, in one place.
              </p>
            </div>

            <section
              className={cn(
                webDashboardManifestationCardClass(theme, dashboardAppPowerCheckpoints),
                "mb-4 sm:mb-6 p-4 sm:p-6",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className={manifestationChargeZapIconClass(theme)} aria-hidden />
                  <div>
                    <p className={dashboardHomeManifestationTitleClass(theme)}>Manifestation Charge</p>
                    <p className={dashboardHomeManifestationMutedClass(theme)}>{chargePct}% aligned today</p>
                  </div>
                </div>
                <span className={manifestationStatusBadgeClass(theme)}>{dailyPracticeStatus}</span>
              </div>

              <div className={cn("mt-4", dashboardMobileManifestationMeterTrackClass(theme, false))}>
                <div
                  className={manifestationMeterBarClass(theme)}
                  style={manifestationMeterBarStyle(dashboardAppPowerCheckpoints)}
                />
              </div>

              <div className={dashboardHomeInspiredDividerClass(theme)}>
                <p className={dashboardHomeInspiredLabelClass(theme)}>Inspired Actions</p>
                <div className="mt-2 grid grid-cols-5 gap-2 sm:mt-3 sm:gap-2.5">
                  {activePractices.map((practice) => {
                    const done = dailyPracticeActions.has(practice.key);
                    const Icon = practice.Icon;
                    return (
                      <div key={practice.key} className={dailyPracticeCellClass(theme, done)}>
                        <Icon className={dailyPracticeIconClass(theme, done)} />
                        <p className={dailyPracticeLabelClass(theme, done)}>{practice.shortLabel}</p>
                      </div>
                    );
                  })}
                </div>
                <p className={dashboardHomeInspiredFooterClass(theme)}>
                  Affirm daily & embody the new story for coherence and alignment.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <Wrench className={dashboardSectionAccentIconClass(theme)} />
                <h2 className={dashboardHomeSectionLabelClass(theme)}>Your tools</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {dashboardFeatures.map((tool) => (
                  <button
                    key={tool.path}
                    type="button"
                    onClick={() => handleToolClick(tool.path)}
                    className={webDashboardToolCardClass(theme)}
                  >
                    <DashboardToolIcon icon={tool.icon} theme={theme} />
                    <span className="min-w-0 flex-1">
                      <span className={dashboardHomeToolTitleClass(theme)}>{tool.title}</span>
                      <span className={dashboardHomeToolDescriptionClass(theme)}>{tool.description}</span>
                    </span>
                    <ChevronRight className={dashboardHomeToolChevronClass(theme)} />
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const showMobileCharacter =
    shouldShowCharacterImage && !!selectedCharacter && theme === "light";
  const displayName = firstName.trim() || "there";
  const cosmicHome = dashboardHomeUsesCosmicShell(theme);
  const mobileSafeAreaInlet = getDashboardMobileSafeAreaInlet(theme, isMobileDashboard);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden font-sans antialiased",
        cosmicHome ? "text-white" : "bg-background text-foreground",
        showMobileCharacter ? "overflow-x-hidden pb-0" : "pb-20 md:pb-0",
      )}
      style={cosmicHome ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
    >
      {/* Desktop Sidebar - Desktop only */}
      {!isMobile && (
        <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />
      )}

      {cosmicHome ? (
        <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      ) : (
        <DashboardSkyBackground fixedBackground={!isMobile} />
      )}

      {/* Character overlay — native app, light theme only */}
      {showMobileCharacter && selectedCharacter && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[2] pointer-events-none"
          style={{
            height: "40vh",
            backgroundImage: `url(${encodeURI(`/Dash & Cat Background Overlays/${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} - Grass.png`)})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {isMobileDashboard ? (
        <div
          className={cn(
            "pointer-events-none fixed top-0 left-0 right-0 z-40",
            mobileSafeAreaInlet.className,
          )}
          style={{
            height: "env(safe-area-inset-top, 0px)",
            ...mobileSafeAreaInlet.style,
          }}
          aria-hidden
        />
      ) : null}
      
      {/* Content Container - Add left margin on desktop to account for sidebar */}
      <div 
        className="relative z-10 md:dark:border-l md:dark:border-border"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
      {/* Header */}
      <header
        className={cn(
          "sticky z-50 flex items-center border-b py-3 backdrop-blur-md md:h-16 md:py-0",
          cosmicHome ? "border-white/[0.06] bg-[#0a0812]/80" : "border-border/80 bg-background/80",
        )}
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h1
                  className={cn(
                    "cursor-pointer font-sans text-sm font-semibold tracking-tight transition-opacity [-webkit-tap-highlight-color:transparent]",
                    "supports-[hover:hover]:hover:opacity-80",
                    cosmicHome ? "text-white/90" : "text-foreground",
                  )}
                  onClick={() => navigate("/")}
                >
                  Palette Plotting
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Tutorial, Dark Mode, and Profile Buttons */}
              <div 
                className="flex items-center gap-2"
                style={isMobile && !isStandalone ? { marginRight: '0.5rem' } : {}}
              >
              {/* Talk to Guide (replaces tutorial CTA for now) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/your-journey/chat")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderPillButtonClass(theme)}
                aria-label="Talk to Guide"
              >
                Talk to Guide
              </Button>
              
              {/* Appearance (light / dark / tinted backgrounds) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderIconButtonClass(theme)}
                    aria-label="Appearance"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Moon className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-52 z-50",
                    theme === "dark"
                      ? "border border-white/12 bg-[#0f0d14] text-white"
                      : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-white shadow-sm" aria-hidden />
                    <span className="flex-1">Light</span>
                    {theme === "light" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-[hsl(0_0%_12%)] shadow-sm" aria-hidden />
                    <span className="flex-1">Dark</span>
                    {theme === "dark" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onPointerUp={(e) => e.currentTarget.blur()}
                      className={dashboardHeaderAvatarTriggerClass(theme)}
                    >
                      <Avatar className={dashboardHeaderAvatarShellClass(theme)}>
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={username || userEmail} />}
                        <AvatarFallback className={dashboardHeaderAvatarFallbackClass(theme)}>
                        {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-56 z-50",
                    theme === "dark"
                      ? "border border-white/12 bg-[#0f0d14] text-white"
                      : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username || "User"}</p>
                      <p
                        className={cn(
                          "text-xs leading-none",
                          theme === "dark" ? "text-white/55" : "text-muted-foreground",
                        )}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="glow-icon-gradient mr-2 h-4 w-4" />
                    <span>Your Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="glow-icon-gradient mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/report-issue")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderIconButtonClass(theme)}
                aria-label="Report an issue or request a feature"
              >
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
              </div>
              {isMobile && (
                <div className="md:hidden">
                  <MobilePWAMenu />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "container mx-auto px-4 sm:px-6 py-3 sm:py-6 relative z-10",
          showMobileCharacter ? "pb-0" : "pb-24 md:pb-20",
        )}
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
      >
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-8">
          <h2 className={dashboardHomeGreetingTitleClass(theme)}>
            {timeOfDayGreeting()}, {displayName}.
          </h2>
          <p className={cn("mt-2 sm:mt-3", dashboardHomeGreetingSubtitleClass(theme))}>
            Everything you need to manifest, in one place.
          </p>
        </div>

        <div
          className={cn(
            dashboardMobileManifestationCardClass(theme, dashboardAppPowerCheckpoints, isMobileDashboard),
            mobileCardSurface.className,
          )}
          style={mobileCardSurface.style}
        >
          <div className="p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className={manifestationChargeZapIconClass(theme, isMobileDashboard)} aria-hidden />
                <p className={dashboardMobileManifestationHeadingClass(theme, isMobileDashboard)}>
                  Manifestation Charge
                </p>
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full border",
                  manifestationStatusBadgeClass(theme, isMobileDashboard),
                )}
              >
                {dailyPracticeStatus}
              </span>
            </div>

            <div className={dashboardMobileManifestationMeterTrackClass(theme, isMobileDashboard)}>
              <div
                className={manifestationMeterBarClass(theme, isMobileDashboard)}
                style={manifestationMeterBarStyle(dashboardAppPowerCheckpoints)}
              />
            </div>

            <div className={dashboardMobileManifestationDividerClass(theme, isMobileDashboard)}>
              <div className="flex items-center justify-between">
                <p className={dashboardMobileManifestationDailyLabelClass(theme, isMobileDashboard)}>
                  Inspired Actions
                </p>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {activePractices.map((practice) => {
                  const key = practice.key;
                  const Icon = practice.Icon;
                  const label = practice.shortLabel;
                  const done = dailyPracticeActions.has(key);
                  const cellClass = dailyPracticeCellClass(theme, done, isMobileDashboard);
                  const iconClass = dailyPracticeIconClass(theme, done, isMobileDashboard);
                  const labelClass = dailyPracticeLabelClass(theme, done, isMobileDashboard);
                  return (
                    <div
                      key={key}
                      className={cn("rounded-xl border px-1.5 py-2 text-center transition-colors", cellClass)}
                    >
                      <Icon className={iconClass} />
                      <div className={labelClass}>{label}</div>
                    </div>
                  );
                })}
              </div>
              <p className={dashboardMobileManifestationFooterClass(theme, isMobileDashboard)}>
                Affirm daily & embody the new story for coherence and alignment.
              </p>
            </div>
          </div>
        </div>

        {/* Main tool board: 2 columns × 3 rows (compact cards) */}
        <div className={dashboardMobileToolGridClass(isMobileDashboard)}>
          {dashboardFeatures.map((tool, index) => {
            return (
              <div
                key={tool.path}
                role="button"
                tabIndex={0}
                className={dashboardMobileToolCardClass(theme, isMobileDashboard)}
                style={{
                  ...mobileCardSurface.style,
                  ...dashboardMobileToolCardStyle(isMobileDashboard),
                  animationDelay: `${index * 0.05}s`,
                }}
                onClick={() => handleToolClick(tool.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToolClick(tool.path);
                  }
                }}
              >
                <div
                  className={dashboardMobileToolCardHoverClass(theme, isMobileDashboard)}
                  style={{
                    transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                <div className={dashboardMobileToolCardInnerClass(isMobileDashboard)}>
                  <DashboardToolIcon
                    icon={tool.icon}
                    theme={theme}
                    size="sm"
                    isMobileDashboard={isMobileDashboard}
                  />
                  <div className="flex-1 min-w-0 relative z-10 flex items-center">
                    <h3 className={dashboardMobileToolTitleClass(theme, isMobileDashboard)}>
                      {tool.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      </div>
    </div>
  );
};

export default Dashboard;


================================================================================
src/components/onboarding/SetupPage.tsx
================================================================================
import { ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { ONBOARDING_SETUP_PROGRESS_ROUTES } from "@/lib/onboardingFlow";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import {
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

type Props = {
  onBack?: () => void;
  headerSlot?: ReactNode;
  /** When true, do not force light mode / overwrite theme (use after theme picker). Default false. */
  respectUserTheme?: boolean;
  /** Native only: skip the inner scroll viewport (short pages where overflow clips shadows/glow). */
  disableNativeScrollViewport?: boolean;
};

export function SetupPage({
  children,
  canContinue = true,
  continueText = "Continue",
  onContinue,
  onBack,
  headerSlot,
  respectUserTheme: _respectUserTheme = false,
  disableNativeScrollViewport = false,
}: Props) {
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const isAndroidNative = isNative && Capacitor.getPlatform() === "android";
  const { pathname } = useLocation();
  const { ensureSession } = useOnboardingSession();

  /** Same warm-up as legacy onboarding (`OnboardingQuestions`): create `onboarding_session` creds before draft syncs. */
  useEffect(() => {
    void ensureSession().catch(() => {});
  }, [ensureSession]);

  const setupProgressFillPct = useMemo(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const idx = (ONBOARDING_SETUP_PROGRESS_ROUTES as readonly string[]).indexOf(path);
    if (idx < 0) return null;
    const n = ONBOARDING_SETUP_PROGRESS_ROUTES.length;
    return ((idx + 1) / n) * 100;
  }, [pathname]);

  const showNativeMobileFooter = isNative && (onBack != null || onContinue != null);

  const mainColumn = (
    <>
      {headerSlot ? <div className="flex items-center justify-between">{headerSlot}</div> : null}
      {children}
    </>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden font-sans text-white antialiased",
        isNative ? "h-[100dvh] max-h-[100dvh]" : "min-h-screen",
      )}
      style={{ backgroundColor: WELCOME_COSMIC_BASE }}
    >
      <WelcomeCosmicBackground
        className={cn(
          "pointer-events-none inset-0 z-0",
          disableNativeScrollViewport ? "absolute" : "fixed",
        )}
      />

      {isAndroidNative ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[45]"
          style={{
            height: "env(safe-area-inset-top, 0px)",
            backgroundColor: WELCOME_COSMIC_BASE,
          }}
          aria-hidden
        />
      ) : null}

      {setupProgressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-12",
            isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full bg-white/20",
            )}
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-300 ease-out bg-white/90")}
              style={{ width: `${setupProgressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex flex-col items-center animate-fade-in",
          isNative ? "h-full min-h-0 px-8 pb-40" : "min-h-screen justify-between pt-12 p-8 md:pt-24",
        )}
        style={
          isNative
            ? { paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" }
            : undefined
        }
      >
        {isNative ? (
          disableNativeScrollViewport ? (
            <div className="relative z-[1] isolate flex h-0 min-h-0 w-full max-w-md flex-1 basis-0 flex-col overflow-hidden">
              <div className="flex h-0 min-h-0 flex-1 basis-0 flex-col overflow-hidden pb-3">
                {mainColumn}
              </div>
            </div>
          ) : (
            <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
              <div className="relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                <div className="space-y-6 pb-3">{mainColumn}</div>
              </div>
            </div>
          )
        ) : (
          <div className="relative z-[1] isolate w-full max-w-md space-y-6">{mainColumn}</div>
        )}

        <div className="hidden md:block">
          {onBack ? (
            <button
              onClick={onBack}
              className={cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")}
              aria-label="Back"
            >
              <ChevronLeft className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
            </button>
          ) : null}
          {onContinue ? (
            <button
              onClick={() => canContinue && onContinue()}
              disabled={!canContinue}
              className={cn(
                SETUP_DESKTOP_CHEVRON_CLASS,
                "right-8 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              aria-label="Continue"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          ) : null}
        </div>

        {showNativeMobileFooter ? (
          <div
            className="fixed inset-x-0 bottom-0 z-40 md:hidden"
            style={{
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
              backgroundColor: WELCOME_COSMIC_BASE,
            }}
          >
            <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
              {onBack ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className={SETUP_NATIVE_BACK_BTN_CLASS}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Back
                </Button>
              ) : null}
              {onContinue ? (
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    onBack
                      ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                      : cn(SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none w-full"),
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {continueText}
                </Button>
              ) : null}
            </div>
          </div>
        ) : !isNative ? (
          <div
            className={cn(
              "w-full max-w-md space-y-6 md:hidden",
              isStandaloneMobile ? "mb-12" : "",
            )}
          >
            <div className="flex items-center gap-3">
              {onBack ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className={SETUP_NATIVE_BACK_BTN_CLASS}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Back
                </Button>
              ) : null}
              {onContinue ? (
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    onBack
                      ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                      : cn(SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none w-full"),
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {continueText}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}



================================================================================
src/components/onboarding/OnboardingLayout.tsx
================================================================================
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ONBOARDING_ROUTES, ONBOARDING_STEP_COUNT } from "@/lib/onboardingFlow";
import {
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
  SETUP_PRIMARY_CTA_CLASS,
} from "@/lib/onboardingSetupTheme";

interface OnboardingLayoutProps {
  children: ReactNode;
  onContinue: () => void;
  currentPage: number;
  continueText?: string;
  canContinue?: boolean;
  /** When true (Welcome page only), native app shows Continue on top and Sign In below, stacked. */
  stackedNativeButtons?: boolean;
  /** Native only: main content column grows so children can use flex-1 + justify-center (e.g. Welcome pills). */
  expandNativeContentColumn?: boolean;
  /** Max width for main stack + native mobile footer (default max-w-md). Welcome uses max-w-lg for feature pills. */
  contentMaxWidthClass?: string;
  /**
   * Native app only (non-stacked): replaces the fixed Back + Continue row, e.g. StoreKit monthly/annual
   * on older iOS where RevenueCat paywall UI is not used.
   */
  nativeFooterSlot?: ReactNode;
  /** Welcome only: merged onto stacked native primary/secondary buttons (visual only; keep layout in layout). */
  stackedNativePrimaryButtonClassName?: string;
  stackedNativeSecondaryButtonClassName?: string;
  /** Welcome only: merged onto the single mobile web Continue button. */
  welcomeSoloContinueButtonClassName?: string;
  /** Welcome route: full-bleed hero + mobile web footer layout (independent of button class overrides). */
  welcomePage?: boolean;
  /** Account step: same cosmic shell as welcome/setup (e.g. setup/email). */
  setupCosmicPage?: boolean;
  /** Shown under primary CTA on welcome (e.g. setup time / no card). */
  welcomeCtaSubtext?: string;
  /** Welcome native: text link for sign-in instead of a full secondary button. */
  welcomeSignInAsTextLink?: boolean;
  /**
   * Native form pages (email/password, etc.): fixed viewport + scrollable body so fields stay
   * visible above the keyboard and fixed footer. Do not set on Welcome or paywall routes.
   */
  nativeFormPage?: boolean;
}

export const OnboardingLayout = ({ 
  children, 
  onContinue, 
  currentPage,
  continueText = "Continue",
  canContinue = true,
  stackedNativeButtons = false,
  nativeFooterSlot,
  expandNativeContentColumn = false,
  contentMaxWidthClass = "max-w-md",
  stackedNativePrimaryButtonClassName,
  stackedNativeSecondaryButtonClassName,
  welcomeSoloContinueButtonClassName,
  welcomePage = false,
  setupCosmicPage = false,
  welcomeCtaSubtext,
  welcomeSignInAsTextLink = false,
  nativeFormPage = false,
}: OnboardingLayoutProps) => {
  const navigate = useNavigate();
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const isAndroidNative = isNative && Capacitor.getPlatform() === "android";
  const nativeFormScrollLayout = isNative && nativeFormPage;
  const isWelcome =
    welcomePage || Boolean(welcomeSoloContinueButtonClassName) || stackedNativeButtons;
  const isCosmicShell = isWelcome || setupCosmicPage;
  const isWelcomeMobileWeb = !isNative && isWelcome;
  const isSetupCosmicMobileWeb = !isNative && setupCosmicPage;

  const handlePrevious = () => {
    if (currentPage > 1) {
      navigate(ONBOARDING_ROUTES[currentPage - 2]);
    }
  };

  const handleNext = () => {
    if (canContinue) {
      onContinue();
    }
  };

  const progressFillPct =
    !isWelcome && currentPage <= ONBOARDING_STEP_COUNT
      ? (currentPage / ONBOARDING_STEP_COUNT) * 100
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isCosmicShell ? "font-sans text-white antialiased" : "bg-background text-foreground",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh] max-md:bg-transparent",
        isSetupCosmicMobileWeb && "max-md:min-h-[100dvh]",
      )}
      style={isCosmicShell ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
    >
      {isCosmicShell ? (
        <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      ) : null}
      {isAndroidNative && isCosmicShell ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[45]"
          style={{
            height: "env(safe-area-inset-top, 0px)",
            backgroundColor: WELCOME_COSMIC_BASE,
          }}
          aria-hidden
        />
      ) : null}
      {progressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative &&
              "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-[calc(env(safe-area-inset-top,0px)+4.25rem)]",
            isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full",
              isCosmicShell ? "bg-white/20" : "bg-zinc-400/70",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300 ease-out",
                isWelcome
                  ? "bg-gradient-to-r from-rose-400 to-pink-500"
                  : isCosmicShell
                    ? "bg-white/90"
                    : "bg-black",
              )}
              style={{ width: `${progressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Desktop: Palette Plotting Header - hidden for native apps */}
      {!isNative && (
        <div className="hidden md:block">
          <header
            className={cn(
              "fixed top-0 left-0 right-0 z-40",
              isCosmicShell
                ? "border-b border-white/[0.06] bg-[#0a0812]/80 backdrop-blur-md"
                : "border-b border-primary/10 bg-background",
            )}
          >
            <div className="container mx-auto px-6 py-4">
              <button onClick={() => navigate("/")}>
                <h1
                  className={cn(
                    "text-lg font-bold transition-opacity hover:opacity-80",
                    isCosmicShell
                      ? "font-sans text-sm font-semibold tracking-tight text-white/90"
                      : "bg-gradient-primary bg-clip-text text-transparent",
                  )}
                >
                  Palette Plotting
                </h1>
              </button>
            </div>
          </header>
        </div>
      )}

      {/* Desktop: Side Navigation Arrows — hidden on welcome (single-path CTA) */}
      {!isWelcome && (
      <div className="hidden md:block">
        {currentPage > 1 && (
          <button
            onClick={handlePrevious}
            className={cn(
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")
                : "fixed left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 group bg-muted/50 hover:bg-muted",
            )}
            aria-label="Previous step"
          >
            <ChevronLeft
              className={cn(
                "w-8 h-8 transition-colors",
                setupCosmicPage
                  ? "text-white/80 group-hover:text-white"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          </button>
        )}

        {currentPage <= ONBOARDING_STEP_COUNT && (
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={cn(
              "fixed right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS)
                : "bg-black hover:bg-black/90",
            )}
            aria-label="Next step"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col items-center animate-fade-in w-full",
          nativeFormScrollLayout
            ? "h-full min-h-0 px-8 pb-40"
            : isNative
              ? isCosmicShell
                ? "h-full min-h-0 justify-start px-8 pb-40"
                : "min-h-screen justify-start pb-32 px-8"
              : isWelcomeMobileWeb
                ? "max-md:min-h-[100dvh] max-md:justify-between max-md:px-8 max-md:pt-0 max-md:pb-0 md:justify-start md:gap-6 md:p-8 md:pt-24 md:bg-transparent"
                : "min-h-screen justify-between pt-12 p-8 md:pt-24",
        )}
        style={isNative ? { paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" } : undefined}
      >
        {nativeFormScrollLayout ? (
          <div
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              contentMaxWidthClass,
            )}
          >
            <div className="relative z-[1] isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <div className="relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                <div className="space-y-6 pb-3">{children}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "w-full",
              contentMaxWidthClass,
              isNative && expandNativeContentColumn && "flex min-h-0 flex-1 flex-col",
              (isWelcomeMobileWeb || isSetupCosmicMobileWeb) && "relative z-10",
            )}
          >
            {children}
          </div>
        )}

        {/* Footer CTA — welcome shows on all breakpoints; others mobile-only */}
        <div
          className={cn(
            "w-full",
            isWelcome ? "relative z-50 shrink-0 space-y-2 pt-3" : "space-y-6 md:hidden",
            !(isNative && !isWelcome) && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isWelcomeMobileWeb &&
              "max-md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-lg md:pb-0 md:pt-0",
            isStandaloneMobile && !isNative && !isWelcome && "mb-12",
          )}
          style={
            isNative
              ? {
                  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  ...(isCosmicShell ? { backgroundColor: WELCOME_COSMIC_BASE } : {}),
                }
              : undefined
          }
        >
          {/* Native app: stacked (Welcome only) or side-by-side */}
          {isNative ? (
            stackedNativeButtons ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-8">
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                    stackedNativePrimaryButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {continueText}
                </Button>
                {welcomeCtaSubtext ? (
                  <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                    {welcomeCtaSubtext}
                  </p>
                ) : null}
                {welcomeSignInAsTextLink ? (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className={cn(
                      "w-full h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                      stackedNativeSecondaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    Sign In
                  </Button>
                )}
              </div>
            ) : nativeFooterSlot ? (
              <div className="mx-auto w-full max-w-md px-8">{nativeFooterSlot}</div>
            ) : (
            <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
              {/* Back button - only functional after first page */}
              {currentPage > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Back
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  Sign In
                </Button>
              )}
              <Button
                onClick={() => canContinue && onContinue()}
                disabled={!canContinue}
                className={cn(
                  isCosmicShell
                    ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                    : "flex-1 bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 rounded-full text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {continueText}
              </Button>
            </div>
            )
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button
                onClick={() => canContinue && onContinue()}
                disabled={!canContinue}
                className={cn(
                  setupCosmicPage
                    ? cn("w-full", SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none")
                    : "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 outline-none transition-none",
                  welcomeSoloContinueButtonClassName,
                )}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {continueText}
              </Button>
              {isWelcome && welcomeCtaSubtext ? (
                <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                  {welcomeCtaSubtext}
                </p>
              ) : null}
              {isWelcome && welcomeSignInAsTextLink ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                >
                  Already have an account? Sign in
                </button>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};


================================================================================
src/pages/onboarding/Welcome.tsx
================================================================================
import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  WELCOME_ACCENT,
  WelcomeCosmicBackground,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";

/** Transparent brand logo — welcome screen + native splash (copy → SplashLogo.imageset). NEVER for AppIcon: Apple rejects transparent app icons; use public/apple-ios-logo.png for App Store only. */
const WELCOME_LOGO = "/welcome-logo.png";
const WELCOME_EYEBROW = "LOA · SP · scripting · self-concept";
const WELCOME_CONTINUE_TEXT = "Start my path";
const WELCOME_CTA_SUBTEXT = "~3 min set up";

/** Product-style primary: clean surface, no glow stack. */
const WELCOME_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

/** Centered rows with dot separators. */
const WELCOME_TOOL_ROWS: readonly (readonly string[])[] = [
  ["Subliminal Maker", "Robotic Affirming", "Scripting"],
  ["Mirror Work", "Belief Work", "Inspired Action"],
  ["Manifestation Lists", "AI Manifesting Guide"],
];

const WELCOME_TOOL_TEXT_CLASS = cn(
  "font-welcome-serif text-[13px] font-normal leading-[1.45] text-[#e8b8cc]",
);

const WELCOME_TOOL_BULLET_CLASS = cn(
  "px-1.5 font-welcome-serif text-[13px] text-[#e8b8cc]/65",
);

function WelcomeHeroBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <WelcomeCosmicBackground className="absolute inset-0" />
    </div>
  );
}

/** Platinum stars — matches homepage testimonials (MarketingTestimonials). */
const AWARD_STAR_CLASS = "h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]";

/** Curved five-star columns framing the award copy (no pill). */
const STAR_PAREN_OFFSETS = {
  left: ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"],
  right: ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"],
} as const;

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets = STAR_PAREN_OFFSETS[side];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center gap-[6px] py-1",
        side === "left" ? "items-end" : "items-start",
      )}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeAwardLine() {
  return (
    <div
      className="relative z-10 flex w-full items-center justify-center gap-3 px-1"
      aria-label="One of the most comprehensive manifesting apps"
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-white">
        <span className="block">One of the most</span>
        <span className="block">comprehensive</span>
        <span className="block">manifesting apps</span>
      </p>
      <StarParen side="right" />
    </div>
  );
}

function WelcomeFeatureGrid() {
  return (
    <div className="relative z-10 flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2.5 text-center">
        {WELCOME_TOOL_ROWS.map((row) => (
          <p key={row[0]} className={WELCOME_TOOL_TEXT_CLASS}>
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <span className={WELCOME_TOOL_BULLET_CLASS} aria-hidden>
                    ·
                  </span>
                ) : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function WelcomeLogo({ showLogo = false }: { showLogo?: boolean }) {
  if (!showLogo) return null;
  return (
    <div className="mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center">
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={120}
        height={120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeEyebrow() {
  return (
    <p className="hidden text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 md:block">
      {WELCOME_EYEBROW}
    </p>
  );
}

function WelcomeTitle() {
  return (
    <h1 className="font-welcome-serif mt-0 max-w-[19rem] text-center text-[28px] font-normal leading-[1.14] tracking-[-0.02em] text-white md:mt-3 sm:text-[31px]">
      Your manifesting methods,{" "}
      <span style={{ color: WELCOME_ACCENT }}>in one place</span>
    </h1>
  );
}

function WelcomeDescription() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
  );
}

type WelcomeBodyProps = {
  showLogo?: boolean;
  topPaddingClass?: string;
  /** Native-only visual lift; does not affect OnboardingLayout fixed CTA. */
  contentLiftClass?: string;
};

function WelcomeBody({ showLogo, topPaddingClass, contentLiftClass }: WelcomeBodyProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5",
        contentLiftClass ?? "-translate-y-[0.32in]",
        topPaddingClass,
      )}
    >
      <WelcomeLogo showLogo={showLogo} />
      <WelcomeEyebrow />
      <WelcomeTitle />
      <WelcomeDescription />
      <WelcomeAwardLine />
      <WelcomeFeatureGrid />
    </div>
  );
}

const welcomeLayoutProps = {
  currentPage: 1 as const,
  welcomePage: true,
  welcomeSoloContinueButtonClassName: WELCOME_PRIMARY_CTA_CLASS,
  welcomeCtaSubtext: WELCOME_CTA_SUBTEXT,
  welcomeSignInAsTextLink: true,
};

const Welcome = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    // Wait for cosmic shell paint before revealing WebView (avoids white flash after native splash).
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const onContinue = () => navigate("/onboarding/setup/name");

  const layout = (
    <OnboardingLayout
      {...welcomeLayoutProps}
      onContinue={onContinue}
      continueText={WELCOME_CONTINUE_TEXT}
      contentMaxWidthClass="max-w-[26rem]"
    >
      <WelcomeHeroBackground />
      <WelcomeBody
        showLogo
        topPaddingClass="pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:pt-0"
      />
    </OnboardingLayout>
  );

  if (isNative) {
    return (
      <OnboardingLayout
        {...welcomeLayoutProps}
        onContinue={onContinue}
        continueText={WELCOME_CONTINUE_TEXT}
        stackedNativeButtons
        expandNativeContentColumn
        contentMaxWidthClass="max-w-[26rem]"
        stackedNativePrimaryButtonClassName={WELCOME_PRIMARY_CTA_CLASS}
      >
        <WelcomeHeroBackground />
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overscroll-y-contain pt-2 pb-[5.75rem] [-webkit-overflow-scrolling:touch]">
          <WelcomeBody
            showLogo
            topPaddingClass="pt-0"
            contentLiftClass="-translate-y-[0.05in]"
          />
        </div>
      </OnboardingLayout>
    );
  }

  return layout;
};

export default Welcome;


================================================================================
src/pages/features/Chat.tsx
================================================================================
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Send, Loader2, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useUserTier } from "@/hooks/useUserTier";
import { getTierLimits } from "@/lib/featureGating";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { extractRequestId, logErrorWithRequestId, isConnectionError, formatErrorMessage } from "@/lib/error-utils";
import { Capacitor } from "@capacitor/core";
import type { PluginListenerHandle } from "@capacitor/core";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";
import { useTheme } from "@/contexts/ThemeContext";
import {
  toolPageComposerFooterClass,
  toolPageComposerFooterStyle,
  toolPageBodyTextClass,
  toolPageHeaderClass,
  toolPageHeaderLayoutClass,
  toolPageHeaderStyle,
  toolPageInputClass,
  toolPageMutedTextClass,
  toolPageShellRootClass,
  toolPageShellRootStyle,
  toolPageShadcnCardClass,
  toolPageUsesCosmicShell,
} from "@/lib/toolPageThemeStyles";

interface Message {
  id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_user: boolean;
  character_type?: string; // Character who sent the message (for non-user messages)
}

// Character info
const characters: Record<string, { name: string; headshot: string; bubbleColor: string }> = {
  river: { name: "River", headshot: "/headshots/river-headshot-2.png", bubbleColor: "#4AC7FF" },
  sage: { name: "Sage", headshot: "/headshots/sage-headshot.png", bubbleColor: "#8fbf76" },
  rose: { name: "Rose", headshot: "/headshots/rose-headshot.png", bubbleColor: "#FFB6C1" },
  oliver: { name: "Oliver", headshot: "/headshots/oliver-headshot.png", bubbleColor: "#FFC107" },
};

const Chat: React.FC = () => {
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { tier, status } = useUserTier();
  const navigate = useNavigate();
  const userTimeZone = React.useMemo(
    () => Intl.DateTimeFormat().resolvedOptions().timeZone,
    []
  );
  
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  // Get today's date in the user's local timezone (calendar date)
  const getTodayLocal = () => {
    const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    // en-CA yields YYYY-MM-DD
    return new Intl.DateTimeFormat('en-CA', { timeZone }).format(new Date());
  };
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [isLoadingCharacter, setIsLoadingCharacter] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const maxFooterHeightPxRef = useRef(88);

  /**
   * With Capacitor `KeyboardResize.None`, the WebView does not shrink.
   * - Native iOS: `visualViewport` often stays full-height — use Keyboard plugin heights.
   * - Mobile browser / PWA: visualViewport delta usually works.
   */
  const liftComposerForKeyboard = isMobile || Capacitor.isNativePlatform();
  const [keyboardInsetVisualPx, setKeyboardInsetVisualPx] = useState(0);
  const [keyboardInsetNativePx, setKeyboardInsetNativePx] = useState(0);
  const [footerBlockHeightPx, setFooterBlockHeightPx] = useState(88);
  const [chatCount, setChatCount] = useState(0);

  const chatLimit = getTierLimits({ tier, status }).chatDaily;
  const currentCharacter = selectedCharacter ? characters[selectedCharacter] : null;

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: liftComposerForKeyboard ? "instant" : "smooth",
    });
  };

  // Load selected character - always query database (no localStorage after signup)
  useEffect(() => {
    const loadCharacter = async () => {
      if (!user) {
        setIsLoadingCharacter(false);
        return;
      }

      // Always query database with cache-busting to prevent PWA browser caching
      const { data: preferences } = await supabase
        .from('user_preferences')
        .select('selected_character')
        .eq('user_id', user.id)
        .maybeSingle();

      if (preferences?.selected_character && characters[preferences.selected_character]) {
        setSelectedCharacter(preferences.selected_character);
      }
      // No character found - don't set a default

      setIsLoadingCharacter(false);
    };

    loadCharacter();
  }, [user]);

  // Load chat messages - show ALL messages regardless of character
  useEffect(() => {
    const loadMessages = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('character_messages')
          .select('id, message_text, message_type, created_at, character_type, metadata')
          .eq('user_id', user.id)
          .eq('message_type', 'chat')
          // Fetch newest first to avoid dropping recent messages when history exceeds the limit
          .order('created_at', { ascending: false })
          .limit(200); // show up to 200 most recent messages

        if (error) throw error;

        const transformedMessages: Message[] = (data || []).map((msg) => ({
          id: msg.id,
          message_text: msg.message_text,
          message_type: msg.message_type,
          created_at: msg.created_at,
          is_user: msg.metadata?.is_user || false,
          character_type: msg.character_type || undefined,
        }));

        // Reverse to display oldest -> newest after querying newest first
        setMessages(transformedMessages.reverse());
      } catch (error: any) {
        console.error('Error loading messages:', error);
        toast.error("Failed to load chat history");
      } finally {
        setIsLoading(false);
      }
    };

    loadMessages();
  }, [user]); // Removed selectedCharacter dependency - load all messages

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const isNativeApp = Capacitor.isNativePlatform();

  useEffect(() => {
    if (!liftComposerForKeyboard || typeof window === "undefined") return;
    if (isAndroidNative) return;
    const vv = window.visualViewport;
    if (!vv) return;
    const sync = () => {
      setKeyboardInsetVisualPx(
        Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)),
      );
    };
    sync();
    vv.addEventListener("resize", sync);
    vv.addEventListener("scroll", sync);
    window.addEventListener("resize", sync);
    return () => {
      vv.removeEventListener("resize", sync);
      vv.removeEventListener("scroll", sync);
      window.removeEventListener("resize", sync);
    };
  }, [liftComposerForKeyboard, isAndroidNative]);

  const keyboardListenerHandlesRef = useRef<PluginListenerHandle[]>([]);

  /** Native Capacitor: reliable keyboard height when resize mode is None (esp. iOS WKWebView). */
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    keyboardListenerHandlesRef.current = [];
    void import("@capacitor/keyboard").then(async ({ Keyboard }) => {
      if (cancelled) return;
      try {
        const hShow = await Keyboard.addListener("keyboardWillShow", (info) => {
          setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
        });
        const hShowDid = await Keyboard.addListener("keyboardDidShow", (info) => {
          setKeyboardInsetNativePx(Math.max(0, Math.round(info.keyboardHeight ?? 0)));
        });
        const hWillHide = await Keyboard.addListener("keyboardWillHide", () => {
          setKeyboardInsetNativePx(0);
          setKeyboardInsetVisualPx(0);
        });
        const hHide = await Keyboard.addListener("keyboardDidHide", () => {
          setKeyboardInsetNativePx(0);
          setKeyboardInsetVisualPx(0);
        });
        const hs = [hShow, hShowDid, hWillHide, hHide];
        if (cancelled) {
          await Promise.all(hs.map((h) => h.remove()));
          return;
        }
        keyboardListenerHandlesRef.current = hs;
      } catch {
        /* plugin unavailable in some environments */
      }
    });
    return () => {
      cancelled = true;
      void Promise.all(keyboardListenerHandlesRef.current.map((h) => h.remove()));
      keyboardListenerHandlesRef.current = [];
    };
  }, []);

  const keyboardBottomInsetPx =
    liftComposerForKeyboard ? Math.max(keyboardInsetVisualPx, keyboardInsetNativePx) : 0;

  useEffect(() => {
    const el = footerRef.current;
    if (!el || !liftComposerForKeyboard) return;
    const ro = new ResizeObserver(() => {
      setFooterBlockHeightPx(el.offsetHeight);
    });
    ro.observe(el);
    setFooterBlockHeightPx(el.offsetHeight);
    return () => ro.disconnect();
  }, [liftComposerForKeyboard, chatCount, chatLimit]);

  useEffect(() => {
    const loadChatCount = async () => {
      if (!user) return;

      const today = getTodayLocal();

      const { data } = await supabase
        .from('user_message_limits')
        .select('chat_count')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (data) {
        setChatCount(data.chat_count || 0);
      }
    };

    loadChatCount();
  }, [user, messages]);

  const sendMessage = async () => {
    if (!inputMessage.trim() || !user || !selectedCharacter || isSending) return;

    const userMessage = inputMessage.trim();
    setInputMessage("");
    setIsSending(true);

    // Add user message to UI immediately
    const tempUserMessage: Message = {
      id: `temp-${Date.now()}`,
      message_text: userMessage,
      message_type: 'chat',
      created_at: new Date().toISOString(),
      is_user: true,
    };
    setMessages((prev) => [...prev, tempUserMessage]);

    try {
      const { data: responseData, error: responseError } = await supabase.functions.invoke('handle-chat-message', {
        body: {
          userId: user.id,
          userMessage: userMessage,
          userTzOffsetMinutes: new Date().getTimezoneOffset(),
          userLocalDate: getTodayLocal(),
        },
      });

      if (responseError) throw responseError;

      if (responseData?.error) {
        // For Basic and Plus users, show as a system message in chat instead of just toast
        if (responseData.limitReached) {
          const systemMessage: Message = {
            id: `system-limit-${Date.now()}`,
            message_text: responseData.error,
            message_type: 'chat',
            created_at: new Date().toISOString(),
            is_user: false,
            character_type: 'system', // Mark as system message
          };
          setMessages((prev) => [...prev, systemMessage]);
        } else {
          // For Premium or other errors, show toast
          toast.error(responseData.error);
        }
        // Remove the temp user message on error
        setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
        return;
      }

      if (responseData?.boundary) {
        // Boundary message for dangerous content
        const boundaryMessage: Message = {
          id: `boundary-${Date.now()}`,
          message_text: responseData.message,
          message_type: 'chat',
          created_at: new Date().toISOString(),
          is_user: false,
          character_type: selectedCharacter || undefined,
        };
        setMessages((prev) => [...prev, boundaryMessage]);
        return;
      }

      // Add character response to UI
      if (responseData?.message) {
        const characterMessage: Message = {
          id: `char-${Date.now()}`,
          message_text: responseData.message,
          message_type: 'chat',
          created_at: new Date().toISOString(),
          is_user: false,
          character_type: selectedCharacter || undefined,
        };
        setMessages((prev) => [...prev, characterMessage]);
      }

      // Reload messages to get the saved versions from database - load ALL messages
      const { data: reloadedData } = await supabase
        .from('character_messages')
        .select('id, message_text, message_type, created_at, character_type, metadata')
        .eq('user_id', user.id)
        .eq('message_type', 'chat')
        .order('created_at', { ascending: false })
        .limit(200);

      if (reloadedData) {
        const transformedMessages: Message[] = reloadedData.map((msg) => ({
          id: msg.id,
          message_text: msg.message_text,
          message_type: msg.message_type,
          created_at: msg.created_at,
          is_user: msg.metadata?.is_user || false,
          character_type: msg.character_type || undefined,
        }));
        setMessages(transformedMessages.reverse());
      }

      // Update chat count from response if provided by the function
      if (typeof responseData?.chatCount === 'number') {
        setChatCount(responseData.chatCount);
      }
    } catch (error: any) {
      logErrorWithRequestId(error, "Error sending message");
      
      // Sanitize error message for user display
      let errorMessage = "Failed to send message. Please try again.";
      
      if (error?.message) {
        const msg = error.message.toLowerCase();
        // Check for specific error types
        if (msg.includes('401') || msg.includes('unauthorized')) {
          errorMessage = formatErrorMessage(error, "Your session has expired. Please refresh the page and try again.");
        } else if (msg.includes('403') || msg.includes('forbidden')) {
          errorMessage = formatErrorMessage(error, "You don't have permission to send messages. Please check your account status.");
        } else if (msg.includes('429') || msg.includes('rate limit')) {
          errorMessage = formatErrorMessage(error, "Too many requests. Please wait a moment and try again.");
        } else if (isConnectionError(error)) {
          errorMessage = formatErrorMessage(error, "Connection error. Please check your internet and try again.");
        } else if (msg.includes('timeout')) {
          errorMessage = formatErrorMessage(error, "Request timed out. Please try again.");
        } else {
          errorMessage = formatErrorMessage(error, errorMessage);
        }
      } else {
        errorMessage = formatErrorMessage(error, errorMessage);
      }
      
      toast.error(errorMessage);
      // Remove the temp user message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempUserMessage.id));
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  // Show loading state while character is being loaded
  if (isLoadingCharacter) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Only show error if we've checked and confirmed no character
  if (!selectedCharacter) {
    return (
      <div
        className={cn(toolPageShellRootClass(theme), "min-h-screen flex items-center justify-center")}
        style={toolPageShellRootStyle(theme)}
      >
        <Card className={toolPageShadcnCardClass(theme, "p-6 max-w-md")}>
          <p className="text-center text-muted-foreground">
            Please select a character first to start chatting.
          </p>
          <Button onClick={() => navigate('/dashboard/double')} className="w-full mt-4">
            Go to Embody
          </Button>
        </Card>
      </div>
    );
  }

  const sidebarLeftPx = !isMobile ? (sidebarCollapsed ? 64 : 256) : 0;
  const isCosmic = toolPageUsesCosmicShell(theme);

  return (
    <div
      className={cn(
        toolPageShellRootClass(theme),
        "flex flex-col min-h-0",
        liftComposerForKeyboard ? "h-[100dvh] max-h-[100dvh]" : "h-screen",
      )}
      style={toolPageShellRootStyle(theme)}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
      
      {/* Main Content - Offset for sidebar on desktop */}
      <div
        className={cn(
          "flex flex-col min-h-0",
          liftComposerForKeyboard ? "h-[100dvh] max-h-[100dvh]" : "h-screen",
        )}
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
                ...toolPageShellRootStyle(theme),
              }
            : toolPageShellRootStyle(theme)
        }
      >
        {/* Safe area background - fixed at top */}
        <ToolPageSafeAreaInlet />
{/* Header */}
        <header
          className={cn(
            toolPageHeaderClass(theme),
            isNativeApp || !isMobile
              ? "fixed top-0 left-0 right-0 z-50 flex-shrink-0"
              : toolPageHeaderLayoutClass(true),
          )}
          style={
            isNativeApp
              ? {
                  ...toolPageHeaderStyle(theme, true),
                  top: "env(safe-area-inset-top, 0px)",
                }
              : toolPageHeaderStyle(theme, isMobile, { sidebarCollapsed })
          }
        >
        <div className="container mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="icon"
                className={cn(!isCosmic && "text-foreground hover:bg-muted/60")}
                onClick={() => navigate('/dashboard/your-journey')}
              >
                <ArrowLeft className={cn("h-5 w-5", toolPageBodyTextClass(theme))} />
              </Button>
              {currentCharacter && (
                <>
                  <div className="rounded-full bg-white p-0.5 shadow-sm shrink-0">
                    <img
                      src={currentCharacter.headshot}
                      alt={currentCharacter.name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  </div>
                  <div>
                    <h1 className={cn("font-semibold text-lg", toolPageBodyTextClass(theme))}>
                      {currentCharacter.name}
                    </h1>
                    <p className={cn("text-xs", toolPageMutedTextClass(theme))}>
                      {chatCount} / {chatLimit} messages today
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div
        ref={chatContainerRef}
        className={cn(
          "flex-1 overflow-y-auto px-4 space-y-4 min-h-0",
          liftComposerForKeyboard ? "pb-2" : "pb-4",
        )}
        style={{
          ...(isNativeApp || isStandalone
            ? { paddingTop: "calc(env(safe-area-inset-top, 0px) + 5rem)" }
            : isMobile
              ? { paddingTop: "1rem" }
              : { paddingTop: "5rem" }),
          ...(liftComposerForKeyboard
            ? { paddingBottom: `${footerBlockHeightPx + 12}px` }
            : {}),
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className={cn("h-6 w-6 animate-spin", toolPageMutedTextClass(theme))} />
          </div>
        ) : messages.length === 0 ? (
          <div className={cn("flex items-center justify-center h-full", toolPageMutedTextClass(theme))}>
            <p>Start a conversation with {currentCharacter?.name}</p>
          </div>
        ) : (
          messages.map((message) => {
            const messageCharacter = message.character_type ? characters[message.character_type] : null;
            const displayCharacter = messageCharacter || currentCharacter;
            const isSystemMessage = message.character_type === 'system';
            
            return (
            <div
              key={message.id}
                className={`flex ${message.is_user ? 'justify-end' : 'justify-start'} items-start gap-2`}
            >
                {!message.is_user && !isSystemMessage && displayCharacter && (
                  <img
                    src={displayCharacter.headshot}
                    alt={displayCharacter.name}
                    className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                  />
                )}
              <div
                className={`max-w-[80%] rounded-lg p-3 ${
                  message.is_user
                    ? 'bg-primary text-primary-foreground'
                    : isSystemMessage
                    ? 'bg-muted/50 border border-primary/20 text-foreground' // System message styling
                    : 'bg-muted'
                }`}
                style={
                    !message.is_user && !isSystemMessage && displayCharacter
                      ? { backgroundColor: `${displayCharacter.bubbleColor}20` }
                    : {}
                }
              >
                  {!message.is_user && !isSystemMessage && displayCharacter && (
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      {displayCharacter.name}
                    </p>
                  )}
                  {isSystemMessage && (
                    <p className="text-xs font-semibold mb-1 opacity-80">
                      System
                    </p>
                  )}
                <p className="text-sm whitespace-pre-wrap">{message.message_text}</p>
                <p className="text-xs opacity-70 mt-1">
                  {new Date(message.created_at).toLocaleString([], { 
                    timeZone: userTimeZone,
                    weekday: 'short',
                    month: 'short', 
                    day: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input — fixed + visualViewport inset on mobile/native (KeyboardResize.None). */}
      <div
        ref={footerRef}
        className={cn(
          toolPageComposerFooterClass(theme),
          liftComposerForKeyboard
            ? cn(
                "fixed right-0",
                isCosmic
                  ? "shadow-[0_-4px_24px_rgba(0,0,0,0.35)]"
                  : "shadow-[0_-4px_24px_rgba(0,0,0,0.06)]",
              )
            : "flex-shrink-0",
        )}
        style={
          liftComposerForKeyboard
            ? {
                ...toolPageComposerFooterStyle(theme),
                bottom: keyboardBottomInsetPx,
                left: sidebarLeftPx,
                paddingBottom:
                  keyboardBottomInsetPx > 0
                    ? "max(0.75rem, env(safe-area-inset-bottom, 0px))"
                    : "max(1rem, env(safe-area-inset-bottom, 0px))",
              }
            : toolPageComposerFooterStyle(theme)
        }
      >
        <div className="flex items-center gap-2">
          <Input
            placeholder="Type your message..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => {
              requestAnimationFrame(() => scrollToBottom());
            }}
            onBlur={() => {
              window.setTimeout(() => {
                setKeyboardInsetNativePx(0);
                setKeyboardInsetVisualPx(0);
              }, 120);
            }}
            className={cn("flex-1", toolPageInputClass(theme))}
            disabled={isSending || !user || !selectedCharacter}
          />
          <Button 
            onClick={sendMessage} 
            disabled={isSending || !inputMessage.trim() || !user || !selectedCharacter}
            size="icon"
          >
            {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          </Button>
        </div>
        {chatCount >= chatLimit && (
          <p className={cn("text-xs mt-2 text-center", toolPageMutedTextClass(theme))}>
            Daily limit reached. Your limit resets tomorrow.
          </p>
        )}
      </div>
      </div>
    </div>
  );
};

export default Chat;



================================================================================
src/components/IosAppHeader.tsx
================================================================================
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IosAppHeaderProps = {
  /** When true, show Sign out instead of Login and return to welcome after signing out. */
  signOutInsteadOfLogin?: boolean;
};

/**
 * Header for iOS app screens (secure checkout, sign-in) that matches the Privacy Policy header.
 * Palette Plotting title links back to the welcome page; Login button links to sign-in.
 */
export const IosAppHeader = ({ signOutInsteadOfLogin = false }: IosAppHeaderProps) => {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/onboarding/welcome", { replace: true });
    } catch (e) {
      console.error("Sign out failed:", e);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bg-background z-40"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/onboarding/welcome")}
              className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground hover:opacity-80 transition-opacity cursor-pointer"
            >
              Palette Plotting
            </button>
            {signOutInsteadOfLogin ? (
              <Button
                variant="outline"
                className="border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                onClick={() => navigate("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
      <div style={{ height: "calc(64px + env(safe-area-inset-top, 0px))" }} />
    </>
  );
};


================================================================================
src/pages/Auth.tsx
================================================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft } from "lucide-react";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { IosAppHeader } from "@/components/IosAppHeader";
// import { useActivityTracker } from "@/hooks/useActivityTracker"; // Disabled

const Auth = () => {
  const isNative = useIsNativeApp();
  
  // Set page title
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Sign In | Palette Plotting";
    return () => {
      document.title = prevTitle;
    };
  }, []);
  
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();
  // const { trackActivity } = useActivityTracker(); // Disabled
  const trackActivity = async () => {}; // Stub

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let emailToUse = emailOrUsername;

      // If input doesn't contain @, treat it as username and look up the email
      if (!emailOrUsername.includes('@')) {
        const { data: email, error: lookupError } = await supabase
          .rpc('get_email_by_username', {
            lookup_username: emailOrUsername
          });

        if (lookupError || !email) {
          toast.error("Username not found");
          setLoading(false);
          return;
        }

        if (!email) {
          toast.error("Username not found");
          setLoading(false);
          return;
        }

        emailToUse = email;
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });
      if (error) throw error;
      
      // await trackActivity({ action: 'user_login', details: { email: emailToUse } }); // Disabled
      
      navigate("/dashboard");
    } catch (error: any) {
      // await trackActivity({ action: 'login_failed', details: { email: emailOrUsername, error: error.message } }); // Disabled
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetLoading(true);

    try {
      let emailToUse = resetEmail;

      // If input doesn't contain @, treat it as username and look up the email
      if (!resetEmail.includes('@')) {
        const { data: email, error: lookupError } = await supabase
          .rpc('get_email_by_username', {
            lookup_username: resetEmail
          });

        if (lookupError || !email) {
          toast.error("Username not found");
          setResetLoading(false);
          return;
        }

        emailToUse = email;
      }

      // Use custom email function instead of Supabase's default
      const { error } = await supabase.functions.invoke("send-password-reset", {
        body: { email: emailToUse },
      });

      if (error) throw error;

      setResetSent(true);
      toast.success("Password reset link sent to your email");
    } catch (error: any) {
      toast.error(error.message || "Failed to send reset link. Please try again.");
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-hero">
      {/* Native app: header with Palette Plotting (→ welcome) and Login, like Privacy page */}
      {isNative ? (
        <IosAppHeader />
      ) : (
        <>
          <div className="fixed top-0 left-0 right-0 bg-background z-40" style={{ height: 'env(safe-area-inset-top, 0px)' }} />
          <header className="sticky z-50 border-b border-primary/10 bg-background" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
            <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <button onClick={() => navigate("/")}>
                  <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white hover:opacity-80 transition-opacity">
                    Palette Plotting
                  </h1>
                </button>
              </div>
            </div>
          </header>
        </>
      )}

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
        <div className="w-full max-w-md">

        <Card className="backdrop-blur-sm bg-card/80 border-primary/20">
          <CardHeader>
            {resetSent ? (
              <CardTitle className="text-2xl text-center">Check your email</CardTitle>
            ) : (
              <>
                <CardTitle className="text-2xl">Sign In</CardTitle>
                <CardDescription>
                  Sign in to Continue
                </CardDescription>
              </>
            )}
          </CardHeader>
          <CardContent>
            {isForgotPassword ? (
              <div className="space-y-4">
                {resetSent ? (
                  <div className="space-y-4 text-center">
                    <p className="text-sm text-muted-foreground">
                      Check your email for a password reset link. Click the link to reset your password.
                    </p>
                    <Button
                      onClick={() => {
                        setIsForgotPassword(false);
                        setResetSent(false);
                        setResetEmail("");
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Back to Sign In
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleForgotPassword} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="resetEmail">Email or Username</Label>
                      <Input
                        id="resetEmail"
                        type="text"
                        placeholder="you@example.com or username"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        required
                      />
                    </div>
                    <Button
                      type="submit"
                      className="w-full bg-gradient-primary hover:shadow-glow-primary"
                      disabled={resetLoading}
                    >
                      {resetLoading ? "Sending..." : "Send Reset Link"}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      onClick={() => setIsForgotPassword(false)}
                      className="w-full"
                    >
                      Back to Sign In
                    </Button>
                  </form>
                )}
              </div>
            ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="emailOrUsername">Email or Username</Label>
                <Input
                  id="emailOrUsername"
                  type="text"
                  placeholder="you@example.com or username"
                  value={emailOrUsername}
                  onChange={(e) => setEmailOrUsername(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                  <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                    <button
                      type="button"
                      onClick={() => setIsForgotPassword(true)}
                      className="text-xs text-muted-foreground hover:text-foreground hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-primary hover:shadow-glow-primary"
                disabled={loading}
              >
                {loading ? "Signing In..." : "Sign In"}
              </Button>
              <div className="text-center mt-4">
                <p className="text-sm text-muted-foreground">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate("/onboarding/welcome")}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </form>
            )}
          </CardContent>
        </Card>
        </div>
      </div>
    </div>
  );
};

export default Auth;


================================================================================
src/pages/ResetPassword.tsx
================================================================================
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useRef } from "react";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasValidSession, setHasValidSession] = useState(false);
  
  // Validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Check for valid recovery session on mount
  useEffect(() => {
    const checkSession = async () => {
      // Check URL hash for access_token (from email link)
      const hash = window.location.hash;
      if (hash.includes('access_token=') && hash.includes('type=recovery')) {
        // Supabase will automatically set the session when we have the token in the hash
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          setHasValidSession(true);
          return;
        }
      }

      // Listen for auth state changes (when user clicks reset link)
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (event === 'PASSWORD_RECOVERY' && session) {
          setHasValidSession(true);
        }
      });

      // Also check existing session
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (existingSession) {
        setHasValidSession(true);
      }

      return () => subscription.unsubscribe();
    };
    checkSession();
  }, []);

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!password) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(password);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [password]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(password, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, password]);

  const canSubmit = 
    !!password &&
    !!confirmPassword &&
    password === confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("Password reset successfully. Please sign in.");
      navigate("/login");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking session
  if (!hasValidSession) {
    return (
      <main className="min-h-screen bg-background" style={{ colorScheme: 'light' }}>
        {/* Safe area background - fixed at top */}
        <div className="fixed top-0 left-0 right-0 bg-background z-40" style={{ height: 'env(safe-area-inset-top, 0px)', colorScheme: 'light' }} />
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
          <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
            <div className="flex items-center justify-between">
              <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
                <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white">
                  Palette Plotting
                </h1>
              </button>
            </div>
          </div>
        </header>

        {/* Spacer to account for fixed header */}
        <div style={{ height: 'calc(64px + env(safe-area-inset-top, 0px))' }} />

        <div className="flex items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Reset Password</CardTitle>
            <CardDescription>
              Please click the link in your email to reset your password.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => navigate("/login")} className="w-full">
              Back to Sign In
            </Button>
          </CardContent>
        </Card>
      </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background" style={{ colorScheme: 'light' }}>
      {/* Safe area background - fixed at top */}
      <div className="fixed top-0 left-0 right-0 bg-background z-40" style={{ height: 'env(safe-area-inset-top, 0px)', colorScheme: 'light' }} />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background" style={{ top: 'env(safe-area-inset-top, 0px)' }}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate("/")} className="hover:opacity-80 transition-opacity">
              <h1 className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-white">
                Palette Plotting
              </h1>
            </button>
          </div>
        </div>
      </header>

      {/* Spacer to account for fixed header */}
      <div style={{ height: 'calc(64px + env(safe-area-inset-top, 0px))' }} />

      <div className="flex items-center justify-center p-6 min-h-[calc(100vh-4rem)]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={passwordError ? "border-destructive" : ""}
                required
              />
              {isValidatingPassword && (
                <p className="text-xs text-muted-foreground">Validating password...</p>
              )}
              {passwordError && (
                <p className="text-xs text-destructive">{passwordError}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={confirmPasswordError ? "border-destructive" : ""}
                required
              />
              {confirmPasswordError && (
                <p className="text-xs text-destructive">{confirmPasswordError}</p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-primary hover:shadow-glow-primary"
              disabled={!canSubmit || loading}
            >
              {loading ? "Resetting..." : "Reset Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
    </main>
  );
};

export default ResetPassword;


================================================================================
src/pages/CategoryList.tsx
================================================================================
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { CustomIcon } from "@/components/icons/CustomIcon";
import { Music } from "lucide-react";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import goldenClouds from "@/assets/card-bg-golden-clouds.jpg";
import greenFoliage from "@/assets/card-bg-green-foliage.jpg";
import blueSky from "@/assets/card-bg-blue-sky.jpg";
import yellowHaze from "@/assets/card-bg-yellow-haze.jpg";
import blueMist from "@/assets/card-bg-blue-mist.jpg";
import mossGreen from "@/assets/card-bg-moss-green.jpg";
import { TRANSPARENT_VIDEO_POSTER } from "@/lib/nativeVideoPoster";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";

// Simple category definitions
const categoryTools: Record<string, Array<{ title: string; description: string; path: string; iconSrc?: string; icon?: any }>> = {
  design: [
    {
      title: "Affirm & Script",
      description: "Build affirmation sequences and visual goals",
      path: "/dashboard/affirmations-builder",
      iconSrc: "/Icons/Affirmations.svg"
    },
    {
      title: "Belief Work",
      description: "Explore beliefs you want to release or integrate",
      path: "/dashboard/refactor",
      iconSrc: "/Icons/Belief Refactor.svg"
    }
  ],
  review: [
    {
      title: "Embody",
      description: "Your daily companion for support and habit tracking",
      path: "/dashboard/double",
      iconSrc: "/Icons/Your Double.svg"
    },
    {
      title: "Your Journey",
      description: "Continue your AI companion chat — same thread as from Embody",
      path: "/dashboard/your-journey"
    },
    {
      title: "Manifestation Journal",
      description: "Capture notes and track your manifestation journey",
      path: "/dashboard/chrono",
      iconSrc: "/Icons/Timeline.svg"
    }
  ],
  experience: [
    {
      title: "Mirror Work",
      description: "Practice affirmations with real-time reflection",
      path: "/dashboard/mirror",
      iconSrc: "/Icons/Mirror.svg"
    },
    {
      title: "Piano Tapping",
      description: "Immerse yourself in your affirmation with music and color",
      path: "/dashboard/tap-in",
      icon: Music
    }
  ]
};

const categoryInfo: Record<string, { title: string; description: string }> = {
  design: {
    title: "Design",
    description: "Structure and refine your affirmations and beliefs"
  },
  review: {
    title: "Review",
    description: "Monitor & maintain momentum with tracking and guidance"
  },
  experience: {
    title: "Experience",
    description: "Immerse yourself in the end result with interactive tools"
  }
};

const CategoryList = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const location = window.location.pathname;
  const category = location.split('/').pop() || '';
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoError, setVideoError] = useState(false);
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [hasUserInteracted, setHasUserInteracted] = useState(false);

  const tools = categoryTools[category] || [];
  const info = categoryInfo[category] || { title: "Category", description: "" };

  // Check if actually a mobile device (not just window width)
  // Character images should only show on actual mobile devices (PWA browser or standalone), not desktop
  const isActualMobileDevice = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const shouldShowCharacterImage = isActualMobileDevice;

  const isStandalone =
    typeof window !== "undefined" &&
    (window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true) ||
    Capacitor.isNativePlatform();

  const handleFeatureClick = (path: string) => {
    navigate(path);
  };

  // Ensure video plays
  useEffect(() => {
    const video = videoRef.current;
    if (video && !videoError) {
      // Try to play immediately
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setHasUserInteracted(true);
          })
          .catch(() => {
            // Auto-play was prevented, will play on user interaction
        });
      }
    }
  }, [videoError]);

  // Handle user interaction to trigger video play (for autoplay restrictions)
  useEffect(() => {
    const video = videoRef.current;
    if (!video || hasUserInteracted || videoError) return;

    const tryPlayVideo = () => {
      if (video && video.paused && !hasUserInteracted) {
        video.muted = true;
        video.play()
          .then(() => {
            setHasUserInteracted(true);
          })
          .catch(() => {
            // Ignore errors
          });
      }
    };

    // Listen for various user interactions
    const events = ['touchstart', 'touchend', 'click', 'scroll', 'wheel'];
    events.forEach(event => {
      document.addEventListener(event, tryPlayVideo, { once: true, passive: true });
    });

    return () => {
      events.forEach(event => {
        document.removeEventListener(event, tryPlayVideo);
      });
    };
  }, [hasUserInteracted, videoError]);

  // Fetch selected character
  useEffect(() => {
    const fetchCharacter = async () => {
      if (user) {
        // Always query database (no localStorage after signup) with cache-busting to prevent PWA browser caching
        const { data: preferences } = await supabase
          .from('user_preferences')
          .select('selected_character')
          .eq('user_id', user.id)
          .maybeSingle();

        if (preferences?.selected_character) {
          setSelectedCharacter(preferences.selected_character);
        }
      }
    };

    fetchCharacter();
  }, [user]);

  return (
    <div 
      className={cn("relative overflow-hidden", isMobile ? "min-h-[100dvh]" : "min-h-screen pb-20 md:pb-0")}
    >
      {/* Solid bar under status bar on mobile (not transparent) */}
      <ToolPageSafeAreaInlet className="z-40" />

      {/* Desktop Sidebar - Desktop only */}
      {!isMobile && (
        <DesktopToolSidebar onCollapsedChange={setSidebarCollapsed} />
      )}
      
      {/* Background Video with fallback image */}
      <div className="fixed inset-0 z-0">
        {/* Fallback background image - show initially and when video not playing */}
        <div 
          className="absolute inset-0 opacity-40 transition-opacity duration-500"
          style={{
            backgroundImage: 'url("/Sky Background.png")',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
            zIndex: (!hasUserInteracted && !videoError) ? 1 : 0,
            opacity: (!hasUserInteracted && !videoError) ? 0.4 : (videoError ? 0.4 : 0),
          }}
        />
        {!videoError ? (
          <video
            ref={videoRef}
            poster={TRANSPARENT_VIDEO_POSTER}
            preload="auto"
            autoPlay
            loop
            muted
            playsInline
            controls={false}
            controlsList="nodownload noremoteplayback nofullscreen"
            disablePictureInPicture
            disableRemotePlayback
            className="absolute inset-0 w-full h-full object-cover opacity-40 transition-opacity duration-500"
            style={{
              pointerEvents: 'none',
              zIndex: 1,
              opacity: hasUserInteracted ? 0.4 : 0,
              WebkitAppearance: 'none',
            } as React.CSSProperties}
            onLoadedMetadata={(e) => {
              const video = e.currentTarget;
              // Slow down the video playback
              video.playbackRate = 0.5;
              // Ensure it plays
              video.play().catch(() => {
                // Auto-play prevented, will play on user interaction
              });
            }}
            onError={() => {
              setVideoError(true);
            }}
            onPlay={() => {
              // Video is playing, ensure playback rate is set and hide fallback
              if (videoRef.current) {
                videoRef.current.playbackRate = 0.5;
              }
              setHasUserInteracted(true);
            }}
          >
            <source src="/videos/blue-skies-video.mp4" type="video/mp4" />
          </video>
        ) : null}
      </div>
      {/* Overlay for readability */}
      <div className="absolute inset-0 bg-background/10 z-[1] pointer-events-none" />
      
      {/* Character overlay image at bottom - Mobile only (actual mobile devices, not desktop) */}
      {shouldShowCharacterImage && selectedCharacter && (
        <div 
          className="fixed bottom-0 left-0 right-0 z-[2] pointer-events-none"
          style={{
            height: '40vh',
            backgroundImage: `url(${encodeURI(`/Dash & Cat Background Overlays/${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} - Grass.png`)})`,
            backgroundSize: 'cover',
            backgroundPosition: 'bottom center',
            backgroundRepeat: 'no-repeat',
          }}
        />
      )}
      
      {/* Content Container - Add left margin on desktop to account for sidebar */}
      <div 
        className="relative z-10 md:dark:border-l md:dark:border-border"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
        {/* Header - solid background on mobile so it doesn't look transparent */}
        <header
          className={cn(
            "border-b border-primary/10 md:h-16 flex items-center py-3 md:py-0 z-50 bg-background",
            isMobile ? "fixed top-0 left-0 right-0" : "sticky"
          )}
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="container mx-auto px-4 sm:px-6 w-full">
            <div className="flex items-center justify-between">
            <div>
              <h1 
                className="text-lg sm:text-xl font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"
                onClick={() => navigate("/dashboard")}
              >
                {info.title}
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                {info.description}
              </p>
              </div>
              {/* PWA Browser Mobile Menu */}
              {isMobile && <MobilePWAMenu />}
            </div>
          </div>
        </header>

        {/* Main Content - on mobile start below header so first card isn't blocked */}
        <main
          className={cn(
            "container mx-auto px-4 sm:px-6 relative z-10",
            isMobile ? "pb-6" : "py-3 sm:py-6 pb-24 md:pb-20"
          )}
          style={isMobile ? {
            paddingTop: "calc(env(safe-area-inset-top, 0px) + 4.5rem)",
            overflow: "hidden",
            overflowY: "auto",
            height: "calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px) - 4.5rem)",
          } : undefined}
        >
          {/* Features Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3 sm:gap-4 mt-4">
            {tools.map((feature, index) => {
              const Icon = feature.icon || CustomIcon;
              return (
                <Card
                  key={feature.title}
                  className="group relative overflow-hidden cursor-pointer animate-fade-in h-[78px] sm:h-[92px] border-2 border-border backdrop-blur-sm focus:outline-none focus-visible:outline-none bg-card"
                  style={{ 
                    animationDelay: `${index * 0.05}s`,
                    boxShadow: '0 0 20px rgba(0, 0, 0, 0.1)',
                    transition: 'background-color 0.1s, opacity 0.1s',
                    WebkitTapHighlightColor: 'transparent',
                  }}
                  tabIndex={-1}
                  onMouseDown={(e) => {
                    e.currentTarget.style.opacity = '0.95';
                  }}
                  onMouseUp={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onTouchStart={(e) => {
                    e.currentTarget.style.opacity = '0.95';
                  }}
                  onTouchEnd={(e) => {
                    e.currentTarget.style.opacity = '1';
                  }}
                  onClick={() => {
                    handleFeatureClick(feature.path);
                  }}
                >
                  {/* Content */}
                  <div className="relative h-full flex items-center justify-between p-2.5 sm:p-4">
                    {/* Text */}
                    <div className="flex-1 space-y-1 relative z-10">
                      <h3 
                        className="text-base sm:text-xl font-semibold text-foreground leading-tight tracking-tight"
                      >
                        {feature.title}
                      </h3>
                      
                      <p 
                        className="text-[0.7rem] sm:text-xs text-foreground/80 font-normal leading-tight line-clamp-2"
                      >
                        {feature.description}
                      </p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </main>

      </div>
    </div>
  );
};

export default CategoryList;



================================================================================
src/pages/Settings.tsx
================================================================================
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { ToolPageCosmicBackdrop } from "@/components/ToolPageCosmicBackdrop";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";
import {
  toolPageHeaderClass,
  toolPageHeaderLayoutClass,
  toolPageHeaderStyle,
  toolPageHeaderTitleClass,
  toolPageReadabilityOverlayClass,
  toolPageShellGradientClass,
  toolPageShellRootClass,
  toolPageShellRootStyle,
  toolPageActionButtonClass,
  toolPageInputClass,
  toolPageMutedLabelClass,
  toolPageShadcnCardClass,
  toolPageTabsListClass,
  toolPageTabsTriggerClass,
  toolPageUsesCosmicShell,
} from "@/lib/toolPageThemeStyles";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { cn } from "@/lib/utils";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { requestNativePushPermission } from "@/services/pushNotifications";
import { Browser } from "@capacitor/browser";
import { useAppleIAP } from "@/hooks/useAppleIAP";

const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

const Settings = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const appleIAP = useAppleIAP();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(false);
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [marketingSMSEnabled, setMarketingSMSEnabled] = useState(false);
  const [dataTrainingOptIn, setDataTrainingOptIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Password validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Cadence from `user_plans.billing_period` only (Current Plan label). */
  const [billingPeriodLabel, setBillingPeriodLabel] = useState<string | null>(null);
  /** From user_plans; used on native iOS for Manage billing (Stripe vs Apple). */
  const [lastPaymentSource, setLastPaymentSource] = useState<"stripe" | "apple" | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Start as true if phone hasn't changed
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [showDeleteAccountConfirm1, setShowDeleteAccountConfirm1] = useState(false);
  const [showDeleteAccountConfirm2, setShowDeleteAccountConfirm2] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: planData, error } = await supabase
          .from("user_plans")
          .select("billing_period, last_payment_source")
          .eq("user_id", user.id)
          .maybeSingle();

        const plan = planData as
          | { billing_period?: string | null; last_payment_source?: string | null }
          | null;

        if (error) {
          console.error("Error fetching plan:", error);
          setBillingPeriodLabel(null);
        } else {
          const bp = plan?.billing_period?.trim() || null;
          setBillingPeriodLabel(bp);
        }

        if (plan?.last_payment_source === "stripe" || plan?.last_payment_source === "apple") {
          setLastPaymentSource(plan.last_payment_source);
        } else {
          setLastPaymentSource(null);
        }

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('app_notifications_enabled, email_marketing, texts_enabled, data_training_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setAppNotificationsEnabled(!!(prefs as any).app_notifications_enabled);
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
        }

        // Fetch profile for phone number, username, and first name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, username, first_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          const profileData = profile as any;
          const currentPhone = profileData.phone || "";
          const currentUsername = profileData.username || "";
          const currentFirstName = profileData.first_name || "";
          setPhoneNumber(currentPhone);
          setOriginalPhoneNumber(currentPhone);
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
          setFirstName(currentFirstName);
          setOriginalFirstName(currentFirstName);
        }

        // Pending account deletion (30-day schedule)
        const { data: deletionRequest } = await supabase
          .from("account_deletion_requests")
          .select("requested_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (deletionRequest?.requested_at) {
          const d = new Date(deletionRequest.requested_at);
          d.setDate(d.getDate() + 30);
          setDeletionScheduledAt(d.toISOString());
        } else {
          setDeletionScheduledAt(null);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error("Please enter a phone number");
      return;
    }

    setIsSendingCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsPhoneVerified(false);

    try {
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phoneNumber,
          message: `Your verification code is: ${code}`,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send code');
      }

      toast.success("Verification code sent!");
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error("Failed to send verification code. Please try again.");
      setSentCode("");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      // Automatically save if phone number changed
      if (phoneNumber !== originalPhoneNumber) {
        await handleUpdateProfile();
      }
      setVerificationCode("");
      setSentCode("");
      toast.success("Phone number verified and saved!");
    } else {
      toast.error("Invalid code. Please try again.");
      setVerificationCode("");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error("Username cannot be empty");
      return;
    }
    
    // Check if phone number changed and needs verification
    if (phoneNumber !== originalPhoneNumber && !isPhoneVerified) {
      toast.error("Please verify your new phone number before updating");
      return;
    }
    
    if (!user) {
      toast.error("User not found");
      return;
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        first_name: firstName.trim() || null,
        phone: phoneNumber || null // Allow clearing phone number
      })
      .eq('id', user.id);

    if (profileError) {
      // Check if it's a unique constraint violation for username
      if (profileError.code === '23505' || profileError.message?.includes('unique') || profileError.message?.includes('duplicate')) {
        toast.error("Username is already taken. Please choose another.");
      } else {
        toast.error("Error updating profile");
        console.error(profileError);
      }
      return;
    }

    // Update auth.users phone if phone number was set
    if (phoneNumber && phoneNumber.trim()) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          phone: phoneNumber
        });
        if (authError) {
          console.warn('Could not update auth.users phone:', authError);
          // Don't fail the whole update if auth update fails
        }
      } catch (e) {
        console.warn('Error updating auth phone:', e);
      }
    }

    // Reset verification state after successful update
    setOriginalPhoneNumber(phoneNumber);
    setOriginalUsername(username.trim());
    setOriginalFirstName(firstName.trim());
    setIsPhoneVerified(true);
    setVerificationCode("");
    setSentCode("");

    toast.success("Profile updated successfully");
  };

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!newPassword) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(newPassword);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(newPassword, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, newPassword]);

  const canChangePassword = 
    !!newPassword &&
    !!confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleChangePassword = async () => {
    // Validate password using shared validation
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      toast.error(passwordResult.error || "Invalid password");
      return;
    }

    // Validate password match
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      toast.error(matchResult.error || "Passwords do not match");
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error("Error updating password");
    } else {
      toast.success("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  };


  const handleToggleMarketingSMS = async (enabled: boolean) => {
    setMarketingSMSEnabled(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          texts_enabled: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating marketing SMS preference:', error);
        // Revert on error
        setMarketingSMSEnabled(!enabled);
        toast.error("Error updating SMS notification preference");
      } else {
        toast.success(enabled ? "Text notifications enabled" : "Text notifications disabled");
      }
    }
  };

  const handleToggleDataTraining = async (enabled: boolean) => {
    const previous = dataTrainingOptIn;
    setDataTrainingOptIn(enabled);

    if (!user) {
      toast.error("Please log in to update preferences");
      setDataTrainingOptIn(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        data_training_opt_in: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating data training preference:', error);
      setDataTrainingOptIn(previous);
      toast.error("Error updating data training preference");
    } else {
      toast.success(enabled ? "Data training opt-in enabled" : "Data training opt-in disabled");
    }
  };

  const handleDeleteAccountRequest = () => setShowDeleteAccountConfirm1(true);
  const handleDeleteAccountConfirm1Close = () => setShowDeleteAccountConfirm1(false);
  const handleDeleteAccountConfirm1Continue = () => {
    setShowDeleteAccountConfirm1(false);
    setShowDeleteAccountConfirm2(true);
  };
  const handleDeleteAccountConfirm2Close = () => setShowDeleteAccountConfirm2(false);
  const handleDeleteAccountFinalConfirm = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      const result = data as { error?: string; scheduled_at?: string };
      if (result?.error) throw new Error(result.error);
      const scheduledAt = result?.scheduled_at ? new Date(result.scheduled_at) : null;
      const dateStr = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : "in 30 days";
      setShowDeleteAccountConfirm2(false);
      await supabase.auth.signOut();
      navigate("/", { replace: true });
      toast.success(`Your account is scheduled for deletion on ${dateStr}. You can log in before then to cancel in Settings.`);
    } catch (e) {
      console.error("Account deletion failed:", e);
      toast.error("Could not schedule account deletion. Please try again or contact support@paletteplot.com.");
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
        body: { cancel: true },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDeletionScheduledAt(null);
      toast.success("Account deletion cancelled. Your account will not be deleted.");
    } catch (e) {
      console.error("Cancel deletion failed:", e);
      toast.error("Could not cancel. Please try again or contact support@paletteplot.com.");
    }
  };

  const handleToggleAppNotifications = async (enabled: boolean) => {
    const previous = appNotificationsEnabled;
    setAppNotificationsEnabled(enabled);

    if (!user) {
      setAppNotificationsEnabled(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        app_notifications_enabled: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating app notifications preference:', error);
      setAppNotificationsEnabled(previous);
      toast.error("Error updating app notification preference");
      return;
    }

    if (enabled && Capacitor.isNativePlatform()) {
      await requestNativePushPermission();
    }

    toast.success(enabled ? "App notifications enabled" : "App notifications disabled");
  };

  const handleToggleEmailMarketing = async (enabled: boolean) => {
    setEmailMarketing(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_marketing: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating email marketing preference:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Revert on error
        setEmailMarketing(!enabled);
        const errorMessage = error.message || error.details || "Error updating email notification preference";
        toast.error(`Error: ${errorMessage}`);
      } else {
        toast.success(enabled ? "Email notifications enabled" : "Email notifications disabled");
      }
    }
  };

  /**
   * Manage billing — never sends App Store / RevenueCat subscribers through Stripe.
   *
   * - `last_payment_source === "apple"` (includes RC-backed mobile): native iOS uses IAP/RC customer center
   *   or App Store subscriptions; native Android opens Play subscription center; browser shows instructions only.
   * - `last_payment_source === "stripe"`: Stripe Customer Portal on desktop/mobile web only; native apps must
   *   use a browser (Stripe Checkout is not offered in native shells).
   */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error("Please log in to manage billing");
      return;
    }

    if (lastPaymentSource === "apple") {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && appleIAP.canManageBillingNatively) {
        try {
          await appleIAP.openSubscriptionManagement(user.id);
        } catch (err) {
          console.error("Manage billing:", err);
        }
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        try {
          await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
        } catch (err) {
          console.error("Manage billing (Play):", err);
          toast.error("Could not open Google Play subscriptions.");
        }
        return;
      }
      toast.error("Your subscription is through the app store. Manage it in the Palette Plotting mobile app.");
      return;
    }

    if (lastPaymentSource !== "stripe") {
      toast.error("Billing management isn’t available for this subscription type.");
      return;
    }

    if (Capacitor.isNativePlatform()) {
      toast.error("Stripe billing is managed on the web. Open paletteplot.com in Safari or Chrome.");
      return;
    }

    try {
      const loadingToast = toast.loading("Syncing billing information…");

      const { data: syncData, error: syncError } = await supabase.functions.invoke("sync-stripe-customer", {
        body: {},
      });

      if (syncError) {
        console.error("Error syncing customer:", syncError);
      } else if (syncData && typeof syncData === "object" && "success" in syncData && (syncData as { success?: boolean }).success) {
        toast.success("Billing information synced");
      }

      toast.dismiss(loadingToast);
      const portalToast = toast.loading("Opening billing portal…");

      const { data, error } = await supabase.functions.invoke("create-customer-portal", {
        body: {},
      });

      toast.dismiss(portalToast);

      if (error) {
        console.error("Error creating customer portal:", error);
        const errorMessage = error.message || "Failed to open billing portal";
        if (errorMessage.includes("No Stripe customer") || errorMessage.includes("No active subscription")) {
          toast.error("No subscription found. Please subscribe first to manage billing.");
        } else {
          toast.error(errorMessage);
        }
        return;
      }

      if (data && typeof data === "object" && "error" in data && (data as { error?: string }).error) {
        toast.error((data as { error: string }).error);
        return;
      }

      const url = data && typeof data === "object" && "url" in data ? (data as { url?: string }).url : undefined;
      if (url) {
        window.location.href = url;
      } else {
        toast.error("No portal URL received. Please try again.");
      }
    } catch (error: unknown) {
      console.error("Error managing billing:", error);
      const message = error instanceof Error ? error.message : "Failed to open billing portal";
      toast.error(message);
    }
  };


  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  return (
    <div
      className={cn(toolPageShellRootClass(theme), toolPageShellGradientClass(theme, "primary"), "pb-20 md:pb-0")}
      style={toolPageShellRootStyle(theme)}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        <ToolPageSafeAreaInlet />
        <ToolPageCosmicBackdrop />
        <div className={toolPageReadabilityOverlayClass(theme)} />

        <div className="relative z-10">
        <header
          className={cn(toolPageHeaderClass(theme), toolPageHeaderLayoutClass(isMobile))}
          style={toolPageHeaderStyle(theme, isMobile, { sidebarCollapsed })}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
          <div>
            <h1
              className={toolPageHeaderTitleClass(theme)}
              onClick={() => navigate("/dashboard")}
            >
              Your Account
            </h1>
            {isMobile && <p className="text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            {/* PWA Browser Mobile Menu */}
            {isMobile && (
              <div className="md:hidden">
                {isMobile && (
              <div className="md:hidden">
                <MobilePWAMenu />
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main 
        className={cn("px-4 sm:px-6 py-3 sm:py-6 max-w-4xl relative z-10", !isMobile ? "" : "container mx-auto")} 
        style={isStandalone && isMobile 
          ? { paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.625rem)' } 
          : !isMobile 
            ? { paddingTop: '4rem' } 
            : {}}
      >
        <Tabs defaultValue="profile" className={cn("w-full", !isMobile ? "mt-4" : "")}>
          <TabsList className={cn(toolPageTabsListClass(theme), !isMobile ? "grid-cols-4" : "grid-cols-4")}>
            <TabsTrigger value="profile" className={toolPageTabsTriggerClass(theme)}>Profile</TabsTrigger>
            <TabsTrigger value="settings" className={toolPageTabsTriggerClass(theme)}>Settings</TabsTrigger>
            <TabsTrigger value="billing" className={toolPageTabsTriggerClass(theme)}>Billing</TabsTrigger>
            <TabsTrigger value="legal" className={toolPageTabsTriggerClass(theme)}>Legal</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-2">
            <Card className={cn(toolPageShadcnCardClass(theme, "p-3 sm:p-4 space-y-2"), toolPageUsesCosmicShell(theme) && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", toolPageInputClass(theme))}
                  placeholder="Enter your name"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">Username</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", toolPageInputClass(theme))}
                  placeholder="Enter your username"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  className={cn("h-11 py-2.5 leading-6", toolPageInputClass(theme, { readOnly: true }))}
                />
                <p className={cn("text-xs", toolPageMutedLabelClass(theme))}>
                  Email cannot be changed
                </p>
              </div>

              {/* Phone number field hidden for now */}
              {false && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">Phone Number</Label>
                <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      // Reset verification if phone number changes
                      if (e.target.value !== originalPhoneNumber) {
                        setIsPhoneVerified(false);
                        setVerificationCode("");
                        setSentCode("");
                      } else {
                        setIsPhoneVerified(true);
                      }
                    }}
                  placeholder="+1 (555) 123-4567"
                    className="flex-1 h-9"
                />
                  {phoneNumber && phoneNumber !== originalPhoneNumber && (
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !phoneNumber.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? "Sending..." : "Send Code"}
                    </Button>
                  )}
                </div>

                {sentCode && !isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder="Enter 6-digit code"
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        variant="outline"
                        className="h-9"
                      >
                        Verify
                      </Button>
                    </div>
                    {!isPhoneVerified && (
                      <p className="text-xs text-muted-foreground">
                        Please verify your phone number to update it
                      </p>
                    )}
                  </div>
                )}

                {isPhoneVerified && phoneNumber === originalPhoneNumber && originalPhoneNumber && (
                  <p className="text-xs text-green-600">✓ Phone number verified</p>
                )}

                {isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <p className="text-xs text-green-600">✓ New phone number verified</p>
                )}
              </div>
              )}

              {(username.trim() !== originalUsername || firstName.trim() !== originalFirstName) && (
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full h-9"
                >
                <User className="mr-2 h-4 w-4" />
                  Update Profile
              </Button>
              )}
            </Card>

            <Card className={cn(toolPageShadcnCardClass(theme, "p-3 sm:p-4 space-y-2"), toolPageUsesCosmicShell(theme) && "!bg-transparent")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                Change Password
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-sm">Current Password</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                  className={cn("h-9", toolPageInputClass(theme))}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                    className={cn("h-9", toolPageInputClass(theme), passwordError && "border-destructive")}
                  />
                  {isValidatingPassword && (
                    <p className="text-xs text-muted-foreground">Validating password...</p>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{passwordError}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-sm">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                    className={cn("h-9", toolPageInputClass(theme), confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{confirmPasswordError}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                variant="ghost"
                className={cn("w-full h-9", toolPageActionButtonClass(theme))}
                disabled={!canChangePassword}
              >
                Change Password
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-3">
            <Card
              className={cn(
                toolPageShadcnCardClass(theme, "p-4 sm:p-6 space-y-3"),
                toolPageUsesCosmicShell(theme) && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                Notification Preferences
              </h3>
              <p className="text-xs text-muted-foreground">
                Get text and email alerts about new tools, promotions and app news.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="app-notifications">App Notifications</Label>
                  <Switch 
                    id="app-notifications"
                    checked={appNotificationsEnabled}
                    onCheckedChange={handleToggleAppNotifications}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">Email Marketing</Label>
                  <Switch 
                    id="email-marketing"
                    checked={emailMarketing}
                    onCheckedChange={handleToggleEmailMarketing}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between hidden">
                  <Label htmlFor="text-marketing">Text Marketing</Label>
                  <Switch 
                    id="text-marketing"
                    checked={marketingSMSEnabled}
                    onCheckedChange={handleToggleMarketingSMS}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                toolPageShadcnCardClass(theme, "p-4 sm:p-6 space-y-3"),
                toolPageUsesCosmicShell(theme) && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                Data Training
              </h3>
              <p className="text-xs text-muted-foreground">
                Help improve the experience by allowing anonymized usage to be used for model training. Default is off.
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-training-opt-in">Data Training Opt-In</Label>
                <Switch
                  id="data-training-opt-in"
                  checked={dataTrainingOptIn}
                  onCheckedChange={handleToggleDataTraining}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </Card>

            <Card className={cn(toolPageShadcnCardClass(theme, "p-4 sm:p-6 space-y-3"), "border-destructive/30")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                Delete account
              </h3>
              {deletionScheduledAt ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    Your account is scheduled for deletion on{" "}
                    {new Date(deletionScheduledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.
                    You can cancel before then.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                  >
                    Cancel deletion request
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    Permanently delete your account and all associated data. This cannot be undone and your data cannot be retrieved. Deletion is scheduled 30 days after you confirm.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleDeleteAccountRequest}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete my account
                  </Button>
                </>
              )}
            </Card>

            <Dialog open={showDeleteAccountConfirm1} onOpenChange={setShowDeleteAccountConfirm1}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Delete your account?</DialogTitle>
                  <DialogDescription>
                    Your account and all associated data (profile, preferences, content) will be permanently deleted. You will not be able to retrieve or recover this data. This is a final decision. Do you want to continue?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm1Close}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountConfirm1Continue}>Continue</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteAccountConfirm2} onOpenChange={setShowDeleteAccountConfirm2}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Final confirmation</DialogTitle>
                  <DialogDescription>
                    This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered. Are you sure you want to delete your account?
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm2Close} disabled={isDeletingAccount}>Cancel</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountFinalConfirm} disabled={isDeletingAccount}>
                    {isDeletingAccount ? "Deleting…" : "Delete my account"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Billing Tab */}
          <TabsContent value="billing" className="space-y-3">
            <Card
              className={cn(
                toolPageShadcnCardClass(theme, "p-4 sm:p-6 space-y-3"),
                toolPageUsesCosmicShell(theme) && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                Subscription
              </h3>
              
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    toolPageUsesCosmicShell(theme)
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">Current Plan</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {billingPeriodLabel === "monthly"
                      ? "Monthly"
                      : billingPeriodLabel === "annual"
                        ? "Annual"
                        : billingPeriodLabel === "weekly"
                          ? "Weekly"
                          : billingPeriodLabel ?? ""}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg",
                    toolPageUsesCosmicShell(theme)
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">Billing</p>
                  <p className="text-xs text-muted-foreground">
                    Manage your subscription and payment methods
                  </p>
                </div>

                {lastPaymentSource === "apple" ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", toolPageActionButtonClass(theme))}
                      disabled={
                        !Capacitor.isNativePlatform() ||
                        (Capacitor.getPlatform() === "ios" && !appleIAP.canManageBillingNatively)
                      }
                      onClick={() => void handleManageBilling()}
                    >
                      Manage Billing
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {Capacitor.isNativePlatform()
                        ? Capacitor.getPlatform() === "android"
                          ? "Your subscription is billed through Google Play. This opens your Play subscriptions."
                          : "Your subscription is billed through Apple. This opens subscription management on your device."
                        : "Your subscription is billed through the app store (Apple or Google Play). Manage billing in the Palette Plotting mobile app — not via Stripe on this site."}
                    </p>
                  </>
                ) : lastPaymentSource === "stripe" ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", toolPageActionButtonClass(theme))}
                      disabled={Capacitor.isNativePlatform()}
                      onClick={() => void handleManageBilling()}
                    >
                      Manage Billing
                    </Button>
                    <p className="text-[11px] leading-snug text-center px-1 text-muted-foreground">
                      {Capacitor.isNativePlatform() ? (
                        <span className="text-red-600">
                          Your subscription is billed with Stripe on the web. Manage or cancel by signing in at
                          paletteplot.com in a browser (not inside the app).
                        </span>
                      ) : (
                        "Opens Stripe’s customer portal to update your payment method or cancel your plan."
                      )}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", toolPageActionButtonClass(theme))}
                      disabled
                    >
                      Manage Billing
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      Stripe billing management here is only available when your plan is recorded as web (Stripe)
                      checkout. If you subscribed in the iOS or Android app, manage billing in the store or in the app.
                    </p>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent value="legal" className="space-y-3">
            <Card className={toolPageShadcnCardClass(theme, "p-4 sm:p-6 space-y-3")}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                Legal & Information
              </h3>
              
              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/faq")}
                >
                  FAQ
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/terms")}
                >
                  Terms of Use
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/privacy")}
                >
                  Privacy Policy
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/acceptable-use")}
                >
                  Acceptable Use Policy
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/billing")}
                >
                  Billing & Refunds
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dmca")}
                >
                  DMCA Notice & Takedown Policy
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/eula")}
                >
                  End User License Agreement
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  Contact Us
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;


================================================================================
src/pages/features/AffirmationViewer.tsx
================================================================================

import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ChevronRight, Play, Pause, Loader2 } from "lucide-react";
import { AffirmationSet, PREMADE_SETS } from "@/lib/affirmations-data";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { recordDailyManifestationSignal } from "@/lib/manifestationPowerSignals";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";
import { ToolPageCosmicBackdrop } from "@/components/ToolPageCosmicBackdrop";
import { useTheme } from "@/contexts/ThemeContext";
import {
  toolPageHeaderClass,
  toolPageHeaderLayoutClass,
  toolPageHeaderStyle,
  toolPageHeaderTitleClass,
  toolPageReadabilityOverlayClass,
  toolPageShellGradientClass,
  toolPageShellRootClass,
  toolPageShellRootStyle,
  toolPageShadcnCardClass,
} from "@/lib/toolPageThemeStyles";

const AffirmationViewer = () => {
  const navigate = useNavigate();
  const { setId } = useParams<{ setId: string }>();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isMobile = useIsMobile();
  const isNative = useIsNativeApp();
  const isNativeIosMobile =
    isMobile && isNative && Capacitor.getPlatform() === "ios";
  const [currentSet, setCurrentSet] = useState<AffirmationSet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const [speedMultiplier, setSpeedMultiplier] = useState(1);
  const prevAutoPlayRef = useRef(false);
  
  const baseSpeed = 3;
  const speedOptions = [0.5, 1, 1.5, 2];
  const getCurrentSpeed = () => baseSpeed / speedMultiplier;

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    prevAutoPlayRef.current = false;
  }, [setId]);

  useEffect(() => {
    const loadSet = async () => {
      if (!setId) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);

      // First check premade sets (instant, no database query)
      const premadeSet = PREMADE_SETS.find(s => s.id === setId);
      if (premadeSet) {
        setCurrentSet(premadeSet);
        setIsLoading(false);
        return;
      }

      // If not premade, load from database
      try {
        // Refresh session to ensure auth.uid() works correctly in RLS
        const { data: { session: freshSession }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !freshSession || !freshSession.access_token) {
          if (import.meta.env.DEV) {
            console.warn('No valid session found');
          }
          setIsLoading(false);
          return;
        }

        // Load only the specific set by ID - RLS will automatically filter by auth.uid() = user_id
        const { data: dbSet, error: dbError } = await (supabase as any)
          .from('user_affirmation_sets')
          .select('*')
          .eq('id', setId)
          .maybeSingle();

        if (dbError) {
          console.error("Error loading affirmation set from database:", dbError);
          setIsLoading(false);
          return;
        }

        if (dbSet) {
          // Convert database set to AffirmationSet format
          const foundSet: AffirmationSet = {
            id: dbSet.id,
            name: dbSet.name,
            affirmations: dbSet.affirmations as string[],
            images: dbSet.images as any[],
            isPremade: false,
            category: dbSet.category || undefined,
          };
          setCurrentSet(foundSet);
        }
      } catch (error) {
        console.error("Error loading affirmation set from database:", error);
      }
      
      setIsLoading(false);
    };

    loadSet();
  }, [setId]);

  // Preload all images when component mounts
  useEffect(() => {
    if (!currentSet || !currentSet.images) return;
    
    const validImages = currentSet.images.filter((img) => 
      img && typeof img === 'object' && img.url && typeof img.url === 'string'
    );
    
    // Preload images with high priority using both Image() and link preload
    validImages.forEach((img, index) => {
      // Method 1: Use Image() constructor
      const image = new Image();
      image.src = img.url;
      
      // Method 2: Add preload link tags for even faster loading
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = img.url;
      // Give higher priority to first few images
      if (index < 3) {
        (link as any).fetchPriority = 'high';
      }
      document.head.appendChild(link);
    });
    
    // Cleanup preload links on unmount
    return () => {
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]');
      preloadLinks.forEach(link => {
        if (validImages.some(img => img.url === link.getAttribute('href'))) {
          link.remove();
        }
      });
    };
  }, [currentSet]);

  useEffect(() => {
    if (isAutoPlay && !prevAutoPlayRef.current && currentSet) {
      void recordDailyManifestationSignal("affirm_visualize");
    }
    prevAutoPlayRef.current = isAutoPlay;
  }, [isAutoPlay, currentSet]);

  useEffect(() => {
    if (!isAutoPlay || !currentSet) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => 
        prev < currentSet.affirmations.length - 1 ? prev + 1 : 0
      );
    }, getCurrentSpeed() * 1000);

    return () => clearInterval(interval);
  }, [isAutoPlay, speedMultiplier, currentSet]);

  const goToNext = () => {
    if (!currentSet) return;
    setCurrentIndex((prev) => 
      prev < currentSet.affirmations.length - 1 ? prev + 1 : 0
    );
  };

  const goToPrevious = () => {
    if (!currentSet) return;
    setCurrentIndex((prev) => 
      prev > 0 ? prev - 1 : currentSet.affirmations.length - 1
    );
  };

  if (isLoading) {
    return (
      <div
        className={cn(toolPageShellRootClass(theme), toolPageShellGradientClass(theme, "blue"), "pb-20 md:pb-0 flex items-center justify-center")}
        style={toolPageShellRootStyle(theme)}
      >
        <Card className={toolPageShadcnCardClass(theme, "p-8 text-center")}>
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading affirmation set...</p>
        </Card>
      </div>
    );
  }

  if (!currentSet) {
    return (
      <div
        className={cn(toolPageShellRootClass(theme), toolPageShellGradientClass(theme, "blue"), "pb-20 md:pb-0 flex items-center justify-center")}
        style={toolPageShellRootStyle(theme)}
      >
        <Card className={toolPageShadcnCardClass(theme, "p-8 text-center")}>
          <p className="text-muted-foreground mb-4">Affirmation set not found</p>
          <Button onClick={() => navigate("/dashboard/affirmations-builder")}>
            Go to Affirmations
          </Button>
        </Card>
      </div>
    );
  }

  const currentAffirmation = currentSet.affirmations[currentIndex];
  
  // Use only images that have a valid URL, cap to affirmation count, and map 1:1
  const validImages = currentSet.images?.filter((img) => 
    img && typeof img === 'object' && img.url && typeof img.url === 'string'
  ) ?? [];
  
  const cappedImages = validImages.slice(0, currentSet.affirmations.length);
  
  // Map each affirmation to its corresponding image (1:1 mapping)
  const currentImage = cappedImages.length > currentIndex ? cappedImages[currentIndex] : null;

  return (
    <div
      className={cn(toolPageShellRootClass(theme), toolPageShellGradientClass(theme, "blue"), "pb-20 md:pb-0 overflow-x-hidden w-full max-w-full")}
      style={toolPageShellRootStyle(theme)}
    >
        <ToolPageSafeAreaInlet />
        <ToolPageCosmicBackdrop />
        <div className={toolPageReadabilityOverlayClass(theme)} />
      <header
        className={cn(toolPageHeaderClass(theme), toolPageHeaderLayoutClass(isMobile))}
        style={
          isMobile
            ? undefined
            : { top: "env(safe-area-inset-top, 0px)", left: 0, right: 0 }
        }
      >
        <div className={cn("px-4 sm:px-6 w-full flex items-center justify-between relative z-10", isMobile ? "container mx-auto" : "")}>
          <h1
            className={cn(toolPageHeaderTitleClass(theme), "truncate leading-tight")}
            onClick={() => navigate("/dashboard/affirmations-builder")}
          >
            {currentSet.name}
          </h1>
          {isMobile && <MobilePWAMenu />}
        </div>
      </header>

      <main
        className={cn(
          "relative z-10 w-full max-w-full overflow-x-hidden px-4 sm:px-6",
          !isMobile
            ? "pt-16 max-w-4xl mx-auto"
            : cn(
                "container mx-auto max-w-4xl",
                // Native iPhone: extra air under sticky header (triple prior pt-10).
                isNativeIosMobile ? "pt-[7.5rem]" : "pt-3",
              ),
        )}
      >
        <div className="w-full">
          <p className="pt-2 pb-2 text-center text-xs text-muted-foreground sm:text-sm">
            {currentIndex + 1} of {currentSet.affirmations.length}
          </p>

          {/* Main Affirmation Display with Background Image */}
          <Card className="mb-4 bg-card/50 backdrop-blur-sm border-primary/20 min-h-[260px] sm:min-h-[360px] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
            {currentImage && currentImage.url && (
              <div 
                key={`image-${currentIndex}`}
                className="absolute inset-0 opacity-50 transition-opacity duration-300 ease-in-out"
                style={{ 
                  backgroundImage: `url("${currentImage.url}")`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  backgroundRepeat: 'no-repeat'
                }}
              />
            )}
            {/* Hidden images for preloading */}
            <div className="hidden">
              {cappedImages.map((img) => (
                <img key={img.id} src={img.url} alt="" />
              ))}
            </div>
            <div className="relative z-10 w-full px-2">
              <p className="text-2xl sm:text-3xl md:text-4xl font-bold text-center leading-relaxed animate-fade-in break-words overflow-wrap-anywhere">
                {currentAffirmation}
              </p>
            </div>
          </Card>

          {/* Controls */}
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant="outline"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>

              <Button
                size="lg"
                onClick={() => setIsAutoPlay(!isAutoPlay)}
                className="min-w-[140px] bg-card text-card-foreground hover:bg-card/90 border-2 border-border"
              >
                {isAutoPlay ? (
                  <>
                    <Pause className="mr-2 h-5 w-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-5 w-5" />
                    Auto Play
                  </>
                )}
              </Button>

              <Button
                size="lg"
                variant="outline"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
              </Button>
            </div>

            <div className="flex items-center justify-center gap-2">
              <span className="text-sm text-muted-foreground mr-1">Speed:</span>
              {speedOptions.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={speedMultiplier === s ? "default" : "outline"}
                  onClick={() => setSpeedMultiplier(s)}
                  className="min-w-[48px] h-8 text-xs"
                >
                  {s}x
                </Button>
              ))}
            </div>
          </div>

          {/* Progress Dots */}
          <div className="mt-5 flex justify-center gap-2 flex-wrap pb-2">
            {currentSet.affirmations.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : 'bg-primary/30 hover:bg-primary/50'
                }`}
              />
            ))}
          </div>
        </div>
      </main>

    </div>
  );
};

export default AffirmationViewer;


================================================================================
src/pages/features/Freeplay.tsx
================================================================================
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { supabase } from "@/integrations/supabase/client";
import { PREMADE_SETS, SUPPORT_CATEGORIES, getSupportCategoryLabel, type AffirmationSet } from "@/lib/affirmations-data";
import { useIsMobile } from "@/hooks/use-mobile";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { cn } from "@/lib/utils";
import { PianoKeyboard } from "@/components/PianoKeyboard";
import { MusicSynthesizer } from "@/lib/music-synthesizer";
import { ToolPageSafeAreaInlet } from "@/components/ToolPageSafeAreaInlet";
import {
  toolPageHeaderClass,
  toolPageHeaderLayoutClass,
  toolPageHeaderStyle,
  toolPageHeaderTitleClass,
  toolPageReadabilityOverlayClass,
  toolPageShellGradientClass,
  toolPageShellRootClass,
  toolPageShellRootStyle,
  toolPageUsesCosmicShell,
  toolPageInputClass,
  toolPageMilestoneTabsListClass,
  toolPageMilestoneTabsTriggerClass,
  TOOL_PAGE_DARK_CARD,
  TOOL_PAGE_TRANSPARENT_PANEL,
} from "@/lib/toolPageThemeStyles";

const IPHONE_PIANO_AUDIO_HINT =
  "If you can't hear the piano on iPhone, leave the app, turn OFF Silent Mode and turn your volume up.";

function Freeplay() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const isCosmic = toolPageUsesCosmicShell(theme);

  const pianoOuterCardClass = isCosmic
    ? cn(TOOL_PAGE_DARK_CARD, "!bg-transparent !shadow-none")
    : "rounded-xl border border-border/70 bg-card text-card-foreground backdrop-blur-sm shadow-sm";

  const pianoInnerWellClass = isCosmic
    ? cn(TOOL_PAGE_TRANSPARENT_PANEL, "rounded-xl !shadow-none")
    : "rounded-xl border border-border/60 bg-muted/25 shadow-sm";

  const pianoFieldChrome = isCosmic ? "!bg-transparent !border-white/12 !text-white" : "";

  const pianoMenuSurface = isCosmic ? "z-50 border border-white/12 bg-[#0f0d14] text-white" : "";

  const pianoPopoverSurface = cn(
    "border rounded-md shadow-lg",
    isCosmic ? "border-white/12 bg-[#0f0d14] text-white" : "bg-popover",
  );

  const pianoAffirmationBubble = cn(
    "rounded-lg shadow-lg backdrop-blur-md border",
    isCosmic
      ? "border-white/12 bg-transparent"
      : "border-border/50 bg-background/70",
  );
  const [selectedAffirmationSet, setSelectedAffirmationSet] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [affirmationSets, setAffirmationSets] = useState<AffirmationSet[]>([]);
  const [hasStarted, setHasStarted] = useState(false);
  const [currentAffirmationWords, setCurrentAffirmationWords] = useState<string[]>([]);
  const [currentAffirmationLines, setCurrentAffirmationLines] = useState<string[]>([]);
  const [currentLineIndex, setCurrentLineIndex] = useState<number>(0);
  const [highlightedWordIndex, setHighlightedWordIndex] = useState<number>(-1);
  const [colorFeedbackEnabled, setColorFeedbackEnabled] = useState(true);
  const [bgGradient, setBgGradient] = useState<string>("");
  const [colorIntensity, setColorIntensity] = useState<number>(0); // 0-1 scale for color intensity
  const [sparkles, setSparkles] = useState<Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }>>([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  const keyPressCountRef = useRef<number>(0);
  const lastKeyPressTimeRef = useRef<number>(0);
  
  const synthesizerRef = useRef<MusicSynthesizer | null>(null);
  const lastPressTimeRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pianoContainerRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!user) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Load affirmation sets
  useEffect(() => {
    const loadAffirmationSets = async () => {
      let allSets = [...PREMADE_SETS];
      if (user) {
        try {
          const { data: { session: freshSession } } = await supabase.auth.getSession();
          if (freshSession?.access_token) {
            // @ts-ignore - user_affirmation_sets table exists but not in generated types
            const { data: dbSets } = await (supabase as unknown as {
              from: (table: string) => {
                select: (columns: string) => {
                  order: (column: string, options?: { ascending: boolean }) => Promise<{ data: any[] | null }>;
                };
              };
            })
              .from('user_affirmation_sets')
              .select('*')
              .order('created_at', { ascending: false });
            if (dbSets && dbSets.length > 0) {
              const userSets: AffirmationSet[] = dbSets.map((dbSet: any) => ({
                id: dbSet.id,
                name: dbSet.name,
                affirmations: Array.isArray(dbSet.affirmations) ? dbSet.affirmations : [],
                images: Array.isArray(dbSet.images) ? dbSet.images : [],
                category: dbSet.category,
                isPremade: false,
              }));
              allSets = [...userSets, ...allSets];
            }
          }
        } catch (error) {
          console.error("Error loading user affirmation sets:", error);
        }
      }
      setAffirmationSets(allSets);
    };
    loadAffirmationSets();
  }, [user]);

  // Initialize affirmation lines when set is selected
  useEffect(() => {
    if (selectedAffirmationSet && selectedAffirmationSet.trim() !== "") {
      const set = affirmationSets.find(s => s.id === selectedAffirmationSet);
      if (set) {
        // Store lines (one affirmation per line)
        setCurrentAffirmationLines(set.affirmations);
        setCurrentLineIndex(0);
        // Initialize words for first line
        if (set.affirmations.length > 0) {
          const firstLineWords = set.affirmations[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
        } else {
          setCurrentAffirmationWords([]);
        }
        setHighlightedWordIndex(-1);
        keyPressCountRef.current = 0;
      }
    } else {
      setCurrentAffirmationLines([]);
      setCurrentAffirmationWords([]);
      setCurrentLineIndex(0);
      setHighlightedWordIndex(-1);
      keyPressCountRef.current = 0;
    }
  }, [selectedAffirmationSet, affirmationSets]);

  // Initialize synthesizer
  useEffect(() => {
    synthesizerRef.current = new MusicSynthesizer();
    return () => {
      if (synthesizerRef.current) {
        synthesizerRef.current.stop();
      }
    };
  }, []);

  // Pre-initialize audio context to prevent burst on first key press
  useEffect(() => {
    if (!synthesizerRef.current) {
      synthesizerRef.current = new MusicSynthesizer();
    }
    // Pre-initialize audio context (but don't resume until user interaction)
    synthesizerRef.current.ensureReady().catch(() => {
      // Ignore errors - audio context will be initialized on first user interaction
    });
  }, []);

  // Get category color helper
  const getCategoryColor = (categoryName: string | undefined): string => {
    if (!categoryName) return "#22c55e"; // Default green
    const category = SUPPORT_CATEGORIES.find(c => c.name === categoryName);
    return category?.color || "#22c55e";
  };

  // Generate harmonious color palette - different tones of the same color
  const getColorPalette = (baseColor: string): string[] => {
    // Convert hex to RGB
    const hex = baseColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    const colors: string[] = [];
    
    // Base color
    colors.push(baseColor);
    
    // Deep/darker tone (reduce brightness, keep saturation)
    colors.push(`rgb(${Math.max(0, r - 40)}, ${Math.max(0, g - 40)}, ${Math.max(0, b - 40)})`);
    
    // Medium-dark tone
    colors.push(`rgb(${Math.max(0, r - 20)}, ${Math.max(0, g - 20)}, ${Math.max(0, b - 20)})`);
    
    // Lighter tint (add white, keep hue)
    colors.push(`rgb(${Math.min(255, r + 30)}, ${Math.min(255, g + 30)}, ${Math.min(255, b + 30)})`);
    
    // Very light tint (pastel)
    colors.push(`rgb(${Math.min(255, r + 50)}, ${Math.min(255, g + 50)}, ${Math.min(255, b + 50)})`);
    
    // Slightly desaturated (more muted)
    const avg = (r + g + b) / 3;
    colors.push(`rgb(${Math.round(r * 0.7 + avg * 0.3)}, ${Math.round(g * 0.7 + avg * 0.3)}, ${Math.round(b * 0.7 + avg * 0.3)})`);
    
    return colors;
  };

  // Get current category color
  const selectedSet = affirmationSets.find(s => s.id === selectedAffirmationSet);
  const categoryColor = getCategoryColor(selectedSet?.category);
  const colorPalette = colorFeedbackEnabled && selectedSet?.category ? getColorPalette(categoryColor) : [categoryColor];

  // Create sparkles on key press at specific position with color palette
  const createSparkles = (palette: string[], x?: number, y?: number) => {
    if (!colorFeedbackEnabled || !pianoContainerRef.current) return;
    
    const container = pianoContainerRef.current;
    if (!container) return;
    
    const rect = container.getBoundingClientRect();
    // Use provided position or default to center
    const sparkleX = x !== undefined ? x : rect.width / 2;
    const sparkleY = y !== undefined ? y : rect.height / 2;
    
    const newSparkles: Array<{ x: number; y: number; vx: number; vy: number; life: number; maxLife: number; size: number; color: string }> = [];
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const speed = Math.random() * 4 + 2;
      // Small random offset for more natural spread
      const offsetX = (Math.random() - 0.5) * 20;
      const offsetY = (Math.random() - 0.5) * 20;
      // Pick a random color from the palette for variety
      const sparkleColor = palette[Math.floor(Math.random() * palette.length)];
      newSparkles.push({
        x: sparkleX + offsetX,
        y: sparkleY + offsetY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1,
        maxLife: 1,
        size: Math.random() * 4 + 2,
        color: sparkleColor,
      });
    }
    setSparkles(prev => [...prev, ...newSparkles]);
  };

  // Animate sparkles
  useEffect(() => {
    if (sparkles.length === 0) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    const animate = () => {
      setSparkles(prev => {
        const updated = prev
          .map(s => ({ 
            ...s, 
            life: s.life - 0.03, 
            x: s.x + s.vx, 
            y: s.y + s.vy,
            vx: s.vx * 0.98, // Friction
            vy: s.vy * 0.98 + 0.2, // Gravity
          }))
          .filter(s => s.life > 0);
        
        if (updated.length > 0) {
          animationFrameRef.current = requestAnimationFrame(animate);
        } else {
          animationFrameRef.current = null;
        }
        
        return updated;
      });
    };
    
    if (!animationFrameRef.current) {
      animationFrameRef.current = requestAnimationFrame(animate);
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [sparkles.length]);

  // Draw sparkles on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resizeCanvas = () => {
      if (pianoContainerRef.current) {
        const rect = pianoContainerRef.current.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let drawFrameRef: number | null = null;
    const sparklesRef = { current: sparkles };
    
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      sparklesRef.current.forEach(sparkle => {
        ctx.save();
        ctx.globalAlpha = sparkle.life;
        ctx.fillStyle = sparkle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = sparkle.color;
        ctx.beginPath();
        ctx.arc(sparkle.x, sparkle.y, sparkle.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });

      if (sparklesRef.current.length > 0) {
        drawFrameRef = requestAnimationFrame(draw);
      } else {
        drawFrameRef = null;
      }
    };

    // Update ref and restart draw if needed
    sparklesRef.current = sparkles;
    if (sparkles.length > 0 && !drawFrameRef) {
      draw();
    }

    return () => {
      if (drawFrameRef) {
        cancelAnimationFrame(drawFrameRef);
      }
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [sparkles]);

  // Gradually fade color intensity when no keys are pressed
  useEffect(() => {
    if (!colorFeedbackEnabled || !selectedSet?.category) {
      setColorIntensity(0);
      return;
    }

    const fadeInterval = setInterval(() => {
      const timeSinceLastPress = Date.now() - lastKeyPressTimeRef.current;
      // Fade out after 2 seconds of no key presses
      if (timeSinceLastPress > 2000) {
        setColorIntensity(prev => Math.max(0, prev - 0.02)); // Fade slowly
      }
    }, 100);

    return () => clearInterval(fadeInterval);
  }, [colorFeedbackEnabled, selectedSet?.category]);

  // Helper to convert color to rgba or hex with opacity
  const colorWithOpacity = (color: string, opacity: number): string => {
    if (color.startsWith('#')) {
      // Hex color - convert to rgba
      const hex = color.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      const a = opacity / 255;
      return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
    } else if (color.startsWith('rgb')) {
      // RGB color - convert to rgba
      const match = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
      if (match) {
        const r = parseInt(match[1]);
        const g = parseInt(match[2]);
        const b = parseInt(match[3]);
        const a = opacity / 255;
        return `rgba(${r}, ${g}, ${b}, ${a.toFixed(3)})`;
      }
    }
    return color;
  };

  // Update background gradient based on color intensity with complementary colors
  useEffect(() => {
    if (colorFeedbackEnabled && selectedSet?.category && categoryColor && colorIntensity > 0 && colorPalette.length > 1) {
      // Intensity scales from 0 to 1, map to opacity 0% to 40%
      const maxOpacity = 40;
      const opacity1 = Math.round(colorIntensity * maxOpacity);
      const opacity2 = Math.round(colorIntensity * maxOpacity * 0.6);
      const opacity3 = Math.round(colorIntensity * maxOpacity * 0.4);
      const opacity4 = Math.round(colorIntensity * maxOpacity * 0.2);
      
      // Use multiple colors from palette for rich gradient
      const color1 = colorPalette[0]; // Base color
      const color2 = colorPalette[1]; // Lighter tint
      const color3 = colorPalette[2]; // Darker shade
      const color4 = colorPalette[3]; // Complementary
      
      const gradient = `radial-gradient(ellipse at center, ${colorWithOpacity(color1, opacity1)} 0%, ${colorWithOpacity(color2, opacity2)} 25%, ${colorWithOpacity(color3, opacity3)} 50%, ${colorWithOpacity(color4, opacity4)} 75%, transparent 100%)`;
      setBgGradient(gradient);
    } else {
      setBgGradient("");
    }
  }, [colorIntensity, selectedSet?.category, categoryColor, colorFeedbackEnabled, colorPalette]);

  const handlePianoNotePlay = (note: string, position?: { x: number; y: number }) => {
    if (!synthesizerRef.current) return;
    
    // Fire off note playback immediately without any blocking
    synthesizerRef.current.playNote(note, 0.5).catch(() => {
      // Ignore errors - note will retry if context initializes
    });
    
    // Increase color intensity with each key press
    if (colorFeedbackEnabled && selectedSet?.category) {
      lastKeyPressTimeRef.current = Date.now();
      setColorIntensity(prev => Math.min(1, prev + 0.08)); // Increase intensity, cap at 1
      createSparkles(colorPalette, position?.x, position?.y);
    }
    
    // Update word highlighting for freeplay with affirmations
    if (selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0) {
      keyPressCountRef.current += 1;
      const currentLineWordIndex = Math.min(keyPressCountRef.current - 1, currentAffirmationWords.length - 1);
      setHighlightedWordIndex(currentLineWordIndex);
      
      // Move to next line when all words in current line are highlighted
      if (currentLineWordIndex >= currentAffirmationWords.length - 1) {
        if (currentLineIndex < currentAffirmationLines.length - 1) {
          // Move to next line
          const nextLineIndex = currentLineIndex + 1;
          setCurrentLineIndex(nextLineIndex);
          const nextLineWords = currentAffirmationLines[nextLineIndex].split(/\s+/);
          setCurrentAffirmationWords(nextLineWords);
          setHighlightedWordIndex(-1);
          keyPressCountRef.current = 0;
        } else {
          // Loop back to the beginning
          setCurrentLineIndex(0);
          const firstLineWords = currentAffirmationLines[0].split(/\s+/);
          setCurrentAffirmationWords(firstLineWords);
          setHighlightedWordIndex(-1);
          keyPressCountRef.current = 0;
        }
      }
    }
  };

  const renderContent = () => {
    if (isMobile) {
      // Setup screen - before starting
      if (!hasStarted) {
        return (
          <div 
            className={cn(
              toolPageShellRootClass(theme),
              toolPageShellGradientClass(theme, "purple"),
              "pb-[calc(7rem+env(safe-area-inset-bottom))] transition-all duration-500",
            )}
            style={
              bgGradient
                ? { ...toolPageShellRootStyle(theme), backgroundImage: bgGradient }
                : toolPageShellRootStyle(theme)
            }
          >
            {/* Safe area — theme background */}
        <ToolPageSafeAreaInlet />
{/* Header */}
            <header
              className={cn(toolPageHeaderClass(theme), toolPageHeaderLayoutClass(true))}
              style={toolPageHeaderStyle(theme, true)}
            >
              <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
                <div className="flex items-center justify-between">
                <h1 
                  className={toolPageHeaderTitleClass(theme)}
                  onClick={() => navigate("/dashboard")}
                >
                  Piano Tapping
                </h1>
                  {/* PWA Browser Mobile Menu */}
                  {isMobile && <MobilePWAMenu />}
                </div>
              </div>
            </header>

            <main className={cn("px-4 sm:px-6 max-w-6xl relative z-10", !isMobile ? "" : "container mx-auto")}>
              <div className="py-3 sm:py-4">
                <p className="text-sm sm:text-base text-muted-foreground">
                  Immerse yourself in your affirmation with music and color
                </p>
              </div>
              <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
                {/* Affirmation Set Selector */}
                <Card className={cn(pianoOuterCardClass, "w-full max-w-md")}>
                  <CardContent className="p-3 sm:p-4">
                    <div className={cn("flex flex-col gap-4 p-4", pianoInnerWellClass)}>
                      <div className="flex flex-col gap-3">
                        <Label className="text-sm font-medium">Affirmation Set (Optional)</Label>
                        <div className="relative">
                          <Button 
                            variant="outline" 
                            className={cn("w-full h-12 flex items-center justify-between", pianoFieldChrome)}
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          >
                            <span>
                              {selectedAffirmationSet ? affirmationSets.find(s => s.id === selectedAffirmationSet)?.name || "None" : "None"}
                            </span>
                          </Button>
                          {isDropdownOpen && (
                            <div 
                              className={cn(
                                "absolute top-full mt-2 left-0 right-0 p-1 z-50 max-h-[300px] overflow-y-auto",
                                pianoPopoverSurface,
                              )}
                            >
                              <div className="flex flex-col gap-1">
                                <button
                                  onClick={() => {
                                    setSelectedAffirmationSet("");
                                    setIsDropdownOpen(false);
                                  }}
                                  className={cn(
                                    "w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left",
                                    !selectedAffirmationSet && "bg-accent"
                                  )}
                                >
                                  None
                                </button>
                                {affirmationSets.map((set) => (
                                  <button
                                    key={set.id}
                                    onClick={() => {
                                      setSelectedAffirmationSet(set.id);
                                      setIsDropdownOpen(false);
                                    }}
                                    className={cn(
                                      "w-full px-3 py-2 text-sm rounded-sm hover:bg-accent text-left",
                                      selectedAffirmationSet === set.id && "bg-accent"
                                    )}
                                  >
                                    {set.name}
                                    {set.category ? ` · ${getSupportCategoryLabel(set.category)}` : ""}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Color Feedback Toggle */}
                      <div className="flex items-center justify-between">
                        <Label htmlFor="color-feedback" className="text-sm font-medium">
                          Color Feedback
                        </Label>
                        <Switch
                          id="color-feedback"
                          checked={colorFeedbackEnabled}
                          onCheckedChange={setColorFeedbackEnabled}
                        />
                      </div>
                      {/* Start Button */}
                      <Button 
                        className="w-full mt-4" 
                        size="lg"
                        onClick={() => setHasStarted(true)}
                      >
                        Start
                      </Button>
                      <p className="mt-2 text-xs text-red-600 leading-snug">{IPHONE_PIANO_AUDIO_HINT}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </main>
          </div>
        );
      }

      // Piano screen - after starting
      return (
        <div 
          className={cn(
            toolPageShellRootClass(theme),
            toolPageShellGradientClass(theme, "purple"),
            "pb-[calc(7rem+env(safe-area-inset-bottom))] transition-all duration-500",
          )}
          style={
            bgGradient
              ? { ...toolPageShellRootStyle(theme), backgroundImage: bgGradient }
              : toolPageShellRootStyle(theme)
          }
        >
          {/* Safe area — theme background */}
        <ToolPageSafeAreaInlet />
{/* Header */}
            <header
              className={cn(toolPageHeaderClass(theme), toolPageHeaderLayoutClass(true))}
              style={toolPageHeaderStyle(theme, true)}
            >
              <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
              <div className="flex items-center justify-between">
                <h1 
                  className={toolPageHeaderTitleClass(theme)}
                  onClick={() => setHasStarted(false)}
                >
                  Piano Tapping
                </h1>
                {/* PWA Browser Mobile Menu */}
                {isMobile && <MobilePWAMenu />}
              </div>
              </div>
            </header>

          <main className={cn(
            "px-4 sm:px-6 max-w-6xl relative z-10",
            !isMobile ? "" : "container mx-auto",
            isMobile ? "flex items-center justify-center min-h-[calc(100vh-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px)-7rem)] pt-8" : "pt-2"
          )}>
            <div className={cn(
              isMobile ? "relative w-full" : "space-y-6"
            )}>
                {/* Piano Keyboard */}
                <Card 
                  className={cn(
                    pianoOuterCardClass,
                    "overflow-visible transition-all duration-300",
                    isMobile ? "max-w-[90%] mx-auto" : "mx-auto",
                    colorFeedbackEnabled && selectedSet?.category && categoryColor && colorIntensity > 0 && "transition-all duration-300"
                  )}
                >
                     <CardContent className="p-3 sm:p-4 overflow-visible">
                       <div
                         className={cn("overflow-visible space-y-3", pianoInnerWellClass)}
                         style={
                           colorFeedbackEnabled &&
                           selectedSet?.category &&
                           categoryColor &&
                           colorIntensity > 0 &&
                           colorPalette.length > 1
                             ? {
                                 background: `linear-gradient(135deg, ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 100))} 0%, ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 80))} 30%, ${colorWithOpacity(colorPalette[2], Math.round(colorIntensity * 60))} 60%, ${colorWithOpacity(colorPalette[3], Math.round(colorIntensity * 40))} 100%)`,
                                 boxShadow: `0 0 ${Math.round(colorIntensity * 50)}px ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 100))}, inset 0 0 ${Math.round(colorIntensity * 30)}px ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 40))}`,
                               }
                             : undefined
                         }
                       >
                       <div className={cn(
                         "relative overflow-visible w-full",
                         isMobile && "max-w-[85%] ml-0"
                       )} ref={pianoContainerRef}>
                      {/* Sparkles Canvas */}
                      {colorFeedbackEnabled && (
                        <canvas
                          ref={canvasRef}
                          className="absolute inset-0 pointer-events-none z-20"
                          style={{ width: '100%', height: '100%' }}
                        />
                      )}
                      {/* Affirmation Overlay - only for freeplay with affirmations */}
                      {selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                        <div className={cn(
                          "absolute z-30 pointer-events-none",
                          isMobile ? "right-[-80px] top-1/2 transform -translate-y-1/2" : "right-2 top-1/2 transform -translate-y-1/2"
                        )}>
                          <div className={cn(
                            pianoAffirmationBubble,
                            isMobile ? "px-4 py-3 min-w-[60px]" : "px-5 py-4 min-w-[80px]"
                          )}>
                            <div 
                              className={cn(
                                "flex justify-center items-start font-semibold select-none",
                                isMobile ? "text-lg gap-1.5" : "text-lg gap-3"
                              )}
                              style={{ writingMode: 'vertical-rl', textOrientation: 'mixed', userSelect: 'none' }}
                            >
                              {currentAffirmationWords.map((word, index) => (
                                <span
                                  key={index}
                                  className={cn(
                                    "transition-all duration-200 inline-block select-none",
                                    index === highlightedWordIndex
                                      ? "font-bold scale-110 drop-shadow-lg"
                                      : "text-foreground/90"
                                  )}
                                  style={{ 
                                    ...(index === highlightedWordIndex ? {
                                      color: colorFeedbackEnabled && selectedSet?.category ? categoryColor : "#22c55e"
                                    } : {}),
                                    userSelect: 'none'
                                  }}
                                >
                                  {word}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                      <PianoKeyboard 
                        onNotePlay={handlePianoNotePlay}
                        activeColor={colorFeedbackEnabled && selectedSet?.category && colorPalette.length > 0 ? colorPalette[0] : undefined}
                      />
                    </div>
                       </div>
                  <p className="text-xs text-red-600 leading-snug pt-2">{IPHONE_PIANO_AUDIO_HINT}</p>
                  </CardContent>
                </Card>
            </div>
          </main>
        </div>
      );
    }

    // Desktop view
    return (
      <div 
        className={cn(toolPageShellRootClass(theme), "min-h-screen pb-20 md:pb-0 relative overflow-hidden transition-all duration-500")}
        style={
          bgGradient
            ? { ...toolPageShellRootStyle(theme), backgroundImage: bgGradient }
            : toolPageShellRootStyle(theme)
        }
      >
        {/* Status bar / notch: theme token (light / dark) — matches Subliminal / Backgrounds */}
        <ToolPageSafeAreaInlet />
<div className="flex h-screen">
          {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}
          <div 
            className="flex-1 flex flex-col overflow-hidden relative z-10"
            style={!isMobile ? {
              marginLeft: sidebarCollapsed ? '64px' : '256px',
              transition: 'margin-left 300ms ease-in-out'
            } : {}}
          >
            {/* Header */}
            <header
              className={cn(toolPageHeaderClass(theme), toolPageHeaderLayoutClass(isMobile))}
              style={toolPageHeaderStyle(theme, isMobile, { sidebarCollapsed })}
            >
              <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
                <h1 className="text-lg font-bold text-foreground">
                  Piano Tapping
                </h1>
              </div>
            </header>

             <main className={cn("flex-1 overflow-y-auto", !isMobile ? "pt-10" : "")}>
               <div className={cn("px-4 sm:px-6 py-4 sm:py-6 max-w-6xl", !isMobile ? "" : "container mx-auto")}>
                 <div className="py-3 sm:py-4">
                   <p className="text-sm sm:text-base text-muted-foreground">
                     Immerse yourself in your affirmations with music and color
                   </p>
                 </div>
                 <div className="space-y-6">
                   {/* Affirmation Selection - Above Piano */}
                   <Card className={pianoOuterCardClass}>
                     <CardContent className="p-3 sm:p-4">
                       <div className={cn("p-4", pianoInnerWellClass)}>
                       <div className="flex items-center gap-4">
                         <div className="flex-1">
                           <Label className="text-sm font-medium">Affirmation Set (Optional)</Label>
                           <Select 
                             value={selectedAffirmationSet || undefined} 
                             onValueChange={(value) => setSelectedAffirmationSet(value === "none" ? "" : value)}
                           >
                             <SelectTrigger className={cn("mt-2", pianoFieldChrome)}>
                               <SelectValue placeholder="None" />
                             </SelectTrigger>
                             <SelectContent className={cn(pianoMenuSurface || "bg-background")}>
                               <SelectItem value="none">None</SelectItem>
                               {affirmationSets.map((set) => (
                                 <SelectItem key={set.id} value={set.id}>
                                   {set.name}
                                   {set.category ? ` · ${getSupportCategoryLabel(set.category)}` : ""}
                                 </SelectItem>
                               ))}
                             </SelectContent>
                           </Select>
                         </div>
                         {/* Color Feedback Toggle - To the right when affirmation is selected */}
                         {selectedAffirmationSet && selectedAffirmationSet !== "none" && (
                           <div className="flex items-end pb-2">
                             <div className="flex items-center gap-3">
                               <Label htmlFor="color-feedback-desktop" className="text-sm font-medium whitespace-nowrap">
                                 Color Feedback
                               </Label>
                               <Switch
                                 id="color-feedback-desktop"
                                 checked={colorFeedbackEnabled}
                                 onCheckedChange={setColorFeedbackEnabled}
                               />
                             </div>
                           </div>
                         )}
                       </div>
                       </div>
                     </CardContent>
                   </Card>

                   {/* Piano Keyboard */}
                   <Card 
                     className={cn(
                       pianoOuterCardClass,
                       "overflow-visible transition-all duration-300",
                       isMobile ? "max-w-[90%] ml-0" : "mx-auto",
                       colorFeedbackEnabled && selectedSet?.category && categoryColor && colorIntensity > 0 && "transition-all duration-300"
                     )}
                   >
                     <CardContent className="p-3 sm:p-4 overflow-visible relative">
                       <div
                         className={cn("overflow-visible space-y-3 relative", pianoInnerWellClass)}
                         style={
                           colorFeedbackEnabled &&
                           selectedSet?.category &&
                           categoryColor &&
                           colorIntensity > 0 &&
                           colorPalette.length > 1
                             ? {
                                 background: `linear-gradient(135deg, ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 100))} 0%, ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 80))} 30%, ${colorWithOpacity(colorPalette[2], Math.round(colorIntensity * 60))} 60%, ${colorWithOpacity(colorPalette[3], Math.round(colorIntensity * 40))} 100%)`,
                                 boxShadow: `0 0 ${Math.round(colorIntensity * 50)}px ${colorWithOpacity(colorPalette[0], Math.round(colorIntensity * 100))}, inset 0 0 ${Math.round(colorIntensity * 30)}px ${colorWithOpacity(colorPalette[1], Math.round(colorIntensity * 40))}`,
                               }
                             : undefined
                         }
                       >
                       {/* Affirmation Overlay - positioned relative to CardContent */}
                       {selectedAffirmationSet && selectedAffirmationSet.trim() !== "" && currentAffirmationWords.length > 0 && (
                         <div className={cn(
                           "absolute z-30 pointer-events-none",
                           isMobile 
                             ? "right-2 top-1/2 -translate-y-1/2" 
                             : "left-1/2 top-4 -translate-x-1/2"
                         )}>
                           <div className={cn(
                             pianoAffirmationBubble,
                             isMobile ? "px-4 py-3 min-w-[60px]" : "px-4 py-2"
                           )}>
                             <div 
                               className={cn(
                                 "font-semibold select-none",
                                 isMobile 
                                   ? "flex justify-center items-start gap-3 text-xl"
                                   : "flex flex-wrap justify-center items-center gap-2 text-base"
                               )}
                               style={isMobile ? { writingMode: 'vertical-rl', textOrientation: 'mixed', userSelect: 'none' } : { userSelect: 'none' }}
                             >
                               {currentAffirmationWords.map((word, index) => (
                                 <span
                                   key={index}
                                   className={cn(
                                     "transition-all duration-200 inline-block select-none",
                                     index === highlightedWordIndex
                                       ? "font-bold scale-110 drop-shadow-lg"
                                       : "text-foreground/90"
                                   )}
                                   style={{ 
                                     ...(index === highlightedWordIndex ? {
                                       color: colorFeedbackEnabled && selectedSet?.category ? categoryColor : "#22c55e"
                                     } : {}),
                                     userSelect: 'none'
                                   }}
                                 >
                                   {word}
                                 </span>
                               ))}
                             </div>
                           </div>
                         </div>
                       )}
                       <div className={cn(
                         "relative overflow-visible w-full",
                         isMobile && "max-w-[85%] ml-0"
                       )} ref={pianoContainerRef}>
                         {/* Sparkles Canvas */}
                         {colorFeedbackEnabled && (
                           <canvas
                             ref={canvasRef}
                             className="absolute inset-0 pointer-events-none z-20"
                             style={{ width: '100%', height: '100%' }}
                           />
                         )}
                         <PianoKeyboard 
                           onNotePlay={handlePianoNotePlay}
                           activeColor={colorFeedbackEnabled && selectedSet?.category && colorPalette.length > 0 ? colorPalette[0] : undefined}
                         />
                       </div>
                       </div>
                     <p className="text-xs text-red-600 leading-snug pt-2">{IPHONE_PIANO_AUDIO_HINT}</p>
                     </CardContent>
                   </Card>
                 </div>
               </div>
             </main>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      {renderContent()}
    </>
  );
}

export default Freeplay;

================================================================================
src/pages/onboarding/AndroidPaywall.tsx
================================================================================
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { IosAppHeader } from "@/components/IosAppHeader";

const TERMS_URL = "https://paletteplot.com/terms";
const PRIVACY_URL = "https://paletteplot.com/privacy";

/**
 * Native Android subscription paywall. Uses RevenueCat paywall UI to present
 * Google Play subscriptions. Completely separate from the iOS paywall.
 */
const AndroidPaywall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);

  const isNativeAndroid = isAndroidPaywallContext();

  useEffect(() => {
    debugLog({
      location: "AndroidPaywall.tsx:mount",
      message: "AndroidPaywall mounted",
      data: {
        pathname: location.pathname,
        isNativeAndroid,
      },
      hypothesisId: "ANDROID-PAY",
    });
  }, [location.pathname, isNativeAndroid]);

  const runPaywallFlow = useCallback(async () => {
    if (!isNativeAndroid) {
      toast.error("Subscriptions are only available in the Android app.", {
        duration: 6000,
      });
      setFallbackDetail("Subscriptions are only available in the Android app.");
      setShowFallback(true);
      return;
    }

    setFallbackDetail(null);
    setPaywallOpening(true);

    try {
      let uid = user?.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
        if (error || !uid) {
          toast.error("Sign in again, then open subscription.", {
            duration: 8000,
          });
          setFallbackDetail(
            "No active session. Sign out, sign in, then tap Continue."
          );
          setShowFallback(true);
          return;
        }
      }

      const outcome = await runAndroidPaywallFlowAfterSignup({
        userId: uid,
        navigate,
        bypassPresentationLock: true,
      });
      const lastErr = getLastPaywallError();

      if (outcome === "success") return;

      if (outcome === "skipped") {
        toast.error("Open subscription from the app after sign up.", {
          duration: 6000,
        });
        setFallbackDetail(
          "Use Continue on the sign-up screen, or open Account from Settings."
        );
        setShowFallback(true);
        return;
      }
      setFallbackDetail(lastErr || "Something went wrong.");
      setShowFallback(true);
    } catch (e) {
      debugLog({
        location: "AndroidPaywall.tsx:runPaywallFlow:catch",
        message: "Unexpected error in AndroidPaywall paywall handler",
        data: {
          err: String((e as Error)?.message ?? e),
          stack: (e as Error)?.stack?.slice(0, 500) ?? null,
        },
        hypothesisId: "ANDROID-PAY",
      });
      toast.error("Something went wrong.", { duration: 8000 });
      setFallbackDetail(String((e as Error)?.message ?? e));
      setShowFallback(true);
    } finally {
      setPaywallOpening(false);
    }
  }, [isNativeAndroid, navigate, user?.id]);

  const handleContinue = () => {
    void runPaywallFlow();
  };

  useEffect(() => {
    if (!isNativeAndroid) {
      navigate("/onboarding/welcome", { replace: true });
    }
  }, [isNativeAndroid, navigate]);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-2 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(TERMS_URL, "_blank", "noopener,noreferrer")}
        >
          Terms / EULA
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(PRIVACY_URL, "_blank", "noopener,noreferrer")}
        >
          Privacy
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-foreground">
      <IosAppHeader signOutInsteadOfLogin={!!user} />

      <div
        className="mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{
          minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg
              width="120"
              height="28"
              viewBox="0 0 120 28"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="44"
                cy="12"
                r="6"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z"
                fill="#B8860B"
                opacity="0.35"
              />
              <circle cx="96" cy="10" r="1.2" fill="#B8860B" />
              <circle cx="104" cy="16" r="1" fill="#B8860B" />
              <circle cx="88" cy="18" r="0.8" fill="#B8860B" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Unlock Your Manifestation Stack Today.
            </h1>
            <p className="mt-3 text-xs text-zinc-500">
              Tap Continue to confirm your plan.
            </p>
          </div>

          {!showFallback ? (
            <>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? "Opening…" : "Continue"}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">
                  We couldn&apos;t finish that step
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Tap Try again, or go back to sign up and tap Continue.
                </p>
                {fallbackDetail ? (
                  <p
                    className="mt-2 text-xs text-zinc-500 break-words"
                    data-testid="paywall-error"
                  >
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? "Opening…" : "Try again"}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AndroidPaywall;

