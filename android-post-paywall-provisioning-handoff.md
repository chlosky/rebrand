# Android post-paywall provisioning — full code handoff

Branch: Mobile-app
versionCode: 243
Files: 69

Android path: setup → AndroidPaywall / signup email → runAndroidPaywallFlow →
/onboarding/android-post-paywall → androidPostPurchaseEntitlementGate →
dashboard (≤2.8s cap, optimistic) + background provisionPostPaywallIfNeeded.

Includes shared setup UI, postPaywallProvisioning, edge functions, migrations.
Excludes iOS-only and web-Stripe paywall modules.

---

## src/App.tsx

```tsx
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppearancePreferenceSync } from "@/components/AppearancePreferenceSync";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/onboarding/Welcome";
import Settings from "./pages/Settings";
import SubliminalAudio from "./pages/features/SubliminalAudio";
import Affirmations from "./pages/features/Affirmations";
import AffirmationVisualizerV2 from "./pages/features/AffirmationVisualizerV2";
import MirrorRehearsalRoute from "./pages/features/MirrorRehearsalRoute";
import YourDouble from "./pages/features/YourDouble";
import ChooseDouble from "./pages/features/ChooseDouble";
import Chat from "./pages/features/Chat";
import ActivityTracking from "./pages/features/ActivityTracking";
import Chrono from "./pages/features/Chrono";
import Refactor from "./pages/features/Refactor";
import MusicComposer from "./pages/features/MusicComposer";
import Freeplay from "./pages/features/Freeplay";
import YourJourney from "./pages/features/YourJourney";
import ReportAppIssue from "./pages/ReportAppIssue";
import ThreeActs from "./pages/onboarding/ThreeActs";
import CustomAffirmations from "./pages/onboarding/CustomAffirmations";
import DigitalMirror from "./pages/onboarding/DigitalMirror";
import SubliminalMaker from "./pages/onboarding/SubliminalMaker";
import ManifestationTools from "./pages/onboarding/ManifestationTools";
import HabitTracking from "./pages/onboarding/HabitTracking";
import Double from "./pages/onboarding/Double";
import EmailCollection from "./pages/onboarding/EmailCollection";
import OnboardingQuestions from "./pages/onboarding/OnboardingQuestions";
import IOSPaywall from "./pages/onboarding/IOSPaywall";
import AndroidPaywall from "./pages/onboarding/AndroidPaywall";
import WebPaywall from "./pages/onboarding/WebPaywall";
import AndroidPostPaywallLoading from "./pages/onboarding/AndroidPostPaywallLoading";
import PostPaywallLoading from "./pages/onboarding/PostPaywallLoading";
import {
  SetupCurrentFriction,
  SetupAffirmationRead,
  SetupEmbodyDailyIdentity,
  SetupBeginJourney,
  SetupConditionalSpecificity,
  SetupDesireCategory,
  SetupEmail,
  SetupGuide,
  SetupName,
  SetupNotificationPrePermission,
  SetupPlotLoading,
  SetupPlotSynthesis,
  SetupToolPreference,
} from "./pages/onboarding/setup";
import Activate from "./pages/Activate";
import PaymentProcessing from "./pages/PaymentProcessing";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import FAQ from "./pages/FAQ";
import TermsOfService from "./pages/TermsOfService";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AcceptableUsePolicy from "./pages/AcceptableUsePolicy";
import DMCA from "./pages/DMCA";
import BillingRefundPolicy from "./pages/BillingRefundPolicy";
import GetAppStore from "./pages/GetAppStore";
import GetMobileApp from "./pages/GetMobileApp";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import WhatIsPalettePlotting from "./pages/WhatIsPalettePlotting";
import ManifestHelp from "./pages/ManifestHelp";
import Contact from "./pages/Contact";
import Unsubscribe from "./pages/Unsubscribe";
import PublicDemo from "./pages/PublicDemo";
import { DemoAccess } from "./pages/DemoAccess";
import { ScrollToTop } from "@/components/ScrollToTop";
import { NativeAppRootRedirect, NativeSplashGate } from "@/components/NativeAppRootRedirect";
import { debugLog } from "@/debugLog";

const queryClient = new QueryClient();
const DashboardLayout = () => <Outlet />;

/** Web: RevenueCat web paywall. Native: platform paywall. */
const WebResubscribeRedirect = () => <Navigate to="/onboarding/web-paywall" replace />;

/** Use render-time check so we don't rely on Capacitor being ready at module load. */
const IsNativePaywallOr = ({ FallbackComponent }: { FallbackComponent: React.ComponentType }) => {
  if (isIosPaywallContext()) return <IOSPaywall />;
  if (isAndroidPaywallContext()) return <AndroidPaywall />;
  return <FallbackComponent />;
};

/** Legacy URL — native paywalls; web uses RevenueCat web paywall. */
const LegacyOnboardingPricingRedirect = () => {
  if (isIosPaywallContext()) return <Navigate to="/onboarding/ios-paywall" replace />;
  if (isAndroidPaywallContext()) return <Navigate to="/onboarding/android-paywall" replace />;
  return <Navigate to="/onboarding/web-paywall" replace />;
};

// #region agent log
(() => { debugLog({ location: "App.tsx:route-config", message: "App route config", data: { isIosPaywallContext: isIosPaywallContext(), platform: Capacitor.getPlatform(), isNative: Capacitor.isNativePlatform() }, hypothesisId: "H1" }); })();
// #endregion
const LegacyAffirmationViewerRedirect = () => {
  const { setId } = useParams();
  return (
    <Navigate
      to={setId ? `/dashboard/affirmation-viewer/${setId}` : "/dashboard/affirmations-builder"}
      replace
    />
  );
};

const App = () => (
  <ThemeProvider>
    <AuthProvider>
      <AppearancePreferenceSync />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <NativeSplashGate />
            <ScrollToTop />
            <Routes>
              <Route path="/" element={<NativeAppRootRedirect />} />
              <Route path="/demo" element={<PublicDemo />} />
              <Route path="/demo-access" element={<DemoAccess />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/resubscribe" element={<IsNativePaywallOr FallbackComponent={WebResubscribeRedirect} />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/payment-processing" element={<PaymentProcessing />} />
              <Route path="/activate" element={<Activate />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Onboarding Flow */}
              <Route path="/onboarding/welcome" element={<Welcome />} />
              <Route path="/onboarding/four-steps" element={<ThreeActs />} />
              <Route path="/onboarding/custom-affirmations" element={<CustomAffirmations />} />
              <Route path="/onboarding/digital-mirror" element={<DigitalMirror />} />
              <Route path="/onboarding/subliminal-maker" element={<SubliminalMaker />} />
              <Route path="/onboarding/manifestation-tools" element={<ManifestationTools />} />
              <Route path="/onboarding/habit-tracking" element={<HabitTracking />} />
              <Route path="/onboarding/email" element={<EmailCollection />} />
              <Route path="/onboarding/double" element={<Double />} />
              <Route path="/onboarding/questions" element={<OnboardingQuestions />} />

              <Route path="/onboarding/ios-paywall" element={<IOSPaywall />} />
              <Route path="/onboarding/android-paywall" element={<AndroidPaywall />} />
              <Route path="/onboarding/web-paywall" element={<WebPaywall />} />
              <Route path="/onboarding/android-post-paywall" element={<AndroidPostPaywallLoading />} />
              <Route path="/onboarding/post-paywall" element={<PostPaywallLoading />} />
              <Route path="/onboarding/pricing" element={<LegacyOnboardingPricingRedirect />} />

              {/* Personalized setup flow (web + native) */}
              <Route path="/onboarding/setup/name" element={<SetupName />} />
              <Route path="/onboarding/setup/desire-category" element={<SetupDesireCategory />} />
              <Route
                path="/onboarding/setup/why-it-matters"
                element={<Navigate to="/onboarding/setup/current-friction" replace />}
              />
              <Route path="/onboarding/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/setup/affirmations" element={<SetupAffirmationRead />} />
              <Route path="/onboarding/setup/embody-daily" element={<SetupEmbodyDailyIdentity />} />
              <Route path="/onboarding/setup/begin-journey" element={<SetupBeginJourney />} />
              <Route path="/onboarding/setup/conditional-specificity" element={<SetupConditionalSpecificity />} />
              <Route path="/onboarding/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/setup/guide" element={<SetupGuide />} />
              <Route path="/onboarding/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/setup/tool-preference" element={<SetupToolPreference />} />
              <Route path="/onboarding/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/setup/plot-synthesis" element={<SetupPlotSynthesis />} />
              
              {/* Protected + Nested Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="design" element={<Navigate to="/dashboard" replace />} />
                <Route path="assemble" element={<Navigate to="/dashboard/subliminal" replace />} />
                <Route path="review" element={<Navigate to="/dashboard" replace />} />
                <Route path="experience" element={<Navigate to="/dashboard" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="report-issue" element={<ReportAppIssue />} />
                <Route path="your-journey/chat" element={<Chat />} />
                <Route path="your-journey" element={<YourJourney />} />
                <Route path="chat" element={<Navigate to="/dashboard/your-journey/chat" replace />} />
                <Route path="mirror" element={<MirrorRehearsalRoute />} />
                <Route path="mind-the-mirror" element={<MirrorRehearsalRoute />} />
                <Route path="subliminal" element={<SubliminalAudio />} />
                <Route path="affirmations-builder" element={<Affirmations />} />
                <Route path="affirmation-viewer/:setId" element={<AffirmationVisualizerV2 />} />
                <Route path="timeline" element={<Chrono />} />
                <Route path="activity-tracking" element={<ActivityTracking />} />
                <Route path="double" element={<YourDouble />} />
                <Route path="choose-double" element={<ChooseDouble />} />
                <Route path="refactor" element={<Refactor />} />
                <Route path="chrono" element={<Chrono />} />
                <Route path="get-app" element={<GetAppStore />} />
                <Route path="download-a2h2" element={<Navigate to="/dashboard/get-app" replace />} />
                <Route path="music-composer" element={<MusicComposer />} />
                <Route path="tap-in" element={<Freeplay />} />
                <Route path="freeplay" element={<Navigate to="/dashboard/tap-in" replace />} />
              </Route>

              {/* Legacy redirects to nested dashboard paths */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
              <Route path="/chat" element={<Navigate to="/dashboard/your-journey/chat" replace />} />
              <Route path="/feature/mirror" element={<Navigate to="/dashboard/mirror" replace />} />
              <Route path="/feature/mind-the-mirror" element={<Navigate to="/dashboard/mind-the-mirror" replace />} />
              <Route path="/feature/subliminal" element={<Navigate to="/dashboard/subliminal" replace />} />
              <Route path="/feature/affirmations-builder" element={<Navigate to="/dashboard/affirmations-builder" replace />} />
              <Route path="/feature/affirmation-viewer/:setId" element={<LegacyAffirmationViewerRedirect />} />
              <Route path="/your-timeline" element={<Navigate to="/dashboard/timeline" replace />} />
              <Route path="/activity-tracking" element={<Navigate to="/dashboard/activity-tracking" replace />} />
              <Route path="/feature/chrono" element={<Navigate to="/dashboard/chrono" replace />} />
              <Route path="/feature/refactor" element={<Navigate to="/dashboard/refactor" replace />} />
              <Route path="/double" element={<Navigate to="/dashboard/double" replace />} />
              <Route path="/choose-double" element={<Navigate to="/dashboard/choose-double" replace />} />
              <Route path="/download-a2h2" element={<Navigate to="/dashboard/get-app" replace />} />
              <Route path="/freeplay" element={<Navigate to="/dashboard/tap-in" replace />} />

              {/* Legal Pages */}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/help/manifesting" element={<ManifestHelp />} />
              <Route path="/what-is-palette-plotting" element={<WhatIsPalettePlotting />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/acceptable-use" element={<AcceptableUsePolicy />} />
              <Route path="/dmca" element={<DMCA />} />
              <Route path="/billing" element={<BillingRefundPolicy />} />
              <Route path="/eula" element={<Navigate to="/terms" replace />} />
              <Route path="/get-mobile-app" element={<GetMobileApp />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </AuthProvider>
  </ThemeProvider>
);

export default App;
```

## src/components/IosAppHeader.tsx

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type IosAppHeaderProps = {
  /** When true, show Sign out instead of Login and return to welcome after signing out. */
  signOutInsteadOfLogin?: boolean;
};

/**
 * Header for iOS app screens (secure checkout, sign-in) that matches the Privacy Policy header.
 * Palette Plotting title links back to the welcome page; Login button links to sign-in.
 */
export const IosAppHeader = ({ signOutInsteadOfLogin = false }: IosAppHeaderProps) => {
  const navigate = useNavigate();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await supabase.auth.signOut();
      navigate("/onboarding/welcome", { replace: true });
    } catch (e) {
      console.error("Sign out failed:", e);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <>
      <div
        className="fixed top-0 left-0 right-0 bg-background z-40"
        style={{ height: "env(safe-area-inset-top, 0px)" }}
      />
      <header
        className="fixed top-0 left-0 right-0 z-50 border-b border-primary/10 bg-background"
        style={{ top: "env(safe-area-inset-top, 0px)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate("/onboarding/welcome")}
              className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent dark:bg-none dark:text-foreground hover:opacity-80 transition-opacity cursor-pointer"
            >
              Palette Plotting
            </button>
            {signOutInsteadOfLogin ? (
              <Button
                variant="outline"
                className="border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                onClick={() => void handleSignOut()}
                disabled={isSigningOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                {isSigningOut ? "Signing out…" : "Sign out"}
              </Button>
            ) : (
              <Button
                variant="outline"
                className="border-foreground/20 hover:bg-primary/10 h-8 px-3 text-sm"
                onClick={() => navigate("/login")}
              >
                <LogIn className="mr-2 h-4 w-4" />
                Login
              </Button>
            )}
          </div>
        </div>
      </header>
      <div style={{ height: "calc(64px + env(safe-area-inset-top, 0px))" }} />
    </>
  );
};
```

## src/components/ProtectedRoute.tsx

```tsx
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const SUBSCRIPTION_CACHE_KEY = "subscription_check";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [hasActiveSubscription, setHasActiveSubscription] = useState<boolean | null>(() => {
    if ((window as any).__subscriptionConfirmed) {
      (window as any).__subscriptionConfirmed = false;
      return true;
    }
    try {
      const uid = user?.id;
      if (!uid) return null;
      const raw = sessionStorage.getItem(`${SUBSCRIPTION_CACHE_KEY}_${uid}`);
      if (!raw) return null;
      const { ts, active } = JSON.parse(raw) as { ts: number; active: boolean };
      if (Date.now() - ts > CACHE_TTL_MS) return null;
      return active;
    } catch {
      return null;
    }
  });

  const onboardingRoutes = [
    '/onboarding/welcome',
    '/onboarding/four-steps',
    '/onboarding/demo',
    '/onboarding/email',
    '/onboarding/double',
    '/onboarding/questions',
    '/onboarding/setup',
    '/onboarding/ios-paywall',
    '/onboarding/android-paywall',
    '/onboarding/web-paywall',
    '/onboarding/android-post-paywall',
    '/onboarding/post-paywall',
    '/payment-processing',
    '/activate',
    '/verify-email',
    '/resubscribe',
  ];

  const isOnboardingRoute = onboardingRoutes.some(route => location.pathname.startsWith(route));

  // Auth redirect removed — dashboard is always the target after payment.
  // Login routing is handled by the login page / route config itself.

  // Subscription check: at most once per 24h (cached in sessionStorage). No loading UI — hold with null until done.
  useEffect(() => {
    if (isLoading || !user || isOnboardingRoute) {
      if (isOnboardingRoute) {
        setHasActiveSubscription(true);
      }
      return;
    }

    const cacheKey = `${SUBSCRIPTION_CACHE_KEY}_${user.id}`;

    const readCache = (): { active: boolean } | null => {
      try {
        const raw = sessionStorage.getItem(cacheKey);
        if (!raw) return null;
        const { ts, active } = JSON.parse(raw) as { ts: number; active: boolean };
        if (Date.now() - ts > CACHE_TTL_MS) return null;
        return { active };
      } catch {
        return null;
      }
    };

    const writeCache = (active: boolean) => {
      try {
        sessionStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), active }));
      } catch {}
    };

    const cached = readCache();
    if (cached !== null) {
      setHasActiveSubscription(cached.active);
      if (!cached.active) {
        navigate('/resubscribe', { replace: true });
      }
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const { data: userPlan, error } = await supabase
          .from('user_plans')
          .select('status, tier, current_period_end')
          .eq('user_id', user.id)
          .maybeSingle();

        if (cancelled) return;
        if (error) {
          navigate('/resubscribe', { replace: true });
          return;
        }

        const plan = userPlan as { status?: string; current_period_end?: string } | null;
        const active = !!(
          plan &&
          plan.status === 'active' &&
          (!plan.current_period_end || new Date(plan.current_period_end) > new Date())
        );

        writeCache(active);
        setHasActiveSubscription(active);
        if (!active) {
          navigate('/resubscribe', { replace: true });
        }
      } catch {
        if (!cancelled) navigate('/resubscribe', { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, isLoading, isOnboardingRoute, navigate]);

  // Always render children — subscription check redirects in background if needed.
  // Never return null (white screen). The useEffect will redirect to /resubscribe
  // if the DB check comes back definitively inactive (native paywall or web app-download redirect).
  return <>{children}</>;
};
```

## src/components/onboarding/OnboardingLayout.tsx

```tsx
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { Capacitor } from "@capacitor/core";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ONBOARDING_ROUTES, ONBOARDING_STEP_COUNT } from "@/lib/onboardingFlow";
import {
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
  nativeFormPage = false,
}: OnboardingLayoutProps) => {
  const navigate = useNavigate();
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const isAndroidNative = isNative && Capacitor.getPlatform() === "android";
  const nativeFormScrollLayout = isNative && nativeFormPage;
  const isWelcome =
    welcomePage || Boolean(welcomeSoloContinueButtonClassName) || stackedNativeButtons;
  const isCosmicShell = isWelcome || setupCosmicPage;
  const isWelcomeMobileWeb = !isNative && isWelcome;
  const isSetupCosmicMobileWeb = !isNative && setupCosmicPage;

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
    !isWelcome && currentPage <= ONBOARDING_STEP_COUNT
      ? (currentPage / ONBOARDING_STEP_COUNT) * 100
      : null;

  return (
    <div
      className={cn(
        "relative overflow-hidden",
        isCosmicShell ? "font-sans text-white antialiased" : "bg-background text-foreground",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh] max-md:bg-transparent",
        isSetupCosmicMobileWeb && "max-md:min-h-[100dvh]",
      )}
      style={isCosmicShell ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
    >
      {isCosmicShell ? (
        <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      ) : null}
      {isAndroidNative && isCosmicShell ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[45]"
          style={{
            height: "var(--app-safe-area-top)",
            backgroundColor: WELCOME_COSMIC_BASE,
          }}
          aria-hidden
        />
      ) : null}
      {progressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
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
                isWelcome
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
              "fixed top-0 left-0 right-0 z-40",
              isCosmicShell
                ? "border-b border-white/[0.06] bg-[#0a0812]/80 backdrop-blur-md"
                : "border-b border-primary/10 bg-background",
            )}
          >
            <div className="container mx-auto px-6 py-4">
              <button onClick={() => navigate("/")}>
                <h1
                  className={cn(
                    "text-lg font-bold transition-opacity hover:opacity-80",
                    isCosmicShell
                      ? "font-sans text-sm font-semibold tracking-tight text-white/90"
                      : "bg-gradient-primary bg-clip-text text-transparent",
                  )}
                >
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
                  ? "text-white/80 group-hover:text-white"
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
            <ChevronRight className="w-8 h-8 text-white" />
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
                ? "max-md:min-h-[100dvh] max-md:justify-between max-md:px-8 max-md:pt-0 max-md:pb-0 md:justify-start md:gap-6 md:p-8 md:pt-24 md:bg-transparent"
                : "min-h-screen justify-between pt-12 p-8 md:pt-24",
        )}
        style={isNative ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" } : undefined}
      >
        {nativeFormScrollLayout ? (
          <div
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              contentMaxWidthClass,
            )}
          >
            <div className="relative z-[1] isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden">
              <div className="relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
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
            isWelcome ? "relative z-50 shrink-0 space-y-2 pt-3" : "space-y-6 md:hidden",
            !(isNative && !isWelcome) && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isWelcomeMobileWeb &&
              "max-md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-lg md:pb-0 md:pt-0",
            isStandaloneMobile && !isNative && !isWelcome && "mb-12",
          )}
          style={
            isNative
              ? {
                  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  // Solid base only masks scrolling content under fixed setup footers.
                  // Welcome's footer sits in normal flow over the cosmic shell — no fill,
                  // otherwise a visible rectangle appears around the CTAs.
                  ...(isCosmicShell && !isWelcome
                    ? { backgroundColor: WELCOME_COSMIC_BASE }
                    : {}),
                }
              : undefined
          }
        >
          {/* Native app: stacked (Welcome only) or side-by-side */}
          {isNative ? (
            stackedNativeButtons ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-8">
                <Button
                  onClick={() => canContinue && onContinue()}
                  disabled={!canContinue}
                  className={cn(
                    "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                    stackedNativePrimaryButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {continueText}
                </Button>
                {welcomeCtaSubtext ? (
                  <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                    {welcomeCtaSubtext}
                  </p>
                ) : null}
                {welcomeSignInAsTextLink ? (
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                  >
                    Already have an account? Sign in
                  </button>
                ) : (
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className={cn(
                      "w-full h-14 rounded-full text-base font-medium border-border bg-background text-foreground hover:!bg-background hover:!text-foreground active:!bg-background active:!text-foreground focus:!bg-background focus:!text-foreground focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                      stackedNativeSecondaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    Sign In
                  </Button>
                )}
              </div>
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
                  Back
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
                  Sign In
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
                {continueText}
              </Button>
            </div>
            )
          ) : (
            <div className="flex w-full flex-col gap-2">
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
                {continueText}
              </Button>
              {isWelcome && welcomeCtaSubtext ? (
                <p className="text-center text-[11px] font-medium tracking-wide text-white/40">
                  {welcomeCtaSubtext}
                </p>
              ) : null}
              {isWelcome && welcomeSignInAsTextLink ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-white/45 underline-offset-2 transition-colors hover:text-white/65 hover:underline"
                >
                  Already have an account? Sign in
                </button>
              ) : null}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
```

## src/components/onboarding/OnboardingTypewriter.tsx

```tsx
import { useEffect, useLayoutEffect, useRef, useState, type ElementType } from "react";
import { cn } from "@/lib/utils";

type Props = {
  text: string;
  /** Milliseconds between characters, or a function of how many characters are visible so far. */
  speedMs?: number | ((revealedSoFar: number) => number);
  className?: string;
  /** Merged with default paragraph styles; omit default min-height when using a scroll container. */
  contentClassName?: string;
  /** Fires after each newly revealed character (after DOM update). Passes visible character count. */
  onAfterRevealStep?: (revealedCount: number) => void;
  /** Visible element (sr-only duplicate still exposes full string to assistive tech). Default `p`. */
  as?: ElementType;
  /** Default `true`: keeps `min-h-[9rem]` for body copy. Set `false` for headings / one-liners. */
  reserveMinHeight?: boolean;
  /** Runs once when the final character is revealed. */
  onTypingComplete?: () => void;
};

/**
 * Reveals copy progressively for onboarding moments (affirmation-style reads).
 */
export function OnboardingTypewriter({
  text,
  speedMs = 26,
  className,
  contentClassName,
  onAfterRevealStep,
  as: Comp = "p",
  reserveMinHeight = true,
  onTypingComplete,
}: Props) {
  const [count, setCount] = useState(0);
  const done = count >= text.length;
  const tickRef = useRef(onAfterRevealStep);
  tickRef.current = onAfterRevealStep;
  const completeFiredRef = useRef(false);

  useEffect(() => {
    setCount(0);
    completeFiredRef.current = false;
  }, [text]);

  useEffect(() => {
    if (done) return;
    const delay =
      typeof speedMs === "function" ? speedMs(count) : (speedMs ?? 26);
    const id = window.setTimeout(() => {
      setCount((c) => Math.min(c + 1, text.length));
    }, delay);
    return () => window.clearTimeout(id);
  }, [count, done, text.length, speedMs]);

  useEffect(() => {
    if (!done || !onTypingComplete || completeFiredRef.current) return;
    completeFiredRef.current = true;
    onTypingComplete();
  }, [done, onTypingComplete]);

  useLayoutEffect(() => {
    if (!onAfterRevealStep) return;
    const run = () => tickRef.current?.(count);
    requestAnimationFrame(() => requestAnimationFrame(run));
  }, [count, onAfterRevealStep]);

  return (
    <div className={cn("relative", className)}>
      <p className="sr-only">{text}</p>
      <Comp
        className={cn(
          "text-sm leading-relaxed text-foreground pl-1.5",
          reserveMinHeight && "min-h-[9rem]",
          contentClassName,
        )}
        aria-hidden
      >
        {text.slice(0, count)}
        {!done ? (
          <span className="inline-block w-px h-[1.05em] ml-0.5 align-text-bottom bg-foreground animate-pulse" />
        ) : null}
      </Comp>
    </div>
  );
}
```

## src/components/onboarding/SetupHeadingBlock.tsx

```tsx
import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import {
  SETUP_HEADING_SUBTITLE_CLASS,
  SETUP_HEADING_TITLE_CLASS,
} from "@/lib/onboardingSetupTheme";

type Props = {
  title: ReactNode;
  subtitle?: ReactNode;
  className?: string;
  subtitleClassName?: string;
  titleClassName?: string;
  centered?: boolean;
};

export function SetupHeadingBlock({
  title,
  subtitle,
  className,
  subtitleClassName,
  titleClassName,
  centered,
}: Props) {
  const centerClass = centered ? "text-center" : undefined;
  return (
    <div className={cn("space-y-2", centerClass, className)}>
      <h1 className={cn(SETUP_HEADING_TITLE_CLASS, centerClass, titleClassName)}>{title}</h1>
      {subtitle != null ? (
        <div
          className={cn(SETUP_HEADING_SUBTITLE_CLASS, "[&_p]:mb-0", centerClass, subtitleClassName)}
        >
          {subtitle}
        </div>
      ) : null}
    </div>
  );
}
```

## src/components/onboarding/SetupPage.tsx

```tsx
import { ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { ONBOARDING_SETUP_PROGRESS_ROUTES } from "@/lib/onboardingFlow";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import {
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

type Props = {
  onBack?: () => void;
  headerSlot?: ReactNode;
  /** When true, do not force light mode / overwrite theme (use after theme picker). Default false. */
  respectUserTheme?: boolean;
  /** Native only: skip the inner scroll viewport (short pages where overflow clips shadows/glow). */
  disableNativeScrollViewport?: boolean;
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
}: Props) {
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const isAndroidNative = isNative && Capacitor.getPlatform() === "android";
  const { pathname } = useLocation();
  const { ensureSession } = useOnboardingSession();

  /** Same warm-up as legacy onboarding (`OnboardingQuestions`): create `onboarding_session` creds before draft syncs. */
  useEffect(() => {
    void ensureSession().catch(() => {});
  }, [ensureSession]);

  const setupProgressFillPct = useMemo(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const idx = (ONBOARDING_SETUP_PROGRESS_ROUTES as readonly string[]).indexOf(path);
    if (idx < 0) return null;
    const n = ONBOARDING_SETUP_PROGRESS_ROUTES.length;
    return ((idx + 1) / n) * 100;
  }, [pathname]);

  const showNativeMobileFooter = isNative && (onBack != null || onContinue != null);

  const mainColumn = (
    <>
      {headerSlot ? <div className="flex items-center justify-between">{headerSlot}</div> : null}
      {children}
    </>
  );

  return (
    <div
      className={cn(
        "relative overflow-hidden font-sans text-white antialiased",
        isNative ? "h-[100dvh] max-h-[100dvh]" : "min-h-screen",
      )}
      style={{ backgroundColor: WELCOME_COSMIC_BASE }}
    >
      <WelcomeCosmicBackground
        className={cn(
          "pointer-events-none inset-0 z-0",
          disableNativeScrollViewport ? "absolute" : "fixed",
        )}
      />

      {isAndroidNative ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[45]"
          style={{
            height: "var(--app-safe-area-top)",
            backgroundColor: WELCOME_COSMIC_BASE,
          }}
          aria-hidden
        />
      ) : null}

      {setupProgressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-12",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div
            className={cn(
              "h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full bg-white/20",
            )}
          >
            <div
              className={cn("h-full rounded-full transition-[width] duration-300 ease-out bg-white/90")}
              style={{ width: `${setupProgressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex flex-col items-center animate-fade-in",
          isNative ? "h-full min-h-0 px-8 pb-40" : "min-h-screen justify-between pt-12 p-8 md:pt-24",
        )}
        style={
          isNative
            ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" }
            : undefined
        }
      >
        {isNative ? (
          disableNativeScrollViewport ? (
            <div className="relative z-[1] isolate flex h-0 min-h-0 w-full max-w-md flex-1 basis-0 flex-col overflow-hidden">
              <div className="flex h-0 min-h-0 flex-1 basis-0 flex-col overflow-hidden pb-3">
                {mainColumn}
              </div>
            </div>
          ) : (
            <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
              <div className="relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]">
                <div className="space-y-6 pb-3">{mainColumn}</div>
              </div>
            </div>
          )
        ) : (
          <div className="relative z-[1] isolate w-full max-w-md space-y-6">{mainColumn}</div>
        )}

        <div className="hidden md:block">
          {onBack ? (
            <button
              onClick={onBack}
              className={cn(SETUP_DESKTOP_CHEVRON_CLASS, "left-8 top-1/2 -translate-y-1/2 group")}
              aria-label="Back"
            >
              <ChevronLeft className="w-8 h-8 text-white/80 group-hover:text-white transition-colors" />
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
              <ChevronRight className="w-8 h-8 text-white" />
            </button>
          ) : null}
        </div>

        {showNativeMobileFooter ? (
          <div
            className="fixed inset-x-0 bottom-0 z-40 md:hidden"
            style={{
              paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
              backgroundColor: WELCOME_COSMIC_BASE,
            }}
          >
            <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
              {onBack ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className={SETUP_NATIVE_BACK_BTN_CLASS}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Back
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
                  {continueText}
                </Button>
              ) : null}
            </div>
          </div>
        ) : !isNative ? (
          <div
            className={cn(
              "w-full max-w-md space-y-6 md:hidden",
              isStandaloneMobile ? "mb-12" : "",
            )}
          >
            <div className="flex items-center gap-3">
              {onBack ? (
                <Button
                  variant="outline"
                  onClick={onBack}
                  className={SETUP_NATIVE_BACK_BTN_CLASS}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  Back
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
                  {continueText}
                </Button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
```

## src/components/onboarding/WelcomeCosmicBackground.tsx

```tsx
/** Welcome palette — deep violet night, subtle accent (not loud pink). */
export const WELCOME_ACCENT = "#c9a8bc";
export const WELCOME_COSMIC_BASE = "#0a0812";

const WELCOME_STARS: readonly { x: number; y: number; r: number; o: number }[] = Array.from(
  { length: 72 },
  (_, i) => ({
    x: ((i * 41 + 13) % 98) + 1,
    y: ((i * 29 + 7) % 97) + 1.5,
    r: i % 4 === 0 ? 0.2 : i % 3 === 0 ? 0.14 : 0.1,
    o: i % 4 === 0 ? 0.5 : 0.28,
  }),
);

/** Restrained starfield — one nebula, no bokeh blobs. */
export function WelcomeCosmicBackground({ className }: { className?: string }) {
  return (
    <div className={className} aria-hidden>
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${WELCOME_COSMIC_BASE} 0%, #0f0d14 50%, #0a0812 100%)`,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full opacity-80"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {WELCOME_STARS.map((star, index) => (
          <circle key={index} cx={star.x} cy={star.y} r={star.r} fill="#fff" opacity={star.o} />
        ))}
      </svg>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-5%,rgba(88,62,110,0.35),transparent_70%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_60%_at_50%_100%,rgba(0,0,0,0.5),transparent_50%)]" />
    </div>
  );
}
```

## src/components/ui/button.tsx

```tsx
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size }), className)} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
```

## src/components/ui/card.tsx

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("rounded-lg border bg-card text-card-foreground shadow-sm", className)} {...props} />
));
Card.displayName = "Card";

const CardHeader = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
  ),
);
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-2xl font-semibold leading-none tracking-tight", className)} {...props} />
  ),
);
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
  ),
);
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />,
);
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn("flex items-center p-6 pt-0", className)} {...props} />
  ),
);
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent };
```

## src/components/ui/checkbox.tsx

```tsx
import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator className={cn("flex items-center justify-center text-current")}>
      <Check className="h-4 w-4" />
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = CheckboxPrimitive.Root.displayName;

export { Checkbox };
```

## src/components/ui/input.tsx

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground outline-none focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";

export { Input };
```

## src/components/ui/label.tsx

```tsx
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> & VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
  <LabelPrimitive.Root ref={ref} className={cn(labelVariants(), className)} {...props} />
));
Label.displayName = LabelPrimitive.Root.displayName;

export { Label };
```

## src/components/ui/textarea.tsx

```tsx
import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-base md:text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      ref={ref}
      {...props}
    />
  );
});
Textarea.displayName = "Textarea";

export { Textarea };
```

## src/contexts/AuthContext.tsx

```tsx
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { unregisterPushNotifications } from "@/services/pushNotifications";
import {
  bootstrapRevenueCat,
  hasRevenueCatEntitlement,
  refreshAppleRevenueCatPlanOnServer,
} from "@/services/revenueCat";
import { bootstrapRevenueCatWeb, isRevenueCatWebConfigured } from "@/services/revenueCatWeb";
import { Capacitor } from "@capacitor/core";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isLoading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

/** (6) Stagger native IAP work after first paint (ms). */
const NATIVE_RC_BOOTSTRAP_MS = 450;
const NATIVE_RC_ENTITLEMENT_MS = 600;
/** Apple/RevenueCat–billed users: refresh user_plans from RC API (web + native). */
const APPLE_RC_SERVER_SYNC_MS = 750;

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const maxRetries = 3;
    
    // (3) Safety timeout — if auth check takes too long, stop loading anyway (NativeSplashGate
    // can still hold the native layer longer; backup splash tear-down is ~8s).
    const safetyTimeout = setTimeout(() => {
      if (isMounted) {
        console.warn("Auth check timeout - stopping loading state");
        setIsLoading(false);
      }
    }, 3000); // 3 second max for auth check (longer for PWA)


    // Function to get session with retry logic (for PWA standalone mode)
    const getSessionWithRetry = async (attempt: number = 0): Promise<void> => {
      if (!isMounted) return;

      try {
        // Check if localStorage is available (can be an issue in some PWA contexts)
        if (typeof window !== 'undefined' && !window.localStorage) {
          console.warn("localStorage not available, proceeding without session");
          if (isMounted) {
            setIsLoading(false);
            clearTimeout(safetyTimeout);
          }
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!isMounted) return;

        if (error) {
          console.error("Error getting session:", error);
          // Retry if we haven't exceeded max retries
          if (attempt < maxRetries) {
            setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
            return;
          }
          // After max retries, stop loading anyway
          setIsLoading(false);
          clearTimeout(safetyTimeout);
          return;
        }

        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      } catch (error) {
        console.error("Error getting session (catch):", error);
        if (!isMounted) return;
        
        // Retry if we haven't exceeded max retries
        if (attempt < maxRetries) {
          setTimeout(() => getSessionWithRetry(attempt + 1), 500 * (attempt + 1));
          return;
        }
        
        // After max retries, stop loading anyway
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    };

    // Get initial session with retry logic
    getSessionWithRetry();

    // Subscribe to auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (isMounted) {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        clearTimeout(safetyTimeout);
      }
    });

    return () => {
      isMounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
  }, []);

  // Initialize push notifications when user logs in (native app only)
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) {
      return; // Skip on web/PWA
    }

    if (!user && !isLoading) {
      // User logged out - unregister push notifications
      unregisterPushNotifications().catch((error) => {
        console.error('[AuthContext] Failed to unregister push notifications:', error);
      });
    }
  }, [user, isLoading]);

  // (6) RevenueCat: native Capacitor SDK; web purchases-js (same app user id = Supabase UUID).
  useEffect(() => {
    if (isLoading) return;

    const id = window.setTimeout(() => {
      if (Capacitor.isNativePlatform()) {
        void bootstrapRevenueCat(user?.id ?? null);
      } else if (isRevenueCatWebConfigured()) {
        void bootstrapRevenueCatWeb(user?.id ?? null);
      }
    }, NATIVE_RC_BOOTSTRAP_MS);
    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;
    const id = window.setTimeout(() => {
      const checkEntitlement = async () => {
        const hasPro = await hasRevenueCatEntitlement("Palette Plotting Pro");
        if (cancelled) return;
        if (hasPro) {
          console.info("[RevenueCat] Active entitlement found: Palette Plotting Pro");
        }
      };
      void checkEntitlement();
    }, NATIVE_RC_ENTITLEMENT_MS);

    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [user?.id, isLoading]);

  // Apple / RevenueCat–billed accounts: keep user_plans (e.g. current_period_end) in sync via RC REST API.
  // Runs on web/PWA and native; gates on user_plans inside the helper (not Capacitor).
  useEffect(() => {
    if (!user || isLoading) return;

    const id = window.setTimeout(() => {
      void refreshAppleRevenueCatPlanOnServer("session_start");
    }, APPLE_RC_SERVER_SYNC_MS);

    return () => clearTimeout(id);
  }, [user?.id, isLoading]);

  useEffect(() => {
    if (!user || isLoading) return;

    const onVisibility = () => {
      if (document.visibilityState !== "visible") return;
      void refreshAppleRevenueCatPlanOnServer("background");
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [user?.id, isLoading]);

  return (
    <AuthContext.Provider value={{ user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## src/debugLog.ts

```typescript
/**
 * Debug session f4efe6: optional local ingest + persistence (dev only).
 *
 * Never POST to loopback in production builds: Chrome shows "Access other apps and services
 * on this device" for https origins hitting 127.0.0.1 (Local Network Access).
 */
const INGEST_URL = 'http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd';
const LOG_KEY = 'debug_f4efe6_log';

function isDevDebugIngestEnabled(): boolean {
  return import.meta.env.DEV === true;
}

export function debugLog(payload: {
  sessionId?: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp?: number;
  hypothesisId?: string;
}) {
  if (!isDevDebugIngestEnabled()) return;

  const line = JSON.stringify({
    ...payload,
    timestamp: payload.timestamp ?? Date.now(),
    sessionId: payload.sessionId ?? 'f4efe6',
  });
  fetch(INGEST_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'f4efe6' },
    body: line,
  }).catch(() => {});
  try {
    const cur = typeof localStorage !== 'undefined' ? localStorage.getItem(LOG_KEY) ?? '' : '';
    localStorage.setItem(LOG_KEY, cur ? `${cur}\n${line}` : line);
  } catch {
    // ignore
  }
}

/** Call from Safari Web Inspector or in-app "Copy debug log" button */
export function getDebugLog(): string {
  return typeof localStorage !== 'undefined' ? localStorage.getItem(LOG_KEY) ?? '' : '';
}

if (typeof window !== 'undefined') {
  (window as unknown as { getDebugLog?: () => string }).getDebugLog = getDebugLog;
}
```

## src/hooks/use-native-app.ts

```typescript
import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';

/**
 * Hook to detect if the app is running in a native Capacitor environment
 * (iOS app, Android app, etc.) vs web browser.
 *
 * We compute the initial value synchronously so that layouts which depend on
 * this flag don't "jump" on first render in the native app (e.g. onboarding
 * pages shifting when the flag flips from false → true after mount).
 */
const initialIsNative = Capacitor.isNativePlatform();

export const useIsNativeApp = () => {
  const [isNative, setIsNative] = useState(initialIsNative);

  useEffect(() => {
    setIsNative(Capacitor.isNativePlatform());
  }, []);

  return isNative;
};
```

## src/hooks/useOnboardingSession.ts

```typescript
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useLocalStorage } from "@/hooks/useLocalStorage";

type OnboardingSessionStorage = {
  sessionId: string;
  resumeToken: string;
  createdAt?: number; // Timestamp when session was created
};

export type OnboardingSession = {
  id: string;
  status: string;
  email: string | null;
  first_name: string | null;
  username: string | null;
  email_consent: boolean | null;
  sms_consent: boolean | null;
  app_notifications_consent?: boolean | null;
  character_id: string | null;
  /** App shell (`light` | `dark`) persisted as a typed column, not onboarding_answers JSON. */
  shell_appearance?: string | null;
  /** Merged JSON: legacy keys + `setup_journey_v1` (full setup path answers) for personalization. */
  onboarding_answers: Record<string, unknown>;
  selected_tier: string | null;
  billing: string | null;
  stripe_checkout_session_id: string | null;
  stripe_customer_email: string | null;
  paid_at: string | null;
  user_id: string | null;
};

export function useOnboardingSession() {
  const [stored, setStored] = useLocalStorage<OnboardingSessionStorage | null>("onboarding_session", null);
  const [session, setSession] = useState<OnboardingSession | null>(null);
  const [isBootstrapping, setIsBootstrapping] = useState(false);

  const clearOnboardingSession = useCallback(() => {
    setStored(null);
    setSession(null);
  }, [setStored]);

  const ensureSession = useCallback(async () => {
    if (stored?.sessionId && stored?.resumeToken) {
      // Check if session is expired (7 days for production)
      const sessionAge = Date.now() - (stored.createdAt || 0);
      const maxAge = 7 * 24 * 60 * 60 * 1000; // 7 days
      
      if (stored.createdAt && sessionAge > maxAge) {
        console.log('Session expired, creating new one');
        setStored(null);
        // Continue to create new session below
      } else {
        return stored;
      }
    }

    setIsBootstrapping(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-onboarding-session", { body: {} });
      if (error) throw error;
      if (!data?.sessionId || !data?.resumeToken) {
        throw new Error("Invalid onboarding session response");
      }
      const next = { 
        sessionId: data.sessionId as string, 
        resumeToken: data.resumeToken as string,
        createdAt: Date.now() // Store creation time
      };
      setStored(next);
      return next;
    } finally {
      setIsBootstrapping(false);
    }
  }, [setStored, stored]);

  const refreshSession = useCallback(
    async (override?: OnboardingSessionStorage) => {
      const creds = override || stored || (await ensureSession());
      if (!creds?.sessionId || !creds?.resumeToken) return;

      const { data, error } = await supabase.functions.invoke("get-onboarding-session", {
        body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken },
      });
      if (error) throw error;
      if (data?.session) {
        const session = data.session as OnboardingSession;
        
        // If session is claimed (has user_id), clear it - user should be logged in
        if (session.user_id) {
          console.log('Session already claimed, clearing local storage');
          clearOnboardingSession();
          return;
        }
        
        setSession(session);
      }
    },
    [ensureSession, stored, clearOnboardingSession],
  );

  const updateSession = useCallback(
    async (patch: Record<string, unknown>) => {
      const creds = stored || (await ensureSession());
      if (!creds?.sessionId || !creds?.resumeToken) return;

      const { data, error } = await supabase.functions.invoke("update-onboarding-session", {
        body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken, patch },
      });
      if (error) throw error;
      if (data?.session) setSession(data.session as OnboardingSession);
      return data?.session as OnboardingSession | undefined;
    },
    [ensureSession, stored],
  );

  useEffect(() => {
    // Try to hydrate if we already have credentials
    if (stored?.sessionId && stored?.resumeToken) {
      refreshSession().catch(() => {
        // If session no longer exists, clear and let user restart
        clearOnboardingSession();
      });
    }
  }, [stored?.sessionId, stored?.resumeToken, refreshSession, clearOnboardingSession]);

  return {
    stored,
    session,
    isBootstrapping,
    ensureSession,
    refreshSession,
    updateSession,
    clearOnboardingSession,
  };
}
```

## src/integrations/supabase/client.ts

```typescript
// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';
import { Capacitor } from '@capacitor/core';

export const SUPABASE_URL = "https://hyckwyjznishkjijrhcw.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imh5Y2t3eWp6bmlzaGtqaWpyaGN3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA0NjA3ODcsImV4cCI6MjA3NjAzNjc4N30.YILKDI3tYbXPJ-TdQWD2_QMqHHkubErNXQ5MG_aeUOY";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

## src/integrations/supabase/types.ts

```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      aesthetic_profiles: {
        Row: {
          accessories: Json | null
          accessory_ids: Json | null
          aesthetic_image_url: string | null
          background_id: string | null
          background_setting: string | null
          created_at: string
          current_photo_url: string | null
          final_composite_url: string | null
          goals: Json | null
          hair_color: string | null
          hair_style: string | null
          hairstyle_id: string | null
          hobbies: Json | null
          id: string
          is_active: boolean | null
          location_vibe: string | null
          outfit_id: string | null
          outfit_style: string | null
          skin_tone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          accessories?: Json | null
          accessory_ids?: Json | null
          aesthetic_image_url?: string | null
          background_id?: string | null
          background_setting?: string | null
          created_at?: string
          current_photo_url?: string | null
          final_composite_url?: string | null
          goals?: Json | null
          hair_color?: string | null
          hair_style?: string | null
          hairstyle_id?: string | null
          hobbies?: Json | null
          id?: string
          is_active?: boolean | null
          location_vibe?: string | null
          outfit_id?: string | null
          outfit_style?: string | null
          skin_tone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          accessories?: Json | null
          accessory_ids?: Json | null
          aesthetic_image_url?: string | null
          background_id?: string | null
          background_setting?: string | null
          created_at?: string
          current_photo_url?: string | null
          final_composite_url?: string | null
          goals?: Json | null
          hair_color?: string | null
          hair_style?: string | null
          hairstyle_id?: string | null
          hobbies?: Json | null
          id?: string
          is_active?: boolean | null
          location_vibe?: string | null
          outfit_id?: string | null
          outfit_style?: string | null
          skin_tone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      chrono_entries: {
        Row: {
          ai_affirmation: string | null
          ai_best_timeline: string | null
          ai_worst_timeline: string | null
          created_at: string
          entry_date: string
          entry_text: string
          entry_time: string
          has_wins: boolean | null
          id: string
          journal_day_experience_rating: string | null
          journal_env_3d_rating: string | null
          latitude: number | null
          location_name: string | null
          location_type: string | null
          longitude: number | null
          photo_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_affirmation?: string | null
          ai_best_timeline?: string | null
          ai_worst_timeline?: string | null
          created_at?: string
          entry_date: string
          entry_text: string
          entry_time?: string
          has_wins?: boolean | null
          id?: string
          journal_day_experience_rating?: string | null
          journal_env_3d_rating?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_affirmation?: string | null
          ai_best_timeline?: string | null
          ai_worst_timeline?: string | null
          created_at?: string
          entry_date?: string
          entry_text?: string
          entry_time?: string
          has_wins?: boolean | null
          id?: string
          journal_day_experience_rating?: string | null
          journal_env_3d_rating?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      code_redemptions: {
        Row: {
          code_id: string
          discount_applied: number | null
          id: string
          redeemed_at: string | null
          redeemed_by: string
        }
        Insert: {
          code_id: string
          discount_applied?: number | null
          id?: string
          redeemed_at?: string | null
          redeemed_by: string
        }
        Update: {
          code_id?: string
          discount_applied?: number | null
          id?: string
          redeemed_at?: string | null
          redeemed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_redemptions_code_id_fkey"
            columns: ["code_id"]
            isOneToOne: false
            referencedRelation: "referral_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      community_posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          description: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      manifestation_power_daily_signals: {
        Row: {
          created_at: string
          id: string
          signal_date: string
          signal_kind: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signal_date: string
          signal_kind: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signal_date?: string
          signal_kind?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          default_enabled: boolean | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          notification_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          notification_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          default_enabled?: boolean | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          notification_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["org_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_presets: {
        Row: {
          created_at: string | null
          id: string
          is_default: boolean | null
          organization_id: string
          preset_config: Json
          preset_theme: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          organization_id: string
          preset_config?: Json
          preset_theme: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          organization_id?: string
          preset_config?: Json
          preset_theme?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organization_presets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          billing_email: string | null
          created_at: string | null
          custom_settings: Json | null
          id: string
          name: string
          plan_tier: Database["public"]["Enums"]["org_plan_tier"]
          seat_count: number
          seats_used: number
          status: string
          updated_at: string | null
        }
        Insert: {
          billing_email?: string | null
          created_at?: string | null
          custom_settings?: Json | null
          id?: string
          name: string
          plan_tier?: Database["public"]["Enums"]["org_plan_tier"]
          seat_count?: number
          seats_used?: number
          status?: string
          updated_at?: string | null
        }
        Update: {
          billing_email?: string | null
          created_at?: string | null
          custom_settings?: Json | null
          id?: string
          name?: string
          plan_tier?: Database["public"]["Enums"]["org_plan_tier"]
          seat_count?: number
          seats_used?: number
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      premade_affirmation_sets: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      premade_affirmations: {
        Row: {
          created_at: string | null
          id: string
          order_index: number | null
          set_id: string
          text: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          set_id: string
          text: string
        }
        Update: {
          created_at?: string | null
          id?: string
          order_index?: number | null
          set_id?: string
          text?: string
        }
        Relationships: [
          {
            foreignKeyName: "premade_affirmations_set_id_fkey"
            columns: ["set_id"]
            isOneToOne: false
            referencedRelation: "premade_affirmation_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_activity: string | null
          onboarding_data: Json | null
          phone: string | null
          preset_theme: string | null
          signup_code: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_activity?: string | null
          onboarding_data?: Json | null
          phone?: string | null
          preset_theme?: string | null
          signup_code?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_activity?: string | null
          onboarding_data?: Json | null
          phone?: string | null
          preset_theme?: string | null
          signup_code?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      referral_codes: {
        Row: {
          code: string
          code_type: Database["public"]["Enums"]["code_type"]
          created_at: string | null
          created_by: string | null
          current_uses: number | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          metadata: Json | null
          updated_at: string | null
        }
        Insert: {
          code: string
          code_type?: Database["public"]["Enums"]["code_type"]
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          code_type?: Database["public"]["Enums"]["code_type"]
          created_at?: string | null
          created_by?: string | null
          current_uses?: number | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          metadata?: Json | null
          updated_at?: string | null
        }
        Relationships: []
      }
      sacred_text_bookmarks: {
        Row: {
          bookmark_type: string | null
          chapter: number | null
          created_at: string | null
          id: string
          note: string | null
          text_id: string
          user_id: string
          verse: number | null
        }
        Insert: {
          bookmark_type?: string | null
          chapter?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          text_id: string
          user_id: string
          verse?: number | null
        }
        Update: {
          bookmark_type?: string | null
          chapter?: number | null
          created_at?: string | null
          id?: string
          note?: string | null
          text_id?: string
          user_id?: string
          verse?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sacred_text_bookmarks_text_id_fkey"
            columns: ["text_id"]
            isOneToOne: false
            referencedRelation: "sacred_texts"
            referencedColumns: ["id"]
          },
        ]
      }
      sacred_texts: {
        Row: {
          author: string | null
          book_structure: Json | null
          category: string | null
          content: string
          created_at: string | null
          id: string
          is_active: boolean | null
          language: string | null
          title: string
          total_chapters: number | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          author?: string | null
          book_structure?: Json | null
          category?: string | null
          content: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          title: string
          total_chapters?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          author?: string | null
          book_structure?: Json | null
          category?: string | null
          content?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          language?: string | null
          title?: string
          total_chapters?: number | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: []
      }
      story_chapters: {
        Row: {
          chapter_number: number
          content: string
          created_at: string | null
          id: string
          story_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          chapter_number: number
          content: string
          created_at?: string | null
          id?: string
          story_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          chapter_number?: number
          content?: string
          created_at?: string | null
          id?: string
          story_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "story_chapters_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "user_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      story_panels: {
        Row: {
          caption: string | null
          chapter_id: string
          created_at: string | null
          id: string
          image_prompt: string | null
          image_url: string | null
          is_generating: boolean | null
          panel_number: number
          scene_description: string
        }
        Insert: {
          caption?: string | null
          chapter_id: string
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_generating?: boolean | null
          panel_number: number
          scene_description: string
        }
        Update: {
          caption?: string | null
          chapter_id?: string
          created_at?: string | null
          id?: string
          image_prompt?: string | null
          image_url?: string | null
          is_generating?: boolean | null
          panel_number?: number
          scene_description?: string
        }
        Relationships: [
          {
            foreignKeyName: "story_panels_chapter_id_fkey"
            columns: ["chapter_id"]
            isOneToOne: false
            referencedRelation: "story_chapters"
            referencedColumns: ["id"]
          },
        ]
      }
      system_announcements: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          message: string
          title: string
          type: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message: string
          title: string
          type?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          message?: string
          title?: string
          type?: string | null
        }
        Relationships: []
      }
      user_setup_path: {
        Row: {
          user_id: string
          first_name: string | null
          email: string | null
          desire_category: string | null
          desire_text: string | null
          why_it_matters: string | null
          current_friction: string | null
          desired_identity: string | null
          tool_preferences: string[]
          conditional_specificity: Json
          shell_appearance: string | null
          guide_character_id: string | null
          embody_active_practices: string[] | null
          post_paywall_provisioned_at: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          first_name?: string | null
          email?: string | null
          desire_category?: string | null
          desire_text?: string | null
          why_it_matters?: string | null
          current_friction?: string | null
          desired_identity?: string | null
          tool_preferences?: string[]
          conditional_specificity?: Json
          shell_appearance?: string | null
          guide_character_id?: string | null
          embody_active_practices?: string[] | null
          post_paywall_provisioned_at?: string | null
          updated_at?: string
        }
        Update: {
          user_id?: string
          first_name?: string | null
          email?: string | null
          desire_category?: string | null
          desire_text?: string | null
          why_it_matters?: string | null
          current_friction?: string | null
          desired_identity?: string | null
          tool_preferences?: string[]
          conditional_specificity?: Json
          shell_appearance?: string | null
          guide_character_id?: string | null
          embody_active_practices?: string[] | null
          post_paywall_provisioned_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_gamification_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          milestones_achieved: Json | null
          tools_used_this_week: Json | null
          total_tools_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          milestones_achieved?: Json | null
          tools_used_this_week?: Json | null
          total_tools_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          milestones_achieved?: Json | null
          tools_used_this_week?: Json | null
          total_tools_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_activity_stats: {
        Row: {
          belief_view_sessions_total: number
          mirror_sessions_total: number
          subliminal_creation_seconds_total: number
          subliminal_listen_seconds_total: number
          subliminal_listen_sessions_total: number
          tap_in_sessions_total: number
          updated_at: string
          user_id: string
          visualize_sessions_total: number
        }
        Insert: {
          belief_view_sessions_total?: number
          mirror_sessions_total?: number
          subliminal_creation_seconds_total?: number
          subliminal_listen_seconds_total?: number
          subliminal_listen_sessions_total?: number
          tap_in_sessions_total?: number
          updated_at?: string
          user_id: string
          visualize_sessions_total?: number
        }
        Update: {
          belief_view_sessions_total?: number
          mirror_sessions_total?: number
          subliminal_creation_seconds_total?: number
          subliminal_listen_seconds_total?: number
          subliminal_listen_sessions_total?: number
          tap_in_sessions_total?: number
          updated_at?: string
          user_id?: string
          visualize_sessions_total?: number
        }
        Relationships: []
      }
      user_daily_journey_summaries: {
        Row: {
          created_at: string
          daily_power_percent: number | null
          id: string
          summary_date: string
          summary_text: string
          user_id: string
        }
        Insert: {
          created_at?: string
          daily_power_percent?: number | null
          id?: string
          summary_date: string
          summary_text: string
          user_id: string
        }
        Update: {
          created_at?: string
          daily_power_percent?: number | null
          id?: string
          summary_date?: string
          summary_text?: string
          user_id?: string
        }
        Relationships: []
      }
      user_notification_preferences: {
        Row: {
          created_at: string | null
          email_consent: boolean | null
          enabled: boolean | null
          id: string
          inactivity_days: number | null
          notification_type: string
          sms_consent: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_consent?: boolean | null
          enabled?: boolean | null
          id?: string
          inactivity_days?: number | null
          notification_type: string
          sms_consent?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_consent?: boolean | null
          enabled?: boolean | null
          id?: string
          inactivity_days?: number | null
          notification_type?: string
          sms_consent?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plans: {
        Row: {
          apple_customer_id: string | null
          created_at: string | null
          first_payment_source: string | null
          had_trial: boolean
          id: string
          on_trial: boolean
          last_payment_source: string | null
          plan_name: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          stripe_customer_id_official: string | null
          tier: string
          updated_at: string | null
          user_id: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          apple_customer_id?: string | null
          created_at?: string | null
          first_payment_source?: string | null
          had_trial?: boolean
          id?: string
          last_payment_source?: string | null
          on_trial?: boolean
          plan_name: string
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          apple_customer_id?: string | null
          created_at?: string | null
          first_payment_source?: string | null
          had_trial?: boolean
          on_trial?: boolean
          id?: string
          last_payment_source?: string | null
          plan_name?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_stories: {
        Row: {
          art_style: string | null
          created_at: string | null
          description: string | null
          id: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          art_style?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          art_style?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: {
        Args: {
          check_email: string
        }
        Returns: boolean
      }
      check_username_exists: {
        Args: {
          check_username: string
        }
        Returns: boolean
      }
      get_email_by_username: {
        Args: {
          lookup_username: string
        }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      validate_and_redeem_code: {
        Args: { p_code: string; p_user_id: string }
        Returns: Json
      }
      bump_user_activity_stats: {
        Args: {
          p_belief_view_sessions?: number
          p_mirror_sessions?: number
          p_subliminal_creation_seconds?: number
          p_subliminal_listen_seconds?: number
          p_subliminal_listen_sessions?: number
          p_tap_in_sessions?: number
          p_visualize_sessions?: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      code_type: "discount" | "referral" | "group" | "enterprise"
      org_member_role: "owner" | "admin" | "member"
      org_plan_tier: "starter" | "growth" | "scale" | "custom"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      code_type: ["discount", "referral", "group", "enterprise"],
      org_member_role: ["owner", "admin", "member"],
      org_plan_tier: ["starter", "growth", "scale", "custom"],
    },
  },
} as const
```

## src/lib/affirmations-data.ts

```typescript
/** Max characters per affirmation line in Affirm & Script */
export const AFFIRMATION_LINE_MAX_LENGTH = 150;

/** Max characters for custom set name */
export const AFFIRMATION_SET_NAME_MAX_LENGTH = 50;

export interface AffirmationSet {
  id: string;
  name: string;
  affirmations: string[];
  images?: Array<{ id: string; url: string; prompt?: string }>;
  isPremade?: boolean;
  category?: string;
}

export type SupportCategoryCharacter = "river" | "sage" | "rose" | "oliver";

/** `name` is the canonical value (DB, AI, onboarding storage); `label` is user-facing. */
export interface SupportCategoryDef {
  name: string;
  label: string;
  color: string;
  character: SupportCategoryCharacter;
}

// Support categories matching onboarding (12 total). Order = 2-col grid on manifest setup
// (Love/SP, Beauty/Glow Up, Self-Concept, Money, remaining sage, yellow cluster, blue).
// Keep labels in sync with `supabase/functions/_shared/supportCategories.ts`.
export const SUPPORT_CATEGORIES: SupportCategoryDef[] = [
  { name: "Connections", label: "Love / SP", color: "#FFB6C1", character: "rose" },
  { name: "Self-Love", label: "Beauty / Glow Up", color: "#FFB6C1", character: "rose" },
  { name: "Confidence", label: "Self-Concept", color: "#FFB6C1", character: "rose" },
  { name: "Finances", label: "Money", color: "#8fbf76", character: "sage" },
  { name: "Productivity", label: "Focus", color: "#8fbf76", character: "sage" },
  { name: "Organization", label: "Life Reset", color: "#8fbf76", character: "sage" },
  { name: "Fitness", label: "Body / Fitness", color: "#FFC107", character: "oliver" },
  { name: "Nutrition", label: "Wellness", color: "#FFC107", character: "oliver" },
  { name: "Discipline", label: "Discipline", color: "#FFC107", character: "oliver" },
  { name: "Career", label: "Career", color: "#4AC7FF", character: "river" },
  { name: "Business", label: "Business", color: "#4AC7FF", character: "river" },
  { name: "Learning", label: "School / Exams", color: "#4AC7FF", character: "river" },
];

export function getSupportCategoryLabel(category: string | null | undefined): string {
  if (category == null || category === "") return "";
  const row = SUPPORT_CATEGORIES.find((c) => c.name === category);
  return row?.label ?? category;
}

// Premade affirmation sets
export const PREMADE_SETS: AffirmationSet[] = [
  {
    id: "wealth",
    name: "Wealth & Abundance",
    isPremade: true,
    category: "Finances",
    affirmations: [
      "I am a money magnet and attract wealth effortlessly",
      "Abundance flows to me from multiple sources",
      "I am worthy of financial prosperity and success",
      "Money comes to me easily and frequently",
      "I am financially free and secure",
      "I create wealth through my talents and abilities",
      "My income exceeds my expenses consistently",
      "I make smart financial decisions with confidence",
    ],
  },
  {
    id: "love",
    name: "Love & Relationships",
    isPremade: true,
    category: "Connections",
    affirmations: [
      "I am worthy of deep, authentic love",
      "I attract healthy and fulfilling relationships",
      "Love flows freely to and from me",
      "I communicate my needs with kindness and clarity",
      "I am surrounded by supportive, loving people",
      "My heart is open to give and receive love",
      "I deserve respect and kindness in all relationships",
      "I cultivate genuine connections every day",
    ],
  },
  {
    id: "confidence",
    name: "Confidence & Self-Worth",
    isPremade: true,
    category: "Confidence",
    affirmations: [
      "I trust myself to make good decisions",
      "I am confident and capable in all that I do",
      "I embrace challenges as opportunities to grow",
      "My self-worth is inherent and unshakeable",
      "I speak with confidence and clarity",
      "I believe in my abilities and talents",
      "I am proud of who I am becoming",
      "I show up as my authentic self every day",
    ],
  },
  {
    id: "health",
    name: "Health & Wellness",
    isPremade: true,
    category: "Fitness",
    affirmations: [
      "I honor my body with nourishing choices",
      "I am energetic, strong, and vibrant",
      "Every day I become healthier and fitter",
      "I prioritize rest and recovery",
      "My mind and body are in harmony",
      "I listen to my body and give it what it needs",
      "I enjoy moving my body regularly",
      "I am grateful for my health and vitality",
    ],
  },
  {
    id: "career",
    name: "Career & Success",
    isPremade: true,
    category: "Career",
    affirmations: [
      "I excel in my chosen career path",
      "Opportunities for growth come to me easily",
      "I am valued and respected in my work",
      "I achieve my goals with focus and determination",
      "I am a problem-solver and innovator",
      "Success flows from my consistent actions",
      "I lead with confidence and integrity",
      "I create meaningful impact through my work",
    ],
  },
  {
    id: "spiritual",
    name: "Spiritual Growth",
    isPremade: true,
    category: "Self-Love",
    affirmations: [
      "I am connected to my higher purpose",
      "I trust the guidance of my intuition",
      "I am aligned with peace and clarity",
      "I release what no longer serves me",
      "I welcome growth and transformation",
      "My spirit is grounded and expansive",
      "I am open to wisdom and insight",
      "I radiate love and compassion",
    ],
  },
  {
    id: "productivity",
    name: "Productivity & Focus",
    isPremade: true,
    category: "Productivity",
    affirmations: [
      "I focus on what matters most each day",
      "I plan my work and work my plan",
      "I make steady progress toward my goals",
      "I minimize distractions and stay present",
      "I am disciplined and consistent",
      "I use my time wisely and intentionally",
      "I finish what I start",
      "I celebrate small wins along the way",
    ],
  },
  {
    id: "learning",
    name: "Learning & Growth",
    isPremade: true,
    category: "Learning",
    affirmations: [
      "I learn quickly and effectively",
      "I enjoy mastering new skills",
      "I turn mistakes into lessons",
      "My curiosity drives my growth",
      "I retain information with ease",
      "I ask great questions and seek answers",
      "I am persistent and patient with learning",
      "Learning is enjoyable and rewarding for me",
    ],
  },
];
```

## src/lib/androidPostPurchaseEntitlementGate.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { debugLog } from "@/debugLog";
import { syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";

const STORAGE_KEY = "sv_android_post_paywall_gate_v1";

export type AndroidPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type AndroidPostPurchaseGateResult =
  | { status: "skipped" }
  | { status: "verified" }
  /** Play purchase succeeded but Google/RevenueCat entitlement sync is not confirmed yet. */
  | { status: "delayed"; reason: string };

let entitlementSyncOutcome: Promise<AndroidPostPurchaseGateResult> | null = null;

export function armAndroidPostPurchaseEntitlementLatch(
  userId: string | null
): void {
  try {
    const payload: AndroidPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearAndroidPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): AndroidPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<AndroidPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

export function getAndroidPostPurchaseLatchUserId(): string | null {
  return readLatch()?.userId ?? null;
}

/** Optimistic dashboard access when Google Play → RevenueCat sync is still in flight. */
export function markAndroidSubscriptionConfirmed(userId: string | null): void {
  applyAndroidSubscriptionSessionMarkers(userId);
}

function applyAndroidSubscriptionSessionMarkers(userId: string | null): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("subscription_check_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    if (userId) {
      sessionStorage.setItem(
        `subscription_check_${userId}`,
        JSON.stringify({ ts: Date.now(), active: true })
      );
    }
  } catch {
    /* ignore */
  }
  (
    window as unknown as { __subscriptionConfirmed?: boolean }
  ).__subscriptionConfirmed = true;
}

/**
 * Background RevenueCat/server sync after optimistic dashboard handoff.
 * Does not block UI or bounce the user back to paywall.
 */
export function retryAndroidPostPurchaseEntitlementSyncInBackground(
  attempts = 6
): void {
  void (async () => {
    const start = performance.now();
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts);
      const syncMs = Math.round(performance.now() - start);
      debugLog({
        location: "androidPostPurchaseEntitlementGate.ts:backgroundRetry",
        message: ok
          ? "Background entitlement sync succeeded"
          : "Background entitlement sync still unverified",
        data: { ok, syncMs, attempts },
        hypothesisId: "ANDROID-GATE",
      });
      console.info("[android-post-paywall] background entitlement sync", { ok, syncMs, attempts });
    } catch (e) {
      console.warn("[android-post-paywall] background entitlement sync error:", e);
    }
  })();
}

/**
 * Android-only post-purchase entitlement sync. Mirrors the iOS gate but uses
 * its own storage key and platform check. Shares no code with the iOS gate.
 *
 * After a successful Play purchase, sync failure is reported as `delayed` — not
 * a hard failure — because entitlement can lag behind the purchase receipt.
 */
export async function runAndroidPostPurchaseGateIfNeeded(): Promise<AndroidPostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return { status: "skipped" };

  const isNativeAndroid =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!isNativeAndroid) {
    clearAndroidPostPurchaseEntitlementLatch();
    return { status: "skipped" };
  }

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<AndroidPostPurchaseGateResult> => {
    try {
      const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "androidPostPurchaseEntitlementGate.ts:syncDelayed",
          message:
            "syncRevenueCatEntitlementAfterPurchaseWithRetries unverified after Google Play purchase — treating as delayed",
          hypothesisId: "ANDROID-GATE",
        });
        return {
          status: "delayed",
          reason: "revenuecat_sync_retries_exhausted",
        };
      }
      applyAndroidSubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            userId,
            entitlementSynced: true,
          } satisfies AndroidPaywallLatch)
        );
      } catch {
        /* ignore */
      }
      return { status: "verified" };
    } catch (e) {
      console.error("[androidPostPurchaseEntitlementGate]", e);
      return {
        status: "delayed",
        reason: e instanceof Error ? e.message : "sync_threw",
      };
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}
```

## src/lib/audioProcessor.ts

```typescript
import { supabase } from "@/integrations/supabase/client";
import { createMp3Encoder } from "wasm-media-encoders";
import { Capacitor } from "@capacitor/core";

// Type definitions for binaural frequencies (structure only, values come from edge function)
export type BinauralType = 'none' | 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface SubliminalSettings {
  affirmationBlob: Blob;
  binauralType: BinauralType;
  /** 0–1; scales proprietary binaural gain. Ignored when binauralType is none. */
  binauralVolume: number;
  backgroundSound: string;
  backgroundSoundUrl?: string; // Optional URL for user-created tracks
  affirmationVolume: number;
  backgroundVolume: number;
  layers: number;
  duration: number; // in seconds
}

// Subliminal audio mixing parameters (fetched from edge function)
interface SubliminalParams {
  binauralFrequencies: {
    delta: { base: number; offset: number };
    theta: { base: number; offset: number };
    alpha: { base: number; offset: number };
    beta: { base: number; offset: number };
    gamma: { base: number; offset: number };
  };
  binauralAmplitude: number;
  binauralGain: number;
  affirmationGainMultiplier: number;
  layerDelaySeconds: number;
  layerAttenuation: number;
  targetSampleRate: number;
  audioDetectionThreshold: number;
}

export class AudioProcessor {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private subliminalParams: SubliminalParams | null = null;
  private paramsFetchPromise: Promise<SubliminalParams> | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  // Fetch proprietary mixing parameters from edge function
  private async getSubliminalParams(): Promise<SubliminalParams> {
    // Return cached params if available
    if (this.subliminalParams) {
      return this.subliminalParams;
    }

    // Return existing fetch promise if in progress
    if (this.paramsFetchPromise) {
      return this.paramsFetchPromise;
    }

    // Fetch params from edge function
    this.paramsFetchPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-subliminal-params");

        if (error) {
          console.error("Error fetching subliminal params:", error);
          // Fallback to default values if fetch fails
          return this.getDefaultParams();
        }

        if (data?.params) {
          this.subliminalParams = data.params;
          return data.params;
        }

        return this.getDefaultParams();
      } catch (err) {
        console.error("Error fetching subliminal params:", err);
        return this.getDefaultParams();
      }
    })();

    return this.paramsFetchPromise;
  }

  // Default fallback parameters (used if edge function fails)
  private getDefaultParams(): SubliminalParams {
    return {
      binauralFrequencies: {
        delta: { base: 200, offset: 2 },
        theta: { base: 200, offset: 6 },
        alpha: { base: 250, offset: 10 },
        beta: { base: 300, offset: 20 },
        gamma: { base: 400, offset: 40 },
      },
      binauralAmplitude: 0.3,
      binauralGain: 0.33,
      affirmationGainMultiplier: 0.25,
      layerDelaySeconds: 0.5,
      layerAttenuation: 0.05,
      targetSampleRate: 22050,
      audioDetectionThreshold: 0.001,
    };
  }

  // Generate binaural beat tones
  private async createBinauralBeat(
    ctx: BaseAudioContext,
    type: Exclude<BinauralType, "none">,
    duration: number,
    sampleRate: number
  ): Promise<AudioBuffer> {
    const params = await this.getSubliminalParams();
    const { base, offset } = params.binauralFrequencies[type];
    const amplitude = params.binauralAmplitude;
    
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Left ear frequency (proprietary amplitude)
    for (let i = 0; i < length; i++) {
      leftChannel[i] = Math.sin(2 * Math.PI * base * (i / sampleRate)) * amplitude;
    }

    // Right ear frequency (offset creates the binaural beat) - proprietary amplitude
    for (let i = 0; i < length; i++) {
      rightChannel[i] = Math.sin(2 * Math.PI * (base + offset) * (i / sampleRate)) * amplitude;
    }

    return buffer;
  }

  // Load audio file as AudioBuffer
  private async loadAudioBuffer(source: Blob | string, ctx: BaseAudioContext): Promise<AudioBuffer> {
    let arrayBuffer: ArrayBuffer;
    let blobType: string | undefined;

    if (source instanceof Blob) {
      if (source.size === 0) {
        throw new Error("Affirmation blob is empty (0 bytes)");
      }
      blobType = source.type;
      console.log("Loading blob, size:", source.size, "type:", blobType);
      arrayBuffer = await source.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Affirmation blob arrayBuffer is empty");
      }
    } else {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }
      blobType = response.headers.get('content-type') || undefined;
      arrayBuffer = await response.arrayBuffer();
    }

    try {
      // Try to decode with the original arrayBuffer
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      console.log("Audio buffer decoded successfully:", {
        sampleRate: buffer.sampleRate,
        length: buffer.length,
        duration: buffer.length / buffer.sampleRate,
        channels: buffer.numberOfChannels
      });
      return buffer;
    } catch (error) {
      console.error("Failed to decode audio data:", error);
      console.error("Blob type:", blobType, "ArrayBuffer size:", arrayBuffer.byteLength);
      
      // Provide more helpful error message
      if (blobType && !blobType.startsWith('audio/')) {
        throw new Error(`Invalid audio format. The recording format (${blobType}) may not be supported. Please try recording again. If the issue persists, try using a different browser.`);
      }
      
      if (arrayBuffer.byteLength < 100) {
        throw new Error("Audio file appears to be corrupted or too small. Please record again.");
      }
      
      throw new Error(`Failed to decode audio: ${error instanceof Error ? error.message : String(error)}. The audio format may not be supported. Please try recording again.`);
    }
  }

  // Get or generate background sound
  private async getBackgroundSound(type: string, duration: number, sampleRate: number, ctx: BaseAudioContext): Promise<AudioBuffer> {
    // Check if this is a user track (prefixed with "user:")
    if (type.startsWith("user:")) {
      const trackId = type.replace("user:", "");
      // Load track URL from database - we'll need to pass this or fetch it
      // For now, we'll expect the full URL to be passed or fetch it
      // This will be handled by the caller providing the URL
      throw new Error("User tracks should be loaded with their full URL");
    }

    // type may be a full filename (with extension) or a base name (default .wav)
    const filename = type.includes(".") ? type : `${type}.wav`;
    // Native: fetch from sounds host (files at root). Default to Cloudflare sounds project so we get real WAV, not SPA HTML from main site.
    const soundsBase =
      typeof window !== "undefined" && Capacitor.isNativePlatform()
        ? (import.meta.env.VITE_SOUNDS_ORIGIN as string | undefined) ||
          (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined) ||
          "https://sounds-1og.pages.dev"
        : typeof window !== "undefined"
          ? window.location.origin
          : "";
    // Native: sounds project has files at root. Web: main site has /sounds/ subpath.
    const useSoundsSubpath = typeof window !== "undefined" && !Capacitor.isNativePlatform();
    const url = useSoundsSubpath
      ? `${soundsBase}/sounds/${encodeURIComponent(filename)}`
      : `${soundsBase.replace(/\/$/, "")}/${encodeURIComponent(filename)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Background sound "${filename}" could not be loaded (${response.status}). Make sure files exist in public/sounds/.`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const baseBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return this.loopBuffer(baseBuffer, duration, sampleRate);
  }

  // Loop a short buffer to match target duration with crossfade at seams
  private loopBuffer(sourceBuffer: AudioBuffer, targetDuration: number, targetSampleRate: number): AudioBuffer {
    const ratio = sourceBuffer.sampleRate / targetSampleRate;
    const resampledLen = Math.floor(sourceBuffer.length / ratio);
    const targetLength = Math.ceil(targetDuration * targetSampleRate);
    const fadeSamples = Math.min(Math.floor(0.15 * targetSampleRate), Math.floor(resampledLen * 0.25));
    const stride = resampledLen - fadeSamples;
    const loopCount = Math.ceil(targetLength / stride) + 1;

    const outputBuffer = this.audioContext.createBuffer(
      sourceBuffer.numberOfChannels,
      targetLength,
      targetSampleRate
    );

    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
      const src = sourceBuffer.getChannelData(channel);
      const out = outputBuffer.getChannelData(channel);

      for (let loop = 0; loop < loopCount; loop++) {
        const loopStart = loop * stride;
        for (let i = 0; i < resampledLen; i++) {
          const outIdx = loopStart + i;
          if (outIdx >= targetLength) break;
          const srcIdx = Math.min(Math.floor(i * ratio), src.length - 1);
          let sample = src[srcIdx];
          if (loop > 0 && i < fadeSamples) {
            sample *= Math.sqrt(i / fadeSamples);
          }
          if (i >= resampledLen - fadeSamples) {
            sample *= Math.sqrt((resampledLen - i) / fadeSamples);
          }
          out[outIdx] += sample;
        }
      }
    }

    return outputBuffer;
  }

  // Mix all audio layers into final subliminal track
  async generateSubliminalTrack(settings: SubliminalSettings): Promise<Blob> {
    const duration = settings.duration * 60; // convert minutes to seconds
    
    // Get proprietary mixing parameters from edge function
    const params = await this.getSubliminalParams();
    
    // Use the target sample rate from params - client-side WASM encoding handles any size
    // Only reduce for very long tracks to keep encoding time reasonable
    let targetSampleRate = params.targetSampleRate; // Default: 22050 Hz
    
    // For tracks over 20 minutes, reduce sample rate slightly to speed up encoding
    // This is optional for quality vs. speed tradeoff
    if (duration >= 1200) { // >= 20 minutes
      targetSampleRate = 16000;
      console.log(`Long track detected (${duration}s), using ${targetSampleRate} Hz for faster encoding`);
    }
    
    const estimatedPcmMB = (duration * targetSampleRate * 2 * 4) / (1024 * 1024); // Float32 = 4 bytes
    console.log(`Creating audio: ${duration}s at ${targetSampleRate} Hz, estimated PCM: ${estimatedPcmMB.toFixed(1)} MB`);
    
    // Create offline context for rendering with reduced sample rate
    const offlineContext = new OfflineAudioContext(
      2,
      targetSampleRate * duration,
      targetSampleRate
    );

    // 1. Optional binaural beats (use target sample rate)
    if (settings.binauralType !== "none") {
      const binauralBuffer = await this.createBinauralBeat(
        offlineContext,
        settings.binauralType,
        duration,
        targetSampleRate
      );
      const binauralSource = offlineContext.createBufferSource();
      binauralSource.buffer = binauralBuffer;
      const binauralGain = offlineContext.createGain();
      const vol = Math.max(0, Math.min(1, settings.binauralVolume));
      binauralGain.gain.value = params.binauralGain * vol;
      binauralSource.connect(binauralGain);
      binauralGain.connect(offlineContext.destination);
      binauralSource.start(0);
    }

    // 2. Generate/load background sound (use target sample rate)
    let backgroundBuffer: AudioBuffer;
    console.log("Loading background sound:", settings.backgroundSound, "URL:", settings.backgroundSoundUrl);
    if (!settings.backgroundSound || settings.backgroundSound === "" || settings.backgroundSound === "none") {
      // No background sound - create silent buffer
      backgroundBuffer = offlineContext.createBuffer(2, duration * targetSampleRate, targetSampleRate);
    } else if (settings.backgroundSound.startsWith("user:")) {
      // User track - must have URL provided
      console.log("Processing user track, URL:", settings.backgroundSoundUrl);
      if (!settings.backgroundSoundUrl) {
        throw new Error(`User track selected but URL not provided. Track ID: ${settings.backgroundSound.replace("user:", "")}`);
      }
      try {
        console.log("Fetching user track from:", settings.backgroundSoundUrl);
        const response = await fetch(settings.backgroundSoundUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch user track: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const baseBuffer = await offlineContext.decodeAudioData(arrayBuffer.slice(0));
        backgroundBuffer = this.loopBuffer(baseBuffer, duration, targetSampleRate);
        console.log("User track loaded successfully");
      } catch (error) {
        console.error("Error loading user track:", error);
        throw new Error(`Failed to load user track from URL: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Regular background sound
      backgroundBuffer = await this.getBackgroundSound(settings.backgroundSound, duration, targetSampleRate, offlineContext);
    }

    const backgroundSource = offlineContext.createBufferSource();
    backgroundSource.buffer = backgroundBuffer;
    backgroundSource.loop = true; // Loop background sound
    const backgroundGain = offlineContext.createGain();
    backgroundGain.gain.value = settings.backgroundVolume;
    backgroundSource.connect(backgroundGain);
    backgroundGain.connect(offlineContext.destination);
    backgroundSource.start(0);

    // 3. Load affirmation audio and resample if needed
    console.log("Loading affirmation audio, blob size:", settings.affirmationBlob.size);
    const affirmationBuffer = await this.loadAudioBuffer(settings.affirmationBlob, offlineContext);
    console.log("Affirmation buffer loaded:", {
      sampleRate: affirmationBuffer.sampleRate,
      length: affirmationBuffer.length,
      duration: affirmationBuffer.length / affirmationBuffer.sampleRate,
      channels: affirmationBuffer.numberOfChannels
    });
    
    // Resample affirmation buffer to match target sample rate if needed
    const resampledAffirmationBuffer = affirmationBuffer.sampleRate !== targetSampleRate
      ? await this.resampleAudioBuffer(affirmationBuffer, targetSampleRate)
      : affirmationBuffer;
    
    console.log("Resampled affirmation buffer:", {
      sampleRate: resampledAffirmationBuffer.sampleRate,
      length: resampledAffirmationBuffer.length,
      duration: resampledAffirmationBuffer.length / resampledAffirmationBuffer.sampleRate
    });
    
    // Check if buffer has audio data (use a sample to avoid stack overflow)
    const channelData = resampledAffirmationBuffer.getChannelData(0);
    let maxAmplitude = 0;
    const sampleSize = Math.min(10000, channelData.length); // Sample first 10k samples
    for (let i = 0; i < sampleSize; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    const hasAudio = maxAmplitude > params.audioDetectionThreshold; // Proprietary detection threshold
    console.log("Affirmation buffer audio check:", {
      maxAmplitude,
      hasAudio,
      bufferLength: channelData.length,
      firstSamples: Array.from(channelData.slice(0, 10))
    });
    
    if (!hasAudio) {
      console.warn("WARNING: Affirmation buffer appears to be silent!");
    }

    // 4. Layer affirmations multiple times at subliminal volume
    // Divide by layer count so total volume stays consistent regardless of layers
    // (layers are additive - without this, more layers = louder total volume)
    const totalGain = Math.min(1, settings.affirmationVolume * params.affirmationGainMultiplier);
    const baseAffirmationGain = totalGain / settings.layers;
    console.log("Affirmation settings:", {
      volume: settings.affirmationVolume,
      totalGain: totalGain,
      perLayerGain: baseAffirmationGain,
      layers: settings.layers
    });

    // Ensure affirmations play for the full duration
    const affirmationDuration = resampledAffirmationBuffer.length / resampledAffirmationBuffer.sampleRate;
    console.log("Affirmation duration:", affirmationDuration, "Track duration:", duration);

    for (let layer = 0; layer < settings.layers; layer++) {
      const layerDelay = layer * params.layerDelaySeconds; // Proprietary layer delay
      const affirmationSource = offlineContext.createBufferSource();
      affirmationSource.buffer = resampledAffirmationBuffer;
      affirmationSource.loop = true; // Loop affirmations
      
      const affirmationGain = offlineContext.createGain();
      // Proprietary layer attenuation: each layer slightly quieter to create subliminal whisper effect
      const layerAttenuation = Math.max(0, 1 - layer * params.layerAttenuation);
      affirmationGain.gain.value = baseAffirmationGain * layerAttenuation;
      
      console.log(`Layer ${layer}: gain=${affirmationGain.gain.value}, delay=${layerDelay}, will play until ${duration}s`);
      
      affirmationSource.connect(affirmationGain);
      affirmationGain.connect(offlineContext.destination);
      affirmationSource.start(layerDelay);
      // Stop at the end of the track duration
      affirmationSource.stop(duration);
    }

    // Render the mixed audio
    const renderedBuffer = await offlineContext.startRendering();

    // 1.5s fade-in at the very start of the final track
    const fadeInSamples = Math.min(Math.floor(1.5 * renderedBuffer.sampleRate), renderedBuffer.length);
    for (let ch = 0; ch < renderedBuffer.numberOfChannels; ch++) {
      const data = renderedBuffer.getChannelData(ch);
      for (let i = 0; i < fadeInSamples; i++) {
        data[i] *= i / fadeInSamples;
      }
    }

    // Convert to MP3 using client-side WASM encoder
    const mp3Blob = await this.bufferToMp3(renderedBuffer);
    return mp3Blob;
  }

  // Convert AudioBuffer to MP3 Blob using client-side WASM encoder
  private async bufferToMp3(buffer: AudioBuffer): Promise<Blob> {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const samples = buffer.length;
    
    console.log(`Starting client-side MP3 encoding: ${samples} samples, ${sampleRate} Hz, ${numChannels} channels`);
    const startTime = performance.now();
    
    // Get Float32 channel data
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;
    
    // Initialize WASM MP3 encoder
    const encoder = await createMp3Encoder();
    
    // Configure encoder: use VBR quality 2 for good quality, or can use bitrate: 128
    encoder.configure({
      sampleRate,
      channels: numChannels as 1 | 2, // WASM encoder expects 1 or 2 channels
      vbrQuality: 2, // Good quality VBR (0=best, 9=worst)
    });
    
    // Encode in chunks to allow for progress reporting and prevent blocking
    const chunkSize = 1152 * 32; // Process ~32 frames at a time
    const mp3Chunks: Uint8Array[] = [];
    let totalMp3Size = 0;
    
    for (let i = 0; i < samples; i += chunkSize) {
      const end = Math.min(i + chunkSize, samples);
      const leftChunk = leftChannel.subarray(i, end);
      const rightChunk = numChannels > 1 ? rightChannel.subarray(i, end) : leftChunk;
      
      // Encode chunk - wasm-media-encoders expects Float32Array per channel
      const mp3Data = encoder.encode([leftChunk, rightChunk]);
      
      if (mp3Data.length > 0) {
        // IMPORTANT: Must copy the data as it's owned by the encoder
        const copy = new Uint8Array(mp3Data.length);
        copy.set(mp3Data);
        mp3Chunks.push(copy);
        totalMp3Size += copy.length;
      }
      
      // Log progress every ~10%
      const progress = Math.floor((i / samples) * 100);
      if (progress % 10 === 0 && i > 0) {
        console.log(`MP3 encoding progress: ${progress}%`);
      }
    }
    
    // Finalize encoding
    const finalData = encoder.finalize();
    if (finalData.length > 0) {
      const copy = new Uint8Array(finalData.length);
      copy.set(finalData);
      mp3Chunks.push(copy);
      totalMp3Size += copy.length;
    }
    
    // Combine all chunks into single buffer
    const mp3Buffer = new Uint8Array(totalMp3Size);
    let offset = 0;
    for (const chunk of mp3Chunks) {
      mp3Buffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    const endTime = performance.now();
    const encodingTime = ((endTime - startTime) / 1000).toFixed(2);
    const sizeMB = (totalMp3Size / (1024 * 1024)).toFixed(2);
    console.log(`MP3 encoding complete: ${sizeMB} MB in ${encodingTime}s`);
    
    return new Blob([mp3Buffer], { type: "audio/mpeg" });
  }

  // Resample AudioBuffer to target sample rate
  private async resampleAudioBuffer(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      Math.ceil(buffer.length * targetSampleRate / buffer.sampleRate),
      targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    return await offlineContext.startRendering();
  }

  // Clean up resources
  dispose() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}
```

## src/lib/conditionalSpecificityStep7.ts

```typescript
/**
 * Step 7 (conditional specificity) copy and options by canonical manifestation focus id
 * (`desireCategory` / `SUPPORT_CATEGORIES[].name`). Labels in UI elsewhere; here we only
 * branch on canonical ids. Keep in sync with user-facing category table.
 */

export type SpPersonChoice = "yes" | "no" | "complicated" | "prefer_not";

export type Step7ChoiceConfig = {
  headline: string;
  options: readonly string[];
};

const SP_HEADLINE = "Is there a specific person connected to this desire?";

const CHOICE: Record<string, Step7ChoiceConfig> = {
  Finances: {
    headline: "What kind of money shift are you calling in?",
    options: [
      "Consistent income",
      "Debt freedom",
      "More sales",
      "Luxury & ease",
      "Financial safety",
    ],
  },
  "Self-Love": {
    headline: "What do you want to feel when you see yourself?",
    options: [
      "Beautiful",
      "Desired",
      "Radiant",
      "Expensive",
      "Seen",
    ],
  },
  Career: {
    headline: "What career outcome are you calling in?",
    options: [
      "New job",
      "Promotion",
      "Higher pay",
      "Dream opportunity",
    ],
  },
  Business: {
    headline: "What business result do you want most?",
    options: [
      "More sales",
      "More customers/clients",
      "Launch success",
      "Audience growth",
    ],
  },
  Confidence: {
    headline: "Which self-concept focus fits best?",
    options: ["Confidence", "Visibility", "Self-trust", "Magnetism"],
  },
  Learning: {
    headline: "What education outcome are you calling in?",
    options: [
      "Better grades",
      "Exam success",
      "College acceptance",
      "Scholarship",
      "Focus studying",
    ],
  },
  Discipline: {
    headline: "What are you building consistency around?",
    options: [
      "Morning routine",
      "Fitness",
      "Studying",
      "Work",
      "Self-care",
    ],
  },
  Productivity: {
    headline: "Where do you want more focus?",
    options: [
      "Work projects",
      "Studying",
      "Creative work",
      "Content creation",
      "Daily routine",
    ],
  },
  Fitness: {
    headline: "What body or fitness shift are you calling in?",
    options: [
      "Strength",
      "Shape & tone",
      "Energy",
      "Confidence",
      "Consistent workouts",
    ],
  },
  Nutrition: {
    headline: "What kind of wellness shift do you want?",
    options: [
      "More energy",
      "Better rest",
      "Emotional ease",
      "Balance",
      "Softer routines",
    ],
  },
  Organization: {
    headline: "What part of your life are you resetting?",
    options: [
      "My space",
      "My schedule",
      "My routines",
      "My environment",
      "My priorities",
    ],
  },
};

export function isSpPersonStep7Category(canonical: string): boolean {
  const c = canonical.trim();
  return c === "Connections" || c === "sp_love";
}

export function getSpPersonHeadline(): string {
  return SP_HEADLINE;
}

export function getStep7ChoiceConfig(canonical: string): Step7ChoiceConfig | null {
  const c = canonical.trim();
  if (isSpPersonStep7Category(c)) return null;
  return CHOICE[c] ?? null;
}

/** Self-Concept (Confidence) no longer has a specificity sub-step — skip the conditional page entirely. */
export function needsSetupConditionalSpecificityPage(canonical: string): boolean {
  const c = canonical.trim();
  if (!c) return false;
  if (isSpPersonStep7Category(c)) return true;
  return getStep7ChoiceConfig(c) != null;
}

export function normalizeDesireCategoryForStep7(raw: string | undefined): string {
  return (raw ?? "").trim();
}
```

## src/lib/conditionalSpecificityStorage.ts

```typescript
/**
 * Canonical storage shape for Step 7 (conditional specificity) in setup draft + DB JSON.
 * Keeps keys stable for `onboarding_sessions.onboarding_answers` (e.g. `setup_path_v1.conditional_specificity`,
 * `setup_journey_v1.conditional_specificity`) and optional typed setup tables if deployed.
 */

export const CONDITIONAL_SPECIFICITY_SCHEMA_VERSION = 1 as const;

export type SpPersonChoice = "yes" | "no" | "complicated" | "prefer_not";

export type ConditionalBranch = "sp_person" | "step7_options";

export type ConditionalSpecificityV1 = {
  schema_version: typeof CONDITIONAL_SPECIFICITY_SCHEMA_VERSION;
  /** Canonical `SUPPORT_CATEGORIES[].name` */
  category: string;
  branch: ConditionalBranch;
  sp?: {
    hasSpecificPerson: SpPersonChoice;
    label: string | null;
  };
  step7?: {
    selection: string;
    customText: string | null;
  };
};

const SP_CHOICES = new Set<string>(["yes", "no", "complicated", "prefer_not"]);

function trimOrNull(s: string | undefined | null, max: number): string | null {
  if (s == null) return null;
  const t = String(s).trim();
  if (!t) return null;
  return t.slice(0, max);
}

/**
 * Builds a clean payload when saving from the conditional step (no spread from prior arbitrary JSON).
 */
export function buildConditionalSpecificityPayload(input: {
  category: string;
  isSpPersonBranch: boolean;
  sp?: { choice: string | null; name: string } | null;
  step7?: { selection: string | null; customText: string } | null;
}): ConditionalSpecificityV1 {
  const category = input.category.trim();
  if (input.isSpPersonBranch && input.sp?.choice && SP_CHOICES.has(input.sp.choice)) {
    return {
      schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
      category,
      branch: "sp_person",
      sp: {
        hasSpecificPerson: input.sp.choice as SpPersonChoice,
        label: trimOrNull(input.sp.name, 200),
      },
    };
  }
  const sel = input.step7?.selection?.trim() ?? "";
  if (sel.length > 0) {
    return {
      schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
      category,
      branch: "step7_options",
      step7: {
        selection: sel.slice(0, 500),
        customText: trimOrNull(input.step7?.customText ?? null, 2000),
      },
    };
  }
  return {
    schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
    category,
    branch: "step7_options",
  };
}

/**
 * Normalizes loose draft JSON into the V1 shape (drops unknown keys).
 */
export function normalizeConditionalSpecificityFromUnknown(
  raw: unknown,
  desireCategoryFallback: string | undefined,
): Record<string, unknown> {
  if (raw == null || typeof raw !== "object" || Array.isArray(raw)) {
    return {};
  }
  const rec = raw as Record<string, unknown>;
  const cat =
    (typeof rec.category === "string" && rec.category.trim()) ||
    (typeof desireCategoryFallback === "string" ? desireCategoryFallback.trim() : "");
  if (!cat) return {};

  const spRaw = rec.sp;
  if (spRaw && typeof spRaw === "object" && !Array.isArray(spRaw)) {
    const sp = spRaw as Record<string, unknown>;
    const hp = sp.hasSpecificPerson;
    if (typeof hp === "string" && SP_CHOICES.has(hp)) {
      const label =
        sp.label === null ? null : typeof sp.label === "string" ? trimOrNull(sp.label, 200) : null;
      const v1: ConditionalSpecificityV1 = {
        schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
        category: cat,
        branch: "sp_person",
        sp: { hasSpecificPerson: hp as SpPersonChoice, label },
      };
      return { ...v1 };
    }
  }

  const s7Raw = rec.step7;
  if (s7Raw && typeof s7Raw === "object" && !Array.isArray(s7Raw)) {
    const s7 = s7Raw as Record<string, unknown>;
    const selection = typeof s7.selection === "string" ? s7.selection.trim().slice(0, 500) : "";
    const custom =
      typeof s7.customText === "string"
        ? trimOrNull(s7.customText, 2000)
        : s7.customText === null
          ? null
          : null;
    if (selection.length > 0) {
      const v1: ConditionalSpecificityV1 = {
        schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
        category: cat,
        branch: "step7_options",
        step7: { selection, customText: custom },
      };
      return { ...v1 };
    }
  }

  return {
    schema_version: CONDITIONAL_SPECIFICITY_SCHEMA_VERSION,
    category: cat,
    branch: "step7_options",
  };
}
```

## src/lib/embodyPracticesCatalog.ts

```typescript
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  Briefcase,
  Droplet,
  Eye,
  Heart,
  Link2,
  Moon,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import { GiSoap } from "react-icons/gi";

/** Stored in `user_double_progress.completed_actions` as these slug keys. */
export type EmbodyPracticeKey =
  | "clean"
  | "drink-water"
  | "exercise"
  | "self-care"
  | "rest"
  | "have-fun"
  | "glam-up"
  | "connect"
  | "seen"
  | "work";

export type EmbodyPracticeDefinition = {
  key: EmbodyPracticeKey;
  /** Button / dashboard label (matches onboarding → app mapping). */
  shortLabel: string;
  /** Filename stem under `/videos/{characterFolder}/{videoFileName}.mp4` */
  videoFileName: string;
  confirmationQuestion: string;
  Icon: LucideIcon | typeof GiSoap;
  /** Hex for heatmap / legend swatches */
  heatmapHex: string;
  /** Rotated column header in Activity Tracking */
  trackingLines: readonly string[];
};

/**
 * Canonical display order — matches onboarding “Embody daily identity” cards (1→10).
 * Onboarding draft keys map via `ONBOARDING_EMBODY_KEY_TO_APP`.
 */
export const ALL_EMBODY_PRACTICE_KEYS: readonly EmbodyPracticeKey[] = [
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
] as const;

const KEY_SET = new Set<string>(ALL_EMBODY_PRACTICE_KEYS);

export const EMBODY_PRACTICES_BY_KEY: Record<EmbodyPracticeKey, EmbodyPracticeDefinition> = {
  rest: {
    key: "rest",
    shortLabel: "Rest",
    videoFileName: "Rest",
    confirmationQuestion: "Did you rest?",
    Icon: Moon,
    heatmapHex: "#F59E0B",
    trackingLines: ["Rest"],
  },
  "self-care": {
    key: "self-care",
    shortLabel: "Care",
    videoFileName: "Self-Care",
    confirmationQuestion: "Did you do some self-care?",
    Icon: Heart,
    heatmapHex: "#EF4444",
    trackingLines: ["Care"],
  },
  clean: {
    key: "clean",
    shortLabel: "Clean",
    videoFileName: "Clean",
    confirmationQuestion: "Did you clean a space today?",
    Icon: GiSoap,
    heatmapHex: "#A855F7",
    trackingLines: ["Clean"],
  },
  "drink-water": {
    key: "drink-water",
    shortLabel: "Water",
    videoFileName: "Drink Water",
    confirmationQuestion: "Did you drink water?",
    Icon: Droplet,
    heatmapHex: "#3B82F6",
    trackingLines: ["Water"],
  },
  "have-fun": {
    key: "have-fun",
    shortLabel: "Fun",
    videoFileName: "Fun",
    confirmationQuestion: "Did you do something fun today?",
    Icon: PartyPopper,
    heatmapHex: "#EC4899",
    trackingLines: ["Fun"],
  },
  exercise: {
    key: "exercise",
    shortLabel: "Move",
    videoFileName: "Exercise",
    confirmationQuestion: "Did you exercise?",
    Icon: Activity,
    heatmapHex: "#10B981",
    trackingLines: ["Move"],
  },
  "glam-up": {
    key: "glam-up",
    shortLabel: "Glam Up",
    videoFileName: "Glam Up",
    confirmationQuestion: "Did you glam up or celebrate your beauty today?",
    Icon: Sparkles,
    heatmapHex: "#D946EF",
    trackingLines: ["Glam Up"],
  },
  connect: {
    key: "connect",
    shortLabel: "Connect",
    videoFileName: "Connect",
    confirmationQuestion: "Did you connect with people, nature, or animals today?",
    Icon: Link2,
    heatmapHex: "#14B8A6",
    trackingLines: ["Connect"],
  },
  seen: {
    key: "seen",
    shortLabel: "Seen",
    videoFileName: "Seen",
    confirmationQuestion: "Did you practice being seen (online or in person) today?",
    Icon: Eye,
    heatmapHex: "#6366F1",
    trackingLines: ["Seen"],
  },
  work: {
    key: "work",
    shortLabel: "Work",
    videoFileName: "Work",
    confirmationQuestion: "Did you make career or academic progress today?",
    Icon: Briefcase,
    heatmapHex: "#78716C",
    trackingLines: ["Work"],
  },
};

/** Onboarding `EmbodyDailyIdentity` card keys → slug keys above (same order as onboarding OPTIONS). */
export const ONBOARDING_EMBODY_KEY_TO_APP: Record<string, EmbodyPracticeKey> = {
  embody_rest: "rest",
  embody_self_care: "self-care",
  embody_clean_environment: "clean",
  embody_nutrition: "drink-water",
  embody_have_fun: "have-fun",
  embody_move: "exercise",
  embody_glam_up: "glam-up",
  embody_connect: "connect",
  embody_seen: "seen",
  embody_work_or_study: "work",
};

export function getEmbodyPractice(key: EmbodyPracticeKey): EmbodyPracticeDefinition {
  return EMBODY_PRACTICES_BY_KEY[key];
}

export function isEmbodyPracticeKey(k: string): k is EmbodyPracticeKey {
  return KEY_SET.has(k);
}

/**
 * Map onboarding card keys (`embody_rest`, …) from setup draft → app slugs stored in
 * `user_preferences.embody_active_practices`. Returns null unless exactly five valid distinct slugs.
 */
export function mapOnboardingEmbodyKeysToAppSlugs(onboardingKeys: unknown): EmbodyPracticeKey[] | null {
  if (!Array.isArray(onboardingKeys) || onboardingKeys.length !== 5) return null;
  const mapped = (onboardingKeys as unknown[])
    .filter((x): x is string => typeof x === "string")
    .map((k) => ONBOARDING_EMBODY_KEY_TO_APP[k])
    .filter((k): k is EmbodyPracticeKey => typeof k === "string" && isEmbodyPracticeKey(k));
  const uniq: EmbodyPracticeKey[] = [];
  for (const k of mapped) {
    if (!uniq.includes(k)) uniq.push(k);
  }
  return uniq.length === 5 ? uniq : null;
}
```

## src/lib/isAndroidPaywallContext.ts

```typescript
import { Capacitor } from "@capacitor/core";

/**
 * True when we should show the Android paywall route (native Android app only).
 * Completely separate from the iOS paywall context — no shared logic.
 */
export function isAndroidPaywallContext(): boolean {
  return Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
}
```

## src/lib/onboardingFlow.ts

```typescript
/** Canonical onboarding order (1-based step index = position in these arrays). */
export const ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/name",
  "/onboarding/setup/desire-category",
  "/onboarding/setup/conditional-specificity",
  "/onboarding/setup/current-friction",
  "/onboarding/setup/affirmations",
  "/onboarding/setup/embody-daily",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/guide",
  "/onboarding/setup/notifications",
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/email",
] as const;

/** Setup steps only (after Welcome, before pricing): used for top progress bar. */
export const ONBOARDING_SETUP_PROGRESS_ROUTES = ONBOARDING_ROUTES.slice(1, -1);

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Your Name",
  "Manifesting",
  "Specifics",
  "Friction",
  "Affirmations",
  "Daily embody",
  "Your journey",
  "Guide",
  "Notifications",
  "Tools",
  "Building Path",
  "Your Path",
  "Account",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_ROUTES.length;
```

## src/lib/onboardingReadAffirmations.ts

```typescript
import type { SetupDraft } from "@/lib/setupDraft";
import { SUPPORT_CATEGORIES, getSupportCategoryLabel } from "@/lib/affirmations-data";

/**
 * Onboarding-only read-aloud copy, keyed by canonical `SUPPORT_CATEGORIES[].name`.
 * Display names in headings follow `SUPPORT_CATEGORIES` labels (Love / SP, Money, Focus, etc.).
 */
export const ONBOARDING_READ_AFFIRMATIONS: Record<string, readonly string[]> = {
  Connections: [
    "I am deeply loved and fully chosen.",
    "I am prioritized with care, devotion, and certainty.",
    "Love with me is natural, easy, and undeniable.",
    "I am adored in private and claimed in the open.",
    "Communication with me is warm, consistent, and intentional.",
    "I am the person they think of with tenderness and desire.",
    "My relationships are loyal, soft, and emotionally secure.",
    "I am treated like someone rare, precious, and unforgettable.",
    "The love I want is already aligned with who I am.",
    "I receive devotion as a natural part of my life.",
  ],
  Finances: [
    "I am wealthy in identity, action, and expectation.",
    "Money is natural in my life.",
    "I receive large payments with ease.",
    "My products, ideas, and presence create real demand.",
    "People happily pay for what I create.",
    "My income expands because my standard expands.",
    "I make powerful decisions with money.",
    "I hold wealth with confidence and intelligence.",
    "My numbers reflect the value I create.",
    "Abundance is normal for me.",
  ],
  Confidence: [
    "I am the version of me who already has it.",
    "I am chosen, respected, and remembered.",
    "My presence is magnetic and undeniable.",
    "I trust myself completely.",
    "I move like someone who knows their worth.",
    "My identity leads everything around me.",
    "People respond to my certainty.",
    "I carry standards that match my desire.",
    "I am powerful without needing to explain.",
    "My life reflects who I decide I am.",
  ],
  "Self-Love": [
    "I am beautiful, magnetic, and unforgettable.",
    "My face, body, and presence carry real power.",
    "I am admired naturally.",
    "I am desired with certainty.",
    "My glow is obvious in every room I enter.",
    "I carry myself like beauty belongs to me.",
    "My reflection matches the way I claim myself.",
    "I take care of myself like someone precious.",
    "My beauty has softness, force, and presence.",
    "I am radiant in a way people remember.",
  ],
  Career: [
    "I am intelligent, capable, and highly valued.",
    "The right rooms recognize my name.",
    "My work carries authority and real impact.",
    "I am selected for opportunities that match my level.",
    "I am paid well for my skill and judgment.",
    "Decision-makers see my value quickly.",
    "My career moves with favor and momentum.",
    "I speak about my work with confidence.",
    "My reputation grows in the places that matter.",
    "I receive the role, pay, and recognition I deserve.",
  ],
  Business: [
    "My products reach the right people.",
    "People understand the value quickly.",
    "My work creates desire, trust, and action.",
    "Sales are consistent in my business.",
    "My audience grows with momentum.",
    "My products are chosen, shared, and remembered.",
    "I trust what I built because it solves something real.",
    "Revenue reflects the strength of my vision.",
    "My business has gravity.",
    "I am the founder of something people want.",
  ],
  Learning: [
    "I am intelligent, prepared, and capable.",
    "I learn quickly and remember what matters.",
    "I study with focus and confidence.",
    "The right answers are familiar to me.",
    "My preparation shows in my results.",
    "I perform well under pressure.",
    "My name belongs on the acceptance list.",
    "I receive strong grades, strong outcomes, and strong opportunities.",
    "My mind is sharp when it matters most.",
    "I succeed because success matches who I am.",
  ],
  Discipline: [
    "I keep promises to myself.",
    "My actions match my future.",
    "Consistency is part of who I am.",
    "I follow through with power and self-respect.",
    "Small actions create visible results.",
    "My habits match my standards.",
    "I choose what supports the life I want.",
    "I trust myself because I prove myself daily.",
    "I finish what matters.",
    "I am disciplined because my desire matters.",
  ],
  Productivity: [
    "My attention belongs to what matters.",
    "I start quickly and continue with force.",
    "My mind is sharp, directed, and steady.",
    "I give my best energy to the right work.",
    "I complete important tasks with pace.",
    "Momentum is natural for me.",
    "I make decisions without spiraling.",
    "I use my time with power.",
    "My focus matches my ambition.",
    "I finish what I start.",
  ],
  Fitness: [
    "My body reflects strength, care, and consistency.",
    "I move with confidence and power.",
    "My choices support the body I claim.",
    "Strength looks beautiful on me.",
    "I carry myself with pride.",
    "My energy supports movement and discipline.",
    "My body responds to aligned action.",
    "Progress is visible in how I move and choose.",
    "I respect my body through what I do daily.",
    "I am strong, beautiful, and fully in command.",
  ],
  Nutrition: [
    "My life supports my energy.",
    "My routines nourish me.",
    "Rest, care, and renewal are part of my standard.",
    "My body and mind receive what supports them.",
    "Peace is normal in my daily life.",
    "I choose what makes me feel steady and whole.",
    "My days have ease, order, and softness.",
    "I care for myself with consistency.",
    "My energy is protected by my choices.",
    "I am restored, supported, and well.",
  ],
  Organization: [
    "My life reflects the person I choose to be.",
    "My space is clean, beautiful, and supportive.",
    "My routines match my standards.",
    "My choices create order.",
    "My environment supports my next level.",
    "My days are intentional and powerful.",
    "I make room for what belongs in my life.",
    "I take the next step with confidence.",
    "My home, schedule, and habits support my desire.",
    "My life matches the identity I claim.",
  ],
};

const CANONICAL = new Set(SUPPORT_CATEGORIES.map((c) => c.name));

/** Single manifest focus: primary `desireCategory`, else first valid `desireCategories` entry (legacy). */
export function resolveOnboardingManifestCategories(draft: SetupDraft): string[] {
  const primary = typeof draft.desireCategory === "string" ? draft.desireCategory.trim() : "";
  if (primary && CANONICAL.has(primary)) return [primary];

  if (Array.isArray(draft.desireCategories) && draft.desireCategories.length > 0) {
    for (const x of draft.desireCategories) {
      if (typeof x === "string" && CANONICAL.has(x)) return [x];
    }
  }
  return [];
}

/** Full read-aloud string for the onboarding affirmation step. */
export function buildOnboardingAffirmationReadText(categories: string[]): string {
  const withCopy = categories.filter((c) => (ONBOARDING_READ_AFFIRMATIONS[c]?.length ?? 0) > 0);
  if (withCopy.length === 0) return "";
  if (withCopy.length === 1) {
    const cat = withCopy[0]!;
    return ONBOARDING_READ_AFFIRMATIONS[cat]!.join("\n");
  }
  return withCopy
    .map((cat) => {
      const lines = ONBOARDING_READ_AFFIRMATIONS[cat]!;
      return `${getSupportCategoryLabel(cat)}\n\n${lines.join("\n")}`;
    })
    .join("\n\n");
}

/** ~Natural silent reading pace (characters per step for typewriter). */
export function msPerCharReadingPace(text: string, wordsPerMinute = 220): number {
  const t = text.trim();
  if (t.length === 0) return 32;
  const words = t.split(/\s+/).filter(Boolean).length || 1;
  const durationMs = (words / wordsPerMinute) * 60 * 1000;
  return Math.min(72, Math.max(22, Math.round(durationMs / t.length)));
}
```

## src/lib/onboardingSetupTheme.ts

```typescript
import { cn } from "@/lib/utils";

/** Matches Welcome primary CTA — shared across setup + account step. */
export const SETUP_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

export const SETUP_BACK_CTA_CLASS =
  "flex-1 h-14 rounded-xl border border-white/20 bg-white/10 font-sans text-base font-medium text-white hover:bg-white/15 active:bg-white/15 focus:bg-white/10 focus-visible:ring-0 focus-visible:ring-offset-0";

/** Native/mobile setup footer — same height + shape as SetupPage (h-14, not h-12). */
export const SETUP_NATIVE_CONTINUE_BTN_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "flex-1 h-14 rounded-xl text-base disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
);

export const SETUP_NATIVE_BACK_BTN_CLASS = cn(
  SETUP_BACK_CTA_CLASS,
  "outline-none transition-none select-none disabled:opacity-50 disabled:cursor-not-allowed",
);

export const SETUP_HEADING_TITLE_CLASS =
  "font-welcome-serif text-[28px] font-normal leading-[1.12] tracking-[-0.02em] text-white sm:text-[32px] sm:leading-[1.08]";

export const SETUP_HEADING_SUBTITLE_CLASS = "text-sm text-white/55 pl-0";

export const SETUP_LABEL_CLASS = "font-sans text-sm font-medium text-white/70";

export const SETUP_MUTED_TEXT_CLASS = "font-sans text-sm text-white/50";

export const SETUP_FIELD_CLASS =
  "h-12 rounded-2xl border-white/15 bg-white/95 text-zinc-900 placeholder:text-zinc-400 scroll-mt-3 focus-visible:ring-white/30";

export const SETUP_TEXTAREA_CLASS =
  "min-h-[140px] rounded-2xl border-white/15 bg-white/95 text-zinc-900 placeholder:text-zinc-400 scroll-mt-3 focus-visible:ring-white/30 focus-visible:ring-offset-0";

/** Milky card fill (path-ready panels) — blocks speckle bleed on setup choice tiles. */
export const SETUP_CHOICE_TILE_GLASS_FILL =
  "bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md";

function setupChoiceTileSurface(active: boolean): string {
  return cn(
    SETUP_CHOICE_TILE_GLASS_FILL,
    active ? "border-white/30" : "border-white/12",
  );
}

export function setupChoiceTileClass(active: boolean): string {
  return cn(
    "transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
    active && "ring-1 ring-white/20 border-white/25",
  );
}

/** Soft white glow on selected setup choice tiles (conditional, embody, notifications, etc.). */
export const SETUP_CHOICE_TILE_SELECTED_GLOW = "0 0 3px rgba(255,255,255,0.08)";

export function setupChoiceTileWithGlowClass(active: boolean): string {
  return cn(
    "w-full rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
  );
}

/** Label left, checkmark right — no leading icon (reminders, conditional Q). */
export function setupTextChoiceTileClass(active: boolean): string {
  return cn(
    "flex w-full items-center justify-between gap-3 rounded-2xl border px-4 py-4 text-left transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
  );
}

/** Icon + label choice rows (embody, tool preference). */
export function setupIconChoiceTileClass(active: boolean): string {
  return cn(
    "w-full rounded-2xl border px-4 py-4 text-left flex items-center justify-between gap-3 transition-[box-shadow,border-color]",
    setupChoiceTileSurface(active),
  );
}

export const SETUP_GLASS_PANEL_CLASS =
  "rounded-2xl border border-white/12 bg-gradient-to-b from-white/14 to-white/[0.06] backdrop-blur-md";

export const SETUP_PROGRESS_TRACK_CLASS = "h-2.5 rounded-full bg-white/15 overflow-hidden";

export const SETUP_PROGRESS_FILL_CLASS =
  "h-full rounded-full bg-white/90 transition-all duration-300 ease-out";

/** Platinum stars — matches Welcome award line. */
export const SETUP_TESTIMONIAL_STAR_CLASS = "h-3 w-3 shrink-0 fill-[#d4d4d8] text-[#e4e4e7]";

export const SETUP_DESKTOP_CHEVRON_CLASS =
  "fixed z-50 p-3 rounded-full bg-white/10 hover:bg-white/15 transition-all duration-200";
```

## src/lib/postPaywallProvisioning.ts

```typescript
import { supabase, SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "@/integrations/supabase/client";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import { getSupportCategoryLabel } from "@/lib/affirmations-data";

// Post-paywall provisioning intentionally does NOT generate a starter belief
// elimination. Earlier iterations called `ensureStarterBeliefEntry`, which hit
// `check-content-moderation` + `refactor-belief` edge functions (multiple LLM
// round-trips) on top of the affirmation and subliminal pipeline. That added
// 5–15s to the post-paywall wait, which is why the loading meter sat at 92%.
// Beliefs are created on demand from the Refactor tool; do not re-add a
// starter belief here.

/** Manifestation milestones categories (weekly_goals) — mirrors ActivityTracking. */
const SUPPORT_CATEGORY_NAMES = new Set([
  "Career",
  "Business",
  "Learning",
  "Finances",
  "Productivity",
  "Organization",
  "Confidence",
  "Self-Love",
  "Connections",
  "Fitness",
  "Nutrition",
  "Discipline",
]);

const DESIRE_SETUP_KEY_TO_CATEGORY: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

export const STARTER_AFFIRMATION_SET_NAME = "Your starter path";
export const STARTER_SUBLIMINAL_NAME = "Starter subliminal";
const LEGACY_STARTER_SUBLIMINAL_NAME = "Starter subliminal (TTS)";

function setupPathRowToDraft(row: Record<string, unknown>): SetupDraft {
  const spec = row.conditional_specificity;
  return {
    firstName: typeof row.first_name === "string" ? row.first_name : undefined,
    email: typeof row.email === "string" ? row.email : undefined,
    desireCategory: typeof row.desire_category === "string" ? row.desire_category : undefined,
    // "desire text" is no longer used; ignore stored values if present.
    currentFriction: typeof row.current_friction === "string" ? row.current_friction : undefined,
    desiredIdentity: typeof row.desired_identity === "string" ? row.desired_identity : undefined,
    toolPreferences: Array.isArray(row.tool_preferences) ? (row.tool_preferences as string[]) : undefined,
    conditionalSpecificity:
      spec && typeof spec === "object" && spec !== null ? (spec as Record<string, unknown>) : undefined,
  };
}

async function loadDraftForProvisioning(userId: string): Promise<SetupDraft> {
  const local = readSetupDraft();
  const { data } = await (supabase as any).from("user_setup_path").select("*").eq("user_id", userId).maybeSingle();
  const fromDb = data ? setupPathRowToDraft(data as Record<string, unknown>) : {};
  return { ...fromDb, ...local };
}

async function isPostPaywallProvisioned(userId: string): Promise<boolean> {
  const { data } = await (supabase as any)
    .from("user_setup_path")
    .select("post_paywall_provisioned_at")
    .eq("user_id", userId)
    .maybeSingle();
  return !!(data && data.post_paywall_provisioned_at);
}

async function markPostPaywallProvisioned(userId: string): Promise<void> {
  const iso = new Date().toISOString();
  const { data: existing } = await (supabase as any)
    .from("user_setup_path")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing?.user_id) {
    const { error } = await (supabase as any)
      .from("user_setup_path")
      .update({ post_paywall_provisioned_at: iso })
      .eq("user_id", userId);
    if (error && import.meta.env.DEV) {
      console.warn("[postPaywallProvisioning] post_paywall_provisioned_at update failed:", error);
    }
    return;
  }

  const { error: insErr } = await (supabase as any).from("user_setup_path").insert({
    user_id: userId,
    tool_preferences: [],
    conditional_specificity: {},
    post_paywall_provisioned_at: iso,
  });
  if (insErr && import.meta.env.DEV) {
    console.warn("[postPaywallProvisioning] user_setup_path insert for provision flag failed:", insErr);
  }
}

export function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string): string {
  const raw = (desireCategory || "").trim();
  if (SUPPORT_CATEGORY_NAMES.has(raw)) return raw;
  const mapped = DESIRE_SETUP_KEY_TO_CATEGORY[raw];
  const category = mapped && SUPPORT_CATEGORY_NAMES.has(mapped) ? mapped : "Confidence";
  return category;
}

function buildConditionalAnswer(draft: SetupDraft): string {
  const raw = draft.conditionalSpecificity;
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return "";
  const rec = raw as Record<string, unknown>;

  const branch = typeof rec.branch === "string" ? rec.branch : "";

  if (branch === "sp_person") {
    const spRaw = rec.sp;
    if (!spRaw || typeof spRaw !== "object" || Array.isArray(spRaw)) return "";
    const sp = spRaw as Record<string, unknown>;
    const choice = typeof sp.hasSpecificPerson === "string" ? sp.hasSpecificPerson : "";
    const label = typeof sp.label === "string" ? sp.label.trim() : "";
    const choiceLabel =
      choice === "yes"
        ? "Yes"
        : choice === "no"
          ? "No"
          : choice === "complicated"
            ? "It's complicated"
            : choice === "prefer_not"
              ? "Prefer not to say"
              : "";
    if (!choiceLabel) return "";
    return label ? `${choiceLabel} — ${label}` : choiceLabel;
  }

  if (branch === "step7_options") {
    const s7Raw = rec.step7;
    if (!s7Raw || typeof s7Raw !== "object" || Array.isArray(s7Raw)) return "";
    const s7 = s7Raw as Record<string, unknown>;
    const sel = typeof s7.selection === "string" ? s7.selection.trim() : "";
    const custom = typeof s7.customText === "string" ? s7.customText.trim() : "";
    if (!sel) return "";
    if (sel === "Custom" && custom) return custom;
    return sel;
  }

  return "";
}

function buildAffirmationTopic(draft: SetupDraft): string {
  const category = mapDesireSetupKeyToWeeklyCategory(draft.desireCategory);
  const displayCategory = (() => {
    const label = getSupportCategoryLabel(category);
    // UI-only rename: "Beauty / Glow Up" should be "Glow Up" as a topic seed.
    return label === "Beauty / Glow Up" ? "Glow Up" : label;
  })();
  // Special exception: for Love/SP, use only the category (no conditional text).
  if (category === "Connections" || category === "sp_love") {
    return displayCategory.length > 50 ? displayCategory.slice(0, 50) : displayCategory;
  }
  const answer = buildConditionalAnswer(draft);
  const combined = `${displayCategory} — ${answer}`.trim();
  return combined.length > 50 ? combined.slice(0, 50) : combined;
}

function clipAffirmationsForTts(affirmations: string[], maxChars: number): string[] {
  const joined = affirmations.map((a) => a.trim()).filter(Boolean);
  if (joined.length === 0) return ["I am moving forward with calm confidence."];
  let total = joined.join(" ").length;
  if (total <= maxChars) return joined;
  const out: string[] = [];
  let used = 0;
  for (const line of joined) {
    const next = used + line.length + (out.length > 0 ? 1 : 0);
    if (next > maxChars) {
      const room = maxChars - used - (out.length > 0 ? 1 : 0);
      if (room > 12) out.push(line.slice(0, room).trim());
      break;
    }
    out.push(line);
    used = next;
  }
  return out.length ? out : [joined[0].slice(0, maxChars)];
}

async function findStarterAffirmationSet(userId: string): Promise<{ id: string; affirmations: string[] } | null> {
  const { data, error } = await (supabase as any)
    .from("user_affirmation_sets")
    .select("id, affirmations")
    .eq("user_id", userId)
    .eq("name", STARTER_AFFIRMATION_SET_NAME)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data?.id) return null;
  const affirmations = Array.isArray(data.affirmations) ? (data.affirmations as string[]) : [];
  return { id: data.id, affirmations };
}

async function createStarterAffirmationSet(
  userId: string,
  draft: SetupDraft,
  category: string
): Promise<{ id: string; affirmations: string[] } | null> {
  const topic = buildAffirmationTopic(draft);
  const { data, error } = await supabase.functions.invoke("generate-affirmations", {
    body: { topic, category },
  });

  if (data?.error || data?.blocked) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] generate-affirmations body error:", data);
    return null;
  }
  if (error) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] generate-affirmations invoke error:", error);
    return null;
  }
  const affirmations = Array.isArray(data?.affirmations) ? (data.affirmations as string[]) : [];
  if (affirmations.length === 0) return null;

  const setId = crypto.randomUUID();
  const { error: insertError } = await (supabase as any).from("user_affirmation_sets").insert({
    id: setId,
    user_id: userId,
    name: STARTER_AFFIRMATION_SET_NAME,
    affirmations,
    images: [],
    category: SUPPORT_CATEGORY_NAMES.has(category) ? category : "Confidence",
  });

  if (insertError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] affirmation set insert failed:", insertError);
    return null;
  }

  await (supabase as any).from("ai_affirmation_generation_log").insert({
    user_id: userId,
    set_id: setId,
    generated_at: new Date().toISOString(),
  });

  return { id: setId, affirmations };
}

async function fetchVocalBaseMp3Blob(accessToken: string, affirmations: string[]): Promise<Blob | null> {
  const clipped = clipAffirmationsForTts(affirmations, 480);
  const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-affirmation-audio`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: SUPABASE_PUBLISHABLE_KEY,
    },
    body: JSON.stringify({ affirmations: clipped, voice: "nova" }),
  });
  const raw = await response.text();
  let parsed: any = null;
  try {
    parsed = raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
  if (!response.ok || parsed?.error || !parsed?.audioContent) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] TTS failed", response.status, parsed?.error);
    return null;
  }
  try {
    const binaryString = atob(parsed.audioContent);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
    return new Blob([bytes], { type: "audio/mpeg" });
  } catch {
    return null;
  }
}

async function ensureStarterSubliminalTrack(userId: string, accessToken: string, affirmations: string[]): Promise<void> {
  const { data: existing } = await (supabase as any)
    .from("subliminal_tracks")
    .select("id")
    .eq("user_id", userId)
    .in("name", [STARTER_SUBLIMINAL_NAME, LEGACY_STARTER_SUBLIMINAL_NAME])
    .limit(1)
    .maybeSingle();

  if (existing?.id) return;

  // Use the same flow as the app's Subliminal Maker:
  // 1) Generate a "vocal base" affirmation MP3 via `generate-affirmation-audio`
  // 2) Run the client-side `AudioProcessor.generateSubliminalTrack` mixdown so the stored specs match the real audio.
  const vocalBaseBlob = await fetchVocalBaseMp3Blob(accessToken, affirmations);
  if (!vocalBaseBlob) return;

  const { AudioProcessor } = await import("@/lib/audioProcessor");
  const processor = new AudioProcessor();
  let subliminalBlob: Blob;
  try {
    subliminalBlob = await processor.generateSubliminalTrack({
      affirmationBlob: vocalBaseBlob,
      binauralType: "theta",
      binauralVolume: 0.07,
      backgroundSound: "Rain v2.WAV",
      affirmationVolume: 0.07,
      backgroundVolume: 1,
      layers: 1,
      duration: 5,
    });
  } finally {
    processor.dispose();
  }

  const fileName = `${userId}/${Date.now()}_${STARTER_SUBLIMINAL_NAME.replace(/[^a-z0-9]/gi, "_")}.mp3`;
  const { error: uploadError } = await supabase.storage.from("subliminal-tracks").upload(fileName, subliminalBlob, {
    contentType: "audio/mpeg",
    upsert: false,
  });

  if (uploadError) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal upload failed:", uploadError);
    return;
  }

  const { data: publicData } = supabase.storage.from("subliminal-tracks").getPublicUrl(fileName);
  const publicUrl = publicData?.publicUrl;

  const { data: dbTrack, error: dbError } = await (supabase as any)
    .from("subliminal_tracks")
    .insert({
      user_id: userId,
      name: STARTER_SUBLIMINAL_NAME,
      binaural_beat: "theta",
      binaural_volume: 0.07,
      background_sound: "Rain v2.WAV",
      affirmation_volume: 0.07,
      background_volume: 1,
      layers: 1,
      length: 5,
      audio_url: publicUrl,
    })
    .select("id")
    .single();

  if (dbError || !dbTrack?.id) {
    if (import.meta.env.DEV) console.warn("[postPaywallProvisioning] subliminal db insert failed:", dbError);
    return;
  }

  await (supabase as any).from("subliminal_generation_log").insert({
    user_id: userId,
    track_id: dbTrack.id,
    generated_at: new Date().toISOString(),
  });
}

export type ProvisionPostPaywallResult = { ran: boolean; skipped: boolean; reason?: string };

/**
 * One idempotent pass after a successful subscription: creates AI affirmations
 * and a TTS-backed starter subliminal track from the setup draft. Safe to call
 * multiple times. Belief eliminations are intentionally NOT generated here —
 * those are user-driven from the Refactor tool. See the module-level note.
 */
export async function provisionPostPaywallIfNeeded(options?: { quiet?: boolean }): Promise<ProvisionPostPaywallResult> {
  const quiet = options?.quiet ?? true;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id || !session.access_token) {
    return { ran: false, skipped: true, reason: "no_session" };
  }

  const userId = session.user.id;
  const accessToken = session.access_token;

  const { data: planRow } = await (supabase as any)
    .from("user_plans")
    .select("starter_provisioned")
    .eq("user_id", userId)
    .maybeSingle();

  if (planRow?.starter_provisioned) {
    return { ran: false, skipped: true, reason: "already_provisioned" };
  }

  const draft = await loadDraftForProvisioning(userId);
  const category = mapDesireSetupKeyToWeeklyCategory(draft.desireCategory);

  try {
    let set = await findStarterAffirmationSet(userId);
    if (!set) {
      set = await createStarterAffirmationSet(userId, draft, category);
    }

    if (!set) {
      return { ran: false, skipped: true, reason: "starter_affirmation_set_failed" };
    }

    if (set.affirmations.length > 0) {
      await ensureStarterSubliminalTrack(userId, accessToken, set.affirmations);
    }

    await markPostPaywallProvisioned(userId);

    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);

    // Persist embody picks from setup draft before clearing localStorage (otherwise hook falls back to defaults).
    const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
    if (embodySlugs) {
      const { error: embodyPrefErr } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, embody_active_practices: embodySlugs }, { onConflict: "user_id" });
      if (embodyPrefErr && import.meta.env.DEV) {
        console.warn("[postPaywallProvisioning] embody_active_practices upsert failed:", embodyPrefErr.message);
      }
    }

    clearSetupDraft();

    if (!quiet) {
      // Callers may show UI; this module stays toast-free.
    }

    return { ran: true, skipped: false };
  } catch (e) {
    if (import.meta.env.DEV) console.error("[postPaywallProvisioning] unexpected:", e);
    return { ran: false, skipped: true, reason: "error" };
  }
}
```

## src/lib/runAndroidPaywallFlow.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import {
  presentRevenueCatPaywall,
  getLastPaywallError,
  setLastPaywallErrorMessage,
} from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { armAndroidPostPurchaseEntitlementLatch } from "@/lib/androidPostPurchaseEntitlementGate";

export type AndroidPaywallFlowOutcome =
  | "success"
  | "present_failed"
  | "error"
  | "skipped";

let presentationInFlight = false;

export function resetAndroidPaywallPresentationFlightLock() {
  presentationInFlight = false;
}

const PAYWALL_PRESENT_TIMEOUT_MS = 120_000;

/**
 * Presents RevenueCat paywall on Android. After a purchase/restored result, routes to
 * `/onboarding/android-post-paywall` where entitlement sync + provisioning runs.
 *
 * Android-only. Does not touch iOS code or paths.
 */
export async function runAndroidPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
  bypassPresentationLock?: boolean;
}): Promise<AndroidPaywallFlowOutcome> {
  const canNative =
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  if (!canNative) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:skipped",
      message: "Flow skipped — not native Android",
      data: {
        platform: Capacitor.getPlatform(),
        isNativePlatform: Capacitor.isNativePlatform(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    return "skipped";
  }

  const useLock = !options.bypassPresentationLock;

  if (useLock && presentationInFlight) {
    setLastPaywallErrorMessage(
      "A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen."
    );
    toast.error(
      "Subscription is already opening — wait a few seconds, then try again.",
      { duration: 8000 }
    );
    return "present_failed";
  }
  if (useLock) {
    presentationInFlight = true;
  }

  try {
    let timeoutId: ReturnType<typeof window.setTimeout> | undefined;
    const timeoutPromise = new Promise<boolean>((resolve) => {
      timeoutId = window.setTimeout(() => {
        setLastPaywallErrorMessage(
          "Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again."
        );
        resolve(false);
      }, PAYWALL_PRESENT_TIMEOUT_MS);
    });

    const presentPromise = presentRevenueCatPaywall(options.userId).finally(
      () => {
        if (timeoutId !== undefined) window.clearTimeout(timeoutId);
      }
    );

    const result = await Promise.race([presentPromise, timeoutPromise]);

    if (!result) {
      toast.error(
        getLastPaywallError() || "Subscription not completed.",
        { duration: 8000 }
      );
      return "present_failed";
    }

    armAndroidPostPurchaseEntitlementLatch(options.userId);
    options.navigate("/onboarding/android-post-paywall", { replace: true });
    return "success";
  } catch (err) {
    debugLog({
      location: "runAndroidPaywallFlow.ts:catch",
      message: "Exception during Android paywall flow",
      data: {
        err: String((err as Error)?.message ?? err),
        stack: (err as Error)?.stack?.slice(0, 800) ?? null,
        lastPaywallError: getLastPaywallError(),
      },
      hypothesisId: "ANDROID-PAY",
    });
    toast.error("Could not open subscription options.", { duration: 8000 });
    return "error";
  } finally {
    if (useLock) {
      presentationInFlight = false;
    }
  }
}
```

## src/lib/setupDraft.ts

```typescript
import type { Appearance } from "@/contexts/ThemeContext";

export type SetupDraft = {
  firstName?: string;
  email?: string;
  /** Email marketing (optional) — same meaning as legacy EmailCollection `email_consent` on onboarding_sessions. */
  emailMarketingConsent?: boolean;
  /** App / push notifications (optional) — maps to onboarding_sessions.app_notifications_consent. */
  appNotificationsConsent?: boolean;
  desireCategory?: string;
  /** Manifest focus (names matching `SUPPORT_CATEGORIES`). Stored as a one-element array when set; primary field is `desireCategory`. */
  desireCategories?: string[];
  currentFriction?: string;
  desiredIdentity?: string;
  conditionalSpecificity?: Record<string, unknown>;
  /** `river` | `sage` | `rose` | `oliver` — matches `onboarding_sessions.character_id`. */
  guideCharacterId?: string;
  /** App shell appearance (`light` | `dark`). */
  appearance?: Appearance;
  toolPreferences?: string[];
  /** Keys from the "embody your new identity each day" setup step (exactly five when completed). Not synced to user_setup_path until a column exists. */
  embodyDailyPractices?: string[];
};

const KEY = "sv_setup_draft_v1";

export function readSetupDraft(): SetupDraft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as SetupDraft) : {};
  } catch {
    return {};
  }
}

export function writeSetupDraft(patch: Partial<SetupDraft>) {
  const prev = readSetupDraft();
  const next: SetupDraft = { ...prev, ...patch };
  localStorage.setItem(KEY, JSON.stringify(next));
  void import("./setupDraftBackendSync").then(({ syncSetupJourneyToBackend }) => syncSetupJourneyToBackend(next));
  return next;
}

export function clearSetupDraft() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
```

## src/lib/setupDraftBackendSync.ts

```typescript
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { SetupDraft } from "@/lib/setupDraft";
import { normalizeConditionalSpecificityFromUnknown } from "@/lib/conditionalSpecificityStorage";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";

type UserSetupPathInsert = Database["public"]["Tables"]["user_setup_path"]["Insert"];

const SHELL_APPEARANCES = new Set(["light", "dark"]);
const GUIDE_IDS = new Set(["river", "sage", "rose", "oliver"]);

/** Must match `useOnboardingSession` / `useLocalStorage("onboarding_session")`. */
const ONBOARDING_SESSION_STORAGE_KEY = "onboarding_session";

type StoredCreds = { sessionId: string; resumeToken: string; createdAt?: number };

function readStoredCreds(): StoredCreds | null {
  try {
    const raw = localStorage.getItem(ONBOARDING_SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<StoredCreds>;
    if (parsed?.sessionId && parsed?.resumeToken) {
      return {
        sessionId: String(parsed.sessionId),
        resumeToken: String(parsed.resumeToken),
        createdAt: typeof parsed.createdAt === "number" ? parsed.createdAt : undefined,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

function writeStoredCreds(creds: StoredCreds) {
  try {
    localStorage.setItem(ONBOARDING_SESSION_STORAGE_KEY, JSON.stringify(creds));
  } catch {
    /* ignore */
  }
}

async function ensureOnboardingSessionCreds(): Promise<StoredCreds> {
  const existing = readStoredCreds();
  if (existing) return existing;

  const { data, error } = await supabase.functions.invoke("create-onboarding-session", { body: {} });
  if (error) throw error;
  if (!data?.sessionId || !data?.resumeToken) {
    throw new Error("Invalid onboarding session response");
  }
  const next: StoredCreds = {
    sessionId: data.sessionId as string,
    resumeToken: data.resumeToken as string,
    createdAt: Date.now(),
  };
  writeStoredCreds(next);
  return next;
}

/** Maps SetupDraft → normalized columns (Edge + DB). */
export function draftToSetupPathPayload(draft: SetupDraft): Record<string, unknown> {
  const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
  return {
    first_name: typeof draft.firstName === "string" ? draft.firstName.trim().slice(0, 120) || null : null,
    email: typeof draft.email === "string" ? draft.email.trim().toLowerCase().slice(0, 320) || null : null,
    desire_category: typeof draft.desireCategory === "string" ? draft.desireCategory.trim().slice(0, 64) || null : null,
    // Do not persist a separate "desire text" anymore; the setup flow uses friction/identity + signals instead.
    desire_text: null,
    why_it_matters: null,
    current_friction: typeof draft.currentFriction === "string" ? draft.currentFriction : null,
    desired_identity: typeof draft.desiredIdentity === "string" ? draft.desiredIdentity.trim().slice(0, 200) || null : null,
    tool_preferences: Array.isArray(draft.toolPreferences)
      ? draft.toolPreferences.filter((t): t is string => typeof t === "string")
      : [],
    conditional_specificity: normalizeConditionalSpecificityFromUnknown(
      draft.conditionalSpecificity,
      draft.desireCategory,
    ),
    shell_appearance:
      typeof draft.appearance === "string" && SHELL_APPEARANCES.has(draft.appearance) ? draft.appearance : null,
    guide_character_id:
      typeof draft.guideCharacterId === "string" && GUIDE_IDS.has(draft.guideCharacterId)
        ? draft.guideCharacterId
        : null,
    embody_active_practices: embodySlugs ?? null,
  };
}

/**
 * Persists setup path to:
 * - `onboarding_sessions.onboarding_answers` (via Edge `update-onboarding-session`, pre-auth) as
 *   `setup_path_v1` plus merged `setup_journey_v1`. If a typed `onboarding_session_setup` table exists
 *   in a deployment, the edge may also upsert there first; otherwise it uses that JSON path only.
 * - `user_setup_path` when logged in — typed columns + RLS.
 */
export async function syncSetupJourneyToBackend(draft: SetupDraft): Promise<void> {
  const setup_path = draftToSetupPathPayload(draft);

  try {
    const creds = await ensureOnboardingSessionCreds();
    const patch: Record<string, unknown> = { setup_path };
    if (setup_path.first_name) patch.first_name = setup_path.first_name;
    if (setup_path.email) {
      patch.email = setup_path.email;
      // Same handle as email until a dedicated username step exists (not the legacy sign-up form).
      patch.username = setup_path.email;
    }
    if (typeof draft.emailMarketingConsent === "boolean") {
      patch.email_consent = draft.emailMarketingConsent;
    }
    if (typeof draft.appNotificationsConsent === "boolean") {
      patch.app_notifications_consent = draft.appNotificationsConsent;
    }
    if (typeof draft.guideCharacterId === "string" && GUIDE_IDS.has(draft.guideCharacterId)) {
      patch.character_id = draft.guideCharacterId;
    }

    const { error } = await supabase.functions.invoke("update-onboarding-session", {
      body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken, patch },
    });
    if (error && import.meta.env.DEV) {
      console.warn("[setupDraftBackendSync] update-onboarding-session failed:", error.message);
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[setupDraftBackendSync] onboarding session sync skipped:", e);
    }
  }

  try {
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (userErr || !userId) return;

    const embodySlugs = mapOnboardingEmbodyKeysToAppSlugs(draft.embodyDailyPractices);
    // Omit embody on user_setup_path client upsert: column may not exist until migration; session
    // JSON + user_preferences carry embody (see draftToSetupPathPayload + upsert below).
    const row: UserSetupPathInsert = {
      user_id: userId,
      first_name: setup_path.first_name as string | null,
      email: setup_path.email as string | null,
      desire_category: setup_path.desire_category as string | null,
      desire_text: null,
      why_it_matters: null,
      current_friction: setup_path.current_friction as string | null,
      desired_identity: setup_path.desired_identity as string | null,
      tool_preferences: (setup_path.tool_preferences as string[]) ?? [],
      conditional_specificity: setup_path.conditional_specificity as UserSetupPathInsert["conditional_specificity"],
      shell_appearance: setup_path.shell_appearance as string | null,
      guide_character_id: setup_path.guide_character_id as string | null,
    };

    const { error: upErr } = await supabase.from("user_setup_path").upsert(row, {
      onConflict: "user_id",
    });
    if (upErr && import.meta.env.DEV) {
      console.warn("[setupDraftBackendSync] user_setup_path upsert failed:", upErr.message);
    }

    if (embodySlugs) {
      const { error: embodyErr } = await supabase
        .from("user_preferences")
        .upsert({ user_id: userId, embody_active_practices: embodySlugs }, { onConflict: "user_id" });
      if (embodyErr && import.meta.env.DEV) {
        console.warn("[setupDraftBackendSync] embody_active_practices upsert failed:", embodyErr.message);
      }
    }
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn("[setupDraftBackendSync] user_setup_path sync skipped:", e);
    }
  }
}
```

## src/lib/utils.ts

```typescript
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

## src/pages/Dashboard.tsx

```tsx
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings, Moon, Sun, Check, Zap, CircleAlert, ChevronRight, Wrench } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
// import { usePageVisitTracker, useActivityTracker } from "@/hooks/useActivityTracker"; // Disabled
// import { useGamification } from "@/hooks/useGamification"; // Disabled
import { useAuth } from "@/contexts/AuthContext";
import { useEmbodyActivePractices } from "@/hooks/useEmbodyActivePractices";
import confetti from "canvas-confetti";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DesktopToolSidebar } from "@/components/DesktopToolSidebar";
import { MobilePWAMenu } from "@/components/MobilePWAMenu";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Capacitor } from "@capacitor/core";
import { dashboardFeatures } from "@/lib/featuresData";
import { useTheme } from "@/contexts/ThemeContext";
import {
  manifestationMeterBarStyle,
  manifestationChargeCheckpointsFromSignalRows,
  manifestationPowerCalendarDateToday,
  MANIFESTATION_POWER_METER_REFRESH_EVENT,
} from "@/lib/manifestationPowerSignals";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { DashboardSkyBackground } from "@/components/dashboard/DashboardSkyBackground";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { DashboardToolIcon } from "@/components/dashboard/DashboardToolIcon";
import {
  dashboardHomeGreetingSubtitleClass,
  dashboardHomeGreetingTitleClass,
  dashboardHomeInspiredDividerClass,
  dashboardHomeInspiredFooterClass,
  dashboardHomeInspiredLabelClass,
  dashboardHomeManifestationMutedClass,
  dashboardHomeManifestationTitleClass,
  dashboardHomeSectionLabelClass,
  dashboardHomeToolChevronClass,
  dashboardHomeToolDescriptionClass,
  dashboardHomeToolTitleClass,
  dashboardHomeUsesCosmicShell,
  dashboardSectionAccentIconClass,
  dashboardMobileManifestationCardClass,
  dashboardMobileToolCardClass,
  dashboardMobileToolCardInnerClass,
  dashboardMobileToolCardStyle,
  dashboardMobileToolGridClass,
  dashboardMobileManifestationDailyLabelClass,
  dashboardMobileManifestationDividerClass,
  dashboardMobileManifestationFooterClass,
  dashboardMobileManifestationHeadingClass,
  dashboardMobileManifestationMeterTrackClass,
  dashboardMobileToolCardHoverClass,
  dashboardMobileToolTitleClass,
  dailyPracticeCellClass,
  dailyPracticeIconClass,
  dailyPracticeLabelClass,
  dashboardHeaderAvatarFallbackClass,
  dashboardHeaderAvatarShellClass,
  dashboardHeaderAvatarTriggerClass,
  dashboardHeaderIconButtonClass,
  dashboardHeaderPillButtonClass,
  getDashboardMobileSafeAreaInlet,
  getDashboardMobileCardSurface,
  manifestationChargeZapIconClass,
  manifestationMeterBarClass,
  manifestationStatusBadgeClass,
  webDashboardManifestationCardClass,
  webDashboardToolCardClass,
} from "@/lib/dashboardThemeStyles";

function timeOfDayGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function manifestationChargePercent(checkpoints: number): number {
  return Math.min(100, Math.round((Math.min(checkpoints, 3) / 3) * 100));
}

const Dashboard = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isBrowserDesktop = !Capacitor.isNativePlatform() && !isMobile;
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const isMobileDashboard = !isBrowserDesktop;
  const mobileCardSurface = getDashboardMobileCardSurface(theme, isMobileDashboard);
  const { activePractices } = useEmbodyActivePractices();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    const saved = localStorage.getItem('sidebar-collapsed');
    return saved === 'true';
  });
  
  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);

  // Native: tell the splash gate after first meaningful paint (avoids white flash under splash).
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  
  // Character grass overlay: native app only (not mobile web or desktop browser).
  const shouldShowCharacterImage = Capacitor.isNativePlatform();
  
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  // Initialize firstName from sessionStorage to prevent flash on navigation
  const [firstName, setFirstName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [selectedCharacter, setSelectedCharacter] = useState<string | null>(null);
  const [dashboardAppPowerCheckpoints, setDashboardAppPowerCheckpoints] = useState(0);
  const [dailyPracticeActions, setDailyPracticeActions] = useState<Set<string>>(() => new Set());

  const dailyPracticeCount = dailyPracticeActions.size;
  const dailyPracticeStatus =
    dailyPracticeCount >= 2 && dashboardAppPowerCheckpoints >= 2
      ? "Energetic Match"
      : dailyPracticeCount >= 1 && dashboardAppPowerCheckpoints >= 1
        ? "Aligned"
        : "Needs Alignment";

  // Temporarily disabled for performance - will re-enable with proper logic later
  // const { trackActivity } = useActivityTracker();
  // const { stats, weeklyGoal, trackToolUsage } = useGamification();
  const trackActivity = async () => {}; // Stub
  const stats = null; // Stub
  const weeklyGoal = 7; // Default value
  const trackToolUsage = () => {}; // Stub
  const hasShownConfetti = useRef(false);

  // usePageVisitTracker('dashboard'); // Disabled

  // Set a clean tab title when on the dashboard
  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Palette Plotting";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  // Note: post-paywall provisioning is handled by the paywall/checkout success flows.

  const refreshManifestationChargeMeter = useCallback(async () => {
    if (!user?.id) return;
    const todayLocal = manifestationPowerCalendarDateToday();
    const powerSignalsRes = await supabase
      .from("manifestation_power_daily_signals")
      .select("signal_kind")
      .eq("user_id", user.id)
      .eq("signal_date", todayLocal);
    const rows = powerSignalsRes.data ?? [];
    setDashboardAppPowerCheckpoints(manifestationChargeCheckpointsFromSignalRows(rows));
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;

    void refreshManifestationChargeMeter();
    const onVis = () => {
      if (document.visibilityState === "visible") void refreshManifestationChargeMeter();
    };
    const onSignal = () => void refreshManifestationChargeMeter();

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener(MANIFESTATION_POWER_METER_REFRESH_EVENT, onSignal);
    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener(MANIFESTATION_POWER_METER_REFRESH_EVENT, onSignal);
    };
  }, [user?.id, refreshManifestationChargeMeter]);

  useEffect(() => {
    if (!user?.id) return;

    const loadDailyPractice = async () => {
      const now = new Date();
      const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const { data } = await supabase
        .from("user_double_progress")
        .select("completed_actions")
        .eq("user_id", user.id)
        .eq("progress_date", today)
        .maybeSingle();

      const actions = Array.isArray(data?.completed_actions) ? (data!.completed_actions as string[]) : [];
      setDailyPracticeActions(new Set(actions));
    };

    void loadDailyPractice();
    const onVis = () => {
      if (document.visibilityState === "visible") void loadDailyPractice();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [user?.id]);

  // Load firstName from sessionStorage when user is available
  useEffect(() => {
    if (user?.id && typeof window !== 'undefined') {
      const cachedFirstName = sessionStorage.getItem(`dashboard_firstName_${user.id}`);
      if (cachedFirstName) {
        setFirstName(cachedFirstName);
      }
    }
  }, [user?.id]);

  /**
   * Profile / preferences fetch — key on `user?.id` (not the whole `user` object).
   * Supabase fires `onAuthStateChange` on every token refresh, which gives a NEW
   * `user` object reference for the SAME user id. Without this guard the dashboard
   * re-queries profile + preferences ~every hour (and on every tab focus) which is
   * exactly what feels like "the dashboard refreshing every time."
   */
  const lastFetchedUserIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!user?.id) return;
    if (lastFetchedUserIdRef.current === user.id) return;
    lastFetchedUserIdRef.current = user.id;

    let cancelled = false;
    const fetchUserData = async () => {
      setUserEmail(user.email || "");

      const profileQuery = supabase
        .from('profiles')
        .select('first_name, username, avatar_url')
        .eq('id', user.id)
        .maybeSingle();

      const prefsQuery = supabase
        .from('user_preferences')
        .select('selected_character')
        .eq('user_id', user.id)
        .maybeSingle();

      const [{ data: profileData }, { data: preferences }] = await Promise.all([profileQuery, prefsQuery]);
      if (cancelled) return;

      if (profileData) {
        const name = profileData.first_name || "";
        setFirstName(name);
        setUsername(profileData.username || "");
        setAvatarUrl(profileData.avatar_url || "");
        if (typeof window !== 'undefined' && user.id) {
          sessionStorage.setItem(`dashboard_firstName_${user.id}`, name);
        }
      }

      if (preferences?.selected_character) {
        setSelectedCharacter(preferences.selected_character);
      }
    };

    void fetchUserData();
    return () => {
      cancelled = true;
    };
  }, [user?.id, user?.email]);

  const handleLogout = async () => {
    // await trackActivity({ action: 'user_logout' }); // Disabled
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Error signing out");
    } else {
      navigate("/");
    }
  };
  
  const handleToolClick = (path: string) => {
    navigate(path);
  };


  // Confetti celebration when weekly goal is reached
  useEffect(() => {
    if (stats?.tools_used_this_week?.length === weeklyGoal && !hasShownConfetti.current) {
      hasShownConfetti.current = true;
      
      const duration = 3000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6']
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#8B5CF6', '#EC4899', '#3B82F6']
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [stats?.tools_used_this_week?.length, weeklyGoal]);

  if (isBrowserDesktop) {
    const chargePct = manifestationChargePercent(dashboardAppPowerCheckpoints);
    const displayName = firstName.trim() || "there";
    const sidebarWidth = sidebarCollapsed ? 64 : 256;
    const cosmicHome = dashboardHomeUsesCosmicShell(theme);

    return (
      <div
        className={cn(
          "relative min-h-screen overflow-x-hidden font-sans antialiased",
          cosmicHome ? "text-white" : "bg-background text-foreground",
        )}
        style={cosmicHome ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
      >
        {cosmicHome ? (
          <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
        ) : (
          <DashboardSkyBackground fixedBackground />
        )}
        <DesktopToolSidebar
          variant={cosmicHome ? "web" : "default"}
          appearance={theme}
          onCollapsedChange={setSidebarCollapsed}
          className="!top-0 h-screen"
        />

        <div
          className="relative z-10 flex min-h-screen flex-col overflow-y-auto transition-[margin-left] duration-300 ease-in-out"
          style={{ marginLeft: sidebarWidth }}
        >
          <header
            className={cn(
              "fixed top-0 right-0 z-50 flex h-16 shrink-0 items-center border-b backdrop-blur-md",
              cosmicHome ? "border-white/[0.06] bg-[#0a0812]/80" : "border-border/80 bg-background/80",
            )}
            style={{
              top: "var(--app-safe-area-top)",
              left: sidebarWidth,
              transition: "left 300ms ease-in-out",
            }}
          >
            <div className="flex w-full items-center justify-end gap-2 px-4 sm:px-6">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/your-journey/chat")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderPillButtonClass(theme)}
              >
                Talk to Guide
              </Button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderIconButtonClass(theme)}
                    aria-label="Appearance"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Moon className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-52 z-50",
                    theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-white shadow-sm" aria-hidden />
                    <span className="flex-1">Light</span>
                    {theme === "light" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-border bg-[hsl(0_0%_12%)] shadow-sm"
                      aria-hidden
                    />
                    <span className="flex-1">Dark</span>
                    {theme === "dark" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className={dashboardHeaderAvatarTriggerClass(theme)}
                  >
                    <Avatar className={dashboardHeaderAvatarShellClass(theme)}>
                      {avatarUrl ? <AvatarImage src={avatarUrl} alt={username || userEmail} /> : null}
                      <AvatarFallback className={dashboardHeaderAvatarFallbackClass(theme)}>
                        {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-56 z-50",
                    theme === "dark" ? "border border-white/12 bg-[#0f0d14] text-white" : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username || "User"}</p>
                      <p
                        className={cn(
                          "text-xs leading-none",
                          theme === "dark" ? "text-white/55" : "text-muted-foreground",
                        )}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Your Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/report-issue")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderIconButtonClass(theme)}
                aria-label="Report an issue or request a feature"
              >
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
            </div>
          </header>

          <main
            className="relative z-10 mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6 sm:py-6"
            style={{
              paddingTop: "calc(var(--app-safe-area-top) + 4rem + 1.5rem)",
            }}
          >
            <div className="mb-6 sm:mb-8">
              <h1 className={dashboardHomeGreetingTitleClass(theme)}>
                {timeOfDayGreeting()}, {displayName}.
              </h1>
              <p className={cn("mt-2 sm:mt-3", dashboardHomeGreetingSubtitleClass(theme))}>
                Everything you need to manifest, in one place.
              </p>
            </div>

            <section
              className={cn(
                webDashboardManifestationCardClass(theme, dashboardAppPowerCheckpoints),
                "mb-4 sm:mb-6 p-4 sm:p-6",
              )}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Zap className={manifestationChargeZapIconClass(theme)} aria-hidden />
                  <div>
                    <p className={dashboardHomeManifestationTitleClass(theme)}>Manifestation Charge</p>
                    <p className={dashboardHomeManifestationMutedClass(theme)}>{chargePct}% aligned today</p>
                  </div>
                </div>
                <span className={manifestationStatusBadgeClass(theme)}>{dailyPracticeStatus}</span>
              </div>

              <div className={cn("mt-4", dashboardMobileManifestationMeterTrackClass(theme, false))}>
                <div
                  className={manifestationMeterBarClass(theme)}
                  style={manifestationMeterBarStyle(dashboardAppPowerCheckpoints)}
                />
              </div>

              <div className={dashboardHomeInspiredDividerClass(theme)}>
                <p className={dashboardHomeInspiredLabelClass(theme)}>Inspired Actions</p>
                <div className="mt-2 grid grid-cols-5 gap-2 sm:mt-3 sm:gap-2.5">
                  {activePractices.map((practice) => {
                    const done = dailyPracticeActions.has(practice.key);
                    const Icon = practice.Icon;
                    return (
                      <div key={practice.key} className={dailyPracticeCellClass(theme, done)}>
                        <Icon className={dailyPracticeIconClass(theme, done)} />
                        <p className={dailyPracticeLabelClass(theme, done)}>{practice.shortLabel}</p>
                      </div>
                    );
                  })}
                </div>
                <p className={dashboardHomeInspiredFooterClass(theme)}>
                  Affirm daily & embody the new story for coherence and alignment.
                </p>
              </div>
            </section>

            <section>
              <div className="mb-3 flex items-center gap-2 sm:mb-4">
                <Wrench className={dashboardSectionAccentIconClass(theme)} />
                <h2 className={dashboardHomeSectionLabelClass(theme)}>Your tools</h2>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:gap-4">
                {dashboardFeatures.map((tool) => (
                  <button
                    key={tool.path}
                    type="button"
                    onClick={() => handleToolClick(tool.path)}
                    className={webDashboardToolCardClass(theme)}
                  >
                    <DashboardToolIcon icon={tool.icon} theme={theme} />
                    <span className="min-w-0 flex-1">
                      <span className={dashboardHomeToolTitleClass(theme)}>{tool.title}</span>
                      <span className={dashboardHomeToolDescriptionClass(theme)}>{tool.description}</span>
                    </span>
                    <ChevronRight className={dashboardHomeToolChevronClass(theme)} />
                  </button>
                ))}
              </div>
            </section>
          </main>
        </div>
      </div>
    );
  }

  const showMobileCharacter =
    shouldShowCharacterImage && !!selectedCharacter && theme === "light";
  const displayName = firstName.trim() || "there";
  const cosmicHome = dashboardHomeUsesCosmicShell(theme);
  const mobileSafeAreaInlet = getDashboardMobileSafeAreaInlet(theme, isMobileDashboard);

  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden font-sans antialiased",
        cosmicHome ? "text-white" : "bg-background text-foreground",
        showMobileCharacter ? "overflow-x-hidden pb-0" : "pb-20 md:pb-0",
      )}
      style={cosmicHome ? { backgroundColor: WELCOME_COSMIC_BASE } : undefined}
    >
      {/* Desktop Sidebar - Desktop only */}
      {!isMobile && (
        <DesktopToolSidebar appearance={theme} onCollapsedChange={setSidebarCollapsed} />
      )}

      {cosmicHome ? (
        <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      ) : (
        <DashboardSkyBackground fixedBackground={!isMobile} />
      )}

      {/* Character overlay — native app, light theme only */}
      {showMobileCharacter && selectedCharacter && (
        <div
          className="fixed bottom-0 left-0 right-0 z-[2] pointer-events-none"
          style={{
            height: "40vh",
            backgroundImage: `url(${encodeURI(`/Dash & Cat Background Overlays/${selectedCharacter.charAt(0).toUpperCase() + selectedCharacter.slice(1)} - Grass.png`)})`,
            backgroundSize: "cover",
            backgroundPosition: "bottom center",
            backgroundRepeat: "no-repeat",
          }}
        />
      )}

      {isMobileDashboard ? (
        <div
          className={cn(
            "pointer-events-none fixed top-0 left-0 right-0 z-40",
            mobileSafeAreaInlet.className,
          )}
          style={{
            height: "var(--app-safe-area-top)",
            ...mobileSafeAreaInlet.style,
          }}
          aria-hidden
        />
      ) : null}
      
      {/* Content Container - Add left margin on desktop to account for sidebar */}
      <div 
        className="relative z-10 md:dark:border-l md:dark:border-border"
        style={!isMobile ? {
          marginLeft: sidebarCollapsed ? '64px' : '256px',
          transition: 'margin-left 300ms ease-in-out'
        } : {}}
      >
      {/* Header */}
      <header
        className={cn(
          "sticky z-50 flex items-center border-b py-3 backdrop-blur-md md:h-16 md:py-0",
          cosmicHome ? "border-white/[0.06] bg-[#0a0812]/80" : "border-border/80 bg-background/80",
        )}
        style={{ top: "var(--app-safe-area-top)" }}
      >
        <div className="container mx-auto px-4 sm:px-6 w-full">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div>
                <h1
                  className={cn(
                    "cursor-pointer font-sans text-sm font-semibold tracking-tight transition-opacity [-webkit-tap-highlight-color:transparent]",
                    "supports-[hover:hover]:hover:opacity-80",
                    cosmicHome ? "text-white/90" : "text-foreground",
                  )}
                  onClick={() => navigate("/")}
                >
                  Palette Plotting
                </h1>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* Tutorial, Dark Mode, and Profile Buttons */}
              <div 
                className="flex items-center gap-2"
                style={isMobile && !isStandalone ? { marginRight: '0.5rem' } : {}}
              >
              {/* Talk to Guide (replaces tutorial CTA for now) */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/your-journey/chat")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderPillButtonClass(theme)}
                aria-label="Talk to Guide"
              >
                Talk to Guide
              </Button>
              
              {/* Appearance (light / dark / tinted backgrounds) */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    onMouseDown={(e) => e.preventDefault()}
                    onPointerUp={(e) => e.currentTarget.blur()}
                    className={dashboardHeaderIconButtonClass(theme)}
                    aria-label="Appearance"
                  >
                    {theme === "dark" ? (
                      <Sun className="h-4 w-4 shrink-0" aria-hidden />
                    ) : (
                      <Moon className="h-4 w-4 shrink-0" aria-hidden />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-52 z-50",
                    theme === "dark"
                      ? "border border-white/12 bg-[#0f0d14] text-white"
                      : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>Appearance</DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("light")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-white shadow-sm" aria-hidden />
                    <span className="flex-1">Light</span>
                    {theme === "light" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                  <DropdownMenuItem className="gap-2" onClick={() => setTheme("dark")}>
                    <span className="h-3 w-3 shrink-0 rounded-full border border-border bg-[hsl(0_0%_12%)] shadow-sm" aria-hidden />
                    <span className="flex-1">Dark</span>
                    {theme === "dark" ? <Check className="h-4 w-4 shrink-0 opacity-70" /> : null}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onPointerUp={(e) => e.currentTarget.blur()}
                      className={dashboardHeaderAvatarTriggerClass(theme)}
                    >
                      <Avatar className={dashboardHeaderAvatarShellClass(theme)}>
                      {avatarUrl && <AvatarImage src={avatarUrl} alt={username || userEmail} />}
                        <AvatarFallback className={dashboardHeaderAvatarFallbackClass(theme)}>
                        {username ? username[0].toUpperCase() : userEmail[0]?.toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className={cn(
                    "w-56 z-50",
                    theme === "dark"
                      ? "border border-white/12 bg-[#0f0d14] text-white"
                      : "bg-background",
                  )}
                  align="end"
                >
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{username || "User"}</p>
                      <p
                        className={cn(
                          "text-xs leading-none",
                          theme === "dark" ? "text-white/55" : "text-muted-foreground",
                        )}
                      >
                        {userEmail}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={() => navigate("/settings")}>
                    <Settings className="glow-icon-gradient mr-2 h-4 w-4" />
                    <span>Your Account</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : undefined} />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="glow-icon-gradient mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate("/dashboard/report-issue")}
                onPointerUp={(e) => e.currentTarget.blur()}
                className={dashboardHeaderIconButtonClass(theme)}
                aria-label="Report an issue or request a feature"
              >
                <CircleAlert className="h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
              </Button>
              </div>
              {isMobile && (
                <div className="md:hidden">
                  <MobilePWAMenu />
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main
        className={cn(
          "container mx-auto px-4 sm:px-6 py-3 sm:py-6 relative z-10",
          showMobileCharacter ? "pb-0" : "pb-24 md:pb-20",
        )}
        style={{ paddingTop: "calc(var(--app-safe-area-top) + 1rem)" }}
      >
        {/* Welcome Section */}
        <div className="mb-4 sm:mb-8">
          <h2 className={dashboardHomeGreetingTitleClass(theme)}>
            {timeOfDayGreeting()}, {displayName}.
          </h2>
          <p className={cn("mt-2 sm:mt-3", dashboardHomeGreetingSubtitleClass(theme))}>
            Everything you need to manifest, in one place.
          </p>
        </div>

        <div
          className={cn(
            dashboardMobileManifestationCardClass(theme, dashboardAppPowerCheckpoints, isMobileDashboard),
            mobileCardSurface.className,
          )}
          style={mobileCardSurface.style}
        >
          <div className="p-3 sm:p-4 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <Zap className={manifestationChargeZapIconClass(theme, isMobileDashboard)} aria-hidden />
                <p className={dashboardMobileManifestationHeadingClass(theme, isMobileDashboard)}>
                  Manifestation Charge
                </p>
              </div>
              <span
                className={cn(
                  "text-[11px] font-medium whitespace-nowrap px-2 py-0.5 rounded-full border",
                  manifestationStatusBadgeClass(theme, isMobileDashboard),
                )}
              >
                {dailyPracticeStatus}
              </span>
            </div>

            <div className={dashboardMobileManifestationMeterTrackClass(theme, isMobileDashboard)}>
              <div
                className={manifestationMeterBarClass(theme, isMobileDashboard)}
                style={manifestationMeterBarStyle(dashboardAppPowerCheckpoints)}
              />
            </div>

            <div className={dashboardMobileManifestationDividerClass(theme, isMobileDashboard)}>
              <div className="flex items-center justify-between">
                <p className={dashboardMobileManifestationDailyLabelClass(theme, isMobileDashboard)}>
                  Inspired Actions
                </p>
              </div>
              <div className="mt-2 grid grid-cols-5 gap-2">
                {activePractices.map((practice) => {
                  const key = practice.key;
                  const Icon = practice.Icon;
                  const label = practice.shortLabel;
                  const done = dailyPracticeActions.has(key);
                  const cellClass = dailyPracticeCellClass(theme, done, isMobileDashboard);
                  const iconClass = dailyPracticeIconClass(theme, done, isMobileDashboard);
                  const labelClass = dailyPracticeLabelClass(theme, done, isMobileDashboard);
                  return (
                    <div
                      key={key}
                      className={cn("rounded-xl border px-1.5 py-2 text-center transition-colors", cellClass)}
                    >
                      <Icon className={iconClass} />
                      <div className={labelClass}>{label}</div>
                    </div>
                  );
                })}
              </div>
              <p className={dashboardMobileManifestationFooterClass(theme, isMobileDashboard)}>
                Affirm daily & embody the new story for coherence and alignment.
              </p>
            </div>
          </div>
        </div>

        {/* Main tool board: 2 columns × 3 rows (compact cards) */}
        <div className={dashboardMobileToolGridClass(isMobileDashboard)}>
          {dashboardFeatures.map((tool, index) => {
            return (
              <div
                key={tool.path}
                role="button"
                tabIndex={0}
                className={dashboardMobileToolCardClass(theme, isMobileDashboard)}
                style={{
                  ...mobileCardSurface.style,
                  ...dashboardMobileToolCardStyle(isMobileDashboard),
                  animationDelay: `${index * 0.05}s`,
                }}
                onClick={() => handleToolClick(tool.path)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleToolClick(tool.path);
                  }
                }}
              >
                <div
                  className={dashboardMobileToolCardHoverClass(theme, isMobileDashboard)}
                  style={{
                    transition: "opacity 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  }}
                />
                <div className={dashboardMobileToolCardInnerClass(isMobileDashboard)}>
                  <DashboardToolIcon
                    icon={tool.icon}
                    theme={theme}
                    size="sm"
                    isMobileDashboard={isMobileDashboard}
                  />
                  <div className="flex-1 min-w-0 relative z-10 flex items-center">
                    <h3 className={dashboardMobileToolTitleClass(theme, isMobileDashboard)}>
                      {tool.title}
                    </h3>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      </div>
    </div>
  );
};

export default Dashboard;
```

## src/pages/onboarding/AndroidPaywall.tsx

```tsx
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { IosAppHeader } from "@/components/IosAppHeader";

const TERMS_URL = "https://paletteplot.com/terms";
const PRIVACY_URL = "https://paletteplot.com/privacy";

/**
 * Native Android subscription paywall. Uses RevenueCat paywall UI to present
 * Google Play subscriptions. Completely separate from the iOS paywall.
 */
const AndroidPaywall = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);

  const isNativeAndroid = isAndroidPaywallContext();

  useEffect(() => {
    debugLog({
      location: "AndroidPaywall.tsx:mount",
      message: "AndroidPaywall mounted",
      data: {
        pathname: location.pathname,
        isNativeAndroid,
      },
      hypothesisId: "ANDROID-PAY",
    });
  }, [location.pathname, isNativeAndroid]);

  const runPaywallFlow = useCallback(async () => {
    if (!isNativeAndroid) {
      toast.error("Subscriptions are only available in the Android app.", {
        duration: 6000,
      });
      setFallbackDetail("Subscriptions are only available in the Android app.");
      setShowFallback(true);
      return;
    }

    setFallbackDetail(null);
    setPaywallOpening(true);

    try {
      let uid = user?.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
        if (error || !uid) {
          toast.error("Sign in again, then open subscription.", {
            duration: 8000,
          });
          setFallbackDetail(
            "No active session. Sign out, sign in, then tap Continue."
          );
          setShowFallback(true);
          return;
        }
      }

      const outcome = await runAndroidPaywallFlowAfterSignup({
        userId: uid,
        navigate,
        bypassPresentationLock: true,
      });
      const lastErr = getLastPaywallError();

      if (outcome === "success") return;

      if (outcome === "skipped") {
        toast.error("Open subscription from the app after sign up.", {
          duration: 6000,
        });
        setFallbackDetail(
          "Use Continue on the sign-up screen, or open Account from Settings."
        );
        setShowFallback(true);
        return;
      }
      setFallbackDetail(lastErr || "Something went wrong.");
      setShowFallback(true);
    } catch (e) {
      debugLog({
        location: "AndroidPaywall.tsx:runPaywallFlow:catch",
        message: "Unexpected error in AndroidPaywall paywall handler",
        data: {
          err: String((e as Error)?.message ?? e),
          stack: (e as Error)?.stack?.slice(0, 500) ?? null,
        },
        hypothesisId: "ANDROID-PAY",
      });
      toast.error("Something went wrong.", { duration: 8000 });
      setFallbackDetail(String((e as Error)?.message ?? e));
      setShowFallback(true);
    } finally {
      setPaywallOpening(false);
    }
  }, [isNativeAndroid, navigate, user?.id]);

  const handleContinue = () => {
    void runPaywallFlow();
  };

  useEffect(() => {
    if (!isNativeAndroid) {
      navigate("/onboarding/welcome", { replace: true });
    }
  }, [isNativeAndroid, navigate]);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-2 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(TERMS_URL, "_blank", "noopener,noreferrer")}
        >
          Terms / EULA
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(PRIVACY_URL, "_blank", "noopener,noreferrer")}
        >
          Privacy
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-foreground">
      <IosAppHeader signOutInsteadOfLogin={!!user} />

      <div
        className="mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{
          minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label="Close"
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg
              width="120"
              height="28"
              viewBox="0 0 120 28"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="44"
                cy="12"
                r="6"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z"
                fill="#B8860B"
                opacity="0.35"
              />
              <circle cx="96" cy="10" r="1.2" fill="#B8860B" />
              <circle cx="104" cy="16" r="1" fill="#B8860B" />
              <circle cx="88" cy="18" r="0.8" fill="#B8860B" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Unlock Your Manifestation Stack Today.
            </h1>
            <p className="mt-3 text-xs text-zinc-500">
              Tap Continue to confirm your plan.
            </p>
          </div>

          {!showFallback ? (
            <>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? "Opening…" : "Continue"}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">
                  We couldn&apos;t finish that step
                </h2>
                <p className="mt-1 text-sm text-zinc-600">
                  Tap Try again, or go back to sign up and tap Continue.
                </p>
                {fallbackDetail ? (
                  <p
                    className="mt-2 text-xs text-zinc-500 break-words"
                    data-testid="paywall-error"
                  >
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? "Opening…" : "Try again"}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AndroidPaywall;
```

## src/pages/onboarding/AndroidPostPaywallLoading.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { WelcomeCosmicBackground } from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import {
  clearAndroidPostPurchaseEntitlementLatch,
  getAndroidPostPurchaseLatchUserId,
  markAndroidSubscriptionConfirmed,
  retryAndroidPostPurchaseEntitlementSyncInBackground,
  runAndroidPostPurchaseGateIfNeeded,
  type AndroidPostPurchaseGateResult,
} from "@/lib/androidPostPurchaseEntitlementGate";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";

/** Visible post-paywall cap — avoids sitting at ~92% while Play/RC sync retries. */
const ANDROID_POST_PAYWALL_SCREEN_MAX_MS = 2800;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-white">{pct}%</div>
      </div>
    </div>
  );
}

type ExitReason = "gate_verified" | "verification_delayed" | "screen_cap";

/**
 * Android-only post-paywall loading screen. Runs the Android entitlement gate,
 * then routes to the dashboard — with a hard visible cap so Play/RC sync cannot
 * park the user at ~92% indefinitely. Provisioning continues in background.
 *
 * Purchase failures are handled before this screen. If the user reaches here,
 * treat entitlement sync failure as delayed verification — never bounce back to paywall.
 *
 * Completely separate from the iOS PostPaywallLoading.
 */
export default function AndroidPostPaywallLoading() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(8);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");
  const runningRef = useRef(false);

  const subtitle = useMemo(() => {
    if (phase === "finishing") return "Almost there — finishing your dashboard.";
    return "Setting up your practice from everything you shared.";
  }, [phase]);

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let alive = true;
    let tickId: number | null = null;
    let capTimerId: number | null = null;
    const mountTs = performance.now();
    const exitedRef = { current: false };
    const gateResultRef = { current: null as AndroidPostPurchaseGateResult | null };

    const startProgressTo100 = () => {
      const startProgress = 8;
      const progressStart = performance.now();
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        const elapsed = performance.now() - progressStart;
        const t = Math.min(1, elapsed / ANDROID_POST_PAYWALL_SCREEN_MAX_MS);
        const next = startProgress + (100 - startProgress) * t;
        setProgress(next >= 100 ? 100 : next);
        if (t >= 1 && tickId != null) {
          window.clearInterval(tickId);
          tickId = null;
        }
      }, 50);
    };

    const finishToDashboard = (reason: ExitReason) => {
      if (!alive || exitedRef.current) return;
      exitedRef.current = true;
      if (tickId != null) window.clearInterval(tickId);
      if (capTimerId != null) window.clearTimeout(capTimerId);

      const totalMs = Math.round(performance.now() - mountTs);
      const userId = getAndroidPostPurchaseLatchUserId();
      markAndroidSubscriptionConfirmed(userId);
      clearAndroidPostPurchaseEntitlementLatch();

      setPhase("finishing");
      setProgress(100);

      debugLog({
        location: "AndroidPostPaywallLoading.tsx:exit",
        message: "Android post-paywall navigating to dashboard",
        data: {
          reason,
          gate: gateResultRef.current,
          totalMs,
          lastPaywallError: getLastPaywallError(),
        },
        hypothesisId: "ANDROID-GATE",
      });
      console.info("[android-post-paywall] exit to dashboard", {
        reason,
        gate: gateResultRef.current,
        totalMs,
      });

      if (reason === "verification_delayed" || reason === "screen_cap") {
        retryAndroidPostPurchaseEntitlementSyncInBackground();
      }

      void (async () => {
        const provisionStart = performance.now();
        try {
          await provisionPostPaywallIfNeeded({ quiet: true });
          const provisionMs = Math.round(performance.now() - provisionStart);
          debugLog({
            location: "AndroidPostPaywallLoading.tsx:provisionBackground",
            message: "Background provisionPostPaywallIfNeeded finished",
            data: { provisionMs, totalMsSinceMount: Math.round(performance.now() - mountTs) },
            hypothesisId: "ANDROID-GATE",
          });
          console.info("[android-post-paywall] background provisioning done", { provisionMs });
        } catch (e) {
          console.error("[android-post-paywall] background provisioning failed:", e);
        }
      })();

      window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
    };

    startProgressTo100();

    const gateStart = performance.now();
    void runAndroidPostPurchaseGateIfNeeded()
      .then((gate) => {
        if (!alive) return;

        const gateMs = Math.round(performance.now() - gateStart);
        gateResultRef.current = gate;

        debugLog({
          location: "AndroidPostPaywallLoading.tsx:gateSettled",
          message: "runAndroidPostPurchaseGateIfNeeded settled",
          data: { gate, gateMs },
          hypothesisId: "ANDROID-GATE",
        });
        console.info("[android-post-paywall] gate settled", { gate, gateMs });

        if (gate.status === "delayed") {
          console.warn(
            "[android-post-paywall] entitlement verification delayed after purchase",
            gate
          );
          finishToDashboard("verification_delayed");
          return;
        }

        finishToDashboard("gate_verified");
      })
      .catch((e) => {
        console.warn("[android-post-paywall] gate threw — treating as delayed verification:", e);
        gateResultRef.current = {
          status: "delayed",
          reason: e instanceof Error ? e.message : "gate_threw",
        };
        finishToDashboard("verification_delayed");
      });

    capTimerId = window.setTimeout(() => {
      if (!alive || exitedRef.current) return;
      finishToDashboard("screen_cap");
    }, ANDROID_POST_PAYWALL_SCREEN_MAX_MS);

    return () => {
      alive = false;
      if (tickId != null) window.clearInterval(tickId);
      if (capTimerId != null) window.clearTimeout(capTimerId);
    };
  }, [navigate]);

  return (
    <div className="relative min-h-screen overflow-hidden font-sans text-white antialiased">
      <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title="Your path is ready" subtitle={subtitle} />

          <div className="flex items-center gap-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
            <ProgressRing value={progress} />
            <div className="min-w-0 flex-1 space-y-2">
              <div className="text-sm font-medium text-white/90">Building your dashboard…</div>
              <div className={cn("flex items-center gap-2", SETUP_MUTED_TEXT_CLASS)}>
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-white/60" />
                <span>Personalizing tools from your setup.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

## src/pages/onboarding/EmailCollection.tsx

```tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { ONBOARDING_ROUTES } from "@/lib/onboardingFlow";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

const EmailCollection = () => {
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [appNotificationsConsent, setAppNotificationsConsent] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [smsMarketingConsent, setSmsMarketingConsent] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  /** Native iOS (RevenueCat UI path): paywall failed after signup — Try again on this screen. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);

  // Refs for debouncing
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear localStorage on mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('onboarding_answers');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('selected_plan');
    localStorage.removeItem('onboarding_data');
  }, []);

  // Real-time email validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Reset error if email is empty or invalid format
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }

    // Set checking state
    setIsCheckingEmail(true);
    setEmailError(null);

    // Debounce check by 500ms
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase
          .rpc('check_email_exists', { check_email: email.trim() });

        if (checkError) {
          console.error("Error checking email:", checkError);
          setEmailError(null); // Don't show error on check failure
        } else if (emailExists) {
          setEmailError("This email is already registered. Please sign in instead.");
        } else {
          setEmailError(null);
        }
      } catch (e) {
        console.error("Error checking email:", e);
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email]);

  // Real-time username validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Reset error if username is empty
    if (!username.trim()) {
      setUsernameError(null);
      setIsCheckingUsername(false);
      return;
    }

    // Set checking state
    setIsCheckingUsername(true);
    setUsernameError(null);

    // Debounce check by 500ms
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: usernameExists, error: checkError } = await supabase
          .rpc('check_username_exists', { check_username: username.trim() });

        if (checkError) {
          console.error("Error checking username:", checkError);
          setUsernameError(null); // Don't show error on check failure
        } else if (usernameExists) {
          setUsernameError("This username is already taken. Please choose another.");
        } else {
          setUsernameError(null);
        }
      } catch (e) {
        console.error("Error checking username:", e);
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [username]);

  // Password validation
  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordError(null);
  }, [password, confirmPassword]);

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") { setPaywallNeedsRetry(false); return; }
        setPaywallNeedsRetry(true);
        return;
      }

      const outcome = await runIosPaywallFlowAfterSignup({
        userId: uid,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!email || !email.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }

    if (!username.trim()) {
      toast.error("Please enter a username");
      return;
    }

    if (!password || password.length < 8) {
      toast.error("Please enter a password with at least 8 characters");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (!firstName.trim()) {
      toast.error("Please enter your first name");
      return;
    }

    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }

    // Check for errors from real-time validation
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) {
        navigate("/login");
      }
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw new Error(
            "Account created, but sign-in is blocked. Please verify your email, then sign in."
          );
        }
      }

      const uid = signUpData.user?.id ?? null;

      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
      if (isNativeIos) {
        // Save session data in background — don't block the paywall
        ensureSession().then(() => updateSession({
          email: email.trim(),
          first_name: firstName.trim(),
          username: username.trim() || null,
          app_notifications_consent: appNotificationsConsent,
          email_consent: emailMarketingConsent,
          sms_consent: smsMarketingConsent,
        })).catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        // Older iOS: dedicated paywall screen (Monthly / Annual + StoreKit). Same route as resubscribe.
        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      // Non-iOS: save session data before navigating
      await ensureSession();
      await updateSession({
        email: email.trim(),
        first_name: firstName.trim(),
        username: username.trim() || null,
        app_notifications_consent: appNotificationsConsent,
        email_consent: emailMarketingConsent,
        sms_consent: smsMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        ensureSession()
          .then(() => updateSession({
            email: email.trim(),
            first_name: firstName.trim(),
            username: username.trim() || null,
            app_notifications_consent: appNotificationsConsent,
            email_consent: emailMarketingConsent,
            sms_consent: smsMarketingConsent,
          }))
          .catch(() => {});

        setPaywallNeedsRetry(false);
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          setPaywallNeedsRetry(true);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error("Could not open subscription options. Try again in a moment.");
      }
    } catch (e: unknown) {
      console.error("Error saving email:", e);
      const message = e instanceof Error ? e.message : "Failed to save. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formReady =
    email &&
    email.includes("@") &&
    password &&
    confirmPassword &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedTerms &&
    firstName.trim() &&
    username.trim() &&
    !isSubmitting &&
    !emailError &&
    !passwordError &&
    !usernameError &&
    !isCheckingEmail &&
    !isCheckingUsername;

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry ? !isRetryingPaywall : formReady;
  const footerContinueText = paywallNeedsRetry ? "Try again" : "Continue";

  return (
    <OnboardingLayout
      currentPage={7}
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Let's Get Started
          </h1>
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-left">
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 rounded-xl ${emailError ? "border-destructive" : ""}`}
              autoComplete="email"
              autoFocus
            />
            {isCheckingEmail && (
              <p className="text-xs text-muted-foreground">Checking availability...</p>
            )}
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="firstName" className="text-left">
                First Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder="First name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-xl"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="username" className="text-left">
                Username <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`h-10 rounded-xl ${usernameError ? "border-destructive" : ""}`}
                autoComplete="username"
              />
              {isCheckingUsername && (
                <p className="text-xs text-muted-foreground">Checking...</p>
              )}
              {usernameError && (
                <p className="text-xs text-destructive">{usernameError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="password" className="text-left">
                Password <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="8+ characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="confirmPassword" className="text-left">
                Confirm <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Re-enter"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-xs text-destructive">{passwordError}</p>
          )}

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I accept the{" "}
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-foreground font-medium hover:underline"
                >
                  Terms of Service
                </button>
                {" "}and{" "}
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-foreground font-medium hover:underline"
                >
                  Privacy Policy
                </button>
                .
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="app-notifications"
                checked={appNotificationsConsent}
                onCheckedChange={(checked) => setAppNotificationsConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="app-notifications"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings → Notification preferences.
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="email"
                checked={emailMarketingConsent}
                onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings.
              </Label>
            </div>

            <div className="flex items-start gap-2.5 hidden">
              <Checkbox
                id="sms"
                checked={smsMarketingConsent}
                onCheckedChange={(checked) => setSmsMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="sms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                I consent to SMS marketing communications (optional). Opt out in settings. Message and data rates may apply.
              </Label>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default EmailCollection;
```

## src/pages/onboarding/setup/AffirmationRead.tsx

```tsx
import { useMemo, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { OnboardingTypewriter } from "@/components/onboarding/OnboardingTypewriter";
import { readSetupDraft } from "@/lib/setupDraft";
import { cn } from "@/lib/utils";
import {
  buildOnboardingAffirmationReadText,
  msPerCharReadingPace,
  resolveOnboardingManifestCategories,
} from "@/lib/onboardingReadAffirmations";
import { SETUP_GLASS_PANEL_CLASS, SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";

export default function SetupAffirmationRead() {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  const categories = useMemo(() => resolveOnboardingManifestCategories(readSetupDraft()), []);
  const fullText = useMemo(() => buildOnboardingAffirmationReadText(categories), [categories]);
  const baseTypingMs = useMemo(() => msPerCharReadingPace(fullText), [fullText]);
  /** Slightly slower reveal for the first ~1–2 lines so readers can land before scroll picks up. */
  const speedMsForProgress = useCallback(
    (revealedSoFar: number) =>
      revealedSoFar < 160 ? Math.round(baseTypingMs * 1.38) : baseTypingMs,
    [baseTypingMs],
  );

  /** Eased follow of growing content: stays mostly still early so the first lines are easy to read, then catches up. */
  const easeFollowScroll = useCallback((revealedCount: number) => {
    const el = scrollRef.current;
    if (!el) return;

    const maxScroll = Math.max(0, el.scrollHeight - el.clientHeight);
    if (maxScroll <= 0) return;

    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.scrollTop = maxScroll;
      return;
    }

    let alpha: number;
    if (revealedCount < 220) alpha = 0.06;
    else if (revealedCount < 480) alpha = 0.2;
    else alpha = 0.44;

    const target = maxScroll;
    const dist = target - el.scrollTop;
    if (Math.abs(dist) < 0.55) {
      el.scrollTop = target;
      return;
    }
    el.scrollTop += dist * alpha;
  }, []);

  const canContinue = fullText.length > 0;

  return (
    <SetupPage
      canContinue={canContinue}
      disableNativeScrollViewport
      onBack={() => navigate("/onboarding/setup/current-friction")}
      onContinue={() => navigate("/onboarding/setup/embody-daily")}
    >
      <div className="flex min-h-0 w-full flex-1 flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0"
          title="Confidently affirm your desires out loud"
          subtitle="Speak & internalize these personalized affirmations"
        />

        {canContinue ? (
          <div
            className={cn(
              SETUP_GLASS_PANEL_CLASS,
              "relative flex min-h-0 w-full flex-1 flex-col overflow-hidden",
            )}
          >
            <div
              ref={scrollRef}
              className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain px-2 py-4 [-webkit-overflow-scrolling:touch]"
            >
              <OnboardingTypewriter
                text={fullText}
                speedMs={speedMsForProgress}
                onAfterRevealStep={easeFollowScroll}
                reserveMinHeight={false}
                contentClassName="whitespace-pre-wrap px-3 sm:px-5 py-5 sm:py-6 pb-28 pt-3 font-sans text-base sm:text-lg leading-[1.7] text-white/90 max-w-none"
              />
            </div>
          </div>
        ) : (
          <p className={SETUP_MUTED_TEXT_CLASS}>
            Choose what you want to manifest first, then come back to this step.
          </p>
        )}
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/BeginJourney.tsx

```tsx
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { OnboardingTypewriter } from "@/components/onboarding/OnboardingTypewriter";
import { SETUP_HEADING_SUBTITLE_CLASS, SETUP_HEADING_TITLE_CLASS } from "@/lib/onboardingSetupTheme";

const LEAD_COPY =
  "Palette Plotting helps you practice manifestation methods & embody your desires, fostering coherence at each step.";
const SUBTITLE = "Let's begin your journey.";

/** Short beat after headline finishes before the subtitle line begins typing. */
const SUBTITLE_DELAY_MS = 320;

export default function SetupBeginJourney() {
  const navigate = useNavigate();
  const [showSubtitle, setShowSubtitle] = useState(false);

  return (
    <SetupPage
      canContinue
      onBack={() => navigate("/onboarding/setup/embody-daily")}
      onContinue={() => navigate("/onboarding/setup/guide")}
    >
      <div className="space-y-3">
        <OnboardingTypewriter
          text={LEAD_COPY}
          as="h1"
          reserveMinHeight={false}
          speedMs={(n) => (n < 100 ? 42 : n < 220 ? 32 : 26)}
          contentClassName={cn(
            "!min-h-0 !pl-0 max-w-none text-center",
            SETUP_HEADING_TITLE_CLASS,
            "!text-[26px] sm:!text-[30px]",
          )}
          onTypingComplete={() => {
            window.setTimeout(() => setShowSubtitle(true), SUBTITLE_DELAY_MS);
          }}
        />
        {showSubtitle ? (
          <OnboardingTypewriter
            text={SUBTITLE}
            as="div"
            reserveMinHeight={false}
            speedMs={36}
            className="animate-in fade-in-0 duration-300"
            contentClassName={cn("!min-h-0 !pl-0 max-w-none text-center", SETUP_HEADING_SUBTITLE_CLASS)}
          />
        ) : null}
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/ConditionalSpecificity.tsx

```tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  getSpPersonHeadline,
  getStep7ChoiceConfig,
  isSpPersonStep7Category,
  normalizeDesireCategoryForStep7,
  type SpPersonChoice,
} from "@/lib/conditionalSpecificityStep7";
import { buildConditionalSpecificityPayload } from "@/lib/conditionalSpecificityStorage";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";

type Step7Persist = {
  selection: string;
  customText?: string | null;
};

function specMatchesCategory(spec: Record<string, unknown>, canonical: string): boolean {
  const c = spec.category;
  return typeof c === "string" && c === canonical;
}

function readHydratedSp(canonical: string): { choice: SpPersonChoice | null; name: string } {
  const d = readSetupDraft();
  const spec = d.conditionalSpecificity;
  if (!spec || typeof spec !== "object") return { choice: null, name: "" };
  const rec = spec as Record<string, unknown>;
  if (!specMatchesCategory(rec, canonical)) return { choice: null, name: "" };
  const sp = rec.sp;
  if (!sp || typeof sp !== "object") return { choice: null, name: "" };
  const o = sp as Record<string, unknown>;
  const raw = o.hasSpecificPerson;
  const valid: SpPersonChoice[] = ["yes", "no", "complicated", "prefer_not"];
  const choice = typeof raw === "string" && valid.includes(raw as SpPersonChoice) ? (raw as SpPersonChoice) : null;
  const label = typeof o.label === "string" ? o.label : "";
  return { choice, name: label };
}

function readHydratedStep7(canonical: string): Step7Persist | null {
  const d = readSetupDraft();
  const spec = d.conditionalSpecificity;
  if (!spec || typeof spec !== "object") return null;
  const rec = spec as Record<string, unknown>;
  if (!specMatchesCategory(rec, canonical)) return null;
  const s7 = rec.step7;
  if (!s7 || typeof s7 !== "object") return null;
  const o = s7 as Record<string, unknown>;
  if (typeof o.selection !== "string" || !o.selection.trim()) return null;
  return {
    selection: o.selection.trim(),
    customText: typeof o.customText === "string" ? o.customText : null,
  };
}

export default function SetupConditionalSpecificity() {
  const navigate = useNavigate();
  const category = useMemo(() => normalizeDesireCategoryForStep7(readSetupDraft().desireCategory), []);

  const isSp = isSpPersonStep7Category(category);
  const choiceConfig = !isSp ? getStep7ChoiceConfig(category) : null;

  useEffect(() => {
    if (!category.trim()) {
      navigate("/onboarding/setup/desire-category", { replace: true });
      return;
    }
    if (!isSp && !choiceConfig) {
      navigate("/onboarding/setup/current-friction", { replace: true });
    }
  }, [category, choiceConfig, isSp, navigate]);

  const [spChoice, setSpChoice] = useState<SpPersonChoice | null>(() => readHydratedSp(category).choice);
  const [spName, setSpName] = useState(() => readHydratedSp(category).name);

  const initialStep7 = readHydratedStep7(category);
  const [selectedOption, setSelectedOption] = useState<string | null>(initialStep7?.selection ?? null);
  const [customText, setCustomText] = useState(() =>
    initialStep7?.selection === "Custom" ? (initialStep7.customText ?? "").trim() : ""
  );

  const spNeedsName = spChoice === "yes" || spChoice === "complicated";
  const spNameOk = !spNeedsName || spName.trim().length > 0;

  const choiceOk =
    choiceConfig &&
    selectedOption !== null &&
    (selectedOption !== "Custom" || customText.trim().length > 0);

  const canContinue =
    category.length > 0 && (isSp ? spChoice !== null && spNameOk : choiceConfig ? !!choiceOk : false);

  const headline = isSp ? getSpPersonHeadline() : choiceConfig?.headline ?? "A quick detail";
  const subtitle = "We'll use this to shape your guidance in the app.";

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate("/onboarding/setup/desire-category")}
      onContinue={() => {
        const latest = readSetupDraft();
        const cat = normalizeDesireCategoryForStep7(latest.desireCategory);

        const payload = isSpPersonStep7Category(cat)
          ? buildConditionalSpecificityPayload({
              category: cat,
              isSpPersonBranch: true,
              sp: { choice: spChoice, name: spName },
              step7: null,
            })
          : buildConditionalSpecificityPayload({
              category: cat,
              isSpPersonBranch: false,
              sp: null,
              step7: { selection: selectedOption, customText },
            });

        writeSetupDraft({
          conditionalSpecificity: payload as unknown as Record<string, unknown>,
        });
        navigate("/onboarding/setup/current-friction");
      }}
    >
      <div className="relative z-[1] space-y-3 sm:space-y-4">
      <SetupHeadingBlock centered title={headline} subtitle={subtitle} />

      {isSp ? (
        <div className="space-y-3">
          {(
            [
              { key: "yes", label: "Yes" },
              { key: "no", label: "No" },
              { key: "complicated", label: "It's complicated" },
              { key: "prefer_not", label: "Prefer not to say" },
            ] as const
          ).map(({ key, label }) => {
            const active = spChoice === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setSpChoice(key)}
                className={setupTextChoiceTileClass(active)}
                style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className="font-sans text-base font-medium text-white">{label}</span>
                {active ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/35" />
                )}
              </button>
            );
          })}

          {spNeedsName ? (
            <div className="pt-4 space-y-2">
              <Label htmlFor="spName" className={SETUP_LABEL_CLASS}>
                What should we call them?
              </Label>
              <Input
                id="spName"
                value={spName}
                onChange={(e) => setSpName(e.target.value)}
                placeholder=""
                className={SETUP_FIELD_CLASS}
              />
            </div>
          ) : null}
        </div>
      ) : choiceConfig ? (
        <div className="space-y-3">
          {choiceConfig.options.map((opt) => {
            const active = selectedOption === opt;
            return (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  setSelectedOption(opt);
                  if (opt !== "Custom") setCustomText("");
                }}
                className={setupTextChoiceTileClass(active)}
                style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className="font-sans text-base font-medium text-white">{opt}</span>
                {active ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/35" />
                )}
              </button>
            );
          })}
          {selectedOption === "Custom" ? (
            <div className="pt-4 space-y-2">
              <Label htmlFor="step7custom" className={SETUP_LABEL_CLASS}>
                Describe your focus
              </Label>
              <Input
                id="step7custom"
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder=""
                className={SETUP_FIELD_CLASS}
              />
            </div>
          ) : null}
        </div>
      ) : (
        <div className={SETUP_MUTED_TEXT_CLASS}>
          Go back and pick one of the twelve focus areas to unlock this step.
        </div>
      )}
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/CurrentFriction.tsx

```tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Textarea } from "@/components/ui/textarea";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { needsSetupConditionalSpecificityPage } from "@/lib/conditionalSpecificityStep7";
import { SETUP_BELIEF_TEXT_MAX } from "./constants";
import { SETUP_TEXTAREA_CLASS } from "@/lib/onboardingSetupTheme";

export default function SetupCurrentFriction() {
  const navigate = useNavigate();
  const [text, setText] = useState(
    () =>
      (readSetupDraft().currentFriction ?? "").slice(0, SETUP_BELIEF_TEXT_MAX),
  );

  const trimmed = text.trim();
  const canContinue = trimmed.length > 0;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => {
        const draft = readSetupDraft();
        const cat = (draft.desireCategory || "").trim();
        navigate(
          cat && needsSetupConditionalSpecificityPage(cat)
            ? "/onboarding/setup/conditional-specificity"
            : "/onboarding/setup/desire-category",
        );
      }}
      onContinue={() => {
        writeSetupDraft({
          currentFriction: text.slice(0, SETUP_BELIEF_TEXT_MAX).trim(),
        });
        navigate("/onboarding/setup/affirmations");
      }}
    >
      <SetupHeadingBlock
        centered
        title="What limiting belief do you want to change?"
        subtitle="What limiting belief blocks your manifestation?"
      />

      <Textarea
        id="currentFriction"
        value={text}
        onChange={(e) =>
          setText(e.target.value.slice(0, SETUP_BELIEF_TEXT_MAX))
        }
        placeholder="Describe the belief you want to change…"
        maxLength={SETUP_BELIEF_TEXT_MAX}
        className={SETUP_TEXTAREA_CLASS}
        aria-label="Describe the belief you want to change"
      />
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/DesireCategory.tsx

```tsx
import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { needsSetupConditionalSpecificityPage } from "@/lib/conditionalSpecificityStep7";
import { SUPPORT_CATEGORIES } from "@/lib/affirmations-data";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  setupChoiceTileWithGlowClass,
} from "@/lib/onboardingSetupTheme";
import {
  Apple,
  BookOpen,
  Briefcase,
  Building2,
  Dumbbell,
  FolderKanban,
  Heart,
  Sparkles,
  Target,
  Users,
  Wallet,
  Zap,
  type LucideIcon,
} from "lucide-react";

const MAX_SELECTIONS = 1;

const LEGACY_KEY_TO_CANONICAL: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

const ICON_BY_NAME: Record<string, LucideIcon> = {
  Career: Briefcase,
  Business: Building2,
  Learning: BookOpen,
  Finances: Wallet,
  Productivity: Zap,
  Organization: FolderKanban,
  Confidence: Sparkles,
  "Self-Love": Users,
  Connections: Heart,
  Fitness: Dumbbell,
  Nutrition: Apple,
  Discipline: Target,
};

const NAME_SET = new Set(SUPPORT_CATEGORIES.map((c) => c.name));

function normalizeInitialSelection(): string[] {
  const d = readSetupDraft();
  if (Array.isArray(d.desireCategories) && d.desireCategories.length > 0) {
    const next = d.desireCategories
      .filter((x): x is string => typeof x === "string" && NAME_SET.has(x))
      .slice(0, MAX_SELECTIONS);
    if (next.length > 0) return next;
  }
  const raw = typeof d.desireCategory === "string" ? d.desireCategory.trim() : "";
  if (NAME_SET.has(raw)) return [raw];
  const legacy = LEGACY_KEY_TO_CANONICAL[raw];
  if (legacy && NAME_SET.has(legacy)) return [legacy];
  return [];
}

export default function SetupDesireCategory() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<string[]>(() => normalizeInitialSelection());

  const canContinue = selected.length > 0;

  const selectCategory = useCallback((name: string) => {
    setSelected((prev) => (prev.length === 1 && prev[0] === name ? [] : [name]));
  }, []);

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate("/onboarding/setup/name")}
      onContinue={() => {
        const primary = selected[0]!;
        writeSetupDraft({
          desireCategory: primary,
          desireCategories: selected,
          conditionalSpecificity: {},
        });
        navigate(
          needsSetupConditionalSpecificityPage(primary)
            ? "/onboarding/setup/conditional-specificity"
            : "/onboarding/setup/current-friction",
        );
      }}
    >
      <div className="flex flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="[&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title="What do you want to manifest most?"
          subtitle="Select one focus area."
        />

        <div className="grid grid-cols-2 content-start gap-2.5 pt-1.5 sm:gap-3">
          {SUPPORT_CATEGORIES.map(({ name, label, color }) => {
            const active = selected.includes(name);
            const Icon = ICON_BY_NAME[name] ?? Sparkles;
            const tileLabel = label === "Beauty / Glow Up" ? "Glow Up" : label;
            return (
              <button
                key={name}
                type="button"
                onClick={() => selectCategory(name)}
                className={cn(
                  "flex min-w-0 items-center gap-2.5 text-left sm:gap-3",
                  setupChoiceTileWithGlowClass(active),
                )}
                style={
                  active
                    ? {
                        borderColor: `${color}cc`,
                        boxShadow: `0 0 16px ${color}70, 0 0 32px ${color}35, ${SETUP_CHOICE_TILE_SELECTED_GLOW}`,
                      }
                    : undefined
                }
              >
                <span
                  className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-black/5 sm:h-10 sm:w-10"
                  style={{ backgroundColor: `${color}22` }}
                >
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5" style={{ color }} aria-hidden />
                </span>
                <span className="min-w-0 flex-1 font-sans text-xs font-semibold leading-snug text-white sm:text-sm">
                  {tileLabel}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/Email.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
} from "@/lib/onboardingSetupTheme";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { toast } from "sonner";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

export default function SetupEmail() {
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft(), []);
  const [email, setEmail] = useState(initial.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(
    initial.emailMarketingConsent === true,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  /** RevenueCat paywall failed after signup — same retry pattern as legacy `EmailCollection`. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordError(null);
  }, [password]);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
    setIsCheckingEmail(true);
    setEmailError(null);
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc("check_email_exists", {
          check_email: email.trim(),
        });
        if (checkError) {
          setEmailError(null);
        } else if (emailExists) {
          setEmailError("This email is already registered. Sign in instead.");
        } else {
          setEmailError(null);
        }
      } catch {
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);
    return () => {
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, [email]);

  const normalizedEmail = email.trim().toLowerCase();
  const firstName = (readSetupDraft().firstName ?? "").trim();
  const usernameForAuth = normalizedEmail;

  const formValid =
    normalizedEmail.length > 3 &&
    normalizedEmail.includes("@") &&
    password.length >= 8 &&
    acceptedTerms &&
    firstName.length > 0 &&
    !emailError &&
    !passwordError &&
    !isCheckingEmail;

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({
          userId: userData.user?.id ?? null,
          navigate,
        });
        if (outcome === "success") {
          setPaywallNeedsRetry(false);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      const outcome = await runIosPaywallFlowAfterSignup({
        userId: userData.user?.id ?? null,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!firstName) {
      toast.error("We need your first name from earlier in setup.");
      navigate("/onboarding/setup/name");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Please enter a password with at least 8 characters");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstName,
            username: usernameForAuth,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          throw new Error(
            "Account created, but sign-in is blocked. Verify your email, then sign in.",
          );
        }
      }

      const draftSnapshot = readSetupDraft();
      const sessionPatch: Record<string, unknown> = {
        email: normalizedEmail,
        first_name: firstName,
        username: usernameForAuth,
        email_consent: emailMarketingConsent,
        sms_consent: false,
      };
      if (typeof draftSnapshot.appNotificationsConsent === "boolean") {
        sessionPatch.app_notifications_consent = draftSnapshot.appNotificationsConsent;
      }

      const uid = signUpData.user?.id ?? null;
      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

      if (isNativeIos) {
        ensureSession()
          .then(() => updateSession(sessionPatch))
          .then(() =>
            writeSetupDraft({
              email: normalizedEmail,
              emailMarketingConsent,
            }),
          )
          .catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      await ensureSession();
      await updateSession(sessionPatch);

      writeSetupDraft({
        email: normalizedEmail,
        emailMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        setPaywallNeedsRetry(false);
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error("Could not open subscription options. Try again in a moment.");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry
    ? !isRetryingPaywall
    : formValid && !isSubmitting;
  const footerContinueText = paywallNeedsRetry ? "Try again" : "Continue";

  return (
    <OnboardingLayout
      currentPage={12}
      nativeFormPage
      setupCosmicPage
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-6 text-white">
        <SetupHeadingBlock
          centered
          title="Save your path"
          subtitle="Create your account to lock in your path. All of your progress is saved to this email."
          titleClassName="!text-white"
          subtitleClassName="!text-white/55"
        />

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-email" className={`${SETUP_LABEL_CLASS} !text-white/70`}>
            Email
          </Label>
          <Input
            id="setup-email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            autoComplete="email"
            inputMode="email"
            className={`${SETUP_FIELD_CLASS} !bg-white/95 !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light] ${emailError ? "border-destructive" : ""}`}
            style={{
              color: "#18181b",
              WebkitTextFillColor: "#18181b",
              backgroundColor: "rgba(255, 255, 255, 0.95)",
            }}
          />
          {isCheckingEmail ? (
            <p className={SETUP_MUTED_TEXT_CLASS}>Checking availability…</p>
          ) : null}
          {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
        </div>

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="setup-password" className={SETUP_LABEL_CLASS}>
            Password
          </Label>
          <div className="relative">
            <Input
              id="setup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              autoComplete="new-password"
              className={`${SETUP_FIELD_CLASS} pr-11 ${passwordError ? "border-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-11 rounded-2xl text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          {passwordError ? <p className="text-xs text-destructive pt-1">{passwordError}</p> : null}
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="setup-terms"
              className="text-xs text-white/55 leading-tight cursor-pointer"
            >
              I accept the{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="font-medium text-white/90 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="font-medium text-white/90 hover:underline"
              >
                Privacy Policy
              </button>
              .
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="setup-email-marketing"
              checked={emailMarketingConsent}
              onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="setup-email-marketing"
              className="text-xs text-white/55 leading-snug cursor-pointer"
            >
              Send me manifestation tips and updates. By checking this box, you consent to marketing
              communications. You can opt out anytime.
            </Label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}
```

## src/pages/onboarding/setup/EmbodyDailyIdentity.tsx

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { mapOnboardingEmbodyKeysToAppSlugs } from "@/lib/embodyPracticesCatalog";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  setupIconChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import {
  Apple,
  Brush,
  CheckCircle2,
  Circle,
  Dumbbell,
  Eye,
  Heart,
  Laptop,
  Link2,
  Moon,
  PartyPopper,
  Sparkles,
} from "lucide-react";

/** Order matches `ALL_EMBODY_PRACTICE_KEYS`; keys map via `ONBOARDING_EMBODY_KEY_TO_APP` in `embodyPracticesCatalog`. */
const REQUIRED = 5;

const OPTIONS = [
  {
    key: "embody_rest",
    label: "Rest & Relax",
    Icon: Moon,
  },
  {
    key: "embody_self_care",
    label: "Self-care",
    Icon: Heart,
  },
  {
    key: "embody_clean_environment",
    label: "Clean & organize environment",
    Icon: Brush,
  },
  {
    key: "embody_nutrition",
    label: "Nutrition",
    Icon: Apple,
  },
  {
    key: "embody_have_fun",
    label: "Have fun",
    Icon: PartyPopper,
  },
  {
    key: "embody_move",
    label: "Exercise",
    Icon: Dumbbell,
  },
  {
    key: "embody_glam_up",
    label: "Glam Up",
    Icon: Sparkles,
  },
  {
    key: "embody_connect",
    label: "Connect with others",
    Icon: Link2,
  },
  {
    key: "embody_seen",
    label: "Be seen & visible.",
    Icon: Eye,
  },
  {
    key: "embody_work_or_study",
    label: "Work or study",
    Icon: Laptop,
  },
] as const;

const OPTION_KEYS = new Set(OPTIONS.map((o) => o.key));

export default function SetupEmbodyDailyIdentity() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const initial = useMemo(() => {
    const raw = readSetupDraft().embodyDailyPractices ?? [];
    return raw.filter((k): k is string => typeof k === "string" && OPTION_KEYS.has(k));
  }, []);
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (k: string) => {
    setSelected((prev) => {
      if (prev.includes(k)) return prev.filter((x) => x !== k);
      if (prev.length >= REQUIRED) return prev;
      return [...prev, k];
    });
  };

  const canContinue = selected.length === REQUIRED;

  return (
    <SetupPage
      canContinue={canContinue}
      disableNativeScrollViewport
      onBack={() => navigate("/onboarding/setup/affirmations")}
      onContinue={() => {
        writeSetupDraft({ embodyDailyPractices: selected });
        // Best-effort sync for logged-in users so the app can immediately show only these five.
        // iOS post-paywall also syncs this via `sync-revenuecat-entitlement`.
        if (user?.id) {
          const mapped = mapOnboardingEmbodyKeysToAppSlugs(selected);
          if (mapped) {
            void supabase
              .from("user_preferences")
              .upsert({ user_id: user.id, embody_active_practices: mapped }, { onConflict: "user_id" })
              .then(({ error }) => {
                if (error && import.meta.env.DEV) {
                  console.warn("[EmbodyDailyIdentity] user_preferences embody upsert:", error.message);
                }
              });
          }
        }
        navigate("/onboarding/setup/begin-journey");
      }}
    >
      {/*
        Matches the working ToolPreference ("How do you want support") layout:
        SetupPage runs with `disableNativeScrollViewport`, and we own the inner scroll
        viewport here with an explicit height cap so it actually scrolls instead of
        nesting two flex-1 viewports (the previous version, which couldn't scroll).
      */}
      <div className="flex w-full flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0"
          title="How will you embody your new identity each day?"
          subtitle={`Choose exactly five—they become your Inspired Actions on your dashboard. (${selected.length} of ${REQUIRED} selected)`}
        />

        <div className="relative z-[1] h-[min(48vh,calc(100dvh-19rem))] w-full shrink-0 overflow-hidden sm:h-[min(50vh,calc(100dvh-17rem))]">
          <div className="relative z-[1] h-full space-y-2.5 overflow-y-auto overflow-x-hidden overscroll-y-contain px-1 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
            {OPTIONS.map(({ key, label, Icon }) => {
              const active = selected.includes(key);
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => toggle(key)}
                  className={setupIconChoiceTileClass(active)}
                  style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
                >
                  <span className="flex items-center gap-3">
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 text-white/80">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </span>
                    <span className="font-sans text-base font-medium text-white">{label}</span>
                  </span>
                  {active ? (
                    <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                  ) : (
                    <Circle className="h-5 w-5 shrink-0 text-white/35" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/Guide.tsx

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Card } from "@/components/ui/card";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";

const GUIDES = [
  {
    id: "river",
    name: "River",
    headshot: "/headshots/river-headshot-2.png",
    themes: ["Transitions", "Career"],
    bubbleColor: "#4AC7FF",
    overlayColor: "#4AC7FF",
    imagePosition: "object-[35%_15%]",
    imageScale: "scale-85",
  },
  {
    id: "sage",
    name: "Sage",
    headshot: "/headshots/sage-headshot.png",
    themes: ["Finance", "Identity"],
    bubbleColor: "#8fbf76",
    overlayColor: "#8fbf76",
    imagePosition: "object-[35%_20%]",
  },
  {
    id: "rose",
    name: "Rose",
    headshot: "/headshots/rose-headshot.png",
    themes: ["Love", "Self Concept"],
    bubbleColor: "#FFB6C1",
    overlayColor: "#FFB6C1",
    imagePosition: "object-[35%_35%]",
  },
  {
    id: "oliver",
    name: "Oliver",
    headshot: "/headshots/oliver-headshot.png",
    themes: ["Self Image", "Fitness"],
    bubbleColor: "#FFC107",
    overlayColor: "#FFC107",
    imagePosition: "object-[35%_30%]",
  },
] as const;

export default function SetupGuide() {
  const navigate = useNavigate();
  const { updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft().guideCharacterId ?? null, []);
  const [selected, setSelected] = useState<string | null>(initial);

  const handleContinue = async () => {
    if (!selected) return;
    writeSetupDraft({ guideCharacterId: selected });
    try {
      await updateSession({ character_id: selected });
    } catch (e) {
      console.warn("Failed to persist guide selection:", e);
    }
    navigate("/onboarding/setup/notifications");
  };

  return (
    <SetupPage
      canContinue={selected !== null}
      onBack={() => navigate("/onboarding/setup/begin-journey")}
      onContinue={handleContinue}
      disableNativeScrollViewport
    >
      <div className="flex w-full flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 text-center [&_h1]:text-center"
          title="Choose a guide"
          subtitle="An AI companion to answer manifesting questions."
          subtitleClassName="pl-0 text-center"
        />

        {/* 4 cards fit comfortably without scrolling — let them flow naturally to the bottom. */}
        <div className="grid grid-cols-1 gap-3 pt-2 sm:grid-cols-2 sm:gap-4">
          {GUIDES.map((character) => {
            const isSelected = selected === character.id;
            const glowColor = character.bubbleColor;
            return (
              <Card
                key={character.id}
                onClick={() => setSelected(character.id)}
                className={`relative overflow-hidden group cursor-pointer min-h-[70px] sm:min-h-[130px] border bg-transparent ${
                  isSelected ? "border-transparent" : "border-white/12"
                }`}
                style={{
                  transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1), transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                  transform: "scale(1)",
                  ...(isSelected
                    ? {
                        boxShadow: `0 0 20px ${glowColor}80, 0 0 40px ${glowColor}40, 0 0 60px ${glowColor}20`,
                      }
                    : {}),
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = "scale(1)";
                }}
                onMouseDown={(e) => {
                  e.currentTarget.style.transform = "scale(0.98)";
                }}
                onMouseUp={(e) => {
                  e.currentTarget.style.transform = "scale(1.02)";
                }}
              >
                <div className="absolute inset-0 rounded-lg bg-white" aria-hidden />
                <div className="absolute inset-0 overflow-hidden">
                  <img
                    src={character.headshot}
                    alt={character.name}
                    className={`w-[120%] h-full object-cover ${character.imagePosition} ${character.imageScale ?? "scale-110"} sm:scale-100 -translate-x-[24%]`}
                  />
                </div>
                <div
                  className="absolute inset-0"
                  style={{ backgroundColor: `${character.overlayColor}33` }}
                />
                <div className="relative p-2 sm:p-4 flex items-end justify-end h-full min-h-[70px] sm:min-h-[130px]">
                  <div className="flex flex-col items-center gap-1 sm:gap-2">
                    <h3 className="text-base sm:text-xl font-bold text-black drop-shadow-sm">{character.name}</h3>
                    <div className="flex flex-col gap-1 sm:gap-2">
                      {character.themes.map((theme) => (
                        <div
                          key={theme}
                          className="rounded-full px-2 sm:px-3 py-1 sm:py-1.5 flex items-center justify-center min-w-[70px] sm:min-w-[80px]"
                          style={{ backgroundColor: `${character.bubbleColor}E6` }}
                        >
                          <span className="text-xs font-medium text-white whitespace-nowrap text-center">{theme}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/Name.tsx

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";

export default function SetupName() {
  const navigate = useNavigate();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);

  const canContinue = firstName.trim().length > 0;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate("/onboarding/welcome")}
      onContinue={() => {
        writeSetupDraft({ firstName: firstName.trim() });
        navigate("/onboarding/setup/desire-category");
      }}
    >
      <SetupHeadingBlock centered title="Welcome! What should Palette Plotting call you?" />

      <div className="space-y-2 pt-6">
        <Label htmlFor="firstName" className={SETUP_LABEL_CLASS}>
          First name
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/NotificationPrePermission.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import {
  isAndroidPushRegisterEnabled,
  requestNativePushPermission,
} from "@/services/pushNotifications";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  SETUP_MUTED_TEXT_CLASS,
  setupTextChoiceTileClass,
} from "@/lib/onboardingSetupTheme";
import { CheckCircle2, Circle } from "lucide-react";

export default function SetupNotificationPrePermission() {
  const navigate = useNavigate();
  const isNative = useIsNativeApp();
  /** No default — user must tap an option; native prompt only after “Turn on reminders”. */
  const [choice, setChoice] = useState<"on" | "off" | null>(null);

  return (
    <SetupPage
      canContinue={choice !== null}
      onBack={() => navigate("/onboarding/setup/guide")}
      onContinue={() => {
        if (!choice) return;
        const d = readSetupDraft();
        const prev =
          d.conditionalSpecificity && typeof d.conditionalSpecificity === "object"
            ? d.conditionalSpecificity
            : {};
        writeSetupDraft({
          conditionalSpecificity: { ...prev, notifications: choice },
          appNotificationsConsent: choice === "on",
        });
        navigate("/onboarding/setup/tool-preference");
      }}
      continueText="Continue"
    >
      <SetupHeadingBlock
        centered
        title="Want reminders from Palette Plotting?"
        subtitle="Palette Plotting can remind you to return to the app to continue to affirm, listen to subliminals and more."
      />

      <div className="relative z-[1] pt-8 space-y-3">
        <button
          type="button"
          onClick={() => {
            setChoice("on");
            if (Capacitor.isNativePlatform()) {
              void requestNativePushPermission();
            }
          }}
          className={setupTextChoiceTileClass(choice === "on")}
          style={choice === "on" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
        >
          <span className="font-sans text-base font-medium text-white">Turn on reminders</span>
          {choice === "on" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-white/35" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setChoice("off")}
          className={setupTextChoiceTileClass(choice === "off")}
          style={choice === "off" ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
        >
          <span className="font-sans text-base font-medium text-white">Not now</span>
          {choice === "off" ? (
            <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
          ) : (
            <Circle className="h-5 w-5 shrink-0 text-white/35" />
          )}
        </button>

        <p className={cn("pt-2 text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS)}>
          {isNative && Capacitor.getPlatform() === "ios"
            ? "We’ll only show the native permission prompt if you tap “Turn on reminders.”"
            : isNative && Capacitor.getPlatform() === "android"
              ? isAndroidPushRegisterEnabled()
                ? "We’ll only show the native permission prompt if you tap “Turn on reminders.”"
                : "We’ll save your choice when you tap Continue."
              : "Reminder permissions are available in the native app."}
        </p>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/PathLoading.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  SETUP_GLASS_PANEL_CLASS,
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
  SETUP_TESTIMONIAL_STAR_CLASS,
} from "@/lib/onboardingSetupTheme";

type Testimonial = { readonly quote: string; readonly author: string };

/** Row 1 — horizontal marquee (duplicated strip for seamless loop). */
const TESTIMONIALS_ROW_1: readonly Testimonial[] = [
  { quote: "This finally made my new story feel normal.", author: "Jordan M." },
  { quote: "I stopped checking the 3D and stayed consistent—finally.", author: "Riley T." },
  { quote: "The tool path was exactly what I needed.", author: "Casey L." },
  { quote: "The affirmations actually sounded like me, not generic fluff.", author: "Morgan P." },
] as const;

/** Row 2 — different quotes, second marquee speed. */
const TESTIMONIALS_ROW_2: readonly Testimonial[] = [
  { quote: "My self-concept shifted fast once I had structure.", author: "Dev S." },
  { quote: "Having one place for mirror work and subliminals kept me honest.", author: "Avery K." },
  { quote: "Small daily wins added up quicker than I expected.", author: "Quinn R." },
  { quote: "I actually finish sessions now instead of doom-scrolling.", author: "Jamie H." },
] as const;

function TestimonialMarqueeRow({
  cards,
  animationClass,
}: {
  cards: readonly Testimonial[];
  animationClass: string;
}) {
  return (
    <div
      className="relative z-[1] -mx-1 w-[calc(100%+0.5rem)] overflow-hidden py-1 sm:mx-0 sm:w-full"
      style={{
        maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <div
        className={cn(
          "flex w-max flex-nowrap gap-2.5 motion-reduce:!animate-none pointer-events-none",
          animationClass,
        )}
        aria-hidden
      >
        {[0, 1].map((dup) =>
          cards.map((card, i) => (
            <figure
              key={`${dup}-${i}-${card.author}`}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "w-[min(260px,72vw)] shrink-0 px-3 py-3",
              )}
            >
              <div className="mb-1.5 flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={SETUP_TESTIMONIAL_STAR_CLASS} />
                ))}
              </div>
              <blockquote className="font-sans text-sm font-medium leading-snug text-white/90">“{card.quote}”</blockquote>
              <figcaption className="mt-2 font-sans text-xs text-white/50">{card.author}</figcaption>
            </figure>
          )),
        )}
      </div>
    </div>
  );
}

export default function SetupPlotLoading() {
  const navigate = useNavigate();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => Math.min(100, p + Math.floor(Math.random() * 7 + 3)));
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct >= 100) {
      const tid = window.setTimeout(() => navigate("/onboarding/setup/plot-synthesis"), 450);
      return () => window.clearTimeout(tid);
    }
  }, [pct, navigate]);

  return (
    <SetupPage
      canContinue={false}
      continueText="Loading"
      disableNativeScrollViewport
      onContinue={undefined}
    >
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <SetupHeadingBlock
          centered
          className="shrink-0 mb-1"
          title="Building your path…"
          subtitle="Personalizing your starting stack."
        />

        {/* Upper: progress. Remaining height: testimonials vertically centered as a pair. */}
        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-6 pt-1">
            <div className={SETUP_PROGRESS_TRACK_CLASS}>
              <div
                className={SETUP_PROGRESS_FILL_CLASS}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center gap-4 pt-4 pb-1">
            <p className="px-2 text-center font-sans text-sm text-white/55">
              You&apos;re not starting from zero—your path is already taking shape.
            </p>
            <TestimonialMarqueeRow
              cards={TESTIMONIALS_ROW_1}
              animationClass="animate-palette-plotting-testimonials-marquee"
            />
            <TestimonialMarqueeRow
              cards={TESTIMONIALS_ROW_2}
              animationClass="animate-palette-plotting-testimonials-marquee-slow"
            />
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/PathSynthesis.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { readSetupDraft } from "@/lib/setupDraft";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Sparkles,
  Music,
  ScanFace,
  Shapes,
  MessageCircle,
  NotebookPen,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SETUP_GLASS_PANEL_CLASS } from "@/lib/onboardingSetupTheme";

const GUIDE_DISPLAY_NAME: Record<string, string> = {
  river: "River",
  sage: "Sage",
  rose: "Rose",
  oliver: "Oliver",
};

export default function SetupPlotSynthesis() {
  const navigate = useNavigate();
  const guideName = useMemo(() => {
    const id = readSetupDraft().guideCharacterId;
    return id && GUIDE_DISPLAY_NAME[id] ? GUIDE_DISPLAY_NAME[id] : null;
  }, []);

  const items = useMemo((): { Icon: LucideIcon; text: string }[] => {
    const stack: { Icon: LucideIcon; text: string }[] = [
      {
        Icon: Music,
        text: "A customized subliminal.",
      },
      { Icon: ScanFace, text: "Mirror work for self concept." },
      {
        Icon: MessageCircle,
        text: guideName
          ? `${guideName} is ready to coach you.`
          : "Your guide is ready to coach you.",
      },
      {
        Icon: Sparkles,
        text: "Affirmations for the new you.",
      },
      { Icon: Shapes, text: "Beliefs ready for reframing." },
      { Icon: NotebookPen, text: "Journal ready for reflection." },
    ];
    return stack;
  }, [guideName]);

  return (
    <SetupPage
      canContinue={true}
      continueText="Continue"
      onBack={() => navigate("/onboarding/setup/plot-loading")}
      onContinue={() => navigate("/onboarding/setup/email")}
    >
      <div className="space-y-4">
        <SetupHeadingBlock
          centered
          title="Your path is ready."
          subtitle="Everything below is ready the moment you unlock Palette Plotting."
        />

        <div className="space-y-3">
          {items.map(({ Icon, text }) => (
            <div
              key={text}
              className={cn(
                SETUP_GLASS_PANEL_CLASS,
                "flex w-full min-h-[3.25rem] items-center justify-between gap-3 px-4 py-4",
              )}
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/12 text-white/80">
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </span>
                <span className="font-sans text-base font-medium leading-snug text-white">{text}</span>
              </div>
              <ChevronRight className="h-5 w-5 shrink-0 text-white/40" />
            </div>
          ))}
        </div>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/ToolPreference.tsx

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { CheckCircle2, Circle, Sparkles, Music, ScanFace, Shapes, MessageCircle, BarChart3 } from "lucide-react";
import {
  SETUP_CHOICE_TILE_SELECTED_GLOW,
  setupIconChoiceTileClass,
} from "@/lib/onboardingSetupTheme";

const OPTIONS = [
  { key: "powerful_affirmations", label: "Powerful affirmations", Icon: Sparkles },
  { key: "custom_subliminals", label: "Custom Subliminals", Icon: Music },
  { key: "mirror_work_reset", label: "Mirror Work", Icon: ScanFace },
  { key: "belief_restructuring", label: "Belief Work", Icon: Shapes },
  { key: "ai_manifestation_guidance", label: "AI Manifestation Guidance", Icon: MessageCircle },
  { key: "daily_wins_progress", label: "Track Consistency & Progress", Icon: BarChart3 },
] as const;

export default function SetupToolPreference() {
  const navigate = useNavigate();
  const initial = useMemo(
    () => (readSetupDraft().toolPreferences ?? []).filter((k) => k !== "all_of_it"),
    [],
  );
  const [selected, setSelected] = useState<string[]>(initial);

  const toggle = (k: string) => {
    setSelected((prev) => (prev.includes(k) ? prev.filter((x) => x !== k) : [...prev, k]));
  };

  return (
    <SetupPage
      canContinue={selected.length > 0}
      disableNativeScrollViewport
      onBack={() => navigate("/onboarding/setup/notifications")}
      onContinue={() => {
        writeSetupDraft({ toolPreferences: selected });
        navigate("/onboarding/setup/plot-loading");
      }}
    >
      <div className="flex w-full flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0"
          title="How do you want support?"
          subtitle="Choose the tools you want to start with."
        />

        <div className="relative z-[1] h-[min(48vh,calc(100dvh-17.5rem))] w-full shrink-0 overflow-hidden sm:h-[min(50vh,calc(100dvh-16rem))]">
          <div className="relative z-[1] h-full space-y-2.5 overflow-y-auto overflow-x-hidden overscroll-y-contain px-1 py-1 pb-2 [-webkit-overflow-scrolling:touch]">
          {OPTIONS.map(({ key, label, Icon }) => {
            const active = selected.includes(key);
            return (
              <button
                key={key}
                type="button"
                onClick={() => toggle(key)}
                className={setupIconChoiceTileClass(active)}
                style={active ? { boxShadow: SETUP_CHOICE_TILE_SELECTED_GLOW } : undefined}
              >
                <span className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/12 text-white/80">
                    <Icon className="h-4 w-4" strokeWidth={1.75} />
                  </span>
                  <span className="font-sans text-base font-medium text-white">{label}</span>
                </span>
                {active ? (
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-white" />
                ) : (
                  <Circle className="h-5 w-5 shrink-0 text-white/35" />
                )}
              </button>
            );
          })}
          </div>
        </div>
      </div>
    </SetupPage>
  );
}
```

## src/pages/onboarding/setup/constants.ts

```typescript
export const SETUP_DESIRE_TEXT_MAX = 150;
/** Same max as Belief Work (Refactor) body field — onboarding only; do not change the tool from here. */
export const SETUP_BELIEF_TEXT_MAX = 250;
```

## src/pages/onboarding/setup/index.ts

```typescript
export { default as SetupName } from "./Name";
export { default as SetupEmail } from "./Email";
export { default as SetupDesireCategory } from "./DesireCategory";
export { default as SetupCurrentFriction } from "./CurrentFriction";
export { default as SetupAffirmationRead } from "./AffirmationRead";
export { default as SetupEmbodyDailyIdentity } from "./EmbodyDailyIdentity";
export { default as SetupBeginJourney } from "./BeginJourney";
export { default as SetupConditionalSpecificity } from "./ConditionalSpecificity";
export { default as SetupGuide } from "./Guide";
export { default as SetupToolPreference } from "./ToolPreference";
export { default as SetupPlotLoading } from "./PlotLoading";
export { default as SetupPlotSynthesis } from "./PlotSynthesis";
export { default as SetupNotificationPrePermission } from "./NotificationPrePermission";
```

## src/services/pushNotifications.ts

```typescript
import { PushNotifications } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Capacitor } from '@capacitor/core';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

let pushListenersAttached = false;

/** True when Android builds may call Capacitor PushNotifications (requires google-services.json in CI). */
export function isAndroidPushRegisterEnabled(): boolean {
  return (
    import.meta.env.VITE_ANDROID_PUSH_REGISTER === 'true' ||
    import.meta.env.VITE_ANDROID_PUSH_REGISTER === '1'
  );
}

function pushTokenPlatform(): 'ios' | 'android' {
  return Capacitor.getPlatform() === 'android' ? 'android' : 'ios';
}

function attachPushListenersOnce() {
  if (pushListenersAttached) return;
  pushListenersAttached = true;

  PushNotifications.addListener('registration', async (token) => {
    console.log('[PushNotifications] Registration success, token:', token.value);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      try {
        const platform = pushTokenPlatform();
        const { error } = await supabase
          .from('user_push_tokens')
          .upsert({
            user_id: user.id,
            platform,
            token: token.value,
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,platform'
          });

        if (error) {
          console.error('[PushNotifications] Error saving token:', error);
        } else {
          console.log('[PushNotifications] Token saved successfully');
        }
      } catch (error) {
        console.error('[PushNotifications] Error saving token:', error);
      }
    }
  });

  PushNotifications.addListener('registrationError', (error) => {
    console.error('[PushNotifications] Registration error:', error);
  });

  PushNotifications.addListener('pushNotificationReceived', (notification) => {
    console.log('[PushNotifications] Push received:', notification);

    if (notification.title && notification.body) {
      toast.info(notification.body, {
        title: notification.title
      });
    }
  });

  PushNotifications.addListener('pushNotificationActionPerformed', (notification) => {
    console.log('[PushNotifications] Action performed:', notification);

    if (notification.notification.data) {
      const data = notification.notification.data as any;
      if (data.url) {
        window.location.href = data.url;
      }
    }
  });
}

/**
 * Shows the OS permission dialog on native. Android token registration stays gated
 * until FCM is wired, but Android 13+ can still show the notification permission box.
 * Safe to call multiple times (listeners attach once when registration is enabled).
 *
 * Android: `@capacitor/push-notifications` requires Firebase to initialize on plugin
 * load; without `google-services.json` the plugin can fail to come up and the system
 * dialog never appears. `@capacitor/local-notifications` requests the same Android
 * POST_NOTIFICATIONS permission without any FCM dependency, so we use it on Android
 * just to surface the OS prompt. iOS continues to use PushNotifications (validated path).
 */
export async function requestNativePushPermission(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('[PushNotifications] Skipping request — not native platform');
    return;
  }

  if (Capacitor.getPlatform() === 'android') {
    try {
      const permResult = await LocalNotifications.requestPermissions();
      if (permResult.display !== 'granted') {
        console.log('[PushNotifications] Android notification permission denied');
        return;
      }
      console.log('[PushNotifications] Android notification permission granted');

      if (isAndroidPushRegisterEnabled()) {
        attachPushListenersOnce();
        await PushNotifications.register();
        console.log('[PushNotifications] Android FCM token registration requested');
      } else {
        console.log(
          '[PushNotifications] Skipping Android FCM token registration (google-services.json + VITE_ANDROID_PUSH_REGISTER=true required).',
        );
      }
    } catch (error) {
      console.error('[PushNotifications] Android permission request error:', error);
    }
    return;
  }

  attachPushListenersOnce();

  try {
    const permResult = await PushNotifications.requestPermissions();

    if (permResult.receive !== 'granted') {
      console.log('[PushNotifications] Permission denied');
      return;
    }

    await PushNotifications.register();
    console.log('[PushNotifications] Registration requested');
  } catch (error) {
    console.error('[PushNotifications] Permission request error:', error);
  }
}

/**
 * Initialize push notifications for native app (e.g. app resume / login flows).
 * Does nothing on web/PWA to avoid disturbing existing functionality.
 */
export const initializePushNotifications = async () => {
  await requestNativePushPermission();
};

/**
 * Unregister push notifications (for logout, etc.)
 */
export const unregisterPushNotifications = async () => {
  if (!Capacitor.isNativePlatform()) {
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Remove token from database
      await supabase
        .from('user_push_tokens')
        .delete()
        .eq('user_id', user.id)
        .eq('platform', pushTokenPlatform());
    }
  } catch (error) {
    console.error('[PushNotifications] Unregister error:', error);
  }
};
```

## src/services/revenueCat.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { LOG_LEVEL, Purchases } from "@revenuecat/purchases-capacitor";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import {
  getIosMajorVersionForNative,
  shouldUseRevenueCatPaywallUi,
  IOS_REVENUECAT_UI_MIN_MAJOR,
} from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";

/** Compat StoreKit path only; ignored when RevenueCat paywall UI is shown. */
export type PresentPaywallOptions = {
  billingPeriod?: BillingPeriod;
};

let hasConfigured = false;
let configuredAppUserId: string | null = null;

/** Last reason presentRevenueCatPaywall returned false (for debugging UI). */
let lastPaywallError: string | null = null;

export function getLastPaywallError(): string | null {
  return lastPaywallError;
}

/** UI / flow helpers when RevenueCat is not invoked (e.g. global in-flight guard). */
export function setLastPaywallErrorMessage(message: string) {
  lastPaywallError = message;
}

// #region agent log (dev-only: loopback ingest triggers Chrome "apps on device" prompt on production HTTPS)
function agentLogF33356(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string
) {
  if (import.meta.env.DEV !== true) return;

  const payload = {
    sessionId: "f33356",
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  };
  fetch("http://127.0.0.1:7242/ingest/ec790500-f9a6-4150-b33b-d4ac4517adfd", {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "f33356" },
    body: JSON.stringify(payload),
  }).catch(() => {});
  try {
    const line = JSON.stringify(payload);
    const cur = typeof localStorage !== "undefined" ? localStorage.getItem("debug_f33356_log") ?? "" : "";
    if (typeof localStorage !== "undefined") {
      localStorage.setItem("debug_f33356_log", cur ? `${cur}\n${line}` : line);
    }
  } catch {
    // ignore
  }
}
// #endregion

const getRevenueCatApiKey = () => {
  const platform = Capacitor.getPlatform();
  if (platform === "ios") {
    return import.meta.env.VITE_REVENUECAT_IOS_API_KEY as string | undefined;
  }
  if (platform === "android") {
    return import.meta.env.VITE_REVENUECAT_ANDROID_API_KEY as string | undefined;
  }
  return undefined;
};

export const bootstrapRevenueCat = async (appUserId?: string | null) => {
  if (!Capacitor.isNativePlatform()) return;

  const apiKey = getRevenueCatApiKey();
  if (!apiKey) {
    console.warn("[RevenueCat] Missing platform API key. Skipping setup.");
    return;
  }

  try {
    if (!hasConfigured) {
      await Purchases.setLogLevel({
        level: import.meta.env.DEV ? LOG_LEVEL.DEBUG : LOG_LEVEL.INFO,
      });

      await Purchases.configure({
        apiKey,
        appUserID: appUserId ?? undefined,
      });

      hasConfigured = true;
      configuredAppUserId = appUserId ?? null;
      return;
    }

    const nextUserId = appUserId ?? null;
    if (nextUserId === configuredAppUserId) return;

    if (nextUserId) {
      await Purchases.logIn({ appUserID: nextUserId });
      configuredAppUserId = nextUserId;
      return;
    }

    await Purchases.logOut();
    configuredAppUserId = null;
  } catch (error) {
    console.error("[RevenueCat] Bootstrap failed:", error);
  }
};

export const hasRevenueCatEntitlement = async (entitlementId: string) => {
  if (!Capacitor.isNativePlatform()) return false;

  try {
    const { customerInfo } = await Purchases.getCustomerInfo();
    return typeof customerInfo.entitlements.active[entitlementId] !== "undefined";
  } catch (error) {
    console.error("[RevenueCat] Failed to fetch customer info:", error);
    return false;
  }
};

export const presentRevenueCatPaywall = async (
  appUserId?: string | null,
  paywallOptions?: PresentPaywallOptions
): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;

  const platform = Capacitor.getPlatform();
  const apiKey = getRevenueCatApiKey();
  const hasApiKey = !!apiKey;
  const compatBilling: BillingPeriod = paywallOptions?.billingPeriod ?? "monthly";
  debugLog({
    location: "revenueCat.ts:presentPaywall",
    message: "presentRevenueCatPaywall entry",
    data: {
      platform,
      isNative: Capacitor.isNativePlatform(),
      hasApiKey,
      compatBillingRequested: compatBilling,
    },
    hypothesisId: "H3",
  });

  if (!hasApiKey) {
    lastPaywallError = "No RevenueCat API key configured.";
    console.warn("[RevenueCat] No API key; skipping presentPaywall to avoid native crash.");
    return false;
  }

  lastPaywallError = null;
  try {
    const userId = appUserId ?? configuredAppUserId ?? undefined;
    await bootstrapRevenueCat(userId ?? null);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      lastPaywallError = "RevenueCat could not be configured.";
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "RevenueCat not configured",
        data: { lastPaywallError },
        hypothesisId: "H3",
      });
      return false;
    }

    const iosMajor = await getIosMajorVersionForNative();
    const useRcUi = await shouldUseRevenueCatPaywallUi();
    /** Same floor as Manage billing (25): never RevenueCat SwiftUI paywall on unknown or below that major. */
    const iosHardBlockRcUi =
      platform === "ios" && (iosMajor == null || iosMajor < IOS_REVENUECAT_UI_MIN_MAJOR);
    // #region agent log
    agentLogF33356(
      "revenueCat.ts:presentPaywall:branch",
      "iOS paywall path",
      {
        iosMajor,
        useRcUi,
        iosHardBlockRcUi,
        rcUiMinMajor: IOS_REVENUECAT_UI_MIN_MAJOR,
        platform,
      },
      "H1"
    );
    // #endregion

    if (platform === "ios" && (!useRcUi || iosHardBlockRcUi)) {
      const { purchasePremiumViaNativeStoreKit } = await import("@/lib/nativeIosPremiumPurchase");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compat",
        "StoreKit direct (skip RevenueCat UI)",
        { plan: compatBilling },
        "H1"
      );
      // #endregion
      const outcome = await purchasePremiumViaNativeStoreKit(compatBilling);
      if (outcome.success) {
        lastPaywallError = null;
        // #region agent log
        agentLogF33356("revenueCat.ts:presentPaywall:compatResult", "compat purchase ok", {}, "H4");
        // #endregion
        return true;
      }
      const rawErr = outcome.error ?? "";
      lastPaywallError =
        rawErr === "cancelled"
          ? "Cancelled"
          : rawErr || "Purchase was not completed.";
      const fallbackToRcUi =
        rawErr.includes("Billing not supported") || rawErr.includes("Could not check billing");
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatResult",
        "compat purchase failed",
        { lastPaywallError, rawErr, fallbackToRcUi },
        "H4"
      );
      // #endregion
      if (!fallbackToRcUi) {
        return false;
      }
      if (iosHardBlockRcUi) {
        lastPaywallError =
          lastPaywallError ?? "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.";
        return false;
      }
      lastPaywallError = null;
      // #region agent log
      agentLogF33356(
        "revenueCat.ts:presentPaywall:compatToRcFallback",
        "NativePurchases billing blocked; falling back to RevenueCat paywall UI",
        {},
        "H6"
      );
      // #endregion
    }

    try {
      await Purchases.getOfferings();
    } catch (offeringsErr) {
      const msg = (offeringsErr as Error)?.message ?? String(offeringsErr);
      lastPaywallError = msg.includes("offerings") || msg.includes("Offering")
        ? "No offerings in RevenueCat. Add a default offering and paywall in the dashboard."
        : msg;
      debugLog({
        location: "revenueCat.ts:presentPaywall",
        message: "getOfferings failed",
        data: { lastPaywallError, raw: msg },
        hypothesisId: "H3",
      });
      console.error("[RevenueCat] getOfferings failed:", offeringsErr);
      return false;
    }

    await new Promise((r) => setTimeout(r, 150));

    // #region agent log
    agentLogF33356("revenueCat.ts:presentPaywall:beforeRcUi", "calling RevenueCatUI.presentPaywall", {}, "H2");
    // #endregion
    const { RevenueCatUI, PAYWALL_RESULT } = await import("@revenuecat/purchases-capacitor-ui");
    const { result } = await RevenueCatUI.presentPaywall({
      offering: { identifier: "Production Offering" },
    } as import("@revenuecat/purchases-capacitor-ui").PresentPaywallOptions);
    const resultStr = String(result);
    const failReason =
      result === PAYWALL_RESULT.NOT_PRESENTED
        ? "Not presented"
        : result === PAYWALL_RESULT.ERROR
          ? "Paywall error"
          : result === PAYWALL_RESULT.CANCELLED
            ? "Cancelled"
            : result !== PAYWALL_RESULT.PURCHASED && result !== PAYWALL_RESULT.RESTORED
              ? `Unknown result: ${resultStr}`
              : null;
    if (failReason) lastPaywallError = failReason;
    debugLog({
      location: "revenueCat.ts:presentResult",
      message: "presentPaywall result",
      data: { result: resultStr, failReason, lastPaywallError: lastPaywallError ?? undefined },
      hypothesisId: "H2",
    });

    switch (result) {
      case PAYWALL_RESULT.NOT_PRESENTED:
      case PAYWALL_RESULT.ERROR:
      case PAYWALL_RESULT.CANCELLED:
        lastPaywallError = result === PAYWALL_RESULT.ERROR ? "Paywall error" : result === PAYWALL_RESULT.CANCELLED ? "Cancelled" : "Not presented";
        return false;
      case PAYWALL_RESULT.PURCHASED:
      case PAYWALL_RESULT.RESTORED:
        lastPaywallError = null;
        return true;
      default:
        lastPaywallError = "Unknown result";
        return false;
    }
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    lastPaywallError = errMsg;
    debugLog({ location: "revenueCat.ts:presentCatch", message: "presentRevenueCatPaywall catch", data: { err: String((error as Error)?.message ?? error) }, hypothesisId: "H2" });
    console.error("[RevenueCat] Failed to present paywall:", error);
    return false;
  }
};

/** Onboarding prefs to send so backend can write to user_preferences, profiles, and user_plans (iOS path). */
interface OnboardingPrefsPayload {
  selected_character?: string | null;
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
}

/** Gather onboarding prefs from localStorage + optional onboarding session (for iOS so backend can write user_preferences/profiles). */
async function gatherOnboardingPrefs(): Promise<OnboardingPrefsPayload | null> {
  const validCharacters = ["river", "sage", "rose", "oliver"];
  const selectedFromStorage = typeof localStorage !== "undefined" ? localStorage.getItem("selectedCharacter") : null;
  const selected_character =
    selectedFromStorage && validCharacters.includes(selectedFromStorage.toLowerCase())
      ? selectedFromStorage.toLowerCase()
      : null;

  let session: {
      character_id?: string | null;
      first_name?: string | null;
      username?: string | null;
      phone?: string | null;
      app_notifications_consent?: boolean | null;
      email_consent?: boolean | null;
      sms_consent?: boolean | null;
      onboarding_answers?: Record<string, unknown> | null;
    } | null = null;

  try {
    const storedRaw = typeof localStorage !== "undefined" ? localStorage.getItem("onboarding_session") : null;
    if (storedRaw) {
      const stored = JSON.parse(storedRaw) as { sessionId?: string; resumeToken?: string };
      if (stored?.sessionId && stored?.resumeToken) {
        const { data } = await supabase.functions.invoke("get-onboarding-session", {
          body: { sessionId: stored.sessionId, resumeToken: stored.resumeToken },
        });
        if (data?.session) session = data.session as typeof session;
      }
    }
  } catch {
    // ignore
  }

  const prefs: OnboardingPrefsPayload = {};
  const char = (session?.character_id ?? selected_character)?.toLowerCase();
  if (char && validCharacters.includes(char)) prefs.selected_character = char;

  if (session?.first_name != null) prefs.first_name = session.first_name;
  if (session?.username != null) prefs.username = session.username;
  if (session?.phone != null) prefs.phone = session.phone;
  if (session?.app_notifications_consent != null) prefs.app_notifications_enabled = session.app_notifications_consent;
  if (session?.email_consent != null) prefs.email_marketing = session.email_consent;
  if (session?.sms_consent != null) prefs.texts_enabled = session.sms_consent;
  if (session?.onboarding_answers != null) prefs.onboarding_answers = session.onboarding_answers;
  prefs.preferred_send_window = "both";

  // Embody daily practices (exactly five), captured during setup flow.
  try {
    const rawDraft = typeof localStorage !== "undefined" ? localStorage.getItem("sv_setup_draft_v1") : null;
    if (rawDraft) {
      const parsed = JSON.parse(rawDraft) as { embodyDailyPractices?: unknown };
      const { mapOnboardingEmbodyKeysToAppSlugs } = await import("@/lib/embodyPracticesCatalog");
      const slugs = mapOnboardingEmbodyKeysToAppSlugs(parsed?.embodyDailyPractices);
      if (slugs) prefs.embody_active_practices = slugs;
    }
  } catch {
    // ignore
  }

  if (Object.keys(prefs).length === 0) return null;
  return prefs;
}

const APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS = 6 * 60 * 60 * 1000;
const appleRcBillingSyncStorageKey = (userId: string) => `apple_rc_billing_sync_${userId}`;

function isAppleOrRevenueCatBilledPlan(row: {
  last_payment_source?: string | null;
  stripe_customer_id?: string | null;
} | null): boolean {
  if (!row) return false;
  const cid = row.stripe_customer_id ?? "";
  return (
    row.last_payment_source === "apple" ||
    cid.startsWith("apple:") ||
    cid.startsWith("revenuecat:")
  );
}

/**
 * For users billed via Apple / RevenueCat, refresh user_plans (e.g. current_period_end) via the
 * sync-revenuecat-entitlement Edge Function. Safe on web/PWA and native; no-op for Stripe-only users.
 */
export async function refreshAppleRevenueCatPlanOnServer(
  mode: "session_start" | "background" = "session_start",
): Promise<void> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) return;

  const uid = session.user.id;

  const { data: plan, error } = await supabase
    .from("user_plans")
    .select("last_payment_source, stripe_customer_id")
    .eq("user_id", uid)
    .maybeSingle();

  if (error || !isAppleOrRevenueCatBilledPlan(plan)) return;

  if (mode === "background") {
    const raw = sessionStorage.getItem(appleRcBillingSyncStorageKey(uid));
    if (raw) {
      const ts = parseInt(raw, 10);
      if (!Number.isNaN(ts) && Date.now() - ts < APPLE_REVENUECAT_BILLING_SYNC_THROTTLE_MS) return;
    }
  }

  try {
    const { error: invokeErr } = await supabase.functions.invoke("sync-revenuecat-entitlement", { method: "POST" });
    if (invokeErr) {
      console.warn("[Billing] RevenueCat server sync:", invokeErr.message);
      return;
    }
    try {
      sessionStorage.setItem(appleRcBillingSyncStorageKey(uid), String(Date.now()));
    } catch {
      /* ignore */
    }
  } catch (e) {
    console.warn("[Billing] RevenueCat server sync failed:", e);
  }
}

/**
 * Push StoreKit state to RevenueCat, then sync `user_plans` via `sync-revenuecat-entitlement`.
 * Use after Capgo NativePurchases purchase/restore or RC paywall purchase so the edge function sees an up-to-date subscriber.
 */
export const syncRevenueCatEntitlementToBackend = async (): Promise<boolean> => {
  if (!Capacitor.isNativePlatform()) return false;
  const plat = Capacitor.getPlatform();
  if (plat !== "ios" && plat !== "android") return false;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      console.warn("[RevenueCat] Backend sync skipped: no session.");
      return false;
    }

    await bootstrapRevenueCat(session.user.id);

    const { isConfigured } = await Purchases.isConfigured();
    if (!isConfigured) {
      console.warn("[RevenueCat] Not configured; cannot sync entitlement to backend.");
      return false;
    }

    try {
      await Purchases.syncPurchases();
    } catch (e) {
      console.warn("[RevenueCat] syncPurchases failed (continuing with edge sync):", e);
    }

    const onboarding_prefs = await gatherOnboardingPrefs();
    const body: Record<string, unknown> = {};
    if (onboarding_prefs && Object.keys(onboarding_prefs).length > 0) {
      body.onboarding_prefs = onboarding_prefs;
    }
    const { error, data } = await supabase.functions.invoke("sync-revenuecat-entitlement", {
      method: "POST",
      body,
    });

    const payload = data as {
      success?: boolean;
      active?: boolean;
      downgraded?: boolean;
      preservedExisting?: boolean;
      preservedStripeBilling?: boolean;
      error?: string;
    } | null;

    const syncOk =
      !error &&
      !payload?.downgraded &&
      (payload?.preservedExisting === true ||
        payload?.preservedStripeBilling === true ||
        (payload?.success === true && payload?.active === true));

    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: syncOk ? "sync ok" : "sync failed",
      data: {
        invokeError: error?.message ?? null,
        dataBody: data ?? null,
      },
      hypothesisId: "H5",
    });

    if (!syncOk) {
      const errMsg = payload?.error || error?.message || String(error ?? "Sync rejected");
      console.error("[RevenueCat] Backend entitlement sync failed:", error || payload?.error, "data:", data);
      return false;
    }

    return true;
  } catch (error) {
    const errMsg = String((error as Error)?.message ?? error);
    debugLog({
      location: "revenueCat.ts:syncToBackend",
      message: "sync exception",
      data: { err: errMsg },
      hypothesisId: "H5",
    });
    console.error("[RevenueCat] Entitlement sync exception:", error);
    return false;
  }
};

const POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS = 500;
const POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS = 500;

/** Short settle delay, then repeated `syncRevenueCatEntitlementToBackend` (post–StoreKit / RC paywall). */
export async function syncRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_ENTITLEMENT_RETRY_DELAY_MS));
  }
  return false;
}
```

## supabase/functions/_shared/manifestationLexicon.ts

```typescript
/**
 * Shared manifestation-community vocabulary for AI prompts (edge functions only).
 */

/** Interpret "SP" / "sp" consistently across chat, belief work, and affirmations. */
export const SP_SPECIFIC_PERSON_FOR_PROMPTS =
  'When the user writes "SP" or "sp" in relationship or manifestation contexts, interpret it as **specific person**: a particular individual they are focusing on (commonly a love interest or romantic connection), not unrelated meanings such as "sales prospect" unless the surrounding text clearly indicates otherwise.';

/** Block inserted into Belief Work guardrails (and moderation that shares them). */
export const USER_TERMINOLOGY_MANIFESTATION_NICHE_BLOCK = `USER TERMINOLOGY (manifestation niche)

${SP_SPECIFIC_PERSON_FOR_PROMPTS}`;
```

## supabase/functions/_shared/revenueCatSecretEnv.ts

```typescript
/**
 * RevenueCat REST API secret (`sk_...`) for Edge Functions.
 * Standard Supabase secret name: `REVENUECAT_SECRET_KEY`.
 * Also accepts `revenuecat_secret_key` for projects that created the secret under that name.
 */
export function getRevenueCatServerSecretKey(): string | undefined {
  const primary = Deno.env.get("REVENUECAT_SECRET_KEY")?.trim();
  if (primary) return primary;
  return Deno.env.get("revenuecat_secret_key")?.trim();
}
```

## supabase/functions/_shared/revenuecatUserPlansSync.ts

```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type SupabaseServiceClient = ReturnType<typeof createClient>;

export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";
export const REVENUECAT_API = "https://api.revenuecat.com/v1/subscribers";

/** Parse user_plans.current_period_end → ms, or NaN. */
function parsePeriodEndMs(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return NaN;
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * RC entitlement expiry for max() comparison. Empty expires_date ⇒ still subscribed (treat as +∞).
 */
function revenueCatEntitlementExpiresEndMs(entitlement: RevenueCatEntitlement): number {
  if (entitlement.expires_date == null || String(entitlement.expires_date).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }
  const t = new Date(String(entitlement.expires_date)).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export interface RevenueCatEntitlement {
  expires_date?: string | null;
  product_identifier?: string;
  purchase_date?: string;
  /** Trial / intro / normal — RevenueCat REST (often lowercase). */
  period_type?: string | null;
}

export interface RevenueCatSubscriptionEntry {
  period_type?: string | null;
  expires_date?: string | null;
  /** e.g. APP_STORE, PLAY_STORE — RevenueCat REST subscriber.subscriptions[productId].store */
  store?: string | null;
  store_transaction_id?: string | null;
  original_store_transaction_id?: string | null;
}

export interface RevenueCatSubscriberResponse {
  subscriber?: {
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscriptionEntry>;
  };
}

function normPeriodType(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Initial profile → user_plans copy only when this column on user_plans is not set yet (later RC syncs do not replace). */
function userPlansIdentityUnset(v: unknown): boolean {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/** Sticky signal from RC snapshot: any subscription row or entitlement shows trial period type. */
export function revenueCatIndicatesHadTrialFromSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (ent && normPeriodType(ent.period_type) === "trial") return true;

  const subs = subscriber?.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const entry = subs[key];
    if (!entry || typeof entry !== "object") continue;
    if (normPeriodType(entry.period_type) === "trial") return true;
  }
  return false;
}

function subscriptionExpiresMs(entry: RevenueCatSubscriptionEntry): number {
  const raw = entry.expires_date;
  if (raw == null || raw === "") return NaN;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * True if the Palette Plotting entitlement is active and RC reports the current period is a free trial
 * (entitlement.period_type or the linked subscription row).
 */
export function revenueCatOnTrialNow(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  nowMs: number,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (!ent) return false;
  const entActive =
    ent.expires_date == null || ent.expires_date === "" || new Date(String(ent.expires_date)).getTime() > nowMs;
  if (!entActive) return false;

  if (normPeriodType(ent.period_type) === "trial") return true;

  const pid = ent.product_identifier;
  if (pid && subscriber?.subscriptions?.[pid]) {
    const sub = subscriber.subscriptions[pid]!;
    const subMs = subscriptionExpiresMs(sub);
    const subActive = Number.isNaN(subMs) || subMs > nowMs;
    if (subActive && normPeriodType(sub.period_type) === "trial") return true;
  }

  return false;
}

/** Webhook event fields (uppercase TRIAL in docs) — trial start or conversion off trial still counts as ever had trial. */
export function webhookEventImpliesHadTrial(event: Record<string, unknown>): boolean {
  if (normPeriodType(event.period_type) === "trial") return true;
  if (event.is_trial_conversion === true) return true;
  return false;
}

function normalizedRevenueCatStore(store: unknown): string {
  return String(store ?? "").trim().toUpperCase().replace(/-/g, "_");
}

function isAppleStoreFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "APP_STORE" || s === "MAC_APP_STORE";
}

/**
 * Apple transaction id for user_plans.apple_customer_id from GET /subscribers (subscription row for entitlement product).
 * Prefers original_store_transaction_id when present (stable across renewals), else store_transaction_id.
 */
export function appleCustomerIdFromRevenueCatSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): string | null {
  if (!subscriber) return null;
  const ent = subscriber.entitlements?.[entitlementId];
  const pid = ent?.product_identifier?.trim();
  if (!pid) return null;
  const sub = subscriber.subscriptions?.[pid] as RevenueCatSubscriptionEntry | undefined;
  if (!sub || typeof sub !== "object") return null;
  if (!isAppleStoreFromRcStore(sub.store)) return null;
  const orig = sub.original_store_transaction_id?.trim();
  if (orig) return orig;
  const cur = sub.store_transaction_id?.trim();
  if (cur) return cur;
  return null;
}

/** Webhook payload may include transaction ids when store is App Store. */
function appleCustomerIdFromWebhookEvent(event: Record<string, unknown>): string | null {
  if (!isAppleStoreFromRcStore(event.store)) return null;
  const o = event.original_transaction_id;
  const t = event.transaction_id;
  if (typeof o === "string" && o.trim()) return o.trim();
  if (typeof t === "string" && t.trim()) return t.trim();
  const st = event.store_transaction_id;
  if (typeof st === "string" && st.trim()) return st.trim();
  return null;
}

export async function fetchRevenueCatSubscriber(
  secretKey: string,
  appUserId: string,
): Promise<{ ok: true; data: RevenueCatSubscriberResponse } | { ok: false; status: number; body: string }> {
  const encodedId = encodeURIComponent(appUserId);
  const rcRes = await fetch(`${REVENUECAT_API}/${encodedId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!rcRes.ok) {
    const body = await rcRes.text();
    return { ok: false, status: rcRes.status, body };
  }
  const data = (await rcRes.json()) as RevenueCatSubscriberResponse;
  return { ok: true, data };
}

export type RevenueCatSyncResult =
  /** `preservedStripe`: after sync, row uses real Stripe `cus_`/`sub_` + `last_payment_source: stripe` (latest expiry vs RC favored Stripe identity). */
  | { ok: true; active: true; preservedStripe: true }
  | { ok: true; active: true; preservedStripe?: false }
  | { ok: true; active: false; preservedExistingPlan: true }
  | { ok: true; active: false; downgraded?: boolean }
  | { ok: false; error: string };

/**
 * Applies RevenueCat subscriber payload to user_plans (same fields as client sync-revenuecat-entitlement).
 * Active entitlement: compares Stripe `current_period_end` vs RC entitlement end; **latest expiry wins** for
 * `current_period_end` and for billing identity: sets `stripe_customer_id`, `stripe_subscription_id`, and
 * `last_payment_source` together (Stripe `cus_`/`sub_` vs RC placeholders) so rows stay consistent.
 * Does not read or write `stripe_customer_id_official` — documentation-only (Stripe checkout).
 * When entitlement is inactive: if DB still shows active with a future current_period_end, leaves row unchanged.
 * Otherwise marks canceled, keeping last period end when possible.
 */
export async function syncUserPlansFromRevenueCatPayload(
  supabase: SupabaseServiceClient,
  appUserId: string,
  rcData: RevenueCatSubscriberResponse,
  opts: { webhookEvent?: Record<string, unknown> },
): Promise<RevenueCatSyncResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const entitlement = rcData.subscriber?.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  const isActive =
    !!entitlement &&
    (entitlement.expires_date == null ||
      entitlement.expires_date === "" ||
      new Date(entitlement.expires_date) > now);

  const { data: existingBeforeRc } = await supabase
    .from("user_plans")
    .select(
      "last_payment_source, stripe_customer_id, stripe_subscription_id, status, current_period_end, had_trial, on_trial",
    )
    .eq("user_id", appUserId)
    .maybeSingle();

  const appleCustomerId =
    appleCustomerIdFromRevenueCatSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID) ??
    (opts.webhookEvent ? appleCustomerIdFromWebhookEvent(opts.webhookEvent) : null);

  if (!isActive) {
    if (!existingBeforeRc) {
      return { ok: true, active: false };
    }
    const rowForPreserve = existingBeforeRc as {
      status?: string | null;
      current_period_end?: string | null;
    };
    const periodEndMsForPreserve = rowForPreserve.current_period_end
      ? new Date(rowForPreserve.current_period_end).getTime()
      : NaN;
    const hasFuturePeriodInDb =
      !Number.isNaN(periodEndMsForPreserve) && periodEndMsForPreserve > nowMs;
    const isActiveStatusInDb = rowForPreserve.status === "active";
    if (isActiveStatusInDb && hasFuturePeriodInDb) {
      console.error(
        "[revenuecatUserPlansSync] RC inactive but user_plans active with future period; leaving row unchanged",
      );
      return { ok: true, active: false, preservedExistingPlan: true };
    }

    const hadTrial = Boolean((existingBeforeRc as { had_trial?: boolean | null }).had_trial);
    let periodEndToKeep: string | null = null;
    const rawExp = entitlement?.expires_date;
    if (rawExp != null && String(rawExp).trim() !== "") {
      const d = new Date(String(rawExp));
      if (Number.isFinite(d.getTime())) periodEndToKeep = d.toISOString();
    }
    if (!periodEndToKeep) {
      const existingEnd = (existingBeforeRc as { current_period_end?: string | null }).current_period_end;
      if (existingEnd) periodEndToKeep = existingEnd;
    }
    // Do not set tier to "basic" — keep monthly/annual for reactivation UX. Keep last period end instead of null.
    const prevLps = (existingBeforeRc as { last_payment_source?: string | null }).last_payment_source;
    const lastPaymentSource =
      prevLps === "stripe" || prevLps === "apple" ? prevLps : "apple";
    const { error: downErr } = await supabase
      .from("user_plans")
      .update({
        status: "canceled",
        last_payment_source: lastPaymentSource,
        ...(periodEndToKeep != null ? { current_period_end: periodEndToKeep } : {}),
        ...(appleCustomerId != null ? { apple_customer_id: appleCustomerId } : {}),
        updated_at: now.toISOString(),
        had_trial: hadTrial,
        on_trial: false,
      })
      .eq("user_id", appUserId);
    if (downErr) {
      console.error("[revenuecatUserPlansSync] downgrade error:", downErr);
      return { ok: false, error: downErr.message };
    }
    return { ok: true, active: false, downgraded: true };
  }

  const productId = (entitlement!.product_identifier ?? "").toLowerCase();
  const billing = productId.includes("annual")
    ? "annual"
    : productId.includes("weekly")
      ? "weekly"
      : "monthly";

  const dbEndMs = parsePeriodEndMs(
    (existingBeforeRc as { current_period_end?: string | null } | null)?.current_period_end,
  );
  const rcEndRaw = revenueCatEntitlementExpiresEndMs(entitlement!);
  const stripeComparable = Number.isFinite(dbEndMs) ? dbEndMs : Number.NEGATIVE_INFINITY;
  const rcComparable = rcEndRaw === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : (Number.isFinite(rcEndRaw) ? rcEndRaw : Number.NEGATIVE_INFINITY);

  const mergedEndMs = Math.max(stripeComparable, rcComparable);
  const finalPeriodEndIso =
    mergedEndMs === Number.POSITIVE_INFINITY || !Number.isFinite(mergedEndMs)
      ? null
      : new Date(mergedEndMs).toISOString();

  const ex = existingBeforeRc as {
    last_payment_source?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
  /** Both required to keep a coherent Stripe row (portal + webhooks resolve by `sub_`). */
  const hasFullStripeIds =
    !!ex?.stripe_customer_id?.trim().startsWith("cus_") &&
    !!ex?.stripe_subscription_id?.trim().startsWith("sub_");

  /** Apple/RC placeholders win when RC expiry is later, or we lack real Stripe ids to compare. */
  let billingIsApple: boolean;
  if (!hasFullStripeIds) {
    billingIsApple = true;
  } else if (rcComparable > stripeComparable) {
    billingIsApple = true;
  } else if (stripeComparable > rcComparable) {
    billingIsApple = false;
  } else {
    // Tie: prefer existing Stripe-backed row when `last_payment_source` is already stripe
    billingIsApple = ex?.last_payment_source !== "stripe";
  }

  const rcHadTrialSnapshot = revenueCatIndicatesHadTrialFromSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID);
  const eventHintHadTrial = opts.webhookEvent ? webhookEventImpliesHadTrial(opts.webhookEvent) : false;
  const hadTrialMerged =
    Boolean((existingBeforeRc as { had_trial?: boolean | null } | null)?.had_trial) ||
    rcHadTrialSnapshot ||
    eventHintHadTrial;

  const onTrialNow = revenueCatOnTrialNow(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID, nowMs);

  let userEmail: string | null = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(appUserId);
    userEmail = authData.user?.email ?? null;
  } catch {
    /* non-fatal */
  }

  // Billing columns on upsert (omit stripe_customer_id_official — documentation column only).
  const planData: Record<string, unknown> = {
    user_id: appUserId,
    tier: "premium",
    billing_period: billing,
    status: "active",
    current_period_end: finalPeriodEndIso,
    updated_at: now.toISOString(),
    had_trial: hadTrialMerged,
    on_trial: onTrialNow,
  };
  if (billingIsApple) {
    planData.stripe_customer_id = `revenuecat:${appUserId}`;
    planData.stripe_subscription_id = `rc_${appUserId}`;
    planData.last_payment_source = "apple";
  } else {
    planData.stripe_customer_id = ex!.stripe_customer_id;
    planData.stripe_subscription_id = ex!.stripe_subscription_id ?? null;
    planData.last_payment_source = "stripe";
  }
  if (appleCustomerId != null) planData.apple_customer_id = appleCustomerId;

  const { error: planError } = await supabase.from("user_plans").upsert(planData, {
    onConflict: "user_id",
  });
  if (planError) {
    console.error("[revenuecatUserPlansSync] upsert error:", planError);
    return { ok: false, error: planError.message };
  }

  try {
    const [{ data: planRow }, { data: prof }] = await Promise.all([
      supabase
        .from("user_plans")
        .select("first_name, username, phone, email")
        .eq("user_id", appUserId)
        .maybeSingle(),
      supabase.from("profiles").select("first_name, username, phone, email").eq("id", appUserId).maybeSingle(),
    ]);
    const identityPatch: Record<string, unknown> = {};
    if (planRow && prof) {
      if (userPlansIdentityUnset(planRow.first_name) && prof.first_name != null && String(prof.first_name).trim() !== "") {
        identityPatch.first_name = prof.first_name;
      }
      if (userPlansIdentityUnset(planRow.username) && prof.username != null && String(prof.username).trim() !== "") {
        identityPatch.username = prof.username;
      }
      if (userPlansIdentityUnset(planRow.phone) && prof.phone != null && String(prof.phone).trim() !== "") {
        identityPatch.phone = prof.phone;
      }
      if (userPlansIdentityUnset(planRow.email) && prof.email != null && String(prof.email).trim() !== "") {
        identityPatch.email = prof.email;
      }
    }
    if (Object.keys(identityPatch).length > 0) {
      const { error: idErr } = await supabase.from("user_plans").update(identityPatch).eq("user_id", appUserId);
      if (idErr) console.warn("[revenuecatUserPlansSync] profile mirror to user_plans failed (non-fatal):", idErr);
    }
  } catch (e) {
    console.warn("[revenuecatUserPlansSync] profile mirror to user_plans exception (non-fatal):", e);
  }

  const preservedStripe = !billingIsApple;
  return { ok: true, active: true, preservedStripe };
}
```

## supabase/functions/_shared/supportCategories.ts

```typescript
/**
 * Canonical weekly-goal / affirmation focus ids (DB, parsing) vs user-facing labels (UI, chat tone).
 * Keep in sync with `src/lib/affirmations-data.ts` SUPPORT_CATEGORIES.
 */
export const MANIFESTATION_FOCUS_CATEGORIES: readonly { canonical: string; label: string }[] = [
  { canonical: "Connections", label: "Love / SP" },
  { canonical: "Self-Love", label: "Beauty / Glow Up" },
  { canonical: "Confidence", label: "Self-Concept" },
  { canonical: "Finances", label: "Money" },
  { canonical: "Productivity", label: "Focus" },
  { canonical: "Organization", label: "Life Reset" },
  { canonical: "Fitness", label: "Body / Fitness" },
  { canonical: "Nutrition", label: "Wellness" },
  { canonical: "Discipline", label: "Discipline" },
  { canonical: "Career", label: "Career" },
  { canonical: "Business", label: "Business" },
  { canonical: "Learning", label: "School / Exams" },
] as const;

export const CANONICAL_MANIFESTATION_FOCUS_IDS = MANIFESTATION_FOCUS_CATEGORIES.map((r) => r.canonical);

function compactKey(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

export function displayLabelForCanonical(canonical: string | null | undefined): string {
  if (!canonical) return "";
  const row = MANIFESTATION_FOCUS_CATEGORIES.find((r) => r.canonical === canonical);
  return row?.label ?? canonical;
}

/** For model context: readable label plus stable id used in storage. */
export function formatCanonicalForPrompt(canonical: string): string {
  if (!canonical || canonical === "Uncategorized") return canonical;
  const label = displayLabelForCanonical(canonical);
  return label === canonical ? canonical : `${label} [${canonical}]`;
}

/**
 * Map a fragment from the assistant's confirmation ("under …") to a canonical id.
 * Accepts either canonical names or UI labels (spacing / punctuation tolerant).
 */
export function resolveWeeklyGoalCategoryFromAiText(fragment: string): string | null {
  const t = fragment.trim();
  if (!t) return null;
  const lower = t.toLowerCase();
  const key = compactKey(t);
  for (const row of MANIFESTATION_FOCUS_CATEGORIES) {
    if (row.canonical.toLowerCase() === lower) return row.canonical;
    if (row.label.toLowerCase() === lower) return row.canonical;
    if (compactKey(row.canonical) === key) return row.canonical;
    if (compactKey(row.label) === key) return row.canonical;
  }
  return null;
}

export const MANIFESTATION_FOCUS_CATEGORY_PROMPT = `
MANIFESTATION FOCUS AREAS (12) — user-facing label, then canonical id in brackets:
• Love / SP [Connections]
• Beauty / Glow Up [Self-Love]
• Self-Concept [Confidence]
• Money [Finances]
• Focus [Productivity]
• Life Reset [Organization]
• Body / Fitness [Fitness]
• Wellness [Nutrition]
• Discipline [Discipline]
• Career [Career]
• Business [Business]
• School / Exams [Learning]
`.trim();
```

## supabase/functions/claim-onboarding-session/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/** Inlined: deploy bundle does not reliably include `../_shared/` (matches app embody slug set). */
const EMBODY_ACTIVE_SLUGS = new Set([
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
]);

function normalizeEmbodyActivePractices(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  const cleaned: string[] = [];
  for (const x of value) {
    if (typeof x !== "string") return null;
    const s = x.trim();
    if (!EMBODY_ACTIVE_SLUGS.has(s)) return null;
    cleaned.push(s);
  }
  if (new Set(cleaned).size !== 5) return null;
  return cleaned;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

const SHELL_APPEARANCES = ["light", "dark"] as const;

function pickShellAppearance(value: unknown): string | null {
  return typeof value === "string" && (SHELL_APPEARANCES as readonly string[]).includes(value) ? value : null;
}

function pickGuideCharacterId(value: unknown): string | null {
  return typeof value === "string" && ["river", "sage", "rose", "oliver"].includes(value) ? value : null;
}

type ActivationProfile = {
  firstName?: string | null;
  username?: string | null;
  emailMarketingConsent?: boolean | null;
  smsMarketingConsent?: boolean | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { sessionId, resumeToken, checkoutSessionId, profile } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: obSession, error: obErr } = await supabase
      .from("onboarding_sessions")
      .select(
        "id,resume_token_hash,status,email,first_name,username,email_consent,sms_consent,character_id,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (obErr || !obSession) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (obSession.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent a paid session from being claimed by a different user once linked
    // But allow idempotent claims by the same user (in case of retries or partial completions)
    if (obSession.user_id) {
      if (obSession.user_id !== user.id) {
        console.error("Session already claimed by different user", {
          sessionUserId: obSession.user_id,
          currentUserId: user.id,
          sessionId: sessionId
        });
        return new Response(JSON.stringify({ error: "Session already claimed by another user" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Session already claimed by this user - allow idempotent completion
        console.log("Session already claimed by this user, completing activation idempotently", {
          userId: user.id,
          sessionId: sessionId,
          sessionStatus: obSession.status
        });
      }
    }

    const csId = String(checkoutSessionId || obSession.stripe_checkout_session_id || "");
    if (!csId) {
      return new Response(JSON.stringify({ error: "Missing Stripe checkout session id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Stripe checkout session (authoritative) and verify it belongs to this onboarding session
    const csResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${csId}`, {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
    });

    if (!csResp.ok) {
      const txt = await csResp.text();
      console.error("Stripe checkout session fetch failed:", txt);
      return new Response(JSON.stringify({ error: "Unable to verify payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cs = await csResp.json();
    const clientRef = cs.client_reference_id;
    if (clientRef && String(clientRef) !== String(sessionId)) {
      return new Response(JSON.stringify({ error: "Checkout session does not match onboarding session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (cs.payment_status !== "paid") {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId: string | null = typeof cs.customer === "string" ? cs.customer : cs.customer?.id || null;
    const subscriptionId: string | null =
      typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id || null;

    const tierFromStripe = cs.metadata?.tier as "basic" | "plus" | "premium" | undefined;
    const billingFromStripe = cs.metadata?.billing as "monthly" | "annual" | undefined;
    const tier = (obSession.selected_tier || tierFromStripe) as "basic" | "plus" | "premium" | null;
    const billing = (obSession.billing || billingFromStripe) as "monthly" | "annual" | null;

    if (!tier || !["basic", "plus", "premium"].includes(tier)) {
      return new Response(JSON.stringify({ error: "Missing tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine current_period_end (for subscription mode)
    let currentPeriodEndIso: string | null = null;
    let subscriptionStatus: string | null = null;

    if (subscriptionId) {
      const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      if (subResp.ok) {
        const sub = await subResp.json();
        subscriptionStatus = sub.status || null;
        if (sub.current_period_end) {
          currentPeriodEndIso = new Date(sub.current_period_end * 1000).toISOString();
        }
      }
    } else if (billing === "annual") {
      // Fallback for one-time annual (not expected in current setup, but safe)
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      currentPeriodEndIso = periodEnd.toISOString();
    }

    const paidAtIso = obSession.paid_at ? new Date(obSession.paid_at).toISOString() : new Date().toISOString();
    const customerEmail =
      obSession.stripe_customer_email || cs.customer_details?.email || cs.customer_email || null;

    // 1) Attach onboarding session to user + persist stripe linkage (idempotent)
    const { error: attachErr } = await supabase
      .from("onboarding_sessions")
      .update({
        user_id: user.id,
        status: "active",
        stripe_checkout_session_id: csId,
        stripe_customer_id: customerId,
        stripe_customer_email: customerEmail,
        stripe_subscription_id: subscriptionId,
        paid_at: obSession.paid_at || paidAtIso,
        selected_tier: tier,
        billing: billing,
      })
      .eq("id", String(sessionId));

    if (attachErr) {
      console.error("Error attaching onboarding session:", attachErr);
      return new Response(JSON.stringify({ error: "Failed to activate session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Upsert entitlement (user_plans is the gating source of truth)
    const planStatus =
      subscriptionStatus === "past_due"
        ? "past_due"
        : subscriptionStatus === "canceled"
        ? "canceled"
        : "active";

    // Upsert user_plans - don't include id, let PostgreSQL generate it via DEFAULT
    // The onConflict uses user_id (which has UNIQUE constraint) to match existing rows
    const { error: planErr } = await supabase
      .from("user_plans")
      .upsert(
        {
          user_id: user.id,
          tier,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          last_payment_source: "stripe",
          status: planStatus,
          current_period_end: currentPeriodEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (planErr) {
      console.error("Error upserting user_plans:", planErr);
      return new Response(JSON.stringify({ error: "Failed to activate plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Persist onboarding data into canonical user tables
    const activationProfile = (profile || {}) as ActivationProfile;

    // Legacy JSON (e.g. support_focus) — keep on profiles.onboarding_answers where that column exists
    const mergedOnboardingAnswers: Record<string, unknown> =
      obSession.onboarding_answers && typeof obSession.onboarding_answers === "object" &&
        obSession.onboarding_answers !== null
        ? { ...(obSession.onboarding_answers as Record<string, unknown>) }
        : {};
    const legacySetupAppearance = pickShellAppearance(mergedOnboardingAnswers["setup_appearance"]);
    delete mergedOnboardingAnswers["setup_appearance"];

    const legacyJourney =
      mergedOnboardingAnswers &&
      typeof mergedOnboardingAnswers === "object" &&
      Object.prototype.hasOwnProperty.call(mergedOnboardingAnswers, "setup_journey_v1")
        ? (mergedOnboardingAnswers as Record<string, unknown>).setup_journey_v1
        : null;

    // profiles: update (or insert if missing)
    // Use first_name from onboarding_sessions if not provided in profile
    const finalFirstName = activationProfile.firstName || obSession.first_name || null;
    // Use username from onboarding_sessions column if not provided in profile
    const finalUsername = activationProfile.username || obSession.username || null;
    // Use consents from onboarding_sessions columns if not provided in profile
    const finalEmailConsent = activationProfile.emailMarketingConsent ?? obSession.email_consent ?? false;
    const finalSmsConsent = activationProfile.smsMarketingConsent ?? obSession.sms_consent ?? false;

    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: finalFirstName,
          username: finalUsername,
          onboarding_answers: mergedOnboardingAnswers,
        },
        { onConflict: "id" },
      );
    } catch (e) {
      console.warn("Non-fatal: failed to upsert profiles:", e);
    }

    // Normalized setup path → user_setup_path. Anonymous answers usually live on
    // onboarding_sessions.onboarding_answers (setup_path_v1 / setup_journey_v1); optional
    // onboarding_session_setup row is read first when that table exists.
    let embodyForUserPrefs: string[] | null = null;
    try {
      const { data: sessionPath, error: sessionPathErr } = await supabase
        .from("onboarding_session_setup")
        .select("*")
        .eq("onboarding_session_id", String(sessionId))
        .maybeSingle();

      if (sessionPathErr) {
        console.warn("onboarding_session_setup read skipped:", sessionPathErr.message);
      }

      let pathPayload: Record<string, unknown> | null = null;

      if (!sessionPathErr && sessionPath && typeof sessionPath === "object") {
        const sp = sessionPath as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof sp.first_name === "string" ? sp.first_name : null,
          email: typeof sp.email === "string" ? sp.email : null,
          desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
          desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
          why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
          current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
          desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
          tool_preferences: Array.isArray(sp.tool_preferences) ? sp.tool_preferences : [],
          conditional_specificity:
            sp.conditional_specificity && typeof sp.conditional_specificity === "object" &&
              sp.conditional_specificity !== null
              ? sp.conditional_specificity
              : {},
          shell_appearance:
            pickShellAppearance(sp.shell_appearance) ??
              pickShellAppearance((obSession as Record<string, unknown>).shell_appearance) ??
              legacySetupAppearance,
          guide_character_id:
            pickGuideCharacterId(sp.guide_character_id) ??
              pickGuideCharacterId((obSession as Record<string, unknown>).character_id),
          embody_active_practices: normalizeEmbodyActivePractices(sp.embody_active_practices),
        };
      } else if (legacyJourney && typeof legacyJourney === "object") {
        const j = legacyJourney as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof j.firstName === "string" ? j.firstName : null,
          email: typeof j.email === "string" ? j.email : null,
          desire_category: typeof j.desireCategory === "string" ? j.desireCategory : null,
          desire_text: typeof j.desireText === "string" ? j.desireText : null,
          why_it_matters: typeof j.whyItMatters === "string" ? j.whyItMatters : null,
          current_friction: typeof j.currentFriction === "string" ? j.currentFriction : null,
          desired_identity: typeof j.desiredIdentity === "string" ? j.desiredIdentity : null,
          tool_preferences: Array.isArray(j.toolPreferences)
            ? (j.toolPreferences as unknown[]).filter((x): x is string => typeof x === "string")
            : [],
          conditional_specificity:
            j.conditionalSpecificity && typeof j.conditionalSpecificity === "object" && j.conditionalSpecificity !== null
              ? j.conditionalSpecificity
              : {},
          shell_appearance:
            pickShellAppearance(j.appearance) ??
              pickShellAppearance((obSession as Record<string, unknown>).shell_appearance) ??
              legacySetupAppearance,
          guide_character_id: pickGuideCharacterId((obSession as Record<string, unknown>).character_id),
          embody_active_practices: normalizeEmbodyActivePractices(
            (j as Record<string, unknown>).embody_active_practices ??
              (j as Record<string, unknown>).embodyActivePractices,
          ),
        };
      } else if (
        typeof mergedOnboardingAnswers.setup_path_v1 === "object" &&
        mergedOnboardingAnswers.setup_path_v1 !== null
      ) {
        const sp = mergedOnboardingAnswers.setup_path_v1 as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof sp.first_name === "string" ? sp.first_name : null,
          email: typeof sp.email === "string" ? sp.email : null,
          desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
          desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
          why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
          current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
          desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
          tool_preferences: Array.isArray(sp.tool_preferences) ? sp.tool_preferences : [],
          conditional_specificity:
            sp.conditional_specificity && typeof sp.conditional_specificity === "object" &&
              sp.conditional_specificity !== null
              ? sp.conditional_specificity
              : {},
          shell_appearance:
            pickShellAppearance(sp.shell_appearance) ??
              pickShellAppearance((obSession as Record<string, unknown>).shell_appearance) ??
              legacySetupAppearance,
          guide_character_id:
            pickGuideCharacterId(sp.guide_character_id) ??
              pickGuideCharacterId((obSession as Record<string, unknown>).character_id),
          embody_active_practices: normalizeEmbodyActivePractices(sp.embody_active_practices),
        };
      }

      if (pathPayload) {
        embodyForUserPrefs = normalizeEmbodyActivePractices(pathPayload.embody_active_practices);
        const { error: pathUpsertErr } = await supabase
          .from("user_setup_path")
          .upsert(pathPayload, { onConflict: "user_id" });
        if (pathUpsertErr) {
          console.warn("Non-fatal: user_setup_path upsert failed:", pathUpsertErr);
        }
      }
    } catch (pathErr) {
      console.warn("Non-fatal: user_setup_path copy skipped:", pathErr);
    }

    // user_preferences: selected_character + comms prefs + embody (from same pathPayload as user_setup_path)
    try {
      const prefRow: Record<string, unknown> = {
        user_id: user.id,
        selected_character: obSession.character_id || null,
        texts_enabled: finalSmsConsent,
        preferred_send_window: "both",
        email_marketing: finalEmailConsent,
      };
      if (embodyForUserPrefs) prefRow.embody_active_practices = embodyForUserPrefs;

      await supabase.from("user_preferences").upsert(prefRow, { onConflict: "user_id" });
    } catch (e) {
      console.warn("Non-fatal: failed to upsert user_preferences:", e);
    }

    // character_selection_log (best-effort)
    try {
      if (obSession.character_id) {
        await supabase.from("character_selection_log").insert({
          user_id: user.id,
          selected_character: obSession.character_id,
          previous_character: null,
          source: "onboarding_paid_activation",
        });
      }
    } catch (e) {
      console.warn("Non-fatal: failed to insert character_selection_log:", e);
    }

    return new Response(JSON.stringify({ success: true, tier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in claim-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## supabase/functions/generate-affirmation-audio/index.ts

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// INLINED FROM: ../_shared/aiUsage.ts
// (Dashboard deployment can't import from _shared folder)

/**
 * Calculate cost for TTS (Textto)
 * tts-1: $15 / 1,000,000 characters
 */
function calcTtsCost(chars: number) {
  return chars * (15 / 1_000_000);
}

/**
 * Best-effort insert into ai_usage table
 * Never throws - if logging fails, the main function continues normally
 */
async function safeInsertUsage(
  supabaseAdmin: any,
  row: Record<string, any>
) {
  try {
    await supabaseAdmin.from("ai_usage").insert(row);
  } catch (_e) {
    // fail open: never throw
  }
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { affirmations, voice = 'alloy' } = await req.json();

    if (!affirmations || !Array.isArray(affirmations)) {
      throw new Error('Affirmations array is required');
    }

    // Set up Supabase client for logging (best-effort)
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Try to get user ID from auth header (optional for logging)
    let userId: string | null = null;
    const authHeader = req.headers.get('authorization');
    if (authHeader) {
      try {
        const token = authHeader.replace('Bearer ', '');
        const { data: { user } } = await supabase.auth.getUser(token);
        userId = user?.id ?? null;
      } catch (_) {
        // User extraction failed, continue without userId
      }
    }

    const OPENAI_API_KEY = Deno.env.get('Textto');
    if (!OPENAI_API_KEY) {
      throw new Error('Error. Please try again.');
    }

    // Combine affirmations with pauses between them
    const text = affirmations.join('. ... ');

    console.log('Generating TTS for:', text.substring(0, 100) + '...');

    // Generate speech from text using OpenAI TTS
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice, // alloy, echo, fable, onyx, nova, shimmer
        response_format: 'mp3',
        speed: 0.95, // Slightly slower for affirmations
      }),
    });

    if (!response.ok) {
      let errorMessage = 'Failed to generate speech';
      try {
        const error = await response.json();
        console.error('OpenAI TTS error:', error);
        errorMessage = error.error?.message || error.message || 'Failed to generate speech';
        
        // Handle specific OpenAI errors
        if (response.status === 401 || response.status === 403) {
          errorMessage = 'Authentication failed.';
        } else if (response.status === 429) {
          errorMessage = 'Limit exceeded. Please try again.';
        } else if (response.status === 400) {
          errorMessage = error.error?.message || 'Invalid request.';
        }
      } catch (parseError) {
        // If response is not JSON, try to get text
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('TTS error (non-JSON):', errorText);
        errorMessage = `Error (${response.status}): ${errorText}`;
      }
      throw new Error(errorMessage);
    }

    // Log OpenAI usage (best-effort, never throws)
    const chars = text.length;
    const totalCost = calcTtsCost(chars);
    
    await safeInsertUsage(supabase, {
      call_name: "Textto",
      user_id: userId,
      route: "/functions/v1/generate-affirmation-audio",
      model: 'tts-1',
      characters: chars,
      total_cost_usd: totalCost,
      meta: { voice: voice, format: 'mp3', speed: 0.95 }
    });

    // Convert audio buffer to base64 using Deno's standard library
    // This efficiently handles large files without stack overflow
    const arrayBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    
    // Use Deno's standard library base64 encoding (handles large buffers efficiently)
    const base64Audio = base64Encode(uint8Array);

    console.log('TTS generated successfully');

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        format: 'mp3'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  } catch (error) {
    console.error('Error in generate-affirmation-audio:', error);
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      },
    );
  }
});
```

## supabase/functions/generate-affirmations/index.ts

```typescript
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { SP_SPECIFIC_PERSON_FOR_PROMPTS } from "../_shared/manifestationLexicon.ts";
import { displayLabelForCanonical, resolveWeeklyGoalCategoryFromAiText } from "../_shared/supportCategories.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// INLINED FROM: ../_shared/aiUsage.ts
// (Dashboard deployment can't import from _shared folder)

/**
 * Calculate cost for token-based OpenAI calls (Chat, Aff, BR)
 * Returns null costs for unknown models
 */
function calcTokenCost(model: string, inputTokens: number, outputTokens: number) {
  // USD per token
  const PRICING: Record<string, { in: number; out: number }> = {
    "gpt-4o-mini": { in: 0.15 / 1_000_000, out: 0.60 / 1_000_000 },
  };

  const p = PRICING[model];
  if (!p) return { inputCost: null, outputCost: null, totalCost: null };

  const inputCost = inputTokens * p.in;
  const outputCost = outputTokens * p.out;
  return { inputCost, outputCost, totalCost: inputCost + outputCost };
}

/**
 * Best-effort insert into ai_usage table
 * Never throws - if logging fails, the main function continues normally
 */
async function safeInsertUsage(
  supabaseAdmin: any,
  row: Record<string, any>
) {
  try {
    await supabaseAdmin.from("ai_usage").insert(row);
  } catch (_e) {
    // fail open: never throw
  }
}

// Dangerous content keywords (same as BR function)
const DANGEROUS_KEYWORDS = [
  'kill', 'suicide', 'self-harm', 'harm', 'violence', 'assault', 'abuse', 'rape', 'molest',
  'sexual', 'explicit', 'porn', 'nude', 'child', 'pedo', 'racist', 'hate'
];

function containsDangerousContent(text: string): boolean {
  const lower = text.toLowerCase();
  return DANGEROUS_KEYWORDS.some(keyword => lower.includes(keyword));
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { topic, category: categoryRaw } = await req.json() as {
      topic?: string;
      category?: string;
    };

    if (!topic) {
      throw new Error('Topic is required');
    }

    const categoryCanonical =
      typeof categoryRaw === "string" && categoryRaw.trim()
        ? resolveWeeklyGoalCategoryFromAiText(categoryRaw.trim())
        : null;
    const categoryFocusLine =
      categoryCanonical != null
        ? ` The user's chosen manifestation focus for this set is: ${displayLabelForCanonical(categoryCanonical)}. Let the wording of all five affirmations clearly support that focus (without naming the app or UI labels unless natural).`
        : "";

    // Get user ID from authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Verify token and get user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authorization' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;

    // Check if user is blocked (30+ rejections in last 24 hours)
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    
    const { count: recentRejections } = await supabase
      .from('rejection_log')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('feature', 'Aff')
      .gte('rejected_at', twentyFourHoursAgo);

    if (recentRejections && recentRejections >= 30) {
      const blockUntil = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      return new Response(
        JSON.stringify({ 
          error: "This tool is temporarily unavailable due to repeated guideline violations. Access will be restored in 24 hours.",
          blocked_until: blockUntil,
          terms_link: "/terms",
          blocked: true
        }),
        { 
          status: 403, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    // Check for dangerous content
    if (containsDangerousContent(topic)) {
      // Log rejection
      await supabase.from('rejection_log').insert({
        user_id: userId,
        feature: 'Aff',
        reason: 'dangerous_content',
        input_preview: topic.substring(0, 100)
      });

      return new Response(
        JSON.stringify({ 
          error: "This title can't be processed. Please try a different topic.",
          rejected: true
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    const OPENAI_API_KEY = Deno.env.get('Aff');
    if (!OPENAI_API_KEY) {
      throw new Error('Error. Please try again.');
    }
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert at creating powerful, positive affirmations for manifestation and personal growth. Generate affirmations that are present-tense, first-person, positive, and emotionally resonant.\n\n${SP_SPECIFIC_PERSON_FOR_PROMPTS}`
          },
          {
            role: 'user',
            content: `Generate exactly 5 powerful affirmations about "${topic}".${categoryFocusLine} Each affirmation should:
- Be in present tense and first person (I am, I have, etc.)
- Be positive and empowering
- Be specific and emotionally engaging
- Be between 5-15 words

Return ONLY the 5 affirmations, one per line, with no numbering, bullets, or extra text.`
          }
        ]
      })
    });
    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded. Please try again later.'
        }), {
          status: 429,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({
          error: 'Payment required.'
        }), {
          status: 402,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        });
      }
      throw new Error(`AI API error: ${response.status}`);
    }
    const data = await response.json();
    
    // Log OpenAI usage (best-effort, never throws)
    const usage = data?.usage ?? {};
    const inputTokens = usage.input_tokens ?? 0;
    const outputTokens = usage.output_tokens ?? 0;
    const totalTokens = usage.total_tokens ?? (inputTokens + outputTokens);
    const { inputCost, outputCost, totalCost } = calcTokenCost('gpt-4o-mini', inputTokens, outputTokens);
    
    await safeInsertUsage(supabase, {
      call_name: "Aff",
      user_id: userId,
      route: "/functions/v1/generate-affirmations",
      model: 'gpt-4o-mini',
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      total_tokens: totalTokens,
      input_cost_usd: inputCost,
      output_cost_usd: outputCost,
      total_cost_usd: totalCost,
      meta: { openai_id: data?.id ?? null, topic: topic }
    });
    
    const content = data.choices?.[0]?.message?.content || '';
    // Parse the affirmations (split by newlines and filter empty)
    const affirmations = content.split('\n').map((line)=>line.trim()).filter((line)=>line.length > 0 && !line.match(/^\d+[\.\)]/)) // Remove numbering if present
    .slice(0, 5); // Ensure only 5
    return new Response(JSON.stringify({
      affirmations
    }), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Error generating affirmations:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    return new Response(JSON.stringify({
      error: sanitizeErrorMessage(error)
    }), {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
```

## supabase/functions/get-subliminal-params/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // Default safe message
  return defaultMessage;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// PROPRIETARY SUBLIMINAL AUDIO MIXING PARAMETERS
// These values are proprietary and must remain server-side

// Binaural beat frequencies for different brain states (proprietary)
const BINAURAL_FREQUENCIES = {
  delta: { base: 200, offset: 2 },    // 200 Hz base, 2 Hz beat (0.5-4 Hz deep sleep)
  theta: { base: 200, offset: 6 },    // 200 Hz base, 6 Hz beat (4-8 Hz meditation)
  alpha: { base: 250, offset: 10 },   // 250 Hz base, 10 Hz beat (8-13 Hz relaxation)
  beta: { base: 300, offset: 20 },    // 300 Hz base, 20 Hz beat (13-30 Hz focus)
  gamma: { base: 400, offset: 40 },   // 400 Hz base, 40 Hz beat (30-100 Hz peak awareness)
};

// Binaural beat generation parameters (proprietary)
const BINAURAL_AMPLITUDE = 0.3; // Left/right channel amplitude for binaural beats

// Mixing gain parameters (proprietary)
const BINAURAL_GAIN = 0.4; // Moderate volume for binaural beats
const AFFIRMATION_GAIN_MULTIPLIER = 0.5; // Halve the volume: slider 100% = actual 50% volume
const LAYER_DELAY_SECONDS = 0.5; // Slight delay between layers
const LAYER_ATTENUATION = 0.05; // Each layer slightly quieter to create subliminal whisper effect

// Audio processing parameters (proprietary)
const TARGET_SAMPLE_RATE = 22050; // Half of standard 44100 Hz - reduces file size by ~50%
const AUDIO_DETECTION_THRESHOLD = 0.001; // Threshold for detecting if audio buffer has content

// Get all subliminal audio mixing parameters
function getSubliminalParams() {
  return {
    binauralFrequencies: BINAURAL_FREQUENCIES,
    binauralAmplitude: BINAURAL_AMPLITUDE,
    binauralGain: BINAURAL_GAIN,
    affirmationGainMultiplier: AFFIRMATION_GAIN_MULTIPLIER,
    layerDelaySeconds: LAYER_DELAY_SECONDS,
    layerAttenuation: LAYER_ATTENUATION,
    targetSampleRate: TARGET_SAMPLE_RATE,
    audioDetectionThreshold: AUDIO_DETECTION_THRESHOLD,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Return proprietary mixing parameters
    return new Response(
      JSON.stringify({
        params: getSubliminalParams(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error getting subliminal params:', error);
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error),
        params: null,
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
```

## supabase/functions/post-paywall-welcome-message/index.ts

```typescript
/**
 * Idempotent programmatic welcome message in Chat (character_messages) after paywall provisioning.
 * No LLM — fixed template from setup path + guide preference.
 *
 * Auth: Bearer JWT (anon client + auth.getUser()).
 * Write: service role (RLS allows only service_role to INSERT character_messages).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { displayLabelForCanonical } from "../_shared/supportCategories.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WELCOME_METADATA_SOURCE = "post_paywall_welcome";

const SUPPORT_CATEGORY_NAMES = new Set([
  "Career",
  "Business",
  "Learning",
  "Finances",
  "Productivity",
  "Organization",
  "Confidence",
  "Self-Love",
  "Connections",
  "Fitness",
  "Nutrition",
  "Discipline",
]);

/** Mirrors `src/lib/postPaywallProvisioning.ts` */
const DESIRE_SETUP_KEY_TO_CATEGORY: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string | null): string {
  const raw = (desireCategory || "").trim();
  if (SUPPORT_CATEGORY_NAMES.has(raw)) return raw;
  const mapped = DESIRE_SETUP_KEY_TO_CATEGORY[raw];
  const category = mapped && SUPPORT_CATEGORY_NAMES.has(mapped) ? mapped : "Confidence";
  return category;
}

const GUIDE_DISPLAY: Record<string, string> = {
  river: "River",
  sage: "Sage",
  rose: "Rose",
  oliver: "Oliver",
};

function resolveCharacter(char: string | null | undefined): keyof typeof GUIDE_DISPLAY {
  const c = String(char || "river").toLowerCase();
  if (c === "river" || c === "sage" || c === "rose" || c === "oliver") return c;
  return "river";
}

function buildWelcomeText(params: {
  firstName: string;
  guideName: string;
  categoryLabel: string;
  desireFocusLabel: string;
}): string {
  const { firstName, guideName, categoryLabel, desireFocusLabel } = params;
  return [
    `Hi ${firstName} — I'm ${guideName}, and your ${categoryLabel} path is ready.`,
    `I used what you shared about ${desireFocusLabel} to prepare your first affirmations, subliminal draft, mirror work, and belief-work starting point.`,
    "Start with the tool that feels strongest today, then let the rest of the stack reinforce the same assumption.",
    "Come to me anytime you want help with affirmations, subliminal settings, belief work, or staying in your new story.",
  ].join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await admin
      .from("character_messages")
      .select("id")
      .eq("user_id", userId)
      .eq("message_type", "chat")
      .contains("metadata", { source: WELCOME_METADATA_SOURCE })
      .maybeSingle();

    if (existing?.id) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "already_welcomed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: setup }, { data: prefs }] = await Promise.all([
      admin
        .from("user_setup_path")
        .select("first_name, desire_category")
        .eq("user_id", userId)
        .maybeSingle(),
      admin.from("user_preferences").select("selected_character").eq("user_id", userId).maybeSingle(),
    ]);

    const firstRaw = setup?.first_name;
    const firstName =
      typeof firstRaw === "string" && firstRaw.trim().length > 0 ? firstRaw.trim() : "there";

    const weekly = mapDesireSetupKeyToWeeklyCategory(setup?.desire_category);
    const categoryLabel = displayLabelForCanonical(weekly) || weekly;
    const desireFocusLabel = categoryLabel;

    const charId = resolveCharacter(prefs?.selected_character);
    const guideName = GUIDE_DISPLAY[charId];
    const messageText = buildWelcomeText({
      firstName,
      guideName,
      categoryLabel,
      desireFocusLabel,
    });

    const { error: insErr } = await admin.from("character_messages").insert({
      user_id: userId,
      character_type: charId,
      message_text: messageText,
      message_type: "chat",
      is_sent: true,
      sent_at: new Date().toISOString(),
      metadata: { is_user: false, source: WELCOME_METADATA_SOURCE },
    });

    if (insErr) {
      console.error("[post-paywall-welcome-message] insert:", insErr);
      return new Response(JSON.stringify({ error: "Failed to save welcome message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, skipped: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[post-paywall-welcome-message]", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## supabase/functions/sync-revenuecat-entitlement/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  syncUserPlansFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";

function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  if (!(error instanceof Error)) return defaultMessage;
  const message = error.message.toLowerCase();
  if (
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("rls") ||
    message.includes("permission")
  ) {
    return "Permission denied. Please ensure you're logged in.";
  }
  return defaultMessage;
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

/** Optional payload from iOS client: onboarding choices to write to user_preferences, profiles, and user_plans. */
interface OnboardingPrefs {
  selected_character?: string | null;
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
}

const VALID_CHARACTERS = ["river", "sage", "rose", "oliver"] as const;

function applyOnboardingPrefs(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  prefs: OnboardingPrefs
): Promise<void> {
  const prefsKeys = Object.keys(prefs) as (keyof OnboardingPrefs)[];
  if (prefsKeys.length === 0) return Promise.resolve();

  const profileUpdates: Record<string, unknown> = {};
  if (prefs.first_name !== undefined) profileUpdates.first_name = prefs.first_name;
  if (prefs.username !== undefined) profileUpdates.username = prefs.username;
  if (prefs.onboarding_answers !== undefined) profileUpdates.onboarding_answers = prefs.onboarding_answers;

  const prefUpdates: Record<string, unknown> = {
    user_id: userId,
  };
  if (prefs.selected_character !== undefined) {
    const c = String(prefs.selected_character || "").toLowerCase();
    prefUpdates.selected_character = VALID_CHARACTERS.includes(c as typeof VALID_CHARACTERS[number])
      ? c
      : null;
  }
  if (prefs.app_notifications_enabled !== undefined) prefUpdates.app_notifications_enabled = prefs.app_notifications_enabled;
  if (prefs.texts_enabled !== undefined) prefUpdates.texts_enabled = prefs.texts_enabled;
  if (prefs.email_marketing !== undefined) prefUpdates.email_marketing = prefs.email_marketing;
  if (prefs.preferred_send_window !== undefined) {
    const w = prefs.preferred_send_window;
    prefUpdates.preferred_send_window = w === "morning" || w === "evening" || w === "both" ? w : "both";
  }
  if (prefs.embody_active_practices !== undefined) {
    prefUpdates.embody_active_practices = Array.isArray(prefs.embody_active_practices) ? prefs.embody_active_practices : null;
  }

  return (async () => {
    if (Object.keys(profileUpdates).length > 0) {
      try {
        await supabase.from("profiles").upsert(
          { id: userId, ...profileUpdates },
          { onConflict: "id" }
        );
      } catch (e) {
        console.warn("Non-fatal: failed to upsert profiles from onboarding_prefs:", e);
      }
    }
    if (Object.keys(prefUpdates).length > 1) {
      try {
        await supabase.from("user_preferences").upsert(prefUpdates, { onConflict: "user_id" });
      } catch (e) {
        console.warn("Non-fatal: failed to upsert user_preferences from onboarding_prefs:", e);
      }
    }
    if (prefs.selected_character && VALID_CHARACTERS.includes(prefs.selected_character as typeof VALID_CHARACTERS[number])) {
      try {
        await supabase.from("character_selection_log").insert({
          user_id: userId,
          selected_character: prefs.selected_character,
          previous_character: null,
          source: "ios_onboarding_activation",
        });
      } catch (e) {
        console.warn("Non-fatal: failed to insert character_selection_log:", e);
      }
    }
  })();
}

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Content-Length": "0" } });
  }

  try {
    const secretKey = getRevenueCatServerSecretKey();
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return new Response(
        JSON.stringify({ error: "RevenueCat secret key not configured" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    let body: { onboarding_prefs?: OnboardingPrefs } = {};
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw) as { onboarding_prefs?: OnboardingPrefs };
      }
    } catch {
      // no body or invalid JSON – do not break payment path
    }

    const appUserId = user.id;
    const rc = await fetchRevenueCatSubscriber(secretKey, appUserId);
    if (!rc.ok) {
      console.error("[sync-revenuecat-entitlement] RevenueCat API error:", rc.status, rc.body);
      return new Response(
        JSON.stringify({ error: "Could not verify subscription" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await syncUserPlansFromRevenueCatPayload(supabase, appUserId, rc.data, {});

    if (!result.ok) {
      throw new Error(result.error);
    }

    if (result.preservedStripe) {
      console.log(
        "[sync-revenuecat-entitlement] Sync applied; Stripe cus_/sub_ identity kept (latest expiry vs RC).",
      );
      return new Response(
        JSON.stringify({
          success: true,
          active: true,
          preservedStripeBilling: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if ("preservedExistingPlan" in result && result.preservedExistingPlan) {
      console.error(
        "[sync-revenuecat-entitlement] RC reports inactive entitlement but DB plan active with future period; left unchanged",
      );
      return new Response(
        JSON.stringify({
          success: false,
          active: false,
          preservedExisting: true,
          error:
            "Subscription sync did not show an active entitlement; your existing plan with a future period was left unchanged.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!result.active) {
      return new Response(
        JSON.stringify({
          success: true,
          active: false,
          downgraded: result.downgraded === true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body?.onboarding_prefs && typeof body.onboarding_prefs === "object") {
      try {
        await applyOnboardingPrefs(supabase, user.id, body.onboarding_prefs);
      } catch (e) {
        console.warn("[sync-revenuecat-entitlement] onboarding_prefs apply failed (non-fatal):", e);
      }
    }

    return new Response(JSON.stringify({ success: true, active: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-revenuecat-entitlement:", error);
    const errorOrigin = req.headers.get("origin") || req.headers.get("referer") || "*";
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 500,
        headers: { ...getCorsHeaders(errorOrigin), "Content-Type": "application/json" },
      }
    );
  }
});
```

## supabase/functions/update-onboarding-session/index.ts

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { normalizeConditionalSpecificity } from "../_shared/conditionalSpecificityNormalize.ts";

/** Inlined: deploy bundle does not reliably include `../_shared/` for this helper. */
const EMBODY_ACTIVE_SLUGS = new Set([
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
]);

function normalizeEmbodyActivePractices(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  const cleaned: string[] = [];
  for (const x of value) {
    if (typeof x !== "string") return null;
    const s = x.trim();
    if (!EMBODY_ACTIVE_SLUGS.has(s)) return null;
    cleaned.push(s);
  }
  if (new Set(cleaned).size !== 5) return null;
  return cleaned;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

const SHELL_APPEARANCES = new Set(["light", "dark"]);

function normalizeShellAppearance(value: unknown): string | null {
  return typeof value === "string" && SHELL_APPEARANCES.has(value) ? value : null;
}

const GUIDE_IDS = new Set(["river", "sage", "rose", "oliver"]);

function normalizeGuideCharacterId(value: unknown): string | null {
  return typeof value === "string" && GUIDE_IDS.has(value) ? value : null;
}

/** Normalized setup-path fields (mirrors app SetupDraft → DB columns). */
type SetupPathPatch = {
  first_name?: string | null;
  email?: string | null;
  desire_category?: string | null;
  desire_text?: string | null;
  why_it_matters?: string | null;
  current_friction?: string | null;
  desired_identity?: string | null;
  tool_preferences?: string[] | null;
  conditional_specificity?: Record<string, unknown> | null;
  shell_appearance?: string | null;
  guide_character_id?: string | null;
  /** Five distinct embody catalog slugs (same as `user_preferences.embody_active_practices`). */
  embody_active_practices?: string[] | null;
};

/** Deep-merge `setup_journey_v1` into session answers (alongside legacy `setup_path_v1` when used). */
function mergeSetupJourneyV1IntoOnboardingAnswers(
  sessionAnswers: unknown,
  existingPatchAnswers: unknown,
  journeySlice: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existingPatchAnswers && typeof existingPatchAnswers === "object" && existingPatchAnswers !== null
      ? { ...(existingPatchAnswers as Record<string, unknown>) }
      : sessionAnswers && typeof sessionAnswers === "object" && sessionAnswers !== null
        ? { ...(sessionAnswers as Record<string, unknown>) }
        : {};
  const prev =
    base.setup_journey_v1 && typeof base.setup_journey_v1 === "object" && base.setup_journey_v1 !== null
      ? { ...(base.setup_journey_v1 as Record<string, unknown>) }
      : {};
  base.setup_journey_v1 = { ...prev, ...journeySlice };
  return base;
}

type AllowedPatch = {
  email?: string | null;
  first_name?: string | null;
  username?: string | null;
  email_consent?: boolean | null;
  sms_consent?: boolean | null;
  app_notifications_consent?: boolean | null;
  character_id?: "river" | "sage" | "rose" | "oliver" | null;
  onboarding_answers?: Record<string, unknown>;
  selected_tier?: "basic" | "plus" | "premium" | null;
  billing?: "monthly" | "annual" | "weekly" | null;
  /** Persisted to onboarding_sessions.onboarding_answers (setup_path_v1) and, if present, onboarding_session_setup. */
  setup_path?: SetupPathPatch;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken, patch } = await req.json();
    if (!sessionId || !resumeToken || !patch) {
      return new Response(JSON.stringify({ error: "Missing sessionId, resumeToken, or patch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: session, error: fetchErr } = await supabase
      .from("onboarding_sessions")
      .select("id, resume_token_hash, status, onboarding_answers")
      .eq("id", String(sessionId))
      .maybeSingle();

    if (fetchErr || !session) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build safe updates only from allowed keys
    const allowedPatch = patch as AllowedPatch;
    const updates: Record<string, unknown> = {};

    if ("email" in allowedPatch) updates.email = allowedPatch.email;
    if ("first_name" in allowedPatch) updates.first_name = allowedPatch.first_name;
    if ("username" in allowedPatch) updates.username = allowedPatch.username;
    if ("email_consent" in allowedPatch) updates.email_consent = allowedPatch.email_consent;
    if ("sms_consent" in allowedPatch) updates.sms_consent = allowedPatch.sms_consent;
    if ("app_notifications_consent" in allowedPatch) {
      updates.app_notifications_consent = allowedPatch.app_notifications_consent;
    }
    if ("character_id" in allowedPatch) updates.character_id = allowedPatch.character_id;
    if ("onboarding_answers" in allowedPatch) {
      const current =
        session?.onboarding_answers && typeof session.onboarding_answers === "object" && session.onboarding_answers !== null
          ? (session.onboarding_answers as Record<string, unknown>)
          : {};
      const patchAnswers =
        allowedPatch.onboarding_answers && typeof allowedPatch.onboarding_answers === "object" &&
          allowedPatch.onboarding_answers !== null
          ? (allowedPatch.onboarding_answers as Record<string, unknown>)
          : {};
      updates.onboarding_answers = { ...current, ...patchAnswers };
    }
    if ("selected_tier" in allowedPatch) updates.selected_tier = allowedPatch.selected_tier;
    if ("billing" in allowedPatch) updates.billing = allowedPatch.billing;

    // If the user is choosing a plan / editing plan, move to started unless already beyond paid
    // (We don't want accidental regressions from 'paid'/'active')
    if (session.status === "started" || session.status === "checkout_created") {
      // keep current
    }

    if (
      "setup_path" in allowedPatch &&
      allowedPatch.setup_path &&
      typeof allowedPatch.setup_path === "object"
    ) {
      const sp = allowedPatch.setup_path as SetupPathPatch;
      const spec =
        sp.conditional_specificity &&
        typeof sp.conditional_specificity === "object" &&
        sp.conditional_specificity !== null
          ? sp.conditional_specificity
          : {};

      const desireCatRaw = typeof sp.desire_category === "string" ? sp.desire_category : null;
      const normalizedConditional = normalizeConditionalSpecificity(spec, desireCatRaw);

      const shellAppearance = normalizeShellAppearance(sp.shell_appearance);
      const guideCharacterId = normalizeGuideCharacterId(sp.guide_character_id);
      const embodySlugs = normalizeEmbodyActivePractices(sp.embody_active_practices);

      const pathRow = {
        onboarding_session_id: String(sessionId),
        first_name: typeof sp.first_name === "string" ? sp.first_name : null,
        email: typeof sp.email === "string" ? sp.email : null,
        desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
        desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
        why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
        current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
        desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
        tool_preferences: Array.isArray(sp.tool_preferences)
          ? (sp.tool_preferences as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
        conditional_specificity: normalizedConditional,
        shell_appearance: shellAppearance,
        guide_character_id: guideCharacterId,
        embody_active_practices: embodySlugs,
      };

      const journeySlice: Record<string, unknown> = {
        schema_version: 1,
        updated_at: new Date().toISOString(),
        desire_category: pathRow.desire_category,
        conditional_specificity: normalizedConditional,
      };
      if (pathRow.first_name != null) journeySlice.first_name = pathRow.first_name;
      if (pathRow.email != null) journeySlice.email = pathRow.email;
      if (pathRow.desire_text != null) journeySlice.desire_text = pathRow.desire_text;
      if (pathRow.why_it_matters != null) journeySlice.why_it_matters = pathRow.why_it_matters;
      if (pathRow.current_friction != null) journeySlice.current_friction = pathRow.current_friction;
      if (pathRow.desired_identity != null) journeySlice.desired_identity = pathRow.desired_identity;
      if (pathRow.tool_preferences.length > 0) journeySlice.tool_preferences = pathRow.tool_preferences;
      if (shellAppearance != null) journeySlice.shell_appearance = shellAppearance;
      if (guideCharacterId != null) journeySlice.guide_character_id = guideCharacterId;
      if (embodySlugs) journeySlice.embody_active_practices = embodySlugs;

      updates.shell_appearance = shellAppearance;

      const { error: pathErr } = await supabase
        .from("onboarding_session_setup")
        .upsert(pathRow, { onConflict: "onboarding_session_id" });

      if (pathErr) {
        const msg = pathErr.message || "";
        const tableMissing =
          pathErr.code === "42P01" ||
          msg.includes("does not exist") ||
          msg.includes("schema cache") ||
          msg.includes("onboarding_session_setup");
        if (tableMissing) {
          const setupPathV1: Record<string, unknown> = { ...pathRow };
          delete setupPathV1.onboarding_session_id;
          const mergedJourney = mergeSetupJourneyV1IntoOnboardingAnswers(
            session.onboarding_answers,
            updates.onboarding_answers,
            journeySlice,
          );
          updates.onboarding_answers = { ...mergedJourney, setup_path_v1: setupPathV1 };
          console.warn(
            "onboarding_session_setup unavailable; persisted setup_path to onboarding_sessions.onboarding_answers.setup_path_v1",
          );
        } else {
          console.error("onboarding_session_setup upsert error:", pathErr);
          return new Response(JSON.stringify({ error: "Failed to save setup answers" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      } else {
        updates.onboarding_answers = mergeSetupJourneyV1IntoOnboardingAnswers(
          session.onboarding_answers,
          updates.onboarding_answers,
          journeySlice,
        );
      }
    }

    const hasSessionColumnUpdates = Object.keys(updates).length > 0;

    let updated: Record<string, unknown> | null = null;

    if (hasSessionColumnUpdates) {
      const { data: upd, error: updateErr } = await supabase
        .from("onboarding_sessions")
        .update(updates)
        .eq("id", String(sessionId))
        .select(
          "id,status,email,first_name,username,email_consent,sms_consent,app_notifications_consent,character_id,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at",
        )
        .single();

      if (updateErr) {
        console.error("Error updating onboarding session:", updateErr);
        return new Response(JSON.stringify({ error: "Failed to update onboarding session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = upd as Record<string, unknown>;
    } else {
      const { data: refetch, error: refetchErr } = await supabase
        .from("onboarding_sessions")
        .select(
          "id,status,email,first_name,username,email_consent,sms_consent,app_notifications_consent,character_id,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at",
        )
        .eq("id", String(sessionId))
        .single();

      if (refetchErr) {
        console.error("Error loading onboarding session:", refetchErr);
        return new Response(JSON.stringify({ error: "Failed to load onboarding session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = refetch as Record<string, unknown>;
    }

    return new Response(JSON.stringify({ session: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in update-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
```

## supabase/migrations/20260505120000_user_setup_path_tables.sql

```sql
-- Normalized storage for the guided setup path (not a single JSON blob on profiles).
-- Pre-auth: one row per onboarding_sessions (edge functions write).
-- Post-auth: one row per user (RLS; client + edge can upsert).

CREATE TABLE IF NOT EXISTS public.onboarding_session_setup (
  onboarding_session_id UUID PRIMARY KEY REFERENCES public.onboarding_sessions (id) ON DELETE CASCADE,
  first_name TEXT,
  email TEXT,
  desire_category TEXT,
  desire_text TEXT,
  why_it_matters TEXT,
  current_friction TEXT,
  desired_identity TEXT,
  tool_preferences TEXT[] NOT NULL DEFAULT '{}',
  conditional_specificity JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_onboarding_session_setup_updated
  ON public.onboarding_session_setup (updated_at DESC);

DROP TRIGGER IF EXISTS trg_onboarding_session_setup_updated ON public.onboarding_session_setup;
CREATE TRIGGER trg_onboarding_session_setup_updated
  BEFORE UPDATE ON public.onboarding_session_setup
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.onboarding_session_setup ENABLE ROW LEVEL SECURITY;

-- No direct client access; service role (edge functions) only
CREATE POLICY "Service role full access onboarding_session_setup"
  ON public.onboarding_session_setup
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.onboarding_session_setup IS 'Setup path answers keyed by anonymous onboarding session (written via Edge Functions).';

CREATE TABLE IF NOT EXISTS public.user_setup_path (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name TEXT,
  email TEXT,
  desire_category TEXT,
  desire_text TEXT,
  why_it_matters TEXT,
  current_friction TEXT,
  desired_identity TEXT,
  tool_preferences TEXT[] NOT NULL DEFAULT '{}',
  conditional_specificity JSONB NOT NULL DEFAULT '{}'::jsonb,
  post_paywall_provisioned_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_setup_path_updated
  ON public.user_setup_path (updated_at DESC);

DROP TRIGGER IF EXISTS trg_user_setup_path_updated ON public.user_setup_path;
CREATE TRIGGER trg_user_setup_path_updated
  BEFORE UPDATE ON public.user_setup_path
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.user_setup_path ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own setup path"
  ON public.user_setup_path FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

CREATE POLICY "Users insert own setup path"
  ON public.user_setup_path FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

CREATE POLICY "Users update own setup path"
  ON public.user_setup_path FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

COMMENT ON TABLE public.user_setup_path IS 'Setup path answers for logged-in users; personalization and provisioning flags.';
COMMENT ON COLUMN public.user_setup_path.post_paywall_provisioned_at IS 'When idempotent post-paywall provisioning completed.';
```

## supabase/migrations/20260514200000_add_user_plans_starter_provisioned.sql

```sql
ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS starter_provisioned BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_plans.starter_provisioned IS
  'True after first purchase provisioning (starter affirmations, subliminal). Never reverts to false.';
```
