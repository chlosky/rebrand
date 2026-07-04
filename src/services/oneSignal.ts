import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import OneSignal from "@onesignal/capacitor-plugin";
import { toast } from "sonner";
import {
  detectInitialAppLocale,
  oneSignalLanguageForApp,
  type AppLocale,
} from "@/lib/locale";

let oneSignalBootstrapped = false;
let oneSignalBootstrapPromise: Promise<boolean> | null = null;
let listenersAttached = false;

const ONESIGNAL_APP_ID =
  import.meta.env.VITE_ONESIGNAL_APP_ID ||
  import.meta.env.VITE_PUBLIC_ONESIGNAL_APP_ID ||
  "";

function getOneSignalAppId(): string | null {
  const trimmed = String(ONESIGNAL_APP_ID || "").trim();
  return trimmed ? trimmed : null;
}

/** TikTok / paid social: paletteplotting://welcome?utm_source=tiktok&ttclid=… → onboarding welcome. */
const CAMPAIGN_WELCOME_HOSTS = new Set(["welcome", "open", "campaign"]);

function campaignWelcomePathFromPalettePlottingUrl(u: URL): string | null {
  const host = u.hostname.toLowerCase();
  const pathParts = u.pathname.replace(/^\//, "").split("/").filter(Boolean);
  const firstPath = pathParts[0]?.toLowerCase() ?? "";

  if (CAMPAIGN_WELCOME_HOSTS.has(host)) {
    return `/onboarding/welcome${u.search}${u.hash}`;
  }
  if (host === "onboarding" && (firstPath === "welcome" || pathParts.length === 0)) {
    return `/onboarding/welcome${u.search}${u.hash}`;
  }
  return null;
}

/** Maps push / app URL schemes to in-app routes (e.g. paletteplotting://help-request/{id}). */
export function resolvePushDeepLinkTarget(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("/")) return trimmed;

  try {
    const u = new URL(trimmed);
    if (u.protocol === "paletteplotting:") {
      const welcomeTarget = campaignWelcomePathFromPalettePlottingUrl(u);
      if (welcomeTarget) return welcomeTarget;

      const caseId = u.pathname.replace(/^\//, "").split("/").filter(Boolean)[0];
      if (u.hostname === "help-request" && caseId) {
        return `/dashboard/report-issue?tab=inbox&case=${encodeURIComponent(caseId)}`;
      }
    }
    if (u.protocol === "capacitor:" || u.protocol === "http:" || u.protocol === "https:") {
      const path = `${u.pathname}${u.search}${u.hash}`;
      if (path.startsWith("/onboarding/welcome")) return path;
      if (path.startsWith("/")) return path;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function followPushDeepLink(url: string): void {
  const target = resolvePushDeepLinkTarget(url) ?? url;
  window.location.href = target;
}

export async function bootstrapOneSignal(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    console.info("[OneSignal] bootstrap skipped: not native", {
      platform: Capacitor.getPlatform(),
    });
    return false;
  }

  if (oneSignalBootstrapped) {
    console.info("[OneSignal] bootstrap skipped: already bootstrapped", {
      platform: Capacitor.getPlatform(),
    });
    return true;
  }

  if (oneSignalBootstrapPromise) {
    return oneSignalBootstrapPromise;
  }

  oneSignalBootstrapPromise = (async () => {
    try {
      const appId = String(ONESIGNAL_APP_ID || "").trim();

      console.info("[OneSignal] bootstrap start", {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        hasAppId: Boolean(appId),
        appIdLength: appId.length,
        buildSha: import.meta.env.VITE_BUILD_SHA ?? "unknown",
      });

      console.info("[OneSignal] env check", {
        hasAppId: Boolean(import.meta.env.VITE_ONESIGNAL_APP_ID),
        appIdLength: String(import.meta.env.VITE_ONESIGNAL_APP_ID || "").length,
        hasPublicAppId: Boolean(import.meta.env.VITE_PUBLIC_ONESIGNAL_APP_ID),
        publicAppIdLength: String(import.meta.env.VITE_PUBLIC_ONESIGNAL_APP_ID || "").length,
        buildSha: import.meta.env.VITE_BUILD_SHA ?? "unknown",
      });

      if (!appId) {
        throw new Error(
          "Missing OneSignal app id. Expected VITE_ONESIGNAL_APP_ID in native build environment.",
        );
      }

      if (!OneSignal) {
        throw new Error("OneSignal plugin import is missing or undefined.");
      }

      await OneSignal.initialize(appId);

      oneSignalBootstrapped = true;

      console.info("[OneSignal] bootstrap success", {
        platform: Capacitor.getPlatform(),
      });

      return true;
    } catch (error) {
      oneSignalBootstrapped = false;
      oneSignalBootstrapPromise = null;

      console.error("[OneSignal] bootstrap failed", {
        platform: Capacitor.getPlatform(),
        isNative: Capacitor.isNativePlatform(),
        hasAppId: Boolean(String(ONESIGNAL_APP_ID || "").trim()),
        appIdLength: String(ONESIGNAL_APP_ID || "").trim().length,
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : null,
        error,
      });

      throw error;
    }
  })();

  return oneSignalBootstrapPromise;
}

export function attachOneSignalListenersOnce(): void {
  if (listenersAttached) return;
  listenersAttached = true;

  OneSignal.Notifications.addEventListener("foregroundWillDisplay", (event) => {
    try {
      const n = event.getNotification();
      const title = n.title ?? "Notification";
      const body = n.body ?? "";
      if (body) toast.info(body, { title });
    } catch {
      // ignore
    }
  });

  OneSignal.Notifications.addEventListener("click", (event) => {
    const url = event?.result?.url || (event?.notification?.additionalData as any)?.url;
    if (typeof url === "string" && url) {
      followPushDeepLink(url);
    }
  });

  OneSignal.InAppMessages.addEventListener("click", (event: any) => {
    const url =
      event?.result?.url ||
      event?.clickResult?.url ||
      event?.actionId ||
      event?.message?.actions?.[0]?.url;
    if (typeof url === "string" && url) {
      followPushDeepLink(url);
    }
  });
}

/** Opt into OneSignal push after OS permission is granted (required for subscription to be active). */
export async function optInOneSignalPush(): Promise<boolean> {
  try {
    await OneSignal.User.pushSubscription.optIn();
    console.info("[OneSignal] pushSubscription.optIn succeeded");
    return true;
  } catch (error) {
    console.warn("[OneSignal] pushSubscription.optIn failed:", error);
    return false;
  }
}

export async function requestOneSignalPushPermission(fallbackToSettings = true): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return false;

  attachOneSignalListenersOnce();
  await bootstrapOneSignal();

  const appId = getOneSignalAppId();
  if (!appId || !oneSignalBootstrapped) {
    console.warn("[OneSignal] SDK unavailable; falling back to OS notification permission.");
    const check = await PushNotifications.checkPermissions();
    if (check.receive === "granted") return true;
    const result = await PushNotifications.requestPermissions();
    return result.receive === "granted";
  }

  try {
    if (await OneSignal.Notifications.hasPermission()) {
      await optInOneSignalPush();
      return true;
    }

    const canRequest = await OneSignal.Notifications.canRequestPermission();
    const granted = await OneSignal.Notifications.requestPermission(
      !canRequest && fallbackToSettings,
    );
    if (granted) {
      await optInOneSignalPush();
      return true;
    }

    const check = await PushNotifications.checkPermissions();
    if (check.receive === "granted") {
      await optInOneSignalPush();
      return true;
    }

    return false;
  } catch (error) {
    console.warn("[OneSignal] requestPermission failed; trying OS fallback:", error);
    const check = await PushNotifications.checkPermissions();
    if (check.receive === "granted") {
      await optInOneSignalPush();
      return true;
    }
    const result = await PushNotifications.requestPermissions();
    if (result.receive === "granted") {
      await optInOneSignalPush();
      return true;
    }
    return false;
  }
}

export async function oneSignalLogin(externalId: string): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();
  await OneSignal.login(externalId);
}

export async function oneSignalLogout(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();
  await OneSignal.logout();
}

/** IANA timezone from the device (e.g. America/Chicago). Used for routine push scheduling. */
export function readDeviceTimeZone(): string {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (typeof tz === "string" && tz.trim()) return tz.trim();
  } catch {
    /* ignore */
  }
  return "UTC";
}

/** Match onboarding language so OneSignal picks es/pt push copy (not device system language). */
export async function syncOneSignalUserLanguage(locale?: AppLocale): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();
  const appLocale = locale ?? detectInitialAppLocale();
  try {
    await OneSignal.User.setLanguage(oneSignalLanguageForApp(appLocale));
  } catch (error) {
    console.warn("[OneSignal] setLanguage failed:", error);
  }
}

/** Push + in-app journeys read these tags in the OneSignal dashboard. */
export async function syncRoutineOneSignalTags(opts: {
  intensity: "light" | "consistent" | "locked_in";
  notificationsEnabled: boolean;
  permissionStatus: "granted" | "denied" | "skipped" | null;
  alertTimes: string[];
  timezone?: string | null;
  preferredLocale?: AppLocale | null;
}): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  await bootstrapOneSignal();

  const appLocale = opts.preferredLocale ?? detectInitialAppLocale();
  await syncOneSignalUserLanguage(appLocale);

  const timezone = (opts.timezone?.trim() || readDeviceTimeZone()).trim() || "UTC";

  const tags: Record<string, string> = {
    routine_intensity: opts.intensity,
    notifications_enabled: opts.notificationsEnabled ? "true" : "false",
    notification_permission_status: opts.permissionStatus ?? "skipped",
    preferred_locale: appLocale,
    timezone,
    routine_alert_count: opts.notificationsEnabled ? String(opts.alertTimes.length) : "0",
    routine_notification_times: opts.notificationsEnabled ? opts.alertTimes.join(",") : "",
    routine_alert_1: opts.notificationsEnabled && opts.alertTimes[0] ? opts.alertTimes[0] : "",
    routine_alert_2: opts.notificationsEnabled && opts.alertTimes[1] ? opts.alertTimes[1] : "",
    routine_alert_3: opts.notificationsEnabled && opts.alertTimes[2] ? opts.alertTimes[2] : "",
  };

  await OneSignal.User.addTags(tags);
}

