import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  markWebOnboardingMakeMyBoardCtaClicked,
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

const WELCOME_ACCENT = "#a87c84";

const WELCOME_PRIMARY_CTA_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "h-12 rounded-xl text-[15px] font-semibold",
);

const WELCOME_WEB_CTA_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "h-[3.35rem] rounded-xl text-[15px] font-bold shadow-[0_8px_28px_rgba(24,24,27,0.12)]",
);

function WelcomePitch() {
  const { t } = useTranslation("onboarding");
  const pillars = t("welcome.pillars", { returnObjects: true }) as string[];
  return (
    <div className="flex w-full max-w-[21rem] flex-col items-center gap-4 px-1 md:max-w-[32rem]">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {t("welcome.tagline")}
      </p>
      <ul className="flex w-full flex-col gap-2.5 text-center">
        {pillars.map((line) => (
          <li key={line} className="font-sans text-[13px] leading-[1.5] text-zinc-600">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WelcomeTitle({ showFreeTrialLine }: { showFreeTrialLine?: boolean }) {
  const { t, i18n } = useTranslation("onboarding");
  const activeLocale = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const hasAccent = i18n.exists("welcome.nativeTitleAccent", { ns: "onboarding", lng: activeLocale });

  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-welcome-serif mt-0 max-w-[20rem] text-center text-[30px] font-normal leading-[1.12] tracking-[-0.02em] text-zinc-900 sm:max-w-[28rem] sm:text-[34px] md:max-w-[36rem] md:text-[40px]">
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

function WelcomeBodyNative() {
  const { t } = useTranslation("onboarding");
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const isIosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-[calc(var(--app-safe-area-top)+1.25rem)] -translate-y-[0.32in]">
      <WelcomeTitle showFreeTrialLine={!isIosNative && !isAndroidNative} />
      <p className="max-w-[21rem] text-center text-[14px] leading-[1.55] text-zinc-600">{t("welcome.nativeDescription")}</p>
      <WelcomePitch />
    </div>
  );
}

function WelcomeBodyWeb() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-1 md:max-w-xl md:gap-6 md:pt-1.5 lg:max-w-2xl">
      <img
        src="/logo.png"
        alt="Palette Plotting"
        className="mb-1 h-16 w-auto object-contain md:h-20"
        decoding="async"
      />
      <WelcomeTitle />
      <p className="max-w-[21rem] text-center text-[14px] leading-[1.55] text-zinc-600 md:max-w-[32rem] md:text-[15px]">
        {t("welcome.nativeDescription")}
      </p>
      <WelcomePitch />
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
    markWebOnboardingMakeMyBoardCtaClicked();
    navigate(target);
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      continueText={isNative ? t("welcome.signUp") : t("welcome.enterStudio")}
      welcomeCtaSubtext={isNative ? undefined : t("welcome.ctaSubtext")}
      welcomeSoloContinueButtonClassName={isNative ? WELCOME_PRIMARY_CTA_CLASS : WELCOME_WEB_CTA_CLASS}
      contentMaxWidthClass="max-w-[22rem] md:max-w-xl lg:max-w-2xl"
    >
      {isNative ? <WelcomeBodyNative /> : <WelcomeBodyWeb />}
    </OnboardingLayout>
  );
};

export default Welcome;
