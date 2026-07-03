# Homepage handoff — Palette Plotting (route `/`, Index.tsx)

Generated: 2026-05-30 19:55
Branch: Mobile-app
Commit: 95f57bbb

---

## src/pages/Index.tsx

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MarketingCosmicBackground, MarketingBottomPinkGlow } from "@/components/marketing/MarketingCosmicBackground";
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
import { useMarketingAttribution } from "@/lib/useMarketingAttribution";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { scrollToNewsletter } from "@/lib/scrollToNewsletter";
import { MARKETING_COSMIC_BASE } from "@/components/marketing/marketingVisualTheme";
import { logMarketingViewportDebug } from "@/lib/marketingViewportDebug";

const Index = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [userEmail, setUserEmail] = useState<string>("");
  const isMobile = useIsMobile();
  const attribution = useMarketingAttribution();

  useEffect(() => {
    logMarketingViewportDebug(isMobile);
  }, [isMobile]);

  useEffect(() => {
    trackMarketingConversion("landing_view", {
      utm_source: attribution?.utmSource ?? "none",
      utm_medium: attribution?.utmMedium ?? "none",
      utm_campaign: attribution?.utmCampaign ?? "none",
      is_paid: Boolean(attribution?.isPaid),
      from_tiktok: Boolean(attribution?.isFromTikTok),
      viewport: isMobile ? "mobile" : "desktop",
    });
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
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
      className="relative flex min-h-screen flex-col font-sans antialiased text-white"
      style={{
        colorScheme: "dark",
        backgroundColor: MARKETING_COSMIC_BASE,
        paddingBottom: isMobile
          ? "calc(5.25rem + env(safe-area-inset-bottom, 0px))"
          : undefined,
      }}
    >
      {/* Site-wide starfield — black + white specks; pink glow only at bottom */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <MarketingCosmicBackground className="absolute inset-0" />
        <MarketingBottomPinkGlow className="fixed inset-x-0 bottom-0 z-0 h-48 sm:h-56" />
      </div>

      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          background: MARKETING_COSMIC_BASE,
        }}
        aria-hidden
      />
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
          <MarketingHero />

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
```

---

## src/components/MarketingSiteHeader.tsx

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { MarketingHeader } from "@/components/marketing/MarketingHeader";
import { MarketingStoreCtaProvider } from "@/hooks/useMarketingStoreCta";

/** Shared marketing nav for web pages (FAQ, blog, legal, login, etc.) — matches homepage header. */
export const MarketingSiteHeader = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [userEmail, setUserEmail] = useState("");

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
    <MarketingStoreCtaProvider>
      <MarketingHeader
        user={user}
        isLoading={isLoading}
        username={username}
        avatarUrl={avatarUrl}
        userEmail={userEmail}
        onLogout={() => void handleLogout()}
      />
      <div
        style={{ height: "calc(72px + env(safe-area-inset-top, 0px))" }}
        aria-hidden
      />
    </MarketingStoreCtaProvider>
  );
};
```

---

## src/components/marketing/MarketingHeader.tsx

```tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronDown, LogIn, LogOut, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TextHelpHeaderBubble } from "@/components/TextHelpHeaderBubble";
import { cn } from "@/lib/utils";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { MARKETING_CTA_DOWNLOAD } from "@/lib/marketingConversionCopy";
import {
  MARKETING_LOGO_CLASS,
  MARKETING_PRIMARY_CTA_CLASS,
} from "@/components/marketing/marketingVisualTheme";

type MarketingHeaderProps = {
  user: { id: string; email?: string } | null;
  isLoading: boolean;
  username: string;
  avatarUrl: string;
  userEmail: string;
  onLogout: () => void;
};

const NAV_LINKS = [
  { label: "Community", href: "/community", route: true },
  { label: "FAQ", href: "/faq", route: true },
] as const;

export function MarketingHeader({
  user,
  isLoading,
  username,
  avatarUrl,
  userEmail,
  onLogout,
}: MarketingHeaderProps) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const cta = useMarketingStoreCta();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 z-40"
        style={{
          height: "env(safe-area-inset-top, 0px)",
          background: "#020102",
        }}
        aria-hidden
      />
      <header
        className={cn(
          "marketing-header fixed left-0 right-0 z-50 transition-colors duration-300",
          scrolled
            ? "border-b border-white/[0.06] bg-[#020102]/85 backdrop-blur-md"
            : "border-b border-transparent bg-transparent",
        )}
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={() => navigate("/")}
            className="shrink-0 text-left transition-opacity hover:opacity-90"
          >
            <span className={cn(MARKETING_LOGO_CLASS, "text-lg")}>Palette Plotting</span>
          </button>

          <nav className="hidden items-center gap-6 lg:flex" aria-label="Main">
            {NAV_LINKS.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => {
                  if ("route" in link && link.route) {
                    e.preventDefault();
                    navigate(link.href);
                  }
                }}
                className="text-sm font-medium text-white/60 transition-colors hover:text-white/90"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              className="inline-flex items-center gap-1 text-sm font-medium text-white/60 transition-colors hover:text-white/90"
              onClick={() => navigate("/blog")}
            >
              Blog
              <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden />
            </button>
          </nav>

          <div className="flex min-w-0 shrink items-center justify-end gap-1 sm:gap-2">
            {!isLoading && user ? (
              <>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="relative h-8 w-8 rounded-full border border-white/15 hover:bg-white/10"
                    >
                      <Avatar className="h-8 w-8">
                        {avatarUrl && <AvatarImage src={avatarUrl} alt={username || userEmail || "User"} />}
                        <AvatarFallback className="bg-white/10 text-sm text-white">
                          {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end">
                    <DropdownMenuLabel>
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium">{username || "User"}</p>
                        <p className="text-xs text-muted-foreground">{userEmail}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => navigate("/dashboard/settings")}>
                      <Settings className="mr-2 h-4 w-4" />
                      Your Account
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={onLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <Button
                  variant="outline"
                  size="sm"
                  className="inline-flex h-8 border-white/20 bg-white/5 px-2.5 text-xs text-white hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
                  onClick={() => navigate("/dashboard")}
                >
                  Dashboard
                </Button>
              </>
            ) : (
              <>
                <span className="hidden md:inline-flex">
                  <TextHelpHeaderBubble variant="on-dark" />
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="inline-flex h-8 shrink-0 px-2.5 text-xs font-medium text-white/65 hover:bg-white/10 hover:text-white sm:px-3 sm:text-sm"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="mr-1.5 h-3.5 w-3.5 sm:mr-2 sm:h-4 sm:w-4" />
                  Sign in
                </Button>
                <Button
                  type="button"
                  size="sm"
                  className={cn(
                    MARKETING_PRIMARY_CTA_CLASS,
                    "hidden h-8 shrink-0 items-center justify-center px-3 text-xs md:inline-flex sm:text-sm",
                  )}
                  onClick={() => cta.onStoreClick("header")}
                >
                  {MARKETING_CTA_DOWNLOAD}
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
```

---

## src/components/marketing/MarketingHero.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeroStaticPhone } from "@/components/marketing/MarketingHeroStaticPhone";
import { MarketingHeroCopy } from "@/components/marketing/MarketingHeroCopy";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import {
  MARKETING_AWARD_LINE,
  MARKETING_CTA_DOWNLOAD,
  MARKETING_CTA_WEB,
  MARKETING_PRICE_LINE,
} from "@/lib/marketingConversionCopy";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { MARKETING_PRIMARY_CTA_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

function HeroStars() {
  return (
    <span className="flex gap-0.5" aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]" />
      ))}
    </span>
  );
}

function HeroAwardLine({ stacked }: { stacked?: boolean }) {
  if (stacked) {
    return (
      <div className="flex flex-col items-center gap-2 text-center text-xs font-normal text-white/65">
        <span className="leading-snug">{MARKETING_AWARD_LINE}</span>
        <HeroStars />
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs font-normal text-white/65">
      <HeroStars />
      <span className="max-w-[14rem] leading-snug sm:max-w-none">{MARKETING_AWARD_LINE}</span>
    </div>
  );
}

export function MarketingHero() {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const showWebSignup = !Capacitor.isNativePlatform();
  const cta = useMarketingStoreCta();

  const onWebOnboardingClick = () => {
    trackMarketingConversion("cta_web_onboarding_click", { source: "hero" });
    navigate("/onboarding/welcome");
  };

  const ctaBlock = showWebSignup ? (
    <div
      className={cn(
        "flex flex-col",
        isMobile ? "items-center gap-2.5 text-center" : "items-start gap-3.5",
      )}
    >
      {isMobile ? (
        <MarketingStoreBadges
          layout="inline"
          size="lg"
          getStoreHref={cta.getStoreHref}
          onStoreClick={(store) => cta.onStoreClick("hero_store_badge", store)}
        />
      ) : (
        <Button
          size="lg"
          className={cn(MARKETING_PRIMARY_CTA_CLASS, "min-w-[14rem] px-8")}
          onClick={() => cta.onStoreClick("hero_primary_desktop")}
        >
          {MARKETING_CTA_DOWNLOAD}
        </Button>
      )}

      <button
        type="button"
        onClick={onWebOnboardingClick}
        className="text-sm font-medium text-white/55 underline-offset-2 transition-colors hover:text-white/80 hover:underline"
      >
        {MARKETING_CTA_WEB}
      </button>

      <p className="text-xs text-white/50 sm:text-sm">{MARKETING_PRICE_LINE}</p>

      <HeroAwardLine stacked={isMobile} />
    </div>
  ) : (
    <Button
      size="lg"
      className={cn(MARKETING_PRIMARY_CTA_CLASS, "px-8")}
      onClick={() => navigate("/what-is-palette-plotting")}
    >
      Explore the app
    </Button>
  );

  return (
    <section
      className={cn("relative text-white", isMobile ? "overflow-visible" : "overflow-hidden")}
      style={{
        paddingTop: isMobile
          ? "calc(72px + env(safe-area-inset-top, 0px))"
          : "calc(72px + env(safe-area-inset-top, 0px))",
        background: "transparent",
      }}
    >
      {isMobile ? (
        /* Mobile — copy → banner → store badges */
        <div className="relative z-20 w-full overflow-visible px-4 pb-9 pt-6 sm:px-6 sm:pb-12 sm:pt-10">
          <MarketingHeroCopy centered compact />
          <div className="mt-3 flex justify-center px-0 sm:mt-5">
            <MarketingHeroStaticPhone />
          </div>
          <div className="mt-3 overflow-visible sm:mt-4">{ctaBlock}</div>
        </div>
      ) : (
        /* Desktop — two column, same voice */
        <div className="relative mx-auto grid max-w-7xl gap-12 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-24 lg:pt-14">
          <div className="relative z-20 min-w-0 max-w-xl">
            <MarketingHeroCopy />
            <div className="mt-8">{ctaBlock}</div>
          </div>
          <div className="relative z-10 flex w-full min-w-0 items-center justify-center overflow-visible lg:justify-end">
            <MarketingHeroStaticPhone size="lg" />
          </div>
        </div>
      )}

    </section>
  );
}
```

---

## src/components/marketing/MarketingHeroCopy.tsx

```tsx
import {
  MARKETING_HEADLINE_ACCENT,
  MARKETING_HEADLINE_LINE1,
  MARKETING_SUBHEAD,
} from "@/lib/marketingConversionCopy";
import {
  MARKETING_DISPLAY_CLASS,
  MARKETING_PINK,
  MARKETING_SUBCOPY_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

type MarketingHeroCopyProps = {
  centered?: boolean;
  /** Tighter subhead spacing (mobile hero). */
  compact?: boolean;
};

/** Hero — Bricolage two-line headline + white subhead (matches ad creative layout). */
export function MarketingHeroCopy({ centered = false, compact = false }: MarketingHeroCopyProps) {
  return (
    <div className={cn(centered && "mx-auto w-full text-center")}>
      <h1
        className={cn(
          MARKETING_DISPLAY_CLASS,
          "relative z-10 text-[2rem] sm:text-[2.5rem] lg:text-[2.85rem]",
          compact ? "leading-[1.06]" : "leading-[1.08]",
          centered && "mx-auto",
        )}
      >
        <span className="block text-white">{MARKETING_HEADLINE_LINE1}</span>
        <span
          className={cn("block", compact ? "mt-0" : "mt-1")}
          style={{ color: MARKETING_PINK }}
        >
          {MARKETING_HEADLINE_ACCENT}
        </span>
      </h1>
      <p
        className={cn(
          MARKETING_SUBCOPY_CLASS,
          compact ? "mt-3" : "mt-4",
          "w-full text-[14px] leading-relaxed sm:text-[15px] lg:max-w-2xl",
          centered && "mx-auto",
        )}
      >
        {MARKETING_SUBHEAD}
      </p>
    </div>
  );
}
```

---

## src/components/marketing/MarketingHeroStaticPhone.tsx

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

const HERO_SLIDES = [
  {
    src: "/marketing/hero-app-showcase.png",
    alt: "Palette Plotting — subliminal maker, affirm and script, and mirror work",
  },
  {
    src: "/marketing/hero-app-showcase-slide-2.png",
    alt: "Palette Plotting — belief work, manifestation milestones, and manifesting guide",
  },
] as const;

const HERO_AUTO_MS = 5000;
/** Mobile hero — transform scale (not clipped) with layout slot sized to match. */
const MOBILE_HERO_SCALE = 1.38;

type MarketingHeroStaticPhoneProps = {
  className?: string;
  size?: "default" | "lg";
};

function heroBannerImgClass(isLarge: boolean) {
  return cn(
    "relative mx-auto block h-auto w-full bg-transparent shadow-none object-contain transition-opacity duration-700 ease-in-out motion-reduce:transition-none",
    isLarge
      ? "origin-center scale-[1.1] object-center max-h-[min(48vh,400px)] lg:max-h-[min(52vh,440px)] lg:scale-[1.12]"
      : "origin-top scale-[1.38] object-contain object-top",
  );
}

/** Hero banner — auto crossfade between showcase slides (no arrows/dots). */
export function MarketingHeroStaticPhone({
  className,
  size = "default",
}: MarketingHeroStaticPhoneProps) {
  const isLarge = size === "lg";
  const [slideIndex, setSlideIndex] = useState(0);
  const [slotHeight, setSlotHeight] = useState(0);
  const activeImgRef = useRef<HTMLImageElement>(null);
  const imgClass = heroBannerImgClass(isLarge);

  const remeasure = useCallback(() => {
    const img = activeImgRef.current;
    if (!img || isLarge) return;
    setSlotHeight(Math.ceil(img.offsetHeight * MOBILE_HERO_SCALE));
  }, [isLarge]);

  useEffect(() => {
    for (const slide of HERO_SLIDES) {
      const img = new Image();
      img.src = slide.src;
    }
  }, []);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      setSlideIndex((i) => (i + 1) % HERO_SLIDES.length);
    }, HERO_AUTO_MS);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (isLarge) return;
    remeasure();
    const img = activeImgRef.current;
    if (!img) return;
    const ro = new ResizeObserver(remeasure);
    ro.observe(img);
    window.addEventListener("resize", remeasure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [isLarge, slideIndex, remeasure]);

  return (
    <div
      className={cn(
        "relative mx-auto w-full max-w-[min(100%,26rem)] select-none overflow-visible bg-transparent sm:max-w-[min(100%,30rem)]",
        isLarge && "max-w-full",
        className,
      )}
      style={!isLarge && slotHeight > 0 ? { minHeight: slotHeight } : undefined}
      aria-roledescription="carousel"
      aria-label="Palette Plotting app showcase"
    >
      {HERO_SLIDES.map((slide, i) => {
        const isActive = i === slideIndex;
        return (
          <img
            key={slide.src}
            ref={isActive ? activeImgRef : undefined}
            src={slide.src}
            alt={isActive ? slide.alt : ""}
            className={cn(
              imgClass,
              isActive
                ? "relative z-[1] opacity-100"
                : "pointer-events-none absolute inset-x-0 top-0 z-0 opacity-0",
            )}
            aria-hidden={!isActive}
            loading={i === 0 ? "eager" : "lazy"}
            fetchPriority={i === 0 ? "high" : undefined}
            decoding="async"
            draggable={false}
            onLoad={isActive ? remeasure : undefined}
          />
        );
      })}
    </div>
  );
}
```

---

## src/components/marketing/MarketingStoreBadges.tsx

```tsx
import {
  APP_STORE_BADGE_WHITE_URL,
  GOOGLE_PLAY_BADGE_URL,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";

type MarketingStoreBadgesProps = {
  /**
   * Native store href per badge (itms-apps / intent in in-app browsers).
   * When set, badges render as `<a>` tags so the WebView handles handoff.
   */
  getStoreHref?: (store: MobileWebStore) => string;
  /** Analytics / desktop routing — must not call preventDefault when used with getStoreHref. */
  onStoreClick?: (store: MobileWebStore) => void;
  className?: string;
  /** Primary placement (hero / download) — eager-loads badge images. */
  size?: "sm" | "lg";
  /** Side-by-side row, centered, no wrap (mobile hero / download). */
  layout?: "wrap" | "inline";
};

/** Apple standard badge height (px). */
const APPLE_BADGE_HEIGHT_PX = 40;
/** Google PNG includes padding — render taller so logo matches Apple visually. */
const GOOGLE_BADGE_HEIGHT_PX = 57;
/** Shared tap target height; both badges vertically centered inside. */
const BADGE_SLOT_HEIGHT_PX = GOOGLE_BADGE_HEIGHT_PX;

const controlClass =
  "inline-flex shrink-0 items-center justify-center overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 outline-none appearance-none [-webkit-appearance:none] [-webkit-tap-highlight-color:transparent] hover:opacity-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:opacity-90";

function badgeContainerClass(layout: MarketingStoreBadgesProps["layout"], className?: string) {
  return cn(
    layout === "inline"
      ? "flex w-full flex-nowrap items-center justify-center gap-4 sm:gap-5"
      : "flex flex-wrap items-center justify-center gap-4 sm:gap-5",
    className,
  );
}

type BadgeControlProps = {
  store: MobileWebStore;
  getStoreHref?: (store: MobileWebStore) => string;
  onStoreClick?: (store: MobileWebStore) => void;
  priority?: boolean;
};

function StoreBadgeControl({ store, getStoreHref, onStoreClick, priority = false }: BadgeControlProps) {
  const isApple = store === "apple";
  const defaultHref = isApple ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
  const href = getStoreHref?.(store) ?? defaultHref;

  const img = (
    <img
      src={isApple ? APP_STORE_BADGE_WHITE_URL : GOOGLE_PLAY_BADGE_URL}
      alt={isApple ? "Download on the App Store" : "Get it on Google Play"}
      className="block max-w-none select-none object-contain object-center"
      style={{
        height: isApple ? APPLE_BADGE_HEIGHT_PX : GOOGLE_BADGE_HEIGHT_PX,
        width: "auto",
        maxHeight: BADGE_SLOT_HEIGHT_PX,
      }}
      width={isApple ? 250 : 646}
      height={isApple ? 83 : 250}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding="async"
      draggable={false}
    />
  );

  const frameStyle = { height: BADGE_SLOT_HEIGHT_PX, minWidth: 0 };
  const label = isApple ? "Download on the App Store" : "Get it on Google Play";

  if (getStoreHref) {
    return (
      <a
        href={href}
        className={controlClass}
        style={frameStyle}
        rel="noopener noreferrer"
        aria-label={label}
        onClick={() => onStoreClick?.(store)}
      >
        {img}
      </a>
    );
  }

  if (onStoreClick) {
    return (
      <button
        type="button"
        onClick={() => onStoreClick(store)}
        className={controlClass}
        style={frameStyle}
        aria-label={label}
      >
        {img}
      </button>
    );
  }

  return (
    <a
      href={defaultHref}
      className={controlClass}
      style={frameStyle}
      rel="noopener noreferrer"
      target="_blank"
      aria-label={label}
    >
      {img}
    </a>
  );
}

export function MarketingStoreBadges({
  getStoreHref,
  onStoreClick,
  className,
  size = "sm",
  layout = "wrap",
}: MarketingStoreBadgesProps) {
  const containerClass = badgeContainerClass(layout, className);
  const priority = size === "lg";

  return (
    <div className={containerClass} aria-label="Download Palette Plotting">
      <StoreBadgeControl
        store="apple"
        getStoreHref={getStoreHref}
        onStoreClick={onStoreClick}
        priority={priority}
      />
      <StoreBadgeControl
        store="google"
        getStoreHref={getStoreHref}
        onStoreClick={onStoreClick}
        priority={priority}
      />
    </div>
  );
}
```

---

## src/components/marketing/MarketingConversionCta.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { isDesktopMarketingWeb } from "@/lib/marketingGetApp";
import {
  MARKETING_CTA_DOWNLOAD,
  MARKETING_CTA_WEB,
  MARKETING_PRICE_LINE,
} from "@/lib/marketingConversionCopy";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import {
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_STICKY_CTA_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

type MarketingConversionCtaProps = {
  variant?: "hero" | "compact" | "sticky";
  className?: string;
  showStoreBadges?: boolean;
  source?: string;
};

export function MarketingConversionCta({
  variant = "hero",
  className,
  showStoreBadges = true,
  source,
}: MarketingConversionCtaProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = isDesktopMarketingWeb(isMobile);
  const isSticky = variant === "sticky";
  const isCompact = variant === "compact";
  const cta = useMarketingStoreCta();
  const ctaSource = source ?? variant;

  const downloadCtaClass = cn(
    isSticky ? MARKETING_STICKY_CTA_CLASS : MARKETING_PRIMARY_CTA_CLASS,
    !isSticky && "w-full max-w-sm sm:max-w-none",
    !isSticky && !isCompact && "lg:min-w-[14rem]",
  );

  return (
    <div
      className={cn(
        "flex flex-col",
        isSticky ? "gap-2" : "items-center gap-3.5 text-center",
        isCompact && "mx-auto w-full max-w-sm",
        !isSticky && !isCompact && "lg:items-start lg:text-left",
        className,
      )}
    >
      {isDesktop ? (
        <Button
          size="lg"
          className={downloadCtaClass}
          onClick={() => cta.onStoreClick(ctaSource)}
        >
          {MARKETING_CTA_DOWNLOAD}
        </Button>
      ) : (
        <Button size="lg" className={downloadCtaClass} asChild>
          <a
            href={cta.primaryStoreHref}
            onClick={() => cta.onStoreClick(ctaSource, cta.primaryStore)}
          >
            {MARKETING_CTA_DOWNLOAD}
          </a>
        </Button>
      )}

      {!isSticky ? (
        <button
          type="button"
          onClick={() => {
            trackMarketingConversion("cta_web_onboarding_click", { source: ctaSource });
            navigate("/onboarding/welcome");
          }}
          className="text-sm font-medium text-[#e8b8cc]/70 underline-offset-2 transition-colors hover:text-[#e8b8cc] hover:underline"
        >
          {MARKETING_CTA_WEB}
        </button>
      ) : null}

      {!isSticky ? (
        <p className="text-xs text-white/50 sm:text-sm">{MARKETING_PRICE_LINE}</p>
      ) : null}

      {showStoreBadges && !isSticky && isDesktop ? (
        <div className="pt-1 lg:text-left">
          <MarketingStoreBadges
            onStoreClick={(store) => cta.onStoreClick(`${ctaSource}_badge`, store)}
          />
        </div>
      ) : null}
    </div>
  );
}
```

---

## src/components/marketing/MarketingStickyDownloadBar.tsx

```tsx
import { Capacitor } from "@capacitor/core";
import { MarketingConversionCta } from "@/components/marketing/MarketingConversionCta";

/** Mobile web: fixed bottom bar — white pill like onboarding, not SaaS pink. */
export function MarketingStickyDownloadBar() {
  if (Capacitor.isNativePlatform()) return null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-[60] border-t border-white/[0.06] bg-[#020102]/92 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md md:hidden"
      role="region"
      aria-label="Download Palette Plotting"
    >
      <div className="w-full">
        <MarketingConversionCta variant="sticky" showStoreBadges={false} source="sticky_bar" />
      </div>
    </div>
  );
}
```

---

## src/components/marketing/MobileStoreFallbackSheet.tsx

```tsx
import { useEffect, useRef, useState } from "react";
import { Copy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { inAppBrowserLabel, type InAppBrowserKind } from "@/lib/inAppBrowserDetection";

type MobileStoreFallbackSheetProps = {
  open: boolean;
  store: MobileWebStore;
  storeUrl: string;
  browserKind: InAppBrowserKind | null;
  isIos: boolean;
  onClose: () => void;
  onTryAgain: () => void;
  onCopy: () => Promise<boolean>;
};

export function MobileStoreFallbackSheet({
  open,
  store,
  storeUrl,
  browserKind,
  isIos,
  onClose,
  onTryAgain,
  onCopy,
}: MobileStoreFallbackSheetProps) {
  const [copied, setCopied] = useState(false);
  const [showUrlFallback, setShowUrlFallback] = useState(false);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setCopied(false);
      setShowUrlFallback(false);
    }
  }, [open]);

  if (!open) return null;

  const browserName = browserKind ? inAppBrowserLabel(browserKind) : "this app";
  const isApple = store === "apple";
  const title = isApple ? "App Store did not open?" : "Play Store did not open?";
  const bodyCopy = isIos
    ? `${browserName} may have blocked the App Store link. Tap copy, then open Safari and paste.`
    : `${browserName} may have blocked the Play Store link. Tap copy, then open Chrome and paste.`;

  const handleCopy = async () => {
    const ok = await onCopy();
    if (ok) {
      setCopied(true);
      return;
    }
    setShowUrlFallback(true);
    requestAnimationFrame(() => {
      urlInputRef.current?.focus();
      urlInputRef.current?.select();
    });
  };

  return (
    <div className="fixed inset-0 z-[70] md:hidden" role="dialog" aria-modal="true" aria-labelledby="store-fallback-title">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-[1px]"
        aria-label="Close"
        onClick={onClose}
      />
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 rounded-t-2xl border border-white/10",
          "bg-[#0a0608]/97 px-4 pt-4 shadow-[0_-12px_40px_rgba(0,0,0,0.45)]",
          "pb-[max(1rem,env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 pr-2">
            <h2 id="store-fallback-title" className="text-base font-semibold text-white">
              {title}
            </h2>
            <p className="mt-1.5 text-sm leading-snug text-white/65">{bodyCopy}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded-md p-1.5 text-white/55 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex flex-col gap-2.5">
          <Button
            type="button"
            size="lg"
            className="h-11 w-full rounded-full bg-white text-sm font-semibold text-[#120810] hover:bg-white/90"
            onClick={onTryAgain}
          >
            {isApple ? "Try opening App Store again" : "Try opening Play Store again"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="lg"
            className="h-11 w-full rounded-full border-white/20 bg-transparent text-sm font-medium text-white hover:bg-white/10"
            onClick={() => void handleCopy()}
          >
            <Copy className="mr-2 h-4 w-4" />
            {copied ? "Copied" : "Copy app link"}
          </Button>

          {showUrlFallback ? (
            <input
              ref={urlInputRef}
              readOnly
              value={storeUrl}
              className="w-full rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/80"
              aria-label="App store link"
            />
          ) : null}

          <p className="text-center text-[11px] leading-snug text-white/45">
            If {browserName} keeps blocking it, open {isIos ? "Safari" : "Chrome"} and paste the copied link.
          </p>
        </div>
      </div>
    </div>
  );
}
```

---

## src/components/marketing/MarketingToolsStrip.tsx

```tsx
import { MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { dashboardFeatures } from "@/lib/featuresData";
import { MarketingManifestPanel } from "@/components/marketing/MarketingManifestPanel";
import { FEATURE_STRIP_ITEMS } from "@/components/marketing/marketingCopy";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { MARKETING_BODY_CLASS, MARKETING_CARD_TITLE_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

const featureByPath = Object.fromEntries(dashboardFeatures.map((f) => [f.path, f]));

const marketingStripIcons: Record<string, LucideIcon> = {
  "/dashboard/your-journey/chat": MessageCircle,
};

const TICKER_MASK =
  "linear-gradient(to bottom, transparent 0%, black 14%, black 88%, transparent 100%)";

const FEATURE_SCROLL_HEIGHT = "min(52vh, 26rem)";

function FeatureScrollCard({
  title,
  description,
  Icon,
}: {
  title: string;
  description: string;
  Icon?: LucideIcon;
}) {
  return (
    <article
      className={cn(
        "flex shrink-0 items-center gap-3 rounded-2xl bg-white/[0.03] px-3 py-3",
      )}
    >
      {Icon ? (
        <div
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]"
          aria-hidden
        >
          <Icon className="h-5 w-5 text-white/90" strokeWidth={1.5} />
        </div>
      ) : null}
      <div className="min-w-0 flex-1 text-left">
        <h3 className={MARKETING_CARD_TITLE_CLASS}>{title}</h3>
        <p className={cn(MARKETING_BODY_CLASS, "mt-0.5 text-sm leading-snug")}>{description}</p>
      </div>
    </article>
  );
}

function FeatureScrollTicker() {
  const loopItems = [...FEATURE_STRIP_ITEMS, ...FEATURE_STRIP_ITEMS];

  return (
    <div
      className="relative w-full overflow-hidden rounded-xl"
      style={{
        height: FEATURE_SCROLL_HEIGHT,
        maskImage: TICKER_MASK,
        WebkitMaskImage: TICKER_MASK,
      }}
    >
      <div
        className={cn(
          "flex flex-col gap-3 motion-reduce:animate-none",
          "animate-marketing-tools-ticker-reverse",
        )}
      >
        {loopItems.map((item, index) => {
          const feature = featureByPath[item.path];
          const Icon = feature?.icon ?? marketingStripIcons[item.path];
          return (
            <FeatureScrollCard
              key={`${item.path}-${index}`}
              title={item.title}
              description={item.description}
              Icon={Icon}
            />
          );
        })}
      </div>
    </div>
  );
}

export function MarketingToolsStrip() {
  return (
    <section id="features" className={marketingHeroSectionClass}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="grid items-start gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(280px,560px)] lg:gap-12 xl:gap-16">
          <div className="flex w-full min-w-0 items-center justify-center">
            <MarketingManifestPanel />
          </div>

          <div className="flex w-full min-w-0 items-start justify-center lg:justify-end">
            <div className="w-full max-w-xl">
              <FeatureScrollTicker />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingManifestPanel.tsx

```tsx
import { MARKETING_DISPLAY_CLASS, MARKETING_PINK, MARKETING_SUBCOPY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

/** Row pairs — left and right cells align on the same row. */
const MANIFEST_ROWS: ReadonlyArray<readonly [string, string | null]> = [
  ["love & sp", "dream body"],
  ["glow up", "wellness"],
  ["self-concept", "discipline"],
  ["money", "focus"],
  ["education", "life reset"],
];

const cellClass = cn(MARKETING_SUBCOPY_CLASS, "text-center");

export function MarketingManifestPanel() {
  return (
    <div className="flex w-full flex-col items-center text-center">
      <h2
        className={cn(
          MARKETING_DISPLAY_CLASS,
          "text-[clamp(1.45rem,5vw,2.35rem)] sm:text-4xl",
        )}
      >
        <span className="block whitespace-nowrap text-white">One app for manifesting</span>
        <span className="mt-1 block whitespace-nowrap" style={{ color: MARKETING_PINK }}>
          what you want
        </span>
      </h2>
      <div
        className="mx-auto mt-5 grid w-full max-w-[min(100%,20rem)] grid-cols-2 items-center justify-items-center gap-x-8 gap-y-2 sm:gap-x-12 sm:gap-y-2.5 lg:max-w-md"
        role="list"
        aria-label="What you can manifest"
      >
        {MANIFEST_ROWS.map(([left, right]) => (
          <div key={left} role="listitem" className="contents">
            <p className={cellClass}>{left}</p>
            {right ? (
              <p className={cellClass}>{right}</p>
            ) : (
              <span className={cellClass} aria-hidden />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

---

## src/components/marketing/MarketingPracticeTopics.tsx

```tsx
import { useNavigate } from "react-router-dom";
import {
  MAIN_FEATURE_PILLS,
  MAIN_FEATURE_SECTION,
} from "@/components/marketing/marketingCopy";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_MANIFEST_PILL_CLASS,
  MARKETING_PINK,
} from "@/components/marketing/marketingVisualTheme";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { cn } from "@/lib/utils";

export function MarketingPracticeTopics() {
  const navigate = useNavigate();

  return (
    <section id="how-it-works" className={marketingHeroSectionClass}>
      <div className="mx-auto flex w-full flex-col items-center px-4 text-center sm:px-6 lg:max-w-xl">
        <h2 className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-3xl lg:text-[2rem]")}>
          <span className="block text-white">{MAIN_FEATURE_SECTION.headlineLine1}</span>
          <span className="mt-1 block" style={{ color: MARKETING_PINK }}>
            {MAIN_FEATURE_SECTION.headlineLine2}
          </span>
        </h2>

        {MAIN_FEATURE_SECTION.body.map((paragraph) => (
          <p key={paragraph.slice(0, 48)} className={cn(MARKETING_BODY_CLASS, "mt-4 w-full text-white lg:max-w-lg")}>
            {paragraph}
          </p>
        ))}

        <div
          className="mt-7 flex w-full flex-wrap justify-center gap-2"
          aria-label="Focus areas"
        >
          {MAIN_FEATURE_PILLS.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() =>
                navigate(`/blog?category=${encodeURIComponent(topic.category)}`)
              }
              className={cn(
                MARKETING_MANIFEST_PILL_CLASS,
                "transition-opacity hover:opacity-90 active:opacity-80",
              )}
              style={{ backgroundColor: MARKETING_PINK }}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingStats.tsx

```tsx
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { MARKETING_BODY_CLASS, MARKETING_DISPLAY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

const STATS = [
  { value: "10+", label: "manifestation tools" },
  { value: "30", label: "subliminals per month" },
  { value: "5", label: "mirror work scenes" },
  { value: "4", label: "AI guide options" },
] as const;

export function MarketingStats() {
  return (
    <section className={marketingHeroSectionClass}>
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-8 px-4 sm:px-6 md:grid-cols-4">
        {STATS.map((stat) => (
          <div key={stat.label} className="text-center">
            <p className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-[1.65rem]")}>{stat.value}</p>
            <p className={cn(MARKETING_BODY_CLASS, "mt-1.5 text-xs lowercase text-white sm:text-sm")}>
              {stat.label}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingTestimonials.tsx

```tsx
import { useCallback, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_PINK,
} from "@/components/marketing/marketingVisualTheme";

const TESTIMONIALS = [
  {
    quote:
      "When I waver and the 3D gets loud af I would ditch my whole SP routine and go hunt for a new method or crashout. Now I script and do mirror work here and actually stay on my storyline instead of scrolling manifest TikTok at 2am.",
    name: "Maya T.",
    role: "SP & self-concept",
  },
  {
    quote:
      "My brain still wants to argue before I even start my robotic affirming. But this app, the teleprompter, and reps counter help me finish my session instead of struggling alone.",
    name: "Devon K.",
    role: "Law of Assumption · scripting",
  },
  {
    quote:
      "YouTube subliminals never hit because it's not my voice or my exact words. I made one here with my affirmations + binaural beats and it's the only one I loop without getting bored in 2 days.",
    name: "Jade L.",
    role: "Subliminals · affirming",
  },
] as const;

const MOBILE_QUOTE_BOX_CLASS = cn(
  MARKETING_BODY_CLASS,
  "mt-3 box-border rounded-[1.75rem] bg-black px-5 py-4 text-left text-[14px] leading-snug text-white/90 ring-1 ring-white/15 sm:text-[15px]",
);

const ARROW_BTN_CLASS =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer select-none items-center justify-center rounded-full border border-white/20 bg-[#020102]/90 text-white shadow-[0_0_12px_rgba(0,0,0,0.5)] outline-none [-webkit-tap-highlight-color:transparent] hover:border-white/35 hover:bg-white/10 active:bg-white/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/30 disabled:opacity-40";

function blurAfterClick(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

function StarRating() {
  return (
    <div className="flex justify-center gap-0.5" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="h-3 w-3 fill-white text-white" />
      ))}
    </div>
  );
}

function TestimonialCard({
  quote,
  name,
  role,
  className,
  quoteBoxMinHeight,
  mobileCarousel = false,
}: {
  quote: string;
  name: string;
  role: string;
  className?: string;
  quoteBoxMinHeight?: number;
  mobileCarousel?: boolean;
}) {
  return (
    <blockquote className={cn("flex flex-col text-center", className)}>
      <StarRating />
      <p
        style={quoteBoxMinHeight ? { minHeight: quoteBoxMinHeight } : undefined}
        className={cn(
          mobileCarousel
            ? MOBILE_QUOTE_BOX_CLASS
            : cn(
                MARKETING_BODY_CLASS,
                "mt-3 flex-1 rounded-[1.75rem] bg-black px-5 py-4 text-left text-[14px] leading-snug text-white/90 ring-1 ring-white/15 sm:text-[15px] md:text-center md:leading-relaxed",
              ),
        )}
      >
        {quote}
      </p>
      <footer className="mt-2.5 shrink-0">
        <cite className="not-italic text-sm font-medium text-white/80">{name}</cite>
        <p className="mt-0.5 text-xs text-white/45">{role}</p>
      </footer>
    </blockquote>
  );
}

function useMobileCarouselHeights() {
  const slotRef = useRef<HTMLDivElement>(null);
  const quoteMeasureRefs = useRef<(HTMLParagraphElement | null)[]>([]);
  const slideMeasureRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [quoteBoxMinHeight, setQuoteBoxMinHeight] = useState(0);
  const [slideMinHeight, setSlideMinHeight] = useState(0);

  const measure = useCallback(() => {
    const quoteHeights = quoteMeasureRefs.current.map((el) => el?.offsetHeight ?? 0);
    const maxQuote = Math.max(0, ...quoteHeights);
    if (maxQuote > 0) setQuoteBoxMinHeight(maxQuote);

    const slideHeights = slideMeasureRefs.current.map((el) => el?.offsetHeight ?? 0);
    const maxSlide = Math.max(0, ...slideHeights);
    if (maxSlide > 0) setSlideMinHeight(maxSlide);
  }, []);

  const setQuoteMeasureRef = useCallback(
    (index: number) => (el: HTMLParagraphElement | null) => {
      quoteMeasureRefs.current[index] = el;
      measure();
    },
    [measure],
  );

  const setSlideMeasureRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      slideMeasureRefs.current[index] = el;
      measure();
    },
    [measure],
  );

  useLayoutEffect(() => {
    measure();
    const slot = slotRef.current;
    if (!slot) return;
    const ro = new ResizeObserver(measure);
    ro.observe(slot);
    return () => ro.disconnect();
  }, [measure]);

  useLayoutEffect(() => {
    if (quoteBoxMinHeight > 0) measure();
  }, [quoteBoxMinHeight, measure]);

  return { slotRef, quoteBoxMinHeight, slideMinHeight, setQuoteMeasureRef, setSlideMeasureRef };
}

/** Mobile carousel: equal-height quote bubbles sized to the longest review. */
function TestimonialsCarousel() {
  const [index, setIndex] = useState(0);
  const count = TESTIMONIALS.length;
  const canNavigate = count > 1;
  const active = TESTIMONIALS[index]!;
  const { slotRef, quoteBoxMinHeight, slideMinHeight, setQuoteMeasureRef, setSlideMeasureRef } =
    useMobileCarouselHeights();

  const goPrev = () => {
    if (!canNavigate) return;
    setIndex((i) => (i === 0 ? count - 1 : i - 1));
  };

  const goNext = () => {
    if (!canNavigate) return;
    setIndex((i) => (i === count - 1 ? 0 : i + 1));
  };

  return (
    <div
      className="mt-6 sm:mt-8 md:hidden"
      aria-label="User testimonials"
      aria-roledescription="carousel"
    >
      <div className="mx-auto flex w-full items-stretch gap-1 sm:gap-2">
        <button
          type="button"
          className={cn(ARROW_BTN_CLASS, "self-center")}
          onClick={(event) => {
            goPrev();
            blurAfterClick(event);
          }}
          disabled={!canNavigate}
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" aria-hidden />
        </button>

        <div ref={slotRef} className="relative min-w-0 flex-1 px-0.5">
          {/* Same width as carousel — measure natural quote box heights */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 -z-10 flex flex-col opacity-0"
            aria-hidden
          >
            {TESTIMONIALS.map((t, i) => (
              <p
                key={`measure-${t.name}`}
                ref={setQuoteMeasureRef(i)}
                className={MOBILE_QUOTE_BOX_CLASS}
              >
                {t.quote}
              </p>
            ))}
          </div>

          <div
            className="grid w-full"
            style={quoteBoxMinHeight > 0 ? { minHeight: quoteBoxMinHeight + 88 } : undefined}
          >
            {TESTIMONIALS.map((t, i) => (
              <div
                key={t.name}
                className={cn(
                  "col-start-1 row-start-1 min-w-0 transition-opacity duration-200",
                  i === index ? "z-10 opacity-100" : "pointer-events-none z-0 opacity-0",
                )}
                aria-hidden={i !== index}
              >
                <TestimonialCard
                  quote={t.quote}
                  name={t.name}
                  role={t.role}
                  mobileCarousel
                  quoteBoxMinHeight={quoteBoxMinHeight > 0 ? quoteBoxMinHeight : undefined}
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          className={cn(ARROW_BTN_CLASS, "self-center")}
          onClick={(event) => {
            goNext();
            blurAfterClick(event);
          }}
          disabled={!canNavigate}
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" aria-hidden />
        </button>
      </div>

      <div
        className="mt-4 flex items-center justify-center gap-2"
        role="tablist"
        aria-label="Testimonial pages"
      >
        {TESTIMONIALS.map((t, i) => (
          <button
            key={t.name}
            type="button"
            role="tab"
            aria-selected={i === index}
            aria-label={`Testimonial ${i + 1}`}
            onClick={(event) => {
              setIndex(i);
              blurAfterClick(event);
            }}
            className={cn(
              "h-2 w-2 rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none",
              i === index ? "bg-white" : "bg-white/30",
            )}
          />
        ))}
      </div>

      <p className="sr-only" aria-live="polite">
        {active.name}, {active.role}
      </p>
    </div>
  );
}

export function MarketingTestimonials() {
  return (
    <section
      id="testimonials"
      className={cn(marketingHeroSectionClass, "!py-10 sm:!py-12 lg:!py-14")}
    >
      <div className="relative mx-auto w-full max-w-7xl overflow-x-clip px-4 sm:px-6">
        <h2
          className={cn(
            MARKETING_DISPLAY_CLASS,
            "text-center text-2xl sm:text-3xl lg:text-[2rem]",
          )}
        >
          <span className="block text-white md:inline">Results from our</span>{" "}
          <span
            className="block md:inline"
            style={{ color: MARKETING_PINK }}
          >
            Users &amp; Testers
          </span>
        </h2>

        <TestimonialsCarousel />
        <div className="mt-8 hidden grid-cols-3 gap-5 md:grid">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.name} quote={t.quote} name={t.name} role={t.role} />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingAppScreenshotsTicker.tsx

```tsx
import { useEffect, useState, type MouseEvent } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { MARKETING_APP_SCREENSHOTS } from "@/components/marketing/marketingAppScreenshots";

const SCREENSHOTS_PER_PAGE = 4;

function chunkScreenshots<T>(items: readonly T[], size: number): T[][] {
  const pages: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    pages.push(items.slice(i, i + size));
  }
  return pages;
}

const SCREENSHOT_PAGES = chunkScreenshots(MARKETING_APP_SCREENSHOTS, SCREENSHOTS_PER_PAGE);

const ARROW_ICON_CLASS =
  "inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/5 sm:h-10 sm:w-10";

const SIDE_ZONE_CLASS =
  "flex min-h-[120px] flex-1 cursor-pointer select-none items-center border-0 bg-transparent text-white outline-none [-webkit-tap-highlight-color:transparent] hover:bg-transparent active:bg-transparent focus:outline-none focus-visible:outline-none sm:min-h-[160px]";

function blurAfterClick(event: MouseEvent<HTMLButtonElement>) {
  event.currentTarget.blur();
}

export function MarketingAppScreenshotsTicker() {
  const [pageIndex, setPageIndex] = useState(0);
  const pageCount = SCREENSHOT_PAGES.length;
  const canNavigate = pageCount > 1;

  useEffect(() => {
    for (const shot of MARKETING_APP_SCREENSHOTS) {
      const img = new Image();
      img.src = shot.src;
    }
  }, []);

  const goPrev = () => {
    if (!canNavigate) return;
    setPageIndex((i) => (i === 0 ? pageCount - 1 : i - 1));
  };

  const goNext = () => {
    if (!canNavigate) return;
    setPageIndex((i) => (i === pageCount - 1 ? 0 : i + 1));
  };

  return (
    <section
      className="relative pb-6 pt-2 sm:pb-8"
      aria-label="Palette Plotting app screenshots"
      aria-roledescription="carousel"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="flex w-full items-stretch">
          <button
            type="button"
            className={cn(SIDE_ZONE_CLASS, "justify-end pr-2 sm:pr-4")}
            onClick={(event) => {
              goPrev();
              blurAfterClick(event);
            }}
            disabled={!canNavigate}
            aria-label="Previous app screenshots"
          >
            <span className={ARROW_ICON_CLASS} aria-hidden>
              <ChevronLeft className="h-5 w-5" />
            </span>
          </button>

          <div className="relative w-3/4 shrink-0">
            {SCREENSHOT_PAGES.map((pageShots, pageNumber) => {
              const isActive = pageNumber === pageIndex;
              return (
                <ul
                  key={pageNumber}
                  className={cn(
                    "grid grid-cols-2 gap-2 sm:grid-cols-4 sm:gap-2.5",
                    isActive
                      ? "relative z-[1] opacity-100"
                      : "pointer-events-none absolute inset-0 z-0 opacity-0",
                  )}
                  aria-hidden={!isActive}
                >
                  {pageShots.map((shot) => (
                    <li key={shot.src} className="min-w-0">
                      <img
                        src={shot.src}
                        alt={isActive ? shot.alt : ""}
                        className="pointer-events-none w-full rounded-xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                        loading="eager"
                        decoding="async"
                        draggable={false}
                      />
                    </li>
                  ))}
                </ul>
              );
            })}
          </div>

          <button
            type="button"
            className={cn(SIDE_ZONE_CLASS, "justify-start pl-2 sm:pl-4")}
            onClick={(event) => {
              goNext();
              blurAfterClick(event);
            }}
            disabled={!canNavigate}
            aria-label="Next app screenshots"
          >
            <span className={ARROW_ICON_CLASS} aria-hidden>
              <ChevronRight className="h-5 w-5" />
            </span>
          </button>
        </div>

        <div className="mt-5 flex items-center justify-center gap-2" role="tablist" aria-label="Screenshot pages">
          {Array.from({ length: pageCount }, (_, i) => (
            <button
              key={i}
              type="button"
              role="tab"
              aria-selected={i === pageIndex}
              aria-label={`Screenshot set ${i + 1}`}
              onClick={(event) => {
                setPageIndex(i);
                blurAfterClick(event);
              }}
              className={cn(
                "h-2 w-2 rounded-full outline-none [-webkit-tap-highlight-color:transparent] focus:outline-none focus-visible:outline-none",
                i === pageIndex ? "bg-white" : "bg-white/30",
              )}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingAppDownload.tsx

```tsx
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { MARKETING_CTA_DOWNLOAD } from "@/lib/marketingConversionCopy";
import { MARKETING_DISPLAY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { cn } from "@/lib/utils";

type QRStatus = "loading" | "ready" | "error";

type StoreQR = {
  label: string;
  href: string;
  alt: string;
};

const STORE_QRS: StoreQR[] = [
  {
    label: "Apple App Store",
    href: PALETTE_PLOTTING_APP_STORE_URL,
    alt: "QR code to open Palette Plotting on the App Store",
  },
  {
    label: "Google Play",
    href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
    alt: "QR code to open Palette Plotting on Google Play",
  },
];

const QR_SIZE_PX = 140;
const QR_DISPLAY_CLASS = "h-28 w-28 sm:h-32 sm:w-32";

function StoreQrCard({
  store,
  dataUrl,
  status,
}: {
  store: StoreQR;
  dataUrl: string;
  status: QRStatus;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs font-semibold tracking-wide text-white/70">{store.label}</p>
      {status === "ready" && dataUrl ? (
        <a
          href={store.href}
          className="inline-block rounded-xl border border-white/15 bg-white p-2.5 shadow-md transition-shadow hover:shadow-lg hover:shadow-pink-500/10"
          rel="noopener noreferrer"
          target="_blank"
        >
          <img
            src={dataUrl}
            alt={store.alt}
            className={QR_DISPLAY_CLASS}
            width={128}
            height={128}
          />
        </a>
      ) : status === "loading" ? (
        <div
          className={`flex items-center justify-center rounded-xl border border-dashed border-white/20 text-xs text-white/50 ${QR_DISPLAY_CLASS}`}
          aria-busy
        >
          …
        </div>
      ) : (
        <p className="text-xs text-white/50">Unavailable</p>
      )}
    </div>
  );
}

function DesktopQrSection() {
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<QRStatus>("loading");

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      STORE_QRS.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: QR_SIZE_PX,
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
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <p className="mt-3 text-sm text-white sm:text-base">Scan with your phone.</p>
      <div className="mt-8 flex w-full flex-col items-center gap-6">
        <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-10">
          {STORE_QRS.map((store) => (
            <StoreQrCard
              key={store.href}
              store={store}
              dataUrl={qrByHref[store.href] ?? ""}
              status={status}
            />
          ))}
        </div>
        {status === "error" ? (
          <p className="text-sm text-white/60">QR codes unavailable. Use the store badges below.</p>
        ) : null}
        <MarketingStoreBadges />
      </div>
    </>
  );
}

function MobileBadgesSection() {
  const cta = useMarketingStoreCta();

  return (
    <>
      <p className="mt-3 text-sm text-white sm:text-base">
        Tap to install on your phone. Web onboarding is also available below.
      </p>
      <div className="mt-7 flex w-full flex-col items-center gap-5">
        <MarketingStoreBadges
          layout="inline"
          size="lg"
          getStoreHref={cta.getStoreHref}
          onStoreClick={(store) => cta.onStoreClick("download_section_badge", store)}
        />
        <button
          type="button"
          onClick={() => {
            trackMarketingConversion("cta_web_onboarding_click", {
              source: "download_section",
            });
            window.location.assign("/onboarding/welcome");
          }}
          className="text-sm font-medium text-[#e8b8cc]/70 underline-offset-2 transition-colors hover:text-[#e8b8cc] hover:underline"
        >
          Continue on web instead
        </button>
      </div>
    </>
  );
}

export function MarketingAppDownload() {
  const isMobile = useIsMobile();

  return (
    <section
      id="download-app"
      className={cn(marketingHeroSectionClass, "scroll-mt-24")}
      aria-labelledby="download-app-heading"
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto flex w-full flex-col items-center text-center lg:max-w-3xl">
          <h2 id="download-app-heading" className={cn(MARKETING_DISPLAY_CLASS, "w-full text-2xl sm:text-3xl")}>
            {MARKETING_CTA_DOWNLOAD}
          </h2>
          {isMobile ? <MobileBadgesSection /> : <DesktopQrSection />}
        </div>
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingNewsletterSignup.tsx

```tsx
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CheckCircle2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { insertEmailCapture } from "@/lib/emailCaptureInsert";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_PRIMARY_CTA_CLASS,
  MARKETING_SOFT_SURFACE_CLASS,
} from "@/components/marketing/marketingVisualTheme";

export function MarketingNewsletterSignup() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);

    try {
      const { error: insertError } = await insertEmailCapture({
        email,
        marketing_consent: true,
        source: "homepage_newsletter",
      });

      if (insertError) throw insertError;

      trackMarketingConversion("newsletter_subscribe", { source: "homepage_newsletter" });
      setIsSuccess(true);
      setEmail("");
    } catch (err: unknown) {
      console.error("[MarketingNewsletterSignup]", err);
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section
      id="newsletter"
      className={cn(marketingHeroSectionClass, "relative overflow-hidden pb-10 sm:pb-12 lg:pb-14")}
      aria-labelledby="newsletter-heading"
    >
      <div className="pointer-events-none absolute inset-0" aria-hidden>
        <div className="absolute left-1/2 bottom-0 h-64 w-full max-w-2xl -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(136,98,158,0.18),transparent_70%)]" />
      </div>

      <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6">
        <div className="mx-auto max-w-xl">
          {isSuccess ? (
            <div className={cn(MARKETING_SOFT_SURFACE_CLASS, "flex flex-col items-center gap-4 text-center")}>
              <CheckCircle2 className="h-10 w-10 text-[#c9a8bc]" aria-hidden />
              <h2 className={cn(MARKETING_DISPLAY_CLASS, "text-xl sm:text-2xl")}>You&apos;re on the list</h2>
              <p className={cn(MARKETING_BODY_CLASS, "text-white")}>
                Thanks for subscribing. Watch your inbox for manifestation tips, new features, and special
                promotions.
              </p>
            </div>
          ) : (
            <div className={cn(MARKETING_SOFT_SURFACE_CLASS, "sm:py-10")}>
              <div className="text-center">
                <h2
                  id="newsletter-heading"
                  className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-3xl")}
                >
                  Tips in your inbox
                </h2>
                <p className={cn(MARKETING_BODY_CLASS, "mt-3 text-white")}>
                  Stay consistent, hear about new features, and get special promotions.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  inputMode="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isSubmitting}
                  className="h-12 flex-1 border-white/10 bg-white/[0.05] text-white placeholder:text-white/35 focus-visible:ring-[#c9a8bc]/40"
                  autoComplete="email"
                  required
                />
                <Button
                  type="submit"
                  disabled={isSubmitting || !email.trim()}
                  className={cn(MARKETING_PRIMARY_CTA_CLASS, "h-12 shrink-0 px-6")}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Subscribing…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>

              {error ? <p className="mt-3 text-sm text-rose-300">{error}</p> : null}

              <p className="mt-4 text-center text-[11px] leading-relaxed text-white/40">
                By subscribing you agree to receive marketing emails from Palette Plotting. Unsubscribe anytime.
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
```

---

## src/components/marketing/MarketingFooter.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { Mail, MapPin, Phone } from "lucide-react";
import {
  MARKETING_SUPPORT_EMAIL,
  MARKETING_SMS_DISPLAY,
  MARKETING_SMS_E164,
} from "@/lib/marketingContact";

const FOOTER_LINK_ROWS = [
  [
    { label: "What is Palette Plotting?", path: "/what-is-palette-plotting" },
    { label: "FAQ", path: "/faq" },
    { label: "Community", path: "/community" },
    { label: "Billing", path: "/billing" },
  ],
  [
    { label: "Terms of Use", path: "/terms" },
    { label: "Privacy Policy", path: "/privacy" },
    { label: "Acceptable Use Policy", path: "/acceptable-use" },
    { label: "Contact", path: "/contact" },
  ],
] as const;

const linkClass =
  "text-sm text-white/65 hover:text-white transition-colors";

function scrollToHash(path: string) {
  const id = path.slice(1);
  const el = document.getElementById(id);
  if (el) {
    el.scrollIntoView({ behavior: "smooth", block: "start" });
    window.history.replaceState(null, "", path);
  }
}

export function MarketingFooter() {
  const navigate = useNavigate();
  const year = new Date().getFullYear();

  const handleLink = (path: string) => {
    if (path.startsWith("#")) {
      scrollToHash(path);
      return;
    }
    navigate(path);
  };

  return (
    <footer className="mt-auto border-t border-white/[0.06] py-12 text-white sm:py-14">
      <div className="mx-auto flex max-w-7xl flex-col items-center px-4 text-center sm:px-6">
        <p className="text-sm font-medium text-white/50">PALETTE PLOTTING LLC</p>
        <p className="mt-2 text-sm text-white/50">© {year} Palette Plotting LLC. All rights reserved.</p>

        <nav className="mx-auto mt-8 flex w-full max-w-3xl flex-col items-center gap-4" aria-label="Footer">
          {FOOTER_LINK_ROWS.map((row) => (
            <ul
              key={row.map((l) => l.path).join("-")}
              className="flex w-full flex-wrap items-center justify-center gap-x-6 gap-y-2"
            >
              {row.map((link) => (
                <li key={link.label}>
                  <button type="button" onClick={() => handleLink(link.path)} className={linkClass}>
                    {link.label}
                  </button>
                </li>
              ))}
            </ul>
          ))}
        </nav>

        <p className="mx-auto mt-8 flex max-w-3xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-white/55">
          <span className="inline-flex items-center gap-1.5">
            <MapPin className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            <span>1 North State Street Ste 1500, Chicago, IL 60602</span>
          </span>
          <span className="text-white/35" aria-hidden>
            ·
          </span>
          <a
            href={`tel:${MARKETING_SMS_E164}`}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Phone className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {MARKETING_SMS_DISPLAY}
          </a>
          <span className="text-white/35" aria-hidden>
            ·
          </span>
          <a
            href={`mailto:${MARKETING_SUPPORT_EMAIL}`}
            className="inline-flex items-center gap-1.5 hover:text-white transition-colors"
          >
            <Mail className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {MARKETING_SUPPORT_EMAIL}
          </a>
        </p>
      </div>
    </footer>
  );
}
```

---

## src/components/marketing/MarketingCosmicBackground.tsx

```tsx
import { MARKETING_COSMIC_BASE } from "@/components/marketing/marketingVisualTheme";

/** Dense white specks — matches App Store / social starfield art. */
const MARKETING_STARS: readonly { x: number; y: number; r: number; o: number }[] = Array.from(
  { length: 168 },
  (_, i) => ({
    x: ((i * 37 + 11) % 99) + 0.5,
    y: ((i * 23 + 7) % 99) + 0.5,
    r: i % 7 === 0 ? 0.24 : i % 4 === 0 ? 0.16 : i % 3 === 0 ? 0.11 : 0.07,
    o: i % 9 === 0 ? 0.95 : i % 5 === 0 ? 0.72 : i % 3 === 0 ? 0.48 : 0.32,
  }),
);

type MarketingCosmicBackgroundProps = {
  className?: string;
};

/** Marketing starfield — true black + white specks only (no pink in header/hero). */
export function MarketingCosmicBackground({ className }: MarketingCosmicBackgroundProps) {
  return (
    <div className={className} aria-hidden>
      <div className="absolute inset-0" style={{ backgroundColor: MARKETING_COSMIC_BASE }} />

      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {MARKETING_STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#ffffff" opacity={star.o} />
        ))}
      </svg>

      <div className="absolute inset-0 bg-[radial-gradient(ellipse_120%_80%_at_50%_40%,transparent_40%,rgba(0,0,0,0.55)_100%)]" />
    </div>
  );
}

/** Fixed bottom pink nebula — sticky bar area only, not hero/header. */
export function MarketingBottomPinkGlow({ className }: { className?: string }) {
  return (
    <div
      className={className}
      aria-hidden
      style={{
        background:
          "radial-gradient(ellipse 90% 100% at 50% 100%, rgba(232, 140, 180, 0.38) 0%, rgba(200, 100, 150, 0.14) 42%, transparent 72%)",
      }}
    />
  );
}
```

---

## src/components/marketing/marketingLayout.ts

```tsx
/** Stacked marketing sections — cosmic shell, no flat SaaS black blocks. */

/** Set true to show the app-screenshots carousel on `/`. */
export const SHOW_MARKETING_SCREENSHOTS_TICKER = false;

export const marketingHeroSectionClass =
  "relative bg-transparent px-4 py-14 text-white sm:px-6 sm:py-16 lg:py-20 scroll-mt-20";

export const marketingHeroCardClass =
  "flex h-full flex-col rounded-2xl bg-white/[0.03] p-5 transition-colors hover:bg-white/[0.05]";

export const marketingHeroIconWellClass =
  "mb-4 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/[0.06]";
```

---

## src/components/marketing/marketingVisualTheme.ts

```tsx
/**
 * Marketing visual tokens — match App Store / social creatives:
 * Bricolage Grotesque headlines, starfield background, real app screenshots, soft pink accent words.
 */

export const MARKETING_ACCENT = "#c9a8bc";
export const MARKETING_ACCENT_SOFT = "#e8b8cc";
/** Headline accent — soft pink from Palette Plotting ad creatives */
export const MARKETING_PINK = "#e8a8c4";
export const MARKETING_COSMIC_BASE = "#020102";

/** Primary CTA — white pill (same as app onboarding). */
export const MARKETING_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100";

export const MARKETING_STICKY_CTA_CLASS =
  "h-12 min-h-[3rem] w-full rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_4px_24px_rgba(0,0,0,0.35)] hover:bg-zinc-50 active:bg-zinc-100";

/** Logo + section headlines — Bricolage Grotesque (brand font). */
export const MARKETING_DISPLAY_CLASS =
  "font-bricolage font-bold leading-[1.08] tracking-[-0.02em] text-white";

export const MARKETING_LOGO_CLASS = "font-bricolage font-bold tracking-[-0.02em] text-white";

/** Feature card / tool row titles on homepage. */
export const MARKETING_CARD_TITLE_CLASS =
  "font-bricolage text-base font-semibold leading-tight tracking-[-0.02em] text-white/90";

/** Subheads under headlines — Satoshi, sentence case, high legibility (not lowercase/lavender). */
export const MARKETING_SUBCOPY_CLASS =
  "font-sans text-[15px] font-normal leading-relaxed text-white/85 sm:text-base sm:leading-relaxed";

export const MARKETING_BODY_CLASS = "font-sans text-sm font-normal leading-relaxed text-white/60 sm:text-base";

export const MARKETING_SOFT_SURFACE_CLASS =
  "rounded-2xl bg-black/40 px-5 py-5 ring-1 ring-white/[0.08] sm:px-6 sm:py-6";

/** Phone mockup ambient glow — purple nebula lift from ad creatives (not pink hearts). */
export const MARKETING_PHONE_GLOW =
  "radial-gradient(ellipse 70% 60% at 50% 55%, rgba(232, 140, 180, 0.28) 0%, transparent 68%)";

/** Manifest topic pills — pink fill, white label, soft white glow. */
export const MARKETING_MANIFEST_PILL_CLASS =
  "inline-flex rounded-full px-4 py-2 font-sans text-sm font-medium text-white shadow-[0_0_16px_rgba(255,255,255,0.4),0_0_28px_rgba(255,255,255,0.15),0_0_12px_rgba(232,168,196,0.35)] ring-1 ring-white/25";
```

---

## src/components/marketing/marketingCopy.ts

```tsx
/** Homepage language aligned with Palette Plotting blog categories and community vocabulary. */

export const FEATURE_STRIP_ITEMS = [
  {
    path: "/dashboard/subliminal",
    title: "Subliminal Maker",
    description:
      "Make subliminals with your own voice, binaural beats, background sounds, and layered vocals.",
  },
  {
    path: "/dashboard/mirror",
    title: "Mirror Work",
    description:
      "Immerse yourself into digital mirror work's scenes and sounds, as you build self-concept with your affirmations.",
  },
  {
    path: "/dashboard/affirmations-builder",
    title: "Robotic Affirm & Script Your Life",
    description:
      "Have your custom affirmations shown on a teleprompter-like screen, count your reps, and visualize.",
  },
  {
    path: "/dashboard/refactor",
    title: "Address Self-Limiting Beliefs",
    description:
      "Deconstruct self-limiting beliefs and integrate expansionary beliefs.",
  },
  {
    path: "/dashboard/your-journey",
    title: "Journal & Track",
    description:
      "Journal, document inspired action, and track your progress with manifesting lists.",
  },
  {
    path: "/dashboard/your-journey/chat",
    title: "Digital Manifesting Coach",
    description:
      "Ask questions you're scared to ask anyone else, and get advice when you're wavering due to 3D circumstances.",
  },
] as const;

export const MAIN_FEATURE_SECTION = {
  eyebrow: "One desire. One story.",
  headlineLine1: "Everything you need for",
  headlineLine2: "the new story",
  body: [
    "Palette Plotting brings your manifestation into one place — so you are not juggling notes, random subliminal playlists, screenshots, voice memos, journals, and scattered methods when doubt shows up.",
    "Use it to write the story, hear it, see it, repeat it, and live in the end.",
  ],
  cta: "Start now",
} as const;

export const MAIN_FEATURE_PILLS = [
  { label: "Self-concept", category: "Self Concept" },
  { label: "SP & love", category: "Manifesting an SP" },
  { label: "Abundance", category: "Law of Assumption" },
  { label: "Confidence", category: "Self Concept" },
  { label: "Beauty", category: "Self Concept" },
] as const;

export const PRACTICE_TOPICS = [
  { label: "Self concept", category: "Self Concept" },
  { label: "Law of Assumption", category: "Law of Assumption" },
  { label: "Manifesting an SP", category: "Manifesting an SP" },
  { label: "Subliminals", category: "Subliminals" },
  { label: "Mirror work", category: "Mirror Work" },
  { label: "Integrated tools", category: "Integrated Manifestation Tools" },
] as const;

/** Marketing blurbs for dashboard tools (blog tone; does not change in-app feature copy). */
export const MARKETING_TOOL_BLURBS: Record<string, string> = {
  "/dashboard/subliminal":
    "Use your own voice, background sounds, binaural beats (like theta waves), and stack your vocals.",
  "/dashboard/mirror":
    "Immerse yourself into different scenes and sounds, while viewing and saying your affirmations.",
  "/dashboard/affirmations-builder":
    "Put your affirmations on loop against visuals connected to your desires. Robotic affirmations, script your life and visualize. Includes an affirmations counter.",
  "/dashboard/refactor":
    "Deconstruct self limiting beliefs with logic and eliminate them from your mental diet.",
  "/dashboard/your-journey":
    "Document your desires on a weekly basis and track how well you have been manifesting them.",
  "/dashboard/your-journey/chat":
    "Manifesting Q&A, advice when you waver, and support for your goals.",
};
```

---

## src/components/marketing/marketingAppScreenshots.ts

```tsx
/** App Store–style promo panels for the homepage screenshot ticker. */
export const MARKETING_APP_SCREENSHOTS = [
  {
    src: "/marketing/app-screenshots/01-manifest-everything.png",
    alt: "Manifest love, abundance, success, and joy with Palette Plotting",
  },
  {
    src: "/marketing/app-screenshots/02-all-in-one-place.png",
    alt: "Affirmations, subliminals, mirror work, belief work, and more in one app",
  },
  {
    src: "/marketing/app-screenshots/03-subliminal-maker.png",
    alt: "Create intense subliminals with your own voice",
  },
  {
    src: "/marketing/app-screenshots/04-affirm-and-script.png",
    alt: "Script your life and live in the end with affirmations",
  },
  {
    src: "/marketing/app-screenshots/05-belief-work.png",
    alt: "Disrupt self-limiting beliefs and integrate positive ones",
  },
  {
    src: "/marketing/app-screenshots/06-journey-tracking.png",
    alt: "Track persistence and inspired action on your journey",
  },
  {
    src: "/marketing/app-screenshots/07-choose-guide.png",
    alt: "Ask an AI manifesting guide questions anytime",
  },
  {
    src: "/marketing/app-screenshots/08-mirror-work.png",
    alt: "Build self-concept with immersive mirror work",
  },
] as const;
```

---

## src/lib/marketingConversionCopy.ts

```tsx
/** Shared marketing copy — full app breadth, aligned with App Store / social creatives. */

/** White line, then pink accent line (see MarketingHeroCopy). */
export const MARKETING_HEADLINE_LINE1 = "Your New Method for";
export const MARKETING_HEADLINE_ACCENT = "Manifesting Everything";

export const MARKETING_SUBHEAD =
  "Subliminals + Robotic Affirming & Scripting + Mirror Work + Belief Work + Digital Manifesting Coach + More";

export const MARKETING_AWARD_LINE = "One of the most comprehensive manifesting apps";

/** Pricing — keep in sync with src/pages/PricingPlans.tsx */
export const MARKETING_PRICE_LINE = "From $5.99/wk · $19.99/mo";

export const MARKETING_CTA_DOWNLOAD = "Download the app";
export const MARKETING_CTA_DOWNLOAD_IOS = "Download the app";
export const MARKETING_CTA_DOWNLOAD_ANDROID = "Download the app";
export const MARKETING_CTA_WEB = "Continue on web instead";
export const MARKETING_CTA_WEB_SETUP = "~3 min set up · no card to browse";
```

---

## src/lib/useMarketingAttribution.ts

```tsx
import { useEffect, useMemo, useState } from "react";

/**
 * Marketing attribution: read UTM params on mount, persist for the session,
 * and expose convenience flags (`isPaid`, `isFromTikTok`) for analytics only.
 * The homepage layout is identical for all visitors.
 *
 * Persists in sessionStorage so back-navigation / hash changes / route
 * changes during the session keep the attribution.
 */

const ATTRIBUTION_KEY = "marketing_attribution_v1";

const PAID_SOURCES = new Set([
  "tiktok",
  "tiktok-ads",
  "tiktokads",
  "tt",
  "facebook",
  "fb",
  "meta",
  "instagram",
  "ig",
  "snap",
  "snapchat",
  "reddit",
  "google-ads",
  "googleads",
  "youtube-ads",
  "pinterest-ads",
  "linkedin-ads",
]);

const PAID_MEDIUMS = new Set([
  "paid",
  "cpc",
  "ppc",
  "ads",
  "ad",
  "social-paid",
  "paid-social",
  "paidsocial",
  "display",
  "video",
]);

export type MarketingAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landing: string;
  at: string;
  /** True when source/medium look like a paid ad placement. */
  isPaid: boolean;
  isFromTikTok: boolean;
};

function readPersisted(): MarketingAttribution | null {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarketingAttribution>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmContent: parsed.utmContent ?? null,
      utmTerm: parsed.utmTerm ?? null,
      landing: parsed.landing ?? "/",
      at: parsed.at ?? new Date().toISOString(),
      isPaid: Boolean(parsed.isPaid),
      isFromTikTok: Boolean(parsed.isFromTikTok),
    };
  } catch {
    return null;
  }
}

function classify(source: string | null, medium: string | null) {
  const src = (source ?? "").toLowerCase().trim();
  const med = (medium ?? "").toLowerCase().trim();
  const isFromTikTok = src.includes("tiktok") || src === "tt";
  const isPaid = PAID_SOURCES.has(src) || PAID_MEDIUMS.has(med) || med.startsWith("paid");
  return { isPaid, isFromTikTok };
}

function readFromLocation(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const utmTerm = params.get("utm_term");

    if (!utmSource && !utmMedium && !utmCampaign) return null;

    const { isPaid, isFromTikTok } = classify(utmSource, utmMedium);

    return {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      landing: window.location.pathname || "/",
      at: new Date().toISOString(),
      isPaid,
      isFromTikTok,
    };
  } catch {
    return null;
  }
}

function persist(attribution: MarketingAttribution) {
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
}

export function useMarketingAttribution(): MarketingAttribution | null {
  const initial = useMemo(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = readFromLocation();
    if (fromUrl) {
      persist(fromUrl);
      return fromUrl;
    }
    return readPersisted();
  }, []);

  const [attribution, setAttribution] = useState<MarketingAttribution | null>(initial);

  useEffect(() => {
    const onPop = () => {
      const fromUrl = readFromLocation();
      if (fromUrl) {
        persist(fromUrl);
        setAttribution(fromUrl);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return attribution;
}

/** Read attribution outside React (e.g. inside event handlers or libs). */
export function readMarketingAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  const fromUrl = readFromLocation();
  if (fromUrl) {
    persist(fromUrl);
    return fromUrl;
  }
  return readPersisted();
}
```

---

## src/hooks/useMarketingStoreCta.tsx

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MobileStoreFallbackSheet } from "@/components/marketing/MobileStoreFallbackSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getMobileWebStore,
  handleStoreClick,
  isDesktopMarketingWeb,
  shouldScheduleStoreFallback,
  type MobileWebStore,
  type StoreClickResult,
} from "@/lib/marketingGetApp";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scheduleStoreFallbackCheck, type StoreFallbackScheduleHandle } from "@/lib/mobileStoreFallbackScheduler";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

type FallbackState = {
  store: MobileWebStore;
  storeUrl: string;
  source: string;
};

export type UseStoreCtaResult = {
  detection: InAppBrowserDetection;
  getStoreHref: (store: MobileWebStore) => string;
  primaryStoreHref: string;
  primaryStore: MobileWebStore;
  onStoreClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
  /** @deprecated use onStoreClick */
  onCtaClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
};

type ProviderState = UseStoreCtaResult & {
  fallbackOpen: boolean;
  fallbackState: FallbackState | null;
  closeFallback: () => void;
  tryAgain: () => void;
  copyStoreLink: () => Promise<boolean>;
};

const MarketingStoreCtaContext = createContext<UseStoreCtaResult | null>(null);

function useMarketingStoreCtaInternal(isMobileViewport: boolean): ProviderState {
  const [detection, setDetection] = useState<InAppBrowserDetection>(() => detectInAppBrowser());
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackState, setFallbackState] = useState<FallbackState | null>(null);
  const fallbackTimerRef = useRef<StoreFallbackScheduleHandle | null>(null);

  useEffect(() => {
    const next = detectInAppBrowser();
    setDetection(next);
    logStoreHandoff("detection_ready", {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      in_app_browser: next.kind ?? "none",
      blocks_app_store: next.blocksAppStore,
      platform: next.isIos ? "ios" : next.isAndroid ? "android" : "unknown",
    });
  }, []);

  const cancelFallbackTimer = useCallback((reason: string) => {
    fallbackTimerRef.current?.cancel(reason);
    fallbackTimerRef.current = null;
  }, []);

  const closeFallback = useCallback(() => {
    setFallbackOpen(false);
    setFallbackState(null);
  }, []);

  const openFallback = useCallback((state: FallbackState) => {
    setFallbackState(state);
    setFallbackOpen(true);
    trackMarketingConversion("in_app_prompt_shown", {
      source: state.source,
      store: state.store,
    });
    logStoreHandoff("fallback_sheet_opened", {
      source: state.source,
      store: state.store,
      storeUrl: state.storeUrl,
    });
  }, []);

  const scheduleFallback = useCallback(
    (store: MobileWebStore, source: string) => {
      if (!shouldScheduleStoreFallback(isMobileViewport, detection)) return;

      cancelFallbackTimer("reschedule");
      const copyUrl = getCopyableStoreUrl(store);

      fallbackTimerRef.current = scheduleStoreFallbackCheck({
        meta: { source, store },
        onShow: () => openFallback({ store, storeUrl: copyUrl, source }),
      });
    },
    [cancelFallbackTimer, detection, isMobileViewport, openFallback],
  );

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  const primaryStore = useMemo(
    () => getMobileWebStore() ?? ("apple" as MobileWebStore),
    [],
  );

  const primaryStoreHref = useMemo(
    () => getMobileStoreHref(primaryStore, detection),
    [detection, primaryStore],
  );

  const onStoreClick = useCallback(
    (source: string, forceStore?: MobileWebStore) => {
      const isDesktop = isDesktopMarketingWeb(isMobileViewport);
      const result = handleStoreClick({
        isMobileViewport,
        forceStore,
        source,
        detection,
        navigate: isDesktop,
      });

      if (!isDesktop && result.kind === "opened_store") {
        scheduleFallback(result.store, source);
      }

      return result;
    },
    [detection, isMobileViewport, scheduleFallback],
  );

  const tryAgain = useCallback(() => {
    if (!fallbackState) return;
    trackMarketingConversion("in_app_open_in_browser", {
      source: fallbackState.source,
      store: fallbackState.store,
      action: "try_again",
    });
    openMobileStoreViaAnchor(fallbackState.store, detection);
    scheduleFallback(fallbackState.store, fallbackState.source);
  }, [detection, fallbackState, scheduleFallback]);

  const copyStoreLink = useCallback(async (): Promise<boolean> => {
    if (!fallbackState) return false;
    try {
      await navigator.clipboard.writeText(fallbackState.storeUrl);
      trackMarketingConversion("in_app_copy_link", {
        source: fallbackState.source,
        store: fallbackState.store,
      });
      return true;
    } catch {
      return false;
    }
  }, [fallbackState]);

  useEffect(() => () => cancelFallbackTimer("unmount"), [cancelFallbackTimer]);

  return {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick: onStoreClick,
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
  };
}

export function MarketingStoreCtaProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const state = useMarketingStoreCtaInternal(isMobile);
  const {
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  } = state;

  const ctxValue: UseStoreCtaResult = {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  };

  return (
    <MarketingStoreCtaContext.Provider value={ctxValue}>
      {children}
      {!isDesktopMarketingWeb(isMobile) && fallbackState ? (
        <MobileStoreFallbackSheet
          open={fallbackOpen}
          store={fallbackState.store}
          storeUrl={fallbackState.storeUrl}
          browserKind={state.detection.kind}
          isIos={state.detection.isIos}
          onClose={closeFallback}
          onTryAgain={tryAgain}
          onCopy={copyStoreLink}
        />
      ) : null}
    </MarketingStoreCtaContext.Provider>
  );
}

export function useMarketingStoreCta(): UseStoreCtaResult {
  const ctx = useContext(MarketingStoreCtaContext);
  if (!ctx) {
    throw new Error("useMarketingStoreCta must be used within MarketingStoreCtaProvider");
  }
  return ctx;
}
```

---

## src/hooks/use-mobile.tsx

```tsx
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  /** Initialize from viewport on first paint so native WebView (Mirror Work, etc.) never runs a "desktop" frame at phone width. */
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
```

---

## src/lib/marketingGetApp.ts

```tsx
import { Capacitor } from "@capacitor/core";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scrollToDownloadApp } from "@/lib/scrollToDownloadApp";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

export type MobileWebStore = "apple" | "google";

/** User-agent store hint for mobile browsers (not Capacitor native). */
export function getMobileWebStore(): MobileWebStore | null {
  if (typeof navigator === "undefined") return null;
  const ua = navigator.userAgent;
  if (/Android/i.test(ua)) return "google";
  if (/iPhone|iPad|iPod/i.test(ua)) return "apple";
  return null;
}

/** Desktop web = browser, wide viewport — show QR section instead of a store link. */
export function isDesktopMarketingWeb(isMobileViewport: boolean): boolean {
  return !Capacitor.isNativePlatform() && !isMobileViewport;
}

export type StoreClickResult =
  | { kind: "scrolled_to_qr" }
  | { kind: "opened_store"; store: MobileWebStore; url: string; copyUrl: string };

type StoreClickOptions = {
  isMobileViewport: boolean;
  forceStore?: MobileWebStore;
  source?: string;
  detection?: InAppBrowserDetection;
  /** When false, only track — navigation is handled by a native `<a href>`. */
  navigate?: boolean;
};

function readClickAttributionDetail(): Record<string, string | number | boolean | undefined> {
  const attribution = readMarketingAttribution();
  let ttclid: string | undefined;
  try {
    ttclid = new URLSearchParams(window.location.search).get("ttclid") ?? undefined;
  } catch {
    /* ignore */
  }
  return {
    utm_source: attribution?.utmSource ?? undefined,
    utm_medium: attribution?.utmMedium ?? undefined,
    utm_campaign: attribution?.utmCampaign ?? undefined,
    utm_content: attribution?.utmContent ?? undefined,
    utm_term: attribution?.utmTerm ?? undefined,
    is_paid: Boolean(attribution?.isPaid),
    from_tiktok: Boolean(attribution?.isFromTikTok),
    ttclid,
  };
}

export function trackStoreClick(
  store: MobileWebStore,
  source: string | undefined,
  detection: InAppBrowserDetection,
): { href: string; copyUrl: string } {
  const href = getMobileStoreHref(store, detection);
  const copyUrl = getCopyableStoreUrl(store);
  const action = store === "apple" ? "cta_app_store_click" : "cta_play_store_click";

  trackMarketingConversion(action, {
    source: source ?? "unknown",
    in_app_browser: detection.kind ?? "none",
    blocks_app_store: detection.blocksAppStore,
    store_href_scheme: href.split(":")[0],
    ...readClickAttributionDetail(),
  });

  logStoreHandoff("store_click_tracked", {
    source: source ?? "unknown",
    store,
    href,
    userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
    in_app_browser: detection.kind ?? "none",
    platform: detection.isIos ? "ios" : detection.isAndroid ? "android" : "unknown",
  });

  return { href, copyUrl };
}

/**
 * Centralized "user wants the app" handler.
 * Desktop → scroll to QR. Mobile → track (+ optional programmatic open).
 */
export function handleStoreClick(opts: StoreClickOptions): StoreClickResult {
  const { isMobileViewport, forceStore, source, navigate = true } = opts;
  const detection = opts.detection ?? detectInAppBrowser();

  if (isDesktopMarketingWeb(isMobileViewport)) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section",
      source: source ?? "unknown",
      ...readClickAttributionDetail(),
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const store =
    forceStore ??
    getMobileWebStore() ??
    (isMobileViewport ? ("apple" as MobileWebStore) : null);
  if (!store) {
    trackMarketingConversion("cta_header_app_click", {
      destination: "qr_section_fallback",
      source: source ?? "unknown",
      ...readClickAttributionDetail(),
    });
    scrollToDownloadApp();
    return { kind: "scrolled_to_qr" };
  }

  const { href, copyUrl } = trackStoreClick(store, source, detection);

  if (navigate) {
    openMobileStoreViaAnchor(store, detection);
  }

  return { kind: "opened_store", store, url: href, copyUrl };
}

/** Legacy single-arg handler kept for back-compat with existing callers. */
export function handleMarketingGetAppClick(isMobileViewport: boolean): void {
  handleStoreClick({ isMobileViewport, source: "legacy" });
}

/** Whether a post-tap fallback sheet should be scheduled for this visit. */
export function shouldScheduleStoreFallback(
  isMobileViewport: boolean,
  detection: InAppBrowserDetection,
): boolean {
  if (!isMobileViewport || isDesktopMarketingWeb(isMobileViewport)) return false;
  if (!detection.isInAppBrowser) return false;
  return detection.blocksAppStore || detection.kind !== null;
}
```

---

## src/lib/mobileStoreHandoff.ts

```tsx
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import type { InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import type { MobileWebStore } from "@/lib/marketingGetApp";

export const PALETTE_PLOTTING_APP_STORE_ID = "6759469696";
export const PALETTE_PLOTTING_ANDROID_PACKAGE = "com.paletteplotting.app";

/** Opens App Store app on iOS — preferred over https in embedded WebViews. */
export const ITMS_APP_STORE_URL = `itms-apps://itunes.apple.com/app/id${PALETTE_PLOTTING_APP_STORE_ID}`;

function buildAndroidPlayIntentUrl(fallbackHttps: string): string {
  const encodedFallback = encodeURIComponent(fallbackHttps);
  return `intent://play.google.com/store/apps/details?id=${PALETTE_PLOTTING_ANDROID_PACKAGE}#Intent;scheme=https;package=com.android.vending;S.browser_fallback_url=${encodedFallback};end`;
}

/**
 * Best href for a store badge / CTA on this device.
 *
 * In TikTok / Meta / IG WebViews, plain https store URLs often do nothing.
 * Native schemes (`itms-apps://`, Play `intent://`) on a real `<a>` tap are
 * the standard handoff — no instruction sheets required.
 */
export function getMobileStoreHref(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): string {
  const inRestrictedWebView = Boolean(detection?.isInAppBrowser && detection.blocksAppStore);

  if (store === "apple") {
    if (inRestrictedWebView && detection?.isIos) return ITMS_APP_STORE_URL;
    return PALETTE_PLOTTING_APP_STORE_URL;
  }

  if (inRestrictedWebView && detection?.isAndroid) {
    return buildAndroidPlayIntentUrl(PALETTE_PLOTTING_GOOGLE_PLAY_URL);
  }
  return PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** HTTPS URL for clipboard — always paste-friendly in Safari/Chrome. */
export function getCopyableStoreUrl(store: MobileWebStore): string {
  return store === "apple" ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** Fallback when a button (not an anchor) triggers store open — clicks a transient link. */
export function openMobileStoreViaAnchor(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): void {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = getMobileStoreHref(store, detection);
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}
```

---

## src/lib/mobileStoreHandoffDebug.ts

```tsx
type StoreHandoffDebugPayload = Record<string, string | number | boolean | null | undefined>;

const DEBUG_QUERY = "debug=store";
const DEBUG_STORAGE_KEY = "marketing_store_debug";

export function isStoreHandoffDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  if (import.meta.env.DEV) return true;
  try {
    if (window.location.search.includes(DEBUG_QUERY)) return true;
    if (localStorage.getItem(DEBUG_STORAGE_KEY) === "1") return true;
  } catch {
    /* ignore */
  }
  return false;
}

export function logStoreHandoff(event: string, payload?: StoreHandoffDebugPayload): void {
  if (!isStoreHandoffDebugEnabled()) return;
  console.log("[store-handoff]", event, payload ?? {});
}
```

---

## src/lib/mobileStoreFallbackScheduler.ts

```tsx
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";

export const STORE_FALLBACK_DELAY_MS = 900;

type ScheduleStoreFallbackOptions = {
  onShow: () => void;
  meta?: Record<string, string | undefined>;
};

export type StoreFallbackScheduleHandle = {
  cancel: (reason: string) => void;
};

export function scheduleStoreFallbackCheck(
  options: ScheduleStoreFallbackOptions,
): StoreFallbackScheduleHandle {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (reason: string) => {
    if (cancelled) return;
    cancelled = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("blur", onBlur);
    logStoreHandoff("fallback_cancelled", { reason, ...options.meta });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      cancel("visibilitychange");
    }
  };

  const onPageHide = () => cancel("pagehide");
  const onBlur = () => cancel("blur");

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("blur", onBlur);

  logStoreHandoff("fallback_timer_started", {
    delay_ms: STORE_FALLBACK_DELAY_MS,
    ...options.meta,
  });

  timer = setTimeout(() => {
    if (cancelled) return;
    if (document.visibilityState === "visible") {
      logStoreHandoff("fallback_timer_fired_visible", options.meta);
      options.onShow();
    } else {
      logStoreHandoff("fallback_timer_fired_hidden", options.meta);
    }
    cancel("timer-complete");
  }, STORE_FALLBACK_DELAY_MS);

  return { cancel };
}
```

---

## src/lib/marketingConversionTrack.ts

```tsx
/**
 * Marketing conversion event helper.
 *
 * Fires the same event into:
 *   1. sessionStorage (debug breadcrumb, last 20 events)
 *   2. Google Analytics (gtag) — already loaded in index.html (G-QQX552G8JN)
 *   3. TikTok Pixel (ttq) — already loaded in index.html (D5N27FBC77U6J0PHGJ1G)
 *   4. dataLayer / GTM — for any downstream tags
 *
 * We map our internal action names to TikTok's standard events so the ads
 * algorithm can optimize. Without this, TikTok only sees PageView and the
 * algo can't learn which clicks lead to outcomes.
 *
 * Actions:
 *   - landing_view              -> ttq ViewContent
 *   - cta_app_store_click       -> ttq ClickButton + ttq Download
 *   - cta_play_store_click      -> ttq ClickButton + ttq Download
 *   - cta_web_onboarding_click  -> ttq ClickButton
 *   - cta_header_app_click      -> ttq ClickButton
 *   - in_app_prompt_shown       -> ttq ClickButton (proxy)
 *   - in_app_open_in_browser    -> ttq ClickButton (proxy)
 *   - newsletter_subscribe      -> ttq Subscribe + ttq CompleteRegistration
 *   - paywall_view              -> ttq InitiateCheckout
 *   - subscription_complete     -> ttq CompletePayment
 */

export type MarketingConversionAction =
  | "landing_view"
  | "cta_app_store_click"
  | "cta_play_store_click"
  | "cta_web_onboarding_click"
  | "cta_header_app_click"
  | "cta_full_features_click"
  | "in_app_prompt_shown"
  | "in_app_open_in_browser"
  | "in_app_copy_link"
  | "newsletter_subscribe"
  | "paywall_view"
  | "subscription_complete"
  /** Legacy / generic — kept so existing callers don't break. */
  | "store_click"
  | "web_onboarding_click";

const SESSION_KEY = "marketing_conversions_v1";

type EventDetail = Record<string, string | number | boolean | undefined>;

type TtqShape = {
  track?: (event: string, params?: EventDetail) => void;
  page?: (params?: EventDetail) => void;
};

type DataLayerShape = Array<Record<string, unknown>>;

function persistBreadcrumb(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ action, detail, at: new Date().toISOString() });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
}

function fireGtag(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", action, {
      event_category: "marketing_conversion",
      ...detail,
    });
  } catch {
    /* ignore */
  }
}

function fireDataLayer(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { dataLayer?: DataLayerShape };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: `marketing_${action}`, ...detail });
  } catch {
    /* ignore */
  }
}

function ttqEventsForAction(action: MarketingConversionAction): string[] {
  switch (action) {
    case "landing_view":
      return ["ViewContent"];
    case "cta_app_store_click":
    case "cta_play_store_click":
      return ["ClickButton", "Download"];
    case "cta_web_onboarding_click":
    case "cta_header_app_click":
    case "cta_full_features_click":
    case "in_app_prompt_shown":
    case "in_app_open_in_browser":
    case "in_app_copy_link":
    case "store_click":
    case "web_onboarding_click":
      return ["ClickButton"];
    case "newsletter_subscribe":
      return ["Subscribe", "CompleteRegistration"];
    case "paywall_view":
      return ["InitiateCheckout"];
    case "subscription_complete":
      return ["CompletePayment"];
  }
}

function fireTtq(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { ttq?: TtqShape };
    if (!w.ttq?.track) return;
    const events = ttqEventsForAction(action);
    for (const e of events) {
      w.ttq.track(e, {
        ...(detail ?? {}),
        action_name: action,
      });
    }
  } catch {
    /* ignore */
  }
}

export function trackMarketingConversion(
  action: MarketingConversionAction,
  detail?: EventDetail,
): void {
  persistBreadcrumb(action, detail);
  fireGtag(action, detail);
  fireTtq(action, detail);
  fireDataLayer(action, detail);
}
```

---

## src/lib/inAppBrowserDetection.ts

```tsx
/**
 * In-app browser (a.k.a. social webview) detection.
 *
 * Why this exists: TikTok, Instagram, Facebook, Snapchat, LinkedIn etc. wrap
 * external links in their own embedded WebView. Those WebViews silently break
 * App Store / Play Store handoff (apps.apple.com / play.google.com), strip
 * referrers, block target="_blank", and disallow itms-apps:// schemes.
 *
 * For paid social traffic (TikTok especially) this is the single biggest
 * conversion leak — users tap "Download" and nothing happens.
 *
 * Mitigation: native store schemes on real `<a href>` tags (`itms-apps://`,
 * Play `intent://`) — see mobileStoreHandoff.ts.
 */

export type InAppBrowserKind =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "linkedin"
  | "twitter"
  | "pinterest"
  | "line"
  | "wechat"
  | "other";

export type InAppBrowserDetection = {
  isInAppBrowser: boolean;
  kind: InAppBrowserKind | null;
  /** True when this in-app browser is known to break apps.apple.com handoff. */
  blocksAppStore: boolean;
  /** Convenience: iOS detection — switches "Open in Safari" vs "Open in Chrome" copy. */
  isIos: boolean;
  /** Convenience: Android detection — switches Play Store fallback. */
  isAndroid: boolean;
};

const NULL_DETECTION: InAppBrowserDetection = {
  isInAppBrowser: false,
  kind: null,
  blocksAppStore: false,
  isIos: false,
  isAndroid: false,
};

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

function detectKind(ua: string): InAppBrowserKind | null {
  // TikTok signatures: "musical_ly", "Bytedance", "BytedanceWebview", "TikTok"
  if (/musical_ly|Bytedance|BytedanceWebview|TikTok/i.test(ua)) return "tiktok";

  // Instagram embeds "Instagram" string in UA
  if (/Instagram/i.test(ua)) return "instagram";

  // Facebook embeds "FBAN" (iOS) / "FBAV" / "FB_IAB" (Android)
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook";

  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/Pinterest/i.test(ua)) return "pinterest";
  if (/Line\//i.test(ua)) return "line";
  if (/MicroMessenger/i.test(ua)) return "wechat";

  return null;
}

/**
 * Detect at call-time. Cheap, no caching — UA can't change mid-session.
 * Server-rendering safe (returns a null detection).
 */
export function detectInAppBrowser(): InAppBrowserDetection {
  const ua = getUserAgent();
  if (!ua) return NULL_DETECTION;

  const kind = detectKind(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (!kind) {
    return { isInAppBrowser: false, kind: null, blocksAppStore: false, isIos, isAndroid };
  }

  /**
   * TikTok / Instagram / Facebook / Snapchat / WeChat WebViews block plain
   * https store URLs — use native schemes when these are detected.
   */
  const blocksAppStore = kind === "tiktok" || kind === "instagram" || kind === "facebook" || kind === "snapchat" || kind === "wechat";

  return { isInAppBrowser: true, kind, blocksAppStore, isIos, isAndroid };
}

/** Human-friendly label for the prompt copy, e.g. "TikTok". */
export function inAppBrowserLabel(kind: InAppBrowserKind): string {
  switch (kind) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "snapchat":
      return "Snapchat";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "X";
    case "pinterest":
      return "Pinterest";
    case "line":
      return "LINE";
    case "wechat":
      return "WeChat";
    case "other":
      return "this app";
  }
}
```

---

## src/lib/marketingViewportDebug.ts

```tsx
const MOBILE_BREAKPOINT = 768;

export type MarketingViewportDebugPayload = {
  buildSha: string;
  innerWidth: number;
  clientWidth: number;
  visualViewportWidth: number | null;
  visualViewportScale: number | null;
  devicePixelRatio: number;
  isMobileHook: boolean;
  isMobileBreakpoint: boolean;
  assetJs: string | null;
  assetCss: string | null;
  viewportMeta: string | null;
  userAgent: string;
};

export function shouldLogMarketingViewportDebug(): boolean {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("debug") === "viewport" || params.has("debug_viewport");
}

/** Log viewport + asset parity info when ?debug=viewport is in the URL. */
export function logMarketingViewportDebug(isMobileHook: boolean): MarketingViewportDebugPayload | null {
  if (!shouldLogMarketingViewportDebug()) return null;

  const vv = window.visualViewport;
  const moduleScript = document.querySelector('script[type="module"]');
  const cssLink = document.querySelector('link[rel="stylesheet"]');

  const payload: MarketingViewportDebugPayload = {
    buildSha: import.meta.env.VITE_BUILD_SHA ?? "unknown",
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: vv?.width ?? null,
    visualViewportScale: vv?.scale ?? null,
    devicePixelRatio: window.devicePixelRatio,
    isMobileHook,
    isMobileBreakpoint: window.innerWidth < MOBILE_BREAKPOINT,
    assetJs: moduleScript?.getAttribute("src") ?? null,
    assetCss: cssLink?.getAttribute("href") ?? null,
    viewportMeta:
      document.querySelector('meta[name="viewport"]')?.getAttribute("content") ?? null,
    userAgent: navigator.userAgent,
  };

  console.info("[paletteplotting viewport debug]", payload);
  return payload;
}
```

---

## src/lib/appStore.ts

```tsx
/** Opens in the App Store app on iPhone / iPad when tapped from Safari or many in-app browsers */
export const PALETTE_PLOTTING_APP_STORE_URL =
  "https://apps.apple.com/us/app/palette-plotting-app/id6759469696";

/** Google Play listing (package: com.paletteplotting.app) */
export const PALETTE_PLOTTING_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.paletteplotting.app";

/** White badge for dark backgrounds (Apple Marketing Resources API). */
export const APP_STORE_BADGE_WHITE_URL =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83";

/** Standard Google Play badge (English). */
export const GOOGLE_PLAY_BADGE_URL =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";
```

---

## src/lib/scrollToDownloadApp.ts

```tsx
/** Scroll to homepage download section, or navigate there from other routes. */
export function scrollToDownloadApp(): void {
  const section = document.getElementById("download-app");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.location.assign("/#download-app");
}
```

---

## src/lib/scrollToNewsletter.ts

```tsx
/** Scroll to homepage newsletter signup, or navigate there from other routes. */
export function scrollToNewsletter(): void {
  const section = document.getElementById("newsletter");
  if (section) {
    section.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  window.location.assign("/#newsletter");
}
```

---

## index.html

```html
<!doctype html>
<html lang="en">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N6QFTP58');</script>
<!-- End Google Tag Manager -->
<!-- TikTok Pixel Code Start -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D5N27FBC77U6J0PHGJ1G');
  ttq.page({ content_id: window.location.pathname || '/' });
}(window, document, 'ttq');
</script>
<!-- TikTok Pixel Code End -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QQX552G8JN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-QQX552G8JN');
</script>
<meta charset="UTF-8" />
<!--
  `interactive-widget=overlays-content` tells Chrome / Android WebView to overlay the on-screen
  keyboard on top of existing layout instead of shrinking the visual viewport. Stops fixed footers
  (Back / Continue on onboarding form pages) from lifting above the keyboard. iOS WKWebView already
  behaves this way under Capacitor `KeyboardResize.None`, so this is a no-op on iOS.
-->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content" />
<meta name="color-scheme" content="light">
<script>
(function () {
  try {
    if (/Capacitor/i.test(navigator.userAgent)) {
      document.documentElement.classList.add("capacitor-native");
      var stored = localStorage.getItem("theme");
      var isDark = stored !== "light";
      if (isDark) document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      var bg = isDark ? "#0f0d14" : "#ffffff";
      document.documentElement.style.backgroundColor = bg;
    }
  } catch (e) {}
})();
</script>
<style>
/* Font smoothing */
* {
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

html {
-webkit-text-size-adjust: 100%;
text-size-adjust: 100%;
}

/* Prevent Android WebView filters - but allow normal theming */
html, body, #root {
filter: none !important;
}

/* Native app: respect light/dark appearance (dashboard + chat). */
html.capacitor-native.dark,
html.capacitor-native.dark body,
html.capacitor-native.dark #root {
color-scheme: dark;
background-color: #0f0d14 !important;
}

html.capacitor-native:not(.dark),
html.capacitor-native:not(.dark) body,
html.capacitor-native:not(.dark) #root {
color-scheme: light;
background-color: #ffffff !important;
}

html.capacitor-native[data-app-appearance="cosmic"],
html.capacitor-native[data-app-appearance="cosmic"] body,
html.capacitor-native[data-app-appearance="cosmic"] #root {
color-scheme: dark;
background-color: #0a0812 !important;
}

/* Light mode defaults (when no .dark class) */
html:not(.dark):not(.capacitor-native) {
color-scheme: light;
background-color: #ffffff;
}

html:not(.dark):not(.capacitor-native) body {
background-color: #ffffff;
}

/* Dark mode (when .dark class is present) */
html.dark {
color-scheme: dark;
background-color: #09090b;
}

html.dark body {
background-color: #09090b;
}
</style>
<title>Palette Plotting</title>
<meta name="description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta name="author" content="Palette Plotting" />
<meta name="keywords" content="affirmations, self-improvement, personal growth, goal setting, reflection, visualization, audio creation, Mirror Work, subliminal audio, AI affirmations" />
<link rel="canonical" href="https://paletteplot.com" />

<meta property="og:title" content="Palette Plotting" />
<meta property="og:description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://paletteplot.com" />
<meta property="og:site_name" content="Palette Plotting" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@paletteplotting" />
<meta name="twitter:title" content="Palette Plotting" />
<meta name="twitter:description" content="Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools." />

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#000000" />
    <meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Palette Plotting" />

<!--
  Apple Smart App Banner — shows a native banner at the top of mobile Safari
  with one-tap install / open. Only renders when Safari is the active browser
  (it's a no-op in TikTok / IG / FB webviews, but it's a major install lift
  for organic + retargeting traffic that does land in Safari).
  app-id derived from PALETTE_PLOTTING_APP_STORE_URL (id6759469696).
-->
<meta name="apple-itunes-app" content="app-id=6759469696" />

<!-- Manifest: mobile gets real manifest; desktop gets a blank manifest + SW unregister + SW register noop -->
<script>
(function() {
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// Remove any existing manifest links first
document.querySelectorAll('link[rel="manifest"]').forEach(l => l.remove());

const link = document.createElement('link');
link.rel = 'manifest';
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json,{}';
        // For desktop, use a minimal valid manifest to avoid parsing errors
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent('{"name":"","display":"browser"}');
document.head.appendChild(link);

// Unregister stale service workers on all devices (mobile PWA cache can serve old CSS/JS).
if ('serviceWorker' in navigator) {
navigator.serviceWorker.getRegistrations().then(function(regs) {
  regs.forEach(function(reg) { reg.unregister(); });
}).catch(function() {});
var originalRegister = navigator.serviceWorker.register ? navigator.serviceWorker.register.bind(navigator.serviceWorker) : null;
navigator.serviceWorker.register = function() {
console.warn('Service worker registration blocked to prevent stale homepage cache', arguments[0]);
return Promise.reject(new Error('SW registration blocked'));
};
if (navigator.serviceWorker.ready) {
navigator.serviceWorker.ready.catch(function() {});
}
}

// Viewport parity debug — open homepage with ?debug=viewport (console + optional on-screen overlay).
if (/[?&]debug=viewport/.test(window.location.search)) {
function logViewportDebug() {
  var vv = window.visualViewport;
  var moduleScript = document.querySelector('script[type="module"]');
  var cssLink = document.querySelector('link[rel="stylesheet"]');
  var payload = {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: vv ? vv.width : null,
    visualViewportScale: vv ? vv.scale : null,
    devicePixelRatio: window.devicePixelRatio,
    isMobileUa: isMobile,
    isMobileBreakpoint: window.innerWidth < 768,
    assetJs: moduleScript ? moduleScript.getAttribute('src') : null,
    assetCss: cssLink ? cssLink.getAttribute('href') : null,
    viewportMeta: document.querySelector('meta[name="viewport"]') ? document.querySelector('meta[name="viewport"]').getAttribute('content') : null,
  };
  console.info('[paletteplotting viewport debug]', payload);
  var el = document.getElementById('sv-viewport-debug');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'sv-viewport-debug';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:5rem;z-index:9999;margin:0;padding:8px;font:11px/1.35 monospace;background:rgba(0,0,0,0.88);color:#0f0;white-space:pre-wrap;pointer-events:none;max-height:40vh;overflow:auto;';
    document.body.appendChild(el);
  }
  el.textContent = JSON.stringify(payload, null, 2);
}
document.addEventListener('DOMContentLoaded', logViewportDebug);
window.addEventListener('resize', logViewportDebug);
if (window.visualViewport) window.visualViewport.addEventListener('resize', logViewportDebug);
}
})();
</script>
<script>
// Sync meta theme-color with dashboard appearance (PWA status bar, mobile browser chrome, Capacitor WebView).
(function() {
function syncStatusBar() {
var themeMeta = document.querySelector('meta[name="theme-color"]');
if (!themeMeta) return;

// Marketing pages: black chrome (status bar / safe area). Not dashboard, onboarding, or login.
function isMarketingSitePath(pathname) {
var path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
if (path === '/login') return false;
if (path.indexOf('/dashboard') === 0) return false;
if (path.indexOf('/onboarding') === 0) return false;
var exact = ['/', '/faq', '/what-is-palette-plotting', '/terms', '/privacy', '/acceptable-use', '/contact', '/billing', '/dmca'];
if (exact.indexOf(path) !== -1) return true;
if (path.indexOf('/blog') === 0) return true;
return false;
}
if (isMarketingSitePath(window.location.pathname)) {
themeMeta.setAttribute('content', '#000000');
var appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatus) appleStatus.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.backgroundColor = '#000000';
if (document.body) document.body.style.backgroundColor = '#000000';
if (document.documentElement.classList.contains('dark')) {
document.documentElement.classList.remove('dark');
}
return;
}

var path = window.location.pathname.replace(/\/$/, '') || '/';
if (path === '/onboarding/welcome' || path.indexOf('/onboarding/setup/') === 0) {
var onboardingShellBg = 'linear-gradient(180deg, #0a0812 0%, #0f0d14 50%, #0a0812 100%)';
themeMeta.setAttribute('content', '#0f0d14');
var appleOnboarding = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleOnboarding) appleOnboarding.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.setProperty('background', onboardingShellBg, 'important');
document.documentElement.style.setProperty('background-color', '#0f0d14', 'important');
if (document.body) {
document.body.style.setProperty('background', onboardingShellBg, 'important');
document.body.style.setProperty('background-color', '#0f0d14', 'important');
}
var onboardingRoot = document.getElementById('root');
if (onboardingRoot) {
onboardingRoot.style.setProperty('background', onboardingShellBg, 'important');
onboardingRoot.style.setProperty('background-color', '#0f0d14', 'important');
}
return;
}

document.documentElement.style.removeProperty('background');
document.documentElement.style.removeProperty('background-color');
if (document.body) {
document.body.style.removeProperty('background');
document.body.style.removeProperty('background-color');
}
var appRoot = document.getElementById('root');
if (appRoot) {
appRoot.style.removeProperty('background');
appRoot.style.removeProperty('background-color');
}
var appleStatusDefault = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');

var appearance = document.documentElement.getAttribute('data-app-appearance');
if (appearance === 'cosmic') {
themeMeta.setAttribute('content', '#0a0812');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
return;
}

if (path.indexOf('/dashboard') === 0) {
if (appearance === 'dark') {
themeMeta.setAttribute('content', '#0f0d14');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
} else {
themeMeta.setAttribute('content', '#ffffff');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');
document.documentElement.style.colorScheme = 'light';
}
return;
}

var isDark = document.documentElement.classList.contains('dark');
if (isDark) {
themeMeta.setAttribute('content', '#09090b');
return;
}

themeMeta.setAttribute('content', '#ffffff');
}

// Watch for theme / appearance changes (React sets data-app-appearance on the document element)
var observer = new MutationObserver(syncStatusBar);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-app-appearance'] });
syncStatusBar();

// Watch for route changes
let lastPath = window.location.pathname;
const checkRoute = () => {
if (window.location.pathname !== lastPath) {
lastPath = window.location.pathname;
syncStatusBar();
}
};
window.addEventListener('popstate', checkRoute);
setInterval(checkRoute, 100);

// Also sync after DOM is ready and after a delay (React needs time to set theme)
document.addEventListener('DOMContentLoaded', function() {
syncStatusBar();
setTimeout(syncStatusBar, 100);
setTimeout(syncStatusBar, 500);
});
})();
</script>
<link rel="apple-touch-icon" href="/icon-196.png" />
<link rel="icon" type="image/png" sizes="196x196" href="/icon-196.png?v=5" />
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=5" />
<link rel="shortcut icon" href="/icon-196.png?v=5" />

<link rel="preconnect" href="https://fonts.cdnfonts.com">
<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap" rel="stylesheet">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://paletteplot.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Palette Plotting",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today.",
  "url": "https://paletteplot.com"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-847-563-4944",
    "contactType": "customer service",
    "email": "support@paletteplot.com",
    "areaServed": "US",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1 North State Street Ste 1500",
    "addressLocality": "Chicago",
    "addressRegion": "IL",
    "postalCode": "60602",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://twitter.com/paletteplotting"
  ]
}
</script>

</head>

<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N6QFTP58"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<!-- Force remove dark class immediately on page load -->
<script>
(function() {
  // Remove dark class if it exists
  document.documentElement.classList.remove('dark');

  // Store the original add and remove methods
  const originalClassListAdd = DOMTokenList.prototype.add;
  const originalClassListRemove = DOMTokenList.prototype.remove;

  // Get the original classList descriptor
  const originalClassListDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'classList') || 
                                      Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList');
  
  // Override the classList property on Element.prototype
  Object.defineProperty(Element.prototype, 'classList', {
    get: function() {
      const self = this; // Capture the element instance
      
      // Get the actual classList using the original getter
      const actualClassList = originalClassListDescriptor ? 
                              originalClassListDescriptor.get.call(self) : 
                              self.classList;

      // Create a proxy for the classList that calls the original methods
      // with the correct context (the element's actual classList)
      const customClassList = {
        add: function(...args) {
          // Block dark class from being added to html element on non-dashboard pages
          if (self === document.documentElement &&
              args.includes('dark') &&
              !window.location.pathname.startsWith('/dashboard')) {
            console.log('Blocked dark class on non-dashboard page');
            return;
          }
          // Call the original add method, ensuring 'this' context is the actual classList
          return originalClassListAdd.apply(actualClassList, args);
        },
        remove: function(...args) {
          // Call the original remove method, ensuring 'this' context is the actual classList
          return originalClassListRemove.apply(actualClassList, args);
        },
        toggle: function(...args) {
          return actualClassList.toggle.apply(actualClassList, args);
        },
        contains: function(...args) {
          return actualClassList.contains.apply(actualClassList, args);
        },
        item: function(...args) {
          return actualClassList.item.apply(actualClassList, args);
        },
        replace: function(...args) {
          return actualClassList.replace.apply(actualClassList, args);
        },
        get length() {
          return actualClassList.length;
        },
        get value() {
          return actualClassList.value;
        },
        set value(val) {
          actualClassList.value = val;
        },
        forEach: function(...args) {
          return actualClassList.forEach.apply(actualClassList, args);
        },
        entries: function() {
          return actualClassList.entries();
        },
        keys: function() {
          return actualClassList.keys();
        },
        values: function() {
          return actualClassList.values();
        },
        [Symbol.iterator]: function() {
          return actualClassList[Symbol.iterator]();
        },
        toString: function() {
          return actualClassList.toString();
        }
      };

      return customClassList;
    },
    configurable: true, // Allow the property to be redefined
  });
})();
</script>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## public/manifest.json

```json
{
  "name": "Palette Plotting",
  "short_name": "Palette Plotting",
  "description": "Shape your path forward",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icon-196.png",
      "sizes": "196x196",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}


































```

---

