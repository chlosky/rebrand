import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { needsSetupConditionalSpecificityPage } from "@/lib/conditionalSpecificityStep7";
import { SUPPORT_CATEGORIES } from "@/lib/affirmations-data";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import {
  Apple,
  BookOpen,
  Briefcase,
  Building2,
  Dumbbell,
  FolderKanban,
  Heart,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const MAX_SELECTIONS = 1;

const LEGACY_KEY_TO_CANONICAL: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

const ICON_BY_NAME: Record<string, LucideIcon> = {
  Career: Briefcase,
  Business: Building2,
  Learning: BookOpen,
  Finances: Wallet,
  Productivity: Zap,
  Organization: FolderKanban,
  Confidence: Sparkles,
  "Self-Love": Users,
  Connections: Heart,
  Fitness: Dumbbell,
  Nutrition: Apple,
  Discipline: Target,
};

const NAME_SET = new Set(SUPPORT_CATEGORIES.map((c) => c.name));

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

export default function SetupDesireCategory() {
  const { t } = useTranslation("onboarding");
  const { t: tTools } = useTranslation("tools");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const welcomePath = isSuiteFunnel ? "/onboarding/suite/welcome" : "/onboarding/welcome";
  const [selected, setSelected] = useState<string[]>(() => normalizeInitialSelection());

  const canContinue = selected.length > 0;

  const selectCategory = useCallback((name: string) => {
    setSelected((prev) => (prev.length === 1 && prev[0] === name ? [] : [name]));
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
        const nextAfterConditional = isSuiteFunnel
          ? `${setupBase}/current-friction`
          : `${setupBase}/tool-preference`;
        navigate(
          needsSetupConditionalSpecificityPage(primary)
            ? `${setupBase}/conditional-specificity`
            : nextAfterConditional,
        );
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 [&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title={t("setup.desireCategory.title")}
          subtitle={t("setup.desireCategory.subtitle")}
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden w-full">
          <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            <div className="grid grid-cols-2 content-start gap-2.5 pt-0.5 sm:gap-3">
              {SUPPORT_CATEGORIES.map(({ name, color }) => {
                const active = selected.includes(name);
                const Icon = ICON_BY_NAME[name] ?? Sparkles;
                const tileLabel = tTools(`supportCategoryTiles.${name}`, {
                  defaultValue: tTools(`supportCategories.${name}`),
                });
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => selectCategory(name)}
                    className={cn(
                      "flex min-w-0 items-center gap-2.5 text-left sm:gap-3",
                      setupChoiceTileWithGlowClass(active),
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
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5 sm:h-10 sm:w-10"
                      style={{ backgroundColor: `${color}22` }}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} aria-hidden />
                    </span>
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
