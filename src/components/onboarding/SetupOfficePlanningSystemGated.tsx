import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsNativeApp } from "@/hooks/use-native-app";
import SetupOfficePlanningSystem from "@/pages/onboarding/setup/OfficePlanningSystem";
import { OFFICE_ONBOARDING_ENABLED } from "@/lib/officeOnboardingRelease";

export default function SetupOfficePlanningSystemGated() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isNative = useIsNativeApp();
  const isSuiteFunnel = isNative || pathname.includes("/onboarding/suite");
  const setupBase = isSuiteFunnel ? "/onboarding/suite/setup" : "/onboarding/setup";

  useEffect(() => {
    if (!OFFICE_ONBOARDING_ENABLED) {
      navigate(`${setupBase}/primary-intent`, { replace: true });
    }
  }, [navigate, setupBase]);

  if (!OFFICE_ONBOARDING_ENABLED) return null;

  return <SetupOfficePlanningSystem />;
}
