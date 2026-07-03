import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate, useParams } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppearancePreferenceSync } from "@/components/AppearancePreferenceSync";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ProToolRoute } from "@/components/ProToolRoute";
import Index from "./pages/Index";
import MobileLanding from "./pages/MobileLanding";
import MobileLandingBR from "./pages/MobileLandingBR";
import MobileLandingMimi from "./pages/MobileLandingMimi";
import MobileLandingJonni from "./pages/MobileLandingJonni";
import MobileLandingManifestingSetup from "./pages/MobileLandingManifestingSetup";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Workspace from "./pages/Workspace";
import WorkspaceHelp from "./pages/WorkspaceHelp";
import { COMMUNITY_IN_APP_ENABLED } from "./lib/communityRelease";
import WorkspaceCommunity from "./pages/WorkspaceCommunity";
import WorkspaceCommunitySubmit from "./pages/WorkspaceCommunitySubmit";
import NotFound from "./pages/NotFound";
const Welcome = lazy(() => import("./pages/onboarding/Welcome"));
import Settings from "./pages/Settings";
import ManifestationRoutineSettings from "./pages/ManifestationRoutineSettings";
import Boards from "./pages/features/Boards";
import Affirmations from "./pages/features/Affirmations";
import AffirmationVisualizerV2 from "./pages/features/AffirmationVisualizerV2";
import ActivityTracking from "./pages/features/ActivityTracking";
import Chrono from "./pages/features/Chrono";
import MusicComposer from "./pages/features/MusicComposer";
import Freeplay from "./pages/features/Freeplay";
import YourJourney from "./pages/features/YourJourney";
import ReportAppIssue from "./pages/ReportAppIssue";
import AdminSupportInbox from "./pages/admin/AdminSupportInbox";
import EmailCollection from "./pages/onboarding/EmailCollection";
import IOSPaywall from "./pages/onboarding/IOSPaywall";
import AndroidPaywall from "./pages/onboarding/AndroidPaywall";
import WebPaywall from "./pages/onboarding/WebPaywall";
import AndroidPostPaywallLoading from "./pages/onboarding/AndroidPostPaywallLoading";
import PostPaywallLoading from "./pages/onboarding/PostPaywallLoading";
import {
  SetupCurrentFriction,
  SetupAffirmationRead,
  SetupBeginJourney,
  SetupConditionalSpecificity,
  SetupDesireCategory,
  SetupPrimaryIntent,
  SetupHomeFocus,
  SetupOfficePlanningSystem,
  SetupMoodboardFocus,
  SetupEmail,
  SetupName,
  SetupNotificationPrePermission,
  SetupIntensity,
  SetupAttribution,
  SetupPlotLoading,
  SetupPlotSynthesis,
  SetupToolPreference,
  SetupWorkspaceTemplate,
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
import PricingPlans from "./pages/PricingPlans";
import GetAppStore from "./pages/GetAppStore";
import GetMobileApp from "./pages/GetMobileApp";
import GetNewsletter from "./pages/GetNewsletter";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import WhatIsPalettePlotting from "./pages/WhatIsPalettePlotting";
import ManifestHelp from "./pages/ManifestHelp";
import ManifestationQuiz from "./pages/ManifestationQuiz";
import Contact from "./pages/Contact";
import Community from "./pages/Community";
import Unsubscribe from "./pages/Unsubscribe";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WebGetAppAfterPurchaseDialog } from "@/components/WebGetAppAfterPurchaseDialog";
import { NativeAppRootRedirect, NativeSplashGate } from "@/components/NativeAppRootRedirect";
import { debugLog } from "@/debugLog";
import { AttributionCapture } from "@/components/AttributionCapture";
import { MetaFacebookBootstrap } from "@/components/MetaFacebookBootstrap";
import { AppsFlyerBootstrap } from "@/components/AppsFlyerBootstrap";
import { MarketingLocaleProvider } from "@/contexts/MarketingLocaleContext";
import { LEGAL_ROUTE_LOCALES } from "@/lib/locale";

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

/** TikTok ad domain(s) from VITE_MOBILE_LANDING_HOSTS — root URL only, no paletteplot.com path. */
function isMobileLandingHost(): boolean {
  if (typeof window === "undefined") return false;
  const raw = import.meta.env.VITE_MOBILE_LANDING_HOSTS as string | undefined;
  const configured = raw?.trim()
    ? raw.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean)
    : [];
  const hosts = [
    ...configured,
    "themanifestingsetup.com",
    "www.themanifestingsetup.com",
  ];
  const current = window.location.hostname.toLowerCase();
  for (const host of hosts) {
    if (current === host || current.endsWith(`.${host}`)) return true;
  }
  return false;
}

const App = () => {
  const mobileLandingHost = isMobileLandingHost();

  return (
  <ThemeProvider>
    <AttributionCapture />
    <MetaFacebookBootstrap />
    <AppsFlyerBootstrap />
    <AuthProvider>
      <AppearancePreferenceSync />
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <MarketingLocaleProvider>
            <NativeSplashGate />
            <ScrollToTop />
            {!mobileLandingHost ? <WebGetAppAfterPurchaseDialog /> : null}
            {mobileLandingHost ? (
            <Routes>
              <Route path="*" element={<MobileLandingManifestingSetup />} />
            </Routes>
            ) : (
            <Routes>
              <Route path="/" element={<NativeAppRootRedirect />} />
              <Route path="/mobilelanding" element={<MobileLanding />} />
              <Route path="/mobilelandingBR" element={<MobileLandingBR />} />
              <Route path="/mobilelandingmimi" element={<MobileLandingMimi />} />
              <Route path="/mobilelandingjonni" element={<MobileLandingJonni />} />
              <Route path="/demo" element={<Navigate to="/" replace />} />
              <Route path="/demo-access" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/community" element={<Community />} />
              <Route
                path="/manny"
                element={
                  <Navigate
                    to="/?utm_source=tiktok&utm_medium=bio&utm_campaign=manny"
                    replace
                  />
                }
              />
              <Route
                path="/jonni"
                element={
                  <Navigate
                    to="/mobilelandingjonni?utm_source=tiktok&utm_medium=bio&utm_campaign=jonni"
                    replace
                  />
                }
              />
              <Route
                path="/mimi"
                element={
                  <Navigate
                    to="/mobilelandingmimi?utm_source=tiktok&utm_medium=bio&utm_campaign=mimi"
                    replace
                  />
                }
              />
              <Route
                path="/official"
                element={
                  <Navigate
                    to="/?utm_source=tiktok&utm_medium=bio&utm_campaign=official"
                    replace
                  />
                }
              />
              <Route
                path="/timeline"
                element={
                  <Navigate
                    to="/?utm_source=tiktok&utm_medium=bio&utm_campaign=timeline"
                    replace
                  />
                }
              />
              <Route path="/newsletter" element={<GetNewsletter />} />
              <Route path="/resubscribe" element={<IsNativePaywallOr FallbackComponent={WebResubscribeRedirect} />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/payment-processing" element={<PaymentProcessing />} />
              <Route path="/activate" element={<Activate />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Onboarding Flow */}
              <Route
                path="/onboarding/welcome"
                element={
                  <Suspense fallback={null}>
                    <Welcome />
                  </Suspense>
                }
              />
              <Route path="/onboarding/four-steps" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/custom-affirmations" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/digital-mirror" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/subliminal-maker" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/manifestation-tools" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/habit-tracking" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/email" element={<EmailCollection />} />
              <Route path="/onboarding/double" element={<Navigate to="/onboarding/welcome" replace />} />
              <Route path="/onboarding/questions" element={<Navigate to="/onboarding/welcome" replace />} />

              <Route path="/onboarding/ios-paywall" element={<IOSPaywall />} />
              <Route path="/onboarding/android-paywall" element={<AndroidPaywall />} />
              <Route path="/onboarding/web-paywall" element={<WebPaywall />} />
              <Route path="/onboarding/android-post-paywall" element={<AndroidPostPaywallLoading />} />
              <Route path="/onboarding/post-paywall" element={<PostPaywallLoading />} />
              <Route path="/onboarding/pricing" element={<LegacyOnboardingPricingRedirect />} />

              {/* Personalized setup flow (web + native) */}
              <Route path="/onboarding/setup/name" element={<SetupName />} />
              <Route path="/onboarding/setup/primary-intent" element={<SetupPrimaryIntent />} />
              <Route path="/onboarding/setup/desire-category" element={<SetupDesireCategory />} />
              <Route path="/onboarding/setup/home-focus" element={<SetupHomeFocus />} />
              <Route path="/onboarding/setup/office-planning-system" element={<SetupOfficePlanningSystem />} />
              <Route path="/onboarding/setup/moodboard-focus" element={<SetupMoodboardFocus />} />
              <Route
                path="/onboarding/setup/why-it-matters"
                element={<Navigate to="/onboarding/setup/current-friction" replace />}
              />
              <Route path="/onboarding/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/setup/affirmations" element={<SetupAffirmationRead />} />
              <Route path="/onboarding/setup/embody-daily" element={<Navigate to="/onboarding/setup/begin-journey" replace />} />
              <Route path="/onboarding/setup/begin-journey" element={<SetupBeginJourney />} />
              <Route path="/onboarding/setup/conditional-specificity" element={<SetupConditionalSpecificity />} />
              <Route path="/onboarding/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/setup/guide" element={<Navigate to="/onboarding/setup/intensity" replace />} />
              <Route path="/onboarding/setup/attribution" element={<SetupAttribution />} />
              <Route path="/onboarding/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/setup/intensity" element={<SetupIntensity />} />
              <Route path="/onboarding/setup/manifestation-intensity" element={<Navigate to="/onboarding/setup/intensity" replace />} />
              <Route path="/onboarding/setup/tool-preference" element={<SetupToolPreference />} />
              <Route path="/onboarding/setup/workspace-template" element={<SetupWorkspaceTemplate />} />
              <Route path="/onboarding/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/setup/plot-synthesis" element={<SetupPlotSynthesis />} />

              {/* Suite web funnel (comprehensive-app ads) — same screens, /onboarding/suite paths */}
              <Route
                path="/onboarding/suite/welcome"
                element={
                  <Suspense fallback={null}>
                    <Welcome />
                  </Suspense>
                }
              />
              <Route path="/onboarding/suite/setup/name" element={<SetupName />} />
              <Route path="/onboarding/suite/setup/primary-intent" element={<SetupPrimaryIntent />} />
              <Route path="/onboarding/suite/setup/desire-category" element={<SetupDesireCategory />} />
              <Route path="/onboarding/suite/setup/home-focus" element={<SetupHomeFocus />} />
              <Route path="/onboarding/suite/setup/office-planning-system" element={<SetupOfficePlanningSystem />} />
              <Route path="/onboarding/suite/setup/moodboard-focus" element={<SetupMoodboardFocus />} />
              <Route
                path="/onboarding/suite/setup/why-it-matters"
                element={<Navigate to="/onboarding/suite/setup/current-friction" replace />}
              />
              <Route path="/onboarding/suite/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/suite/setup/affirmations" element={<SetupAffirmationRead />} />
              <Route path="/onboarding/suite/setup/embody-daily" element={<Navigate to="/onboarding/suite/setup/begin-journey" replace />} />
              <Route path="/onboarding/suite/setup/begin-journey" element={<SetupBeginJourney />} />
              <Route path="/onboarding/suite/setup/conditional-specificity" element={<SetupConditionalSpecificity />} />
              <Route path="/onboarding/suite/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/suite/setup/guide" element={<Navigate to="/onboarding/suite/setup/intensity" replace />} />
              <Route path="/onboarding/suite/setup/attribution" element={<SetupAttribution />} />
              <Route path="/onboarding/suite/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/suite/setup/intensity" element={<SetupIntensity />} />
              <Route path="/onboarding/suite/setup/manifestation-intensity" element={<Navigate to="/onboarding/suite/setup/intensity" replace />} />
              <Route path="/onboarding/suite/setup/tool-preference" element={<SetupToolPreference />} />
              <Route path="/onboarding/suite/setup/workspace-template" element={<SetupWorkspaceTemplate />} />
              <Route path="/onboarding/suite/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/suite/setup/plot-synthesis" element={<SetupPlotSynthesis />} />

              {/* Subliminal web funnel — redirect all traffic to homepage (keep query string) */}
              <Route
                path="/onboarding/subliminal/*"
                element={
                  <Navigate to={{ pathname: "/", search: window.location.search }} replace />
                }
              />

              {/* Auth-only workspace — free Library; Create & Projects gated in UI + server */}
              <Route
                path="/workspace"
                element={
                  <ProtectedRoute>
                    <Workspace />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/workspace/help"
                element={
                  <ProtectedRoute>
                    <WorkspaceHelp />
                  </ProtectedRoute>
                }
              />
              {COMMUNITY_IN_APP_ENABLED ? (
                <>
                  <Route
                    path="/workspace/community"
                    element={
                      <ProtectedRoute>
                        <WorkspaceCommunity />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/workspace/community/submit"
                    element={
                      <ProtectedRoute>
                        <WorkspaceCommunitySubmit />
                      </ProtectedRoute>
                    }
                  />
                </>
              ) : null}

              {/* Protected + Nested Dashboard Routes */}
              <Route
                path="/dashboard/*"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<ProToolRoute><Dashboard /></ProToolRoute>} />
                <Route path="design" element={<Navigate to="/dashboard" replace />} />
                <Route path="assemble" element={<Navigate to="/dashboard/boards" replace />} />
                <Route path="review" element={<Navigate to="/dashboard" replace />} />
                <Route path="experience" element={<Navigate to="/dashboard" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/manifestation-routine" element={<ManifestationRoutineSettings />} />
                <Route path="report-issue" element={<ReportAppIssue />} />
                <Route path="admin/support" element={<AdminSupportInbox />} />
                <Route path="your-journey/chat" element={<Navigate to="/dashboard/your-journey" replace />} />
                <Route path="your-journey" element={<ProToolRoute><YourJourney /></ProToolRoute>} />
                <Route path="chat" element={<Navigate to="/dashboard/your-journey" replace />} />
                <Route path="mirror" element={<Navigate to="/dashboard/your-journey" replace />} />
                <Route path="mind-the-mirror" element={<Navigate to="/dashboard/your-journey" replace />} />
                <Route path="subliminal" element={<Navigate to="/dashboard/boards" replace />} />
                <Route path="boards" element={<ProToolRoute><Boards /></ProToolRoute>} />
                <Route path="affirmations-builder" element={<ProToolRoute><Affirmations /></ProToolRoute>} />
                <Route path="affirmation-viewer/:setId" element={<ProToolRoute><AffirmationVisualizerV2 /></ProToolRoute>} />
                <Route path="timeline" element={<ProToolRoute><Chrono /></ProToolRoute>} />
                <Route path="activity-tracking" element={<ProToolRoute><ActivityTracking /></ProToolRoute>} />
                <Route path="double" element={<Navigate to="/dashboard/your-journey" replace />} />
                <Route path="choose-double" element={<Navigate to="/dashboard/your-journey" replace />} />
                <Route path="refactor" element={<Navigate to="/dashboard/boards" replace />} />
                <Route path="chrono" element={<ProToolRoute><Chrono /></ProToolRoute>} />
                <Route path="get-app" element={<GetAppStore />} />
                <Route path="download-a2h2" element={<Navigate to="/dashboard/get-app" replace />} />
                <Route path="music-composer" element={<ProToolRoute><MusicComposer /></ProToolRoute>} />
                <Route path="tap-in" element={<ProToolRoute><Freeplay /></ProToolRoute>} />
                <Route path="freeplay" element={<Navigate to="/dashboard/tap-in" replace />} />
              </Route>

              {/* Legacy redirects to nested dashboard paths */}
              <Route path="/dashboard" element={<Navigate to="/dashboard/" replace />} />
              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />
              <Route path="/chat" element={<Navigate to="/dashboard/your-journey" replace />} />
              <Route path="/feature/mirror" element={<Navigate to="/dashboard/your-journey" replace />} />
              <Route path="/feature/mind-the-mirror" element={<Navigate to="/dashboard/your-journey" replace />} />
              <Route path="/feature/subliminal" element={<Navigate to="/dashboard/boards" replace />} />
              <Route path="/feature/boards" element={<Navigate to="/dashboard/boards" replace />} />
              <Route path="/feature/affirmations-builder" element={<Navigate to="/dashboard/affirmations-builder" replace />} />
              <Route path="/feature/affirmation-viewer/:setId" element={<LegacyAffirmationViewerRedirect />} />
              <Route path="/your-timeline" element={<Navigate to="/dashboard/timeline" replace />} />
              <Route path="/activity-tracking" element={<Navigate to="/dashboard/activity-tracking" replace />} />
              <Route path="/feature/chrono" element={<Navigate to="/dashboard/chrono" replace />} />
              <Route path="/feature/refactor" element={<Navigate to="/dashboard/boards" replace />} />
              <Route path="/double" element={<Navigate to="/dashboard/your-journey" replace />} />
              <Route path="/choose-double" element={<Navigate to="/dashboard/your-journey" replace />} />
              <Route path="/download-a2h2" element={<Navigate to="/dashboard/get-app" replace />} />
              <Route path="/freeplay" element={<Navigate to="/dashboard/tap-in" replace />} />

              {/* Legal Pages */}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/blog" element={<Blog />} />
              <Route path="/blog/:slug" element={<BlogPost />} />
              <Route path="/help/manifesting" element={<ManifestHelp />} />
              <Route path="/what-is-palette-plotting" element={<WhatIsPalettePlotting />} />
              <Route path="/terms" element={<TermsOfService />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`terms-${locale}`}
                  path={`/terms/${locale}`}
                  element={<TermsOfService legalLocale={locale} />}
                />
              ))}
              <Route path="/privacy" element={<PrivacyPolicy />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`privacy-${locale}`}
                  path={`/privacy/${locale}`}
                  element={<PrivacyPolicy legalLocale={locale} />}
                />
              ))}
              <Route path="/acceptable-use" element={<AcceptableUsePolicy />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`acceptable-use-${locale}`}
                  path={`/acceptable-use/${locale}`}
                  element={<AcceptableUsePolicy legalLocale={locale} />}
                />
              ))}
              <Route path="/dmca" element={<DMCA />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`dmca-${locale}`}
                  path={`/dmca/${locale}`}
                  element={<DMCA legalLocale={locale} />}
                />
              ))}
              <Route path="/billing" element={<BillingRefundPolicy />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`billing-${locale}`}
                  path={`/billing/${locale}`}
                  element={<BillingRefundPolicy legalLocale={locale} />}
                />
              ))}
              <Route path="/pricingplans" element={<PricingPlans />} />
              <Route path="/eula" element={<Navigate to="/terms" replace />} />
              {LEGAL_ROUTE_LOCALES.map((locale) => (
                <Route
                  key={`eula-${locale}`}
                  path={`/eula/${locale}`}
                  element={<Navigate to={`/terms/${locale}`} replace />}
                />
              ))}
              <Route path="/get-mobile-app" element={<GetMobileApp />} />
              <Route path="/quiz/blocking-manifestation" element={<ManifestationQuiz />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            )}
            </MarketingLocaleProvider>
          </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
