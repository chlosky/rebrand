import { Capacitor } from "@capacitor/core";
import { AppsFlyer } from "appsflyer-capacitor-plugin";

let initStarted = false;

function readDevKey(): string | null {
  const raw = import.meta.env.VITE_APPSFLYER_DEV_KEY as string | undefined;
  const devKey = raw?.trim();
  if (!devKey || devKey.startsWith("REPLACE_")) return null;
  return devKey;
}

export function isAppsFlyerConfigured(): boolean {
  return readDevKey() != null;
}

/** Initialize AppsFlyer on native iOS/Android. No-op on web or when dev key is unset. */
export async function initAppsFlyer(): Promise<void> {
  if (!Capacitor.isNativePlatform() || initStarted) return;

  const devKey = readDevKey();
  if (!devKey) return;

  initStarted = true;

  const iosAppId = (import.meta.env.VITE_APPSFLYER_IOS_APP_ID as string | undefined)?.trim();
  if (Capacitor.getPlatform() === "ios" && !iosAppId) {
    initStarted = false;
    return;
  }

  try {
    await AppsFlyer.initSDK({
      devKey,
      appID: iosAppId ?? "",
      isDebug: import.meta.env.DEV,
      waitForATTUserAuthorization: 60,
      registerConversionListener: true,
      registerOnDeepLink: true,
      registerOnAppOpenAttribution: false,
    });
  } catch {
    initStarted = false;
  }
}

export async function setAppsFlyerCustomerUserId(userId: string | null | undefined): Promise<void> {
  if (!Capacitor.isNativePlatform() || !isAppsFlyerConfigured()) return;
  const cuid = userId?.trim();
  if (!cuid) return;
  try {
    await AppsFlyer.setCustomerUserId({ cuid });
  } catch {
    /* non-blocking */
  }
}
