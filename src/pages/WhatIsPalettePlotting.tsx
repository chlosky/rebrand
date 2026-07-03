import { useNavigate } from "react-router-dom";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MARKETING_FEATURE_KEYS } from "@/lib/marketingLocale";
import { MarketingSiteLayout } from "@/components/marketing/MarketingSiteLayout";
import { Button } from "@/components/ui/button";

const FEATURE_STRIP_PATHS = [
  "/dashboard/subliminal",
  "/dashboard/mirror",
  "/dashboard/affirmations-builder",
  "/dashboard/refactor",
  "/dashboard/your-journey",
  "/dashboard/your-journey/chat",
] as const;

const sectionDomId = (title: string) =>
  title.toLowerCase().replace(/&/g, "and").replace(/\s+/g, "-");

const WhatIsPalettePlotting = () => {
  const navigate = useNavigate();
  const { t } = useMarketingTranslation();
  const featureItems = FEATURE_STRIP_PATHS.map((path, index) => {
    const key = MARKETING_FEATURE_KEYS[index]!;
    return {
      path,
      title: t(`pricing.features.${key}.title`),
      description: t(`pricing.features.${key}.description`),
    };
  });

  return (
    <MarketingSiteLayout>
      <div className="container mx-auto max-w-3xl flex-1 px-4 py-8 sm:px-6">
        <div className="mb-10">
          <Button variant="ghost" size="sm" className="-ml-2 mb-4 text-muted-foreground" onClick={() => navigate(-1)}>
            {t("whatIsPalettePlotting.back")}
          </Button>
          <h1 className="text-4xl font-bold tracking-tight mb-4">{t("whatIsPalettePlotting.title")}</h1>
          <p className="text-muted-foreground text-lg leading-relaxed">{t("whatIsPalettePlotting.intro")}</p>
        </div>

        <div className="space-y-12">
          {featureItems.map((item) => (
            <section key={item.path} id={sectionDomId(item.title)}>
              <h2 className="text-2xl font-semibold text-foreground mb-4">{item.title}</h2>
              <p className="text-muted-foreground leading-relaxed">{item.description}</p>
            </section>
          ))}
        </div>

        <p className="mt-12 text-sm text-muted-foreground border-t border-border pt-8 leading-relaxed">
          {t("whatIsPalettePlotting.footerPrefix")}{" "}
          <button
            type="button"
            onClick={() => navigate("/faq")}
            className="text-primary hover:underline font-medium"
          >
            {t("whatIsPalettePlotting.faq")}
          </button>
          {" "}{t("whatIsPalettePlotting.footerMiddle")}{" "}
          <button
            type="button"
            onClick={() => navigate("/blog")}
            className="text-primary hover:underline font-medium"
          >
            {t("whatIsPalettePlotting.blog")}
          </button>
          {t("whatIsPalettePlotting.footerSuffix")}
        </p>
      </div>

    </MarketingSiteLayout>
  );
};

export default WhatIsPalettePlotting;
