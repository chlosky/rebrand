import { Fragment, useEffect, type ReactNode } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { BookImage, Grid3x3, Heart, LayoutGrid, PenLine, Shapes, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  markWebOnboardingMakeMySubliminalCtaClicked,
  recordWebOnboardingSessionStart,
} from "@/lib/webOnboardingSessionInsert";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readSetupDraft } from "@/lib/setupDraft";
import {
  detectInitialAppLocale,
  isAppLocale,
  readStoredPreferredLocale,
  resolveAppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import {
  MARKETING_WEB_ONBOARDING_SETUP_PATH,
  MARKETING_WEB_ONBOARDING_WELCOME_PATH,
} from "@/lib/marketingConversionCopy";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { SETUP_NATIVE_CONTINUE_BTN_CLASS, SETUP_PRIMARY_CTA_CLASS } from "@/lib/onboardingSetupTheme";
import { BOARD_COLORS, type BoardColorKey } from "@/lib/boards/colors";

const WELCOME_LOGO = "/welcome-logo.png";
const WELCOME_APP_ICON = "/apple-ios-logo-hero.png";
const WELCOME_ACCENT = "#a87c84";

const WELCOME_PRIMARY_CTA_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "h-12 rounded-xl text-[15px] font-semibold",
);

const WELCOME_WEB_CTA_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "h-[3.35rem] rounded-full text-[15px] font-bold shadow-[0_8px_28px_rgba(24,24,27,0.12)]",
);

const WELCOME_LANG_SWITCHER_TOP_NATIVE =
  "calc(var(--app-safe-area-top) + ((var(--app-safe-area-top) + 3.75rem - 0.32in) / 2))";
const WELCOME_LANG_SWITCHER_TOP_WEB_MOBILE =
  "calc(env(safe-area-inset-top, 0px) + ((1.5rem - 0.08in) / 2))";
const WELCOME_LANG_SWITCHER_TOP_WEB_DESKTOP = "calc((3.875rem - 0.08in) / 2)";

const WELCOME_AVATAR_VERSION = "genz-v5-webp92";
const WELCOME_COMMUNITY_AVATARS = [
  `/marketing/welcome-avatars/welcome-community-avatar-1.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-2.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-3.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-4.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-5.webp?v=${WELCOME_AVATAR_VERSION}`,
] as const;

const HERO_SWATCHES: { key: BoardColorKey; rotate: number; x: number; y: number; w: number; h: number }[] = [
  { key: "rose_gold", rotate: -16, x: 8, y: 38, w: 44, h: 56 },
  { key: "sky_blue", rotate: 10, x: 28, y: 52, w: 40, h: 50 },
  { key: "yellow", rotate: -8, x: 48, y: 34, w: 42, h: 52 },
  { key: "neon_pink", rotate: 14, x: 66, y: 48, w: 38, h: 48 },
  { key: "light_green", rotate: -12, x: 82, y: 36, w: 40, h: 50 },
];

const AWARD_STAR_CLASS = "h-3 w-3 fill-zinc-300 text-zinc-200";

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets =
    side === "left"
      ? ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"]
      : ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"];
  return (
    <div
      className={cn("flex shrink-0 flex-col justify-center gap-[6px] py-1", side === "left" ? "items-end" : "items-start")}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeAwardLine() {
  const { t } = useTranslation("onboarding");
  return (
    <div
      className="flex w-full items-center justify-center gap-3 px-1"
      aria-label={`${t("welcome.awardLine1")} ${t("welcome.awardLine2")} ${t("welcome.awardLine3")}`}
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[10px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-zinc-500">
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
    <div className="flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2 text-center">
        {toolRows.map((row) => (
          <p key={row[0]} className="font-welcome-serif text-[13px] leading-[1.45] text-zinc-600">
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? <span className="px-1.5 text-zinc-400">·</span> : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function WelcomeLogo() {
  return (
    <div className="mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center">
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={120}
        height={120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeAppIcon() {
  return (
    <div className="mb-1 flex justify-center">
      <img
        src={WELCOME_APP_ICON}
        alt="Palette Plotting"
        className="h-[120px] w-[120px] rounded-[26px] shadow-sm ring-1 ring-zinc-200"
        width={120}
        height={120}
        decoding="sync"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeSwatchFan() {
  return (
    <div className="relative mx-auto h-[7.5rem] w-full max-w-[16rem]" aria-hidden>
      {HERO_SWATCHES.map((s) => {
        const c = BOARD_COLORS[s.key];
        return (
          <span
            key={s.key}
            className="absolute rounded-lg border border-white/70 shadow-[0_8px_20px_rgba(24,24,27,0.1)]"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.w,
              height: s.h,
              transform: `translate(-50%, -50%) rotate(${s.rotate}deg)`,
              background: `linear-gradient(145deg, ${c.fill}, ${c.swatch}99)`,
            }}
          />
        );
      })}
    </div>
  );
}

function WelcomeTitle({ showFreeTrialLine }: { showFreeTrialLine?: boolean }) {
  const { t, i18n } = useTranslation("onboarding");
  const activeLocale = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const hasAccent = i18n.exists("welcome.nativeTitleAccent", { ns: "onboarding", lng: activeLocale });

  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-welcome-serif mt-0 max-w-[20rem] text-center text-[30px] font-normal leading-[1.12] tracking-[-0.02em] text-zinc-900 sm:text-[34px]">
        {hasAccent ? (
          <>
            {t("welcome.nativeTitleLead")}
            <span style={{ color: WELCOME_ACCENT }}>{t("welcome.nativeTitleAccent")}</span>
          </>
        ) : (
          t("welcome.nativeTitle")
        )}
      </h1>
      {showFreeTrialLine ? (
        <p className="font-sans text-[17px] font-medium tracking-[-0.02em] text-zinc-500" style={{ color: WELCOME_ACCENT }}>
          {t("welcome.freeTrialLine")}
        </p>
      ) : null}
    </div>
  );
}

function WelcomeHeadlineWeb() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="text-center">
      <h1 className="font-welcome-serif text-[28px] font-normal leading-[1.1] tracking-[-0.02em] text-zinc-900 sm:text-[32px]">
        {t("welcome.webHeadline1")}
        <br />
        <span className="italic text-zinc-600">{t("welcome.webHeadlineAccent")}</span>
      </h1>
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
    <div className="flex w-full items-center gap-3 rounded-xl border border-zinc-200/80 bg-[#faf8f5] px-3 py-3 shadow-sm">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#f3f0eb] text-zinc-700">
        {icon}
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[13px] font-semibold leading-tight text-zinc-900">{title}</p>
        <p className="mt-0.5 text-[11px] leading-snug text-zinc-500">{subtitle}</p>
      </div>
    </div>
  );
}

function WelcomeStepsWeb() {
  const { t } = useTranslation("onboarding");
  const steps = [
    {
      title: t("welcome.webSteps.desire.title"),
      subtitle: t("welcome.webSteps.desire.subtitle"),
      icon: <LayoutGrid className="h-4 w-4" strokeWidth={1.75} />,
    },
    {
      title: t("welcome.webSteps.makeYours.title"),
      subtitle: t("welcome.webSteps.makeYours.subtitle"),
      icon: <Shapes className="h-4 w-4" strokeWidth={1.75} />,
    },
    {
      title: t("welcome.webSteps.listen.title"),
      subtitle: t("welcome.webSteps.listen.subtitle"),
      icon: <PenLine className="h-4 w-4" strokeWidth={1.75} />,
    },
  ];
  return (
    <div className="flex w-full flex-col gap-2">
      {steps.map((step) => (
        <WelcomeStepCard key={step.title} {...step} />
      ))}
    </div>
  );
}

function WelcomeToolbarWeb() {
  const { t } = useTranslation("onboarding");
  const toolbar = [
    { label: t("welcome.webToolbar.boards"), icon: Grid3x3 },
    { label: t("welcome.webToolbar.clippings"), icon: BookImage },
    { label: t("welcome.webToolbar.structures"), icon: Shapes },
    { label: t("welcome.webToolbar.marks"), icon: PenLine },
  ];
  return (
    <div className="flex w-full items-stretch justify-between gap-1 rounded-xl border border-zinc-200/80 bg-white/80 px-1 py-2 shadow-sm">
      {toolbar.map(({ label, icon: Icon }) => (
        <div key={label} className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-0.5">
          <Icon className="h-3.5 w-3.5 shrink-0 text-zinc-500" strokeWidth={1.65} aria-hidden />
          <span className="text-center text-[8px] font-medium leading-tight text-zinc-500">{label}</span>
        </div>
      ))}
    </div>
  );
}

function WelcomeCommunityProof() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="flex w-full items-center justify-center gap-2 pt-0.5">
      <div className="flex shrink-0 items-center pl-0.5" aria-hidden>
        {WELCOME_COMMUNITY_AVATARS.slice(0, 5).map((src, index) => (
          <div
            key={src}
            className="relative -ml-2 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-zinc-200 bg-white first:ml-0 sm:h-8 sm:w-8"
            style={{ zIndex: 5 - index }}
          >
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" decoding="async" />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Heart className="h-3 w-3 shrink-0 fill-rose-300 text-rose-300" aria-hidden />
        <p className="shrink-0 text-left text-[10px] font-medium leading-[1.2] text-zinc-500">
          {t("welcome.communityProof")}
        </p>
      </div>
    </div>
  );
}

function WelcomeBodyNative() {
  const { t } = useTranslation("onboarding");
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const isIosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-[calc(var(--app-safe-area-top)+1.25rem)] -translate-y-[0.32in]">
      <WelcomeLogo />
      <WelcomeTitle showFreeTrialLine={!isIosNative && !isAndroidNative} />
      <p className="max-w-[21rem] text-center text-[14px] leading-[1.55] text-zinc-600">{t("welcome.nativeDescription")}</p>
      <WelcomeAwardLine />
      <WelcomeFeatureGrid />
    </div>
  );
}

function WelcomeBodyWeb() {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[22rem] flex-col items-center gap-3 pt-1 md:pt-1.5 -translate-y-[0.06in]">
      <WelcomeAppIcon />
      <WelcomeHeadlineWeb />
      <WelcomeSwatchFan />
      <WelcomeStepsWeb />
      <WelcomeToolbarWeb />
      <WelcomeCommunityProof />
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

  useEffect(() => {
    if (isNative) return;
    const recordWelcomeView = () => {
      void ensureOnboardingSessionCreds().catch((err) => {
        console.warn("[Welcome] ensureOnboardingSessionCreds failed:", err);
      });
      const welcomePath = isSuiteWelcome ? "/onboarding/suite/welcome" : MARKETING_WEB_ONBOARDING_WELCOME_PATH;
      recordWebOnboardingSessionStart({ isMobileViewport: isMobile, entryPath: welcomePath });
      trackMarketingConversion("web_onboarding_welcome_view", {
        source: "welcome_page",
        page_path: welcomePath,
      });
    };
    if (!detectInAppBrowser().isInAppBrowser) {
      recordWelcomeView();
      return;
    }
    const timeoutId = window.setTimeout(recordWelcomeView, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [isNative, isMobile, isSuiteWelcome]);

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
  }, [isNative]);

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
    if (!isLoading && user) navigate("/workspace", { replace: true });
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isNative) return;
    void ensureOnboardingSessionCreds().catch(() => {});
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (!cancelled) signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const onContinue = () => {
    if (isNative) {
      navigate("/onboarding/setup/primary-intent");
      return;
    }
    const target = isSuiteWelcome ? "/onboarding/suite/setup/primary-intent" : MARKETING_WEB_ONBOARDING_SETUP_PATH;
    trackMarketingConversion("web_onboarding_click", {
      source: "welcome_page",
      button_label: t("welcome.enterStudio"),
      target_path: target,
    });
    markWebOnboardingMakeMySubliminalCtaClicked();
    navigate(target);
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      continueText={isNative ? t("welcome.signUp") : t("welcome.enterStudio")}
      welcomeCtaSubtext={isNative ? undefined : t("welcome.ctaSubtext")}
      welcomeSoloContinueButtonClassName={isNative ? WELCOME_PRIMARY_CTA_CLASS : WELCOME_WEB_CTA_CLASS}
      contentMaxWidthClass="max-w-[22rem]"
      welcomeLanguageSwitcherTop={isNative ? WELCOME_LANG_SWITCHER_TOP_NATIVE : undefined}
      welcomeLanguageSwitcherTopMobile={isNative ? undefined : WELCOME_LANG_SWITCHER_TOP_WEB_MOBILE}
      welcomeLanguageSwitcherTopDesktop={isNative ? undefined : WELCOME_LANG_SWITCHER_TOP_WEB_DESKTOP}
    >
      {isNative ? <WelcomeBodyNative /> : <WelcomeBodyWeb />}
    </OnboardingLayout>
  );
};

export default Welcome;
