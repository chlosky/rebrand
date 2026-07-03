import { useNavigate } from "react-router-dom";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { Capacitor } from "@capacitor/core";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingHeroStaticPhone } from "@/components/marketing/MarketingHeroStaticPhone";
import { MarketingHeroCopy } from "@/components/marketing/MarketingHeroCopy";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { MARKETING_PRIMARY_CTA_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";
import type { User } from "@supabase/supabase-js";

function HeroStars({ className }: { className?: string }) {
  return (
    <span className={cn("flex gap-0.5", className)} aria-hidden>
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} className="h-3.5 w-3.5 fill-[#d4d4d8] text-[#e4e4e7] sm:h-4 sm:w-4" />
      ))}
    </span>
  );
}

function HeroAwardUnderPhones() {
  const { t } = useMarketingTranslation();
  return (
    <div className="mt-4 flex w-full max-w-[min(100%,26rem)] items-center justify-center gap-2 text-sm font-normal leading-snug text-neutral-600 sm:mt-5 sm:max-w-[min(100%,30rem)] sm:text-[15px]">
      <HeroStars className="shrink-0" />
      <span className="min-w-0 text-center">{t("home.hero.awardLine")}</span>
    </div>
  );
}

export function MarketingHero({ user }: { user?: User | null }) {
  const { t } = useMarketingTranslation();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const showWebSignup = !Capacitor.isNativePlatform();
  const cta = useMarketingStoreCta();

  const openBoards = () => {
    if (user) {
      navigate("/dashboard/boards");
      return;
    }
    navigate("/login", { state: { returnTo: "/dashboard/boards" } });
  };

  const ctaBlock = showWebSignup ? (
    <div className="flex flex-col items-start gap-3.5">
      {isMobile ? (
        <Button size="lg" className={cn(MARKETING_PRIMARY_CTA_CLASS, "w-fit max-w-full px-6")} onClick={openBoards}>
          {t("home.hero.ctaHeroMobile")}
        </Button>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <Button
            size="lg"
            className={cn(MARKETING_PRIMARY_CTA_CLASS, "min-w-[14rem] px-8")}
            onClick={openBoards}
          >
            {t("home.hero.ctaDownload")}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white/30 bg-white/5 text-white hover:bg-white/10 hover:text-white"
            onClick={() => cta.onStoreClick("homepage_hero_app_secondary")}
          >
            {t("home.hero.ctaAppSecondary")}
          </Button>
        </div>
      )}
    </div>
  ) : (
    <Button
      size="lg"
      className={cn(MARKETING_PRIMARY_CTA_CLASS, "px-8")}
      onClick={() => navigate("/what-is-palette-plotting")}
    >
      {t("home.hero.exploreApp")}
    </Button>
  );

  return (
    <section
      className="relative overflow-hidden text-neutral-900"
      style={{
        paddingTop: "calc(72px + env(safe-area-inset-top, 0px))",
        background: "transparent",
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 lg:hidden"
        aria-hidden
        style={{
          background:
            "radial-gradient(ellipse 90% 55% at 15% 18%, rgba(255, 77, 166, 0.14), transparent 55%), radial-gradient(ellipse 70% 50% at 85% 42%, rgba(26, 184, 255, 0.1), transparent 50%)",
        }}
      />

      <div className="relative mx-auto grid max-w-7xl gap-6 px-4 pb-10 pt-6 sm:px-6 sm:pb-12 sm:pt-10 lg:grid-cols-2 lg:items-center lg:gap-16 lg:pb-24 lg:pt-14">
        <div
          className={cn(
            "relative z-20 min-w-0 max-w-xl",
            isMobile && "mx-auto flex w-full flex-col items-center",
          )}
        >
          <div className={cn(isMobile && "w-fit max-w-full text-left")}>
            <MarketingHeroCopy compact={isMobile} />
            <div className="mt-6 lg:mt-8">{ctaBlock}</div>
          </div>
        </div>

        <div className="relative z-10 -mx-2 flex w-[calc(100%+1rem)] min-w-0 flex-col items-center overflow-visible sm:-mx-0 sm:w-full">
          <MarketingHeroStaticPhone size={isMobile ? "default" : "lg"} className="lg:max-w-none" />
          {showWebSignup ? <HeroAwardUnderPhones /> : null}
        </div>
      </div>
    </section>
  );
}
