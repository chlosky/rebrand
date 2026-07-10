import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_GLASS_PANEL_CLASS, SETUP_CHOICE_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { readSetupDraft } from "@/lib/setupDraft";
import { useTranslation } from "react-i18next";

type PlotSynthesisItem = { short: string; long: string };

function normalizePlotSynthesisItems(raw: unknown): PlotSynthesisItem[] {
  if (!Array.isArray(raw)) return [];
  return raw.flatMap((item) => {
    if (typeof item === "string") return [{ short: item, long: item }];
    if (item && typeof item === "object" && "short" in item && "long" in item) {
      const short = typeof item.short === "string" ? item.short : "";
      const long = typeof item.long === "string" ? item.long : short;
      if (!short && !long) return [];
      return [{ short: short || long, long: long || short }];
    }
    return [];
  });
}

export default function SetupPlotSynthesis() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";
  const items = useMemo((): PlotSynthesisItem[] => {
    const variant =
      readSetupDraft().startingSystem === "moodboarding" ? "moodboard" : "general";
    return normalizePlotSynthesisItems(t(`setup.plotSynthesis.${variant}`, { returnObjects: true }));
  }, [t]);

  return (
    <SetupPage
      canContinue={true}
      continueText="Continue"
      onBack={() => navigate(`${setupBase}/attribution`)}
      onContinue={() => navigate(`${setupBase}/email`)}
    >
      <div className="space-y-4">
        <SetupHeadingBlock
          centered
          title={t("setup.plotSynthesis.title")}
          subtitle={t("setup.plotSynthesis.subtitle")}
        />

        <div className="space-y-5 sm:space-y-3">
          {items.map((item) => (
            <div
              key={item.long}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "flex w-full min-h-[3.25rem] items-center justify-between gap-3 px-4 py-4",
              )}
            >
              <span className={cn(SETUP_CHOICE_LABEL_CLASS, "min-w-0 flex-1 leading-snug sm:hidden")}>
                {item.short}
              </span>
              <span className={cn(SETUP_CHOICE_LABEL_CLASS, "hidden min-w-0 flex-1 leading-snug sm:block")}>
                {item.long}
              </span>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" />
            </div>
          ))}
        </div>
      </div>
    </SetupPage>
  );
}
