import { createRoot } from "react-dom/client";
import { Capacitor } from "@capacitor/core";
import { Keyboard, KeyboardResize } from "@capacitor/keyboard";
import "./index.css";

if (typeof window !== "undefined") {
  const path = window.location.pathname.replace(/\/$/, "");
  if (path.startsWith("/onboarding/subliminal")) {
    window.location.replace(`/${window.location.search}${window.location.hash}`);
  } else if (path === "/onboarding/welcome") {
    void import("./pages/onboarding/Welcome");
  }
}

import "./i18n";
import App from "./App.tsx";
import { readStoredAppearance } from "@/lib/appearancePreference";
import { applyNativeSafeAreaRootVars } from "@/lib/nativeSafeArea";
import {
  attachOneSignalListenersOnce,
  bootstrapOneSignal,
  resolvePushDeepLinkTarget,
} from "@/services/oneSignal";
import { captureAndPersistAttribution, captureAttributionFromUrl } from "@/lib/attribution";

applyNativeSafeAreaRootVars();

if (Capacitor.isNativePlatform()) {
  const appearance = readStoredAppearance();
  const isDark = appearance === "dark";
  if (isDark) {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }
  const bg = isDark ? "#0f0d14" : "#ffffff";
  document.documentElement.style.colorScheme = isDark ? "dark" : "light";
  document.documentElement.style.backgroundColor = bg;
  document.body.style.backgroundColor = bg;
  const root = document.getElementById("root");
  if (root) root.style.backgroundColor = bg;
  void Keyboard.setResizeMode({ mode: KeyboardResize.None }).catch(() => {
    /* plugin may be unavailable in some web previews */
  });

  // OneSignal (push + in-app). Permission prompt is triggered elsewhere (onboarding/settings).
  void bootstrapOneSignal()
    .then(() => attachOneSignalListenersOnce())
    .catch((e) => console.warn("[OneSignal] init failed:", e));

  void import("@capacitor/app").then(({ App }) => {
    const handleIncomingAppUrl = (url: string) => {
      if (captureAttributionFromUrl(url)) captureAndPersistAttribution({ url });
      const target = resolvePushDeepLinkTarget(url);
      if (target) window.location.href = target;
    };

    void App.addListener("appUrlOpen", ({ url }) => {
      handleIncomingAppUrl(url);
    });

    void App.getLaunchUrl()
      .then((launch) => {
        if (launch?.url) handleIncomingAppUrl(launch.url);
      })
      .catch(() => {
        /* no cold-start deep link */
      });
  });

  /**
   * Android keyboard parity with iOS:
   *
   * iOS WKWebView (with KeyboardResize.None) auto-scrolls the focused input so it sits
   * above the on-screen keyboard. Android Chrome under `interactive-widget=overlays-content`
   * does NOT do this — the spec explicitly says pages must handle keyboard occlusion
   * themselves. Without this, a user tapping an Email / Name / password field on Android
   * would have their input hidden behind the keyboard.
   *
   * Mirror iOS behavior on Android only: when the keyboard appears, if the focused
   * editable element would be covered by it, scroll its nearest scrollable ancestor
   * just enough to clear the keyboard. No-op when the input is already comfortably
   * visible, so this won't double-scroll if any future Android Chrome version starts
   * doing it natively.
   */
  if (Capacitor.getPlatform() === "android") {
    const KEYBOARD_TOP_GAP_PX = 24;

    const isEditableElement = (el: Element | null): el is HTMLElement => {
      if (!el || !(el instanceof HTMLElement)) return false;
      const tag = el.tagName.toLowerCase();
      return tag === "input" || tag === "textarea" || el.isContentEditable;
    };

    void Keyboard.addListener("keyboardDidShow", (info) => {
      const el = document.activeElement;
      if (!isEditableElement(el)) return;
      const keyboardHeightPx = Math.max(0, Math.round(info?.keyboardHeight ?? 0));
      if (keyboardHeightPx <= 0) return;

      // Wait one frame so any composer / footer layout settles first.
      requestAnimationFrame(() => {
        const rect = el.getBoundingClientRect();
        const viewportHeightPx = window.innerHeight;
        const keyboardTopPx = viewportHeightPx - keyboardHeightPx;
        const desiredBottomPx = keyboardTopPx - KEYBOARD_TOP_GAP_PX;

        // Already visible above the keyboard — nothing to do.
        if (rect.bottom <= desiredBottomPx) return;

        el.scrollIntoView({ block: "center", behavior: "smooth" });
      });
    });
  }
}

createRoot(document.getElementById("root")!).render(<App />);
