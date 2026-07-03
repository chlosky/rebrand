import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { needsSetupConditionalSpecificityPage } from "@/lib/conditionalSpecificityStep7";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useTranslation } from "react-i18next";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { CheckCircle2, Circle, Sparkles, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_ICON_WRAP_CLASS,
  SETUP_CHOICE_LABEL_CLASS,
  setupIconChoiceTileClass,
} from "@/lib/onboardingSetupTheme";

const OPTIONS = [
  { key: "powerful_affirmations", label: "Powerful affirmations", Icon: Sparkles },
  { key: "daily_wins_progress", label: "Habit & progress tracking", Icon: BarChart3 },
] as const;

export default function SetupToolPreference() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showAttScreen = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const initial = useMemo(
    () => (readSetupDraft().toolPreferences ?? []).filter((k) => k !== "all_of_it"),
    [],
  );
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (k: string) => {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  return (
    <SetupPage
      canContinue={selected.length > 0}
      onBack={() => {
        if (isSuiteFunnel) {
          navigate(
            showAttScreen ? `${setupBase}/notifications` : `${setupBase}/intensity`,
          );
          return;
        }
        const intent = readSetupDraft().primaryIntent ?? "life_rebranding";
        if (intent === "home_organization") {
          navigate(`${setupBase}/home-focus`);
          return;
        }
        if (intent === "office_work") {
          navigate(`${setupBase}/office-planning-system`);
          return;
        }
        if (intent === "moodboarding") {
          navigate(`${setupBase}/moodboard-focus`);
          return;
        }
        const cat = (readSetupDraft().desireCategory || "").trim();
        navigate(
          cat && needsSetupConditionalSpecificityPage(cat)
            ? `${setupBase}/conditional-specificity`
            : `${setupBase}/desire-category`,
        );
      }}
      onContinue={() => {
        writeSetupDraft({ toolPreferences: selected });
        const intent = readSetupDraft().primaryIntent;
        if (intent === "office_work") {
          navigate(isSuiteFunnel ? `${setupBase}/plot-loading` : `${setupBase}/begin-journey`);
          return;
        }
        navigate(`${setupBase}/workspace-template`);
      }}
    >
      <div className="space-y-4">
        <SetupHeadingBlock
          centered
          title={t("setup.toolPreference.title")}
          subtitle={t("setup.toolPreference.subtitle")}
        />

        <div className="space-y-2.5">
          {OPTIONS.map(({ key, label, Icon }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={setupIconChoiceTileClass(active)}
                style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className="flex items-center gap-3">
                  <span className={cn(SETUP_CHOICE_ICON_WRAP_CLASS, "h-9 w-9")}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className={SETUP_CHOICE_LABEL_CLASS}>
                  {t(`setup.toolPreferenceOptions.${key}`)}
                </span>
                </span>
                {active ? (
                  <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
                ) : (
                  <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </SetupPage>
  );
}

