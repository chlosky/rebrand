import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_GLASS_PANEL_CLASS, SETUP_CHOICE_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { readSetupDraft } from "@/lib/setupDraft";
import { useTranslation } from "react-i18next";

export default function SetupPlotSynthesis() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";
  const items = useMemo((): string[] => {
    const variant =
      readSetupDraft().startingSystem === "moodboarding" ? "moodboard" : "general";
    return t(`setup.plotSynthesis.${variant}`, { returnObjects: true }) as string[];
  }, [t]);

  return (
    <SetupPage
      canContinue={true}
      continueText="Continue"
      onBack={() => navigate(`${setupBase}/plot-loading`)}
      onContinue={() => navigate(`${setupBase}/email`)}
    >
      <div className="space-y-4">
        <SetupHeadingBlock
          centered
          title={t("setup.plotSynthesis.title")}
          subtitle={t("setup.plotSynthesis.subtitle")}
        />

        <div className="space-y-3">
          {items.map((text) => (
            <div
              key={text}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "flex w-full min-h-[3.25rem] items-center justify-between gap-3 px-4 py-4",
              )}
            >
              <span className={cn(SETUP_CHOICE_LABEL_CLASS, "min-w-0 flex-1 leading-snug")}>{text}</span>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" />
            </div>
          ))}
        </div>
      </div>
    </SetupPage>
  );
}
