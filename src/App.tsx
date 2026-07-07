import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppearancePreferenceSync } from "@/components/AppearancePreferenceSync";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Auth from "./pages/Auth";
import Workspace from "./pages/Workspace";
import WorkspaceHelp from "./pages/WorkspaceHelp";
import { COMMUNITY_IN_APP_ENABLED } from "./lib/communityRelease";
import WorkspaceCommunity from "./pages/WorkspaceCommunity";
import WorkspaceCommunitySubmit from "./pages/WorkspaceCommunitySubmit";
import NotFound from "./pages/NotFound";
import Welcome from "./pages/onboarding/Welcome";
import Settings from "./pages/Settings";
import RoutineReminderSettings from "./pages/RoutineReminderSettings";
import PlanReminderSettings from "./pages/PlanReminderSettings";
import Boards from "./pages/features/Boards";
import BoardAccountability from "./pages/features/BoardAccountability";
import ActivityTracking from "./pages/features/ActivityTracking";
import Chrono from "./pages/features/Chrono";
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
  SetupFocusDetails,
  SetupFocusCategories,
  SetupHomeFocus,
  SetupMoodboardFocus,
  SetupEmail,
  SetupName,
  SetupNotificationPrePermission,
  SetupIntensity,
  SetupAttribution,
  SetupPlotLoading,
  SetupPlotSynthesis,
  SetupWorkspaceTemplate,
} from "./pages/onboarding/setup";
import SetupPrimaryIntentGated from "@/components/onboarding/SetupPrimaryIntentGated";
import SetupOfficePlanningSystemGated from "@/components/onboarding/SetupOfficePlanningSystemGated";
import SetupToolPreferenceGated from "@/components/onboarding/SetupToolPreferenceGated";
import SetupBeginJourneyGated from "@/components/onboarding/SetupBeginJourneyGated";
import SetupReminderChannels from "./pages/onboarding/setup/ReminderChannels";
import Activate from "./pages/Activate";
import PaymentProcessing from "./pages/PaymentProcessing";
import VerifyEmail from "./pages/VerifyEmail";
import ResetPassword from "./pages/ResetPassword";
import FAQ from "./pages/FAQ";
import DMCA from "./pages/DMCA";
import SiteAbout from "@/site/pages/AboutPage";
import SitePolicy from "@/site/pages/PolicyPage";
import SiteContact from "@/site/pages/ContactPage";
import SiteBoardProduct from "@/site/pages/BoardProduct";
import SiteCart from "@/site/pages/CartPage";
import SiteGuidePreview from "@/site/pages/PalettePlottingGuidePreviewPage";
import PricingPlans from "./pages/PricingPlans";
import GetAppStore from "./pages/GetAppStore";
import GetNewsletter from "./pages/GetNewsletter";
import WhatIsPalettePlotting from "./pages/WhatIsPalettePlotting";
import PlottingHelp from "./pages/PlottingHelp";
import LifeRebrandQuiz from "./pages/LifeRebrandQuiz";
import Community from "./pages/Community";
import Unsubscribe from "./pages/Unsubscribe";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WebGetAppAfterPurchaseDialog } from "@/components/WebGetAppAfterPurchaseDialog";
import { NativeAppRootRedirect, NativeSplashGate, signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { AttributionCapture } from "@/components/AttributionCapture";
import { MetaFacebookBootstrap } from "@/components/MetaFacebookBootstrap";
import { AppsFlyerBootstrap } from "@/components/AppsFlyerBootstrap";
const queryClient = new QueryClient();
const DashboardLayout = () => {
  useEffect(() => {
    signalNativeSplashReadyToHide();
  }, []);
  return <Outlet />;
};

/** Web: RevenueCat web paywall. Native: platform paywall. */
const WebResubscribeRedirect = () => <Navigate to="/onboarding/web-paywall" replace />;

/** Use render-time check so we don't rely on Capacitor being ready at module load. */
const IsNativePaywallOr = ({ FallbackComponent }: { FallbackComponent: React.ComponentType }) => {
  if (isIosPaywallContext()) return <IOSPaywall />;
  if (isAndroidPaywallContext()) return <AndroidPaywall />;
  return <FallbackComponent />;
};

/** TikTok ad domain(s) from VITE_MOBILE_LANDING_HOSTS — root URL only, no paletteplot.com path. */
function isMobileLandingHost(): boolean {
  if (typeof window === "undefined") return false;
  const raw = import.meta.env.VITE_MOBILE_LANDING_HOSTS as string | undefined;
  const configured = raw?.trim()
    ? raw.split(",").map((part) => part.trim().toLowerCase()).filter(Boolean)
    : [];
  const hosts = configured;
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
            <NativeSplashGate />
            <ScrollToTop />
            {!mobileLandingHost ? <WebGetAppAfterPurchaseDialog /> : null}
            {mobileLandingHost ? (
            <Routes>
              <Route path="*" element={<Navigate to="/onboarding/setup/begin-journey" replace />} />
            </Routes>
            ) : (
            <Routes>
              <Route path="/" element={<NativeAppRootRedirect />} />
              <Route path="/mobilelanding" element={<Navigate to="/onboarding/setup/begin-journey" replace />} />
              <Route path="/mobilelandingmimi" element={<Navigate to="/onboarding/setup/begin-journey" replace />} />
              <Route path="/mobilelandingjonni" element={<Navigate to="/onboarding/setup/begin-journey" replace />} />
              <Route path="/demo" element={<Navigate to="/" replace />} />
              <Route path="/demo-access" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Auth />} />
              {/* palette plot marketing + shop pages (copied from vel) */}
              <Route path="/contact" element={<SiteContact />} />
              <Route path="/about" element={<SiteAbout />} />
              <Route path="/policies/:slug" element={<SitePolicy />} />
              <Route path="/cart" element={<SiteCart />} />
              <Route path="/palette-plotting-guide" element={<SiteGuidePreview />} />
              <Route path="/library" element={<Navigate to="/palette-plotting-guide" replace />} />
              <Route path="/palette-plotting-system" element={<Navigate to="/palette-plotting-guide" replace />} />
              <Route path="/system" element={<Navigate to="/palette-plotting-guide" replace />} />
              <Route path="/dry-erase-boards" element={<SiteBoardProduct />} />
              <Route path="/home-decor-boards" element={<SiteBoardProduct />} />
              <Route path="/vision-boards" element={<SiteBoardProduct />} />
              <Route path="/manifestation-boards" element={<Navigate to="/vision-boards" replace />} />
              <Route path="/manifestation-board" element={<Navigate to="/vision-boards" replace />} />
              <Route path="/neon-boards" element={<SiteBoardProduct />} />
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
              <Route path="/onboarding/welcome" element={<Welcome />} />

              <Route path="/onboarding/email" element={<EmailCollection />} />
              <Route path="/onboarding/ios-paywall" element={<IOSPaywall />} />
              <Route path="/onboarding/android-paywall" element={<AndroidPaywall />} />
              <Route path="/onboarding/web-paywall" element={<WebPaywall />} />
              <Route path="/onboarding/android-post-paywall" element={<AndroidPostPaywallLoading />} />
              <Route path="/onboarding/post-paywall" element={<PostPaywallLoading />} />

              {/* Personalized setup flow (web + native) */}
              <Route path="/onboarding/setup/name" element={<SetupName />} />
              <Route path="/onboarding/setup/primary-intent" element={<SetupPrimaryIntentGated />} />
              <Route path="/onboarding/setup/focus-categories" element={<SetupFocusCategories />} />
              <Route path="/onboarding/setup/home-focus" element={<SetupHomeFocus />} />
              <Route path="/onboarding/setup/office-planning-system" element={<SetupOfficePlanningSystemGated />} />
              <Route path="/onboarding/setup/moodboard-focus" element={<SetupMoodboardFocus />} />
              <Route path="/onboarding/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/setup/begin-journey" element={<SetupBeginJourneyGated />} />
              <Route path="/onboarding/setup/focus-details" element={<SetupFocusDetails />} />
              <Route path="/onboarding/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/setup/attribution" element={<SetupAttribution />} />
              <Route path="/onboarding/setup/reminder-channels" element={<SetupReminderChannels />} />
              <Route path="/onboarding/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/setup/intensity" element={<SetupIntensity />} />
              <Route path="/onboarding/setup/tool-preference" element={<SetupToolPreferenceGated />} />
              <Route path="/onboarding/setup/workspace-template" element={<SetupWorkspaceTemplate />} />
              <Route path="/onboarding/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/setup/plot-synthesis" element={<SetupPlotSynthesis />} />

              {/* Suite web funnel (comprehensive-app ads) — same screens, /onboarding/suite paths */}
              <Route path="/onboarding/suite/welcome" element={<Welcome />} />
              <Route path="/onboarding/suite/setup/name" element={<SetupName />} />
              <Route path="/onboarding/suite/setup/primary-intent" element={<SetupPrimaryIntentGated />} />
              <Route path="/onboarding/suite/setup/focus-categories" element={<SetupFocusCategories />} />
              <Route path="/onboarding/suite/setup/home-focus" element={<SetupHomeFocus />} />
              <Route path="/onboarding/suite/setup/office-planning-system" element={<SetupOfficePlanningSystemGated />} />
              <Route path="/onboarding/suite/setup/moodboard-focus" element={<SetupMoodboardFocus />} />
              <Route path="/onboarding/suite/setup/current-friction" element={<SetupCurrentFriction />} />
              <Route path="/onboarding/suite/setup/begin-journey" element={<SetupBeginJourneyGated />} />
              <Route path="/onboarding/suite/setup/focus-details" element={<SetupFocusDetails />} />
              <Route path="/onboarding/suite/setup/email" element={<SetupEmail />} />
              <Route path="/onboarding/suite/setup/attribution" element={<SetupAttribution />} />
              <Route path="/onboarding/suite/setup/reminder-channels" element={<SetupReminderChannels />} />
              <Route path="/onboarding/suite/setup/notifications" element={<SetupNotificationPrePermission />} />
              <Route path="/onboarding/suite/setup/intensity" element={<SetupIntensity />} />
              <Route path="/onboarding/suite/setup/tool-preference" element={<SetupToolPreferenceGated />} />
              <Route path="/onboarding/suite/setup/workspace-template" element={<SetupWorkspaceTemplate />} />
              <Route path="/onboarding/suite/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/suite/setup/plot-synthesis" element={<SetupPlotSynthesis />} />

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
                <Route index element={<Navigate to="/dashboard/boards" replace />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/routine-reminders" element={<RoutineReminderSettings />} />
                <Route path="settings/plan-reminders" element={<PlanReminderSettings />} />
                <Route path="report-issue" element={<ReportAppIssue />} />
                <Route path="admin/support" element={<AdminSupportInbox />} />
                <Route path="boards" element={<Boards />} />
                <Route path="boards/accountability" element={<BoardAccountability />} />
                <Route path="timeline" element={<Chrono />} />
                <Route path="activity-tracking" element={<ActivityTracking />} />
                <Route path="chrono" element={<Chrono />} />
                <Route path="get-app" element={<GetAppStore />} />
              </Route>

              <Route path="/settings" element={<Navigate to="/dashboard/settings" replace />} />

              {/* Legal Pages — vel-format policies at /policies/:slug */}
              <Route path="/faq" element={<FAQ />} />
              <Route path="/help/plotting" element={<PlottingHelp />} />
              <Route path="/what-is-palette-plotting" element={<WhatIsPalettePlotting />} />
              <Route path="/terms" element={<Navigate to="/policies/app-terms" replace />} />
              <Route path="/privacy" element={<Navigate to="/policies/app-privacy" replace />} />
              <Route path="/acceptable-use" element={<Navigate to="/policies/acceptable-use" replace />} />
              <Route path="/dmca" element={<DMCA />} />
              <Route path="/billing" element={<Navigate to="/policies/billing" replace />} />
              <Route path="/pricingplans" element={<PricingPlans />} />
              <Route path="/eula" element={<Navigate to="/policies/app-terms" replace />} />
              <Route path="/quiz/blocking-manifestation" element={<Navigate to="/quiz/life-rebrand" replace />} />
              <Route path="/quiz/life-rebrand" element={<LifeRebrandQuiz />} />

              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            )}
          </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
