import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "@/i18n";
import { resolveAppLocale } from "@/lib/locale";
import {
  attachOneSignalListenersOnce,
  bootstrapOneSignal,
  oneSignalLogin,
  optInOneSignalPush,
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncManifestationRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";
import { requestNativePushPermission } from "@/services/pushNotifications";
import { useTranslation } from "react-i18next";

type IntensityId = "light" | "consistent" | "locked_in";

const ROUTINE_ALERT_DEFAULTS: Record<IntensityId, string[]> = {
  light: ["21:30"],
  consistent: ["07:00", "21:30"],
  locked_in: ["07:00", "18:30", "21:30"],
};

export default function SetupIntensity() {
  const { t } = useTranslation(["onboarding", "settings"]);

  const routineItemLabel = (slug: string) => t(`settings:routine.itemLabels.${slug}`);

  const intensityOptions: {
    id: IntensityId;
    title: string;
    tagline: string;
    description: string;
  }[] = [
    {
      id: "light",
      title: t("setup.intensity.light.title"),
      tagline: t("setup.intensity.light.tagline"),
      description: t("setup.intensity.light.description"),
    },
    {
      id: "consistent",
      title: t("setup.intensity.consistent.title"),
      tagline: t("setup.intensity.consistent.tagline"),
      description: t("setup.intensity.consistent.description"),
    },
    {
      id: "locked_in",
      title: t("setup.intensity.lockedIn.title"),
      tagline: t("setup.intensity.lockedIn.tagline"),
      description: t("setup.intensity.lockedIn.description"),
    },
  ];

  const routineAlertLabels: Record<IntensityId, string[]> = {
    light: [t("setup.intensity.alerts.alert")],
    consistent: [
      t("setup.intensity.alerts.first"),
      t("setup.intensity.alerts.second"),
    ],
    locked_in: [
      t("setup.intensity.alerts.first"),
      t("setup.intensity.alerts.second"),
      t("setup.intensity.alerts.third"),
    ],
  };
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const preferredLocale = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showAttScreen =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const initial = useMemo(() => {
    const d = readSetupDraft();
    const raw = d.intensity;
    return raw === "light" || raw === "consistent" || raw === "locked_in" ? raw : null;
  }, []);
  const intensityTitle = useMemo(() => {
    const intent = readSetupDraft().primaryIntent ?? "life_rebranding";
    const byIntent = t(`setup.intensity.titleByIntent.${intent}`, { defaultValue: "" });
    return byIntent || t("setup.intensity.title");
  }, [t]);
  const [selected, setSelected] = useState<IntensityId | null>(initial);
  const [notificationChoice, setNotificationChoice] = useState<"yes" | "not_now" | null>(null);
  const [alertTimes, setAlertTimes] = useState<string[]>(
    initial ? [...ROUTINE_ALERT_DEFAULTS[initial]] : ROUTINE_ALERT_DEFAULTS.consistent,
  );
  const [timeZone, setTimeZone] = useState(() => readDeviceTimeZone());
  const [busy, setBusy] = useState(false);
  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

  useEffect(() => {
    setTimeZone(readDeviceTimeZone());
  }, []);

  useEffect(() => {
    if (!selected) return;
    setAlertTimes([...ROUTINE_ALERT_DEFAULTS[selected]]);
  }, [selected]);

  useEffect(() => {
    if (notificationChoice === "yes") {
      setTimeZone(readDeviceTimeZone());
    }
  }, [notificationChoice]);

  const nextRoute =
    showAttScreen && isSuiteFunnel
      ? `${setupBase}/notifications`
      : isSuiteFunnel
        ? `${setupBase}/tool-preference`
        : `${setupBase}/plot-loading`;

  const handleBack = () => {
    navigate(`${setupBase}/attribution`);
  };

  const persistAndContinue = async (opts: {
    intensity: IntensityId;
    notificationsEnabled: boolean;
    permissionStatus: "granted" | "denied" | "skipped";
    requestPermission: boolean;
  }) => {
    if (busy) return;
    setBusy(true);

    try {
    let permissionStatus = opts.permissionStatus;
    let notificationsEnabled = opts.notificationsEnabled;

    if (opts.requestPermission && isAndroidNative) {
      let osGranted = false;
      try {
        console.info("[Intensity] android permission:start");
        osGranted = await requestNativePushPermission();
        console.info("[Intensity] android permission:result", { granted: osGranted });
        if (!osGranted) {
          notificationsEnabled = false;
          permissionStatus = "denied";
        }
      } catch {
        notificationsEnabled = false;
        permissionStatus = "denied";
      }

      if (osGranted) {
        try {
          console.info("[Intensity] bootstrap:start");
          await bootstrapOneSignal();
          attachOneSignalListenersOnce();
          if (user?.id) {
            console.info("[Intensity] login:start", { userId: user.id });
            await oneSignalLogin(user.id);
          }
          await syncOneSignalUserLanguage(preferredLocale);
          const optedIn = await optInOneSignalPush();
          if (optedIn) {
            notificationsEnabled = true;
            permissionStatus = "granted";
          } else {
            notificationsEnabled = false;
            permissionStatus = "skipped";
          }
        } catch (e) {
          console.warn("[Intensity] OneSignal setup after permission failed:", e);
          notificationsEnabled = false;
          permissionStatus = "skipped";
        }
      }
    }

    const draft = readSetupDraft();
    const toolPrefs = Array.isArray(draft.toolPreferences)
      ? draft.toolPreferences.filter((t): t is string => typeof t === "string")
      : [];

    const routineItems: { slug: string; label: string; cadence: string; target_per_week: number }[] =
      [];

    if (toolPrefs.includes("powerful_affirmations") || toolPrefs.length === 0) {
      routineItems.push({
        slug: "affirmations",
        label: routineItemLabel("affirmations"),
        cadence: "daily",
        target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 5 : 3,
      });
    }
    if (toolPrefs.includes("daily_wins_progress")) {
      routineItems.push({
        slug: "progress_review",
        label: routineItemLabel("progress_review"),
        cadence: "weekly",
        target_per_week: opts.intensity === "locked_in" ? 2 : 1,
      });
    }
    if (routineItems.length === 0) {
      routineItems.push({
        slug: "affirmations",
        label: routineItemLabel("affirmations"),
        cadence: "daily",
        target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 5 : 3,
      });
    }

    if (opts.requestPermission && Capacitor.isNativePlatform() && !isAndroidNative) {
      try {
        const granted = await requestOneSignalPushPermission(true);
        notificationsEnabled = granted;
        permissionStatus = granted ? "granted" : "denied";
      } catch {
        notificationsEnabled = false;
        permissionStatus = "denied";
      }
    }

    await writeSetupDraft(
      {
        intensity: opts.intensity,
        routineItems,
        appNotificationsConsent: notificationsEnabled,
        notificationPermissionStatus: permissionStatus,
        routineNotificationTimes: notificationsEnabled ? alertTimes : [],
        timezone: timeZone,
      },
      { awaitBackendSync: true },
    );

    if (Capacitor.isNativePlatform()) {
      try {
        console.info("[Intensity] tags:start");
        await syncManifestationRoutineOneSignalTags({
          intensity: opts.intensity,
          notificationsEnabled,
          permissionStatus,
          alertTimes: notificationsEnabled ? alertTimes : [],
          timezone: timeZone,
          preferredLocale,
        });
      } catch (e) {
        console.warn("[Intensity] OneSignal tag sync failed:", e);
      }
    }

    navigate(nextRoute);
    } catch (e) {
      console.warn("[Intensity] persistAndContinue failed:", e);
      setBusy(false);
    }
  };

  const handleSetRoutine = () => {
    if (!selected || !notificationChoice) return;
    void persistAndContinue({
      intensity: selected,
      notificationsEnabled: notificationChoice === "yes",
      permissionStatus: notificationChoice === "yes" ? "granted" : "skipped",
      requestPermission: notificationChoice === "yes",
    });
  };

  const canContinue = selected !== null && notificationChoice !== null && !busy;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleSetRoutine}
      continueText={t("setup.intensity.setRoutine")}
    >
      <SetupHeadingBlock
        centered
        title={intensityTitle}
        subtitle={t("setup.intensity.subtitle")}
      />

      <div className="relative z-[1] space-y-3 pt-6">
        {intensityOptions.map((option) => {
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => setSelected(option.id)}
              className={cn(setupTextChoiceTileClass(active), "items-start text-left")}
              style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-sans text-base font-semibold text-zinc-900">{option.title}</span>
                <span className="block font-sans text-sm font-medium text-zinc-600">{option.tagline}</span>
                <span className={cn("block text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
                  {option.description}
                </span>
              </span>
              {active ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-900" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300" />
              )}
            </button>
          );
        })}

        <div className="space-y-3 pt-4">
          <p className="text-left font-sans text-sm font-medium leading-snug text-zinc-800">
            {t("setup.intensity.notificationsQuestion")}
          </p>

          <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
            {t("setup.intensity.notificationsHint")}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { id: "yes" as const, label: t("setup.intensity.yes") },
                { id: "not_now" as const, label: t("setup.intensity.notNow") },
              ] as const
            ).map((option) => {
              const active = notificationChoice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setNotificationChoice(option.id)}
                  className={cn(setupTextChoiceTileClass(active), "items-center justify-center text-center")}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className="font-sans text-base font-semibold text-zinc-900">{option.label}</span>
                  {active ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-900" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
                  )}
                </button>
              );
            })}
          </div>

          {notificationChoice === "yes" && selected ? (
            <div className="space-y-2 pt-2">
              <p className="text-left font-sans text-sm font-medium text-zinc-800">
                {t("setup.intensity.dailyTime")}
              </p>
              <RoutineTimeZoneSelect
                id="onboarding-routine-timezone"
                value={timeZone}
                disabled={busy}
                onChange={(tz) => {
                  setTimeZone(tz);
                  void writeSetupDraft({ timezone: tz });
                }}
              />
              {routineAlertLabels[selected].map((label, index) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="font-sans text-sm text-zinc-700">{label}</span>
                  <input
                    type="time"
                    value={alertTimes[index] ?? ROUTINE_ALERT_DEFAULTS[selected][index]}
                    disabled={busy}
                    onChange={(e) => {
                      const next = [...alertTimes];
                      next[index] = e.target.value;
                      setAlertTimes(next);
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-sans text-sm text-zinc-900"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <p className={cn("pt-2 text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {t("setup.intensity.customizeInSettings")}
        </p>
      </div>
    </SetupPage>
  );
}
