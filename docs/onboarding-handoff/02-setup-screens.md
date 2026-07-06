# Part 2 — Setup screen code

## src/pages/onboarding/setup/PrimaryIntent.tsx

```tsx
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import type { PrimarySetupIntent } from "@/lib/boards/starterTemplates";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const INTENTS: PrimarySetupIntent[] = [
  "life_rebranding",
  "home_organization",
  "office_work",
  "moodboarding",
];

function nextRouteForIntent(intent: PrimarySetupIntent, setupBase: string): string {
  switch (intent) {
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

export default function SetupPrimaryIntent() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const welcomePath = isSuiteFunnel ? "/onboarding/suite/welcome" : "/onboarding/welcome";

  const [selected, setSelected] = useState<PrimarySetupIntent | null>(() => {
    const id = readSetupDraft().primaryIntent;
    return id && INTENTS.includes(id) ? id : null;
  });

  const selectIntent = useCallback((id: PrimarySetupIntent) => {
    setSelected((prev) => (prev === id ? null : id));
  }, []);

  return (
    <SetupPage
      canContinue={selected != null}
      disableNativeScrollViewport
      onBack={() => navigate(welcomePath)}
      onContinue={() => {
        if (!selected) return;
        writeSetupDraft({ primaryIntent: selected });
        navigate(nextRouteForIntent(selected, setupBase));
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 [&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title={t("setup.primaryIntent.title")}
          subtitle={t("setup.primaryIntent.subtitle")}
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden w-full">
          <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            <div className="flex flex-col gap-2.5 pt-0.5 sm:gap-3">
              {INTENTS.map((id) => {
                const active = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectIntent(id)}
                    className={cn(
                      "flex w-full items-start text-left",
                      setupChoiceTileWithGlowClass(active),
                    )}
                    style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                  >
                    <div className="min-w-0 flex-1 py-0.5">
                      <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>
                        {t(`setup.primaryIntent.options.${id}.title`)}
                      </p>
                      <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>
                        {t(`setup.primaryIntent.options.${id}.description`)}
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

```

---

## src/pages/onboarding/setup/FocusCategories.tsx

```tsx
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { FOUR_BOARD_FOCUS_CATEGORIES_SLUG } from "@/lib/boards/starterTemplates";
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
          boardStarterTemplateSlug: FOUR_BOARD_FOCUS_CATEGORIES_SLUG,
        });
        navigate(
          isSuiteFunnel ? `${setupBase}/current-friction` : `${setupBase}/tool-preference`,
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

```

---

## src/pages/onboarding/setup/FocusDetails.tsx

```tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";

/** Legacy route — forwards to the next setup step (conditional detail questions removed). */
export default function SetupFocusDetails() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  useEffect(() => {
    navigate(isSuiteFunnel ? `${setupBase}/current-friction` : `${setupBase}/tool-preference`, {
      replace: true,
    });
  }, [isSuiteFunnel, navigate, setupBase]);

  return null;
}

```

---

## src/pages/onboarding/setup/HomeFocus.tsx

```tsx
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { HOME_FOCUS_TO_TEMPLATE } from "@/lib/boards/starterTemplates";
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
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

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
      onBack={() => navigate(`${setupBase}/primary-intent`)}
      onContinue={() => {
        if (!selected) return;
        const slug = HOME_FOCUS_TO_TEMPLATE[selected];
        writeSetupDraft({
          homeFocusKey: selected,
          boardStarterTemplateSlug: slug,
        });
        navigate(`${setupBase}/tool-preference`);
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

```

---

## src/pages/onboarding/setup/OfficePlanningSystem.tsx

```tsx
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { OFFICE_SYSTEM_TO_TEMPLATE } from "@/lib/boards/starterTemplates";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const SYSTEMS = ["kanban", "gantt", "eisenhower", "okrs", "five_s"] as const;

export default function SetupOfficePlanningSystem() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const [selected, setSelected] = useState<string | null>(() => {
    const k = readSetupDraft().officePlanningSystem;
    return k && SYSTEMS.includes(k as (typeof SYSTEMS)[number]) ? k : null;
  });

  const select = useCallback((key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  }, []);

  return (
    <SetupPage
      canContinue={selected != null}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/primary-intent`)}
      onContinue={() => {
        if (!selected) return;
        const slug = OFFICE_SYSTEM_TO_TEMPLATE[selected];
        writeSetupDraft({
          officePlanningSystem: selected,
          boardStarterTemplateSlug: slug,
        });
        navigate(`${setupBase}/tool-preference`);
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
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/MoodboardFocus.tsx

```tsx
import { useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { MOODBOARD_FOCUS_TO_TEMPLATE } from "@/lib/boards/starterTemplates";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

const OPTIONS = [
  "mood_aesthetic_style",
  "mood_interiors_space",
  "mood_travel_inspo",
  "mood_events_weddings",
  "mood_brand_creative",
] as const;

export default function SetupMoodboardFocus() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const [selected, setSelected] = useState<string | null>(() => {
    const k = readSetupDraft().moodboardFocusKey;
    return k && OPTIONS.includes(k as (typeof OPTIONS)[number]) ? k : null;
  });

  const select = useCallback((key: string) => {
    setSelected((prev) => (prev === key ? null : key));
  }, []);

  return (
    <SetupPage
      canContinue={selected != null}
      disableNativeScrollViewport
      onBack={() => navigate(`${setupBase}/primary-intent`)}
      onContinue={() => {
        if (!selected) return;
        const slug = MOODBOARD_FOCUS_TO_TEMPLATE[selected];
        writeSetupDraft({
          moodboardFocusKey: selected,
          boardStarterTemplateSlug: slug,
        });
        navigate(`${setupBase}/tool-preference`);
      }}
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          title={t("setup.moodboardFocus.title")}
          subtitle={t("setup.moodboardFocus.subtitle")}
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
                    {t(`setup.moodboardFocus.options.${key}`)}
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

```

---

## src/pages/onboarding/setup/ToolPreference.tsx

```tsx
import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";

/**
 * The standalone tool-preference step was removed from the flow. This route now
 * forwards straight to the next screen so any lingering links stay valid, keeping
 * both tools enabled by default (they can be changed inside the app).
 */
export default function SetupToolPreference() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  useEffect(() => {
    writeSetupDraft({ toolPreferences: ["boards_workspace", "daily_wins_progress"] });
    const intent = readSetupDraft().primaryIntent;
    const next =
      intent === "office_work"
        ? isSuiteFunnel
          ? `${setupBase}/plot-loading`
          : `${setupBase}/begin-journey`
        : `${setupBase}/workspace-template`;
    navigate(next, { replace: true });
  }, [isSuiteFunnel, navigate, setupBase]);

  return null;
}

```

---

## src/pages/onboarding/setup/WorkspaceTemplate.tsx

```tsx
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  DEFAULT_FOUR_BOARD_TEMPLATE,
  FOUR_BOARD_FOCUS_CATEGORIES_SLUG,
  mapFocusCategoryToColorKey,
  normalizeFocusCategoryNames,
  templatesForIntent,
} from "@/lib/boards/starterTemplates";
import { boardFillForKey } from "@/lib/boards/colors";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";
import { CheckCircle2, Circle } from "lucide-react";

function readSelectedFocusCategories(): string[] {
  const draft = readSetupDraft();
  const fromList = normalizeFocusCategoryNames(draft.desireCategories);
  if (fromList.length > 0) return fromList;
  const primary = typeof draft.desireCategory === "string" ? draft.desireCategory.trim() : "";
  return normalizeFocusCategoryNames(primary ? [primary] : []);
}

export default function SetupWorkspaceTemplate() {
  const { t } = useTranslation("onboarding");
  const { t: tTools } = useTranslation("tools");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const intent = readSetupDraft().primaryIntent ?? "life_rebranding";
  const isLifeRebrand = intent === "life_rebranding";
  const selectedCategories = useMemo(() => readSelectedFocusCategories(), []);
  const templates = templatesForIntent(intent);

  const [selectedSlug, setSelectedSlug] = useState(() => {
    const slug = readSetupDraft().boardStarterTemplateSlug?.trim();
    if (slug && templates.some((tpl) => tpl.slug === slug)) return slug;
    if (intent === "life_rebranding") return FOUR_BOARD_FOCUS_CATEGORIES_SLUG;
    return templates[0]?.slug ?? DEFAULT_FOUR_BOARD_TEMPLATE.slug;
  });

  const selectTemplate = useCallback((slug: string) => {
    setSelectedSlug(slug);
  }, []);

  const handleBack = () => {
    if (isSuiteFunnel) {
      const showAttScreen = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
      navigate(showAttScreen ? `${setupBase}/notifications` : `${setupBase}/intensity`);
      return;
    }
    if (intent === "home_organization") {
      navigate(`${setupBase}/home-focus`);
      return;
    }
    if (intent === "moodboarding") {
      navigate(`${setupBase}/moodboard-focus`);
      return;
    }
    const cat = (readSetupDraft().desireCategory || "").trim();
    navigate(cat ? `${setupBase}/focus-categories` : `${setupBase}/primary-intent`);
  };

  const handleContinue = () => {
    writeSetupDraft({
      boardStarterTemplateSlug: isLifeRebrand ? FOUR_BOARD_FOCUS_CATEGORIES_SLUG : selectedSlug,
    });
    navigate(isSuiteFunnel ? `${setupBase}/plot-loading` : `${setupBase}/begin-journey`);
  };

  return (
    <SetupPage
      canContinue={isLifeRebrand ? selectedCategories.length > 0 : Boolean(selectedSlug)}
      disableNativeScrollViewport
      onBack={handleBack}
      onContinue={handleContinue}
      continueText={
        isLifeRebrand ? t("setup.workspaceTemplate.summary.continue", { defaultValue: "Build my boards" }) : undefined
      }
    >
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 [&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title={
            isLifeRebrand
              ? t("setup.workspaceTemplate.summary.title", { defaultValue: "Your starter boards" })
              : t(`setup.workspaceTemplate.titleByIntent.${intent}`, {
                  defaultValue: t("setup.workspaceTemplate.title"),
                })
          }
          subtitle={
            isLifeRebrand
              ? t("setup.workspaceTemplate.summary.subtitle", {
                  defaultValue: "We'll create one focus board for each area you selected, plus The Plan.",
                })
              : t(`setup.workspaceTemplate.subtitleByIntent.${intent}`, {
                  defaultValue: t("setup.workspaceTemplate.subtitle"),
                })
          }
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col overflow-hidden w-full">
          <div className="relative z-[1] min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            {isLifeRebrand ? (
              <div className="flex flex-col gap-2.5 pt-0.5 sm:gap-3">
                {selectedCategories.map((category, index) => (
                  <div
                    key={category}
                    className="flex w-full items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left"
                    style={{ boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW }}
                  >
                    <span
                      className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                      style={{ backgroundColor: boardFillForKey(mapFocusCategoryToColorKey(category, index)) }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>
                        {tTools(`focusCategoryTiles.${category}`, {
                          defaultValue: tTools(`focusCategories.${category}`, { defaultValue: category }),
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div
                  className="flex w-full items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 text-left"
                  style={{ boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW }}
                >
                  <span
                    className="mt-0.5 h-3 w-3 shrink-0 rounded-full"
                    style={{ backgroundColor: boardFillForKey("white_opaque") }}
                  />
                  <div className="min-w-0 flex-1">
                    <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>
                      {t("setup.workspaceTemplate.summary.planTitle", { defaultValue: "The Plan" })}
                    </p>
                    <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>
                      {t("setup.workspaceTemplate.summary.planDescription", {
                        defaultValue: "Dates, goals, reminders, and next steps.",
                      })}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-2.5 pt-0.5 sm:gap-3">
                {templates.map((template) => {
                  const active = selectedSlug === template.slug;
                  const name = t(`setup.workspaceTemplate.options.${template.slug}.name`, {
                    defaultValue: template.name,
                  });
                  const description = t(`setup.workspaceTemplate.options.${template.slug}.description`, {
                    defaultValue: template.description,
                  });
                  return (
                    <button
                      key={template.slug}
                      type="button"
                      onClick={() => selectTemplate(template.slug)}
                      className={cn("flex w-full items-start gap-3 text-left", setupChoiceTileWithGlowClass(active))}
                      style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                    >
                      <div className="min-w-0 flex-1">
                        <p className={cn(SETUP_CHOICE_TITLE_CLASS, "text-sm sm:text-base")}>{name}</p>
                        <p className={cn(SETUP_CHOICE_DESC_CLASS, "mt-1")}>{description}</p>
                        <div className="mt-2.5 flex flex-wrap gap-1.5">
                          {template.boards.map((b) => (
                            <span
                              key={b.title}
                              className="rounded-md px-2 py-0.5 text-[10px] font-medium text-zinc-800 ring-1 ring-zinc-200"
                              style={{ backgroundColor: boardFillForKey(b.color_key) }}
                            >
                              {b.title}
                            </span>
                          ))}
                        </div>
                      </div>
                      {active ? (
                        <CheckCircle2 className={cn("mt-0.5", SETUP_CHOICE_CHECK_ACTIVE_CLASS)} />
                      ) : (
                        <Circle className={cn("mt-0.5", SETUP_CHOICE_CHECK_INACTIVE_CLASS)} />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/BeginJourney.tsx

```tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { OnboardingTypewriter } from "@/components/onboarding/OnboardingTypewriter";
import { SETUP_HEADING_SUBTITLE_CLASS, SETUP_HEADING_TITLE_CLASS } from "@/lib/onboardingSetupTheme";
import { readSetupDraft } from "@/lib/setupDraft";
import { useTranslation } from "react-i18next";

/** Short beat after headline finishes before the subtitle line begins typing. */
const SUBTITLE_DELAY_MS = 320;

export default function SetupBeginJourney() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const [showSubtitle, setShowSubtitle] = useState(false);

  return (
    <SetupPage
      canContinue
      onBack={() => {
        if (isSuiteFunnel) {
          navigate(`${setupBase}/current-friction`);
          return;
        }
        const intent = readSetupDraft().primaryIntent;
        if (intent === "office_work") {
          navigate(`${setupBase}/office-planning-system`);
          return;
        }
        navigate(`${setupBase}/workspace-template`);
      }}
      onContinue={() => navigate(`${setupBase}/attribution`)}
    >
      <div className="space-y-3">
        <OnboardingTypewriter
          text={t("setup.beginJourney.lead")}
          as="h1"
          reserveMinHeight={false}
          speedMs={(n) => (n < 100 ? 42 : n < 220 ? 32 : 26)}
          contentClassName={cn(
            "!min-h-0 !pl-0 max-w-none text-center",
            SETUP_HEADING_TITLE_CLASS,
            "!text-[26px] sm:!text-[30px]",
          )}
          onTypingComplete={() => {
            window.setTimeout(() => setShowSubtitle(true), SUBTITLE_DELAY_MS);
          }}
        />
        {showSubtitle ? (
          <OnboardingTypewriter
            text={t("setup.beginJourney.subtitle")}
            as="div"
            reserveMinHeight={false}
            speedMs={36}
            className="animate-in fade-in-0 duration-300"
            contentClassName={cn("!min-h-0 !pl-0 max-w-none text-center", SETUP_HEADING_SUBTITLE_CLASS)}
          />
        ) : null}
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/CurrentFriction.tsx

```tsx
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Textarea } from "@/components/ui/textarea";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { useTranslation } from "react-i18next";
import { SETUP_BELIEF_TEXT_MAX } from "./constants";
import { SETUP_TEXTAREA_CLASS } from "@/lib/onboardingSetupTheme";

export default function SetupCurrentFriction() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  useEffect(() => {
    if (!isSuiteFunnel) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [isSuiteFunnel, navigate, setupBase]);

  const [text, setText] = useState(
    () =>
      (readSetupDraft().currentFriction ?? "").slice(0, SETUP_BELIEF_TEXT_MAX),
  );

  const trimmed = text.trim();
  const canContinue = trimmed.length > 0;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate(`${setupBase}/focus-categories`)}
      onContinue={() => {
        writeSetupDraft({
          currentFriction: text.slice(0, SETUP_BELIEF_TEXT_MAX).trim(),
        });
        navigate(`${setupBase}/begin-journey`);
      }}
    >
      <SetupHeadingBlock
        centered
        title={t("setup.currentFriction.title")}
        subtitle={t("setup.currentFriction.subtitle")}
      />

      <Textarea
        id="currentFriction"
        value={text}
        onChange={(e) =>
          setText(e.target.value.slice(0, SETUP_BELIEF_TEXT_MAX))
        }
        placeholder={t("setup.currentFriction.placeholder")}
        maxLength={SETUP_BELIEF_TEXT_MAX}
        className={SETUP_TEXTAREA_CLASS}
        aria-label="Describe the belief you want to change"
      />
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/Attribution.tsx

```tsx
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useTranslation } from "react-i18next";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_LABEL_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

const OPTION_KEYS = [
  "tiktok",
  "instagram",
  "app_store",
  "friend",
  "youtube",
  "search",
  "other",
] as const;

export default function SetupAttribution() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const initial = useMemo(() => readSetupDraft().attributionSource ?? null, []);
  const [selected, setSelected] = useState<string | null>(initial);

  useEffect(() => {
    trackMarketingConversion("web_onboarding_attribution_view", {
      source: "onboarding_attribution",
      page_path: `${setupBase}/attribution`,
    });
  }, [setupBase]);

  return (
    <SetupPage
      canContinue={selected != null}
      onBack={() => navigate(`${setupBase}/begin-journey`)}
      onContinue={() => {
        if (!selected) return;
        void writeSetupDraft({ attributionSource: selected });
        trackMarketingConversion("web_onboarding_attribution_submit", {
          source: "onboarding_attribution",
          attribution_source: selected,
        });
        navigate(`${setupBase}/intensity`);
      }}
    >
      <SetupHeadingBlock
        centered
        title={t("setup.attribution.title")}
        subtitle={t("setup.attribution.subtitle")}
      />

      <div className="relative z-[1] space-y-2.5 pt-6">
        {OPTION_KEYS.map((key) => {
          const active = selected === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setSelected((prev) => (prev === key ? null : key))}
              className={cn(setupTextChoiceTileClass(active), "items-center justify-between text-left")}
              style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className={SETUP_CHOICE_LABEL_CLASS}>{t(`setup.attribution.options.${key}`)}</span>
              {active ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-900" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
              )}
            </button>
          );
        })}
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/Intensity.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";
import { RoutineTimeZoneSelect } from "@/components/RoutineTimeZoneSelect";
import { useAuth } from "@/contexts/AuthContext";
import i18n from "@/i18n";
import { resolveAppLocale } from "@/lib/locale";
import {
  attachOneSignalListenersOnce,
  bootstrapOneSignal,
  oneSignalLogin,
  optInOneSignalPush,
  readDeviceTimeZone,
  requestOneSignalPushPermission,
  syncRoutineOneSignalTags,
  syncOneSignalUserLanguage,
} from "@/services/oneSignal";
import { requestNativePushPermission } from "@/services/pushNotifications";
import { useTranslation } from "react-i18next";

type IntensityId = "light" | "consistent" | "locked_in";

const ROUTINE_ALERT_DEFAULTS: Record<IntensityId, string[]> = {
  light: ["21:30"],
  consistent: ["07:00", "21:30"],
  locked_in: ["07:00", "18:30", "21:30"],
};

export default function SetupIntensity() {
  const { t } = useTranslation(["onboarding", "settings"]);

  const routineItemLabel = (slug: string) => t(`settings:routine.itemLabels.${slug}`);

  const intensityOptions: {
    id: IntensityId;
    title: string;
    tagline: string;
    description: string;
  }[] = [
    {
      id: "light",
      title: t("setup.intensity.light.title"),
      tagline: t("setup.intensity.light.tagline"),
      description: t("setup.intensity.light.description"),
    },
    {
      id: "consistent",
      title: t("setup.intensity.consistent.title"),
      tagline: t("setup.intensity.consistent.tagline"),
      description: t("setup.intensity.consistent.description"),
    },
    {
      id: "locked_in",
      title: t("setup.intensity.lockedIn.title"),
      tagline: t("setup.intensity.lockedIn.tagline"),
      description: t("setup.intensity.lockedIn.description"),
    },
  ];

  const routineAlertLabels: Record<IntensityId, string[]> = {
    light: [t("setup.intensity.alerts.alert")],
    consistent: [
      t("setup.intensity.alerts.first"),
      t("setup.intensity.alerts.second"),
    ],
    locked_in: [
      t("setup.intensity.alerts.first"),
      t("setup.intensity.alerts.second"),
      t("setup.intensity.alerts.third"),
    ],
  };
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const preferredLocale = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showAttScreen =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const initial = useMemo(() => {
    const d = readSetupDraft();
    const raw = d.intensity;
    return raw === "light" || raw === "consistent" || raw === "locked_in" ? raw : null;
  }, []);
  const intensityTitle = useMemo(() => t("setup.intensity.title"), [t]);
  const [selected, setSelected] = useState<IntensityId | null>(initial);
  const [notificationChoice, setNotificationChoice] = useState<"yes" | "not_now" | null>(null);
  const [alertTimes, setAlertTimes] = useState<string[]>(
    initial ? [...ROUTINE_ALERT_DEFAULTS[initial]] : ROUTINE_ALERT_DEFAULTS.consistent,
  );
  const [timeZone, setTimeZone] = useState(() => readDeviceTimeZone());
  const [busy, setBusy] = useState(false);
  const isAndroidNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";

  useEffect(() => {
    setTimeZone(readDeviceTimeZone());
  }, []);

  useEffect(() => {
    if (!selected) return;
    setAlertTimes([...ROUTINE_ALERT_DEFAULTS[selected]]);
  }, [selected]);

  useEffect(() => {
    if (notificationChoice === "yes") {
      setTimeZone(readDeviceTimeZone());
    }
  }, [notificationChoice]);

  const nextRoute =
    showAttScreen && isSuiteFunnel
      ? `${setupBase}/notifications`
      : isSuiteFunnel
        ? `${setupBase}/tool-preference`
        : `${setupBase}/plot-loading`;

  const handleBack = () => {
    navigate(`${setupBase}/attribution`);
  };

  const persistAndContinue = async (opts: {
    intensity: IntensityId;
    notificationsEnabled: boolean;
    permissionStatus: "granted" | "denied" | "skipped";
    requestPermission: boolean;
  }) => {
    if (busy) return;
    setBusy(true);

    const finish = () => {
      navigate(nextRoute);
      setBusy(false);
    };

    try {
      let permissionStatus = opts.permissionStatus;
      let notificationsEnabled = opts.notificationsEnabled;

      if (opts.requestPermission && isAndroidNative) {
        let osGranted = false;
        try {
          osGranted = await requestNativePushPermission();
          if (!osGranted) {
            notificationsEnabled = false;
            permissionStatus = "denied";
          }
        } catch {
          notificationsEnabled = false;
          permissionStatus = "denied";
        }

        if (osGranted) {
          try {
            await bootstrapOneSignal();
            attachOneSignalListenersOnce();
            if (user?.id) {
              await oneSignalLogin(user.id);
            }
            await syncOneSignalUserLanguage(preferredLocale);
            const optedIn = await optInOneSignalPush();
            if (optedIn) {
              notificationsEnabled = true;
              permissionStatus = "granted";
            } else {
              notificationsEnabled = false;
              permissionStatus = "skipped";
            }
          } catch (e) {
            console.warn("[Intensity] OneSignal setup after permission failed:", e);
            notificationsEnabled = false;
            permissionStatus = "skipped";
          }
        }
      }

      const draft = readSetupDraft();
      const toolPrefs = Array.isArray(draft.toolPreferences)
        ? draft.toolPreferences.filter((t): t is string => typeof t === "string")
        : [];

      const routineItems: { slug: string; label: string; cadence: string; target_per_week: number }[] = [];

      if (toolPrefs.includes("boards_workspace") || toolPrefs.length === 0) {
        routineItems.push({
          slug: "boards_review",
          label: routineItemLabel("boards_review"),
          cadence: "daily",
          target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 5 : 3,
        });
      }
      if (toolPrefs.includes("daily_wins_progress")) {
        routineItems.push({
          slug: "progress_review",
          label: routineItemLabel("progress_review"),
          cadence: "weekly",
          target_per_week: opts.intensity === "locked_in" ? 2 : 1,
        });
      }
      if (routineItems.length === 0) {
        routineItems.push({
          slug: "boards_review",
          label: routineItemLabel("boards_review"),
          cadence: "daily",
          target_per_week: opts.intensity === "locked_in" ? 7 : opts.intensity === "consistent" ? 5 : 3,
        });
      }

      if (opts.requestPermission && Capacitor.isNativePlatform() && !isAndroidNative) {
        try {
          const granted = await requestOneSignalPushPermission(true);
          notificationsEnabled = granted;
          permissionStatus = granted ? "granted" : "denied";
        } catch {
          notificationsEnabled = false;
          permissionStatus = "denied";
        }
      }

      void writeSetupDraft({
        intensity: opts.intensity,
        routineItems,
        appNotificationsConsent: notificationsEnabled,
        notificationPermissionStatus: permissionStatus,
        routineNotificationTimes: notificationsEnabled ? alertTimes : [],
        timezone: timeZone,
      });

      if (Capacitor.isNativePlatform()) {
        void syncRoutineOneSignalTags({
          intensity: opts.intensity,
          notificationsEnabled,
          permissionStatus,
          alertTimes: notificationsEnabled ? alertTimes : [],
          timezone: timeZone,
          preferredLocale,
        }).catch((e) => {
          console.warn("[Intensity] OneSignal tag sync failed:", e);
        });
      }

      finish();
    } catch (e) {
      console.warn("[Intensity] persistAndContinue failed:", e);
      finish();
    }
  };

  const handleSetRoutine = () => {
    if (!selected) return;
    const choice = notificationChoice ?? "not_now";
    void persistAndContinue({
      intensity: selected,
      notificationsEnabled: choice === "yes",
      permissionStatus: choice === "yes" ? "granted" : "skipped",
      requestPermission: choice === "yes" && Capacitor.isNativePlatform(),
    });
  };

  const canContinue = selected !== null && !busy;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={handleBack}
      onContinue={handleSetRoutine}
      continueText={t("setup.intensity.continue", { defaultValue: "Continue" })}
    >
      <SetupHeadingBlock
        centered
        title={intensityTitle}
        subtitle={t("setup.intensity.subtitle")}
      />

      <div className="relative z-[1] space-y-3 pt-6">
        {intensityOptions.map((option) => {
          const active = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              disabled={busy}
              onClick={() => setSelected(option.id)}
              className={cn(setupTextChoiceTileClass(active), "items-start text-left")}
              style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className="min-w-0 flex-1 space-y-1">
                <span className="block font-sans text-base font-semibold text-zinc-900">{option.title}</span>
                <span className="block font-sans text-sm font-medium text-zinc-600">{option.tagline}</span>
                <span className={cn("block text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
                  {option.description}
                </span>
              </span>
              {active ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-zinc-900" />
              ) : (
                <Circle className="mt-0.5 h-5 w-5 shrink-0 text-zinc-300" />
              )}
            </button>
          );
        })}

        <div className="space-y-3 pt-4">
          <p className="text-left font-sans text-sm font-medium leading-snug text-zinc-800">
            {t("setup.intensity.notificationsQuestion")}
          </p>

          <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
            {t("setup.intensity.notificationsDescription", {
              defaultValue: t("setup.intensity.notificationsHint"),
            })}
          </p>

          <div className="grid grid-cols-2 gap-3">
            {(
              [
                { id: "yes" as const, label: t("setup.intensity.yes") },
                { id: "not_now" as const, label: t("setup.intensity.notNow") },
              ] as const
            ).map((option) => {
              const active = notificationChoice === option.id;
              return (
                <button
                  key={option.id}
                  type="button"
                  disabled={busy}
                  onClick={() => setNotificationChoice(option.id)}
                  className={cn(setupTextChoiceTileClass(active), "items-center justify-center text-center")}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className="font-sans text-base font-semibold text-zinc-900">{option.label}</span>
                  {active ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-zinc-900" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-zinc-300" />
                  )}
                </button>
              );
            })}
          </div>

          {notificationChoice === "yes" && selected ? (
            <div className="space-y-2 pt-2">
              <p className="text-left font-sans text-sm font-medium text-zinc-800">
                {t("setup.intensity.dailyTime")}
              </p>
              <RoutineTimeZoneSelect
                id="onboarding-routine-timezone"
                value={timeZone}
                disabled={busy}
                onChange={(tz) => {
                  setTimeZone(tz);
                  void writeSetupDraft({ timezone: tz });
                }}
              />
              {routineAlertLabels[selected].map((label, index) => (
                <div key={label} className="flex items-center justify-between gap-3">
                  <span className="font-sans text-sm text-zinc-700">{label}</span>
                  <input
                    type="time"
                    value={alertTimes[index] ?? ROUTINE_ALERT_DEFAULTS[selected][index]}
                    disabled={busy}
                    onChange={(e) => {
                      const next = [...alertTimes];
                      next[index] = e.target.value;
                      setAlertTimes(next);
                    }}
                    className="rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-sans text-sm text-zinc-900"
                  />
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <p className={cn("pt-2 text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {t("setup.intensity.customizeInSettings")}
        </p>
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/NotificationPrePermission.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { TrackingAuthorization } from "@/plugins/trackingAuthorization";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function SetupNotificationPrePermission() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const showTrackingPermission = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
  const [trackingChoice, setTrackingChoice] = useState<"yes" | "no" | null>(null);
  const [trackingStatus, setTrackingStatus] = useState<string | null>(null);
  const [trackingAskedAt, setTrackingAskedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!showTrackingPermission) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [navigate, setupBase, showTrackingPermission]);

  const requestTrackingPermission = async () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("yes");
    setTrackingAskedAt(askedAt);

    if (!showTrackingPermission) {
      return;
    }

    try {
      const result = await TrackingAuthorization.request();
      setTrackingStatus(result.status);
      void writeSetupDraft({
        trackingPrePermissionChoice: "yes",
        trackingAuthorizationStatus: result.status,
        trackingPermissionAskedAt: askedAt,
      });
      console.log("[TrackingAuthorization] status:", result.status);
    } catch (error) {
      setTrackingStatus("unknown");
      void writeSetupDraft({
        trackingPrePermissionChoice: "yes",
        trackingAuthorizationStatus: "unknown",
        trackingPermissionAskedAt: askedAt,
      });
      console.warn("[TrackingAuthorization] request failed:", error);
    }
  };

  const declineTrackingPermission = () => {
    const askedAt = new Date().toISOString();
    setTrackingChoice("no");
    setTrackingStatus("notRequested");
    setTrackingAskedAt(askedAt);
    void writeSetupDraft({
      trackingPrePermissionChoice: "no",
      trackingAuthorizationStatus: "notRequested",
      trackingPermissionAskedAt: askedAt,
    });
  };

  if (!showTrackingPermission) {
    return null;
  }

  return (
    <SetupPage
      canContinue={trackingChoice !== null}
      onBack={() => navigate(`${setupBase}/intensity`)}
      onContinue={() => {
        const d = readSetupDraft();
        writeSetupDraft({
          trackingPrePermissionChoice: trackingChoice ?? d.trackingPrePermissionChoice ?? null,
          trackingAuthorizationStatus: trackingStatus ?? d.trackingAuthorizationStatus ?? null,
          trackingPermissionAskedAt: trackingAskedAt ?? d.trackingPermissionAskedAt ?? null,
        });
        navigate(`${setupBase}/tool-preference`);
      }}
      continueText="Continue"
    >
      <SetupHeadingBlock
        centered
        title={t("setup.notifications.title")}
        subtitle={t("setup.notifications.subtitle")}
      />

      <div className="relative z-[1] pt-[1.125rem] space-y-3">
        <div className="space-y-3">
          <div className="space-y-1 pb-1">
            <p className="font-sans text-sm font-semibold text-zinc-900">
              {t("setup.tracking.title")}
            </p>
            <p className={cn("text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
              {t("setup.tracking.body")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => requestTrackingPermission()}
              className={setupTextChoiceTileClass(trackingChoice === "yes")}
              style={trackingChoice === "yes" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className={SETUP_CHOICE_LABEL_CLASS}>{t("setup.tracking.yes")}</span>
              {trackingChoice === "yes" ? (
                <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
              ) : (
                <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
              )}
            </button>
            <button
              type="button"
              onClick={declineTrackingPermission}
              className={setupTextChoiceTileClass(trackingChoice === "no")}
              style={trackingChoice === "no" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
            >
              <span className={SETUP_CHOICE_LABEL_CLASS}>{t("setup.tracking.no")}</span>
              {trackingChoice === "no" ? (
                <CheckCircle2 className={SETUP_CHOICE_CHECK_ACTIVE_CLASS} />
              ) : (
                <Circle className={SETUP_CHOICE_CHECK_INACTIVE_CLASS} />
              )}
            </button>
          </div>
        </div>
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/PlotLoading.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";

export default function SetupPlotLoading() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => Math.min(100, p + Math.floor(Math.random() * 7 + 3)));
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct >= 100) {
      const tid = window.setTimeout(() => navigate(`${setupBase}/plot-synthesis`), 450);
      return () => window.clearTimeout(tid);
    }
  }, [pct, navigate, setupBase]);

  return (
    <SetupPage
      canContinue={false}
      continueText={t("setup.plotLoading.loading")}
      disableNativeScrollViewport
      onContinue={undefined}
    >
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <SetupHeadingBlock
          centered
          className="shrink-0 mb-1"
          title={t("setup.plotLoading.title")}
          subtitle={t("setup.plotLoading.subtitle")}
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-6 pt-1">
            <div className={SETUP_PROGRESS_TRACK_CLASS}>
              <div
                className={SETUP_PROGRESS_FILL_CLASS}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center gap-4 pt-4 pb-1">
            <p className="px-2 text-center font-sans text-sm text-zinc-500">
              {t("setup.plotLoading.hint")}
            </p>
          </div>
        </div>
      </div>
    </SetupPage>
  );
}

```

---

## src/pages/onboarding/setup/PlotSynthesis.tsx

```tsx
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

```

---

## src/pages/onboarding/setup/Name.tsx

```tsx
import { useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { toast } from "sonner";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useTranslation } from "react-i18next";

export default function SetupName() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const welcomePath = isSuiteFunnel ? "/onboarding/suite/welcome" : "/onboarding/welcome";
  const { ensureSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const canContinue = firstName.trim().length > 0 && !isSaving;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() =>
        navigate(isSuiteFunnel ? welcomePath : `${setupBase}/plot-synthesis`)
      }
      onContinue={async () => {
        const trimmed = firstName.trim();
        if (!trimmed || isSaving) return;
        setIsSaving(true);
        try {
          await ensureSession();
          await writeSetupDraft({ firstName: trimmed }, { awaitBackendSync: true });
          navigate(isSuiteFunnel ? `${setupBase}/primary-intent` : `${setupBase}/email`);
        } catch (e) {
          console.warn("[SetupName] failed to save first_name to onboarding_sessions:", e);
          toast.error(t("setup.name.saveError"));
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <SetupHeadingBlock centered title={t("setup.name.title")} />

      <div className="space-y-2 pt-6">
        <Label htmlFor="firstName" className={SETUP_LABEL_CLASS}>
          {t("setup.name.firstNameLabel")}
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t("setup.name.firstNamePlaceholder")}
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
  );
}


```

---

## src/pages/onboarding/setup/Email.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
} from "@/lib/onboardingSetupTheme";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { toast } from "sonner";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { linkWebOnboardingSessionToUser } from "@/lib/webOnboardingSessionInsert";
import { useTranslation } from "react-i18next";

/** Matches native Welcome.tsx free-trial accent. */
const NATIVE_WELCOME_PINK = "#e8b8cc";
/** Delay wrong-email sign-out hint so it does not flash during paywall presentation. */
const SIGN_OUT_HINT_DELAY_MS = 3000;

export default function SetupEmail() {
  const { t } = useTranslation(["onboarding", "common", "paywall"]);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const setupBase = pathname.includes("/onboarding/suite")
    ? "/onboarding/suite/setup"
    : "/onboarding/setup";
  const { ensureSession, updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft(), []);
  const [email, setEmail] = useState(initial.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(
    initial.emailMarketingConsent === true,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  /** RevenueCat paywall failed after signup — same retry pattern as legacy `EmailCollection`. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);
  /** Set when user already has a session — email is locked until sign out. */
  const [sessionAccountEmail, setSessionAccountEmail] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);
  /** Red sign-out hint — only after delay and not while opening paywall from Continue. */
  const [showSignOutHint, setShowSignOutHint] = useState(false);
  const [suppressSignOutHint, setSuppressSignOutHint] = useState(false);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const signOutHintTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data: { session } }) => {
      const authEmail = session?.user?.email?.trim().toLowerCase();
      if (authEmail) {
        setSessionAccountEmail(authEmail);
        setEmail(authEmail);
      }
    });
  }, []);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError(t("paywall:emailCollection.passwordMinLength"));
      return;
    }
    setPasswordError(null);
  }, [password, t]);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    if (sessionAccountEmail) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
    setIsCheckingEmail(true);
    setEmailError(null);
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc("check_email_exists", {
          check_email: email.trim(),
        });
        if (checkError) {
          setEmailError(null);
        } else if (emailExists) {
          setEmailError(t("paywall:emailCollection.emailTaken"));
        } else {
          setEmailError(null);
        }
      } catch {
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);
    return () => {
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, [email, sessionAccountEmail, t]);

  const normalizedEmail = email.trim().toLowerCase();
  const accountEmailLocked = sessionAccountEmail !== null;

  useEffect(() => {
    if (signOutHintTimeoutRef.current) clearTimeout(signOutHintTimeoutRef.current);
    if (!accountEmailLocked || suppressSignOutHint || isCheckingEmail || emailError) {
      setShowSignOutHint(false);
      return;
    }
    signOutHintTimeoutRef.current = setTimeout(() => {
      setShowSignOutHint(true);
    }, SIGN_OUT_HINT_DELAY_MS);
    return () => {
      if (signOutHintTimeoutRef.current) clearTimeout(signOutHintTimeoutRef.current);
    };
  }, [accountEmailLocked, suppressSignOutHint, isCheckingEmail, emailError]);
  const draftFirstName = (readSetupDraft().firstName ?? "").trim();
  const firstName = draftFirstName;
  const usernameForAuth = normalizedEmail;

  const formValid =
    normalizedEmail.length > 3 &&
    normalizedEmail.includes("@") &&
    (accountEmailLocked || password.length >= 8) &&
    acceptedTerms &&
    firstName.length > 0 &&
    !emailError &&
    !passwordError &&
    !isCheckingEmail &&
    (!accountEmailLocked || normalizedEmail === sessionAccountEmail);

  const handleSignOutForDifferentEmail = async () => {
    setIsSigningOut(true);
    const welcomePath = pathname.includes("/onboarding/suite")
      ? "/onboarding/suite/welcome"
      : "/onboarding/welcome";
    try {
      await supabase.auth.signOut();
      navigate(welcomePath, { replace: true });
    } catch (e) {
      console.error("[SetupEmail] sign out failed:", e);
      toast.error(t("onboarding:setup.email.signOutFailed"));
    } finally {
      setIsSigningOut(false);
    }
  };

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    setSuppressSignOutHint(true);
    setShowSignOutHint(false);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({
          userId: userData.user?.id ?? null,
          navigate,
        });
        if (outcome === "success") {
          setPaywallNeedsRetry(false);
          return;
        }
        setPaywallNeedsRetry(true);
        setSuppressSignOutHint(false);
        return;
      }
      const outcome = await runIosPaywallFlowAfterSignup({
        userId: userData.user?.id ?? null,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        setSuppressSignOutHint(false);
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
      setSuppressSignOutHint(false);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!normalizedEmail.includes("@")) {
      toast.error(t("onboarding:setup.email.invalidEmail"));
      return;
    }
    const signupFirstName = firstName;
    if (!signupFirstName) {
      toast.error(t("onboarding:setup.email.needFirstName"));
      navigate(`${setupBase}/name`);
      return;
    }
    if (!accountEmailLocked && (!password || password.length < 8)) {
      toast.error(t("onboarding:setup.email.passwordLength"));
      return;
    }
    if (accountEmailLocked && normalizedEmail !== sessionAccountEmail) {
      toast.error(t("onboarding:setup.email.signOutToChangeEmailToast"));
      return;
    }
    if (!acceptedTerms) {
      toast.error(t("onboarding:setup.email.acceptTerms"));
      return;
    }
    if (emailError) {
      toast.error(emailError);
      if (emailError === t("paywall:emailCollection.emailTaken")) navigate("/login");
      return;
    }

    setIsSubmitting(true);
    setSuppressSignOutHint(true);
    setShowSignOutHint(false);
    try {
      const draftSnapshot = readSetupDraft();
      const sessionPatch: Record<string, unknown> = {
        email: normalizedEmail,
        first_name: signupFirstName,
        username: usernameForAuth,
        email_consent: emailMarketingConsent,
        sms_consent: false,
      };
      if (typeof draftSnapshot.appNotificationsConsent === "boolean") {
        sessionPatch.app_notifications_consent = draftSnapshot.appNotificationsConsent;
      }
      if (
        draftSnapshot.trackingPrePermissionChoice === "yes" ||
        draftSnapshot.trackingPrePermissionChoice === "no"
      ) {
        sessionPatch.tracking_pre_permission_choice = draftSnapshot.trackingPrePermissionChoice;
      }
      if (typeof draftSnapshot.trackingAuthorizationStatus === "string") {
        sessionPatch.tracking_authorization_status = draftSnapshot.trackingAuthorizationStatus;
      }
      if (typeof draftSnapshot.trackingPermissionAskedAt === "string") {
        sessionPatch.tracking_permission_asked_at = draftSnapshot.trackingPermissionAskedAt;
      }

      let uid: string | null = null;

      if (accountEmailLocked) {
        const {
          data: { user: authedUser },
        } = await supabase.auth.getUser();
        uid = authedUser?.id ?? null;
        if (!uid) {
          setSessionAccountEmail(null);
          throw new Error(t("onboarding:setup.email.sessionExpired"));
        }
      } else {
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: {
              first_name: signupFirstName,
              username: usernameForAuth,
            },
          },
        });

        if (signUpError) throw signUpError;

        if (!signUpData.session) {
          const { error: signInError } = await supabase.auth.signInWithPassword({
            email: normalizedEmail,
            password,
          });
          if (signInError) {
            throw new Error(t("paywall:emailCollection.verifyEmailBlocked"));
          }
        }

        const {
          data: { user: authedUser },
        } = await supabase.auth.getUser();

        uid = signUpData.user?.id ?? authedUser?.id ?? null;
      }

      if (uid) {
        linkWebOnboardingSessionToUser(uid);
      }
      if (!accountEmailLocked) {
        setSessionAccountEmail(normalizedEmail);
      }
      const releaseSignOutHintAfterPaywall = () => setSuppressSignOutHint(false);
      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

      if (isNativeIos) {
        ensureSession()
          .then(() => updateSession(sessionPatch))
          .then(() =>
            writeSetupDraft({
              email: normalizedEmail,
              emailMarketingConsent,
            }),
          )
          .catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          releaseSignOutHintAfterPaywall();
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          releaseSignOutHintAfterPaywall();
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        releaseSignOutHintAfterPaywall();
        return;
      }

      await ensureSession();
      await updateSession(sessionPatch);

      writeSetupDraft({
        email: normalizedEmail,
        emailMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        setPaywallNeedsRetry(false);
        trackMarketingConversion("web_onboarding_signup_complete", {
          source: "setup_email_android",
          target_path: "/onboarding/android-paywall",
        });
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        setPaywallNeedsRetry(true);
        releaseSignOutHintAfterPaywall();
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        releaseSignOutHintAfterPaywall();
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      trackMarketingConversion("web_onboarding_signup_complete", {
        source: "setup_email",
        target_path: "/onboarding/web-paywall",
      });
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error(t("onboarding:setup.email.subscriptionError"));
        releaseSignOutHintAfterPaywall();
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t("common:error");
      toast.error(message);
      setSuppressSignOutHint(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry
    ? !isRetryingPaywall
    : formValid && !isSubmitting;
  const footerContinueText = paywallNeedsRetry
    ? t("onboarding:setup.email.tryAgain")
    : t("common:continue");
  const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  return (
    <OnboardingLayout
      currentPage={12}
      nativeFormPage
      setupCosmicPage
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-6 text-zinc-900">
        <SetupHeadingBlock
          centered
          title={
            isNativeIos ? (
              <>
                <span className="block">{t("onboarding:setup.email.titleLine1")}</span>
                <span className="block" style={{ color: NATIVE_WELCOME_PINK }}>
                  {t("onboarding:setup.email.titleLine2")}
                </span>
              </>
            ) : (
              t("onboarding:setup.email.title")
            )
          }
          subtitle={t("onboarding:setup.email.subtitle")}
        />

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-email" className={SETUP_LABEL_CLASS}>
            {t("onboarding:setup.email.emailLabel")}
          </Label>
          <Input
            id="setup-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("onboarding:setup.email.emailPlaceholder")}
            autoComplete="email"
            inputMode="email"
            readOnly={accountEmailLocked}
            aria-readonly={accountEmailLocked}
            className={`${SETUP_FIELD_CLASS} !bg-white/95 !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light] ${emailError ? "border-destructive" : ""}`}
            style={{
              color: "#18181b",
              WebkitTextFillColor: "#18181b",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            }}
          />
          {isCheckingEmail ? (
            <p className={SETUP_MUTED_TEXT_CLASS}>{t("onboarding:setup.email.checkingAvailability")}</p>
          ) : null}
          {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
          {showSignOutHint ? (
            <p className="text-xs text-zinc-500">
              {t("onboarding:setup.email.wrongEmailHint")}{" "}
              <button
                type="button"
                onClick={() => void handleSignOutForDifferentEmail()}
                disabled={isSigningOut}
                className="font-medium text-zinc-800 underline underline-offset-2 disabled:opacity-60"
              >
                {isSigningOut
                  ? t("dashboard:nav.signingOut")
                  : t("onboarding:setup.email.signOutToChangeEmail")}
              </button>
            </p>
          ) : null}
        </div>

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-password" className={SETUP_LABEL_CLASS}>
            {t("onboarding:setup.email.passwordLabel")}
          </Label>
          <div className="relative">
            <Input
              id="setup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={t("onboarding:setup.email.passwordPlaceholder")}
              autoComplete="new-password"
              className={`${SETUP_FIELD_CLASS} pr-11 ${passwordError ? "border-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-11 rounded-2xl text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={
                showPassword
                  ? t("onboarding:setup.email.hidePassword")
                  : t("onboarding:setup.email.showPassword")
              }
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          {passwordError ? <p className="text-xs text-destructive pt-1">{passwordError}</p> : null}
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="setup-terms"
              className="text-xs text-zinc-500 leading-tight cursor-pointer"
            >
              {t("onboarding:setup.email.termsAcceptPrefix")}{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="font-medium text-zinc-900 hover:underline"
              >
                {t("onboarding:setup.email.termsOfService")}
              </button>{" "}
              {t("onboarding:setup.email.termsAnd")}{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="font-medium text-zinc-900 hover:underline"
              >
                {t("onboarding:setup.email.privacyPolicy")}
              </button>
              .
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-email-marketing"
              checked={emailMarketingConsent}
              onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="setup-email-marketing"
              className="text-xs text-zinc-500 leading-snug cursor-pointer"
            >
              {t("onboarding:setup.email.emailMarketingConsent")}
            </Label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}

```

---

## src/pages/onboarding/setup/constants.ts

```typescript
export const SETUP_DESIRE_TEXT_MAX = 150;
/** Same max as long-form board note fields — onboarding only. */
export const SETUP_BELIEF_TEXT_MAX = 250;

```

---

