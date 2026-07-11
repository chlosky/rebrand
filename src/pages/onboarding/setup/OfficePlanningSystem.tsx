import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const SYSTEMS = ["kanban", "strategy_sessions", "checklists", "other"] as const;

export default function SetupOfficePlanningSystem() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";

  const [selected, setSelected] = useState<string | null>(() => {
    const k = readSetupDraft().officePlanningSystem;
    const normalized = k === "brainstorming" ? "strategy_sessions" : k;
    return normalized && SYSTEMS.includes(normalized as (typeof SYSTEMS)[number]) ? normalized : null;
  });
  const [otherText, setOtherText] = useState<string>(() => readSetupDraft().officePlanningOther ?? "");

  const select = useCallback((key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  }, []);

  const canContinue = selected != null && (selected !== "other" || otherText.trim().length > 0);

  return (
    <SetupPage
      canContinue={canContinue}
      contentFitsViewport
      plainMobileFooter
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
      <div className="flex flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          title={t("setup.officePlanning.title")}
          subtitle={t("setup.officePlanning.subtitle")}
        />
        <div className="flex flex-col gap-2.5 px-0.5 py-1 sm:gap-3">
          {SYSTEMS.map((key) => {
            const active = selected === key;

            if (key === "other") {
              const title = t(`setup.officePlanning.systems.${key}.title`);
              const description = t(`setup.officePlanning.systems.${key}.description`);
              return (
                <div key={key} className="relative">
                  <div className="invisible pointer-events-none" aria-hidden>
                    <div className={cn("flex w-full items-start text-left", setupChoiceTileWithGlowClass(false))}>
                      <div className="min-w-0 flex-1 py-0.5">
                        <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>{title}</p>
                        <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>{description}</p>
                      </div>
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
                          "absolute inset-0 flex w-full items-start text-left [backface-visibility:hidden]",
                          setupChoiceTileWithGlowClass(false),
                        )}
                      >
                        <div className="min-w-0 flex-1 py-0.5">
                          <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>{title}</p>
                          <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>{description}</p>
                        </div>
                      </button>

                      <div
                        className={cn(
                          "absolute inset-0 flex w-full flex-col text-left [backface-visibility:hidden] [transform:rotateY(180deg)]",
                          setupChoiceTileWithGlowClass(true),
                          !active && "pointer-events-none",
                        )}
                        style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                      >
                        <button type="button" onClick={() => select(key)} className="w-full shrink-0 text-left">
                          <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>{title}</p>
                        </button>
                        <Textarea
                          autoFocus={active}
                          rows={2}
                          value={otherText}
                          onChange={(e) => setOtherText(e.target.value)}
                          placeholder={t("setup.officePlanning.systems.other.placeholder")}
                          className={cn(
                            SETUP_CHOICE_DESC_CLASS,
                            "mt-1 min-h-0 flex-1 resize-none border-0 bg-transparent p-0 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
                          )}
                        />
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
            );
          })}
        </div>
      </div>
    </SetupPage>
  );
}
