import { useEffect } from "react";
import { initAppsFlyer } from "@/lib/appsFlyer";

/** Native-only AppsFlyer SDK init (install / session / deep link attribution). */
export function AppsFlyerBootstrap() {
  useEffect(() => {
    void initAppsFlyer();
  }, []);
  return null;
}
