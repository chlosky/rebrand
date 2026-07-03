import { useEffect } from "react";
import { captureAndPersistAttribution } from "@/lib/attribution";

/** Runs once on app load to persist first/last-touch attribution from URL or storage. */
export function AttributionCapture() {
  useEffect(() => {
    captureAndPersistAttribution();
  }, []);
  return null;
}
