import { Capacitor } from "@capacitor/core";
import {
  FacebookAnalytics,
  FacebookEventName,
  FacebookEventParameterName,
} from "@capgo/capacitor-facebook-analytics";

type Fbq = {
  (...args: unknown[]): void;
  callMethod?: (...args: unknown[]) => void;
  queue?: unknown[][];
  loaded?: boolean;
  version?: string;
  push?: (...args: unknown[]) => void;
};

let pixelScriptLoading = false;
let pixelInitialized = false;
let nativeInitStarted = false;

function readEnv(key: string): string | null {
  const raw = import.meta.env[key] as string | undefined;
  const value = raw?.trim();
  if (!value || value.startsWith("REPLACE_")) return null;
  return value;
}

export function isMetaPixelConfigured(): boolean {
  return readEnv("VITE_META_PIXEL_ID") != null;
}

export function isMetaNativeConfigured(): boolean {
  return readEnv("VITE_META_FACEBOOK_APP_ID") != null;
}

/** Load Meta Pixel (web) when `VITE_META_PIXEL_ID` is set. */
export function ensureMetaPixelLoaded(): void {
  if (typeof window === "undefined" || pixelInitialized || pixelScriptLoading || !isMetaPixelConfigured()) {
    return;
  }

  const pixelId = readEnv("VITE_META_PIXEL_ID");
  if (!pixelId) return;

  pixelScriptLoading = true;

  const w = window as Window & { fbq?: Fbq; _fbq?: Fbq };
  if (!w.fbq) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) {
        fbq.callMethod(...args);
      } else {
        fbq.queue?.push(args);
      }
    };
    if (!w._fbq) w._fbq = fbq;
    fbq.push = fbq;
    fbq.loaded = true;
    fbq.version = "2.0";
    fbq.queue = [];
    w.fbq = fbq;
  }

  const script = document.createElement("script");
  script.async = true;
  script.src = "https://connect.facebook.net/en_US/fbevents.js";
  script.onload = () => {
    pixelInitialized = true;
    pixelScriptLoading = false;
    w.fbq?.("init", pixelId);
    w.fbq?.("track", "PageView");
  };
  script.onerror = () => {
    pixelScriptLoading = false;
  };
  const first = document.getElementsByTagName("script")[0];
  first?.parentNode?.insertBefore(script, first);
}

/** Initialize Meta App Events on native when app id is configured at build time. */
export async function initMetaAppEvents(): Promise<void> {
  if (!Capacitor.isNativePlatform() || nativeInitStarted || !isMetaNativeConfigured()) return;
  nativeInitStarted = true;
  try {
    await FacebookAnalytics.enableAdvertiserTracking();
    await FacebookAnalytics.initAppEvents();
  } catch {
    nativeInitStarted = false;
  }
}

export { FacebookAnalytics, FacebookEventName, FacebookEventParameterName };
