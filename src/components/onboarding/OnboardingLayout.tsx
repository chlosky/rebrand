import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { ONBOARDING_ROUTES, ONBOARDING_STEP_COUNT } from "@/lib/onboardingFlow";
import { useTranslation } from "react-i18next";
import {
  MOBILE_SETUP_FOOTER_STYLE,
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
  SETUP_PRIMARY_CTA_CLASS,
} from "@/lib/onboardingSetupTheme";

interface OnboardingLayoutProps {
  children: ReactNode;
  onContinue: () => void;
  currentPage: number;
  continueText?: string;
  canContinue?: boolean;
  /** When true (Welcome page only), native app shows Continue on top and Sign In below, stacked. */
  stackedNativeButtons?: boolean;
  /** Native only: main content column grows so children can use flex-1 + justify-center (e.g. Welcome pills). */
  expandNativeContentColumn?: boolean;
  /** Max width for main stack + native mobile footer (default max-w-md). Welcome uses max-w-lg for feature pills. */
  contentMaxWidthClass?: string;
  /**
   * Native app only (non-stacked): replaces the fixed Back + Continue row, e.g. StoreKit monthly/annual
   * on older iOS where RevenueCat paywall UI is not used.
   */
  nativeFooterSlot?: ReactNode;
  /** Welcome only: merged onto stacked native primary/secondary buttons (visual only; keep layout in layout). */
  stackedNativePrimaryButtonClassName?: string;
  stackedNativeSecondaryButtonClassName?: string;
  /** Welcome only: merged onto the single mobile web Continue button. */
  welcomeSoloContinueButtonClassName?: string;
  /** Welcome route: full-bleed hero + mobile web footer layout (independent of button class overrides). */
  welcomePage?: boolean;
  /** Account step: same cosmic shell as welcome/setup (e.g. setup/email). */
  setupCosmicPage?: boolean;
  /** Shown under primary CTA on welcome (e.g. setup time / no card). */
  welcomeCtaSubtext?: string;
  /** Welcome native: text link for sign-in instead of a full secondary button. */
  welcomeSignInAsTextLink?: boolean;
  /** Route-specific override for funnels that do not use the shared onboarding step count. */
  progressFillPctOverride?: number;
  /** Hide the progress bar for pages that should use the same shell without progress. */
  hideProgress?: boolean;
  /** Reserves the same top content spacing as an overridden progress bar without rendering the bar. */
  reserveProgressSpace?: boolean;
  /**
   * Native form pages (email/password, etc.): fixed viewport + scrollable body so fields stay
   * visible above the keyboard and fixed footer. Do not set on Welcome or paywall routes.
   */
  nativeFormPage?: boolean;
}

export const OnboardingLayout = ({ 
  children, 
  onContinue, 
  currentPage,
  continueText = "Continue",
  canContinue = true,
  stackedNativeButtons = false,
  nativeFooterSlot,
  expandNativeContentColumn = false,
  contentMaxWidthClass = "max-w-md",
  stackedNativePrimaryButtonClassName,
  stackedNativeSecondaryButtonClassName,
  welcomeSoloContinueButtonClassName,
  welcomePage = false,
  setupCosmicPage = false,
  welcomeCtaSubtext,
  welcomeSignInAsTextLink = false,
  progressFillPctOverride,
  hideProgress = false,
  reserveProgressSpace = false,
  nativeFormPage = false,
}: OnboardingLayoutProps) => {
  const { t } = useTranslation("common");
  const resolvedContinueText = continueText === "Continue" ? t("continue") : continueText;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const nativeFormScrollLayout = isNative && nativeFormPage;
  const isWelcome =
    welcomePage || Boolean(welcomeSoloContinueButtonClassName) || stackedNativeButtons;
  const isCosmicShell = false;
  const isWelcomeMobileWeb = !isNative && isWelcome;
  const isSetupCosmicMobileWeb = !isNative && setupCosmicPage;
  const setupMobileWebScrollLayout = isSetupCosmicMobileWeb && nativeFormPage;

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

  const handlePrevious = () => {
    if (currentPage > 1) {
      navigate(ONBOARDING_ROUTES[currentPage - 2]);
    }
  };

  const handleNext = () => {
    if (canContinue) {
      onContinue();
    }
  };

  const progressFillPct =
    hideProgress
      ? null
      : typeof progressFillPctOverride === "number"
      ? Math.max(0, Math.min(100, progressFillPctOverride))
      : !isWelcome && currentPage <= ONBOARDING_STEP_COUNT
      ? (currentPage / ONBOARDING_STEP_COUNT) * 100
      : null;
  const hasProgressSpacing = typeof progressFillPctOverride === "number" || reserveProgressSpace;
  const nativeWelcomeSideBySide = isNative && stackedNativeButtons && !welcomeSignInAsTextLink;

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

  return (
    <div
      className={cn(
        "relative overflow-x-hidden bg-white text-zinc-900 antialiased",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : isSetupCosmicMobileWeb
            ? "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen"
            : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh]",
      )}
    >
      {progressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4",
            typeof progressFillPctOverride === "number" ? "py-5" : "pt-1",
            !isNative &&
              "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-[calc(env(safe-area-inset-top,0px)+4.25rem)]",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full",
              isCosmicShell ? "bg-white/20" : "bg-zinc-400/70",
            )}
          >
            <div
              className={cn(
                "h-full rounded-full transition-[width] duration-300 ease-out",
                isWelcome && typeof progressFillPctOverride !== "number"
                  ? "bg-gradient-to-r from-rose-400 to-pink-500"
                  : isCosmicShell
                    ? "bg-white/90"
                    : "bg-black",
              )}
              style={{ width: `${progressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Desktop: Palette Plotting Header - hidden for native apps */}
      {!isNative && (
        <div className="hidden md:block">
          <header
            className={cn(
              "fixed top-0 left-0 right-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md",
            )}
          >
            <div className="container mx-auto px-6 py-4">
              <button onClick={() => navigate("/")}>
                <h1 className="font-sans text-sm font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-80">
                  Palette Plotting
                </h1>
              </button>
            </div>
          </header>
        </div>
      )}

      {/* Desktop: Side Navigation Arrows — hidden on welcome (single-path CTA) */}
      {!isWelcome && (
      <div className="hidden md:block">
        {currentPage > 1 && (
          <button
            onClick={handlePrevious}
            className={cn(
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")
                : "fixed left-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 group bg-muted/50 hover:bg-muted",
            )}
            aria-label="Previous step"
          >
            <ChevronLeft
              className={cn(
                "w-8 h-8 transition-colors",
                setupCosmicPage
                  ? "text-zinc-600 group-hover:text-zinc-900"
                  : "text-muted-foreground group-hover:text-foreground",
              )}
            />
          </button>
        )}

        {currentPage <= ONBOARDING_STEP_COUNT && (
          <button
            onClick={handleNext}
            disabled={!canContinue}
            className={cn(
              "fixed right-8 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed",
              setupCosmicPage
                ? cn(SETUP_DESKTOP_CHEVRON_CLASS)
                : "bg-black hover:bg-black/90",
            )}
            aria-label="Next step"
          >
            <ChevronRight className="w-8 h-8 text-zinc-900" />
          </button>
        )}
      </div>
      )}

      {/* Main Content */}
      <div
        className={cn(
          "flex flex-col items-center animate-fade-in w-full",
          nativeFormScrollLayout
            ? "h-full min-h-0 px-8 pb-40"
            : isNative
              ? isCosmicShell
                ? "h-full min-h-0 justify-start px-8 pb-40"
                : "min-h-screen justify-start pb-32 px-8"
              : isWelcomeMobileWeb
                ? "max-md:min-h-[100dvh] max-md:justify-start max-md:px-8 max-md:pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] max-md:pb-40 md:min-h-screen md:justify-center md:gap-6 md:p-8 md:pt-24 md:pb-12 md:bg-transparent"
                : isSetupCosmicMobileWeb
                  ? "max-md:h-full max-md:min-h-0 max-md:justify-start max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:justify-start md:p-8 md:pt-24"
                  : "min-h-screen justify-between pt-12 p-8 md:pt-24",
          hasProgressSpacing &&
            "max-md:pt-[calc(env(safe-area-inset-top,0px)+2.75rem)] md:pt-24",
        )}
        style={isNative ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" } : undefined}
      >
        {nativeFormScrollLayout || setupMobileWebScrollLayout ? (
          <div
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              contentMaxWidthClass,
              setupMobileWebScrollLayout && "max-md:flex md:contents",
            )}
          >
            <div
              className={cn(
                "relative z-[1] isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden",
                setupMobileWebScrollLayout && "max-md:flex md:contents",
              )}
            >
              <div
                className={cn(
                  "relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
                  setupMobileWebScrollLayout && "max-md:block md:overflow-visible md:flex-none",
                )}
              >
                <div className="space-y-6 pb-3">{children}</div>
              </div>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "w-full",
              contentMaxWidthClass,
              isNative && expandNativeContentColumn && "flex min-h-0 flex-1 flex-col",
              (isWelcomeMobileWeb || isSetupCosmicMobileWeb) && "relative z-10",
            )}
          >
            {children}
          </div>
        )}

        {/* Footer CTA — welcome shows on all breakpoints; others mobile-only */}
        <div
          className={cn(
            "w-full",
            nativeWelcomeSideBySide
              ? "fixed inset-x-0 bottom-0 z-40 md:hidden"
              :               isWelcomeMobileWeb
                ? "relative z-50 shrink-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 md:space-y-2 md:pt-3"
                : isWelcome
                  ? "relative z-50 shrink-0 space-y-2 pt-3"
                  : "md:hidden",
            !isWelcome && !isSetupCosmicMobileWeb && "space-y-6",
            !(isNative && !isWelcome) && !nativeWelcomeSideBySide && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isSetupCosmicMobileWeb &&
              !isWelcome &&
              "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:mx-auto max-md:max-w-md max-md:px-8 max-md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-xl md:pb-0 md:pt-0 lg:max-w-2xl",
            isStandaloneMobile && !isNative && !isWelcome && !isSetupCosmicMobileWeb && "mb-12",
          )}
          style={
            nativeWelcomeSideBySide
              ? {
                  paddingTop: "0.5rem",
                  paddingBottom: "calc(3.25rem + env(safe-area-inset-bottom, 0px))",
                  ...MOBILE_SETUP_FOOTER_STYLE,
                }
              : isNative
                ? {
                    paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  }
                : isWelcomeMobileWeb
                  ? MOBILE_SETUP_FOOTER_STYLE
                  : isSetupCosmicMobileWeb && !isWelcome
                    ? { backgroundColor: WELCOME_LIGHT_BASE }
                    : undefined
          }
        >
          {/* Native app: stacked (Welcome only) or side-by-side */}
          {isNative ? (
            stackedNativeButtons ? (
              welcomeSignInAsTextLink ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-8">
                {continueText ? (
                  <Button
                    onClick={() => canContinue && onContinue()}
                    disabled={!canContinue}
                    className={cn(
                      "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                      stackedNativePrimaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {resolvedContinueText}
                  </Button>
                ) : null}
                {welcomeCtaSubtext ? (
                  <p className="text-center text-[11px] font-medium tracking-wide text-zinc-500">
                    {welcomeCtaSubtext}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-700 hover:underline"
                >
                  {t("alreadyHaveAccountSignIn")}
                </button>
              </div>
              ) : (
              <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    SETUP_NATIVE_BACK_BTN_CLASS,
                    "outline-none transition-none select-none",
                    stackedNativeSecondaryButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {t("signIn")}
                </Button>
                {continueText ? (
                  <Button
                    onClick={() => canContinue && onContinue()}
                    disabled={!canContinue}
                    className={cn(
                      SETUP_NATIVE_CONTINUE_BTN_CLASS,
                      stackedNativePrimaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {resolvedContinueText}
                  </Button>
                ) : null}
              </div>
              )
            ) : nativeFooterSlot ? (
              <div className="mx-auto w-full max-w-md px-8">{nativeFooterSlot}</div>
            ) : (
            <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
              {/* Back button - only functional after first page */}
              {currentPage > 1 ? (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {t("back")}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    isCosmicShell
                      ? SETUP_NATIVE_BACK_BTN_CLASS
                      : "flex-1 h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                  )}
                  style={{ WebkitTapHighlightColor: 'transparent' }}
                >
                  {t("signIn")}
                </Button>
              )}
              <Button
                onClick={() => canContinue && onContinue()}
                disabled={!canContinue}
                className={cn(
                  isCosmicShell
                    ? SETUP_NATIVE_CONTINUE_BTN_CLASS
                    : "flex-1 bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 rounded-full text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                )}
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {resolvedContinueText}
              </Button>
            </div>
            )
          ) : (
            <div
              className={cn(
                "flex w-full flex-col gap-2",
                isWelcomeMobileWeb && "mx-auto max-w-md px-8",
              )}
            >
              {isWelcome && !welcomeSignInAsTextLink ? (
                <div className="flex w-full items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="h-[3.35rem] flex-1 rounded-xl border-zinc-300 bg-white text-[15px] font-semibold text-zinc-900 hover:bg-zinc-50 active:bg-zinc-50 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {t("signIn")}
                  </Button>
                  {continueText ? (
                    <Button
                      onClick={() => canContinue && onContinue()}
                      disabled={!canContinue}
                      className={cn(
                        "h-[3.35rem] flex-1 rounded-xl bg-black text-white hover:bg-black active:bg-black focus:bg-black text-[15px] font-bold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 outline-none transition-none",
                        welcomeSoloContinueButtonClassName,
                      )}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {resolvedContinueText}
                    </Button>
                  ) : null}
                </div>
              ) : continueText ? (
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    setupCosmicPage
                      ? cn("w-full", SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none")
                      : "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 outline-none transition-none",
                    welcomeSoloContinueButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {resolvedContinueText}
                </Button>
              ) : null}
              {isWelcome && welcomeCtaSubtext ? (
                <p className="text-center text-[11px] font-medium tracking-wide text-zinc-500">
                  {welcomeCtaSubtext}
                </p>
              ) : null}
              {isWelcome && welcomeSignInAsTextLink ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-700 hover:underline"
                >
                  {t("alreadyHaveAccountSignIn")}
                </button>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
