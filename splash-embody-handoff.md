================================================================================
capacitor.config.ts
================================================================================
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.paletteplotting.app',
  appName: 'Palette Plotting',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    iosScheme: 'https',
    hostname: 'localhost',
  },
  ios: {
    contentInset: 'never',
  },
  plugins: {
    /** JS-driven hide via NativeSplashGate. launchShowDuration must be > 0 on iOS or the overlay never mounts. */
    SplashScreen: {
      launchShowDuration: 30000,
      launchAutoHide: false,
      backgroundColor: '#0a0812',
      androidSplashResourceName: 'splash',
      /** Legacy Capacitor ImageView path (when Android 12 API is not used): fit whole drawable, no crop. */
      androidScaleType: 'CENTER_INSIDE',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      iosImagePickerLimit: 1,
    },
    /** Avoid WKWebView shrinking + aggressive scroll that pulls headers under the status bar when inputs focus. */
    Keyboard: {
      resize: 'none',
    },
  },
};

export default config;


================================================================================
android/app/src/main/assets/capacitor.config.json
================================================================================
{
	"appId": "com.paletteplotting.app",
	"appName": "Palette Plotting",
	"webDir": "dist",
	"server": {
		"androidScheme": "https",
		"iosScheme": "https",
		"hostname": "localhost"
	},
	"ios": {
		"contentInset": "never"
	},
	"plugins": {
		"SplashScreen": {
			"launchShowDuration": 30000,
			"launchAutoHide": false,
			"backgroundColor": "#0a0812",
			"androidSplashResourceName": "splash",
			"androidScaleType": "CENTER_INSIDE",
			"showSpinner": false
		},
		"PushNotifications": {
			"presentationOptions": [
				"badge",
				"sound",
				"alert"
			]
		},
		"Camera": {
			"iosImagePickerLimit": 1
		},
		"Keyboard": {
			"resize": "none"
		}
	}
}


================================================================================
android/app/src/main/res/drawable/splash.xml
================================================================================
<?xml version="1.0" encoding="utf-8"?>
<!-- Native splash: full-bleed #0a0812 rect + your ic_paletteplotting_brand PNG (from welcome-logo).
     dp insets only (Android rejects % on layer-list items). Insets frame the logo ~60% width
     with generous padding — no crop, mask, or stretch; Capacitor uses CENTER_INSIDE on splash. -->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="#0a0812" />
        </shape>
    </item>
    <item
        android:left="72dp"
        android:top="72dp"
        android:right="72dp"
        android:bottom="72dp">
        <bitmap
            android:gravity="center"
            android:src="@drawable/ic_paletteplotting_brand" />
    </item>
</layer-list>


================================================================================
android/app/src/main/res/values/styles.xml
================================================================================
<?xml version="1.0" encoding="utf-8"?>
<resources>

    <!-- Base application theme. -->
    <style name="AppTheme" parent="Theme.AppCompat.Light.DarkActionBar">
        <!-- Customize your theme here. -->
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
    </style>

    <style name="AppTheme.NoActionBar" parent="Theme.AppCompat.DayNight.NoActionBar">
        <item name="windowActionBar">false</item>
        <item name="windowNoTitle">true</item>
        <item name="android:background">@null</item>
        <item name="android:statusBarColor">@android:color/transparent</item>
        <item name="android:windowDrawsSystemBarBackgrounds">true</item>
    </style>


    <!-- Launch: full @drawable/splash as window background (not Theme.SplashScreen — that masks icons and ignores splash.xml). -->
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:background">@drawable/splash</item>
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
</resources>

================================================================================
android/app/src/main/res/values/colors.xml
================================================================================
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#0a0812</color>
</resources>


================================================================================
android/app/src/main/AndroidManifest.xml
================================================================================
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/AppTheme">

        <activity
            android:configChanges="orientation|keyboardHidden|keyboard|screenSize|locale|smallestScreenSize|screenLayout|uiMode|navigation|density"
            android:name=".MainActivity"
            android:label="@string/title_activity_main"
            android:theme="@style/AppTheme.NoActionBarLaunch"
            android:launchMode="singleTask"
            android:exported="true"
            android:windowSoftInputMode="adjustNothing|stateHidden">

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

        </activity>

        <provider
            android:name="androidx.core.content.FileProvider"
            android:authorities="${applicationId}.fileprovider"
            android:exported="false"
            android:grantUriPermissions="true">
            <meta-data
                android:name="android.support.FILE_PROVIDER_PATHS"
                android:resource="@xml/file_paths"></meta-data>
        </provider>
    </application>

    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
    <!-- Mirror Work / WebView getUserMedia -->
    <uses-permission android:name="android.permission.CAMERA" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <!-- WebView getUserMedia(AUDIO_CAPTURE): Bridge requests this with RECORD_AUDIO -->
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <!-- Push (Android 13+) -->
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS" />

    <uses-feature android:name="android.hardware.camera" android:required="false" />
    <uses-feature android:name="android.hardware.camera.autofocus" android:required="false" />
</manifest>


================================================================================
android/app/src/main/java/com/paletteplotting/app/MainActivity.java
================================================================================
package com.paletteplotting.app;

import android.os.Bundle;
import android.view.WindowManager;
import android.webkit.WebSettings;
import com.getcapacitor.BridgeActivity;
import com.paletteplotting.app.NativeMirrorPlugin;

/**
 * Lets muted background / loop videos start without the WebView "tap to play" overlay where the
 * platform allows it (dashboard, embody, hero, etc.).
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(NativeMirrorPlugin.class);
        super.onCreate(savedInstanceState);
        // Match iOS KeyboardResize.None: IME draws over the WebView (no resize/pan). Capacitor Keyboard.setResizeMode is iOS-only.
        getWindow().setSoftInputMode(WindowManager.LayoutParams.SOFT_INPUT_ADJUST_NOTHING);
        applyWebViewMediaSettings();
    }

    @Override
    public void onResume() {
        super.onResume();
        applyWebViewMediaSettings();
    }

    private void applyWebViewMediaSettings() {
        if (getBridge() == null || getBridge().getWebView() == null) {
            return;
        }
        getBridge()
            .getWebView()
            .post(
                () -> {
                    if (getBridge() == null || getBridge().getWebView() == null) {
                        return;
                    }
                    WebSettings settings = getBridge().getWebView().getSettings();
                    settings.setMediaPlaybackRequiresUserGesture(false);
                    settings.setDomStorageEnabled(true);
                });
    }
}


================================================================================
android/app/src/main/res/layout/activity_main.xml
================================================================================
<?xml version="1.0" encoding="utf-8"?>
<androidx.coordinatorlayout.widget.CoordinatorLayout xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:app="http://schemas.android.com/apk/res-auto"
    xmlns:tools="http://schemas.android.com/tools"
    android:layout_width="match_parent"
    android:layout_height="match_parent"
    tools:context=".MainActivity">

    <WebView
        android:layout_width="match_parent"
        android:layout_height="match_parent" />
</androidx.coordinatorlayout.widget.CoordinatorLayout>


================================================================================
src/components/NativeAppRootRedirect.tsx
================================================================================
import { Navigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useIsNativeApp } from '@/hooks/use-native-app';
import Index from '@/pages/Index';
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
    return <Navigate to="/dashboard" replace />;
  }

  // Web/PWA: show homepage
  return <Index />;
};


================================================================================
src/App.tsx
================================================================================
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
import Settings from "./pages/Settings";
import SubliminalAudio from "./pages/features/SubliminalAudio";

import Affirmations from "./pages/features/Affirmations";
import AffirmationVisualizerV2 from "./pages/features/AffirmationVisualizerV2";

import NotFound from "./pages/NotFound";
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
import Welcome from "./pages/onboarding/Welcome";
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


================================================================================
src/pages/onboarding/Welcome.tsx
================================================================================
import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  WELCOME_ACCENT,
  WelcomeCosmicBackground,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";

/** Transparent brand logo — welcome screen + native splash (copy → SplashLogo.imageset). NEVER for AppIcon: Apple rejects transparent app icons; use public/apple-ios-logo.png for App Store only. */
const WELCOME_LOGO = "/welcome-logo.png";
const WELCOME_EYEBROW = "LOA · SP · scripting · self-concept";
const WELCOME_CONTINUE_TEXT = "Start my path";
const WELCOME_CTA_SUBTEXT = "~3 min set up";

/** Product-style primary: clean surface, no glow stack. */
const WELCOME_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

/** Centered rows with dot separators. */
const WELCOME_TOOL_ROWS: readonly (readonly string[])[] = [
  ["Subliminal Maker", "Robotic Affirming", "Scripting"],
  ["Mirror Work", "Belief Work", "Inspired Action"],
  ["Manifestation Lists", "AI Manifesting Guide"],
];

const WELCOME_TOOL_TEXT_CLASS = cn(
  "font-welcome-serif text-[13px] font-normal leading-[1.45] text-[#e8b8cc]",
);

const WELCOME_TOOL_BULLET_CLASS = cn(
  "px-1.5 font-welcome-serif text-[13px] text-[#e8b8cc]/65",
);

function WelcomeHeroBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <WelcomeCosmicBackground className="absolute inset-0" />
    </div>
  );
}

/** Platinum stars — matches homepage testimonials (MarketingTestimonials). */
const AWARD_STAR_CLASS = "h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]";

/** Curved five-star columns framing the award copy (no pill). */
const STAR_PAREN_OFFSETS = {
  left: ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"],
  right: ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"],
} as const;

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets = STAR_PAREN_OFFSETS[side];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center gap-[6px] py-1",
        side === "left" ? "items-end" : "items-start",
      )}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeAwardLine() {
  return (
    <div
      className="relative z-10 flex w-full items-center justify-center gap-3 px-1"
      aria-label="One of the most comprehensive manifesting apps"
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-white">
        <span className="block">One of the most</span>
        <span className="block">comprehensive</span>
        <span className="block">manifesting apps</span>
      </p>
      <StarParen side="right" />
    </div>
  );
}

function WelcomeFeatureGrid() {
  return (
    <div className="relative z-10 flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2.5 text-center">
        {WELCOME_TOOL_ROWS.map((row) => (
          <p key={row[0]} className={WELCOME_TOOL_TEXT_CLASS}>
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <span className={WELCOME_TOOL_BULLET_CLASS} aria-hidden>
                    ·
                  </span>
                ) : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function WelcomeLogo({ showLogo = false }: { showLogo?: boolean }) {
  if (!showLogo) return null;
  return (
    <div className="mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center">
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={120}
        height={120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeEyebrow() {
  return (
    <p className="hidden text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40 md:block">
      {WELCOME_EYEBROW}
    </p>
  );
}

function WelcomeTitle() {
  return (
    <h1 className="font-welcome-serif mt-0 max-w-[19rem] text-center text-[28px] font-normal leading-[1.14] tracking-[-0.02em] text-white md:mt-3 sm:text-[31px]">
      Your manifesting methods,{" "}
      <span style={{ color: WELCOME_ACCENT }}>in one place</span>
    </h1>
  );
}

function WelcomeDescription() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
  );
}

type WelcomeBodyProps = {
  showLogo?: boolean;
  topPaddingClass?: string;
  /** Native-only visual lift; does not affect OnboardingLayout fixed CTA. */
  contentLiftClass?: string;
};

function WelcomeBody({ showLogo, topPaddingClass, contentLiftClass }: WelcomeBodyProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5",
        contentLiftClass ?? "-translate-y-[0.32in]",
        topPaddingClass,
      )}
    >
      <WelcomeLogo showLogo={showLogo} />
      <WelcomeEyebrow />
      <WelcomeTitle />
      <WelcomeDescription />
      <WelcomeAwardLine />
      <WelcomeFeatureGrid />
    </div>
  );
}

const welcomeLayoutProps = {
  currentPage: 1 as const,
  welcomePage: true,
  welcomeSoloContinueButtonClassName: WELCOME_PRIMARY_CTA_CLASS,
  welcomeCtaSubtext: WELCOME_CTA_SUBTEXT,
  welcomeSignInAsTextLink: true,
};

const Welcome = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();

  useEffect(() => {
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    // Wait for cosmic shell paint before revealing WebView (avoids white flash after native splash).
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
  }, [isNative]);

  const onContinue = () => navigate("/onboarding/setup/name");

  const layout = (
    <OnboardingLayout
      {...welcomeLayoutProps}
      onContinue={onContinue}
      continueText={WELCOME_CONTINUE_TEXT}
      contentMaxWidthClass="max-w-[26rem]"
    >
      <WelcomeHeroBackground />
      <WelcomeBody
        showLogo
        topPaddingClass="pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:pt-0"
      />
    </OnboardingLayout>
  );

  if (isNative) {
    return (
      <OnboardingLayout
        {...welcomeLayoutProps}
        onContinue={onContinue}
        continueText={WELCOME_CONTINUE_TEXT}
        stackedNativeButtons
        expandNativeContentColumn
        contentMaxWidthClass="max-w-[26rem]"
        stackedNativePrimaryButtonClassName={WELCOME_PRIMARY_CTA_CLASS}
      >
        <WelcomeHeroBackground />
        <div className="flex min-h-0 flex-1 flex-col justify-center overflow-y-auto overscroll-y-contain pt-2 pb-[5.75rem] [-webkit-overflow-scrolling:touch]">
          <WelcomeBody
            showLogo
            topPaddingClass="pt-0"
            contentLiftClass="-translate-y-[0.05in]"
          />
        </div>
      </OnboardingLayout>
    );
  }

  return layout;
};

export default Welcome;


================================================================================
src/pages/Dashboard.tsx
================================================================================
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

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
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

      }
    };

    fetchUserData();
  }, [user]);

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
    setTimeout(() => navigate(path), 100);
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
              top: "env(safe-area-inset-top, 0px)",
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
              paddingTop: "calc(env(safe-area-inset-top, 0px) + 4rem + 1.5rem)",
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
            height: "env(safe-area-inset-top, 0px)",
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
        style={{ top: "env(safe-area-inset-top, 0px)" }}
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
        style={{ paddingTop: "calc(env(safe-area-inset-top, 0px) + 1rem)" }}
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


================================================================================
src/components/onboarding/SetupPage.tsx
================================================================================
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
            height: "env(safe-area-inset-top, 0px)",
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
            isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)]",
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
            ? { paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" }
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



================================================================================
src/components/onboarding/OnboardingLayout.tsx
================================================================================
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
            height: "env(safe-area-inset-top, 0px)",
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
            isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)]",
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
        style={isNative ? { paddingTop: "calc(env(safe-area-inset-top, 0px) + 2.5rem)" } : undefined}
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
                  ...(isCosmicShell ? { backgroundColor: WELCOME_COSMIC_BASE } : {}),
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


================================================================================
src/components/onboarding/OnboardingTypewriter.tsx
================================================================================
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


================================================================================
src/components/onboarding/SetupHeadingBlock.tsx
================================================================================
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


================================================================================
src/pages/onboarding/setup/EmbodyDailyIdentity.tsx
================================================================================
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
      <div className="flex w-full flex-col gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0"
          title="How will you embody your new identity each day?"
          subtitle={`Choose exactly five—they become your Inspired Actions on your dashboard. (${selected.length} of ${REQUIRED} selected)`}
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


================================================================================
src/pages/onboarding/setup/AffirmationRead.tsx
================================================================================
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


================================================================================
src/pages/onboarding/setup/Guide.tsx
================================================================================
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

        <div className="relative z-[1] h-[min(52vh,calc(100dvh-16rem))] w-full shrink-0 overflow-hidden">
          <div className="relative z-[1] h-full overflow-y-auto overflow-x-hidden overscroll-y-contain px-0.5 pb-2 [-webkit-overflow-scrolling:touch]">
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
        </div>
      </div>
    </SetupPage>
  );
}


================================================================================
src/pages/onboarding/setup/DesireCategory.tsx
================================================================================
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
      disableNativeScrollViewport
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
      <div className="flex min-h-0 flex-1 flex-col gap-3 sm:gap-4">
        <SetupHeadingBlock
          centered
          className="shrink-0 [&_h1]:text-3xl [&_h1]:leading-[1.08] sm:[&_h1]:text-4xl sm:[&_h1]:leading-[1.05]"
          title="What do you want to manifest most?"
          subtitle="Select one focus area."
        />

        <div className="grid min-h-0 flex-1 grid-cols-2 content-start gap-2.5 overflow-y-auto overscroll-y-contain pt-1.5 sm:gap-3 [-webkit-overflow-scrolling:touch]">
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


================================================================================
src/pages/onboarding/setup/ToolPreference.tsx
================================================================================
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



================================================================================
src/pages/onboarding/setup/PathLoading.tsx
================================================================================
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
          className="shrink-0 -mt-2 mb-1 sm:-mt-3"
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


================================================================================
src/pages/onboarding/setup/CurrentFriction.tsx
================================================================================
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



================================================================================
src/lib/onboardingSetupTheme.ts
================================================================================
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


================================================================================
src/lib/onboardingFlow.ts
================================================================================
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

