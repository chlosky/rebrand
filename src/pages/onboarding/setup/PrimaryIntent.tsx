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
  SETUP_CHOICE_CHECK_ACTIVE_CLASS,
  SETUP_CHOICE_CHECK_INACTIVE_CLASS,
  SETUP_CHOICE_DESC_CLASS,
  SETUP_CHOICE_ICON_WRAP_CLASS,
  SETUP_CHOICE_TITLE_CLASS,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import { useTranslation } from "react-i18next";
import { Home, LayoutGrid, Palette, Sparkles } from "lucide-react";

const INTENTS: {
  id: PrimarySetupIntent;
  Icon: typeof Sparkles;
}[] = [
  { id: "life_rebranding", Icon: Sparkles },
  { id: "home_organization", Icon: Home },
  { id: "office_work", Icon: LayoutGrid },
  { id: "moodboarding", Icon: Palette },
];

function nextRouteForIntent(intent: PrimarySetupIntent, setupBase: string): string {
  switch (intent) {
    case "life_rebranding":
      return `${setupBase}/desire-category`;
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
    return id && INTENTS.some((x) => x.id === id) ? id : null;
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
              {INTENTS.map(({ id, Icon }) => {
                const active = selected === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => selectIntent(id)}
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
