import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { Button } from "@/components/ui/button";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { useIsMobile } from "@/hooks/use-mobile";
import { useMarketingStoreCta } from "@/hooks/useMarketingStoreCta";
import { isDesktopMarketingWeb } from "@/lib/marketingGetApp";
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
  const { t } = useMarketingTranslation();
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
          {t("home.hero.ctaDownload")}
        </Button>
      ) : (
        <Button size="lg" className={downloadCtaClass} asChild>
          <a
            href={cta.primaryStoreHref}
            onClick={() => cta.onStoreClick(ctaSource, cta.primaryStore)}
          >
            {t("home.hero.ctaDownload")}
          </a>
        </Button>
      )}

      {showStoreBadges && !isSticky && isDesktop ? (
        <div className="pt-1 lg:text-left">
          <MarketingStoreBadges
            subline={t("home.hero.freeTrialUnderBadges")}
            onStoreClick={(store) => cta.onStoreClick(`${ctaSource}_badge`, store)}
          />
        </div>
      ) : null}
    </div>
  );
}
