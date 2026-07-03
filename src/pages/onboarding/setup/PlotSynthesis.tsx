import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { readSetupDraft } from "@/lib/setupDraft";
import { useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  BarChart3,
  ChevronRight,
  LayoutGrid,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_GLASS_PANEL_CLASS, SETUP_CHOICE_ICON_WRAP_CLASS, SETUP_CHOICE_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const TOOL_SYNTHESIS: Record<string, { Icon: LucideIcon; key: string }> = {
  powerful_affirmations: { Icon: Sparkles, key: "affirmations" },
  daily_wins_progress: { Icon: BarChart3, key: "tracking" },
};

export default function SetupPlotSynthesis() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const items = useMemo((): { Icon: LucideIcon; text: string }[] => {
    const draft = readSetupDraft();

    const stack: { Icon: LucideIcon; text: string }[] = [
      { Icon: LayoutGrid, text: t("setup.plotSynthesis.items.workspace") },
    ];

    const prefs = Array.isArray(draft.toolPreferences) ? draft.toolPreferences : [];
    for (const pref of prefs) {
      const row = TOOL_SYNTHESIS[pref];
      if (row) {
        stack.push({ Icon: row.Icon, text: t(`setup.plotSynthesis.items.${row.key}`) });
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
          {items.map(({ Icon, text }) => (
            <div
              key={text}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "flex w-full min-h-[3.25rem] items-center justify-between gap-3 px-4 py-4",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className={cn(SETUP_CHOICE_ICON_WRAP_CLASS, "h-9 w-9")}>
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className={cn(SETUP_CHOICE_LABEL_CLASS, "leading-snug")}>{text}</span>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-zinc-300" />
            </div>
          ))}
        </div>
      </div>
    </SetupPage>
  );
}
