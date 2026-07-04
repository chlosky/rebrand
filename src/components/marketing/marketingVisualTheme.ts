/**
 * Marketing visual tokens — bright palette plot styling (vel / paletteplot.com).
 * White surfaces, neutral type, board-color pink accents.
 */

import { SITE_CONTAINER } from "@/lib/siteBrand";

export { SITE_CONTAINER as MARKETING_SITE_CONTAINER };

/** Board palette accents from vel */
export const MARKETING_ACCENT = "#FF4DA6";
export const MARKETING_ACCENT_SOFT = "#F8BBD0";
export const MARKETING_PINK = "#E8B4B8";
export const MARKETING_SURFACE = "#ffffff";
export const MARKETING_INK = "#171717";
export const MARKETING_MUTED = "#525252";

/** Primary CTA — vel-style dark pill on white */
export const MARKETING_PRIMARY_CTA_CLASS =
  "inline-flex min-h-[44px] items-center justify-center rounded-xl bg-neutral-900 px-5 text-sm font-semibold text-white hover:bg-neutral-800";

export const MARKETING_STICKY_CTA_CLASS =
  "h-12 min-h-[3rem] w-full rounded-xl bg-neutral-900 font-sans text-[15px] font-semibold tracking-[-0.01em] text-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] hover:bg-neutral-800 active:bg-neutral-950";

export const MARKETING_DISPLAY_CLASS =
  "font-sans font-semibold leading-[1.08] tracking-[-0.02em] text-neutral-900";

export const MARKETING_HERO_HEADLINE_CLASS =
  "font-sans font-semibold leading-[1.08] tracking-[-0.02em] text-neutral-900";

export const MARKETING_LOGO_CLASS =
  "font-sans text-lg font-semibold tracking-tight text-neutral-900";

export const MARKETING_CARD_TITLE_CLASS =
  "font-sans text-base font-medium leading-tight tracking-[-0.02em] text-neutral-900";

export const MARKETING_SUBCOPY_CLASS =
  "font-sans text-[15px] font-normal leading-relaxed text-neutral-600 sm:text-base sm:leading-relaxed";

export const MARKETING_BODY_CLASS =
  "font-sans text-sm font-normal leading-relaxed text-neutral-600 sm:text-base";

export const MARKETING_SOFT_SURFACE_CLASS =
  "rounded-2xl border border-neutral-200 bg-white px-5 py-5 shadow-sm sm:px-6 sm:py-6";

export const MARKETING_PHONE_GLOW =
  "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(255, 77, 166, 0.18) 0%, transparent 68%)";

export const MARKETING_ACCENT_PILL_CLASS =
  "inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-4 py-2 font-sans text-sm font-medium text-neutral-800 shadow-sm";

/** Marketing page shell — bright white like vel SiteLayout */
export const MARKETING_PAGE_SHELL_CLASS =
  "min-h-screen bg-white font-sans text-neutral-900 antialiased";

export const MARKETING_HEADER_BORDER_CLASS = "border-b border-neutral-200 bg-white";
