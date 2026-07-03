import { Capacitor } from "@capacitor/core";

export const ANDROID_NATIVE_STATUS_BAR_MIN_PX = 28;
export const APP_SAFE_AREA_TOP_VAR = "var(--app-safe-area-top)";

export function applyNativeSafeAreaRootVars(): void {
  const root = document.documentElement;
  root.style.setProperty("--app-safe-area-top", "env(safe-area-inset-top, 0px)");

  if (!Capacitor.isNativePlatform()) return;

  root.classList.add("capacitor-native");
  if (Capacitor.getPlatform() === "android") {
    root.classList.add("capacitor-android");
    root.style.setProperty(
      "--app-safe-area-top",
      `max(env(safe-area-inset-top, 0px), ${ANDROID_NATIVE_STATUS_BAR_MIN_PX}px)`,
    );
  }
}
