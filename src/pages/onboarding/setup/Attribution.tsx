import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  "youtube",
  "search",
  "friend",
  "other",
] as const;

export default function SetupAttribution() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";

  const initial = useMemo(() => readSetupDraft().attributionSource ?? null, []);
  const [selected, setSelected] = useState<string | null>(initial);
  const [otherText, setOtherText] = useState<string>(() => readSetupDraft().attributionOther ?? "");

  const select = useCallback((key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  }, []);

  const canContinue = selected != null && (selected !== "other" || otherText.trim().length > 0);

  useEffect(() => {
    trackMarketingConversion("web_onboarding_attribution_view", {
      source: "onboarding_attribution",
      page_path: `${setupBase}/attribution`,
    });
  }, [setupBase]);

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => {
        const startingSystem = readSetupDraft().startingSystem;
        if (startingSystem === "office_work") {
          navigate(`${setupBase}/office-planning-system`);
          return;
        }
        if (startingSystem === "home_organization") {
          navigate(`${setupBase}/home-focus`);
          return;
        }
        if (startingSystem === "moodboarding") {
          navigate(`${setupBase}/moodboard-focus`);
          return;
        }
        navigate(`${setupBase}/focus-categories`);
      }}
      onContinue={() => {
        if (!canContinue || !selected) return;
        void writeSetupDraft({
          attributionSource: selected,
          attributionOther: selected === "other" ? otherText.trim() : undefined,
        });
        trackMarketingConversion("web_onboarding_attribution_submit", {
          source: "onboarding_attribution",
          attribution_source: selected,
        });
        navigate(`${setupBase}/plot-synthesis`);
      }}
    >
      <SetupHeadingBlock
        centered
        title={
          <>
            {t("setup.attribution.titleLead")}
            <br />
            <span className="whitespace-nowrap">{t("setup.attribution.titleBrand")}</span>
          </>
        }
        subtitle={t("setup.attribution.subtitle")}
      />

      <div className="relative z-[1] space-y-2.5 pt-6">
        {OPTION_KEYS.map((key) => {
          const active = selected === key;

          if (key === "other") {
            const label = t(`setup.attribution.options.${key}`);
            return (
              <div key={key} className="relative">
                <div className="invisible pointer-events-none" aria-hidden>
                  <div className={cn(setupTextChoiceTileClass(false), "items-center justify-between")}>
                    <span className={SETUP_CHOICE_LABEL_CLASS}>{label}</span>
                    <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
                  </div>
                </div>
                <div className="absolute inset-0 [perspective:1000px]">
                  <div
                    className={cn(
                      "relative h-full transition-transform duration-500 [transform-style:preserve-3d]",
                      active && "[transform:rotateY(180deg)]",
                    )}
                  >
                    <button
                      type="button"
                      onClick={() => select(key)}
                      className={cn(
                        "absolute inset-0 flex w-full items-center justify-between text-left [backface-visibility:hidden]",
                        setupTextChoiceTileClass(false),
                      )}
                    >
                      <span className={SETUP_CHOICE_LABEL_CLASS}>{label}</span>
                      <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
                    </button>

                    <div
                      className={cn(
                        "absolute inset-0 flex w-full items-center justify-between gap-3 text-left [backface-visibility:hidden] [transform:rotateY(180deg)]",
                        setupTextChoiceTileClass(true),
                        !active && "pointer-events-none",
                      )}
                      style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                    >
                      <input
                        autoFocus={active}
                        type="text"
                        value={otherText}
                        onChange={(e) => setOtherText(e.target.value)}
                        placeholder={t("setup.attribution.otherPlaceholder")}
                        className={cn(
                          SETUP_CHOICE_LABEL_CLASS,
                          "min-w-0 flex-1 border-0 bg-transparent p-0 font-medium placeholder:font-normal placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-0",
                        )}
                      />
                      <button
                        type="button"
                        onClick={() => select(key)}
                        className="shrink-0"
                        aria-label={label}
                      >
                        <CheckCircle2 className="h-5 w-5 text-zinc-900" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          }

          return (
            <button
              key={key}
              type="button"
              onClick={() => select(key)}
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
