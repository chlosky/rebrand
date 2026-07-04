import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { readSetupDraft } from "@/lib/setupDraft";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_GLASS_PANEL_CLASS, SETUP_CHOICE_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const TOOL_SYNTHESIS: Record<string, string> = {
  boards_workspace: "boards",
  daily_wins_progress: "tracking",
};

export default function SetupPlotSynthesis() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const items = useMemo((): string[] => {
    const draft = readSetupDraft();

    const stack: string[] = [t("setup.plotSynthesis.items.workspace")];

    const prefs = Array.isArray(draft.toolPreferences) ? draft.toolPreferences : [];
    for (const pref of prefs) {
      const key = TOOL_SYNTHESIS[pref];
      if (key) {
        stack.push(t(`setup.plotSynthesis.items.${key}`));
      }
    }

    return stack;
  }, [t]);

  return (
    <SetupPage
      canContinue={true}
      continueText="Continue"
      onBack={() => navigate(`${setupBase}/plot-loading`)}
      onContinue={() =>
        navigate(isSuiteFunnel ? `${setupBase}/email` : `${setupBase}/name`)
      }
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
