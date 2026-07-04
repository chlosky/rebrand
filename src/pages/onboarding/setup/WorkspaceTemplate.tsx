import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { needsFocusDetailsStep } from "@/lib/focusDetailOptions";
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
    navigate(
      cat && needsFocusDetailsStep(cat) ? `${setupBase}/focus-details` : `${setupBase}/focus-categories`,
    );
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
