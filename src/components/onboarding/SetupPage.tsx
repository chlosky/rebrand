import { ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  ONBOARDING_SETUP_PROGRESS_ROUTES,
  SUITE_WEB_SETUP_PROGRESS_ROUTES,
  WEB_FAST_SETUP_PROGRESS_ROUTES,
} from "@/lib/onboardingFlow";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import {
  MOBILE_SETUP_FOOTER_STYLE,
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { PalettePlottingBottomScene } from "@/components/onboarding/PalettePlottingBottomScene";
import { shouldShowSetupBottomScene } from "@/lib/onboardingBottomSceneRoutes";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "@/styles/palette-plotting-bottom-scene.css";

type Props = {
  children?: ReactNode;
  canContinue?: boolean;
  continueText?: string;
  onContinue?: () => void;
  onBack?: () => void;
  headerSlot?: ReactNode;
  /** When true, do not force light mode / overwrite theme (use after theme picker). Default false. */
  respectUserTheme?: boolean;
  /** Native only: skip the inner scroll viewport (short pages where overflow clips shadows/glow). */
  disableNativeScrollViewport?: boolean;
  /** Hide the route-derived progress bar for special interstitial screens. */
  hideProgress?: boolean;
  /**
   * Short pages where all content fits above the footer (e.g. Choose a guide).
   * Mobile web: no inner scroll box; content flows flat above the fixed footer reserve.
   */
  contentFitsViewport?: boolean;
};

export function SetupPage({
  children,
  canContinue = true,
  continueText = "Continue",
  onContinue,
  onBack,
  headerSlot,
  respectUserTheme: _respectUserTheme = false,
  disableNativeScrollViewport = false,
  hideProgress = false,
  contentFitsViewport = false,
}: Props) {
  const { t } = useTranslation("common");
  const isNative = useIsNativeApp();
  const { pathname } = useLocation();
  const { ensureSession } = useOnboardingSession();
  const resolvedContinueText = continueText === "Continue" ? t("continue") : continueText;

  useEffect(() => {
    document.title = "Onboarding | Palette Plotting";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[name="twitter:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
  }, [pathname]);

  /** Same warm-up as legacy onboarding (`OnboardingQuestions`): create `onboarding_session` creds before draft syncs. */
  useEffect(() => {
    void ensureSession().catch((err) => {
      console.warn("[SetupPage] ensureSession failed:", err);
    });
  }, [ensureSession]);

  useEffect(() => {
    const shellBg = WELCOME_LIGHT_BASE;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  const setupProgressFillPct = useMemo(() => {
    if (hideProgress) return null;
    const path = pathname.replace(/\/$/, "") || "/";
    const isSuitePath = path.includes("/onboarding/suite");
    const isSuiteFunnel = isNative || isSuitePath;
    const routes = isSuitePath
      ? SUITE_WEB_SETUP_PROGRESS_ROUTES
      : isSuiteFunnel
        ? ONBOARDING_SETUP_PROGRESS_ROUTES
        : WEB_FAST_SETUP_PROGRESS_ROUTES;
    const idx = (routes as readonly string[]).indexOf(path);
    if (idx < 0) return null;
    const n = routes.length;
    return ((idx + 1) / n) * 100;
  }, [hideProgress, pathname, isNative]);

  const mobileScrollBottomClass = "scroll-pb-28";

  const hasMobileFooter = onBack != null || onContinue != null;

  const mainColumn = (
    <>
      {headerSlot ? <div className="flex items-center justify-between">{headerSlot}</div> : null}
      {children}
    </>
  );

  const mobileFooter = hasMobileFooter ? (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={MOBILE_SETUP_FOOTER_STYLE}
    >
      <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
        {onBack ? (
          <Button
            variant="outline"
            onClick={onBack}
            className={SETUP_NATIVE_BACK_BTN_CLASS}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {t("back")}
          </Button>
        ) : null}
        {onContinue ? (
          <Button
            onClick={() => canContinue && onContinue()}
            disabled={!canContinue}
            className={cn(
              onBack
                ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                : cn(SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none w-full"),
            )}
            style={{ WebkitTapHighlightColor: "transparent" }}
          >
            {resolvedContinueText}
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  const ownedScrollColumn = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-3">{mainColumn}</div>
  );

  const desktopScrollContent = disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate hidden min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden md:flex">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate hidden w-full max-w-md space-y-6 md:block">
      {mainColumn}
    </div>
  );

  const nativeScrollContent = contentFitsViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md flex-1 flex-col min-h-0 overflow-visible">
      <div className="space-y-6 pb-3">{mainColumn}</div>
    </div>
  ) : disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          mobileScrollBottomClass,
        )}
      >
        <div className="space-y-6 pb-3">{mainColumn}</div>
      </div>
    </div>
  );

  const mobileWebScrollContent = contentFitsViewport ? (
    <div className="relative z-[1] isolate w-full max-w-md flex-1 overflow-visible md:hidden">
      <div className="space-y-6">{mainColumn}</div>
    </div>
  ) : disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden md:hidden">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          mobileScrollBottomClass,
        )}
      >
        <div className="space-y-6 pb-3">{mainColumn}</div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-x-hidden bg-white font-sans text-zinc-900 antialiased",
        isNative
          ? "h-[100dvh] max-h-[100dvh]"
          : "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen",
      )}
    >
      {shouldShowSetupBottomScene(pathname) ? <PalettePlottingBottomScene /> : null}

      {setupProgressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-12",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div className="h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 ease-out"
              style={{ width: `${setupProgressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center animate-fade-in",
          isNative &&
            cn("h-full min-h-0 px-8 pb-40"),
          !isNative &&
            cn(
              "max-md:flex max-md:h-full max-md:min-h-0 max-md:flex-col",
              "max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]",
              disableNativeScrollViewport
                ? "md:flex md:h-[100dvh] md:max-h-[100dvh] md:min-h-0 md:flex-col md:px-8 md:pt-24"
                : "md:min-h-screen md:justify-between md:p-8 md:pt-24",
            ),
        )}
        style={
          isNative
            ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" }
            : undefined
        }
      >
        {isNative ? (
          nativeScrollContent
        ) : (
          <>
            {desktopScrollContent}
            <div
              className={cn(
                "relative z-[1] flex w-full max-w-md flex-1 flex-col md:hidden",
                contentFitsViewport ? "min-h-0" : "min-h-0 overflow-hidden",
              )}
            >
              {mobileWebScrollContent}
            </div>
          </>
        )}

        <div className="hidden md:block">
          {onBack ? (
            <button
              onClick={onBack}
              className={cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")}
              aria-label="Back"
            >
              <ChevronLeft className="w-8 h-8 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
            </button>
          ) : null}
          {onContinue ? (
            <button
              onClick={() => canContinue && onContinue()}
              disabled={!canContinue}
              className={cn(
                SETUP_DESKTOP_CHEVRON_CLASS,
                "right-8 top-1/2 -translate-y-1/2 disabled:opacity-50 disabled:cursor-not-allowed",
              )}
              aria-label="Continue"
            >
              <ChevronRight className="w-8 h-8 text-zinc-900" />
            </button>
          ) : null}
        </div>

        {mobileFooter}
      </div>
    </div>
  );
}
