import { Capacitor } from "@capacitor/core";

/**
 * True when we should show the iOS paywall route (native app or iOS standalone/PWA).
 * Use for routing and redirects so we show paywall screen even if Capacitor reports "web" at load time.
 */
export function isIosPaywallContext(): boolean {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
    return true;
  }
  if (typeof navigator === "undefined") return false;
  const isIosUa = /iPhone|iPad|iPod/.test(navigator.userAgent);
  const isStandalone =
    window.matchMedia("(display-mode: standalone)").matches ||
    !!(navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(isIosUa && isStandalone);
}
