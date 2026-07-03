import { Capacitor } from "@capacitor/core";

/**
 * True when we should show the Android paywall route (native Android app only).
 * Completely separate from the iOS paywall context — no shared logic.
 */
export function isAndroidPaywallContext(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}
