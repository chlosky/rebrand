import { useEffect, useState } from "react";
import { isLocalNightTime, msUntilLocalNightBoundary } from "@/lib/localNightTime";

/** Reactive local night window (7 PM – 5 AM); updates at the next boundary. */
export function useLocalNightTime(): boolean {
  const [isNight, setIsNight] = useState(() => isLocalNightTime());

  useEffect(() => {
    let timeoutId: number | undefined;

    const sync = () => {
      setIsNight(isLocalNightTime());
      timeoutId = window.setTimeout(sync, msUntilLocalNightBoundary());
    };

    sync();
    return () => {
      if (timeoutId !== undefined) window.clearTimeout(timeoutId);
    };
  }, []);

  return isNight;
}
