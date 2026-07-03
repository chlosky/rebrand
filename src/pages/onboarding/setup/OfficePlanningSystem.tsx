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
  SETUP_CHOICE_ICON_WRAP_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";
import { BarChart3, CalendarRange, Columns3, Grid2x2, Wrench } from "lucide-react";

const SYSTEMS = [
  { key: "kanban", Icon: Columns3 },
  { key: "gantt", Icon: CalendarRange },
  { key: "eisenhower", Icon: Grid2x2 },
  { key: "okrs", Icon: BarChart3 },
  { key: "five_s", Icon: Wrench },
] as const;

export default function SetupOfficePlanningSystem() {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  const [selected, setSelected] = useState<string | null>(() => {
    const k = readSetupDraft().officePlanningSystem;
    return k && SYSTEMS.some((s) => s.key === k) ? k : null;
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
            {SYSTEMS.map(({ key, Icon }) => {
              const active = selected === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => select(key)}
                  className={cn(
                    "flex w-full items-start gap-3 text-left",
                    setupChoiceTileWithGlowClass(active),
                  )}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className={cn(SETUP_CHOICE_ICON_WRAP_CLASS, "h-10 w-10")}>
                    <Icon className="h-5 w-5" strokeWidth={1.65} aria-hidden />
                  </span>
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
