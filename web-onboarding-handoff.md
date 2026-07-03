# Web onboarding funnel — handoff

Generated: 2026-05-31 17:57
Branch: Mobile-app
Commit: 4110724a

---

## Summary

Web onboarding is a **browser-only** cosmic-shell funnel: welcome → setup steps → email → RevenueCat web paywall → post-paywall → dashboard.

**Separate from native app** (`Capacitor.isNativePlatform()` skips web-only analytics and uses native paywalls).

**Separate from payment-first `onboarding_sessions`** edge functions — `web_onboarding_sessions` is analytics-only.

---

## Canonical route order

See `src/lib/onboardingFlow.ts`:

1. `/onboarding/welcome`
2. `/onboarding/setup/name` … `/onboarding/setup/plot-synthesis`
3. `/onboarding/setup/email`
4. `/onboarding/web-paywall` (RevenueCat `purchases-js`)
5. `/onboarding/post-paywall` → `/dashboard`

Legacy routes (`/onboarding/four-steps`, `/onboarding/email`, etc.) still exist in `App.tsx` but are not the current web path.

---

## Web welcome analytics (`web_onboarding_sessions`)

| Item | Detail |
|------|--------|
| Table | `web_onboarding_sessions` — migration must be applied (`supabase db push`) |
| Trigger | `recordWebOnboardingSessionStart()` on `Welcome.tsx` when `!isNative` |
| Dedupe | `sessionStorage` keys `sv_web_onboarding_client_visit_v1`, `sv_web_onboarding_session_recorded_v1` |
| Safety | Fire-and-forget; failures swallowed. **Does not touch** `onboarding_sessions` or edge functions |
| TikTok flag | `from_tiktok` from `useMarketingAttribution` (UTM `utm_source` contains `tiktok` or `tt`) |

---

## Welcome web CTA copy

- **Native:** `Start my path`
- **Web:** `sign up + download app + start manifesting` (wrap-friendly button classes on welcome)

Button navigates to `/onboarding/setup/name` — **not** the App Store.

---

## App link at top (Safari vs TikTok) — important

| Surface | Welcome / onboarding top app promo |
|---------|-----------------------------------|
| **Mobile Safari** | **Yes** — Apple **Smart App Banner** from `index.html` `apple-itunes-app` meta (`app-id=6759469696`). System UI, not React. |
| **TikTok / IG / FB in-app WebView** | **No** — meta tag is a no-op in restricted WebViews |
| **Custom React header on onboarding** | **No** — `OnboardingLayout` has desktop-only "Palette Plotting" text linking home; mobile has safe-area padding only |
| **Homepage only** | `MarketingStoreCtaProvider`, sticky download bar, `MobileStoreFallbackSheet` — **not mounted** on `/onboarding/*` |

TikTok paid traffic that lands directly on `/onboarding/welcome` gets **no** in-app fallback sheet unless you add it.

Post-purchase: `WebGetAppAfterPurchaseDialog` on dashboard (see `web-get-app-popup-handoff.md`).

---

## Google Analytics / gtag gaps

- `gtag` + GTM loaded in `index.html` (`G-QQX552G8JN`, `GTM-N6QFTP58`)
- Homepage fires `trackMarketingConversion('landing_view')` and `cta_web_onboarding_click` on CTA tap
- **Onboarding pages:** no `document.title` per step, no SPA `page_view` hook, no `paywall_view` / `subscription_complete` calls (defined but unused)
- GA may still see paths via Enhanced Measurement history events — page title stays "Palette Plotting"
- Step labels exist in `ONBOARDING_STEP_LABELS` but are not sent to GA

---

## RevenueCat web paywall / coupons

Web checkout uses `presentWebRevenueCatPaywall()` → `purchases.presentPaywall()` with `htmlTarget` + `customerEmail` only.

- Legacy Stripe edge functions have `allow_promotion_codes=true` but web flow **does not use them**
- RC coupons: RevenueCat dashboard + optional `showDiscountCodeField` / `discountCode` on `presentPaywall` (not wired in app)
- Supabase `referral_codes` not connected to web paywall

---

## Do NOT touch

- `onboarding_sessions` table and edge functions (`create-onboarding-session`, etc.) for this analytics work
- `Mobile-App` branch (Codemagic native line) — web work lives on `Mobile-app`
- Native paywall routes (`ios-paywall`, `android-paywall`)

---

## Files in this handoff

- supabase/migrations/20260530140000_web_onboarding_sessions.sql
- src/lib/webOnboardingSessionInsert.ts
- src/lib/onboardingFlow.ts
- src/pages/onboarding/Welcome.tsx
- src/components/onboarding/OnboardingLayout.tsx
- src/components/onboarding/SetupPage.tsx
- src/pages/onboarding/setup/Name.tsx
- src/pages/onboarding/WebPaywall.tsx
- src/services/revenueCatWeb.ts
- src/lib/runWebPaywallFlow.ts
- index.html
- src/lib/inAppBrowserDetection.ts
- src/lib/useMarketingAttribution.ts
- src/hooks/useMarketingStoreCta.tsx
- src/lib/marketingConversionTrack.ts
- src/App.tsx

## FILE: supabase/migrations/20260530140000_web_onboarding_sessions.sql

```sql
-- Web onboarding funnel tracking (separate from payment-first onboarding_sessions).
-- One row per browser visit when the user starts /onboarding/welcome on web.
-- Does not participate in checkout, resume tokens, or account claim flows.

CREATE TABLE IF NOT EXISTS public.web_onboarding_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  /** Stable id in sessionStorage — dedupes remounts within the same tab session. */
  client_visit_id text NOT NULL,
  entry_path text NOT NULL DEFAULT '/onboarding/welcome',
  page_path text,
  referrer text,
  is_mobile_viewport boolean,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  is_paid boolean,
  from_tiktok boolean,
  user_agent text
);

CREATE UNIQUE INDEX IF NOT EXISTS web_onboarding_sessions_client_visit_id_idx
  ON public.web_onboarding_sessions (client_visit_id);

CREATE INDEX IF NOT EXISTS web_onboarding_sessions_created_at_idx
  ON public.web_onboarding_sessions (created_at DESC);

ALTER TABLE public.web_onboarding_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous web onboarding session inserts"
  ON public.web_onboarding_sessions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

COMMENT ON TABLE public.web_onboarding_sessions IS
  'Analytics: web-only onboarding starts at /onboarding/welcome. Independent of onboarding_sessions payment-first flow.';

```

---

## FILE: src/lib/webOnboardingSessionInsert.ts

```typescript
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";

const RECORDED_KEY = "sv_web_onboarding_session_recorded_v1";
const CLIENT_VISIT_KEY = "sv_web_onboarding_client_visit_v1";

function getOrCreateClientVisitId(): string {
  try {
    const existing = sessionStorage.getItem(CLIENT_VISIT_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    sessionStorage.setItem(CLIENT_VISIT_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

export type WebOnboardingSessionInsert = {
  client_visit_id: string;
  entry_path?: string;
  page_path?: string | null;
  referrer?: string | null;
  is_mobile_viewport?: boolean | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  is_paid?: boolean | null;
  from_tiktok?: boolean | null;
  user_agent?: string | null;
};

export async function insertWebOnboardingSession(row: WebOnboardingSessionInsert) {
  return supabase.from("web_onboarding_sessions").insert(row);
}

/**
 * Fire once per tab when a browser user lands on web onboarding welcome.
 * Does not touch onboarding_sessions or edge functions.
 */
export function recordWebOnboardingSessionStart(opts?: {
  isMobileViewport?: boolean;
  entryPath?: string;
}): void {
  if (Capacitor.isNativePlatform()) return;

  try {
    if (sessionStorage.getItem(RECORDED_KEY) === "1") return;
  } catch {
    /* ignore */
  }

  const attribution = readMarketingAttribution();
  const pagePath =
    typeof window !== "undefined" ? window.location.pathname || "/" : null;
  const referrer =
    typeof document !== "undefined" && document.referrer ? document.referrer : null;
  const userAgent =
    typeof navigator !== "undefined" ? navigator.userAgent || null : null;

  void insertWebOnboardingSession({
    client_visit_id: getOrCreateClientVisitId(),
    entry_path: opts?.entryPath ?? "/onboarding/welcome",
    page_path: pagePath,
    referrer,
    is_mobile_viewport: opts?.isMobileViewport ?? null,
    utm_source: attribution?.utmSource ?? null,
    utm_medium: attribution?.utmMedium ?? null,
    utm_campaign: attribution?.utmCampaign ?? null,
    utm_content: attribution?.utmContent ?? null,
    utm_term: attribution?.utmTerm ?? null,
    is_paid: attribution?.isPaid ?? null,
    from_tiktok: attribution?.isFromTikTok ?? null,
    user_agent: userAgent,
  })
    .then(({ error }) => {
      if (error) return;
      try {
        sessionStorage.setItem(RECORDED_KEY, "1");
      } catch {
        /* ignore */
      }
    })
    .catch(() => {
      /* ignore */
    });
}

```

---

## FILE: src/lib/onboardingFlow.ts

```typescript
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

```

---

## FILE: src/pages/onboarding/Welcome.tsx

```tsx
import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  WELCOME_ACCENT,
  WelcomeCosmicBackground,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { recordWebOnboardingSessionStart } from "@/lib/webOnboardingSessionInsert";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";

/** Transparent brand logo — welcome screen + native splash (copy → SplashLogo.imageset). NEVER for AppIcon: Apple rejects transparent app icons; use public/apple-ios-logo.png for App Store only. */
const WELCOME_LOGO = "/welcome-logo.png";
const WELCOME_EYEBROW = "LOA · SP · scripting · self-concept";
const WELCOME_CONTINUE_TEXT = "Start my path";
const WELCOME_CONTINUE_TEXT_WEB = "sign up + download app + start manifesting";
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
        topPaddingClass,
        contentLiftClass,
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

const welcomeLayoutPropsBase = {
  currentPage: 1 as const,
  welcomePage: true,
  stackedNativeButtons: true,
  stackedNativePrimaryButtonClassName: WELCOME_PRIMARY_CTA_CLASS,
  welcomeCtaSubtext: WELCOME_CTA_SUBTEXT,
  welcomeSignInAsTextLink: true,
};

const Welcome = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isNative) return;
    recordWebOnboardingSessionStart({
      isMobileViewport: isMobile,
      entryPath: "/onboarding/welcome",
    });
  }, [isNative, isMobile]);

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

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      continueText={isNative ? WELCOME_CONTINUE_TEXT : WELCOME_CONTINUE_TEXT_WEB}
      welcomeSoloContinueButtonClassName={
        isNative
          ? WELCOME_PRIMARY_CTA_CLASS
          : cn(
              WELCOME_PRIMARY_CTA_CLASS,
              "h-auto min-h-12 whitespace-normal px-3 py-3 text-[13px] leading-snug",
            )
      }
      contentMaxWidthClass="max-w-[26rem]"
    >
      <WelcomeHeroBackground />
      <WelcomeBody
        showLogo
        topPaddingClass={
          isNative
            ? "pt-[calc(var(--app-safe-area-top)+2.5rem)]"
            : "pt-4 md:pt-3"
        }
        contentLiftClass={
          isNative ? "-translate-y-[0.32in]" : "-translate-y-[0.16in]"
        }
      />
    </OnboardingLayout>
  );
};

export default Welcome;

```

---

## FILE: src/components/onboarding/OnboardingLayout.tsx

```tsx
import { ReactNode, useEffect } from "react";
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
  const setupMobileWebScrollLayout = isSetupCosmicMobileWeb && nativeFormPage;

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

  useEffect(() => {
    if (!isCosmicShell) return;

    const shellBg = "linear-gradient(180deg, #0a0812 0%, #0f0d14 50%, #0a0812 100%)";
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", "#0f0d14", "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", "#0f0d14", "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", "#0f0d14", "important");
    themeMeta?.setAttribute("content", "#0f0d14");

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, [isCosmicShell]);

  return (
    <div
      className={cn(
        "relative overflow-x-hidden",
        isCosmicShell ? "font-sans text-white antialiased" : "bg-background text-foreground",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : isSetupCosmicMobileWeb
            ? "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen"
            : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh]",
      )}
      style={isCosmicShell ? { backgroundColor: "#0f0d14" } : undefined}
    >
      {isCosmicShell ? (
        <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" />
      ) : null}
      {isAndroidNative && isCosmicShell ? (
        <div
          className="pointer-events-none fixed inset-x-0 top-0 z-[45]"
          style={{
            height: "var(--app-safe-area-top)",
            backgroundColor: "#0f0d14",
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
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
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
                ? "max-md:min-h-[100dvh] max-md:justify-start max-md:px-8 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] max-md:pb-0 md:justify-start md:gap-6 md:p-8 md:pt-28 md:bg-transparent"
                : isSetupCosmicMobileWeb
                  ? "max-md:h-full max-md:min-h-0 max-md:justify-start max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:justify-start md:p-8 md:pt-24"
                  : "min-h-screen justify-between pt-12 p-8 md:pt-24",
        )}
        style={isNative ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" } : undefined}
      >
        {nativeFormScrollLayout || setupMobileWebScrollLayout ? (
          <div
            className={cn(
              "relative z-10 flex min-h-0 w-full flex-1 flex-col overflow-hidden",
              contentMaxWidthClass,
              setupMobileWebScrollLayout && "max-md:flex md:contents",
            )}
          >
            <div
              className={cn(
                "relative z-[1] isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden",
                setupMobileWebScrollLayout && "max-md:flex md:contents",
              )}
            >
              <div
                className={cn(
                  "relative z-[1] min-h-0 flex-1 scroll-pb-28 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
                  setupMobileWebScrollLayout && "max-md:block md:overflow-visible md:flex-none",
                )}
              >
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
            isWelcome ? "relative z-50 shrink-0 space-y-2 pt-3" : "md:hidden",
            !isWelcome && !isSetupCosmicMobileWeb && "space-y-6",
            !(isNative && !isWelcome) && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isSetupCosmicMobileWeb &&
              !isWelcome &&
              "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:mx-auto max-md:max-w-md max-md:px-8 max-md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
            isWelcomeMobileWeb &&
              "max-md:mt-auto max-md:pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-lg md:pb-0 md:pt-0",
            isStandaloneMobile && !isNative && !isWelcome && !isSetupCosmicMobileWeb && "mb-12",
          )}
          style={
            isNative
              ? {
                  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  // Solid base only masks scrolling content under fixed setup footers.
                  // Welcome's footer sits in normal flow over the cosmic shell — no fill,
                  // otherwise a visible rectangle appears around the CTAs.
                  ...(isCosmicShell && !isWelcome
                    ? { backgroundColor: WELCOME_COSMIC_BASE }
                    : {}),
                }
              : isSetupCosmicMobileWeb && !isWelcome
                ? { backgroundColor: WELCOME_COSMIC_BASE }
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

```

---

## FILE: src/components/onboarding/SetupPage.tsx

```tsx
import { ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { ONBOARDING_SETUP_PROGRESS_ROUTES } from "@/lib/onboardingFlow";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import {
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import {
  WelcomeCosmicBackground,
  WELCOME_COSMIC_BASE,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

const MOBILE_SETUP_FOOTER_STYLE = {
  paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
  backgroundColor: WELCOME_COSMIC_BASE,
} as const;

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
  const isNative = useIsNativeApp();
  const isAndroidNative = isNative && Capacitor.getPlatform() === "android";
  const { pathname } = useLocation();
  const { ensureSession } = useOnboardingSession();

  /** Same warm-up as legacy onboarding (`OnboardingQuestions`): create `onboarding_session` creds before draft syncs. */
  useEffect(() => {
    void ensureSession().catch(() => {});
  }, [ensureSession]);

  useEffect(() => {
    const shellBg = "linear-gradient(180deg, #0a0812 0%, #0f0d14 50%, #0a0812 100%)";
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", "#0f0d14", "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", "#0f0d14", "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", "#0f0d14", "important");
    themeMeta?.setAttribute("content", "#0f0d14");

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  const setupProgressFillPct = useMemo(() => {
    const path = pathname.replace(/\/$/, "") || "/";
    const idx = (ONBOARDING_SETUP_PROGRESS_ROUTES as readonly string[]).indexOf(path);
    if (idx < 0) return null;
    const n = ONBOARDING_SETUP_PROGRESS_ROUTES.length;
    return ((idx + 1) / n) * 100;
  }, [pathname]);

  const hasMobileFooter = onBack != null || onContinue != null;

  const mainColumn = (
    <>
      {headerSlot ? <div className="flex items-center justify-between">{headerSlot}</div> : null}
      {children}
    </>
  );

  const mobileFooter = hasMobileFooter ? (
    <div
      className="fixed inset-x-0 bottom-0 z-40 md:hidden"
      style={MOBILE_SETUP_FOOTER_STYLE}
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
  ) : null;

  const desktopScrollContent = disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate hidden h-0 min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden md:flex">
      <div className="flex h-0 min-h-0 flex-1 basis-0 flex-col overflow-hidden pb-3">
        {mainColumn}
      </div>
    </div>
  ) : (
    <div className="relative z-[1] isolate hidden w-full max-w-md space-y-6 md:block">
      {mainColumn}
    </div>
  );

  const nativeScrollContent = disableNativeScrollViewport ? (
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
  );

  const mobileWebScrollContent = disableNativeScrollViewport ? (
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
  );

  return (
    <div
      className={cn(
        "relative overflow-x-hidden font-sans text-white antialiased",
        isNative
          ? "h-[100dvh] max-h-[100dvh]"
          : "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen",
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
            height: "var(--app-safe-area-top)",
            backgroundColor: "#0f0d14",
          }}
          aria-hidden
        />
      ) : null}

      {setupProgressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-12",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div className="h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full rounded-full bg-white/90 transition-[width] duration-300 ease-out"
              style={{ width: `${setupProgressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center animate-fade-in",
          isNative && "h-full min-h-0 px-8 pb-40",
          !isNative &&
            cn(
              "max-md:h-full max-md:min-h-0 max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]",
              disableNativeScrollViewport
                ? "md:flex md:h-[100dvh] md:max-h-[100dvh] md:min-h-0 md:flex-col md:px-8 md:pt-24"
                : "md:min-h-screen md:justify-between md:p-8 md:pt-24",
            ),
        )}
        style={
          isNative
            ? { paddingTop: "calc(var(--app-safe-area-top) + 2.5rem)" }
            : undefined
        }
      >
        {isNative ? (
          nativeScrollContent
        ) : (
          <>
            {desktopScrollContent}
            <div className="relative z-[1] flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden md:hidden">
              {mobileWebScrollContent}
            </div>
          </>
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

        {mobileFooter}
      </div>
    </div>
  );
}

```

---

## FILE: src/pages/onboarding/setup/Name.tsx

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";

export default function SetupName() {
  const navigate = useNavigate();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);

  const canContinue = firstName.trim().length > 0;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate("/onboarding/welcome")}
      onContinue={() => {
        writeSetupDraft({ firstName: firstName.trim() });
        navigate("/onboarding/setup/desire-category");
      }}
    >
      <SetupHeadingBlock centered title="Welcome! What should Palette Plotting call you?" />

      <div className="space-y-2 pt-6">
        <Label htmlFor="firstName" className={SETUP_LABEL_CLASS}>
          First name
        </Label>
        <Input
          id="firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
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

## FILE: src/services/revenueCatWeb.ts

```typescript
import { Purchases } from "@revenuecat/purchases-js";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import { gatherOnboardingPrefs } from "@/lib/gatherOnboardingPrefs";

export const REVENUECAT_WEB_ENTITLEMENT_ID = "Palette Plotting Pro";

let webPurchases: Purchases | null = null;
let configuredAppUserId: string | null = null;

let lastWebPaywallError: string | null = null;

export function getLastWebPaywallError(): string | null {
  return lastWebPaywallError;
}

export function setLastWebPaywallError(message: string): void {
  lastWebPaywallError = message;
}

function getRevenueCatWebApiKey(): string | undefined {
  return import.meta.env.VITE_REVENUECAT_WEB_API_KEY as string | undefined;
}

let warnedMissingWebKey = false;

export function isRevenueCatWebConfigured(): boolean {
  const apiKey = getRevenueCatWebApiKey();
  return typeof apiKey === "string" && apiKey.trim().length > 0;
}

function warnMissingWebKeyOnce(context: string): void {
  if (warnedMissingWebKey) return;
  warnedMissingWebKey = true;
  console.warn(
    `[RevenueCat Web] Missing VITE_REVENUECAT_WEB_API_KEY (${context}). Set it in the build environment and redeploy.`,
  );
}

/**
 * Configure RevenueCat Web Billing (purchases-js). Call after the user is known on web.
 */
export async function bootstrapRevenueCatWeb(appUserId: string | null): Promise<Purchases | null> {
  if (!isRevenueCatWebConfigured()) {
    return null;
  }

  const apiKey = getRevenueCatWebApiKey()!.trim();

  try {
    if (!Purchases.isConfigured()) {
      webPurchases = Purchases.configure({
        apiKey,
        appUserId: appUserId ?? undefined,
      });
      configuredAppUserId = appUserId;
      return webPurchases;
    }

    webPurchases = Purchases.getSharedInstance();
    const nextId = appUserId ?? null;
    if (nextId && nextId !== configuredAppUserId) {
      await webPurchases.changeUser(nextId);
      configuredAppUserId = nextId;
    }
    return webPurchases;
  } catch (error) {
    console.error("[RevenueCat Web] Bootstrap failed:", error);
    return null;
  }
}

function customerHasProEntitlement(customerInfo: { entitlements: { active: Record<string, unknown> } }): boolean {
  return typeof customerInfo.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID] !== "undefined";
}

/**
 * Renders the RevenueCat web paywall (Web Billing checkout).
 * Pass `htmlTarget` (max-w-md host on WebPaywall) so the paywall stays phone-width on desktop.
 */
export async function presentWebRevenueCatPaywall(
  appUserId: string | null,
  options?: { htmlTarget?: HTMLElement | null; customerEmail?: string | null },
): Promise<boolean> {
  lastWebPaywallError = null;
  if (!isRevenueCatWebConfigured()) {
    warnMissingWebKeyOnce("web paywall");
    lastWebPaywallError = "RevenueCat Web is not configured (missing API key).";
    return false;
  }
  const purchases = await bootstrapRevenueCatWeb(appUserId);
  if (!purchases) {
    lastWebPaywallError = "RevenueCat Web is not configured (missing API key).";
    return false;
  }

  try {
    const result = await purchases.presentPaywall({
      ...(options?.htmlTarget ? { htmlTarget: options.htmlTarget } : {}),
      customerEmail: options?.customerEmail ?? undefined,
    });

    if (customerHasProEntitlement(result.customerInfo)) {
      lastWebPaywallError = null;
      return true;
    }

    const entitled = await purchases.isEntitledTo(REVENUECAT_WEB_ENTITLEMENT_ID);
    if (entitled) {
      lastWebPaywallError = null;
      return true;
    }

    lastWebPaywallError = "Subscription was not completed.";
    return false;
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    if (/cancel/i.test(msg)) {
      lastWebPaywallError = "Cancelled";
    } else {
      lastWebPaywallError = msg || "Could not complete checkout.";
    }
    debugLog({
      location: "revenueCatWeb.ts:presentPaywall",
      message: "Web paywall error",
      data: { err: msg },
      hypothesisId: "WEB_RC",
    });
    return false;
  }
}

/**
 * Sync web purchase to Supabase via existing `sync-revenuecat-entitlement` (same as native).
 */
export async function syncWebRevenueCatEntitlementToBackend(): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    console.warn("[RevenueCat Web] Backend sync skipped: no session.");
    return false;
  }

  try {
    const onboarding_prefs = await gatherOnboardingPrefs();
    const body: Record<string, unknown> = {};
    if (onboarding_prefs && Object.keys(onboarding_prefs).length > 0) {
      body.onboarding_prefs = onboarding_prefs;
    }

    const { error, data } = await supabase.functions.invoke("sync-revenuecat-entitlement", {
      method: "POST",
      body,
    });

    const payload = data as {
      success?: boolean;
      active?: boolean;
      downgraded?: boolean;
      preservedExisting?: boolean;
      preservedStripeBilling?: boolean;
      error?: string;
    } | null;

    const syncOk =
      !error &&
      !payload?.downgraded &&
      (payload?.preservedExisting === true ||
        payload?.preservedStripeBilling === true ||
        (payload?.success === true && payload?.active === true));

    if (!syncOk) {
      console.warn("[RevenueCat Web] sync-revenuecat-entitlement:", error?.message ?? payload?.error);
    }
    return syncOk;
  } catch (e) {
    console.warn("[RevenueCat Web] Backend sync failed:", e);
    return false;
  }
}

const POST_PURCHASE_INITIAL_DELAY_MS = 800;
const POST_PURCHASE_RETRY_DELAY_MS = 1200;

export async function syncWebRevenueCatEntitlementAfterPurchaseWithRetries(attempts = 4): Promise<boolean> {
  await new Promise((r) => setTimeout(r, POST_PURCHASE_INITIAL_DELAY_MS));
  for (let i = 0; i < attempts; i += 1) {
    if (await syncWebRevenueCatEntitlementToBackend()) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_RETRY_DELAY_MS));
  }
  return false;
}

```

---

## FILE: src/lib/runWebPaywallFlow.ts

```typescript
import { Capacitor } from "@capacitor/core";
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";

export type WebPaywallFlowOutcome = "success" | "skipped";

/**
 * After web signup, route to the RevenueCat web paywall (purchases-js).
 * Entitlement sync runs on `/onboarding/post-paywall` (same edge function as native).
 */
export async function runWebPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
}): Promise<WebPaywallFlowOutcome> {
  if (Capacitor.isNativePlatform()) {
    return "skipped";
  }

  if (!options.userId) {
    toast.error("Sign in is required before subscribing.");
    options.navigate("/login", { replace: true });
    return "skipped";
  }

  armIapPostPurchaseEntitlementLatch(options.userId);
  options.navigate("/onboarding/web-paywall", { replace: true });
  return "success";
}

```

---

## FILE: index.html

```html
<!doctype html>
<html lang="en">
<head>
<!-- Google Tag Manager -->
<script>(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
})(window,document,'script','dataLayer','GTM-N6QFTP58');</script>
<!-- End Google Tag Manager -->
<!-- TikTok Pixel Code Start -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D5N27FBC77U6J0PHGJ1G');
  ttq.page({ content_id: window.location.pathname || '/' });
}(window, document, 'ttq');
</script>
<!-- TikTok Pixel Code End -->
<!-- Google tag (gtag.js) -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-QQX552G8JN"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());

  gtag('config', 'G-QQX552G8JN');
</script>
<meta charset="UTF-8" />
<!--
  `interactive-widget=overlays-content` tells Chrome / Android WebView to overlay the on-screen
  keyboard on top of existing layout instead of shrinking the visual viewport. Stops fixed footers
  (Back / Continue on onboarding form pages) from lifting above the keyboard. iOS WKWebView already
  behaves this way under Capacitor `KeyboardResize.None`, so this is a no-op on iOS.
-->
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover, interactive-widget=overlays-content" />
<link rel="preconnect" href="https://play.google.com" crossorigin />
<link rel="preconnect" href="https://tools.applemediaservices.com" crossorigin />
<meta name="color-scheme" content="light">
<script>
(function () {
  try {
    if (/Capacitor/i.test(navigator.userAgent)) {
      document.documentElement.classList.add("capacitor-native");
      var stored = localStorage.getItem("theme");
      var isDark = stored !== "light";
      if (isDark) document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = isDark ? "dark" : "light";
      var bg = isDark ? "#0f0d14" : "#ffffff";
      document.documentElement.style.backgroundColor = bg;
    }
  } catch (e) {}
})();
</script>
<style>
/* Font smoothing */
* {
-webkit-font-smoothing: antialiased;
-moz-osx-font-smoothing: grayscale;
}

html {
-webkit-text-size-adjust: 100%;
text-size-adjust: 100%;
}

/* Prevent Android WebView filters - but allow normal theming */
html, body, #root {
filter: none !important;
}

/* Native app: respect light/dark appearance (dashboard + chat). */
html.capacitor-native.dark,
html.capacitor-native.dark body,
html.capacitor-native.dark #root {
color-scheme: dark;
background-color: #0f0d14 !important;
}

html.capacitor-native:not(.dark),
html.capacitor-native:not(.dark) body,
html.capacitor-native:not(.dark) #root {
color-scheme: light;
background-color: #ffffff !important;
}

html.capacitor-native[data-app-appearance="cosmic"],
html.capacitor-native[data-app-appearance="cosmic"] body,
html.capacitor-native[data-app-appearance="cosmic"] #root {
color-scheme: dark;
background-color: #0a0812 !important;
}

/* Light mode defaults (when no .dark class) */
html:not(.dark):not(.capacitor-native) {
color-scheme: light;
background-color: #ffffff;
}

html:not(.dark):not(.capacitor-native) body {
background-color: #ffffff;
}

/* Dark mode (when .dark class is present) */
html.dark {
color-scheme: dark;
background-color: #09090b;
}

html.dark body {
background-color: #09090b;
}
</style>
<title>Palette Plotting</title>
<meta name="description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta name="author" content="Palette Plotting" />
<meta name="keywords" content="affirmations, self-improvement, personal growth, goal setting, reflection, visualization, audio creation, Mirror Work, subliminal audio, AI affirmations" />
<link rel="canonical" href="https://paletteplot.com" />

<meta property="og:title" content="Palette Plotting" />
<meta property="og:description" content="Palette Plotting: Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today." />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://paletteplot.com" />
<meta property="og:site_name" content="Palette Plotting" />

<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@paletteplotting" />
<meta name="twitter:title" content="Palette Plotting" />
<meta name="twitter:description" content="Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools." />

<!-- PWA Meta Tags -->
<meta name="theme-color" content="#000000" />
    <meta name="mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Palette Plotting" />

<!--
  Apple Smart App Banner — shows a native banner at the top of mobile Safari
  with one-tap install / open. Only renders when Safari is the active browser
  (it's a no-op in TikTok / IG / FB webviews, but it's a major install lift
  for organic + retargeting traffic that does land in Safari).
  app-id derived from PALETTE_PLOTTING_APP_STORE_URL (id6759469696).
-->
<meta name="apple-itunes-app" content="app-id=6759469696" />

<!-- Manifest: mobile gets real manifest; desktop gets a blank manifest + SW unregister + SW register noop -->
<script>
(function() {
const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
// Remove any existing manifest links first
document.querySelectorAll('link[rel="manifest"]').forEach(l => l.remove());

const link = document.createElement('link');
link.rel = 'manifest';
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json,{}';
        // For desktop, use a minimal valid manifest to avoid parsing errors
        link.href = isMobile ? '/manifest.json' : 'data:application/manifest+json;charset=utf-8,' + encodeURIComponent('{"name":"","display":"browser"}');
document.head.appendChild(link);

// Unregister stale service workers on all devices (mobile PWA cache can serve old CSS/JS).
if ('serviceWorker' in navigator) {
navigator.serviceWorker.getRegistrations().then(function(regs) {
  regs.forEach(function(reg) { reg.unregister(); });
}).catch(function() {});
var originalRegister = navigator.serviceWorker.register ? navigator.serviceWorker.register.bind(navigator.serviceWorker) : null;
navigator.serviceWorker.register = function() {
console.warn('Service worker registration blocked to prevent stale homepage cache', arguments[0]);
return Promise.reject(new Error('SW registration blocked'));
};
if (navigator.serviceWorker.ready) {
navigator.serviceWorker.ready.catch(function() {});
}
}

// Viewport parity debug — open homepage with ?debug=viewport (console + optional on-screen overlay).
if (/[?&]debug=viewport/.test(window.location.search)) {
function logViewportDebug() {
  var vv = window.visualViewport;
  var moduleScript = document.querySelector('script[type="module"]');
  var cssLink = document.querySelector('link[rel="stylesheet"]');
  var payload = {
    innerWidth: window.innerWidth,
    clientWidth: document.documentElement.clientWidth,
    visualViewportWidth: vv ? vv.width : null,
    visualViewportScale: vv ? vv.scale : null,
    devicePixelRatio: window.devicePixelRatio,
    isMobileUa: isMobile,
    isMobileBreakpoint: window.innerWidth < 768,
    assetJs: moduleScript ? moduleScript.getAttribute('src') : null,
    assetCss: cssLink ? cssLink.getAttribute('href') : null,
    viewportMeta: document.querySelector('meta[name="viewport"]') ? document.querySelector('meta[name="viewport"]').getAttribute('content') : null,
  };
  console.info('[paletteplotting viewport debug]', payload);
  var el = document.getElementById('sv-viewport-debug');
  if (!el) {
    el = document.createElement('pre');
    el.id = 'sv-viewport-debug';
    el.style.cssText = 'position:fixed;left:0;right:0;bottom:5rem;z-index:9999;margin:0;padding:8px;font:11px/1.35 monospace;background:rgba(0,0,0,0.88);color:#0f0;white-space:pre-wrap;pointer-events:none;max-height:40vh;overflow:auto;';
    document.body.appendChild(el);
  }
  el.textContent = JSON.stringify(payload, null, 2);
}
document.addEventListener('DOMContentLoaded', logViewportDebug);
window.addEventListener('resize', logViewportDebug);
if (window.visualViewport) window.visualViewport.addEventListener('resize', logViewportDebug);
}
})();
</script>
<script>
// Sync meta theme-color with dashboard appearance (PWA status bar, mobile browser chrome, Capacitor WebView).
(function() {
function syncStatusBar() {
var themeMeta = document.querySelector('meta[name="theme-color"]');
if (!themeMeta) return;

// Marketing pages: black chrome (status bar / safe area). Not dashboard, onboarding, or login.
function isMarketingSitePath(pathname) {
var path = pathname === '/' ? '/' : pathname.replace(/\/$/, '') || '/';
if (path === '/login') return false;
if (path.indexOf('/dashboard') === 0) return false;
if (path.indexOf('/onboarding') === 0) return false;
var exact = ['/', '/faq', '/what-is-palette-plotting', '/terms', '/privacy', '/acceptable-use', '/contact', '/billing', '/dmca'];
if (exact.indexOf(path) !== -1) return true;
if (path.indexOf('/blog') === 0) return true;
return false;
}
if (isMarketingSitePath(window.location.pathname)) {
themeMeta.setAttribute('content', '#000000');
var appleStatus = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatus) appleStatus.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.backgroundColor = '#000000';
if (document.body) document.body.style.backgroundColor = '#000000';
if (document.documentElement.classList.contains('dark')) {
document.documentElement.classList.remove('dark');
}
return;
}

var path = window.location.pathname.replace(/\/$/, '') || '/';
if (path === '/onboarding/welcome' || path.indexOf('/onboarding/setup/') === 0) {
var onboardingShellBg = 'linear-gradient(180deg, #0a0812 0%, #0f0d14 50%, #0a0812 100%)';
themeMeta.setAttribute('content', '#0f0d14');
var appleOnboarding = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleOnboarding) appleOnboarding.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
document.documentElement.style.setProperty('background', onboardingShellBg, 'important');
document.documentElement.style.setProperty('background-color', '#0f0d14', 'important');
if (document.body) {
document.body.style.setProperty('background', onboardingShellBg, 'important');
document.body.style.setProperty('background-color', '#0f0d14', 'important');
}
var onboardingRoot = document.getElementById('root');
if (onboardingRoot) {
onboardingRoot.style.setProperty('background', onboardingShellBg, 'important');
onboardingRoot.style.setProperty('background-color', '#0f0d14', 'important');
}
return;
}

document.documentElement.style.removeProperty('background');
document.documentElement.style.removeProperty('background-color');
if (document.body) {
document.body.style.removeProperty('background');
document.body.style.removeProperty('background-color');
}
var appRoot = document.getElementById('root');
if (appRoot) {
appRoot.style.removeProperty('background');
appRoot.style.removeProperty('background-color');
}
var appleStatusDefault = document.querySelector('meta[name="apple-mobile-web-app-status-bar-style"]');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');

var appearance = document.documentElement.getAttribute('data-app-appearance');
if (appearance === 'cosmic') {
themeMeta.setAttribute('content', '#0a0812');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
return;
}

if (path.indexOf('/dashboard') === 0) {
if (appearance === 'dark') {
themeMeta.setAttribute('content', '#0f0d14');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'black-translucent');
document.documentElement.style.colorScheme = 'dark';
} else {
themeMeta.setAttribute('content', '#ffffff');
if (appleStatusDefault) appleStatusDefault.setAttribute('content', 'default');
document.documentElement.style.colorScheme = 'light';
}
return;
}

var isDark = document.documentElement.classList.contains('dark');
if (isDark) {
themeMeta.setAttribute('content', '#09090b');
return;
}

themeMeta.setAttribute('content', '#ffffff');
}

// Watch for theme / appearance changes (React sets data-app-appearance on the document element)
var observer = new MutationObserver(syncStatusBar);
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class', 'data-app-appearance'] });
syncStatusBar();

// Watch for route changes
let lastPath = window.location.pathname;
const checkRoute = () => {
if (window.location.pathname !== lastPath) {
lastPath = window.location.pathname;
syncStatusBar();
}
};
window.addEventListener('popstate', checkRoute);
setInterval(checkRoute, 100);

// Also sync after DOM is ready and after a delay (React needs time to set theme)
document.addEventListener('DOMContentLoaded', function() {
syncStatusBar();
setTimeout(syncStatusBar, 100);
setTimeout(syncStatusBar, 500);
});
})();
</script>
<link rel="apple-touch-icon" href="/icon-196.png" />
<link rel="icon" type="image/png" sizes="196x196" href="/icon-196.png?v=5" />
<link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=5" />
<link rel="shortcut icon" href="/icon-196.png?v=5" />

<link rel="preconnect" href="https://fonts.cdnfonts.com">
<link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..700&display=swap" rel="stylesheet">

<!-- Structured Data (JSON-LD) -->
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "potentialAction": {
    "@type": "SearchAction",
    "target": "https://paletteplot.com/search?q={search_term_string}",
    "query-input": "required name=search_term_string"
  }
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Palette Plotting",
  "applicationCategory": "HealthApplication",
  "operatingSystem": "Web, iOS, Android",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD"
  },
  "description": "Build confidence with AI-powered affirmations, Mirror Work, subliminal audio creation, and daily reflection tools. Start your personal growth journey today.",
  "url": "https://paletteplot.com"
}
</script>

<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "name": "Palette Plotting",
  "url": "https://paletteplot.com",
  "contactPoint": {
    "@type": "ContactPoint",
    "telephone": "+1-847-563-4944",
    "contactType": "customer service",
    "email": "support@paletteplot.com",
    "areaServed": "US",
    "availableLanguage": "English"
  },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "1 North State Street Ste 1500",
    "addressLocality": "Chicago",
    "addressRegion": "IL",
    "postalCode": "60602",
    "addressCountry": "US"
  },
  "sameAs": [
    "https://twitter.com/paletteplotting"
  ]
}
</script>

</head>

<body>
<!-- Google Tag Manager (noscript) -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-N6QFTP58"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>
<!-- End Google Tag Manager (noscript) -->
<!-- Force remove dark class immediately on page load -->
<script>
(function() {
  // Remove dark class if it exists
  document.documentElement.classList.remove('dark');

  // Store the original add and remove methods
  const originalClassListAdd = DOMTokenList.prototype.add;
  const originalClassListRemove = DOMTokenList.prototype.remove;

  // Get the original classList descriptor
  const originalClassListDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, 'classList') || 
                                      Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'classList');
  
  // Override the classList property on Element.prototype
  Object.defineProperty(Element.prototype, 'classList', {
    get: function() {
      const self = this; // Capture the element instance
      
      // Get the actual classList using the original getter
      const actualClassList = originalClassListDescriptor ? 
                              originalClassListDescriptor.get.call(self) : 
                              self.classList;

      // Create a proxy for the classList that calls the original methods
      // with the correct context (the element's actual classList)
      const customClassList = {
        add: function(...args) {
          // Block dark class from being added to html element on non-dashboard pages
          if (self === document.documentElement &&
              args.includes('dark') &&
              !window.location.pathname.startsWith('/dashboard')) {
            console.log('Blocked dark class on non-dashboard page');
            return;
          }
          // Call the original add method, ensuring 'this' context is the actual classList
          return originalClassListAdd.apply(actualClassList, args);
        },
        remove: function(...args) {
          // Call the original remove method, ensuring 'this' context is the actual classList
          return originalClassListRemove.apply(actualClassList, args);
        },
        toggle: function(...args) {
          return actualClassList.toggle.apply(actualClassList, args);
        },
        contains: function(...args) {
          return actualClassList.contains.apply(actualClassList, args);
        },
        item: function(...args) {
          return actualClassList.item.apply(actualClassList, args);
        },
        replace: function(...args) {
          return actualClassList.replace.apply(actualClassList, args);
        },
        get length() {
          return actualClassList.length;
        },
        get value() {
          return actualClassList.value;
        },
        set value(val) {
          actualClassList.value = val;
        },
        forEach: function(...args) {
          return actualClassList.forEach.apply(actualClassList, args);
        },
        entries: function() {
          return actualClassList.entries();
        },
        keys: function() {
          return actualClassList.keys();
        },
        values: function() {
          return actualClassList.values();
        },
        [Symbol.iterator]: function() {
          return actualClassList[Symbol.iterator]();
        },
        toString: function() {
          return actualClassList.toString();
        }
      };

      return customClassList;
    },
    configurable: true, // Allow the property to be redefined
  });
})();
</script>
<div id="root"></div>
<script type="module" src="/src/main.tsx"></script>
</body>
</html>
```

---

## FILE: src/lib/inAppBrowserDetection.ts

```typescript
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

## FILE: src/lib/useMarketingAttribution.ts

```typescript
import { useEffect, useMemo, useState } from "react";

/**
 * Marketing attribution: read UTM params on mount, persist for the session,
 * and expose convenience flags (`isPaid`, `isFromTikTok`) for analytics only.
 * The homepage layout is identical for all visitors.
 *
 * Persists in sessionStorage so back-navigation / hash changes / route
 * changes during the session keep the attribution.
 */

const ATTRIBUTION_KEY = "marketing_attribution_v1";

const PAID_SOURCES = new Set([
  "tiktok",
  "tiktok-ads",
  "tiktokads",
  "tt",
  "facebook",
  "fb",
  "meta",
  "instagram",
  "ig",
  "snap",
  "snapchat",
  "reddit",
  "google-ads",
  "googleads",
  "youtube-ads",
  "pinterest-ads",
  "linkedin-ads",
]);

const PAID_MEDIUMS = new Set([
  "paid",
  "cpc",
  "ppc",
  "ads",
  "ad",
  "social-paid",
  "paid-social",
  "paidsocial",
  "display",
  "video",
]);

export type MarketingAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  landing: string;
  at: string;
  /** True when source/medium look like a paid ad placement. */
  isPaid: boolean;
  isFromTikTok: boolean;
};

function readPersisted(): MarketingAttribution | null {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarketingAttribution>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmContent: parsed.utmContent ?? null,
      utmTerm: parsed.utmTerm ?? null,
      landing: parsed.landing ?? "/",
      at: parsed.at ?? new Date().toISOString(),
      isPaid: Boolean(parsed.isPaid),
      isFromTikTok: Boolean(parsed.isFromTikTok),
    };
  } catch {
    return null;
  }
}

function classify(source: string | null, medium: string | null) {
  const src = (source ?? "").toLowerCase().trim();
  const med = (medium ?? "").toLowerCase().trim();
  const isFromTikTok = src.includes("tiktok") || src === "tt";
  const isPaid = PAID_SOURCES.has(src) || PAID_MEDIUMS.has(med) || med.startsWith("paid");
  return { isPaid, isFromTikTok };
}

function readFromLocation(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const utmTerm = params.get("utm_term");

    if (!utmSource && !utmMedium && !utmCampaign) return null;

    const { isPaid, isFromTikTok } = classify(utmSource, utmMedium);

    return {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      landing: window.location.pathname || "/",
      at: new Date().toISOString(),
      isPaid,
      isFromTikTok,
    };
  } catch {
    return null;
  }
}

function persist(attribution: MarketingAttribution) {
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
}

export function useMarketingAttribution(): MarketingAttribution | null {
  const initial = useMemo(() => {
    if (typeof window === "undefined") return null;
    const fromUrl = readFromLocation();
    if (fromUrl) {
      persist(fromUrl);
      return fromUrl;
    }
    return readPersisted();
  }, []);

  const [attribution, setAttribution] = useState<MarketingAttribution | null>(initial);

  useEffect(() => {
    const onPop = () => {
      const fromUrl = readFromLocation();
      if (fromUrl) {
        persist(fromUrl);
        setAttribution(fromUrl);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return attribution;
}

/** Read attribution outside React (e.g. inside event handlers or libs). */
export function readMarketingAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  const fromUrl = readFromLocation();
  if (fromUrl) {
    persist(fromUrl);
    return fromUrl;
  }
  return readPersisted();
}

```

---

## FILE: src/hooks/useMarketingStoreCta.tsx

```tsx
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { MobileStoreFallbackSheet } from "@/components/marketing/MobileStoreFallbackSheet";
import { useIsMobile } from "@/hooks/use-mobile";
import { detectInAppBrowser, type InAppBrowserDetection } from "@/lib/inAppBrowserDetection";
import {
  getMobileWebStore,
  handleStoreClick,
  isDesktopMarketingWeb,
  shouldScheduleStoreFallback,
  type MobileWebStore,
  type StoreClickResult,
} from "@/lib/marketingGetApp";
import {
  getCopyableStoreUrl,
  getMobileStoreHref,
  openMobileStoreViaAnchor,
} from "@/lib/mobileStoreHandoff";
import { logStoreHandoff } from "@/lib/mobileStoreHandoffDebug";
import { scheduleStoreFallbackCheck, type StoreFallbackScheduleHandle } from "@/lib/mobileStoreFallbackScheduler";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";

type FallbackState = {
  store: MobileWebStore;
  storeUrl: string;
  source: string;
};

export type UseStoreCtaResult = {
  detection: InAppBrowserDetection;
  getStoreHref: (store: MobileWebStore) => string;
  primaryStoreHref: string;
  primaryStore: MobileWebStore;
  onStoreClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
  /** @deprecated use onStoreClick */
  onCtaClick: (source: string, forceStore?: MobileWebStore) => StoreClickResult;
};

type ProviderState = UseStoreCtaResult & {
  fallbackOpen: boolean;
  fallbackState: FallbackState | null;
  closeFallback: () => void;
  tryAgain: () => void;
  copyStoreLink: () => Promise<boolean>;
};

const MarketingStoreCtaContext = createContext<UseStoreCtaResult | null>(null);

function useMarketingStoreCtaInternal(isMobileViewport: boolean): ProviderState {
  const [detection, setDetection] = useState<InAppBrowserDetection>(() => detectInAppBrowser());
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [fallbackState, setFallbackState] = useState<FallbackState | null>(null);
  const fallbackTimerRef = useRef<StoreFallbackScheduleHandle | null>(null);

  useEffect(() => {
    const next = detectInAppBrowser();
    setDetection(next);
    logStoreHandoff("detection_ready", {
      userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "",
      in_app_browser: next.kind ?? "none",
      blocks_app_store: next.blocksAppStore,
      platform: next.isIos ? "ios" : next.isAndroid ? "android" : "unknown",
    });
  }, []);

  const cancelFallbackTimer = useCallback((reason: string) => {
    fallbackTimerRef.current?.cancel(reason);
    fallbackTimerRef.current = null;
  }, []);

  const closeFallback = useCallback(() => {
    setFallbackOpen(false);
    setFallbackState(null);
  }, []);

  const openFallback = useCallback((state: FallbackState) => {
    setFallbackState(state);
    setFallbackOpen(true);
    trackMarketingConversion("in_app_prompt_shown", {
      source: state.source,
      store: state.store,
    });
    logStoreHandoff("fallback_sheet_opened", {
      source: state.source,
      store: state.store,
      storeUrl: state.storeUrl,
    });
  }, []);

  const scheduleFallback = useCallback(
    (store: MobileWebStore, source: string) => {
      if (!shouldScheduleStoreFallback(isMobileViewport, detection)) return;

      cancelFallbackTimer("reschedule");
      const copyUrl = getCopyableStoreUrl(store);

      fallbackTimerRef.current = scheduleStoreFallbackCheck({
        meta: { source, store },
        onShow: () => openFallback({ store, storeUrl: copyUrl, source }),
      });
    },
    [cancelFallbackTimer, detection, isMobileViewport, openFallback],
  );

  const getStoreHref = useCallback(
    (store: MobileWebStore) => getMobileStoreHref(store, detection),
    [detection],
  );

  const primaryStore = useMemo(
    () => getMobileWebStore() ?? ("apple" as MobileWebStore),
    [],
  );

  const primaryStoreHref = useMemo(
    () => getMobileStoreHref(primaryStore, detection),
    [detection, primaryStore],
  );

  const onStoreClick = useCallback(
    (source: string, forceStore?: MobileWebStore) => {
      const isDesktop = isDesktopMarketingWeb(isMobileViewport);
      const result = handleStoreClick({
        isMobileViewport,
        forceStore,
        source,
        detection,
        navigate: isDesktop,
      });

      if (!isDesktop && result.kind === "opened_store") {
        scheduleFallback(result.store, source);
      }

      return result;
    },
    [detection, isMobileViewport, scheduleFallback],
  );

  const tryAgain = useCallback(() => {
    if (!fallbackState) return;
    trackMarketingConversion("in_app_open_in_browser", {
      source: fallbackState.source,
      store: fallbackState.store,
      action: "try_again",
    });
    openMobileStoreViaAnchor(fallbackState.store, detection);
    scheduleFallback(fallbackState.store, fallbackState.source);
  }, [detection, fallbackState, scheduleFallback]);

  const copyStoreLink = useCallback(async (): Promise<boolean> => {
    if (!fallbackState) return false;
    try {
      await navigator.clipboard.writeText(fallbackState.storeUrl);
      trackMarketingConversion("in_app_copy_link", {
        source: fallbackState.source,
        store: fallbackState.store,
      });
      return true;
    } catch {
      return false;
    }
  }, [fallbackState]);

  useEffect(() => () => cancelFallbackTimer("unmount"), [cancelFallbackTimer]);

  return {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick: onStoreClick,
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
  };
}

export function MarketingStoreCtaProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const state = useMarketingStoreCtaInternal(isMobile);
  const {
    fallbackOpen,
    fallbackState,
    closeFallback,
    tryAgain,
    copyStoreLink,
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  } = state;

  const ctxValue: UseStoreCtaResult = {
    detection,
    getStoreHref,
    primaryStoreHref,
    primaryStore,
    onStoreClick,
    onCtaClick,
  };

  return (
    <MarketingStoreCtaContext.Provider value={ctxValue}>
      {children}
      {!isDesktopMarketingWeb(isMobile) && fallbackState ? (
        <MobileStoreFallbackSheet
          open={fallbackOpen}
          store={fallbackState.store}
          storeUrl={fallbackState.storeUrl}
          browserKind={state.detection.kind}
          isIos={state.detection.isIos}
          onClose={closeFallback}
          onTryAgain={tryAgain}
          onCopy={copyStoreLink}
        />
      ) : null}
    </MarketingStoreCtaContext.Provider>
  );
}

export function useMarketingStoreCta(): UseStoreCtaResult {
  const ctx = useContext(MarketingStoreCtaContext);
  if (!ctx) {
    throw new Error("useMarketingStoreCta must be used within MarketingStoreCtaProvider");
  }
  return ctx;
}

```

---

## FILE: src/lib/marketingConversionTrack.ts

```typescript
/**
 * Marketing conversion event helper.
 *
 * Fires the same event into:
 *   1. sessionStorage (debug breadcrumb, last 20 events)
 *   2. Google Analytics (gtag) — already loaded in index.html (G-QQX552G8JN)
 *   3. TikTok Pixel (ttq) — already loaded in index.html (D5N27FBC77U6J0PHGJ1G)
 *   4. dataLayer / GTM — for any downstream tags
 *
 * We map our internal action names to TikTok's standard events so the ads
 * algorithm can optimize. Without this, TikTok only sees PageView and the
 * algo can't learn which clicks lead to outcomes.
 *
 * Actions:
 *   - landing_view              -> ttq ViewContent
 *   - cta_app_store_click       -> ttq ClickButton + ttq Download
 *   - cta_play_store_click      -> ttq ClickButton + ttq Download
 *   - cta_web_onboarding_click  -> ttq ClickButton
 *   - cta_header_app_click      -> ttq ClickButton
 *   - in_app_prompt_shown       -> ttq ClickButton (proxy)
 *   - in_app_open_in_browser    -> ttq ClickButton (proxy)
 *   - newsletter_subscribe      -> ttq Subscribe + ttq CompleteRegistration
 *   - paywall_view              -> ttq InitiateCheckout
 *   - subscription_complete     -> ttq CompletePayment
 */

export type MarketingConversionAction =
  | "landing_view"
  | "cta_app_store_click"
  | "cta_play_store_click"
  | "cta_web_onboarding_click"
  | "cta_header_app_click"
  | "cta_full_features_click"
  | "in_app_prompt_shown"
  | "in_app_open_in_browser"
  | "in_app_copy_link"
  | "newsletter_subscribe"
  | "paywall_view"
  | "subscription_complete"
  /** Legacy / generic — kept so existing callers don't break. */
  | "store_click"
  | "web_onboarding_click";

const SESSION_KEY = "marketing_conversions_v1";

type EventDetail = Record<string, string | number | boolean | undefined>;

type TtqShape = {
  track?: (event: string, params?: EventDetail) => void;
  page?: (params?: EventDetail) => void;
};

type DataLayerShape = Array<Record<string, unknown>>;

function persistBreadcrumb(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ action, detail, at: new Date().toISOString() });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
}

function fireGtag(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", action, {
      event_category: "marketing_conversion",
      ...detail,
    });
  } catch {
    /* ignore */
  }
}

function fireDataLayer(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { dataLayer?: DataLayerShape };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: `marketing_${action}`, ...detail });
  } catch {
    /* ignore */
  }
}

function ttqEventsForAction(action: MarketingConversionAction): string[] {
  switch (action) {
    case "landing_view":
      return ["ViewContent"];
    case "cta_app_store_click":
    case "cta_play_store_click":
      return ["ClickButton", "Download"];
    case "cta_web_onboarding_click":
    case "cta_header_app_click":
    case "cta_full_features_click":
    case "in_app_prompt_shown":
    case "in_app_open_in_browser":
    case "in_app_copy_link":
    case "store_click":
    case "web_onboarding_click":
      return ["ClickButton"];
    case "newsletter_subscribe":
      return ["Subscribe", "CompleteRegistration"];
    case "paywall_view":
      return ["InitiateCheckout"];
    case "subscription_complete":
      return ["CompletePayment"];
  }
}

function fireTtq(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { ttq?: TtqShape };
    if (!w.ttq?.track) return;
    const events = ttqEventsForAction(action);
    for (const e of events) {
      w.ttq.track(e, {
        ...(detail ?? {}),
        action_name: action,
      });
    }
  } catch {
    /* ignore */
  }
}

export function trackMarketingConversion(
  action: MarketingConversionAction,
  detail?: EventDetail,
): void {
  persistBreadcrumb(action, detail);
  fireGtag(action, detail);
  fireTtq(action, detail);
  fireDataLayer(action, detail);
}

```

---

## FILE: src/App.tsx

```tsx
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
import NotFound from "./pages/NotFound";
import Welcome from "./pages/onboarding/Welcome";
import Settings from "./pages/Settings";
import SubliminalAudio from "./pages/features/SubliminalAudio";
import Affirmations from "./pages/features/Affirmations";
import AffirmationVisualizerV2 from "./pages/features/AffirmationVisualizerV2";
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
import AdminSupportInbox from "./pages/admin/AdminSupportInbox";
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
import PricingPlans from "./pages/PricingPlans";
import GetAppStore from "./pages/GetAppStore";
import GetMobileApp from "./pages/GetMobileApp";
import GetNewsletter from "./pages/GetNewsletter";
import Blog from "./pages/Blog";
import BlogPost from "./pages/BlogPost";
import WhatIsPalettePlotting from "./pages/WhatIsPalettePlotting";
import ManifestHelp from "./pages/ManifestHelp";
import Contact from "./pages/Contact";
import Community from "./pages/Community";
import Unsubscribe from "./pages/Unsubscribe";
import { MannyDiscordRedirect } from "./pages/MannyDiscordRedirect";
import { ScrollToTop } from "@/components/ScrollToTop";
import { WebGetAppAfterPurchaseDialog } from "@/components/WebGetAppAfterPurchaseDialog";
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
            <WebGetAppAfterPurchaseDialog />
            <Routes>
              <Route path="/" element={<NativeAppRootRedirect />} />
              <Route path="/demo" element={<Navigate to="/" replace />} />
              <Route path="/demo-access" element={<Navigate to="/" replace />} />
              <Route path="/login" element={<Auth />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/community" element={<Community />} />
              <Route path="/manny" element={<MannyDiscordRedirect />} />
              <Route path="/newsletter" element={<GetNewsletter />} />
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
                <Route path="admin/support" element={<AdminSupportInbox />} />
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
              <Route path="/pricingplans" element={<PricingPlans />} />
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

```

---

## Review checklist

- [ ] `web_onboarding_sessions` migration applied in Supabase prod
- [ ] Welcome insert fires once per tab on browser only (not native)
- [ ] Safari Smart App Banner expected on welcome/setup; TikTok in-app has no top banner
- [ ] Onboarding has no `MarketingStoreCtaProvider` — intentional gap for TikTok direct-to-welcome?
- [ ] GA funnel: consider `page_view` + per-step `document.title` from `ONBOARDING_STEP_LABELS`
- [ ] RC coupons: dashboard config + optional `showDiscountCodeField` in `revenueCatWeb.ts`
- [ ] Does not modify `onboarding_sessions` or edge functions

