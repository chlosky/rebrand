import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { MARKETING_BODY_CLASS, MARKETING_DISPLAY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

type StatItem = { value: string; label: string };

export function MarketingStats() {
  const { t } = useMarketingTranslation();
  const stats = t("home.stats", { returnObjects: true }) as StatItem[];

  return (
    <section className={marketingHeroSectionClass}>
      <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-x-6 gap-y-8 px-4 sm:px-6 md:grid-cols-4">
        {stats.map((stat) => (
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
