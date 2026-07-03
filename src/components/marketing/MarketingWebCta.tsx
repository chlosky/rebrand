import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { MARKETING_PRIMARY_CTA_CLASS } from "@/components/marketing/marketingVisualTheme";
import {
  MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
  MARKETING_WEB_ONBOARDING_WELCOME_PATH,
} from "@/lib/marketingConversionCopy";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

type MarketingWebCtaProps = {
  label?: string;
  className?: string;
  size?: "default" | "lg";
};

export function MarketingWebCta({
  label = MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
  className,
  size = "lg",
}: MarketingWebCtaProps) {
  const navigate = useNavigate();
  if (Capacitor.isNativePlatform()) return null;

  return (
    <Button
      size={size}
      className={cn(
        MARKETING_PRIMARY_CTA_CLASS,
        size === "lg" ? "h-12 px-7 text-base" : "h-10 px-5 text-sm",
        className,
      )}
      onClick={() => {
        trackMarketingConversion("web_onboarding_click", {
          source: "homepage_web_cta",
          button_label: label,
          target_path: MARKETING_WEB_ONBOARDING_WELCOME_PATH,
        });
        navigate(MARKETING_WEB_ONBOARDING_WELCOME_PATH);
      }}
    >
      {label}
    </Button>
  );
}
