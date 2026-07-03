# Web Get-the-app post-purchase popup - handoff

**Repo:** belief-craft-nexus
**Branch:** Mobile-app
**Base commit (last pushed):** ff71427b
**Status:** Local / uncommitted (popup feature)

---

## Summary

One-time browser modal after first successful **web** RevenueCat checkout.

- **Desktop:** App Store + Google Play QR codes (HTTPS links)
- **Mobile web:** Store badges — **App Store left, Google Play right**
- **Mobile badges:** Same in-app handoff as homepage (`getMobileStoreHref` + `detectInAppBrowser`) — `itms-apps://` / Play `intent://` in TikTok/IG/Meta WebViews

Does **not** show on `/onboarding/*`, `/payment-processing`, or `/activate`. Native app: no popup.

**Copy:** Get Palette Plotting on your phone / Your membership is best experienced in the app. Scan or tap to install.

---

## Flow

`WebPaywall` purchase OK -> `armWebGetAppPromptPending()` -> `/onboarding/post-paywall` -> `/dashboard` -> dialog (~500ms).

---

## localStorage

| Key | Meaning |
|-----|---------|
| `sv_web_get_app_prompt_pending_v1` | Armed after web purchase |
| `sv_web_get_app_prompt_shown_v1` | Dismissed; never show again (per browser) |
| `sv_web_get_app_preview_v1` | Dev preview |

---

## Preview (dev :8080)

- URL: `http://localhost:8080/?preview=get-app-dialog`
- Console: `previewGetAppDialog()` / `clearGetAppDialogPreview()`

---

## App.tsx

```tsx
import { WebGetAppAfterPurchaseDialog } from "@/components/WebGetAppAfterPurchaseDialog";
// inside BrowserRouter after ScrollToTop:
<WebGetAppAfterPurchaseDialog />
```

---

## index.html (preconnect)

```html
<link rel="preconnect" href="https://play.google.com" crossorigin />
<link rel="preconnect" href="https://tools.applemediaservices.com" crossorigin />
```

---

## NOT modified

- PostPaywallLoading.tsx, OnboardingLayout.tsx, native paywalls UI

---

## Files

- src/components/WebGetAppAfterPurchaseDialog.tsx
- src/lib/webFirstPurchaseGetAppPrompt.ts
- src/lib/appStore.ts
- src/components/marketing/MarketingStoreBadges.tsx
- src/pages/onboarding/WebPaywall.tsx
- src/lib/inAppBrowserDetection.ts
- src/lib/mobileStoreHandoff.ts
- src/hooks/use-mobile.tsx
- src/components/ui/dialog.tsx

## FILE: src/components/WebGetAppAfterPurchaseDialog.tsx

```tsx
import { useCallback, useEffect, useState } from "react";
import { useLocation, useSearchParams } from "react-router-dom";
import QRCode from "qrcode";
import { Capacitor } from "@capacitor/core";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import {
  preloadStoreBadgeImages,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  isWebGetAppDialogPreviewMode,
  markWebGetAppPromptShown,
  shouldOfferWebGetAppPrompt,
} from "@/lib/webFirstPurchaseGetAppPrompt";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { getMobileStoreHref } from "@/lib/mobileStoreHandoff";
import type { MobileWebStore } from "@/lib/marketingGetApp";
import { cn } from "@/lib/utils";

const STORE_QRS = [
  {
    label: "App Store",
    href: PALETTE_PLOTTING_APP_STORE_URL,
    alt: "QR code for the App Store",
  },
  {
    label: "Google Play",
    href: PALETTE_PLOTTING_GOOGLE_PLAY_URL,
    alt: "QR code for Google Play",
  },
] as const;

function DesktopQrPair() {
  const [qrByHref, setQrByHref] = useState<Record<string, string>>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all(
      STORE_QRS.map(async (store) => {
        const dataUrl = await QRCode.toDataURL(store.href, {
          width: 120,
          margin: 2,
          errorCorrectionLevel: "H",
          color: { dark: "#000000", light: "#ffffff" },
        });
        return [store.href, dataUrl] as const;
      }),
    )
      .then((entries) => {
        if (cancelled) return;
        setQrByHref(Object.fromEntries(entries));
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) setReady(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-wrap items-start justify-center gap-6 pt-2">
      {STORE_QRS.map((store) => (
        <div key={store.href} className="flex flex-col items-center gap-2">
          <span className="text-xs font-medium text-muted-foreground">{store.label}</span>
          {ready && qrByHref[store.href] ? (
            <a
              href={store.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border bg-white p-2 shadow-sm"
            >
              <img
                src={qrByHref[store.href]}
                alt={store.alt}
                className="h-24 w-24"
                width={96}
                height={96}
              />
            </a>
          ) : (
            <div
              className="flex h-24 w-24 items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground"
              aria-busy={!ready}
            >
              …
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * One-time browser prompt after the user's first web subscription purchase.
 * Shown only off paywall/onboarding/post-paywall routes (e.g. dashboard).
 */
export function WebGetAppAfterPurchaseDialog() {
  const { pathname } = useLocation();
  const [searchParams] = useSearchParams();
  const search = searchParams.toString() ? `?${searchParams.toString()}` : "";
  const isMobile = useIsMobile();
  const [open, setOpen] = useState(false);
  const [detection, setDetection] = useState(detectInAppBrowser);
  const previewMode = isWebGetAppDialogPreviewMode(search);

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  useEffect(() => {
    if (!open) return;
    setDetection(detectInAppBrowser());
  }, [open]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) return;

    if (!shouldOfferWebGetAppPrompt(pathname, search)) {
      setOpen(false);
      return;
    }

    preloadStoreBadgeImages(true);

    const delay = previewMode ? 100 : 500;
    const timer = window.setTimeout(() => {
      if (shouldOfferWebGetAppPrompt(pathname, search)) {
        setOpen(true);
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [pathname, search, previewMode]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next && !isWebGetAppDialogPreviewMode()) {
      markWebGetAppPromptShown();
    }
  };

  if (Capacitor.isNativePlatform()) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className={cn("z-[200] max-w-sm sm:max-w-md", isMobile && "max-w-[calc(100vw-2rem)]")}
      >
        <DialogHeader>
          <DialogTitle>Get Palette Plotting on your phone</DialogTitle>
          <DialogDescription>
            Your membership is best experienced in the app. Scan or tap to install.
          </DialogDescription>
        </DialogHeader>

        {isMobile ? (
          <div
            className="flex w-full flex-col items-center gap-3 py-1"
            style={{ minHeight: STORE_BADGE_ROW_HEIGHT_PX }}
          >
            <MarketingStoreBadges
              layout="inline"
              size="lg"
              getStoreHref={getStoreHref}
            />
          </div>
        ) : (
          <DesktopQrPair />
        )}
      </DialogContent>
    </Dialog>
  );
}

```

---

## FILE: src/lib/webFirstPurchaseGetAppPrompt.ts

```ts
import { Capacitor } from "@capacitor/core";

const PENDING_KEY = "sv_web_get_app_prompt_pending_v1";
const SHOWN_KEY = "sv_web_get_app_prompt_shown_v1";
/** Dev preview without keeping `?preview=` in the URL — set via console, clear when done. */
export const PREVIEW_STORAGE_KEY = "sv_web_get_app_preview_v1";

/** Routes where the get-app popup must never appear (paywall, onboarding, payment wait). */
export function isBlockedPathForWebGetAppPrompt(pathname: string): boolean {
  if (pathname.startsWith("/onboarding")) return true;
  if (pathname === "/payment-processing") return true;
  if (pathname === "/activate") return true;
  return false;
}

export function hasWebGetAppPromptBeenShown(): boolean {
  try {
    return localStorage.getItem(SHOWN_KEY) === "1";
  } catch {
    return false;
  }
}

export function isWebGetAppPromptPending(): boolean {
  try {
    return localStorage.getItem(PENDING_KEY) === "1";
  } catch {
    return false;
  }
}

/** Call when a browser user completes their first RevenueCat web checkout. */
export function armWebGetAppPromptPending(): void {
  if (Capacitor.isNativePlatform()) return;
  if (hasWebGetAppPromptBeenShown()) return;
  try {
    localStorage.setItem(PENDING_KEY, "1");
  } catch {
    /* ignore */
  }
}

export function clearWebGetAppPromptPending(): void {
  try {
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function markWebGetAppPromptShown(): void {
  try {
    localStorage.setItem(SHOWN_KEY, "1");
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function shouldOfferWebGetAppPrompt(pathname: string, search?: string): boolean {
  if (Capacitor.isNativePlatform()) return false;
  if (!isBlockedPathForWebGetAppPrompt(pathname) && isWebGetAppDialogPreviewMode(search)) {
    return true;
  }
  if (!isWebGetAppPromptPending()) return false;
  if (hasWebGetAppPromptBeenShown()) return false;
  return !isBlockedPathForWebGetAppPrompt(pathname);
}

/** Dev preview: `?preview=get-app-dialog` in the URL, or `localStorage` key below. */
export function isWebGetAppDialogPreviewMode(search?: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    if (localStorage.getItem(PREVIEW_STORAGE_KEY) === "1") return true;
    const q = search ?? window.location.search;
    return new URLSearchParams(q).get("preview") === "get-app-dialog";
  } catch {
    return false;
  }
}

export function armWebGetAppDialogPreview(): void {
  try {
    localStorage.setItem(PREVIEW_STORAGE_KEY, "1");
    localStorage.removeItem(SHOWN_KEY);
    localStorage.removeItem(PENDING_KEY);
  } catch {
    /* ignore */
  }
}

export function clearWebGetAppDialogPreview(): void {
  try {
    localStorage.removeItem(PREVIEW_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

declare global {
  interface Window {
    /** Dev only: `previewGetAppDialog()` then open `/` or `/dashboard` (homepage easiest). */
    previewGetAppDialog?: () => void;
    clearGetAppDialogPreview?: () => void;
  }
}

if (import.meta.env.DEV && typeof window !== "undefined") {
  window.previewGetAppDialog = () => {
    armWebGetAppDialogPreview();
    const path = window.location.pathname.startsWith("/onboarding")
      ? "/"
      : window.location.pathname;
    window.location.assign(`${path}?preview=get-app-dialog`);
  };
  window.clearGetAppDialogPreview = () => {
    clearWebGetAppDialogPreview();
    clearWebGetAppPromptPending();
    try {
      localStorage.removeItem(SHOWN_KEY);
    } catch {
      /* ignore */
    }
  };
}

```

---

## FILE: src/lib/appStore.ts

```ts
/** Opens in the App Store app on iPhone / iPad when tapped from Safari or many in-app browsers */
export const PALETTE_PLOTTING_APP_STORE_URL =
  "https://apps.apple.com/us/app/palette-plotting-app/id6759469696";

/** Google Play listing (package: com.paletteplotting.app) */
export const PALETTE_PLOTTING_GOOGLE_PLAY_URL =
  "https://play.google.com/store/apps/details?id=com.paletteplotting.app";

/** White badge for dark backgrounds (Apple Marketing Resources API). */
export const APP_STORE_BADGE_WHITE_URL =
  "https://tools.applemediaservices.com/api/badges/download-on-the-app-store/white/en-us?size=250x83";

/** Standard Google Play badge (English). */
export const GOOGLE_PLAY_BADGE_URL =
  "https://play.google.com/intl/en_us/badges/static/images/badges/en_badge_web_generic.png";

/** Display height (px) — keep in sync with MarketingStoreBadges. */
export const STORE_BADGE_APPLE_HEIGHT_PX = 40;
export const STORE_BADGE_GOOGLE_HEIGHT_PX = 57;
/** Intrinsic assets: 250×83 (Apple), 646×250 (Google). */
export const STORE_BADGE_APPLE_WIDTH_PX = Math.round(
  (250 / 83) * STORE_BADGE_APPLE_HEIGHT_PX,
);
export const STORE_BADGE_GOOGLE_WIDTH_PX = Math.round(
  (646 / 250) * STORE_BADGE_GOOGLE_HEIGHT_PX,
);
export const STORE_BADGE_ROW_HEIGHT_PX = STORE_BADGE_GOOGLE_HEIGHT_PX;

let storeBadgePreloadStarted = false;

/** Warm badge CDN images; Google first — it is larger and often paints last. */
export function preloadStoreBadgeImages(googleFirst = true): void {
  if (typeof window === "undefined") return;
  const urls = googleFirst
    ? [GOOGLE_PLAY_BADGE_URL, APP_STORE_BADGE_WHITE_URL]
    : [APP_STORE_BADGE_WHITE_URL, GOOGLE_PLAY_BADGE_URL];
  for (const src of urls) {
    const img = new Image();
    img.decoding = "async";
    img.src = src;
  }
}

/** Call once per page load (e.g. marketing homepage) so badges are cached before tap. */
export function preloadStoreBadgeImagesOnce(): void {
  if (storeBadgePreloadStarted) return;
  storeBadgePreloadStarted = true;
  preloadStoreBadgeImages(true);
}

```

---

## FILE: src/components/marketing/MarketingStoreBadges.tsx

```tsx
import {
  APP_STORE_BADGE_WHITE_URL,
  GOOGLE_PLAY_BADGE_URL,
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
  STORE_BADGE_APPLE_HEIGHT_PX,
  STORE_BADGE_APPLE_WIDTH_PX,
  STORE_BADGE_GOOGLE_HEIGHT_PX,
  STORE_BADGE_GOOGLE_WIDTH_PX,
  STORE_BADGE_ROW_HEIGHT_PX,
} from "@/lib/appStore";
import { cn } from "@/lib/utils";
import type { MobileWebStore } from "@/lib/marketingGetApp";

type MarketingStoreBadgesProps = {
  /**
   * Native store href per badge (itms-apps / intent in in-app browsers).
   * When set, badges render as `<a>` tags so the WebView handles handoff.
   */
  getStoreHref?: (store: MobileWebStore) => string;
  /** Analytics / desktop routing — must not call preventDefault when used with getStoreHref. */
  onStoreClick?: (store: MobileWebStore) => void;
  className?: string;
  /** Primary placement (hero / download) — eager-loads badge images. */
  size?: "sm" | "lg";
  /** Side-by-side row, centered, no wrap (mobile hero / download). */
  layout?: "wrap" | "inline";
};

const controlClass =
  "inline-flex shrink-0 items-center justify-center overflow-visible border-0 bg-transparent p-0 shadow-none ring-0 outline-none appearance-none [-webkit-appearance:none] [-webkit-tap-highlight-color:transparent] hover:opacity-100 focus:outline-none focus-visible:outline-none focus-visible:ring-0 active:opacity-90";

function badgeContainerClass(layout: MarketingStoreBadgesProps["layout"], className?: string) {
  return cn(
    layout === "inline"
      ? "flex w-full flex-nowrap items-center justify-center gap-4 sm:gap-5"
      : "flex flex-wrap items-center justify-center gap-4 sm:gap-5",
    className,
  );
}

type BadgeControlProps = {
  store: MobileWebStore;
  getStoreHref?: (store: MobileWebStore) => string;
  onStoreClick?: (store: MobileWebStore) => void;
  priority?: boolean;
};

function StoreBadgeControl({ store, getStoreHref, onStoreClick, priority = false }: BadgeControlProps) {
  const isApple = store === "apple";
  const defaultHref = isApple ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
  const href = getStoreHref?.(store) ?? defaultHref;
  const displayWidth = isApple ? STORE_BADGE_APPLE_WIDTH_PX : STORE_BADGE_GOOGLE_WIDTH_PX;
  const displayHeight = isApple ? STORE_BADGE_APPLE_HEIGHT_PX : STORE_BADGE_GOOGLE_HEIGHT_PX;

  const img = (
    <img
      src={isApple ? APP_STORE_BADGE_WHITE_URL : GOOGLE_PLAY_BADGE_URL}
      alt={isApple ? "Download on the App Store" : "Get it on Google Play"}
      className="block max-w-none shrink-0 select-none object-contain object-center"
      style={{
        width: displayWidth,
        height: displayHeight,
        maxWidth: displayWidth,
        maxHeight: STORE_BADGE_ROW_HEIGHT_PX,
      }}
      width={displayWidth}
      height={displayHeight}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : undefined}
      decoding={priority ? "sync" : "async"}
      draggable={false}
    />
  );

  const frameStyle = {
    height: STORE_BADGE_ROW_HEIGHT_PX,
    width: displayWidth,
    minWidth: displayWidth,
    flexShrink: 0,
  };
  const label = isApple ? "Download on the App Store" : "Get it on Google Play";

  if (getStoreHref) {
    return (
      <a
        href={href}
        className={controlClass}
        style={frameStyle}
        rel="noopener noreferrer"
        aria-label={label}
        onClick={() => onStoreClick?.(store)}
      >
        {img}
      </a>
    );
  }

  if (onStoreClick) {
    return (
      <button
        type="button"
        onClick={() => onStoreClick(store)}
        className={controlClass}
        style={frameStyle}
        aria-label={label}
      >
        {img}
      </button>
    );
  }

  return (
    <a
      href={defaultHref}
      className={controlClass}
      style={frameStyle}
      rel="noopener noreferrer"
      target="_blank"
      aria-label={label}
    >
      {img}
    </a>
  );
}

export function MarketingStoreBadges({
  getStoreHref,
  onStoreClick,
  className,
  size = "sm",
  layout = "wrap",
}: MarketingStoreBadgesProps) {
  const containerClass = badgeContainerClass(
    layout,
    cn("min-h-[57px] items-center", className),
  );
  const priority = size === "lg";

  return (
    <div className={containerClass} aria-label="Download Palette Plotting">
      <StoreBadgeControl
        store="apple"
        getStoreHref={getStoreHref}
        onStoreClick={onStoreClick}
        priority={priority}
      />
      <StoreBadgeControl
        store="google"
        getStoreHref={getStoreHref}
        onStoreClick={onStoreClick}
        priority={priority}
      />
    </div>
  );
}

```

---

## FILE: src/pages/onboarding/WebPaywall.tsx

```tsx
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getLastWebPaywallError,
  isRevenueCatWebConfigured,
  presentWebRevenueCatPaywall,
} from "@/services/revenueCatWeb";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import { armWebGetAppPromptPending } from "@/lib/webFirstPurchaseGetAppPrompt";
import { attachHideBrokenRevenueCatPaywallMedia } from "@/lib/revenueCatPaywallMedia";

/**
 * Web subscription: RevenueCat Web Billing paywall (purchases-js).
 * Used from onboarding email and /resubscribe on browser.
 */
export default function WebPaywall() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"paywall" | "dismissed" | "error">("paywall");
  const [presenting, setPresenting] = useState(false);
  const autoPresentedRef = useRef(false);

  const openPaywall = useCallback(async () => {
    if (!user?.id || presenting || !containerRef.current) return;

    setPresenting(true);
    setPhase("paywall");
    const ok = await presentWebRevenueCatPaywall(user.id, {
      htmlTarget: containerRef.current,
      customerEmail: user.email ?? undefined,
    });
    setPresenting(false);

    if (ok) {
      armIapPostPurchaseEntitlementLatch(user.id);
      armWebGetAppPromptPending();
      navigate("/onboarding/post-paywall", { replace: true });
      return;
    }

    const detail = getLastWebPaywallError();
    if (detail === "Cancelled") {
      setPhase("dismissed");
      return;
    }
    setPhase("error");
    toast.error(detail || "Subscription not completed.", { duration: 8000 });
  }, [navigate, presenting, user?.email, user?.id]);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate("/", { replace: true });
      return;
    }
    if (isLoading) return;
    if (!user?.id) {
      navigate("/login", { replace: true, state: { from: "/onboarding/web-paywall" } });
      return;
    }

    if (!isRevenueCatWebConfigured()) {
      setPhase("error");
      toast.error("Web checkout is not configured yet. Please try again later.", { duration: 8000 });
    }
  }, [isLoading, navigate, user?.id]);

  useEffect(() => {
    if (phase !== "paywall" || autoPresentedRef.current || isLoading || !user?.id) return;
    if (!isRevenueCatWebConfigured()) return;
    autoPresentedRef.current = true;
    void openPaywall();
  }, [isLoading, openPaywall, phase, user?.id]);

  useEffect(() => {
    if (phase !== "paywall" || !containerRef.current) return;
    return attachHideBrokenRevenueCatPaywallMedia(containerRef.current);
  }, [phase, presenting]);

  if (isLoading) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <div className="relative min-h-screen bg-background text-foreground">
      {phase === "error" ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">
            {getLastWebPaywallError() || "We could not open checkout."}
          </p>
          <div className="flex flex-col gap-2 sm:flex-row">
            {/*
              Hide "Try again" when RC web isn't configured — clicking it would
              just loop the same "not configured" error since openPaywall doesn't
              re-check configuration.
            */}
            {isRevenueCatWebConfigured() ? (
              <Button type="button" onClick={() => void openPaywall()} disabled={presenting}>
                Try again
              </Button>
            ) : null}
            <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      {phase === "dismissed" ? (
        <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Checkout closed. You can subscribe anytime.</p>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button type="button" onClick={() => void openPaywall()} disabled={presenting}>
              View plans
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
              Close
            </Button>
          </div>
        </div>
      ) : null}

      <div
        ref={containerRef}
        className={cn("web-rc-paywall-host px-4 pb-8", phase === "paywall" ? "block" : "hidden")}
        aria-live="polite"
      />
    </div>
  );
}

```

---

## FILE: src/lib/inAppBrowserDetection.ts

```ts
/**
 * In-app browser (a.k.a. social webview) detection.
 *
 * Why this exists: TikTok, Instagram, Facebook, Snapchat, LinkedIn etc. wrap
 * external links in their own embedded WebView. Those WebViews silently break
 * App Store / Play Store handoff (apps.apple.com / play.google.com), strip
 * referrers, block target="_blank", and disallow itms-apps:// schemes.
 *
 * For paid social traffic (TikTok especially) this is the single biggest
 * conversion leak — users tap "Download" and nothing happens.
 *
 * Mitigation: native store schemes on real `<a href>` tags (`itms-apps://`,
 * Play `intent://`) — see mobileStoreHandoff.ts.
 */

export type InAppBrowserKind =
  | "tiktok"
  | "instagram"
  | "facebook"
  | "snapchat"
  | "linkedin"
  | "twitter"
  | "pinterest"
  | "line"
  | "wechat"
  | "other";

export type InAppBrowserDetection = {
  isInAppBrowser: boolean;
  kind: InAppBrowserKind | null;
  /** True when this in-app browser is known to break apps.apple.com handoff. */
  blocksAppStore: boolean;
  /** Convenience: iOS detection — switches "Open in Safari" vs "Open in Chrome" copy. */
  isIos: boolean;
  /** Convenience: Android detection — switches Play Store fallback. */
  isAndroid: boolean;
};

const NULL_DETECTION: InAppBrowserDetection = {
  isInAppBrowser: false,
  kind: null,
  blocksAppStore: false,
  isIos: false,
  isAndroid: false,
};

function getUserAgent(): string {
  if (typeof navigator === "undefined") return "";
  return navigator.userAgent || "";
}

function detectKind(ua: string): InAppBrowserKind | null {
  // TikTok signatures: "musical_ly", "Bytedance", "BytedanceWebview", "TikTok"
  if (/musical_ly|Bytedance|BytedanceWebview|TikTok/i.test(ua)) return "tiktok";

  // Instagram embeds "Instagram" string in UA
  if (/Instagram/i.test(ua)) return "instagram";

  // Facebook embeds "FBAN" (iOS) / "FBAV" / "FB_IAB" (Android)
  if (/FBAN|FBAV|FB_IAB|FBIOS/i.test(ua)) return "facebook";

  if (/Snapchat/i.test(ua)) return "snapchat";
  if (/LinkedInApp/i.test(ua)) return "linkedin";
  if (/Twitter/i.test(ua)) return "twitter";
  if (/Pinterest/i.test(ua)) return "pinterest";
  if (/Line\//i.test(ua)) return "line";
  if (/MicroMessenger/i.test(ua)) return "wechat";

  return null;
}

/**
 * Detect at call-time. Cheap, no caching — UA can't change mid-session.
 * Server-rendering safe (returns a null detection).
 */
export function detectInAppBrowser(): InAppBrowserDetection {
  const ua = getUserAgent();
  if (!ua) return NULL_DETECTION;

  const kind = detectKind(ua);
  const isIos = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);

  if (!kind) {
    return { isInAppBrowser: false, kind: null, blocksAppStore: false, isIos, isAndroid };
  }

  /**
   * TikTok / Instagram / Facebook / Snapchat / WeChat WebViews block plain
   * https store URLs — use native schemes when these are detected.
   */
  const blocksAppStore = kind === "tiktok" || kind === "instagram" || kind === "facebook" || kind === "snapchat" || kind === "wechat";

  return { isInAppBrowser: true, kind, blocksAppStore, isIos, isAndroid };
}

/** Human-friendly label for the prompt copy, e.g. "TikTok". */
export function inAppBrowserLabel(kind: InAppBrowserKind): string {
  switch (kind) {
    case "tiktok":
      return "TikTok";
    case "instagram":
      return "Instagram";
    case "facebook":
      return "Facebook";
    case "snapchat":
      return "Snapchat";
    case "linkedin":
      return "LinkedIn";
    case "twitter":
      return "X";
    case "pinterest":
      return "Pinterest";
    case "line":
      return "LINE";
    case "wechat":
      return "WeChat";
    case "other":
      return "this app";
  }
}

```

---

## FILE: src/lib/mobileStoreHandoff.ts

```ts
import {
  PALETTE_PLOTTING_APP_STORE_URL,
  PALETTE_PLOTTING_GOOGLE_PLAY_URL,
} from "@/lib/appStore";
import type { InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import type { MobileWebStore } from "@/lib/marketingGetApp";

export const PALETTE_PLOTTING_APP_STORE_ID = "6759469696";
export const PALETTE_PLOTTING_ANDROID_PACKAGE = "com.paletteplotting.app";

/** Opens App Store app on iOS — preferred over https in embedded WebViews. */
export const ITMS_APP_STORE_URL = `itms-apps://itunes.apple.com/app/id${PALETTE_PLOTTING_APP_STORE_ID}`;

function buildAndroidPlayIntentUrl(fallbackHttps: string): string {
  const encodedFallback = encodeURIComponent(fallbackHttps);
  return `intent://play.google.com/store/apps/details?id=${PALETTE_PLOTTING_ANDROID_PACKAGE}#Intent;scheme=https;package=com.android.vending;S.browser_fallback_url=${encodedFallback};end`;
}

/**
 * Best href for a store badge / CTA on this device.
 *
 * In TikTok / Meta / IG WebViews, plain https store URLs often do nothing.
 * Native schemes (`itms-apps://`, Play `intent://`) on a real `<a>` tap are
 * the standard handoff — no instruction sheets required.
 */
export function getMobileStoreHref(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): string {
  const inRestrictedWebView = Boolean(detection?.isInAppBrowser && detection.blocksAppStore);

  if (store === "apple") {
    if (inRestrictedWebView && detection?.isIos) return ITMS_APP_STORE_URL;
    return PALETTE_PLOTTING_APP_STORE_URL;
  }

  if (inRestrictedWebView && detection?.isAndroid) {
    return buildAndroidPlayIntentUrl(PALETTE_PLOTTING_GOOGLE_PLAY_URL);
  }
  return PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** HTTPS URL for clipboard — always paste-friendly in Safari/Chrome. */
export function getCopyableStoreUrl(store: MobileWebStore): string {
  return store === "apple" ? PALETTE_PLOTTING_APP_STORE_URL : PALETTE_PLOTTING_GOOGLE_PLAY_URL;
}

/** Fallback when a button (not an anchor) triggers store open — clicks a transient link. */
export function openMobileStoreViaAnchor(
  store: MobileWebStore,
  detection?: InAppBrowserDetection,
): void {
  if (typeof document === "undefined") return;

  const anchor = document.createElement("a");
  anchor.href = getMobileStoreHref(store, detection);
  anchor.rel = "noopener noreferrer";
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
}

```

---

## FILE: src/hooks/use-mobile.tsx

```tsx
import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  /** Initialize from viewport on first paint so native WebView (Mirror Work, etc.) never runs a "desktop" frame at phone width. */
  const [isMobile, setIsMobile] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth < MOBILE_BREAKPOINT : false,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}

```

---

## FILE: src/components/ui/dialog.tsx

```tsx
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Dialog = DialogPrimitive.Root;

const DialogTrigger = DialogPrimitive.Trigger;

const DialogPortal = DialogPrimitive.Portal;

const DialogClose = DialogPrimitive.Close;

const DialogOverlay = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Overlay
    ref={ref}
    className={cn(
      "fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
      className,
    )}
    {...props}
  />
));
DialogOverlay.displayName = DialogPrimitive.Overlay.displayName;

const DialogContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content>
>(({ className, children, ...props }, ref) => (
  <DialogPortal>
    <DialogOverlay />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] sm:rounded-lg",
        className,
      )}
      {...props}
    >
      {children}
      <DialogPrimitive.Close className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity data-[state=open]:bg-accent data-[state=open]:text-muted-foreground hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none">
        <X className="h-4 w-4" />
        <span className="sr-only">Close</span>
      </DialogPrimitive.Close>
    </DialogPrimitive.Content>
  </DialogPortal>
));
DialogContent.displayName = DialogPrimitive.Content.displayName;

const DialogHeader = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)} {...props} />
);
DialogHeader.displayName = "DialogHeader";

const DialogFooter = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2", className)} {...props} />
);
DialogFooter.displayName = "DialogFooter";

const DialogTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold leading-none tracking-tight", className)}
    {...props}
  />
));
DialogTitle.displayName = DialogPrimitive.Title.displayName;

const DialogDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description ref={ref} className={cn("text-sm text-muted-foreground", className)} {...props} />
));
DialogDescription.displayName = DialogPrimitive.Description.displayName;

export {
  Dialog,
  DialogPortal,
  DialogOverlay,
  DialogClose,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
};

```

---

## Review checklist

1. Blocked routes include /onboarding/post-paywall
2. Badges use getStoreHref like homepage (mobileStoreHandoff.ts)
3. Badge DOM order: apple then google
4. preloadStoreBadgeImages prefetches Google CDN first (network only)
5. Preview close does not set shown
6. Native: component returns null
