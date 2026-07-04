import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsNativeApp } from '@/hooks/use-native-app';
import Home from '@/site/pages/Home';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';
import { debugLog } from '@/debugLog';
/**
 * Must live outside route elements that unmount on redirect (e.g. "/" → /dashboard).
 * With launchAutoHide: false, if hide is scheduled inside a redirect-only component, cleanup
 * can cancel the timeout — splash never hides.
 *
 * Native splash stays up until auth + destination screen are ready, and at least
 * MIN_NATIVE_SPLASH_HOLD_MS has elapsed (product: logo on screen long enough). Then hide
 * the native layer immediately — no JS overlay,
 * no cross-fade (those showed the wrong web asset and black flashes).
 * Never hide while auth `isLoading` (avoids WKWebView white screen: "/" renders `null`).
 * Extended max timer only forces hide once auth has settled; if stuck loading, stay on splash.
 * Splash: single-flight hide — overlapping SplashScreen.hide calls destabilize older iOS.
 */
let splashHidePromise: Promise<void> | null = null;

/**
 * We only hide the native splash once the destination screen (Welcome or Dashboard)
 * has mounted and signaled "ready". This prevents the webview showing black/blank
 * between native launch and first meaningful paint.
 */
const SPLASH_READY_EVENT = "native_splash_ready_to_hide";

/** Minimum time the native splash stays visible (ms from cold start of this gate). */
const MIN_NATIVE_SPLASH_HOLD_MS = 1500;

/** After this, if auth is ready, hide even if destination never signaled ready (recovery). */
const MAX_SPLASH_VISIBLE_MS = 25000;

async function hideSplashAttempt() {
  if (splashHidePromise) return splashHidePromise;

  splashHidePromise = (async () => {
    try {
      await SplashScreen.hide({ fadeOutDuration: 0 });
    } catch {
      try {
        await SplashScreen.hide();
      } catch {
        /* ignore */
      }
    }
  })();

  return splashHidePromise;
}

export function signalNativeSplashReadyToHide() {
  try {
    window.dispatchEvent(new Event(SPLASH_READY_EVENT));
  } catch {
    /* ignore */
  }
}

function splashDevLog(phase: string, data?: Record<string, unknown>) {
  if (import.meta.env.DEV) {
    console.info("[NativeSplashGate]", phase, data ?? "");
  }
}

export const NativeSplashGate = () => {
  const isNative = useIsNativeApp();
  const { isLoading } = useAuth();
  const isLoadingRef = useRef(isLoading);
  isLoadingRef.current = isLoading;
  const screenReadyRef = useRef(false);
  /** Set once per native session so reloads / strict mode don’t reset the min-hold clock mid-launch. */
  const splashStartedAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isNative) return;
    if (splashStartedAtRef.current === null) {
      splashStartedAtRef.current = Date.now();
      splashDevLog("splash_clock_start", { minHoldMs: MIN_NATIVE_SPLASH_HOLD_MS });
    }
  }, [isNative]);

  // Recovery hide only **after auth is ready** — never unveil the WebView while "/" still returns null.
  useEffect(() => {
    if (!isNative) return;

    const maxWaitMs = MAX_SPLASH_VISIBLE_MS;
    const id = window.setTimeout(() => {
      if (isLoadingRef.current) {
        splashDevLog("max_splash_hold_auth_still_loading", {
          maxWaitMs,
          screenReady: screenReadyRef.current,
        });
        try {
          debugLog({
            location: "NativeSplashGate",
            message: "max splash time reached but auth still loading — splash stays up",
            data: { maxWaitMs, screenReady: screenReadyRef.current },
            hypothesisId: "SPLASH-3",
          });
        } catch {
          /* ignore */
        }
        return;
      }
      splashDevLog("force_hide_recovery", { maxWaitMs, screenReady: screenReadyRef.current });
      void hideSplashAttempt();
    }, maxWaitMs);

    return () => clearTimeout(id);
  }, [isNative]);

  useEffect(() => {
    if (!isNative) return;

    let cancelled = false;
    let readyListener: (() => void) | null = null;
    let hideDelayId: ReturnType<typeof window.setTimeout> | null = null;

    const tryScheduleHide = (source: string) => {
      if (cancelled) return;
      if (isLoadingRef.current) return;
      if (!screenReadyRef.current) return;

      const started = splashStartedAtRef.current ?? Date.now();
      if (splashStartedAtRef.current === null) splashStartedAtRef.current = started;

      const elapsed = Date.now() - started;
      const remaining = Math.max(0, MIN_NATIVE_SPLASH_HOLD_MS - elapsed);

      splashDevLog("schedule_hide", { source, elapsedMs: elapsed, waitMs: remaining, minHoldMs: MIN_NATIVE_SPLASH_HOLD_MS });

      if (hideDelayId !== null) {
        window.clearTimeout(hideDelayId);
        hideDelayId = null;
      }

      hideDelayId = window.setTimeout(() => {
        hideDelayId = null;
        if (cancelled) return;
        if (isLoadingRef.current) return;
        if (!screenReadyRef.current) return;
        void hideSplashAttempt();
      }, remaining);
    };

    void tryScheduleHide("effect_mount");

    readyListener = () => {
      screenReadyRef.current = true;
      tryScheduleHide("screen_ready_event");
    };
    window.addEventListener(SPLASH_READY_EVENT, readyListener);

    if (!isLoading) {
      tryScheduleHide("auth_ready");
    } else {
      splashDevLog("waiting_auth", { isLoading: true });
    }

    return () => {
      cancelled = true;
      if (hideDelayId !== null) window.clearTimeout(hideDelayId);
      if (readyListener) window.removeEventListener(SPLASH_READY_EVENT, readyListener);
    };
  }, [isNative, isLoading]);

  return null;
};

export const NativeAppRootRedirect = () => {
  const isNative = useIsNativeApp();
  const { user, isLoading } = useAuth();

  // In native app, redirect to onboarding/welcome for signup flow if not authenticated
  // Users already logged in (from PWA/desktop) will stay logged in and go to dashboard
  if (isNative) {
    // Wait for auth check to complete (native splash stays until NativeSplashGate hides it)
    if (isLoading) {
      return null;
    }
    // Auth complete - navigate directly to welcome/onboarding or dashboard
    if (!user) {
      return <Navigate to="/onboarding/welcome" replace />;
    }
    return <Navigate to="/workspace" replace />;
  }

  // Web/PWA: show the palette plot marketing homepage
  return <Home />;
};
