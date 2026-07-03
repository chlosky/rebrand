import { useMarketingTranslation } from "@/hooks/useMarketingTranslation";
import { Capacitor } from "@capacitor/core";
import { MarketingConversionCta } from "@/components/marketing/MarketingConversionCta";
import { MARKETING_HEADER_BORDER_CLASS } from "@/components/marketing/marketingVisualTheme";

/** Mobile web: fixed bottom bar — palette plot bright chrome. */
export function MarketingStickyDownloadBar() {
  const { t } = useMarketingTranslation();
  if (Capacitor.isNativePlatform()) return null;

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-[60] ${MARKETING_HEADER_BORDER_CLASS} px-4 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-3 backdrop-blur-md md:hidden`}
      role="region"
      aria-label={t("home.stickyBarAria")}
    >
      <div className="w-full">
        <MarketingConversionCta variant="sticky" showStoreBadges={false} source="sticky_bar" />
      </div>
    </div>
  );
}
