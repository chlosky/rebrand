import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";
import type { Appearance } from "@/contexts/ThemeContext";

/** Legacy root class — mobile dashboard no longer forces dark glass tiles (build 192 behavior). */
export const DASHBOARD_MOBILE_DARK_TILES_CLASS = "dashboard-mobile-dark-tiles";

/** Home dashboard shell — cosmic void on dark; sky + card chrome on light. */
export function dashboardHomeUsesCosmicShell(theme: Appearance): boolean {
  return theme === "dark";
}

/** Glass panel on cosmic shell — use on `div`, not shadcn `Card` (`bg-card` fights this). */
export const DASHBOARD_GLASS_CARD_CLASS =
  "rounded-2xl border border-white/12 bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md shadow-sm text-white";

export const DASHBOARD_TOOL_TILE_SURFACE =
  "rounded-2xl border border-white/12 bg-transparent text-white transition-colors hover:bg-white/[0.06]";

/** Light home tool tiles — same horizontal bar metrics as cosmic; sky-appropriate fill only. */
export const DASHBOARD_LIGHT_TOOL_TILE_SURFACE =
  "rounded-2xl border border-zinc-200/75 bg-card/75 backdrop-blur-sm text-foreground transition-colors hover:bg-card/90";

export const DASHBOARD_COSMIC_TEXT_PRIMARY = "text-white";
export const DASHBOARD_COSMIC_TEXT_MUTED = "text-white/55";
export const DASHBOARD_COSMIC_METER_TRACK = "relative h-3.5 w-full min-w-0 overflow-hidden rounded-full bg-white/15";

/** Inspired-action chips — black glass wells on the cosmic manifestation card. */
export const DASHBOARD_INSPIRED_ACTION_CELL_BASE =
  "rounded-xl border text-center backdrop-blur-sm transition-colors shadow-sm";

/** Web desktop sidebar — selected nav item (Dashboard, tools, settings). */
export const DASHBOARD_SIDEBAR_NAV_ACTIVE_CLASS =
  "bg-black/55 backdrop-blur-sm border border-white/20 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]";

const DASHBOARD_HEADER_FOCUS_RESET =
  "outline-none focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0";

/** Overrides shadcn `outline` variant hover (`hover:text-accent-foreground`). */
const DASHBOARD_HEADER_LIGHT_SURFACE =
  "border-black/70 bg-white text-black shadow-sm hover:bg-zinc-50 hover:text-black active:bg-zinc-100 active:text-black";

/** Dashboard header — pill CTA (Talk to Guide). */
export function dashboardHeaderPillButtonClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return cn(
      "h-9 rounded-full border border-white/25 bg-white/10 px-3 text-white/90 shadow-sm backdrop-blur-sm",
      "transition-none hover:bg-white/15 hover:text-white active:bg-white/20",
      DASHBOARD_HEADER_FOCUS_RESET,
    );
  }
  return cn(
    "h-9 rounded-full px-3 transition-none",
    DASHBOARD_HEADER_LIGHT_SURFACE,
    DASHBOARD_HEADER_FOCUS_RESET,
  );
}

/** Dashboard header — circular icon buttons (theme toggle, report issue). */
export function dashboardHeaderIconButtonClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return cn(
      "h-9 w-9 shrink-0 rounded-full border border-white/25 bg-white/10 p-0 text-white/90 shadow-sm backdrop-blur-sm",
      "transition-none hover:bg-white/15 hover:text-white active:bg-white/20",
      "[&_svg]:text-white/90 hover:[&_svg]:text-white",
      DASHBOARD_HEADER_FOCUS_RESET,
    );
  }
  return cn(
    "h-9 w-9 shrink-0 rounded-full p-0 transition-none",
    DASHBOARD_HEADER_LIGHT_SURFACE,
    "[&_svg]:text-black hover:[&_svg]:text-black active:[&_svg]:text-black",
    DASHBOARD_HEADER_FOCUS_RESET,
  );
}

/** Dashboard header — avatar trigger (transparent; ring lives on `dashboardHeaderAvatarShellClass`). */
export function dashboardHeaderAvatarTriggerClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return cn(
      "relative h-9 w-9 rounded-full border-0 bg-transparent p-0 shadow-none",
      "hover:bg-transparent active:bg-transparent",
      DASHBOARD_HEADER_FOCUS_RESET,
    );
  }
  return cn(
    "relative h-9 w-9 rounded-full border-0 bg-transparent p-0 shadow-none",
    "hover:bg-transparent active:bg-transparent hover:text-black",
    DASHBOARD_HEADER_FOCUS_RESET,
  );
}

/** Dashboard header — avatar circle border (visible ring matching icon buttons). */
export function dashboardHeaderAvatarShellClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "h-9 w-9 shrink-0 overflow-hidden rounded-full border border-white/25 shadow-sm";
  }
  return "h-9 w-9 shrink-0 overflow-hidden rounded-full border border-black/70 bg-white shadow-sm";
}

export function dashboardHeaderAvatarFallbackClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "bg-white/10 text-white text-sm font-medium border-0";
  }
  return "bg-white text-black text-sm font-medium border-0";
}

/** Mobile + web home use glass tiles on the cosmic shell. */
export function mobileDashboardUsesDarkTileStyle(
  theme: Appearance,
  isMobileDashboard: boolean,
): boolean {
  return dashboardHomeUsesCosmicShell(theme) && isMobileDashboard;
}

export function webDashboardUsesCosmicTileStyle(theme: Appearance): boolean {
  return dashboardHomeUsesCosmicShell(theme);
}

function dashboardTileStyleTheme(theme: Appearance, _isMobileDashboard: boolean): Appearance {
  return theme;
}

/** Shared manifestation / daily-practice colors — matches `Dashboard.tsx`. */
export function manifestationStatusBadgeClass(
  theme: Appearance,
  isMobileDashboard = false,
): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "text-xs font-medium whitespace-nowrap px-3 py-1 rounded-full border border-white/20 bg-white/10 text-white/80";
  }
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  return cn(
    "text-xs font-medium whitespace-nowrap px-3 py-1 rounded-full border",
    t === "dark" && "border-zinc-700 bg-zinc-900/60 text-zinc-200",
    (t === "light" || !t) && "border-zinc-200 bg-zinc-50 text-zinc-700",
  );
}

export function manifestationMeterBarClass(theme: Appearance, isMobileDashboard = false): string {
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  const base =
    "absolute inset-y-0 left-0 rounded-full transition-[width] duration-500 ease-out will-change-[width]";
  if (dashboardHomeUsesCosmicShell(theme)) {
    return cn(
      base,
      "bg-gradient-to-r from-pink-200 via-rose-200 to-pink-100 shadow-[0_0_22px_rgba(252,211,232,0.75),0_0_36px_rgba(251,207,232,0.35)]",
    );
  }
  if (t === "dark") {
    return cn(base, "bg-zinc-200 shadow-[0_0_14px_rgba(244,244,245,0.15)]");
  }
  return cn(base, "bg-zinc-700");
}

export function dashboardMobileManifestationMeterTrackClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return DASHBOARD_COSMIC_METER_TRACK;
  }
  return mobileDashboardUsesDarkTileStyle(theme, isMobileDashboard)
    ? "relative h-3.5 w-full min-w-0 overflow-hidden rounded-full bg-zinc-800/35"
    : "relative h-3.5 w-full min-w-0 overflow-hidden rounded-full bg-muted/55 dark:bg-muted/35";
}

export function dashboardMobileManifestationDividerClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  if (dashboardHomeUsesCosmicShell(theme) && isMobileDashboard) {
    return "pt-2 border-t border-white/12";
  }
  return mobileDashboardUsesDarkTileStyle(theme, isMobileDashboard)
    ? "pt-2 border-t border-zinc-700/60"
    : "pt-2 border-t border-zinc-200/80 dark:border-zinc-700/60";
}

export function manifestationCardClass(theme: Appearance, checkpoints: number): string {
  return cn(
    "rounded-2xl border border-zinc-200/75 bg-card/75 backdrop-blur-sm shadow-sm dark:border-zinc-600/65",
    checkpoints >= 3 &&
      "ring-1 ring-zinc-200/50 shadow-[0_0_14px_rgba(0,0,0,0.04)] dark:ring-zinc-600/35",
  );
}

function dashboardCosmicDailyPracticeCellClass(done: boolean, isMobileDashboard: boolean): string {
  const pad = isMobileDashboard ? "px-1.5 py-2" : "px-2 py-3";
  return cn(
    "rounded-xl border text-center transition-colors",
    pad,
    done ? "border-white/30 bg-transparent text-white" : "border-white/12 bg-transparent text-white/55",
  );
}

export function dailyPracticeCellClass(
  theme: Appearance,
  done: boolean,
  isMobileDashboard = false,
): string {
  if (dashboardHomeUsesCosmicShell(theme) && (isMobileDashboard || webDashboardUsesCosmicTileStyle(theme))) {
    return dashboardCosmicDailyPracticeCellClass(done, isMobileDashboard);
  }
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  return cn(
    "rounded-xl border text-center transition-colors",
    isMobileDashboard ? "px-1.5 py-2" : "px-2 py-3",
    t === "light" &&
      (done ? "border-zinc-200/80 bg-zinc-100/90" : "border-zinc-200/65 bg-zinc-50/80"),
    t === "dark" &&
      (done ? "border-zinc-500 bg-zinc-800 text-zinc-100" : "border-zinc-700/90 bg-zinc-800/35 text-zinc-400"),
  );
}

export function dailyPracticeIconClass(
  theme: Appearance,
  done: boolean,
  isMobileDashboard = false,
): string {
  if (dashboardHomeUsesCosmicShell(theme) && (isMobileDashboard || webDashboardUsesCosmicTileStyle(theme))) {
    return cn("mx-auto h-4 w-4", done ? "text-white" : "text-white/45");
  }
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  return cn(
    "mx-auto h-4 w-4",
    t === "light" && (done ? "text-foreground" : "text-muted-foreground"),
    t === "dark" && (done ? "text-zinc-100" : "text-zinc-500"),
  );
}

export function dailyPracticeLabelClass(
  theme: Appearance,
  done: boolean,
  isMobileDashboard = false,
): string {
  if (dashboardHomeUsesCosmicShell(theme) && (isMobileDashboard || webDashboardUsesCosmicTileStyle(theme))) {
    return cn(
      isMobileDashboard ? "mt-1 text-[10px] leading-none" : "mt-1.5 text-[10px] font-medium leading-none",
      done ? "text-white" : "text-white/50",
    );
  }
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  return cn(
    isMobileDashboard ? "mt-1 text-[10px] leading-none" : "mt-1.5 text-[10px] font-medium leading-none",
    t === "light" && (done ? "text-foreground" : "text-muted-foreground"),
    t === "dark" && (done ? "text-zinc-100" : "text-zinc-500"),
  );
}

/** Web desktop dashboard — light uses same rounded tile surface as tool rows. */
export function webDashboardManifestationCardClass(
  theme: Appearance,
  checkpoints: number,
  target = 3,
): string {
  const metTarget = checkpoints >= Math.max(1, target || 3);
  if (webDashboardUsesCosmicTileStyle(theme)) {
    return cn(
      DASHBOARD_GLASS_CARD_CLASS,
      metTarget && "ring-1 ring-white/20 shadow-[0_0_18px_rgba(255,255,255,0.06)]",
    );
  }
  return cn(
    "overflow-hidden",
    DASHBOARD_LIGHT_TOOL_TILE_SURFACE,
    "shadow-sm",
    metTarget && "ring-1 ring-zinc-200/50 shadow-[0_0_14px_rgba(0,0,0,0.04)]",
  );
}

export function webDashboardToolCardClass(theme: Appearance): string {
  if (webDashboardUsesCosmicTileStyle(theme)) {
    return cn(
      "group flex w-full items-center gap-4 p-5 text-left",
      DASHBOARD_TOOL_TILE_SURFACE,
    );
  }
  return cn(
    "group flex w-full items-center gap-4 p-5 text-left",
    DASHBOARD_LIGHT_TOOL_TILE_SURFACE,
  );
}

/** Tool icon wells — match active appearance, not per-tool colors. */
export function dashboardToolIconWellClass(theme: Appearance, isMobileDashboard = false): string {
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  const onCosmic =
    dashboardHomeUsesCosmicShell(theme) &&
    (isMobileDashboard || webDashboardUsesCosmicTileStyle(theme));
  if (onCosmic) {
    return "flex shrink-0 items-center justify-center";
  }
  return cn(
    "flex shrink-0 items-center justify-center rounded-md",
    t === "dark" && "bg-zinc-800/80 border border-zinc-700/80",
    (t === "light" || !t) && "bg-muted/50 border border-transparent",
  );
}

export function dashboardToolIconClass(
  theme: Appearance,
  isMobileDashboard = false,
  useNeonIcon = false,
): string {
  if (useNeonIcon) {
    return "";
  }
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  return cn(
    t === "dark" && "text-zinc-200",
    (t === "light" || !t) && "text-muted-foreground",
  );
}

export function manifestationChargeZapIconClass(theme: Appearance, isMobileDashboard = false): string {
  const t = dashboardTileStyleTheme(theme, isMobileDashboard);
  const onCosmic = dashboardHomeUsesCosmicShell(theme) && (isMobileDashboard || webDashboardUsesCosmicTileStyle(theme));
  return cn(
    "h-3.5 w-3.5 shrink-0",
    onCosmic && "text-rose-300/90",
    !onCosmic && t === "dark" && "text-zinc-200",
    !onCosmic && (t === "light" || !t) && "text-zinc-700",
  );
}

export function dashboardMobileManifestationHeadingClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "text-sm font-medium text-white/90 leading-tight";
  }
  return mobileDashboardUsesDarkTileStyle(theme, isMobileDashboard)
    ? "text-sm font-medium text-zinc-100 leading-tight"
    : "text-sm font-medium text-foreground leading-tight";
}

export function dashboardMobileManifestationFooterClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "mt-3 text-[11px] sm:text-xs text-white/50 leading-snug";
  }
  return mobileDashboardUsesDarkTileStyle(theme, isMobileDashboard)
    ? "mt-3 text-[11px] sm:text-xs text-zinc-400 leading-snug"
    : "mt-3 text-[11px] sm:text-xs text-muted-foreground leading-snug";
}

export function dashboardMobileManifestationDailyLabelClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "text-xs font-medium text-white/90";
  }
  return mobileDashboardUsesDarkTileStyle(theme, isMobileDashboard)
    ? "text-xs font-medium text-zinc-100"
    : "text-xs font-medium text-foreground";
}

export function dashboardMobileToolCardHoverClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  return cn(
    "absolute inset-0 opacity-0 group-hover:opacity-100",
    mobileDashboardUsesDarkTileStyle(theme, isMobileDashboard)
      ? "bg-white/5"
      : "bg-white/10 dark:bg-white/5",
  );
}

export function dashboardSectionAccentIconClass(theme: Appearance): string {
  if (webDashboardUsesCosmicTileStyle(theme)) {
    return "h-4 w-4 shrink-0 text-rose-300/80";
  }
  return cn(
    "h-4 w-4 shrink-0",
    theme === "dark" && "text-zinc-400",
    (theme === "light" || !theme) && "text-muted-foreground",
  );
}

export function webSidebarNavActiveClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return DASHBOARD_SIDEBAR_NAV_ACTIVE_CLASS;
  }
  return cn(
    theme === "dark" && "bg-zinc-800 border border-zinc-600 text-zinc-100",
    (theme === "light" || !theme) && "bg-muted border border-zinc-200/70 text-foreground",
  );
}

export function webSidebarNavIdleClass(theme: Appearance): string {
  if (dashboardHomeUsesCosmicShell(theme)) {
    return "border border-transparent text-white/55 hover:bg-white/8 hover:text-white/80";
  }
  return cn(
    "border border-transparent",
    theme === "dark" && "hover:bg-zinc-800/60",
    (theme === "light" || !theme) && "hover:bg-muted/50",
  );
}

export type DashboardMobileSurface = {
  className: string;
  style?: CSSProperties;
};

/**
 * Status-bar strip on mobile dashboard — solid fill (same tokens as tool pages).
 */
export function dashboardMobileSafeAreaInletClass(theme: Appearance): string {
  return theme === "dark" ? "" : "bg-background";
}

/** Mobile dashboard status-bar inlet (native + mobile browser home). */
export function getDashboardMobileSafeAreaInlet(
  theme: Appearance,
  isMobileDashboard: boolean,
): DashboardMobileSurface {
  if (!isMobileDashboard) {
    return { className: "" };
  }
  if (theme === "dark") {
    return { className: "", style: { backgroundColor: "#0f0d14" } };
  }
  return { className: "bg-background", style: { backgroundColor: "#ffffff" } };
}

/**
 * @deprecated Use `getDashboardMobileSafeAreaInlet` — header chrome lives on `<header>`.
 */
export function getDashboardMobileTopChrome(
  theme: Appearance,
  isMobileDashboard: boolean,
): DashboardMobileSurface {
  return getDashboardMobileSafeAreaInlet(theme, isMobileDashboard);
}

/** Mobile dashboard card surfaces — translucent cards over sky (build 192). */
export function getDashboardMobileCardSurface(
  theme: Appearance,
  isMobileDashboard: boolean,
): DashboardMobileSurface {
  if (dashboardHomeUsesCosmicShell(theme) && isMobileDashboard) {
    return { className: "" };
  }
  if (!isMobileDashboard) {
    return { className: "bg-card/75 backdrop-blur-sm" };
  }
  return { className: "bg-card/75 backdrop-blur-sm" };
}

export function dashboardMobileManifestationCardClass(
  theme: Appearance,
  checkpoints: number,
  isMobileDashboard = false,
  target = 3,
): string {
  const metTarget = checkpoints >= Math.max(1, target || 3);
  if (dashboardHomeUsesCosmicShell(theme) && isMobileDashboard) {
    return cn(
      "max-w-3xl mb-4 max-md:mx-auto md:mx-0",
      DASHBOARD_GLASS_CARD_CLASS,
      metTarget && "ring-1 ring-white/20",
    );
  }
  return cn(
    "max-w-3xl mb-4 max-md:mx-auto md:mx-0 overflow-hidden",
    DASHBOARD_LIGHT_TOOL_TILE_SURFACE,
    "shadow-sm",
    metTarget && "ring-1 ring-zinc-200/50 shadow-[0_0_14px_rgba(0,0,0,0.04)]",
  );
}

/** Fixed 56px tool tiles on mobile dashboard — do not use sm: taller variants here. */
export const DASHBOARD_MOBILE_TOOL_TILE_HEIGHT_PX = 56;

export function dashboardMobileToolGridClass(isMobileDashboard: boolean): string {
  return cn(
    "grid grid-cols-2 gap-2 max-w-3xl max-md:mx-auto md:mx-0",
    isMobileDashboard ? "sm:gap-3" : "sm:gap-3",
  );
}

export function dashboardMobileToolCardClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  if (dashboardHomeUsesCosmicShell(theme) && isMobileDashboard) {
    return cn(
      "group relative overflow-hidden cursor-pointer animate-fade-in",
      "h-[56px] sm:h-[64px]",
      DASHBOARD_TOOL_TILE_SURFACE,
    );
  }
  return cn(
    "group relative overflow-hidden cursor-pointer animate-fade-in",
    isMobileDashboard ? "h-[56px] sm:h-[64px]" : "h-[56px] sm:h-[64px]",
    DASHBOARD_LIGHT_TOOL_TILE_SURFACE,
  );
}

export function dashboardMobileToolCardStyle(
  _isMobileDashboard: boolean,
): CSSProperties | undefined {
  return undefined;
}

export function dashboardMobileToolCardInnerClass(_isMobileDashboard: boolean): string {
  return "relative h-full flex items-center gap-2 sm:gap-3 p-2 sm:p-3";
}

export function dashboardMobileToolTitleClass(
  theme: Appearance,
  isMobileDashboard: boolean,
): string {
  const onCosmic = dashboardHomeUsesCosmicShell(theme) && isMobileDashboard;
  return cn(
    "font-semibold leading-tight tracking-tight",
    onCosmic ? "line-clamp-2 text-sm text-white sm:text-base" : "line-clamp-2 text-sm text-foreground sm:text-base",
  );
}

export function dashboardHomeGreetingTitleClass(theme: Appearance): string {
  return cn(
    "font-welcome-serif text-3xl font-normal leading-[1.08] tracking-tight sm:text-5xl",
    dashboardHomeUsesCosmicShell(theme) ? "text-white" : "text-foreground",
  );
}

export function dashboardHomeGreetingSubtitleClass(theme: Appearance): string {
  return cn(
    "text-xs sm:text-base",
    dashboardHomeUsesCosmicShell(theme) ? "text-white/55" : "text-muted-foreground",
  );
}

export function dashboardHomeSectionLabelClass(theme: Appearance): string {
  return cn(
    "text-xs font-semibold uppercase tracking-wide sm:text-sm",
    dashboardHomeUsesCosmicShell(theme) ? "text-white/45" : "text-muted-foreground",
  );
}

export function dashboardHomeManifestationTitleClass(theme: Appearance): string {
  return cn(
    "text-sm font-medium leading-tight",
    dashboardHomeUsesCosmicShell(theme) ? "text-white/90" : "text-foreground",
  );
}

export function dashboardHomeManifestationMutedClass(theme: Appearance): string {
  return cn("text-xs", dashboardHomeUsesCosmicShell(theme) ? "text-white/55" : "text-muted-foreground");
}

export function dashboardHomeInspiredDividerClass(theme: Appearance): string {
  return cn(
    "mt-6 border-t pt-4 sm:pt-5",
    dashboardHomeUsesCosmicShell(theme) ? "border-white/12" : "border-zinc-200/80 dark:border-zinc-700/60",
  );
}

export function dashboardHomeInspiredLabelClass(theme: Appearance): string {
  return cn(
    "text-xs font-medium sm:text-sm",
    dashboardHomeUsesCosmicShell(theme) ? "text-white/90" : "text-foreground",
  );
}

export function dashboardHomeInspiredFooterClass(theme: Appearance): string {
  return cn(
    "mt-3 text-[11px] leading-relaxed sm:mt-4 sm:text-xs",
    dashboardHomeUsesCosmicShell(theme) ? "text-white/50" : "text-muted-foreground",
  );
}

export function dashboardHomeToolTitleClass(theme: Appearance): string {
  return cn(
    "block text-sm font-semibold sm:text-base",
    dashboardHomeUsesCosmicShell(theme) ? "text-white" : "text-foreground",
  );
}

export function dashboardHomeToolDescriptionClass(theme: Appearance): string {
  return cn(
    "mt-0.5 block truncate text-xs leading-snug sm:text-sm",
    dashboardHomeUsesCosmicShell(theme) ? "text-white/55" : "text-muted-foreground",
  );
}

export function dashboardHomeToolChevronClass(theme: Appearance): string {
  return cn(
    "h-4 w-4 shrink-0 transition-transform group-hover:translate-x-0.5 sm:h-5 sm:w-5",
    dashboardHomeUsesCosmicShell(theme)
      ? "text-white/45 group-hover:text-white/70"
      : "text-muted-foreground group-hover:text-foreground",
  );
}
