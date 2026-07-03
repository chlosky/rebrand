import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { MARKETING_DISPLAY_CLASS, MARKETING_PINK, MARKETING_SUBCOPY_CLASS } from "@/components/marketing/marketingVisualTheme";
import { cn } from "@/lib/utils";

const cellClass = cn(MARKETING_SUBCOPY_CLASS, "text-center");

export function MarketingManifestPanel() {
  const { t } = useMarketingTranslation();
  const rows = t("home.manifestPanel.rows", { returnObjects: true }) as string[][];

  return (
    <div className="flex w-full flex-col items-center text-center">
      <h2
        className={cn(
          MARKETING_DISPLAY_CLASS,
          "text-[clamp(1.45rem,5vw,2.35rem)] sm:text-4xl",
        )}
      >
        <span className="block whitespace-nowrap text-white">{t("home.manifestPanel.headlineLine1")}</span>
        <span className="mt-1 block whitespace-nowrap" style={{ color: MARKETING_PINK }}>
          {t("home.manifestPanel.headlineLine2")}
        </span>
      </h2>
      <div
        className="mx-auto mt-5 grid w-full max-w-[min(100%,20rem)] grid-cols-2 items-center justify-items-center gap-x-8 gap-y-2 sm:gap-x-12 sm:gap-y-2.5 lg:max-w-md"
        role="list"
        aria-label={t("home.manifestPanel.manifestListAria")}
      >
        {rows.map(([left, right]) => (
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
