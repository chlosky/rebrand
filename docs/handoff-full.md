# Handoff (full): Welcome, Settings, Routine, Paywall

Generated from branch Mobile-app. Locale/i18n/routine patches (uncommitted). Updated 2026-06-09.

Single file for all review areas.

**Contents**
- Part 1 — Welcome, Settings, Routine Notifications (OneSignal toggle, language selectors, layout)
- Part 2 — RevenueCat Paywall (paywall, post-paywall, Customer Center, billing)

---
## Part 1 — Welcome, Settings, Routine Notifications

## Verification notes

- Source uses valid object spread: `...routineBase` and `...corsHeaders` (three dots). Markdown viewers may show `.routineBase` — search FILE sections for `...routineBase`.
- Portuguese JSON in repo uses proper accents (notificações, você). See FILE: src/i18n/locales/pt-BR/settings.json below.
- `setAppLocale` is async (`await i18n.changeLanguage`). LanguageSwitcher awaits locale change before RevenueCat/OneSignal sync.
- Welcome/OnboardingLayout: community proof, sign-in footer, mockup alt/aria use i18n keys (no hardcoded English).
- Routine toggle: if `optInOneSignalPush()` returns false, toggle stays off and no `app_notifications_enabled: true` upsert.
- `npx tsc --noEmit` and `npm run build` pass (2026-06-09).

## Copy (routine notifications)

- en: Notifications support your routine — they nudge you back to the app.
- es-419: Las notificaciones apoyan tu rutina: te recuerdan volver a la app.
- pt-BR: As notificações apoiam sua rotina: lembram você de voltar ao app.

## Architecture

- Welcome: src/pages/onboarding/Welcome.tsx (fixed language bar z-[60], out-of-flow; i18n community proof + mockup alt/aria)
- OnboardingLayout: src/components/onboarding/OnboardingLayout.tsx (signIn + alreadyHaveAccountSignIn from common.json)
- Next page (Name): src/pages/onboarding/setup/Name.tsx + SetupPage.tsx
- Settings: src/pages/Settings.tsx (LanguageSwitcher persistToAccount, RC locale on manage billing)
- LanguageSwitcher: await setAppLocale → Promise.allSettled(RC + OneSignal) → DB upserts
- Routine subpage: src/pages/ManifestationRoutineSettings.tsx (left-aligned header, card min-w-0, opt-in failure guard)
- OneSignal: src/services/oneSignal.ts
- common.json (en/es-419/pt-BR): signIn, alreadyHaveAccountSignIn

### Toggle ON flow (native, self-sufficient)

1. bootstrapOneSignal()
2. oneSignalLogin(userId)
3. syncOneSignalUserLanguage(preferredLocale)
4. requestOneSignalPushPermission(true)
5. optInOneSignalPush() — if false: set toggle off, permissionStatus skipped, toast error, return (no enable upsert)
6. Supabase upserts with `...routineBase` to user_preferences + profiles (enabled/granted)
7. syncManifestationRoutineOneSignalTags()

AuthContext still runs OneSignal login on native login; routine toggle does not rely on that alone.

Debug logs: [ManifestationRoutineSettings][OneSignal] and [OneSignal] pushSubscription.optIn

## AuthContext excerpt (lines 154-302)

```typescript
  const localeHydratedForUserRef = useRef<string | null>(null);

  // Logged-in users: account locale wins; hydrate once per session (not on every Settings change).
  useEffect(() => {
    if (!user?.id) {
      localeHydratedForUserRef.current = null;
      return;
    }
    if (localeHydratedForUserRef.current === user.id) return;
    localeHydratedForUserRef.current = user.id;

    void (async () => {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("preferred_locale")
        .eq("user_id", user.id)
        .maybeSingle();
      const fromPrefs = prefs?.preferred_locale;
      if (fromPrefs && isAppLocale(fromPrefs)) {
        writeStoredPreferredLocale(fromPrefs);
        await setAppLocale(fromPrefs);
        await syncRevenueCatUILocale();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", user.id)
        .maybeSingle();
      const fromProfile = profile?.preferred_locale;
      if (fromProfile && isAppLocale(fromProfile)) {
        writeStoredPreferredLocale(fromProfile);
        await setAppLocale(fromProfile);
        await syncRevenueCatUILocale();
        return;
      }

      const stored = readStoredPreferredLocale();
      if (stored) {
        await setAppLocale(stored);
        await Promise.all([
          supabase.from("user_preferences").upsert(
            { user_id: user.id, preferred_locale: stored },
            { onConflict: "user_id" },
          ),
          supabase.from("profiles").upsert(
            { id: user.id, preferred_locale: stored },
            { onConflict: "id" },
          ),
        ]);
        await syncRevenueCatUILocale();
      }
    })();
  }, [user?.id]);

  // Initialize push notifications when user logs in (native app only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip on web/PWA
    }

    if (user?.id) {
      // Tie OneSignal user identity to Supabase UUID and refresh routine notification tags.
      void oneSignalLogin(user.id)
        .then(async () => {
          const [prefsRes, profileRes] = await Promise.all([
            (supabase as any)
              .from("user_preferences")
              .select(
                "manifestation_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("user_id", user.id)
              .maybeSingle(),
            (supabase as any)
              .from("profiles")
              .select(
                "manifestation_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("id", user.id)
              .maybeSingle(),
          ]);

          const prefs = prefsRes.data as {
            manifestation_intensity?: string | null;
            app_notifications_enabled?: boolean | null;
            notification_permission_status?: string | null;
            routine_notification_times?: unknown;
            timezone?: string | null;
            preferred_locale?: string | null;
          } | null;
          const profile = profileRes.data as typeof prefs;

          const notificationsEnabled =
            prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;
          if (!notificationsEnabled) return;

          const intensityRaw = prefs?.manifestation_intensity ?? profile?.manifestation_intensity;
          const intensity =
            intensityRaw === "light" || intensityRaw === "consistent" || intensityRaw === "locked_in"
              ? intensityRaw
              : "consistent";

          const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
          const alertTimes = Array.isArray(timesRaw)
            ? timesRaw.filter((t: unknown): t is string => typeof t === "string")
            : [];

          const permissionRaw =
            prefs?.notification_permission_status ?? profile?.notification_permission_status;

          const storedTz = prefs?.timezone ?? profile?.timezone;
          const timezone =
            typeof storedTz === "string" && storedTz.trim() ? storedTz.trim() : readDeviceTimeZone();

          const localeRaw = prefs?.preferred_locale ?? profile?.preferred_locale;
          const preferredLocale: AppLocale | undefined =
            localeRaw && isAppLocale(localeRaw) ? localeRaw : detectInitialAppLocale();

          await syncOneSignalUserLanguage(preferredLocale);

          await syncManifestationRoutineOneSignalTags({
            intensity,
            notificationsEnabled: true,
            permissionStatus:
              permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
                ? permissionRaw
                : "skipped",
            alertTimes,
            timezone,
            preferredLocale,
          });
        })
        .catch((error) => {
          console.error("[AuthContext] Failed to OneSignal.login or tag sync:", error);
        });
      return;
    }

    if (!user && !isLoading) {
      // User logged out - unregister push notifications
      oneSignalLogout().catch((error) => {
        console.error("[AuthContext] Failed to OneSignal.logout:", error);
      });
      unregisterPushNotifications().catch((error) => {
        console.error('[AuthContext] Failed to unregister push notifications:', error);
      });
    }
  }, [user, isLoading]);
```

---

## FILE: src/pages/onboarding/Welcome.tsx

```tsx
import { Fragment, useEffect, useMemo, useState, type ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  AffirmationGlassIcon,
  PlayOrbIcon,
  ThetaWaveIcon,
} from "@/components/onboarding/SubliminalVisualTiles";
import {
  Bot,
  Heart,
  PenLine,
  Star,
  ScanFace,
  Wrench,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  markWebOnboardingMakeMySubliminalCtaClicked,
  recordWebOnboardingSessionStart,
} from "@/lib/webOnboardingSessionInsert";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  detectInitialAppLocale,
  isAppLocale,
  readStoredPreferredLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import {
  MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
  MARKETING_WEB_ONBOARDING_SETUP_PATH,
  MARKETING_WEB_ONBOARDING_WELCOME_PATH,
} from "@/lib/marketingConversionCopy";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { SETUP_NATIVE_CONTINUE_BTN_CLASS } from "@/lib/onboardingSetupTheme";
import "@/styles/welcome-web-effects.css";

/** Transparent brand logo — native splash + welcome native body. */
const WELCOME_LOGO = "/welcome-logo.png";
/** Rounded app icon — web welcome hero (matches App Store icon). */
/** Web welcome only — resized from apple-ios-logo.png (App Store master stays full-res). */
const WELCOME_APP_ICON = "/apple-ios-logo-hero.png";

const WELCOME_NATIVE_FREE_TRIAL_COLOR = "#e8b8cc";

const WELCOME_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

/**
 * Fixed midpoint between safe-area bottom and logo top — matches layout/body padding
 * and contentLift transforms; out of flow so logo and body stay put.
 */
const WELCOME_LANG_SWITCHER_TOP_NATIVE =
  "calc(var(--app-safe-area-top) + ((var(--app-safe-area-top) + 3.75rem - 0.32in) / 2))";
const WELCOME_LANG_SWITCHER_TOP_WEB_MOBILE =
  "calc(env(safe-area-inset-top, 0px) + ((1.5rem - 0.08in) / 2))";
const WELCOME_LANG_SWITCHER_TOP_WEB_DESKTOP = "calc((3.875rem - 0.08in) / 2)";

const WELCOME_WEB_CTA_CLASS = cn(
  WELCOME_PRIMARY_CTA_CLASS,
  "h-[3.35rem] rounded-full text-[15px] font-bold",
  "shadow-[0_0_40px_rgba(232,150,190,0.38),0_8px_28px_rgba(0,0,0,0.32)]",
);

const WELCOME_TOOL_TEXT_CLASS = cn(
  "font-welcome-serif text-[13px] font-normal leading-[1.45] text-[#e8b8cc]",
);

const WELCOME_TOOL_BULLET_CLASS = cn(
  "px-1.5 font-welcome-serif text-[13px] text-[#e8b8cc]/65",
);

const WELCOME_WEB_LAVENDER = "#e8b8d4";
const WELCOME_WEB_LAVENDER_MUTED = "#b898b0";
const SHOW_WELCOME_WEB_STEP_TILES = false;
const IPHONE_MOCKUP_FRAME_SRC = "/marketing/iphone-mockup-frame-hero.png";
const WELCOME_WEB_MOCKUP_SCREEN_SRC =
  "/marketing/welcome-mockup-screens/subliminal-maker-tracks.png";
const WELCOME_WEB_MOCKUP_SCREEN_ALT_KEY = "welcome.mockupScreenAlt";
/** Inner screen opening inside bezels — Transparent Base iPhone Mockup.png (1080×1920). */
const IPHONE_MOCKUP_SCREEN_INSET = {
  top: "4.25%",
  left: "12.963%",
  width: "73.611%",
  height: "90.5%",
  borderRadius: "6%",
} as const;

/** Bust CDN/browser cache when avatar images are replaced. */
const WELCOME_AVATAR_VERSION = "genz-v5-webp92";

const WELCOME_COMMUNITY_AVATARS = [
  `/marketing/welcome-avatars/welcome-community-avatar-1.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-2.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-3.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-4.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-5.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-6.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-7.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-8.webp?v=${WELCOME_AVATAR_VERSION}`,
] as const;

const AWARD_STAR_CLASS = "h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]";

const STAR_PAREN_OFFSETS = {
  left: ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"],
  right: ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"],
} as const;

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets = STAR_PAREN_OFFSETS[side];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center gap-[6px] py-1",
        side === "left" ? "items-end" : "items-start",
      )}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeAwardLineNative() {
  const { t } = useTranslation("onboarding");
  return (
    <div
      className="relative z-10 flex w-full items-center justify-center gap-3 px-1"
      aria-label={`${t("welcome.awardLine1")} ${t("welcome.awardLine2")} ${t("welcome.awardLine3")}`}
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-white">
        <span className="block">{t("welcome.awardLine1")}</span>
        <span className="block">{t("welcome.awardLine2")}</span>
        <span className="block">{t("welcome.awardLine3")}</span>
      </p>
      <StarParen side="right" />
    </div>
  );
}

function WelcomeFeatureGrid() {
  const { t } = useTranslation("onboarding");
  const toolRows = [
    t("welcome.toolRows.row1", { returnObjects: true }) as string[],
    t("welcome.toolRows.row2", { returnObjects: true }) as string[],
    t("welcome.toolRows.row3", { returnObjects: true }) as string[],
  ];
  return (
    <div className="relative z-10 flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2.5 text-center">
        {toolRows.map((row) => (
          <p key={row[0]} className={WELCOME_TOOL_TEXT_CLASS}>
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <span className={WELCOME_TOOL_BULLET_CLASS} aria-hidden>
                    ·
                  </span>
                ) : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function WelcomeLogo({ size = "full" }: { size?: "full" | "compact" }) {
  const sizeClass = size === "compact"
    ? "mb-2 flex h-[5rem] w-[5rem] shrink-0 items-center justify-center"
    : "mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center";
  return (
    <div className={sizeClass}>
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={size === "compact" ? 80 : 120}
        height={size === "compact" ? 80 : 120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeAppIcon() {
  return (
    <div className="sv-logo-glow-wrap mb-2">
      <img
        src={WELCOME_APP_ICON}
        alt="Palette Plotting"
        className="sv-logo-glow-img"
        width={138}
        height={138}
        decoding="sync"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeTitleNative() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-welcome-serif mt-0 max-w-[20rem] text-center text-[30px] font-normal leading-[1.12] tracking-[-0.02em] text-white sm:text-[34px]">
        {t("welcome.nativeTitle")}
      </h1>
      <div className="relative inline-flex flex-col items-center">
        <p
          className="font-sans text-[19px] font-semibold leading-none tracking-[-0.02em] sm:text-[21px]"
          style={{ color: WELCOME_NATIVE_FREE_TRIAL_COLOR }}
        >
          {t("welcome.freeTrialLine")}
        </p>
        <div
          className="sv-headline-underline pointer-events-none absolute left-1/2 top-full h-[16px] min-w-[7rem] w-[78%] max-w-[11rem] -translate-x-1/2 -translate-y-[45%]"
          aria-hidden="true"
        >
          <svg viewBox="0 0 420 24" preserveAspectRatio="none">
            <path d="M8 14 C120 10 300 10 412 14" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function WelcomeHeadlineWeb() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="sv-hero-headline-wrap sv-hero-headline-wrap--welcome relative z-10">
      <h1 className="sv-hero-headline">
        <span className="sv-hero-headline-line">{t("welcome.webHeadline1")}</span>
        <span className="sv-hero-headline-accent">{t("welcome.webHeadlineAccent")}</span>
      </h1>

      <div className="sv-headline-underline" aria-hidden="true">
        <svg viewBox="0 0 420 24" preserveAspectRatio="none">
          <path d="M8 14 C120 10 300 10 412 14" />
        </svg>
      </div>
    </div>
  );
}

function WelcomeStepCard({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle: string;
  icon: ReactNode;
}) {
  return (
    <div className="flex w-full items-center gap-3 rounded-[1.15rem] border border-white/[0.09] bg-[#100d16]/75 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] backdrop-blur-md">
      <div
        className="relative flex h-11 w-12 shrink-0 items-center justify-center overflow-visible [&_svg]:h-11 [&_svg]:w-auto"
        aria-hidden
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="font-sans text-[13px] font-semibold leading-tight text-white/95">{title}</p>
        <p className="mt-0.5 font-sans text-[11px] leading-snug text-white/42">{subtitle}</p>
      </div>
    </div>
  );
}

function WelcomeToolbarWeb() {
  const { t } = useTranslation("onboarding");
  const toolbar = [
    { label: t("welcome.webToolbar.robotic"), icon: Bot },
    { label: t("welcome.webToolbar.scripting"), icon: PenLine },
    { label: t("welcome.webToolbar.mirror"), icon: ScanFace },
    { label: t("welcome.webToolbar.more"), icon: Wrench },
  ];
  return (
    <div className="flex w-full items-stretch justify-between gap-0 px-0.5 py-2">
      {toolbar.map(({ label, icon: Icon }, index) => (
        <Fragment key={label}>
          {index > 0 ? (
            <div className="w-px shrink-0 self-stretch bg-white/[0.1]" aria-hidden />
          ) : null}
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5">
            <Icon
              className="h-3.5 w-3.5 shrink-0"
              strokeWidth={1.65}
              style={{ color: WELCOME_WEB_LAVENDER_MUTED }}
              aria-hidden
            />
            <span
              className="text-center font-sans text-[8px] font-medium leading-tight"
              style={{ color: `${WELCOME_WEB_LAVENDER_MUTED}cc` }}
            >
              {label}
            </span>
          </div>
        </Fragment>
      ))}
    </div>
  );
}

function WelcomeCommunityProofWeb() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="relative z-10 flex w-full items-center justify-center gap-2 pt-0.5">
      <div className="flex shrink-0 items-center pl-0.5" aria-hidden>
        {WELCOME_COMMUNITY_AVATARS.map((src, index) => (
          <div
            key={src}
            className="relative -ml-2 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#c994b8]/45 shadow-[0_0_10px_rgba(200,148,184,0.25)] first:ml-0 sm:h-8 sm:w-8 sm:-ml-2.5"
            style={{ zIndex: WELCOME_COMMUNITY_AVATARS.length - index }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Heart className="h-3 w-3 shrink-0 fill-[#e8a8c8] text-[#e8a8c8]" aria-hidden />
        <p
          className="shrink-0 text-left font-sans text-[10px] font-medium leading-[1.2] tracking-[0.02em]"
          style={{ color: `${WELCOME_WEB_LAVENDER}e6` }}
        >
          {t("welcome.communityProof")}
        </p>
        <Heart className="h-3 w-3 shrink-0 fill-[#e8a8c8] text-[#e8a8c8]" aria-hidden />
      </div>
    </div>
  );
}

function WelcomeIphoneMockupWeb() {
  const { t } = useTranslation("onboarding");
  const webSteps = [
    {
      title: t("welcome.webSteps.desire.title"),
      subtitle: t("welcome.webSteps.desire.subtitle"),
      icon: <AffirmationGlassIcon />,
    },
    {
      title: t("welcome.webSteps.makeYours.title"),
      subtitle: t("welcome.webSteps.makeYours.subtitle"),
      icon: <ThetaWaveIcon />,
    },
    {
      title: t("welcome.webSteps.listen.title"),
      subtitle: t("welcome.webSteps.listen.subtitle"),
      icon: <PlayOrbIcon />,
    },
  ];
  const sectionClass = SHOW_WELCOME_WEB_STEP_TILES
    ? "sv-process-streak-zone"
    : "sv-iphone-mockup-section";

  return (
    <section className={sectionClass}>
      {SHOW_WELCOME_WEB_STEP_TILES ? (
        <div className="sv-process-card flex w-full flex-col gap-2">
          {webSteps.map((step) => (
            <WelcomeStepCard key={step.title} {...step} />
          ))}
        </div>
      ) : (
        <div
          className="sv-iphone-mockup-wrap sv-process-card mx-auto w-full max-w-[18rem]"
          aria-label={t("welcome.mockupPreviewAria")}
        >
          <div className="sv-iphone-mockup-stack relative">
            <div className="sv-iphone-mockup-visual">
              <div
                className="sv-iphone-mockup-screen-slot pointer-events-none absolute overflow-hidden"
                style={IPHONE_MOCKUP_SCREEN_INSET}
              >
                <img
                  src={WELCOME_WEB_MOCKUP_SCREEN_SRC}
                  alt={t(WELCOME_WEB_MOCKUP_SCREEN_ALT_KEY)}
                  className="sv-iphone-mockup-screen absolute inset-0 h-full w-full object-cover object-top"
                  loading="eager"
                  fetchPriority="high"
                  decoding="sync"
                  draggable={false}
                />
              </div>
              <img
                src={IPHONE_MOCKUP_FRAME_SRC}
                alt=""
                className="relative z-10 block h-auto w-full object-contain"
                aria-hidden
                loading="eager"
                decoding="sync"
                draggable={false}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

function WelcomeDescriptionNative() {
  const { t } = useTranslation("onboarding");
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      {t("welcome.nativeDescription")}
    </p>
  );
}

function detectSubliminalTraffic(): boolean {
  const attr = readMarketingAttribution();
  if (!attr) return false;
  const fields = [attr.utmCampaign, attr.utmContent, attr.utmTerm].join(" ").toLowerCase();
  return fields.includes("subliminal") || fields.includes("subs ");
}

type WelcomeBodyNativeProps = {
  topPaddingClass?: string;
  contentLiftClass?: string;
};

function WelcomeBodyNative({ topPaddingClass, contentLiftClass }: WelcomeBodyNativeProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5",
        topPaddingClass,
        contentLiftClass,
      )}
    >
      <WelcomeLogo size="full" />
      <WelcomeTitleNative />
      <WelcomeDescriptionNative />
      <WelcomeAwardLineNative />
      <WelcomeFeatureGrid />
    </div>
  );
}

type WelcomeBodyWebProps = {
  topPaddingClass?: string;
  contentLiftClass?: string;
};

function WelcomeBodyWeb({ topPaddingClass, contentLiftClass }: WelcomeBodyWebProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[22rem] flex-col items-center gap-2",
        topPaddingClass,
        contentLiftClass,
      )}
    >
      <WelcomeAppIcon />
      <WelcomeHeadlineWeb />
      <WelcomeIphoneMockupWeb />
      <WelcomeToolbarWeb />
      <WelcomeCommunityProofWeb />
    </div>
  );
}

const welcomeLayoutPropsBase = {
  currentPage: 1 as const,
  welcomePage: true,
  stackedNativeButtons: true,
  stackedNativePrimaryButtonClassName: SETUP_NATIVE_CONTINUE_BTN_CLASS,
  welcomeSignInAsTextLink: false,
};

const Welcome = () => {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();
  const isMobile = useIsMobile();
  const isSuiteWelcome = pathname.includes("/onboarding/suite");

  const isSubliminalTraffic = useMemo(() => !isNative && detectSubliminalTraffic(), [isNative]);

  useEffect(() => {
    if (isNative) return;

    const recordWelcomeView = () => {
      void ensureOnboardingSessionCreds().catch((err) => {
        console.warn("[Welcome] ensureOnboardingSessionCreds failed:", err);
      });
      const welcomePath = isSuiteWelcome ? "/onboarding/suite/welcome" : MARKETING_WEB_ONBOARDING_WELCOME_PATH;
      recordWebOnboardingSessionStart({
        isMobileViewport: isMobile,
        entryPath: welcomePath,
      });
      trackMarketingConversion("web_onboarding_welcome_view", {
        source: "welcome_page",
        page_path: welcomePath,
        is_subliminal_traffic: isSubliminalTraffic,
      });
    };

    if (!detectInAppBrowser().isInAppBrowser) {
      recordWelcomeView();
      return;
    }

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => recordWelcomeView(), { timeout: 4000 });
    } else {
      timeoutId = window.setTimeout(recordWelcomeView, 1500);
    }

    return () => {
      if (idleId != null) window.cancelIdleCallback(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [isNative, isMobile, isSubliminalTraffic]);

  useEffect(() => {
    if (isNative) return;

    const preload = (href: string) => {
      if (document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    };

    preload(WELCOME_APP_ICON);
    preload(IPHONE_MOCKUP_FRAME_SRC);
    preload(WELCOME_WEB_MOCKUP_SCREEN_SRC);

    const fontId = "sv-welcome-proxima-nova";
    if (!document.getElementById(fontId)) {
      const fontLink = document.createElement("link");
      fontLink.id = fontId;
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
      document.head.appendChild(fontLink);
    }
  }, [isNative, isSuiteWelcome, isMobile, isSubliminalTraffic]);

  useEffect(() => {
    void (async () => {
      const stored = readStoredPreferredLocale();
      if (stored) {
        await setAppLocale(stored);
        return;
      }
      const draft = readSetupDraft();
      if (draft.locale && isAppLocale(draft.locale)) {
        await setAppLocale(draft.locale);
        return;
      }
      await setAppLocale(detectInitialAppLocale());
    })();
  }, []);

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isNative) return;
    void ensureOnboardingSessionCreds().catch((err) => {
      console.warn("[Welcome] native ensureOnboardingSessionCreds failed:", err);
    });
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const onContinue = () => {
    if (isNative) {
      navigate("/onboarding/setup/name");
      return;
    }
    if (isSuiteWelcome) {
      navigate("/onboarding/suite/setup/name");
      return;
    }
    trackMarketingConversion("web_onboarding_click", {
      source: "welcome_page",
      button_label: MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
      target_path: MARKETING_WEB_ONBOARDING_SETUP_PATH,
      is_subliminal_traffic: isSubliminalTraffic,
    });
    markWebOnboardingMakeMySubliminalCtaClicked();
    writeSetupDraft({
      guideCharacterId: "rose",
      embodyDailyPractices: [
        "embody_rest",
        "embody_clean_environment",
        "embody_move",
        "embody_nutrition",
        "embody_self_care",
      ],
    });
    navigate(MARKETING_WEB_ONBOARDING_SETUP_PATH);
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      continueText={isNative ? t("welcome.signUp") : MARKETING_CTA_MAKE_FIRST_SUBLIMINAL}
      welcomeCtaSubtext={isNative ? undefined : t("welcome.ctaSubtext")}
      welcomeSoloContinueButtonClassName={
        isNative ? WELCOME_PRIMARY_CTA_CLASS : WELCOME_WEB_CTA_CLASS
      }
      contentMaxWidthClass="max-w-[22rem]"
      welcomeLanguageSwitcherTop={isNative ? WELCOME_LANG_SWITCHER_TOP_NATIVE : undefined}
      welcomeLanguageSwitcherTopMobile={
        isNative ? undefined : WELCOME_LANG_SWITCHER_TOP_WEB_MOBILE
      }
      welcomeLanguageSwitcherTopDesktop={
        isNative ? undefined : WELCOME_LANG_SWITCHER_TOP_WEB_DESKTOP
      }
    >
      {isNative ? (
        <WelcomeBodyNative
          topPaddingClass="pt-[calc(var(--app-safe-area-top)+1.25rem)]"
          contentLiftClass="-translate-y-[0.32in]"
        />
      ) : (
        <WelcomeBodyWeb
          topPaddingClass="pt-1 md:pt-1.5"
          contentLiftClass="-translate-y-[0.08in]"
        />
      )}
    </OnboardingLayout>
  );
};

export default Welcome;
```

---

## FILE: src/pages/onboarding/setup/Name.tsx

```tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { toast } from "sonner";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useTranslation } from "react-i18next";

export default function SetupName() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const welcomePath = isSuiteFunnel ? "/onboarding/suite/welcome" : "/onboarding/welcome";
  const { ensureSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const canContinue = firstName.trim().length > 0 && !isSaving;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() =>
        navigate(isSuiteFunnel ? welcomePath : `${setupBase}/plot-synthesis`)
      }
      onContinue={async () => {
        const trimmed = firstName.trim();
        if (!trimmed || isSaving) return;
        setIsSaving(true);
        try {
          await ensureSession();
          await writeSetupDraft({ firstName: trimmed }, { awaitBackendSync: true });
          navigate(isSuiteFunnel ? `${setupBase}/desire-category` : `${setupBase}/email`);
        } catch (e) {
          console.warn("[SetupName] failed to save first_name to onboarding_sessions:", e);
          toast.error(t("setup.name.saveError"));
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <SetupHeadingBlock centered title={t("setup.name.title")} />

      <div className="space-y-2 pt-6">
        <Label htmlFor="firstName" className={SETUP_LABEL_CLASS}>
          {t("setup.name.firstNameLabel")}
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t("setup.name.firstNamePlaceholder")}
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
  );
}


```

---

## FILE: src/components/onboarding/OnboardingLayout.tsx

```tsx
import { ReactNode, useEffect } from "react";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ONBOARDING_ROUTES, ONBOARDING_STEP_COUNT } from "@/lib/onboardingFlow";
import { useTranslation } from "react-i18next";
import {
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
  SETUP_PRIMARY_CTA_CLASS,
} from "@/lib/onboardingSetupTheme";

interface OnboardingLayoutProps {
  children: ReactNode;
  onContinue: () => void;
  currentPage: number;
  continueText?: string;
  canContinue?: boolean;
  /** When true (Welcome page only), native app shows Continue on top and Sign In below, stacked. */
  stackedNativeButtons?: boolean;
  /** Native only: main content column grows so children can use flex-1 + justify-center (e.g. Welcome pills). */
  expandNativeContentColumn?: boolean;
  /** Max width for main stack + native mobile footer (default max-w-md). Welcome uses max-w-lg for feature pills. */
  contentMaxWidthClass?: string;
  /**
   * Native app only (non-stacked): replaces the fixed Back + Continue row, e.g. StoreKit monthly/annual
   * on older iOS where RevenueCat paywall UI is not used.
   */
  nativeFooterSlot?: ReactNode;
  /** Welcome only: merged onto stacked native primary/secondary buttons (visual only; keep layout in layout). */
  stackedNativePrimaryButtonClassName?: string;
  stackedNativeSecondaryButtonClassName?: string;
  /** Welcome only: merged onto the single mobile web Continue button. */
  welcomeSoloContinueButtonClassName?: string;
  /** Welcome route: full-bleed hero + mobile web footer layout (independent of button class overrides). */
  welcomePage?: boolean;
  /** Account step: same cosmic shell as welcome/setup (e.g. setup/email). */
  setupCosmicPage?: boolean;
  /** Shown under primary CTA on welcome (e.g. setup time / no card). */
  welcomeCtaSubtext?: string;
  /** Welcome native: text link for sign-in instead of a full secondary button. */
  welcomeSignInAsTextLink?: boolean;
  /** Route-specific override for funnels that do not use the shared onboarding step count. */
  progressFillPctOverride?: number;
  /** Hide the progress bar for pages that should use the same shell without progress. */
  hideProgress?: boolean;
  /** Reserves the same top content spacing as an overridden progress bar without rendering the bar. */
  reserveProgressSpace?: boolean;
  /**
   * Native form pages (email/password, etc.): fixed viewport + scrollable body so fields stay
   * visible above the keyboard and fixed footer. Do not set on Welcome or paywall routes.
   */
  nativeFormPage?: boolean;
  /** Welcome: fixed language bar midpoint above logo (native). */
  welcomeLanguageSwitcherTop?: string;
  /** Welcome web mobile: fixed language bar top. */
  welcomeLanguageSwitcherTopMobile?: string;
  /** Welcome web desktop: fixed language bar top. */
  welcomeLanguageSwitcherTopDesktop?: string;
}

export const OnboardingLayout = ({ 
  children, 
  onContinue, 
  currentPage,
  continueText = "Continue",
  canContinue = true,
  stackedNativeButtons = false,
  nativeFooterSlot,
  expandNativeContentColumn = false,
  contentMaxWidthClass = "max-w-md",
  stackedNativePrimaryButtonClassName,
  stackedNativeSecondaryButtonClassName,
  welcomeSoloContinueButtonClassName,
  welcomePage = false,
  setupCosmicPage = false,
  welcomeCtaSubtext,
  welcomeSignInAsTextLink = false,
  progressFillPctOverride,
  hideProgress = false,
  reserveProgressSpace = false,
  nativeFormPage = false,
  welcomeLanguageSwitcherTop,
  welcomeLanguageSwitcherTopMobile,
  welcomeLanguageSwitcherTopDesktop,
}: OnboardingLayoutProps) => {
  const { t } = useTranslation("common");
  const resolvedContinueText = continueText === "Continue" ? t("continue") : continueText;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const nativeFormScrollLayout = isNative && nativeFormPage;
  const isWelcome =
    welcomePage || Boolean(welcomeSoloContinueButtonClassName) || stackedNativeButtons;
  const isCosmicShell = true;
  const isWelcomeMobileWeb = !isNative && isWelcome;
  const isSetupCosmicMobileWeb = !isNative && setupCosmicPage;
  const setupMobileWebScrollLayout = isSetupCosmicMobileWeb && nativeFormPage;

  useEffect(() => {
    document.title = "Onboarding | Palette Plotting";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding and personalize your manifesting tools.",
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding and personalize your manifesting tools.",
    );
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[name="twitter:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding and personalize your manifesting tools.",
    );
  }, [pathname]);

  const handlePrevious = () => {
    if (currentPage > 1) {
      navigate(ONBOARDING_ROUTES[currentPage - 2]);
    }
  };

  const handleNext = () => {
    if (canContinue) {
      onContinue();
    }
  };

  const progressFillPct =
    hideProgress
      ? null
      : typeof progressFillPctOverride === "number"
      ? Math.max(0, Math.min(100, progressFillPctOverride))
      : !isWelcome && currentPage <= ONBOARDING_STEP_COUNT
      ? (currentPage / ONBOARDING_STEP_COUNT) * 100
      : null;
  const hasProgressSpacing = typeof progressFillPctOverride === "number" || reserveProgressSpace;
  const nativeWelcomeSideBySide = isNative && stackedNativeButtons && !welcomeSignInAsTextLink;

  useEffect(() => {
    if (!isCosmicShell) return;

    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, [isCosmicShell]);

  return (
    <div
      className={cn(
        "relative overflow-x-hidden",
        isCosmicShell ? "font-sans text-white antialiased" : "bg-background text-foreground",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : isSetupCosmicMobileWeb
            ? "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen"
            : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh]",
      )}
      style={isCosmicShell ? { backgroundColor: WELCOME_DEEP_BLACK_BASE } : undefined}
    >
      {isCosmicShell ? (
        <WelcomeCosmicBackground
          className="pointer-events-none fixed inset-0 z-0"
          tone="deep-black"
        />
      ) : null}
      {isWelcome && welcomeLanguageSwitcherTop ? (
        <div
          className="fixed inset-x-0 z-[60] flex -translate-y-1/2 justify-center px-2"
          style={{ top: welcomeLanguageSwitcherTop }}
        >
          <LanguageSwitcher />
        </div>
      ) : null}
      {isWelcome && welcomeLanguageSwitcherTopMobile ? (
        <div
          className="fixed inset-x-0 z-[60] flex -translate-y-1/2 justify-center px-2 md:hidden"
          style={{ top: welcomeLanguageSwitcherTopMobile }}
        >
          <LanguageSwitcher />
        </div>
      ) : null}
      {isWelcome && welcomeLanguageSwitcherTopDesktop ? (
        <div
          className="fixed inset-x-0 z-[60] hidden -translate-y-1/2 justify-center px-2 md:flex"
          style={{ top: welcomeLanguageSwitcherTopDesktop }}
        >
          <LanguageSwitcher />
        </div>
      ) : null}
      {progressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4",
            typeof progressFillPctOverride === "number" ? "py-5" : "pt-1",
            !isNative &&
              "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-[calc(env(safe-area-inset-top,0px)+4.25rem)]",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full",
              isCosmicShell ? "bg-white/20" : "bg-zinc-400/70",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300 ease-out",
                isWelcome && typeof progressFillPctOverride !== "number"
                  ? "bg-gradient-to-r from-rose-400 to-pink-500"
                  : isCosmicShell
                    ? "bg-white/90"
                    : "bg-black",
              )}
              style={{ width: `${progressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Desktop: Palette Plotting Header - hidden for native apps */}
      {!isNative && (
        <div className="hidden md:block">
          <header
            className={cn(
              "fixed top-0 left-0 right-0 z-40",
              isCosmicShell
                ? "border-b border-white/[0.06] bg-[#020104]/80 backdrop-blur-md"
                : "border-b border-primary/10 bg-background",
            )}
          >
            <div className="container mx-auto px-6 py-4">
              <button onClick={() => navigate("/")}>
                <h1
                  className={cn(
                    "text-lg font-bold transition-opacity hover:opacity-80",
                    isCosmicShell
                      ? "font-sans text-sm font-semibold tracking-tight text-white/90"
                      : "bg-gradient-primary bg-clip-text text-transparent",
                  )}
                >
                  Palette Plotting
                </h1>
              </button>
            </div>
          </header>
        </div>
      )}

      {/* Desktop: Side Navigation Arrows — hidden on welcome (single-path CTA) */}
      {!isWelcome && (
      <div className="hidden md:block">
        {currentPage > 1 && (
          <button
            onClick={handlePrevious}
            className={cn(
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")
                : "fixed left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 group bg-muted/50 hover:bg-muted",
            )}
            aria-label="Previous step"
          >
            <ChevronLeft
              className={cn(
                "w-8 h-8 transition-colors",
                setupCosmicPage
                  ? "text-white/80 group-hover:text-white"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          </button>
        )}

        {currentPage <= ONBOARDING_STEP_COUNT && (
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={cn(
              "fixed right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS)
                : "bg-black hover:bg-black/90",
            )}
            aria-label="Next step"
          >
            <ChevronRight className="w-8 h-8 text-white" />
          </button>
        )}
      </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col items-center animate-fade-in w-full",
          nativeFormScrollLayout
            ? "h-full min-h-0 px-8 pb-40"
            : isNative
              ? isCosmicShell
                ? "h-full min-h-0 justify-start px-8 pb-40"
                : "min-h-screen justify-start pb-32 px-8"
              : isWelcomeMobileWeb
                ? "max-md:min-h-[100dvh] max-md:justify-start max-md:px-8 max-md:pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] max-md:pb-40 md:justify-start md:gap-6 md:p-8 md:pt-14 md:bg-transparent"
                : isSetupCosmicMobileWeb
                  ? "max-md:h-full max-md:min-h-0 max-md:justify-start max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:justify-start md:p-8 md:pt-24"
                  : "min-h-screen justify-between pt-12 p-8 md:pt-24",
          hasProgressSpacing &&
            "max-md:pt-[calc(env(safe-area-inset-top,0px)+2.75rem)] md:pt-24",
        )}
        style={isNative ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" } : undefined}
      >
        {nativeFormScrollLayout || setupMobileWebScrollLayout ? (
          <div
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              contentMaxWidthClass,
              setupMobileWebScrollLayout && "max-md:flex md:contents",
            )}
          >
            <div
              className={cn(
                "relative z-[1] isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden",
                setupMobileWebScrollLayout && "max-md:flex md:contents",
              )}
            >
              <div
                className={cn(
                  "relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
                  setupMobileWebScrollLayout && "max-md:block md:overflow-visible md:flex-none",
                )}
              >
                <div className="space-y-6 pb-3">{children}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "w-full",
              contentMaxWidthClass,
              isNative && expandNativeContentColumn && "flex min-h-0 flex-1 flex-col",
              (isWelcomeMobileWeb || isSetupCosmicMobileWeb) && "relative z-10",
            )}
          >
            {children}
          </div>
        )}

        {/* Footer CTA — welcome shows on all breakpoints; others mobile-only */}
        <div
          className={cn(
            "w-full",
            nativeWelcomeSideBySide
              ? "fixed inset-x-0 bottom-0 z-40 md:hidden"
              : isWelcomeMobileWeb
                ? "relative z-50 shrink-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 max-md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))] max-md:bg-[#020104] md:space-y-2 md:pt-3"
                : isWelcome
                  ? "relative z-50 shrink-0 space-y-2 pt-3"
                  : "md:hidden",
            !isWelcome && !isSetupCosmicMobileWeb && "space-y-6",
            !(isNative && !isWelcome) && !nativeWelcomeSideBySide && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isSetupCosmicMobileWeb &&
              !isWelcome &&
              "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:mx-auto max-md:max-w-md max-md:px-8 max-md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-lg md:pb-0 md:pt-0",
            isStandaloneMobile && !isNative && !isWelcome && !isSetupCosmicMobileWeb && "mb-12",
          )}
          style={
            nativeWelcomeSideBySide
              ? {
                  paddingTop: "0.5rem",
                  paddingBottom: "calc(3.25rem + env(safe-area-inset-bottom, 0px))",
                  backgroundColor: WELCOME_DEEP_BLACK_BASE,
                }
              : isNative
                ? {
                    paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                    ...(isCosmicShell && !isWelcome
                      ? { backgroundColor: WELCOME_DEEP_BLACK_BASE }
                      : {}),
                  }
                : isSetupCosmicMobileWeb && !isWelcome
                  ? { backgroundColor: WELCOME_DEEP_BLACK_BASE }
                  : undefined
          }
        >
          {/* Native app: stacked (Welcome only) or side-by-side */}
          {isNative ? (
            stackedNativeButtons ? (
              welcomeSignInAsTextLink ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-8">
                {continueText ? (
                  <Button
                    onClick={() => canContinue && onContinue()}
                    disabled={!canContinue}
                    className={cn(
                      "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                      stackedNativePrimaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {resolvedContinueText}
                  </Button>
                ) : null}
                {welcomeCtaSubtext ? (
                  <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                    {welcomeCtaSubtext}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                >
                  {t("alreadyHaveAccountSignIn")}
                </button>
              </div>
              ) : (
              <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    SETUP_NATIVE_BACK_BTN_CLASS,
                    "outline-none transition-none select-none",
                    stackedNativeSecondaryButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {t("signIn")}
                </Button>
                {continueText ? (
                  <Button
                    onClick={() => canContinue && onContinue()}
                    disabled={!canContinue}
                    className={cn(
                      SETUP_NATIVE_CONTINUE_BTN_CLASS,
                      stackedNativePrimaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {resolvedContinueText}
                  </Button>
                ) : null}
              </div>
              )
            ) : nativeFooterSlot ? (
              <div className="mx-auto w-full max-w-md px-8">{nativeFooterSlot}</div>
            ) : (
            <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
              {/* Back button - only functional after first page */}
              {currentPage > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {t("back")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {t("signIn")}
                </Button>
              )}
              <Button
                onClick={() => canContinue && onContinue()}
                disabled={!canContinue}
                className={cn(
                  isCosmicShell
                    ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                    : "flex-1 bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 rounded-full text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {resolvedContinueText}
              </Button>
            </div>
            )
          ) : (
            <div
              className={cn(
                "flex w-full flex-col gap-2",
                isWelcomeMobileWeb && "mx-auto max-w-md px-8",
              )}
            >
              {continueText ? (
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    setupCosmicPage
                      ? cn("w-full", SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none")
                      : "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 outline-none transition-none",
                    welcomeSoloContinueButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {resolvedContinueText}
                </Button>
              ) : null}
              {isWelcome && welcomeCtaSubtext ? (
                <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                  {welcomeCtaSubtext}
                </p>
              ) : null}
              {isWelcome && welcomeSignInAsTextLink ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                >
                  {t("alreadyHaveAccountSignIn")}
                </button>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
```

---

## FILE: src/components/onboarding/SetupPage.tsx

```tsx
import { ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  ONBOARDING_SETUP_PROGRESS_ROUTES,
  SUITE_WEB_SETUP_PROGRESS_ROUTES,
  WEB_FAST_SETUP_PROGRESS_ROUTES,
} from "@/lib/onboardingFlow";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import {
  MOBILE_SETUP_FOOTER_STYLE,
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupBottomSceneOverlay } from "@/components/onboarding/SetupBottomSceneOverlay";
import { shouldShowSetupBottomScene } from "@/lib/onboardingBottomSceneRoutes";
import "@/styles/setup-bottom-scene.css";
import "@/styles/welcome-web-effects.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  children?: ReactNode;
  canContinue?: boolean;
  continueText?: string;
  onContinue?: () => void;
  onBack?: () => void;
  headerSlot?: ReactNode;
  /** When true, do not force light mode / overwrite theme (use after theme picker). Default false. */
  respectUserTheme?: boolean;
  /** Native only: skip the inner scroll viewport (short pages where overflow clips shadows/glow). */
  disableNativeScrollViewport?: boolean;
  /** Hide the route-derived progress bar for special interstitial screens. */
  hideProgress?: boolean;
  /**
   * Short pages where all content fits above the footer (e.g. Choose a guide).
   * Mobile web: no inner scroll box; content flows flat above the fixed footer reserve.
   */
  contentFitsViewport?: boolean;
};

export function SetupPage({
  children,
  canContinue = true,
  continueText = "Continue",
  onContinue,
  onBack,
  headerSlot,
  respectUserTheme: _respectUserTheme = false,
  disableNativeScrollViewport = false,
  hideProgress = false,
  contentFitsViewport = false,
}: Props) {
  const { t } = useTranslation("common");
  const isNative = useIsNativeApp();
  const { pathname } = useLocation();
  const { ensureSession } = useOnboardingSession();
  const resolvedContinueText = continueText === "Continue" ? t("continue") : continueText;

  useEffect(() => {
    document.title = "Onboarding | Palette Plotting";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding and personalize your manifesting tools.",
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding and personalize your manifesting tools.",
    );
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[name="twitter:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding and personalize your manifesting tools.",
    );
  }, [pathname]);

  /** Same warm-up as legacy onboarding (`OnboardingQuestions`): create `onboarding_session` creds before draft syncs. */
  useEffect(() => {
    void ensureSession().catch((err) => {
      console.warn("[SetupPage] ensureSession failed:", err);
    });
  }, [ensureSession]);

  useEffect(() => {
    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  const setupProgressFillPct = useMemo(() => {
    if (hideProgress) return null;
    const path = pathname.replace(/\/$/, "") || "/";
    const isSuitePath = path.includes("/onboarding/suite");
    const isSuiteFunnel = isNative || isSuitePath;
    const routes = isSuitePath
      ? SUITE_WEB_SETUP_PROGRESS_ROUTES
      : isSuiteFunnel
        ? ONBOARDING_SETUP_PROGRESS_ROUTES
        : WEB_FAST_SETUP_PROGRESS_ROUTES;
    const idx = (routes as readonly string[]).indexOf(path);
    if (idx < 0) return null;
    const n = routes.length;
    return ((idx + 1) / n) * 100;
  }, [hideProgress, pathname, isNative]);

  const showBottomScene = shouldShowSetupBottomScene(pathname);

  const mobileScrollBottomClass = showBottomScene
    ? "scroll-pb-[calc(8.75rem+env(safe-area-inset-bottom,0px))]"
    : "scroll-pb-28";

  const hasMobileFooter = onBack != null || onContinue != null;

  const mainColumn = (
    <>
      {headerSlot ? <div className="flex items-center justify-between">{headerSlot}</div> : null}
      {children}
    </>
  );

  const mobileFooter = hasMobileFooter ? (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={
        showBottomScene
          ? {
              paddingTop: "0.5rem",
              paddingBottom: "calc(3.25rem + env(safe-area-inset-bottom, 0px))",
            }
          : MOBILE_SETUP_FOOTER_STYLE
      }
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
        {onBack ? (
          <Button
            variant="outline"
            onClick={onBack}
            className={SETUP_NATIVE_BACK_BTN_CLASS}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {t("back")}
          </Button>
        ) : null}
        {onContinue ? (
          <Button
            onClick={() => canContinue && onContinue()}
            disabled={!canContinue}
            className={cn(
              onBack
                ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                : cn(SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none w-full"),
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {resolvedContinueText}
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  const ownedScrollColumn = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-3">{mainColumn}</div>
  );

  const desktopScrollContent = disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate hidden min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden md:flex">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate hidden w-full max-w-md space-y-6 md:block">
      {mainColumn}
    </div>
  );

  const nativeScrollContent = contentFitsViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md flex-1 flex-col min-h-0 overflow-visible">
      <div className="space-y-6 pb-3">{mainColumn}</div>
    </div>
  ) : disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          mobileScrollBottomClass,
        )}
      >
        <div className="space-y-6 pb-3">{mainColumn}</div>
      </div>
    </div>
  );

  const mobileWebScrollContent = contentFitsViewport ? (
    <div className="relative z-[1] isolate w-full max-w-md flex-1 overflow-visible md:hidden">
      <div className="space-y-6">{mainColumn}</div>
    </div>
  ) : disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden md:hidden">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          mobileScrollBottomClass,
        )}
      >
        <div className="space-y-6 pb-3">{mainColumn}</div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-x-hidden font-sans text-white antialiased",
        isNative
          ? "h-[100dvh] max-h-[100dvh]"
          : "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen",
      )}
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground
        className={cn(
          "pointer-events-none inset-0 z-0",
          disableNativeScrollViewport ? "absolute" : "fixed",
        )}
        tone="deep-black"
      />

      {showBottomScene ? <SetupBottomSceneOverlay /> : null}

      {setupProgressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-12",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div className="h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/90 transition-[width] duration-300 ease-out"
              style={{ width: `${setupProgressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center animate-fade-in",
          isNative &&
            cn(
              "h-full min-h-0 px-8",
              showBottomScene
                ? "pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))]"
                : "pb-40",
            ),
          !isNative &&
            cn(
              "max-md:flex max-md:h-full max-md:min-h-0 max-md:flex-col",
              showBottomScene
                ? "max-md:px-8 max-md:pb-[calc(7.5rem+env(safe-area-inset-bottom,0px))] max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]"
                : "max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]",
              disableNativeScrollViewport
                ? "md:flex md:h-[100dvh] md:max-h-[100dvh] md:min-h-0 md:flex-col md:px-8 md:pt-24"
                : "md:min-h-screen md:justify-between md:p-8 md:pt-24",
            ),
        )}
        style={
          isNative
            ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" }
            : undefined
        }
      >
        {isNative ? (
          nativeScrollContent
        ) : (
          <>
            {desktopScrollContent}
            <div
              className={cn(
                "relative z-[1] flex w-full max-w-md flex-1 flex-col md:hidden",
                contentFitsViewport ? "min-h-0" : "min-h-0 overflow-hidden",
              )}
            >
              {mobileWebScrollContent}
            </div>
          </>
        )}

        <div className="hidden md:block">
          {onBack ? (
            <button
              onClick={onBack}
              className={cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")}
              aria-label="Back"
            >
              <ChevronLeft className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
            </button>
          ) : null}
          {onContinue ? (
            <button
              onClick={() => canContinue && onContinue()}
              disabled={!canContinue}
              className={cn(
                SETUP_DESKTOP_CHEVRON_CLASS,
                "right-8 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              aria-label="Continue"
            >
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          ) : null}
        </div>

        {mobileFooter}
      </div>
    </div>
  );
}

```

---

## FILE: src/pages/Settings.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2, Zap, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { cn } from "@/lib/utils";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAppleIAP } from "@/hooks/useAppleIAP";
import {
  openRevenueCatWebBillingPortal,
  resolveRevenueCatWebBillingStatus,
} from "@/services/revenueCatManageBilling";
import { bootstrapRevenueCat, resolveRevenueCatUILocale, syncRevenueCatUILocale } from "@/services/revenueCat";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { resolveAppLocale, legalTermsPath, legalPrivacyPath } from "@/lib/locale";

const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

const Settings = () => {
  const { t, i18n } = useTranslation("settings");
  const localeKey = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const translatePasswordError = (error: string | null): string | null => {
    if (!error) return null;
    return t(`passwordValidation.${error}`);
  };
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const appleIAP = useAppleIAP();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [marketingSMSEnabled, setMarketingSMSEnabled] = useState(false);
  const [dataTrainingOptIn, setDataTrainingOptIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Password validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Cadence from `user_plans.billing_period` only (Current Plan label). */
  const [billingPeriodLabel, setBillingPeriodLabel] = useState<string | null>(null);
  /** From user_plans; routes Manage Billing (RC web / App Store / Google Play). */
  const [lastPaymentSource, setLastPaymentSource] = useState<
    "stripe" | "apple" | "google_play" | null
  >(null);
  /** RC Web Billing subscriber ? checked so Settings can show a loading hint while portal status resolves. */
  const [rcWebBillingAvailable, setRcWebBillingAvailable] = useState<boolean | null>(null);
  /** Billing identity from user_plans; not used to infer RC Web Billing by placeholder prefix. */
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Start as true if phone hasn't changed
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [showDeleteAccountConfirm1, setShowDeleteAccountConfirm1] = useState(false);
  const [showDeleteAccountConfirm2, setShowDeleteAccountConfirm2] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: planData, error } = await supabase
          .from("user_plans")
          .select("billing_period, last_payment_source, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const plan = planData as
          | {
              billing_period?: string | null;
              last_payment_source?: string | null;
              stripe_customer_id?: string | null;
            }
          | null;

        if (error) {
          console.error("Error fetching plan:", error);
          setBillingPeriodLabel(null);
        } else {
          const bp = plan?.billing_period?.trim() || null;
          setBillingPeriodLabel(bp);
        }

        if (
          plan?.last_payment_source === "stripe" ||
          plan?.last_payment_source === "apple" ||
          plan?.last_payment_source === "google_play"
        ) {
          setLastPaymentSource(plan.last_payment_source);
        } else {
          setLastPaymentSource(null);
        }

        setStripeCustomerId(plan?.stripe_customer_id?.trim() || null);

        const refreshRcWebBillingStatus = () => {
          void resolveRevenueCatWebBillingStatus(user.id)
            .then(({ webBilling }) => setRcWebBillingAvailable(webBilling))
            .catch(() => setRcWebBillingAvailable(false));
        };
        refreshRcWebBillingStatus();
        window.setTimeout(refreshRcWebBillingStatus, 1500);

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('email_marketing, texts_enabled, data_training_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
        }

        // Fetch profile for phone number, username, and first name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, username, first_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          const profileData = profile as any;
          const currentPhone = profileData.phone || "";
          const currentUsername = profileData.username || "";
          const currentFirstName = profileData.first_name || "";
          setPhoneNumber(currentPhone);
          setOriginalPhoneNumber(currentPhone);
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
          setFirstName(currentFirstName);
          setOriginalFirstName(currentFirstName);
        }

        // Pending account deletion (30-day schedule)
        const { data: deletionRequest } = await supabase
          .from("account_deletion_requests")
          .select("requested_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (deletionRequest?.requested_at) {
          const d = new Date(deletionRequest.requested_at);
          d.setDate(d.getDate() + 30);
          setDeletionScheduledAt(d.toISOString());
        } else {
          setDeletionScheduledAt(null);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("toasts.enterPhone"));
      return;
    }

    setIsSendingCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsPhoneVerified(false);

    try {
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phoneNumber,
          message: t("profile.smsVerificationMessage", { code }),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send code');
      }

      toast.success(t("toasts.codeSent"));
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error(t("toasts.codeSendFailed"));
      setSentCode("");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      // Automatically save if phone number changed
      if (phoneNumber !== originalPhoneNumber) {
        await handleUpdateProfile();
      }
      setVerificationCode("");
      setSentCode("");
      toast.success(t("toasts.phoneVerified"));
    } else {
      toast.error(t("toasts.invalidCode"));
      setVerificationCode("");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error(t("toasts.usernameEmpty"));
      return;
    }
    
    // Check if phone number changed and needs verification
    if (phoneNumber !== originalPhoneNumber && !isPhoneVerified) {
      toast.error(t("toasts.verifyPhoneFirst"));
      return;
    }
    
    if (!user) {
      toast.error(t("toasts.userNotFound"));
      return;
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        first_name: firstName.trim() || null,
        phone: phoneNumber || null // Allow clearing phone number
      })
      .eq('id', user.id);

    if (profileError) {
      // Check if it's a unique constraint violation for username
      if (profileError.code === '23505' || profileError.message?.includes('unique') || profileError.message?.includes('duplicate')) {
        toast.error(t("toasts.usernameTaken"));
      } else {
        toast.error(t("toasts.profileUpdateError"));
        console.error(profileError);
      }
      return;
    }

    // Update auth.users phone if phone number was set
    if (phoneNumber && phoneNumber.trim()) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          phone: phoneNumber
        });
        if (authError) {
          console.warn('Could not update auth.users phone:', authError);
          // Don't fail the whole update if auth update fails
        }
      } catch (e) {
        console.warn('Error updating auth phone:', e);
      }
    }

    // Reset verification state after successful update
    setOriginalPhoneNumber(phoneNumber);
    setOriginalUsername(username.trim());
    setOriginalFirstName(firstName.trim());
    setIsPhoneVerified(true);
    setVerificationCode("");
    setSentCode("");

    toast.success(t("toasts.profileUpdated"));
  };

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!newPassword) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(newPassword);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(newPassword, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, newPassword]);

  const canChangePassword = 
    !!newPassword &&
    !!confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleChangePassword = async () => {
    // Validate password using shared validation
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      toast.error(translatePasswordError(passwordResult.error) || t("toasts.invalidPassword"));
      return;
    }

    // Validate password match
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      toast.error(translatePasswordError(matchResult.error) || t("passwordValidation.mismatch"));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(t("toasts.passwordUpdateError"));
    } else {
      toast.success(t("toasts.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  };


  const handleToggleMarketingSMS = async (enabled: boolean) => {
    setMarketingSMSEnabled(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          texts_enabled: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating marketing SMS preference:', error);
        // Revert on error
        setMarketingSMSEnabled(!enabled);
        toast.error(t("toasts.smsUpdateError"));
      } else {
        toast.success(enabled ? t("toasts.smsEnabled") : t("toasts.smsDisabled"));
      }
    }
  };

  const handleToggleDataTraining = async (enabled: boolean) => {
    const previous = dataTrainingOptIn;
    setDataTrainingOptIn(enabled);

    if (!user) {
      toast.error(t("toasts.loginRequired"));
      setDataTrainingOptIn(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        data_training_opt_in: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating data training preference:', error);
      setDataTrainingOptIn(previous);
      toast.error(t("toasts.dataTrainingError"));
    } else {
      toast.success(enabled ? t("toasts.dataTrainingEnabled") : t("toasts.dataTrainingDisabled"));
    }
  };

  const handleDeleteAccountRequest = () => setShowDeleteAccountConfirm1(true);
  const handleDeleteAccountConfirm1Close = () => setShowDeleteAccountConfirm1(false);
  const handleDeleteAccountConfirm1Continue = () => {
    setShowDeleteAccountConfirm1(false);
    setShowDeleteAccountConfirm2(true);
  };
  const handleDeleteAccountConfirm2Close = () => setShowDeleteAccountConfirm2(false);
  const handleDeleteAccountFinalConfirm = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      const result = data as { error?: string; scheduled_at?: string };
      if (result?.error) throw new Error(result.error);
      const scheduledAt = result?.scheduled_at ? new Date(result.scheduled_at) : null;
      const dateStr = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : t("deletion.scheduledFallback");
      setShowDeleteAccountConfirm2(false);
      await supabase.auth.signOut({ scope: "global" });
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
        }
      } catch {}
      navigate("/", { replace: true });
      toast.success(t("toasts.deletionScheduled", { date: dateStr }));
    } catch (e) {
      console.error("Account deletion failed:", e);
      toast.error(t("toasts.deletionFailed"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
        body: { cancel: true },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDeletionScheduledAt(null);
      toast.success(t("toasts.deletionCancelled"));
    } catch (e) {
      console.error("Cancel deletion failed:", e);
      toast.error(t("toasts.deletionCancelFailed"));
    }
  };

  const handleToggleEmailMarketing = async (enabled: boolean) => {
    setEmailMarketing(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_marketing: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating email marketing preference:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Revert on error
        setEmailMarketing(!enabled);
        const errorMessage = error.message || error.details || "";
        toast.error(t("toasts.emailPrefError", { message: errorMessage }));
      } else {
        toast.success(enabled ? t("toasts.emailEnabled") : t("toasts.emailDisabled"));
      }
    }
  };

  /**
   * Manage billing routing:
   *
   * - Apple keeps the original native RevenueCat subscription-management path.
   * - Android tries RevenueCat's management URL, then falls back to the Play subscriptions handoff.
   * - Stripe/RC web opens RevenueCat's management URL.
   */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error(t("toasts.billingLoginRequired"));
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await bootstrapRevenueCat(user.id);
    }
    await syncRevenueCatUILocale();
    console.info("[Settings][Billing] RC UI locale before manage billing", {
      locale: resolveRevenueCatUILocale(),
    });

    if (lastPaymentSource === "apple") {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && appleIAP.canManageBillingNatively) {
        try {
          await appleIAP.openSubscriptionManagement(user.id);
        } catch (err) {
          console.error("Manage billing:", err);
        }
        return;
      }

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        try {
          await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
        } catch (err) {
          console.error("Manage billing (Play):", err);
          toast.error(t("toasts.playSubscriptionsFailed"));
        }
        return;
      }

      toast.error(t("toasts.iosSubscriptionsHint"));
      return;
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      try {
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
      }

      try {
        await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
      } catch (err) {
        console.error("Manage billing (Play):", err);
        toast.error(t("toasts.playSubscriptionsFailed"));
      }
      return;
    }

    const isRcManagedBilling =
      lastPaymentSource === "stripe" ||
      rcWebBillingAvailable === true;

    if (isRcManagedBilling) {
      try {
        const portalToast = toast.loading(t("billing.openingPortal"));
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        toast.dismiss(portalToast);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
        toast.error(t("toasts.portalFailed"));
        return;
      }
    }

    toast.error(t("toasts.portalFailedFallback"));
  };


  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const billingOptionsLoading =
    !Capacitor.isNativePlatform() &&
    rcWebBillingAvailable === null &&
    lastPaymentSource !== "stripe" &&
    lastPaymentSource !== "apple";

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <div className="relative z-10">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
          <div>
            <h1
              className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
              onClick={() => navigate("/dashboard")}
            >
              {t("header")}
            </h1>
            {isMobile && <p className="text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            {/* PWA Browser Mobile Menu */}
            {isMobile && (
              <div className="md:hidden">
                {isMobile && (
              <div className="md:hidden">
                <MobilePWAMenu />
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "px-4 sm:px-6 max-w-4xl relative z-10",
          isMobile ? "pb-4" : "pb-20",
          !isMobile ? "pt-16" : "",
          !isMobile ? "" : "container mx-auto",
          isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
        )}
      >
        <div className="py-2 sm:py-3">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(theme === "dark" ? "grid w-full gap-1 p-1 rounded-lg border border-white/12 bg-transparent text-white mb-4" : "grid w-full mb-4", !isMobile ? "grid-cols-4" : "grid-cols-4")}>
            <TabsTrigger value="profile" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="settings" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.settings")}</TabsTrigger>
            <TabsTrigger value="billing" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="legal" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.legal")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent key={`profile-${localeKey}`} value="profile" className="space-y-2">
            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">{t("profile.nameLabel")}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">{t("profile.usernameLabel")}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.usernamePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">{t("profile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40", "!opacity-100 cursor-default") : "bg-muted opacity-100 cursor-default")}
                />
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone number field hidden for now */}
              {false && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">{t("profile.phoneLabel")}</Label>
                <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      // Reset verification if phone number changes
                      if (e.target.value !== originalPhoneNumber) {
                        setIsPhoneVerified(false);
                        setVerificationCode("");
                        setSentCode("");
                      } else {
                        setIsPhoneVerified(true);
                      }
                    }}
                  placeholder={t("profile.phonePlaceholder")}
                    className="flex-1 h-9"
                />
                  {phoneNumber && phoneNumber !== originalPhoneNumber && (
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !phoneNumber.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? t("profile.sendingCode") : t("profile.sendCode")}
                    </Button>
                  )}
                </div>

                {sentCode && !isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t("profile.codePlaceholder")}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        variant="outline"
                        className="h-9"
                      >
                        {t("profile.verify")}
                      </Button>
                    </div>
                    {!isPhoneVerified && (
                      <p className="text-xs text-muted-foreground">
                        {t("profile.verifyPhoneHint")}
                      </p>
                    )}
                  </div>
                )}

                {isPhoneVerified && phoneNumber === originalPhoneNumber && originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.phoneVerified")}</p>
                )}

                {isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.newPhoneVerified")}</p>
                )}
              </div>
              )}

              {(username.trim() !== originalUsername || firstName.trim() !== originalFirstName) && (
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full h-9"
                >
                <User className="mr-2 h-4 w-4" />
                  {t("profile.updateButton")}
              </Button>
              )}
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                {t("profile.changePasswordHeading")}
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-sm">{t("profile.currentPasswordLabel")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">{t("profile.newPasswordLabel")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", passwordError && "border-destructive")}
                  />
                  {isValidatingPassword && (
                    <p className="text-xs text-muted-foreground">{t("profile.validatingPassword")}</p>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(passwordError)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-sm">{t("profile.confirmPasswordLabel")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(confirmPasswordError)}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                variant="ghost"
                className={cn("w-full h-9", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                disabled={!canChangePassword}
              >
                {t("profile.changePasswordButton")}
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold text-sm sm:text-base">{t("language.heading")}</h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("language.description")}
              </p>
              <LanguageSwitcher
                persistToAccount
                variant="default"
                className="justify-start"
              />
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Zap className="h-4 w-4" />
                {t("preferences.routineHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.routineDescription")}
              </p>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-3",
                  theme === "dark" && "border-white/12 bg-transparent hover:bg-white/[0.06]",
                )}
                onClick={() => navigate("/dashboard/settings/manifestation-routine")}
              >
                <span className="text-left">
                  <span className="block font-medium">{t("preferences.routineButtonTitle")}</span>
                  <span
                    className={cn(
                      "block text-xs font-normal mt-0.5",
                      theme === "dark" ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
                    {t("preferences.routineButtonSubtitle")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.emailHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.emailDescription")}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">{t("preferences.emailMarketingLabel")}</Label>
                  <Switch 
                    id="email-marketing"
                    checked={emailMarketing}
                    onCheckedChange={handleToggleEmailMarketing}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between hidden">
                  <Label htmlFor="text-marketing">{t("preferences.textMarketingLabel")}</Label>
                  <Switch 
                    id="text-marketing"
                    checked={marketingSMSEnabled}
                    onCheckedChange={handleToggleMarketingSMS}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.dataTrainingHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.dataTrainingDescription")}
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-training-opt-in">{t("preferences.dataTrainingLabel")}</Label>
                <Switch
                  id="data-training-opt-in"
                  checked={dataTrainingOptIn}
                  onCheckedChange={handleToggleDataTraining}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3", "border-destructive/30")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("deletion.heading")}
              </h3>
              {deletionScheduledAt ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.scheduledPrefix")}{" "}
                    {new Date(deletionScheduledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.{" "}
                    {t("deletion.scheduledSuffix")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                  >
                    {t("deletion.cancelRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.description")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleDeleteAccountRequest}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deletion.deleteButton")}
                  </Button>
                </>
              )}
            </Card>

            <Dialog open={showDeleteAccountConfirm1} onOpenChange={setShowDeleteAccountConfirm1}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm1Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm1Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm1Close}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountConfirm1Continue}>{t("common:continue")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteAccountConfirm2} onOpenChange={setShowDeleteAccountConfirm2}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm2Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm2Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm2Close} disabled={isDeletingAccount}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountFinalConfirm} disabled={isDeletingAccount}>
                    {isDeletingAccount ? t("deletion.deleting") : t("deletion.deleteButton")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Billing Tab */}
          <TabsContent key={`billing-${localeKey}`} value="billing" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                {t("billing.subscriptionHeading")}
              </h3>
              
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.currentPlan")}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {billingPeriodLabel === "monthly"
                      ? t("billing.planMonthly")
                      : billingPeriodLabel === "annual"
                        ? t("billing.planAnnual")
                        : billingPeriodLabel === "weekly"
                          ? t("billing.planWeekly")
                          : billingPeriodLabel ?? ""}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.billingHeading")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.billingDescription")}
                  </p>
                </div>

                {billingOptionsLoading ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.loadingOptions")}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.portalHint")}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent key={`legal-${localeKey}`} value="legal" className="space-y-3">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3"}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                {t("legal.heading")}
              </h3>
              {t("legalDisclaimer") ? (
                <p className={cn("text-xs mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("legalDisclaimer")}
                </p>
              ) : null}

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/faq")}
                >
                  {t("legal.faq")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalTermsPath(localeKey))}
                >
                  {t("legal.terms")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalPrivacyPath(localeKey))}
                >
                  {t("legal.privacy")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/acceptable-use")}
                >
                  {t("legal.acceptableUse")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("legal.billingRefunds")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dmca")}
                >
                  {t("legal.dmca")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/eula")}
                >
                  {t("legal.eula")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  {t("legal.contact")}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

```

---

## FILE: src/pages/ManifestationRoutineSettings.tsx

```tsx
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
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import i18n from "@/i18n";
import { resolveAppLocale, type AppLocale } from "@/lib/locale";
import {
  bootstrapOneSignal,
  oneSignalLogin,
  optInOneSignalPush,
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncManifestationRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";

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
  manifestation_intensity?: string | null;
  manifest_routine_items?: unknown;
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
  const intensityRaw = prefs?.manifestation_intensity ?? profile?.manifestation_intensity;
  const intensity = isIntensityId(intensityRaw) ? intensityRaw : "consistent";

  const prefsItems = parseRoutineItems(prefs?.manifest_routine_items);
  const profileItems = parseRoutineItems(profile?.manifest_routine_items);
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
    isIntensityId(prefs?.manifestation_intensity) || isIntensityId(profile?.manifestation_intensity);
  if (hasIntensity) return false;

  const hasItems =
    parseRoutineItems(prefs?.manifest_routine_items).length > 0 ||
    parseRoutineItems(profile?.manifest_routine_items).length > 0;
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
      slug: "affirmations",
      label: labelForSlug("affirmations"),
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
    if (item.slug === "affirmations") {
      return {
        ...item,
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 5 : 3,
      };
    }
    if (item.slug === "subliminals") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 7 : intensity === "consistent" ? 4 : 2,
      };
    }
    if (item.slug === "mirror_work") {
      return {
        ...item,
        cadence: intensity === "light" ? "weekly" : "daily",
        target_per_week: intensity === "locked_in" ? 5 : intensity === "consistent" ? 3 : 1,
      };
    }
    return item;
  });
}

export default function ManifestationRoutineSettings() {
  const { t } = useTranslation("settings");
  const routineItemLabel = (slug: string) => t(`routine.itemLabels.${slug}`);
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });
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
              "manifestation_intensity, manifest_routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
            )
            .eq("user_id", user.id)
            .maybeSingle(),
          (supabase as any)
            .from("profiles")
            .select(
              "manifestation_intensity, manifest_routine_items, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone",
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
            console.error("[ManifestationRoutineSettings] legacy notif reset failed:", err);
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
        console.error("[ManifestationRoutineSettings] load failed:", e);
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
        "[ManifestationRoutineSettings] persist timezone failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncManifestationRoutineOneSignalTags({
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
        "[ManifestationRoutineSettings] persist alert times failed:",
        prefsError ?? profileError,
      );
    }
    if (ok && Capacitor.isNativePlatform() && appNotificationsEnabled) {
      void syncManifestationRoutineOneSignalTags({
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
      manifestation_intensity: intensity,
      manifest_routine_items: effectiveItems,
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
          "[ManifestationRoutineSettings] toggle off upsert failed:",
          prefsError ?? profileError,
        );
        toast.error(t("toasts.routineNotifUpdateFailed"));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        void syncManifestationRoutineOneSignalTags({
          intensity,
          preferredLocale,
          notificationsEnabled: false,
          permissionStatus,
          alertTimes: [],
        }).catch((err) => {
          console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
        });
      }

      toast.success(t("toasts.routineNotifOff"));
      return;
    }

    const detectedTz = readDeviceTimeZone();
    setTimeZone(detectedTz);

    if (Capacitor.isNativePlatform()) {
      try {
        const appId = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
        console.info("[ManifestationRoutineSettings][OneSignal] toggle-on start", {
          appIdPresent: !!(appId && appId.trim()),
        });

        await bootstrapOneSignal();
        console.info("[ManifestationRoutineSettings][OneSignal] bootstrap succeeded");

        await oneSignalLogin(user.id);
        console.info("[ManifestationRoutineSettings][OneSignal] login succeeded", {
          userId: user.id,
        });

        await syncOneSignalUserLanguage(preferredLocale);
        console.info("[ManifestationRoutineSettings][OneSignal] language synced", {
          locale: preferredLocale,
        });

        const priorPermission = permissionStatus;
        console.info("[ManifestationRoutineSettings][OneSignal] permission before request", {
          priorPermission,
        });

        const granted = await requestOneSignalPushPermission(true);
        console.info("[ManifestationRoutineSettings][OneSignal] permission result", { granted });

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
            console.error(
              "[ManifestationRoutineSettings] denied upsert failed:",
              prefsError ?? profileError,
            );
          }
          void syncManifestationRoutineOneSignalTags({
            intensity,
            notificationsEnabled: false,
            permissionStatus: "denied",
            alertTimes: [],
          }).catch((err) => {
            console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
          });
          toast.error(
            priorPermission === "denied"
              ? t("toasts.routineNotifDeniedIos")
              : t("toasts.routineNotifDenied"),
          );
          return;
        }

        const optedIn = await optInOneSignalPush();
        console.info("[ManifestationRoutineSettings][OneSignal] push subscription opted in", {
          optedIn,
        });

        if (!optedIn) {
          setAppNotificationsEnabled(false);
          setPermissionStatus("skipped");
          toast.error(t("toasts.routineNotifPermissionFailed"));
          return;
        }

        setPermissionStatus("granted");
        const [{ error: prefsError }, { error: profileError }] = await Promise.all([
          (supabase as any).from("user_preferences").upsert(
            {
              user_id: user.id,
              ...routineBase,
              app_notifications_enabled: true,
              notification_permission_status: "granted",
              timezone: detectedTz,
            },
            { onConflict: "user_id" },
          ),
          (supabase as any).from("profiles").upsert(
            {
              id: user.id,
              ...routineBase,
              app_notifications_enabled: true,
              notification_permission_status: "granted",
              timezone: detectedTz,
            },
            { onConflict: "id" },
          ),
        ]);

        if (prefsError || profileError) {
          setAppNotificationsEnabled(previous);
          console.error(
            "[ManifestationRoutineSettings][OneSignal] Supabase upserts failed:",
            prefsError ?? profileError,
          );
          toast.error(t("toasts.routineNotifUpdateFailed"));
          return;
        }

        setSavedIntensity(intensity);
        setRoutineItems(effectiveItems);
        setAlertTimes(effectiveTimes);

        try {
          await syncManifestationRoutineOneSignalTags({
            intensity,
            preferredLocale,
            notificationsEnabled: true,
            permissionStatus: "granted",
            alertTimes: effectiveTimes,
            timezone: detectedTz,
          });
          console.info("[ManifestationRoutineSettings][OneSignal] tag sync succeeded");
        } catch (tagErr) {
          console.error("[ManifestationRoutineSettings][OneSignal] tag sync failed:", tagErr);
        }

        console.info("[ManifestationRoutineSettings][OneSignal] Supabase upserts succeeded");

        toast.success(t("toasts.routineNotifOn"));
        return;
      } catch (err) {
        setAppNotificationsEnabled(previous);
        console.error("[ManifestationRoutineSettings] permission request failed:", err);
        toast.error(t("toasts.routineNotifPermissionFailed"));
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
        "[ManifestationRoutineSettings] web toggle on upsert failed:",
        prefsError ?? profileError,
      );
      toast.error(t("toasts.routineNotifUpdateFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(effectiveItems);
    setAlertTimes(effectiveTimes);

    if (Capacitor.isNativePlatform()) {
      void syncManifestationRoutineOneSignalTags({
        intensity,
        preferredLocale,
        notificationsEnabled: true,
        permissionStatus: permissionStatus ?? "skipped",
        alertTimes: effectiveTimes,
        timezone: timeZone,
      }).catch((err) => {
        console.error("[ManifestationRoutineSettings] OneSignal tag sync failed:", err);
      });
    }

    toast.success(t("toasts.routineNotifOn"));
  };

  const handleSaveIntensity = async () => {
    if (!user || saving) return;
    setSaving(true);
    const nextRoutine = routineItemsForIntensity(intensity, routineItems, routineItemLabel);

    const routinePatch = {
      manifestation_intensity: intensity,
      manifest_routine_items: nextRoutine,
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
      console.error("[ManifestationRoutineSettings] save intensity failed:", prefsError ?? profileError);
      toast.error(t("toasts.routineIntensitySaveFailed"));
      return;
    }

    setSavedIntensity(intensity);
    setRoutineItems(nextRoutine);

    if (Capacitor.isNativePlatform()) {
      void syncManifestationRoutineOneSignalTags({
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
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className={cn(isMobile ? "flex-1 flex flex-col min-h-0" : "min-h-screen", "flex flex-col")}
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
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
                  left: sidebarCollapsed ? "64px" : "256px",
                  transition: "left 300ms ease-in-out",
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
```

---

## FILE: src/services/oneSignal.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import OneSignal from "@onesignal/capacitor-plugin";
import { toast } from "sonner";
import {
  detectInitialAppLocale,
  oneSignalLanguageForApp,
  type AppLocale,
} from "@/lib/locale";

let hasInitialized = false;
let listenersAttached = false;

function getOneSignalAppId(): string | null {
  const id = import.meta.env.VITE_ONESIGNAL_APP_ID as string | undefined;
  if (!id) return null;
  const trimmed = id.trim();
  return trimmed ? trimmed : null;
}

/** TikTok / paid social: paletteplotting://welcome?utm_source=tiktok&ttclid=? ? onboarding welcome. */
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

export async function bootstrapOneSignal(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  if (hasInitialized) return;

  const appId = getOneSignalAppId();
  if (!appId) {
    console.warn("[OneSignal] Missing VITE_ONESIGNAL_APP_ID; skipping initialize.");
    return;
  }

  await OneSignal.initialize({ appId });
  hasInitialized = true;
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
  if (!appId || !hasInitialized) {
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
export async function syncManifestationRoutineOneSignalTags(opts: {
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
    manifestation_intensity: opts.intensity,
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


```

---

## FILE: src/components/LanguageSwitcher.tsx

```tsx
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LANGUAGE_SWITCHER_OPTIONS,
  resolveAppLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { syncRevenueCatUILocale } from "@/services/revenueCat";
import { syncOneSignalUserLanguage } from "@/services/oneSignal";

type LanguageSwitcherProps = {
  className?: string;
  /** Persist to Supabase when user is logged in (e.g. Settings). */
  persistToAccount?: boolean;
  /** Welcome cosmic shell uses light-on-dark labels. */
  variant?: "welcome" | "default";
};

/**
 * Inline locale control — not a dedicated page. Labels stay English | Español | Português.
 */
export function LanguageSwitcher({
  className,
  persistToAccount,
  variant = "welcome",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = resolveAppLocale(i18n.resolvedLanguage || i18n.language);

  const onSelect = async (locale: AppLocale) => {
    if (locale === current) return;

    writeStoredPreferredLocale(locale);
    await setAppLocale(locale);
    void writeSetupDraft({ locale });

    await Promise.allSettled([
      syncRevenueCatUILocale(),
      syncOneSignalUserLanguage(locale),
    ]);

    if (persistToAccount) {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;

      const [prefsRes, profileRes] = await Promise.all([
        supabase.from("user_preferences").upsert(
          { user_id: userId, preferred_locale: locale },
          { onConflict: "user_id" },
        ),
        supabase.from("profiles").upsert(
          { id: userId, preferred_locale: locale },
          { onConflict: "id" },
        ),
      ]);

      if (prefsRes.error || profileRes.error) {
        console.error(
          "[LanguageSwitcher] failed to persist locale:",
          prefsRes.error ?? profileRes.error,
        );
      }
    }
  };

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs", className)}
      role="group"
      aria-label="Language"
    >
      {LANGUAGE_SWITCHER_OPTIONS.map((opt, index) => (
        <span key={opt.code} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span
              className={variant === "welcome" ? "text-white/35" : "text-muted-foreground/50"}
              aria-hidden
            >
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void onSelect(opt.code)}
            aria-pressed={current === opt.code}
            className={cn(
              "relative z-10 min-h-11 min-w-[4.5rem] cursor-pointer touch-manipulation px-2 py-2 font-sans transition-colors",
              variant === "welcome"
                ? current === opt.code
                  ? "font-semibold text-white"
                  : "font-medium text-white/55 hover:text-white/80"
                : current === opt.code
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
```

---

## FILE: src/lib/locale.ts

```typescript
import { enUS, es, ptBR, type Locale } from "date-fns/locale";

/** Supported app UI locales. English strings are the source of truth in JSON. */
export type AppLocale = "en" | "es-419" | "pt-BR";

export const APP_LOCALES: readonly AppLocale[] = ["en", "es-419", "pt-BR"] as const;

export const PREFERRED_LOCALE_STORAGE_KEY = "sv_preferred_locale";

/** Inline switcher labels ? always shown in these forms (not translated). */
export const LANGUAGE_SWITCHER_OPTIONS: { code: AppLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es-419", label: "Espa�ol" },
  { code: "pt-BR", label: "Portugu�s" },
];

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

/** Canonical app locale from i18n.language / resolvedLanguage (es ? es-419, pt ? pt-BR). */
export function resolveAppLocale(raw: string | null | undefined): AppLocale {
  if (raw && isAppLocale(raw)) return raw;
  return mapDeviceLocaleToAppLocale(raw);
}

/** Map device / browser locale to a supported app locale. */
export function mapDeviceLocaleToAppLocale(raw: string | null | undefined): AppLocale {
  const tag = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (!tag) return "en";
  if (tag === "en" || tag.startsWith("en-")) return "en";
  if (tag === "es-419" || tag.startsWith("es")) return "es-419";
  if (tag === "pt-br" || tag.startsWith("pt")) return "pt-BR";
  return "en";
}

export function readStoredPreferredLocale(): AppLocale | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY);
  return stored && isAppLocale(stored) ? stored : null;
}

export function writeStoredPreferredLocale(locale: AppLocale): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, locale);
}

/** Locale to send on AI edge-function calls (stored pref ? draft ? device). */
export function resolveLocaleForApi(draftLocale?: string | null): AppLocale {
  const stored = readStoredPreferredLocale();
  if (stored) return stored;
  if (draftLocale && isAppLocale(draftLocale)) return draftLocale;
  return detectInitialAppLocale();
}

/** date-fns locale for formatting month/day labels in the active app language. */
export function dateFnsLocaleForApp(locale: AppLocale): Locale {
  switch (locale) {
    case "es-419":
      return es;
    case "pt-BR":
      return ptBR;
    default:
      return enUS;
  }
}

/**
 * RevenueCat paywall locale ? must match locale keys in the RC paywall Localization tab.
 * @see https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/localization
 */
export function revenueCatUILocaleForApp(locale: AppLocale): string {
  switch (locale) {
    case "es-419":
      return "es-419";
    case "pt-BR":
      return "pt-BR";
    default:
      return "en";
  }
}

/** URL segment for localized legal pages (RevenueCat / App Store / public web). */
export type LegalRouteLocale = "ES" | "PT" | "DE" | "FR" | "IT" | "NL" | "ZH" | "AR";

export const LEGAL_ROUTE_LOCALES: readonly LegalRouteLocale[] = [
  "ES",
  "PT",
  "DE",
  "FR",
  "IT",
  "NL",
  "ZH",
  "AR",
] as const;

export function isLegalRouteLocale(value: string): value is LegalRouteLocale {
  return (LEGAL_ROUTE_LOCALES as readonly string[]).includes(value);
}

export function appLocaleToLegalRouteLocale(locale: AppLocale): LegalRouteLocale | null {
  if (locale === "es-419") return "ES";
  if (locale === "pt-BR") return "PT";
  return null;
}

export const LEGAL_SITE_ORIGIN = "https://paletteplot.com";

export function legalTermsPath(locale: AppLocale): string {
  const suffix = appLocaleToLegalRouteLocale(locale);
  return suffix ? `/terms/${suffix}` : "/terms";
}

export function legalPrivacyPath(locale: AppLocale): string {
  const suffix = appLocaleToLegalRouteLocale(locale);
  return suffix ? `/privacy/${suffix}` : "/privacy";
}

export function legalTermsUrl(locale: AppLocale): string {
  return `${LEGAL_SITE_ORIGIN}${legalTermsPath(locale)}`;
}

export function legalPrivacyUrl(locale: AppLocale): string {
  return `${LEGAL_SITE_ORIGIN}${legalPrivacyPath(locale)}`;
}

/** OneSignal subscription language (2-letter) for push template selection. */
export function oneSignalLanguageForApp(locale: AppLocale): string {
  if (locale === "es-419") return "es";
  if (locale === "pt-BR") return "pt";
  return "en";
}

export function detectInitialAppLocale(): AppLocale {
  const stored = readStoredPreferredLocale();
  if (stored) return stored;
  const draftRaw =
    typeof localStorage !== "undefined" ? localStorage.getItem("sv_setup_draft_v1") : null;
  if (draftRaw) {
    try {
      const draft = JSON.parse(draftRaw) as { locale?: string };
      if (draft.locale && isAppLocale(draft.locale)) return draft.locale;
    } catch {
      /* ignore */
    }
  }
  const nav =
    typeof navigator !== "undefined"
      ? navigator.language || (navigator.languages && navigator.languages[0])
      : null;
  return mapDeviceLocaleToAppLocale(nav);
}

```

---

## FILE: src/i18n/index.ts

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialAppLocale, resolveAppLocale, type AppLocale } from "@/lib/locale";

import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enOnboardingBase from "./locales/en/onboarding.json";
import enOnboardingReadAffirmations from "./locales/en/onboardingReadAffirmations.json";
import enSettings from "./locales/en/settings.json";
import enAuth from "./locales/en/auth.json";
import enPaywall from "./locales/en/paywall.json";
import enTools from "./locales/en/tools.json";
import enSupport from "./locales/en/support.json";
import enMarketingBase from "./locales/en/marketing.json";
import enMarketingManifestationQuiz from "./locales/en/marketingManifestationQuiz.json";
import enMarketingWhatIs from "./locales/en/marketingWhatIs.json";

import esCommon from "./locales/es-419/common.json";
import esDashboard from "./locales/es-419/dashboard.json";
import esOnboardingBase from "./locales/es-419/onboarding.json";
import esOnboardingReadAffirmations from "./locales/es-419/onboardingReadAffirmations.json";
import esSettings from "./locales/es-419/settings.json";
import esAuth from "./locales/es-419/auth.json";
import esPaywall from "./locales/es-419/paywall.json";
import esTools from "./locales/es-419/tools.json";
import esSupport from "./locales/es-419/support.json";
import esMarketingBase from "./locales/es-419/marketing.json";
import esMarketingManifestationQuiz from "./locales/es-419/marketingManifestationQuiz.json";
import esMarketingWhatIs from "./locales/es-419/marketingWhatIs.json";

import ptCommon from "./locales/pt-BR/common.json";
import ptDashboard from "./locales/pt-BR/dashboard.json";
import ptOnboardingBase from "./locales/pt-BR/onboarding.json";
import ptOnboardingReadAffirmations from "./locales/pt-BR/onboardingReadAffirmations.json";
import ptSettings from "./locales/pt-BR/settings.json";
import ptAuth from "./locales/pt-BR/auth.json";
import ptPaywall from "./locales/pt-BR/paywall.json";
import ptTools from "./locales/pt-BR/tools.json";
import ptSupport from "./locales/pt-BR/support.json";
import ptMarketingBase from "./locales/pt-BR/marketing.json";
import ptMarketingManifestationQuiz from "./locales/pt-BR/marketingManifestationQuiz.json";
import ptMarketingWhatIs from "./locales/pt-BR/marketingWhatIs.json";

import frMarketingBase from "./locales/fr/marketing.json";
import frMarketingManifestationQuiz from "./locales/fr/marketingManifestationQuiz.json";
import frMarketingWhatIs from "./locales/fr/marketingWhatIs.json";
import deMarketingBase from "./locales/de/marketing.json";
import deMarketingManifestationQuiz from "./locales/de/marketingManifestationQuiz.json";
import deMarketingWhatIs from "./locales/de/marketingWhatIs.json";
import itMarketingBase from "./locales/it/marketing.json";
import itMarketingManifestationQuiz from "./locales/it/marketingManifestationQuiz.json";
import itMarketingWhatIs from "./locales/it/marketingWhatIs.json";
import zhMarketingBase from "./locales/zh-Hans/marketing.json";
import zhMarketingManifestationQuiz from "./locales/zh-Hans/marketingManifestationQuiz.json";
import zhMarketingWhatIs from "./locales/zh-Hans/marketingWhatIs.json";
import nlMarketingBase from "./locales/nl/marketing.json";
import nlMarketingManifestationQuiz from "./locales/nl/marketingManifestationQuiz.json";
import nlMarketingWhatIs from "./locales/nl/marketingWhatIs.json";
import arMarketingBase from "./locales/ar/marketing.json";
import arMarketingManifestationQuiz from "./locales/ar/marketingManifestationQuiz.json";
import arMarketingWhatIs from "./locales/ar/marketingWhatIs.json";

const enOnboarding = {
  ...enOnboardingBase,
  setup: {
    ...enOnboardingBase.setup,
    readAffirmations: enOnboardingReadAffirmations,
  },
};
const esOnboarding = {
  ...esOnboardingBase,
  setup: {
    ...esOnboardingBase.setup,
    readAffirmations: esOnboardingReadAffirmations,
  },
};
const ptOnboarding = {
  ...ptOnboardingBase,
  setup: {
    ...ptOnboardingBase.setup,
    readAffirmations: ptOnboardingReadAffirmations,
  },
};

const enMarketing = {
  ...enMarketingBase,
  manifestationQuiz: enMarketingManifestationQuiz,
  whatIsPalettePlotting: enMarketingWhatIs,
};
const esMarketing = {
  ...esMarketingBase,
  manifestationQuiz: esMarketingManifestationQuiz,
  whatIsPalettePlotting: esMarketingWhatIs,
};
const ptMarketing = {
  ...ptMarketingBase,
  manifestationQuiz: ptMarketingManifestationQuiz,
  whatIsPalettePlotting: ptMarketingWhatIs,
};
const frMarketing = {
  ...frMarketingBase,
  manifestationQuiz: frMarketingManifestationQuiz,
  whatIsPalettePlotting: frMarketingWhatIs,
};
const deMarketing = {
  ...deMarketingBase,
  manifestationQuiz: deMarketingManifestationQuiz,
  whatIsPalettePlotting: deMarketingWhatIs,
};
const itMarketing = {
  ...itMarketingBase,
  manifestationQuiz: itMarketingManifestationQuiz,
  whatIsPalettePlotting: itMarketingWhatIs,
};
const zhMarketing = {
  ...zhMarketingBase,
  manifestationQuiz: zhMarketingManifestationQuiz,
  whatIsPalettePlotting: zhMarketingWhatIs,
};
const nlMarketing = {
  ...nlMarketingBase,
  manifestationQuiz: nlMarketingManifestationQuiz,
  whatIsPalettePlotting: nlMarketingWhatIs,
};
const arMarketing = {
  ...arMarketingBase,
  manifestationQuiz: arMarketingManifestationQuiz,
  whatIsPalettePlotting: arMarketingWhatIs,
};

const resources = {
  en: { common: enCommon, dashboard: enDashboard, onboarding: enOnboarding, settings: enSettings, auth: enAuth, paywall: enPaywall, tools: enTools, support: enSupport, marketing: enMarketing },
  "es-419": { common: esCommon, dashboard: esDashboard, onboarding: esOnboarding, settings: esSettings, auth: esAuth, paywall: esPaywall, tools: esTools, support: esSupport, marketing: esMarketing },
  "pt-BR": { common: ptCommon, dashboard: ptDashboard, onboarding: ptOnboarding, settings: ptSettings, auth: ptAuth, paywall: ptPaywall, tools: ptTools, support: ptSupport, marketing: ptMarketing },
  fr: { marketing: frMarketing },
  de: { marketing: deMarketing },
  it: { marketing: itMarketing },
  "zh-Hans": { marketing: zhMarketing },
  nl: { marketing: nlMarketing },
  ar: { marketing: arMarketing },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialAppLocale(),
  supportedLngs: ["en", "es-419", "pt-BR", "fr", "de", "it", "zh-Hans", "nl", "ar"],
  nonExplicitSupportedLngs: false,
  fallbackLng: {
    "es-MX": ["es-419", "en"],
    "es-ES": ["es-419", "en"],
    es: ["es-419", "en"],
    pt: ["pt-BR", "en"],
    fr: ["en"],
    de: ["en"],
    it: ["en"],
    "zh-Hans": ["en"],
    nl: ["en"],
    ar: ["en"],
    default: ["en"],
  },
  defaultNS: "common",
  ns: ["common", "dashboard", "onboarding", "settings", "auth", "paywall", "tools", "support", "marketing"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false, bindI18n: "languageChanged loaded" },
});

export async function setAppLocale(locale: AppLocale): Promise<void> {
  const active = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  if (active === locale) return;
  await i18n.changeLanguage(locale);
}

export default i18n;
```

---

## FILE: src/lib/onboardingSetupTheme.ts

```typescript
import { WELCOME_DEEP_BLACK_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { cn } from "@/lib/utils";

/** Fixed mobile footer ? Welcome Sign In/Sign Up matches Setup Back/Continue. */
export const MOBILE_SETUP_FOOTER_STYLE = {
  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
  backgroundColor: WELCOME_DEEP_BLACK_BASE,
} as const;

/** Matches Welcome primary CTA ? shared across setup + account step. */
export const SETUP_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

export const SETUP_BACK_CTA_CLASS =
  "flex-1 h-14 rounded-xl border border-white/20 !bg-white/10 font-sans text-base font-medium !text-white hover:!bg-white/15 active:!bg-white/15 focus:!bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0";

/** Native/mobile setup footer ? same height + shape as SetupPage (h-14, not h-12). */
export const SETUP_NATIVE_CONTINUE_BTN_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "flex-1 h-14 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
);

export const SETUP_NATIVE_BACK_BTN_CLASS = cn(
  SETUP_BACK_CTA_CLASS,
  "outline-none transition-none select-none disabled:opacity-50 disabled:cursor-not-allowed",
);

export const SETUP_HEADING_TITLE_CLASS =
  "font-welcome-serif text-[28px] font-normal leading-[1.12] tracking-[-0.02em] text-white sm:text-[32px] sm:leading-[1.08]";

export const SETUP_HEADING_SUBTITLE_CLASS = "text-sm text-white/55 pl-0";

export const SETUP_LABEL_CLASS = "font-sans text-sm font-medium text-white/70";

export const SETUP_MUTED_TEXT_CLASS = "font-sans text-sm text-white/50";

export const SETUP_FIELD_CLASS =
  "h-12 rounded-2xl border-white/15 bg-white/95 text-zinc-900 placeholder:text-zinc-400 scroll-mt-3 focus-visible:ring-white/30";

export const SETUP_TEXTAREA_CLASS =
  "min-h-[140px] rounded-2xl border-white/15 bg-white/95 text-zinc-900 placeholder:text-zinc-400 scroll-mt-3 focus-visible:ring-white/30 focus-visible:ring-offset-0";

/** Milky card fill (path-ready panels) ? blocks speckle bleed on setup choice tiles. */
export const SETUP_CHOICE_TILE_GLASS_FILL =
  "bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md";

function setupChoiceTileSurface(active: boolean): string {
  return cn(
    SETUP_CHOICE_TILE_GLASS_FILL,
    active ? "border-white/30" : "border-white/12",
  );
}

export function setupChoiceTileClass(active: boolean): string {
  return cn(
    "transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
    active && "ring-1 ring-white/20 border-white/25",
  );
}

/** Soft white glow on selected setup choice tiles (conditional, embody, notifications, etc.). */
export const SETUP_CHOICE_TILE_SELECTED_GLOW = "0 0 3px rgba(255,255,255,0.08)";

export function setupChoiceTileWithGlowClass(active: boolean): string {
  return cn(
    "w-full rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
  );
}

/** Label left, checkmark right ? no leading icon (reminders, conditional Q). */
export function setupTextChoiceTileClass(active: boolean): string {
  return cn(
    "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
  );
}

/** Icon + label choice rows (embody, tool preference). */
export function setupIconChoiceTileClass(active: boolean): string {
  return cn(
    "w-full rounded-2xl border px-4 py-4 text-left flex items-center justify-between gap-3 transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
  );
}

export const SETUP_GLASS_PANEL_CLASS =
  "rounded-2xl border border-white/12 bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md";

export const SETUP_PROGRESS_TRACK_CLASS = "h-2.5 rounded-full bg-white/15 overflow-hidden";

export const SETUP_PROGRESS_FILL_CLASS =
  "h-full rounded-full bg-white/90 transition-all duration-300 ease-out";

/** Platinum stars ? matches Welcome award line. */
export const SETUP_TESTIMONIAL_STAR_CLASS = "h-3 w-3 shrink-0 fill-[#d4d4d8] text-[#e4e4e7]";

export const SETUP_DESKTOP_CHEVRON_CLASS =
  "fixed z-50 p-3 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-200";

```

---

## FILE: src/lib/onboardingBottomSceneRoutes.ts

```typescript
/** Setup pages that show the low bottom-scene overlay (fixed, non-layout-affecting). */
export const ONBOARDING_BOTTOM_SCENE_ROUTES = [
  "/onboarding/setup/name",
  "/onboarding/setup/desire-category",
  "/onboarding/setup/conditional-specificity",
  "/onboarding/setup/current-friction",
  "/onboarding/setup/affirmations",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/manifestation-intensity",
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/plot-loading",
] as const;

export function shouldShowSetupBottomScene(pathname: string): boolean {
  const path = pathname.replace(/\/$/, "") || "/";
  if ((ONBOARDING_BOTTOM_SCENE_ROUTES as readonly string[]).includes(path)) return true;
  if (!path.startsWith("/onboarding/suite/setup/")) return false;
  const suffix = path.slice("/onboarding/suite/setup/".length);
  return ONBOARDING_BOTTOM_SCENE_ROUTES.some((r) => r.endsWith(`/${suffix}`));
}

```

---

## FILE: src/components/RoutineTimeZoneSelect.tsx

```tsx
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { readDeviceTimeZone } from "@/services/oneSignal";

const FALLBACK_TIME_ZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Phoenix",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
] as const;

function listTimeZones(): string[] {
  try {
    const intl = Intl as typeof Intl & { supportedValuesOf?: (key: string) => string[] };
    if (typeof intl.supportedValuesOf === "function") {
      return intl.supportedValuesOf("timeZone");
    }
  } catch {
    /* ignore */
  }
  return [...FALLBACK_TIME_ZONES];
}

function formatTimeZoneLabel(tz: string): string {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      timeZoneName: "shortOffset",
    }).formatToParts(new Date());
    const offset = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
    const label = tz.replace(/_/g, " ");
    return offset ? `${label} (${offset})` : label;
  } catch {
    return tz.replace(/_/g, " ");
  }
}

type RoutineTimeZoneSelectProps = {
  value: string;
  onChange: (timeZone: string) => void;
  disabled?: boolean;
  dark?: boolean;
  id?: string;
};

export function RoutineTimeZoneSelect({
  value,
  onChange,
  disabled,
  dark = true,
  id = "routine-timezone",
}: RoutineTimeZoneSelectProps) {
  const { t } = useTranslation("settings");
  const deviceZone = useMemo(() => readDeviceTimeZone(), []);
  const options = useMemo(() => {
    const all = listTimeZones();
    const pinned = [deviceZone, value].filter(
      (tz, index, arr) => tz && arr.indexOf(tz) === index,
    );
    const rest = all.filter((tz) => !pinned.includes(tz));
    return [...pinned, ...rest];
  }, [deviceZone, value]);

  return (
    <div className="flex min-w-0 w-full items-center justify-between gap-3">
      <label
        htmlFor={id}
        className={cn("shrink-0 text-sm font-normal", dark ? "text-white/85" : "text-foreground")}
      >
        {t("preferences.timeZoneLabel")}
      </label>
      <select
        id={id}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cn(
          "min-w-0 max-w-[14rem] flex-1 truncate rounded-lg border px-2 py-1.5 font-sans text-sm",
          dark
            ? "border-white/15 bg-white/10 text-white [color-scheme:dark]"
            : "border-border bg-background text-foreground",
        )}
      >
        {options.map((tz) => (
          <option key={tz} value={tz}>
            {formatTimeZoneLabel(tz)}
          </option>
        ))}
      </select>
    </div>
  );
}

```

---

## FILE: supabase/functions/send-routine-push-notifications/index.ts

```typescript
/**
 * Server-side routine push scheduler (Supabase cron + CRON_SECRET).
 * Sends at each user's chosen HH:mm times in their IANA timezone ? not fixed global slots.
 * App stores routine_notification_times + timezone; OneSignal tags are for debug/segmentation only.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { multilingualRoutinePushFields } from "../_shared/pushLocale.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_DEEP_LINK = "capacitor://localhost/dashboard";
/** Bundled in ios/App/App/celestial_bloom.wav and android res/raw/celestial_bloom.wav */
const ROUTINE_PUSH_IOS_SOUND = "celestial_bloom.wav";
const ROUTINE_PUSH_ANDROID_SOUND = "celestial_bloom";

type PrefsRow = {
  user_id: string;
  app_notifications_enabled: boolean | null;
  notification_permission_status: string | null;
  routine_notification_times: unknown;
  timezone: string | null;
  preferred_locale: string | null;
};

type ProfileRow = {
  id: string;
  app_notifications_enabled: boolean | null;
  notification_permission_status: string | null;
  routine_notification_times: unknown;
  timezone: string | null;
  preferred_locale: string | null;
};

function isEnabledFlag(value: string | null | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function parseAlertTimes(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter((t): t is string => typeof t === "string" && /^\d{2}:\d{2}$/.test(t));
}

function getLocalDateTimeParts(
  date: Date,
  timeZone: string,
): { localDate: string; hours: number; minutes: number } | null {
  try {
    const formatter = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const parts = formatter.formatToParts(date);
    const year = parts.find((p) => p.type === "year")?.value;
    const month = parts.find((p) => p.type === "month")?.value;
    const day = parts.find((p) => p.type === "day")?.value;
    const hour = parts.find((p) => p.type === "hour")?.value;
    const minute = parts.find((p) => p.type === "minute")?.value;
    if (!year || !month || !day || hour == null || minute == null) return null;
    return {
      localDate: `${year}-${month}-${day}`,
      hours: Number(hour),
      minutes: Number(minute),
    };
  } catch {
    return null;
  }
}

/** True when alert HH:mm falls in the current 5-minute local bucket (cron-aligned). */
function isAlertDueInBucket(alertTime: string, localHours: number, localMinutes: number): boolean {
  const [ah, am] = alertTime.split(":").map((v) => Number(v));
  if (!Number.isFinite(ah) || !Number.isFinite(am)) return false;
  const alertMins = ah * 60 + am;
  const nowMins = localHours * 60 + localMinutes;
  const bucketStart = Math.floor(nowMins / 5) * 5;
  const bucketEnd = bucketStart + 5;
  return alertMins >= bucketStart && alertMins < bucketEnd;
}

async function sendOneSignalPush(opts: {
  appId: string;
  restApiKey: string;
  externalUserId: string;
  url: string;
}): Promise<{ ok: boolean; status: number; body: unknown }> {
  const payload = {
    app_id: opts.appId,
    include_aliases: { external_id: [opts.externalUserId] },
    target_channel: "push",
    ...multilingualRoutinePushFields(),
    url: opts.url,
    ios_sound: ROUTINE_PUSH_IOS_SOUND,
    android_sound: ROUTINE_PUSH_ANDROID_SOUND,
  };

  const res = await fetch("https://api.onesignal.com/notifications", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Key ${opts.restApiKey}`,
    },
    body: JSON.stringify(payload),
  });

  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    body = { raw: await res.text().catch(() => "") };
  }

  return { ok: res.ok, status: res.status, body };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (!cronSecret) {
      return new Response(JSON.stringify({ error: "Cron not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!isEnabledFlag(Deno.env.get("ROUTINE_PUSH_WORKER_ENABLED"))) {
      return new Response(
        JSON.stringify({ success: true, enabled: false, sent: 0, skipped: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const oneSignalAppId = Deno.env.get("ONESIGNAL_APP_ID")?.trim();
    const oneSignalRestKey = Deno.env.get("ONESIGNAL_REST_API_KEY")?.trim();
    if (!oneSignalAppId || !oneSignalRestKey) {
      return new Response(JSON.stringify({ error: "OneSignal not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const deepLink =
      Deno.env.get("ROUTINE_PUSH_DEEP_LINK_URL")?.trim() || DEFAULT_DEEP_LINK;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const [prefsRes, profilesRes] = await Promise.all([
      supabase
        .from("user_preferences")
        .select(
          "user_id, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
        )
        .eq("app_notifications_enabled", true)
        .eq("notification_permission_status", "granted"),
      supabase
        .from("profiles")
        .select(
          "id, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
        )
        .eq("app_notifications_enabled", true)
        .eq("notification_permission_status", "granted"),
    ]);

    if (prefsRes.error) {
      console.error("[send-routine-push-notifications] prefs select failed:", prefsRes.error);
      return new Response(JSON.stringify({ error: prefsRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (profilesRes.error) {
      console.error("[send-routine-push-notifications] profiles select failed:", profilesRes.error);
      return new Response(JSON.stringify({ error: profilesRes.error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const profileById = new Map(
      ((profilesRes.data ?? []) as ProfileRow[]).map((p) => [p.id, p]),
    );
    const seenUserIds = new Set<string>();
    const candidates: {
      userId: string;
      timesRaw: unknown;
      timeZoneRaw: string | null;
      localeRaw: string | null;
    }[] = [];

    for (const row of (prefsRes.data ?? []) as PrefsRow[]) {
      seenUserIds.add(row.user_id);
      const profile = profileById.get(row.user_id);
      candidates.push({
        userId: row.user_id,
        timesRaw: row.routine_notification_times ?? profile?.routine_notification_times,
        timeZoneRaw: row.timezone ?? profile?.timezone ?? null,
        localeRaw: row.preferred_locale ?? profile?.preferred_locale ?? null,
      });
    }

    for (const profile of (profilesRes.data ?? []) as ProfileRow[]) {
      if (seenUserIds.has(profile.id)) continue;
      candidates.push({
        userId: profile.id,
        timesRaw: profile.routine_notification_times,
        timeZoneRaw: profile.timezone ?? null,
        localeRaw: profile.preferred_locale ?? null,
      });
    }

    const now = new Date();
    let sent = 0;
    let skipped = 0;
    let failed = 0;

    for (const candidate of candidates) {
      const alertTimes = parseAlertTimes(candidate.timesRaw);
      if (alertTimes.length === 0) {
        skipped++;
        continue;
      }

      const timeZoneRaw = candidate.timeZoneRaw;
      const timeZone =
        typeof timeZoneRaw === "string" && timeZoneRaw.trim() ? timeZoneRaw.trim() : "UTC";

      const local = getLocalDateTimeParts(now, timeZone);
      if (!local) {
        skipped++;
        continue;
      }

      for (let index = 0; index < alertTimes.length && index < 3; index++) {
        const alertTime = alertTimes[index];
        if (!isAlertDueInBucket(alertTime, local.hours, local.minutes)) continue;

        const alertSlot = index + 1;
        const { data: inserted, error: insertErr } = await supabase
          .from("routine_push_delivery_log")
          .insert({
            user_id: candidate.userId,
            alert_slot: alertSlot,
            scheduled_for_date: local.localDate,
            scheduled_time: alertTime,
          })
          .select("id")
          .maybeSingle();

        if (insertErr) {
          if (insertErr.code === "23505") {
            skipped++;
            continue;
          }
          console.error(
            "[send-routine-push-notifications] delivery log insert failed:",
            candidate.userId,
            insertErr,
          );
          failed++;
          continue;
        }

        if (!inserted?.id) {
          skipped++;
          continue;
        }

        const pushResult = await sendOneSignalPush({
          appId: oneSignalAppId,
          restApiKey: oneSignalRestKey,
          externalUserId: candidate.userId,
          url: deepLink,
        });

        await supabase
          .from("routine_push_delivery_log")
          .update({ onesignal_response: pushResult.body })
          .eq("id", inserted.id);

        if (pushResult.ok) {
          sent++;
        } else {
          failed++;
          console.error(
            "[send-routine-push-notifications] OneSignal send failed:",
            candidate.userId,
            pushResult.status,
            pushResult.body,
          );
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, sent, skipped, failed }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[send-routine-push-notifications] unexpected error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

```

---

## FILE: supabase/functions/_shared/pushLocale.ts

```typescript
/** Routine manifestation push copy ? keys must match app locales + OneSignal language codes. */
export const ROUTINE_PUSH_COPY: Record<
  "en" | "es-419" | "pt-BR",
  { heading: string; subtitle: string; body: string }
> = {
  en: {
    heading: "Time to manifest!",
    subtitle: "Get back into the app to do your manifesting routine.",
    body: "Your dreams are waiting. Let's return to your manifesting practice now.",
  },
  "es-419": {
    heading: "�Es hora de manifestar!",
    subtitle: "Vuelve a la app para hacer tu rutina de manifestaci�n.",
    body: "Tus sue�os te esperan. Volvamos a tu pr�ctica de manifestaci�n ahora.",
  },
  "pt-BR": {
    heading: "Hora de manifestar!",
    subtitle: "Volte ao app para fazer sua rotina de manifesta��o.",
    body: "Seus sonhos est�o esperando. Vamos voltar � sua pr�tica de manifesta��o agora.",
  },
};

export const HELP_REPLY_PUSH_BODY: Record<"en" | "es-419" | "pt-BR", string> = {
  en: "We replied to your help request.",
  "es-419": "Respondimos a tu solicitud de ayuda.",
  "pt-BR": "Respondemos � sua solicita��o de ajuda.",
};

export function resolvePushLocale(raw: string | null | undefined): "en" | "es-419" | "pt-BR" {
  const v = (raw ?? "").trim();
  if (v === "es-419" || v === "pt-BR" || v === "en") return v;
  return "en";
}

/** OneSignal `headings` / `contents` language keys (en, es, pt). */
export function oneSignalLangKey(locale: "en" | "es-419" | "pt-BR"): "en" | "es" | "pt" {
  if (locale === "es-419") return "es";
  if (locale === "pt-BR") return "pt";
  return "en";
}

/** Send all paywall locales so OneSignal can match device or subscription language. */
export function multilingualRoutinePushFields() {
  return {
    headings: {
      en: ROUTINE_PUSH_COPY.en.heading,
      es: ROUTINE_PUSH_COPY["es-419"].heading,
      pt: ROUTINE_PUSH_COPY["pt-BR"].heading,
    },
    subtitle: {
      en: ROUTINE_PUSH_COPY.en.subtitle,
      es: ROUTINE_PUSH_COPY["es-419"].subtitle,
      pt: ROUTINE_PUSH_COPY["pt-BR"].subtitle,
    },
    contents: {
      en: ROUTINE_PUSH_COPY.en.body,
      es: ROUTINE_PUSH_COPY["es-419"].body,
      pt: ROUTINE_PUSH_COPY["pt-BR"].body,
    },
  };
}

export function multilingualHelpReplyContents() {
  return {
    en: HELP_REPLY_PUSH_BODY.en,
    es: HELP_REPLY_PUSH_BODY["es-419"],
    pt: HELP_REPLY_PUSH_BODY["pt-BR"],
  };
}

```

---

## FILE: src/i18n/locales/en/settings.json

```json
{
  "title": "Settings",
  "header": "Your Account",
  "tabs": {
    "profile": "Profile",
    "settings": "Settings",
    "billing": "Billing",
    "legal": "Legal"
  },
  "language": {
    "heading": "Language",
    "description": "Choose your app language."
  },
  "profile": {
    "nameLabel": "Name",
    "usernameLabel": "Username",
    "emailLabel": "Email",
    "emailCannotChange": "Email cannot be changed",
    "phoneLabel": "Phone Number",
    "updateButton": "Update Profile",
    "namePlaceholder": "Enter your name",
    "usernamePlaceholder": "Enter your username",
    "phonePlaceholder": "+1 (555) 123-4567",
    "codePlaceholder": "Enter 6-digit code",
    "sendCode": "Send Code",
    "sendingCode": "Sending...",
    "verify": "Verify",
    "verifyPhoneHint": "Please verify your phone number to update it",
    "phoneVerified": "? Phone number verified",
    "newPhoneVerified": "? New phone number verified",
    "changePasswordHeading": "Change Password",
    "currentPasswordLabel": "Current Password",
    "newPasswordLabel": "New Password",
    "confirmPasswordLabel": "Confirm New Password",
    "changePasswordButton": "Change Password",
    "validatingPassword": "Validating password...",
    "currentPasswordPlaceholder": "Enter current password",
    "newPasswordPlaceholder": "Enter new password",
    "confirmPasswordPlaceholder": "Confirm new password",
    "smsVerificationMessage": "Your verification code is: {{code}}"
  },
  "passwordValidation": {
    "minLength": "Password must be at least 8 characters long",
    "lowercase": "Password must contain at least one lowercase letter",
    "uppercase": "Password must contain at least one uppercase letter",
    "digit": "Password must contain at least one digit",
    "mismatch": "Passwords do not match"
  },
  "preferences": {
    "routineHeading": "Manifestation routine",
    "routineDescription": "Adjust your manifestation intensity, routine expectations, and routine notifications.",
    "routineButtonTitle": "Routine & intensity",
    "routineButtonSubtitle": "Set routine intensity & notifications",
    "emailHeading": "Email preferences",
    "emailDescription": "Manifestation tips, product updates, and app news by email.",
    "emailMarketingLabel": "Email marketing",
    "textMarketingLabel": "Text Marketing",
    "dataTrainingHeading": "Data Training",
    "dataTrainingDescription": "Help improve the experience by allowing anonymized usage to be used for model training. Default is off.",
    "dataTrainingLabel": "Data Training Opt-In",
    "timeZoneLabel": "Time zone"
  },
  "deletion": {
    "heading": "Delete account",
    "scheduledPrefix": "Your account is scheduled for deletion on",
    "scheduledSuffix": "You can cancel before then.",
    "description": "Permanently delete your account and all associated data. This cannot be undone and your data cannot be retrieved. Deletion is scheduled 30 days after you confirm.",
    "cancelRequest": "Cancel deletion request",
    "deleteButton": "Delete my account",
    "confirm1Title": "Delete your account?",
    "confirm1Body": "Your account and all associated data (profile, preferences, content) will be permanently deleted. You will not be able to retrieve or recover this data. This is a final decision. Do you want to continue?",
    "confirm2Title": "Final confirmation",
    "confirm2Body": "This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered. Are you sure you want to delete your account?",
    "deleting": "Deleting?",
    "scheduledFallback": "in 30 days",
    "scheduledToast": "Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings."
  },
  "billing": {
    "subscriptionHeading": "Subscription",
    "currentPlan": "Current Plan",
    "billingHeading": "Billing",
    "billingDescription": "Manage your subscription and payment methods",
    "manageBilling": "Manage Billing",
    "loadingOptions": "Loading billing options?",
    "portalHint": "Opens the customer portal to update payment or cancel your subscription.",
    "planMonthly": "Monthly",
    "planAnnual": "Annual",
    "planWeekly": "Weekly",
    "openingPortal": "Opening billing portal?"
  },
  "legal": {
    "heading": "Legal & Information",
    "faq": "FAQ",
    "terms": "Terms of Use",
    "privacy": "Privacy Policy",
    "acceptableUse": "Acceptable Use Policy",
    "billingRefunds": "Billing & Refunds",
    "dmca": "DMCA Notice & Takedown Policy",
    "eula": "End User License Agreement",
    "contact": "Contact Us"
  },
  "routine": {
    "title": "Manifestation routine",
    "subtitle": "Manifesting intensity and routine notifications",
    "backAria": "Back to settings",
    "loading": "Loading your routine?",
    "intensityHeading": "Manifesting intensity",
    "intensityDescription": "Adjust your manifesting intensity",
    "saveIntensity": "Save intensity",
    "saving": "Saving?",
    "notificationsHeading": "Routine notifications",
    "notificationsDescription": "Notifications support your routine ? they nudge you back to the app.",
    "pushRemindersLabel": "In-app & push reminders",
    "dailyTimeHeading": "Daily notifications time",
    "deviceDeniedHint": "Notifications are off at the device level. Your routine and charge will still work.",
    "intensity": {
      "light": {
        "title": "Light",
        "tagline": "The recommended routine.",
        "description": "Light integration of manifesting, with daily notifications, if opted into."
      },
      "consistent": {
        "title": "Consistent",
        "tagline": "For experienced manifestors.",
        "description": "More moderate manifesting intensity. 2x daily notifications, if selected."
      },
      "locked_in": {
        "title": "Locked In",
        "tagline": "The highest-intensity routine.",
        "description": "For more intense manifesting goals. 3x daily notifications, if opted into."
      }
    },
    "alerts": {
      "single": "Alert",
      "first": "1st Alert",
      "second": "2nd Alert",
      "third": "3rd Alert"
    },
    "itemLabels": {
      "affirmations": "Affirmations",
      "subliminals": "Subliminal listening",
      "mirror_work": "Mirror work",
      "belief_work": "Belief work",
      "guide_check_in": "Guide check-in",
      "progress_review": "Progress review"
    }
  },
  "toasts": {
    "profileUpdated": "Profile updated successfully",
    "passwordUpdated": "Password updated successfully",
    "enterPhone": "Please enter a phone number",
    "codeSent": "Verification code sent!",
    "codeSendFailed": "Failed to send verification code. Please try again.",
    "phoneVerified": "Phone number verified and saved!",
    "invalidCode": "Invalid code. Please try again.",
    "usernameEmpty": "Username cannot be empty",
    "verifyPhoneFirst": "Please verify your new phone number before updating",
    "userNotFound": "User not found",
    "usernameTaken": "Username is already taken. Please choose another.",
    "profileUpdateError": "Error updating profile",
    "invalidPassword": "Invalid password",
    "passwordUpdateError": "Error updating password",
    "smsEnabled": "Text notifications enabled",
    "smsDisabled": "Text notifications disabled",
    "smsUpdateError": "Error updating SMS notification preference",
    "loginRequired": "Please log in to update preferences",
    "dataTrainingEnabled": "Data training opt-in enabled",
    "dataTrainingDisabled": "Data training opt-in disabled",
    "dataTrainingError": "Error updating data training preference",
    "deletionScheduled": "Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings.",
    "deletionFailed": "Could not schedule account deletion. Please try again or contact support@paletteplot.com.",
    "deletionCancelled": "Account deletion cancelled. Your account will not be deleted.",
    "deletionCancelFailed": "Could not cancel. Please try again or contact support@paletteplot.com.",
    "emailPrefError": "Error: {{message}}",
    "emailEnabled": "Email notifications enabled",
    "emailDisabled": "Email notifications disabled",
    "billingLoginRequired": "Please log in to manage billing",
    "playSubscriptionsFailed": "Could not open Google Play subscriptions.",
    "iosSubscriptionsHint": "Manage billing is available from your iPhone in Settings > Apple ID > Subscriptions.",
    "portalFailed": "Could not open billing portal. Please try again.",
    "portalFailedFallback": "Could not open billing portal. Please try again or use the link in your subscription email.",
    "routineLoadFailed": "Could not load your routine settings.",
    "routineNotifUpdateFailed": "Could not update notification preference.",
    "routineNotifOff": "Routine notifications turned off",
    "routineNotifDenied": "Notification permission was denied.",
    "routineNotifDeniedIos": "Notifications are off in iOS Settings. Enable them there, then try again.",
    "routineNotifPermissionFailed": "Could not request notification permission.",
    "routineNotifOn": "Routine notifications enabled",
    "routineIntensitySaved": "Manifesting intensity updated",
    "routineIntensitySaveFailed": "Could not save your routine intensity."
  },
  "legalDisclaimer": ""
}

```

---

## FILE: src/i18n/locales/es-419/settings.json

```json
{
  "title": "Ajustes",
  "header": "Tu cuenta",
  "tabs": {
    "profile": "Perfil",
    "settings": "Ajustes",
    "billing": "Facturaci�n",
    "legal": "Legal"
  },
  "language": {
    "heading": "Idioma",
    "description": "Elige el idioma de la app."
  },
  "profile": {
    "nameLabel": "Nombre",
    "usernameLabel": "Usuario",
    "emailLabel": "Correo electr�nico",
    "emailCannotChange": "El correo no se puede cambiar",
    "phoneLabel": "N�mero de tel�fono",
    "updateButton": "Actualizar perfil",
    "namePlaceholder": "Ingresa tu nombre",
    "usernamePlaceholder": "Ingresa tu usuario",
    "phonePlaceholder": "+52 55 1234 5678",
    "codePlaceholder": "C�digo de 6 d�gitos",
    "sendCode": "Enviar c�digo",
    "sendingCode": "Enviando...",
    "verify": "Verificar",
    "verifyPhoneHint": "Verifica tu n�mero de tel�fono para actualizarlo",
    "phoneVerified": "? Tel�fono verificado",
    "newPhoneVerified": "? Nuevo tel�fono verificado",
    "changePasswordHeading": "Cambiar contrase�a",
    "currentPasswordLabel": "Contrase�a actual",
    "newPasswordLabel": "Nueva contrase�a",
    "confirmPasswordLabel": "Confirmar nueva contrase�a",
    "changePasswordButton": "Cambiar contrase�a",
    "validatingPassword": "Validando contrase�a...",
    "currentPasswordPlaceholder": "Contrase�a actual",
    "newPasswordPlaceholder": "Nueva contrase�a",
    "confirmPasswordPlaceholder": "Confirma la nueva contrase�a",
    "smsVerificationMessage": "Tu c�digo de verificaci�n es: {{code}}"
  },
  "passwordValidation": {
    "minLength": "M�nimo 8 caracteres",
    "lowercase": "Incluye una min�scula",
    "uppercase": "Incluye una may�scula",
    "digit": "Incluye un n�mero",
    "mismatch": "Las contrase�as no coinciden"
  },
  "preferences": {
    "routineHeading": "Rutina de manifestaci�n",
    "routineDescription": "Ajusta intensidad, rutina y notificaciones.",
    "routineButtonTitle": "Rutina e intensidad",
    "routineButtonSubtitle": "Intensidad y notificaciones",
    "emailHeading": "Preferencias de correo",
    "emailDescription": "Consejos, novedades y actualizaciones por correo.",
    "emailMarketingLabel": "Marketing por correo",
    "textMarketingLabel": "Marketing por SMS",
    "dataTrainingHeading": "Entrenamiento de datos",
    "dataTrainingDescription": "Ayuda a mejorar usando datos an�nimos para entrenar modelos.",
    "dataTrainingLabel": "Permitir entrenar datos",
    "timeZoneLabel": "Zona horaria"
  },
  "deletion": {
    "heading": "Eliminar cuenta",
    "scheduledPrefix": "Tu cuenta est� programada para eliminarse el",
    "scheduledSuffix": "Puedes cancelar antes de esa fecha.",
    "description": "Elimina tu cuenta y datos. La eliminaci�n se programa para 30 d�as despu�s.",
    "cancelRequest": "Cancelar solicitud de eliminaci�n",
    "deleteButton": "Eliminar mi cuenta",
    "confirm1Title": "�Eliminar tu cuenta?",
    "confirm1Body": "Tu cuenta y datos se eliminar�n permanentemente. No podr�s recuperarlos. �Continuar?",
    "confirm2Title": "Confirmaci�n final",
    "confirm2Body": "�ltima oportunidad para cancelar. Tu cuenta y datos se eliminar�n. �Seguro?",
    "deleting": "Eliminando?",
    "scheduledFallback": "en 30 d�as",
    "scheduledToast": "Tu cuenta est� programada para eliminarse el {{date}}. Puedes iniciar sesi�n antes de esa fecha para cancelar en Ajustes."
  },
  "billing": {
    "subscriptionHeading": "Suscripci�n",
    "currentPlan": "Plan actual",
    "billingHeading": "Facturaci�n",
    "billingDescription": "Administra suscripci�n y pagos",
    "manageBilling": "Administrar facturaci�n",
    "loadingOptions": "Cargando suscripciones?",
    "portalHint": "Abre el portal para actualizar el pago o cancelar.",
    "planMonthly": "Mensual",
    "planAnnual": "Anual",
    "planWeekly": "Semanal",
    "openingPortal": "Abriendo facturaci�n?"
  },
  "legal": {
    "heading": "Legal e informaci�n",
    "faq": "Preguntas frecuentes",
    "terms": "T�rminos de uso",
    "privacy": "Pol�tica de privacidad",
    "acceptableUse": "Pol�tica de uso aceptable",
    "billingRefunds": "Facturaci�n y reembolsos",
    "dmca": "Aviso y pol�tica de retirada DMCA",
    "eula": "Acuerdo de licencia de usuario final",
    "contact": "Cont�ctanos"
  },
  "routine": {
    "title": "Rutina de manifestaci�n",
    "subtitle": "Intensidad de manifestaci�n y notificaciones de rutina",
    "backAria": "Volver a ajustes",
    "loading": "Cargando tu rutina?",
    "intensityHeading": "Intensidad de manifestaci�n",
    "intensityDescription": "Ajusta tu intensidad de manifestaci�n",
    "saveIntensity": "Guardar intensidad",
    "saving": "Guardando?",
    "notificationsHeading": "Notificaciones de rutina",
    "notificationsDescription": "Las notificaciones apoyan tu rutina: te recuerdan volver a la app.",
    "pushRemindersLabel": "Recordatorios y push",
    "dailyTimeHeading": "Hora diaria",
    "deviceDeniedHint": "Notificaciones desactivadas. Tu rutina contin�a.",
    "intensity": {
      "light": {
        "title": "Ligera",
        "tagline": "La rutina recomendada.",
        "description": "Integraci�n ligera de manifestaci�n, con notificaciones diarias, si optas por ellas."
      },
      "consistent": {
        "title": "Constante",
        "tagline": "Para manifestadores con experiencia.",
        "description": "Intensidad de manifestaci�n m�s moderada. 2 notificaciones diarias, si las seleccionas."
      },
      "locked_in": {
        "title": "Enfocado",
        "tagline": "La rutina de mayor intensidad.",
        "description": "Para metas de manifestaci�n m�s intensas. 3 notificaciones diarias, si optas por ellas."
      }
    },
    "alerts": {
      "single": "Alerta",
      "first": "1.� alerta",
      "second": "2.� alerta",
      "third": "3.� alerta"
    },
    "itemLabels": {
      "affirmations": "Afirmaciones",
      "subliminals": "Escucha de subliminales",
      "mirror_work": "Trabajo con espejo",
      "belief_work": "Trabajo de creencias",
      "guide_check_in": "Check-in con gu�a",
      "progress_review": "Revisi�n de progreso"
    }
  },
  "toasts": {
    "profileUpdated": "Perfil actualizado correctamente",
    "passwordUpdated": "Contrase�a actualizada correctamente",
    "enterPhone": "Ingresa un n�mero de tel�fono",
    "codeSent": "�C�digo de verificaci�n enviado!",
    "codeSendFailed": "No se pudo enviar el c�digo.",
    "phoneVerified": "�N�mero de tel�fono verificado y guardado!",
    "invalidCode": "C�digo inv�lido. Int�ntalo de nuevo.",
    "usernameEmpty": "El usuario no puede estar vac�o",
    "verifyPhoneFirst": "Verifica tu nuevo n�mero de tel�fono antes de actualizar",
    "userNotFound": "Usuario no encontrado",
    "usernameTaken": "El usuario ya est� en uso. Elige otro.",
    "profileUpdateError": "Error al actualizar el perfil",
    "invalidPassword": "Contrase�a inv�lida",
    "passwordUpdateError": "Error al actualizar la contrase�a",
    "smsEnabled": "Notificaciones por SMS activadas",
    "smsDisabled": "Notificaciones por SMS desactivadas",
    "smsUpdateError": "Error al actualizar SMS",
    "loginRequired": "Inicia sesi�n para actualizar las preferencias",
    "dataTrainingEnabled": "Entrenamiento de datos activado",
    "dataTrainingDisabled": "Entrenamiento de datos desactivado",
    "dataTrainingError": "Error al actualizar datos",
    "deletionScheduled": "Tu cuenta est� programada para eliminarse el {{date}}. Puedes iniciar sesi�n antes de esa fecha para cancelar en Ajustes.",
    "deletionFailed": "No se pudo programar la eliminaci�n. Intenta de nuevo o escribe a soporte.",
    "deletionCancelled": "Eliminaci�n de cuenta cancelada. Tu cuenta no se eliminar�.",
    "deletionCancelFailed": "No se pudo cancelar. Intenta de nuevo o escribe a soporte.",
    "emailPrefError": "Error: {{message}}",
    "emailEnabled": "Notificaciones por correo activadas",
    "emailDisabled": "Notificaciones por correo desactivadas",
    "billingLoginRequired": "Inicia sesi�n para administrar la facturaci�n",
    "playSubscriptionsFailed": "No se pudo abrir la pantalla de suscripciones de Google Play.",
    "iosSubscriptionsHint": "Administra en iPhone: Ajustes > ID de Apple > Suscripciones.",
    "portalFailed": "No se pudo abrir el portal de facturaci�n. Int�ntalo de nuevo.",
    "portalFailedFallback": "No se pudo abrir el portal. Intenta de nuevo o usa el enlace del correo.",
    "routineLoadFailed": "No se pudieron cargar los ajustes de tu rutina.",
    "routineNotifUpdateFailed": "No se pudo actualizar la preferencia de notificaciones.",
    "routineNotifOff": "Notificaciones de rutina desactivadas",
    "routineNotifDenied": "Se deneg� el permiso de notificaciones.",
    "routineNotifDeniedIos": "Las notificaciones est�n desactivadas en Ajustes de iOS. Act�valas en Ajustes e int�ntalo de nuevo.",
    "routineNotifPermissionFailed": "No se pudo solicitar el permiso de notificaciones.",
    "routineNotifOn": "Notificaciones de rutina activadas",
    "routineIntensitySaved": "Intensidad de manifestaci�n actualizada",
    "routineIntensitySaveFailed": "No se pudo guardar tu intensidad de rutina."
  },
  "legalDisclaimer": ""
}

```

---

## FILE: src/i18n/locales/pt-BR/settings.json

```json
{
  "title": "Configura��es",
  "header": "Sua conta",
  "tabs": {
    "profile": "Perfil",
    "settings": "Configura��es",
    "billing": "Assinatura",
    "legal": "Legal"
  },
  "language": {
    "heading": "Idioma",
    "description": "Escolha o idioma do app."
  },
  "profile": {
    "nameLabel": "Nome",
    "usernameLabel": "Nome de usu�rio",
    "emailLabel": "E-mail",
    "emailCannotChange": "E-mail n�o alter�vel",
    "phoneLabel": "N�mero de telefone",
    "updateButton": "Atualizar perfil",
    "namePlaceholder": "Digite seu nome",
    "usernamePlaceholder": "Digite seu nome de usu�rio",
    "phonePlaceholder": "+55 (11) 91234-5678",
    "codePlaceholder": "C�digo de 6 d�gitos",
    "sendCode": "Enviar c�digo",
    "sendingCode": "Enviando...",
    "verify": "Verificar",
    "verifyPhoneHint": "Verifique seu n�mero de telefone para atualiz�-lo",
    "phoneVerified": "? Telefone verificado",
    "newPhoneVerified": "? Novo telefone verificado",
    "changePasswordHeading": "Alterar senha",
    "currentPasswordLabel": "Senha atual",
    "newPasswordLabel": "Nova senha",
    "confirmPasswordLabel": "Confirmar nova senha",
    "changePasswordButton": "Alterar senha",
    "validatingPassword": "Validando senha...",
    "currentPasswordPlaceholder": "Senha atual",
    "newPasswordPlaceholder": "Nova senha",
    "confirmPasswordPlaceholder": "Confirme a nova senha",
    "smsVerificationMessage": "Seu c�digo de verifica��o �: {{code}}"
  },
  "passwordValidation": {
    "minLength": "M�nimo de 8 caracteres",
    "lowercase": "Inclua uma letra min�scula",
    "uppercase": "Inclua uma letra mai�scula",
    "digit": "Inclua um n�mero",
    "mismatch": "As senhas n�o coincidem"
  },
  "preferences": {
    "routineHeading": "Rotina de manifesta��o",
    "routineDescription": "Ajuste intensidade, rotina e notifica��es.",
    "routineButtonTitle": "Rotina e intensidade",
    "routineButtonSubtitle": "Intensidade e notifica��es",
    "emailHeading": "Prefer�ncias de e-mail",
    "emailDescription": "Dicas, novidades e atualiza��es por e-mail.",
    "emailMarketingLabel": "Marketing por e-mail",
    "textMarketingLabel": "Marketing por SMS",
    "dataTrainingHeading": "Treinamento de dados",
    "dataTrainingDescription": "Ajude a melhorar usando dados an�nimos para treinar modelos.",
    "dataTrainingLabel": "Permitir treino de dados",
    "timeZoneLabel": "Fuso hor�rio"
  },
  "deletion": {
    "heading": "Excluir conta",
    "scheduledPrefix": "Sua conta est� programada para exclus�o em",
    "scheduledSuffix": "Voc� pode cancelar antes dessa data.",
    "description": "Exclui sua conta e dados. A exclus�o � agendada para 30 dias depois.",
    "cancelRequest": "Cancelar solicita��o de exclus�o",
    "deleteButton": "Excluir minha conta",
    "confirm1Title": "Excluir sua conta?",
    "confirm1Body": "Sua conta e dados ser�o exclu�dos permanentemente. N�o ser� poss�vel recuperar. Continuar?",
    "confirm2Title": "Confirma��o final",
    "confirm2Body": "�ltima chance para cancelar. Sua conta e dados ser�o exclu�dos. Tem certeza?",
    "deleting": "Excluindo?",
    "scheduledFallback": "em 30 dias",
    "scheduledToast": "Sua conta est� programada para exclus�o em {{date}}. Voc� pode entrar antes dessa data para cancelar em Configura��es."
  },
  "billing": {
    "subscriptionHeading": "Assinatura",
    "currentPlan": "Plano atual",
    "billingHeading": "Assinatura",
    "billingDescription": "Gerencie assinatura e pagamentos",
    "manageBilling": "Gerenciar assinatura",
    "loadingOptions": "Carregando assinaturas?",
    "portalHint": "Abra o portal para atualizar pagamento ou cancelar.",
    "planMonthly": "Mensal",
    "planAnnual": "Anual",
    "planWeekly": "Semanal",
    "openingPortal": "Abrindo assinatura?"
  },
  "legal": {
    "heading": "Legal e informa��es",
    "faq": "Perguntas frequentes",
    "terms": "Termos de uso",
    "privacy": "Pol�tica de privacidade",
    "acceptableUse": "Pol�tica de uso aceit�vel",
    "billingRefunds": "Pagamento e reembolsos",
    "dmca": "Aviso e pol�tica de remo��o DMCA",
    "eula": "Contrato de licen�a de usu�rio final",
    "contact": "Fale conosco"
  },
  "routine": {
    "title": "Rotina de manifesta��o",
    "subtitle": "Intensidade de manifesta��o e notifica��es de rotina",
    "backAria": "Voltar para configura��es",
    "loading": "Carregando sua rotina?",
    "intensityHeading": "Intensidade de manifesta��o",
    "intensityDescription": "Ajuste sua intensidade de manifesta��o",
    "saveIntensity": "Salvar intensidade",
    "saving": "Salvando?",
    "notificationsHeading": "Notifica��es de rotina",
    "notificationsDescription": "As notifica��es apoiam sua rotina: lembram voc� de voltar ao app.",
    "pushRemindersLabel": "Lembretes e push",
    "dailyTimeHeading": "Hor�rio di�rio",
    "deviceDeniedHint": "Notifica��es desativadas. Sua rotina continua.",
    "intensity": {
      "light": {
        "title": "Leve",
        "tagline": "A rotina recomendada.",
        "description": "Integra��o leve de manifesta��o, com notifica��es di�rias, se voc� optar."
      },
      "consistent": {
        "title": "Consistente",
        "tagline": "Para manifestadores experientes.",
        "description": "Intensidade de manifesta��o mais moderada. 2 notifica��es di�rias, se selecionadas."
      },
      "locked_in": {
        "title": "Focado",
        "tagline": "A rotina de maior intensidade.",
        "description": "Para metas de manifesta��o mais intensas. 3 notifica��es di�rias, se voc� optar."
      }
    },
    "alerts": {
      "single": "Alerta",
      "first": "1.� alerta",
      "second": "2.� alerta",
      "third": "3.� alerta"
    },
    "itemLabels": {
      "affirmations": "Afirma��es",
      "subliminals": "Escuta de subliminares",
      "mirror_work": "Trabalho com espelho",
      "belief_work": "Trabalho de cren�as",
      "guide_check_in": "Check-in com guia",
      "progress_review": "Revis�o de progresso"
    }
  },
  "toasts": {
    "profileUpdated": "Perfil atualizado com sucesso",
    "passwordUpdated": "Senha atualizada com sucesso",
    "enterPhone": "Digite um n�mero de telefone",
    "codeSent": "C�digo de verifica��o enviado!",
    "codeSendFailed": "N�o foi poss�vel enviar o c�digo.",
    "phoneVerified": "N�mero de telefone verificado e salvo!",
    "invalidCode": "C�digo inv�lido. Tente novamente.",
    "usernameEmpty": "O nome de usu�rio n�o pode estar vazio",
    "verifyPhoneFirst": "Verifique seu novo n�mero de telefone antes de atualizar",
    "userNotFound": "Usu�rio n�o encontrado",
    "usernameTaken": "O nome de usu�rio j� est� em uso. Escolha outro.",
    "profileUpdateError": "Erro ao atualizar o perfil",
    "invalidPassword": "Senha inv�lida",
    "passwordUpdateError": "Erro ao atualizar a senha",
    "smsEnabled": "Notifica��es por SMS ativadas",
    "smsDisabled": "Notifica��es por SMS desativadas",
    "smsUpdateError": "Erro ao atualizar SMS",
    "loginRequired": "Entre para atualizar as prefer�ncias",
    "dataTrainingEnabled": "Treinamento de dados ativado",
    "dataTrainingDisabled": "Treinamento de dados desativado",
    "dataTrainingError": "Erro ao atualizar treino de dados",
    "deletionScheduled": "Sua conta est� programada para exclus�o em {{date}}. Voc� pode entrar antes dessa data para cancelar em Configura��es.",
    "deletionFailed": "N�o foi poss�vel agendar a exclus�o. Tente de novo ou escreva ao suporte.",
    "deletionCancelled": "Exclus�o da conta cancelada. Sua conta n�o ser� exclu�da.",
    "deletionCancelFailed": "N�o foi poss�vel cancelar. Tente de novo ou escreva ao suporte.",
    "emailPrefError": "Erro: {{message}}",
    "emailEnabled": "Notifica��es por e-mail ativadas",
    "emailDisabled": "Notifica��es por e-mail desativadas",
    "billingLoginRequired": "Entre para gerenciar sua assinatura",
    "playSubscriptionsFailed": "N�o foi poss�vel abrir as assinaturas do Google Play.",
    "iosSubscriptionsHint": "Gerencie no iPhone: Ajustes > ID Apple > Assinaturas.",
    "portalFailed": "N�o foi poss�vel abrir o portal de assinatura. Tente novamente.",
    "portalFailedFallback": "N�o foi poss�vel abrir o portal. Tente de novo ou use o link do e-mail.",
    "routineLoadFailed": "N�o foi poss�vel carregar as configura��es da sua rotina.",
    "routineNotifUpdateFailed": "N�o foi poss�vel atualizar a prefer�ncia de notifica��es.",
    "routineNotifOff": "Notifica��es de rotina desativadas",
    "routineNotifDenied": "A permiss�o de notifica��es foi negada.",
    "routineNotifDeniedIos": "As notifica��es est�o desativadas nas Configura��es do iOS. Ative-as l� e tente novamente.",
    "routineNotifPermissionFailed": "N�o foi poss�vel solicitar a permiss�o de notifica��es.",
    "routineNotifOn": "Notifica��es de rotina ativadas",
    "routineIntensitySaved": "Intensidade de manifesta��o atualizada",
    "routineIntensitySaveFailed": "N�o foi poss�vel salvar sua intensidade de rotina."
  },
  "legalDisclaimer": ""
}

```

---

## FILE: src/i18n/locales/en/onboarding.json

```json
{
  "welcome": {
    "signUp": "Sign Up",
    "ctaSubtext": "Personalize your first subliminal in less than 3 minutes",
    "freeTrialLine": "Start your free trial",
    "nativeTitle": "Your manifesting methods, in one place",
    "nativeDescription": "Manifest on easy mode with one solution for all core techniques. Make your own subliminals, customize your affirmations, do mirror work, and more.",
    "awardLine1": "One of the most",
    "awardLine2": "comprehensive",
    "awardLine3": "manifesting apps",
    "webHeadline1": "Manifest your desires now,",
    "webHeadlineAccent": "Make your own subliminals",
    "toolRows": {
      "row1": ["Subliminal Maker", "Robotic Affirming", "Scripting"],
      "row2": ["Mirror Work", "Belief Work", "Inspired Action"],
      "row3": ["Manifestation Lists", "AI Manifesting Guide"]
    },
    "webSteps": {
      "desire": { "title": "Choose your desire", "subtitle": "Love · SP · Beauty · Abundance · Self-concept" },
      "makeYours": { "title": "Make it yours", "subtitle": "Your affirmations, your voice, your sounds" },
      "listen": { "title": "Listen & repeat", "subtitle": "Your subliminals, ready to play daily" }
    },
    "webToolbar": {
      "robotic": "Robotic Affirming",
      "scripting": "Scripting",
      "mirror": "Mirror Work",
      "more": "& More"
    },
    "communityProof": "Loved by manifestors",
    "mockupScreenAlt": "Subliminal Maker — your tracks",
    "mockupPreviewAria": "Subliminal Maker app preview"
  },
  "setup": {
    "name": {
      "title": "Welcome! What should Palette Plotting call you?",
      "firstNameLabel": "First name",
      "firstNamePlaceholder": "Your first name",
      "saveError": "Could not save your name. Check your connection and try again."
    },
    "desireCategory": {
      "title": "What do you want to manifest most?",
      "subtitle": "Select one focus area."
    },
    "conditionalSpecificity": {
      "subtitle": "We'll use this to shape your guidance in the app.",
      "fallbackHeadline": "A quick detail",
      "fallbackMessage": "Go back and pick one of the twelve focus areas to unlock this step.",
      "customLabel": "Describe your focus",
      "customPlaceholder": "e.g., Launching my online business",
      "spPerson": {
        "headline": "Is there a specific person connected to this desire?",
        "nameLabel": "What should we call them?",
        "namePlaceholder": "e.g., Alex",
        "choices": {
          "yes": "Yes",
          "no": "No",
          "complicated": "It's complicated",
          "prefer_not": "Prefer not to say"
        }
      },
      "categories": {
        "Finances": {
          "headline": "What kind of money shift are you calling in?",
          "options": {
            "consistentIncome": "Consistent income",
            "debtFreedom": "Debt freedom",
            "moreSales": "More sales",
            "luxuryEase": "Luxury & ease",
            "financialSafety": "Financial safety"
          }
        },
        "Self-Love": {
          "headline": "What do you want to feel when you see yourself?",
          "options": {
            "beautiful": "Beautiful",
            "desired": "Desired",
            "radiant": "Radiant",
            "expensive": "Expensive",
            "seen": "Seen"
          }
        },
        "Career": {
          "headline": "What career outcome are you calling in?",
          "options": {
            "newJob": "New job",
            "promotion": "Promotion",
            "higherPay": "Higher pay",
            "dreamOpportunity": "Dream opportunity"
          }
        },
        "Business": {
          "headline": "What business result do you want most?",
          "options": {
            "moreSales": "More sales",
            "moreCustomersClients": "More customers/clients",
            "launchSuccess": "Launch success",
            "audienceGrowth": "Audience growth"
          }
        },
        "Confidence": {
          "headline": "Which self-concept focus fits best?",
          "options": {
            "confidence": "Confidence",
            "visibility": "Visibility",
            "selfTrust": "Self-trust",
            "magnetism": "Magnetism"
          }
        },
        "Learning": {
          "headline": "What education outcome are you calling in?",
          "options": {
            "betterGrades": "Better grades",
            "examSuccess": "Exam success",
            "collegeAcceptance": "College acceptance",
            "scholarship": "Scholarship",
            "focusStudying": "Focus studying"
          }
        },
        "Discipline": {
          "headline": "What are you building consistency around?",
          "options": {
            "morningRoutine": "Morning routine",
            "fitness": "Fitness",
            "studying": "Studying",
            "work": "Work",
            "selfCare": "Self-care"
          }
        },
        "Productivity": {
          "headline": "Where do you want more focus?",
          "options": {
            "workProjects": "Work projects",
            "studying": "Studying",
            "creativeWork": "Creative work",
            "contentCreation": "Content creation",
            "dailyRoutine": "Daily routine"
          }
        },
        "Fitness": {
          "headline": "What body or fitness shift are you calling in?",
          "options": {
            "strength": "Strength",
            "shapeTone": "Shape & tone",
            "energy": "Energy",
            "confidence": "Confidence",
            "consistentWorkouts": "Consistent workouts"
          }
        },
        "Nutrition": {
          "headline": "What kind of wellness shift do you want?",
          "options": {
            "moreEnergy": "More energy",
            "betterRest": "Better rest",
            "emotionalEase": "Emotional ease",
            "balance": "Balance",
            "softerRoutines": "Softer routines"
          }
        },
        "Organization": {
          "headline": "What part of your life are you resetting?",
          "options": {
            "mySpace": "My space",
            "mySchedule": "My schedule",
            "myRoutines": "My routines",
            "myEnvironment": "My environment",
            "myPriorities": "My priorities"
          }
        }
      }
    },
    "currentFriction": {
      "title": "What limiting belief do you want to change?",
      "subtitle": "What limiting belief blocks your manifestation?",
      "placeholder": "Describe the belief you want to change…"
    },
    "toolPreference": {
      "title": "How do you want support?",
      "subtitle": "Choose the tools you want to start with."
    },
    "toolPreferenceOptions": {
      "powerful_affirmations": "Powerful affirmations",
      "custom_subliminals": "Custom Subliminals",
      "mirror_work_reset": "Mirror Work",
      "belief_restructuring": "Belief Work",
      "ai_manifestation_guidance": "AI Manifestation Guidance",
      "daily_wins_progress": "Track Consistency & Progress"
    },
    "guide": {
      "title": "Choose a guide",
      "subtitle": "An AI companion to answer manifesting questions."
    },
    "manifestationIntensity": {
      "title": "Choose your manifesting intensity",
      "subtitle": "Set your routine intensity and optional notifications.",
      "setRoutine": "Set my routine",
      "notificationsQuestion": "Do you want in-app & push notifications to bring you back to the app for your routine?",
      "notificationsHint": "Notifications support your routine — they nudge you back to the app.",
      "yes": "Yes",
      "notNow": "Not now",
      "dailyTime": "Daily notifications time",
      "customizeInSettings": "You can customize your routine further in Settings.",
      "light": {
        "title": "Light",
        "tagline": "The recommended routine.",
        "description": "Light integration of manifesting, with daily notifications, if opted into."
      },
      "consistent": {
        "title": "Consistent",
        "tagline": "For experienced manifestors.",
        "description": "More moderate manifesting intensity. 2x daily notifications, if selected."
      },
      "lockedIn": {
        "title": "Locked In",
        "tagline": "The highest-intensity routine.",
        "description": "For more intense manifesting goals. 3x daily notifications, if opted into."
      },
      "alerts": {
        "alert": "Alert",
        "first": "1st Alert",
        "second": "2nd Alert",
        "third": "3rd Alert"
      }
    },
    "notifications": {
      "title": "Turn on additional permissions",
      "subtitle": "Help us improve Palette Plotting."
    },
    "tracking": {
      "title": "Help us improve Palette Plotting (optional)",
      "body": "Palette Plotting uses app activity data to measure ad performance and improve experience. Will you help us improve Palette Plotting?",
      "yes": "Yes",
      "no": "No"
    },
    "email": {
      "title": "Save your path",
      "titleLine1": "Save your path &",
      "titleLine2": "start your free trial",
      "subtitle": "Create your account to lock in your path. All of your progress is saved to this email.",
      "emailLabel": "Email",
      "passwordLabel": "Password",
      "emailPlaceholder": "you@email.com",
      "passwordPlaceholder": "8+ characters",
      "invalidEmail": "Please enter a valid email address",
      "needFirstName": "We need your first name from earlier in setup.",
      "passwordLength": "Please enter a password with at least 8 characters",
      "acceptTerms": "Please accept the Terms of Service and Privacy Policy",
      "subscriptionError": "Could not open subscription options. Try again in a moment.",
      "tryAgain": "Try again",
      "checkingAvailability": "Checking availability…",
      "hidePassword": "Hide password",
      "showPassword": "Show password",
      "termsAcceptPrefix": "I accept the",
      "termsOfService": "Terms of Service",
      "termsAnd": "and",
      "privacyPolicy": "Privacy Policy",
      "emailMarketingConsent": "Send me manifestation tips and updates. By checking this box, you consent to marketing communications. You can opt out anytime."
    },
    "affirmationRead": {
      "title": "Confidently affirm your desires out loud",
      "subtitle": "Speak & internalize these personalized affirmations"
    },
    "embody": {
      "title": "How will you embody your new identity each day?",
      "subtitle": "Choose exactly five—they become your Inspired Actions on your dashboard. ({{count}} of {{required}} selected)"
    },
    "embodyOptions": {
      "embody_rest": "Rest & Relax",
      "embody_self_care": "Self-care",
      "embody_clean_environment": "Clean & organize environment",
      "embody_nutrition": "Nutrition",
      "embody_have_fun": "Have fun",
      "embody_move": "Exercise",
      "embody_glam_up": "Glam Up",
      "embody_connect": "Connect with others",
      "embody_seen": "Be seen & visible.",
      "embody_work_or_study": "Work or study"
    },
    "plotSynthesis": {
      "title": "Your path is ready.",
      "subtitle": "Everything below is ready the moment you unlock Palette Plotting.",
      "items": {
        "subliminals": "Customized subliminals.",
        "mirror": "Mirror work for self concept.",
        "guideReady": "{{name}} is ready to coach you.",
        "guideReadyGeneric": "Your guide is ready to coach you.",
        "affirmations": "Affirmations for the new you.",
        "beliefs": "Beliefs ready for reframing.",
        "journal": "Journal ready for reflection."
      }
    },
    "plotLoading": {
      "title": "Building your path…",
      "subtitle": "Personalizing your starting stack.",
      "loading": "Loading",
      "hint": "You're not starting from zero—your path is already taking shape.",
      "testimonials": {
        "row1": [
          { "quote": "This finally made my new story feel normal.", "author": "Jordan M." },
          { "quote": "I stopped checking the 3D and stayed consistent—finally.", "author": "Riley T." },
          { "quote": "The tool path was exactly what I needed.", "author": "Casey L." },
          { "quote": "The affirmations actually sounded like me, not generic fluff.", "author": "Morgan P." }
        ],
        "row2": [
          { "quote": "My self-concept shifted fast once I had structure.", "author": "Dev S." },
          { "quote": "Having one place for mirror work and subliminals kept me honest.", "author": "Avery K." },
          { "quote": "Small daily wins added up quicker than I expected.", "author": "Quinn R." },
          { "quote": "I actually finish sessions now instead of doom-scrolling.", "author": "Jamie H." }
        ]
      }
    },
    "beginJourney": {
      "lead": "Palette Plotting helps you practice manifestation methods & embody your desires, fostering coherence at each step.",
      "subtitle": "Let's begin your journey."
    }
  },
  "legacy": {
    "threeActs": {
      "title": "Your Self-Concept Suite",
      "subtitle": "A flexible framework for quantum leaps",
      "tools": {
        "subliminalMaker": { "title": "Subliminal Maker", "description": "Custom subliminals with binaural beats" },
        "mirrorWork": { "title": "Mirror Work", "description": "Immersive Mirror Work" },
        "affirmScript": { "title": "Affirm & Script", "description": "Custom affirmations and visuals" },
        "beliefWork": { "title": "Belief Work", "description": "Deconstruct self-limiting beliefs" },
        "habitTracking": { "title": "Habit Tracking", "description": "Track daily progress on goals" },
        "manifestationJournal": { "title": "Manifestation Journal", "description": "Daily journaling and notes" },
        "pianoTapping": { "title": "Piano Tapping", "description": "Tactile integration of goals" }
      }
    },
    "double": {
      "title": "Choose a Guide",
      "subtitle": "An AI companion to help fuel momentum through chats",
      "characters": {
        "river": { "name": "River", "themes": ["Transitions", "Career"] },
        "sage": { "name": "Sage", "themes": ["Finance", "Identity"] },
        "rose": { "name": "Rose", "themes": ["Love", "Self Concept"] },
        "oliver": { "name": "Oliver", "themes": ["Self Image", "Fitness"] }
      }
    },
    "digitalMirror": {
      "title": "Mirror Work",
      "subtitle": "Guided sessions meant to grow self-confidence",
      "imageAlt": "Mirror Work"
    },
    "subliminalMaker": {
      "title": "Subliminal Maker",
      "subtitle": "Create custom subliminal audio tracks",
      "imageAlt": "Subliminal Maker"
    },
    "manifestationTools": {
      "title": "Interactive Manifestation Tools",
      "subtitle": "Use experimental techniques for manifestation",
      "imageAlt": "Interactive Manifestation Tools"
    },
    "habitTracking": {
      "title": "Habit & Momentum Tracking",
      "subtitle": "Track your progress and build lasting habits",
      "imageAlt": "Habit & Momentum Tracking"
    },
    "onboardingQuestions": {
      "title": "Manifestation Focus",
      "question": "What do you want to shift?",
      "selectUpTo3": "Select up to 3 options",
      "options": {
        "Career": "Career",
        "Business": "Business",
        "Learning": "School / Exams",
        "Finances": "Money",
        "Productivity": "Focus",
        "Organization": "Life Reset",
        "Confidence": "Self-Concept",
        "Self-Love": "Beauty / Glow Up",
        "Connections": "Love / SP",
        "Fitness": "Body / Fitness",
        "Nutrition": "Wellness",
        "Discipline": "Discipline"
      }
    }
  }
}
```

---

## FILE: src/i18n/locales/es-419/onboarding.json

```json
{
  "welcome": {
    "signUp": "Registrarse",
    "ctaSubtext": "Crea tu primer subliminal en 3 minutos",
    "freeTrialLine": "Comienza tu prueba gratis",
    "nativeTitle": "Tus métodos de manifestación",
    "nativeDescription": "Manifiesta con facilidad. Crea subliminales, personaliza afirmaciones, haz trabajo con espejo y más.",
    "awardLine1": "Una de las apps",
    "awardLine2": "de manifestación",
    "awardLine3": "más completas",
    "webHeadline1": "Manifiesta tus deseos ahora,",
    "webHeadlineAccent": "Crea tus subliminales",
    "toolRows": {
      "row1": [
        "Subliminales",
        "Afirmaciones robóticas",
        "Scripting"
      ],
      "row2": [
        "Trabajo con espejo",
        "Creencias",
        "Acción inspirada"
      ],
      "row3": [
        "Listas",
        "Guía con IA"
      ]
    },
    "webSteps": {
      "desire": {
        "title": "Elige tu deseo",
        "subtitle": "Amor · Belleza · Abundancia"
      },
      "makeYours": {
        "title": "Hazlo tuyo",
        "subtitle": "Tus afirmaciones, tu voz, tus sonidos"
      },
      "listen": {
        "title": "Escucha y repite",
        "subtitle": "Subliminales listos para escuchar"
      }
    },
    "webToolbar": {
      "robotic": "Afirmaciones robóticas",
      "scripting": "Scripting",
      "mirror": "Espejo",
      "more": "Y más"
    },
    "communityProof": "Amada por manifestadoras",
    "mockupScreenAlt": "Creador de subliminales — tus pistas",
    "mockupPreviewAria": "Vista previa del Creador de subliminales"
  },
  "setup": {
    "name": {
      "title": "¿Cómo quieres que te llamemos?",
      "firstNameLabel": "Nombre",
      "firstNamePlaceholder": "Tu nombre",
      "saveError": "No pudimos guardarlo. Intenta de nuevo."
    },
    "desireCategory": {
      "title": "¿Qué quieres manifestar más?",
      "subtitle": "Elige un enfoque."
    },
    "conditionalSpecificity": {
      "subtitle": "Esto define tu guía en la app.",
      "fallbackHeadline": "Un detalle rápido",
      "fallbackMessage": "Regresa y elige un área de enfoque.",
      "customLabel": "Describe tu enfoque",
      "customPlaceholder": "p. ej., Lanzar mi negocio en línea",
      "spPerson": {
        "headline": "¿Hay una persona específica ligada a este deseo?",
        "nameLabel": "¿Qué nombre usamos?",
        "namePlaceholder": "p. ej., Alex",
        "choices": {
          "yes": "Sí",
          "no": "No",
          "complicated": "Es complicado",
          "prefer_not": "Prefiero no decirlo"
        }
      },
      "categories": {
        "Finances": {
          "headline": "¿Qué cambio financiero quieres?",
          "options": {
            "consistentIncome": "Ingresos constantes",
            "debtFreedom": "Sin deudas",
            "moreSales": "Más ventas",
            "luxuryEase": "Lujo y facilidad",
            "financialSafety": "Seguridad financiera"
          }
        },
        "Self-Love": {
          "headline": "¿Qué quieres sentir cuando te ves?",
          "options": {
            "beautiful": "Bella",
            "desired": "Deseada",
            "radiant": "Radiante",
            "expensive": "Valiosa",
            "seen": "Vista"
          }
        },
        "Career": {
          "headline": "¿Qué resultado profesional quieres?",
          "options": {
            "newJob": "Nuevo trabajo",
            "promotion": "Ascenso",
            "higherPay": "Mejor salario",
            "dreamOpportunity": "Oportunidad ideal"
          }
        },
        "Business": {
          "headline": "¿Qué resultado de negocio quieres?",
          "options": {
            "moreSales": "Más ventas",
            "moreCustomersClients": "Más clientes",
            "launchSuccess": "Lanzamiento exitoso",
            "audienceGrowth": "Más audiencia"
          }
        },
        "Confidence": {
          "headline": "¿Qué enfoque de autoconcepto encaja?",
          "options": {
            "confidence": "Confianza",
            "visibility": "Visibilidad",
            "selfTrust": "Autoconfianza",
            "magnetism": "Magnetismo"
          }
        },
        "Learning": {
          "headline": "¿Qué resultado educativo quieres?",
          "options": {
            "betterGrades": "Mejores notas",
            "examSuccess": "Éxito en exámenes",
            "collegeAcceptance": "Aceptación",
            "scholarship": "Beca",
            "focusStudying": "Foco al estudiar"
          }
        },
        "Discipline": {
          "headline": "¿Dónde quieres más constancia?",
          "options": {
            "morningRoutine": "Rutina matutina",
            "fitness": "Fitness",
            "studying": "Estudiar",
            "work": "Trabajo",
            "selfCare": "Autocuidado"
          }
        },
        "Productivity": {
          "headline": "¿Dónde quieres más enfoque?",
          "options": {
            "workProjects": "Proyectos de trabajo",
            "studying": "Estudiar",
            "creativeWork": "Trabajo creativo",
            "contentCreation": "Creación de contenido",
            "dailyRoutine": "Rutina diaria"
          }
        },
        "Fitness": {
          "headline": "¿Qué cambio físico quieres?",
          "options": {
            "strength": "Fuerza",
            "shapeTone": "Forma y tono",
            "energy": "Energía",
            "confidence": "Confianza",
            "consistentWorkouts": "Entrenos constantes"
          }
        },
        "Nutrition": {
          "headline": "¿Qué cambio de bienestar quieres?",
          "options": {
            "moreEnergy": "Más energía",
            "betterRest": "Mejor descanso",
            "emotionalEase": "Calma emocional",
            "balance": "Equilibrio",
            "softerRoutines": "Rutinas más suaves"
          }
        },
        "Organization": {
          "headline": "¿Qué parte quieres reiniciar?",
          "options": {
            "mySpace": "Mi espacio",
            "mySchedule": "Mi agenda",
            "myRoutines": "Mis rutinas",
            "myEnvironment": "Mi entorno",
            "myPriorities": "Mis prioridades"
          }
        }
      }
    },
    "currentFriction": {
      "title": "¿Qué creencia quieres cambiar?",
      "subtitle": "¿Qué creencia bloquea tu manifestación?",
      "placeholder": "Describe la creencia que quieres cambiar…"
    },
    "toolPreference": {
      "title": "¿Cómo quieres recibir apoyo?",
      "subtitle": "Elige las herramientas para empezar."
    },
    "toolPreferenceOptions": {
      "powerful_affirmations": "Afirmaciones poderosas",
      "custom_subliminals": "Subliminales",
      "mirror_work_reset": "Espejo",
      "belief_restructuring": "Creencias",
      "ai_manifestation_guidance": "Guía con IA",
      "daily_wins_progress": "Constancia y progreso"
    },
    "guide": {
      "title": "Elige tu guía",
      "subtitle": "Tu guía de IA para tus dudas."
    },
    "manifestationIntensity": {
      "title": "Elige tu intensidad",
      "subtitle": "Configura rutina y notificaciones.",
      "setRoutine": "Configurar rutina",
      "notificationsQuestion": "¿Quieres notificaciones para retomar tu rutina?",
      "notificationsHint": "Las notificaciones apoyan tu rutina: te recuerdan volver a la app.",
      "yes": "Sí",
      "notNow": "Ahora no",
      "dailyTime": "Hora diaria",
      "customizeInSettings": "Personalízala después en Ajustes.",
      "light": {
        "title": "Ligera",
        "tagline": "La rutina recomendada.",
        "description": "Manifestación ligera, con notificaciones si quieres."
      },
      "consistent": {
        "title": "Constante",
        "tagline": "Para manifestadores con experiencia.",
        "description": "Intensidad moderada. 2 notificaciones diarias."
      },
      "lockedIn": {
        "title": "Enfocado",
        "tagline": "La rutina más intensa.",
        "description": "Metas intensas. 3 notificaciones diarias."
      },
      "alerts": {
        "alert": "Alerta",
        "first": "1.ª alerta",
        "second": "2.ª alerta",
        "third": "3.ª alerta"
      }
    },
    "notifications": {
      "title": "Activa permisos",
      "subtitle": "Ayúdanos a mejorar Palette Plotting."
    },
    "tracking": {
      "title": "Ayúdanos a mejorar (opcional)",
      "body": "Usamos datos de actividad para medir anuncios y mejorar la app. ¿Nos ayudas?",
      "yes": "Sí",
      "no": "No"
    },
    "email": {
      "title": "Guarda tu camino",
      "titleLine1": "Guarda tu camino y",
      "titleLine2": "comienza tu prueba gratis",
      "subtitle": "Crea tu cuenta para guardar tu camino. Tu progreso queda en este correo.",
      "emailLabel": "Correo",
      "passwordLabel": "Contraseña",
      "emailPlaceholder": "tu@correo.com",
      "passwordPlaceholder": "8+ caracteres",
      "invalidEmail": "Ingresa un correo válido",
      "needFirstName": "Necesitamos tu nombre.",
      "passwordLength": "Ingresa una contraseña de 8+ caracteres",
      "acceptTerms": "Acepta los Términos y la Privacidad",
      "subscriptionError": "No pudimos abrir suscripciones. Intenta de nuevo.",
      "tryAgain": "Intentar de nuevo",
      "checkingAvailability": "Comprobando disponibilidad…",
      "hidePassword": "Ocultar contraseña",
      "showPassword": "Mostrar contraseña",
      "termsAcceptPrefix": "Acepto los",
      "termsOfService": "Términos de servicio",
      "termsAnd": "y la",
      "privacyPolicy": "Política de privacidad",
      "emailMarketingConsent": "Envíame tips de manifestación y novedades. Al marcar esto, aceptas comunicaciones de marketing. Puedes cancelar cuando quieras."
    },
    "affirmationRead": {
      "title": "Afirma en voz alta con confianza",
      "subtitle": "Di e internaliza tus afirmaciones"
    },
    "embody": {
      "title": "¿Cómo encarnarás tu nueva identidad?",
      "subtitle": "Elige cinco—serán tus Acciones inspiradas. ({{count}} de {{required}})"
    },
    "embodyOptions": {
      "embody_rest": "Descansar",
      "embody_self_care": "Autocuidado",
      "embody_clean_environment": "Ordenar tu entorno",
      "embody_nutrition": "Nutrición",
      "embody_have_fun": "Divertirse",
      "embody_move": "Ejercicio",
      "embody_glam_up": "Arreglarse",
      "embody_connect": "Conectar con otros",
      "embody_seen": "Ser visto y visible",
      "embody_work_or_study": "Trabajar o estudiar"
    },
    "plotSynthesis": {
      "title": "Tu camino está listo.",
      "subtitle": "Todo estará listo al desbloquear Palette Plotting.",
      "items": {
        "subliminals": "Subliminales personalizados.",
        "mirror": "Espejo para autoconcepto.",
        "guideReady": "{{name}} está listo para guiarte.",
        "guideReadyGeneric": "Tu guía está lista.",
        "affirmations": "Afirmaciones para el nuevo tú.",
        "beliefs": "Creencias listas.",
        "journal": "Diario listo."
      }
    },
    "plotLoading": {
      "title": "Construyendo tu camino…",
      "subtitle": "Personalizando tu configuración.",
      "loading": "Cargando",
      "hint": "Tu camino ya está tomando forma.",
      "testimonials": {
        "row1": [
          { "quote": "Por fin mi nueva historia se siente normal.", "author": "Jordan M." },
          { "quote": "Dejé de revisar el 3D y mantuve la constancia—por fin.", "author": "Riley T." },
          { "quote": "La ruta de herramientas era justo lo que necesitaba.", "author": "Casey L." },
          { "quote": "Las afirmaciones sonaban como yo, no genéricas.", "author": "Morgan P." }
        ],
        "row2": [
          { "quote": "Mi autoconcepto cambió rápido cuando tuve estructura.", "author": "Dev S." },
          { "quote": "Un solo lugar para espejo y subliminales me mantuvo honesta.", "author": "Avery K." },
          { "quote": "Las victorias pequeñas se sumaron más rápido de lo que esperaba.", "author": "Quinn R." },
          { "quote": "Ahora termino las sesiones en lugar de perder tiempo en el scroll.", "author": "Jamie H." }
        ]
      }
    },
    "beginJourney": {
      "lead": "Palette Plotting te ayuda a practicar manifestación y encarnar tus deseos.",
      "subtitle": "Comencemos tu camino."
    }
  },
  "legacy": {
    "threeActs": {
      "title": "Tu suite de autoconcepto",
      "subtitle": "Un marco para saltos cuánticos",
      "tools": {
        "subliminalMaker": {
          "title": "Creador de subliminales",
          "description": "Subliminales con beats binaurales"
        },
        "mirrorWork": {
          "title": "Trabajo con espejo",
          "description": "Espejo inmersivo"
        },
        "affirmScript": {
          "title": "Afirmar y escribir",
          "description": "Afirmaciones y visuales personalizados"
        },
        "beliefWork": {
          "title": "Trabajo de creencias",
          "description": "Desarma creencias limitantes"
        },
        "habitTracking": {
          "title": "Hábitos",
          "description": "Progreso diario en tus metas"
        },
        "manifestationJournal": {
          "title": "Diario de manifestación",
          "description": "Diario y notas diarias"
        },
        "pianoTapping": {
          "title": "Piano",
          "description": "Integración táctil de metas"
        }
      }
    },
    "double": {
      "title": "Elige tu guía",
      "subtitle": "Tu guía de IA en los chats",
      "characters": {
        "river": {
          "name": "River",
          "themes": [
            "Transiciones",
            "Carrera"
          ]
        },
        "sage": {
          "name": "Sage",
          "themes": [
            "Finanzas",
            "Identidad"
          ]
        },
        "rose": {
          "name": "Rose",
          "themes": [
            "Amor",
            "Autoconcepto"
          ]
        },
        "oliver": {
          "name": "Oliver",
          "themes": [
            "Autoimagen",
            "Fitness"
          ]
        }
      }
    },
    "digitalMirror": {
      "title": "Trabajo con espejo",
      "subtitle": "Sesiones guiadas para autoconfianza",
      "imageAlt": "Trabajo con espejo"
    },
    "subliminalMaker": {
      "title": "Creador de subliminales",
      "subtitle": "Crea audios subliminales",
      "imageAlt": "Creador de subliminales"
    },
    "manifestationTools": {
      "title": "Herramientas de manifestación",
      "subtitle": "Usa técnicas experimentales para manifestar",
      "imageAlt": "Herramientas de manifestación"
    },
    "habitTracking": {
      "title": "Hábitos y progreso",
      "subtitle": "Sigue progreso y hábitos",
      "imageAlt": "Hábitos y progreso"
    },
    "onboardingQuestions": {
      "title": "Enfoque de manifestación",
      "question": "¿Qué quieres cambiar?",
      "selectUpTo3": "Selecciona hasta 3 opciones",
      "options": {
        "Career": "Carrera",
        "Business": "Negocios",
        "Learning": "Escuela / Exámenes",
        "Finances": "Dinero",
        "Productivity": "Enfoque",
        "Organization": "Reinicio de vida",
        "Confidence": "Autoconcepto",
        "Self-Love": "Belleza / Glow Up",
        "Connections": "Amor",
        "Fitness": "Cuerpo / Fitness",
        "Nutrition": "Bienestar",
        "Discipline": "Disciplina"
      }
    }
  }
}
```

---

## FILE: src/i18n/locales/pt-BR/onboarding.json

```json
{
  "welcome": {
    "signUp": "Cadastrar",
    "ctaSubtext": "Crie seu primeiro subliminar em 3 minutos",
    "freeTrialLine": "Comece seu teste grátis",
    "nativeTitle": "Seus métodos de manifestação",
    "nativeDescription": "Manifeste com facilidade. Crie subliminares, personalize afirmações, faça trabalho com espelho e mais.",
    "awardLine1": "Um dos apps",
    "awardLine2": "de manifestação",
    "awardLine3": "mais completos",
    "webHeadline1": "Manifeste seus desejos agora,",
    "webHeadlineAccent": "Crie seus subliminares",
    "toolRows": {
      "row1": [
        "Subliminares",
        "Afirmações robóticas",
        "Scripting"
      ],
      "row2": [
        "Trabalho com espelho",
        "Crenças",
        "Ação inspirada"
      ],
      "row3": [
        "Listas",
        "Guia com IA"
      ]
    },
    "webSteps": {
      "desire": {
        "title": "Escolha seu desejo",
        "subtitle": "Amor · Beleza · Abundância"
      },
      "makeYours": {
        "title": "Faça do seu jeito",
        "subtitle": "Suas afirmações, sua voz, seus sons"
      },
      "listen": {
        "title": "Ouça e repita",
        "subtitle": "Subliminares prontos para ouvir"
      }
    },
    "webToolbar": {
      "robotic": "Afirmações robóticas",
      "scripting": "Scripting",
      "mirror": "Espelho",
      "more": "E mais"
    },
    "communityProof": "Amado por manifestadoras",
    "mockupScreenAlt": "Criador de subliminares — suas faixas",
    "mockupPreviewAria": "Prévia do Criador de subliminares"
  },
  "setup": {
    "name": {
      "title": "Como devemos te chamar?",
      "firstNameLabel": "Nome",
      "firstNamePlaceholder": "Seu nome",
      "saveError": "Não foi possível salvar. Tente de novo."
    },
    "desireCategory": {
      "title": "O que você mais quer manifestar?",
      "subtitle": "Escolha um foco."
    },
    "conditionalSpecificity": {
      "subtitle": "Isso define sua orientação no app.",
      "fallbackHeadline": "Um detalhe rápido",
      "fallbackMessage": "Volte e escolha uma área de foco.",
      "customLabel": "Descreva seu foco",
      "customPlaceholder": "p. ex., Lançar meu negócio online",
      "spPerson": {
        "headline": "Há uma pessoa específica ligada a este desejo?",
        "nameLabel": "Que nome usamos?",
        "namePlaceholder": "p. ex., Alex",
        "choices": {
          "yes": "Sim",
          "no": "Não",
          "complicated": "É complicado",
          "prefer_not": "Prefiro não dizer"
        }
      },
      "categories": {
        "Finances": {
          "headline": "Que mudança financeira você quer?",
          "options": {
            "consistentIncome": "Renda consistente",
            "debtFreedom": "Sem dívidas",
            "moreSales": "Mais vendas",
            "luxuryEase": "Luxo e facilidade",
            "financialSafety": "Segurança"
          }
        },
        "Self-Love": {
          "headline": "O que você quer sentir quando se vê?",
          "options": {
            "beautiful": "Bonita",
            "desired": "Desejada",
            "radiant": "Radiante",
            "expensive": "Valiosa",
            "seen": "Vista"
          }
        },
        "Career": {
          "headline": "Que resultado de carreira você quer?",
          "options": {
            "newJob": "Novo emprego",
            "promotion": "Promoção",
            "higherPay": "Salário maior",
            "dreamOpportunity": "Oportunidade ideal"
          }
        },
        "Business": {
          "headline": "Que resultado de negócio você quer?",
          "options": {
            "moreSales": "Mais vendas",
            "moreCustomersClients": "Mais clientes",
            "launchSuccess": "Lançamento de sucesso",
            "audienceGrowth": "Mais audiência"
          }
        },
        "Confidence": {
          "headline": "Qual foco de autoconceito combina?",
          "options": {
            "confidence": "Confiança",
            "visibility": "Visibilidade",
            "selfTrust": "Autoconfiança",
            "magnetism": "Magnetismo"
          }
        },
        "Learning": {
          "headline": "Que resultado escolar você quer?",
          "options": {
            "betterGrades": "Notas melhores",
            "examSuccess": "Sucesso em provas",
            "collegeAcceptance": "Aprovação",
            "scholarship": "Bolsa de estudos",
            "focusStudying": "Foco nos estudos"
          }
        },
        "Discipline": {
          "headline": "Onde quer mais constância?",
          "options": {
            "morningRoutine": "Rotina matinal",
            "fitness": "Fitness",
            "studying": "Estudar",
            "work": "Trabalho",
            "selfCare": "Autocuidado"
          }
        },
        "Productivity": {
          "headline": "Onde você quer mais foco?",
          "options": {
            "workProjects": "Projetos de trabalho",
            "studying": "Estudar",
            "creativeWork": "Trabalho criativo",
            "contentCreation": "Criação de conteúdo",
            "dailyRoutine": "Rotina diária"
          }
        },
        "Fitness": {
          "headline": "Que mudança física você quer?",
          "options": {
            "strength": "Força",
            "shapeTone": "Forma e tônus",
            "energy": "Energia",
            "confidence": "Confiança",
            "consistentWorkouts": "Treinos constantes"
          }
        },
        "Nutrition": {
          "headline": "Que mudança de bem-estar você quer?",
          "options": {
            "moreEnergy": "Mais energia",
            "betterRest": "Melhor descanso",
            "emotionalEase": "Calma emocional",
            "balance": "Equilíbrio",
            "softerRoutines": "Rotinas mais leves"
          }
        },
        "Organization": {
          "headline": "Que parte da vida quer reiniciar?",
          "options": {
            "mySpace": "Meu espaço",
            "mySchedule": "Minha agenda",
            "myRoutines": "Minhas rotinas",
            "myEnvironment": "Meu ambiente",
            "myPriorities": "Minhas prioridades"
          }
        }
      }
    },
    "currentFriction": {
      "title": "Que crença quer mudar?",
      "subtitle": "Que crença bloqueia sua manifestação?",
      "placeholder": "Descreva a crença que quer mudar…"
    },
    "toolPreference": {
      "title": "Como você quer receber apoio?",
      "subtitle": "Escolha as ferramentas para começar."
    },
    "toolPreferenceOptions": {
      "powerful_affirmations": "Afirmações poderosas",
      "custom_subliminals": "Subliminares",
      "mirror_work_reset": "Espelho",
      "belief_restructuring": "Crenças",
      "ai_manifestation_guidance": "Guia com IA",
      "daily_wins_progress": "Constância e progresso"
    },
    "guide": {
      "title": "Escolha um guia",
      "subtitle": "Um guia de IA para suas dúvidas."
    },
    "manifestationIntensity": {
      "title": "Escolha sua intensidade",
      "subtitle": "Defina rotina e notificações opcionais.",
      "setRoutine": "Definir rotina",
      "notificationsQuestion": "Quer notificações para voltar à rotina?",
      "notificationsHint": "As notificações apoiam sua rotina: lembram você de voltar ao app.",
      "yes": "Sim",
      "notNow": "Agora não",
      "dailyTime": "Horário diário",
      "customizeInSettings": "Personalize depois em Configurações.",
      "light": {
        "title": "Leve",
        "tagline": "A rotina recomendada.",
        "description": "Manifestação leve, com notificações diárias se quiser."
      },
      "consistent": {
        "title": "Consistente",
        "tagline": "Para manifestadores experientes.",
        "description": "Intensidade moderada. 2 notificações diárias."
      },
      "lockedIn": {
        "title": "Focado",
        "tagline": "A rotina mais intensa.",
        "description": "Metas intensas. 3 notificações diárias."
      },
      "alerts": {
        "alert": "Alerta",
        "first": "1.º alerta",
        "second": "2.º alerta",
        "third": "3.º alerta"
      }
    },
    "notifications": {
      "title": "Ative permissões",
      "subtitle": "Ajude-nos a melhorar o Palette Plotting."
    },
    "tracking": {
      "title": "Ajude-nos a melhorar (opcional)",
      "body": "Usamos dados de atividade para medir anúncios e melhorar o app. Você ajuda?",
      "yes": "Sim",
      "no": "Não"
    },
    "email": {
      "title": "Salve seu caminho",
      "titleLine1": "Salve seu caminho e",
      "titleLine2": "comece seu teste grátis",
      "subtitle": "Crie sua conta para salvar seu caminho. Seu progresso fica neste e-mail.",
      "emailLabel": "E-mail",
      "passwordLabel": "Senha",
      "emailPlaceholder": "voce@email.com",
      "passwordPlaceholder": "8+ caracteres",
      "invalidEmail": "Digite um e-mail válido",
      "needFirstName": "Precisamos do seu nome.",
      "passwordLength": "Digite uma senha de 8+ caracteres",
      "acceptTerms": "Aceite os Termos e a Privacidade",
      "subscriptionError": "Não foi possível abrir assinaturas. Tente de novo.",
      "tryAgain": "Tentar de novo",
      "checkingAvailability": "Verificando disponibilidade…",
      "hidePassword": "Ocultar senha",
      "showPassword": "Mostrar senha",
      "termsAcceptPrefix": "Aceito os",
      "termsOfService": "Termos de serviço",
      "termsAnd": "e a",
      "privacyPolicy": "Política de privacidade",
      "emailMarketingConsent": "Envie tips de manifestação e novidades. Ao marcar, você consente com comunicações de marketing. Você pode cancelar quando quiser."
    },
    "affirmationRead": {
      "title": "Afirme em voz alta com confiança",
      "subtitle": "Fale e internalize suas afirmações"
    },
    "embody": {
      "title": "Como encarnar sua nova identidade?",
      "subtitle": "Escolha cinco — elas viram Ações inspiradas. ({{count}} de {{required}})"
    },
    "embodyOptions": {
      "embody_rest": "Descansar",
      "embody_self_care": "Autocuidado",
      "embody_clean_environment": "Organizar o ambiente",
      "embody_nutrition": "Nutrição",
      "embody_have_fun": "Divertir-se",
      "embody_move": "Exercício",
      "embody_glam_up": "Caprichar",
      "embody_connect": "Conectar com outros",
      "embody_seen": "Ser visto e visível",
      "embody_work_or_study": "Trabalhar ou estudar"
    },
    "plotSynthesis": {
      "title": "Seu caminho está pronto.",
      "subtitle": "Tudo fica pronto ao desbloquear o Palette Plotting.",
      "items": {
        "subliminals": "Subliminares personalizados.",
        "mirror": "Espelho para autoconceito.",
        "guideReady": "{{name}} está pronto para te guiar.",
        "guideReadyGeneric": "Seu guia está pronto.",
        "affirmations": "Afirmações para o novo você.",
        "beliefs": "Crenças prontas.",
        "journal": "Diário pronto."
      }
    },
    "plotLoading": {
      "title": "Construindo seu caminho…",
      "subtitle": "Personalizando sua configuração.",
      "loading": "Carregando",
      "hint": "Seu caminho já está tomando forma.",
      "testimonials": {
        "row1": [
          { "quote": "Finalmente minha nova história parece normal.", "author": "Jordan M." },
          { "quote": "Parei de checar o 3D e mantive constância—finalmente.", "author": "Riley T." },
          { "quote": "O caminho de ferramentas era exatamente o que eu precisava.", "author": "Casey L." },
          { "quote": "As afirmações pareciam comigo, não genéricas.", "author": "Morgan P." }
        ],
        "row2": [
          { "quote": "Meu autoconceito mudou rápido quando tive estrutura.", "author": "Dev S." },
          { "quote": "Ter um lugar para espelho e subliminares me manteve firme.", "author": "Avery K." },
          { "quote": "Pequenas vitórias somaram mais rápido do que eu esperava.", "author": "Quinn R." },
          { "quote": "Agora termino as sessões em vez de ficar no scroll.", "author": "Jamie H." }
        ]
      }
    },
    "beginJourney": {
      "lead": "Palette Plotting ajuda você a praticar manifestação e encarnar seus desejos.",
      "subtitle": "Vamos começar sua jornada."
    }
  },
  "legacy": {
    "threeActs": {
      "title": "Sua suíte de autoconceito",
      "subtitle": "Uma estrutura para saltos quânticos",
      "tools": {
        "subliminalMaker": {
          "title": "Criador de subliminares",
          "description": "Subliminares com batidas binaurais"
        },
        "mirrorWork": {
          "title": "Trabalho com espelho",
          "description": "Espelho imersivo"
        },
        "affirmScript": {
          "title": "Afirmar e escrever",
          "description": "Afirmações e visuais personalizados"
        },
        "beliefWork": {
          "title": "Trabalho de crenças",
          "description": "Desconstrua crenças limitantes"
        },
        "habitTracking": {
          "title": "Hábitos",
          "description": "Progresso diário nas metas"
        },
        "manifestationJournal": {
          "title": "Diário de manifestação",
          "description": "Diário e notas diárias"
        },
        "pianoTapping": {
          "title": "Piano",
          "description": "Integração tátil de metas"
        }
      }
    },
    "double": {
      "title": "Escolha um guia",
      "subtitle": "Um guia de IA nos chats",
      "characters": {
        "river": {
          "name": "River",
          "themes": [
            "Transições",
            "Carreira"
          ]
        },
        "sage": {
          "name": "Sage",
          "themes": [
            "Finanças",
            "Identidade"
          ]
        },
        "rose": {
          "name": "Rose",
          "themes": [
            "Amor",
            "Autoconceito"
          ]
        },
        "oliver": {
          "name": "Oliver",
          "themes": [
            "Autoimagem",
            "Fitness"
          ]
        }
      }
    },
    "digitalMirror": {
      "title": "Trabalho com espelho",
      "subtitle": "Sessões guiadas para autoconfiança",
      "imageAlt": "Trabalho com espelho"
    },
    "subliminalMaker": {
      "title": "Criador de subliminares",
      "subtitle": "Crie áudios subliminares",
      "imageAlt": "Criador de subliminares"
    },
    "manifestationTools": {
      "title": "Ferramentas de manifestação",
      "subtitle": "Use técnicas experimentais para manifestar",
      "imageAlt": "Ferramentas de manifestação"
    },
    "habitTracking": {
      "title": "Hábitos e progresso",
      "subtitle": "Acompanhe progresso e hábitos",
      "imageAlt": "Hábitos e progresso"
    },
    "onboardingQuestions": {
      "title": "Foco de manifestação",
      "question": "O que você quer mudar?",
      "selectUpTo3": "Selecione até 3 opções",
      "options": {
        "Career": "Carreira",
        "Business": "Negócios",
        "Learning": "Escola / Provas",
        "Finances": "Dinheiro",
        "Productivity": "Foco",
        "Organization": "Recomeço de vida",
        "Confidence": "Autoconceito",
        "Self-Love": "Beleza / Glow Up",
        "Connections": "Amor",
        "Fitness": "Corpo / Fitness",
        "Nutrition": "Bem-estar",
        "Discipline": "Disciplina"
      }
    }
  }
}
```

---



---


## FILE: src/i18n/locales/en/common.json

```json
{
  "continue": "Continue",
  "back": "Back",
  "signIn": "Sign In",
  "alreadyHaveAccountSignIn": "Already have an account? Sign in",
  "save": "Save",
  "cancel": "Cancel",
  "close": "Close",
  "loading": "Loading…",
  "error": "Something went wrong",
  "legalEnglishDisclaimer": "",
  "edgeErrors": {
    "permissionDenied": "Permission denied. Please ensure you're logged in and try again.",
    "genericRetry": "An error occurred. Please try again.",
    "databaseError": "Database error. Please try again.",
    "serviceUnavailable": "Service temporarily unavailable. Please try again.",
    "unknownError": "Unknown error",
    "noCharacterSelected": "No character selected. Please select a character first.",
    "failedToGenerateMessage": "Failed to generate message",
    "noMessageGenerated": "No message generated",
    "dailyMessageLimit": "You've reached your daily message limit ({{limit}} messages). Resets at midnight.",
    "userIdAndMessageRequired": "User ID and message are required.",
    "connectionError": "Connection error. Check your network and try again.",
    "unauthorized": "You are not authorized. Please sign in and try again.",
    "invalidRequest": "Invalid request. Please try again."
  }
}
```

---

## FILE: src/i18n/locales/es-419/common.json

```json
{
  "continue": "Continuar",
  "back": "Atrás",
  "signIn": "Iniciar sesión",
  "alreadyHaveAccountSignIn": "¿Ya tienes cuenta? Inicia sesión",
  "save": "Guardar",
  "cancel": "Cancelar",
  "close": "Cerrar",
  "loading": "Cargando…",
  "error": "Algo salió mal",
  "legalEnglishDisclaimer": "",
  "edgeErrors": {
    "permissionDenied": "Permiso denegado. Inicia sesión e inténtalo de nuevo.",
    "genericRetry": "Ocurrió un error. Inténtalo de nuevo.",
    "databaseError": "Error de base de datos. Intenta de nuevo.",
    "serviceUnavailable": "Servicio temporalmente no disponible. Inténtalo de nuevo.",
    "unknownError": "Error desconocido",
    "noCharacterSelected": "Selecciona un personaje primero.",
    "failedToGenerateMessage": "No se pudo generar el mensaje",
    "noMessageGenerated": "No se generó ningún mensaje",
    "dailyMessageLimit": "Alcanzaste tu límite diario de mensajes ({{limit}}). Se reinicia a medianoche.",
    "userIdAndMessageRequired": "Se requieren el ID de usuario y el mensaje.",
    "connectionError": "Error de conexión. Revisa tu red e intenta de nuevo.",
    "unauthorized": "No estás autorizado. Inicia sesión e intenta de nuevo.",
    "invalidRequest": "Solicitud inválida. Intenta de nuevo."
  }
}
```

---

## FILE: src/i18n/locales/pt-BR/common.json

```json
{
  "continue": "Continuar",
  "back": "Voltar",
  "signIn": "Entrar",
  "alreadyHaveAccountSignIn": "Já tem uma conta? Entre",
  "save": "Salvar",
  "cancel": "Cancelar",
  "close": "Fechar",
  "loading": "Carregando…",
  "error": "Algo deu errado",
  "legalEnglishDisclaimer": "",
  "edgeErrors": {
    "permissionDenied": "Permissão negada. Entre e tente de novo.",
    "genericRetry": "Ocorreu um erro. Tente novamente.",
    "databaseError": "Erro no banco. Tente de novo.",
    "serviceUnavailable": "Serviço temporariamente indisponível. Tente novamente.",
    "unknownError": "Erro desconhecido",
    "noCharacterSelected": "Selecione um personagem primeiro.",
    "failedToGenerateMessage": "Falha ao gerar mensagem",
    "noMessageGenerated": "Nenhuma mensagem gerada",
    "dailyMessageLimit": "Você atingiu seu limite diário de mensagens ({{limit}}). O limite reinicia à meia-noite.",
    "userIdAndMessageRequired": "ID do usuário e mensagem são obrigatórios.",
    "connectionError": "Erro de conexão. Verifique sua rede e tente novamente.",
    "unauthorized": "Você não está autorizado. Entre e tente novamente.",
    "invalidRequest": "Solicitação inválida. Tente novamente."
  }
}
```

---


---

## Part 2 — RevenueCat Paywall

## Verification notes

- Object spread in source is three-dot spread on corsHeaders etc. Markdown viewers may mangle leading dots.
- postPaywall.commitmentText updated in es-419 and pt-BR paywall.json (natural say-out-loud copy).

## File index

- src/pages/onboarding/IOSPaywall.tsx
- src/pages/onboarding/AndroidPaywall.tsx
- src/pages/onboarding/WebPaywall.tsx
- src/pages/onboarding/PostPaywallLoading.tsx
- src/pages/onboarding/AndroidPostPaywallLoading.tsx
- src/pages/PaymentProcessing.tsx
- src/services/revenueCat.ts
- src/services/revenueCatWeb.ts
- src/services/revenueCatAttribution.ts
- src/services/revenueCatManageBilling.ts
- src/lib/runIosPaywallFlow.ts
- src/lib/runAndroidPaywallFlow.ts
- src/lib/runWebPaywallFlow.ts
- src/lib/isIosPaywallContext.ts
- src/lib/isAndroidPaywallContext.ts
- src/lib/iosRevenueCatUiGate.ts
- src/lib/iosPostPurchaseEntitlementGate.ts
- src/lib/androidPostPurchaseEntitlementGate.ts
- src/lib/postPaywallProvisioning.ts
- src/lib/revenueCatPaywallMedia.ts
- src/lib/revenueCatBillingPortalUrl.ts
- src/lib/nativeIosPremiumPurchase.ts
- src/lib/startWebStripeCheckout.ts
- src/lib/appleIAP.ts
- src/lib/webFirstPurchaseGetAppPrompt.ts
- src/hooks/useAppleIAP.ts
- src/components/WebGetAppAfterPurchaseDialog.tsx
- src/lib/locale.ts
- src/i18n/index.ts
- src/i18n/locales/en/paywall.json
- src/i18n/locales/es-419/paywall.json
- src/i18n/locales/pt-BR/paywall.json
- src/contexts/AuthContext.tsx
- src/App.tsx
- src/pages/Settings.tsx
- src/components/LanguageSwitcher.tsx
- supabase/functions/_shared/revenueCatSecretEnv.ts
- supabase/functions/_shared/revenuecatUserPlansSync.ts
- supabase/functions/_shared/postStripeToRevenueCat.ts
- supabase/functions/_shared/revenueCatSubscriptionEventStore.ts
- supabase/functions/_shared/revenueCatAttributionAttributes.ts

## Localization

- paywall.json en / es-419 / pt-BR
- resolveRevenueCatUILocale() -> revenueCatUILocaleForApp() maps en | es-419 | pt-BR
- syncRevenueCatUILocale on login, language change, Settings manage billing
- useAppleIAP: bootstrapRevenueCat + syncRevenueCatUILocale before presentCustomerCenter()
- revenueCatManageBilling: locale sync before web billing portal on native
- Customer Center runtime test required: en / es-419 / pt-BR

## postPaywall commitment (es-419)

He nombrado lo que quiero y no lo abandonaré cuando aparezca la duda. Me comprometo a darle a mi deseo mi voz, mi atención y mi constancia. No esperaré a sentir que ya es el momento — actuaré como la persona que ya está en este camino. Lo que quiero merece más que un pensamiento pasajero; merece mi sí completo.

## postPaywall commitment (pt-BR)

Eu nomeei o que quero e não vou abandonar isso quando a dúvida aparecer. Eu me comprometo a dar ao meu desejo minha voz, minha atenção e minha constância. Não vou esperar sentir que chegou a hora — vou agir como a pessoa que já está neste caminho. O que eu quero merece mais que um pensamento passageiro; merece meu sim completo.

---

## FILE: src/pages/onboarding/IOSPaywall.tsx

```tsx
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X, Check } from "lucide-react";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog, getDebugLog } from "@/debugLog";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { IosAppHeader } from "@/components/IosAppHeader";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { supabase } from "@/integrations/supabase/client";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { useAppleIAP } from "@/hooks/useAppleIAP";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import { resolveAppLocale, legalTermsUrl, legalPrivacyUrl } from "@/lib/locale";
/** Matches native Welcome.tsx “Start your free trial” line. */
const NATIVE_WELCOME_PINK = "#e8b8cc";

function extractLeadingPriceNumber(priceString: string): number | null {
  const m = priceString.match(/[\d,.]+/);
  if (!m) return null;
  const normalized = m[0].replace(/,/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatOnlyPerMonthLine(annualPriceString: string, t: TFunction<"paywall">): string | null {
  const annualNum = extractLeadingPriceNumber(annualPriceString);
  if (annualNum == null) return null;
  const per = (annualNum / 12).toFixed(2);
  const symMatch = annualPriceString.match(/^[^\d\s,.]+/);
  const sym = symMatch?.[0]?.trim() || "$";
  return t("legacyIos.onlyPerMonth", { amount: `${sym}${per}` });
}

async function openExternalUrl(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Native iOS subscription: RevenueCat paywall UI (newer iOS) or Monthly/Annual + StoreKit (compat).
 * Shown from native iOS onboarding (e.g. after email collection) and resubscribe; deep links may still open this route.
 */
const IOSPaywall = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const appLocale = resolveAppLocale(i18n.language);
  const termsUrl = legalTermsUrl(appLocale);
  const privacyUrl = legalPrivacyUrl(appLocale);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { restore, isRestoring, getProduct } = useAppleIAP();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>("weekly");
  /**
   * null = still resolving. true = direct StoreKit compat (must pick monthly vs annual in-app).
   * false = RevenueCat paywall UI (offering shows whatever packages you configured).
   */
  const [isCompatStoreKitPaywall, setIsCompatStoreKitPaywall] = useState<boolean | null>(null);

  const showPaywallScreen = isIosPaywallContext();
  const canCallNativePaywall = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const weeklyProduct = getProduct("weekly");
  const monthlyProduct = getProduct("monthly");
  const annualProduct = getProduct("annual");
  const weeklyPriceDisplay = weeklyProduct?.priceString || "—";
  const monthlyPriceDisplay = monthlyProduct?.priceString || "—";
  const annualPriceDisplay = annualProduct?.priceString || "—";
  const annualPerMonthLine =
    annualProduct?.priceString ? formatOnlyPerMonthLine(annualProduct.priceString, t) : null;

  useEffect(() => {
    let cancelled = false;
    if (!canCallNativePaywall) {
      setIsCompatStoreKitPaywall(false);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const useRcUi = await shouldUseRevenueCatPaywallUi();
        if (!cancelled) setIsCompatStoreKitPaywall(!useRcUi);
      } catch {
        if (!cancelled) setIsCompatStoreKitPaywall(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canCallNativePaywall]);

  useEffect(() => {
    debugLog({
      location: "IOSPaywall.tsx:mount",
      message: "IOSPaywall mounted (fallback route)",
      data: { pathname: location.pathname, showPaywallScreen, canCallNativePaywall },
      hypothesisId: "H1",
    });
  }, [location.pathname, showPaywallScreen, canCallNativePaywall]);

  useEffect(() => {
    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  const runPaywallFlow = useCallback(
    async (billingPeriod?: BillingPeriod) => {
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();
      debugLog({
        location: "IOSPaywall.tsx:runPaywallFlow:start",
        message: "Continue / Try again tapped",
        data: {
          pathname: location.pathname,
          canCallNativePaywall,
          showPaywallScreen,
          platform,
          isNative,
          hasAuthUserId: !!user?.id,
          billingPeriod: billingPeriod ?? null,
        },
        hypothesisId: "H-CTA",
      });
      if (!canCallNativePaywall) {
        debugLog({
          location: "IOSPaywall.tsx:runPaywallFlow:blocked",
          message: "Not native iOS — cannot open native paywall",
          data: {
            reason: "NOT_NATIVE_IOS",
            platform,
            isNative,
            explain: "Capacitor.isNativePlatform() && getPlatform()==='ios' was false",
          },
          hypothesisId: "H-CTA",
        });
        toast.error(t("paywall:legacyIos.errorNotIosApp"), { duration: 6000 });
        setFallbackDetail(t("paywall:legacyIos.errorNotIosApp"));
        setShowFallback(true);
        return;
      }

      setFallbackDetail(null);
      setPaywallOpening(true);

      try {
        let uid = user?.id ?? null;
        const fromAuth = !!user?.id;
        if (!uid) {
          const { data, error } = await supabase.auth.getUser();
          uid = data.user?.id ?? null;
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:userId",
            message: "Resolved user id via supabase.auth.getUser",
            data: {
              hadAuthContextUser: fromAuth,
              resolvedUserId: !!uid,
              getUserError: error?.message ?? null,
            },
            hypothesisId: "H-CTA",
          });
        } else {
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:userId",
            message: "Using user id from AuthContext",
            data: { hadAuthContextUser: true, resolvedUserId: true },
            hypothesisId: "H-CTA",
          });
        }

        if (!uid) {
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:blocked",
            message: "No Supabase user session — paywall cannot attribute purchase",
            data: {
              reason: "NO_USER_ID",
              explain: "user?.id and getUser() both missing; user may need to sign in again",
            },
            hypothesisId: "H-CTA",
          });
          toast.error(t("paywall:legacyIos.errorSignInAgain"), { duration: 8000 });
          setFallbackDetail(t("paywall:legacyIos.errorNoSession"));
          setShowFallback(true);
          return;
        }

        const periodForFlow =
          isCompatStoreKitPaywall === true ? (billingPeriod ?? selectedPlan) : billingPeriod;

        const outcome = await runIosPaywallFlowAfterSignup({
          userId: uid,
          navigate,
          bypassPresentationLock: true,
          billingPeriod: periodForFlow,
        });
        const lastErr = getLastPaywallError();

        if (outcome === "success") {
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:done",
            message: "Paywall flow success",
            data: { outcome },
            hypothesisId: "H-CTA",
          });
          return;
        }

        debugLog({
          location: "IOSPaywall.tsx:runPaywallFlow:done",
          message: "Paywall flow finished without success",
          data: {
            outcome,
            lastPaywallError: lastErr,
            hint:
              outcome === "present_failed"
                ? "Check RevenueCat key, offering id Production Offering, RC dashboard, or compat StoreKit path logs in revenueCat.ts"
                : outcome === "skipped"
                  ? "runIosPaywallFlow thought platform was not native iOS"
                  : outcome === "error"
                    ? "Exception before/during native paywall — see runIosPaywallFlow.ts:catch log"
                    : "See earlier revenueCat / runIosPaywall logs",
          },
          hypothesisId: "H-CTA",
        });

        if (outcome === "skipped") {
          toast.error(t("paywall:legacyIos.errorOpenFromSignup"), { duration: 6000 });
          setFallbackDetail(t("paywall:legacyIos.errorSkippedDetail"));
          setShowFallback(true);
          return;
        }
        setFallbackDetail(lastErr || t("paywall:legacyIos.errorGeneric"));
        setShowFallback(true);
      } catch (e) {
        debugLog({
          location: "IOSPaywall.tsx:runPaywallFlow:catch",
          message: "Unexpected error in IOSPaywall paywall handler",
          data: {
            err: String((e as Error)?.message ?? e),
            stack: (e as Error)?.stack?.slice(0, 500) ?? null,
          },
          hypothesisId: "H-CTA",
        });
        toast.error(t("paywall:legacyIos.errorPersist"), {
          duration: 8000,
        });
        setFallbackDetail(String((e as Error)?.message ?? e));
        setShowFallback(true);
      } finally {
        setPaywallOpening(false);
      }
    },
    [canCallNativePaywall, navigate, user?.id, showPaywallScreen, location.pathname, isCompatStoreKitPaywall, selectedPlan, t]
  );

  const handleContinue = () => {
    void runPaywallFlow(isCompatStoreKitPaywall === true ? selectedPlan : undefined);
  };

  const handleRestore = async () => {
    if (!canCallNativePaywall) {
      toast.error(t("paywall:legacyIos.restoreOnlyIos"));
      return;
    }
    const r = await restore();
    if (r.success) {
      toast.success(t("paywall:legacyIos.restoredSuccess"));
      setTimeout(() => navigate("/dashboard"), 500);
    } else {
      const msg = r.error || t("paywall:legacyIos.nothingToRestore");
      if (msg.toLowerCase().includes("cancel")) {
        toast.message(t("paywall:legacyIos.restoreCancelled"));
      } else {
        toast.error(msg);
      }
    }
  };

  const continueDisabled =
    paywallOpening || (canCallNativePaywall && isCompatStoreKitPaywall === null);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-3 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-left">
        {canCallNativePaywall ? (
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={isRestoring || paywallOpening}
            className="touch-manipulation text-left font-medium text-zinc-800 disabled:opacity-50"
          >
            {isRestoring ? t("paywall:legacyIos.restoring") : t("paywall:legacyIos.restorePurchases")}
          </button>
        ) : (
          <span className="text-zinc-400">{t("paywall:legacyIos.restore")}</span>
        )}
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => void openExternalUrl(termsUrl)}
        >
          {t("paywall:legacyIos.terms")}
        </button>
      </div>
      <div className="text-right">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => void openExternalUrl(privacyUrl)}
        >
          {t("paywall:legacyIos.privacy")}
        </button>
      </div>
    </div>
  );

  const planSection = (
    <div className="mt-8 flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={() => setSelectedPlan("weekly")}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors touch-manipulation",
          selectedPlan === "weekly"
            ? "border-black bg-white"
            : "border-transparent bg-zinc-100 hover:bg-zinc-50"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              selectedPlan === "weekly" ? "border-black bg-black" : "border-zinc-300 bg-white"
            )}
            aria-hidden
          >
            {selectedPlan === "weekly" ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
          </span>
          <span className="font-semibold text-zinc-900">{t("paywall:legacyIos.weekly")}</span>
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-900">
          {t("paywall:legacyIos.perWeek", { price: weeklyPriceDisplay })}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelectedPlan("monthly")}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors touch-manipulation",
          selectedPlan === "monthly"
            ? "border-black bg-white"
            : "border-transparent bg-zinc-100 hover:bg-zinc-50"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              selectedPlan === "monthly" ? "border-black bg-black" : "border-zinc-300 bg-white"
            )}
            aria-hidden
          >
            {selectedPlan === "monthly" ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
          </span>
          <span className="font-semibold text-zinc-900">{t("paywall:legacyIos.monthly")}</span>
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-900">
          {t("paywall:legacyIos.perMonth", { price: monthlyPriceDisplay })}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelectedPlan("annual")}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors touch-manipulation",
          selectedPlan === "annual"
            ? "border-black bg-white"
            : "border-transparent bg-zinc-100 hover:bg-zinc-50"
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                selectedPlan === "annual" ? "border-black bg-black" : "border-zinc-300 bg-white"
              )}
              aria-hidden
            >
              {selectedPlan === "annual" ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
            </span>
            <span className="font-semibold text-zinc-900">{t("paywall:legacyIos.yearly")}</span>
          </div>
          {annualPerMonthLine ? (
            <p className="pl-9 text-xs text-zinc-500">{annualPerMonthLine}</p>
          ) : (
            <p className="pl-9 text-xs text-zinc-500">{t("paywall:legacyIos.bestAnnualValue")}</p>
          )}
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-900">
          {t("paywall:legacyIos.perYear", { price: annualPriceDisplay })}
        </span>
      </button>
    </div>
  );

  return (
    <div
      className="relative min-h-screen font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground
        className="pointer-events-none fixed inset-0 z-0"
        tone="deep-black"
      />
      <IosAppHeader signOutInsteadOfLogin={!!user} cosmicShell />

      <div
        className="relative z-10 mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{ minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))" }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 text-foreground shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label={t("paywall:legacyIos.closeAria")}
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" aria-hidden>
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#000000"
                strokeWidth="1"
                fill="none"
              />
              <circle cx="44" cy="12" r="6" stroke="#000000" strokeWidth="1" fill="none" />
              <path d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z" fill="#000000" opacity="0.35" />
              <circle cx="96" cy="10" r="1.2" fill="#000000" />
              <circle cx="104" cy="16" r="1" fill="#000000" />
              <circle cx="88" cy="18" r="0.8" fill="#000000" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              <span className="block">{t("paywall:legacyIos.titleLine1")}</span>
              <span className="mt-1 block" style={{ color: NATIVE_WELCOME_PINK }}>
                {t("paywall:legacyIos.titleLine2")}
              </span>
            </h1>
            <p className="mt-3 text-sm text-zinc-500">{t("paywall:legacyIos.subtitle")}</p>
          </div>

          {!showFallback ? (
            <>
              {canCallNativePaywall && isCompatStoreKitPaywall === null ? (
                <p className="mt-6 text-center text-sm text-zinc-500">{t("paywall:legacyIos.loadingOptions")}</p>
              ) : null}
              {planSection}
              <Button
                type="button"
                onClick={handleContinue}
                disabled={continueDisabled}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyIos.opening") : t("common:continue")}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">{t("paywall:legacyIos.fallbackTitle")}</h2>
                <p className="mt-1 text-sm text-zinc-600">{t("paywall:legacyIos.fallbackBody")}</p>
                {fallbackDetail ? (
                  <p className="mt-2 text-xs text-zinc-500 break-words" data-testid="paywall-error">
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              {planSection}
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyIos.opening") : t("paywall:legacyIos.tryAgain")}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="pointer-events-none m-0 size-0 overflow-hidden border-0 bg-transparent p-0 opacity-0 select-none text-white"
          tabIndex={-1}
          aria-hidden="true"
          disabled
          onClick={async () => {
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(getDebugLog() || "(no log yet)");
                toast.success("Debug log copied.");
              }
            } catch {
              /* noop */
            }
          }}
        >
          Copy debug log
        </button>
      )}
    </div>
  );
};

export default IOSPaywall;

```

---

## FILE: src/pages/onboarding/AndroidPaywall.tsx

```tsx
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { IosAppHeader } from "@/components/IosAppHeader";
import i18n from "@/i18n";
import { resolveAppLocale, legalTermsUrl, legalPrivacyUrl } from "@/lib/locale";

/**
 * Native Android subscription paywall. Uses RevenueCat paywall UI to present
 * Google Play subscriptions. Completely separate from the iOS paywall.
 */
const AndroidPaywall = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const appLocale = resolveAppLocale(i18n.language);
  const termsUrl = legalTermsUrl(appLocale);
  const privacyUrl = legalPrivacyUrl(appLocale);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);

  const isNativeAndroid = isAndroidPaywallContext();

  useEffect(() => {
    debugLog({
      location: "AndroidPaywall.tsx:mount",
      message: "AndroidPaywall mounted",
      data: {
        pathname: location.pathname,
        isNativeAndroid,
      },
      hypothesisId: "ANDROID-PAY",
    });
  }, [location.pathname, isNativeAndroid]);

  const runPaywallFlow = useCallback(async () => {
    if (!isNativeAndroid) {
      toast.error(t("paywall:legacyAndroid.errorNotAndroidApp"), {
        duration: 6000,
      });
      setFallbackDetail(t("paywall:legacyAndroid.errorNotAndroidApp"));
      setShowFallback(true);
      return;
    }

    setFallbackDetail(null);
    setPaywallOpening(true);

    try {
      let uid = user?.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
        if (error || !uid) {
          toast.error(t("paywall:legacyAndroid.errorSignInAgain"), {
            duration: 8000,
          });
          setFallbackDetail(t("paywall:legacyAndroid.errorNoSession"));
          setShowFallback(true);
          return;
        }
      }

      const outcome = await runAndroidPaywallFlowAfterSignup({
        userId: uid,
        navigate,
        bypassPresentationLock: true,
      });
      const lastErr = getLastPaywallError();

      if (outcome === "success") return;

      if (outcome === "skipped") {
        toast.error(t("paywall:legacyAndroid.errorOpenFromSignup"), {
          duration: 6000,
        });
        setFallbackDetail(t("paywall:legacyAndroid.errorSkippedDetail"));
        setShowFallback(true);
        return;
      }
      setFallbackDetail(lastErr || t("paywall:legacyAndroid.errorGeneric"));
      setShowFallback(true);
    } catch (e) {
      debugLog({
        location: "AndroidPaywall.tsx:runPaywallFlow:catch",
        message: "Unexpected error in AndroidPaywall paywall handler",
        data: {
          err: String((e as Error)?.message ?? e),
          stack: (e as Error)?.stack?.slice(0, 500) ?? null,
        },
        hypothesisId: "ANDROID-PAY",
      });
      toast.error(t("paywall:legacyAndroid.errorGeneric"), { duration: 8000 });
      setFallbackDetail(String((e as Error)?.message ?? e));
      setShowFallback(true);
    } finally {
      setPaywallOpening(false);
    }
  }, [isNativeAndroid, navigate, user?.id, t]);

  const handleContinue = () => {
    void runPaywallFlow();
  };

  useEffect(() => {
    if (!isNativeAndroid) {
      navigate("/onboarding/welcome", { replace: true });
    }
  }, [isNativeAndroid, navigate]);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-2 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(termsUrl, "_blank", "noopener,noreferrer")}
        >
          {t("paywall:legacyAndroid.terms")}
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(privacyUrl, "_blank", "noopener,noreferrer")}
        >
          {t("paywall:legacyAndroid.privacy")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-foreground">
      <IosAppHeader signOutInsteadOfLogin={!!user} />

      <div
        className="mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{
          minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label={t("paywall:legacyAndroid.closeAria")}
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg
              width="120"
              height="28"
              viewBox="0 0 120 28"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="44"
                cy="12"
                r="6"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z"
                fill="#B8860B"
                opacity="0.35"
              />
              <circle cx="96" cy="10" r="1.2" fill="#B8860B" />
              <circle cx="104" cy="16" r="1" fill="#B8860B" />
              <circle cx="88" cy="18" r="0.8" fill="#B8860B" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {t("paywall:legacyAndroid.title")}
            </h1>
            <p className="mt-3 text-xs text-zinc-500">{t("paywall:legacyAndroid.subtitle")}</p>
          </div>

          {!showFallback ? (
            <>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyAndroid.opening") : t("common:continue")}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">
                  {t("paywall:legacyAndroid.fallbackTitle")}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">{t("paywall:legacyAndroid.fallbackBody")}</p>
                {fallbackDetail ? (
                  <p
                    className="mt-2 text-xs text-zinc-500 break-words"
                    data-testid="paywall-error"
                  >
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyAndroid.opening") : t("paywall:legacyAndroid.tryAgain")}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AndroidPaywall;

```

---

## FILE: src/pages/onboarding/WebPaywall.tsx

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getLastWebPaywallError,
  getWebRevenueCatCheckoutQuote,
  isRevenueCatWebConfigured,
  presentWebRevenueCatPaywall,
} from "@/services/revenueCatWeb";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import { armWebGetAppPromptPending } from "@/lib/webFirstPurchaseGetAppPrompt";
import { attachHideBrokenRevenueCatPaywallMedia } from "@/lib/revenueCatPaywallMedia";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";

/**
 * Web subscription: RevenueCat Web Billing paywall (purchases-js).
 * Used from onboarding email and /resubscribe on browser.
 */
export default function WebPaywall() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"paywall" | "dismissed" | "error">("paywall");
  const [presenting, setPresenting] = useState(false);
  const autoPresentedRef = useRef(false);

  const openPaywall = useCallback(async () => {
    if (!user?.id || presenting || !containerRef.current) return;

    setPresenting(true);
    setPhase("paywall");
    const quote = await getWebRevenueCatCheckoutQuote(user.id);
    try {
      const creds = await ensureOnboardingSessionCreds();
      await supabase.functions.invoke("update-onboarding-session", {
        body: {
          sessionId: creds.sessionId,
          resumeToken: creds.resumeToken,
          patch: {
            paywall_id: "web_revenuecat_paywall",
            paywall_variant: "default",
            offering_id: quote?.contentId ?? null,
            product_id: quote?.contentId ?? null,
          },
        },
      });
    } catch {
      /* non-fatal */
    }
    trackMarketingConversion("paywall_view", {
      source: "web_revenuecat_paywall",
      page_path: "/onboarding/web-paywall",
      content_id: quote?.contentId ?? "/onboarding/web-paywall",
      content_name: quote?.contentName ?? "web_revenuecat_paywall",
      ...(quote ? { value: quote.value, currency: quote.currency } : {}),
    });
    const paywallResult = await presentWebRevenueCatPaywall(user.id, {
      htmlTarget: containerRef.current,
      customerEmail: user.email ?? undefined,
    });
    setPresenting(false);

    if (paywallResult.ok) {
      trackMarketingConversion("subscription_complete", {
        source: "web_revenuecat_paywall",
        target_path: "/onboarding/post-paywall",
        event_id: paywallResult.purchaseEventId,
        content_id: paywallResult.productId,
        content_name: paywallResult.productName,
        ...(paywallResult.purchaseValue > 0
          ? { value: paywallResult.purchaseValue, currency: paywallResult.purchaseCurrency }
          : {}),
      });
      armIapPostPurchaseEntitlementLatch(user.id);
      armWebGetAppPromptPending();
      navigate("/onboarding/post-paywall", { replace: true });
      return;
    }

    const detail = getLastWebPaywallError();
    if (detail === "Cancelled") {
      setPhase("dismissed");
      return;
    }
    setPhase("error");
    toast.error(detail || t("webWrapper.subscriptionNotCompleted"), { duration: 8000 });
  }, [navigate, presenting, t, user?.email, user?.id]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate("/", { replace: true });
      return;
    }
    if (isLoading) return;
    if (!user?.id) {
      navigate("/login", { replace: true, state: { from: "/onboarding/web-paywall" } });
      return;
    }

    if (!isRevenueCatWebConfigured()) {
      setPhase("error");
      toast.error(t("webWrapper.notConfigured"), { duration: 8000 });
    }
  }, [isLoading, navigate, t, user?.id]);

  useEffect(() => {
    if (phase !== "paywall" || autoPresentedRef.current || isLoading || !user?.id) return;
    if (!isRevenueCatWebConfigured()) return;
    autoPresentedRef.current = true;
    void openPaywall();
  }, [isLoading, openPaywall, phase, user?.id]);

  useEffect(() => {
    if (phase !== "paywall" || !containerRef.current) return;
    return attachHideBrokenRevenueCatPaywallMedia(containerRef.current);
  }, [phase, presenting]);

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {phase === "error" ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {getLastWebPaywallError() || t("webWrapper.checkoutFailed")}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {/*
              Hide "Try again" when RC web isn't configured — clicking it would
              just loop the same "not configured" error since openPaywall doesn't
              re-check configuration.
            */}
            {isRevenueCatWebConfigured() ? (
              <Button type="button" onClick={() => void openPaywall()} disabled={presenting}>
                {t("legacyIos.tryAgain")}
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
              {t("webWrapper.close")}
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "dismissed" ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">{t("webWrapper.checkoutClosed")}</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => void openPaywall()} disabled={presenting}>
              {t("webWrapper.viewPlans")}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
              {t("webWrapper.close")}
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={cn("web-rc-paywall-host px-4 pb-8", phase === "paywall" ? "block" : "hidden")}
        aria-live="polite"
      />
    </div>
  );
}

```

---

## FILE: src/pages/onboarding/PostPaywallLoading.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import { supabase } from "@/integrations/supabase/client";
import {
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
  WelcomeCosmicBackground,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import { persistWebGuideCharacterFromDraft } from "@/lib/persistWebGuideCharacterFromDraft";
import {
  clearIapPostPurchaseEntitlementLatch,
  runIapPostPurchaseGateIfNeeded,
} from "@/lib/iosPostPurchaseEntitlementGate";
import { getLastPaywallError, syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { toast } from "sonner";

/** Progress after entitlement gate — provisioning reports 0–100 above this. */
const PROGRESS_AFTER_GATE = 28;

/** Ring % when each sims line advances (maps to real provisioning milestones). */
const STEP_DONE_AT = [PROGRESS_AFTER_GATE, 64, 76, 95, 100] as const;

const SIMS_LINE_COUNT = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-white">{pct}%</div>
      </div>
    </div>
  );
}

function getActiveStepIndex(progress: number, phase: "provisioning" | "finishing"): number {
  if (phase === "finishing") return SIMS_LINE_COUNT - 1;
  for (let i = 0; i < STEP_DONE_AT.length; i += 1) {
    if (progress < STEP_DONE_AT[i]) return i;
  }
  return SIMS_LINE_COUNT - 1;
}

function CommitmentBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-3 border-b border-white/10 pb-4">
      <p className={cn("text-xs font-medium uppercase tracking-wide", SETUP_MUTED_TEXT_CLASS)}>
        {label}
      </p>
      <p className="text-[0.9375rem] leading-[1.65] text-white/90 text-pretty">{text}</p>
    </div>
  );
}

export default function PostPaywallLoading() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const [progress, setProgress] = useState(8);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");
  const runningRef = useRef(false);

  const activeStepIndex = getActiveStepIndex(progress, phase);
  const simsLines = t("postPaywall.simsLines", { returnObjects: true }) as string[];

  const subtitle = useMemo(() => {
    if (phase === "finishing") return t("postPaywall.finishingSubtitle");
    return simsLines[activeStepIndex] ?? simsLines[simsLines.length - 1] ?? "";
  }, [activeStepIndex, phase, simsLines, t]);

  useEffect(() => {
    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let alive = true;
    let tickId: number | null = null;

    const startSmoothing = (cap: number) => {
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        setProgress((p) => {
          const next = p + Math.max(0.2, (cap - p) * 0.06);
          return next >= cap ? cap : next;
        });
      }, 120);
    };

    (async () => {
      startSmoothing(92);
      try {
        const gate = await runIapPostPurchaseGateIfNeeded();
        if (!alive) return;

        if (gate === "failed") {
          if (tickId != null) window.clearInterval(tickId);
          debugLog({
            location: "PostPaywallLoading.tsx",
            message: "Native IAP entitlement sync failed on loading screen",
            data: { lastPaywallError: getLastPaywallError() },
            hypothesisId: "H5",
          });
          toast.error(t("postPaywall.toastActivateFailedIos"));
          clearIapPostPurchaseEntitlementLatch();
          const failRoute = Capacitor.isNativePlatform()
            ? "/onboarding/ios-paywall"
            : "/onboarding/web-paywall";
          window.setTimeout(() => navigate(failRoute, { replace: true }), 450);
          return;
        }

        if (!Capacitor.isNativePlatform()) {
          // Web: entitlement sync handled by runIapPostPurchaseGateIfNeeded above.
          // Guarantee guide → selected_character before provisioning may clear the draft.
          await persistWebGuideCharacterFromDraft();
        } else if (Capacitor.getPlatform() === "android") {
          const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
          if (!alive) return;
          if (!ok) {
            if (tickId != null) window.clearInterval(tickId);
            toast.error(t("postPaywall.toastActivateFailedAndroid"));
            window.setTimeout(() => navigate("/onboarding/android-paywall", { replace: true }), 450);
            return;
          }
        }

        await provisionPostPaywallIfNeeded({ quiet: true });
        if (!alive) return;
        setPhase("finishing");
        if (tickId != null) window.clearInterval(tickId);
        setProgress(100);
        clearIapPostPurchaseEntitlementLatch();

        // Signal dashboard to attempt the review prompt after post-paywall success.
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
          try {
            sessionStorage.setItem("pending_review_prompt_after_post_paywall", "true");
            console.info("[review_prompt] post-paywall marker set for dashboard");
          } catch {}
        }

        window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
      } catch (e) {
        console.error("[post-paywall] provisioning failed:", e);
        if (!alive) return;
        if (!Capacitor.isNativePlatform()) {
          await persistWebGuideCharacterFromDraft();
        }
        clearIapPostPurchaseEntitlementLatch();
        toast.error(t("postPaywall.toastSetupSnag"));
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 650);
      }
    })();

    return () => {
      alive = false;
      if (tickId != null) window.clearInterval(tickId);
    };
  }, [navigate, t]);

  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" tone="deep-black" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title={t("postPaywall.title")} subtitle={subtitle} />

          <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
            <CommitmentBlock
              label={t("postPaywall.commitmentLabel")}
              text={t("postPaywall.commitmentText")}
            />

            <div className="flex items-center gap-4">
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white/90">{t("postPaywall.buildingDashboard")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```

---

## FILE: src/pages/onboarding/AndroidPostPaywallLoading.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import {
  clearAndroidPostPurchaseEntitlementLatch,
  getAndroidPostPurchaseLatchUserId,
  markAndroidSubscriptionConfirmed,
  retryAndroidPostPurchaseEntitlementSyncInBackground,
  runAndroidPostPurchaseGateIfNeeded,
} from "@/lib/androidPostPurchaseEntitlementGate";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { toast } from "sonner";

/** Progress after entitlement gate — provisioning reports 0–100 above this. */
const PROGRESS_AFTER_GATE = 28;

/** Ring % when each sims line advances (maps to real provisioning milestones). */
const STEP_DONE_AT = [PROGRESS_AFTER_GATE, 64, 76, 95, 100] as const;

const SIMS_LINE_COUNT = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getActiveStepIndex(progress: number, phase: "provisioning" | "finishing"): number {
  if (phase === "finishing") return SIMS_LINE_COUNT - 1;
  for (let i = 0; i < STEP_DONE_AT.length; i += 1) {
    if (progress < STEP_DONE_AT[i]) return i;
  }
  return SIMS_LINE_COUNT - 1;
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-white">{pct}%</div>
      </div>
    </div>
  );
}

function CommitmentBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-3 border-b border-white/10 pb-4">
      <p className={cn("text-xs font-medium uppercase tracking-wide", SETUP_MUTED_TEXT_CLASS)}>
        {label}
      </p>
      <p className="text-[0.9375rem] leading-[1.65] text-white/90 text-pretty">{text}</p>
    </div>
  );
}

/**
 * Android-only post-paywall loading screen. Waits for entitlement sync, then full
 * provisioning before dashboard — with progress tied to real pipeline milestones.
 *
 * Entitlement sync failure is treated as delayed verification (no paywall bounce).
 */
export default function AndroidPostPaywallLoading() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const [progress, setProgress] = useState(5);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");
  const runningRef = useRef(false);

  const activeStepIndex = getActiveStepIndex(progress, phase);

  const simsLines = t("postPaywall.simsLines", { returnObjects: true }) as string[];

  const subtitle = useMemo(() => {
    if (phase === "finishing") return t("postPaywall.finishingSubtitle");
    return simsLines[activeStepIndex] ?? simsLines[simsLines.length - 1] ?? "";
  }, [activeStepIndex, phase, simsLines, t]);

  useEffect(() => {
    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let alive = true;
    const mountTs = performance.now();

    (async () => {
      try {
        setProgress(8);
        const gate = await runAndroidPostPurchaseGateIfNeeded();
        if (!alive) return;

        if (gate.status === "delayed") {
          console.warn(
            "[android-post-paywall] entitlement verification delayed after purchase",
            gate
          );
          retryAndroidPostPurchaseEntitlementSyncInBackground();
        }

        setProgress(PROGRESS_AFTER_GATE);

        await provisionPostPaywallIfNeeded({
          quiet: true,
          onProgress: (provisionPct) => {
            if (!alive) return;
            const mapped =
              PROGRESS_AFTER_GATE +
              Math.round((provisionPct / 100) * (98 - PROGRESS_AFTER_GATE));
            setProgress(clamp(mapped, PROGRESS_AFTER_GATE, 98));
          },
        });

        if (!alive) return;

        const totalMs = Math.round(performance.now() - mountTs);
        const userId = getAndroidPostPurchaseLatchUserId();
        markAndroidSubscriptionConfirmed(userId);
        clearAndroidPostPurchaseEntitlementLatch();

        setPhase("finishing");
        setProgress(100);

        debugLog({
          location: "AndroidPostPaywallLoading.tsx:exit",
          message: "Android post-paywall navigating to dashboard",
          data: { gate, totalMs, lastPaywallError: getLastPaywallError() },
          hypothesisId: "ANDROID-GATE",
        });
        console.info("[android-post-paywall] exit to dashboard", { gate, totalMs });

        window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
      } catch (e) {
        console.error("[android-post-paywall] provisioning failed:", e);
        if (!alive) return;
        clearAndroidPostPurchaseEntitlementLatch();
        toast.error(t("postPaywall.toastSetupSnag"));
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 650);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate, t]);

  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" tone="deep-black" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title={t("postPaywall.title")} subtitle={subtitle} />

          <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
            <CommitmentBlock
              label={t("postPaywall.commitmentLabel")}
              text={t("postPaywall.commitmentText")}
            />

            <div className="flex items-center gap-4">
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white/90">{t("postPaywall.buildingDashboard")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```

---

## FILE: src/pages/PaymentProcessing.tsx

```tsx
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";

/**
 * Platform-aware paywall fallback so a non-iOS web user doesn't get stranded on
 * `/onboarding/ios-paywall`, which toasts "Subscriptions are only available in
 * the iOS app." and offers no path forward.
 */
function paywallRouteForCurrentPlatform(): string {
  if (isIosPaywallContext()) return "/onboarding/ios-paywall";
  if (isAndroidPaywallContext()) return "/onboarding/android-paywall";
  return "/onboarding/web-paywall";
}

export default function PaymentProcessing() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";

  /**
   * Use a ref instead of state so incrementing attempts doesn't tear down and
   * re-create the polling loop. Previously `attempts` was in the effect's dep
   * array, which meant every increment cancelled the running interval and
   * started a new one — and on top of that, `setInterval` and an inline
   * `setTimeout(setAttempts(...))` were both running, doubling the request
   * rate against `get-onboarding-session`.
   */
  const attemptsRef = useRef(0);
  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait

  useEffect(() => {
    if (!sid || !token) {
      toast.error(t("paymentProcessing.missingInfo"));
      const timeoutId = window.setTimeout(
        () => navigate(paywallRouteForCurrentPlatform()),
        2000,
      );
      return () => window.clearTimeout(timeoutId);
    }

    let active = true;
    // window.setInterval / setTimeout return numbers in browsers; using the
    // browser variants explicitly so types don't drift to Node's Timeout.
    let interval: number | null = null;
    let finishTimer: number | null = null;

    const finishWithError = (msg: string) => {
      toast.error(msg);
      if (interval != null) {
        window.clearInterval(interval);
        interval = null;
      }
      finishTimer = window.setTimeout(
        () => navigate(paywallRouteForCurrentPlatform()),
        3000,
      );
    };

    const checkPaymentStatus = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-onboarding-session",
          { body: { sessionId: sid, resumeToken: token } },
        );
        if (!active) return;

        if (error) {
          console.error("Error checking payment status:", error);
          if (attemptsRef.current >= maxAttempts) {
            finishWithError(t("paymentProcessing.verificationSlow"));
            return;
          }
          attemptsRef.current += 1;
          return;
        }

        const session = data?.session;
        if (session?.status === "paid" || session?.status === "active") {
          navigate(
            `/activate?sid=${encodeURIComponent(sid)}&token=${encodeURIComponent(token)}`,
            { replace: true },
          );
          return;
        }

        if (attemptsRef.current >= maxAttempts) {
          finishWithError(t("paymentProcessing.verificationSlow"));
          return;
        }
        attemptsRef.current += 1;
      } catch (e) {
        if (!active) return;
        console.error("Error checking payment status:", e);
        if (attemptsRef.current >= maxAttempts) {
          finishWithError(t("paymentProcessing.verificationFailed"));
          return;
        }
        attemptsRef.current += 1;
      }
    };

    void checkPaymentStatus();
    interval = window.setInterval(checkPaymentStatus, 2000);

    return () => {
      active = false;
      if (interval != null) window.clearInterval(interval);
      if (finishTimer != null) window.clearTimeout(finishTimer);
    };
  }, [sid, token, navigate, t]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight">{t("paymentProcessing.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("paymentProcessing.subtitle")}
        </p>
      </div>
    </div>
  );
}

```

---

## FILE: src/services/revenueCat.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, Purchases } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import {
  getIosMajorVersionForNative,
  shouldUseRevenueCatPaywallUi,
  IOS_REVENUECAT_UI_MIN_MAJOR,
} from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { gatherOnboardingPrefs } from "@/lib/gatherOnboardingPrefs";
import {
  detectInitialAppLocale,
  resolveAppLocale,
  revenueCatUILocaleForApp,
} from "@/lib/locale";
import i18n from "@/i18n";

/** Active app UI language for RevenueCat paywall — not stale localStorage alone. */
export function resolveRevenueCatUILocale(): string {
  const raw = i18n.resolvedLanguage || i18n.language;
  const locale = raw ? resolveAppLocale(raw) : detectInitialAppLocale();
  return revenueCatUILocaleForApp(locale);
}

const PAYWALL_ERROR_I18N_KEYS: Record<string, string> = {
  "Cancelled": "errors.cancelled",
  "Paywall error": "errors.paywallError",
  "Not presented": "errors.notPresented",
  "No RevenueCat API key configured.": "errors.noApiKey",
  "RevenueCat could not be configured.": "errors.notConfigured",
  "Purchase was not completed.": "errors.purchaseNotCompleted",
  "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.": "errors.billingUnavailable",
  "No offerings in RevenueCat. Add a default offering and paywall in the dashboard.": "errors.noOfferings",
  "Could not complete checkout.": "errors.checkoutFailed",
  "Subscription was not completed.": "errors.subscriptionNotCompleted",
  "RevenueCat Web is not configured (missing API key).": "errors.webNotConfigured",
};

function localizeStoredPaywallError(raw: string): string {
  const key = PAYWALL_ERROR_I18N_KEYS[raw];
  if (key) return i18n.t(key, { ns: "paywall", defaultValue: raw });
  if (raw.startsWith("Unknown result:")) {
    const detail = raw.slice("Unknown result:".length).trim();
    return i18n.t("errors.unknownResultDetail", { ns: "paywall", detail, defaultValue: raw });
  }
  return raw;
}

/** Compat StoreKit path only; ignored when RevenueCat paywall UI is shown. */
export type PresentPaywallOptions = {
  billingPeriod?: BillingPeriod;
};

let hasConfigured = false;
let configuredAppUserId: string | null = null;

/** Last reason presentRevenueCatPaywall returned false (for debugging UI). */
let lastPaywallError: string | null = null;

export function getLastPaywallError(): string | null {
  if (!lastPaywallError) return null;
  return localizeStoredPaywallError(lastPaywallError);
}

/** UI / flow helpers when RevenueCat is not invoked (e.g. global in-flight guard). */
export function setLastPaywallErrorMessage(message: string) {
  lastPaywallError = message;
}

// #region agent log (dev-only: loopback ingest triggers Chrome "apps on device" prompt on production HTTPS)
function agentLogF33356(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  if (import.meta.env.DEV !== true) return;

  const payload = {
    sessionId: "f33356",
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33356" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  try {
    const line = JSON.stringify(payload);
    const cur = typeof localStorage !== "undefined" ? localStorage.getItem("debug_f33356_log") ?? "" : "";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("debug_f33356_log", cur ? `${cur}\n${line}` : line);
    }
  } catch {
    // ignore
  }
}
// #endregion

const getRevenueCatApiKey = () => {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
  }
  return undefined;
};

/** Match onboarding language to RevenueCat paywall localizations (not device system locale). */
export async function syncRevenueCatUILocale(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  try {
    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) return;
    await Purchases.overridePreferredUILocale({ locale: resolveRevenueCatUILocale() });
  } catch (error) {
    console.warn("[RevenueCat] overridePreferredUILocale failed:", error);
  }
}

export const bootstrapRevenueCat = async (appUserId?: string | null) => {
  if (!Capacitor.isNativePlatform()) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] Missing platform API key. Skipping setup.");
    return;
  }

  try {
    if (!hasConfigured) {
      await Purchases.setLogLevel({
        level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
      });

      await Purchases.configure({
        apiKey,
        appUserID: appUserId ?? undefined,
        preferredUILocaleOverride: resolveRevenueCatUILocale(),
      });

      hasConfigured = true;
      configuredAppUserId = appUserId ?? null;
      await syncRevenueCatUILocale();
      return;
    }

    const nextUserId = appUserId ?? null;
    if (nextUserId === configuredAppUserId) {
      await syncRevenueCatUILocale();
      return;
    }

    if (nextUserId) {
      await Purchases.logIn({ appUserID: nextUserId });
      configuredAppUserId = nextUserId;
      await syncRevenueCatUILocale();
      return;
    }

    await Purchases.logOut();
    configuredAppUserId = null;
  } catch (error) {
    console.error("[RevenueCat] Bootstrap failed:", error);
  }
};

export const hasRevenueCatEntitlement = async (entitlementId: string) => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[entitlementId] !== "undefined";
  } catch (error) {
    console.error("[RevenueCat] Failed to fetch customer info:", error);
    return false;
  }
};

export const presentRevenueCatPaywall = async (
  appUserId?: string | null,
  paywallOptions?: PresentPaywallOptions
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  const platform = Capacitor.getPlatform();
  const apiKey = getRevenueCatApiKey();
  const hasApiKey = !!apiKey;
  const compatBilling: BillingPeriod = paywallOptions?.billingPeriod ?? "monthly";
  debugLog({
    location: "revenueCat.ts:presentPaywall",
    message: "presentRevenueCatPaywall entry",
    data: {
      platform,
      isNative: Capacitor.isNativePlatform(),
      hasApiKey,
      compatBillingRequested: compatBilling,
    },
    hypothesisId: "H3",
  });

  if (!hasApiKey) {
    lastPaywallError = "No RevenueCat API key configured.";
    console.warn("[RevenueCat] No API key; skipping presentPaywall to avoid native crash.");
    return false;
  }

  lastPaywallError = null;
  try {
    const userId = appUserId ?? configuredAppUserId ?? undefined;
    await bootstrapRevenueCat(userId ?? null);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      lastPaywallError = "RevenueCat could not be configured.";
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "RevenueCat not configured",
        data: { lastPaywallError },
        hypothesisId: "H3",
      });
      return false;
    }

    const iosMajor = await getIosMajorVersionForNative();
    const useRcUi = await shouldUseRevenueCatPaywallUi();
    /** Same floor as Manage billing (25): never RevenueCat SwiftUI paywall on unknown or below that major. */
    const iosHardBlockRcUi =
      platform === "ios" && (iosMajor == null || iosMajor < IOS_REVENUECAT_UI_MIN_MAJOR);
    // #region agent log
    agentLogF33356(
      "revenueCat.ts:presentPaywall:branch",
      "iOS paywall path",
      {
        iosMajor,
        useRcUi,
        iosHardBlockRcUi,
        rcUiMinMajor: IOS_REVENUECAT_UI_MIN_MAJOR,
        platform,
      },
      "H1"
    );
    // #endregion

    if (platform === "ios" && (!useRcUi || iosHardBlockRcUi)) {
      const { purchasePremiumViaNativeStoreKit } = await import("@/lib/nativeIosPremiumPurchase");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compat",
        "StoreKit direct (skip RevenueCat UI)",
        { plan: compatBilling },
        "H1"
      );
      // #endregion
      const outcome = await purchasePremiumViaNativeStoreKit(compatBilling);
      if (outcome.success) {
        lastPaywallError = null;
        // #region agent log
        agentLogF33356("revenueCat.ts:presentPaywall:compatResult", "compat purchase ok", {}, "H4");
        // #endregion
        return true;
      }
      const rawErr = outcome.error ?? "";
      lastPaywallError =
        rawErr === "cancelled"
          ? "Cancelled"
          : rawErr || "Purchase was not completed.";
      const fallbackToRcUi =
        rawErr.includes("Billing not supported") || rawErr.includes("Could not check billing");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatResult",
        "compat purchase failed",
        { lastPaywallError, rawErr, fallbackToRcUi },
        "H4"
      );
      // #endregion
      if (!fallbackToRcUi) {
        return false;
      }
      if (iosHardBlockRcUi) {
        lastPaywallError =
          lastPaywallError ?? "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.";
        return false;
      }
      lastPaywallError = null;
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatToRcFallback",
        "NativePurchases billing blocked; falling back to RevenueCat paywall UI",
        {},
        "H6"
      );
      // #endregion
    }

    await syncRevenueCatUILocale();

    try {
      await Purchases.getOfferings();
    } catch (offeringsErr) {
      const msg = (offeringsErr as Error)?.message ?? String(offeringsErr);
      lastPaywallError = msg.includes("offerings") || msg.includes("Offering")
        ? "No offerings in RevenueCat. Add a default offering and paywall in the dashboard."
        : msg;
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "getOfferings failed",
        data: { lastPaywallError, raw: msg },
        hypothesisId: "H3",
      });
      console.error("[RevenueCat] getOfferings failed:", offeringsErr);
      return false;
    }

    await new Promise((r) => setTimeout(r, 150));

    // #region agent log
    agentLogF33356("revenueCat.ts:presentPaywall:beforeRcUi", "calling RevenueCatUI.presentPaywall", {}, "H2");
    // #endregion
    const { RevenueCatUI, PAYWALL_RESULT } = await import("@revenuecat/purchases-capacitor-ui");
    const { result } = await RevenueCatUI.presentPaywall({
      offering: { identifier: "Production Offering" },
    } as import("@revenuecat/purchases-capacitor-ui").PresentPaywallOptions);
    const resultStr = String(result);
    const failReason =
      result === PAYWALL_RESULT.NOT_PRESENTED
        ? "Not presented"
        : result === PAYWALL_RESULT.ERROR
          ? "Paywall error"
          : result === PAYWALL_RESULT.CANCELLED
            ? "Cancelled"
            : result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED
              ? `Unknown result: ${resultStr}`
              : null;
    if (failReason) lastPaywallError = failReason;
    debugLog({
      location: "revenueCat.ts:presentResult",
      message: "presentPaywall result",
      data: { result: resultStr, failReason, lastPaywallError: lastPaywallError ?? undefined },
      hypothesisId: "H2",
    });

    switch (result) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        lastPaywallError = result === PAYWALL_RESULT.ERROR ? "Paywall error" : result === PAYWALL_RESULT.CANCELLED ? "Cancelled" : "Not presented";
        return false;
      case PAYWALL_RESULT.PURCHASED:
        lastPaywallError = null;
        return true;
      case PAYWALL_RESULT.RESTORED:
        lastPaywallError = null;
        return true;
      default:
        lastPaywallError = "Unknown result";
        return false;
    }
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    lastPaywallError = errMsg;
    debugLog({ location: "revenueCat.ts:presentCatch", message: "presentRevenueCatPaywall catch", data: { err: String((error as Error)?.message ?? error) }, hypothesisId: "H2" });
    console.error("[RevenueCat] Failed to present paywall:", error);
    return false;
  }
};

/** Onboarding prefs to send so backend can write to user_preferences, profiles, and user_plans (iOS path). */
export type { OnboardingPrefsPayload } from "@/lib/gatherOnboardingPrefs";

const APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS = 6 * 60 * 60 * 1000;
const appleRcBillingSyncStorageKey = (userId: string) => `apple_rc_billing_sync_${userId}`;

function isAppleOrRevenueCatBilledPlan(row: {
  last_payment_source?: string | null;
  stripe_customer_id?: string | null;
} | null): boolean {
  if (!row) return false;
  const cid = row.stripe_customer_id ?? "";
  return (
    row.last_payment_source === "apple" ||
    row.last_payment_source === "google_play" ||
    cid.startsWith("apple:") ||
    cid.startsWith("revenuecat:")
  );
}

/**
 * For users billed via Apple / RevenueCat, refresh user_plans (e.g. current_period_end) via the
 * sync-revenuecat-entitlement Edge Function. Safe on web/PWA and native; no-op for Stripe-only users.
 */
export async function refreshAppleRevenueCatPlanOnServer(
  mode: "session_start" | "background" = "session_start",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const uid = session.user.id;

  const { data: plan, error } = await supabase
    .from("user_plans")
    .select("last_payment_source, stripe_customer_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error || !isAppleOrRevenueCatBilledPlan(plan)) return;

  if (mode === "background") {
    const raw = sessionStorage.getItem(appleRcBillingSyncStorageKey(uid));
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS) return;
    }
  }

  try {
    const { error: invokeErr } = await supabase.functions.invoke("sync-revenuecat-entitlement", { method: "POST" });
    if (invokeErr) {
      console.warn("[Billing] RevenueCat server sync:", invokeErr.message);
      return;
    }
    try {
      sessionStorage.setItem(appleRcBillingSyncStorageKey(uid), String(Date.now()));
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn("[Billing] RevenueCat server sync failed:", e);
  }
}

/**
 * Push StoreKit state to RevenueCat, then sync `user_plans` via `sync-revenuecat-entitlement`.
 * Use after Capgo NativePurchases purchase/restore or RC paywall purchase so the edge function sees an up-to-date subscriber.
 */
export const syncRevenueCatEntitlementToBackend = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  const plat = Capacitor.getPlatform();
  if (plat !== "ios" && plat !== "android") return false;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("[RevenueCat] Backend sync skipped: no session.");
      return false;
    }

    await bootstrapRevenueCat(session.user.id);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      console.warn("[RevenueCat] Not configured; cannot sync entitlement to backend.");
      return false;
    }

    try {
      await Purchases.syncPurchases();
    } catch (e) {
      console.warn("[RevenueCat] syncPurchases failed (continuing with edge sync):", e);
    }

    const onboarding_prefs = await gatherOnboardingPrefs();
    const body: Record<string, unknown> = {};
    if (onboarding_prefs && Object.keys(onboarding_prefs).length > 0) {
      body.onboarding_prefs = onboarding_prefs;
    }
    const { error, data } = await supabase.functions.invoke("sync-revenuecat-entitlement", {
      method: "POST",
      body,
    });

    const payload = data as {
      success?: boolean;
      active?: boolean;
      downgraded?: boolean;
      preservedExisting?: boolean;
      preservedStripeBilling?: boolean;
      error?: string;
    } | null;

    const syncOk =
      !error &&
      !payload?.downgraded &&
      (payload?.preservedExisting === true ||
        payload?.preservedStripeBilling === true ||
        (payload?.success === true && payload?.active === true));

    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: syncOk ? "sync ok" : "sync failed",
      data: {
        invokeError: error?.message ?? null,
        dataBody: data ?? null,
      },
      hypothesisId: "H5",
    });

    if (!syncOk) {
      const errMsg = payload?.error || error?.message || String(error ?? "Sync rejected");
      console.error("[RevenueCat] Backend entitlement sync failed:", error || payload?.error, "data:", data);
      return false;
    }

    return true;
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: "sync exception",
      data: { err: errMsg },
      hypothesisId: "H5",
    });
    console.error("[RevenueCat] Entitlement sync exception:", error);
    return false;
  }
};

const POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS = 500;
const POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS = 500;

/** Short settle delay, then repeated `syncRevenueCatEntitlementToBackend` (post–StoreKit / RC paywall). */
export async function syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS));
  }
  return false;
}

```

---

## FILE: src/services/revenueCatWeb.ts

```typescript
import { Purchases, type Offering, type Package, type Price } from "@revenuecat/purchases-js";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import { gatherOnboardingPrefs } from "@/lib/gatherOnboardingPrefs";
import { resolveRevenueCatUILocale } from "@/services/revenueCat";
import i18n from "@/i18n";

const WEB_PAYWALL_ERROR_I18N_KEYS: Record<string, string> = {
  "Cancelled": "errors.cancelled",
  "Could not complete checkout.": "errors.checkoutFailed",
  "Subscription was not completed.": "errors.subscriptionNotCompleted",
  "RevenueCat Web is not configured (missing API key).": "errors.webNotConfigured",
};

function localizeStoredWebPaywallError(raw: string): string {
  const key = WEB_PAYWALL_ERROR_I18N_KEYS[raw];
  if (key) return i18n.t(key, { ns: "paywall", defaultValue: raw });
  return raw;
}

export const REVENUECAT_WEB_ENTITLEMENT_ID = "Palette Plotting Pro";

let webPurchases: Purchases | null = null;
let configuredAppUserId: string | null = null;

let lastWebPaywallError: string | null = null;

export function getLastWebPaywallError(): string | null {
  if (!lastWebPaywallError) return null;
  return localizeStoredWebPaywallError(lastWebPaywallError);
}

export function setLastWebPaywallError(message: string): void {
  lastWebPaywallError = message;
}

function getRevenueCatWebApiKey(): string | undefined {
  return import.meta.env.VITE_REVENUECAT_WEB_API_KEY as string | undefined;
}

let warnedMissingWebKey = false;

export function isRevenueCatWebConfigured(): boolean {
  const apiKey = getRevenueCatWebApiKey();
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function warnMissingWebKeyOnce(context: string): void {
  if (warnedMissingWebKey) return;
  warnedMissingWebKey = true;
  console.warn(
    `[RevenueCat Web] Missing VITE_REVENUECAT_WEB_API_KEY (${context}). Set it in the build environment and redeploy.`,
  );
}

/**
 * Configure RevenueCat Web Billing (purchases-js). Call after the user is known on web.
 */
export async function bootstrapRevenueCatWeb(appUserId: string | null): Promise<Purchases | null> {
  if (!isRevenueCatWebConfigured()) {
    return null;
  }

  const apiKey = getRevenueCatWebApiKey()!.trim();

  try {
    if (!Purchases.isConfigured()) {
      webPurchases = Purchases.configure({
        apiKey,
        appUserId: appUserId ?? undefined,
      });
      configuredAppUserId = appUserId;
      return webPurchases;
    }

    webPurchases = Purchases.getSharedInstance();
    const nextId = appUserId ?? null;
    if (nextId && nextId !== configuredAppUserId) {
      await webPurchases.changeUser(nextId);
      configuredAppUserId = nextId;
    }
    return webPurchases;
  } catch (error) {
    console.error("[RevenueCat Web] Bootstrap failed:", error);
    return null;
  }
}

function customerHasProEntitlement(customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean {
  return typeof customerInfo.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID] !== "undefined";
}

const WEB_DISCOUNT_URL_PARAMS = ["discount_code", "promo_code", "coupon"] as const;

/** Pre-apply RC Web Billing discount from URL (?discount_code=SUMMER30). Web only. */
export function readWebRevenueCatDiscountCodeFromUrl(): string | undefined {
  if (typeof window === "undefined") return undefined;
  const params = new URLSearchParams(window.location.search);
  for (const key of WEB_DISCOUNT_URL_PARAMS) {
    const value = params.get(key)?.trim();
    if (value) return value;
  }
  return undefined;
}

export type WebRevenueCatPaywallResult =
  | {
      ok: true;
      purchaseEventId: string;
      purchaseValue: number;
      purchaseCurrency: string;
      productId: string;
      productName: string;
    }
  | { ok: false; cancelled?: boolean };

export type WebRevenueCatCheckoutQuote = {
  value: number;
  currency: string;
  contentId: string;
  contentName: string;
};

function tikTokValueFromPrice(price: Price): { value: number; currency: string } | null {
  const value = price.amountMicros / 1_000_000;
  if (!Number.isFinite(value) || value <= 0) return null;
  return { value, currency: price.currency };
}

function defaultPaywallPackage(offering: Offering): Package | null {
  return (
    offering.weekly ??
    offering.monthly ??
    offering.annual ??
    offering.availablePackages[0] ??
    null
  );
}

function checkoutQuoteFromPackage(pkg: Package): WebRevenueCatCheckoutQuote | null {
  const product = pkg.webBillingProduct;
  const priced = tikTokValueFromPrice(product.price);
  if (!priced) return null;
  return {
    value: priced.value,
    currency: priced.currency,
    contentId: product.identifier,
    contentName: product.title || pkg.identifier,
  };
}

/** Stripe / RC Web Billing list price for the default paywall package (weekly first). */
export async function getWebRevenueCatCheckoutQuote(
  appUserId: string | null,
): Promise<WebRevenueCatCheckoutQuote | null> {
  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) return null;

  try {
    const offerings = await purchases.getOfferings();
    const offering = offerings.current;
    if (!offering) return null;
    const pkg = defaultPaywallPackage(offering);
    if (!pkg) return null;
    return checkoutQuoteFromPackage(pkg);
  } catch (error) {
    console.warn("[RevenueCat Web] getOfferings for TikTok quote failed:", error);
    return null;
  }
}

function purchaseQuoteFromPackage(pkg: Package): Omit<WebRevenueCatCheckoutQuote, never> | null {
  return checkoutQuoteFromPackage(pkg);
}

function purchaseEventIdFromCustomerInfo(
  customerInfo: { entitlements: { active: Record<string, unknown> } },
  appUserId: string | null,
): string {
  try {
    const ent = customerInfo.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID] as
      | { productIdentifier?: string; originalPurchaseDate?: string }
      | undefined;
    const pid = ent?.productIdentifier;
    if (pid) {
      const subs = (customerInfo as {
        subscriptionsByProductIdentifier?: Record<
          string,
          { storeTransactionId?: string; originalPurchaseDate?: string }
        >;
      }).subscriptionsByProductIdentifier;
      const tx = subs?.[pid]?.storeTransactionId?.trim();
      if (tx) return `rc_${tx}`;
      const purchaseDate = subs?.[pid]?.originalPurchaseDate ?? ent?.originalPurchaseDate;
      if (purchaseDate) return `rc_${appUserId ?? "web"}_${purchaseDate}`;
    }
  } catch {
    /* ignore */
  }
  return `rc_${appUserId ?? "web"}_${crypto.randomUUID()}`;
}

/**
 * Renders the RevenueCat web paywall (Web Billing checkout).
 * Pass `htmlTarget` (max-w-md host on WebPaywall) so the paywall stays phone-width on desktop.
 */
export async function presentWebRevenueCatPaywall(
  appUserId: string | null,
  options?: {
    htmlTarget?: HTMLElement | null;
    customerEmail?: string | null;
    /** Overrides URL discount params when set. */
    discountCode?: string | null;
  },
): Promise<WebRevenueCatPaywallResult> {
  lastWebPaywallError = null;
  if (!isRevenueCatWebConfigured()) {
    warnMissingWebKeyOnce("web paywall");
    lastWebPaywallError = "RevenueCat Web is not configured (missing API key).";
    return { ok: false };
  }
  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) {
    lastWebPaywallError = "RevenueCat Web is not configured (missing API key).";
    return { ok: false };
  }

  try {
    const discountCode =
      options?.discountCode?.trim() || readWebRevenueCatDiscountCodeFromUrl();

    const selectedLocale = resolveRevenueCatUILocale();
    const result = await purchases.presentPaywall({
      ...(options?.htmlTarget ? { htmlTarget: options.htmlTarget } : {}),
      customerEmail: options?.customerEmail ?? undefined,
      showDiscountCodeField: true,
      selectedLocale,
      defaultLocale: "en",
      ...(discountCode ? { discountCode } : {}),
    });

    if (customerHasProEntitlement(result.customerInfo)) {
      lastWebPaywallError = null;
      const quote = purchaseQuoteFromPackage(result.selectedPackage);
      return {
        ok: true,
        purchaseEventId: purchaseEventIdFromCustomerInfo(result.customerInfo, appUserId),
        purchaseValue: quote?.value ?? 0,
        purchaseCurrency: quote?.currency ?? "USD",
        productId: quote?.contentId ?? result.selectedPackage.webBillingProduct.identifier,
        productName: quote?.contentName ?? result.selectedPackage.webBillingProduct.title,
      };
    }

    const entitled = await purchases.isEntitledTo(REVENUECAT_WEB_ENTITLEMENT_ID);
    if (entitled) {
      lastWebPaywallError = null;
      const info = await purchases.getCustomerInfo();
      const ent = info.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID];
      const pid = ent?.productIdentifier;
      let quote: WebRevenueCatCheckoutQuote | null = null;
      if (pid) {
        try {
          const offerings = await purchases.getOfferings();
          const pkg =
            offerings.current?.packagesById[pid] ??
            offerings.current?.availablePackages.find(
              (p) => p.webBillingProduct.identifier === pid,
            ) ??
            null;
          if (pkg) quote = checkoutQuoteFromPackage(pkg);
        } catch {
          /* ignore */
        }
      }
      return {
        ok: true,
        purchaseEventId: purchaseEventIdFromCustomerInfo(info, appUserId),
        purchaseValue: quote?.value ?? 0,
        purchaseCurrency: quote?.currency ?? "USD",
        productId: quote?.contentId ?? pid ?? "web_subscription",
        productName: quote?.contentName ?? "web_subscription",
      };
    }

    lastWebPaywallError = "Subscription was not completed.";
    return { ok: false };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(msg)) {
      lastWebPaywallError = "Cancelled";
      return { ok: false, cancelled: true };
    }
    lastWebPaywallError = msg || "Could not complete checkout.";
    debugLog({
      location: "revenueCatWeb.ts:presentPaywall",
      message: "Web paywall error",
      data: { err: msg },
      hypothesisId: "WEB_RC",
    });
    return { ok: false };
  }
}

/**
 * Sync web purchase to Supabase via existing `sync-revenuecat-entitlement` (same as native).
 */
export async function syncWebRevenueCatEntitlementToBackend(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    console.warn("[RevenueCat Web] Backend sync skipped: no session.");
    return false;
  }

  try {
    const onboarding_prefs = await gatherOnboardingPrefs();
    const body: Record<string, unknown> = {};
    if (onboarding_prefs && Object.keys(onboarding_prefs).length > 0) {
      body.onboarding_prefs = onboarding_prefs;
    }

    const { error, data } = await supabase.functions.invoke("sync-revenuecat-entitlement", {
      method: "POST",
      body,
    });

    const payload = data as {
      success?: boolean;
      active?: boolean;
      downgraded?: boolean;
      preservedExisting?: boolean;
      preservedStripeBilling?: boolean;
      error?: string;
    } | null;

    const syncOk =
      !error &&
      !payload?.downgraded &&
      (payload?.preservedExisting === true ||
        payload?.preservedStripeBilling === true ||
        (payload?.success === true && payload?.active === true));

    if (!syncOk) {
      console.warn("[RevenueCat Web] sync-revenuecat-entitlement:", error?.message ?? payload?.error);
    }
    return syncOk;
  } catch (e) {
    console.warn("[RevenueCat Web] Backend sync failed:", e);
    return false;
  }
}

const POST_PURCHASE_INITIAL_DELAY_MS = 800;
const POST_PURCHASE_RETRY_DELAY_MS = 1200;

export async function syncWebRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncWebRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_RETRY_DELAY_MS));
  }
  return false;
}

```

---

## FILE: src/services/revenueCatAttribution.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { Purchases as PurchasesNative } from "@revenuecat/purchases-capacitor";
import { Purchases as PurchasesWeb } from "@revenuecat/purchases-js";
import { supabase } from "@/integrations/supabase/client";
import { isRevenueCatWebConfigured } from "@/services/revenueCatWeb";

/**
 * Sync safe onboarding attribution fields to RevenueCat and mark the onboarding session synced.
 * Fails silently but logs warnings for debugging.
 */
export async function syncRevenueCatAttributionAttributes(
  userId: string,
  onboardingSessionId?: string | null,
): Promise<void> {
  if (!userId) return;

  try {
    const { data, error } = await supabase.functions.invoke("sync-revenuecat-attribution", {
      body: { userId, onboardingSessionId: onboardingSessionId ?? null },
    });
    if (error) {
      console.warn("[syncRevenueCatAttributionAttributes] edge invoke failed:", error.message);
      return;
    }

    const attributes =
      data && typeof data === "object" && data.attributes && typeof data.attributes === "object"
        ? (data.attributes as Record<string, string>)
        : null;
    if (!attributes || Object.keys(attributes).length === 0) return;

    if (Capacitor.isNativePlatform()) {
      try {
        await PurchasesNative.setAttributes(attributes);
      } catch (nativeErr) {
        console.warn("[syncRevenueCatAttributionAttributes] native setAttributes failed:", nativeErr);
      }
      return;
    }

    if (isRevenueCatWebConfigured() && PurchasesWeb.isConfigured()) {
      try {
        const purchases = PurchasesWeb.getSharedInstance();
        await purchases.setAttributes(attributes);
      } catch (webErr) {
        console.warn("[syncRevenueCatAttributionAttributes] web setAttributes failed:", webErr);
      }
    }
  } catch (err) {
    console.warn("[syncRevenueCatAttributionAttributes] failed:", err);
  }
}

```

---

## FILE: src/services/revenueCatManageBilling.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { Purchases } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import { bootstrapRevenueCat, resolveRevenueCatUILocale, syncRevenueCatUILocale } from "@/services/revenueCat";
import { bootstrapRevenueCatWeb, isRevenueCatWebConfigured } from "@/services/revenueCatWeb";

function managementUrlFromCustomerInfo(managementURL: string | null | undefined): string | null {
  const url = typeof managementURL === "string" ? managementURL.trim() : "";
  return url || null;
}

async function resolveRevenueCatWebBillingManagementUrlFromSdk(
  appUserId: string,
): Promise<string | null> {
  if (Capacitor.isNativePlatform()) {
    await bootstrapRevenueCat(appUserId);
    const { customerInfo } = await Purchases.getCustomerInfo();
    return managementUrlFromCustomerInfo(customerInfo.managementURL);
  }

  if (!isRevenueCatWebConfigured()) return null;

  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) return null;

  const customerInfo = await purchases.getCustomerInfo();
  return managementUrlFromCustomerInfo(customerInfo.managementURL);
}

async function resolveRevenueCatWebBillingStatusFromBackend(): Promise<{
  webBilling: boolean;
  managementUrl: string | null;
}> {
  const { data, error } = await supabase.functions.invoke("get-revenuecat-billing-portal", {
    body: {},
  });
  if (error) {
    console.warn("[Billing] get-revenuecat-billing-portal:", error.message);
    return { webBilling: false, managementUrl: null };
  }

  const payload = data as { url?: string | null; webBilling?: boolean } | null;
  const url = typeof payload?.url === "string" ? payload.url.trim() : "";
  return {
    webBilling: payload?.webBilling === true,
    managementUrl: url || null,
  };
}

export type RevenueCatWebBillingStatus = {
  webBilling: boolean;
  managementUrl: string | null;
};

/**
 * Whether the user has RC Web Billing and (when available) a portal URL.
 * SDK first for URL; RC REST for reliable webBilling flag on existing customers.
 */
export async function resolveRevenueCatWebBillingStatus(
  appUserId: string,
): Promise<RevenueCatWebBillingStatus> {
  let managementUrl: string | null = null;
  let webBilling = false;

  try {
    managementUrl = await resolveRevenueCatWebBillingManagementUrlFromSdk(appUserId);
    if (managementUrl) webBilling = true;
  } catch (error) {
    console.warn("[Billing] RC web billing SDK lookup failed:", error);
  }

  try {
    const fromBackend = await resolveRevenueCatWebBillingStatusFromBackend();
    webBilling = webBilling || fromBackend.webBilling;
    managementUrl = managementUrl ?? fromBackend.managementUrl;
  } catch (error) {
    console.warn("[Billing] RC web billing backend lookup failed:", error);
  }

  return { webBilling, managementUrl };
}

/** Active RC Web Billing portal URL when available. */
export async function resolveRevenueCatWebBillingManagementUrl(
  appUserId: string,
): Promise<string | null> {
  const { managementUrl } = await resolveRevenueCatWebBillingStatus(appUserId);
  return managementUrl;
}

/** Opens the RC Web Billing customer portal when the user subscribed via web billing. */
export async function openRevenueCatWebBillingPortal(appUserId: string): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    await bootstrapRevenueCat(appUserId);
    await syncRevenueCatUILocale();
    console.info("[Billing] RC UI locale before web billing portal", {
      locale: resolveRevenueCatUILocale(),
    });
  }

  const url = await resolveRevenueCatWebBillingManagementUrl(appUserId);
  if (!url) return false;

  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.location.href = url;
  }
  return true;
}

```

---

## FILE: src/lib/runIosPaywallFlow.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import {
  presentRevenueCatPaywall,
  getLastPaywallError,
  setLastPaywallErrorMessage,
} from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import type { BillingPeriod } from "@/lib/appleIAP";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import i18n from "@/i18n";

export type IosPaywallFlowOutcome =
  | "success"
  | "present_failed"
  | "error"
  /** Not native iOS — caller should route to web pricing */
  | "skipped";

let presentationInFlight = false;

/** Clears stuck global lock (e.g. native sheet hung, or JS continued without settling). */
export function resetPaywallPresentationFlightLock() {
  presentationInFlight = false;
}

const PAYWALL_PRESENT_TIMEOUT_MS = 120_000;

/**
 * Presents RevenueCat paywall. After a native purchase/restored result, swaps to
 * `/onboarding/post-paywall` immediately while the entitlement sync + provisioning pipeline
 * runs there (web Stripe checkout success handling is separate from this path).
 *
 * Call from signup email step or `IOSPaywall` — not used on web.
 */
export async function runIosPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
  /** When true, skip module presentation lock (debugging / IOSPaywall “no guards” mode). */
  bypassPresentationLock?: boolean;
  /** Compat StoreKit path only (older iOS without RevenueCat paywall UI). Defaults to monthly. */
  billingPeriod?: BillingPeriod;
}): Promise<IosPaywallFlowOutcome> {
  const canNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  if (!canNative) {
    debugLog({
      location: "runIosPaywallFlow.ts:skipped",
      message: "Flow skipped — not native iOS",
      data: {
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
        explain: "EmailCollection/IOSPaywall should not call this on web; got non-iOS native",
      },
      hypothesisId: "H2",
    });
    return "skipped";
  }

  const useLock = !options.bypassPresentationLock;

  if (useLock && presentationInFlight) {
    setLastPaywallErrorMessage(i18n.t("paywall:flow.subscriptionScreenMayBeOpening"));
    debugLog({
      location: "runIosPaywallFlow.ts:blocked",
      message: "Global paywall already in flight (another screen or double invoke)",
      data: {
        reason: "GLOBAL_PAYWALL_IN_FLIGHT",
        userIdPresent: !!options.userId,
      },
      hypothesisId: "H2",
    });
    toast.error(i18n.t("paywall:flow.subscriptionAlreadyOpening"), { duration: 8000 });
    return "present_failed";
  }
  if (useLock) {
    presentationInFlight = true;
  }

  try {
    debugLog({
      location: "runIosPaywallFlow.ts:beforePresent",
      message: "Calling presentRevenueCatPaywall",
      data: {
        userIdPresent: !!options.userId,
        userIdLength: options.userId?.length ?? 0,
        billingPeriod: options.billingPeriod ?? "monthly",
      },
      hypothesisId: "H2",
    });
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => {
        setLastPaywallErrorMessage(i18n.t("paywall:flow.openingSubscriptionsTimedOut"));
        debugLog({
          location: "runIosPaywallFlow.ts:presentTimeout",
          message: "presentRevenueCatPaywall timed out",
          data: { ms: PAYWALL_PRESENT_TIMEOUT_MS },
          hypothesisId: "H2",
        });
        resolve(false);
      }, PAYWALL_PRESENT_TIMEOUT_MS);
    });

    const presentPromise = presentRevenueCatPaywall(options.userId, {
      billingPeriod: options.billingPeriod,
    }).finally(() => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    });

    const result = await Promise.race([presentPromise, timeoutPromise]);

    if (!result) {
      const detail = getLastPaywallError() || i18n.t("paywall:flow.paymentNotCompleted");
      debugLog({
        location: "runIosPaywallFlow.ts:afterPresent",
        message: "presentRevenueCatPaywall returned false",
        data: {
          lastPaywallError: detail,
          hints: [
            "No RC API key in build",
            "RC not configured / logIn failed",
            "getOfferings failed",
            "RevenueCatUI NOT_PRESENTED or ERROR (offering id mismatch?)",
            "Compat StoreKit: billing not supported or purchase failed",
          ],
        },
        hypothesisId: "H2",
      });
      toast.error(getLastPaywallError() || i18n.t("paywall:webWrapper.subscriptionNotCompleted"), { duration: 8000 });
      return "present_failed";
    }

    armIapPostPurchaseEntitlementLatch(options.userId);
    debugLog({
      location: "runIosPaywallFlow.ts:presentSuccess",
      message: "Paywall dismissed with purchase/restored — routing to post-paywall loading; entitlement sync runs there",
      data: { userIdPresent: !!options.userId },
      hypothesisId: "H2",
    });
    options.navigate("/onboarding/post-paywall", { replace: true });
    return "success";
  } catch (err) {
    debugLog({
      location: "runIosPaywallFlow.ts:catch",
      message: "Exception during paywall flow",
      data: {
        err: String((err as Error)?.message ?? err),
        stack: (err as Error)?.stack?.slice(0, 800) ?? null,
        lastPaywallError: getLastPaywallError(),
      },
      hypothesisId: "H2",
    });
    toast.error(i18n.t("paywall:flow.couldNotOpenSubscription"), { duration: 8000 });
    return "error";
  } finally {
    if (useLock) {
      presentationInFlight = false;
    }
  }
}

```

---

## FILE: src/lib/runAndroidPaywallFlow.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import {
  presentRevenueCatPaywall,
  getLastPaywallError,
  setLastPaywallErrorMessage,
} from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { armAndroidPostPurchaseEntitlementLatch } from "@/lib/androidPostPurchaseEntitlementGate";
import i18n from "@/i18n";

export type AndroidPaywallFlowOutcome =
  | "success"
  | "present_failed"
  | "error"
  | "skipped";

let presentationInFlight = false;

export function resetAndroidPaywallPresentationFlightLock() {
  presentationInFlight = false;
}

const PAYWALL_PRESENT_TIMEOUT_MS = 120_000;

/**
 * Presents RevenueCat paywall on Android. After a purchase/restored result, routes to
 * `/onboarding/android-post-paywall` where entitlement sync + provisioning runs.
 *
 * Android-only. Does not touch iOS code or paths.
 */
export async function runAndroidPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
  bypassPresentationLock?: boolean;
}): Promise<AndroidPaywallFlowOutcome> {
  const canNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!canNative) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:skipped",
      message: "Flow skipped — not native Android",
      data: {
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    return "skipped";
  }

  const useLock = !options.bypassPresentationLock;

  if (useLock && presentationInFlight) {
    setLastPaywallErrorMessage(i18n.t("paywall:flow.subscriptionScreenMayBeOpening"));
    toast.error(i18n.t("paywall:flow.subscriptionAlreadyOpening"), { duration: 8000 });
    return "present_failed";
  }
  if (useLock) {
    presentationInFlight = true;
  }

  try {
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => {
        setLastPaywallErrorMessage(i18n.t("paywall:flow.openingSubscriptionsTimedOut"));
        resolve(false);
      }, PAYWALL_PRESENT_TIMEOUT_MS);
    });

    const presentPromise = presentRevenueCatPaywall(options.userId).finally(
      () => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    );

    const result = await Promise.race([presentPromise, timeoutPromise]);

    if (!result) {
      toast.error(
        getLastPaywallError() || i18n.t("paywall:webWrapper.subscriptionNotCompleted"),
        { duration: 8000 }
      );
      return "present_failed";
    }

    armAndroidPostPurchaseEntitlementLatch(options.userId);
    options.navigate("/onboarding/android-post-paywall", { replace: true });
    return "success";
  } catch (err) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:catch",
      message: "Exception during Android paywall flow",
      data: {
        err: String((err as Error)?.message ?? err),
        stack: (err as Error)?.stack?.slice(0, 800) ?? null,
        lastPaywallError: getLastPaywallError(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    toast.error(i18n.t("paywall:flow.couldNotOpenSubscription"), { duration: 8000 });
    return "error";
  } finally {
    if (useLock) {
      presentationInFlight = false;
    }
  }
}

```

---

## FILE: src/lib/runWebPaywallFlow.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import i18n from "@/i18n";

export type WebPaywallFlowOutcome = "success" | "skipped";

/**
 * After web signup, route to the RevenueCat web paywall (purchases-js).
 * Entitlement sync runs on `/onboarding/post-paywall` (same edge function as native).
 */
export async function runWebPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
}): Promise<WebPaywallFlowOutcome> {
  if (Capacitor.isNativePlatform()) {
    return "skipped";
  }

  if (!options.userId) {
    toast.error(i18n.t("paywall:flow.signInRequiredBeforeSubscribing"));
    options.navigate("/login", { replace: true });
    return "skipped";
  }

  armIapPostPurchaseEntitlementLatch(options.userId);
  options.navigate("/onboarding/web-paywall", { replace: true });
  return "success";
}

```

---

## FILE: src/lib/isIosPaywallContext.ts

```typescript
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

```

---

## FILE: src/lib/isAndroidPaywallContext.ts

```typescript
import { Capacitor } from "@capacitor/core";

/**
 * True when we should show the Android paywall route (native Android app only).
 * Completely separate from the iOS paywall context — no shared logic.
 */
export function isAndroidPaywallContext(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}

```

---

## FILE: src/lib/iosRevenueCatUiGate.ts

```typescript
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
 * When true, call RevenueCatUI.presentPaywall. When false, use NativePurchases + RC sync only.
 * If OS major cannot be determined, prefer RevenueCat UI so users are not stuck on a compat path
 * that can fail instantly (e.g. isBillingSupported false) with no visible paywall.
 */
export async function shouldUseRevenueCatPaywallUi(): Promise<boolean> {
  if (!(Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios")) return true;
  const deviceMajor = await getIosMajorVersionForNative();
  const uaMajor = parseUaIosMajor();
  const major = deviceMajor ?? uaMajor;
  if (major === null) return true;
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

```

---

## FILE: src/lib/iosPostPurchaseEntitlementGate.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { debugLog } from "@/debugLog";
import { syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";
import { syncWebRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCatWeb";

/** Handoff from native paywall dismissal → entitlement sync happens on `/onboarding/post-paywall`. */
const STORAGE_KEY = "sv_iap_post_paywall_gate_v1";

export type IapPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

/** One in-flight entitlement sync shared by PostPaywallLoading remounts (e.g. React Strict Mode). */
let entitlementSyncOutcome: Promise<"skipped" | "synced" | "failed"> | null = null;

export function armIapPostPurchaseEntitlementLatch(userId: string | null): void {
  try {
    const payload: IapPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearIapPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): IapPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<IapPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

function applyIapSubscriptionSessionMarkers(userId: string | null): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("subscription_check_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    if (userId) {
      sessionStorage.setItem(
        `subscription_check_${userId}`,
        JSON.stringify({ ts: Date.now(), active: true }),
      );
    }
  } catch {
    /* ignore */
  }
  (window as unknown as { __subscriptionConfirmed?: boolean }).__subscriptionConfirmed = true;
}

/**
 * If the user just completed the native IAP paywall, retries entitlement sync then marks subscription
 * confirmation. Stripe / refreshes skip when no latch exists or sync already succeeded.
 *
 * Uses a shared promise so remounting the loading route does not start parallel sync/work.
 */
export async function runIapPostPurchaseGateIfNeeded(): Promise<"skipped" | "synced" | "failed"> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return "skipped";

  const isWeb = !Capacitor.isNativePlatform();
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  if (!isNativeIos && !isWeb) {
    clearIapPostPurchaseEntitlementLatch();
    return "skipped";
  }

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<"skipped" | "synced" | "failed"> => {
    try {
      const ok = isWeb
        ? await syncWebRevenueCatEntitlementAfterPurchaseWithRetries()
        : await syncRevenueCatEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "iosPostPurchaseEntitlementGate.ts:syncFail",
          message: "syncRevenueCatEntitlementAfterPurchaseWithRetries returned false after IAP",
          hypothesisId: "H5",
        });
        clearIapPostPurchaseEntitlementLatch();
        return "failed";
      }
      applyIapSubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ userId, entitlementSynced: true } satisfies IapPaywallLatch),
        );
      } catch {
        /* ignore */
      }
      return "synced";
    } catch (e) {
      console.error("[iosPostPurchaseEntitlementGate]", e);
      clearIapPostPurchaseEntitlementLatch();
      return "failed";
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}

```

---

## FILE: src/lib/androidPostPurchaseEntitlementGate.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { debugLog } from "@/debugLog";
import { syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";

const STORAGE_KEY = "sv_android_post_paywall_gate_v1";

export type AndroidPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type AndroidPostPurchaseGateResult =
  | { status: "skipped" }
  | { status: "verified" }
  /** Play purchase succeeded but Google/RevenueCat entitlement sync is not confirmed yet. */
  | { status: "delayed"; reason: string };

let entitlementSyncOutcome: Promise<AndroidPostPurchaseGateResult> | null = null;

export function armAndroidPostPurchaseEntitlementLatch(
  userId: string | null
): void {
  try {
    const payload: AndroidPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearAndroidPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): AndroidPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AndroidPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

export function getAndroidPostPurchaseLatchUserId(): string | null {
  return readLatch()?.userId ?? null;
}

/** Optimistic dashboard access when Google Play → RevenueCat sync is still in flight. */
export function markAndroidSubscriptionConfirmed(userId: string | null): void {
  applyAndroidSubscriptionSessionMarkers(userId);
}

function applyAndroidSubscriptionSessionMarkers(userId: string | null): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("subscription_check_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    if (userId) {
      sessionStorage.setItem(
        `subscription_check_${userId}`,
        JSON.stringify({ ts: Date.now(), active: true })
      );
    }
  } catch {
    /* ignore */
  }
  (
    window as unknown as { __subscriptionConfirmed?: boolean }
  ).__subscriptionConfirmed = true;
}

/**
 * Background RevenueCat/server sync after optimistic dashboard handoff.
 * Does not block UI or bounce the user back to paywall.
 */
export function retryAndroidPostPurchaseEntitlementSyncInBackground(
  attempts = 6
): void {
  void (async () => {
    const start = performance.now();
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts);
      const syncMs = Math.round(performance.now() - start);
      debugLog({
        location: "androidPostPurchaseEntitlementGate.ts:backgroundRetry",
        message: ok
          ? "Background entitlement sync succeeded"
          : "Background entitlement sync still unverified",
        data: { ok, syncMs, attempts },
        hypothesisId: "ANDROID-GATE",
      });
      console.info("[android-post-paywall] background entitlement sync", { ok, syncMs, attempts });
    } catch (e) {
      console.warn("[android-post-paywall] background entitlement sync error:", e);
    }
  })();
}

/**
 * Android-only post-purchase entitlement sync. Mirrors the iOS gate but uses
 * its own storage key and platform check. Shares no code with the iOS gate.
 *
 * After a successful Play purchase, sync failure is reported as `delayed` — not
 * a hard failure — because entitlement can lag behind the purchase receipt.
 */
export async function runAndroidPostPurchaseGateIfNeeded(): Promise<AndroidPostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return { status: "skipped" };

  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!isNativeAndroid) {
    clearAndroidPostPurchaseEntitlementLatch();
    return { status: "skipped" };
  }

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<AndroidPostPurchaseGateResult> => {
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "androidPostPurchaseEntitlementGate.ts:syncDelayed",
          message:
            "syncRevenueCatEntitlementAfterPurchaseWithRetries unverified after Google Play purchase — treating as delayed",
          hypothesisId: "ANDROID-GATE",
        });
        return {
          status: "delayed",
          reason: "revenuecat_sync_retries_exhausted",
        };
      }
      applyAndroidSubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            userId,
            entitlementSynced: true,
          } satisfies AndroidPaywallLatch)
        );
      } catch {
        /* ignore */
      }
      return { status: "verified" };
    } catch (e) {
      console.error("[androidPostPurchaseEntitlementGate]", e);
      return {
        status: "delayed",
        reason: e instanceof Error ? e.message : "sync_threw",
      };
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}

```

---

## FILE: src/lib/postPaywallProvisioning.ts

```typescript
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { getSupportCategoryLabel } from "@/lib/affirmations-data";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { resolveLocaleForApi } from "@/lib/locale";

// Post-paywall provisioning intentionally does NOT generate a starter belief
// elimination. Earlier iterations called `ensureStarterBeliefEntry`, which hit
// `check-content-moderation` + `refactor-belief` edge functions (multiple LLM
// round-trips) on top of the affirmation and subliminal pipeline. That added
// 5–15s to the post-paywall wait, which is why the loading meter sat at 92%.
// Beliefs are created on demand from the Refactor tool; do not re-add a
// starter belief here.

/** Manifestation milestones categories (weekly_goals) — mirrors ActivityTracking. */
const SUPPORT_CATEGORY_NAMES = new Set([
  "Career",
  "Business",
  "Learning",
  "Finances",
  "Productivity",
  "Organization",
  "Confidence",
  "Self-Love",
  "Connections",
  "Fitness",
  "Nutrition",
  "Discipline",
]);

const DESIRE_SETUP_KEY_TO_CATEGORY: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

export const STARTER_AFFIRMATION_SET_NAME = "Your starter path";
export const STARTER_SUBLIMINAL_NAME = "Starter subliminal";
const LEGACY_STARTER_SUBLIMINAL_NAME = "Starter subliminal (TTS)";

/** iOS/web keep a 5-min starter; Android uses 1 min to cut WASM encode time on device. */
export function getStarterSubliminalDurationMinutes(): number {
  return isAndroidPaywallContext() ? 1 : 5;
}

function setupPathRowToDraft(row: Record<string, unknown>): SetupDraft {
  const spec = row.conditional_specificity;
  return {
    firstName: typeof row.first_name === "string" ? row.first_name : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    desireCategory: typeof row.desire_category === "string" ? row.desire_category : undefined,
    // "desire text" is no longer used; ignore stored values if present.
    currentFriction: typeof row.current_friction === "string" ? row.current_friction : undefined,
    desiredIdentity: typeof row.desired_identity === "string" ? row.desired_identity : undefined,
    toolPreferences: Array.isArray(row.tool_preferences) ? (row.tool_preferences as string[]) : undefined,
    conditionalSpecificity:
      spec && typeof spec === "object" && spec !== null ? (spec as Record<string, unknown>) : undefined,
  };
}

async function loadDraftForProvisioning(userId: string): Promise<SetupDraft> {
  const local = readSetupDraft();
  const { data } = await (supabase as any).from("user_setup_path").select("*").eq("user_id", userId).maybeSingle();
  const fromDb = data ? setupPathRowToDraft(data as Record<string, unknown>) : {};
  return { ...fromDb, ...local };
}

async function isPostPaywallProvisioned(userId: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from("user_setup_path")
    .select("post_paywall_provisioned_at")
    .eq("user_id", userId)
    .maybeSingle();
  return !!(data && data.post_paywall_provisioned_at);
}

async function markPostPaywallProvisioned(userId: string): Promise<void> {
  const iso = new Date().toISOString();
  const { data: existing } = await (supabase as any)
    .from("user_setup_path")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.user_id) {
    const { error } = await (supabase as any)
      .from("user_setup_path")
      .update({ post_paywall_provisioned_at: iso })
      .eq("user_id", userId);
    if (error && import.meta.env.DEV) {
      console.warn("[postPaywallProvisioning] post_paywall_provisioned_at update failed:", error);
    }
    return;
  }

  const { error: insErr } = await (supabase as any).from("user_setup_path").insert({
    user_id: userId,
    tool_preferences: [],
    conditional_specificity: {},
    post_paywall_provisioned_at: iso,
  });
  if (insErr && import.meta.env.DEV) {
    console.warn("[postPaywallProvisioning] user_setup_path insert for provision flag failed:", insErr);
  }
}

export function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string): string {
  const raw = (desireCategory || "").trim();
  if (SUPPORT_CATEGORY_NAMES.has(raw)) return raw;
  const mapped = DESIRE_SETUP_KEY_TO_CATEGORY[raw];
  const category = mapped && SUPPORT_CATEGORY_NAMES.has(mapped) ? mapped : "Confidence";
  return category;
}

function buildConditionalAnswer(draft: SetupDraft): string {
  const raw = draft.conditionalSpecificity;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const rec = raw as Record<string, unknown>;

  const branch = typeof rec.branch === "string" ? rec.branch : "";

  if (branch === "sp_person") {
    const spRaw = rec.sp;
    if (!spRaw || typeof spRaw !== "object" || Array.isArray(spRaw)) return "";
    const sp = spRaw as Record<string, unknown>;
    const choice = typeof sp.hasSpecificPerson === "string" ? sp.hasSpecificPerson : "";
    const label = typeof sp.label === "string" ? sp.label.trim() : "";
    const choiceLabel =
      choice === "yes"
        ? "Yes"
        : choice === "no"
          ? "No"
          : choice === "complicated"
            ? "It's complicated"
            : choice === "prefer_not"
              ? "Prefer not to say"
              : "";
    if (!choiceLabel) return "";
    return label ? `${choiceLabel} — ${label}` : choiceLabel;
  }

  if (branch === "step7_options") {
    const s7Raw = rec.step7;
    if (!s7Raw || typeof s7Raw !== "object" || Array.isArray(s7Raw)) return "";
    const s7 = s7Raw as Record<string, unknown>;
    const sel = typeof s7.selection === "string" ? s7.selection.trim() : "";
    const custom = typeof s7.customText === "string" ? s7.customText.trim() : "";
    if (!sel) return "";
    if (sel === "Custom" && custom) return custom;
    return sel;
  }

  return "";
}

function buildAffirmationTopic(draft: SetupDraft): string {
  const category = mapDesireSetupKeyToWeeklyCategory(draft.desireCategory);
  const displayCategory = (() => {
    const label = getSupportCategoryLabel(category);
    // UI-only rename: "Beauty / Glow Up" should be "Glow Up" as a topic seed.
    return label === "Beauty / Glow Up" ? "Glow Up" : label;
  })();
  // Special exception: for Love/SP, use only the category (no conditional text).
  if (category === "Connections" || category === "sp_love") {
    return displayCategory.length > 50 ? displayCategory.slice(0, 50) : displayCategory;
  }
  const answer = buildConditionalAnswer(draft);
  const combined = `${displayCategory} — ${answer}`.trim();
  return combined.length > 50 ? combined.slice(0, 50) : combined;
}

function clipAffirmationsForTts(affirmations: string[], maxChars: number): string[] {
  const joined = affirmations.map((a) => a.trim()).filter(Boolean);
  if (joined.length === 0) return ["I am moving forward with calm confidence."];
  let total = joined.join(" ").length;
  if (total <= maxChars) return joined;
  const out: string[] = [];
  let used = 0;
  for (const line of joined) {
    const next = used + line.length + (out.length > 0 ? 1 : 0);
    if (next > maxChars) {
      const room = maxChars - used - (out.length > 0 ? 1 : 0);
      if (room > 12) out.push(line.slice(0, room).trim());
      break;
    }
    out.push(line);
    used = next;
  }
  return out.length ? out : [joined[0].slice(0, maxChars)];
}

async function findStarterAffirmationSet(userId: string): Promise<{ id: string; affirmations: string[] } | null> {
  const { data, error } = await (supabase as any)
    .from("user_affirmation_sets")
    .select("id, affirmations")
    .eq("user_id", userId)
    .eq("name", STARTER_AFFIRMATION_SET_NAME)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  const affirmations = Array.isArray(data.affirmations) ? (data.affirmations as string[]) : [];
  return { id: data.id, affirmations };
}

async function createStarterAffirmationSet(
  userId: string,
  draft: SetupDraft,
  category: string
): Promise<{ id: string; affirmations: string[] } | null> {
  const topic = buildAffirmationTopic(draft);
  const { data, error } = await supabase.functions.invoke("generate-affirmations", {
    body: { topic, category, locale: resolveLocaleForApi(draft.locale) },
  });

  if (data?.error || data?.blocked) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] generate-affirmations body error:", data);
    return null;
  }
  if (error) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] generate-affirmations invoke error:", error);
    return null;
  }
  const affirmations = Array.isArray(data?.affirmations) ? (data.affirmations as string[]) : [];
  if (affirmations.length === 0) return null;

  const setId = crypto.randomUUID();
  const { error: insertError } = await (supabase as any).from("user_affirmation_sets").insert({
    id: setId,
    user_id: userId,
    name: STARTER_AFFIRMATION_SET_NAME,
    affirmations,
    images: [],
    category: SUPPORT_CATEGORY_NAMES.has(category) ? category : "Confidence",
  });

  if (insertError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] affirmation set insert failed:", insertError);
    return null;
  }

  await (supabase as any).from("ai_affirmation_generation_log").insert({
    user_id: userId,
    set_id: setId,
    generated_at: new Date().toISOString(),
  });

  return { id: setId, affirmations };
}

async function fetchVocalBaseMp3Blob(accessToken: string, affirmations: string[]): Promise<Blob | null> {
  const clipped = clipAffirmationsForTts(affirmations, 480);
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-affirmation-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ affirmations: clipped, voice: "nova" }),
  });
  const raw = await response.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!response.ok || parsed?.error || !parsed?.audioContent) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] TTS failed", response.status, parsed?.error);
    return null;
  }
  try {
    const binaryString = atob(parsed.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return new Blob([bytes], { type: "audio/mpeg" });
  } catch {
    return null;
  }
}

async function ensureStarterSubliminalTrack(
  userId: string,
  accessToken: string,
  affirmations: string[],
  onProgress?: (percent: number) => void
): Promise<void> {
  const { data: existing } = await (supabase as any)
    .from("subliminal_tracks")
    .select("id")
    .eq("user_id", userId)
    .in("name", [STARTER_SUBLIMINAL_NAME, LEGACY_STARTER_SUBLIMINAL_NAME])
    .limit(1)
    .maybeSingle();

  if (existing?.id) {
    onProgress?.(100);
    return;
  }

  onProgress?.(62);
  const vocalBaseBlob = await fetchVocalBaseMp3Blob(accessToken, affirmations);
  if (!vocalBaseBlob) return;

  onProgress?.(68);
  const durationMinutes = getStarterSubliminalDurationMinutes();
  const { AudioProcessor } = await import("@/lib/audioProcessor");
  const processor = new AudioProcessor();
  let subliminalBlob: Blob;
  try {
    subliminalBlob = await processor.generateSubliminalTrack({
      affirmationBlob: vocalBaseBlob,
      binauralType: "theta",
      binauralVolume: 0.07,
      backgroundSound: "Rain v2.WAV",
      affirmationVolume: 0.07,
      backgroundVolume: 1,
      layers: 1,
      duration: durationMinutes,
      onMixProgress: (mixPct) => {
        onProgress?.(68 + Math.round(mixPct * 0.27));
      },
    });
  } finally {
    processor.dispose();
  }

  onProgress?.(96);
  const fileName = `${userId}/${Date.now()}_${STARTER_SUBLIMINAL_NAME.replace(/[^a-z0-9]/gi, "_")}.mp3`;
  const { error: uploadError } = await supabase.storage.from("subliminal-tracks").upload(fileName, subliminalBlob, {
    contentType: "audio/mpeg",
    upsert: false,
  });

  if (uploadError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal upload failed:", uploadError);
    return;
  }

  const { data: publicData } = supabase.storage.from("subliminal-tracks").getPublicUrl(fileName);
  const publicUrl = publicData?.publicUrl;

  const { data: dbTrack, error: dbError } = await (supabase as any)
    .from("subliminal_tracks")
    .insert({
      user_id: userId,
      name: STARTER_SUBLIMINAL_NAME,
      binaural_beat: "theta",
      binaural_volume: 0.07,
      background_sound: "Rain v2.WAV",
      affirmation_volume: 0.07,
      background_volume: 1,
      layers: 1,
      length: durationMinutes,
      audio_url: publicUrl,
    })
    .select("id")
    .single();

  if (dbError || !dbTrack?.id) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal db insert failed:", dbError);
    return;
  }

  await (supabase as any).from("subliminal_generation_log").insert({
    user_id: userId,
    track_id: dbTrack.id,
    generated_at: new Date().toISOString(),
  });

  onProgress?.(100);
}

export type ProvisionPostPaywallResult = { ran: boolean; skipped: boolean; reason?: string };

/**
 * One idempotent pass after a successful subscription: creates AI affirmations
 * and a TTS-backed starter subliminal track from the setup draft. Safe to call
 * multiple times. Belief eliminations are intentionally NOT generated here —
 * those are user-driven from the Refactor tool. See the module-level note.
 */
export async function provisionPostPaywallIfNeeded(options?: {
  quiet?: boolean;
  /** 0–100 milestones while starter content is created (post-paywall UI). */
  onProgress?: (percent: number) => void;
}): Promise<ProvisionPostPaywallResult> {
  const quiet = options?.quiet ?? true;
  const report = (percent: number) => options?.onProgress?.(percent);

  report(8);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id || !session.access_token) {
    return { ran: false, skipped: true, reason: "no_session" };
  }

  const userId = session.user.id;
  const accessToken = session.access_token;

  report(18);

  const { data: planRow } = await (supabase as any)
    .from("user_plans")
    .select("starter_provisioned")
    .eq("user_id", userId)
    .maybeSingle();

  if (planRow?.starter_provisioned) {
    report(100);
    return { ran: false, skipped: true, reason: "already_provisioned" };
  }

  report(28);
  const draft = await loadDraftForProvisioning(userId);
  const category = mapDesireSetupKeyToWeeklyCategory(draft.desireCategory);

  try {
    report(38);
    let set = await findStarterAffirmationSet(userId);
    if (!set) {
      set = await createStarterAffirmationSet(userId, draft, category);
    }

    if (!set) {
      return { ran: false, skipped: true, reason: "starter_affirmation_set_failed" };
    }

    report(52);

    if (set.affirmations.length > 0) {
      await ensureStarterSubliminalTrack(userId, accessToken, set.affirmations, (subPct) => {
        report(52 + Math.round(subPct * 0.43));
      });
    } else {
      report(95);
    }

    await markPostPaywallProvisioned(userId);

    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);

    // Persist embody picks from setup draft before clearing localStorage (otherwise hook falls back to defaults).
    const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
    if (embodySlugs) {
      const { error: embodyPrefErr } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, embody_active_practices: embodySlugs }, { onConflict: "user_id" });
      if (embodyPrefErr && import.meta.env.DEV) {
        console.warn("[postPaywallProvisioning] embody_active_practices upsert failed:", embodyPrefErr.message);
      }
    }

    clearSetupDraft();

    report(100);

    if (!quiet) {
      // Callers may show UI; this module stays toast-free.
    }

    return { ran: true, skipped: false };
  } catch (e) {
    if (import.meta.env.DEV) console.error("[postPaywallProvisioning] unexpected:", e);
    return { ran: false, skipped: true, reason: "error" };
  }
}

```

---

## FILE: src/lib/revenueCatPaywallMedia.ts

```typescript
const HIDDEN_ATTR = "data-rc-hidden-paywall-media";

const INVALID_SRC =
  /^(?:file:|capacitor:|\/assets\/|\.\/assets|bundle:\/\/|res:\/\/)/i;

function isInvalidSrc(src: string | null | undefined): boolean {
  const value = (src ?? "").trim();
  if (!value || value === "#") return true;
  return INVALID_SRC.test(value);
}

function shouldHideImage(img: HTMLImageElement): boolean {
  if (isInvalidSrc(img.getAttribute("src"))) return true;
  return img.complete && img.naturalHeight === 0;
}

/** Hide a broken hero slot without touching plan rows or CTAs below. */
function hideImageBlock(img: HTMLImageElement, root: HTMLElement): void {
  const mark = (el: HTMLElement) => {
    el.setAttribute(HIDDEN_ATTR, "true");
  };

  const rootTop = root.getBoundingClientRect().top;
  const imgTop = img.getBoundingClientRect().top;
  const inTopHero = imgTop - rootTop < 360;

  let node: HTMLElement | null = img.parentElement;
  for (let depth = 0; depth < 8 && node && node !== root; depth += 1) {
    const imgs = node.querySelectorAll("img");
    const tallEnough = node.getBoundingClientRect().height > 48;
    if (inTopHero && imgs.length === 1 && tallEnough) {
      mark(node);
      return;
    }
    node = node.parentElement;
  }

  mark(img);
}

function scanPaywallImages(root: HTMLElement): void {
  root.querySelectorAll("img").forEach((img) => {
    if (img.getAttribute(HIDDEN_ATTR) === "true") return;

    const hide = () => hideImageBlock(img, root);

    if (shouldHideImage(img)) {
      hide();
      return;
    }

    img.addEventListener("error", hide, { once: true });
  });
}

/**
 * RevenueCat web paywalls often ship a dashboard hero image URL that 404s on web
 * (native asset paths, empty src, etc.). Hide only broken/invalid top media.
 */
export function attachHideBrokenRevenueCatPaywallMedia(root: HTMLElement): () => void {
  scanPaywallImages(root);

  const observer = new MutationObserver(() => scanPaywallImages(root));
  observer.observe(root, { childList: true, subtree: true });

  return () => observer.disconnect();
}

```

---

## FILE: src/lib/revenueCatBillingPortalUrl.ts

```typescript
/** Tokenized portal or RC API redirect used by Web Billing management emails. */
export function isRevenueCatWebBillingPortalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "billing.revenuecat.com") return true;
    if (parsed.hostname === "api.revenuecat.com" && /\/rcbilling\//i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

```

---

## FILE: src/lib/nativeIosPremiumPurchase.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { getIAPProductId, type BillingPeriod } from "@/lib/appleIAP";

/**
 * StoreKit purchase without RevenueCat Paywalls UI (older iOS compat).
 * Does not call sync-revenuecat-entitlement — callers (e.g. runIosPaywallFlow) sync once after
 * presentRevenueCatPaywall returns true. A duplicate sync here sent multiple welcome emails.
 */
export async function purchasePremiumViaNativeStoreKit(
  plan: BillingPeriod
): Promise<{ success: boolean; error?: string }> {
  if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== "ios") {
    return { success: false, error: "Not iOS native" };
  }
  const productId = getIAPProductId("premium", plan);
  if (!productId) return { success: false, error: "Product not configured" };

  try {
    const { isBillingSupported } = await NativePurchases.isBillingSupported();
    if (!isBillingSupported) return { success: false, error: "Billing not supported on this device." };
  } catch (e) {
    return { success: false, error: e instanceof Error ? e.message : "Could not check billing." };
  }

  try {
    const result = await NativePurchases.purchaseProduct({
      productIdentifier: productId,
      productType: PURCHASE_TYPE.SUBS,
      quantity: 1,
    });
    const transactionId = (result as { transactionId?: string }).transactionId;
    if (!transactionId) return { success: false, error: "No transaction ID returned" };

    return { success: true };
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Purchase failed";
    if (message.includes("cancelled") || message.includes("canceled")) {
      return { success: false, error: "cancelled" };
    }
    return { success: false, error: message };
  }
}

```

---

## FILE: src/lib/startWebStripeCheckout.ts

```typescript
import type { NavigateFunction } from "react-router-dom";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

/**
 * @deprecated Web uses RevenueCat Web Billing (`runWebPaywallFlowAfterSignup`). Kept for callers migrating off Stripe Checkout.
 */
export async function startWebStripeCheckout(
  navigate?: NavigateFunction,
  userId?: string | null,
): Promise<boolean> {
  if (!navigate) {
    console.warn("[startWebStripeCheckout] navigate required for RevenueCat web paywall");
    return false;
  }
  const outcome = await runWebPaywallFlowAfterSignup({ userId: userId ?? null, navigate });
  return outcome === "success";
}

```

---

## FILE: src/lib/appleIAP.ts

```typescript
/**
 * Single tier: Premium (full-featured). Monthly, annual, and weekly via RevenueCat/Apple.
 * Product IDs: com.paletteplotting.app.monthly, com.paletteplotting.app.annual, com.paletteplotting.app.weekly
 */
export const IAP_PRODUCT_IDS: Record<string, string> = {
  premium_monthly:
    (import.meta.env.VITE_IAP_PRODUCT_PREMIUM_MONTHLY as string) ||
    "com.paletteplotting.app.monthly",
  premium_annual:
    (import.meta.env.VITE_IAP_PRODUCT_PREMIUM_ANNUAL as string) ||
    "com.paletteplotting.app.annual",
  premium_weekly:
    (import.meta.env.VITE_IAP_PRODUCT_PREMIUM_WEEKLY as string) ||
    "com.paletteplotting.app.weekly",
};

export type Tier = "basic" | "plus" | "premium";
export type BillingPeriod = "monthly" | "annual" | "weekly";

export function getIAPProductId(tier: Tier, billing: BillingPeriod): string {
  if (tier !== "premium") return "";
  const key = `premium_${billing}` as keyof typeof IAP_PRODUCT_IDS;
  return IAP_PRODUCT_IDS[key] || "";
}

export function getAllIAPProductIds(): string[] {
  return [
    IAP_PRODUCT_IDS.premium_monthly,
    IAP_PRODUCT_IDS.premium_annual,
    IAP_PRODUCT_IDS.premium_weekly,
  ].filter(Boolean);
}

```

---

## FILE: src/lib/webFirstPurchaseGetAppPrompt.ts

```typescript
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

```

---

## FILE: src/hooks/useAppleIAP.ts

```typescript
import { useState, useCallback, useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { NativePurchases, PURCHASE_TYPE } from "@capgo/native-purchases";
import { OpenExternalSystemUrl } from "@/plugins/openExternalSystemUrl";
import {
  bootstrapRevenueCat,
  resolveRevenueCatUILocale,
  syncRevenueCatEntitlementToBackend,
  syncRevenueCatUILocale,
} from "@/services/revenueCat";
import {
  shouldUseRevenueCatCustomerCenterUi,
  getIosMajorVersionForNative,
  IOS_REVENUECAT_UI_MIN_MAJOR,
} from "@/lib/iosRevenueCatUiGate";
import {
  getIAPProductId,
  getAllIAPProductIds,
  type BillingPeriod,
} from "@/lib/appleIAP";

/** Apple subscription management — system handoff only via `UIApplication.shared.open` (native plugin). */
const APPLE_MANAGE_SUBSCRIPTIONS_ITMS = "itms-apps://apps.apple.com/account/subscriptions";

async function openAppleSubscriptionManagementItmsOnly(): Promise<void> {
  await OpenExternalSystemUrl.open({ url: APPLE_MANAGE_SUBSCRIPTIONS_ITMS });
}

export interface IAPProduct {
  identifier: string;
  title: string;
  priceString: string;
  description?: string;
}

export function useAppleIAP() {
  const [products, setProducts] = useState<IAPProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [billingSupported, setBillingSupported] = useState<boolean | null>(null);

  const isIOSNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const loadProducts = useCallback(async () => {
    if (!isIOSNative) return;

    setIsLoading(true);
    try {
      const { isBillingSupported } = await NativePurchases.isBillingSupported();
      setBillingSupported(isBillingSupported);

      if (!isBillingSupported) {
        setProducts([]);
        return;
      }

      const productIds = getAllIAPProductIds();
      if (productIds.length === 0) {
        setProducts([]);
        return;
      }

      const { products: list } = await NativePurchases.getProducts({
        productIdentifiers: productIds,
        productType: PURCHASE_TYPE.SUBS,
      });

      setProducts(
        (list || []).map((p: { identifier: string; title?: string; priceString?: string; description?: string }) => ({
          identifier: p.identifier,
          title: p.title || p.identifier,
          priceString: p.priceString || "",
          description: p.description,
        }))
      );
    } catch (e) {
      console.error("Apple IAP loadProducts:", e);
      setProducts([]);
    } finally {
      setIsLoading(false);
    }
  }, [isIOSNative]);

  useEffect(() => {
    if (isIOSNative) {
      void loadProducts();
    }
  }, [isIOSNative, loadProducts]);

  const purchase = useCallback(
    async (plan: BillingPeriod): Promise<{ success: boolean; error?: string }> => {
      if (!isIOSNative) return { success: false, error: "Not iOS native" };

      const productId = getIAPProductId("premium", plan);
      if (!productId) return { success: false, error: "Product not configured" };

      setIsPurchasing(true);
      try {
        const result = await NativePurchases.purchaseProduct({
          productIdentifier: productId,
          productType: PURCHASE_TYPE.SUBS,
          quantity: 1,
        });

        const transactionId = (result as { transactionId?: string }).transactionId;
        if (!transactionId) {
          return { success: false, error: "No transaction ID returned" };
        }

        const synced = await syncRevenueCatEntitlementToBackend();
        if (!synced) {
          return {
            success: false,
            error: "Could not sync subscription to server. Check RevenueCat and try again.",
          };
        }

        return { success: true };
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Purchase failed";
        if (message.includes("cancelled") || message.includes("canceled")) {
          return { success: false, error: "cancelled" };
        }
        return { success: false, error: message };
      } finally {
        setIsPurchasing(false);
      }
    },
    [isIOSNative]
  );

  const restore = useCallback(async (): Promise<{ success: boolean; error?: string }> => {
    if (!isIOSNative) return { success: false, error: "Not iOS native" };

    setIsRestoring(true);
    try {
      await NativePurchases.restorePurchases();

      const synced = await syncRevenueCatEntitlementToBackend();
      if (!synced) {
        return {
          success: false,
          error: "Could not restore subscription on server. Check RevenueCat and try again.",
        };
      }

      return { success: true };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Restore failed";
      return { success: false, error: message };
    } finally {
      setIsRestoring(false);
    }
  }, [isIOSNative]);

  const openSubscriptionManagement = useCallback(async (appUserId?: string | null) => {
    if (!isIOSNative) return;

    const iosMajor = await getIosMajorVersionForNative();
    console.log("[Billing] openSubscriptionManagement", { iosMajor });

    // Hard guard first: unknown major or below cutoff → only itms native open, then return.
    // RevenueCat Customer Center is not evaluated on this path (e.g. iOS 17 never reaches RC UI here).
    if (iosMajor == null || iosMajor < IOS_REVENUECAT_UI_MIN_MAJOR) {
      await openAppleSubscriptionManagementItmsOnly();
      return;
    }

    const useRcCustomerCenter = await shouldUseRevenueCatCustomerCenterUi();

    console.log("[Billing] manage billing gate", {
      iosMajor,
      useRcCustomerCenter,
      platform: Capacitor.getPlatform(),
      isNative: Capacitor.isNativePlatform(),
    });

    if (!useRcCustomerCenter) {
      await openAppleSubscriptionManagementItmsOnly();
      return;
    }

    await bootstrapRevenueCat(appUserId ?? null);
    await syncRevenueCatUILocale();
    console.info("[Billing] Customer Center locale", {
      locale: resolveRevenueCatUILocale(),
    });

    const { RevenueCatUI } = await import("@revenuecat/purchases-capacitor-ui");
    await RevenueCatUI.presentCustomerCenter();
  }, [isIOSNative]);

  return {
    isAvailable: isIOSNative && billingSupported === true,
    /** Native iOS app — enables Manage billing entry; not a guarantee of RevenueCat Customer Center. */
    canManageBillingNatively: isIOSNative,
    products,
    isLoading,
    isPurchasing,
    isRestoring,
    purchase,
    restore,
    openSubscriptionManagement,
    getProductId: (plan: BillingPeriod) => getIAPProductId("premium", plan),
    getProduct: (plan: BillingPeriod) =>
      products.find((p) => p.identifier === getIAPProductId("premium", plan)),
  };
}

```

---

## FILE: src/components/WebGetAppAfterPurchaseDialog.tsx

```tsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import {
  preloadStoreBadgeImages,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  isWebGetAppDialogPreviewMode,
  markWebGetAppPromptShown,
  shouldOfferWebGetAppPrompt,
} from "@/lib/webFirstPurchaseGetAppPrompt";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { getMobileStoreHref } from "@/lib/mobileStoreHandoff";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { cn } from "@/lib/utils";

const STORE_QRS = [
  {
    label: "App Store",
    href: PALETTE_PLOTTING_APP_STORE_URL,
    alt: "QR code for the App Store",
  },
  {
    label: "Google Play",
    href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
    alt: "QR code for Google Play",
  },
] as const;

function DesktopQrPair() {
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      STORE_QRS.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: 120,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return [store.href, dataUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setQrByHref(Object.fromEntries(entries));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-center gap-6 pt-2">
      {STORE_QRS.map((store) => (
        <div key={store.href} className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{store.label}</span>
          {ready && qrByHref[store.href] ? (
            <a
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border bg-white p-2 shadow-sm"
            >
              <img
                src={qrByHref[store.href]}
                alt={store.alt}
                className="h-24 w-24"
                width={96}
                height={96}
              />
            </a>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
              aria-busy={!ready}
            >
              …
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * One-time browser prompt after the user's first web subscription purchase.
 * Shown only off paywall/onboarding/post-paywall routes (e.g. dashboard).
 */
export function WebGetAppAfterPurchaseDialog() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [detection, setDetection] = useState(detectInAppBrowser);
  const previewMode = isWebGetAppDialogPreviewMode(search);

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  useEffect(() => {
    if (!open) return;
    setDetection(detectInAppBrowser());
  }, [open]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (!shouldOfferWebGetAppPrompt(pathname, search)) {
      setOpen(false);
      return;
    }

    preloadStoreBadgeImages(true);

    const delay = previewMode ? 100 : 500;
    const timer = window.setTimeout(() => {
      if (shouldOfferWebGetAppPrompt(pathname, search)) {
        setOpen(true);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pathname, search, previewMode]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && !isWebGetAppDialogPreviewMode()) {
      markWebGetAppPromptShown();
    }
  };

  if (Capacitor.isNativePlatform()) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn(
          "z-[200] max-w-sm border-white/12 bg-[#0a0812] text-white sm:max-w-md",
          isMobile && "max-w-[calc(100vw-2rem)]",
        )}
      >
        <DialogHeader>
          <DialogTitle>Get Palette Plotting on your phone</DialogTitle>
          <DialogDescription className="text-white/60">
            Your membership is best experienced in the app. Manage billing (upgrades/cancellation)
            on web.
          </DialogDescription>
        </DialogHeader>

        {isMobile ? (
          <div
            className="flex w-full flex-col items-center gap-3 py-1"
            style={{ minHeight: STORE_BADGE_ROW_HEIGHT_PX }}
          >
            <MarketingStoreBadges
              layout="inline"
              size="lg"
              getStoreHref={getStoreHref}
            />
          </div>
        ) : (
          <DesktopQrPair />
        )}
      </DialogContent>
    </Dialog>
  );
}

```

---

## FILE: src/lib/locale.ts

```typescript
import { enUS, es, ptBR, type Locale } from "date-fns/locale";

/** Supported app UI locales. English strings are the source of truth in JSON. */
export type AppLocale = "en" | "es-419" | "pt-BR";

export const APP_LOCALES: readonly AppLocale[] = ["en", "es-419", "pt-BR"] as const;

export const PREFERRED_LOCALE_STORAGE_KEY = "sv_preferred_locale";

/** Inline switcher labels — always shown in these forms (not translated). */
export const LANGUAGE_SWITCHER_OPTIONS: { code: AppLocale; label: string }[] = [
  { code: "en", label: "English" },
  { code: "es-419", label: "Español" },
  { code: "pt-BR", label: "Português" },
];

export function isAppLocale(value: string): value is AppLocale {
  return (APP_LOCALES as readonly string[]).includes(value);
}

/** Canonical app locale from i18n.language / resolvedLanguage (es → es-419, pt → pt-BR). */
export function resolveAppLocale(raw: string | null | undefined): AppLocale {
  if (raw && isAppLocale(raw)) return raw;
  return mapDeviceLocaleToAppLocale(raw);
}

/** Map device / browser locale to a supported app locale. */
export function mapDeviceLocaleToAppLocale(raw: string | null | undefined): AppLocale {
  const tag = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");
  if (!tag) return "en";
  if (tag === "en" || tag.startsWith("en-")) return "en";
  if (tag === "es-419" || tag.startsWith("es")) return "es-419";
  if (tag === "pt-br" || tag.startsWith("pt")) return "pt-BR";
  return "en";
}

export function readStoredPreferredLocale(): AppLocale | null {
  if (typeof localStorage === "undefined") return null;
  const stored = localStorage.getItem(PREFERRED_LOCALE_STORAGE_KEY);
  return stored && isAppLocale(stored) ? stored : null;
}

export function writeStoredPreferredLocale(locale: AppLocale): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(PREFERRED_LOCALE_STORAGE_KEY, locale);
}

/** Locale to send on AI edge-function calls (stored pref → draft → device). */
export function resolveLocaleForApi(draftLocale?: string | null): AppLocale {
  const stored = readStoredPreferredLocale();
  if (stored) return stored;
  if (draftLocale && isAppLocale(draftLocale)) return draftLocale;
  return detectInitialAppLocale();
}

/** date-fns locale for formatting month/day labels in the active app language. */
export function dateFnsLocaleForApp(locale: AppLocale): Locale {
  switch (locale) {
    case "es-419":
      return es;
    case "pt-BR":
      return ptBR;
    default:
      return enUS;
  }
}

/**
 * RevenueCat paywall locale — must match locale keys in the RC paywall Localization tab.
 * @see https://www.revenuecat.com/docs/tools/paywalls/creating-paywalls/localization
 */
export function revenueCatUILocaleForApp(locale: AppLocale): string {
  switch (locale) {
    case "es-419":
      return "es-419";
    case "pt-BR":
      return "pt-BR";
    default:
      return "en";
  }
}

/** URL segment for localized legal pages (RevenueCat / App Store / public web). */
export type LegalRouteLocale = "ES" | "PT" | "DE" | "FR" | "IT" | "NL" | "ZH" | "AR";

export const LEGAL_ROUTE_LOCALES: readonly LegalRouteLocale[] = [
  "ES",
  "PT",
  "DE",
  "FR",
  "IT",
  "NL",
  "ZH",
  "AR",
] as const;

export function isLegalRouteLocale(value: string): value is LegalRouteLocale {
  return (LEGAL_ROUTE_LOCALES as readonly string[]).includes(value);
}

export function appLocaleToLegalRouteLocale(locale: AppLocale): LegalRouteLocale | null {
  if (locale === "es-419") return "ES";
  if (locale === "pt-BR") return "PT";
  return null;
}

export const LEGAL_SITE_ORIGIN = "https://paletteplot.com";

export function legalTermsPath(locale: AppLocale): string {
  const suffix = appLocaleToLegalRouteLocale(locale);
  return suffix ? `/terms/${suffix}` : "/terms";
}

export function legalPrivacyPath(locale: AppLocale): string {
  const suffix = appLocaleToLegalRouteLocale(locale);
  return suffix ? `/privacy/${suffix}` : "/privacy";
}

export function legalTermsUrl(locale: AppLocale): string {
  return `${LEGAL_SITE_ORIGIN}${legalTermsPath(locale)}`;
}

export function legalPrivacyUrl(locale: AppLocale): string {
  return `${LEGAL_SITE_ORIGIN}${legalPrivacyPath(locale)}`;
}

/** OneSignal subscription language (2-letter) for push template selection. */
export function oneSignalLanguageForApp(locale: AppLocale): string {
  if (locale === "es-419") return "es";
  if (locale === "pt-BR") return "pt";
  return "en";
}

export function detectInitialAppLocale(): AppLocale {
  const stored = readStoredPreferredLocale();
  if (stored) return stored;
  const draftRaw =
    typeof localStorage !== "undefined" ? localStorage.getItem("sv_setup_draft_v1") : null;
  if (draftRaw) {
    try {
      const draft = JSON.parse(draftRaw) as { locale?: string };
      if (draft.locale && isAppLocale(draft.locale)) return draft.locale;
    } catch {
      /* ignore */
    }
  }
  const nav =
    typeof navigator !== "undefined"
      ? navigator.language || (navigator.languages && navigator.languages[0])
      : null;
  return mapDeviceLocaleToAppLocale(nav);
}

```

---

## FILE: src/i18n/index.ts

```typescript
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { detectInitialAppLocale, resolveAppLocale, type AppLocale } from "@/lib/locale";

import enCommon from "./locales/en/common.json";
import enDashboard from "./locales/en/dashboard.json";
import enOnboardingBase from "./locales/en/onboarding.json";
import enOnboardingReadAffirmations from "./locales/en/onboardingReadAffirmations.json";
import enSettings from "./locales/en/settings.json";
import enAuth from "./locales/en/auth.json";
import enPaywall from "./locales/en/paywall.json";
import enTools from "./locales/en/tools.json";
import enSupport from "./locales/en/support.json";
import enMarketingBase from "./locales/en/marketing.json";
import enMarketingManifestationQuiz from "./locales/en/marketingManifestationQuiz.json";
import enMarketingWhatIs from "./locales/en/marketingWhatIs.json";

import esCommon from "./locales/es-419/common.json";
import esDashboard from "./locales/es-419/dashboard.json";
import esOnboardingBase from "./locales/es-419/onboarding.json";
import esOnboardingReadAffirmations from "./locales/es-419/onboardingReadAffirmations.json";
import esSettings from "./locales/es-419/settings.json";
import esAuth from "./locales/es-419/auth.json";
import esPaywall from "./locales/es-419/paywall.json";
import esTools from "./locales/es-419/tools.json";
import esSupport from "./locales/es-419/support.json";
import esMarketingBase from "./locales/es-419/marketing.json";
import esMarketingManifestationQuiz from "./locales/es-419/marketingManifestationQuiz.json";
import esMarketingWhatIs from "./locales/es-419/marketingWhatIs.json";

import ptCommon from "./locales/pt-BR/common.json";
import ptDashboard from "./locales/pt-BR/dashboard.json";
import ptOnboardingBase from "./locales/pt-BR/onboarding.json";
import ptOnboardingReadAffirmations from "./locales/pt-BR/onboardingReadAffirmations.json";
import ptSettings from "./locales/pt-BR/settings.json";
import ptAuth from "./locales/pt-BR/auth.json";
import ptPaywall from "./locales/pt-BR/paywall.json";
import ptTools from "./locales/pt-BR/tools.json";
import ptSupport from "./locales/pt-BR/support.json";
import ptMarketingBase from "./locales/pt-BR/marketing.json";
import ptMarketingManifestationQuiz from "./locales/pt-BR/marketingManifestationQuiz.json";
import ptMarketingWhatIs from "./locales/pt-BR/marketingWhatIs.json";

import frMarketingBase from "./locales/fr/marketing.json";
import frMarketingManifestationQuiz from "./locales/fr/marketingManifestationQuiz.json";
import frMarketingWhatIs from "./locales/fr/marketingWhatIs.json";
import deMarketingBase from "./locales/de/marketing.json";
import deMarketingManifestationQuiz from "./locales/de/marketingManifestationQuiz.json";
import deMarketingWhatIs from "./locales/de/marketingWhatIs.json";
import itMarketingBase from "./locales/it/marketing.json";
import itMarketingManifestationQuiz from "./locales/it/marketingManifestationQuiz.json";
import itMarketingWhatIs from "./locales/it/marketingWhatIs.json";
import zhMarketingBase from "./locales/zh-Hans/marketing.json";
import zhMarketingManifestationQuiz from "./locales/zh-Hans/marketingManifestationQuiz.json";
import zhMarketingWhatIs from "./locales/zh-Hans/marketingWhatIs.json";
import nlMarketingBase from "./locales/nl/marketing.json";
import nlMarketingManifestationQuiz from "./locales/nl/marketingManifestationQuiz.json";
import nlMarketingWhatIs from "./locales/nl/marketingWhatIs.json";
import arMarketingBase from "./locales/ar/marketing.json";
import arMarketingManifestationQuiz from "./locales/ar/marketingManifestationQuiz.json";
import arMarketingWhatIs from "./locales/ar/marketingWhatIs.json";

const enOnboarding = {
  ...enOnboardingBase,
  setup: {
    ...enOnboardingBase.setup,
    readAffirmations: enOnboardingReadAffirmations,
  },
};
const esOnboarding = {
  ...esOnboardingBase,
  setup: {
    ...esOnboardingBase.setup,
    readAffirmations: esOnboardingReadAffirmations,
  },
};
const ptOnboarding = {
  ...ptOnboardingBase,
  setup: {
    ...ptOnboardingBase.setup,
    readAffirmations: ptOnboardingReadAffirmations,
  },
};

const enMarketing = {
  ...enMarketingBase,
  manifestationQuiz: enMarketingManifestationQuiz,
  whatIsPalettePlotting: enMarketingWhatIs,
};
const esMarketing = {
  ...esMarketingBase,
  manifestationQuiz: esMarketingManifestationQuiz,
  whatIsPalettePlotting: esMarketingWhatIs,
};
const ptMarketing = {
  ...ptMarketingBase,
  manifestationQuiz: ptMarketingManifestationQuiz,
  whatIsPalettePlotting: ptMarketingWhatIs,
};
const frMarketing = {
  ...frMarketingBase,
  manifestationQuiz: frMarketingManifestationQuiz,
  whatIsPalettePlotting: frMarketingWhatIs,
};
const deMarketing = {
  ...deMarketingBase,
  manifestationQuiz: deMarketingManifestationQuiz,
  whatIsPalettePlotting: deMarketingWhatIs,
};
const itMarketing = {
  ...itMarketingBase,
  manifestationQuiz: itMarketingManifestationQuiz,
  whatIsPalettePlotting: itMarketingWhatIs,
};
const zhMarketing = {
  ...zhMarketingBase,
  manifestationQuiz: zhMarketingManifestationQuiz,
  whatIsPalettePlotting: zhMarketingWhatIs,
};
const nlMarketing = {
  ...nlMarketingBase,
  manifestationQuiz: nlMarketingManifestationQuiz,
  whatIsPalettePlotting: nlMarketingWhatIs,
};
const arMarketing = {
  ...arMarketingBase,
  manifestationQuiz: arMarketingManifestationQuiz,
  whatIsPalettePlotting: arMarketingWhatIs,
};

const resources = {
  en: { common: enCommon, dashboard: enDashboard, onboarding: enOnboarding, settings: enSettings, auth: enAuth, paywall: enPaywall, tools: enTools, support: enSupport, marketing: enMarketing },
  "es-419": { common: esCommon, dashboard: esDashboard, onboarding: esOnboarding, settings: esSettings, auth: esAuth, paywall: esPaywall, tools: esTools, support: esSupport, marketing: esMarketing },
  "pt-BR": { common: ptCommon, dashboard: ptDashboard, onboarding: ptOnboarding, settings: ptSettings, auth: ptAuth, paywall: ptPaywall, tools: ptTools, support: ptSupport, marketing: ptMarketing },
  fr: { marketing: frMarketing },
  de: { marketing: deMarketing },
  it: { marketing: itMarketing },
  "zh-Hans": { marketing: zhMarketing },
  nl: { marketing: nlMarketing },
  ar: { marketing: arMarketing },
} as const;

void i18n.use(initReactI18next).init({
  resources,
  lng: detectInitialAppLocale(),
  supportedLngs: ["en", "es-419", "pt-BR", "fr", "de", "it", "zh-Hans", "nl", "ar"],
  nonExplicitSupportedLngs: false,
  fallbackLng: {
    "es-MX": ["es-419", "en"],
    "es-ES": ["es-419", "en"],
    es: ["es-419", "en"],
    pt: ["pt-BR", "en"],
    fr: ["en"],
    de: ["en"],
    it: ["en"],
    "zh-Hans": ["en"],
    nl: ["en"],
    ar: ["en"],
    default: ["en"],
  },
  defaultNS: "common",
  ns: ["common", "dashboard", "onboarding", "settings", "auth", "paywall", "tools", "support", "marketing"],
  interpolation: { escapeValue: false },
  react: { useSuspense: false, bindI18n: "languageChanged loaded" },
});

export async function setAppLocale(locale: AppLocale): Promise<void> {
  const active = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  if (active === locale) return;
  await i18n.changeLanguage(locale);
}

export default i18n;
```

---

## FILE: src/i18n/locales/en/paywall.json

```json
{
  "postPaywall": {
    "title": "Your path is ready",
    "buildingDashboard": "Building your dashboard…",
    "finishingSubtitle": "Almost there — finishing your dashboard.",
    "loadingStatusAria": "Loading status",
    "commitmentLabel": "Say this once, out loud:",
    "commitmentText": "I have named what I want, and I will not abandon it when doubt shows up. I commit to giving my desire my voice, my attention, and my follow-through. I will not wait to feel ready — I will act like the person who is already on this path. What I want deserves more than a passing thought; it deserves my full yes.",
    "simsLines": [
      "Making it official — membership locked in, overthinking not required.",
      "Writing affirmations from your setup — we actually used your answers.",
      "Giving your affirmations a voice — loop-friendly by design.",
      "Layering sound, whispers & theta into your starter track…",
      "Unlocking your dashboard — built from everything you shared, almost there."
    ],
    "toastActivateFailedIos": "Purchase completed, but we could not activate your plan yet. Try again from subscriptions.",
    "toastActivateFailedAndroid": "Purchase completed, but we could not activate your plan yet. Please try again.",
    "toastSetupSnag": "We hit a snag finishing setup. Taking you to the dashboard…"
  },
  "legacyIos": {
    "titleLine1": "Unlock your free trial",
    "titleLine2": "Start manifesting",
    "subtitle": "Choose a weekly plan to claim your free trial.",
    "loadingOptions": "Loading subscription options…",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "bestAnnualValue": "Best annual value",
    "onlyPerMonth": "Only {{amount}}/mo",
    "perWeek": "{{price}}/week",
    "perMonth": "{{price}}/month",
    "perYear": "{{price}}/year",
    "opening": "Opening…",
    "tryAgain": "Try again",
    "fallbackTitle": "We couldn't finish that step",
    "fallbackBody": "Tap Try again, or go back to sign up and tap Continue.",
    "terms": "Terms / EULA",
    "privacy": "Privacy",
    "restorePurchases": "Restore purchases",
    "restoring": "Restoring…",
    "restore": "Restore",
    "closeAria": "Close",
    "errorNotIosApp": "Subscriptions are only available in the iOS app.",
    "errorSignInAgain": "Sign in again, then open subscription.",
    "errorNoSession": "No active session. Sign out, sign in, then tap Continue.",
    "errorOpenFromSignup": "Open subscription from the app after sign up.",
    "errorSkippedDetail": "Use Continue on the sign-up screen, or open Account from Settings.",
    "errorGeneric": "Something went wrong.",
    "errorPersist": "Something went wrong. Copy debug log from Safari if this persists.",
    "restoreOnlyIos": "Restore is only available in the iOS app.",
    "restoredSuccess": "Subscription restored. Welcome back!",
    "restoreCancelled": "Restore cancelled.",
    "nothingToRestore": "Nothing to restore."
  },
  "legacyAndroid": {
    "title": "Unlock Your Manifestation Stack Today.",
    "subtitle": "Tap Continue to confirm your plan.",
    "opening": "Opening…",
    "tryAgain": "Try again",
    "fallbackTitle": "We couldn't finish that step",
    "fallbackBody": "Tap Try again, or go back to sign up and tap Continue.",
    "terms": "Terms / EULA",
    "privacy": "Privacy",
    "closeAria": "Close",
    "errorNotAndroidApp": "Subscriptions are only available in the Android app.",
    "errorSignInAgain": "Sign in again, then open subscription.",
    "errorNoSession": "No active session. Sign out, sign in, then tap Continue.",
    "errorOpenFromSignup": "Open subscription from the app after sign up.",
    "errorSkippedDetail": "Use Continue on the sign-up screen, or open Account from Settings.",
    "errorGeneric": "Something went wrong."
  },
  "flow": {
    "subscriptionAlreadyOpening": "Subscription is already opening — wait a few seconds, then try again.",
    "subscriptionScreenMayBeOpening": "A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen.",
    "openingSubscriptionsTimedOut": "Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again.",
    "paymentNotCompleted": "Payment was not completed.",
    "couldNotOpenSubscription": "Could not open subscription options.",
    "signInRequiredBeforeSubscribing": "Sign in is required before subscribing."
  },
  "webWrapper": {
    "checkoutFailed": "We could not open checkout.",
    "checkoutClosed": "Checkout closed. You can subscribe anytime.",
    "viewPlans": "View plans",
    "close": "Close",
    "notConfigured": "Web checkout is not configured yet. Please try again later.",
    "subscriptionNotCompleted": "Subscription not completed."
  },
  "emailCollection": {
    "title": "Let's Get Started",
    "emailLabel": "Email",
    "firstNameLabel": "First Name",
    "usernameLabel": "Username",
    "passwordLabel": "Password",
    "confirmLabel": "Confirm",
    "emailPlaceholder": "your@email.com",
    "firstNamePlaceholder": "First name",
    "usernamePlaceholder": "Username",
    "passwordPlaceholder": "8+ characters",
    "confirmPlaceholder": "Re-enter",
    "checkingEmail": "Checking availability...",
    "checkingUsername": "Checking...",
    "emailTaken": "This email is already registered. Please sign in instead.",
    "usernameTaken": "This username is already taken. Please choose another.",
    "passwordMinLength": "Password must be at least 8 characters.",
    "passwordMismatch": "Passwords do not match.",
    "passwordMismatchToast": "Passwords do not match",
    "invalidEmail": "Please enter a valid email address",
    "needUsername": "Please enter a username",
    "needPassword": "Please enter a password with at least 8 characters",
    "needFirstName": "Please enter your first name",
    "acceptTerms": "Please accept the Terms of Service and Privacy Policy",
    "verifyEmailBlocked": "Account created, but sign-in is blocked. Please verify your email, then sign in.",
    "subscriptionError": "Could not open subscription options. Try again in a moment.",
    "saveFailed": "Failed to save. Please try again.",
    "tryAgain": "Try again",
    "termsAcceptPrefix": "I accept the",
    "termsOfService": "Terms of Service",
    "termsAnd": "and",
    "privacyPolicy": "Privacy Policy",
    "appNotificationsConsent": "I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings → Notification preferences.",
    "emailMarketingConsent": "I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings.",
    "smsMarketingConsent": "I consent to SMS marketing communications (optional). Opt out in settings. Message and data rates may apply."
  },
  "errors": {
    "cancelled": "Cancelled",
    "paywallError": "Paywall error",
    "notPresented": "Not presented",
    "unknownResultDetail": "Unknown result: {{detail}}",
    "noApiKey": "No RevenueCat API key configured.",
    "notConfigured": "RevenueCat could not be configured.",
    "purchaseNotCompleted": "Purchase was not completed.",
    "billingUnavailable": "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.",
    "noOfferings": "No offerings in RevenueCat. Add a default offering and paywall in the dashboard.",
    "checkoutFailed": "Could not complete checkout.",
    "subscriptionNotCompleted": "Subscription was not completed.",
    "webNotConfigured": "RevenueCat Web is not configured (missing API key)."
  },
  "paymentProcessing": {
    "title": "Processing Payment",
    "subtitle": "Please wait while we confirm your payment. This usually takes a few seconds.",
    "missingInfo": "Missing payment information. Please restart onboarding.",
    "verificationSlow": "Payment verification is taking longer than expected. Please contact support.",
    "verificationFailed": "Unable to verify payment. Please contact support."
  }
}

```

---

## FILE: src/i18n/locales/es-419/paywall.json

```json
{
  "postPaywall": {
    "title": "Tu camino está listo",
    "buildingDashboard": "Construyendo tu panel…",
    "finishingSubtitle": "Casi listo — terminando tu panel.",
    "loadingStatusAria": "Carga",
    "commitmentLabel": "Di esto una vez, en voz alta:",
    "commitmentText": "He nombrado lo que quiero y no lo abandonaré cuando aparezca la duda. Me comprometo a darle a mi deseo mi voz, mi atención y mi constancia. No esperaré a sentir que ya es el momento — actuaré como la persona que ya está en este camino. Lo que quiero merece más que un pensamiento pasajero; merece mi sí completo.",
    "simsLines": [
      "Membresía confirmada — oficial.",
      "Creando afirmaciones con tus respuestas.",
      "Dando voz a tus afirmaciones.",
      "Mezclando sonido, susurros y theta…",
      "Desbloqueando tu panel…"
    ],
    "toastActivateFailedIos": "Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo desde suscripciones.",
    "toastActivateFailedAndroid": "Compra completada, pero no pudimos activar tu plan aún. Inténtalo de nuevo.",
    "toastSetupSnag": "Tuvimos un problema al terminar la configuración. Te llevamos al panel…"
  },
  "legacyIos": {
    "titleLine1": "Desbloquea tu prueba gratis",
    "titleLine2": "Empieza a manifestar",
    "subtitle": "Elige el plan semanal para empezar.",
    "loadingOptions": "Cargando opciones de suscripción…",
    "weekly": "Semanal",
    "monthly": "Mensual",
    "yearly": "Anual",
    "bestAnnualValue": "Mejor valor anual",
    "onlyPerMonth": "Solo {{amount}}/mes",
    "perWeek": "{{price}}/semana",
    "perMonth": "{{price}}/mes",
    "perYear": "{{price}}/año",
    "opening": "Abriendo…",
    "tryAgain": "Intentar de nuevo",
    "fallbackTitle": "No pudimos completar ese paso",
    "fallbackBody": "Toca Intentar de nuevo o vuelve y toca Continuar.",
    "terms": "Términos / EULA",
    "privacy": "Privacidad",
    "restorePurchases": "Restaurar compras",
    "restoring": "Restaurando…",
    "restore": "Restaurar",
    "closeAria": "Cerrar",
    "errorNotIosApp": "Suscripciones solo en la app iOS.",
    "errorSignInAgain": "Inicia sesión de nuevo y abre la suscripción.",
    "errorNoSession": "No hay sesión activa. Cierra sesión, inicia sesión y toca Continuar.",
    "errorOpenFromSignup": "Abre la suscripción en la app tras registrarte.",
    "errorSkippedDetail": "Usa Continuar en registro o Cuenta en Ajustes.",
    "errorGeneric": "Algo salió mal.",
    "errorPersist": "Algo salió mal. Copia el registro de depuración desde Safari si persiste.",
    "restoreOnlyIos": "Restaurar solo está disponible en la app de iOS.",
    "restoredSuccess": "Suscripción restaurada. ¡Bienvenido!",
    "restoreCancelled": "Restauración cancelada.",
    "nothingToRestore": "Nada que restaurar."
  },
  "legacyAndroid": {
    "title": "Desbloquea herramientas de manifestación.",
    "subtitle": "Toca Continuar para confirmar.",
    "opening": "Abriendo…",
    "tryAgain": "Intentar de nuevo",
    "fallbackTitle": "No pudimos completar ese paso",
    "fallbackBody": "Toca Intentar de nuevo o vuelve y toca Continuar.",
    "terms": "Términos / EULA",
    "privacy": "Privacidad",
    "closeAria": "Cerrar",
    "errorNotAndroidApp": "Suscripciones solo en la app Android.",
    "errorSignInAgain": "Inicia sesión de nuevo y abre la suscripción.",
    "errorNoSession": "No hay sesión activa. Cierra sesión, inicia sesión y toca Continuar.",
    "errorOpenFromSignup": "Abre la suscripción en la app tras registrarte.",
    "errorSkippedDetail": "Usa Continuar en la pantalla de registro o abre Cuenta desde Ajustes.",
    "errorGeneric": "Algo salió mal."
  },
  "flow": {
    "subscriptionAlreadyOpening": "La suscripción ya se está abriendo — espera unos segundos e inténtalo de nuevo.",
    "subscriptionScreenMayBeOpening": "La pantalla de suscripción puede estar abriéndose. Espera e inténtalo de nuevo.",
    "openingSubscriptionsTimedOut": "La suscripción tardó en abrir. Reinicia la app e inténtalo de nuevo.",
    "paymentNotCompleted": "El pago no se completó.",
    "couldNotOpenSubscription": "No se pudieron abrir las opciones de suscripción.",
    "signInRequiredBeforeSubscribing": "Debes iniciar sesión antes de suscribirte."
  },
  "webWrapper": {
    "checkoutFailed": "No pudimos abrir el pago.",
    "checkoutClosed": "Pago cerrado. Suscríbete cuando quieras.",
    "viewPlans": "Ver planes",
    "close": "Cerrar",
    "notConfigured": "Pago web no disponible. Inténtalo más tarde.",
    "subscriptionNotCompleted": "Suscripción no completada."
  },
  "emailCollection": {
    "title": "Empecemos",
    "emailLabel": "Correo",
    "firstNameLabel": "Nombre",
    "usernameLabel": "Usuario",
    "passwordLabel": "Contraseña",
    "confirmLabel": "Confirmar",
    "emailPlaceholder": "tu@correo.com",
    "firstNamePlaceholder": "Nombre",
    "usernamePlaceholder": "Usuario",
    "passwordPlaceholder": "8+ caracteres",
    "confirmPlaceholder": "Repetir",
    "checkingEmail": "Comprobando disponibilidad...",
    "checkingUsername": "Comprobando...",
    "emailTaken": "Este correo ya está registrado. Inicia sesión en su lugar.",
    "usernameTaken": "Este usuario ya está en uso. Elige otro.",
    "passwordMinLength": "La contraseña debe tener al menos 8 caracteres.",
    "passwordMismatch": "Las contraseñas no coinciden.",
    "passwordMismatchToast": "Las contraseñas no coinciden",
    "invalidEmail": "Ingresa un correo válido",
    "needUsername": "Ingresa un nombre de usuario",
    "needPassword": "Ingresa una contraseña de al menos 8 caracteres",
    "needFirstName": "Ingresa tu nombre",
    "acceptTerms": "Acepta los Términos de servicio y la Política de privacidad",
    "verifyEmailBlocked": "Cuenta creada, pero el inicio de sesión está bloqueado. Verifica tu correo e inicia sesión.",
    "subscriptionError": "No pudimos abrir las opciones de suscripción. Inténtalo en un momento.",
    "saveFailed": "No se pudo guardar. Inténtalo de nuevo.",
    "tryAgain": "Intentar de nuevo",
    "termsAcceptPrefix": "Acepto los",
    "termsOfService": "Términos de servicio",
    "termsAnd": "y la",
    "privacyPolicy": "Privacidad",
    "appNotificationsConsent": "Acepto notificaciones de la app (opcional). Cancela en Ajustes.",
    "emailMarketingConsent": "Acepto marketing por correo (opcional). Cancela en ajustes.",
    "smsMarketingConsent": "Acepto marketing por SMS (opcional). Cancela en ajustes."
  },
  "errors": {
    "cancelled": "Cancelado",
    "paywallError": "Error de paywall",
    "notPresented": "No se mostró",
    "unknownResultDetail": "Resultado desconocido: {{detail}}",
    "noApiKey": "No hay clave API de RevenueCat configurada.",
    "notConfigured": "RevenueCat no se pudo configurar.",
    "purchaseNotCompleted": "La compra no se completó.",
    "billingUnavailable": "Facturación no disponible; la UI de paywall de RevenueCat no se usa en esta versión de iOS.",
    "noOfferings": "No hay ofertas en RevenueCat. Agrega una oferta predeterminada y paywall en el panel.",
    "checkoutFailed": "No se pudo completar el pago.",
    "subscriptionNotCompleted": "La suscripción no se completó.",
    "webNotConfigured": "RevenueCat Web no está configurado (falta la clave API)."
  },
  "paymentProcessing": {
    "title": "Procesando pago",
    "subtitle": "Espera mientras confirmamos tu pago. Esto suele tardar unos segundos.",
    "missingInfo": "Falta información de pago. Reinicia el onboarding.",
    "verificationSlow": "La verificación del pago está tardando más de lo esperado. Contacta a soporte.",
    "verificationFailed": "No se pudo verificar el pago. Contacta a soporte."
  }
}

```

---

## FILE: src/i18n/locales/pt-BR/paywall.json

```json
{
  "postPaywall": {
    "title": "Seu caminho está pronto",
    "buildingDashboard": "Montando seu painel…",
    "finishingSubtitle": "Quase lá — finalizando painel.",
    "loadingStatusAria": "Carregamento",
    "commitmentLabel": "Diga isto uma vez, em voz alta:",
    "commitmentText": "Eu nomeei o que quero e não vou abandonar isso quando a dúvida aparecer. Eu me comprometo a dar ao meu desejo minha voz, minha atenção e minha constância. Não vou esperar sentir que chegou a hora — vou agir como a pessoa que já está neste caminho. O que eu quero merece mais que um pensamento passageiro; merece meu sim completo.",
    "simsLines": [
      "Assinatura confirmada — oficial.",
      "Criando afirmações com suas respostas.",
      "Dando voz às suas afirmações.",
      "Misturando som, sussurros e theta…",
      "Desbloqueando seu painel…"
    ],
    "toastActivateFailedIos": "Compra concluída, mas não conseguimos ativar seu plano ainda. Tente novamente em assinaturas.",
    "toastActivateFailedAndroid": "Compra concluída, mas não conseguimos ativar seu plano ainda. Tente novamente.",
    "toastSetupSnag": "Tivemos um problema ao finalizar a configuração. Indo para o painel…"
  },
  "legacyIos": {
    "titleLine1": "Desbloqueie o teste grátis",
    "titleLine2": "Comece a manifestar",
    "subtitle": "Escolha o plano semanal para começar.",
    "loadingOptions": "Carregando opções de assinatura…",
    "weekly": "Semanal",
    "monthly": "Mensal",
    "yearly": "Anual",
    "bestAnnualValue": "Melhor valor anual",
    "onlyPerMonth": "Apenas {{amount}}/mês",
    "perWeek": "{{price}}/semana",
    "perMonth": "{{price}}/mês",
    "perYear": "{{price}}/ano",
    "opening": "Abrindo…",
    "tryAgain": "Tentar de novo",
    "fallbackTitle": "Não conseguimos concluir essa etapa",
    "fallbackBody": "Toque em Tentar de novo ou volte e toque em Continuar.",
    "terms": "Termos / EULA",
    "privacy": "Privacidade",
    "restorePurchases": "Restaurar compras",
    "restoring": "Restaurando…",
    "restore": "Restaurar",
    "closeAria": "Fechar",
    "errorNotIosApp": "Assinaturas só no app iOS.",
    "errorSignInAgain": "Entre novamente e abra a assinatura.",
    "errorNoSession": "Nenhuma sessão ativa. Saia, entre novamente e toque em Continuar.",
    "errorOpenFromSignup": "Abra a assinatura no app após cadastro.",
    "errorSkippedDetail": "Use Continuar no cadastro ou Conta em Ajustes.",
    "errorGeneric": "Algo deu errado.",
    "errorPersist": "Algo deu errado. Copie o log de depuração do Safari se persistir.",
    "restoreOnlyIos": "Restaurar está disponível apenas no app iOS.",
    "restoredSuccess": "Assinatura restaurada. Bem-vindo!",
    "restoreCancelled": "Restauração cancelada.",
    "nothingToRestore": "Nada para restaurar."
  },
  "legacyAndroid": {
    "title": "Desbloqueie ferramentas de manifestação.",
    "subtitle": "Toque em Continuar para confirmar.",
    "opening": "Abrindo…",
    "tryAgain": "Tentar de novo",
    "fallbackTitle": "Não conseguimos concluir essa etapa",
    "fallbackBody": "Toque em Tentar de novo ou volte e toque em Continuar.",
    "terms": "Termos / EULA",
    "privacy": "Privacidade",
    "closeAria": "Fechar",
    "errorNotAndroidApp": "Assinaturas só no app Android.",
    "errorSignInAgain": "Entre novamente e abra a assinatura.",
    "errorNoSession": "Nenhuma sessão ativa. Saia, entre novamente e toque em Continuar.",
    "errorOpenFromSignup": "Abra a assinatura no app após cadastro.",
    "errorSkippedDetail": "Use Continuar na tela de cadastro ou abra Conta em Configurações.",
    "errorGeneric": "Algo deu errado."
  },
  "flow": {
    "subscriptionAlreadyOpening": "A assinatura já está abrindo — aguarde alguns segundos e tente novamente.",
    "subscriptionScreenMayBeOpening": "A tela de assinatura pode estar abrindo. Aguarde e tente de novo.",
    "openingSubscriptionsTimedOut": "A assinatura demorou para abrir. Reinicie a app e tente de novo.",
    "paymentNotCompleted": "O pagamento não foi concluído.",
    "couldNotOpenSubscription": "Não foi possível abrir as opções de assinatura.",
    "signInRequiredBeforeSubscribing": "É necessário entrar antes de assinar."
  },
  "webWrapper": {
    "checkoutFailed": "Não foi possível abrir o pagamento.",
    "checkoutClosed": "Pagamento cancelado. Assine quando quiser.",
    "viewPlans": "Ver planos",
    "close": "Fechar",
    "notConfigured": "Pagamento web indisponível. Tente mais tarde.",
    "subscriptionNotCompleted": "Assinatura não concluída."
  },
  "emailCollection": {
    "title": "Vamos começar",
    "emailLabel": "E-mail",
    "firstNameLabel": "Nome",
    "usernameLabel": "Usuário",
    "passwordLabel": "Senha",
    "confirmLabel": "Confirmar",
    "emailPlaceholder": "seu@email.com",
    "firstNamePlaceholder": "Nome",
    "usernamePlaceholder": "Usuário",
    "passwordPlaceholder": "8+ caracteres",
    "confirmPlaceholder": "Digite novamente",
    "checkingEmail": "Verificando disponibilidade...",
    "checkingUsername": "Verificando...",
    "emailTaken": "Este e-mail já está cadastrado. Entre em vez disso.",
    "usernameTaken": "Este usuário já está em uso. Escolha outro.",
    "passwordMinLength": "A senha deve ter pelo menos 8 caracteres.",
    "passwordMismatch": "As senhas não coincidem.",
    "passwordMismatchToast": "As senhas não coincidem",
    "invalidEmail": "Digite um e-mail válido",
    "needUsername": "Digite um nome de usuário",
    "needPassword": "Digite uma senha com pelo menos 8 caracteres",
    "needFirstName": "Digite seu nome",
    "acceptTerms": "Aceite os Termos de serviço e a Política de privacidade",
    "verifyEmailBlocked": "Conta criada, mas o login está bloqueado. Verifique seu e-mail e entre.",
    "subscriptionError": "Não foi possível abrir as opções de assinatura. Tente novamente em instantes.",
    "saveFailed": "Falha ao salvar. Tente novamente.",
    "tryAgain": "Tentar novamente",
    "termsAcceptPrefix": "Aceito os",
    "termsOfService": "Termos de serviço",
    "termsAnd": "e a",
    "privacyPolicy": "Privacidade",
    "appNotificationsConsent": "Aceito notificações do app (opcional). Cancele em Configurações.",
    "emailMarketingConsent": "Aceito marketing por e-mail (opcional). Cancele nas configurações.",
    "smsMarketingConsent": "Aceito marketing por SMS (opcional). Cancele nas configurações."
  },
  "errors": {
    "cancelled": "Cancelado",
    "paywallError": "Erro no paywall",
    "notPresented": "Não exibido",
    "unknownResultDetail": "Resultado desconhecido: {{detail}}",
    "noApiKey": "Nenhuma chave API do RevenueCat configurada.",
    "notConfigured": "O RevenueCat não pôde ser configurado.",
    "purchaseNotCompleted": "A compra não foi concluída.",
    "billingUnavailable": "Cobrança indisponível; a UI de paywall do RevenueCat não é usada nesta versão do iOS.",
    "noOfferings": "Nenhuma oferta no RevenueCat. Adicione uma oferta padrão e paywall no painel.",
    "checkoutFailed": "Não foi possível concluir o pagamento.",
    "subscriptionNotCompleted": "A assinatura não foi concluída.",
    "webNotConfigured": "RevenueCat Web não está configurado (chave API ausente)."
  },
  "paymentProcessing": {
    "title": "Processando pagamento",
    "subtitle": "Aguarde enquanto confirmamos seu pagamento. Isso geralmente leva alguns segundos.",
    "missingInfo": "Informações de pagamento ausentes. Reinicie o onboarding.",
    "verificationSlow": "A verificação do pagamento está demorando mais do que o esperado. Entre em contato com o suporte.",
    "verificationFailed": "Não foi possível verificar o pagamento. Entre em contato com o suporte."
  }
}

```

---

## FILE: src/contexts/AuthContext.tsx

```tsx
import { createContext, useContext, useEffect, useRef, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { unregisterPushNotifications } from "@/services/pushNotifications";
import {
  oneSignalLogin,
  oneSignalLogout,
  readDeviceTimeZone,
  syncManifestationRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";
import {
  bootstrapRevenueCat,
  hasRevenueCatEntitlement,
  refreshAppleRevenueCatPlanOnServer,
} from "@/services/revenueCat";
import { bootstrapRevenueCatWeb, isRevenueCatWebConfigured } from "@/services/revenueCatWeb";
import { syncRevenueCatAttributionAttributes } from "@/services/revenueCatAttribution";
import { Capacitor } from "@capacitor/core";
import {
  detectInitialAppLocale,
  isAppLocale,
  readStoredPreferredLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { syncRevenueCatUILocale } from "@/services/revenueCat";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/** (6) Stagger native IAP work after first paint (ms). */
const NATIVE_RC_BOOTSTRAP_MS = 450;
const NATIVE_RC_ENTITLEMENT_MS = 600;
/** Apple/RevenueCat–billed users: refresh user_plans from RC API (web + native). */
const APPLE_RC_SERVER_SYNC_MS = 750;
const RC_ATTRIBUTION_SYNC_MS = 900;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const maxRetries = 3;
    
    // (3) Safety timeout — if auth check takes too long, stop loading anyway (NativeSplashGate
    // can still hold the native layer longer; backup splash tear-down is ~8s).
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth check timeout - stopping loading state");
        setIsLoading(false);
      }
    }, 3000); // 3 second max for auth check (longer for PWA)


    // Function to get session with retry logic (for PWA standalone mode)
    const getSessionWithRetry = async (attempt: number = 0): Promise<void> => {
      if (!isMounted) return;

      try {
        // Check if localStorage is available (can be an issue in some PWA contexts)
        if (typeof window !== 'undefined' && !window.localStorage) {
          console.warn("localStorage not available, proceeding without session");
          if (isMounted) {
            setIsLoading(false);
            clearTimeout(safetyTimeout);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error("Error getting session:", error);
          // Retry if we haven't exceeded max retries
          if (attempt < maxRetries) {
            setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
            return;
          }
          // After max retries, stop loading anyway
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error("Error getting session (catch):", error);
        if (!isMounted) return;
        
        // Retry if we haven't exceeded max retries
        if (attempt < maxRetries) {
          setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
          return;
        }
        
        // After max retries, stop loading anyway
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    // Get initial session with retry logic
    getSessionWithRetry();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const localeHydratedForUserRef = useRef<string | null>(null);

  // Logged-in users: account locale wins; hydrate once per session (not on every Settings change).
  useEffect(() => {
    if (!user?.id) {
      localeHydratedForUserRef.current = null;
      return;
    }
    if (localeHydratedForUserRef.current === user.id) return;
    localeHydratedForUserRef.current = user.id;

    void (async () => {
      const { data: prefs } = await supabase
        .from("user_preferences")
        .select("preferred_locale")
        .eq("user_id", user.id)
        .maybeSingle();
      const fromPrefs = prefs?.preferred_locale;
      if (fromPrefs && isAppLocale(fromPrefs)) {
        writeStoredPreferredLocale(fromPrefs);
        await setAppLocale(fromPrefs);
        await syncRevenueCatUILocale();
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("preferred_locale")
        .eq("id", user.id)
        .maybeSingle();
      const fromProfile = profile?.preferred_locale;
      if (fromProfile && isAppLocale(fromProfile)) {
        writeStoredPreferredLocale(fromProfile);
        await setAppLocale(fromProfile);
        await syncRevenueCatUILocale();
        return;
      }

      const stored = readStoredPreferredLocale();
      if (stored) {
        await setAppLocale(stored);
        await Promise.all([
          supabase.from("user_preferences").upsert(
            { user_id: user.id, preferred_locale: stored },
            { onConflict: "user_id" },
          ),
          supabase.from("profiles").upsert(
            { id: user.id, preferred_locale: stored },
            { onConflict: "id" },
          ),
        ]);
        await syncRevenueCatUILocale();
      }
    })();
  }, [user?.id]);

  // Initialize push notifications when user logs in (native app only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip on web/PWA
    }

    if (user?.id) {
      // Tie OneSignal user identity to Supabase UUID and refresh routine notification tags.
      void oneSignalLogin(user.id)
        .then(async () => {
          const [prefsRes, profileRes] = await Promise.all([
            (supabase as any)
              .from("user_preferences")
              .select(
                "manifestation_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("user_id", user.id)
              .maybeSingle(),
            (supabase as any)
              .from("profiles")
              .select(
                "manifestation_intensity, app_notifications_enabled, notification_permission_status, routine_notification_times, timezone, preferred_locale",
              )
              .eq("id", user.id)
              .maybeSingle(),
          ]);

          const prefs = prefsRes.data as {
            manifestation_intensity?: string | null;
            app_notifications_enabled?: boolean | null;
            notification_permission_status?: string | null;
            routine_notification_times?: unknown;
            timezone?: string | null;
            preferred_locale?: string | null;
          } | null;
          const profile = profileRes.data as typeof prefs;

          const notificationsEnabled =
            prefs?.app_notifications_enabled ?? profile?.app_notifications_enabled ?? false;
          if (!notificationsEnabled) return;

          const intensityRaw = prefs?.manifestation_intensity ?? profile?.manifestation_intensity;
          const intensity =
            intensityRaw === "light" || intensityRaw === "consistent" || intensityRaw === "locked_in"
              ? intensityRaw
              : "consistent";

          const timesRaw = prefs?.routine_notification_times ?? profile?.routine_notification_times;
          const alertTimes = Array.isArray(timesRaw)
            ? timesRaw.filter((t: unknown): t is string => typeof t === "string")
            : [];

          const permissionRaw =
            prefs?.notification_permission_status ?? profile?.notification_permission_status;

          const storedTz = prefs?.timezone ?? profile?.timezone;
          const timezone =
            typeof storedTz === "string" && storedTz.trim() ? storedTz.trim() : readDeviceTimeZone();

          const localeRaw = prefs?.preferred_locale ?? profile?.preferred_locale;
          const preferredLocale: AppLocale | undefined =
            localeRaw && isAppLocale(localeRaw) ? localeRaw : detectInitialAppLocale();

          await syncOneSignalUserLanguage(preferredLocale);

          await syncManifestationRoutineOneSignalTags({
            intensity,
            notificationsEnabled: true,
            permissionStatus:
              permissionRaw === "granted" || permissionRaw === "denied" || permissionRaw === "skipped"
                ? permissionRaw
                : "skipped",
            alertTimes,
            timezone,
            preferredLocale,
          });
        })
        .catch((error) => {
          console.error("[AuthContext] Failed to OneSignal.login or tag sync:", error);
        });
      return;
    }

    if (!user && !isLoading) {
      // User logged out - unregister push notifications
      oneSignalLogout().catch((error) => {
        console.error("[AuthContext] Failed to OneSignal.logout:", error);
      });
      unregisterPushNotifications().catch((error) => {
        console.error('[AuthContext] Failed to unregister push notifications:', error);
      });
    }
  }, [user, isLoading]);

  // (6) RevenueCat: native Capacitor SDK; web purchases-js (same app user id = Supabase UUID).
  useEffect(() => {
    if (isLoading) return;

    const id = window.setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        void bootstrapRevenueCat(user?.id ?? null);
      } else if (isRevenueCatWebConfigured()) {
        void bootstrapRevenueCatWeb(user?.id ?? null);
      }
    }, NATIVE_RC_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      const checkEntitlement = async () => {
        const hasPro = await hasRevenueCatEntitlement("Palette Plotting Pro");
        if (cancelled) return;
        if (hasPro) {
          console.info("[RevenueCat] Active entitlement found: Palette Plotting Pro");
        }
      };
      void checkEntitlement();
    }, NATIVE_RC_ENTITLEMENT_MS);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [user?.id, isLoading]);

  // RevenueCat customer attributes: first/last-touch + safe onboarding fields.
  useEffect(() => {
    if (!user || isLoading) return;

    let sessionId: string | null = null;
    try {
      const raw = localStorage.getItem("onboarding_session");
      if (raw) {
        const parsed = JSON.parse(raw) as { sessionId?: string };
        if (parsed?.sessionId) sessionId = parsed.sessionId;
      }
    } catch {
      /* ignore */
    }

    const id = window.setTimeout(() => {
      void syncRevenueCatAttributionAttributes(user.id, sessionId);
    }, RC_ATTRIBUTION_SYNC_MS);
    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  // Apple / RevenueCat–billed accounts: keep user_plans (e.g. current_period_end) in sync via RC REST API.
  // Runs on web/PWA and native; gates on user_plans inside the helper (not Capacitor).
  useEffect(() => {
    if (!user || isLoading) return;

    const id = window.setTimeout(() => {
      void refreshAppleRevenueCatPlanOnServer("session_start");
    }, APPLE_RC_SERVER_SYNC_MS);

    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void refreshAppleRevenueCatPlanOnServer("background");
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user?.id, isLoading]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## FILE: src/App.tsx

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppearancePreferenceSync } from "@/components/AppearancePreferenceSync";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));
import Settings from "./pages/Settings";
import ManifestationRoutineSettings from "./pages/ManifestationRoutineSettings";
import SubliminalAudio from "./pages/features/SubliminalAudio";
import Affirmations from "./pages/features/Affirmations";
import AffirmationVisualizerV2 from "./pages/features/AffirmationVisualizerV2";
import MirrorRehearsalRoute from "./pages/features/MirrorRehearsalRoute";
import YourDouble from "./pages/features/YourDouble";
import ChooseDouble from "./pages/features/ChooseDouble";
import Chat from "./pages/features/Chat";
import ActivityTracking from "./pages/features/ActivityTracking";
import Chrono from "./pages/features/Chrono";
import Refactor from "./pages/features/Refactor";
import MusicComposer from "./pages/features/MusicComposer";
import Freeplay from "./pages/features/Freeplay";
import YourJourney from "./pages/features/YourJourney";
import ReportAppIssue from "./pages/ReportAppIssue";
import AdminSupportInbox from "./pages/admin/AdminSupportInbox";
import ThreeActs from "./pages/onboarding/ThreeActs";
import CustomAffirmations from "./pages/onboarding/CustomAffirmations";
import DigitalMirror from "./pages/onboarding/DigitalMirror";
import SubliminalMaker from "./pages/onboarding/SubliminalMaker";
import ManifestationTools from "./pages/onboarding/ManifestationTools";
import HabitTracking from "./pages/onboarding/HabitTracking";
import Double from "./pages/onboarding/Double";
import EmailCollection from "./pages/onboarding/EmailCollection";
import OnboardingQuestions from "./pages/onboarding/OnboardingQuestions";
import IOSPaywall from "./pages/onboarding/IOSPaywall";
import AndroidPaywall from "./pages/onboarding/AndroidPaywall";
import WebPaywall from "./pages/onboarding/WebPaywall";
import AndroidPostPaywallLoading from "./pages/onboarding/AndroidPostPaywallLoading";
import PostPaywallLoading from "./pages/onboarding/PostPaywallLoading";
import {
  SetupCurrentFriction,
  SetupAffirmationRead,
  SetupEmbodyDailyIdentity,
  SetupBeginJourney,
  SetupConditionalSpecificity,
  SetupDesireCategory,
  SetupEmail,
  SetupGuide,
  SetupName,
  SetupNotificationPrePermission,
  SetupManifestationIntensity,
  SetupPlotLoading,
  SetupPlotSynthesis,
  SetupToolPreference,
} from "./pages/onboarding/setup";
import Activate from "./pages/Activate";
import PaymentProcessing from "./pages/PaymentProcessing";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import FAQ from "./pages/FAQ";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AcceptableUsePolicy from "./pages/AcceptableUsePolicy";
import DMCA from "./pages/DMCA";
import BillingRefundPolicy from "./pages/BillingRefundPolicy";
import PricingPlans from "./pages/PricingPlans";
import GetAppStore from "./pages/GetAppStore";
import GetMobileApp from "./pages/GetMobileApp";
import GetNewsletter from "./pages/GetNewsletter";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import WhatIsPalettePlotting from "./pages/WhatIsPalettePlotting";
import ManifestHelp from "./pages/ManifestHelp";
import ManifestationQuiz from "./pages/ManifestationQuiz";
import Contact from "./pages/Contact";
import Community from "./pages/Community";
import Unsubscribe from "./pages/Unsubscribe";
import { MannyDiscordRedirect } from "./pages/MannyDiscordRedirect";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WebGetAppAfterPurchaseDialog } from "@/components/WebGetAppAfterPurchaseDialog";
import { NativeAppRootRedirect, NativeSplashGate } from "@/components/NativeAppRootRedirect";
import { debugLog } from "@/debugLog";
import { AttributionCapture } from "@/components/AttributionCapture";
import { MarketingLocaleProvider } from "@/contexts/MarketingLocaleContext";
import { LEGAL_ROUTE_LOCALES } from "@/lib/locale";

const queryClient = new QueryClient();
const DashboardLayout = () => <Outlet />;

/** Web: RevenueCat web paywall. Native: platform paywall. */
const WebResubscribeRedirect = () => <Navigate to="/onboarding/web-paywall" replace />;

/** Use render-time check so we don't rely on Capacitor being ready at module load. */
const IsNativePaywallOr = ({ FallbackComponent }: { FallbackComponent: React.ComponentType }) => {
  if (isIosPaywallContext()) return <IOSPaywall />;
  if (isAndroidPaywallContext()) return <AndroidPaywall />;
  return <FallbackComponent />;
};

/** Legacy URL — native paywalls; web uses RevenueCat web paywall. */
const LegacyOnboardingPricingRedirect = () => {
  if (isIosPaywallContext()) return <Navigate to="/onboarding/ios-paywall" replace />;
  if (isAndroidPaywallContext()) return <Navigate to="/onboarding/android-paywall" replace />;
  return <Navigate to="/onboarding/web-paywall" replace />;
};

// #region agent log
(() => { debugLog({ location: "App.tsx:route-config", message: "App route config", data: { isIosPaywallContext: isIosPaywallContext(), platform: Capacitor.getPlatform(), isNative: Capacitor.isNativePlatform() }, hypothesisId: "H1" }); })();
// #endregion
const LegacyAffirmationViewerRedirect = () => {
  const { setId } = useParams();
  return (
    <Navigate
      to={setId ? `/dashboard/affirmation-viewer/${setId}` : "/dashboard/affirmations-builder"}
      replace
    />
  );
};

const App = () => (
  <ThemeProvider>
    <AttributionCapture />
    <AuthProvider>
      <AppearancePreferenceSync />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MarketingLocaleProvider>
            <NativeSplashGate />
            <ScrollToTop />
            <WebGetAppAfterPurchaseDialog />
            <Routes>
              <Route path="/" element={<NativeAppRootRedirect />} />
              <Route path="/demo" element={<Navigate to="/" replace />} />
              <Route path="/demo-access" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/community" element={<Community />} />
              <Route path="/manny" element={<MannyDiscordRedirect />} />
              <Route path="/newsletter" element={<GetNewsletter />} />
              <Route path="/resubscribe" element={<IsNativePaywallOr FallbackComponent={WebResubscribeRedirect} />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/payment-processing" element={<PaymentProcessing />} />
              <Route path="/activate" element={<Activate />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Onboarding Flow */}
              <Route
                path="/onboarding/welcome"
                element={
                  <Suspense fallback={null}>
                    <Welcome />
                  </Suspense>
                }
              />
              <Route path="/onboarding/four-steps" element={<ThreeActs />} />
              <Route path="/onboarding/custom-affirmations" element={<CustomAffirmations />} />
              <Route path="/onboarding/digital-mirror" element={<DigitalMirror />} />
              <Route path="/onboarding/subliminal-maker" element={<SubliminalMaker />} />
              <Route path="/onboarding/manifestation-tools" element={<ManifestationTools />} />
              <Route path="/onboarding/habit-tracking" element={<HabitTracking />} />
              <Route path="/onboarding/email" element={<EmailCollection />} />
              <Route path="/onboarding/double" element={<Double />} />
              <Route path="/onboarding/questions" element={<OnboardingQuestions />} />

              <Route path="/onboarding/ios-paywall" element={<IOSPaywall />} />
              <Route path="/onboarding/android-paywall" element={<AndroidPaywall />} />
              <Route path="/onboarding/web-paywall" element={<WebPaywall />} />
              <Route path="/onboarding/android-post-paywall" element={<AndroidPostPaywallLoading />} />
              <Route path="/onboarding/post-paywall" element={<PostPaywallLoading />} />
              <Route path="/onboarding/pricing" element={<LegacyOnboardingPricingRedirect />} />

              {/* Personalized setup flow (web + native) */}
              <Route path="/onboarding/setup/name" element={<SetupName />} />
              <Route path="/onboarding/setup/desire-category" element={<SetupDesireCategory />} />
              <Route
                path="/onboarding/setup/why-it-matters"
                element={<Navigate to="/onboarding/setup/current-friction" replace />}
              />
              <Route path="/onboarding/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/setup/affirmations" element={<SetupAffirmationRead />} />
              <Route path="/onboarding/setup/embody-daily" element={<SetupEmbodyDailyIdentity />} />
              <Route path="/onboarding/setup/begin-journey" element={<SetupBeginJourney />} />
              <Route path="/onboarding/setup/conditional-specificity" element={<SetupConditionalSpecificity />} />
              <Route path="/onboarding/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/setup/guide" element={<SetupGuide />} />
              <Route path="/onboarding/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/setup/manifestation-intensity" element={<SetupManifestationIntensity />} />
              <Route path="/onboarding/setup/tool-preference" element={<SetupToolPreference />} />
              <Route path="/onboarding/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/setup/plot-synthesis" element={<SetupPlotSynthesis />} />

              {/* Suite web funnel (comprehensive-app ads) — same screens, /onboarding/suite paths */}
              <Route
                path="/onboarding/suite/welcome"
                element={
                  <Suspense fallback={null}>
                    <Welcome />
                  </Suspense>
                }
              />
              <Route path="/onboarding/suite/setup/name" element={<SetupName />} />
              <Route path="/onboarding/suite/setup/desire-category" element={<SetupDesireCategory />} />
              <Route
                path="/onboarding/suite/setup/why-it-matters"
                element={<Navigate to="/onboarding/suite/setup/current-friction" replace />}
              />
              <Route path="/onboarding/suite/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/suite/setup/affirmations" element={<SetupAffirmationRead />} />
              <Route path="/onboarding/suite/setup/embody-daily" element={<SetupEmbodyDailyIdentity />} />
              <Route path="/onboarding/suite/setup/begin-journey" element={<SetupBeginJourney />} />
              <Route path="/onboarding/suite/setup/conditional-specificity" element={<SetupConditionalSpecificity />} />
              <Route path="/onboarding/suite/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/suite/setup/guide" element={<SetupGuide />} />
              <Route path="/onboarding/suite/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/suite/setup/manifestation-intensity" element={<SetupManifestationIntensity />} />
              <Route path="/onboarding/suite/setup/tool-preference" element={<SetupToolPreference />} />
              <Route path="/onboarding/suite/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/suite/setup/plot-synthesis" element={<SetupPlotSynthesis />} />

              {/* Subliminal web funnel — redirect all traffic to homepage (keep query string) */}
              <Route
                path="/onboarding/subliminal/*"
                element={
                  <Navigate to={{ pathname: "/", search: window.location.search }} replace />
                }
              />

              {/* Protected + Nested Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="design" element={<Navigate to="/dashboard" replace />} />
                <Route path="assemble" element={<Navigate to="/dashboard/subliminal" replace />} />
                <Route path="review" element={<Navigate to="/dashboard" replace />} />
                <Route path="experience" element={<Navigate to="/dashboard" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/manifestation-routine" element={<ManifestationRoutineSettings />} />
                <Route path="report-issue" element={<ReportAppIssue />} />
                <Route path="admin/support" element={<AdminSupportInbox />} />
                <Route path="your-journey/chat" element={<Chat />} />
                <Route path="your-journey" element={<YourJourney />} />
                <Route path="chat" element={<Navigate to="/dashboard/your-journey/chat" replace />} />
                <Route path="mirror" element={<MirrorRehearsalRoute />} />
                <Route path="mind-the-mirror" element={<MirrorRehearsalRoute />} />
                <Route path="subliminal" element={<SubliminalAudio />} />
                <Route path="affirmations-builder" element={<Affirmations />} />
                <Route path="affirmation-viewer/:setId" element={<AffirmationVisualizerV2 />} />
                <Route path="timeline" element={<Chrono />} />
                <Route path="activity-tracking" element={<ActivityTracking />} />
                <Route path="double" element={<YourDouble />} />
                <Route path="choose-double" element={<ChooseDouble />} />
                <Route path="refactor" element={<Refactor />} />
                <Route path="chrono" element={<Chrono />} />
                <Route path="get-app" element={<GetAppStore />} />
                <Route path="download-a2h2" element={<Navigate to="/dashboard/get-app" replace />} />
                <Route path="music-composer" element={<MusicComposer />} />
                <Route path="tap-in" element={<Freeplay />} />
                <Route path="freeplay" element={<Navigate to="/dashboard/tap-in" replace />} />
              </Route>

              {/* Legacy redirects to nested dashboard paths */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
              <Route path="/chat" element={<Navigate to="/dashboard/your-journey/chat" replace />} />
              <Route path="/feature/mirror" element={<Navigate to="/dashboard/mirror" replace />} />
              <Route path="/feature/mind-the-mirror" element={<Navigate to="/dashboard/mind-the-mirror" replace />} />
              <Route path="/feature/subliminal" element={<Navigate to="/dashboard/subliminal" replace />} />
              <Route path="/feature/affirmations-builder" element={<Navigate to="/dashboard/affirmations-builder" replace />} />
              <Route path="/feature/affirmation-viewer/:setId" element={<LegacyAffirmationViewerRedirect />} />
              <Route path="/your-timeline" element={<Navigate to="/dashboard/timeline" replace />} />
              <Route path="/activity-tracking" element={<Navigate to="/dashboard/activity-tracking" replace />} />
              <Route path="/feature/chrono" element={<Navigate to="/dashboard/chrono" replace />} />
              <Route path="/feature/refactor" element={<Navigate to="/dashboard/refactor" replace />} />
              <Route path="/double" element={<Navigate to="/dashboard/double" replace />} />
              <Route path="/choose-double" element={<Navigate to="/dashboard/choose-double" replace />} />
              <Route path="/download-a2h2" element={<Navigate to="/dashboard/get-app" replace />} />
              <Route path="/freeplay" element={<Navigate to="/dashboard/tap-in" replace />} />

              {/* Legal Pages */}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/help/manifesting" element={<ManifestHelp />} />
              <Route path="/what-is-palette-plotting" element={<WhatIsPalettePlotting />} />
              <Route path="/terms" element={<TermsOfService />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`terms-${locale}`}
                  path={`/terms/${locale}`}
                  element={<TermsOfService legalLocale={locale} />}
                />
              ))}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`privacy-${locale}`}
                  path={`/privacy/${locale}`}
                  element={<PrivacyPolicy legalLocale={locale} />}
                />
              ))}
              <Route path="/acceptable-use" element={<AcceptableUsePolicy />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`acceptable-use-${locale}`}
                  path={`/acceptable-use/${locale}`}
                  element={<AcceptableUsePolicy legalLocale={locale} />}
                />
              ))}
              <Route path="/dmca" element={<DMCA />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`dmca-${locale}`}
                  path={`/dmca/${locale}`}
                  element={<DMCA legalLocale={locale} />}
                />
              ))}
              <Route path="/billing" element={<BillingRefundPolicy />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`billing-${locale}`}
                  path={`/billing/${locale}`}
                  element={<BillingRefundPolicy legalLocale={locale} />}
                />
              ))}
              <Route path="/pricingplans" element={<PricingPlans />} />
              <Route path="/eula" element={<Navigate to="/terms" replace />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`eula-${locale}`}
                  path={`/eula/${locale}`}
                  element={<Navigate to={`/terms/${locale}`} replace />}
                />
              ))}
              <Route path="/get-mobile-app" element={<GetMobileApp />} />
              <Route path="/quiz/blocking-manifestation" element={<ManifestationQuiz />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </MarketingLocaleProvider>
          </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </AuthProvider>
  </ThemeProvider>
);

export default App;

```

---

## FILE: src/pages/Settings.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2, Zap, ChevronRight } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { cn } from "@/lib/utils";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useAppleIAP } from "@/hooks/useAppleIAP";
import {
  openRevenueCatWebBillingPortal,
  resolveRevenueCatWebBillingStatus,
} from "@/services/revenueCatManageBilling";
import { bootstrapRevenueCat, resolveRevenueCatUILocale, syncRevenueCatUILocale } from "@/services/revenueCat";
import { useTranslation } from "react-i18next";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { resolveAppLocale, legalTermsPath, legalPrivacyPath } from "@/lib/locale";

const PLAY_SUBSCRIPTIONS_URL = "https://play.google.com/store/account/subscriptions";

const Settings = () => {
  const { t, i18n } = useTranslation("settings");
  const localeKey = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const translatePasswordError = (error: string | null): string | null => {
    if (!error) return null;
    return t(`passwordValidation.${error}`);
  };
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const { user } = useAuth();
  const { theme } = useTheme();
  const appleIAP = useAppleIAP();

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [marketingSMSEnabled, setMarketingSMSEnabled] = useState(false);
  const [dataTrainingOptIn, setDataTrainingOptIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Password validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Cadence from `user_plans.billing_period` only (Current Plan label). */
  const [billingPeriodLabel, setBillingPeriodLabel] = useState<string | null>(null);
  /** From user_plans; routes Manage Billing (RC web / App Store / Google Play). */
  const [lastPaymentSource, setLastPaymentSource] = useState<
    "stripe" | "apple" | "google_play" | null
  >(null);
  /** RC Web Billing subscriber — checked so Settings can show a loading hint while portal status resolves. */
  const [rcWebBillingAvailable, setRcWebBillingAvailable] = useState<boolean | null>(null);
  /** Billing identity from user_plans; not used to infer RC Web Billing by placeholder prefix. */
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Start as true if phone hasn't changed
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [showDeleteAccountConfirm1, setShowDeleteAccountConfirm1] = useState(false);
  const [showDeleteAccountConfirm2, setShowDeleteAccountConfirm2] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: planData, error } = await supabase
          .from("user_plans")
          .select("billing_period, last_payment_source, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const plan = planData as
          | {
              billing_period?: string | null;
              last_payment_source?: string | null;
              stripe_customer_id?: string | null;
            }
          | null;

        if (error) {
          console.error("Error fetching plan:", error);
          setBillingPeriodLabel(null);
        } else {
          const bp = plan?.billing_period?.trim() || null;
          setBillingPeriodLabel(bp);
        }

        if (
          plan?.last_payment_source === "stripe" ||
          plan?.last_payment_source === "apple" ||
          plan?.last_payment_source === "google_play"
        ) {
          setLastPaymentSource(plan.last_payment_source);
        } else {
          setLastPaymentSource(null);
        }

        setStripeCustomerId(plan?.stripe_customer_id?.trim() || null);

        const refreshRcWebBillingStatus = () => {
          void resolveRevenueCatWebBillingStatus(user.id)
            .then(({ webBilling }) => setRcWebBillingAvailable(webBilling))
            .catch(() => setRcWebBillingAvailable(false));
        };
        refreshRcWebBillingStatus();
        window.setTimeout(refreshRcWebBillingStatus, 1500);

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('email_marketing, texts_enabled, data_training_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
        }

        // Fetch profile for phone number, username, and first name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, username, first_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          const profileData = profile as any;
          const currentPhone = profileData.phone || "";
          const currentUsername = profileData.username || "";
          const currentFirstName = profileData.first_name || "";
          setPhoneNumber(currentPhone);
          setOriginalPhoneNumber(currentPhone);
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
          setFirstName(currentFirstName);
          setOriginalFirstName(currentFirstName);
        }

        // Pending account deletion (30-day schedule)
        const { data: deletionRequest } = await supabase
          .from("account_deletion_requests")
          .select("requested_at")
          .eq("user_id", user.id)
          .maybeSingle();
        if (deletionRequest?.requested_at) {
          const d = new Date(deletionRequest.requested_at);
          d.setDate(d.getDate() + 30);
          setDeletionScheduledAt(d.toISOString());
        } else {
          setDeletionScheduledAt(null);
        }
      }
    };

    fetchUserData();
  }, []);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("toasts.enterPhone"));
      return;
    }

    setIsSendingCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsPhoneVerified(false);

    try {
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phoneNumber,
          message: t("profile.smsVerificationMessage", { code }),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send code');
      }

      toast.success(t("toasts.codeSent"));
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error(t("toasts.codeSendFailed"));
      setSentCode("");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      // Automatically save if phone number changed
      if (phoneNumber !== originalPhoneNumber) {
        await handleUpdateProfile();
      }
      setVerificationCode("");
      setSentCode("");
      toast.success(t("toasts.phoneVerified"));
    } else {
      toast.error(t("toasts.invalidCode"));
      setVerificationCode("");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error(t("toasts.usernameEmpty"));
      return;
    }
    
    // Check if phone number changed and needs verification
    if (phoneNumber !== originalPhoneNumber && !isPhoneVerified) {
      toast.error(t("toasts.verifyPhoneFirst"));
      return;
    }
    
    if (!user) {
      toast.error(t("toasts.userNotFound"));
      return;
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: username.trim(),
        first_name: firstName.trim() || null,
        phone: phoneNumber || null // Allow clearing phone number
      })
      .eq('id', user.id);

    if (profileError) {
      // Check if it's a unique constraint violation for username
      if (profileError.code === '23505' || profileError.message?.includes('unique') || profileError.message?.includes('duplicate')) {
        toast.error(t("toasts.usernameTaken"));
      } else {
        toast.error(t("toasts.profileUpdateError"));
        console.error(profileError);
      }
      return;
    }

    // Update auth.users phone if phone number was set
    if (phoneNumber && phoneNumber.trim()) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          phone: phoneNumber
        });
        if (authError) {
          console.warn('Could not update auth.users phone:', authError);
          // Don't fail the whole update if auth update fails
        }
      } catch (e) {
        console.warn('Error updating auth phone:', e);
      }
    }

    // Reset verification state after successful update
    setOriginalPhoneNumber(phoneNumber);
    setOriginalUsername(username.trim());
    setOriginalFirstName(firstName.trim());
    setIsPhoneVerified(true);
    setVerificationCode("");
    setSentCode("");

    toast.success(t("toasts.profileUpdated"));
  };

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!newPassword) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(newPassword);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(newPassword, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, newPassword]);

  const canChangePassword = 
    !!newPassword &&
    !!confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleChangePassword = async () => {
    // Validate password using shared validation
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      toast.error(translatePasswordError(passwordResult.error) || t("toasts.invalidPassword"));
      return;
    }

    // Validate password match
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      toast.error(translatePasswordError(matchResult.error) || t("passwordValidation.mismatch"));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(t("toasts.passwordUpdateError"));
    } else {
      toast.success(t("toasts.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  };


  const handleToggleMarketingSMS = async (enabled: boolean) => {
    setMarketingSMSEnabled(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          texts_enabled: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating marketing SMS preference:', error);
        // Revert on error
        setMarketingSMSEnabled(!enabled);
        toast.error(t("toasts.smsUpdateError"));
      } else {
        toast.success(enabled ? t("toasts.smsEnabled") : t("toasts.smsDisabled"));
      }
    }
  };

  const handleToggleDataTraining = async (enabled: boolean) => {
    const previous = dataTrainingOptIn;
    setDataTrainingOptIn(enabled);

    if (!user) {
      toast.error(t("toasts.loginRequired"));
      setDataTrainingOptIn(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        data_training_opt_in: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating data training preference:', error);
      setDataTrainingOptIn(previous);
      toast.error(t("toasts.dataTrainingError"));
    } else {
      toast.success(enabled ? t("toasts.dataTrainingEnabled") : t("toasts.dataTrainingDisabled"));
    }
  };

  const handleDeleteAccountRequest = () => setShowDeleteAccountConfirm1(true);
  const handleDeleteAccountConfirm1Close = () => setShowDeleteAccountConfirm1(false);
  const handleDeleteAccountConfirm1Continue = () => {
    setShowDeleteAccountConfirm1(false);
    setShowDeleteAccountConfirm2(true);
  };
  const handleDeleteAccountConfirm2Close = () => setShowDeleteAccountConfirm2(false);
  const handleDeleteAccountFinalConfirm = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      const result = data as { error?: string; scheduled_at?: string };
      if (result?.error) throw new Error(result.error);
      const scheduledAt = result?.scheduled_at ? new Date(result.scheduled_at) : null;
      const dateStr = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : t("deletion.scheduledFallback");
      setShowDeleteAccountConfirm2(false);
      await supabase.auth.signOut({ scope: "global" });
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
        }
      } catch {}
      navigate("/", { replace: true });
      toast.success(t("toasts.deletionScheduled", { date: dateStr }));
    } catch (e) {
      console.error("Account deletion failed:", e);
      toast.error(t("toasts.deletionFailed"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
        body: { cancel: true },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDeletionScheduledAt(null);
      toast.success(t("toasts.deletionCancelled"));
    } catch (e) {
      console.error("Cancel deletion failed:", e);
      toast.error(t("toasts.deletionCancelFailed"));
    }
  };

  const handleToggleEmailMarketing = async (enabled: boolean) => {
    setEmailMarketing(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_marketing: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating email marketing preference:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Revert on error
        setEmailMarketing(!enabled);
        const errorMessage = error.message || error.details || "";
        toast.error(t("toasts.emailPrefError", { message: errorMessage }));
      } else {
        toast.success(enabled ? t("toasts.emailEnabled") : t("toasts.emailDisabled"));
      }
    }
  };

  /**
   * Manage billing routing:
   *
   * - Apple keeps the original native RevenueCat subscription-management path.
   * - Android tries RevenueCat's management URL, then falls back to the Play subscriptions handoff.
   * - Stripe/RC web opens RevenueCat's management URL.
   */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error(t("toasts.billingLoginRequired"));
      return;
    }

    if (Capacitor.isNativePlatform()) {
      await bootstrapRevenueCat(user.id);
    }
    await syncRevenueCatUILocale();
    console.info("[Settings][Billing] RC UI locale before manage billing", {
      locale: resolveRevenueCatUILocale(),
    });

    if (lastPaymentSource === "apple") {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios" && appleIAP.canManageBillingNatively) {
        try {
          await appleIAP.openSubscriptionManagement(user.id);
        } catch (err) {
          console.error("Manage billing:", err);
        }
        return;
      }

      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        try {
          await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
        } catch (err) {
          console.error("Manage billing (Play):", err);
          toast.error(t("toasts.playSubscriptionsFailed"));
        }
        return;
      }

      toast.error(t("toasts.iosSubscriptionsHint"));
      return;
    }

    if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
      try {
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
      }

      try {
        await Browser.open({ url: PLAY_SUBSCRIPTIONS_URL });
      } catch (err) {
        console.error("Manage billing (Play):", err);
        toast.error(t("toasts.playSubscriptionsFailed"));
      }
      return;
    }

    const isRcManagedBilling =
      lastPaymentSource === "stripe" ||
      rcWebBillingAvailable === true;

    if (isRcManagedBilling) {
      try {
        const portalToast = toast.loading(t("billing.openingPortal"));
        const openedPortal = await openRevenueCatWebBillingPortal(user.id);
        toast.dismiss(portalToast);
        if (openedPortal) {
          setRcWebBillingAvailable(true);
          return;
        }
      } catch (error) {
        console.error("Manage billing (RevenueCat portal):", error);
        toast.error(t("toasts.portalFailed"));
        return;
      }
    }

    toast.error(t("toasts.portalFailedFallback"));
  };


  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });

  const billingOptionsLoading =
    !Capacitor.isNativePlatform() &&
    rcWebBillingAvailable === null &&
    lastPaymentSource !== "stripe" &&
    lastPaymentSource !== "apple";

  return (
    <div
      className={cn(cn("tool-page-shell relative overflow-x-hidden", theme === "dark" ? "text-white bg-[#0f0d14]" : "text-foreground bg-background"), theme === "dark" ? "min-h-screen" : "min-h-screen bg-background", "pb-20 md:pb-0")}
      style={{ backgroundColor: theme === "dark" ? "#0f0d14" : "#ffffff" }}
    >
      {!isMobile && <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />}

      <div
        className="min-h-screen"
        style={
          !isMobile
            ? {
                marginLeft: sidebarCollapsed ? "64px" : "256px",
                transition: "margin-left 300ms ease-in-out",
              }
            : {}
        }
      >
        {isMobile && (
          <div
            className={cn(
              "fixed left-0 right-0 top-0 z-[45] pointer-events-none h-[var(--app-safe-area-top)]",
              theme === "dark" ? "bg-[#0f0d14]" : "bg-white",
            )}
            aria-hidden
          />
        )}

        <div className="relative z-10">
        <header
          className={cn(cn("md:h-16 flex items-center md:py-0 z-50 border-b", theme === "dark" ? "py-2.5 border-white/10" : "py-3 border-primary/10", theme === "dark" ? "border-b border-white/10 bg-[#0f0d14]" : "bg-background"), isMobile ? "sticky z-50 left-0 right-0 w-full max-md:mt-[var(--app-safe-area-top)] max-md:top-[var(--app-safe-area-top)]" : "fixed top-0 left-0 right-0")}
          style={isMobile ? (theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }) : { ...(theme === "dark" ? { backgroundColor: "#0f0d14" } : { backgroundColor: "#ffffff" }), top: "var(--app-safe-area-top)", left: sidebarCollapsed ? "64px" : "256px", right: "0", transition: "left 300ms ease-in-out" }}
        >
        <div className={cn("px-4 sm:px-6 w-full", !isMobile ? "" : "container mx-auto")}>
          <div className="flex items-center justify-between">
          <div>
            <h1
              className={theme === "dark" ? "text-lg font-bold text-white cursor-pointer hover:opacity-80 transition-opacity" : "text-lg font-bold text-foreground cursor-pointer hover:opacity-80 transition-opacity"}
              onClick={() => navigate("/dashboard")}
            >
              {t("header")}
            </h1>
            {isMobile && <p className="text-xs text-muted-foreground">{userEmail}</p>}
            </div>
            {/* PWA Browser Mobile Menu */}
            {isMobile && (
              <div className="md:hidden">
                {isMobile && (
              <div className="md:hidden">
                <MobilePWAMenu />
              </div>
            )}
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "px-4 sm:px-6 max-w-4xl relative z-10",
          isMobile ? "pb-4" : "pb-20",
          !isMobile ? "pt-16" : "",
          !isMobile ? "" : "container mx-auto",
          isMobile && "flex-1 min-h-0 overflow-y-auto overflow-x-hidden",
        )}
      >
        <div className="py-2 sm:py-3">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(theme === "dark" ? "grid w-full gap-1 p-1 rounded-lg border border-white/12 bg-transparent text-white mb-4" : "grid w-full mb-4", !isMobile ? "grid-cols-4" : "grid-cols-4")}>
            <TabsTrigger value="profile" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="settings" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.settings")}</TabsTrigger>
            <TabsTrigger value="billing" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="legal" className={theme === "dark" ? cn("rounded-md border border-transparent text-white/55 transition-colors", "hover:bg-white/[0.06] hover:text-white/80", "data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none") : ""}>{t("tabs.legal")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent key={`profile-${localeKey}`} value="profile" className="space-y-2">
            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">{t("profile.nameLabel")}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">{t("profile.usernameLabel")}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                  placeholder={t("profile.usernamePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">{t("profile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  className={cn("h-11 py-2.5 leading-6", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40", "!opacity-100 cursor-default") : "bg-muted opacity-100 cursor-default")}
                />
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone number field hidden for now */}
              {false && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">{t("profile.phoneLabel")}</Label>
                <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      // Reset verification if phone number changes
                      if (e.target.value !== originalPhoneNumber) {
                        setIsPhoneVerified(false);
                        setVerificationCode("");
                        setSentCode("");
                      } else {
                        setIsPhoneVerified(true);
                      }
                    }}
                  placeholder={t("profile.phonePlaceholder")}
                    className="flex-1 h-9"
                />
                  {phoneNumber && phoneNumber !== originalPhoneNumber && (
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !phoneNumber.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? t("profile.sendingCode") : t("profile.sendCode")}
                    </Button>
                  )}
                </div>

                {sentCode && !isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t("profile.codePlaceholder")}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        variant="outline"
                        className="h-9"
                      >
                        {t("profile.verify")}
                      </Button>
                    </div>
                    {!isPhoneVerified && (
                      <p className="text-xs text-muted-foreground">
                        {t("profile.verifyPhoneHint")}
                      </p>
                    )}
                  </div>
                )}

                {isPhoneVerified && phoneNumber === originalPhoneNumber && originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.phoneVerified")}</p>
                )}

                {isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.newPhoneVerified")}</p>
                )}
              </div>
              )}

              {(username.trim() !== originalUsername || firstName.trim() !== originalFirstName) && (
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full h-9"
                >
                <User className="mr-2 h-4 w-4" />
                  {t("profile.updateButton")}
              </Button>
              )}
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-3 sm:p-4 space-y-2") : "p-3 sm:p-4 space-y-2", theme === "dark" && "!bg-transparent")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                {t("profile.changePasswordHeading")}
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-sm">{t("profile.currentPasswordLabel")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "")}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">{t("profile.newPasswordLabel")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", passwordError && "border-destructive")}
                  />
                  {isValidatingPassword && (
                    <p className="text-xs text-muted-foreground">{t("profile.validatingPassword")}</p>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(passwordError)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-sm">{t("profile.confirmPasswordLabel")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    className={cn("h-9", theme === "dark" ? cn("!bg-transparent !border-white/12 !text-white placeholder:!text-white/40") : "", confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(confirmPasswordError)}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                variant="ghost"
                className={cn("w-full h-9", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                disabled={!canChangePassword}
              >
                {t("profile.changePasswordButton")}
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold text-sm sm:text-base">{t("language.heading")}</h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("language.description")}
              </p>
              <LanguageSwitcher
                persistToAccount
                variant="default"
                className="justify-start"
              />
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Zap className="h-4 w-4" />
                {t("preferences.routineHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.routineDescription")}
              </p>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-3",
                  theme === "dark" && "border-white/12 bg-transparent hover:bg-white/[0.06]",
                )}
                onClick={() => navigate("/dashboard/settings/manifestation-routine")}
              >
                <span className="text-left">
                  <span className="block font-medium">{t("preferences.routineButtonTitle")}</span>
                  <span
                    className={cn(
                      "block text-xs font-normal mt-0.5",
                      theme === "dark" ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
                    {t("preferences.routineButtonSubtitle")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.emailHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.emailDescription")}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">{t("preferences.emailMarketingLabel")}</Label>
                  <Switch 
                    id="email-marketing"
                    checked={emailMarketing}
                    onCheckedChange={handleToggleEmailMarketing}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between hidden">
                  <Label htmlFor="text-marketing">{t("preferences.textMarketingLabel")}</Label>
                  <Switch 
                    id="text-marketing"
                    checked={marketingSMSEnabled}
                    onCheckedChange={handleToggleMarketingSMS}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.dataTrainingHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.dataTrainingDescription")}
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-training-opt-in">{t("preferences.dataTrainingLabel")}</Label>
                <Switch
                  id="data-training-opt-in"
                  checked={dataTrainingOptIn}
                  onCheckedChange={handleToggleDataTraining}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3", "border-destructive/30")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("deletion.heading")}
              </h3>
              {deletionScheduledAt ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.scheduledPrefix")}{" "}
                    {new Date(deletionScheduledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.{" "}
                    {t("deletion.scheduledSuffix")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                  >
                    {t("deletion.cancelRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.description")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleDeleteAccountRequest}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deletion.deleteButton")}
                  </Button>
                </>
              )}
            </Card>

            <Dialog open={showDeleteAccountConfirm1} onOpenChange={setShowDeleteAccountConfirm1}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm1Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm1Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm1Close}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountConfirm1Continue}>{t("common:continue")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteAccountConfirm2} onOpenChange={setShowDeleteAccountConfirm2}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm2Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm2Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm2Close} disabled={isDeletingAccount}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountFinalConfirm} disabled={isDeletingAccount}>
                    {isDeletingAccount ? t("deletion.deleting") : t("deletion.deleteButton")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Billing Tab */}
          <TabsContent key={`billing-${localeKey}`} value="billing" className="space-y-3">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                {t("billing.subscriptionHeading")}
              </h3>
              
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.currentPlan")}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {billingPeriodLabel === "monthly"
                      ? t("billing.planMonthly")
                      : billingPeriodLabel === "annual"
                        ? t("billing.planAnnual")
                        : billingPeriodLabel === "weekly"
                          ? t("billing.planWeekly")
                          : billingPeriodLabel ?? ""}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.billingHeading")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.billingDescription")}
                  </p>
                </div>

                {billingOptionsLoading ? (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.loadingOptions")}
                    </p>
                  </>
                ) : (
                  <>
                    <Button
                      type="button"
                      variant="ghost"
                      className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                      onClick={() => void handleManageBilling()}
                    >
                      {t("billing.manageBilling")}
                    </Button>
                    <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                      {t("billing.portalHint")}
                    </p>
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent key={`legal-${localeKey}`} value="legal" className="space-y-3">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3"}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                {t("legal.heading")}
              </h3>
              {t("legalDisclaimer") ? (
                <p className={cn("text-xs mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("legalDisclaimer")}
                </p>
              ) : null}

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/faq")}
                >
                  {t("legal.faq")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalTermsPath(localeKey))}
                >
                  {t("legal.terms")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalPrivacyPath(localeKey))}
                >
                  {t("legal.privacy")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/acceptable-use")}
                >
                  {t("legal.acceptableUse")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("legal.billingRefunds")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dmca")}
                >
                  {t("legal.dmca")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/eula")}
                >
                  {t("legal.eula")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  {t("legal.contact")}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </main>
        </div>
      </div>
    </div>
  );
};

export default Settings;

```

---

## FILE: src/components/LanguageSwitcher.tsx

```tsx
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import {
  LANGUAGE_SWITCHER_OPTIONS,
  resolveAppLocale,
  writeStoredPreferredLocale,
  type AppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { syncRevenueCatUILocale } from "@/services/revenueCat";
import { syncOneSignalUserLanguage } from "@/services/oneSignal";

type LanguageSwitcherProps = {
  className?: string;
  /** Persist to Supabase when user is logged in (e.g. Settings). */
  persistToAccount?: boolean;
  /** Welcome cosmic shell uses light-on-dark labels. */
  variant?: "welcome" | "default";
};

/**
 * Inline locale control — not a dedicated page. Labels stay English | Español | Português.
 */
export function LanguageSwitcher({
  className,
  persistToAccount,
  variant = "welcome",
}: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const current = resolveAppLocale(i18n.resolvedLanguage || i18n.language);

  const onSelect = async (locale: AppLocale) => {
    if (locale === current) return;

    writeStoredPreferredLocale(locale);
    await setAppLocale(locale);
    void writeSetupDraft({ locale });

    await Promise.allSettled([
      syncRevenueCatUILocale(),
      syncOneSignalUserLanguage(locale),
    ]);

    if (persistToAccount) {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) return;

      const [prefsRes, profileRes] = await Promise.all([
        supabase.from("user_preferences").upsert(
          { user_id: userId, preferred_locale: locale },
          { onConflict: "user_id" },
        ),
        supabase.from("profiles").upsert(
          { id: userId, preferred_locale: locale },
          { onConflict: "id" },
        ),
      ]);

      if (prefsRes.error || profileRes.error) {
        console.error(
          "[LanguageSwitcher] failed to persist locale:",
          prefsRes.error ?? profileRes.error,
        );
      }
    }
  };

  return (
    <div
      className={cn("flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs", className)}
      role="group"
      aria-label="Language"
    >
      {LANGUAGE_SWITCHER_OPTIONS.map((opt, index) => (
        <span key={opt.code} className="inline-flex items-center gap-2">
          {index > 0 ? (
            <span
              className={variant === "welcome" ? "text-white/35" : "text-muted-foreground/50"}
              aria-hidden
            >
              |
            </span>
          ) : null}
          <button
            type="button"
            onClick={() => void onSelect(opt.code)}
            aria-pressed={current === opt.code}
            className={cn(
              "relative z-10 min-h-11 min-w-[4.5rem] cursor-pointer touch-manipulation px-2 py-2 font-sans transition-colors",
              variant === "welcome"
                ? current === opt.code
                  ? "font-semibold text-white"
                  : "font-medium text-white/55 hover:text-white/80"
                : current === opt.code
                  ? "font-semibold text-foreground"
                  : "font-medium text-muted-foreground hover:text-foreground",
            )}
          >
            {opt.label}
          </button>
        </span>
      ))}
    </div>
  );
}
```

---

## FILE: supabase/functions/_shared/revenueCatSecretEnv.ts

```typescript
/**
 * RevenueCat REST API secret (`sk_...`) for Edge Functions.
 * Standard Supabase secret name: `REVENUECAT_SECRET_KEY`.
 * Also accepts `revenuecat_secret_key` for projects that created the secret under that name.
 */
export function getRevenueCatServerSecretKey(): string | undefined {
  const primary = Deno.env.get("REVENUECAT_SECRET_KEY")?.trim();
  if (primary) return primary;
  return Deno.env.get("revenuecat_secret_key")?.trim();
}

```

---

## FILE: supabase/functions/_shared/revenuecatUserPlansSync.ts

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type SupabaseServiceClient = ReturnType<typeof createClient>;

export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";
export const REVENUECAT_API = "https://api.revenuecat.com/v1/subscribers";

/** Parse user_plans.current_period_end → ms, or NaN. */
function parsePeriodEndMs(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return NaN;
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * RC entitlement expiry for max() comparison. Empty expires_date ⇒ still subscribed (treat as +∞).
 */
function revenueCatEntitlementExpiresEndMs(entitlement: RevenueCatEntitlement): number {
  if (entitlement.expires_date == null || String(entitlement.expires_date).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }
  const t = new Date(String(entitlement.expires_date)).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export interface RevenueCatEntitlement {
  expires_date?: string | null;
  product_identifier?: string;
  purchase_date?: string;
  /** Trial / intro / normal — RevenueCat REST (often lowercase). */
  period_type?: string | null;
}

export interface RevenueCatSubscriptionEntry {
  period_type?: string | null;
  expires_date?: string | null;
  /** e.g. APP_STORE, PLAY_STORE — RevenueCat REST subscriber.subscriptions[productId].store */
  store?: string | null;
  store_transaction_id?: string | null;
  original_store_transaction_id?: string | null;
}

export interface RevenueCatSubscriberResponse {
  subscriber?: {
    /** Platform-correct portal link from GET /v1/subscribers (web billing → billing.revenuecat.com or RC portal redirect). */
    management_url?: string | null;
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscriptionEntry>;
  };
}

function normPeriodType(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Initial profile → user_plans copy only when this column on user_plans is not set yet (later RC syncs do not replace). */
function userPlansIdentityUnset(v: unknown): boolean {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/** Sticky signal from RC snapshot: any subscription row or entitlement shows trial period type. */
export function revenueCatIndicatesHadTrialFromSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (ent && normPeriodType(ent.period_type) === "trial") return true;

  const subs = subscriber?.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const entry = subs[key];
    if (!entry || typeof entry !== "object") continue;
    if (normPeriodType(entry.period_type) === "trial") return true;
  }
  return false;
}

function subscriptionExpiresMs(entry: RevenueCatSubscriptionEntry): number {
  const raw = entry.expires_date;
  if (raw == null || raw === "") return NaN;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * True if the Palette Plotting entitlement is active and RC reports the current period is a free trial
 * (entitlement.period_type or the linked subscription row).
 */
export function revenueCatOnTrialNow(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  nowMs: number,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (!ent) return false;
  const entActive =
    ent.expires_date == null || ent.expires_date === "" || new Date(String(ent.expires_date)).getTime() > nowMs;
  if (!entActive) return false;

  if (normPeriodType(ent.period_type) === "trial") return true;

  const pid = ent.product_identifier;
  if (pid && subscriber?.subscriptions?.[pid]) {
    const sub = subscriber.subscriptions[pid]!;
    const subMs = subscriptionExpiresMs(sub);
    const subActive = Number.isNaN(subMs) || subMs > nowMs;
    if (subActive && normPeriodType(sub.period_type) === "trial") return true;
  }

  return false;
}

/** Webhook event fields (uppercase TRIAL in docs) — trial start or conversion off trial still counts as ever had trial. */
export function webhookEventImpliesHadTrial(event: Record<string, unknown>): boolean {
  if (normPeriodType(event.period_type) === "trial") return true;
  if (event.is_trial_conversion === true) return true;
  return false;
}

function normalizedRevenueCatStore(store: unknown): string {
  return String(store ?? "").trim().toUpperCase().replace(/-/g, "_");
}

function isAppleStoreFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "APP_STORE" || s === "MAC_APP_STORE";
}

/** RC Web Billing (purchases-js / Stripe gateway under RC). v1 REST often reports store `stripe`. */
function isWebBillingFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "STRIPE" || s === "RC_BILLING" || s === "RCBILLING" || s === "WEB";
}

function isGooglePlayFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "PLAY_STORE" || s === "GOOGLE_PLAY";
}

/** True when RC subscriber payload or webhook shows Stripe / RC Web Billing (not App Store). */
function isWebBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  activeProductId: string,
  nowMs: number,
): boolean {
  if (webhookEvent && isWebBillingFromRcStore(webhookEvent.store)) return true;
  if (subscriberHasActiveWebBilling(subscriber, entitlementId, nowMs)) return true;

  const mgmt = subscriber?.management_url;
  if (typeof mgmt === "string" && isRevenueCatWebBillingPortalUrl(mgmt)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isWebBillingFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isWebBillingFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

function isAppleBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  appleCustomerId: string | null,
  activeProductId: string,
): boolean {
  if (appleCustomerId) return true;
  if (webhookEvent && isAppleStoreFromRcStore(webhookEvent.store)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isAppleStoreFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isAppleStoreFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

function isGooglePlayBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  webhookEvent: Record<string, unknown> | undefined,
  activeProductId: string,
): boolean {
  if (webhookEvent && isGooglePlayFromRcStore(webhookEvent.store)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isGooglePlayFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isGooglePlayFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

/** Never label RC Web Billing / Stripe as apple — default RC-placeholder rows to stripe unless App Store is confirmed. */
function lastPaymentSourceFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  appleCustomerId: string | null,
  activeProductId: string,
  nowMs: number,
  existingLastPaymentSource: string | null | undefined,
): "stripe" | "apple" | "google_play" {
  if (isWebBillingFromRcContext(subscriber, entitlementId, webhookEvent, activeProductId, nowMs)) {
    return "stripe";
  }
  if (isAppleBillingFromRcContext(subscriber, entitlementId, webhookEvent, appleCustomerId, activeProductId)) {
    return "apple";
  }
  if (isGooglePlayBillingFromRcContext(subscriber, webhookEvent, activeProductId)) {
    return "google_play";
  }
  if (existingLastPaymentSource === "stripe" || existingLastPaymentSource === "apple" ||
    existingLastPaymentSource === "google_play") {
    return existingLastPaymentSource;
  }
  return "stripe";
}

/** Tokenized portal or RC API redirect used by Web Billing management emails. */
export function isRevenueCatWebBillingPortalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "billing.revenuecat.com") return true;
    if (parsed.hostname === "api.revenuecat.com" && /\/rcbilling\//i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

export function subscriberHasActiveWebBilling(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string = REVENUECAT_ENTITLEMENT_ID,
  nowMs = Date.now(),
): boolean {
  if (!subscriber) return false;

  const ent = subscriber.entitlements?.[entitlementId];
  if (ent) {
    const entActive =
      ent.expires_date == null ||
      ent.expires_date === "" ||
      new Date(String(ent.expires_date)).getTime() > nowMs;
    if (entActive) {
      const pid = ent.product_identifier?.trim();
      if (pid && subscriber.subscriptions?.[pid]) {
        if (isWebBillingFromRcStore(subscriber.subscriptions[pid].store)) return true;
      }
    }
  }

  const subs = subscriber.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const sub = subs[key];
    if (!sub || typeof sub !== "object" || !isWebBillingFromRcStore(sub.store)) continue;
    const subMs = subscriptionExpiresMs(sub);
    if (Number.isNaN(subMs) || subMs > nowMs) return true;
  }
  return false;
}

/** Resolve RC Web Billing customer portal URL from GET /v1/subscribers payload. */
export function webBillingManagementUrlFromRevenueCatPayload(
  data: RevenueCatSubscriberResponse,
  entitlementId: string = REVENUECAT_ENTITLEMENT_ID,
): string | null {
  const subscriber = data.subscriber;
  if (!subscriber || !subscriberHasActiveWebBilling(subscriber, entitlementId)) return null;

  const url = typeof subscriber.management_url === "string" ? subscriber.management_url.trim() : "";
  if (url && isRevenueCatWebBillingPortalUrl(url)) return url;
  return null;
}

/**
 * Apple transaction id for user_plans.apple_customer_id from GET /subscribers (subscription row for entitlement product).
 * Prefers original_store_transaction_id when present (stable across renewals), else store_transaction_id.
 */
export function appleCustomerIdFromRevenueCatSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): string | null {
  if (!subscriber) return null;
  const ent = subscriber.entitlements?.[entitlementId];
  const pid = ent?.product_identifier?.trim();
  if (!pid) return null;
  const sub = subscriber.subscriptions?.[pid] as RevenueCatSubscriptionEntry | undefined;
  if (!sub || typeof sub !== "object") return null;
  if (!isAppleStoreFromRcStore(sub.store)) return null;
  const orig = sub.original_store_transaction_id?.trim();
  if (orig) return orig;
  const cur = sub.store_transaction_id?.trim();
  if (cur) return cur;
  return null;
}

/** Webhook payload may include transaction ids when store is App Store. */
function appleCustomerIdFromWebhookEvent(event: Record<string, unknown>): string | null {
  if (!isAppleStoreFromRcStore(event.store)) return null;
  const o = event.original_transaction_id;
  const t = event.transaction_id;
  if (typeof o === "string" && o.trim()) return o.trim();
  if (typeof t === "string" && t.trim()) return t.trim();
  const st = event.store_transaction_id;
  if (typeof st === "string" && st.trim()) return st.trim();
  return null;
}

export async function fetchRevenueCatSubscriber(
  secretKey: string,
  appUserId: string,
): Promise<{ ok: true; data: RevenueCatSubscriberResponse } | { ok: false; status: number; body: string }> {
  const encodedId = encodeURIComponent(appUserId);
  const rcRes = await fetch(`${REVENUECAT_API}/${encodedId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!rcRes.ok) {
    const body = await rcRes.text();
    return { ok: false, status: rcRes.status, body };
  }
  const data = (await rcRes.json()) as RevenueCatSubscriberResponse;
  return { ok: true, data };
}

export type RevenueCatSyncResult =
  /** `preservedStripe`: after sync, row uses real Stripe `cus_`/`sub_` + `last_payment_source: stripe` (latest expiry vs RC favored Stripe identity). */
  | { ok: true; active: true; preservedStripe: true }
  | { ok: true; active: true; preservedStripe?: false }
  | { ok: true; active: false; preservedExistingPlan: true }
  | { ok: true; active: false; downgraded?: boolean }
  | { ok: false; error: string };

/**
 * Applies RevenueCat subscriber payload to user_plans (same fields as client sync-revenuecat-entitlement).
 * Active entitlement: compares Stripe `current_period_end` vs RC entitlement end; **latest expiry wins** for
 * `current_period_end` and for billing identity: sets `stripe_customer_id`, `stripe_subscription_id`, and
 * `last_payment_source` together (Stripe `cus_`/`sub_` vs RC placeholders) so rows stay consistent.
 * Does not read or write `stripe_customer_id_official` — documentation-only (Stripe checkout).
 * When entitlement is inactive: if DB still shows active with a future current_period_end, leaves row unchanged.
 * Otherwise marks canceled, keeping last period end when possible.
 */
export async function syncUserPlansFromRevenueCatPayload(
  supabase: SupabaseServiceClient,
  appUserId: string,
  rcData: RevenueCatSubscriberResponse,
  opts: { webhookEvent?: Record<string, unknown> },
): Promise<RevenueCatSyncResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const entitlement = rcData.subscriber?.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  const isActive =
    !!entitlement &&
    (entitlement.expires_date == null ||
      entitlement.expires_date === "" ||
      new Date(entitlement.expires_date) > now);

  const { data: existingBeforeRc } = await supabase
    .from("user_plans")
    .select(
      "last_payment_source, stripe_customer_id, stripe_subscription_id, status, current_period_end, had_trial, on_trial",
    )
    .eq("user_id", appUserId)
    .maybeSingle();

  const appleCustomerId =
    appleCustomerIdFromRevenueCatSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID) ??
    (opts.webhookEvent ? appleCustomerIdFromWebhookEvent(opts.webhookEvent) : null);

  if (!isActive) {
    if (!existingBeforeRc) {
      return { ok: true, active: false };
    }
    const rowForPreserve = existingBeforeRc as {
      status?: string | null;
      current_period_end?: string | null;
    };
    const periodEndMsForPreserve = rowForPreserve.current_period_end
      ? new Date(rowForPreserve.current_period_end).getTime()
      : NaN;
    const hasFuturePeriodInDb =
      !Number.isNaN(periodEndMsForPreserve) && periodEndMsForPreserve > nowMs;
    const isActiveStatusInDb = rowForPreserve.status === "active";
    if (isActiveStatusInDb && hasFuturePeriodInDb) {
      console.error(
        "[revenuecatUserPlansSync] RC inactive but user_plans active with future period; leaving row unchanged",
      );
      return { ok: true, active: false, preservedExistingPlan: true };
    }

    const hadTrial = Boolean((existingBeforeRc as { had_trial?: boolean | null }).had_trial);
    let periodEndToKeep: string | null = null;
    const rawExp = entitlement?.expires_date;
    if (rawExp != null && String(rawExp).trim() !== "") {
      const d = new Date(String(rawExp));
      if (Number.isFinite(d.getTime())) periodEndToKeep = d.toISOString();
    }
    if (!periodEndToKeep) {
      const existingEnd = (existingBeforeRc as { current_period_end?: string | null }).current_period_end;
      if (existingEnd) periodEndToKeep = existingEnd;
    }
    // Do not set tier to "basic" — keep monthly/annual for reactivation UX. Keep last period end instead of null.
    const prevLps = (existingBeforeRc as { last_payment_source?: string | null }).last_payment_source;
    const cancelProductId = entitlement?.product_identifier?.trim() ?? "";
    const lastPaymentSource = lastPaymentSourceFromRcContext(
      rcData.subscriber,
      REVENUECAT_ENTITLEMENT_ID,
      opts.webhookEvent,
      appleCustomerId,
      cancelProductId,
      nowMs,
      prevLps,
    );
    const { error: downErr } = await supabase
      .from("user_plans")
      .update({
        status: "canceled",
        last_payment_source: lastPaymentSource,
        ...(periodEndToKeep != null ? { current_period_end: periodEndToKeep } : {}),
        ...(appleCustomerId != null ? { apple_customer_id: appleCustomerId } : {}),
        updated_at: now.toISOString(),
        had_trial: hadTrial,
        on_trial: false,
      })
      .eq("user_id", appUserId);
    if (downErr) {
      console.error("[revenuecatUserPlansSync] downgrade error:", downErr);
      return { ok: false, error: downErr.message };
    }
    return { ok: true, active: false, downgraded: true };
  }

  const productId = (entitlement!.product_identifier ?? "").toLowerCase();
  const billing = productId.includes("annual")
    ? "annual"
    : productId.includes("weekly")
      ? "weekly"
      : "monthly";

  const dbEndMs = parsePeriodEndMs(
    (existingBeforeRc as { current_period_end?: string | null } | null)?.current_period_end,
  );
  const rcEndRaw = revenueCatEntitlementExpiresEndMs(entitlement!);
  const stripeComparable = Number.isFinite(dbEndMs) ? dbEndMs : Number.NEGATIVE_INFINITY;
  const rcComparable = rcEndRaw === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : (Number.isFinite(rcEndRaw) ? rcEndRaw : Number.NEGATIVE_INFINITY);

  const mergedEndMs = Math.max(stripeComparable, rcComparable);
  const finalPeriodEndIso =
    mergedEndMs === Number.POSITIVE_INFINITY || !Number.isFinite(mergedEndMs)
      ? null
      : new Date(mergedEndMs).toISOString();

  const ex = existingBeforeRc as {
    last_payment_source?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
  /** Both required to keep a coherent Stripe row (portal + webhooks resolve by `sub_`). */
  const hasFullStripeIds =
    !!ex?.stripe_customer_id?.trim().startsWith("cus_") &&
    !!ex?.stripe_subscription_id?.trim().startsWith("sub_");

  /** Apple/RC placeholders win when RC expiry is later, or we lack real Stripe ids to compare. */
  let billingIsApple: boolean;
  if (!hasFullStripeIds) {
    billingIsApple = true;
  } else if (rcComparable > stripeComparable) {
    billingIsApple = true;
  } else if (stripeComparable > rcComparable) {
    billingIsApple = false;
  } else {
    // Tie: prefer existing Stripe-backed row when `last_payment_source` is already stripe
    billingIsApple = ex?.last_payment_source !== "stripe";
  }

  const rcHadTrialSnapshot = revenueCatIndicatesHadTrialFromSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID);
  const eventHintHadTrial = opts.webhookEvent ? webhookEventImpliesHadTrial(opts.webhookEvent) : false;
  const hadTrialMerged =
    Boolean((existingBeforeRc as { had_trial?: boolean | null } | null)?.had_trial) ||
    rcHadTrialSnapshot ||
    eventHintHadTrial;

  const onTrialNow = revenueCatOnTrialNow(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID, nowMs);

  let userEmail: string | null = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(appUserId);
    userEmail = authData.user?.email ?? null;
  } catch {
    /* non-fatal */
  }

  // Billing columns on upsert (omit stripe_customer_id_official — documentation column only).
  const planData: Record<string, unknown> = {
    user_id: appUserId,
    tier: "premium",
    billing_period: billing,
    status: "active",
    current_period_end: finalPeriodEndIso,
    updated_at: now.toISOString(),
    had_trial: hadTrialMerged,
    on_trial: onTrialNow,
  };
  if (billingIsApple) {
    planData.stripe_customer_id = `revenuecat:${appUserId}`;
    planData.stripe_subscription_id = `rc_${appUserId}`;
    const activeProductId = entitlement!.product_identifier?.trim() ?? "";
    planData.last_payment_source = lastPaymentSourceFromRcContext(
      rcData.subscriber,
      REVENUECAT_ENTITLEMENT_ID,
      opts.webhookEvent,
      appleCustomerId,
      activeProductId,
      nowMs,
      ex?.last_payment_source,
    );
  } else {
    planData.stripe_customer_id = ex!.stripe_customer_id;
    planData.stripe_subscription_id = ex!.stripe_subscription_id ?? null;
    planData.last_payment_source = "stripe";
  }
  if (appleCustomerId != null) planData.apple_customer_id = appleCustomerId;

  const { error: planError } = await supabase.from("user_plans").upsert(planData, {
    onConflict: "user_id",
  });
  if (planError) {
    console.error("[revenuecatUserPlansSync] upsert error:", planError);
    return { ok: false, error: planError.message };
  }

  try {
    const [{ data: planRow }, { data: prof }] = await Promise.all([
      supabase
        .from("user_plans")
        .select("first_name, username, phone, email")
        .eq("user_id", appUserId)
        .maybeSingle(),
      supabase.from("profiles").select("first_name, username, phone, email").eq("id", appUserId).maybeSingle(),
    ]);
    const identityPatch: Record<string, unknown> = {};
    if (planRow && prof) {
      if (userPlansIdentityUnset(planRow.first_name) && prof.first_name != null && String(prof.first_name).trim() !== "") {
        identityPatch.first_name = prof.first_name;
      }
      if (userPlansIdentityUnset(planRow.username) && prof.username != null && String(prof.username).trim() !== "") {
        identityPatch.username = prof.username;
      }
      if (userPlansIdentityUnset(planRow.phone) && prof.phone != null && String(prof.phone).trim() !== "") {
        identityPatch.phone = prof.phone;
      }
      if (userPlansIdentityUnset(planRow.email) && prof.email != null && String(prof.email).trim() !== "") {
        identityPatch.email = prof.email;
      }
    }
    if (Object.keys(identityPatch).length > 0) {
      const { error: idErr } = await supabase.from("user_plans").update(identityPatch).eq("user_id", appUserId);
      if (idErr) console.warn("[revenuecatUserPlansSync] profile mirror to user_plans failed (non-fatal):", idErr);
    }
  } catch (e) {
    console.warn("[revenuecatUserPlansSync] profile mirror to user_plans exception (non-fatal):", e);
  }

  const preservedStripe = !billingIsApple;
  return { ok: true, active: true, preservedStripe };
}

```

---

## FILE: supabase/functions/_shared/postStripeToRevenueCat.ts

```typescript
/**
 * Sends a Stripe subscription or Checkout Session to RevenueCat so web purchases unlock the same
 * entitlements as mobile (Stripe Billing integration).
 *
 * @see https://www.revenuecat.com/docs/web/integrations/stripe
 *
 * Env: REVENUECAT_STRIPE_APP_PUBLIC_API_KEY — "Stripe public API key" from RevenueCat → your app →
 *      API keys (NOT the sk_ secret used for /v1/subscribers). If unset, calls are no-ops.
 *
 * Dashboard: Connect Stripe to RevenueCat; add each Stripe *product* to an entitlement with a
 * product identifier matching Stripe's prod_… id exactly. Your existing Stripe Price IDs on
 * Checkout do not need separate REST setup — RC reads the subscription from Stripe using the token.
 */
/** @returns true when RC accepted the Stripe token, false when skipped or failed (non-throwing). */
export async function postStripePurchaseToRevenueCat(
  appUserId: string,
  fetchToken: string | null | undefined,
): Promise<boolean> {
  if (!fetchToken || typeof fetchToken !== "string" || !fetchToken.trim()) return false;

  const apiKey = Deno.env.get("REVENUECAT_STRIPE_APP_PUBLIC_API_KEY")?.trim();
  if (!apiKey) {
    console.warn("[postStripeToRevenueCat] REVENUECAT_STRIPE_APP_PUBLIC_API_KEY not set; skipping");
    return false;
  }

  try {
    const res = await fetch("https://api.revenuecat.com/v1/receipts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Platform": "stripe",
      },
      body: JSON.stringify({
        app_user_id: appUserId,
        fetch_token: fetchToken.trim(),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn(
        "[postStripeToRevenueCat] RevenueCat /v1/receipts failed:",
        res.status,
        text.slice(0, 800),
      );
      return false;
    }
    console.log("[postStripeToRevenueCat] synced Stripe token for app_user_id", appUserId);
    return true;
  } catch (e) {
    console.warn("[postStripeToRevenueCat] request error (non-fatal):", e);
    return false;
  }
}

```

---

## FILE: supabase/functions/_shared/revenueCatSubscriptionEventStore.ts

```typescript
import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

function str(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function num(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string" && value.trim()) {
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  }
  return null;
}

function msToIso(value: unknown): string | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return new Date(value).toISOString();
  }
  if (typeof value === "string" && value.trim()) {
    const d = new Date(value);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

export function normalizeRevenueCatSubscriptionEventRow(
  event: Record<string, unknown>,
): Record<string, unknown> | null {
  const eventId = str(event.id, 200) ?? str(event.event_id, 200);
  if (!eventId) return null;

  return {
    event_id: eventId,
    app_user_id: str(event.app_user_id, 200),
    original_app_user_id: str(event.original_app_user_id, 200),
    event_type: str(event.type, 120) ?? str(event.event_type, 120),
    product_id: str(event.product_id, 200),
    entitlement_id: str(event.entitlement_id, 200) ?? str(event.entitlement_ids, 200),
    store: str(event.store, 64),
    environment: str(event.environment, 64),
    country: str(event.country_code, 8) ?? str(event.country, 8),
    currency: str(event.currency, 16),
    price: num(event.price),
    price_in_purchased_currency: num(event.price_in_purchased_currency),
    period_type: str(event.period_type, 64),
    purchased_at: msToIso(event.purchased_at_ms) ?? msToIso(event.purchased_at),
    expiration_at: msToIso(event.expiration_at_ms) ?? msToIso(event.expiration_at),
    cancellation_at: msToIso(event.cancellation_at_ms) ?? msToIso(event.cancellation_at),
    cancel_reason: str(event.cancel_reason, 200),
    transaction_id: str(event.transaction_id, 200),
    original_transaction_id: str(event.original_transaction_id, 200),
    raw_event: event,
  };
}

export async function storeRevenueCatSubscriptionEvent(
  supabase: SupabaseClient,
  event: Record<string, unknown>,
): Promise<{ ok: boolean; detail?: string }> {
  const row = normalizeRevenueCatSubscriptionEventRow(event);
  if (!row) return { ok: false, detail: "missing_event_id" };

  const { error } = await supabase.from("revenuecat_subscription_events").upsert(row, {
    onConflict: "event_id",
    ignoreDuplicates: true,
  });

  if (error) {
    console.warn("[revenuecat-webhook] store subscription event failed", error.message);
    return { ok: false, detail: error.message };
  }
  return { ok: true };
}

```

---

## FILE: supabase/functions/_shared/revenueCatAttributionAttributes.ts

```typescript
import { getRevenueCatServerSecretKey } from "./revenueCatSecretEnv.ts";

const GUIDE_IDS = new Set(["river", "sage", "rose", "oliver"]);
const INTENSITY = new Set(["light", "consistent", "locked_in"]);

function str(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function setupPathFromSession(session: Record<string, unknown>): Record<string, unknown> | null {
  const answers = session.onboarding_answers;
  if (!answers || typeof answers !== "object" || answers === null) return null;
  const a = answers as Record<string, unknown>;
  const fromSetup = a.setup_path_v1;
  if (fromSetup && typeof fromSetup === "object" && fromSetup !== null) {
    return fromSetup as Record<string, unknown>;
  }
  const journey = a.setup_journey_v1;
  if (journey && typeof journey === "object" && journey !== null) {
    return journey as Record<string, unknown>;
  }
  return null;
}

function safeConditionalBranch(spec: unknown): string | null {
  if (!spec || typeof spec !== "object" || spec === null) return null;
  const s = spec as Record<string, unknown>;
  const branch = str(s.branch, 64);
  const category = str(s.category, 120);
  const sp = s.sp && typeof s.sp === "object" ? (s.sp as Record<string, unknown>) : null;
  const step7 = s.step7 && typeof s.step7 === "object" ? (s.step7 as Record<string, unknown>) : null;
  const parts: string[] = [];
  if (category) parts.push(`cat:${category}`);
  if (branch) parts.push(`branch:${branch}`);
  const spChoice = sp ? str(sp.hasSpecificPerson, 32) : null;
  if (spChoice) parts.push(`sp:${spChoice}`);
  const sel = step7 ? str(step7.selection, 120) : null;
  if (sel) parts.push(`sel:${sel}`);
  return parts.length > 0 ? parts.join("|").slice(0, 500) : null;
}

/** Build safe RevenueCat customer attributes from an onboarding_sessions row. */
export function buildRevenueCatAttributionAttributes(
  session: Record<string, unknown>,
): Record<string, string> {
  const setup = setupPathFromSession(session);
  const journey =
    session.onboarding_answers &&
    typeof session.onboarding_answers === "object" &&
    (session.onboarding_answers as Record<string, unknown>).setup_journey_v1 &&
    typeof (session.onboarding_answers as Record<string, unknown>).setup_journey_v1 === "object"
      ? ((session.onboarding_answers as Record<string, unknown>).setup_journey_v1 as Record<string, unknown>)
      : null;

  const attrs: Record<string, string> = {};

  const setIf = (key: string, value: unknown) => {
    const v = typeof value === "string" ? str(value) : value != null ? str(String(value)) : null;
    if (v) attrs[key] = v;
  };

  setIf("first_utm_source", session.first_touch_source);
  setIf("first_utm_medium", session.first_touch_medium);
  setIf("first_utm_campaign", session.first_touch_campaign);
  setIf("first_utm_content", session.first_touch_content);
  setIf("first_utm_term", session.first_touch_term);
  setIf("first_click_id_type", session.first_touch_click_id_type);
  setIf("first_click_id_value", session.first_touch_click_id_value);
  setIf("first_landing_page", session.first_touch_landing_page);
  setIf("first_referrer", session.first_touch_referrer);

  setIf("last_utm_source", session.last_touch_source);
  setIf("last_utm_medium", session.last_touch_medium);
  setIf("last_utm_campaign", session.last_touch_campaign);
  setIf("last_utm_content", session.last_touch_content);
  setIf("last_utm_term", session.last_touch_term);
  setIf("last_click_id_type", session.last_touch_click_id_type);
  setIf("last_click_id_value", session.last_touch_click_id_value);
  setIf("last_landing_page", session.last_touch_landing_page);
  setIf("last_referrer", session.last_touch_referrer);

  const payload =
    session.attribution_payload &&
    typeof session.attribution_payload === "object" &&
    session.attribution_payload !== null
      ? (session.attribution_payload as Record<string, unknown>)
      : null;
  const firstTouch =
    payload?.first_touch && typeof payload.first_touch === "object"
      ? (payload.first_touch as Record<string, unknown>)
      : null;
  const lastTouch =
    payload?.last_touch && typeof payload.last_touch === "object"
      ? (payload.last_touch as Record<string, unknown>)
      : null;

  setIf("locale", firstTouch?.locale ?? lastTouch?.locale);
  setIf("country", firstTouch?.country ?? lastTouch?.country);
  setIf("platform", firstTouch?.platform ?? lastTouch?.platform);
  setIf("device_os", firstTouch?.device_os ?? lastTouch?.device_os);

  setIf("onboarding_session_id", session.id);

  const landing = str(session.first_touch_landing_page) ?? str(session.last_touch_landing_page);
  if (landing) setIf("onboarding_path", landing);

  const desireCategory = setup ? str(setup.desire_category, 64) : null;
  if (desireCategory) setIf("desire_category", desireCategory);

  const toolPrefs = setup?.tool_preferences;
  if (Array.isArray(toolPrefs)) {
    const labels = toolPrefs.filter((x): x is string => typeof x === "string").slice(0, 12);
    if (labels.length > 0) setIf("tool_preference", labels.join(","));
  }

  const guide =
    str(session.character_id, 32) ??
    (setup ? str(setup.guide_character_id, 32) : null);
  if (guide && GUIDE_IDS.has(guide)) setIf("guide_character_id", guide);

  const intensityRaw = journey?.manifestation_intensity ?? setup?.manifestation_intensity;
  const intensity = str(intensityRaw, 32);
  if (intensity && INTENSITY.has(intensity)) setIf("manifestation_intensity", intensity);

  const embody = setup?.embody_active_practices;
  if (Array.isArray(embody)) {
    const slugs = embody.filter((x): x is string => typeof x === "string");
    if (slugs.length > 0) {
      setIf("embody_active_practices", slugs.join(","));
      setIf("embody_active_practices_count", String(slugs.length));
    }
  }

  const cond = safeConditionalBranch(setup?.conditional_specificity);
  if (cond) setIf("conditional_specificity_branch", cond);

  setIf("paywall_id", session.paywall_id);
  setIf("paywall_variant", session.paywall_variant);
  setIf("offering_id", session.offering_id);
  setIf("package_id", session.package_id);
  setIf("product_id", session.product_id);

  return attrs;
}

export async function setRevenueCatSubscriberAttributes(
  appUserId: string,
  attributes: Record<string, string>,
): Promise<{ ok: boolean; status?: number; detail?: string }> {
  const secretKey = getRevenueCatServerSecretKey();
  if (!secretKey || !secretKey.startsWith("sk_")) {
    return { ok: false, detail: "missing_secret_key" };
  }
  if (!appUserId || Object.keys(attributes).length === 0) {
    return { ok: false, detail: "empty_payload" };
  }

  const body = {
    attributes: Object.fromEntries(
      Object.entries(attributes).map(([key, value]) => [key, { value }]),
    ),
  };

  const res = await fetch(
    `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(appUserId)}/attributes`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${secretKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return { ok: false, status: res.status, detail: text.slice(0, 500) };
  }
  return { ok: true, status: res.status };
}

```

---

