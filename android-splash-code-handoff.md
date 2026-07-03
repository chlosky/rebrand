# Android splash — code handoff

Branch: `Mobile-app`  
versionCode: `238`

Binary (not inlined): `android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_wordmark.png`  
Binary (not inlined): `public/welcome-logo.png`  
Binary (not inlined): `public/apple-ios-logo.png`

---

## android/app/src/main/res/values-v31/styles.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <!--
      Android 12+ system splash (before WebView). Without this, the OS defaults to
      @mipmap/ic_launcher whose adaptive background is #FFFFFF — white rounded square
      around the logo. Use splash-specific drawable + matching icon background color.
    -->
    <style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">@color/splash_background</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/ic_paletteplotting_splash_icon</item>
        <item name="windowSplashScreenIconBackgroundColor">@color/splash_background</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
    </style>
</resources>
```

---

## android/app/src/main/res/values/styles.xml

```xml
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


    <!-- Launch (API 24–30): @drawable/splash. API 31+ overrides in values-v31/styles.xml (Theme.SplashScreen). -->
    <style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
        <item name="android:background">@drawable/splash</item>
        <item name="android:windowBackground">@drawable/splash</item>
    </style>
</resources>
```

---

## android/app/src/main/res/values/colors.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="splash_background">#0a0812</color>
</resources>
```

---

## android/app/src/main/res/values/ic_launcher_background.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">#FFFFFF</color>
</resources>
```

---

## android/app/src/main/res/drawable/splash.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- Native splash (API 24–30 + Capacitor overlay): #0a0812 + wordmark. API 31+ uses values-v31 Theme.SplashScreen. -->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <shape android:shape="rectangle">
            <solid android:color="@color/splash_background" />
        </shape>
    </item>
    <item android:drawable="@drawable/ic_paletteplotting_splash_wordmark_drawable" />
</layer-list>
```

---

## android/app/src/main/res/drawable/ic_paletteplotting_splash_icon.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- Android 12+ windowSplashScreenAnimatedIcon — wordmark only, NOT @mipmap/ic_launcher. -->
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@drawable/ic_paletteplotting_splash_wordmark"
    android:insetLeft="10%"
    android:insetTop="30%"
    android:insetRight="10%"
    android:insetBottom="30%" />
```

---

## android/app/src/main/res/drawable/ic_paletteplotting_splash_wordmark_drawable.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- Centered wordmark for splash.xml (API 24–30). Prefer @drawable over <bitmap> for alpha. -->
<inset xmlns:android="http://schemas.android.com/apk/res/android"
    android:drawable="@drawable/ic_paletteplotting_splash_wordmark"
    android:insetLeft="72dp"
    android:insetTop="72dp"
    android:insetRight="72dp"
    android:insetBottom="72dp" />
```

---

## android/app/src/main/res/mipmap-anydpi-v26/ic_launcher.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background"/>
    <foreground android:drawable="@drawable/ic_launcher_foreground"/>
</adaptive-icon>
```

---

## android/app/src/main/res/drawable/ic_launcher_foreground.xml

```xml
<?xml version="1.0" encoding="utf-8"?>
<!--
  Adaptive icon foreground layer.
  The mipmap PNGs are the iOS app icon scaled to 65% of the 108dp canvas
  (~70dp) and centered with transparent padding. The Palette Plotting wordmark
  is ~85% of the iOS icon's width, so at this scale the wordmark renders
  ~60dp wide — comfortably inside Android's 66dp circular safe-zone with
  ~3dp margin per side so the "S" and the "l" don't catch the launcher
  mask on circular icon themes. The iOS rounded-rect's own corners may
  still be clipped on aggressive circle masks — that's the intentional
  trade-off for full wordmark visibility.
-->
<layer-list xmlns:android="http://schemas.android.com/apk/res/android">
    <item>
        <bitmap
            android:gravity="center"
            android:src="@mipmap/ic_launcher_foreground" />
    </item>
</layer-list>
```

---

## android/app/src/main/AndroidManifest.xml

```xml
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
```

---

## android/app/src/main/java/com/paletteplotting/app/MainActivity.java

```java
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
```

---

## android/app/build.gradle (excerpt)

```gradle
        versionCode 238
        versionName "1.0.7"
```

```gradle
    implementation "androidx.core:core-splashscreen:$coreSplashScreenVersion"
```

---

## android/variables.gradle

```gradle
ext {
    minSdkVersion = 24
    compileSdkVersion = 36
    targetSdkVersion = 36
    androidxActivityVersion = '1.11.0'
    androidxAppCompatVersion = '1.7.1'
    androidxCoordinatorLayoutVersion = '1.3.0'
    androidxCoreVersion = '1.17.0'
    androidxFragmentVersion = '1.8.9'
    coreSplashScreenVersion = '1.2.0'
    androidxWebkitVersion = '1.14.0'
    junitVersion = '4.13.2'
    androidxJunitVersion = '1.3.0'
    androidxEspressoCoreVersion = '3.7.0'
    cordovaAndroidVersion = '14.0.1'
}
```

---

## capacitor.config.ts

```typescript
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
```

---

## scripts/extract-splash-wordmark.py

```python
#!/usr/bin/env python3
"""Build true-transparent Android splash wordmark from public/welcome-logo.png."""
from __future__ import annotations

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "public" / "welcome-logo.png"
OUT = ROOT / "android" / "app" / "src" / "main" / "res" / "drawable-nodpi" / "ic_paletteplotting_splash_wordmark.png"
CANVAS = 1024
PADDING_RATIO = 0.18


def is_wordmark_pixel(r: int, g: int, b: int, a: int) -> bool:
    if a < 16:
        return False
    return max(r, g, b) <= 45


def main() -> None:
    src = Image.open(SOURCE).convert("RGBA")
    w, h = src.size
    px = src.load()

    out = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    opx = out.load()

    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if is_wordmark_pixel(r, g, b, a):
                # White wordmark on true transparency for #0a0812 splash background
                opx[x, y] = (255, 255, 255, a)

    bbox = out.getbbox()
    if not bbox:
        raise SystemExit("No wordmark pixels found in welcome-logo.png")

    cropped = out.crop(bbox)
    cw, ch = cropped.size
    side = max(cw, ch)
    pad = int(side * PADDING_RATIO)
    canvas_side = side + pad * 2

    canvas = Image.new("RGBA", (canvas_side, canvas_side), (0, 0, 0, 0))
    ox = (canvas_side - cw) // 2
    oy = (canvas_side - ch) // 2
    canvas.paste(cropped, (ox, oy), cropped)

    if canvas_side != CANVAS:
        canvas = canvas.resize((CANVAS, CANVAS), Image.Resampling.LANCZOS)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(OUT, optimize=True)

    data = list(canvas.getdata())
    total = len(data)
    trans = sum(1 for *_, a in data if a < 16)
    visible = total - trans
    print(f"Wrote {OUT} ({CANVAS}x{CANVAS})")
    print(f" transparent={trans/total:.1%} visible_pixels={visible}")


if __name__ == "__main__":
    main()
```

---

## src/components/NativeAppRootRedirect.tsx

```tsx
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
```

---

## src/pages/onboarding/Welcome.tsx (excerpt)

```tsx
const WELCOME_LOGO = "/welcome-logo.png";

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

const Welcome = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();

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

  return (
    <OnboardingLayout ...>
      <WelcomeHeroBackground />
      <WelcomeBody
        showLogo
        topPaddingClass="pt-[calc(var(--app-safe-area-top)+2.5rem)] md:pt-0"
      />
    </OnboardingLayout>
  );
};
```
