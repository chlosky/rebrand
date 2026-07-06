import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { OFFICE_ONBOARDING_ENABLED } from "@/lib/officeOnboardingRelease";

export default function SetupToolPreferenceGated() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  useEffect(() => {
    writeSetupDraft({ toolPreferences: ["boards_workspace", "daily_wins_progress"] });
    const intent = readSetupDraft().primaryIntent;
    const next =
      intent === "office_work" && OFFICE_ONBOARDING_ENABLED
        ? isSuiteFunnel
          ? `${setupBase}/plot-loading`
          : `${setupBase}/begin-journey`
        : `${setupBase}/workspace-template`;
    navigate(next, { replace: true });
  }, [isSuiteFunnel, navigate, setupBase]);

  return null;
}
