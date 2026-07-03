import { Capacitor } from "@capacitor/core";

/**
 * Use direct StoreKit (NativePurchases) for iOS major versions below this threshold; use
 * RevenueCat Paywall UI (SwiftUI) for this major and newer (e.g. iOS 18+).
 * Manage billing uses `shouldUseRevenueCatCustomerCenterUi()` (not the paywall helper): when the OS
 * major is unknown, Customer Center must stay off so iOS 17 does not take the SwiftUI crash path.
 */
export const IOS_REVENUECAT_UI_MIN_MAJOR = 18;

let deviceMajorPromise: Promise<number | null> | null = null;

function parseUaIosMajor(): number | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent || "";
  const m = ua.match(/(?:CPU iPhone OS |CPU OS |iPhone OS |OS )(\d+)[._]/i) || ua.match(/OS (\d+)[._]/);
  return m ? Number(m[1]) : null;
}

/** Capacitor Device: iOSVersion is e.g. 17.5.1 → 170501; major = floor(iOSVersion / 10000). */
function majorFromDevicePluginFields(info: {
  iOSVersion?: number;
  osVersion?: string;
}): number | null {
  if (typeof info.iOSVersion === "number" && info.iOSVersion > 0) {
    const major = Math.floor(info.iOSVersion / 10000);
    if (major >= 1 && major < 100) return major;
  }
  const ov = info.osVersion;
  if (ov && typeof ov === "string") {
    const m = ov.match(/(\d+)[._]\d+/);
    if (m) {
      const n = parseInt(m[1] ?? "", 10);
      if (!Number.isNaN(n) && n > 0 && n < 100) return n;
    }
    const head = ov.split(/[._]/)[0];
    const n = parseInt(head ?? "", 10);
    if (!Number.isNaN(n) && n > 0) return n;
  }
  return null;
}

export async function getIosMajorVersionForNative(): Promise<number | null> {
  if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) return null;
  if (!deviceMajorPromise) {
    deviceMajorPromise = (async () => {
      try {
        const { Device } = await import("@capacitor/device");
        const info = await Device.getInfo();
        if (info.platform !== "ios") return null;
        return majorFromDevicePluginFields(info);
      } catch {
        return null;
      }
    })();
  }
  const v = await deviceMajorPromise;
  /** Sticky null (e.g. bridge not ready on first call) would wrongly send Manage billing to Customer Center. */
  if (v === null) deviceMajorPromise = null;
  return v;
}

/**
 * When true, call RevenueCatUI.presentPaywall for purchase presentation.
 * When false, use legacy NativePurchases / StoreKit + RC sync.
 *
 * Conservative on native iOS: unknown major or below IOS_REVENUECAT_UI_MIN_MAJOR → false
 * (StoreKit legacy path exists for those cases). Do not reuse for Customer Center — use
 * shouldUseRevenueCatCustomerCenterUi() instead.
 */
export async function shouldUseRevenueCatPaywallUi(): Promise<boolean> {
  if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) return true;
  const deviceMajor = await getIosMajorVersionForNative();
  const uaMajor = parseUaIosMajor();
  const major = deviceMajor ?? uaMajor;
  if (major === null) return false;
  return major >= IOS_REVENUECAT_UI_MIN_MAJOR;
}

/**
 * Fresh Device read for subscription-management gating (avoids a cached null from an early boot call).
 */
async function readIosMajorFromDeviceUncached(): Promise<number | null> {
  if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) return null;
  try {
    const { Device } = await import("@capacitor/device");
    const info = await Device.getInfo();
    if (info.platform !== "ios") return null;
    return majorFromDevicePluginFields(info);
  } catch {
    return null;
  }
}

/**
 * RevenueCat Customer Center (SwiftUI) — unsafe on older iOS. Only enable when we are sure the OS
 * major is >= IOS_REVENUECAT_UI_MIN_MAJOR. If major cannot be determined, use Apple’s URL fallback
 * (never Customer Center).
 */
export async function shouldUseRevenueCatCustomerCenterUi(): Promise<boolean> {
  if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) return false;
  const fromDevice = await readIosMajorFromDeviceUncached();
  const uaMajor = parseUaIosMajor();
  const major = fromDevice ?? uaMajor;
  if (major === null) return false;
  return major >= IOS_REVENUECAT_UI_MIN_MAJOR;
}
