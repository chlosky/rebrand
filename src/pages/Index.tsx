import { useEffect, useState } from "react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  MARKETING_PAGE_SHELL_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingHero } from "@/components/marketing/MarketingHero";
import { MarketingToolsStrip } from "@/components/marketing/MarketingToolsStrip";
import { MarketingPracticeTopics } from "@/components/marketing/MarketingPracticeTopics";
import { MarketingStats } from "@/components/marketing/MarketingStats";
import { MarketingTestimonials } from "@/components/marketing/MarketingTestimonials";
import { MarketingAppScreenshotsTicker } from "@/components/marketing/MarketingAppScreenshotsTicker";
import { SHOW_MARKETING_SCREENSHOTS_TICKER } from "@/components/marketing/marketingLayout";
import { MarketingNewsletterSignup } from "@/components/marketing/MarketingNewsletterSignup";
import { MarketingAppDownload } from "@/components/marketing/MarketingAppDownload";
import { MarketingFooter } from "@/components/marketing/MarketingFooter";
import { MarketingStickyDownloadBar } from "@/components/marketing/MarketingStickyDownloadBar";
import { MarketingStoreCtaProvider } from "@/hooks/useMarketingStoreCta";
import { useIsMobile } from "@/hooks/use-mobile";
import { readStoredAttribution } from "@/lib/attribution";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { useMarketingAttribution } from "@/lib/useMarketingAttribution";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { logMarketingHomepageEvent } from "@/lib/logMarketingHomepageEvent";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { scrollToNewsletter } from "@/lib/scrollToNewsletter";
import { logMarketingViewportDebug } from "@/lib/marketingViewportDebug";

const Index = () => {
  const { t } = useMarketingTranslation();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const isMobile = useIsMobile();
  const attribution = useMarketingAttribution();

  useEffect(() => {
    document.title = t("home.meta.title");
    document.querySelector('meta[name="description"]')?.setAttribute("content", t("home.meta.description"));
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", t("home.meta.title"));
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", t("home.meta.ogDescription"));
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", t("home.meta.title"));
    document.querySelector('meta[name="twitter:description"]')?.setAttribute(
      "content",
      t("home.meta.twitterDescription"),
    );
  }, [t]);

  useEffect(() => {
    logMarketingViewportDebug(isMobile);
  }, [isMobile]);

  useEffect(() => {
    trackMarketingConversion("landing_view", {
      page_path: "/",
      content_id: "/",
      content_name: "homepage",
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

  // TikTok / paid social homepage landings: persist attribution on onboarding_sessions
  // before App Store download (browser-only; does not bridge install without email/deep link).
  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;
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
    void ensureOnboardingSessionCreds().catch((err) => {
      console.warn("[Index] attributed onboarding session sync failed:", err);
    });
  }, []);

  useEffect(() => {
    const scrollIfHash = () => {
      if (window.location.hash === "#download-app") {
        requestAnimationFrame(() => scrollToDownloadApp());
      } else if (window.location.hash === "#newsletter") {
        requestAnimationFrame(() => scrollToNewsletter());
      }
    };

    scrollIfHash();
    window.addEventListener("hashchange", scrollIfHash);
    return () => window.removeEventListener("hashchange", scrollIfHash);
  }, []);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) return;
      setUserEmail(user.email || "");
      const { data: profileData } = await supabase
        .from("profiles")
        .select("username, avatar_url")
        .eq("id", user.id)
        .single();

      if (profileData) {
        if (profileData.username) setUsername(profileData.username);
        setAvatarUrl(profileData.avatar_url || "");
      }
    };
    void fetchUserData();
  }, [user]);

  const handleLogout = async () => {
    await supabase.auth.signOut({ scope: "global" });
    await supabase.auth.signOut({ scope: "local" });
    try {
      for (let i = sessionStorage.length - 1; i >= 0; i--) {
        const k = sessionStorage.key(i);
        if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
      }
    } catch {
      /* ignore */
    }
    navigate("/", { replace: true });
  };

  return (
    <main
      className={`relative flex min-h-screen flex-col font-sans antialiased text-neutral-900 ${MARKETING_PAGE_SHELL_CLASS}`}
      style={{
        paddingBottom: isMobile
          ? "calc(5.25rem + env(safe-area-inset-bottom, 0px))"
          : undefined,
      }}
    >
      <div className="relative z-10 flex min-h-screen flex-col">
        <MarketingStoreCtaProvider>
          <MarketingHeader
            user={user}
            isLoading={isLoading}
            username={username}
            avatarUrl={avatarUrl}
            userEmail={userEmail}
            onLogout={handleLogout}
          />
          <MarketingHero user={user} />

          <MarketingToolsStrip />
          {SHOW_MARKETING_SCREENSHOTS_TICKER ? <MarketingAppScreenshotsTicker /> : null}
          <MarketingTestimonials />
          <MarketingPracticeTopics />
          <MarketingStats />
          <MarketingAppDownload />
          <MarketingNewsletterSignup />
          <MarketingFooter />
          {isMobile ? <MarketingStickyDownloadBar /> : null}
        </MarketingStoreCtaProvider>
      </div>
    </main>
  );
};

export default Index;
