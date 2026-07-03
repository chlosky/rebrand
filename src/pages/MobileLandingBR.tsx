import { useEffect, type ReactNode } from "react";
import { Star } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  MARKETING_HERO_HEADLINE_CLASS,
  MARKETING_LOGO_CLASS,
  MARKETING_SUBCOPY_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import "@/styles/welcome-web-effects.css";
import "@/styles/setup-bottom-scene.css";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupBottomSceneOverlay } from "@/components/onboarding/SetupBottomSceneOverlay";
import { MarketingStoreCtaProvider, useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { useIsMobile } from "@/hooks/use-mobile";
import { readStoredAttribution } from "@/lib/attribution";
import {
  STORE_BADGE_APPLE_HEIGHT_PX,
  STORE_BADGE_GOOGLE_HEIGHT_PX,
} from "@/lib/appStore";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { logMarketingHomepageEvent } from "@/lib/logMarketingHomepageEvent";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { SETUP_TESTIMONIAL_STAR_CLASS } from "@/lib/onboardingSetupTheme";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { useMarketingAttribution } from "@/lib/useMarketingAttribution";
import { cn } from "@/lib/utils";

const PT_BR = "pt-BR";

const BR_APP_STORE_BADGE_URL =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/pt-br?size=250x83";
const BR_GOOGLE_PLAY_BADGE_URL =
  "https://play.google.com/intl/pt_br/badges/static/images/badges/pt-br_badge_web_generic.png";

const BR_STORE_BADGE_LG_GOOGLE_HEIGHT_PX = 68;
const BR_STORE_BADGE_LG_APPLE_HEIGHT_PX = Math.round(
  (STORE_BADGE_APPLE_HEIGHT_PX / STORE_BADGE_GOOGLE_HEIGHT_PX) * BR_STORE_BADGE_LG_GOOGLE_HEIGHT_PX,
);
const BR_STORE_BADGE_LG_APPLE_WIDTH_PX = Math.round((250 / 83) * BR_STORE_BADGE_LG_APPLE_HEIGHT_PX);
const BR_STORE_BADGE_LG_GOOGLE_WIDTH_PX = Math.round((646 / 250) * BR_STORE_BADGE_LG_GOOGLE_HEIGHT_PX);

const BR_STORE_BADGE_CONTROL_CLASS =
  "inline-flex shrink-0 items-center justify-center overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 outline-none appearance-none [-webkit-appearance:none] [-webkit-tap-highlight-color:transparent] hover:opacity-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:opacity-90";

function MobileLandingBRStoreBadges({
  getStoreHref,
  onStoreClick,
  className,
}: {
  getStoreHref: (store: MobileWebStore) => string;
  onStoreClick: (store: MobileWebStore) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex w-full min-w-0 min-h-[52px] flex-nowrap items-center justify-center gap-2 sm:min-h-[60px] sm:gap-3",
        className,
      )}
      aria-label="Baixar Palette Plotting"
    >
      <a
        href={getStoreHref("apple")}
        className={cn(BR_STORE_BADGE_CONTROL_CLASS, "min-w-0 w-[46%] shrink")}
        rel="noopener noreferrer"
        aria-label="Baixar na App Store"
        onClick={() => onStoreClick("apple")}
      >
        <img
          src={BR_APP_STORE_BADGE_URL}
          alt="Baixar na App Store"
          className="block h-auto w-full max-w-none select-none object-contain object-center"
          width={BR_STORE_BADGE_LG_APPLE_WIDTH_PX}
          height={BR_STORE_BADGE_LG_APPLE_HEIGHT_PX}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
        />
      </a>
      <a
        href={getStoreHref("google")}
        className={cn(BR_STORE_BADGE_CONTROL_CLASS, "w-[52%] shrink-0")}
        rel="noopener noreferrer"
        aria-label="Disponível no Google Play"
        onClick={() => onStoreClick("google")}
      >
        <img
          src={BR_GOOGLE_PLAY_BADGE_URL}
          alt="Disponível no Google Play"
          className="block h-auto w-full max-w-none select-none object-contain object-center"
          width={BR_STORE_BADGE_LG_GOOGLE_WIDTH_PX}
          height={BR_STORE_BADGE_LG_GOOGLE_HEIGHT_PX}
          loading="eager"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
        />
      </a>
    </div>
  );
}

function HeroAwardLine() {
  const { t } = useTranslation("marketing", { lng: PT_BR });
  return (
    <div className="mt-5 flex w-full flex-nowrap items-center gap-2 text-sm font-normal leading-snug text-white sm:text-[15px]">
      <span className="flex shrink-0 gap-0.5" aria-hidden>
        {Array.from({ length: 5 }, (_, i) => (
          <Star key={i} className={cn(SETUP_TESTIMONIAL_STAR_CLASS, "h-3.5 w-3.5 sm:h-4 sm:w-4")} />
        ))}
      </span>
      <span className="whitespace-nowrap text-[clamp(11px,3.1vw+0.42rem,15px)] sm:text-[15px]">
        {t("home.hero.awardLine")}
      </span>
    </div>
  );
}

function MobileLandingHeroCopy({
  beforeSubheads,
}: {
  beforeSubheads?: ReactNode;
}) {
  const { t } = useTranslation("marketing", { lng: PT_BR });
  const lineClass = cn(
    MARKETING_HERO_HEADLINE_CLASS,
    "whitespace-nowrap text-[clamp(1.7rem,4.6vw+0.9rem,2.2rem)] sm:text-[2.2rem]",
    "leading-[1.08]",
  );

  return (
    <div>
      <h1 className="relative z-10 space-y-0.5 sm:space-y-1">
        <span className={cn(lineClass, "block text-white")}>{t("home.hero.manifestEverything")}</span>
        <span className={cn(lineClass, "block text-white")}>
          {t("home.hero.manifestPrefix")}{" "}
          <span
            className="text-[#ff4da6]"
            style={{ textShadow: "0 0 16px rgba(255, 77, 166, 0.55), 0 0 32px rgba(255, 40, 140, 0.22)" }}
          >
            {t("home.hero.loveSp")}
          </span>
        </span>
        <span className={cn(lineClass, "block text-white")}>
          {t("home.hero.manifestPrefix")}{" "}
          <span
            className="text-[#1aff6a]"
            style={{ textShadow: "0 0 16px rgba(26, 255, 106, 0.55), 0 0 32px rgba(0, 200, 80, 0.25)" }}
          >
            {t("home.hero.abundance")}
          </span>
        </span>
        <span className={cn(lineClass, "block text-white")}>
          {t("home.hero.manifestPrefix")}{" "}
          <span
            className="text-[#1ab8ff]"
            style={{ textShadow: "0 0 16px rgba(26, 184, 255, 0.55), 0 0 32px rgba(0, 120, 255, 0.25)" }}
          >
            {t("home.hero.fitness")}
          </span>
        </span>
        <span className={cn(lineClass, "block text-white")}>
          {t("home.hero.manifestPrefix")}{" "}
          <span
            className="text-[#ffe01a]"
            style={{ textShadow: "0 0 16px rgba(255, 224, 26, 0.55), 0 0 32px rgba(255, 180, 0, 0.25)" }}
          >
            {t("home.hero.joy")}
          </span>
        </span>
      </h1>
      <div className="space-y-0.5">
        {beforeSubheads}
        <div
          className={cn(
            MARKETING_SUBCOPY_CLASS,
            "space-y-0.5 text-[14px] leading-relaxed sm:text-[15px]",
            "w-full lg:max-w-2xl",
          )}
        >
          <p className="m-0">{t("mobileLanding.subheadLine")}</p>
        </div>
      </div>
    </div>
  );
}

function MobileLandingBRPage() {
  const { t } = useTranslation("marketing", { lng: PT_BR });
  const attribution = useMarketingAttribution();
  const cta = useMarketingStoreCta();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = t("home.meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      t("home.meta.description"),
    );
    document.documentElement.lang = PT_BR;
    for (const src of [BR_GOOGLE_PLAY_BADGE_URL, BR_APP_STORE_BADGE_URL]) {
      const img = new Image();
      img.decoding = "async";
      img.src = src;
    }
  }, [t]);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    const appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');

    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    html.style.colorScheme = "dark";
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);
    appleStatus?.setAttribute("content", "black-translucent");
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const html = document.documentElement;
    const syncBottomSceneInset = () => {
      const vv = window.visualViewport;
      const viewportGap = vv
        ? Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
        : 0;
      html.style.setProperty(
        "--mobile-landing-bottom-extend",
        `${Math.max(viewportGap, 34)}px`,
      );
    };
    syncBottomSceneInset();
    window.visualViewport?.addEventListener("resize", syncBottomSceneInset);
    window.visualViewport?.addEventListener("scroll", syncBottomSceneInset);
    window.addEventListener("resize", syncBottomSceneInset);
    return () => {
      window.visualViewport?.removeEventListener("resize", syncBottomSceneInset);
      window.visualViewport?.removeEventListener("scroll", syncBottomSceneInset);
      window.removeEventListener("resize", syncBottomSceneInset);
      html.style.removeProperty("--mobile-landing-bottom-extend");
    };
  }, [isMobile]);

  useEffect(() => {
    const pagePath = typeof window !== "undefined" ? window.location.pathname || "/" : "/";
    trackMarketingConversion("landing_view", {
      page_path: pagePath,
      content_id: pagePath,
      content_name: "mobile_landing_br",
      utm_source: attribution?.utmSource ?? "none",
      utm_medium: attribution?.utmMedium ?? "none",
      utm_campaign: attribution?.utmCampaign ?? "none",
      is_paid: Boolean(attribution?.isPaid),
      from_tiktok: Boolean(attribution?.isFromTikTok),
      viewport: isMobile ? "mobile" : "desktop",
    });
    logMarketingHomepageEvent({ eventType: "page_view", isMobileViewport: isMobile });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, []);

  useEffect(() => {
    const stored = readStoredAttribution();
    const touch = stored.last_touch ?? stored.first_touch;
    if (!touch) return;
    const hasCampaign = Boolean(
      touch.utm_source ||
        touch.utm_medium ||
        touch.utm_campaign ||
        touch.utm_content ||
        touch.utm_term ||
        touch.click_id_value,
    );
    if (!hasCampaign) return;
    void ensureOnboardingSessionCreds().catch(() => {
      /* non-fatal */
    });
  }, []);

  return (
    <main
      className="relative flex min-h-[100dvh] flex-col overflow-x-hidden pb-0 font-sans antialiased text-white"
      style={{
        colorScheme: "dark",
        backgroundColor: WELCOME_DEEP_BLACK_BASE,
      }}
    >
      <WelcomeCosmicBackground
        className="pointer-events-none fixed inset-0 z-0"
        tone="deep-black"
      />

      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          background: WELCOME_DEEP_BLACK_BASE,
        }}
        aria-hidden
      />

      <div
        className="pointer-events-none absolute inset-0 z-[1]"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 15% 18%, rgba(255, 77, 166, 0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 42%, rgba(26, 184, 255, 0.1), transparent 50%)",
        }}
      />

      {isMobile ? (
        <SetupBottomSceneOverlay className="setup-bottom-scene-overlay--flush-inlet" />
      ) : null}

      <div className="relative z-10 flex min-h-0 flex-1 flex-col pb-0">
        <header
          className="marketing-header fixed left-0 right-0 z-50 border-b border-white/[0.06] bg-[#020104]/80 backdrop-blur-md transition-colors duration-300"
          style={{ top: "env(safe-area-inset-top, 0px)" }}
        >
          <div className="mx-auto flex max-w-7xl items-center px-4 py-3 sm:px-6 sm:py-4">
            <span className={cn(MARKETING_LOGO_CLASS, "text-lg")}>Palette Plotting</span>
          </div>
        </header>

        <div
          className={cn(
            "relative mx-auto flex w-full max-w-xl flex-col items-start px-4 pt-8",
            "pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]",
          )}
          style={{ paddingTop: "calc(72px + env(safe-area-inset-top, 0px))" }}
        >
          <div className="w-fit max-w-full text-left">
            <MobileLandingHeroCopy beforeSubheads={<HeroAwardLine />} />
          </div>
          <div className="mt-6 w-full max-w-[min(100%,23rem)] self-start">
            <MobileLandingBRStoreBadges
              className="justify-start"
              getStoreHref={cta.getStoreHref}
              onStoreClick={(store) => cta.onStoreClick("mobile_landing_br_store", store)}
            />
          </div>
          <p className="mt-3 w-full self-start whitespace-nowrap text-left text-[17px] font-normal text-white sm:text-[18px]">
            {t("mobileLanding.cta")}
          </p>
        </div>
      </div>
    </main>
  );
}

export default function MobileLandingBR() {
  return (
    <MarketingStoreCtaProvider>
      <MobileLandingBRPage />
    </MarketingStoreCtaProvider>
  );
}
