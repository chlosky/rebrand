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
import { Check } from "lucide-react";

const VALUE_PROPS = [
  "Vision boards, Kanban, Gantt & moodboards",
  "Affirmations, audio layers & mirror sessions",
  "Habit tracking & AI coaching",
  "Sync across web and mobile",
];

/**
 * Web subscription: RevenueCat Web Billing paywall (purchases-js).
 * Used from onboarding email and /resubscribe on browser.
 */
export default function WebPaywall() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const containerRef = useRef<HTMLDivElement>(null);
  const [phase, setPhase] = useState<"paywall" | "dismissed" | "error">("paywall");
  const [presenting, setPresenting] = useState(false);
  const autoPresentedRef = useRef(false);

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
    <div className="relative min-h-screen bg-white font-sans text-zinc-900 antialiased">
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 py-8 md:flex-row md:items-stretch md:gap-10 md:px-8 md:py-12">
        {/* Desktop value column */}
        <aside className="hidden md:flex md:w-[42%] md:flex-col md:justify-center md:pr-4">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">Palette Plotting</p>
          <h1 className="font-welcome-serif mt-3 text-4xl font-normal leading-[1.08] tracking-[-0.02em] text-zinc-900">
            Unlock your full workspace
          </h1>
          <p className="mt-4 max-w-sm text-base leading-relaxed text-zinc-600">
            Your starter plot is ready. Subscribe to save boards, use every tool, and sync across devices.
          </p>
          <ul className="mt-8 space-y-3">
            {VALUE_PROPS.map((item) => (
              <li key={item} className="flex items-start gap-2.5 text-sm text-zinc-700">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {item}
              </li>
            ))}
          </ul>
        </aside>

        {/* Paywall card */}
        <main className="flex flex-1 flex-col items-center justify-center">
          <div className="w-full max-w-md rounded-3xl border border-zinc-200 bg-white p-5 shadow-[0_8px_40px_rgba(0,0,0,0.06)] sm:p-6 md:max-w-lg">
            <div className="mb-4 text-center md:hidden">
              <h1 className="font-welcome-serif text-2xl font-normal text-zinc-900">Unlock your workspace</h1>
              <p className="mt-2 text-sm text-zinc-500">Start your trial — cancel anytime.</p>
            </div>

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
          </div>
        </main>
      </div>
    </div>
  );
}
