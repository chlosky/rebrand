import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { needsFocusDetailsStep } from "@/lib/focusDetailOptions";
import { FOCUS_CATEGORIES } from "@/lib/focusCategories";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const MAX_SELECTIONS = 3;

const LEGACY_KEY_TO_CANONICAL: Record<string, string> = {
  sp_love: "Love & Relationships",
  Connections: "Love & Relationships",
  money_wealth: "Career & Money",
  Finances: "Career & Money",
  Career: "Career & Money",
  career_success: "Career & Money",
  Business: "Career & Money",
  self_concept: "Identity",
  Confidence: "Identity",
  peace_detachment: "Identity",
  Discipline: "Identity",
  beauty_self_image: "Beauty & Wellness",
  "Self-Love": "Beauty & Wellness",
  Nutrition: "Health & Fitness",
  Fitness: "Health & Fitness",
  Learning: "College & School",
  Organization: "Organization & Plan",
  Productivity: "Organization & Plan",
  multiple: "Organization & Plan",
  custom: "Organization & Plan",
};

const NAME_SET = new Set(FOCUS_CATEGORIES.map((c) => c.name));

function normalizeInitialSelection(): string[] {
  const d = readSetupDraft();
  if (Array.isArray(d.desireCategories) && d.desireCategories.length > 0) {
    const next = d.desireCategories
      .filter((x): x is string => typeof x === "string" && NAME_SET.has(x))
      .slice(0, MAX_SELECTIONS);
    if (next.length > 0) return next;
  }
  const raw = typeof d.desireCategory === "string" ? d.desireCategory.trim() : "";
  if (NAME_SET.has(raw)) return [raw];
  const legacy = LEGACY_KEY_TO_CANONICAL[raw];
  if (legacy && NAME_SET.has(legacy)) return [legacy];
  return [];
}

export default function SetupFocusCategories() {
  const { t } = useTranslation("onboarding");
  const { t: tTools } = useTranslation("tools");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const [selected, setSelected] = useState<string[]>(() => normalizeInitialSelection());

  const canContinue = selected.length > 0;

  const toggleCategory = useCallback((name: string) => {
    setSelected((prev) => {
      if (prev.includes(name)) return prev.filter((x) => x !== name);
      if (prev.length >= MAX_SELECTIONS) return prev;
      return [...prev, name];
    });
  }, []);

  return (
    <SetupPage
      canContinue={canContinue}
      disableNativeScrollViewport
      onBack={() => navigate(isSuiteFunnel ? `${setupBase}/name` : `${setupBase}/primary-intent`)}
      onContinue={() => {
        const primary = selected[0]!;
        writeSetupDraft({
          desireCategory: primary,
          desireCategories: selected,
          conditionalSpecificity: {},
        });
        const nextAfterDetails = isSuiteFunnel
          ? `${setupBase}/current-friction`
          : `${setupBase}/tool-preference`;
        navigate(
          needsFocusDetailsStep(primary)
            ? `${setupBase}/focus-details`
            : nextAfterDetails,
        );
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 [&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title={t("setup.focusCategories.title")}
          subtitle={t("setup.focusCategories.subtitle")}
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden w-full">
          <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            <div className="grid grid-cols-2 content-start gap-2.5 pt-0.5 sm:gap-3">
              {FOCUS_CATEGORIES.map(({ name, color }) => {
                const active = selected.includes(name);
                const atLimit = !active && selected.length >= MAX_SELECTIONS;
                const tileLabel = tTools(`focusCategoryTiles.${name}`, {
                  defaultValue: tTools(`focusCategories.${name}`),
                });
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => toggleCategory(name)}
                    disabled={atLimit}
                    className={cn(
                      "flex min-w-0 items-center text-left",
                      setupChoiceTileWithGlowClass(active),
                      atLimit && "opacity-40",
                    )}
                    style={
                      active
                        ? {
                            borderColor: `${color}cc`,
                            boxShadow: `0 0 16px ${color}70, 0 0 32px ${color}35, ${SETUP_CHOICE_TILE_SELECTED_GLOW}`,
                          }
                        : undefined
                    }
                  >
                    <span className="min-w-0 flex-1 font-sans text-xs font-semibold leading-snug text-zinc-900 sm:text-sm">
                      {tileLabel}
                    </span>
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
