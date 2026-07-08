import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const OPTIONS = [
  "home_plan_routines",
  "home_chores_cleaning",
  "home_meal_planning",
  "home_family_kids",
  "home_seasonal_reset",
] as const;

export default function SetupHomeFocus() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";

  const [selected, setSelected] = useState<string | null>(() => {
    const k = readSetupDraft().homeFocusKey;
    return k && OPTIONS.includes(k as (typeof OPTIONS)[number]) ? k : null;
  });

  const select = useCallback((key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  }, []);

  return (
    <SetupPage
      canContinue={selected != null}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/starting-system`)}
      onContinue={() => {
        if (!selected) return;
        writeSetupDraft({
          homeFocusKey: selected,
        });
        navigate(`${setupBase}/attribution`);
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          title={t("setup.homeFocus.title")}
          subtitle={t("setup.homeFocus.subtitle")}
        />
        <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-0.5 py-1 pb-2">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {OPTIONS.map((key) => {
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={cn(
                    "flex w-full items-center text-left",
                    setupChoiceTileWithGlowClass(active),
                  )}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>
                    {t(`setup.homeFocus.options.${key}`)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
