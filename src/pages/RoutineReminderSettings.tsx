import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { ChevronLeft, CheckCircle2, Circle, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import i18n from "@/i18n";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";
import {
  attachOneSignalListenersOnce,
  bootstrapOneSignal,
  oneSignalLogin,
  optInOneSignalPush,
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";
import { requestNativePushPermission } from "@/services/pushNotifications";

type IntensityId = "light" | "consistent" | "locked_in";

const INTENSITY_IDS: IntensityId[] = ["light", "consistent", "locked_in"];

type RoutineItem = {
  slug: string;
  label: string;
  cadence: string;
  target_per_week: number;
};

const ROUTINE_ALERT_DEFAULTS: Record<IntensityId, string[]> = {
  light: ["21:30"],
  consistent: ["07:00", "21:30"],
  locked_in: ["07:00", "18:30", "21:30"],
};

type RoutineDbRow = {
  routine_intensity?: string | null;
  routine_items?: unknown;
  app_notifications_enabled?: boolean | null;
  notification_permission_status?: string | null;
  routine_notification_times?: unknown;
  timezone?: string | null;
};

function isIntensityId(value: unknown): value is IntensityId {
  return value === "light" || value === "consistent" || value === "locked_in";
}

function parseRoutineItems(raw: unknown): RoutineItem[] {
  return Array.isArray(raw) ? (raw as RoutineItem[]) : [];
}

function parseAlertTimes(raw: unknown, intensity: IntensityId): string[] {
  const defaults = ROUTINE_ALERT_DEFAULTS[intensity];
  if (!Array.isArray(raw)) return [...defaults];
  const parsed = raw.filter(
    (t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t),
  );
  return parsed.length === defaults.length ? parsed : [...defaults];
}

/** prefs ?? profile ?? default — per field, never let prefs null wipe profile. */
function mergeRoutineDbRow(
  prefs: RoutineDbRow | null | undefined,
  profile: RoutineDbRow | null | undefined,
): {
  intensity: IntensityId;
  routineItems: RoutineItem[];
  appNotificationsEnabled: boolean;
  permissionStatus: "granted" | "denied" | "skipped" | null;
  alertTimes: string[];
  timeZone: string;
} {
  const intensityRaw = prefs?.routine_intensity ?? profile?.routine_intensity;
  const intensity = isIntensityId(intensityRaw) ? intensityRaw : "consistent";

  const prefsItems = parseRoutineItems(prefs?.routine_items);
  const profileItems = parseRoutineItems(profile?.routine_items);
  const routineItems = prefsItems.length > 0 ? prefsItems : profileItems;

  const appNotificationsEnabled =
    prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;

  const permissionRaw =
    prefs?.notification_permission_status ?? profile?.notification_permission_status;
  const permissionStatus =
    permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
      ? permissionRaw
      : null;

  const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
  const alertTimes = parseAlertTimes(timesRaw, intensity);

  const timeZoneRaw = prefs?.timezone ?? profile?.timezone;
  const timeZone =
    typeof timeZoneRaw === "string" && timeZoneRaw.trim() ? timeZoneRaw.trim() : readDeviceTimeZone();

  return {
    intensity,
    routineItems,
    appNotificationsEnabled: !!appNotificationsEnabled,
    permissionStatus,
    alertTimes,
    timeZone,
  };
}

/** Pre-feature user: no routine fields stored in either table yet. */
function isPreFeatureRoutineUser(
  prefs: RoutineDbRow | null | undefined,
  profile: RoutineDbRow | null | undefined,
): boolean {
  const hasIntensity =
    isIntensityId(prefs?.routine_intensity) || isIntensityId(profile?.routine_intensity);
  if (hasIntensity) return false;

  const hasItems =
    parseRoutineItems(prefs?.routine_items).length > 0 ||
    parseRoutineItems(profile?.routine_items).length > 0;
  if (hasItems) return false;

  const perm = prefs?.notification_permission_status ?? profile?.notification_permission_status;
  const notifOn =
    prefs?.app_notifications_enabled === true || profile?.app_notifications_enabled === true;
  if (notifOn && perm === "granted") return false;
  if (perm === "denied") return false;

  const hasTimes =
    (Array.isArray(prefs?.routine_notification_times) &&
      (prefs!.routine_notification_times as unknown[]).length > 0) ||
    (Array.isArray(profile?.routine_notification_times) &&
      (profile!.routine_notification_times as unknown[]).length > 0);
  if (hasTimes) return false;

  return true;
}

function defaultRoutineItems(intensity: IntensityId, labelForSlug: (slug: string) => string): RoutineItem[] {
  return [
    {
      slug: "boards_review",
      label: labelForSlug("boards_review"),
      cadence: "daily",
      target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
    },
  ];
}

function routineItemsForIntensity(
  intensity: IntensityId,
  existing: RoutineItem[],
  labelForSlug: (slug: string) => string,
): RoutineItem[] {
  if (existing.length === 0) return defaultRoutineItems(intensity, labelForSlug);

  return existing.map((item) => {
    if (item.slug === "boards_review" || item.slug === "boards") {
      return {
        ...item,
        slug: "boards_review",
        label: labelForSlug("boards_review"),
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
      };
    }
    if (item.slug === "journal_entry" || item.slug === "journal") {
      return {
        ...item,
        slug: "journal_entry",
        label: labelForSlug("journal_entry"),
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
      };
    }
    if (item.slug === "progress_review") {
      return {
        ...item,
        cadence: "weekly",
        target_per_week: intensity === "locked_in" ? 2 : 1,
      };
    }
    if (item.slug === "plan_steps") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 5 : intensity === "consistent" ? 3 : 2,
      };
    }
    return item;
  });
}

export default function RoutineReminderSettings() {
  const { t } = useTranslation("settings");
  const routineItemLabel = (slug: string) => t(`routine.itemLabels.${slug}`);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [intensity, setIntensity] = useState<IntensityId>("consistent");
  const [savedIntensity, setSavedIntensity] = useState<IntensityId>("consistent");
  const [routineItems, setRoutineItems] = useState<RoutineItem[]>([]);
  const [appNotificationsEnabled, setAppNotificationsEnabled] = useState(false);
  const [alertTimes, setAlertTimes] = useState<string[]>(ROUTINE_ALERT_DEFAULTS.consistent);
  const [timeZone, setTimeZone] = useState(() => readDeviceTimeZone());
  const [permissionStatus, setPermissionStatus] = useState<"granted" | "denied" | "skipped" | null>(
    null,
  );
  const preferredLocale: AppLocale = resolveAppLocale(
    i18n.resolvedLanguage || i18n.language,
  );

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!user) return;

    void (async () => {
      setLoading(true);
      try {
        const [prefsRes, profileRes] = await Promise.all([
          (supabase as any)
            .from("user_preferences")
            .select(
              "routine_intensity, routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          (supabase as any)
            .from("profiles")
            .select(
              "routine_intensity, routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("id", user.id)
            .maybeSingle(),
        ]);

        if (prefsRes.error) throw prefsRes.error;
        if (profileRes.error) throw profileRes.error;

        const prefs = prefsRes.data as RoutineDbRow | null;
        const profile = profileRes.data as RoutineDbRow | null;
        const preFeature = isPreFeatureRoutineUser(prefs, profile);

        const merged = mergeRoutineDbRow(prefs, profile);
        const loadedIntensity = preFeature ? "light" : merged.intensity;
        const loadedItems =
          merged.routineItems.length > 0
            ? merged.routineItems
            : defaultRoutineItems(loadedIntensity, routineItemLabel);

        const hasOneSignalConsent =
          merged.appNotificationsEnabled && merged.permissionStatus === "granted";
        const legacyNotifWithoutConsent =
          !preFeature && merged.appNotificationsEnabled && merged.permissionStatus !== "granted";

        if (legacyNotifWithoutConsent) {
          void Promise.all([
            (supabase as any).from("user_preferences").upsert(
              { user_id: user.id, app_notifications_enabled: false },
              { onConflict: "user_id" },
            ),
            (supabase as any).from("profiles").upsert(
              { id: user.id, app_notifications_enabled: false },
              { onConflict: "id" },
            ),
          ]).catch((err) => {
            console.error("[RoutineReminderSettings] legacy notif reset failed:", err);
          });
        }

        setIntensity(loadedIntensity);
        setSavedIntensity(loadedIntensity);
        setRoutineItems(loadedItems);
        setAlertTimes(preFeature ? [...ROUTINE_ALERT_DEFAULTS.light] : merged.alertTimes);
        setTimeZone(preFeature ? readDeviceTimeZone() : merged.timeZone);
        setAppNotificationsEnabled(preFeature ? false : hasOneSignalConsent);
        setPermissionStatus(
          preFeature
            ? "skipped"
            : legacyNotifWithoutConsent
              ? "skipped"
              : (merged.permissionStatus ?? null),
        );
      } catch (e) {
        console.error("[RoutineReminderSettings] load failed:", e);
        toast.error(t("toasts.routineLoadFailed"));
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const cardClass = cn(
    "w-full min-w-0 max-w-full overflow-hidden",
    theme === "dark"
      ? "!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm p-4 sm:p-6 space-y-3"
      : "p-4 sm:p-6 space-y-3",
    theme === "dark" && "!bg-transparent",
  );

  const choiceTileClass = (active: boolean) =>
    cn(
      "flex w-full items-start justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
      "bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md",
      active ? "border-white/30 ring-1 ring-white/20" : "border-white/12",
      theme !== "dark" && (active ? "border-primary/40 bg-primary/5" : "border-border bg-card"),
    );

  const persistTimeZone = async (tz: string) => {
    if (!user) return false;
    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, timezone: tz },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, timezone: tz },
        { onConflict: "id" },
      ),
    ]);
    const ok = !prefsError && !profileError;
    if (!ok) {
      console.error(
        "[RoutineReminderSettings] persist timezone failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes,
        timezone: tz,
      }).catch(() => {});
    }
    return ok;
  };

  const persistAlertTimes = async (times: string[]) => {
    if (!user) return false;
    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, routine_notification_times: times, timezone: timeZone },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, routine_notification_times: times, timezone: timeZone },
        { onConflict: "id" },
      ),
    ]);
    const ok = !prefsError && !profileError;
    if (!ok) {
      console.error(
        "[RoutineReminderSettings] persist alert times failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes: times,
        timezone: timeZone,
      }).catch(() => {});
    }
    return ok;
  };

  const handleToggleAppNotifications = async (enabled: boolean) => {
    if (!user) return;
    const previous = appNotificationsEnabled;
    const effectiveItems = routineItemsForIntensity(intensity, routineItems, routineItemLabel);
    const effectiveTimes = parseAlertTimes(alertTimes, intensity);
    const routineBase = {
      routine_intensity: intensity,
      routine_items: effectiveItems,
      routine_notification_times: effectiveTimes,
    };

    setAppNotificationsEnabled(enabled);

    if (!enabled) {
      const [{ error: prefsError }, { error: profileError }] = await Promise.all([
        (supabase as any).from("user_preferences").upsert(
          { user_id: user.id, app_notifications_enabled: false },
          { onConflict: "user_id" },
        ),
        (supabase as any).from("profiles").upsert(
          { id: user.id, app_notifications_enabled: false },
          { onConflict: "id" },
        ),
      ]);

      if (prefsError || profileError) {
        setAppNotificationsEnabled(previous);
        console.error(
          "[RoutineReminderSettings] toggle off upsert failed:",
          prefsError ?? profileError,
        );
        toast.error(t("toasts.routineNotifUpdateFailed"));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        void syncRoutineOneSignalTags({
          intensity,
          preferredLocale,
          notificationsEnabled: false,
          permissionStatus,
          alertTimes: [],
        }).catch((err) => {
          console.error("[RoutineReminderSettings] OneSignal tag sync failed:", err);
        });
      }

      toast.success(t("toasts.routineNotifOff"));
      return;
    }

    const detectedTz = readDeviceTimeZone();
    setTimeZone(detectedTz);

    if (Capacitor.isNativePlatform()) {
      const isAndroidNative = Capacitor.getPlatform() === "android";
      const priorPermission = permissionStatus;

      if (isAndroidNative) {
        try {
          console.info("[RoutineNotifications] android permission:start");
          const granted = await requestNativePushPermission();
          console.info("[RoutineNotifications] android permission:result", { granted });

          if (!granted) {
            setAppNotificationsEnabled(false);
            setPermissionStatus("denied");
            const [{ error: prefsError }, { error: profileError }] = await Promise.all([
              (supabase as any).from("user_preferences").upsert(
                {
                  user_id: user.id,
                  ...routineBase,
                  app_notifications_enabled: false,
                  notification_permission_status: "denied",
                  timezone: detectedTz,
                },
                { onConflict: "user_id" },
              ),
              (supabase as any).from("profiles").upsert(
                {
                  id: user.id,
                  ...routineBase,
                  app_notifications_enabled: false,
                  notification_permission_status: "denied",
                  timezone: detectedTz,
                },
                { onConflict: "id" },
              ),
            ]);
            if (prefsError || profileError) {
              console.error("[RoutineNotifications] denied upsert failed:", prefsError ?? profileError);
            }
            void syncRoutineOneSignalTags({
              intensity,
              notificationsEnabled: false,
              permissionStatus: "denied",
              alertTimes: [],
            }).catch((err) => {
              console.error("[RoutineNotifications] denied tag sync failed:", err);
            });
            toast.error(t("toasts.routineNotifDenied"));
            return;
          }

          console.info("[RoutineNotifications] bootstrap:start");
          await bootstrapOneSignal();
          attachOneSignalListenersOnce();
          console.info("[RoutineNotifications] bootstrap:success");

          console.info("[RoutineNotifications] login:start", { userId: user.id });
          await oneSignalLogin(user.id);
          console.info("[RoutineNotifications] login:success");

          await syncOneSignalUserLanguage(preferredLocale);

          const optedIn = await optInOneSignalPush();
          if (!optedIn) {
            setAppNotificationsEnabled(false);
            setPermissionStatus("skipped");
            toast.error(t("toasts.routineNotifPermissionFailed"));
            return;
          }

          const enabledPayload = {
            ...routineBase,
            app_notifications_enabled: true,
            notification_permission_status: "granted",
            timezone: detectedTz,
            preferred_locale: preferredLocale,
          };

          const prefsRes = await (supabase as any).from("user_preferences").upsert(
            { user_id: user.id, ...enabledPayload },
            { onConflict: "user_id" },
          );
          if (prefsRes.error) throw prefsRes.error;

          const profileRes = await (supabase as any).from("profiles").upsert(
            { id: user.id, ...enabledPayload },
            { onConflict: "id" },
          );
          if (profileRes.error) throw profileRes.error;

          console.info("[RoutineNotifications] tags:start");
          await syncRoutineOneSignalTags({
            intensity,
            notificationsEnabled: true,
            permissionStatus: "granted",
            alertTimes: effectiveTimes,
            timezone: detectedTz,
            preferredLocale,
          });
          console.info("[RoutineNotifications] tags:success");

          setAppNotificationsEnabled(true);
          setPermissionStatus("granted");
          setSavedIntensity(intensity);
          setRoutineItems(effectiveItems);
          setAlertTimes(effectiveTimes);
          toast.success(t("toasts.routineNotifOn"));
          return;
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          console.error("[RoutineNotifications] android toggle-on failed", { error, message });
          setAppNotificationsEnabled(false);
          setPermissionStatus("skipped");
          toast.error(
            message
              ? `Routine notification setup failed: ${message}`
              : "Routine notification setup failed. Check native logs.",
          );
          return;
        }
      }

      type RoutineNotificationStep =
        | "bootstrap_onesignal"
        | "onesignal_login"
        | "sync_language"
        | "request_permission"
        | "opt_in_push_subscription"
        | "upsert_user_preferences"
        | "upsert_profiles"
        | "sync_onesignal_tags";

      let step: RoutineNotificationStep = "bootstrap_onesignal";

      try {
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
        console.info("[RoutineNotifications] toggle-on start", {
          appIdPresent: !!(appId && appId.trim()),
          userId: user.id,
        });

        console.info("[RoutineNotifications] step:start", { step });
        await bootstrapOneSignal();
        console.info("[RoutineNotifications] step:success", { step });

        step = "onesignal_login";
        console.info("[RoutineNotifications] step:start", { step, userId: user.id });
        await oneSignalLogin(user.id);
        console.info("[RoutineNotifications] step:success", { step });

        step = "sync_language";
        console.info("[RoutineNotifications] step:start", { step, preferredLocale });
        await syncOneSignalUserLanguage(preferredLocale);
        console.info("[RoutineNotifications] step:success", { step });

        step = "request_permission";
        console.info("[RoutineNotifications] step:start", { step, priorPermission });
        const granted = await requestOneSignalPushPermission(true);
        console.info("[RoutineNotifications] step:success", { step, granted });

        if (!granted) {
          setAppNotificationsEnabled(false);
          setPermissionStatus("denied");
          const [{ error: prefsError }, { error: profileError }] = await Promise.all([
            (supabase as any).from("user_preferences").upsert(
              {
                user_id: user.id,
                ...routineBase,
                app_notifications_enabled: false,
                notification_permission_status: "denied",
                timezone: detectedTz,
              },
              { onConflict: "user_id" },
            ),
            (supabase as any).from("profiles").upsert(
              {
                id: user.id,
                ...routineBase,
                app_notifications_enabled: false,
                notification_permission_status: "denied",
                timezone: detectedTz,
              },
              { onConflict: "id" },
            ),
          ]);
          if (prefsError || profileError) {
            console.error("[RoutineNotifications] denied upsert failed:", prefsError ?? profileError);
          }
          void syncRoutineOneSignalTags({
            intensity,
            notificationsEnabled: false,
            permissionStatus: "denied",
            alertTimes: [],
          }).catch((err) => {
            console.error("[RoutineNotifications] denied tag sync failed:", err);
          });
          toast.error(
            priorPermission === "denied"
              ? t("toasts.routineNotifDeniedIos")
              : t("toasts.routineNotifDenied"),
          );
          return;
        }

        step = "opt_in_push_subscription";
        console.info("[RoutineNotifications] step:start", { step });
        const optedIn = await optInOneSignalPush();
        console.info("[RoutineNotifications] step:success", { step, optedIn });

        if (!optedIn) {
          setAppNotificationsEnabled(false);
          setPermissionStatus("skipped");
          toast.error(t("toasts.routineNotifPermissionFailed"));
          return;
        }

        const enabledPayload = {
          ...routineBase,
          app_notifications_enabled: true,
          notification_permission_status: "granted",
          timezone: detectedTz,
          preferred_locale: preferredLocale,
        };

        step = "upsert_user_preferences";
        console.info("[RoutineNotifications] step:start", {
          step,
          payloadKeys: Object.keys(enabledPayload),
        });
        const prefsRes = await (supabase as any).from("user_preferences").upsert(
          { user_id: user.id, ...enabledPayload },
          { onConflict: "user_id" },
        );
        if (prefsRes.error) throw prefsRes.error;
        console.info("[RoutineNotifications] step:success", { step });

        step = "upsert_profiles";
        console.info("[RoutineNotifications] step:start", {
          step,
          payloadKeys: Object.keys(enabledPayload),
        });
        const profileRes = await (supabase as any).from("profiles").upsert(
          { id: user.id, ...enabledPayload },
          { onConflict: "id" },
        );
        if (profileRes.error) throw profileRes.error;
        console.info("[RoutineNotifications] step:success", { step });

        step = "sync_onesignal_tags";
        console.info("[RoutineNotifications] step:start", { step });
        await syncRoutineOneSignalTags({
          intensity,
          notificationsEnabled: true,
          permissionStatus: "granted",
          alertTimes: effectiveTimes,
          timezone: detectedTz,
          preferredLocale,
        });
        console.info("[RoutineNotifications] step:success", { step });

        setAppNotificationsEnabled(true);
        setPermissionStatus("granted");
        setSavedIntensity(intensity);
        setRoutineItems(effectiveItems);
        setAlertTimes(effectiveTimes);
        toast.success(t("toasts.routineNotifOn"));
        return;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error("[RoutineNotifications] toggle-on failed", {
          step,
          error,
          message,
        });
        setAppNotificationsEnabled(false);
        toast.error(
          step === "bootstrap_onesignal" && message
            ? `Routine notification setup failed at ${step}: ${message}`
            : `Routine notification setup failed at ${step}. Check native logs.`,
        );
        return;
      }
    }

    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        {
          user_id: user.id,
          ...routineBase,
          app_notifications_enabled: true,
          timezone: detectedTz,
        },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        {
          id: user.id,
          ...routineBase,
          app_notifications_enabled: true,
          timezone: detectedTz,
        },
        { onConflict: "id" },
      ),
    ]);

    if (prefsError || profileError) {
      setAppNotificationsEnabled(previous);
      console.error(
        "[RoutineReminderSettings] web toggle on upsert failed:",
        prefsError ?? profileError,
      );
      toast.error(t("toasts.routineNotifUpdateFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(effectiveItems);
    setAlertTimes(effectiveTimes);

    if (Capacitor.isNativePlatform()) {
      void syncRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: true,
        permissionStatus: permissionStatus ?? "skipped",
        alertTimes: effectiveTimes,
        timezone: timeZone,
      }).catch((err) => {
        console.error("[RoutineReminderSettings] OneSignal tag sync failed:", err);
      });
    }

    toast.success(t("toasts.routineNotifOn"));
  };

  const handleSaveIntensity = async () => {
    if (!user || saving) return;
    setSaving(true);
    const nextRoutine = routineItemsForIntensity(intensity, routineItems, routineItemLabel);

    const routinePatch = {
      routine_intensity: intensity,
      routine_items: nextRoutine,
      routine_notification_times: appNotificationsEnabled ? alertTimes : [],
      preferred_locale: preferredLocale,
    };

    const [{ error: prefsError }, { error: profileError }] = await Promise.all([
      (supabase as any).from("user_preferences").upsert(
        { user_id: user.id, ...routinePatch, timezone: timeZone },
        { onConflict: "user_id" },
      ),
      (supabase as any).from("profiles").upsert(
        { id: user.id, ...routinePatch, timezone: timeZone },
        { onConflict: "id" },
      ),
    ]);

    setSaving(false);

    if (prefsError || profileError) {
      console.error("[RoutineReminderSettings] save intensity failed:", prefsError ?? profileError);
      toast.error(t("toasts.routineIntensitySaveFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(nextRoutine);

    if (Capacitor.isNativePlatform()) {
      void syncRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: appNotificationsEnabled,
        permissionStatus,
        alertTimes: appNotificationsEnabled ? alertTimes : [],
        timezone: timeZone,
      }).catch(() => {});
    }

    toast.success(t("toasts.routineIntensitySaved"));
  };

  const shellBg = theme === "dark" ? "#0f0d14" : "#ffffff";

  return (
    <div
      className={cn(
        "tool-page-shell relative overflow-x-hidden min-h-screen pb-20 md:pb-0",
        theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background",
      )}
      style={{ backgroundColor: shellBg }}
    >
      <div className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen", "flex flex-col")}>
        {isMobile ? (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        ) : null}

        <div className="relative z-10 flex flex-col flex-1 min-h-0">
        <header
          className={cn(
            "z-50 border-b flex items-center",
            theme === "dark" ? "border-white/10 bg-[#0f0d14]" : "border-primary/10 bg-background",
            isMobile
              ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)] px-4 py-2.5"
              : "fixed top-0 left-0 right-0 h-16 px-6",
          )}
          style={
            !isMobile
              ? {
                  top: "var(--app-safe-area-top)",
                  backgroundColor: shellBg,
                }
              : { backgroundColor: shellBg }
          }
        >
          <div className="flex w-full min-w-0 items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={() => navigate("/dashboard/settings")}
                className={cn(
                  "shrink-0 rounded-full p-2 transition-colors",
                  theme === "dark" ? "hover:bg-white/10" : "hover:bg-muted",
                )}
                aria-label={t("routine.backAria")}
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0">
                <h1 className="text-lg font-bold truncate">{t("routine.title")}</h1>
                <p className={cn("text-xs truncate", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.subtitle")}
                </p>
              </div>
            </div>
            {isMobile && <MobilePWAMenu />}
          </div>
        </header>

        <main
          className={cn(
            "relative z-10 w-full px-4 sm:px-6 max-w-4xl",
            isMobile ? "pb-4" : "pb-20",
            !isMobile ? "pt-16" : "",
            !isMobile ? "" : "container mx-auto",
            isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
          )}
        >
          <div className={cn(isMobile ? "pt-3 pb-2" : "py-2 sm:py-3")}>
          {loading ? (
            <p className={cn("text-sm", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
              {t("routine.loading")}
            </p>
          ) : (
            <div className="w-full min-w-0 max-w-full space-y-4">
              <Card className={cardClass}>
                <h2 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                  <Zap className="h-4 w-4" />
                  {t("routine.intensityHeading")}
                </h2>
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.intensityDescription")}
                </p>

                <div className="space-y-3 pt-1">
                  {INTENSITY_IDS.map((id) => {
                    const active = intensity === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        disabled={saving}
                        onClick={() => {
                          setIntensity(id);
                          setAlertTimes([...ROUTINE_ALERT_DEFAULTS[id]]);
                        }}
                        className={choiceTileClass(active)}
                      >
                        <span className="min-w-0 flex-1 space-y-1 text-left">
                          <span className="block text-base font-semibold">{t(`routine.intensity.${id}.title`)}</span>
                          <span
                            className={cn(
                              "block text-sm font-medium",
                              theme === "dark" ? "text-white/80" : "text-foreground/80",
                            )}
                          >
                            {t(`routine.intensity.${id}.tagline`)}
                          </span>
                          <span
                            className={cn(
                              "block text-xs leading-relaxed",
                              theme === "dark" ? "text-white/50" : "text-muted-foreground",
                            )}
                          >
                            {t(`routine.intensity.${id}.description`)}
                          </span>
                        </span>
                        {active ? (
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
                        ) : (
                          <Circle className="mt-0.5 h-5 w-5 shrink-0 opacity-35" />
                        )}
                      </button>
                    );
                  })}
                </div>

                {intensity !== savedIntensity && (
                  <Button onClick={() => void handleSaveIntensity()} disabled={saving} className="w-full">
                    {saving ? t("routine.saving") : t("routine.saveIntensity")}
                  </Button>
                )}
              </Card>

              <Card className={cardClass}>
                <h2 className="font-semibold text-sm sm:text-base">{t("routine.notificationsHeading")}</h2>
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("routine.notificationsDescription")}
                </p>

                <div className="flex min-w-0 items-center justify-between gap-3 pt-1">
                  <Label htmlFor="routine-notifications" className="min-w-0 shrink">
                    {t("routine.pushRemindersLabel")}
                  </Label>
                  <Switch
                    id="routine-notifications"
                    checked={appNotificationsEnabled}
                    onCheckedChange={(enabled) => void handleToggleAppNotifications(enabled)}
                    className="shrink-0 data-[state=checked]:bg-green-500"
                  />
                </div>

                {appNotificationsEnabled ? (
                  <div
                    className={cn(
                      "w-full min-w-0 space-y-2 border-t pt-3 overflow-hidden",
                      theme === "dark" ? "border-white/10" : "border-border",
                    )}
                  >
                    <p
                      className={cn(
                        "text-sm font-medium",
                        theme === "dark" ? "text-white/90" : "text-foreground",
                      )}
                    >
                      {t("routine.dailyTimeHeading")}
                    </p>
                    <RoutineTimeZoneSelect
                      value={timeZone}
                      dark={theme === "dark"}
                      onChange={(tz) => {
                        setTimeZone(tz);
                        void persistTimeZone(tz);
                      }}
                    />
                    {(intensity === "light"
                      ? [t("routine.alerts.single")]
                      : intensity === "consistent"
                        ? [t("routine.alerts.first"), t("routine.alerts.second")]
                        : [t("routine.alerts.first"), t("routine.alerts.second"), t("routine.alerts.third")]
                    ).map((label, index) => (
                      <div
                        key={label}
                        className="flex flex-wrap items-center gap-2 min-w-0 justify-between"
                      >
                        <Label className="min-w-0 shrink text-sm font-normal">{label}</Label>
                        <input
                          type="time"
                          value={alertTimes[index] ?? ROUTINE_ALERT_DEFAULTS[intensity][index]}
                          onChange={(e) => {
                            const next = [...alertTimes];
                            next[index] = e.target.value;
                            setAlertTimes(next);
                            if (appNotificationsEnabled) {
                              void persistAlertTimes(next);
                            }
                          }}
                          className={cn(
                            "min-w-0 max-w-[9.5rem] shrink-0 rounded-lg border px-2 py-1.5 text-sm",
                            theme === "dark"
                              ? "border-white/15 bg-white/10 text-white [color-scheme:dark]"
                              : "border-border bg-background text-foreground",
                          )}
                        />
                      </div>
                    ))}
                  </div>
                ) : null}

                {permissionStatus === "denied" && (
                  <p className={cn("text-xs", theme === "dark" ? "text-white/50" : "text-muted-foreground")}>
                    {t("routine.deviceDeniedHint")}
                  </p>
                )}
              </Card>
            </div>
          )}
          </div>
        </main>
        </div>
      </div>
    </div>
  );
}
