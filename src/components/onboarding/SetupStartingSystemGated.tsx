import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import type { StartingSystem } from "@/lib/boards/starterTemplates";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const STARTING_SYSTEMS: StartingSystem[] = [
  "life_rebranding",
  "home_organization",
  "office_work",
  "moodboarding",
];

function nextRouteForStartingSystem(startingSystem: StartingSystem, setupBase: string): string {
  switch (startingSystem) {
    case "life_rebranding":
      return `${setupBase}/focus-categories`;
    case "home_organization":
      return `${setupBase}/home-focus`;
    case "office_work":
      return `${setupBase}/office-planning-system`;
    case "moodboarding":
      return `${setupBase}/moodboard-focus`;
  }
}

/** Starting system step. */
export default function SetupStartingSystemGated() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const setupBase = "/onboarding/setup";

  const [selected, setSelected] = useState<StartingSystem | null>(() => {
    const id = readSetupDraft().startingSystem;
    return id && STARTING_SYSTEMS.includes(id) ? id : null;
  });

  const selectStartingSystem = useCallback((id: StartingSystem) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  return (
    <SetupPage
      canContinue={selected != null}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/name`)}
      onContinue={() => {
        if (!selected) return;
        writeSetupDraft({ startingSystem: selected });
        navigate(nextRouteForStartingSystem(selected, setupBase));
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 [&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title={t("setup.startingSystem.title")}
          subtitle={t("setup.startingSystem.subtitle")}
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden w-full">
          <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            <div className="flex flex-col gap-2.5 pt-0.5 sm:gap-3">
              {STARTING_SYSTEMS.map((id) => {
                const active = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectStartingSystem(id)}
                    className={cn(
                      "relative flex w-full items-start overflow-hidden text-left",
                      setupChoiceTileWithGlowClass(active),
                    )}
                    style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                  >
                    {id === "life_rebranding" ? (
                      <span className="absolute right-0 top-0 rounded-bl-md bg-zinc-900 px-1.5 py-0.5 text-[8px] font-semibold uppercase tracking-wide text-white">
                        ★ Recommended
                      </span>
                    ) : null}
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>
                        {t(`setup.startingSystem.options.${id}.title`)}
                      </p>
                      <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>
                        {t(`setup.startingSystem.options.${id}.description`)}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
