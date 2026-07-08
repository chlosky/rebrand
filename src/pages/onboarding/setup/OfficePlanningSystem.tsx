import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  SETUP_TEXTAREA_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const SYSTEMS = ["eisenhower", "kanban", "gantt", "okrs", "other"] as const;

export default function SetupOfficePlanningSystem() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";

  const [selected, setSelected] = useState<string | null>(() => {
    const k = readSetupDraft().officePlanningSystem;
    return k && SYSTEMS.includes(k as (typeof SYSTEMS)[number]) ? k : null;
  });
  const [otherText, setOtherText] = useState<string>(() => readSetupDraft().officePlanningOther ?? "");

  const select = useCallback((key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  }, []);

  const canContinue = selected != null && (selected !== "other" || otherText.trim().length > 0);

  return (
    <SetupPage
      canContinue={canContinue}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/starting-system`)}
      onContinue={() => {
        if (!canContinue || !selected) return;
        writeSetupDraft({
          officePlanningSystem: selected,
          officePlanningOther: selected === "other" ? otherText.trim() : undefined,
        });
        navigate(`${setupBase}/attribution`);
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          title={t("setup.officePlanning.title")}
          subtitle={t("setup.officePlanning.subtitle")}
        />
        <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-0.5 py-1 pb-2">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            {SYSTEMS.map((key) => {
              const active = selected === key;
              return (
                <div key={key} className="flex flex-col gap-2.5 sm:gap-3">
                  <button
                    type="button"
                    onClick={() => select(key)}
                    className={cn(
                      "flex w-full items-start text-left",
                      setupChoiceTileWithGlowClass(active),
                    )}
                    style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                  >
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>
                        {t(`setup.officePlanning.systems.${key}.title`)}
                      </p>
                      <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>
                        {t(`setup.officePlanning.systems.${key}.description`)}
                      </p>
                    </div>
                  </button>
                  {key === "other" && active && (
                    <textarea
                      autoFocus
                      value={otherText}
                      onChange={(e) => setOtherText(e.target.value)}
                      placeholder={t("setup.officePlanning.systems.other.placeholder")}
                      className={SETUP_TEXTAREA_CLASS}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
