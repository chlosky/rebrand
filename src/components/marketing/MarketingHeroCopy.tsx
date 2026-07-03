import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import type { ReactNode } from "react";
import {
  MARKETING_HERO_HEADLINE_CLASS,
  MARKETING_SUBCOPY_CLASS,
} from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

const accentStyle = (rgb: string) => ({
  textShadow: `0 0 16px rgba(${rgb}, 0.55), 0 0 32px rgba(${rgb}, 0.22)`,
});

type MarketingHeroCopyProps = {
  centered?: boolean;
  compact?: boolean;
  showSubheads?: boolean;
  showFreeTrialLine?: boolean;
  singleLineHeadlines?: boolean;
  largeSubheads?: boolean;
  beforeSubheads?: ReactNode;
  pairLastSubheads?: boolean;
};

/** Hero — 4-board system headline + product subheads. */
export function MarketingHeroCopy({
  centered = false,
  compact = false,
  showSubheads = true,
  showFreeTrialLine = true,
  singleLineHeadlines = false,
  largeSubheads = false,
  beforeSubheads,
  pairLastSubheads = false,
}: MarketingHeroCopyProps) {
  const { t } = useMarketingTranslation();
  const lineClass = cn(
    MARKETING_HERO_HEADLINE_CLASS,
    singleLineHeadlines
      ? "whitespace-nowrap text-[clamp(1.7rem,4.6vw+0.9rem,2.2rem)] sm:text-[2.2rem]"
      : compact
        ? "text-[1.72rem] sm:text-[2.15rem]"
        : "text-[1.65rem] sm:text-[2.15rem] lg:text-[2.35rem]",
    singleLineHeadlines ? "leading-[1.08]" : compact ? "leading-[1.08]" : "leading-[1.12]",
  );
  const subheadLines = [t("home.hero.subhead1"), t("home.hero.subhead2"), t("home.hero.subhead3")];

  const subheadsBlock = showSubheads ? (
    <div
      className={cn(
        MARKETING_SUBCOPY_CLASS,
        largeSubheads
          ? cn(
              "space-y-1 text-[17px] leading-snug sm:text-[18px]",
              beforeSubheads ? "mt-5" : "mt-8",
            )
          : "space-y-0.5 text-[14px] leading-relaxed sm:text-[15px]",
        !largeSubheads && !beforeSubheads && (compact ? "mt-3" : "mt-4"),
        "w-full lg:max-w-2xl",
        centered && "mx-auto text-center",
      )}
    >
      {pairLastSubheads ? (
        <>
          <p className="m-0 whitespace-nowrap">
            {subheadLines[0]}
            <span aria-hidden> · </span>
            {subheadLines[1]}
          </p>
          <p className="m-0">{subheadLines[2]}</p>
        </>
      ) : (
        subheadLines.map((line) => (
          <p key={line} className="m-0">
            {line}
          </p>
        ))
      )}
    </div>
  ) : null;

  return (
    <div className={cn(centered && "mx-auto w-full text-center")}>
      <h1
        className={cn(
          "relative z-10",
          compact ? "space-y-0.5 sm:space-y-1" : "space-y-1 sm:space-y-1.5",
          centered && "mx-auto",
        )}
      >
        <span className={cn(lineClass, "block text-white")}>{t("home.hero.headline1")}</span>
        <span className={cn(lineClass, "block text-white")}>
          {t("home.hero.headline2Prefix")}{" "}
          <span className="text-[#ff4da6]" style={accentStyle("255, 77, 166")}>
            {t("home.hero.headline2Accent")}
          </span>
        </span>
        <span className={cn(lineClass, "block text-white")}>
          {t("home.hero.headline3Prefix")}{" "}
          <span className="text-[#1aff6a]" style={accentStyle("26, 255, 106")}>
            {t("home.hero.headline3Connector")} {t("home.hero.headline3Accent")}
          </span>
        </span>
        {showFreeTrialLine ? (
          <span className={cn("mt-2 block text-white", compact ? "text-[15px]" : "text-base sm:text-[17px]")}>
            {t("home.hero.freeTrialLine")}
          </span>
        ) : null}
      </h1>
      {beforeSubheads && showSubheads ? (
        <div className="space-y-0.5">
          {beforeSubheads}
          {subheadsBlock}
        </div>
      ) : (
        <>
          {beforeSubheads}
          {subheadsBlock}
        </>
      )}
    </div>
  );
}
