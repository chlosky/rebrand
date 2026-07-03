import { MessageCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { dashboardFeatures } from "@/lib/featuresData";
import { MARKETING_FEATURE_KEYS } from "@/lib/marketingLocale";
import { MarketingManifestPanel } from "@/components/marketing/MarketingManifestPanel";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { MARKETING_BODY_CLASS, MARKETING_CARD_TITLE_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

const FEATURE_STRIP_PATHS = [
  "/dashboard/boards",
  "/dashboard/subliminal",
  "/dashboard/mirror",
  "/dashboard/affirmations-builder",
  "/dashboard/refactor",
  "/dashboard/your-journey",
  "/dashboard/your-journey/chat",
] as const;

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
  const { t } = useMarketingTranslation();
  const stripItems = FEATURE_STRIP_PATHS.map((path, index) => {
    const key = MARKETING_FEATURE_KEYS[index]!;
    return {
      path,
      title: t(`pricing.features.${key}.title`),
      description: t(`pricing.features.${key}.description`),
    };
  });
  const loopItems = [...stripItems, ...stripItems];

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
