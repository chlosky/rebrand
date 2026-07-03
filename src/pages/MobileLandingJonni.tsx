import { useEffect } from "react";
import { Star } from "lucide-react";
import { MarketingHeroCopy } from "@/components/marketing/MarketingHeroCopy";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { MARKETING_LOGO_CLASS } from "@/components/marketing/marketingVisualTheme";
import "@/styles/welcome-web-effects.css";
import "@/styles/setup-bottom-scene.css";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupBottomSceneOverlay } from "@/components/onboarding/SetupBottomSceneOverlay";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MarketingStoreCtaProvider, useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { useIsMobile } from "@/hooks/use-mobile";
import { readStoredAttribution } from "@/lib/attribution";
import { preloadStoreBadgeImagesOnce } from "@/lib/appStore";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { logMarketingHomepageEvent } from "@/lib/logMarketingHomepageEvent";
import { SETUP_TESTIMONIAL_STAR_CLASS } from "@/lib/onboardingSetupTheme";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { useMarketingAttribution } from "@/lib/useMarketingAttribution";
import { cn } from "@/lib/utils";

function HeroAwardLine() {
  const { t } = useMarketingTranslation();
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

function MobileLandingJonniPage() {
  const { t } = useMarketingTranslation();
  const attribution = useMarketingAttribution();
  const cta = useMarketingStoreCta();
  const isMobile = useIsMobile();

  useEffect(() => {
    document.title = t("mobileLanding.meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      t("mobileLanding.meta.description"),
    );
    preloadStoreBadgeImagesOnce();
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
      content_name: "mobile_landing_jonni",
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
        <SetupBottomSceneOverlay className="setup-bottom-scene-overlay--flush-inset" />
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
            <MarketingHeroCopy
              compact
              showFreeTrialLine={false}
              singleLineHeadlines
              pairLastSubheads
              beforeSubheads={<HeroAwardLine />}
            />
          </div>
          <div className="mt-6 w-full max-w-[min(100%,23rem)] self-start">
            <MarketingStoreBadges
              layout="inline"
              size="lg"
              className="justify-start"
              getStoreHref={cta.getStoreHref}
              onStoreClick={(store) => cta.onStoreClick("mobile_landing_jonni_store", store)}
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

export default function MobileLandingJonni() {
  return (
    <MarketingStoreCtaProvider>
      <MobileLandingJonniPage />
    </MarketingStoreCtaProvider>
  );
}
