import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { cn } from "@/lib/utils";

/** Fixed mobile footer — fades so studio swatches show through. */
export const MOBILE_SETUP_FOOTER_STYLE = {
  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
  background:
    "linear-gradient(to top, #ffffff 0%, #ffffff 42%, rgba(255,255,255,0.92) 58%, rgba(255,255,255,0.55) 78%, transparent 100%)",
} as const;

/** Primary CTA — dark pill on light shell. */
export const SETUP_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-zinc-900 font-sans text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_1px_2px_rgba(0,0,0,0.08),0_8px_24px_rgba(0,0,0,0.12)] hover:bg-zinc-800 active:bg-zinc-950 focus:bg-zinc-900";

export const SETUP_BACK_CTA_CLASS =
  "flex-1 h-14 rounded-xl border border-zinc-200 !bg-white font-sans text-base font-medium !text-zinc-700 hover:!bg-zinc-50 active:!bg-zinc-50 focus:!bg-white focus-visible:ring-0 focus-visible:ring-offset-0";

/** Native/mobile setup footer — same height + shape as SetupPage (h-14, not h-12). */
export const SETUP_NATIVE_CONTINUE_BTN_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "flex-1 h-14 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
);

export const SETUP_NATIVE_BACK_BTN_CLASS = cn(
  SETUP_BACK_CTA_CLASS,
  "outline-none transition-none select-none disabled:opacity-50 disabled:cursor-not-allowed",
);

export const SETUP_HEADING_TITLE_CLASS =
  "font-welcome-serif text-[28px] font-normal leading-[1.12] tracking-[-0.02em] text-zinc-900 sm:text-[32px] sm:leading-[1.08]";

export const SETUP_HEADING_SUBTITLE_CLASS = "text-sm text-zinc-500 pl-0";

export const SETUP_LABEL_CLASS = "font-sans text-sm font-medium text-zinc-600";

export const SETUP_MUTED_TEXT_CLASS = "font-sans text-sm text-zinc-500";

export const SETUP_FIELD_CLASS =
  "h-12 rounded-2xl border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 scroll-mt-3 focus-visible:ring-zinc-300";

export const SETUP_TEXTAREA_CLASS =
  "min-h-[140px] rounded-2xl border-zinc-200 bg-white text-zinc-900 placeholder:text-zinc-400 scroll-mt-3 focus-visible:ring-zinc-300 focus-visible:ring-offset-0";

export const SETUP_CHOICE_ICON_WRAP_CLASS =
  "inline-flex shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700";

export const SETUP_CHOICE_TITLE_CLASS = "font-sans font-semibold text-zinc-900";

export const SETUP_CHOICE_DESC_CLASS = "font-sans text-xs leading-relaxed text-zinc-500 sm:text-sm";

export const SETUP_CHOICE_LABEL_CLASS = "font-sans text-base font-medium text-zinc-900";

export const SETUP_CHOICE_CHECK_ACTIVE_CLASS = "h-5 w-5 shrink-0 text-zinc-900";

export const SETUP_CHOICE_CHECK_INACTIVE_CLASS = "h-5 w-5 shrink-0 text-zinc-300";

/** Card fill on light shell choice tiles. */
export const SETUP_CHOICE_TILE_GLASS_FILL = "bg-white";

function setupChoiceTileSurface(active: boolean): string {
  return cn(SETUP_CHOICE_TILE_GLASS_FILL, active ? "border-zinc-400" : "border-zinc-200");
}

export function setupChoiceTileClass(active: boolean): string {
  return cn(
    "transition-[box-shadow,border-color] shadow-sm",
    setupChoiceTileSurface(active),
    active && "ring-1 ring-zinc-300 border-zinc-400",
  );
}

export const SETUP_CHOICE_TILE_SELECTED_GLOW = "0 4px 20px rgba(24,24,27,0.08)";

export function setupChoiceTileWithGlowClass(active: boolean): string {
  return cn(
    "w-full rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color] shadow-sm",
    setupChoiceTileSurface(active),
  );
}

export function setupTextChoiceTileClass(active: boolean): string {
  return cn(
    "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color] shadow-sm",
    setupChoiceTileSurface(active),
  );
}

export function setupIconChoiceTileClass(active: boolean): string {
  return cn(
    "w-full rounded-2xl border px-4 py-4 text-left flex items-center justify-between gap-3 transition-[box-shadow,border-color] shadow-sm",
    setupChoiceTileSurface(active),
  );
}

export const SETUP_GLASS_PANEL_CLASS = "rounded-2xl border border-zinc-200 bg-white shadow-sm";

export const SETUP_PROGRESS_TRACK_CLASS = "h-2.5 rounded-full bg-zinc-200 overflow-hidden";

export const SETUP_PROGRESS_FILL_CLASS =
  "h-full rounded-full bg-zinc-900 transition-all duration-300 ease-out";

export const SETUP_TESTIMONIAL_STAR_CLASS = "h-3 w-3 shrink-0 fill-amber-400 text-amber-500";

export const SETUP_DESKTOP_CHEVRON_CLASS =
  "fixed z-50 p-3 rounded-full bg-white border border-zinc-200 shadow-sm hover:bg-zinc-50 transition-all duration-200";
