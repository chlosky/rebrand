import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Card } from "@/components/ui/card";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { useTranslation } from "react-i18next";

const GUIDES = [
  {
    id: "river",
    name: "River",
    headshot: "/headshots/river-headshot-2.png",
    themes: ["Transitions", "Career"],
    bubbleColor: "#4AC7FF",
    overlayColor: "#4AC7FF",
    imagePosition: "object-[35%_15%]",
    imageScale: "scale-85",
  },
  {
    id: "sage",
    name: "Sage",
    headshot: "/headshots/sage-headshot.png",
    themes: ["Finance", "Identity"],
    bubbleColor: "#8fbf76",
    overlayColor: "#8fbf76",
    imagePosition: "object-[35%_20%]",
  },
  {
    id: "rose",
    name: "Rose",
    headshot: "/headshots/rose-headshot.png",
    themes: ["Love", "Self Concept"],
    bubbleColor: "#FFB6C1",
    overlayColor: "#FFB6C1",
    imagePosition: "object-[35%_35%]",
  },
  {
    id: "oliver",
    name: "Oliver",
    headshot: "/headshots/oliver-headshot.png",
    themes: ["Self Image", "Fitness"],
    bubbleColor: "#FFC107",
    overlayColor: "#FFC107",
    imagePosition: "object-[35%_30%]",
  },
] as const;

const THEME_I18N_KEYS: Record<string, string> = {
  Transitions: "double.choose.themes.transitions",
  Career: "double.choose.themes.career",
  Finance: "double.choose.themes.finance",
  Identity: "double.choose.themes.identity",
  Love: "double.choose.themes.love",
  "Self Concept": "double.choose.themes.selfConcept",
  "Self Image": "double.choose.themes.selfImage",
  Fitness: "double.choose.themes.fitness",
};

export default function SetupGuide() {
  const { t } = useTranslation("onboarding");
  const { t: tTools } = useTranslation("tools");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";
  const { updateSession } = useOnboardingSession();

  useEffect(() => {
    if (!isSuiteFunnel) {
      navigate(`${setupBase}/tool-preference`, { replace: true });
    }
  }, [isSuiteFunnel, navigate, setupBase]);
  const initial = useMemo(() => readSetupDraft().guideCharacterId ?? null, []);
  const [selected, setSelected] = useState<string | null>(initial);

  const handleContinue = async () => {
    if (!selected) return;
    writeSetupDraft({ guideCharacterId: selected });
    try {
      await updateSession({ character_id: selected });
    } catch (e) {
      console.warn("Failed to persist guide selection:", e);
    }
    navigate(`${setupBase}/intensity`);
  };

  return (
    <SetupPage
      canContinue={selected !== null}
      contentFitsViewport
      onBack={() => navigate(`${setupBase}/begin-journey`)}
      onContinue={handleContinue}
    >
      <div className="space-y-4">
        <SetupHeadingBlock
          centered
          className="text-center [&_h1]:text-center"
          title={t("setup.guide.title")}
          subtitle={t("setup.guide.subtitle")}
          subtitleClassName="pl-0 text-center"
        />

        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 sm:gap-4">
          {GUIDES.map((character) => {
            const isSelected = selected === character.id;
            const glowColor = character.bubbleColor;
            return (
              <Card
                key={character.id}
                onClick={() => setSelected(character.id)}
                className={`relative overflow-hidden group cursor-pointer min-h-[70px] sm:min-h-[130px] border bg-transparent ${
                  isSelected ? "border-transparent" : "border-white/12"
                }`}
                style={{
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: "scale(1)",
                  ...(isSelected
                    ? {
                        boxShadow: `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40, 0 0 60px ${glowColor}20`,
                      }
                    : {}),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
              >
                <div className="absolute inset-0 rounded-lg bg-white" aria-hidden />
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={character.headshot}
                    alt={character.name}
                    className={`w-[120%] h-full object-cover ${character.imagePosition} ${character.imageScale ?? "scale-110"} sm:scale-100 -translate-x-[24%]`}
                  />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `${character.overlayColor}33` }}
                />
                <div className="relative p-2 sm:p-4 flex items-end justify-end h-full min-h-[70px] sm:min-h-[130px]">
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <h3 className="text-base sm:text-xl font-bold text-black drop-shadow-sm">{character.name}</h3>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      {character.themes.map((theme) => (
                        <div
                          key={theme}
                          className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-center min-w-[70px] sm:min-w-[80px]"
                          style={{ backgroundColor: `${character.bubbleColor}E6` }}
                        >
                          <span className="text-xs font-medium text-zinc-900 whitespace-nowrap text-center">
                            {tTools(THEME_I18N_KEYS[theme] ?? theme)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </SetupPage>
  );
}
