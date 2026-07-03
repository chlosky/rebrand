# Android native splash — white edges / halo (handoff)

**Project:** Palette Plotting / belief-craft-nexus  
**Branch:** `Mobile-app`  
**Android build:** `versionCode 235`  
**Symptom:** Splash still shows white edges/halo around logo despite transparent PNG replacement.

---

## Short answer: is code adding white padding?

**No.** Nothing in the splash pipeline sets white padding or a white background around the logo.

What the code **does** add:

| Layer | Color / behavior |
|-------|------------------|
| `splash.xml` base shape | Solid **`#0a0812`** (dark purple-black) — full screen |
| `splash.xml` logo item | **72dp insets** on all sides — those insets show **more `#0a0812`**, not white |
| `capacitor.config.ts` | `backgroundColor: '#0a0812'` |
| Capacitor overlay | `androidSplashResourceName: 'splash'`, `androidScaleType: 'CENTER_INSIDE'` |

The only **white** in Android res tied to branding is **`ic_launcher_background` = `#FFFFFF`** — that is the **home-screen app icon** mask background, **not** the native splash.

---

## Asset chain (current)

```
AndroidManifest → MainActivity theme @style/AppTheme.NoActionBarLaunch
  → styles.xml → @drawable/splash
    → splash.xml → #0a0812 rect + @drawable/ic_paletteplotting_splash_logo (72dp insets)
      → drawable-nodpi/ic_paletteplotting_splash_logo.png  (binary, ~233KB)
Capacitor SplashScreen plugin → same @drawable/splash + #0a0812
JS hide → NativeSplashGate → SplashScreen.hide()
```

**PNG path:** `android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_logo.png`  
**Renamed from** `ic_paletteplotting_brand.png` at build 233 to bust aapt cache.

---

## Likely causes of white edges (ranked)

### 1. Pixels inside the PNG (most common)
Even with "transparent" PNG:
- Light pink/blue **gradient corners** in the artwork anti-alias against transparency and read as a **white/light halo** on dark `#0a0812`.
- Previous repo comment (commit e29cedb4): near-edge-to-edge 720×720 tile made **rounded-rect corners + gradient corners** look like thick white halo.
- **Fix:** Re-export logo with **dark `#0a0812` matte** (not white) in semi-transparent edge pixels, OR crop tighter so gradient corners are not in the asset, OR wordmark ≤60% of square with generous **true alpha** padding (see IOS_APP_SETUP.md).

### 2. Android `<bitmap>` transparency quirk
In `layer-list`, `<bitmap android:src="...png">` on some Android versions composites transparent PNGs against an **implicit white matte**, producing white fringing.
- **Fix options:** Use `Theme.SplashScreen` + centered icon API, replace `<bitmap>` with `inset` + `drawable` vector, pre-compose logo onto `#0a0812` in the PNG (no transparency), or use 9-patch.

### 3. Stale install / wrong build
Old drawable id or old APK still installed. User must uninstall + install build **235+** after drawable rename.

### 4. Double splash flash
Cold start: windowBackground `@drawable/splash` then Capacitor SplashScreen shows same drawable — should match. Brief **WebView white** after hide is separate (NativeSplashGate waits for auth/ready).

### 5. Wrong asset confused with splash
`apple-ios-logo.png` / opaque launcher assets must **not** be used for splash (IOS_APP_SETUP.md). Launcher uses white `#FFFFFF` background — unrelated unless user is looking at icon not splash.

---

## What NOT to do
- Do not add white padding in XML (problem is not missing white — it's unwanted light edges).
- Do not auto-generate PNG from scripts (project convention).
- Do not use `Theme.SplashScreen` without testing — styles.xml comment says it **masks icons and ignores splash.xml** on this project.

---

## Acceptance test
1. Cold start Android build 235+, uninstall first.
2. Splash: dark `#0a0812` full screen, logo centered, **no white box/halo** around gradient artwork.
3. After ~1.5s native splash hides to Welcome/Dashboard without white flash.

---

## Files included (full source below)

1. `android/app/src/main/res/drawable/splash.xml`
2. `android/app/src/main/res/values/styles.xml`
3. `android/app/src/main/res/values/colors.xml`
4. `android/app/src/main/res/values/ic_launcher_background.xml` (launcher only — white)
5. `android/app/src/main/AndroidManifest.xml` (activity theme excerpt)
6. `capacitor.config.ts`
7. `src/components/NativeAppRootRedirect.tsx` (NativeSplashGate)
8. `android/app/src/main/java/com/paletteplotting/app/MainActivity.java`

**Binary (not inlined):** `android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_logo.png`

---


================================================================================
android/app/src/main/res/drawable/splash.xml
================================================================================

<?xml version="1.0" encoding="utf-8"?>
<!-- Native splash: full-bleed #0a0812 rect + ic_paletteplotting_splash_logo PNG.
     Renamed from ic_paletteplotting_brand (build 232) so Android/aapt pick up the
     new transparent-background asset instead of caching the old drawable id.
     dp insets only (Android rejects % on layer-list items). Insets frame the
     logo with generous padding — no crop, mask, or stretch; Capacitor uses
     CENTER_INSIDE on splash. Touching this file does NOT affect the home
     screen launcher icon (mipmap-*/ic_launcher_foreground.png). -->
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
            android:src="@drawable/ic_paletteplotting_splash_logo" />
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
android/app/src/main/res/values/ic_launcher_background.xml
================================================================================

<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
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

