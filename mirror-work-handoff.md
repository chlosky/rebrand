# Mirror Work — handoff (Android vs iOS / Web)

**Project:** Palette Plotting / belief-craft-nexus  
**Branch:** `Mobile-app`  
**Routes:** `/dashboard/mirror`, `/dashboard/mind-the-mirror` → `MirrorRehearsalRoute`  
**Android build:** `versionCode 231` (check `android/app/build.gradle` for current)

---

## Architecture (important)

Mirror Work is **not one component with platform branches**. It is **two forked React files** (~3,900 lines each) selected at the route:

| Platform | React component | Lines (approx) |
|----------|-----------------|----------------|
| **Android native app** | `MirrorRehearsalAndroid.tsx` | ~3,935 |
| **iOS native + web + PWA** | `MirrorRehearsal.tsx` | ~3,884 |

There is **no shared runtime** between Android and iOS/web inside the mirror UI — changes must often be applied **twice** unless extracted to a shared module.

---

## Route splitter (FULL FILE)

```tsx
// src/pages/features/MirrorRehearsalRoute.tsx
import { Capacitor } from "@capacitor/core";
import MirrorRehearsal from "./MirrorRehearsal";
import MirrorRehearsalAndroid from "./MirrorRehearsalAndroid";

/**
 * Platform entry only — routes Android native app to MirrorRehearsalAndroid;
 * iOS and web use MirrorRehearsal (no shared runtime branches between them).
 */
const MirrorRehearsalRoute = () => {
  if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
    return <MirrorRehearsalAndroid />;
  }
  return <MirrorRehearsal />;
};

export default MirrorRehearsalRoute;
```

```tsx
// src/App.tsx (nested under /dashboard/*)
<Route path="mirror" element={<MirrorRehearsalRoute />} />
<Route path="mind-the-mirror" element={<MirrorRehearsalRoute />} />
```

---

## Capacitor plugin bridge (shared JS API)

```tsx
// src/plugins/nativeMirror.ts
import { registerPlugin } from "@capacitor/core";

type NativeMirrorStartOptions = {
  scene: "hearts" | "coins" | "gold" | "rain" | "summit" | "none";
  x: number;
  y: number;
  width: number;
  height: number;
};

type NativeMirrorPlugin = {
  isAvailable(): Promise<{ available: boolean; platform: string }>;
  start(options: NativeMirrorStartOptions): Promise<void>;
  stop(): Promise<void>;
  setScene(options: { scene: NativeMirrorStartOptions["scene"] }): Promise<void>;
  updateLayout(options: { x: number; y: number; width: number; height: number }): Promise<void>;
};

export const NativeMirror = registerPlugin<NativeMirrorPlugin>("NativeMirror");
```

### Native implementations

| Platform | File | Stack |
|----------|------|-------|
| Android | `android/.../NativeMirrorPlugin.java` + `NativeMirrorView.java` | **CameraX** front camera + **ML Kit selfie segmentation**; native `View` overlaid on WebView at mirror rect |
| iOS | `ios/.../NativeMirrorPlugin.swift` | **AVFoundation** + **Vision** + **CoreImage**; native view over mirror rect |

Registered in `MainActivity.java`: `registerPlugin(NativeMirrorPlugin.class)`.

---

## Side-by-side: Android vs iOS / Web

### 1. Which file runs

| | Android | iOS / Web |
|---|---------|-----------|
| Component | `MirrorRehearsalAndroid.tsx` | `MirrorRehearsal.tsx` |
| Detection | `Capacitor.getPlatform() === "android"` in route | Everything else |

### 2. Camera acquisition

| | Android | iOS / Web |
|---|---------|-----------|
| Permission | `@capacitor/camera` `Camera.requestPermissions` before `getUserMedia` | iOS: optional permissions API; native hook via `useNativeCamera` |
| Stream | `getUserMedia` only (no `useNativeCamera` on Android file) | iOS app: `useNativeCamera` → higher res (1920×1080 ideal), then fallback to `getUserMedia` |
| Resolution | 1280×720 ideal | Web: 1280×720; iOS native: 1920×1080 ideal |

```tsx
// iOS/web only — src/hooks/use-native-camera.ts
// Native iOS: higher quality. Native Android WebView: (not used — Android uses MirrorRehearsalAndroid.tsx)
if (isNative && Capacitor.getPlatform() === 'ios') {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { facingMode: 'user', width: { ideal: 1920 }, height: { ideal: 1080 } },
    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
  });
}
```

### 3. Scene rendering (hearts / coins / gold / rain / summit)

Three layers possible:

1. **Web canvas overlay** — TensorFlow.js **BodyPix** segmentation + HTML `<canvas>` particle/effect loops (both files).
2. **Native compositor** — `NativeMirror.start({ scene, x, y, width, height })` mounts native camera+segmentation over the mirror card.

| | Android | iOS | Web |
|---|---------|-----|-----|
| Native compositor when scene selected | **Yes** — `nativeSceneActive = active && ready && nativeScene !== "none"` | **Yes** — only if `isNativeIosMirror && …` | **No** — canvas only |
| Canvas BodyPix path | Yes (when not `nativeSceneActive`) | Yes (when not `nativeSceneActive`) | Yes |
| Native stack | CameraX + ML Kit (`NativeMirrorView.java`) | Vision + CoreImage (`NativeMirrorPlugin.swift`) | N/A |

**Critical Android constraint** — CameraX and WebView `getUserMedia` **cannot both hold the front camera**:

```tsx
// MirrorRehearsalAndroid.tsx — when native scene active, STOP web video tracks
if (nativeSceneActive) {
  stream.getVideoTracks().forEach((t) => t.stop());
  if (videoRef.current) videoRef.current.srcObject = null;
} else if (ready) {
  await NativeMirror.stop();
  await reattachWebVideo(); // re-acquire getUserMedia for canvas/none mode
}
```

iOS keeps WebView video for canvas mode and uses native overlay **in parallel** (different camera architecture).

### 4. `<video>` visibility (canvas scenes)

| | Android | iOS native | Web |
|---|---------|------------|-----|
| Native scene active | `opacity: 0` (native owns person layer) | `opacity: 0` | N/A |
| Canvas scene (hearts, etc.) | Hide video after first canvas draw (`canvasHasDrawn ? 0 : 1`) | **Keep `opacity: 1`** so `drawImage(video)` keeps sampling live frames | Hide after first canvas draw |
| Display | `active && ready ? block : none` | `active ? block : none` | same as iOS file |

```tsx
// MirrorRehearsal.tsx (iOS + web) — video opacity logic
opacity: (() => {
  if (nativeSceneActive) return 0;
  if (usingCanvasScene) {
    if (Capacitor.isNativePlatform()) return 1; // iOS: keep video for canvas sampling
    return canvasHasDrawn ? 0 : 1;              // web: hide after draw
  }
  return 1;
})(),
```

```tsx
// MirrorRehearsalAndroid.tsx — video opacity logic
opacity: (() => {
  if (!ready) return 0;
  if (nativeSceneActive) return 0;
  if (usingCanvasScene) return canvasHasDrawn ? 0 : 1; // same as web, NOT iOS behavior
  return 1;
})(),
```

### 5. Android-only: media volume routing

Android file plays a **silent looping MP3** so WebAudio scene sounds (rain, hearts, etc.) route to **USAGE_MEDIA** and respond to hardware volume keys:

```tsx
// MirrorRehearsalAndroid.tsx — mount effect only in Android file
const el = new Audio(SILENT_MP3_DATA_URI);
el.loop = true;
el.volume = 0;
el.play().catch(/* retry on gesture */);
```

Not present in `MirrorRehearsal.tsx`.

### 6. Native layout sync

| | Android | iOS |
|---|---------|-----|
| `NativeMirror.updateLayout` | On start + resize observer | start + resize + scroll + **visualViewport** + **RAF tick loop** for momentum scroll |
| iOS RAF loop | No | Yes — keeps native frame pinned during scroll |

### 7. Confidence meter (shared concept)

Both files implement the same **volume-only** meter (no face/eye detection). See `MIRROR_MODE_IMPLEMENTATION.md`:

- Web Audio `AnalyserNode`, RMS → dB, 25-sample average, 2.5s update interval, feedback every 7s.

---

## Scene pack → native scene mapping (both files)

```tsx
const nativeScene = useMemo(() => {
  if (selectedPack === "hearts-overlay") return "hearts";
  if (selectedPack === "coins-overlay") return "coins";
  if (selectedPack === "gold-sparks-overlay") return "gold";
  if (selectedPack === "rain-thunder-overlay") return "rain";
  if (selectedPack === "summit-top") return "summit";
  return "none";
}, [selectedPack]);
```

- **`none` pack:** web video + optional BodyPix canvas only; native compositor stopped.
- **Scene pack + tier access:** native compositor starts (Android always when active; iOS when `isNativeIosMirror`).

---

## Manifestation Charge signal

Both files call on session start:

```tsx
void recordDailyManifestationSignal("mirror_work");
```

Inserts into `manifestation_power_daily_signals`. **Known production issue:** UNIQUE constraint on `(user_id, signal_date, signal_kind)` was not dropped on live DB (PostgreSQL truncated constraint name). Migration fix:

`supabase/migrations/20260522140000_drop_manifestation_power_unique_truncated_name.sql`

Second session same day → `409` / `23505` until migration applied. Mirror UI still works; meter insert may warn in console.

---

## File index

| Path | Role |
|------|------|
| `src/pages/features/MirrorRehearsalRoute.tsx` | Platform router |
| `src/pages/features/MirrorRehearsalAndroid.tsx` | **Android only** UI + camera + canvas + native mirror |
| `src/pages/features/MirrorRehearsal.tsx` | **iOS + web** UI + camera + canvas + native mirror (iOS) |
| `src/plugins/nativeMirror.ts` | JS plugin registration |
| `src/hooks/use-native-camera.ts` | iOS-native camera tuning (not used on Android mirror file) |
| `src/lib/overlayBootstrap.ts` | Canvas DPR bootstrap (shared import) |
| `android/.../NativeMirrorPlugin.java` | Android Capacitor plugin |
| `android/.../NativeMirrorView.java` | CameraX + ML Kit render view |
| `ios/.../NativeMirrorPlugin.swift` | iOS Capacitor plugin + manager |
| `MIRROR_MODE_IMPLEMENTATION.md` | Volume meter behavior spec |

---

## Key code excerpts

### Android — start native compositor

```tsx
// MirrorRehearsalAndroid.tsx
useEffect(() => {
  const startNative = async () => {
    if (!active || !ready || nativeScene === "none" || !mirrorContainerRef.current) {
      await NativeMirror.stop();
      return;
    }
    const rect = mirrorContainerRef.current.getBoundingClientRect();
    await NativeMirror.start({
      scene: nativeScene,
      x: rect.left,
      y: rect.top,
      width: rect.width,
      height: rect.height,
    });
  };
  startNative();
  // ... resize observer, cleanup stopNative
}, [active, ready, nativeScene]);
```

### iOS — start native compositor (+ aggressive layout sync)

```tsx
// MirrorRehearsal.tsx
useEffect(() => {
  if (!isNativeIosMirror) return;
  // ... startNative, updateLayout
  window.addEventListener("scroll", syncLayout, true);
  window.visualViewport?.addEventListener("resize", syncLayout);
  let rafId = requestAnimationFrame(function tick() {
    void updateLayout();
    rafId = requestAnimationFrame(tick);
  });
  return () => { /* remove listeners, cancel raf, stopNative */ };
}, [active, ready, nativeScene, isNativeIosMirror]);
```

### Android — NativeMirrorView (native Java header)

```java
/**
 * Native camera + ML Kit selfie segmentation view for Android Mirror Work.
 * Renders the segmented person with a transparent background so the WebView
 * canvas scene shows through underneath.
 */
public class NativeMirrorView extends View {
    // CameraX ProcessCameraProvider + ML Kit SelfieSegmenter
}
```

---

## Console logs you may see (both platforms)

| Log | Meaning |
|-----|---------|
| `[Mirror] Segmentation failure state reset on mount` | Normal on mount (React Strict Mode may log twice) |
| `[Mirror] loadedmetadata` / `video.play() resolved` | Web camera path OK |
| `[Mirror] fallback ready` | Scene/canvas fallback path ready |
| `[NativeMirror-Android] start failed` | Native compositor failed to start |
| `[manifestation_charge] insert failed … 23505` | DB unique constraint — apply migration |

---

## What is intentionally the same

- Affirmation set picker, speed slider, pack selector UI
- BodyPix model load + segmentation interval (600ms mobile / 100ms desktop when canvas active)
- Volume confidence meter + feedback copy tiers
- Tool page shell (header, safe area, sidebar, theme)
- `recordDailyManifestationSignal("mirror_work")`

---

## What is intentionally different

| Concern | Android | iOS / Web |
|---------|---------|-----------|
| Source file | `MirrorRehearsalAndroid.tsx` | `MirrorRehearsal.tsx` |
| Native compositor | CameraX + ML Kit | Vision + CoreImage |
| Camera exclusivity | Native **or** web video, not both | Native overlay + web video coexist |
| Canvas video sampling | Hide video after canvas draw | iOS keeps video visible for canvas |
| Volume keys / WebAudio | Silent MP3 media anchor | Not needed |
| iOS RAF layout sync | No | Yes |
| `useNativeCamera` hook | Not used | iOS only |

---

## Kickoff prompt

> Mirror Work in Palette Plotting uses **two separate React files**: `MirrorRehearsalAndroid.tsx` (Android app) and `MirrorRehearsal.tsx` (iOS + web). Route: `MirrorRehearsalRoute.tsx`. Native scenes use Capacitor plugin `NativeMirror` (CameraX+ML Kit on Android, Vision on iOS). Android cannot hold WebView camera and CameraX simultaneously — web tracks are stopped when `nativeSceneActive`.  
>  
> **[Describe issue: e.g. native scene not showing, camera black, segmentation OOM, volume meter, 409 on manifestation signal, canvas vs native scene, etc.]**  
>  
> Platform: [ Android / iOS / Web ]  
> Scene pack: [ none / hearts / coins / gold / rain / summit ]

---

## Note on full source

Each mirror component is ~3,900 lines. For full source, open in repo:

- `src/pages/features/MirrorRehearsalAndroid.tsx`
- `src/pages/features/MirrorRehearsal.tsx`

Do not assume a fix in one file applies to the other without checking the parallel section in the sibling file.
