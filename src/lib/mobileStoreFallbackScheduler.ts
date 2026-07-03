import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";

export const STORE_FALLBACK_DELAY_MS = 900;

type ScheduleStoreFallbackOptions = {
  onShow: () => void;
  meta?: Record<string, string | undefined>;
};

export type StoreFallbackScheduleHandle = {
  cancel: (reason: string) => void;
};

export function scheduleStoreFallbackCheck(
  options: ScheduleStoreFallbackOptions,
): StoreFallbackScheduleHandle {
  let cancelled = false;
  let timer: ReturnType<typeof setTimeout> | null = null;

  const cancel = (reason: string) => {
    if (cancelled) return;
    cancelled = true;
    if (timer) clearTimeout(timer);
    document.removeEventListener("visibilitychange", onVisibilityChange);
    window.removeEventListener("pagehide", onPageHide);
    window.removeEventListener("blur", onBlur);
    logStoreHandoff("fallback_cancelled", { reason, ...options.meta });
  };

  const onVisibilityChange = () => {
    if (document.visibilityState !== "visible") {
      cancel("visibilitychange");
    }
  };

  const onPageHide = () => cancel("pagehide");
  const onBlur = () => cancel("blur");

  document.addEventListener("visibilitychange", onVisibilityChange);
  window.addEventListener("pagehide", onPageHide);
  window.addEventListener("blur", onBlur);

  logStoreHandoff("fallback_timer_started", {
    delay_ms: STORE_FALLBACK_DELAY_MS,
    ...options.meta,
  });

  timer = setTimeout(() => {
    if (cancelled) return;
    if (document.visibilityState === "visible") {
      logStoreHandoff("fallback_timer_fired_visible", options.meta);
      options.onShow();
    } else {
      logStoreHandoff("fallback_timer_fired_hidden", options.meta);
    }
    cancel("timer-complete");
  }, STORE_FALLBACK_DELAY_MS);

  return { cancel };
}
