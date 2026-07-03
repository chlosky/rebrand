import { Capacitor } from "@capacitor/core";

const PENDING_KEY = "sv_web_get_app_prompt_pending_v1";
const SHOWN_KEY = "sv_web_get_app_prompt_shown_v1";
/** Dev preview without keeping `?preview=` in the URL — set via console, clear when done. */
export const PREVIEW_STORAGE_KEY = "sv_web_get_app_preview_v1";

/** Routes where the get-app popup must never appear (paywall, onboarding, payment wait). */
export function isBlockedPathForWebGetAppPrompt(pathname: string): boolean {
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname === "/payment-processing") return true;
  if (pathname === "/activate") return true;
  return false;
}

export function hasWebGetAppPromptBeenShown(): boolean {
  try {
    return localStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function isWebGetAppPromptPending(): boolean {
  try {
    return localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Call when a browser user completes their first RevenueCat web checkout. */
export function armWebGetAppPromptPending(): void {
  if (Capacitor.isNativePlatform()) return;
  if (hasWebGetAppPromptBeenShown()) return;
  try {
    localStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearWebGetAppPromptPending(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function markWebGetAppPromptShown(): void {
  try {
    localStorage.setItem(SHOWN_KEY, "1");
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldOfferWebGetAppPrompt(pathname: string, search?: string): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (!isBlockedPathForWebGetAppPrompt(pathname) && isWebGetAppDialogPreviewMode(search)) {
    return true;
  }
  if (!isWebGetAppPromptPending()) return false;
  if (hasWebGetAppPromptBeenShown()) return false;
  return !isBlockedPathForWebGetAppPrompt(pathname);
}

/** Dev preview: `?preview=get-app-dialog` in the URL, or `localStorage` key below. */
export function isWebGetAppDialogPreviewMode(search?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(PREVIEW_STORAGE_KEY) === "1") return true;
    const q = search ?? window.location.search;
    return new URLSearchParams(q).get("preview") === "get-app-dialog";
  } catch {
    return false;
  }
}

export function armWebGetAppDialogPreview(): void {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, "1");
    localStorage.removeItem(SHOWN_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function clearWebGetAppDialogPreview(): void {
  try {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

declare global {
  interface Window {
    /** Dev only: `previewGetAppDialog()` then open `/` or `/dashboard` (homepage easiest). */
    previewGetAppDialog?: () => void;
    clearGetAppDialogPreview?: () => void;
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.previewGetAppDialog = () => {
    armWebGetAppDialogPreview();
    const path = window.location.pathname.startsWith("/onboarding")
      ? "/"
      : window.location.pathname;
    window.location.assign(`${path}?preview=get-app-dialog`);
  };
  window.clearGetAppDialogPreview = () => {
    clearWebGetAppDialogPreview();
    clearWebGetAppPromptPending();
    try {
      localStorage.removeItem(SHOWN_KEY);
    } catch {
      /* ignore */
    }
  };
}
