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
  SETUP_CHOICE_ICON_WRAP_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";
import { Calendar, ChefHat, Home, Sparkles, Users } from "lucide-react";

const OPTIONS = [
  { key: "home_plan_routines", Icon: Calendar },
  { key: "home_chores_cleaning", Icon: Home },
  { key: "home_meal_planning", Icon: ChefHat },
  { key: "home_family_kids", Icon: Users },
  { key: "home_seasonal_reset", Icon: Sparkles },
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
    return k && OPTIONS.some((o) => o.key === k) ? k : null;
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
            {OPTIONS.map(({ key, Icon }) => {
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={cn(
                    "flex w-full items-center gap-3 text-left",
                    setupChoiceTileWithGlowClass(active),
                  )}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className={cn(SETUP_CHOICE_ICON_WRAP_CLASS, "h-9 w-9")}>
                    <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                  </span>
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
