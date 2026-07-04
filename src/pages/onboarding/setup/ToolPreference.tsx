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
