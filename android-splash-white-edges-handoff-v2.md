# Android native splash — white halo STILL showing (handoff v2)

**Date:** 2026-05-23  
**Branch:** `Mobile-app`  
**Latest build tested on device:** **237** (`versionCode 237`, commit `14aaff06`)  
**User action taken:** Codemagic build → clear cache → uninstall → reinstall → cold start  
**Result:** **Still seeing logo with white / light rounded-square edges around the wordmark.**

---

## What we need

The PNG asset fix **did not resolve the issue on a real Android device**. Asset analysis shows the native PNG is clean (no pastel tile). We need the **next fix** — likely Android drawable alpha handling and/or the post-splash Welcome screen — with a concrete patch plan.

---

## Symptom (user report)

- Cold start shows **Palette Plotting wordmark on dark purple-black** (`#0a0812`) — correct background color
- But the wordmark still appears inside a **light / white rounded-square halo** (same visual as before)
- Persists after builds **236 and 237**, fresh install, cache cleared
- **Not** the home-screen launcher icon (user is looking at launch splash / first screen)

---

## Timeline of fixes attempted

| Build | Commit | Change | Device result |
|-------|--------|--------|---------------|
| 232–233 | various | Renamed splash PNG (`ic_paletteplotting_brand` → `ic_paletteplotting_splash_logo`) for aapt cache bust | Halo still present |
| 236 | `4ee54ac9` | Replaced baked pastel tile PNG with **wordmark-only** `ic_paletteplotting_splash_wordmark.png` extracted from `welcome-logo.png`; deleted old `ic_paletteplotting_splash_logo.png` | Halo still present |
| 237 | `14aaff06` | Locked naming to `ic_paletteplotting_splash_wordmark`; comment/doc cleanup | Halo still present after uninstall/reinstall |

---

## Verified: the native splash PNG is NOT the old broken asset

Pixel analysis (Pillow, local repo):

| File | Opaque pixels | Pastel/light tile pixels | Notes |
|------|---------------|--------------------------|-------|
| `ic_paletteplotting_splash_wordmark.png` | 31,811 | **0% pastel** (100% near-white text only) | 25 KB, 1024×1024, true transparency |
| `public/welcome-logo.png` | 991,727 | **30.2% pastel** | Full marketing tile with rounded pastel square — **source of original halo** |
| `public/apple-ios-logo.png` | 1,048,576 | 34.4% pastel | iOS App Store icon only — **NOT referenced by Android splash** |

**Conclusion:** The white halo on device is **unlikely** to be caused by pastel pixels baked into `ic_paletteplotting_splash_wordmark.png`. The repo is shipping the correct asset. Something else is rendering the light box.

---

## Primary hypothesis: Android `<bitmap>` ignores / breaks PNG alpha

Current `splash.xml` uses a `<layer-list>`:

1. Solid `#0a0812` rectangle
2. `<bitmap android:src="@drawable/ic_paletteplotting_splash_wordmark">` centered with 72dp insets

**Known Android behavior:** `<bitmap>` inside `<layer-list>` often **does not preserve PNG transparency** correctly. Transparent pixels may composite as **white** (or black) on many OEMs/API levels, producing exactly a **light rectangular halo** around the logo — even when the PNG has perfect alpha in a desktop viewer.

This matches: dark background correct, wordmark correct, **white box around wordmark**.

### Recommended fix A (most reliable)

**Pre-composite a flat splash image — zero transparency:**

1. Script or design export: `#0a0812` full-bleed canvas + centered white wordmark, saved as **opaque PNG or WebP**
2. e.g. `ic_paletteplotting_splash_flat.png` in `drawable-nodpi/`
3. Set `windowBackground` to that single flat image OR a layer-list with only one `<bitmap>` of the flat file (no transparent regions at all)
4. Do **not** rely on transparent PNG + `<bitmap>` compositing

### Recommended fix B (alternative)

Replace `<bitmap>` in layer-list with:

```xml
<item
    android:drawable="@drawable/ic_paletteplotting_splash_wordmark"
    android:gravity="center"
    android:left="72dp"
    android:top="72dp"
    android:right="72dp"
    android:bottom="72dp" />
```

(Some devices handle `@drawable` PNG references better than `<bitmap>` — test on device.)

### Recommended fix C (Android 12+)

Evaluate `Theme.SplashScreen` with explicit `windowSplashScreenBackground` = `#0a0812` and a **small centered icon drawable** (wordmark-only, no tile). Project previously avoided this because comments said it "masks icons and ignores splash.xml" — but may be worth revisiting with correct attrs only.

---

## Secondary hypothesis: post-splash Welcome screen looks like splash

Native splash hides ~**1.5s** after cold start (`MIN_NATIVE_SPLASH_HOLD_MS` in `NativeSplashGate`). Then WebView shows **Welcome** which uses the **full** marketing logo:

```tsx
// src/pages/onboarding/Welcome.tsx
const WELCOME_LOGO = "/welcome-logo.png";  // ← 30% pastel tile baked in
```

Welcome **always** shows logo on native (`showLogo` hardcoded true). User may perceive this as "splash still broken" if the transition is fast.

**Recommended fix D:** On native Android, Welcome should use wordmark-only asset (`welcome-logo-mark-only.png` or same extracted wordmark), **not** `welcome-logo.png`.

---

## What is NOT causing splash halo (ruled out)

- **`apple-ios-logo.png`** — not in Android res, not in splash.xml
- **Old `ic_paletteplotting_splash_logo.png`** — deleted from repo at build 236
- **White launcher adaptive icon background** (`ic_launcher_background` = `#FFFFFF`) — home screen only
- **Codemagic overwriting splash** — no splash/logo steps in `codemagic.yaml`
- **Capacitor generating splash PNG** — plugin reads `@drawable/splash` from res; no generation
- **Stale APK without uninstall** — user confirmed uninstall + reinstall on build 237

---

## Complete native splash pipeline (only path)

```
AndroidManifest.xml
  MainActivity android:theme="@style/AppTheme.NoActionBarLaunch"

styles.xml → AppTheme.NoActionBarLaunch
  android:windowBackground = @drawable/splash

splash.xml
  layer-list: #0a0812 shape + <bitmap src="@drawable/ic_paletteplotting_splash_wordmark">

drawable-nodpi/ic_paletteplotting_splash_wordmark.png  ← ONLY splash logo PNG in android/res

capacitor.config.ts
  SplashScreen.androidSplashResourceName: 'splash'
  backgroundColor: '#0a0812'
  androidScaleType: 'CENTER_INSIDE'
  launchAutoHide: false

Capacitor SplashScreen plugin (Android 12+ path)
  installSplashScreen() — keeps launch theme windowBackground visible until JS hides

NativeSplashGate (NativeAppRootRedirect.tsx)
  SplashScreen.hide({ fadeOutDuration: 0 }) after auth + Welcome/Dashboard ready + 1500ms min hold
```

**No** `values-v31/` splash theme override. **No** custom splash layout XML.

---

## Current source files (copy-paste reference)

### `android/app/src/main/res/drawable/splash.xml`

```xml
<?xml version="1.0" encoding="utf-8"?>
<!-- Native splash: full-bleed #0a0812 + ic_paletteplotting_splash_wordmark.png (wordmark-only, transparent). -->
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
            android:src="@drawable/ic_paletteplotting_splash_wordmark" />
    </item>
</layer-list>
```

### `android/app/src/main/res/values/styles.xml` (launch theme only)

```xml
<style name="AppTheme.NoActionBarLaunch" parent="AppTheme.NoActionBar">
    <item name="android:background">@drawable/splash</item>
    <item name="android:windowBackground">@drawable/splash</item>
</style>
```

### `capacitor.config.ts` (SplashScreen plugin)

```typescript
SplashScreen: {
  launchShowDuration: 30000,
  launchAutoHide: false,
  backgroundColor: '#0a0812',
  androidSplashResourceName: 'splash',
  androidScaleType: 'CENTER_INSIDE',
  showSpinner: false,
},
```

### `scripts/extract-splash-wordmark.py`

Extracts **dark wordmark pixels only** from `public/welcome-logo.png`, outputs white text on transparent PNG to `ic_paletteplotting_splash_wordmark.png`. Does **not** pre-composite onto `#0a0812`.

---

## NativeSplashGate timing (affects when user sees Welcome logo)

```typescript
const MIN_NATIVE_SPLASH_HOLD_MS = 1500;

// Welcome.tsx on native:
requestAnimationFrame × 2 + 75ms → signalNativeSplashReadyToHide()
// Then gate waits until MIN_NATIVE_SPLASH_HOLD_MS elapsed → SplashScreen.hide()
```

After hide: Welcome renders `<img src="/welcome-logo.png">` with full pastel tile.

---

## Acceptance test (after next fix)

1. Uninstall app completely
2. Install new build (bump `versionCode`)
3. Cold start — **during first ~1.5s only** (native splash): dark `#0a0812`, white wordmark, **no light rounded square**
4. After transition to Welcome: if Welcome still uses `welcome-logo.png`, pastel tile may appear — decide if that's acceptable or fix Welcome separately

**Ask user:** Does halo appear **only at cold start** or **also on Welcome screen**? That distinguishes native drawable alpha vs WebView logo asset.

---

## Suggested implementation order

1. **Add `scripts/compose-splash-flat.py`** — flatten wordmark onto `#0a0812` opaque PNG (e.g. 1080×1920 or 1024×1024)
2. **Change `splash.xml`** — use flat opaque PNG as sole background (simplest: `windowBackground` = flat PNG drawable directly)
3. **Bump `versionCode`** to 238
4. **Optional same PR:** Welcome native logo → wordmark-only asset
5. **Do not** rename the PNG again — keep `ic_paletteplotting_splash_wordmark` or add new name `ic_paletteplotting_splash_flat` with clear purpose

---

## Repo paths quick reference

| Path | Role |
|------|------|
| `android/app/src/main/res/drawable/splash.xml` | Native splash layout |
| `android/app/src/main/res/drawable-nodpi/ic_paletteplotting_splash_wordmark.png` | Current transparent wordmark (clean, but alpha may break in `<bitmap>`) |
| `public/welcome-logo.png` | Welcome WebView logo — **has pastel tile** |
| `public/welcome-logo-mark-only.png` | Partial wordmark extract (~22% pastel still — verify before use) |
| `public/apple-ios-logo.png` | iOS App Store only |
| `src/pages/onboarding/Welcome.tsx` | Post-splash first screen logo |
| `src/components/NativeAppRootRedirect.tsx` | Splash hide gate |
| `android/app/build.gradle` | `versionCode 237` |

---

## Prior handoff

`android-splash-white-edges-handoff.md` (v1) — outdated; references deleted `ic_paletteplotting_splash_logo.png` and assumes PNG transparency fix would work. **It did not on device.**
