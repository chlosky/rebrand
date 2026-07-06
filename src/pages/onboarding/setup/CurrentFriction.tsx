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
