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
