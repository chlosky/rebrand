# Part 3 — Welcome, paywall, shell

## src/pages/onboarding/Welcome.tsx

```tsx
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { useLocation, useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  markWebOnboardingMakeMyBoardCtaClicked,
  recordWebOnboardingSessionStart,
} from "@/lib/webOnboardingSessionInsert";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readSetupDraft } from "@/lib/setupDraft";
import {
  detectInitialAppLocale,
  isAppLocale,
  readStoredPreferredLocale,
  resolveAppLocale,
} from "@/lib/locale";
import { setAppLocale } from "@/i18n";
import { useTranslation } from "react-i18next";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import {
  MARKETING_WEB_ONBOARDING_SETUP_PATH,
  MARKETING_WEB_ONBOARDING_WELCOME_PATH,
} from "@/lib/marketingConversionCopy";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import { SETUP_NATIVE_CONTINUE_BTN_CLASS, SETUP_PRIMARY_CTA_CLASS } from "@/lib/onboardingSetupTheme";

const WELCOME_ACCENT = "#a87c84";

const WELCOME_PRIMARY_CTA_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "h-12 rounded-xl text-[15px] font-semibold",
);

const WELCOME_WEB_CTA_CLASS = cn(
  SETUP_PRIMARY_CTA_CLASS,
  "h-[3.35rem] rounded-xl text-[15px] font-bold shadow-[0_8px_28px_rgba(24,24,27,0.12)]",
);

function WelcomePitch() {
  const { t } = useTranslation("onboarding");
  const pillars = t("welcome.pillars", { returnObjects: true }) as string[];
  return (
    <div className="flex w-full max-w-[21rem] flex-col items-center gap-4 px-1 md:max-w-[32rem]">
      <p className="font-sans text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
        {t("welcome.tagline")}
      </p>
      <ul className="flex w-full flex-col gap-2.5 text-center">
        {pillars.map((line) => (
          <li key={line} className="font-sans text-[13px] leading-[1.5] text-zinc-600">
            {line}
          </li>
        ))}
      </ul>
    </div>
  );
}

function WelcomeTitle({ showFreeTrialLine }: { showFreeTrialLine?: boolean }) {
  const { t, i18n } = useTranslation("onboarding");
  const activeLocale = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const hasAccent = i18n.exists("welcome.nativeTitleAccent", { ns: "onboarding", lng: activeLocale });

  return (
    <div className="flex flex-col items-center gap-2">
      <h1 className="font-welcome-serif mt-0 max-w-[20rem] text-center text-[30px] font-normal leading-[1.12] tracking-[-0.02em] text-zinc-900 sm:max-w-[28rem] sm:text-[34px] md:max-w-[36rem] md:text-[40px]">
        {hasAccent ? (
          <>
            {t("welcome.nativeTitleLead")}
            <span style={{ color: WELCOME_ACCENT }}>{t("welcome.nativeTitleAccent")}</span>
          </>
        ) : (
          t("welcome.nativeTitle")
        )}
      </h1>
      {showFreeTrialLine ? (
        <p className="font-sans text-[17px] font-medium tracking-[-0.02em] text-zinc-500" style={{ color: WELCOME_ACCENT }}>
          {t("welcome.freeTrialLine")}
        </p>
      ) : null}
    </div>
  );
}

function WelcomeBodyNative() {
  const { t } = useTranslation("onboarding");
  const isAndroidNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android";
  const isIosNative = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-[calc(var(--app-safe-area-top)+1.25rem)] -translate-y-[0.32in]">
      <WelcomeTitle showFreeTrialLine={!isIosNative && !isAndroidNative} />
      <p className="max-w-[21rem] text-center text-[14px] leading-[1.55] text-zinc-600">{t("welcome.nativeDescription")}</p>
      <WelcomePitch />
    </div>
  );
}

function WelcomeBodyWeb() {
  const { t } = useTranslation("onboarding");
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-1 md:max-w-xl md:gap-6 md:pt-1.5 lg:max-w-2xl">
      <img
        src="/logo.png"
        alt="Palette Plotting"
        className="mb-1 h-16 w-auto object-contain md:h-20"
        decoding="async"
      />
      <WelcomeTitle />
      <p className="max-w-[21rem] text-center text-[14px] leading-[1.55] text-zinc-600 md:max-w-[32rem] md:text-[15px]">
        {t("welcome.nativeDescription")}
      </p>
      <WelcomePitch />
    </div>
  );
}

const welcomeLayoutPropsBase = {
  currentPage: 1 as const,
  welcomePage: true,
  stackedNativeButtons: true,
  stackedNativePrimaryButtonClassName: SETUP_NATIVE_CONTINUE_BTN_CLASS,
  welcomeSignInAsTextLink: false,
};

const Welcome = () => {
  const { t } = useTranslation("onboarding");
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();
  const isMobile = useIsMobile();
  const isSuiteWelcome = pathname.includes("/onboarding/suite");

  useEffect(() => {
    if (isNative) return;
    const recordWelcomeView = () => {
      void ensureOnboardingSessionCreds().catch((err) => {
        console.warn("[Welcome] ensureOnboardingSessionCreds failed:", err);
      });
      const welcomePath = isSuiteWelcome ? "/onboarding/suite/welcome" : MARKETING_WEB_ONBOARDING_WELCOME_PATH;
      recordWebOnboardingSessionStart({ isMobileViewport: isMobile, entryPath: welcomePath });
      trackMarketingConversion("web_onboarding_welcome_view", {
        source: "welcome_page",
        page_path: welcomePath,
      });
    };
    if (!detectInAppBrowser().isInAppBrowser) {
      recordWelcomeView();
      return;
    }
    const timeoutId = window.setTimeout(recordWelcomeView, 1500);
    return () => window.clearTimeout(timeoutId);
  }, [isNative, isMobile, isSuiteWelcome]);

  useEffect(() => {
    void (async () => {
      const stored = readStoredPreferredLocale();
      if (stored) {
        await setAppLocale(stored);
        return;
      }
      const draft = readSetupDraft();
      if (draft.locale && isAppLocale(draft.locale)) {
        await setAppLocale(draft.locale);
        return;
      }
      await setAppLocale(detectInitialAppLocale());
    })();
  }, []);

  useEffect(() => {
    if (!isLoading && user) navigate("/workspace", { replace: true });
  }, [user, isLoading, navigate]);

  useEffect(() => {
    if (!isNative) return;
    void ensureOnboardingSessionCreds().catch(() => {});
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (!cancelled) signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const onContinue = () => {
    if (isNative) {
      navigate("/onboarding/setup/primary-intent");
      return;
    }
    const target = isSuiteWelcome ? "/onboarding/suite/setup/primary-intent" : MARKETING_WEB_ONBOARDING_SETUP_PATH;
    trackMarketingConversion("web_onboarding_click", {
      source: "welcome_page",
      button_label: t("welcome.enterStudio"),
      target_path: target,
    });
    markWebOnboardingMakeMyBoardCtaClicked();
    navigate(target);
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      continueText={isNative ? t("welcome.signUp") : t("welcome.enterStudio")}
      welcomeCtaSubtext={isNative ? undefined : t("welcome.ctaSubtext")}
      welcomeSoloContinueButtonClassName={isNative ? WELCOME_PRIMARY_CTA_CLASS : WELCOME_WEB_CTA_CLASS}
      contentMaxWidthClass="max-w-[22rem] md:max-w-xl lg:max-w-2xl"
    >
      {isNative ? <WelcomeBodyNative /> : <WelcomeBodyWeb />}
    </OnboardingLayout>
  );
};

export default Welcome;

```

---

## src/pages/onboarding/WebPaywall.tsx

```tsx
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getLastWebPaywallError,
  getWebRevenueCatCheckoutQuote,
  isRevenueCatWebConfigured,
  presentWebRevenueCatPaywall,
} from "@/services/revenueCatWeb";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import { armWebGetAppPromptPending } from "@/lib/webFirstPurchaseGetAppPrompt";
import { attachHideBrokenRevenueCatPaywallMedia } from "@/lib/revenueCatPaywallMedia";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { isWebRevenueCatBillingEnabled, isWebStripeCheckoutEnabled } from "@/lib/webBillingConfig";
import {
  startWebStripeCheckout,
  type WebStripeBillingPeriod,
} from "@/lib/startWebStripeCheckout";
import { Check, Loader2 } from "lucide-react";



type PremiumPricing = {
  monthly: number;
  annual: number;
};

function formatUsd(amount: number): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(amount);
}

function WebPaywallShell({
  children,
  headline = "",
  subtitle = "",
  features = [] as string[],
}: {
  children: ReactNode;
  headline?: string;
  subtitle?: string;
  features?: string[];
}) {
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');
    html.style.setProperty("background", WELCOME_LIGHT_BASE, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);
    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-white font-sans text-zinc-900 antialiased">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 md:flex-row md:items-stretch md:gap-10 md:px-8 md:py-12">
        <aside className="hidden md:flex md:w-[42%] md:flex-col md:justify-center md:pr-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Palette Plotting</p>
          {headline ? (
          <h1 className="font-welcome-serif mt-3 text-4xl font-normal leading-[1.08] tracking-[-0.02em] text-zinc-900">
            {headline}
          </h1>
          ) : null}
          {subtitle ? (
          <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-600">{subtitle}</p>
          ) : null}
          {features.length > 0 ? (
          <ul className="mt-8 space-y-3">
            {features.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
          ) : null}
        </aside>

        <main className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-6 md:max-w-lg">
{children}
          </div>
        </main>
      </div>
    </div>
  );
}

/** Stripe Checkout — default web launch path. */
function WebPaywallStripe() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const billing: WebStripeBillingPeriod = "monthly";
  const [pricing, setPricing] = useState<PremiumPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate("/", { replace: true });
      return;
    }
    if (isLoading) return;
    if (!user?.id) {
      navigate("/login", { replace: true, state: { from: "/onboarding/web-paywall" } });
    }
  }, [isLoading, navigate, user?.id]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-pricing");
        if (!alive) return;
        if (error || !Array.isArray(data) || data.length === 0) {
          setPricing(null);
          return;
        }
        const row = data[0] as {
          monthly_display_price?: number;
          annual_display_price?: number;
        };
        setPricing({
          monthly: row.monthly_display_price ?? 0,
          annual: row.annual_display_price ?? 0,
        });
      } catch {
        if (alive) setPricing(null);
      } finally {
        if (alive) setPricingLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openCheckout = useCallback(async () => {
    if (!user?.id || checkoutLoading) return;
    setCheckoutLoading(true);
    try {
      const creds = await ensureOnboardingSessionCreds();
      await supabase.functions.invoke("update-onboarding-session", {
        body: {
          sessionId: creds.sessionId,
          resumeToken: creds.resumeToken,
          patch: {
            paywall_id: "web_stripe_checkout",
            paywall_variant: billing,
          },
        },
      });
    } catch {
      /* non-fatal */
    }
    trackMarketingConversion("paywall_view", {
      source: "web_stripe_checkout",
      page_path: "/onboarding/web-paywall",
      content_id: `premium_${billing}`,
      content_name: `premium_${billing}`,
      ...(pricing
        ? {
            value: billing === "annual" ? pricing.annual : pricing.monthly,
            currency: "USD",
          }
        : {}),
    });
    const result = await startWebStripeCheckout({ billing });
    setCheckoutLoading(false);
    if (!result.ok) {
      toast.error(result.error || t("webWrapper.checkoutFailed"), { duration: 8000 });
    }
  }, [billing, checkoutLoading, pricing, t, user?.id]);

  if (isLoading) {
    return <div className="min-h-screen" style={{ backgroundColor: WELCOME_LIGHT_BASE }} />;
  }

  const headline = t("webStripe.headline");
  const subtitle = t("webStripe.subtitle");
  const priceLine = t("webStripe.priceLine");
  const cancelLine = t("webStripe.cancelLine");
  const cta = t("webStripe.cta");
  const features = t("webStripe.features", { returnObjects: true }) as string[];

  return (
    <WebPaywallShell headline={headline} subtitle={subtitle} features={features}>
      <div className="mb-4 text-center md:hidden">
        <h1 className="font-welcome-serif text-2xl font-normal text-zinc-900">{headline}</h1>
        <p className="mt-2 text-sm text-zinc-500">{subtitle}</p>
      </div>
      <div className="space-y-5">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-5 text-center">
          {pricingLoading ? (
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-zinc-400" />
          ) : (
            <>
              <p className="text-2xl font-semibold tabular-nums text-zinc-900">{priceLine}</p>
              <p className="mt-2 text-sm text-zinc-500">{cancelLine}</p>
            </>
          )}
        </div>

        <Button
          type="button"
          className="h-12 w-full rounded-xl bg-zinc-900 text-[15px] font-semibold text-white hover:bg-zinc-800"
          disabled={checkoutLoading || pricingLoading}
          onClick={() => void openCheckout()}
        >
          {checkoutLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t("legacyIos.opening")}
            </>
          ) : (
            cta
          )}
        </Button>

        <p className="text-center text-[11px] leading-relaxed text-zinc-500">
          Secure checkout powered by Stripe. {cancelLine}
        </p>
      </div>
    </WebPaywallShell>
  );
}

/**
 * RevenueCat Web Billing — dormant unless `VITE_WEB_CHECKOUT_PROVIDER=revenuecat`.
 */
function WebPaywallRevenueCat() {
  const { t } = useTranslation("paywall");
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
    const quote = await getWebRevenueCatCheckoutQuote(user.id);
    try {
      const creds = await ensureOnboardingSessionCreds();
      await supabase.functions.invoke("update-onboarding-session", {
        body: {
          sessionId: creds.sessionId,
          resumeToken: creds.resumeToken,
          patch: {
            paywall_id: "web_revenuecat_paywall",
            paywall_variant: "default",
            offering_id: quote?.contentId ?? null,
            product_id: quote?.contentId ?? null,
          },
        },
      });
    } catch {
      /* non-fatal */
    }
    trackMarketingConversion("paywall_view", {
      source: "web_revenuecat_paywall",
      page_path: "/onboarding/web-paywall",
      content_id: quote?.contentId ?? "/onboarding/web-paywall",
      content_name: quote?.contentName ?? "web_revenuecat_paywall",
      ...(quote ? { value: quote.value, currency: quote.currency } : {}),
    });
    const paywallResult = await presentWebRevenueCatPaywall(user.id, {
      htmlTarget: containerRef.current,
      customerEmail: user.email ?? undefined,
    });
    setPresenting(false);

    if (paywallResult.ok) {
      trackMarketingConversion("subscription_complete", {
        source: "web_revenuecat_paywall",
        target_path: "/onboarding/post-paywall",
        event_id: paywallResult.purchaseEventId,
        content_id: paywallResult.productId,
        content_name: paywallResult.productName,
        ...(paywallResult.purchaseValue > 0
          ? { value: paywallResult.purchaseValue, currency: paywallResult.purchaseCurrency }
          : {}),
      });
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
    toast.error(detail || t("webWrapper.subscriptionNotCompleted"), { duration: 8000 });
  }, [navigate, presenting, t, user?.email, user?.id]);

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
      toast.error(t("webWrapper.notConfigured"), { duration: 8000 });
    }
  }, [isLoading, navigate, t, user?.id]);

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
    return <div className="min-h-screen" style={{ backgroundColor: WELCOME_LIGHT_BASE }} />;
  }

  const fallbackPanel = (children: ReactNode) => (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-16 text-center">{children}</div>
  );

  return (
    <WebPaywallShell>
      {phase === "error"
        ? fallbackPanel(
            <>
              <p className="text-sm text-zinc-600">
                {getLastWebPaywallError() || t("webWrapper.checkoutFailed")}
              </p>
              <div className="flex flex-col gap-2 sm:flex-row">
                {isRevenueCatWebConfigured() ? (
                  <Button type="button" onClick={() => void openPaywall()} disabled={presenting}>
                    {t("legacyIos.tryAgain")}
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
                  {t("webWrapper.close")}
                </Button>
              </div>
            </>,
          )
        : null}

      {phase === "dismissed"
        ? fallbackPanel(
            <>
              <p className="text-sm text-zinc-600">{t("webWrapper.checkoutClosed")}</p>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button type="button" onClick={() => void openPaywall()} disabled={presenting}>
                  {t("webWrapper.viewPlans")}
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/", { replace: true })}>
                  {t("webWrapper.close")}
                </Button>
              </div>
            </>,
          )
        : null}

      <div
        ref={containerRef}
        className={cn("web-rc-paywall-host", phase === "paywall" ? "block" : "hidden")}
        aria-live="polite"
      />
    </WebPaywallShell>
  );
}

export default function WebPaywall() {
  if (isWebStripeCheckoutEnabled()) {
    return <WebPaywallStripe />;
  }
  if (isWebRevenueCatBillingEnabled()) {
    return <WebPaywallRevenueCat />;
  }
  return <WebPaywallStripe />;
}

```

---

## src/pages/onboarding/IOSPaywall.tsx

```tsx
import { useCallback, useEffect, useLayoutEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X, Check } from "lucide-react";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog, getDebugLog } from "@/debugLog";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { IosAppHeader } from "@/components/IosAppHeader";
import {
  WelcomeCosmicBackground,
  WELCOME_LIGHT_BASE,
  WELCOME_LIGHT_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { supabase } from "@/integrations/supabase/client";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { useAppleIAP } from "@/hooks/useAppleIAP";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import { readStoredPreferredLocale, resolveAppLocale, legalTermsUrl, legalPrivacyUrl } from "@/lib/locale";
import { setAppLocale } from "@/i18n";
/** Matches native Welcome.tsx “Start your free trial” line. */
const NATIVE_WELCOME_PINK = "#e8b8cc";

function extractLeadingPriceNumber(priceString: string): number | null {
  const m = priceString.match(/[\d,.]+/);
  if (!m) return null;
  const normalized = m[0].replace(/,/g, "");
  const n = parseFloat(normalized);
  return Number.isFinite(n) ? n : null;
}

function formatOnlyPerMonthLine(annualPriceString: string, t: TFunction<"paywall">): string | null {
  const annualNum = extractLeadingPriceNumber(annualPriceString);
  if (annualNum == null) return null;
  const per = (annualNum / 12).toFixed(2);
  const symMatch = annualPriceString.match(/^[^\d\s,.]+/);
  const sym = symMatch?.[0]?.trim() || "$";
  return t("legacyIos.onlyPerMonth", { amount: `${sym}${per}` });
}

async function openExternalUrl(url: string) {
  if (Capacitor.isNativePlatform()) {
    await Browser.open({ url });
  } else {
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Native iOS subscription: RevenueCat paywall UI (newer iOS) or Monthly/Annual + StoreKit (compat).
 * Shown from native iOS onboarding (e.g. after email collection) and resubscribe; deep links may still open this route.
 */
const IOSPaywall = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const termsUrl = legalTermsUrl();
  const privacyUrl = legalPrivacyUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { restore, isRestoring, getProduct } = useAppleIAP();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPeriod>("weekly");
  /**
   * null = still resolving. true = direct StoreKit compat (must pick monthly vs annual in-app).
   * false = RevenueCat paywall UI (offering shows whatever packages you configured).
   */
  const [isCompatStoreKitPaywall, setIsCompatStoreKitPaywall] = useState<boolean | null>(null);

  const showPaywallScreen = isIosPaywallContext();
  const canCallNativePaywall = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

  const weeklyProduct = getProduct("weekly");
  const monthlyProduct = getProduct("monthly");
  const annualProduct = getProduct("annual");
  const weeklyPriceDisplay = weeklyProduct?.priceString || "—";
  const monthlyPriceDisplay = monthlyProduct?.priceString || "—";
  const annualPriceDisplay = annualProduct?.priceString || "—";
  const annualPerMonthLine =
    annualProduct?.priceString ? formatOnlyPerMonthLine(annualProduct.priceString, t) : null;

  useEffect(() => {
    let cancelled = false;
    if (!canCallNativePaywall) {
      setIsCompatStoreKitPaywall(false);
      return () => {
        cancelled = true;
      };
    }
    void (async () => {
      try {
        const useRcUi = await shouldUseRevenueCatPaywallUi();
        if (!cancelled) setIsCompatStoreKitPaywall(!useRcUi);
      } catch {
        if (!cancelled) setIsCompatStoreKitPaywall(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canCallNativePaywall]);

  useEffect(() => {
    debugLog({
      location: "IOSPaywall.tsx:mount",
      message: "IOSPaywall mounted (fallback route)",
      data: { pathname: location.pathname, showPaywallScreen, canCallNativePaywall },
      hypothesisId: "H1",
    });
  }, [location.pathname, showPaywallScreen, canCallNativePaywall]);

  // Resubscribe can mount before async account locale hydration — honor welcome/settings pick for this screen only.
  useLayoutEffect(() => {
    const stored = readStoredPreferredLocale();
    if (!stored) return;
    if (resolveAppLocale(i18n.resolvedLanguage || i18n.language) === stored) return;
    void setAppLocale(stored);
  }, []);

  useEffect(() => {
    const shellBg = WELCOME_LIGHT_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    html.style.colorScheme = "light";
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  const runPaywallFlow = useCallback(
    async (billingPeriod?: BillingPeriod) => {
      const platform = Capacitor.getPlatform();
      const isNative = Capacitor.isNativePlatform();
      debugLog({
        location: "IOSPaywall.tsx:runPaywallFlow:start",
        message: "Continue / Try again tapped",
        data: {
          pathname: location.pathname,
          canCallNativePaywall,
          showPaywallScreen,
          platform,
          isNative,
          hasAuthUserId: !!user?.id,
          billingPeriod: billingPeriod ?? null,
        },
        hypothesisId: "H-CTA",
      });
      if (!canCallNativePaywall) {
        debugLog({
          location: "IOSPaywall.tsx:runPaywallFlow:blocked",
          message: "Not native iOS — cannot open native paywall",
          data: {
            reason: "NOT_NATIVE_IOS",
            platform,
            isNative,
            explain: "Capacitor.isNativePlatform() && getPlatform()==='ios' was false",
          },
          hypothesisId: "H-CTA",
        });
        toast.error(t("paywall:legacyIos.errorNotIosApp"), { duration: 6000 });
        setFallbackDetail(t("paywall:legacyIos.errorNotIosApp"));
        setShowFallback(true);
        return;
      }

      setFallbackDetail(null);
      setPaywallOpening(true);

      try {
        let uid = user?.id ?? null;
        const fromAuth = !!user?.id;
        if (!uid) {
          const { data, error } = await supabase.auth.getUser();
          uid = data.user?.id ?? null;
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:userId",
            message: "Resolved user id via supabase.auth.getUser",
            data: {
              hadAuthContextUser: fromAuth,
              resolvedUserId: !!uid,
              getUserError: error?.message ?? null,
            },
            hypothesisId: "H-CTA",
          });
        } else {
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:userId",
            message: "Using user id from AuthContext",
            data: { hadAuthContextUser: true, resolvedUserId: true },
            hypothesisId: "H-CTA",
          });
        }

        if (!uid) {
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:blocked",
            message: "No Supabase user session — paywall cannot attribute purchase",
            data: {
              reason: "NO_USER_ID",
              explain: "user?.id and getUser() both missing; user may need to sign in again",
            },
            hypothesisId: "H-CTA",
          });
          toast.error(t("paywall:legacyIos.errorSignInAgain"), { duration: 8000 });
          setFallbackDetail(t("paywall:legacyIos.errorNoSession"));
          setShowFallback(true);
          return;
        }

        const periodForFlow =
          isCompatStoreKitPaywall === true ? (billingPeriod ?? selectedPlan) : billingPeriod;

        const outcome = await runIosPaywallFlowAfterSignup({
          userId: uid,
          navigate,
          bypassPresentationLock: true,
          billingPeriod: periodForFlow,
        });
        const lastErr = getLastPaywallError();

        if (outcome === "success") {
          debugLog({
            location: "IOSPaywall.tsx:runPaywallFlow:done",
            message: "Paywall flow success",
            data: { outcome },
            hypothesisId: "H-CTA",
          });
          return;
        }

        debugLog({
          location: "IOSPaywall.tsx:runPaywallFlow:done",
          message: "Paywall flow finished without success",
          data: {
            outcome,
            lastPaywallError: lastErr,
            hint:
              outcome === "present_failed"
                ? "Check RevenueCat key, offering id Production Offering, RC dashboard, or compat StoreKit path logs in revenueCat.ts"
                : outcome === "skipped"
                  ? "runIosPaywallFlow thought platform was not native iOS"
                  : outcome === "error"
                    ? "Exception before/during native paywall — see runIosPaywallFlow.ts:catch log"
                    : "See earlier revenueCat / runIosPaywall logs",
          },
          hypothesisId: "H-CTA",
        });

        if (outcome === "skipped") {
          toast.error(t("paywall:legacyIos.errorOpenFromSignup"), { duration: 6000 });
          setFallbackDetail(t("paywall:legacyIos.errorSkippedDetail"));
          setShowFallback(true);
          return;
        }
        setFallbackDetail(lastErr || t("paywall:legacyIos.errorGeneric"));
        setShowFallback(true);
      } catch (e) {
        debugLog({
          location: "IOSPaywall.tsx:runPaywallFlow:catch",
          message: "Unexpected error in IOSPaywall paywall handler",
          data: {
            err: String((e as Error)?.message ?? e),
            stack: (e as Error)?.stack?.slice(0, 500) ?? null,
          },
          hypothesisId: "H-CTA",
        });
        toast.error(t("paywall:legacyIos.errorPersist"), {
          duration: 8000,
        });
        setFallbackDetail(String((e as Error)?.message ?? e));
        setShowFallback(true);
      } finally {
        setPaywallOpening(false);
      }
    },
    [canCallNativePaywall, navigate, user?.id, showPaywallScreen, location.pathname, isCompatStoreKitPaywall, selectedPlan, t]
  );

  const handleContinue = () => {
    void runPaywallFlow(isCompatStoreKitPaywall === true ? selectedPlan : undefined);
  };

  const handleRestore = async () => {
    if (!canCallNativePaywall) {
      toast.error(t("paywall:legacyIos.restoreOnlyIos"));
      return;
    }
    const r = await restore();
    if (r.success) {
      toast.success(t("paywall:legacyIos.restoredSuccess"));
      setTimeout(() => navigate("/dashboard/boards"), 500);
    } else {
      const msg = r.error || t("paywall:legacyIos.nothingToRestore");
      if (msg.toLowerCase().includes("cancel")) {
        toast.message(t("paywall:legacyIos.restoreCancelled"));
      } else {
        toast.error(msg);
      }
    }
  };

  const continueDisabled =
    paywallOpening || (canCallNativePaywall && isCompatStoreKitPaywall === null);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-3 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-left">
        {canCallNativePaywall ? (
          <button
            type="button"
            onClick={() => void handleRestore()}
            disabled={isRestoring || paywallOpening}
            className="touch-manipulation text-left font-medium text-zinc-800 disabled:opacity-50"
          >
            {isRestoring ? t("paywall:legacyIos.restoring") : t("paywall:legacyIos.restorePurchases")}
          </button>
        ) : (
          <span className="text-zinc-400">{t("paywall:legacyIos.restore")}</span>
        )}
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => void openExternalUrl(termsUrl)}
        >
          {t("paywall:legacyIos.terms")}
        </button>
      </div>
      <div className="text-right">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => void openExternalUrl(privacyUrl)}
        >
          {t("paywall:legacyIos.privacy")}
        </button>
      </div>
    </div>
  );

  const planSection = (
    <div className="mt-8 flex w-full flex-col gap-3">
      <button
        type="button"
        onClick={() => setSelectedPlan("weekly")}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors touch-manipulation",
          selectedPlan === "weekly"
            ? "border-black bg-white"
            : "border-transparent bg-zinc-100 hover:bg-zinc-50"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              selectedPlan === "weekly" ? "border-black bg-black" : "border-zinc-300 bg-white"
            )}
            aria-hidden
          >
            {selectedPlan === "weekly" ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
          </span>
          <span className="font-semibold text-zinc-900">{t("paywall:legacyIos.weekly")}</span>
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-900">
          {t("paywall:legacyIos.perWeek", { price: weeklyPriceDisplay })}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelectedPlan("monthly")}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors touch-manipulation",
          selectedPlan === "monthly"
            ? "border-black bg-white"
            : "border-transparent bg-zinc-100 hover:bg-zinc-50"
        )}
      >
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
              selectedPlan === "monthly" ? "border-black bg-black" : "border-zinc-300 bg-white"
            )}
            aria-hidden
          >
            {selectedPlan === "monthly" ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
          </span>
          <span className="font-semibold text-zinc-900">{t("paywall:legacyIos.monthly")}</span>
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-900">
          {t("paywall:legacyIos.perMonth", { price: monthlyPriceDisplay })}
        </span>
      </button>

      <button
        type="button"
        onClick={() => setSelectedPlan("annual")}
        className={cn(
          "flex w-full items-center justify-between gap-3 rounded-2xl border-2 px-4 py-4 text-left transition-colors touch-manipulation",
          selectedPlan === "annual"
            ? "border-black bg-white"
            : "border-transparent bg-zinc-100 hover:bg-zinc-50"
        )}
      >
        <div className="flex min-w-0 flex-col gap-0.5">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full border-2",
                selectedPlan === "annual" ? "border-black bg-black" : "border-zinc-300 bg-white"
              )}
              aria-hidden
            >
              {selectedPlan === "annual" ? <Check className="size-3.5 text-white" strokeWidth={3} /> : null}
            </span>
            <span className="font-semibold text-zinc-900">{t("paywall:legacyIos.yearly")}</span>
          </div>
          {annualPerMonthLine ? (
            <p className="pl-9 text-xs text-zinc-500">{annualPerMonthLine}</p>
          ) : (
            <p className="pl-9 text-xs text-zinc-500">{t("paywall:legacyIos.bestAnnualValue")}</p>
          )}
        </div>
        <span className="shrink-0 text-sm font-medium text-zinc-900">
          {t("paywall:legacyIos.perYear", { price: annualPriceDisplay })}
        </span>
      </button>
    </div>
  );

  return (
    <div
      className="relative min-h-screen font-sans text-foreground antialiased"
      style={{ backgroundColor: WELCOME_LIGHT_BASE }}
    >
      <WelcomeCosmicBackground
        className="pointer-events-none fixed inset-0 z-0"
        tone="light"
      />
      <IosAppHeader signOutInsteadOfLogin={!!user} />

      <div
        className="relative z-10 mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{ minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))" }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 text-foreground shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label={t("paywall:legacyIos.closeAria")}
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg width="120" height="28" viewBox="0 0 120 28" fill="none" aria-hidden>
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#000000"
                strokeWidth="1"
                fill="none"
              />
              <circle cx="44" cy="12" r="6" stroke="#000000" strokeWidth="1" fill="none" />
              <path d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z" fill="#000000" opacity="0.35" />
              <circle cx="96" cy="10" r="1.2" fill="#000000" />
              <circle cx="104" cy="16" r="1" fill="#000000" />
              <circle cx="88" cy="18" r="0.8" fill="#000000" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              <span className="block">{t("paywall:legacyIos.titleLine1")}</span>
              <span className="mt-1 block" style={{ color: NATIVE_WELCOME_PINK }}>
                {t("paywall:legacyIos.titleLine2")}
              </span>
            </h1>
            <p className="mt-3 text-sm text-zinc-500">{t("paywall:legacyIos.subtitle")}</p>
          </div>

          {!showFallback ? (
            <>
              {canCallNativePaywall && isCompatStoreKitPaywall === null ? (
                <p className="mt-6 text-center text-sm text-zinc-500">{t("paywall:legacyIos.loadingOptions")}</p>
              ) : null}
              {planSection}
              <Button
                type="button"
                onClick={handleContinue}
                disabled={continueDisabled}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyIos.opening") : t("common:continue")}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">{t("paywall:legacyIos.fallbackTitle")}</h2>
                <p className="mt-1 text-sm text-zinc-600">{t("paywall:legacyIos.fallbackBody")}</p>
                {fallbackDetail ? (
                  <p className="mt-2 text-xs text-zinc-500 break-words" data-testid="paywall-error">
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              {planSection}
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyIos.opening") : t("paywall:legacyIos.tryAgain")}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>

      {import.meta.env.DEV && (
        <button
          type="button"
          className="pointer-events-none m-0 size-0 overflow-hidden border-0 bg-transparent p-0 opacity-0 select-none text-white"
          tabIndex={-1}
          aria-hidden="true"
          disabled
          onClick={async () => {
            try {
              if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(getDebugLog() || "(no log yet)");
                toast.success("Debug log copied.");
              }
            } catch {
              /* noop */
            }
          }}
        >
          Copy debug log
        </button>
      )}
    </div>
  );
};

export default IOSPaywall;

```

---

## src/pages/onboarding/AndroidPaywall.tsx

```tsx
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Capacitor } from "@capacitor/core";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { X } from "lucide-react";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { IosAppHeader } from "@/components/IosAppHeader";
import { legalTermsUrl, legalPrivacyUrl } from "@/lib/locale";

/**
 * Native Android subscription paywall. Uses RevenueCat paywall UI to present
 * Google Play subscriptions. Completely separate from the iOS paywall.
 */
const AndroidPaywall = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const termsUrl = legalTermsUrl();
  const privacyUrl = legalPrivacyUrl();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [showFallback, setShowFallback] = useState(false);
  const [fallbackDetail, setFallbackDetail] = useState<string | null>(null);
  const [paywallOpening, setPaywallOpening] = useState(false);

  const isNativeAndroid = isAndroidPaywallContext();

  useEffect(() => {
    debugLog({
      location: "AndroidPaywall.tsx:mount",
      message: "AndroidPaywall mounted",
      data: {
        pathname: location.pathname,
        isNativeAndroid,
      },
      hypothesisId: "ANDROID-PAY",
    });
  }, [location.pathname, isNativeAndroid]);

  const runPaywallFlow = useCallback(async () => {
    if (!isNativeAndroid) {
      toast.error(t("paywall:legacyAndroid.errorNotAndroidApp"), {
        duration: 6000,
      });
      setFallbackDetail(t("paywall:legacyAndroid.errorNotAndroidApp"));
      setShowFallback(true);
      return;
    }

    setFallbackDetail(null);
    setPaywallOpening(true);

    try {
      let uid = user?.id ?? null;
      if (!uid) {
        const { data, error } = await supabase.auth.getUser();
        uid = data.user?.id ?? null;
        if (error || !uid) {
          toast.error(t("paywall:legacyAndroid.errorSignInAgain"), {
            duration: 8000,
          });
          setFallbackDetail(t("paywall:legacyAndroid.errorNoSession"));
          setShowFallback(true);
          return;
        }
      }

      const outcome = await runAndroidPaywallFlowAfterSignup({
        userId: uid,
        navigate,
        bypassPresentationLock: true,
      });
      const lastErr = getLastPaywallError();

      if (outcome === "success") return;

      if (outcome === "skipped") {
        toast.error(t("paywall:legacyAndroid.errorOpenFromSignup"), {
          duration: 6000,
        });
        setFallbackDetail(t("paywall:legacyAndroid.errorSkippedDetail"));
        setShowFallback(true);
        return;
      }
      setFallbackDetail(lastErr || t("paywall:legacyAndroid.errorGeneric"));
      setShowFallback(true);
    } catch (e) {
      debugLog({
        location: "AndroidPaywall.tsx:runPaywallFlow:catch",
        message: "Unexpected error in AndroidPaywall paywall handler",
        data: {
          err: String((e as Error)?.message ?? e),
          stack: (e as Error)?.stack?.slice(0, 500) ?? null,
        },
        hypothesisId: "ANDROID-PAY",
      });
      toast.error(t("paywall:legacyAndroid.errorGeneric"), { duration: 8000 });
      setFallbackDetail(String((e as Error)?.message ?? e));
      setShowFallback(true);
    } finally {
      setPaywallOpening(false);
    }
  }, [isNativeAndroid, navigate, user?.id, t]);

  const handleContinue = () => {
    void runPaywallFlow();
  };

  useEffect(() => {
    if (!isNativeAndroid) {
      navigate("/onboarding/welcome", { replace: true });
    }
  }, [isNativeAndroid, navigate]);

  const paywallFooter = (
    <div className="mt-8 grid grid-cols-2 items-start gap-x-1 gap-y-2 border-t border-zinc-100 pt-6 text-[11px] text-zinc-600 sm:text-xs">
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(termsUrl, "_blank", "noopener,noreferrer")}
        >
          {t("paywall:legacyAndroid.terms")}
        </button>
      </div>
      <div className="text-center">
        <button
          type="button"
          className="touch-manipulation underline decoration-zinc-400 underline-offset-2"
          onClick={() => window.open(privacyUrl, "_blank", "noopener,noreferrer")}
        >
          {t("paywall:legacyAndroid.privacy")}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-zinc-100 text-foreground">
      <IosAppHeader signOutInsteadOfLogin={!!user} />

      <div
        className="mx-auto flex max-w-lg flex-col px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4"
        style={{
          minHeight: "calc(100vh - 64px - env(safe-area-inset-top, 0px))",
        }}
      >
        <div className="relative flex-1 rounded-3xl bg-white px-5 pb-8 pt-4 shadow-sm">
          <button
            type="button"
            onClick={() => navigate("/onboarding/welcome", { replace: true })}
            className="absolute right-3 top-3 flex size-9 items-center justify-center rounded-full text-zinc-500 transition-colors hover:bg-zinc-100 hover:text-zinc-800 touch-manipulation"
            aria-label={t("paywall:legacyAndroid.closeAria")}
          >
            <X className="size-5" strokeWidth={2} />
          </button>

          <div className="pointer-events-none flex justify-center pt-2 opacity-[0.18]">
            <svg
              width="120"
              height="28"
              viewBox="0 0 120 28"
              fill="none"
              aria-hidden
            >
              <path
                d="M12 8 L14 14 L20 14 L15 18 L17 24 L12 20 L7 24 L9 18 L4 14 L10 14 Z"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <circle
                cx="44"
                cy="12"
                r="6"
                stroke="#B8860B"
                strokeWidth="1"
                fill="none"
              />
              <path
                d="M72 6 L74 10 L78 10 L75 13 L76 17 L72 15 L68 17 L69 13 L66 10 L70 10 Z"
                fill="#B8860B"
                opacity="0.35"
              />
              <circle cx="96" cy="10" r="1.2" fill="#B8860B" />
              <circle cx="104" cy="16" r="1" fill="#B8860B" />
              <circle cx="88" cy="18" r="0.8" fill="#B8860B" />
            </svg>
          </div>

          <div className="px-1 pt-2 text-center">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              {t("paywall:legacyAndroid.title")}
            </h1>
            <p className="mt-3 text-xs text-zinc-500">{t("paywall:legacyAndroid.subtitle")}</p>
          </div>

          {!showFallback ? (
            <>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyAndroid.opening") : t("common:continue")}
              </Button>
              {paywallFooter}
            </>
          ) : (
            <>
              <div className="mt-6 rounded-2xl bg-amber-50 px-4 py-3 text-left">
                <h2 className="text-base font-semibold text-zinc-900">
                  {t("paywall:legacyAndroid.fallbackTitle")}
                </h2>
                <p className="mt-1 text-sm text-zinc-600">{t("paywall:legacyAndroid.fallbackBody")}</p>
                {fallbackDetail ? (
                  <p
                    className="mt-2 text-xs text-zinc-500 break-words"
                    data-testid="paywall-error"
                  >
                    {fallbackDetail}
                  </p>
                ) : null}
              </div>
              <Button
                type="button"
                onClick={handleContinue}
                disabled={paywallOpening}
                className="mt-8 h-12 w-full touch-manipulation rounded-full bg-black text-base font-semibold text-white hover:bg-black/90 disabled:opacity-50"
              >
                {paywallOpening ? t("paywall:legacyAndroid.opening") : t("paywall:legacyAndroid.tryAgain")}
              </Button>
              {paywallFooter}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AndroidPaywall;

```

---

## src/pages/onboarding/PostPaywallLoading.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";

import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import {
  clearIapPostPurchaseEntitlementLatch,
  getIapPostPurchaseLatchUserId,
  markIapSubscriptionConfirmed,
  retryIosPostPurchaseEntitlementSyncInBackground,
  runIapPostPurchaseGateIfNeeded,
} from "@/lib/iosPostPurchaseEntitlementGate";
import { getLastPaywallError, syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";
import { supabase } from "@/integrations/supabase/client";
import { debugLog } from "@/debugLog";
import { readSetupDraft } from "@/lib/setupDraft";
import { readStoredPreferredLocale, resolveAppLocale } from "@/lib/locale";
import i18n from "@/i18n";
import { toast } from "sonner";

/** Visual ring only — not tied to backend provisioning milestones. */
const VISUAL_PROGRESS_CAP = 97;
const VISUAL_PROGRESS_INTERVAL_MS = 110;

/** Subtitle step thresholds from backend provisionPostPaywallIfNeeded onProgress (0–100). */
const SUBTITLE_STEP_AT = [18, 38, 52, 85, 100] as const;

const SIMS_LINE_COUNT = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function postPaywallLocaleSnapshot() {
  return {
    resolvedLanguage: i18n.resolvedLanguage ?? null,
    language: i18n.language ?? null,
    mountedLocale: resolveAppLocale(i18n.resolvedLanguage || i18n.language),
    draftLocale: readSetupDraft().locale ?? null,
    storedPreferredLocale: readStoredPreferredLocale(),
  };
}

function logPostPaywall(step: string, extra?: Record<string, unknown>) {
  console.info("[post-paywall]", step, { ...postPaywallLocaleSnapshot(), ...extra });
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(24,24,27,0.12)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(24,24,27,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-zinc-900">{pct}%</div>
      </div>
    </div>
  );
}

function getActiveStepIndexFromBackendPct(
  backendPct: number,
  phase: "provisioning" | "finishing",
): number {
  if (phase === "finishing") return SIMS_LINE_COUNT - 1;
  for (let i = 0; i < SUBTITLE_STEP_AT.length; i += 1) {
    if (backendPct < SUBTITLE_STEP_AT[i]) return i;
  }
  return SIMS_LINE_COUNT - 1;
}

function CommitmentBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-3 border-b border-zinc-200 pb-4">
      <p className={cn("text-xs font-medium uppercase tracking-wide", SETUP_MUTED_TEXT_CLASS)}>
        {label}
      </p>
      <p className="text-[0.9375rem] leading-[1.65] text-zinc-800 text-pretty">{text}</p>
    </div>
  );
}

export default function PostPaywallLoading() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [progress, setProgress] = useState(8);
  const [backendProvisionPct, setBackendProvisionPct] = useState(0);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");

  const activeStepIndex = getActiveStepIndexFromBackendPct(backendProvisionPct, phase);
  const simsLinesRaw = t("postPaywall.simsLines", { returnObjects: true });
  const simsLines = Array.isArray(simsLinesRaw) ? simsLinesRaw : [];

  const subtitle = useMemo(() => {
    if (phase === "finishing") return t("postPaywall.finishingSubtitle");
    return simsLines[activeStepIndex] ?? simsLines[simsLines.length - 1] ?? "";
  }, [activeStepIndex, phase, simsLines, t]);

  useEffect(() => {
    logPostPaywall("screen mounted");
  }, []);

  useEffect(() => {
    const shellBg = WELCOME_LIGHT_BASE;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  useEffect(() => {
    let alive = true;
    let tickId: number | null = null;

    logPostPaywall("provisioning effect started");

    const startVisualProgress = () => {
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        setProgress((current) => {
          if (current >= VISUAL_PROGRESS_CAP) return VISUAL_PROGRESS_CAP;
          const distance = VISUAL_PROGRESS_CAP - current;
          const increment = Math.max(0.25, distance * 0.035);
          return Math.min(VISUAL_PROGRESS_CAP, current + increment);
        });
      }, VISUAL_PROGRESS_INTERVAL_MS);
    };

    (async () => {
      startVisualProgress();
      try {
        logPostPaywall("entitlement gate start");
        const gate = await runIapPostPurchaseGateIfNeeded();
        logPostPaywall("entitlement gate end", { gate });
        if (!alive) {
          logPostPaywall("aborted after gate (alive=false)");
          return;
        }

        if (gate === "delayed") {
          console.warn("[post-paywall] entitlement verification delayed after purchase");
          markIapSubscriptionConfirmed(getIapPostPurchaseLatchUserId());
          retryIosPostPurchaseEntitlementSyncInBackground();
        } else if (gate === "failed") {
          if (tickId != null) window.clearInterval(tickId);
          debugLog({
            location: "PostPaywallLoading.tsx",
            message: "Native IAP entitlement sync failed on loading screen",
            data: { lastPaywallError: getLastPaywallError() },
            hypothesisId: "H5",
          });
          toast.error(i18n.t("postPaywall.toastActivateFailedIos", { ns: "paywall" }));
          clearIapPostPurchaseEntitlementLatch();
          const failRoute = Capacitor.isNativePlatform()
            ? "/onboarding/ios-paywall"
            : "/onboarding/web-paywall";
          logPostPaywall("navigate fail route", { failRoute });
          window.setTimeout(() => navigateRef.current(failRoute, { replace: true }), 450);
          return;
        }

        if (Capacitor.getPlatform() === "android") {
          const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
          if (!alive) {
            logPostPaywall("aborted after android sync (alive=false)");
            return;
          }
          if (!ok) {
            if (tickId != null) window.clearInterval(tickId);
            toast.error(i18n.t("postPaywall.toastActivateFailedAndroid", { ns: "paywall" }));
            logPostPaywall("navigate android paywall (sync failed)");
            window.setTimeout(() => navigateRef.current("/onboarding/android-paywall", { replace: true }), 450);
            return;
          }
        }

        logPostPaywall("provisioning start");
        const provisionResult = await provisionPostPaywallIfNeeded({
          quiet: true,
          onProgress: (provisionPct) => {
            if (!alive) return;
            setBackendProvisionPct(provisionPct);
            logPostPaywall("provisioning milestone", { provisionPct });
          },
        });
        logPostPaywall("provisioning end", { provisionResult });
        if (!alive) {
          logPostPaywall("aborted after provisioning (alive=false)");
          return;
        }

        markIapSubscriptionConfirmed(getIapPostPurchaseLatchUserId());

        setPhase("finishing");
        if (tickId != null) window.clearInterval(tickId);
        setProgress(100);
        clearIapPostPurchaseEntitlementLatch();

        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
          try {
            const { data: reviewFlag } = await supabase
              .from("feature_flags")
              .select("is_enabled")
              .eq("feature_name", "review_prompt")
              .maybeSingle();
            if (reviewFlag?.is_enabled) {
              sessionStorage.setItem("pending_review_prompt_after_post_paywall", "true");
              console.info("[review_prompt] post-paywall marker set for dashboard");
            }
          } catch {
            /* review prompt must never block dashboard */
          }
        }

        logPostPaywall("navigate dashboard");
        window.setTimeout(() => navigateRef.current("/workspace?tab=create", { replace: true }), 250);
      } catch (e) {
        console.error("[post-paywall] provisioning failed:", e);
        logPostPaywall("provisioning error", { error: String((e as Error)?.message ?? e) });
        if (!alive) return;
        markIapSubscriptionConfirmed(getIapPostPurchaseLatchUserId());
        clearIapPostPurchaseEntitlementLatch();
        logPostPaywall("navigate dashboard after error");
        window.setTimeout(() => navigateRef.current("/workspace?tab=create", { replace: true }), 650);
      }
    })();

    return () => {
      logPostPaywall("provisioning effect cleanup");
      alive = false;
      if (tickId != null) window.clearInterval(tickId);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans text-zinc-900 antialiased">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title={t("postPaywall.title")} subtitle={subtitle} />

          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <CommitmentBlock
              label={t("postPaywall.commitmentLabel")}
              text={t("postPaywall.commitmentText")}
            />

            <div className="flex items-center gap-4">
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-zinc-800">{t("postPaywall.buildingDashboard")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```

---

## src/pages/onboarding/AndroidPostPaywallLoading.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import {
  clearAndroidPostPurchaseEntitlementLatch,
  getAndroidPostPurchaseLatchUserId,
  markAndroidSubscriptionConfirmed,
  retryAndroidPostPurchaseEntitlementSyncInBackground,
  runAndroidPostPurchaseGateIfNeeded,
} from "@/lib/androidPostPurchaseEntitlementGate";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { readSetupDraft } from "@/lib/setupDraft";
import { readStoredPreferredLocale, resolveAppLocale } from "@/lib/locale";
import i18n from "@/i18n";
/** Visual ring only — not tied to backend provisioning milestones. */
const VISUAL_PROGRESS_CAP = 97;
const VISUAL_PROGRESS_INTERVAL_MS = 110;

/** Subtitle step thresholds from backend provisionPostPaywallIfNeeded onProgress (0–100). */
const SUBTITLE_STEP_AT = [18, 38, 52, 85, 100] as const;

const SIMS_LINE_COUNT = 5;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function androidPostPaywallLocaleSnapshot() {
  return {
    resolvedLanguage: i18n.resolvedLanguage ?? null,
    language: i18n.language ?? null,
    mountedLocale: resolveAppLocale(i18n.resolvedLanguage || i18n.language),
    draftLocale: readSetupDraft().locale ?? null,
    storedPreferredLocale: readStoredPreferredLocale(),
  };
}

function logAndroidPostPaywall(step: string, extra?: Record<string, unknown>) {
  console.info("[android-post-paywall]", step, { ...androidPostPaywallLocaleSnapshot(), ...extra });
}

function getActiveStepIndexFromBackendPct(
  backendPct: number,
  phase: "provisioning" | "finishing",
): number {
  if (phase === "finishing") return SIMS_LINE_COUNT - 1;
  for (let i = 0; i < SUBTITLE_STEP_AT.length; i += 1) {
    if (backendPct < SUBTITLE_STEP_AT[i]) return i;
  }
  return SIMS_LINE_COUNT - 1;
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(24,24,27,0.12)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(24,24,27,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-zinc-900">{pct}%</div>
      </div>
    </div>
  );
}

function CommitmentBlock({ label, text }: { label: string; text: string }) {
  return (
    <div className="space-y-3 border-b border-zinc-200 pb-4">
      <p className={cn("text-xs font-medium uppercase tracking-wide", SETUP_MUTED_TEXT_CLASS)}>
        {label}
      </p>
      <p className="text-[0.9375rem] leading-[1.65] text-zinc-800 text-pretty">{text}</p>
    </div>
  );
}

/**
 * Android-only post-paywall loading screen. Waits for entitlement sync, then full
 * provisioning before dashboard. Visible progress is a smooth timer; backend milestones
 * drive subtitle copy only.
 *
 * Entitlement sync failure is treated as delayed verification (no paywall bounce).
 */
export default function AndroidPostPaywallLoading() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const [progress, setProgress] = useState(8);
  const [backendProvisionPct, setBackendProvisionPct] = useState(0);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");

  const activeStepIndex = getActiveStepIndexFromBackendPct(backendProvisionPct, phase);

  const simsLines = t("postPaywall.simsLines", { returnObjects: true }) as string[];

  const subtitle = useMemo(() => {
    if (phase === "finishing") return t("postPaywall.finishingSubtitle");
    return simsLines[activeStepIndex] ?? simsLines[simsLines.length - 1] ?? "";
  }, [activeStepIndex, phase, simsLines, t]);

  useEffect(() => {
    const shellBg = WELCOME_LIGHT_BASE;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  useEffect(() => {
    logAndroidPostPaywall("screen mounted");
  }, []);

  useEffect(() => {
    let alive = true;
    let tickId: number | null = null;
    const mountTs = performance.now();

    logAndroidPostPaywall("provisioning effect started");

    const startVisualProgress = () => {
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        setProgress((current) => {
          if (current >= VISUAL_PROGRESS_CAP) return VISUAL_PROGRESS_CAP;
          const distance = VISUAL_PROGRESS_CAP - current;
          const increment = Math.max(0.25, distance * 0.035);
          return Math.min(VISUAL_PROGRESS_CAP, current + increment);
        });
      }, VISUAL_PROGRESS_INTERVAL_MS);
    };

    (async () => {
      startVisualProgress();
      try {
        logAndroidPostPaywall("entitlement gate start");
        const gate = await runAndroidPostPurchaseGateIfNeeded();
        logAndroidPostPaywall("entitlement gate end", { gate });
        if (!alive) {
          logAndroidPostPaywall("aborted after gate (alive=false)");
          return;
        }

        if (gate.status === "delayed") {
          console.warn(
            "[android-post-paywall] entitlement verification delayed after purchase",
            gate
          );
          retryAndroidPostPurchaseEntitlementSyncInBackground();
        }

        logAndroidPostPaywall("provisioning start");
        const provisionResult = await provisionPostPaywallIfNeeded({
          quiet: true,
          onProgress: (provisionPct) => {
            if (!alive) return;
            setBackendProvisionPct(provisionPct);
            logAndroidPostPaywall("provisioning milestone", { provisionPct });
          },
        });
        logAndroidPostPaywall("provisioning end", { provisionResult });

        if (!alive) {
          logAndroidPostPaywall("aborted after provisioning (alive=false)");
          return;
        }

        const totalMs = Math.round(performance.now() - mountTs);
        const userId = getAndroidPostPurchaseLatchUserId();
        markAndroidSubscriptionConfirmed(userId);
        clearAndroidPostPurchaseEntitlementLatch();

        setPhase("finishing");
        if (tickId != null) window.clearInterval(tickId);
        setProgress(100);

        debugLog({
          location: "AndroidPostPaywallLoading.tsx:exit",
          message: "Android post-paywall navigating to dashboard",
          data: { gate, totalMs, lastPaywallError: getLastPaywallError() },
          hypothesisId: "ANDROID-GATE",
        });
        logAndroidPostPaywall("navigate dashboard", { gate, totalMs });

        window.setTimeout(() => navigateRef.current("/workspace?tab=create", { replace: true }), 250);
      } catch (e) {
        console.error("[android-post-paywall] provisioning failed:", e);
        logAndroidPostPaywall("provisioning error", { error: String((e as Error)?.message ?? e) });
        if (!alive) return;
        clearAndroidPostPurchaseEntitlementLatch();
        logAndroidPostPaywall("navigate dashboard after error");
        window.setTimeout(() => navigateRef.current("/workspace?tab=create", { replace: true }), 650);
      }
    })();

    return () => {
      logAndroidPostPaywall("provisioning effect cleanup");
      alive = false;
      if (tickId != null) window.clearInterval(tickId);
    };
  }, []);

  return (
    <div className="relative min-h-screen overflow-hidden bg-white font-sans text-zinc-900 antialiased">
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title={t("postPaywall.title")} subtitle={subtitle} />

          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
            <CommitmentBlock
              label={t("postPaywall.commitmentLabel")}
              text={t("postPaywall.commitmentText")}
            />

            <div className="flex items-center gap-4">
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-zinc-800">{t("postPaywall.buildingDashboard")}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

```

---

## src/pages/onboarding/EmailCollection.tsx

```tsx
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import type { BillingPeriod } from "@/lib/appleIAP";
import { ONBOARDING_ROUTES } from "@/lib/onboardingFlow";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { runWebPaywallFlowAfterSignup } from "@/lib/runWebPaywallFlow";

const EmailCollection = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [username, setUsername] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [appNotificationsConsent, setAppNotificationsConsent] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(false);
  const [smsMarketingConsent, setSmsMarketingConsent] = useState(false);
  
  // Validation states
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  /** Native iOS (RevenueCat UI path): paywall failed after signup — Try again on this screen. */
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);

  // Refs for debouncing
  const emailCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const usernameCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Clear localStorage on mount to ensure fresh start
  useEffect(() => {
    localStorage.removeItem('onboarding_answers');
    localStorage.removeItem('selectedCharacter');
    localStorage.removeItem('selected_plan');
    localStorage.removeItem('onboarding_data');
  }, []);

  // Real-time email validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (emailCheckTimeoutRef.current) {
      clearTimeout(emailCheckTimeoutRef.current);
    }

    // Reset error if email is empty or invalid format
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }

    // Set checking state
    setIsCheckingEmail(true);
    setEmailError(null);

    // Debounce check by 500ms
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase
          .rpc('check_email_exists', { check_email: email.trim() });

        if (checkError) {
          console.error("Error checking email:", checkError);
          setEmailError(null); // Don't show error on check failure
        } else if (emailExists) {
          setEmailError(t("paywall:emailCollection.emailTaken"));
        } else {
          setEmailError(null);
        }
      } catch (e) {
        console.error("Error checking email:", e);
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);

    return () => {
      if (emailCheckTimeoutRef.current) {
        clearTimeout(emailCheckTimeoutRef.current);
      }
    };
  }, [email, t]);

  // Real-time username validation (debounced)
  useEffect(() => {
    // Clear previous timeout
    if (usernameCheckTimeoutRef.current) {
      clearTimeout(usernameCheckTimeoutRef.current);
    }

    // Reset error if username is empty
    if (!username.trim()) {
      setUsernameError(null);
      setIsCheckingUsername(false);
      return;
    }

    // Set checking state
    setIsCheckingUsername(true);
    setUsernameError(null);

    // Debounce check by 500ms
    usernameCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: usernameExists, error: checkError } = await supabase
          .rpc('check_username_exists', { check_username: username.trim() });

        if (checkError) {
          console.error("Error checking username:", checkError);
          setUsernameError(null); // Don't show error on check failure
        } else if (usernameExists) {
          setUsernameError(t("paywall:emailCollection.usernameTaken"));
        } else {
          setUsernameError(null);
        }
      } catch (e) {
        console.error("Error checking username:", e);
        setUsernameError(null);
      } finally {
        setIsCheckingUsername(false);
      }
    }, 500);

    return () => {
      if (usernameCheckTimeoutRef.current) {
        clearTimeout(usernameCheckTimeoutRef.current);
      }
    };
  }, [username, t]);

  // Password validation
  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError(t("paywall:emailCollection.passwordMinLength"));
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setPasswordError(t("paywall:emailCollection.passwordMismatch"));
      return;
    }
    setPasswordError(null);
  }, [password, confirmPassword, t]);

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const uid = userData.user?.id ?? null;

      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") { setPaywallNeedsRetry(false); return; }
        setPaywallNeedsRetry(true);
        return;
      }

      const outcome = await runIosPaywallFlowAfterSignup({
        userId: uid,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!email || !email.includes("@")) {
      toast.error(t("paywall:emailCollection.invalidEmail"));
      return;
    }

    if (!username.trim()) {
      toast.error(t("paywall:emailCollection.needUsername"));
      return;
    }

    if (!password || password.length < 8) {
      toast.error(t("paywall:emailCollection.needPassword"));
      return;
    }

    if (password !== confirmPassword) {
      toast.error(t("paywall:emailCollection.passwordMismatchToast"));
      return;
    }

    if (!firstName.trim()) {
      toast.error(t("paywall:emailCollection.needFirstName"));
      return;
    }

    if (!acceptedTerms) {
      toast.error(t("paywall:emailCollection.acceptTerms"));
      return;
    }

    // Check for errors from real-time validation
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) {
        navigate("/login");
      }
      return;
    }

    if (usernameError) {
      toast.error(usernameError);
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            first_name: firstName.trim(),
            username: username.trim(),
          },
        },
      });

      if (signUpError) {
        throw signUpError;
      }

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (signInError) {
          throw new Error(t("paywall:emailCollection.verifyEmailBlocked"));
        }
      }

      const uid = signUpData.user?.id ?? null;

      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";
      if (isNativeIos) {
        // Save session data in background — don't block the paywall
        ensureSession().then(() => updateSession({
          email: email.trim(),
          first_name: firstName.trim(),
          username: username.trim() || null,
          app_notifications_consent: appNotificationsConsent,
          email_consent: emailMarketingConsent,
          sms_consent: smsMarketingConsent,
        })).catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        // Older iOS: dedicated paywall screen (Monthly / Annual + StoreKit). Same route as resubscribe.
        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      // Non-iOS: save session data before navigating
      await ensureSession();
      await updateSession({
        email: email.trim(),
        first_name: firstName.trim(),
        username: username.trim() || null,
        app_notifications_consent: appNotificationsConsent,
        email_consent: emailMarketingConsent,
        sms_consent: smsMarketingConsent,
      });

      if (isAndroidPaywallContext()) {
        ensureSession()
          .then(() => updateSession({
            email: email.trim(),
            first_name: firstName.trim(),
            username: username.trim() || null,
            app_notifications_consent: appNotificationsConsent,
            email_consent: emailMarketingConsent,
            sms_consent: smsMarketingConsent,
          }))
          .catch(() => {});

        setPaywallNeedsRetry(false);
        const outcome = await runAndroidPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          setPaywallNeedsRetry(true);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android") {
        setPaywallNeedsRetry(true);
        return;
      }
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      const outcome = await runWebPaywallFlowAfterSignup({ userId: uid, navigate });
      if (outcome === "skipped") {
        toast.error(t("paywall:emailCollection.subscriptionError"));
      }
    } catch (e: unknown) {
      console.error("Error saving email:", e);
      const message = e instanceof Error ? e.message : t("paywall:emailCollection.saveFailed");
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formReady =
    email &&
    email.includes("@") &&
    password &&
    confirmPassword &&
    password.length >= 8 &&
    password === confirmPassword &&
    acceptedTerms &&
    firstName.trim() &&
    username.trim() &&
    !isSubmitting &&
    !emailError &&
    !passwordError &&
    !usernameError &&
    !isCheckingEmail &&
    !isCheckingUsername;

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry ? !isRetryingPaywall : formReady;
  const footerContinueText = paywallNeedsRetry
    ? t("paywall:emailCollection.tryAgain")
    : t("common:continue");

  return (
    <OnboardingLayout
      currentPage={7}
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
    >
      <div className="flex-1 flex flex-col items-center justify-center max-w-md mx-auto text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            {t("paywall:emailCollection.title")}
          </h1>
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-left">
              {t("paywall:emailCollection.emailLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder={t("paywall:emailCollection.emailPlaceholder")}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`h-12 rounded-xl ${emailError ? "border-destructive" : ""}`}
              autoComplete="email"
              autoFocus
            />
            {isCheckingEmail && (
              <p className="text-xs text-muted-foreground">{t("paywall:emailCollection.checkingEmail")}</p>
            )}
            {emailError && (
              <p className="text-xs text-destructive">{emailError}</p>
            )}
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="firstName" className="text-left">
                {t("paywall:emailCollection.firstNameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="firstName"
                type="text"
                placeholder={t("paywall:emailCollection.firstNamePlaceholder")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="h-10 rounded-xl"
                autoComplete="given-name"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="username" className="text-left">
                {t("paywall:emailCollection.usernameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="username"
                type="text"
                placeholder={t("paywall:emailCollection.usernamePlaceholder")}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`h-10 rounded-xl ${usernameError ? "border-destructive" : ""}`}
                autoComplete="username"
              />
              {isCheckingUsername && (
                <p className="text-xs text-muted-foreground">{t("paywall:emailCollection.checkingUsername")}</p>
              )}
              {usernameError && (
                <p className="text-xs text-destructive">{usernameError}</p>
              )}
            </div>
          </div>

          <div className="flex gap-3">
            <div className="space-y-2 flex-1">
              <Label htmlFor="password" className="text-left">
                {t("paywall:emailCollection.passwordLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="password"
                type="password"
                placeholder={t("paywall:emailCollection.passwordPlaceholder")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
            <div className="space-y-2 flex-1">
              <Label htmlFor="confirmPassword" className="text-left">
                {t("paywall:emailCollection.confirmLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder={t("paywall:emailCollection.confirmPlaceholder")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`h-10 rounded-xl ${passwordError ? "border-destructive" : ""}`}
                autoComplete="new-password"
              />
            </div>
          </div>
          {passwordError && (
            <p className="text-xs text-destructive">{passwordError}</p>
          )}

          <div className="space-y-2.5 pt-2">
            <div className="flex items-start gap-2.5">
              <Checkbox
                id="terms"
                checked={acceptedTerms}
                onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="terms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.termsAcceptPrefix")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/terms")}
                  className="text-foreground font-medium hover:underline"
                >
                  {t("paywall:emailCollection.termsOfService")}
                </button>
                {" "}{t("paywall:emailCollection.termsAnd")}{" "}
                <button
                  type="button"
                  onClick={() => navigate("/privacy")}
                  className="text-foreground font-medium hover:underline"
                >
                  {t("paywall:emailCollection.privacyPolicy")}
                </button>
                .
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="app-notifications"
                checked={appNotificationsConsent}
                onCheckedChange={(checked) => setAppNotificationsConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="app-notifications"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.appNotificationsConsent")}
              </Label>
            </div>

            <div className="flex items-start gap-2.5">
              <Checkbox
                id="email"
                checked={emailMarketingConsent}
                onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="email"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.emailMarketingConsent")}
              </Label>
            </div>

            <div className="flex items-start gap-2.5 hidden">
              <Checkbox
                id="sms"
                checked={smsMarketingConsent}
                onCheckedChange={(checked) => setSmsMarketingConsent(checked === true)}
                className="mt-0.5"
              />
              <Label
                htmlFor="sms"
                className="text-xs text-muted-foreground leading-tight cursor-pointer"
              >
                {t("paywall:emailCollection.smsMarketingConsent")}
              </Label>
            </div>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
};

export default EmailCollection;

```

---

## src/components/onboarding/OnboardingLayout.tsx

```tsx
import { ReactNode, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useLocation, useNavigate } from "react-router-dom";
import { useIsStandaloneMobile } from "@/hooks/use-standalone-mobile";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { ONBOARDING_ROUTES, ONBOARDING_STEP_COUNT } from "@/lib/onboardingFlow";
import { useTranslation } from "react-i18next";
import {
  MOBILE_SETUP_FOOTER_STYLE,
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
  /** Route-specific override for funnels that do not use the shared onboarding step count. */
  progressFillPctOverride?: number;
  /** Hide the progress bar for pages that should use the same shell without progress. */
  hideProgress?: boolean;
  /** Reserves the same top content spacing as an overridden progress bar without rendering the bar. */
  reserveProgressSpace?: boolean;
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
  progressFillPctOverride,
  hideProgress = false,
  reserveProgressSpace = false,
  nativeFormPage = false,
}: OnboardingLayoutProps) => {
  const { t } = useTranslation("common");
  const resolvedContinueText = continueText === "Continue" ? t("continue") : continueText;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isStandaloneMobile = useIsStandaloneMobile();
  const isNative = useIsNativeApp();
  const nativeFormScrollLayout = isNative && nativeFormPage;
  const isWelcome =
    welcomePage || Boolean(welcomeSoloContinueButtonClassName) || stackedNativeButtons;
  const isCosmicShell = false;
  const isWelcomeMobileWeb = !isNative && isWelcome;
  const isSetupCosmicMobileWeb = !isNative && setupCosmicPage;
  const setupMobileWebScrollLayout = isSetupCosmicMobileWeb && nativeFormPage;

  useEffect(() => {
    document.title = "Onboarding | Palette Plotting";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[name="twitter:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
  }, [pathname]);

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
    hideProgress
      ? null
      : typeof progressFillPctOverride === "number"
      ? Math.max(0, Math.min(100, progressFillPctOverride))
      : !isWelcome && currentPage <= ONBOARDING_STEP_COUNT
      ? (currentPage / ONBOARDING_STEP_COUNT) * 100
      : null;
  const hasProgressSpacing = typeof progressFillPctOverride === "number" || reserveProgressSpace;
  const nativeWelcomeSideBySide = isNative && stackedNativeButtons && !welcomeSignInAsTextLink;

  useEffect(() => {
    const shellBg = WELCOME_LIGHT_BASE;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

    return () => {
      html.style.removeProperty("background");
      html.style.removeProperty("background-color");
      body.style.removeProperty("background");
      body.style.removeProperty("background-color");
      root?.style.removeProperty("background");
      root?.style.removeProperty("background-color");
    };
  }, []);

  return (
    <div
      className={cn(
        "relative overflow-x-hidden bg-white text-zinc-900 antialiased",
        nativeFormScrollLayout || (isNative && isCosmicShell)
          ? "h-[100dvh] max-h-[100dvh]"
          : isSetupCosmicMobileWeb
            ? "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen"
            : "min-h-screen",
        isWelcomeMobileWeb && "max-md:min-h-[100dvh]",
      )}
    >
      {progressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4",
            typeof progressFillPctOverride === "number" ? "py-5" : "pt-1",
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
                isWelcome && typeof progressFillPctOverride !== "number"
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
              "fixed top-0 left-0 right-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur-md",
            )}
          >
            <div className="container mx-auto px-6 py-4">
              <button onClick={() => navigate("/")}>
                <h1 className="font-sans text-sm font-semibold tracking-tight text-zinc-900 transition-opacity hover:opacity-80">
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
                  ? "text-zinc-600 group-hover:text-zinc-900"
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
            <ChevronRight className="w-8 h-8 text-zinc-900" />
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
                ? "max-md:min-h-[100dvh] max-md:justify-start max-md:px-8 max-md:pt-[calc(env(safe-area-inset-top,0px)+1.25rem)] max-md:pb-40 md:min-h-screen md:justify-center md:gap-6 md:p-8 md:pt-24 md:pb-12 md:bg-transparent"
                : isSetupCosmicMobileWeb
                  ? "max-md:h-full max-md:min-h-0 max-md:justify-start max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)] md:justify-start md:p-8 md:pt-24"
                  : "min-h-screen justify-between pt-12 p-8 md:pt-24",
          hasProgressSpacing &&
            "max-md:pt-[calc(env(safe-area-inset-top,0px)+2.75rem)] md:pt-24",
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
            nativeWelcomeSideBySide
              ? "fixed inset-x-0 bottom-0 z-40 md:hidden"
              :               isWelcomeMobileWeb
                ? "relative z-50 shrink-0 max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-40 md:space-y-2 md:pt-3"
                : isWelcome
                  ? "relative z-50 shrink-0 space-y-2 pt-3"
                  : "md:hidden",
            !isWelcome && !isSetupCosmicMobileWeb && "space-y-6",
            !(isNative && !isWelcome) && !nativeWelcomeSideBySide && contentMaxWidthClass,
            isNative && !isWelcome && "fixed inset-x-0 bottom-0 z-50 md:hidden",
            isSetupCosmicMobileWeb &&
              !isWelcome &&
              "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-50 max-md:mx-auto max-md:max-w-md max-md:px-8 max-md:pb-[calc(2rem+env(safe-area-inset-bottom,0px))]",
            isWelcome && !isNative && "md:mx-auto md:max-w-xl md:pb-0 md:pt-0 lg:max-w-2xl",
            isStandaloneMobile && !isNative && !isWelcome && !isSetupCosmicMobileWeb && "mb-12",
          )}
          style={
            nativeWelcomeSideBySide
              ? {
                  paddingTop: "0.5rem",
                  paddingBottom: "calc(3.25rem + env(safe-area-inset-bottom, 0px))",
                  ...MOBILE_SETUP_FOOTER_STYLE,
                }
              : isNative
                ? {
                    paddingBottom: "calc(2rem + env(safe-area-inset-bottom, 0px))",
                  }
                : isWelcomeMobileWeb
                  ? MOBILE_SETUP_FOOTER_STYLE
                  : isSetupCosmicMobileWeb && !isWelcome
                    ? { backgroundColor: WELCOME_LIGHT_BASE }
                    : undefined
          }
        >
          {/* Native app: stacked (Welcome only) or side-by-side */}
          {isNative ? (
            stackedNativeButtons ? (
              welcomeSignInAsTextLink ? (
              <div className="mx-auto flex w-full max-w-md flex-col gap-2 px-8">
                {continueText ? (
                  <Button
                    onClick={() => canContinue && onContinue()}
                    disabled={!canContinue}
                    className={cn(
                      "w-full rounded-full bg-black text-white hover:bg-black active:bg-black focus:bg-black h-14 text-base font-medium disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none select-none",
                      stackedNativePrimaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {resolvedContinueText}
                  </Button>
                ) : null}
                {welcomeCtaSubtext ? (
                  <p className="text-center text-[11px] font-medium tracking-wide text-zinc-500">
                    {welcomeCtaSubtext}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-700 hover:underline"
                >
                  {t("alreadyHaveAccountSignIn")}
                </button>
              </div>
              ) : (
              <div className="mx-auto flex w-full max-w-md items-center gap-3 px-8">
                <Button
                  variant="outline"
                  onClick={() => navigate("/login")}
                  className={cn(
                    SETUP_NATIVE_BACK_BTN_CLASS,
                    "outline-none transition-none select-none",
                    stackedNativeSecondaryButtonClassName,
                  )}
                  style={{ WebkitTapHighlightColor: "transparent" }}
                >
                  {t("signIn")}
                </Button>
                {continueText ? (
                  <Button
                    onClick={() => canContinue && onContinue()}
                    disabled={!canContinue}
                    className={cn(
                      SETUP_NATIVE_CONTINUE_BTN_CLASS,
                      stackedNativePrimaryButtonClassName,
                    )}
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {resolvedContinueText}
                  </Button>
                ) : null}
              </div>
              )
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
                  {t("back")}
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
                  {t("signIn")}
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
                {resolvedContinueText}
              </Button>
            </div>
            )
          ) : (
            <div
              className={cn(
                "flex w-full flex-col gap-2",
                isWelcomeMobileWeb && "mx-auto max-w-md px-8",
              )}
            >
              {isWelcome && !welcomeSignInAsTextLink ? (
                <div className="flex w-full items-center gap-3">
                  <Button
                    variant="outline"
                    onClick={() => navigate("/login")}
                    className="h-[3.35rem] flex-1 rounded-xl border-zinc-300 bg-white text-[15px] font-semibold text-zinc-900 hover:bg-zinc-50 active:bg-zinc-50 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none transition-none"
                    style={{ WebkitTapHighlightColor: "transparent" }}
                  >
                    {t("signIn")}
                  </Button>
                  {continueText ? (
                    <Button
                      onClick={() => canContinue && onContinue()}
                      disabled={!canContinue}
                      className={cn(
                        "h-[3.35rem] flex-1 rounded-xl bg-black text-white hover:bg-black active:bg-black focus:bg-black text-[15px] font-bold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-0 outline-none transition-none",
                        welcomeSoloContinueButtonClassName,
                      )}
                      style={{ WebkitTapHighlightColor: "transparent" }}
                    >
                      {resolvedContinueText}
                    </Button>
                  ) : null}
                </div>
              ) : continueText ? (
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
                  {resolvedContinueText}
                </Button>
              ) : null}
              {isWelcome && welcomeCtaSubtext ? (
                <p className="text-center text-[11px] font-medium tracking-wide text-zinc-500">
                  {welcomeCtaSubtext}
                </p>
              ) : null}
              {isWelcome && welcomeSignInAsTextLink ? (
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="py-1 text-center text-[13px] text-zinc-500 underline-offset-2 transition-colors hover:text-zinc-700 hover:underline"
                >
                  {t("alreadyHaveAccountSignIn")}
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

## src/components/onboarding/SetupPage.tsx

```tsx
import { ReactNode, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useIsNativeApp } from "@/hooks/use-native-app";
import {
  ONBOARDING_SETUP_PROGRESS_ROUTES,
  SUITE_WEB_SETUP_PROGRESS_ROUTES,
  WEB_FAST_SETUP_PROGRESS_ROUTES,
} from "@/lib/onboardingFlow";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import {
  MOBILE_SETUP_FOOTER_STYLE,
  SETUP_DESKTOP_CHEVRON_CLASS,
  SETUP_NATIVE_BACK_BTN_CLASS,
  SETUP_NATIVE_CONTINUE_BTN_CLASS,
} from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  children?: ReactNode;
  canContinue?: boolean;
  continueText?: string;
  onContinue?: () => void;
  onBack?: () => void;
  headerSlot?: ReactNode;
  /** When true, do not force light mode / overwrite theme (use after theme picker). Default false. */
  respectUserTheme?: boolean;
  /** Native only: skip the inner scroll viewport (short pages where overflow clips shadows/glow). */
  disableNativeScrollViewport?: boolean;
  /** Hide the route-derived progress bar for special interstitial screens. */
  hideProgress?: boolean;
  /**
   * Short pages where all content fits above the footer (e.g. Choose a guide).
   * Mobile web: no inner scroll box; content flows flat above the fixed footer reserve.
   */
  contentFitsViewport?: boolean;
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
  hideProgress = false,
  contentFitsViewport = false,
}: Props) {
  const { t } = useTranslation("common");
  const isNative = useIsNativeApp();
  const { pathname } = useLocation();
  const { ensureSession } = useOnboardingSession();
  const resolvedContinueText = continueText === "Continue" ? t("continue") : continueText;

  useEffect(() => {
    document.title = "Onboarding | Palette Plotting";
    document.querySelector('meta[name="description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[property="og:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
    document.querySelector('meta[name="twitter:title"]')?.setAttribute("content", "Onboarding | Palette Plotting");
    document.querySelector('meta[name="twitter:description"]')?.setAttribute(
      "content",
      "Start your Palette Plotting onboarding — a private studio for your next chapter.",
    );
  }, [pathname]);

  /** Same warm-up as legacy onboarding (`OnboardingQuestions`): create `onboarding_session` creds before draft syncs. */
  useEffect(() => {
    void ensureSession().catch((err) => {
      console.warn("[SetupPage] ensureSession failed:", err);
    });
  }, [ensureSession]);

  useEffect(() => {
    const shellBg = WELCOME_LIGHT_BASE;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_LIGHT_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_LIGHT_BASE);

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
    if (hideProgress) return null;
    const path = pathname.replace(/\/$/, "") || "/";
    const isSuitePath = path.includes("/onboarding/suite");
    const isSuiteFunnel = isNative || isSuitePath;
    const routes = isSuitePath
      ? SUITE_WEB_SETUP_PROGRESS_ROUTES
      : isSuiteFunnel
        ? ONBOARDING_SETUP_PROGRESS_ROUTES
        : WEB_FAST_SETUP_PROGRESS_ROUTES;
    const idx = (routes as readonly string[]).indexOf(path);
    if (idx < 0) return null;
    const n = routes.length;
    return ((idx + 1) / n) * 100;
  }, [hideProgress, pathname, isNative]);

  const mobileScrollBottomClass = "scroll-pb-28";

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
            {t("back")}
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
            {resolvedContinueText}
          </Button>
        ) : null}
      </div>
    </div>
  ) : null;

  const ownedScrollColumn = (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden pb-3">{mainColumn}</div>
  );

  const desktopScrollContent = disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate hidden min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden md:flex">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate hidden w-full max-w-md space-y-6 md:block">
      {mainColumn}
    </div>
  );

  const nativeScrollContent = contentFitsViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md flex-1 flex-col min-h-0 overflow-visible">
      <div className="space-y-6 pb-3">{mainColumn}</div>
    </div>
  ) : disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          mobileScrollBottomClass,
        )}
      >
        <div className="space-y-6 pb-3">{mainColumn}</div>
      </div>
    </div>
  );

  const mobileWebScrollContent = contentFitsViewport ? (
    <div className="relative z-[1] isolate w-full max-w-md flex-1 overflow-visible md:hidden">
      <div className="space-y-6">{mainColumn}</div>
    </div>
  ) : disableNativeScrollViewport ? (
    <div className="relative z-[1] isolate flex w-full max-w-md min-h-0 flex-1 flex-col overflow-hidden md:hidden">
      {ownedScrollColumn}
    </div>
  ) : (
    <div className="relative z-[1] isolate flex min-h-0 w-full max-w-md flex-1 flex-col overflow-hidden">
      <div
        className={cn(
          "relative z-[1] min-h-0 flex-1 overflow-y-auto overscroll-y-contain [-webkit-overflow-scrolling:touch]",
          mobileScrollBottomClass,
        )}
      >
        <div className="space-y-6 pb-3">{mainColumn}</div>
      </div>
    </div>
  );

  return (
    <div
      className={cn(
        "relative overflow-x-hidden bg-white font-sans text-zinc-900 antialiased",
        isNative
          ? "h-[100dvh] max-h-[100dvh]"
          : "max-md:h-[100dvh] max-md:max-h-[100dvh] md:min-h-screen",
      )}
    >
      {setupProgressFillPct != null ? (
        <div
          className={cn(
            "pointer-events-none fixed inset-x-0 z-[100] flex justify-center px-4 pt-1",
            !isNative && "top-[calc(env(safe-area-inset-top,0px)+0.25rem)] md:top-12",
            isNative && "top-[calc(var(--app-safe-area-top)+0.25rem)]",
          )}
          aria-hidden
        >
          <div className="h-1 w-[70%] max-w-[min(19.6rem,calc(100vw-4rem))] shrink-0 overflow-hidden rounded-full bg-zinc-200">
            <div
              className="h-full rounded-full bg-zinc-900 transition-[width] duration-300 ease-out"
              style={{ width: `${setupProgressFillPct}%` }}
            />
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "relative z-10 flex w-full flex-col items-center animate-fade-in",
          isNative &&
            cn("h-full min-h-0 px-8 pb-40"),
          !isNative &&
            cn(
              "max-md:flex max-md:h-full max-md:min-h-0 max-md:flex-col",
              "max-md:px-8 max-md:pb-40 max-md:pt-[calc(env(safe-area-inset-top,0px)+2.5rem)]",
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
            <div
              className={cn(
                "relative z-[1] flex w-full max-w-md flex-1 flex-col md:hidden",
                contentFitsViewport ? "min-h-0" : "min-h-0 overflow-hidden",
              )}
            >
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
              <ChevronLeft className="w-8 h-8 text-zinc-600 group-hover:text-zinc-900 transition-colors" />
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
              <ChevronRight className="w-8 h-8 text-zinc-900" />
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

## src/components/onboarding/SetupHeadingBlock.tsx

```tsx
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

```

---

## src/components/onboarding/OnboardingTypewriter.tsx

```tsx
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
 * Reveals copy progressively for onboarding moments.
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

```

---

## src/components/onboarding/WelcomeCosmicBackground.tsx

```tsx
import { cn } from "@/lib/utils";

export const WELCOME_LIGHT_BASE = "#ffffff";
export const WELCOME_LIGHT_SHELL_BG = "#ffffff";

/** Flat white background for onboarding and auth shells. */
export function WelcomeCosmicBackground({ className }: { className?: string }) {
  return <div className={cn(className, "bg-white")} aria-hidden />;
}

```

---

