import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route, Outlet, Navigate } from "react-router-dom";
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
import WebPaywall from "./pages/onboarding/WebPaywall";
import PostPaywallLoading from "./pages/onboarding/PostPaywallLoading";
import {
  SetupFocusCategories,
  SetupHomeFocus,
  SetupMoodboardFocus,
  SetupOfficePlanningSystem,
  SetupBeginJourney,
  SetupEmail,
  SetupName,
  SetupAttribution,
  SetupPlotLoading,
  SetupPlotSynthesis,
  SetupStartingSystem,
} from "./pages/onboarding/setup";
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
import { SiteAccessGate } from "@/components/SiteAccessGate";
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

const WebResubscribeRedirect = () => <Navigate to="/onboarding/web-paywall" replace />;

const App = () => {
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
            <SiteAccessGate>
            <NativeSplashGate />
            <ScrollToTop />
            <WebGetAppAfterPurchaseDialog />
            <Routes>
              <Route path="/" element={<NativeAppRootRedirect />} />
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
              <Route path="/newsletter" element={<GetNewsletter />} />
              <Route path="/resubscribe" element={<WebResubscribeRedirect />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />
              <Route path="/payment-processing" element={<PaymentProcessing />} />
              <Route path="/activate" element={<Activate />} />
              <Route path="/verify-email" element={<VerifyEmail />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              
              {/* Onboarding Flow */}
              <Route path="/onboarding/welcome" element={<Welcome />} />

              <Route path="/onboarding/web-paywall" element={<WebPaywall />} />
              <Route path="/onboarding/post-paywall" element={<PostPaywallLoading />} />

              {/* Personalized setup flow (web + native) */}
              <Route path="/onboarding/setup/name" element={<SetupName />} />
              <Route path="/onboarding/setup/starting-system" element={<SetupStartingSystem />} />
              <Route path="/onboarding/setup/focus-categories" element={<SetupFocusCategories />} />
              <Route path="/onboarding/setup/home-focus" element={<SetupHomeFocus />} />
              <Route path="/onboarding/setup/office-planning-system" element={<SetupOfficePlanningSystem />} />
              <Route path="/onboarding/setup/moodboard-focus" element={<SetupMoodboardFocus />} />
              <Route path="/onboarding/setup/begin-journey" element={<SetupBeginJourney />} />
              <Route path="/onboarding/setup/attribution" element={<SetupAttribution />} />
              <Route path="/onboarding/setup/plot-loading" element={<SetupPlotLoading />} />
              <Route path="/onboarding/setup/plot-synthesis" element={<SetupPlotSynthesis />} />
              <Route path="/onboarding/setup/email" element={<SetupEmail />} />

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
            </SiteAccessGate>
          </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </AuthProvider>
  </ThemeProvider>
  );
};

export default App;
