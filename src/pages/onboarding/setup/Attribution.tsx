import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useTranslation } from "react-i18next";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_LABEL_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

const OPTION_KEYS = [
  "tiktok",
  "instagram",
  "app_store",
  "friend",
  "youtube",
  "search",
  "other",
] as const;

export default function SetupAttribution() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const initial = useMemo(() => readSetupDraft().attributionSource ?? null, []);
  const [selected, setSelected] = useState<string | null>(initial);

  useEffect(() => {
    trackMarketingConversion("web_onboarding_attribution_view", {
      source: "onboarding_attribution",
      page_path: `${setupBase}/attribution`,
    });
  }, [setupBase]);

  return (
    <SetupPage
      canContinue={selected != null}
      onBack={() => navigate(`${setupBase}/begin-journey`)}
      onContinue={() => {
        if (!selected) return;
        void writeSetupDraft({ attributionSource: selected });
        trackMarketingConversion("web_onboarding_attribution_submit", {
          source: "onboarding_attribution",
          attribution_source: selected,
        });
        navigate(`${setupBase}/reminder-channels`);
      }}
    >
      <SetupHeadingBlock
        centered
        title={t("setup.attribution.title")}
        subtitle={t("setup.attribution.subtitle")}
      />

      <div className="relative z-[1] space-y-2.5 pt-6">
        {OPTION_KEYS.map((key) => {
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected((prev) => (prev === key ? null : key))}
              className={cn(setupTextChoiceTileClass(active), "items-center justify-between text-left")}
              style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className={SETUP_CHOICE_LABEL_CLASS}>{t(`setup.attribution.options.${key}`)}</span>
              {active ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-900" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
              )}
            </button>
          );
        })}
      </div>
    </SetupPage>
  );
}
