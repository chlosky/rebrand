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
          navigate(`${setupBase}/affirmations`);
          return;
        }
        const intent = readSetupDraft().primaryIntent;
        if (intent === "office_work") {
          navigate(`${setupBase}/tool-preference`);
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
