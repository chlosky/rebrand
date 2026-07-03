import { useNavigate } from "react-router-dom";
import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import {
  MARKETING_BODY_CLASS,
  MARKETING_DISPLAY_CLASS,
  MARKETING_MANIFEST_PILL_CLASS,
  MARKETING_PINK,
} from "@/components/marketing/marketingVisualTheme";
import { marketingHeroSectionClass } from "@/components/marketing/marketingLayout";
import { cn } from "@/lib/utils";

const PILL_COLORS: Record<string, string> = {
  pink: "#ff4da6",
  green: "#1aff6a",
  blue: "#1ab8ff",
  yellow: "#ffe01a",
};

type PracticePill = { label: string; category: string; color: string };

export function MarketingPracticeTopics() {
  const { t } = useMarketingTranslation();
  const navigate = useNavigate();
  const pills = t("home.practiceSection.pills", { returnObjects: true }) as PracticePill[];

  return (
    <section id="how-it-works" className={marketingHeroSectionClass}>
      <div className="mx-auto flex w-full flex-col items-center px-4 text-center sm:px-6 lg:max-w-2xl">
        <h2 className={cn(MARKETING_DISPLAY_CLASS, "text-2xl sm:text-3xl lg:text-[2rem]")}>
          <span className="block text-white">{t("home.practiceSection.headlineLine1")}</span>
          <span className="mt-1 block" style={{ color: MARKETING_PINK }}>
            {t("home.practiceSection.headlineLine2")}
          </span>
        </h2>

        <p className={cn(MARKETING_BODY_CLASS, "mt-4 w-full text-white lg:max-w-lg")}>
          {t("home.practiceSection.body")}
        </p>

        <div
          className="mt-7 flex w-full flex-wrap justify-center gap-2"
          aria-label={t("home.practiceSection.focusAreasAria")}
        >
          {pills.map((topic) => (
            <button
              key={topic.label}
              type="button"
              onClick={() =>
                navigate(`/blog?category=${encodeURIComponent(topic.category)}`)
              }
              className={cn(
                MARKETING_MANIFEST_PILL_CLASS,
                "transition-colors hover:bg-white/15 active:bg-white/20",
              )}
              style={{ color: PILL_COLORS[topic.color] ?? PILL_COLORS.yellow }}
            >
              {topic.label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
