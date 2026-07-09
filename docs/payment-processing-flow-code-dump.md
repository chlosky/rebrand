# Full Payments Code Dump`n`nGenerated for external review. Includes frontend, Supabase edge functions, shared payment helpers, locale strings, and Supabase generated types that participate in payment, checkout, subscription, entitlement, activation, and post-paywall provisioning flows.`n

---

## src/pages/PaymentProcessing.tsx

```ts
import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { armWebGetAppPromptPending } from "@/lib/webFirstPurchaseGetAppPrompt";

export default function PaymentProcessing() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";
  const checkoutSessionId = searchParams.get("checkout_session_id") || "";

  /**
   * Use a ref instead of state so incrementing attempts doesn't tear down and
   * re-create the polling loop. Previously `attempts` was in the effect's dep
   * array, which meant every increment cancelled the running interval and
   * started a new one â€” and on top of that, `setInterval` and an inline
   * `setTimeout(setAttempts(...))` were both running, doubling the request
   * rate against `get-onboarding-session`.
   */
  const attemptsRef = useRef(0);
  const maxAttempts = 30; // 30 attempts * 2 seconds = 60 seconds max wait

  useEffect(() => {
    if (!sid || !token) {
      toast.error(t("paymentProcessing.missingInfo"));
      const timeoutId = window.setTimeout(
        () => navigate("/onboarding/web-paywall"),
        2000,
      );
      return () => window.clearTimeout(timeoutId);
    }

    let active = true;
    // window.setInterval / setTimeout return numbers in browsers; using the
    // browser variants explicitly so types don't drift to Node's Timeout.
    let interval: number | null = null;
    let finishTimer: number | null = null;

    const finishWithError = (msg: string) => {
      toast.error(msg);
      if (interval != null) {
        window.clearInterval(interval);
        interval = null;
      }
      finishTimer = window.setTimeout(
        () => navigate("/onboarding/web-paywall"),
        3000,
      );
    };

    const checkPaymentStatus = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-onboarding-session",
          { body: { sessionId: sid, resumeToken: token, checkoutSessionId } },
        );
        if (!active) return;

        if (error) {
          console.error("Error checking payment status:", error);
          if (attemptsRef.current >= maxAttempts) {
            finishWithError(t("paymentProcessing.verificationSlow"));
            return;
          }
          attemptsRef.current += 1;
          return;
        }

        const session = data?.session;
        if (session?.status === "paid" || session?.status === "active") {
          const {
            data: { session: authSession },
          } = await supabase.auth.getSession();
          const userId = authSession?.user?.id ?? null;
          if (userId) {
            const stripeCheckoutSessionId =
              checkoutSessionId || (typeof session.stripe_checkout_session_id === "string" ? session.stripe_checkout_session_id : "");
            if (stripeCheckoutSessionId) {
              const { error: confirmError } = await supabase.functions.invoke(
                "confirm-subscription",
                { body: { sessionId: stripeCheckoutSessionId } },
              );
              if (confirmError) throw confirmError;
            }
            armWebGetAppPromptPending();
            navigate("/onboarding/post-paywall", { replace: true });
            return;
          }
          navigate(
            `/activate?sid=${encodeURIComponent(sid)}&token=${encodeURIComponent(token)}`,
            { replace: true },
          );
          return;
        }

        if (attemptsRef.current >= maxAttempts) {
          finishWithError(t("paymentProcessing.verificationSlow"));
          return;
        }
        attemptsRef.current += 1;
      } catch (e) {
        if (!active) return;
        console.error("Error checking payment status:", e);
        if (attemptsRef.current >= maxAttempts) {
          finishWithError(t("paymentProcessing.verificationFailed"));
          return;
        }
        attemptsRef.current += 1;
      }
    };

    void checkPaymentStatus();
    interval = window.setInterval(checkPaymentStatus, 2000);

    return () => {
      active = false;
      if (interval != null) window.clearInterval(interval);
      if (finishTimer != null) window.clearTimeout(finishTimer);
    };
  }, [sid, token, checkoutSessionId, navigate, t]);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6 text-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
        <h1 className="text-2xl font-bold tracking-tight">{t("paymentProcessing.title")}</h1>
        <p className="text-sm text-muted-foreground">
          {t("paymentProcessing.subtitle")}
        </p>
      </div>
    </div>
  );
}


```

---

## src/pages/onboarding/PostPaywallLoading.tsx

```ts
import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import { markIapSubscriptionConfirmed } from "@/lib/postPurchaseEntitlementGate";
import { readSetupDraft } from "@/lib/setupDraft";
import { readStoredPreferredLocale, resolveAppLocale } from "@/lib/locale";
import i18n from "@/i18n";

/** Visual ring only â€” not tied to backend provisioning milestones. */
const VISUAL_PROGRESS_CAP = 97;
const VISUAL_PROGRESS_INTERVAL_MS = 110;

/** Subtitle step thresholds from backend provisionPostPaywallIfNeeded onProgress (0â€“100). */
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

        markIapSubscriptionConfirmed(null);

        setPhase("finishing");
        if (tickId != null) window.clearInterval(tickId);
        setProgress(100);

        logPostPaywall("navigate dashboard");
        window.setTimeout(() => navigateRef.current("/workspace?tab=projects", { replace: true }), 250);
      } catch (e) {
        console.error("[post-paywall] provisioning failed:", e);
        logPostPaywall("provisioning error", { error: String((e as Error)?.message ?? e) });
        if (!alive) return;
        markIapSubscriptionConfirmed(null);
        logPostPaywall("navigate dashboard after error");
        window.setTimeout(() => navigateRef.current("/workspace?tab=projects", { replace: true }), 650);
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


---

## src/pages/onboarding/WebPaywall.tsx

```ts
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { WELCOME_LIGHT_BASE } from "@/components/onboarding/WelcomeCosmicBackground";
import {
  startWebStripeCheckout,
  type WebStripeBillingPeriod,
} from "@/lib/startWebStripeCheckout";
import { Check, Loader2 } from "lucide-react";

type PremiumPricing = {
  monthly: number;
  annual: number;
};

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

export default function WebPaywall() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const billing: WebStripeBillingPeriod = "monthly";
  const [pricing, setPricing] = useState<PremiumPricing | null>(null);
  const [pricingLoading, setPricingLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  useEffect(() => {
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
              {t("webStripe.openingCheckout")}
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


```

---

## src/pages/Activate.tsx

```ts
import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
type RemoteOnboardingSession = {
  id: string;
  status: string;
  email: string | null;
  first_name: string | null;
  username: string | null;
  email_consent: boolean | null;
  sms_consent: boolean | null;
  onboarding_answers?: Record<string, unknown> | null;
  selected_tier: string | null;
  billing: string | null;
  stripe_customer_email: string | null;
  stripe_checkout_session_id: string | null;
  paid_at: string | null;
  user_id: string | null;
};

export default function Activate() {
  const { t } = useTranslation("auth");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";

  const [remoteSession, setRemoteSession] = useState<RemoteOnboardingSession | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [accountCreated, setAccountCreated] = useState(false);

  // Calculate isPaid based on remoteSession status
  const isPaid = useMemo(() => {
    return remoteSession?.status === "paid" || remoteSession?.status === "active";
  }, [remoteSession?.status]);

  // Check if account was already created by webhook
  useEffect(() => {
    if (remoteSession?.user_id || user) {
      // Account already exists - show success and redirect
      setAccountCreated(true);
      toast.success(t("toasts.accountCreated"));
      // Don't auto-redirect - user needs to set password first
      // They'll be redirected to login when they try to access dashboard
    }
  }, [remoteSession?.user_id, user, navigate, t]);

  useEffect(() => {
    let isMounted = true;

    const load = async () => {
      if (!sid || !token) {
        setIsLoadingSession(false);
        return;
      }

      try {
        const { data, error } = await supabase.functions.invoke("get-onboarding-session", {
          body: { sessionId: sid, resumeToken: token },
        });
        if (error) throw error;
        if (!data?.session) throw new Error("Missing session");
        if (!isMounted) return;

        const s = data.session as RemoteOnboardingSession;
        setRemoteSession(s);
      } catch (e: any) {
        console.error("Failed to load onboarding session:", e);
        toast.error(t("toasts.activationLoadFailed"));
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    load();
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sid, token]);

  // Redirect to payment processing if payment not confirmed by webhook
  useEffect(() => {
    if (!sid || !token) return;
    if (!remoteSession) return;
    if (remoteSession.status === "paid" || remoteSession.status === "active") return;

    // Payment not confirmed by webhook yet - redirect to processing page
    navigate(`/payment-processing?sid=${encodeURIComponent(sid)}&token=${encodeURIComponent(token)}`, { replace: true });
  }, [remoteSession, sid, token, navigate]);

  // Poll for account creation when payment is confirmed but account not created yet
  useEffect(() => {
    // Only poll if payment is confirmed but account not created yet
    if (!isPaid) return;
    if (accountCreated || remoteSession?.user_id || user) return;
    if (!sid || !token) return;

    let pollInterval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;

    const pollForAccount = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-onboarding-session", {
          body: { sessionId: sid, resumeToken: token },
      });

        if (error) throw error;
        if (!data?.session) return;

        const session = data.session as RemoteOnboardingSession;
        
        // Account created by webhook!
        if (session.user_id) {
          setRemoteSession(session);
          setAccountCreated(true);
          toast.success(t("toasts.accountCreated"));
          clearInterval(pollInterval);
          clearTimeout(timeout);
          // Don't auto-redirect - user needs to set password first
          // They'll be redirected to login when they try to access dashboard
        }
      } catch (e) {
        console.error("Error polling for account:", e);
        // Don't show error - just keep polling silently
      }
    };

    // Poll every 2 seconds
    pollInterval = setInterval(pollForAccount, 2000);
    
    // Stop after 30 seconds
    timeout = setTimeout(() => {
      clearInterval(pollInterval);
      toast.error(t("toasts.accountCreationSlow"));
    }, 30000);

    return () => {
      clearInterval(pollInterval);
      clearTimeout(timeout);
    };
  }, [isPaid, accountCreated, remoteSession?.user_id, user, sid, token, navigate, t]);

  const title = t("activate.title");
  const subtitle = remoteSession?.selected_tier
    ? t("activate.subtitleWithTier", {
        tier: remoteSession.selected_tier,
        billing: remoteSession.billing || t("activate.billingMonthly"),
      })
    : t("activate.subtitleDefault");

  // Don't show title/subtitle when account is created
  const showTitle = !(accountCreated || remoteSession?.user_id || user);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-6">
        {showTitle && (
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{subtitle}</p>
          </div>
        )}

        {isLoadingSession ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : !sid || !token ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t("activate.missingInfo")}</p>
            <Button onClick={() => navigate("/onboarding/welcome")}>{t("activate.restart")}</Button>
          </div>
        ) : !isPaid ? (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t("activate.paymentNotConfirmed")}</p>
            <Button onClick={() => navigate("/onboarding/web-paywall")}>{t("activate.goToSubscriptions")}</Button>
          </div>
        ) : accountCreated || remoteSession?.user_id || user ? (
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight">{t("activate.accountCreatedTitle")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("activate.accountCreatedBody")}
              </p>
            </div>
            <Button onClick={() => navigate("/login", { replace: true })}>
              {t("activate.goToSignIn")}
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <p className="text-sm text-muted-foreground">{t("activate.waitingForAccount")}</p>
            <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
          </div>
        )}
      </div>
    </div>
  );
}



```

---

## src/lib/runWebPaywallFlow.ts

```ts
import type { NavigateFunction } from "react-router-dom";
import { toast } from "sonner";
import i18n from "@/i18n";

export type WebPaywallFlowOutcome = "success" | "skipped";

/**
 * After signup, route to the Stripe web paywall.
 */
export async function runWebPaywallFlowAfterSignup(options: {
  userId: string | null;
  navigate: NavigateFunction;
}): Promise<WebPaywallFlowOutcome> {
  if (!options.userId) {
    toast.error(i18n.t("paywall:flow.signInRequiredBeforeSubscribing"));
    options.navigate("/login", { replace: true });
    return "skipped";
  }

  options.navigate("/onboarding/web-paywall", { replace: true });
  return "success";
}


```

---

## src/lib/startWebStripeCheckout.ts

```ts
import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";

export type WebStripeBillingPeriod = "monthly" | "annual";

export type StartWebStripeCheckoutResult =
  | { ok: true }
  | { ok: false; error: string };

/**
 * Persists plan choice on the onboarding session and redirects to Stripe Checkout.
 * Requires the user to be signed in so `update-onboarding-session` can attach `user_id`.
 */
export async function startWebStripeCheckout(options: {
  billing: WebStripeBillingPeriod;
}): Promise<StartWebStripeCheckoutResult> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.user?.id) {
    return { ok: false, error: "Sign in is required before subscribing." };
  }

  try {
    const creds = await ensureOnboardingSessionCreds();

    const { error: patchError } = await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: {
          selected_tier: "premium",
          billing: options.billing,
          paywall_id: "web_stripe_checkout",
          paywall_variant: options.billing,
        },
      },
    });
    if (patchError) {
      console.warn("[startWebStripeCheckout] update-onboarding-session:", patchError.message);
      return { ok: false, error: "Could not save your plan choice. Please try again." };
    }

    const { data, error } = await supabase.functions.invoke("create-onboarding-checkout-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
      },
    });

    if (error) {
      console.warn("[startWebStripeCheckout] create-onboarding-checkout-session:", error.message);
      return { ok: false, error: "Could not open checkout. Please try again." };
    }

    const url = typeof data?.url === "string" ? data.url.trim() : "";
    if (!url) {
      return { ok: false, error: "Checkout URL was missing. Please try again." };
    }

    window.location.assign(url);
    return { ok: true };
  } catch (e) {
    console.error("[startWebStripeCheckout]", e);
    return { ok: false, error: "Could not open checkout. Please try again." };
  }
}


```

---

## src/lib/webOnboardingSessionInsert.ts

```ts
import { Capacitor } from "@capacitor/core";
import { supabase } from "@/integrations/supabase/client";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";
import { buildOnboardingAttributionPatch } from "@/lib/attribution";

const RECORDED_KEY = "pp_web_onboarding_session_recorded_v1";
const CLIENT_VISIT_KEY = "pp_web_onboarding_client_visit_v1";

let recordStartPromise: Promise<void> | null = null;

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
  ttclid?: string | null;
  make_my_board_cta_clicked?: boolean;
  user_agent?: string | null;
};

export async function insertWebOnboardingSession(row: WebOnboardingSessionInsert) {
  return supabase.from("web_onboarding_sessions").insert(row);
}

/**
 * Fire once per tab when a browser user lands on web onboarding welcome.
 * Tracks both the web visit table and canonical onboarding_sessions.
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

  const clientVisitId = getOrCreateClientVisitId();
  const webOnboardingAnswers = {
    schema_version: 1,
    client_visit_id: clientVisitId,
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
    ttclid: attribution?.ttclid ?? null,
    user_agent: userAgent,
    recorded_at: new Date().toISOString(),
  };

  recordStartPromise = (async () => {
    const creds = await ensureOnboardingSessionCreds();

    const { error: canonicalError } = await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: {
          ...buildOnboardingAttributionPatch(),
          onboarding_answers: {
            web_onboarding_v1: webOnboardingAnswers,
          },
        },
      },
    });
    if (canonicalError) throw canonicalError;

    const { error } = await insertWebOnboardingSession({
      client_visit_id: clientVisitId,
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
      ttclid: attribution?.ttclid ?? null,
      user_agent: userAgent,
    });
    if (error) {
      console.warn("[web_onboarding] session insert:", error.message);
      return;
    }

    try {
      sessionStorage.setItem(RECORDED_KEY, "1");
    } catch {
      /* ignore */
    }
  })().catch((err: unknown) => {
      console.warn(
        "[web_onboarding] session tracking:",
        err instanceof Error ? err.message : String(err),
      );
    });

  void recordStartPromise;
}

/** Link this tab's web onboarding visit to the auth user (for TikTok Events API match). */
export async function linkWebOnboardingSessionToUser(userId: string): Promise<void> {
  if (Capacitor.isNativePlatform()) return;
  if (!userId) return;

  let clientVisitId: string | null = null;
  try {
    clientVisitId = sessionStorage.getItem(CLIENT_VISIT_KEY);
  } catch {
    /* ignore */
  }
  if (!clientVisitId) return;

  const { error } = await supabase.rpc("link_web_onboarding_session_user", {
    p_client_visit_id: clientVisitId,
    p_user_id: userId,
  });
  if (error) {
    console.warn("[web_onboarding] link user:", error.message);
  }
}

export function readWebOnboardingClientVisitId(): string | null {
  try {
    return sessionStorage.getItem(CLIENT_VISIT_KEY);
  } catch {
    return null;
  }
}

export function markWebOnboardingMakeMyBoardCtaClicked(): void {
  if (Capacitor.isNativePlatform()) return;

  const clientVisitId = getOrCreateClientVisitId();

  void (async () => {
    const creds = await ensureOnboardingSessionCreds();

    if (recordStartPromise) {
      try {
        await recordStartPromise;
      } catch {
        /* mark RPC upserts the row if insert never landed */
      }
    }

    const { error } = await supabase.rpc("mark_web_onboarding_make_my_board_cta_clicked", {
      p_client_visit_id: clientVisitId,
    });
    if (error) {
      console.warn("[web_onboarding] make_my_board_cta_clicked:", error.message);
    }

    const { error: canonicalError } = await supabase.functions.invoke("update-onboarding-session", {
      body: {
        sessionId: creds.sessionId,
        resumeToken: creds.resumeToken,
        patch: {
          onboarding_answers: {
            web_onboarding_cta_v1: {
              schema_version: 1,
              client_visit_id: clientVisitId,
              make_my_board_cta_clicked: true,
              make_my_board_cta_clicked_at: new Date().toISOString(),
            },
          },
        },
      },
    });
    if (canonicalError) {
      console.warn("[web_onboarding] canonical cta click:", canonicalError.message);
    }
  })();
}

```

---

## src/lib/postPaywallProvisioning.ts

```ts
// Starter provisioning: create the user's first board workspace after payment.
// starter_provisioned === true â†’ skip forever.

import { supabase } from "@/integrations/supabase/client";
import { ensureStarterWorkspaceFromCategories, ensureStarterWorkspaceFromSlug, fetchUserWorkspaces } from "@/lib/boards/api";
import {
  DEFAULT_FOUR_BOARD_TEMPLATE,
  FOUR_BOARD_FOCUS_CATEGORIES_SLUG,
  HOME_FOCUS_TO_TEMPLATE,
  MOODBOARD_FOCUS_TO_TEMPLATE,
  OFFICE_SYSTEM_TO_TEMPLATE,
  normalizeFocusCategoryNames,
  type StartingSystem,
} from "@/lib/boards/starterTemplates";
import { clearSetupDraft, readSetupDraft, type SetupDraft } from "@/lib/setupDraft";

const ONBOARDING_SESSION_STORAGE_KEY = "onboarding_session";

type OnboardingSessionRow = {
  user_id?: string | null;
  email?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
};

type StarterProvisioningSeed = {
  startingSystem?: StartingSystem;
  desireCategories: string[];
  templateSlug: string;
  usedTrustedLocalDraft: boolean;
};

function readOnboardingSessionCreds(): { sessionId: string; resumeToken: string } | null {
  for (const storage of [localStorage, sessionStorage]) {
    try {
      const raw = storage.getItem(ONBOARDING_SESSION_STORAGE_KEY);
      if (!raw) continue;
      const parsed = JSON.parse(raw) as { sessionId?: string; resumeToken?: string };
      if (parsed?.sessionId && parsed?.resumeToken) {
        return { sessionId: String(parsed.sessionId), resumeToken: String(parsed.resumeToken) };
      }
    } catch {
      /* ignore */
    }
  }
  return null;
}

async function fetchCurrentOnboardingSession(): Promise<OnboardingSessionRow | null> {
  const creds = readOnboardingSessionCreds();
  if (!creds) return null;
  try {
    const { data } = await supabase.functions.invoke("get-onboarding-session", {
      body: { sessionId: creds.sessionId, resumeToken: creds.resumeToken },
    });
    if (data?.session && typeof data.session === "object") {
      return data.session as OnboardingSessionRow;
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readSetupPathV1(answers: Record<string, unknown> | null | undefined): Record<string, unknown> | null {
  if (!answers || typeof answers !== "object") return null;
  const sp = answers.setup_path_v1;
  return sp && typeof sp === "object" && !Array.isArray(sp) ? (sp as Record<string, unknown>) : null;
}

function isOnboardingSessionTrustedForAuth(
  userId: string,
  authEmail: string | undefined,
  onboardingSession: OnboardingSessionRow | null,
): boolean {
  if (!onboardingSession) return false;
  if (onboardingSession.user_id && onboardingSession.user_id === userId) return true;
  const authNorm = authEmail?.trim().toLowerCase() ?? "";
  const sessionEmail = onboardingSession.email?.trim().toLowerCase() ?? "";
  if (sessionEmail && authNorm && sessionEmail === authNorm) return true;
  return false;
}

function isLocalSetupDraftTrusted(
  draft: SetupDraft,
  userId: string,
  authEmail: string | undefined,
  onboardingSession: OnboardingSessionRow | null,
): boolean {
  if (!isOnboardingSessionTrustedForAuth(userId, authEmail, onboardingSession)) return false;
  const authNorm = authEmail?.trim().toLowerCase() ?? "";
  const draftEmail = draft.email?.trim().toLowerCase() ?? "";
  if (draftEmail && authNorm && draftEmail !== authNorm) return false;
  const sessionEmail = onboardingSession!.email?.trim().toLowerCase() ?? "";
  if (draftEmail && sessionEmail && draftEmail !== sessionEmail) return false;
  return true;
}

function readStartingSystem(
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): StartingSystem | undefined {
  const fromPath = setupPath?.starting_system;
  if (
    fromPath === "life_rebranding" ||
    fromPath === "home_organization" ||
    fromPath === "office_work" ||
    fromPath === "moodboarding"
  ) {
    return fromPath;
  }
  return localDraft.startingSystem;
}

function readDesireCategories(
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): string[] {
  const fromPath = setupPath?.desire_categories;
  if (Array.isArray(fromPath)) {
    const normalized = normalizeFocusCategoryNames(fromPath.filter((c): c is string => typeof c === "string"));
    if (normalized.length > 0) return normalized;
  }
  return normalizeFocusCategoryNames(localDraft.desireCategories);
}

function readStringField(
  setupPath: Record<string, unknown> | null,
  pathKey: string,
  draftValue: string | undefined,
): string | undefined {
  const fromPath = setupPath?.[pathKey];
  if (typeof fromPath === "string" && fromPath.trim()) return fromPath.trim();
  if (typeof draftValue === "string" && draftValue.trim()) return draftValue.trim();
  return undefined;
}

function resolveTemplateSlugFromSetup(
  startingSystem: StartingSystem | undefined,
  setupPath: Record<string, unknown> | null,
  localDraft: SetupDraft,
): string {
  if (startingSystem === "home_organization") {
    const homeFocusKey = readStringField(setupPath, "home_focus_key", localDraft.homeFocusKey);
    if (homeFocusKey && HOME_FOCUS_TO_TEMPLATE[homeFocusKey]) {
      return HOME_FOCUS_TO_TEMPLATE[homeFocusKey];
    }
  }
  if (startingSystem === "office_work") {
    const officeSystem = readStringField(setupPath, "office_planning_system", localDraft.officePlanningSystem);
    if (officeSystem && OFFICE_SYSTEM_TO_TEMPLATE[officeSystem]) {
      return OFFICE_SYSTEM_TO_TEMPLATE[officeSystem];
    }
  }
  if (startingSystem === "moodboarding") {
    const moodboardFocusKey = readStringField(setupPath, "moodboard_focus_key", localDraft.moodboardFocusKey);
    if (moodboardFocusKey && MOODBOARD_FOCUS_TO_TEMPLATE[moodboardFocusKey]) {
      return MOODBOARD_FOCUS_TO_TEMPLATE[moodboardFocusKey];
    }
  }
  return DEFAULT_FOUR_BOARD_TEMPLATE.slug;
}

async function resolveStarterProvisioningSeed(
  userId: string,
  authEmail: string | undefined,
): Promise<StarterProvisioningSeed> {
  const onboardingSession = await fetchCurrentOnboardingSession();
  const localDraft = readSetupDraft();
  const sessionTrustedForAuth = isOnboardingSessionTrustedForAuth(userId, authEmail, onboardingSession);
  const trustedLocalDraft = isLocalSetupDraftTrusted(localDraft, userId, authEmail, onboardingSession);
  const setupPath = sessionTrustedForAuth
    ? readSetupPathV1(onboardingSession?.onboarding_answers ?? null)
    : null;

  const startingSystem = readStartingSystem(setupPath, localDraft);

  return {
    startingSystem,
    desireCategories: readDesireCategories(setupPath, localDraft),
    templateSlug: resolveTemplateSlugFromSetup(startingSystem, setupPath, localDraft),
    usedTrustedLocalDraft: trustedLocalDraft,
  };
}

export type ProvisionPostPaywallResult = { ran: boolean; skipped: boolean; reason?: string };

export async function provisionPostPaywallIfNeeded(options?: {
  quiet?: boolean;
  onProgress?: (percent: number) => void;
}): Promise<ProvisionPostPaywallResult> {
  const report = (percent: number) => options?.onProgress?.(percent);

  report(8);

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.user?.id) {
    return { ran: false, skipped: true, reason: "no_session" };
  }

  const userId = session.user.id;
  report(18);

  const { data: planRow } = await (supabase as any)
    .from("user_plans")
    .select("starter_provisioned")
    .eq("user_id", userId)
    .maybeSingle();

  if (planRow?.starter_provisioned) {
    report(100);
    return { ran: false, skipped: true, reason: "already_provisioned" };
  }

  report(24);
  const existingWorkspaces = await fetchUserWorkspaces(userId);
  if (existingWorkspaces.length > 0) {
    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);
    report(100);
    return { ran: false, skipped: true, reason: "workspace_already_exists" };
  }

  report(28);
  const seed = await resolveStarterProvisioningSeed(userId, session.user.email);

  try {
    report(40);
    const useCategoryBoards =
      seed.startingSystem === "life_rebranding" && seed.desireCategories.length > 0;
    if (useCategoryBoards) {
      const created = await ensureStarterWorkspaceFromCategories(userId, seed.desireCategories);
      if (!created) {
        await ensureStarterWorkspaceFromSlug(userId, FOUR_BOARD_FOCUS_CATEGORIES_SLUG);
      }
    } else {
      await ensureStarterWorkspaceFromSlug(userId, seed.templateSlug);
    }

    await (supabase as any)
      .from("user_plans")
      .update({ starter_provisioned: true })
      .eq("user_id", userId);

    if (seed.usedTrustedLocalDraft) {
      clearSetupDraft();
    }

    report(100);
    return { ran: true, skipped: false };
  } catch (e) {
    if (import.meta.env.DEV) console.error("[postPaywallProvisioning] unexpected:", e);
    return { ran: true, skipped: true, reason: "error" };
  }
}

// Kept for callers that still map onboarding focus keys to weekly goal categories.
export function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string): string {
  const raw = (desireCategory || "").trim();
  const categories = new Set([
    "Self & Direction",
    "Career & Money",
    "Love & Relationships",
    "Home & Space",
    "Beauty & Wellness",
    "Travel & Adventure",
    "Organization & Plan",
    "Aesthetic & Mood",
    "College & School",
    "Health & Fitness",
  ]);
  if (categories.has(raw)) return raw;
  return "Self & Direction";
}


```

---

## src/lib/postPurchaseEntitlementGate.ts

```ts
import { debugLog } from "@/debugLog";
import { syncWebStripeEntitlementAfterPurchaseWithRetries } from "@/lib/webStripeEntitlementSync";

/** Handoff from Stripe checkout â†’ entitlement sync on `/onboarding/post-paywall`. */
const STORAGE_KEY = "pp_post_paywall_gate_v1";

export type PostPaywallLatch = {
  userId: string | null;
  entitlementSynced: boolean;
};

export type PostPurchaseGateResult = "skipped" | "synced" | "failed";

/** One in-flight entitlement sync shared by PostPaywallLoading remounts (e.g. React Strict Mode). */
let entitlementSyncOutcome: Promise<PostPurchaseGateResult> | null = null;

export function armIapPostPurchaseEntitlementLatch(userId: string | null): void {
  try {
    const payload: PostPaywallLatch = { userId, entitlementSynced: false };
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function clearIapPostPurchaseEntitlementLatch(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

function readLatch(): PostPaywallLatch | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const p = JSON.parse(raw) as Partial<PostPaywallLatch>;
    if (typeof p.entitlementSynced !== "boolean") return null;
    if (!Object.prototype.hasOwnProperty.call(p, "userId")) return null;
    return { userId: p.userId ?? null, entitlementSynced: p.entitlementSynced };
  } catch {
    return null;
  }
}

export function getIapPostPurchaseLatchUserId(): string | null {
  return readLatch()?.userId ?? null;
}

function applySubscriptionSessionMarkers(userId: string | null): void {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i += 1) {
      const k = sessionStorage.key(i);
      if (k?.startsWith("subscription_check_")) keysToRemove.push(k);
    }
    keysToRemove.forEach((k) => sessionStorage.removeItem(k));
    if (userId) {
      sessionStorage.setItem(
        `subscription_check_${userId}`,
        JSON.stringify({ ts: Date.now(), active: true }),
      );
    }
  } catch {
    /* ignore */
  }
  (window as unknown as { __subscriptionConfirmed?: boolean }).__subscriptionConfirmed = true;
}

export function markIapSubscriptionConfirmed(userId: string | null): void {
  applySubscriptionSessionMarkers(userId);
}

/**
 * After Stripe checkout, sync subscription to the server before provisioning.
 * Skips when no latch exists or sync already succeeded.
 */
export async function runIapPostPurchaseGateIfNeeded(): Promise<PostPurchaseGateResult> {
  const latch = readLatch();
  if (!latch || latch.entitlementSynced) return "skipped";

  if (entitlementSyncOutcome) return entitlementSyncOutcome;

  const userId = latch.userId;

  entitlementSyncOutcome = (async (): Promise<PostPurchaseGateResult> => {
    try {
      const ok = await syncWebStripeEntitlementAfterPurchaseWithRetries();
      if (!ok) {
        debugLog({
          location: "postPurchaseEntitlementGate.ts:syncFail",
          message: "Stripe entitlement sync returned false after checkout",
          hypothesisId: "H5",
        });
        clearIapPostPurchaseEntitlementLatch();
        return "failed";
      }
      applySubscriptionSessionMarkers(userId);
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({ userId, entitlementSynced: true } satisfies PostPaywallLatch),
        );
      } catch {
        /* ignore */
      }
      return "synced";
    } catch (e) {
      console.error("[postPurchaseEntitlementGate]", e);
      clearIapPostPurchaseEntitlementLatch();
      return "failed";
    }
  })().finally(() => {
    entitlementSyncOutcome = null;
  });

  return entitlementSyncOutcome;
}


```

---

## src/lib/webStripeEntitlementSync.ts

```ts
import { supabase } from "@/integrations/supabase/client";

const SUBSCRIBED_TIERS = new Set(["monthly", "annual", "basic", "plus", "premium", "weekly"]);

const POST_PURCHASE_INITIAL_DELAY_MS = 800;
const POST_PURCHASE_RETRY_DELAY_MS = 1200;

async function userHasActiveStripePlan(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("status, tier, last_payment_source")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return false;

  const tier = typeof data.tier === "string" ? data.tier.trim().toLowerCase() : "";
  const status = typeof data.status === "string" ? data.status.trim().toLowerCase() : "";
  const source = typeof data.last_payment_source === "string" ? data.last_payment_source.trim().toLowerCase() : "";

  if (!["active", "trialing"].includes(status) || !SUBSCRIBED_TIERS.has(tier)) return false;
  if (source && source !== "stripe" && source !== "web") return false;
  return true;
}

/** After Stripe Checkout, poll `user_plans` until the webhook has activated the membership. */
export async function syncWebStripeEntitlementAfterPurchaseWithRetries(
  attempts = 6,
): Promise<boolean> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user?.id;
  if (!userId) {
    console.warn("[webStripeEntitlementSync] No session; skipping poll.");
    return false;
  }

  await new Promise((r) => setTimeout(r, POST_PURCHASE_INITIAL_DELAY_MS));

  for (let i = 0; i < attempts; i += 1) {
    if (await userHasActiveStripePlan(userId)) return true;
    await new Promise((r) => setTimeout(r, POST_PURCHASE_RETRY_DELAY_MS));
  }

  return false;
}


```

---

## src/lib/webFirstPurchaseGetAppPrompt.ts

```ts
import { Capacitor } from "@capacitor/core";

const PENDING_KEY = "pp_web_get_app_prompt_pending_v1";
const SHOWN_KEY = "pp_web_get_app_prompt_shown_v1";
/** Dev preview without keeping `?preview=` in the URL â€” set via console, clear when done. */
export const PREVIEW_STORAGE_KEY = "pp_web_get_app_preview_v1";

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

/** Call when a browser user completes their first Stripe checkout. */
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

## src/lib/endStripeTrialEarly.ts

```ts
import { supabase } from "@/integrations/supabase/client";
import { invalidatePlottingProCache } from "@/hooks/usePlottingPro";

export type EndStripeTrialResult =
  | { ok: true; alreadyActive?: boolean }
  | { ok: false; error: string };

/** Ends the Stripe free trial immediately so paid features (downloads, calendar export) unlock. */
export async function endStripeTrialEarly(userId: string): Promise<EndStripeTrialResult> {
  const { data, error } = await supabase.functions.invoke("end-stripe-trial", { body: {} });

  if (error) {
    console.warn("[endStripeTrialEarly]", error.message);
    return { ok: false, error: "Could not start your subscription. Try again or use Manage billing." };
  }

  const payload = data as { ok?: boolean; alreadyActive?: boolean; error?: string } | null;
  if (payload?.error) {
    return { ok: false, error: payload.error };
  }

  invalidatePlottingProCache(userId);
  return { ok: true, alreadyActive: payload?.alreadyActive === true };
}


```

---

## src/hooks/usePlottingPro.ts

```ts
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export type PlottingPlanSnapshot = {
  hasPro: boolean;
  onTrial: boolean;
  hadTrial: boolean;
};

/** One fetch per signed-in user per session â€” dashboard lock state only. */
const planCache = new Map<string, PlottingPlanSnapshot>();
const planInFlight = new Map<string, Promise<PlottingPlanSnapshot>>();

export function invalidatePlottingProCache(userId?: string) {
  if (userId) planCache.delete(userId);
  else planCache.clear();
}

type UserPlanRow = {
  tier: string | null;
  status: string | null;
  on_trial: boolean | null;
  had_trial: boolean | null;
  current_period_end: string | null;
};

function snapshotFromPlan(row: UserPlanRow | null): PlottingPlanSnapshot {
  if (!row?.tier) {
    return { hasPro: false, onTrial: false, hadTrial: false };
  }

  const status = row.status ?? "";
  const periodOk =
    !row.current_period_end || new Date(row.current_period_end).getTime() > Date.now();
  const hasPro = (status === "active" || status === "trialing") && periodOk;
  const onTrial = hasPro && (row.on_trial === true || status === "trialing");
  const hadTrial = row.had_trial === true || status === "trialing";

  return { hasPro, onTrial, hadTrial };
}

async function fetchPlottingPlan(userId: string): Promise<PlottingPlanSnapshot> {
  const { data, error } = await supabase
    .from("user_plans")
    .select("tier, status, on_trial, had_trial, current_period_end")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    console.warn("[usePlottingPro] user_plans lookup failed:", error.message);
    return { hasPro: false, onTrial: false, hadTrial: false };
  }

  const snapshot = snapshotFromPlan(data as UserPlanRow | null);
  planCache.set(userId, snapshot);
  return snapshot;
}

export function usePlottingPro() {
  const { user, isLoading: authLoading } = useAuth();
  const cached = user?.id ? planCache.get(user.id) : undefined;
  const [hasPro, setHasPro] = useState(cached?.hasPro ?? false);
  const [onTrial, setOnTrial] = useState(cached?.onTrial ?? false);
  const [hadTrial, setHadTrial] = useState(cached?.hadTrial ?? false);
  const [loading, setLoading] = useState(cached === undefined && !authLoading);
  const [refreshToken, setRefreshToken] = useState(0);

  const refreshPlan = useCallback(() => {
    if (user?.id) {
      invalidatePlottingProCache(user.id);
      planInFlight.delete(user.id);
    }
    setRefreshToken((n) => n + 1);
  }, [user?.id]);

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) {
      setHasPro(false);
      setOnTrial(false);
      setHadTrial(false);
      setLoading(false);
      return;
    }

    const hit = refreshToken === 0 ? planCache.get(user.id) : undefined;
    if (hit !== undefined) {
      setHasPro(hit.hasPro);
      setOnTrial(hit.onTrial);
      setHadTrial(hit.hadTrial);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      if (!planInFlight.has(user.id)) {
        planInFlight.set(user.id, fetchPlottingPlan(user.id));
      }

      try {
        const snapshot = await planInFlight.get(user.id)!;
        if (!cancelled) {
          setHasPro(snapshot.hasPro);
          setOnTrial(snapshot.onTrial);
          setHadTrial(snapshot.hadTrial);
        }
      } catch {
        if (!cancelled) {
          planCache.set(user.id, { hasPro: false, onTrial: false, hadTrial: false });
          setHasPro(false);
          setOnTrial(false);
          setHadTrial(false);
        }
      } finally {
        planInFlight.delete(user.id);
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, authLoading, refreshToken]);

  return { hasPro, onTrial, hadTrial, loading: authLoading || loading, refreshPlan };
}


```

---

## src/hooks/useUserTier.ts

```ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { SubscribedTier } from "@/lib/featureGating";

const SUBSCRIBED_TIERS: readonly string[] = ['monthly', 'annual', 'basic', 'plus', 'premium'];

interface UseUserTierReturn {
  tier: SubscribedTier | null;
  /** From `user_plans.status` (e.g. active, canceled, past_due). */
  status: string | null;
  loading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Module-level cache so every tool page that reads tier doesn't re-query
 * `user_plans` on every navigation. Keyed by user.id, invalidated when the
 * authenticated user changes. `refetch()` always bypasses the cache.
 */
type TierCacheEntry = {
  tier: SubscribedTier | null;
  status: string | null;
};
const tierCache = new Map<string, TierCacheEntry>();
const tierInFlight = new Map<string, Promise<TierCacheEntry>>();

/**
 * Returns tier and status from `user_plans`. Gating uses `status === 'active'` plus a subscribed tier (see featureGating).
 */
export const useUserTier = (): UseUserTierReturn => {
  const { user } = useAuth();
  const cached = user?.id ? tierCache.get(user.id) : undefined;
  const [tier, setTier] = useState<SubscribedTier | null>(cached?.tier ?? null);
  const [status, setStatus] = useState<string | null>(cached?.status ?? null);
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<Error | null>(null);

  const fetchTier = async () => {
    if (!user) {
      setTier(null);
      setStatus(null);
      setLoading(false);
      return;
    }

    try {
      setError(null);
      // Coalesce concurrent callers for the same user into a single request.
      let pending = tierInFlight.get(user.id);
      if (!pending) {
        pending = (async () => {
          const { data: planData, error: fetchError } = await supabase
            .from('user_plans')
            .select('tier, status')
            .eq('user_id', user.id)
            .maybeSingle();

          if (fetchError) throw fetchError;

          const next: TierCacheEntry = {
            tier:
              planData?.tier && SUBSCRIBED_TIERS.includes(planData.tier)
                ? (planData.tier as SubscribedTier)
                : null,
            status: planData?.status ?? null,
          };
          tierCache.set(user.id, next);
          return next;
        })();
        tierInFlight.set(user.id, pending);
      }

      try {
        const next = await pending;
        setTier(next.tier);
        setStatus(next.status);
      } finally {
        tierInFlight.delete(user.id);
      }
    } catch (err) {
      setError(err as Error);
      const cachedEntry = tierCache.get(user.id);
      if (cachedEntry) {
        setTier(cachedEntry.tier);
        setStatus(cachedEntry.status);
      } else {
        setTier(null);
        setStatus(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // If we already hydrated from cache, do a quiet background revalidate.
    if (!cached) setLoading(true);
    void fetchTier();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return { tier, status, loading, error, refetch: fetchTier };
};















































```

---

## src/components/ProtectedRoute.tsx

```ts
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/** Auth-only gate. Subscription is enforced per tool route + server-side RLS. */
export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate("/login", {
        replace: true,
        state: { from: location.pathname + location.search },
      });
    }
  }, [isLoading, user, navigate, location.pathname, location.search]);

  if (isLoading) {
    return <div className="min-h-screen bg-[#faf8f5]" aria-busy="true" />;
  }

  if (!user) {
    return null;
  }

  return <>{children}</>;
};


```

---

## src/components/boards/TrialExportUnlockDialog.tsx

```ts
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { endStripeTrialEarly } from "@/lib/endStripeTrialEarly";
import { toast } from "sonner";

type TrialExportUnlockDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUnlocked: () => void;
  refreshPlan: () => void;
};

export function TrialExportUnlockDialog({
  open,
  onOpenChange,
  onUnlocked,
  refreshPlan,
}: TrialExportUnlockDialogProps) {
  const { t } = useTranslation("tools");
  const { user } = useAuth();
  const [endingTrial, setEndingTrial] = useState(false);

  const handleStartSubscription = async () => {
    if (!user?.id || endingTrial) return;
    setEndingTrial(true);
    try {
      const result = await endStripeTrialEarly(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refreshPlan();
      onOpenChange(false);
      toast.success(
        result.alreadyActive
          ? t("boards.trial.unlockedAlready")
          : t("boards.trial.unlockedNow"),
      );
      onUnlocked();
    } finally {
      setEndingTrial(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("boards.trial.lockTitle")}</DialogTitle>
          <DialogDescription>{t("boards.trial.lockDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button
            type="button"
            className="w-full"
            disabled={endingTrial}
            onClick={() => void handleStartSubscription()}
          >
            {endingTrial ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t("boards.trial.startingSubscription")}
              </>
            ) : (
              t("boards.trial.startSubscriptionNow")
            )}
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => onOpenChange(false)}>
            {t("boards.trial.keepTrial")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


```

---

## src/pages/Settings.tsx

```ts
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Bell, KeyRound, CreditCard, AlertTriangle, Trash2, ChevronRight, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { cn } from "@/lib/utils";
import { MobileBottomInlet } from "@/components/MobileBottomInlet";
import { WorkspaceHeader, workspaceShellClass } from "@/components/workspace/WorkspaceHeader";
import { validatePassword, validatePasswordMatch } from "@/lib/password-validation";
import { Capacitor } from "@capacitor/core";
import { Browser } from "@capacitor/browser";
import { useTranslation } from "react-i18next";
import { resolveAppLocale, legalTermsPath, legalPrivacyPath } from "@/lib/locale";
import { SITE_ORIGIN } from "@/lib/siteBrand";
import { usePlottingPro } from "@/hooks/usePlottingPro";
import { endStripeTrialEarly } from "@/lib/endStripeTrialEarly";

const darkFieldClass =
  "border-white/12 bg-transparent text-white placeholder:text-white/35 focus-visible:ring-white/20";
const helpTabsListClass = "h-auto w-full p-1";
const helpTabsTriggerClass = "h-8 rounded-md border border-transparent px-2";
const darkTabsListClass = "border border-white/12 bg-transparent";
const darkTabsTriggerClass =
  "text-white/55 transition-colors hover:bg-white/[0.06] hover:text-white/80 data-[state=active]:!border-white/12 data-[state=active]:!bg-white/[0.06] data-[state=active]:!text-white data-[state=active]:shadow-none";

const Settings = () => {
  const { t, i18n } = useTranslation("settings");
  const localeKey = resolveAppLocale(i18n.resolvedLanguage || i18n.language);
  const translatePasswordError = (error: string | null): string | null => {
    if (!error) return null;
    return t(`passwordValidation.${error}`);
  };
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme } = useTheme();
  const shellDark = theme === "dark";
  const { onTrial, refreshPlan } = usePlottingPro();
  const [endingTrial, setEndingTrial] = useState(false);

  useEffect(() => {
    if (user === null) {
      navigate("/login", { replace: true });
    }
  }, [user, navigate]);
  
  const isStandalone = 
    typeof window !== 'undefined' && (
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true
    ) || Capacitor.isNativePlatform();
  const [userEmail, setUserEmail] = useState<string>("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [emailMarketing, setEmailMarketing] = useState(false);
  const [marketingSMSEnabled, setMarketingSMSEnabled] = useState(false);
  const [dataTrainingOptIn, setDataTrainingOptIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Password validation states
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [isValidatingPassword, setIsValidatingPassword] = useState(false);
  // Refs for debouncing
  const passwordValidationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  /** Cadence from `user_plans.billing_period` only (Current Plan label). */
  const [billingPeriodLabel, setBillingPeriodLabel] = useState<string | null>(null);
  /** Billing identity from user_plans. */
  const [stripeCustomerId, setStripeCustomerId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>("");
  const [verificationCode, setVerificationCode] = useState("");
  const [sentCode, setSentCode] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(true); // Start as true if phone hasn't changed
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [originalPhoneNumber, setOriginalPhoneNumber] = useState("");
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalFirstName, setOriginalFirstName] = useState("");
  const [showDeleteAccountConfirm1, setShowDeleteAccountConfirm1] = useState(false);
  const [showDeleteAccountConfirm2, setShowDeleteAccountConfirm2] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deletionScheduledAt, setDeletionScheduledAt] = useState<string | null>(null);
  useEffect(() => {
    const fetchUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        setUserEmail(user.email || "");
        setUserId(user.id);

        const { data: planData, error } = await supabase
          .from("user_plans")
          .select("billing_period, last_payment_source, stripe_customer_id")
          .eq("user_id", user.id)
          .maybeSingle();

        const plan = planData as
          | {
              billing_period?: string | null;
              last_payment_source?: string | null;
              stripe_customer_id?: string | null;
            }
          | null;

        if (error) {
          console.error("Error fetching plan:", error);
          setBillingPeriodLabel(null);
        } else {
          const bp = plan?.billing_period?.trim() || null;
          setBillingPeriodLabel(bp);
        }

        setStripeCustomerId(plan?.stripe_customer_id?.trim() || null);

        // Fetch user preferences (email reminders and text reminders)
        const { data: prefs, error: prefsError } = await (supabase as any)
          .from('user_preferences')
          .select('email_marketing, texts_enabled, data_training_opt_in')
          .eq('user_id', user.id)
          .maybeSingle();

        if (!prefsError && prefs) {
          setEmailMarketing(prefs.email_marketing || false);
          setMarketingSMSEnabled(prefs.texts_enabled || false);
          setDataTrainingOptIn(prefs.data_training_opt_in || false);
        }

        // Fetch profile for phone number, username, and first name
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('phone, username, first_name')
          .eq('id', user.id)
          .maybeSingle();

        if (!profileError && profile) {
          const profileData = profile as any;
          const currentPhone = profileData.phone || "";
          const currentUsername = profileData.username || "";
          const currentFirstName = profileData.first_name || "";
          setPhoneNumber(currentPhone);
          setOriginalPhoneNumber(currentPhone);
          setUsername(currentUsername);
          setOriginalUsername(currentUsername);
          setFirstName(currentFirstName);
          setOriginalFirstName(currentFirstName);
        }

      }
    };

    fetchUserData();
  }, []);

  const handleSendVerificationCode = async () => {
    if (!phoneNumber.trim()) {
      toast.error(t("toasts.enterPhone"));
      return;
    }

    setIsSendingCode(true);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setSentCode(code);
    setIsPhoneVerified(false);

    try {
      const response = await supabase.functions.invoke('send-sms-notification', {
        body: {
          phoneNumber,
          message: t("profile.smsVerificationMessage", { code }),
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Failed to send code');
      }

      toast.success(t("toasts.codeSent"));
    } catch (error) {
      console.error("Failed to send code:", error);
      toast.error(t("toasts.codeSendFailed"));
      setSentCode("");
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleVerifyCode = async () => {
    if (verificationCode === sentCode) {
      setIsPhoneVerified(true);
      // Automatically save if phone number changed
      if (phoneNumber !== originalPhoneNumber) {
        await handleUpdateProfile();
      }
      setVerificationCode("");
      setSentCode("");
      toast.success(t("toasts.phoneVerified"));
    } else {
      toast.error(t("toasts.invalidCode"));
      setVerificationCode("");
    }
  };

  const handleUpdateProfile = async () => {
    if (!username.trim()) {
      toast.error(t("toasts.usernameEmpty"));
      return;
    }

    const usernameToSave = username.trim();

    try {
      const { data: usernameModerationData, error: usernameModerationError } =
        await supabase.functions.invoke("check-username-profanity", {
          body: { text: usernameToSave },
        });

      if (usernameModerationError) {
        console.error("Username moderation check error:", usernameModerationError);
        toast.error(t("toasts.usernameValidationError"));
        return;
      }

      if (usernameModerationData?.hasProfanity || usernameModerationData?.safe === false) {
        toast.error(t("toasts.usernameNotAllowed"));
        return;
      }
    } catch (usernameModerationError) {
      console.error("Username moderation check failed:", usernameModerationError);
      toast.error(t("toasts.usernameValidationError"));
      return;
    }
    
    // Check if phone number changed and needs verification
    if (phoneNumber !== originalPhoneNumber && !isPhoneVerified) {
      toast.error(t("toasts.verifyPhoneFirst"));
      return;
    }
    
    if (!user) {
      toast.error(t("toasts.userNotFound"));
      return;
    }

    // Update profile in database
    const { error: profileError } = await supabase
      .from('profiles')
      .update({
        username: usernameToSave,
        first_name: firstName.trim() || null,
        phone: phoneNumber || null // Allow clearing phone number
      })
      .eq('id', user.id);

    if (profileError) {
      // Check if it's a unique constraint violation for username
      if (profileError.code === '23505' || profileError.message?.includes('unique') || profileError.message?.includes('duplicate')) {
        toast.error(t("toasts.usernameTaken"));
      } else {
        toast.error(t("toasts.profileUpdateError"));
        console.error(profileError);
      }
      return;
    }

    // Update auth.users phone if phone number was set
    if (phoneNumber && phoneNumber.trim()) {
      try {
        const { error: authError } = await supabase.auth.updateUser({
          phone: phoneNumber
        });
        if (authError) {
          console.warn('Could not update auth.users phone:', authError);
          // Don't fail the whole update if auth update fails
        }
      } catch (e) {
        console.warn('Error updating auth phone:', e);
      }
    }

    // Reset verification state after successful update
    setOriginalPhoneNumber(phoneNumber);
    setOriginalUsername(usernameToSave);
    setOriginalFirstName(firstName.trim());
    setIsPhoneVerified(true);
    setVerificationCode("");
    setSentCode("");

    toast.success(t("toasts.profileUpdated"));
  };

  // Real-time password validation (debounced)
  useEffect(() => {
    if (passwordValidationTimeoutRef.current) {
      clearTimeout(passwordValidationTimeoutRef.current);
    }

    if (!newPassword) {
      setPasswordError(null);
      setIsValidatingPassword(false);
      return;
    }

    setIsValidatingPassword(true);
    setPasswordError(null);

    passwordValidationTimeoutRef.current = setTimeout(() => {
      const result = validatePassword(newPassword);
      setPasswordError(result.error);
      setIsValidatingPassword(false);
    }, 500);

    return () => {
      if (passwordValidationTimeoutRef.current) {
        clearTimeout(passwordValidationTimeoutRef.current);
      }
    };
  }, [newPassword]);

  // Real-time confirm password validation
  useEffect(() => {
    if (!confirmPassword) {
      setConfirmPasswordError(null);
      return;
    }

    const result = validatePasswordMatch(newPassword, confirmPassword);
    setConfirmPasswordError(result.error);
  }, [confirmPassword, newPassword]);

  const canChangePassword = 
    !!newPassword &&
    !!confirmPassword &&
    !passwordError &&
    !confirmPasswordError &&
    !isValidatingPassword;

  const handleChangePassword = async () => {
    // Validate password using shared validation
    const passwordResult = validatePassword(newPassword);
    if (!passwordResult.isValid) {
      toast.error(translatePasswordError(passwordResult.error) || t("toasts.invalidPassword"));
      return;
    }

    // Validate password match
    const matchResult = validatePasswordMatch(newPassword, confirmPassword);
    if (!matchResult.isValid) {
      toast.error(translatePasswordError(matchResult.error) || t("passwordValidation.mismatch"));
      return;
    }

    const { error } = await supabase.auth.updateUser({
      password: newPassword
    });

    if (error) {
      toast.error(t("toasts.passwordUpdateError"));
    } else {
      toast.success(t("toasts.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  };


  const handleToggleMarketingSMS = async (enabled: boolean) => {
    setMarketingSMSEnabled(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          texts_enabled: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating marketing SMS preference:', error);
        // Revert on error
        setMarketingSMSEnabled(!enabled);
        toast.error(t("toasts.smsUpdateError"));
      } else {
        toast.success(enabled ? t("toasts.smsEnabled") : t("toasts.smsDisabled"));
      }
    }
  };

  const handleToggleDataTraining = async (enabled: boolean) => {
    const previous = dataTrainingOptIn;
    setDataTrainingOptIn(enabled);

    if (!user) {
      toast.error(t("toasts.loginRequired"));
      setDataTrainingOptIn(previous);
      return;
    }

    const { error } = await (supabase as any)
      .from('user_preferences')
      .upsert({
        user_id: user.id,
        data_training_opt_in: enabled,
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      console.error('Error updating data training preference:', error);
      setDataTrainingOptIn(previous);
      toast.error(t("toasts.dataTrainingError"));
    } else {
      toast.success(enabled ? t("toasts.dataTrainingEnabled") : t("toasts.dataTrainingDisabled"));
    }
  };

  const handleDeleteAccountRequest = () => setShowDeleteAccountConfirm1(true);
  const handleDeleteAccountConfirm1Close = () => setShowDeleteAccountConfirm1(false);
  const handleDeleteAccountConfirm1Continue = () => {
    setShowDeleteAccountConfirm1(false);
    setShowDeleteAccountConfirm2(true);
  };
  const handleDeleteAccountConfirm2Close = () => setShowDeleteAccountConfirm2(false);
  const handleDeleteAccountFinalConfirm = async () => {
    if (!user) return;
    setIsDeletingAccount(true);
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", { method: "POST" });
      if (error) throw error;
      const result = data as { error?: string; scheduled_at?: string };
      if (result?.error) throw new Error(result.error);
      const scheduledAt = result?.scheduled_at ? new Date(result.scheduled_at) : null;
      const dateStr = scheduledAt ? scheduledAt.toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" }) : t("deletion.scheduledFallback");
      setShowDeleteAccountConfirm2(false);
      await supabase.auth.signOut({ scope: "global" });
      const { error: signOutError } = await supabase.auth.signOut({ scope: "local" });
      if (signOutError) throw signOutError;
      try {
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
          const k = sessionStorage.key(i);
          if (k?.startsWith("subscription_check_")) sessionStorage.removeItem(k);
        }
      } catch {}
      navigate("/", { replace: true });
      toast.success(t("toasts.deletionScheduled", { date: dateStr }));
    } catch (e) {
      console.error("Account deletion failed:", e);
      toast.error(t("toasts.deletionFailed"));
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handleCancelDeletionRequest = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.functions.invoke("delete-account", {
        method: "POST",
        body: { cancel: true },
      });
      if (error) throw error;
      if ((data as { error?: string })?.error) throw new Error((data as { error: string }).error);
      setDeletionScheduledAt(null);
      toast.success(t("toasts.deletionCancelled"));
    } catch (e) {
      console.error("Cancel deletion failed:", e);
      toast.error(t("toasts.deletionCancelFailed"));
    }
  };

  const handleToggleEmailMarketing = async (enabled: boolean) => {
    setEmailMarketing(enabled);
    
    if (user) {
      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_marketing: enabled,
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        console.error('Error updating email marketing preference:', error);
        console.error('Full error details:', JSON.stringify(error, null, 2));
        // Revert on error
        setEmailMarketing(!enabled);
        const errorMessage = error.message || error.details || "";
        toast.error(t("toasts.emailPrefError", { message: errorMessage }));
      } else {
        toast.success(enabled ? t("toasts.emailEnabled") : t("toasts.emailDisabled"));
      }
    }
  };

  /** Opens Stripe Customer Portal for subscription management. */
  const handleManageBilling = async () => {
    if (!user) {
      toast.error(t("toasts.billingLoginRequired"));
      return;
    }

    try {
      const portalToast = toast.loading(t("billing.openingPortal"));

      if (!stripeCustomerId) {
        await supabase.functions.invoke("sync-stripe-customer", { body: {} });
      }

      const returnUrl = window.location.origin.startsWith("http")
        ? `${window.location.origin}/dashboard/settings`
        : `${SITE_ORIGIN}/dashboard/settings`;

      const { data, error } = await supabase.functions.invoke("create-customer-portal", {
        body: { returnUrl },
      });
      toast.dismiss(portalToast);

      if (error) throw error;

      const payload = data as { url?: string | null; message?: string; error?: string } | null;
      const url = typeof payload?.url === "string" ? payload.url.trim() : "";
      if (!url) {
        toast.error(payload?.message?.trim() || t("toasts.portalFailed"));
        return;
      }

      if (Capacitor.isNativePlatform()) {
        await Browser.open({ url });
      } else {
        window.location.href = url;
      }
    } catch (error) {
      console.error("Manage billing (Stripe portal):", error);
      toast.error(t("toasts.portalFailed"));
    }
  };


  const handleEndTrialEarly = async () => {
    if (!user?.id || endingTrial) return;
    setEndingTrial(true);
    try {
      const result = await endStripeTrialEarly(user.id);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      refreshPlan();
      toast.success(
        result.alreadyActive ? t("billing.trialEndedAlready") : t("billing.trialEndedNow"),
      );
    } finally {
      setEndingTrial(false);
    }
  };

  // Email reminders are now loaded from database in fetchUserData
  // This useEffect is no longer needed as it's handled in fetchUserData

  return (
    <>
      <MobileBottomInlet />
      <div
        className={cn(workspaceShellClass(shellDark), "min-h-screen pb-20 md:pb-0")}
        style={{ backgroundColor: shellDark ? "#000000" : "#faf8f5" }}
      >
        <div className="min-h-screen">
          <div className="relative z-10">
            <WorkspaceHeader />

            <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
        <Tabs defaultValue="profile" className="w-full">
          <TabsList className={cn(helpTabsListClass, "grid grid-cols-4", shellDark && darkTabsListClass)}>
            <TabsTrigger value="profile" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.profile")}</TabsTrigger>
            <TabsTrigger value="settings" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.settings")}</TabsTrigger>
            <TabsTrigger value="billing" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.billing")}</TabsTrigger>
            <TabsTrigger value="legal" className={cn(helpTabsTriggerClass, shellDark && darkTabsTriggerClass)}>{t("tabs.legal")}</TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent key={`profile-${localeKey}`} value="profile" className="mt-4 space-y-4">
            <Card className={cn(shellDark ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-4") : "p-4 sm:p-6 space-y-4", shellDark && "!bg-transparent")}>
              <div className="space-y-1">
                <Label htmlFor="firstName" className="text-sm">{t("profile.nameLabel")}</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", shellDark && darkFieldClass)}
                  placeholder={t("profile.namePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="username" className="text-sm">{t("profile.usernameLabel")}</Label>
                <Input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={cn("h-11 py-2.5 leading-6", shellDark && darkFieldClass)}
                  placeholder={t("profile.usernamePlaceholder")}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="email" className="text-sm">{t("profile.emailLabel")}</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={userEmail}
                  readOnly
                  aria-readonly="true"
                  className={cn("h-11 py-2.5 leading-6 cursor-default", shellDark ? cn(darkFieldClass, "!opacity-100") : "bg-muted opacity-100")}
                />
                <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("profile.emailCannotChange")}
                </p>
              </div>

              {/* Phone number field hidden for now */}
              {false && (
              <div className="space-y-1">
                <Label htmlFor="phone" className="text-sm">{t("profile.phoneLabel")}</Label>
                <div className="flex gap-2">
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                    onChange={(e) => {
                      setPhoneNumber(e.target.value);
                      // Reset verification if phone number changes
                      if (e.target.value !== originalPhoneNumber) {
                        setIsPhoneVerified(false);
                        setVerificationCode("");
                        setSentCode("");
                      } else {
                        setIsPhoneVerified(true);
                      }
                    }}
                  placeholder={t("profile.phonePlaceholder")}
                    className="flex-1 h-9"
                />
                  {phoneNumber && phoneNumber !== originalPhoneNumber && (
                    <Button
                      type="button"
                      onClick={handleSendVerificationCode}
                      disabled={isSendingCode || !phoneNumber.trim()}
                      variant="outline"
                      className="whitespace-nowrap"
                    >
                      {isSendingCode ? t("profile.sendingCode") : t("profile.sendCode")}
                    </Button>
                  )}
                </div>

                {sentCode && !isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <div className="space-y-1">
                    <div className="flex gap-2">
                      <Input
                        type="text"
                        placeholder={t("profile.codePlaceholder")}
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        maxLength={6}
                        className="flex-1 h-9"
                      />
                      <Button
                        type="button"
                        onClick={handleVerifyCode}
                        disabled={verificationCode.length !== 6}
                        variant="outline"
                        className="h-9"
                      >
                        {t("profile.verify")}
                      </Button>
                    </div>
                    {!isPhoneVerified && (
                      <p className="text-xs text-muted-foreground">
                        {t("profile.verifyPhoneHint")}
                      </p>
                    )}
                  </div>
                )}

                {isPhoneVerified && phoneNumber === originalPhoneNumber && originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.phoneVerified")}</p>
                )}

                {isPhoneVerified && phoneNumber !== originalPhoneNumber && (
                  <p className="text-xs text-green-600">{t("profile.newPhoneVerified")}</p>
                )}
              </div>
              )}

              {(username.trim() !== originalUsername || firstName.trim() !== originalFirstName) && (
                <Button 
                  onClick={handleUpdateProfile} 
                  className="w-full h-9"
                >
                <User className="mr-2 h-4 w-4" />
                  {t("profile.updateButton")}
              </Button>
              )}
            </Card>

            <Card className={cn(shellDark ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-4") : "p-4 sm:p-6 space-y-4", shellDark && "!bg-transparent")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm">
                <KeyRound className="h-4 w-4" />
                {t("profile.changePasswordHeading")}
              </h3>
              
              <div className="space-y-1">
                <Label htmlFor="current-password" className="text-sm">{t("profile.currentPasswordLabel")}</Label>
                <Input
                  id="current-password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t("profile.currentPasswordPlaceholder")}
                  className={cn("h-11", shellDark && darkFieldClass)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label htmlFor="new-password" className="text-sm">{t("profile.newPasswordLabel")}</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder={t("profile.newPasswordPlaceholder")}
                    className={cn("h-11", shellDark && darkFieldClass, passwordError && "border-destructive")}
                  />
                  {isValidatingPassword && (
                    <p className="text-xs text-muted-foreground">{t("profile.validatingPassword")}</p>
                  )}
                  {passwordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(passwordError)}</p>
                  )}
                </div>

                <div className="space-y-1">
                  <Label htmlFor="confirm-password" className="text-sm">{t("profile.confirmPasswordLabel")}</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder={t("profile.confirmPasswordPlaceholder")}
                    className={cn("h-11", shellDark && darkFieldClass, confirmPasswordError && "border-destructive")}
                  />
                  {confirmPasswordError && (
                    <p className="text-xs text-destructive">{translatePasswordError(confirmPasswordError)}</p>
                  )}
                </div>
              </div>

              <Button
                type="button"
                onClick={handleChangePassword}
                disabled={!canChangePassword}
              >
                {t("profile.changePasswordButton")}
              </Button>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent key={`settings-${localeKey}`} value="settings" className="mt-4 space-y-4">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.planRemindersHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.planRemindersDescription")}
              </p>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-between h-auto py-3",
                  theme === "dark" && "border-white/12 bg-transparent hover:bg-white/[0.06]",
                )}
                onClick={() => navigate("/dashboard/settings/plan-reminders")}
              >
                <span className="text-left">
                  <span className="block font-medium">{t("preferences.planRemindersButtonTitle")}</span>
                  <span
                    className={cn(
                      "block text-xs font-normal mt-0.5",
                      theme === "dark" ? "text-white/55" : "text-muted-foreground",
                    )}
                  >
                    {t("preferences.planRemindersButtonSubtitle")}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 opacity-60" />
              </Button>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.emailHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.emailDescription")}
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="email-marketing">{t("preferences.emailMarketingLabel")}</Label>
                  <Switch 
                    id="email-marketing"
                    checked={emailMarketing}
                    onCheckedChange={handleToggleEmailMarketing}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>

                <div className="flex items-center justify-between hidden">
                  <Label htmlFor="text-marketing">{t("preferences.textMarketingLabel")}</Label>
                  <Switch 
                    id="text-marketing"
                    checked={marketingSMSEnabled}
                    onCheckedChange={handleToggleMarketingSMS}
                    className="data-[state=checked]:bg-green-500"
                  />
                </div>
              </div>
            </Card>

            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <Bell className="h-4 w-4" />
                {t("preferences.dataTrainingHeading")}
              </h3>
              <p className={cn("text-xs", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                {t("preferences.dataTrainingDescription")}
              </p>

              <div className="flex items-center justify-between">
                <Label htmlFor="data-training-opt-in">{t("preferences.dataTrainingLabel")}</Label>
                <Switch
                  id="data-training-opt-in"
                  checked={dataTrainingOptIn}
                  onCheckedChange={handleToggleDataTraining}
                  className="data-[state=checked]:bg-green-500"
                />
              </div>
            </Card>

            <Card className={cn(theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3", "border-destructive/30")}>
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {t("deletion.heading")}
              </h3>
              {deletionScheduledAt ? (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.scheduledPrefix")}{" "}
                    {new Date(deletionScheduledAt).toLocaleDateString(undefined, { year: "numeric", month: "long", day: "numeric" })}.{" "}
                    {t("deletion.scheduledSuffix")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelDeletionRequest}
                  >
                    {t("deletion.cancelRequest")}
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {t("deletion.description")}
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive border-destructive/50 hover:bg-destructive/10"
                    onClick={handleDeleteAccountRequest}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    {t("deletion.deleteButton")}
                  </Button>
                </>
              )}
            </Card>

            <Dialog open={showDeleteAccountConfirm1} onOpenChange={setShowDeleteAccountConfirm1}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm1Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm1Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm1Close}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountConfirm1Continue}>{t("common:continue")}</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={showDeleteAccountConfirm2} onOpenChange={setShowDeleteAccountConfirm2}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>{t("deletion.confirm2Title")}</DialogTitle>
                  <DialogDescription>
                    {t("deletion.confirm2Body")}
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={handleDeleteAccountConfirm2Close} disabled={isDeletingAccount}>{t("common:cancel")}</Button>
                  <Button variant="destructive" onClick={handleDeleteAccountFinalConfirm} disabled={isDeletingAccount}>
                    {isDeletingAccount ? t("deletion.deleting") : t("deletion.deleteButton")}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </TabsContent>

          {/* Billing Tab */}
          <TabsContent key={`billing-${localeKey}`} value="billing" className="mt-4 space-y-4">
            <Card
              className={cn(
                theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3",
                theme === "dark" && "!bg-transparent",
              )}
            >
              <h3 className="font-semibold flex items-center gap-2 text-sm sm:text-base">
                <CreditCard className="h-4 w-4" />
                {t("billing.subscriptionHeading")}
              </h3>
              
              <div className="space-y-4">
                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.currentPlan")}</p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {billingPeriodLabel === "monthly"
                      ? t("billing.planMonthly")
                      : billingPeriodLabel === "annual"
                        ? t("billing.planAnnual")
                        : billingPeriodLabel === "weekly"
                          ? t("billing.planWeekly")
                          : billingPeriodLabel ?? ""}
                  </p>
                </div>

                <div
                  className={cn(
                    "p-3 rounded-lg",
                    theme === "dark"
                      ? "border border-white/12 bg-transparent"
                      : "bg-muted/30",
                  )}
                >
                  <p className="text-sm font-medium mb-1">{t("billing.billingHeading")}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("billing.billingDescription")}
                  </p>
                </div>

                {onTrial ? (
                  <div
                    className={cn(
                      "space-y-3 rounded-lg p-3",
                      theme === "dark" ? "border border-amber-400/30 bg-amber-500/10" : "border border-amber-200 bg-amber-50",
                    )}
                  >
                    <p className="text-sm font-medium">{t("billing.trialActiveHeading")}</p>
                    <p className="text-xs text-muted-foreground">{t("billing.trialActiveDescription")}</p>
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      disabled={endingTrial}
                      onClick={() => void handleEndTrialEarly()}
                    >
                      {endingTrial ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          {t("billing.trialEnding")}
                        </>
                      ) : (
                        t("billing.endTrialEarly")
                      )}
                    </Button>
                  </div>
                ) : null}

                <Button
                  type="button"
                  variant="ghost"
                  className={cn("w-full", theme === "dark" ? "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50" : cn("bg-card text-card-foreground border border-border/50", "hover:bg-card/90 hover:text-card-foreground active:text-card-foreground", "focus-visible:text-card-foreground"))}
                  onClick={() => void handleManageBilling()}
                >
                  {t("billing.manageBilling")}
                </Button>
                <p className="text-[11px] leading-snug text-muted-foreground text-center px-1">
                  {t("billing.portalHint")}
                </p>
              </div>
            </Card>
          </TabsContent>

          {/* Legal Tab */}
          <TabsContent key={`legal-${localeKey}`} value="legal" className="mt-4 space-y-4">
            <Card className={theme === "dark" ? cn("!rounded-xl !border-white/12 !bg-transparent !text-white backdrop-blur-sm !shadow-sm", "p-4 sm:p-6 space-y-3") : "p-4 sm:p-6 space-y-3"}>
              <h3 className="font-semibold text-sm sm:text-base mb-4">
                {t("legal.heading")}
              </h3>
              {t("legalDisclaimer") ? (
                <p className={cn("text-xs mb-4", theme === "dark" ? "text-white/55" : "text-muted-foreground")}>
                  {t("legalDisclaimer")}
                </p>
              ) : null}

              <div className="space-y-2">
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/faq")}
                >
                  {t("legal.faq")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalTermsPath())}
                >
                  {t("legal.terms")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate(legalPrivacyPath())}
                >
                  {t("legal.privacy")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/acceptable-use")}
                >
                  {t("legal.acceptableUse")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/billing")}
                >
                  {t("legal.billingRefunds")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/dmca")}
                >
                  {t("legal.dmca")}
                </Button>
                <Button
                  variant="ghost"
                  className="w-full justify-start"
                  onClick={() => navigate("/contact")}
                >
                  {t("legal.contact")}
                </Button>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
            </main>
          </div>
        </div>
      </div>
    </>
  );
};

export default Settings;


```

---

## src/i18n/locales/en/paywall.json

```json
{
  "postPaywall": {
    "title": "Your workspace is ready",
    "buildingDashboard": "Opening your workspaceâ€¦",
    "finishingSubtitle": "Almost there â€” setting up your boards.",
    "loadingStatusAria": "Loading status",
    "commitmentLabel": "Quick reminder:",
    "commitmentText": "You have a place to put the boards, plans, images, and structures you are building. Start simple, then keep arranging.",
    "simsLines": [
      "Confirming your trialâ€¦",
      "Setting up your four-board workspaceâ€¦",
      "Adding your starter boards and plan layoutâ€¦",
      "Opening your workspace â€” almost there."
    ],
    "toastActivateFailed": "Payment completed, but we could not activate your plan yet. Please try again.",
    "toastSetupSnag": "We hit a snag finishing setup. Taking you to your workspaceâ€¦"
  },
  "legacyIos": {
    "titleLine1": "Unlock your free trial",
    "titleLine2": "Start your membership",
    "subtitle": "Choose a weekly plan to claim your free trial.",
    "loadingOptions": "Loading subscription optionsâ€¦",
    "weekly": "Weekly",
    "monthly": "Monthly",
    "yearly": "Yearly",
    "bestAnnualValue": "Best annual value",
    "onlyPerMonth": "Only {{amount}}/mo",
    "perWeek": "{{price}}/week",
    "perMonth": "{{price}}/month",
    "perYear": "{{price}}/year",
    "opening": "Openingâ€¦",
    "tryAgain": "Try again",
    "fallbackTitle": "We couldn't finish that step",
    "fallbackBody": "Tap Try again, or go back to sign up and tap Continue.",
    "terms": "Terms / EULA",
    "privacy": "Privacy",
    "restorePurchases": "Restore purchases",
    "restoring": "Restoringâ€¦",
    "restore": "Restore",
    "closeAria": "Close",
    "errorNotIosApp": "Subscriptions are only available in the iOS app.",
    "errorSignInAgain": "Sign in again, then open subscription.",
    "errorNoSession": "No active session. Sign out, sign in, then tap Continue.",
    "errorOpenFromSignup": "Open subscription from the app after sign up.",
    "errorSkippedDetail": "Use Continue on the sign-up screen, or open Account from Settings.",
    "errorGeneric": "Something went wrong.",
    "errorPersist": "Something went wrong. Copy debug log from Safari if this persists.",
    "restoreOnlyIos": "Restore is only available in the iOS app.",
    "restoredSuccess": "Subscription restored. Welcome back!",
    "restoreCancelled": "Restore cancelled.",
    "nothingToRestore": "Nothing to restore."
  },
  "legacyAndroid": {
    "title": "Unlock Palette Plotting Premium Today.",
    "subtitle": "Tap Continue to confirm your plan.",
    "opening": "Openingâ€¦",
    "tryAgain": "Try again",
    "fallbackTitle": "We couldn't finish that step",
    "fallbackBody": "Tap Try again, or go back to sign up and tap Continue.",
    "terms": "Terms / EULA",
    "privacy": "Privacy",
    "closeAria": "Close",
    "errorNotAndroidApp": "Subscriptions are only available in the Android app.",
    "errorSignInAgain": "Sign in again, then open subscription.",
    "errorNoSession": "No active session. Sign out, sign in, then tap Continue.",
    "errorOpenFromSignup": "Open subscription from the app after sign up.",
    "errorSkippedDetail": "Use Continue on the sign-up screen, or open Account from Settings.",
    "errorGeneric": "Something went wrong."
  },
  "flow": {
    "subscriptionAlreadyOpening": "Subscription is already opening â€” wait a few seconds, then try again.",
    "subscriptionScreenMayBeOpening": "A subscription screen may still be opening. Wait a few seconds, then try again. If nothing changes, force-quit the app and reopen.",
    "openingSubscriptionsTimedOut": "Opening subscriptions timed out. Force-quit the app, reopen, and tap Continue again.",
    "paymentNotCompleted": "Payment was not completed.",
    "couldNotOpenSubscription": "Could not open subscription options.",
    "signInRequiredBeforeSubscribing": "Sign in is required before subscribing."
  },
  "webWrapper": {
    "checkoutFailed": "We could not open checkout.",
    "checkoutClosed": "Checkout closed. You can subscribe anytime.",
    "viewPlans": "View plans",
    "close": "Close",
    "notConfigured": "Web checkout is not configured yet. Please try again later.",
    "subscriptionNotCompleted": "Subscription not completed."
  },
  "emailCollection": {
    "title": "Let's Get Started",
    "emailLabel": "Email",
    "firstNameLabel": "First Name",
    "usernameLabel": "Username",
    "passwordLabel": "Password",
    "confirmLabel": "Confirm",
    "emailPlaceholder": "your@email.com",
    "firstNamePlaceholder": "First name",
    "usernamePlaceholder": "Username",
    "passwordPlaceholder": "8+ characters",
    "confirmPlaceholder": "Re-enter",
    "checkingEmail": "Checking availability...",
    "checkingUsername": "Checking...",
    "emailTaken": "This email is already registered. Please sign in instead.",
    "usernameTaken": "This username is already taken. Please choose another.",
    "passwordMinLength": "Password must be at least 8 characters.",
    "passwordMismatch": "Passwords do not match.",
    "passwordMismatchToast": "Passwords do not match",
    "invalidEmail": "Please enter a valid email address",
    "needUsername": "Please enter a username",
    "needPassword": "Please enter a password with at least 8 characters",
    "needFirstName": "Please enter your first name",
    "acceptTerms": "Please accept the Terms of Service and Privacy Policy",
    "verifyEmailBlocked": "Account created, but sign-in is blocked. Please verify your email, then sign in.",
    "subscriptionError": "Could not open subscription options. Try again in a moment.",
    "saveFailed": "Failed to save. Please try again.",
    "tryAgain": "Try again",
    "termsAcceptPrefix": "I accept the",
    "termsOfService": "Terms of Service",
    "termsAnd": "and",
    "privacyPolicy": "Privacy Policy",
    "appNotificationsConsent": "I consent to app notifications (optional). New tools, promotions and app news. Opt out in Settings â†’ Notification preferences.",
    "emailMarketingConsent": "I consent to email marketing communications (optional, separate from transactional emails minimally required). Opt out in settings.",
    "smsMarketingConsent": "I consent to optional promotional texts from Palette Plotting (not plan reminders). Opt out in Settings. Message and data rates may apply."
  },
  "errors": {
    "cancelled": "Cancelled",
    "paywallError": "Paywall error",
    "notPresented": "Not presented",
    "unknownResultDetail": "Unknown result: {{detail}}",
    "noApiKey": "No RevenueCat API key configured.",
    "notConfigured": "RevenueCat could not be configured.",
    "purchaseNotCompleted": "Purchase was not completed.",
    "billingUnavailable": "Billing unavailable; RevenueCat paywall UI is not used on this iOS version.",
    "noOfferings": "No offerings in RevenueCat. Add a default offering and paywall in the dashboard.",
    "checkoutFailed": "Could not complete checkout.",
    "subscriptionNotCompleted": "Subscription was not completed.",
    "webNotConfigured": "RevenueCat Web is not configured (missing API key)."
  },
  "paymentProcessing": {
    "title": "Processing Payment",
    "subtitle": "Please wait while we confirm your payment. This usually takes a few seconds.",
    "missingInfo": "Missing payment information. Please restart onboarding.",
    "verificationSlow": "Payment verification is taking longer than expected. Please contact support.",
    "verificationFailed": "Unable to verify payment. Please contact support."
  },
  "webStripe": {
    "headline": "Your workspace is ready",
    "subtitle": "Boards for your focus areas, a plan to act on them, and reminders to keep you moving.",
    "priceLine": "Free for 3 days, then $9.99/month.",
    "cancelLine": "Cancel anytime.",
    "cta": "Start 3-Day Trial",
    "openingCheckout": "Openingâ€¦",
    "secondaryCta": "Not now",
    "features": [
      "Boards for life visions, home organization, office optimization and moodboarding",
      "Clippings, color, text, notes, and Structures",
      "Guidance from AI on board creation and reminder setting",
      "Text, email and calendar reminders"
    ]
  }
}


```

---

## src/i18n/locales/en/auth.json

```json
{
  "notFound": {
    "title": "404",
    "message": "Page not found",
    "redirecting": "Redirecting to home..."
  },
  "signIn": {
    "pageTitle": "Sign In | Palette Plotting",
    "title": "Sign In",
    "description": "Sign in to Continue",
    "emailLabel": "Email",
    "emailPlaceholder": "you@example.com",
    "passwordLabel": "Password",
    "passwordPlaceholder": "â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢",
    "forgotPasswordLink": "Forgot password?",
    "submit": "Sign In",
    "submitting": "Signing In...",
    "noAccount": "Don't have an account?",
    "signUp": "Sign Up"
  },
  "forgotPassword": {
    "checkEmailTitle": "Check your email",
    "checkEmailBody": "Check your email for a password reset link. Click the link to reset your password.",
    "backToSignIn": "Back to Sign In",
    "sendResetLink": "Send Reset Link",
    "sending": "Sending..."
  },
  "resetPassword": {
    "title": "Reset Password",
    "noSessionDescription": "Please click the link in your email to reset your password.",
    "description": "Enter your new password",
    "newPasswordLabel": "New Password",
    "newPasswordPlaceholder": "Enter new password",
    "confirmPasswordLabel": "Confirm New Password",
    "confirmPasswordPlaceholder": "Confirm new password",
    "validatingPassword": "Validating password...",
    "submit": "Reset Password",
    "submitting": "Resetting...",
    "backToSignIn": "Back to Sign In"
  },
  "activate": {
    "title": "Activate your plan",
    "subtitleWithTier": "You chose the {{tier}} plan ({{billing}}).",
    "subtitleDefault": "Complete setup to activate your subscription.",
    "billingMonthly": "monthly",
    "missingInfo": "Missing activation info. Please restart onboarding.",
    "restart": "Restart",
    "paymentNotConfirmed": "Payment not confirmed. Please ensure your payment was successful.",
    "goToSubscriptions": "Go to subscriptions",
    "accountCreatedTitle": "Account created successfully!",
    "accountCreatedBody": "Check your email to set your password. Once you've set your password, you can sign in to access your account.",
    "goToSignIn": "Go to Sign In",
    "waitingForAccount": "Waiting for account creation..."
  },
  "verifyEmail": {
    "verifying": "Verifyingâ€¦",
    "successTitle": "Email verified",
    "successBody": "You're all set.",
    "errorTitle": "Verification failed",
    "missingToken": "Missing token.",
    "verificationFailed": "Verification failed.",
    "requestNewEmail": "Please request a new verification email.",
    "goToDashboard": "Go to dashboard"
  },
  "toasts": {
    "usernameNotFound": "Username not found",
    "resetLinkSent": "Password reset link sent to your email",
    "resetLinkFailed": "Failed to send reset link. Please try again.",
    "passwordResetSuccess": "Password reset successfully. Please sign in.",
    "passwordResetFailed": "Failed to reset password. Please try again.",
    "accountCreated": "Account created! Check your email to set your password.",
    "activationLoadFailed": "Unable to load activation session. Please restart onboarding.",
    "accountCreationSlow": "Account creation is taking longer than expected. Please check your email or contact support."
  }
}


```

---

## src/i18n/locales/en/settings.json

```json
{
  "title": "Settings",
  "header": "Your Account",
  "tabs": {
    "profile": "Profile",
    "settings": "Settings",
    "billing": "Billing",
    "legal": "Legal"
  },
  "language": {
    "heading": "Language",
    "description": "Choose your app language."
  },
  "profile": {
    "nameLabel": "Name",
    "usernameLabel": "Username",
    "emailLabel": "Email",
    "emailCannotChange": "Email cannot be changed",
    "phoneLabel": "Phone Number",
    "updateButton": "Update Profile",
    "namePlaceholder": "Enter your name",
    "usernamePlaceholder": "Enter your username",
    "phonePlaceholder": "+1 (555) 123-4567",
    "codePlaceholder": "Enter 6-digit code",
    "sendCode": "Send Code",
    "sendingCode": "Sendingâ€¦",
    "verify": "Verify",
    "verifyPhoneHint": "Please verify your phone number to update it",
    "phoneVerified": "âœ“ Phone number verified",
    "newPhoneVerified": "âœ“ New phone number verified",
    "changePasswordHeading": "Change Password",
    "currentPasswordLabel": "Current Password",
    "newPasswordLabel": "New Password",
    "confirmPasswordLabel": "Confirm Password",
    "changePasswordButton": "Change Password",
    "validatingPassword": "Validating passwordâ€¦",
    "currentPasswordPlaceholder": "Enter current password",
    "newPasswordPlaceholder": "New password",
    "confirmPasswordPlaceholder": "Confirm password",
    "smsVerificationMessage": "Your verification code is: {{code}}"
  },
  "passwordValidation": {
    "minLength": "Password must be at least 8 characters long",
    "lowercase": "Password must contain at least one lowercase letter",
    "uppercase": "Password must contain at least one uppercase letter",
    "digit": "Password must contain at least one digit",
    "mismatch": "Passwords do not match"
  },
  "preferences": {
    "routineHeading": "Routine reminders",
    "routineDescription": "Adjust your daily rhythm, routine expectations, and reminder notifications.",
    "routineButtonTitle": "Routine & intensity",
    "routineButtonSubtitle": "Set routine intensity & notifications",
    "emailHeading": "Email preferences",
    "emailDescription": "Board tips, product updates, and app news by email.",
    "emailMarketingLabel": "Email updates",
    "textMarketingLabel": "Text updates",
    "dataTrainingHeading": "Data training",
    "dataTrainingDescription": "Help improve the experience by allowing anonymized usage to be used for model training. Default is off.",
    "dataTrainingLabel": "Allow data training",
    "timeZoneLabel": "Time zone",
    "planRemindersHeading": "Plan reminders",
    "planRemindersDescription": "Default channels and text reminder setup for dates, goals and next steps from The Plan.",
    "planRemindersButtonTitle": "Plan reminder preferences",
    "planRemindersButtonSubtitle": "Email, calendar export and text nudges"
  },
  "deletion": {
    "heading": "Delete account",
    "scheduledPrefix": "Your account is scheduled for deletion on",
    "scheduledSuffix": "You can cancel before then.",
    "description": "Permanently delete your account and all associated data. This cannot be undone and your data cannot be retrieved. Deletion is scheduled 30 days after you confirm.",
    "cancelRequest": "Cancel deletion request",
    "deleteButton": "Delete my account",
    "confirm1Title": "Delete your account?",
    "confirm1Body": "Your account and all associated data (profile, preferences, content) will be permanently deleted. You will not be able to retrieve or recover this data. This is a final decision. Do you want to continue?",
    "confirm2Title": "Final confirmation",
    "confirm2Body": "This is your last chance to cancel. Your account and all data will be permanently deleted and cannot be recovered. Are you sure you want to delete your account?",
    "deleting": "Deletingâ€¦",
    "scheduledFallback": "in 30 days",
    "scheduledToast": "Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings."
  },
  "billing": {
    "subscriptionHeading": "Subscription",
    "currentPlan": "Current Plan",
    "billingHeading": "Billing",
    "billingDescription": "Manage your subscription and payment methods",
    "manageBilling": "Manage Billing",
    "loadingOptions": "Loading billing optionsâ€¦",
    "portalHint": "Opens the customer portal to update payment or cancel your subscription.",
    "planMonthly": "Monthly",
    "planAnnual": "Annual",
    "planWeekly": "Weekly",
    "openingPortal": "Opening billing portalâ€¦",
    "trialActiveHeading": "Free trial active",
    "trialActiveDescription": "Board downloads and calendar export unlock when your paid subscription starts. Start billing now to unlock them immediately.",
    "endTrialEarly": "Start subscription now",
    "trialEnding": "Starting subscriptionâ€¦",
    "trialEndedNow": "Subscription started â€” downloads and calendar export are unlocked.",
    "trialEndedAlready": "Your subscription is already active."
  },
  "legal": {
    "heading": "Legal & Information",
    "faq": "FAQ",
    "terms": "Terms of Use",
    "privacy": "Privacy Policy",
    "acceptableUse": "Acceptable Use Policy",
    "billingRefunds": "Billing & Refunds",
    "dmca": "DMCA Notice & Takedown Policy",
    "contact": "Contact Us"
  },
  "routine": {
    "title": "Routine reminders",
    "subtitle": "Routine intensity and notifications",
    "backAria": "Back to settings",
    "loading": "Loading your routineâ€¦",
    "intensityHeading": "Routine intensity",
    "intensityDescription": "Adjust how often you want nudges and check-ins",
    "saveIntensity": "Save intensity",
    "saving": "Savingâ€¦",
    "notificationsHeading": "Routine notifications",
    "notificationsDescription": "Notifications support your routine â€” they nudge you back to the app.",
    "pushRemindersLabel": "In-app & push reminders",
    "dailyTimeHeading": "Daily notification time",
    "deviceDeniedHint": "Notifications are off at the device level. Your routine and boards will still work.",
    "intensity": {
      "light": {
        "title": "Light",
        "tagline": "The recommended routine.",
        "description": "A lighter rhythm with one daily notification if you opt in."
      },
      "consistent": {
        "title": "Consistent",
        "tagline": "Steady check-ins.",
        "description": "A steadier rhythm with up to 2 daily notifications if selected."
      },
      "locked_in": {
        "title": "Locked In",
        "tagline": "The highest-intensity routine.",
        "description": "More frequent nudges with up to 3 daily notifications if selected."
      }
    },
    "alerts": {
      "single": "Alert",
      "first": "1st Alert",
      "second": "2nd Alert",
      "third": "3rd Alert"
    },
    "itemLabels": {
      "boards_review": "Board review",
      "plan_steps": "Plan steps",
      "journal_entry": "Journal entry",
      "progress_review": "Progress review"
    }
  },
  "toasts": {
    "profileUpdated": "Profile updated successfully",
    "passwordUpdated": "Password updated successfully",
    "enterPhone": "Please enter a phone number",
    "codeSent": "Verification code sent!",
    "codeSendFailed": "Failed to send verification code. Please try again.",
    "phoneVerified": "Phone number verified and saved!",
    "invalidCode": "Invalid code. Please try again.",
    "usernameEmpty": "Username cannot be empty",
    "verifyPhoneFirst": "Please verify your new phone number before updating",
    "userNotFound": "User not found",
    "usernameTaken": "Username is already taken. Please choose another.",
    "usernameNotAllowed": "That username is not available. Please choose another.",
    "usernameValidationError": "Could not check that username. Please try again.",
    "profileUpdateError": "Error updating profile",
    "invalidPassword": "Invalid password",
    "passwordUpdateError": "Error updating password",
    "smsEnabled": "Text notifications enabled",
    "smsDisabled": "Text notifications disabled",
    "smsUpdateError": "Error updating SMS notification preference",
    "loginRequired": "Please log in to update preferences",
    "dataTrainingEnabled": "Data training opt-in enabled",
    "dataTrainingDisabled": "Data training opt-in disabled",
    "dataTrainingError": "Error updating data training preference",
    "deletionScheduled": "Your account is scheduled for deletion on {{date}}. You can log in before then to cancel in Settings.",
    "deletionFailed": "Could not schedule account deletion. Please try again or contact support@paletteplot.com.",
    "deletionCancelled": "Account deletion cancelled. Your account will not be deleted.",
    "deletionCancelFailed": "Could not cancel. Please try again or contact support@paletteplot.com.",
    "emailPrefError": "Error: {{message}}",
    "emailEnabled": "Email notifications enabled",
    "emailDisabled": "Email notifications disabled",
    "billingLoginRequired": "Please log in to manage billing",
    "playSubscriptionsFailed": "Could not open subscription management.",
    "iosSubscriptionsHint": "Manage billing is available from your iPhone in Settings > Apple ID > Subscriptions.",
    "portalFailed": "Could not open billing portal. Please try again.",
    "portalFailedFallback": "Could not open billing portal. Please try again or use the link in your subscription email.",
    "routineLoadFailed": "Could not load your routine settings.",
    "routineNotifUpdateFailed": "Could not update notification preference.",
    "routineNotifOff": "Routine notifications turned off",
    "routineNotifDenied": "Notification permission was denied.",
    "routineNotifDeniedIos": "Notifications are off in iOS Settings. Enable them there, then try again.",
    "routineNotifPermissionFailed": "Could not request notification permission.",
    "routineNotifOn": "Routine notifications enabled",
    "routineIntensitySaved": "Routine intensity updated",
    "routineIntensitySaveFailed": "Could not save your routine intensity.",
    "planRemindersLoadFailed": "Could not load plan reminder preferences.",
    "planRemindersSaveFailed": "Could not save plan reminder preferences.",
    "planSmsEnabled": "Text reminders turned on.",
    "planSmsDisabled": "Text reminders turned off.",
    "planPhoneSaved": "Phone number saved."
  },
  "legalDisclaimer": "",
  "planReminders": {
    "title": "Plan reminders",
    "subtitle": "Defaults for The Plan â€” per-step choices on Action still apply",
    "backAria": "Back to settings",
    "loading": "Loading your reminder preferencesâ€¦",
    "channelsHeading": "Default reminder channels",
    "channelsDescription": "These are your account defaults. Each next step on Action can still choose its own channels before you finalize.",
    "channelSystemLine": "Calendar = scheduled follow-through. Email = soft accountability. Text = stronger nudge.",
    "emailLabel": "Email reminders",
    "calendarLabel": "Calendar export",
    "calendarHint": "Calendar export is unlimited. Export from Action after you finalize a plan.",
    "smsHeading": "Text reminders",
    "smsDescription": "Short stronger nudges for important next steps. Not marketing texts.",
    "smsDailyLimit": "Up to 5 text reminders per day.",
    "smsCounter": "{{used}} of {{limit}} text reminders used",
    "smsLabel": "Text reminders",
    "phoneLabel": "Phone number for text reminders",
    "phoneHint": "Used only for text reminders you choose.",
    "phoneRequired": "Add a phone number before turning on text reminders.",
    "phoneInvalid": "Enter a valid U.S. phone number.",
    "consentRequired": "Please agree to receive text reminders.",
    "smsConsent": "I agree to receive text reminders for dates, goals and next steps I create in Palette. Message and data rates may apply. I can turn text reminders off anytime.",
    "turnOffSms": "Turn off text reminders",
    "savePhone": "Save phone number",
    "proRequired": "Text reminders require an active Palette Plotting plan.",
    "smsCharNote": "Text reminders are short by design â€” {{max}} characters max per message.",
    "perStepNote": "Tip: Open Action to set Calendar, Email or Text on individual next steps before finalizing."
  }
}


```

---

## supabase/functions/create-onboarding-checkout-session/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// NOTE: We intentionally inline this helper instead of importing from ../_shared
// because the Supabase deploy bundler does not always include sibling directories.
function getPriceIdForTier(tier: "basic" | "plus" | "premium", billing: "monthly" | "annual" | "weekly"): string {
  const config: Record<
    "basic" | "plus" | "premium",
    Record<"monthly" | "annual" | "weekly", string>
  > = {
    basic: {
      monthly: Deno.env.get("STRIPE_PRICE_BASIC_MONTHLY") || "",
      annual: Deno.env.get("STRIPE_PRICE_BASIC_ANNUAL") || "",
      weekly: "",
    },
    plus: {
      monthly: Deno.env.get("STRIPE_PRICE_PLUS_MONTHLY") || "",
      annual: Deno.env.get("STRIPE_PRICE_PLUS_ANNUAL") || "",
      weekly: "",
    },
    premium: {
      monthly: Deno.env.get("P_STRIPE_PRICE_PREMIUM_MONTHLY") || "",
      annual: Deno.env.get("P_STRIPE_PRICE_PREMIUM_ANNUAL") || "",
      weekly: Deno.env.get("STRIPE_PRICE_PREMIUM_WEEKLY") || "",
    },
  };
  return config[tier][billing];
}

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function encodeValue(value: string) {
  return encodeURIComponent(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: obSession, error: obErr } = await supabase
      .from("onboarding_sessions")
      .select("id,resume_token_hash,status,email,selected_tier,billing,user_id")
      .eq("id", String(sessionId))
      .maybeSingle();

    if (obErr || !obSession) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (obSession.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const tier = obSession.selected_tier as "basic" | "plus" | "premium" | null;
    const billing = obSession.billing as "monthly" | "annual" | "weekly" | null;
    if (!tier || !billing) {
      console.error("Plan not selected in session:", { sessionId, selected_tier: tier, billing });
      return new Response(
        JSON.stringify({ 
          error: "Plan not selected",
          details: `Session has tier: ${tier}, billing: ${billing}. Please select a plan first.`
        }), 
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const priceId = getPriceIdForTier(tier, billing);
    if (!priceId || !priceId.startsWith("price_")) {
      return new Response(JSON.stringify({ error: "Price ID not configured" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const requestOrigin = req.headers.get("origin") || req.headers.get("referer") || "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");

    // Stripe success redirect goes to payment processing page first (waits for webhook)
    const successUrl = `${baseUrl}/payment-processing?sid=${encodeURIComponent(String(sessionId))}&token=${encodeURIComponent(
      String(resumeToken),
    )}&checkout_session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${baseUrl}/onboarding/web-paywall`;

    // Create Stripe Checkout Session
    const formParts: string[] = [];
    formParts.push(`mode=${encodeValue("subscription")}`);
    formParts.push(`line_items[0][price]=${encodeValue(priceId)}`);
    formParts.push(`line_items[0][quantity]=${encodeValue("1")}`);
    formParts.push(`success_url=${encodeValue(successUrl)}`);
    formParts.push(`cancel_url=${encodeValue(cancelUrl)}`);
    
    // Prefill email if available
    if (obSession?.email) {
      formParts.push(`customer_email=${encodeValue(obSession.email)}`);
    }

    // Link back to onboarding session
    formParts.push(`client_reference_id=${encodeValue(String(sessionId))}`);
    formParts.push(`metadata[onboarding_session_id]=${encodeValue(String(sessionId))}`);
    formParts.push(`metadata[tier]=${encodeValue(tier)}`);
    formParts.push(`metadata[billing]=${encodeValue(billing)}`);
    // Subscription metadata: RevenueCat Stripe integration + renewal webhooks
    formParts.push(`subscription_data[metadata][onboarding_session_id]=${encodeValue(String(sessionId))}`);
    formParts.push(`subscription_data[metadata][tier]=${encodeValue(tier)}`);
    formParts.push(`subscription_data[metadata][billing]=${encodeValue(billing)}`);
    const obUserId = typeof obSession.user_id === "string" ? obSession.user_id.trim() : "";
    if (obUserId) {
      formParts.push(`metadata[user_id]=${encodeValue(obUserId)}`);
      formParts.push(`metadata[app_user_id]=${encodeValue(obUserId)}`);
      formParts.push(`subscription_data[metadata][user_id]=${encodeValue(obUserId)}`);
      formParts.push(`subscription_data[metadata][app_user_id]=${encodeValue(obUserId)}`);
    }

    // 3-day trial for monthly web subscription (auto-renews after trial when card is on file).
    if (billing === "monthly") {
      const trialDays = (Deno.env.get("STRIPE_TRIAL_DAYS") || "3").trim();
      formParts.push(`payment_method_collection=${encodeValue("always")}`);
      formParts.push(`subscription_data[trial_period_days]=${encodeValue(trialDays)}`);
      formParts.push(
        `subscription_data[trial_settings][end_behavior][missing_payment_method]=${encodeValue("cancel")}`,
      );
    }

    // Enable promo codes in Checkout
    formParts.push(`allow_promotion_codes=true`);

    const formBody = formParts.join("&");

    const sessionResponse = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formBody,
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error("Stripe checkout session error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to create checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await sessionResponse.json();

    // Save checkout session ID + status (do not mark paid here; webhook is source of truth)
    const { error: updateErr } = await supabase
      .from("onboarding_sessions")
      .update({
        stripe_checkout_session_id: session.id,
        status: "checkout_created",
      })
      .eq("id", String(sessionId));

    if (updateErr) {
      console.error("Error updating onboarding session with checkout id:", updateErr);
      // non-fatal; user can still complete checkout
    }

    return new Response(JSON.stringify({ url: session.url, sessionId: session.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in create-onboarding-checkout-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



```

---

## supabase/functions/get-onboarding-session/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken, checkoutSessionId } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: session, error } = await supabase
      .from("onboarding_sessions")
      .select(
        "id,resume_token_hash,status,email,first_name,username,app_notifications_consent,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at,expires_at",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (error || !session) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if session is expired (only for unclaimed sessions)
    if (session.expires_at && !session.user_id) {
      const expiresAt = new Date(session.expires_at);
      if (expiresAt < new Date()) {
        return new Response(JSON.stringify({ error: "Session expired" }), {
          status: 410, // Gone
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    let resultSession = session as any;

    const currentStatus = String(resultSession.status ?? "");
    const stripeCheckoutSessionId =
      typeof checkoutSessionId === "string" && checkoutSessionId.trim()
        ? checkoutSessionId.trim()
        : typeof resultSession.stripe_checkout_session_id === "string"
          ? resultSession.stripe_checkout_session_id.trim()
          : "";

    if (currentStatus !== "paid" && currentStatus !== "active" && stripeCheckoutSessionId) {
      const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
      if (stripeSecretKey) {
        const stripeResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${stripeCheckoutSessionId}`, {
          headers: { Authorization: `Bearer ${stripeSecretKey}` },
        });

        if (stripeResp.ok) {
          const checkout = await stripeResp.json();
          const clientReferenceId = typeof checkout.client_reference_id === "string" ? checkout.client_reference_id : "";
          const metadataSessionId =
            checkout.metadata && typeof checkout.metadata.onboarding_session_id === "string"
              ? checkout.metadata.onboarding_session_id
              : "";
          const belongsToSession =
            clientReferenceId === String(sessionId) || metadataSessionId === String(sessionId);
          const checkoutOk =
            checkout.status === "complete" &&
            (checkout.payment_status === "paid" ||
              (checkout.mode === "subscription" && checkout.payment_status === "no_payment_required"));

          if (belongsToSession && checkoutOk) {
            const customerId =
              typeof checkout.customer === "string" ? checkout.customer : checkout.customer?.id ?? null;
            const subscriptionId =
              typeof checkout.subscription === "string"
                ? checkout.subscription
                : checkout.subscription?.id ?? null;
            const customerEmail =
              checkout.customer_details?.email || checkout.customer_email || resultSession.stripe_customer_email || null;
            const tier = checkout.metadata?.tier || resultSession.selected_tier || null;
            const billing = checkout.metadata?.billing || resultSession.billing || null;
            const paidAt = resultSession.paid_at || new Date().toISOString();

            const { data: updated, error: updateError } = await supabase
              .from("onboarding_sessions")
              .update({
                status: "paid",
                stripe_checkout_session_id: stripeCheckoutSessionId,
                stripe_customer_id: customerId,
                stripe_customer_email: customerEmail,
                stripe_subscription_id: subscriptionId,
                selected_tier: tier,
                billing,
                paid_at: paidAt,
                updated_at: new Date().toISOString(),
              })
              .eq("id", String(sessionId))
              .select(
                "id,resume_token_hash,status,email,first_name,username,app_notifications_consent,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at,expires_at",
              )
              .maybeSingle();

            if (!updateError && updated) {
              resultSession = updated;
            } else if (updateError) {
              console.error("Failed to mark onboarding session paid from Stripe verification:", updateError);
            }
          }
        } else {
          console.error("Stripe checkout verification failed in get-onboarding-session:", await stripeResp.text());
        }
      }
    }

    // Do not return resume_token_hash
    const { resume_token_hash: _ignore, ...safeSession } = resultSession;

    return new Response(JSON.stringify({ session: safeSession }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in get-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



```

---

## supabase/functions/update-onboarding-session/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { normalizeConditionalSpecificity } from "../_shared/conditionalSpecificityNormalize.ts";
import { attributionPatchFromClient } from "../_shared/onboardingAttribution.ts";

/** Inlined: deploy bundle does not reliably include `../_shared/` for this helper. */
const EMBODY_ACTIVE_SLUGS = new Set([
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
]);

function normalizeEmbodyActivePractices(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  const cleaned: string[] = [];
  for (const x of value) {
    if (typeof x !== "string") return null;
    const s = x.trim();
    if (!EMBODY_ACTIVE_SLUGS.has(s)) return null;
    cleaned.push(s);
  }
  if (new Set(cleaned).size !== 5) return null;
  return cleaned;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

const SHELL_APPEARANCES = new Set(["light", "dark"]);

function normalizeShellAppearance(value: unknown): string | null {
  return typeof value === "string" && SHELL_APPEARANCES.has(value) ? value : null;
}

/** Normalized setup-path fields (mirrors app SetupDraft â†’ DB columns). */
type SetupPathPatch = {
  first_name?: string | null;
  email?: string | null;
  desire_category?: string | null;
  desire_text?: string | null;
  why_it_matters?: string | null;
  current_friction?: string | null;
  desired_identity?: string | null;
  tool_preferences?: string[] | null;
  conditional_specificity?: Record<string, unknown> | null;
  shell_appearance?: string | null;
  embody_active_practices?: string[] | null;
};

/** Deep-merge `setup_journey_v1` into session answers (alongside legacy `setup_path_v1` when used). */
function mergeSetupJourneyV1IntoOnboardingAnswers(
  sessionAnswers: unknown,
  existingPatchAnswers: unknown,
  journeySlice: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existingPatchAnswers && typeof existingPatchAnswers === "object" && existingPatchAnswers !== null
      ? { ...(existingPatchAnswers as Record<string, unknown>) }
      : sessionAnswers && typeof sessionAnswers === "object" && sessionAnswers !== null
        ? { ...(sessionAnswers as Record<string, unknown>) }
        : {};
  const prev =
    base.setup_journey_v1 && typeof base.setup_journey_v1 === "object" && base.setup_journey_v1 !== null
      ? { ...(base.setup_journey_v1 as Record<string, unknown>) }
      : {};
  base.setup_journey_v1 = { ...prev, ...journeySlice };
  return base;
}

type AllowedPatch = {
  email?: string | null;
  first_name?: string | null;
  username?: string | null;
  email_consent?: boolean | null;
  sms_consent?: boolean | null;
  app_notifications_consent?: boolean | null;
  tracking_pre_permission_choice?: string | null;
  tracking_authorization_status?: string | null;
  tracking_permission_asked_at?: string | null;
  onboarding_answers?: Record<string, unknown>;
  selected_tier?: "basic" | "plus" | "premium" | null;
  billing?: "monthly" | "annual" | "weekly" | null;
  /** Persisted to onboarding_sessions.onboarding_answers (setup_path_v1) and, if present, onboarding_session_setup. */
  setup_path?: SetupPathPatch;
  attribution?: {
    first_touch?: Record<string, unknown> | null;
    last_touch?: Record<string, unknown> | null;
    payload?: Record<string, unknown> | null;
  };
  revenuecat_app_user_id?: string | null;
  paywall_id?: string | null;
  paywall_variant?: string | null;
  offering_id?: string | null;
  package_id?: string | null;
  product_id?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken, patch } = await req.json();
    if (!sessionId || !resumeToken || !patch) {
      return new Response(JSON.stringify({ error: "Missing sessionId, resumeToken, or patch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: session, error: fetchErr } = await supabase
      .from("onboarding_sessions")
      .select(
        "id, resume_token_hash, status, onboarding_answers, user_id, email, first_touch_at, first_touch_source, attribution_payload",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (fetchErr || !session) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build safe updates only from allowed keys
    const allowedPatch = patch as AllowedPatch;
    const updates: Record<string, unknown> = {};

    if ("email" in allowedPatch) updates.email = allowedPatch.email;
    if ("first_name" in allowedPatch) updates.first_name = allowedPatch.first_name;
    if ("username" in allowedPatch) updates.username = allowedPatch.username;
    if ("email_consent" in allowedPatch) updates.email_consent = allowedPatch.email_consent;
    if ("sms_consent" in allowedPatch) updates.sms_consent = allowedPatch.sms_consent;
    if ("app_notifications_consent" in allowedPatch) {
      updates.app_notifications_consent = allowedPatch.app_notifications_consent;
    }
    if ("tracking_pre_permission_choice" in allowedPatch) {
      updates.tracking_pre_permission_choice = allowedPatch.tracking_pre_permission_choice;
    }
    if ("tracking_authorization_status" in allowedPatch) {
      updates.tracking_authorization_status = allowedPatch.tracking_authorization_status;
    }
    if ("tracking_permission_asked_at" in allowedPatch) {
      updates.tracking_permission_asked_at = allowedPatch.tracking_permission_asked_at;
    }
    if ("onboarding_answers" in allowedPatch) {
      const current =
        session?.onboarding_answers && typeof session.onboarding_answers === "object" && session.onboarding_answers !== null
          ? (session.onboarding_answers as Record<string, unknown>)
          : {};
      const patchAnswers =
        allowedPatch.onboarding_answers && typeof allowedPatch.onboarding_answers === "object" &&
          allowedPatch.onboarding_answers !== null
          ? (allowedPatch.onboarding_answers as Record<string, unknown>)
          : {};
      updates.onboarding_answers = { ...current, ...patchAnswers };
    }
    if ("selected_tier" in allowedPatch) updates.selected_tier = allowedPatch.selected_tier;
    if ("billing" in allowedPatch) updates.billing = allowedPatch.billing;
    if ("revenuecat_app_user_id" in allowedPatch) {
      updates.revenuecat_app_user_id = allowedPatch.revenuecat_app_user_id;
    }
    if ("paywall_id" in allowedPatch) updates.paywall_id = allowedPatch.paywall_id;
    if ("paywall_variant" in allowedPatch) updates.paywall_variant = allowedPatch.paywall_variant;
    if ("offering_id" in allowedPatch) updates.offering_id = allowedPatch.offering_id;
    if ("package_id" in allowedPatch) updates.package_id = allowedPatch.package_id;
    if ("product_id" in allowedPatch) updates.product_id = allowedPatch.product_id;

    if ("attribution" in allowedPatch && allowedPatch.attribution) {
      const attrPatch = attributionPatchFromClient(
        session as Record<string, unknown>,
        allowedPatch.attribution,
      );
      Object.assign(updates, attrPatch);
    }

    // If the user is choosing a plan / editing plan, move to started unless already beyond paid
    // (We don't want accidental regressions from 'paid'/'active')
    if (session.status === "started" || session.status === "checkout_created") {
      // keep current
    }

    if (
      "setup_path" in allowedPatch &&
      allowedPatch.setup_path &&
      typeof allowedPatch.setup_path === "object"
    ) {
      const sp = allowedPatch.setup_path as SetupPathPatch;
      const spec =
        sp.conditional_specificity &&
        typeof sp.conditional_specificity === "object" &&
        sp.conditional_specificity !== null
          ? sp.conditional_specificity
          : {};

      const desireCatRaw = typeof sp.desire_category === "string" ? sp.desire_category : null;
      const normalizedConditional = normalizeConditionalSpecificity(spec, desireCatRaw);

      const shellAppearance = normalizeShellAppearance(sp.shell_appearance);
      const embodySlugs = normalizeEmbodyActivePractices(sp.embody_active_practices);

      const pathRow = {
        onboarding_session_id: String(sessionId),
        first_name: typeof sp.first_name === "string" ? sp.first_name : null,
        email: typeof sp.email === "string" ? sp.email : null,
        desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
        desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
        why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
        current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
        desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
        tool_preferences: Array.isArray(sp.tool_preferences)
          ? (sp.tool_preferences as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
        conditional_specificity: normalizedConditional,
      };

      const journeySlice: Record<string, unknown> = {
        schema_version: 1,
        updated_at: new Date().toISOString(),
        desire_category: pathRow.desire_category,
        conditional_specificity: normalizedConditional,
      };
      if (pathRow.first_name != null) journeySlice.first_name = pathRow.first_name;
      if (pathRow.email != null) journeySlice.email = pathRow.email;
      if (pathRow.desire_text != null) journeySlice.desire_text = pathRow.desire_text;
      if (pathRow.why_it_matters != null) journeySlice.why_it_matters = pathRow.why_it_matters;
      if (pathRow.current_friction != null) journeySlice.current_friction = pathRow.current_friction;
      if (pathRow.desired_identity != null) journeySlice.desired_identity = pathRow.desired_identity;
      if (pathRow.tool_preferences.length > 0) journeySlice.tool_preferences = pathRow.tool_preferences;
      if (shellAppearance != null) journeySlice.shell_appearance = shellAppearance;
      if (embodySlugs) journeySlice.embody_active_practices = embodySlugs;

      updates.shell_appearance = shellAppearance;

      const { error: pathErr } = await supabase
        .from("onboarding_session_setup")
        .upsert(pathRow, { onConflict: "onboarding_session_id" });

      if (pathErr) {
        const msg = pathErr.message || "";
        const tableMissing =
          pathErr.code === "42P01" ||
          msg.includes("does not exist") ||
          msg.includes("schema cache") ||
          msg.includes("onboarding_session_setup");
        if (tableMissing) {
          const setupPathV1: Record<string, unknown> = { ...pathRow };
          delete setupPathV1.onboarding_session_id;
          const mergedJourney = mergeSetupJourneyV1IntoOnboardingAnswers(
            session.onboarding_answers,
            updates.onboarding_answers,
            journeySlice,
          );
          updates.onboarding_answers = { ...mergedJourney, setup_path_v1: setupPathV1 };
          console.warn(
            "onboarding_session_setup unavailable; persisted setup_path to onboarding_sessions.onboarding_answers.setup_path_v1",
          );
        } else {
          console.error("onboarding_session_setup upsert error (falling back to JSON):", pathErr);
          const setupPathV1: Record<string, unknown> = { ...pathRow };
          delete setupPathV1.onboarding_session_id;
          const mergedJourney = mergeSetupJourneyV1IntoOnboardingAnswers(
            session.onboarding_answers,
            updates.onboarding_answers,
            journeySlice,
          );
          updates.onboarding_answers = { ...mergedJourney, setup_path_v1: setupPathV1 };
        }
      } else {
        updates.onboarding_answers = mergeSetupJourneyV1IntoOnboardingAnswers(
          session.onboarding_answers,
          updates.onboarding_answers,
          journeySlice,
        );
      }
    }

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData } = await supabase.auth.getUser(token);
      const authUser = authData?.user;
      if (authUser?.id) {
        const sessionUserId = typeof session.user_id === "string" ? session.user_id : null;
        if (!sessionUserId || sessionUserId === authUser.id) {
          const patchEmail =
            typeof allowedPatch.email === "string" ? allowedPatch.email.trim().toLowerCase() : null;
          const sessionEmail =
            typeof session.email === "string" ? session.email.trim().toLowerCase() : null;
          const authEmail = authUser.email?.trim().toLowerCase() ?? null;
          const emailsAlign =
            !authEmail ||
            ((!patchEmail && !sessionEmail) ||
              patchEmail === authEmail ||
              sessionEmail === authEmail);
          if (emailsAlign) {
            updates.user_id = authUser.id;
          }
        }
      }
    }

    const hasSessionColumnUpdates = Object.keys(updates).length > 0;

    let updated: Record<string, unknown> | null = null;

    if (hasSessionColumnUpdates) {
      const { data: upd, error: updateErr } = await supabase
        .from("onboarding_sessions")
        .update(updates)
        .eq("id", String(sessionId))
        .select(
          "id,status,email,first_name,username,email_consent,sms_consent,app_notifications_consent,tracking_pre_permission_choice,tracking_authorization_status,tracking_permission_asked_at,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at",
        )
        .single();

      if (updateErr) {
        console.error("Error updating onboarding session:", updateErr);
        return new Response(JSON.stringify({ error: "Failed to update onboarding session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = upd as Record<string, unknown>;
    } else {
      const { data: refetch, error: refetchErr } = await supabase
        .from("onboarding_sessions")
        .select(
          "id,status,email,first_name,username,email_consent,sms_consent,app_notifications_consent,tracking_pre_permission_choice,tracking_authorization_status,tracking_permission_asked_at,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at",
        )
        .eq("id", String(sessionId))
        .single();

      if (refetchErr) {
        console.error("Error loading onboarding session:", refetchErr);
        return new Response(JSON.stringify({ error: "Failed to load onboarding session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = refetch as Record<string, unknown>;
    }

    return new Response(JSON.stringify({ session: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in update-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



```

---

## supabase/functions/create-onboarding-session/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { attributionInsertFromClient } from "../_shared/onboardingAttribution.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return toHex(bytes);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const resumeToken = randomToken();
    const resumeTokenHash = await sha256Hex(resumeToken);

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }
    const attributionInput =
      body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : {};
    const attributionColumns = attributionInsertFromClient({
      first_touch: attributionInput.first_touch as Record<string, unknown> | null,
      last_touch: attributionInput.last_touch as Record<string, unknown> | null,
      payload: attributionInput.payload as Record<string, unknown> | null,
    });

    const { data, error } = await supabase
      .from("onboarding_sessions")
      .insert({
        resume_token_hash: resumeTokenHash,
        status: "started",
        ...attributionColumns,
      })
      .select("id, status, created_at")
      .single();

    if (error) {
      console.error("Error creating onboarding session:", error);
      return new Response(
        JSON.stringify({ 
          error: "Failed to create onboarding session",
          details: error.message,
          hint: error.message?.includes("relation") || error.message?.includes("does not exist") 
            ? "The onboarding_sessions table may not exist. Please apply the migration: 20260101000000_create_onboarding_sessions_and_email_verification.sql"
            : undefined
        }), 
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        sessionId: data.id,
        resumeToken,
        status: data.status,
        createdAt: data.created_at,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("Unhandled error in create-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



```

---

## supabase/functions/claim-onboarding-session/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/** Inlined: deploy bundle does not reliably include `../_shared/` (matches app embody slug set). */
const EMBODY_ACTIVE_SLUGS = new Set([
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
]);

function normalizeEmbodyActivePractices(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  const cleaned: string[] = [];
  for (const x of value) {
    if (typeof x !== "string") return null;
    const s = x.trim();
    if (!EMBODY_ACTIVE_SLUGS.has(s)) return null;
    cleaned.push(s);
  }
  if (new Set(cleaned).size !== 5) return null;
  return cleaned;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

const SHELL_APPEARANCES = ["light", "dark"] as const;

function pickShellAppearance(value: unknown): string | null {
  return typeof value === "string" && (SHELL_APPEARANCES as readonly string[]).includes(value) ? value : null;
}

type ActivationProfile = {
  firstName?: string | null;
  username?: string | null;
  emailMarketingConsent?: boolean | null;
  smsMarketingConsent?: boolean | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { sessionId, resumeToken, checkoutSessionId, profile } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: obSession, error: obErr } = await supabase
      .from("onboarding_sessions")
      .select(
        "id,resume_token_hash,status,email,first_name,username,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (obErr || !obSession) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (obSession.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent a paid session from being claimed by a different user once linked
    // But allow idempotent claims by the same user (in case of retries or partial completions)
    if (obSession.user_id) {
      if (obSession.user_id !== user.id) {
        console.error("Session already claimed by different user", {
          sessionUserId: obSession.user_id,
          currentUserId: user.id,
          sessionId: sessionId
        });
        return new Response(JSON.stringify({ error: "Session already claimed by another user" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Session already claimed by this user - allow idempotent completion
        console.log("Session already claimed by this user, completing activation idempotently", {
          userId: user.id,
          sessionId: sessionId,
          sessionStatus: obSession.status
        });
      }
    }

    const csId = String(checkoutSessionId || obSession.stripe_checkout_session_id || "");
    if (!csId) {
      return new Response(JSON.stringify({ error: "Missing Stripe checkout session id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Stripe checkout session (authoritative) and verify it belongs to this onboarding session
    const csResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${csId}`, {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
    });

    if (!csResp.ok) {
      const txt = await csResp.text();
      console.error("Stripe checkout session fetch failed:", txt);
      return new Response(JSON.stringify({ error: "Unable to verify payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cs = await csResp.json();
    const clientRef = cs.client_reference_id;
    if (clientRef && String(clientRef) !== String(sessionId)) {
      return new Response(JSON.stringify({ error: "Checkout session does not match onboarding session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutOk =
      cs.payment_status === "paid" ||
      (cs.mode === "subscription" && cs.payment_status === "no_payment_required");
    if (!checkoutOk) {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId: string | null = typeof cs.customer === "string" ? cs.customer : cs.customer?.id || null;
    const subscriptionId: string | null =
      typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id || null;

    const tierFromStripe = cs.metadata?.tier as "basic" | "plus" | "premium" | undefined;
    const billingFromStripe = cs.metadata?.billing as "monthly" | "annual" | undefined;
    const tier = (obSession.selected_tier || tierFromStripe) as "basic" | "plus" | "premium" | null;
    const billing = (obSession.billing || billingFromStripe) as "monthly" | "annual" | null;

    if (!tier || !["basic", "plus", "premium"].includes(tier)) {
      return new Response(JSON.stringify({ error: "Missing tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine current_period_end (for subscription mode)
    let currentPeriodEndIso: string | null = null;
    let subscriptionStatus: string | null = null;
    let subscriptionOnTrial = false;
    let subscriptionHadTrial = false;

    if (subscriptionId) {
      const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      if (subResp.ok) {
        const sub = await subResp.json();
        subscriptionStatus = sub.status || null;
        subscriptionOnTrial = sub.status === "trialing";
        subscriptionHadTrial = typeof sub.trial_start === "number" && sub.trial_start > 0;
        if (sub.current_period_end) {
          currentPeriodEndIso = new Date(sub.current_period_end * 1000).toISOString();
        }
      }
    } else if (billing === "annual") {
      // Fallback for one-time annual (not expected in current setup, but safe)
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      currentPeriodEndIso = periodEnd.toISOString();
    }

    const paidAtIso = obSession.paid_at ? new Date(obSession.paid_at).toISOString() : new Date().toISOString();
    const customerEmail =
      obSession.stripe_customer_email || cs.customer_details?.email || cs.customer_email || null;

    // 1) Attach onboarding session to user + persist stripe linkage (idempotent)
    const { error: attachErr } = await supabase
      .from("onboarding_sessions")
      .update({
        user_id: user.id,
        status: "active",
        stripe_checkout_session_id: csId,
        stripe_customer_id: customerId,
        stripe_customer_email: customerEmail,
        stripe_subscription_id: subscriptionId,
        paid_at: obSession.paid_at || paidAtIso,
        selected_tier: tier,
        billing: billing,
      })
      .eq("id", String(sessionId));

    if (attachErr) {
      console.error("Error attaching onboarding session:", attachErr);
      return new Response(JSON.stringify({ error: "Failed to activate session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Upsert entitlement (user_plans is the gating source of truth)
    const planStatus =
      subscriptionStatus === "trialing"
        ? "trialing"
        : subscriptionStatus === "past_due"
          ? "past_due"
          : subscriptionStatus === "canceled"
            ? "canceled"
            : "active";

    // Upsert user_plans - don't include id, let PostgreSQL generate it via DEFAULT
    // The onConflict uses user_id (which has UNIQUE constraint) to match existing rows
    const { error: planErr } = await supabase
      .from("user_plans")
      .upsert(
        {
          user_id: user.id,
          tier,
          billing_period: billing ?? "monthly",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          last_payment_source: "stripe",
          status: planStatus,
          on_trial: subscriptionOnTrial,
          had_trial: subscriptionHadTrial || subscriptionOnTrial,
          current_period_end: currentPeriodEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (planErr) {
      console.error("Error upserting user_plans:", planErr);
      return new Response(JSON.stringify({ error: "Failed to activate plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Persist onboarding data into canonical user tables
    const activationProfile = (profile || {}) as ActivationProfile;

    // Legacy JSON (e.g. support_focus) â€” keep on profiles.onboarding_answers where that column exists
    const mergedOnboardingAnswers: Record<string, unknown> =
      obSession.onboarding_answers && typeof obSession.onboarding_answers === "object" &&
        obSession.onboarding_answers !== null
        ? { ...(obSession.onboarding_answers as Record<string, unknown>) }
        : {};
    const legacySetupAppearance = pickShellAppearance(mergedOnboardingAnswers["setup_appearance"]);
    delete mergedOnboardingAnswers["setup_appearance"];

    const legacyJourney =
      mergedOnboardingAnswers &&
      typeof mergedOnboardingAnswers === "object" &&
      Object.prototype.hasOwnProperty.call(mergedOnboardingAnswers, "setup_journey_v1")
        ? (mergedOnboardingAnswers as Record<string, unknown>).setup_journey_v1
        : null;

    // profiles: update (or insert if missing)
    // Use first_name from onboarding_sessions if not provided in profile
    const finalFirstName = activationProfile.firstName || obSession.first_name || null;
    // Use username from onboarding_sessions column if not provided in profile
    const finalUsername = activationProfile.username || obSession.username || null;
    // Use consents from onboarding_sessions columns if not provided in profile
    const finalEmailConsent = activationProfile.emailMarketingConsent ?? obSession.email_consent ?? false;
    const finalSmsConsent = activationProfile.smsMarketingConsent ?? obSession.sms_consent ?? false;

    // Routine reminders + app notifications are applied via sync-revenuecat-entitlement
    // (gatherOnboardingPrefs from setup draft). This legacy Stripe Checkout claim path does not write them.

    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: finalFirstName,
          username: finalUsername,
          onboarding_answers: mergedOnboardingAnswers,
        },
        { onConflict: "id" },
      );
    } catch (e) {
      console.warn("Non-fatal: failed to upsert profiles:", e);
    }

    // Normalized setup path â†’ user_setup_path. Anonymous answers usually live on
    // onboarding_sessions.onboarding_answers (setup_path_v1 / setup_journey_v1); optional
    // onboarding_session_setup row is read first when that table exists.
    let embodyForUserPrefs: string[] | null = null;
    try {
      const { data: sessionPath, error: sessionPathErr } = await supabase
        .from("onboarding_session_setup")
        .select("*")
        .eq("onboarding_session_id", String(sessionId))
        .maybeSingle();

      if (sessionPathErr) {
        console.warn("onboarding_session_setup read skipped:", sessionPathErr.message);
      }

      let pathPayload: Record<string, unknown> | null = null;

      if (!sessionPathErr && sessionPath && typeof sessionPath === "object") {
        const sp = sessionPath as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof sp.first_name === "string" ? sp.first_name : null,
          email: typeof sp.email === "string" ? sp.email : null,
          desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
          desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
          why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
          current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
          desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
          tool_preferences: Array.isArray(sp.tool_preferences) ? sp.tool_preferences : [],
          conditional_specificity:
            sp.conditional_specificity && typeof sp.conditional_specificity === "object" &&
              sp.conditional_specificity !== null
              ? sp.conditional_specificity
              : {},
          embody_active_practices: normalizeEmbodyActivePractices(sp.embody_active_practices),
        };
      } else if (legacyJourney && typeof legacyJourney === "object") {
        const j = legacyJourney as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof j.firstName === "string" ? j.firstName : null,
          email: typeof j.email === "string" ? j.email : null,
          desire_category: typeof j.desireCategory === "string" ? j.desireCategory : null,
          desire_text: typeof j.desireText === "string" ? j.desireText : null,
          why_it_matters: typeof j.whyItMatters === "string" ? j.whyItMatters : null,
          current_friction: typeof j.currentFriction === "string" ? j.currentFriction : null,
          desired_identity: typeof j.desiredIdentity === "string" ? j.desiredIdentity : null,
          tool_preferences: Array.isArray(j.toolPreferences)
            ? (j.toolPreferences as unknown[]).filter((x): x is string => typeof x === "string")
            : [],
          conditional_specificity:
            j.conditionalSpecificity && typeof j.conditionalSpecificity === "object" && j.conditionalSpecificity !== null
              ? j.conditionalSpecificity
              : {},
          embody_active_practices: normalizeEmbodyActivePractices(
            (j as Record<string, unknown>).embody_active_practices ??
              (j as Record<string, unknown>).embodyActivePractices,
          ),
        };
      } else if (
        typeof mergedOnboardingAnswers.setup_path_v1 === "object" &&
        mergedOnboardingAnswers.setup_path_v1 !== null
      ) {
        const sp = mergedOnboardingAnswers.setup_path_v1 as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof sp.first_name === "string" ? sp.first_name : null,
          email: typeof sp.email === "string" ? sp.email : null,
          desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
          desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
          why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
          current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
          desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
          tool_preferences: Array.isArray(sp.tool_preferences) ? sp.tool_preferences : [],
          conditional_specificity:
            sp.conditional_specificity && typeof sp.conditional_specificity === "object" &&
              sp.conditional_specificity !== null
              ? sp.conditional_specificity
              : {},
          embody_active_practices: normalizeEmbodyActivePractices(sp.embody_active_practices),
        };
      }

      if (pathPayload) {
        embodyForUserPrefs = normalizeEmbodyActivePractices(pathPayload.embody_active_practices);
        const { error: pathUpsertErr } = await supabase
          .from("user_setup_path")
          .upsert(pathPayload, { onConflict: "user_id" });
        if (pathUpsertErr) {
          console.warn("Non-fatal: user_setup_path upsert failed:", pathUpsertErr);
        }
      }
    } catch (pathErr) {
      console.warn("Non-fatal: user_setup_path copy skipped:", pathErr);
    }

    // user_preferences: comms prefs + embody (from same pathPayload as user_setup_path)
    try {
      const prefRow: Record<string, unknown> = {
        user_id: user.id,
        texts_enabled: finalSmsConsent,
        preferred_send_window: "both",
        email_marketing: finalEmailConsent,
      };
      if (embodyForUserPrefs) prefRow.embody_active_practices = embodyForUserPrefs;

      await supabase.from("user_preferences").upsert(prefRow, { onConflict: "user_id" });
    } catch (e) {
      console.warn("Non-fatal: failed to upsert user_preferences:", e);
    }

    return new Response(JSON.stringify({ success: true, tier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in claim-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});



```

---

## supabase/functions/confirm-subscription/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { postStripePurchaseToRevenueCat } from "../_shared/postStripeToRevenueCat.ts";
import { attachAppUserIdToStripeSubscription } from "../_shared/stripeSubscriptionMetadata.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// Allowed origins for CORS
const getAllowedOrigin = (origin: string | null): string => {
  if (!origin) {
    return '*';
  }
  
  const allowedOrigins = [
    'https://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://127.0.0.1:8080',
    'https://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
  ];
  
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  if (allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }
  
  if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
    return normalizedOrigin;
  }
  
  return '*';
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
});

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle OPTIONS preflight request - MUST return immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0',
      }
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    const { sessionId } = await req.json();

    if (!sessionId) {
      throw new Error('sessionId is required');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('Not configured');
    }

    // Retrieve Checkout Session from Stripe
    const sessionResponse = await fetch(
      `https://api.stripe.com/v1/checkout/sessions/${sessionId}`,
      {
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
        },
      }
    );

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Failed to retrieve checkout session:', errorText);
      throw new Error('Failed to retrieve checkout session');
    }

    const session = await sessionResponse.json();

    // Paid checkout, or subscription with trial / no immediate charge
    const paymentOk =
      session.payment_status === 'paid' ||
      (session.mode === 'subscription' &&
        session.payment_status === 'no_payment_required');
    if (!paymentOk) {
      throw new Error(`Payment not completed. Status: ${session.payment_status}`);
    }

    // Security check: verify the session belongs to the authenticated user
    const sessionUserId = session.metadata?.user_id;
    if (sessionUserId && sessionUserId !== user.id) {
      console.error(`Session user_id (${sessionUserId}) does not match authenticated user (${user.id})`);
      throw new Error('Checkout session does not belong to authenticated user');
    }

    // Get tier from session metadata (set during checkout creation)
    const tier = session.metadata?.tier;
    if (!tier || !['basic', 'plus', 'premium'].includes(tier)) {
      console.error('Invalid or missing tier in session metadata:', tier);
      throw new Error('Invalid tier in checkout session');
    }

    // Get customer ID from session
    const customerId = typeof session.customer === 'string' 
      ? session.customer 
      : session.customer?.id;

    if (!customerId) {
      throw new Error('No customer ID in checkout session');
    }

    const metaBilling = session.metadata?.billing;
    const billingFromMetadata =
      metaBilling === 'annual' || metaBilling === 'monthly' || metaBilling === 'weekly'
        ? metaBilling
        : null;

    const { data: existingPlan } = await supabase
      .from('user_plans')
      .select('first_billing_source')
      .eq('user_id', user.id)
      .maybeSingle();

    // user_plans upsert â€” column names match public.user_plans
    const planData: Record<string, unknown> = {
      user_id: user.id,
      tier: tier,
      stripe_customer_id: customerId,
      stripe_customer_id_official: customerId,
      last_payment_source: 'stripe',
      status: 'active',
      had_trial: false,
      on_trial: false,
      current_period_end: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    if (!existingPlan?.first_billing_source) {
      planData.first_billing_source = 'stripe';
    }

    // Handle subscription vs one-time payment
    if (session.mode === 'subscription') {
      // Subscription mode: get subscription ID and details
      const subscriptionIdFromSession = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription?.id;

      if (!subscriptionIdFromSession) {
        throw new Error('No subscription ID in checkout session');
      }

      // Get subscription details to get period end
      const subscriptionResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscriptionIdFromSession}`,
        {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (!subscriptionResponse.ok) {
        const errorText = await subscriptionResponse.text();
        console.error('Failed to retrieve subscription:', errorText);
        throw new Error('Failed to retrieve subscription');
      }

      const subscription = await subscriptionResponse.json();

      planData.stripe_subscription_id = subscriptionIdFromSession;
      planData.current_period_end = new Date(subscription.current_period_end * 1000).toISOString();
      planData.status =
        subscription.status === 'active'
          ? 'active'
          : subscription.status === 'past_due'
            ? 'past_due'
            : subscription.status === 'canceled'
              ? 'canceled'
              : subscription.status === 'trialing'
                ? 'trialing'
                : 'active';

      const interval =
        subscription.items?.data?.[0]?.price?.recurring?.interval as
          | string
          | undefined;
      planData.billing_period =
        billingFromMetadata ??
        (interval === 'year'
          ? 'annual'
          : interval === 'week'
            ? 'weekly'
            : 'monthly');

      const nowSec = Date.now() / 1000;
      const trialEnd = subscription.trial_end as number | undefined;
      const trialStart = subscription.trial_start as number | undefined;
      planData.on_trial =
        subscription.status === 'trialing' ||
        (typeof trialEnd === 'number' && trialEnd > nowSec);
      planData.had_trial =
        typeof trialStart === 'number' && trialStart > 0;
    } else {
      // Payment mode: one-time payment (annual)
      planData.billing_period = billingFromMetadata ?? 'annual';
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      planData.current_period_end = periodEnd.toISOString();
    }

    // Update user_plans table (single source of truth for tiers)
    const { error: planError } = await supabase
      .from('user_plans')
      .upsert(planData, {
        onConflict: 'user_id',
      });

    if (planError) {
      console.error('Database error updating user_plans:', planError);
      throw new Error(`Failed to save subscription: ${planError.message}`);
    }

    const rcFetchToken =
      session.mode === "subscription" && planData.stripe_subscription_id
        ? String(planData.stripe_subscription_id)
        : String(sessionId);
    if (session.mode === "subscription" && planData.stripe_subscription_id) {
      await attachAppUserIdToStripeSubscription(
        stripeSecretKey,
        String(planData.stripe_subscription_id),
        user.id,
      );
    }
    await postStripePurchaseToRevenueCat(user.id, rcFetchToken);

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in confirm-subscription:', error);
    // Always return CORS headers, even on error
    const errorOrigin = req.headers.get('origin') || req.headers.get('referer') || '*';
    const errorCorsHeaders = getCorsHeaders(errorOrigin);
    
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { 
          ...errorCorsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});



```

---

## supabase/functions/verify-checkout-session/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    const { checkoutSessionId } = await req.json();
    if (!checkoutSessionId) {
      return new Response(JSON.stringify({ error: "Missing checkoutSessionId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check checkout session status directly from Stripe
    const response = await fetch(`https://api.stripe.com/v1/checkout/sessions/${checkoutSessionId}`, {
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Stripe API error:", errorText);
      return new Response(JSON.stringify({ error: "Failed to verify checkout session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const session = await response.json();

    // Paid checkout, or subscription with trial / no immediate charge
    const checkoutOk =
      session.payment_status === "paid" ||
      (session.mode === "subscription" &&
        session.payment_status === "no_payment_required");
    const isPaid = session.status === "complete" && checkoutOk;

    return new Response(
      JSON.stringify({ 
        paid: isPaid,
        payment_status: session.payment_status,
        status: session.status,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("Unhandled error in verify-checkout-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


```

---

## supabase/functions/stripe-webhook/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { postStripePurchaseToRevenueCat } from "../_shared/postStripeToRevenueCat.ts";
import { attachAppUserIdToStripeSubscription } from "../_shared/stripeSubscriptionMetadata.ts";
import { GUIDE_PRODUCT_SLUG, grantGuideEntitlement } from "../_shared/digitalGuide.ts";

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle OPTIONS preflight immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  // Log incoming request for debugging
  console.log('Webhook request received:', {
    method: req.method,
    url: req.url,
    hasStripeSignature: !!req.headers.get('stripe-signature'),
    hasAuthorization: !!req.headers.get('authorization'),
    hasApikey: !!req.headers.get('apikey'),
  });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Get the raw body first (needed for signature verification)
    const body = await req.text();
    
    // Get the signature from the request headers
    const signature = req.headers.get('stripe-signature');
    
    // Verify webhook signature when the secret is configured (Stripe's t=/v1= scheme).
    if (webhookSecret) {
      if (!signature) {
        console.warn('STRIPE_WEBHOOK_SECRET configured but no signature in request');
        return new Response(JSON.stringify({ error: 'Missing signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      let sigTimestamp = '';
      const sigCandidates: string[] = [];
      for (const part of signature.split(',')) {
        const [k, v] = part.trim().split('=');
        if (k === 't') sigTimestamp = v;
        else if (k === 'v1' && v) sigCandidates.push(v);
      }

      const ts = Number(sigTimestamp);
      // Reject stale events (>5 min) to prevent replay.
      const withinTolerance =
        Number.isFinite(ts) && Math.abs(Math.floor(Date.now() / 1000) - ts) <= 300;

      let signatureValid = false;
      if (sigTimestamp && sigCandidates.length > 0 && withinTolerance) {
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhookSecret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );
        const sigBytes = await crypto.subtle.sign(
          'HMAC',
          key,
          encoder.encode(`${sigTimestamp}.${body}`),
        );
        const expected = Array.from(new Uint8Array(sigBytes))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        // Constant-time compare against each provided v1 signature.
        signatureValid = sigCandidates.some((candidate) => {
          if (candidate.length !== expected.length) return false;
          let mismatch = 0;
          for (let i = 0; i < expected.length; i++) {
            mismatch |= candidate.charCodeAt(i) ^ expected.charCodeAt(i);
          }
          return mismatch === 0;
        });
      }

      if (!signatureValid) {
        console.warn('Stripe webhook signature verification failed');
        return new Response(JSON.stringify({ error: 'Invalid signature' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    } else {
      console.warn('STRIPE_WEBHOOK_SECRET not configured, skipping signature verification (not recommended for production)');
    }

    // Parse the event
    let event;
    try {
      event = JSON.parse(body);
    } catch (e) {
      console.error('Failed to parse webhook body:', e);
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('Stripe webhook event received:', event.type, 'ID:', event.id);

    // Handle different event types with error handling to prevent 500 responses
    switch (event.type) {
      case 'checkout.session.completed':
        try {
        await handleCheckoutSessionCompleted(supabase, event.data.object, stripeSecretKey);
        } catch (handlerError) {
          console.error('Error in handleCheckoutSessionCompleted:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        try {
        await handleSubscriptionUpdate(supabase, event.data.object, stripeSecretKey);
        } catch (handlerError) {
          console.error('Error in handleSubscriptionUpdate:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      case 'customer.subscription.deleted':
        try {
        await handleSubscriptionCancellation(supabase, event.data.object);
        } catch (handlerError) {
          console.error('Error in handleSubscriptionCancellation:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      case 'invoice.payment_succeeded':
        try {
        await handleInvoicePaymentSucceeded(supabase, event.data.object);
        } catch (handlerError) {
          console.error('Error in handleInvoicePaymentSucceeded:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      case 'invoice.payment_failed':
        try {
        await handleInvoicePaymentFailed(supabase, event.data.object);
        } catch (handlerError) {
          console.error('Error in handleInvoicePaymentFailed:', handlerError);
          console.error('Error stack:', handlerError instanceof Error ? handlerError.stack : 'No stack trace');
          // Don't throw - return 200 to prevent Stripe retries
        }
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(
      JSON.stringify({ received: true }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in stripe-webhook:', error);
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

// Map Stripe Product ID to tier (fallback)
function getTierFromProductId(productId: string): 'basic' | 'plus' | 'premium' | null {
  // Product ID mapping removed - use Price IDs from environment variables instead
  // Price IDs are the preferred method and are environment-driven
  return null;
}

// Map Stripe Price ID to tier
function getTierFromPriceId(priceId: string): 'basic' | 'plus' | 'premium' | null {
  const config = {
    basic: {
      monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || '',
    },
    plus: {
      monthly: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL') || '',
    },
    premium: {
      monthly: Deno.env.get('P_STRIPE_PRICE_PREMIUM_MONTHLY') || '',
      annual: Deno.env.get('P_STRIPE_PRICE_PREMIUM_ANNUAL') || '',
      weekly: Deno.env.get('STRIPE_PRICE_PREMIUM_WEEKLY') || '',
    },
  };
  
  // Check all price IDs
  if (priceId === config.basic.monthly || priceId === config.basic.annual) {
    return 'basic';
  }
  if (priceId === config.plus.monthly || priceId === config.plus.annual) {
    return 'plus';
  }
  if (
    priceId === config.premium.monthly ||
    priceId === config.premium.annual ||
    priceId === config.premium.weekly
  ) {
    return 'premium';
  }
  
  return null;
}

function billingPeriodFromStripeSubscription(subscription: {
  items?: { data?: Array<{ price?: { recurring?: { interval?: string } } }> };
}): 'monthly' | 'annual' | 'weekly' {
  const interval = subscription.items?.data?.[0]?.price?.recurring?.interval as string | undefined;
  if (interval === 'year') return 'annual';
  if (interval === 'week') return 'weekly';
  return 'monthly';
}

async function handleSubscriptionUpdate(supabase: any, subscription: any, stripeSecretKey: string) {
  let resolvedUserId =
    subscription.metadata?.user_id || subscription.metadata?.app_user_id;
  
  // If no user_id in metadata, try to resolve via onboarding_sessions
  if (!resolvedUserId) {
    const customerId = typeof subscription.customer === 'string' 
      ? subscription.customer 
      : subscription.customer?.id;
    
    if (customerId) {
      // Lookup onboarding_sessions by stripe_customer_id
      const { data: obSession, error: obErr } = await supabase
        .from('onboarding_sessions')
        .select('id, status, user_id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      
      if (obErr) {
        console.error('Error looking up onboarding session:', JSON.stringify(obErr, null, 2));
      } else if (obSession) {
        if (!obSession.user_id) {
          // Onboarding session exists but user_id is null - update subscription_id and return
          const { error: updateErr } = await supabase
            .from('onboarding_sessions')
            .update({
              stripe_subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', obSession.id);
          
          if (updateErr) {
            console.error('Error updating onboarding_sessions subscription_id:', JSON.stringify(updateErr, null, 2));
          }
          return; // Don't try to update user_plans since user doesn't exist yet
        } else {
          // Onboarding session has user_id - use it
          resolvedUserId = obSession.user_id;
          console.log('Resolved userId from onboarding_sessions:', resolvedUserId);
        }
      }
    }
    
    if (!resolvedUserId) {
      console.log('No user_id in subscription metadata and no matching onboarding session with user_id - subscription will be handled after account creation');
      return;
    }
  }
  
  const userId = resolvedUserId;

  const customerId = typeof subscription.customer === 'string' 
    ? subscription.customer 
    : subscription.customer?.id;

  // Get the price ID and product ID from the subscription
  const priceId = subscription.items?.data?.[0]?.price?.id;
  const productId = subscription.items?.data?.[0]?.price?.product;
  
  if (!priceId && !productId) {
    console.error('No price ID or product ID found in subscription');
    return;
  }

  // Try to map Price ID to tier first (preferred method)
  let tier = priceId ? getTierFromPriceId(priceId) : null;
  
  // If Price ID mapping fails, try Product ID as fallback
  if (!tier && productId) {
    tier = getTierFromProductId(productId);
  }
  
  if (!tier) {
    console.error(`Could not map price ID ${priceId} or product ID ${productId} to a tier`);
    return;
  }

  // Get current plan from database to detect changes
  const { data: currentPlan } = await supabase
    .from('user_plans')
    .select('tier, status')
    .eq('user_id', userId)
    .maybeSingle();

  const oldTier = currentPlan?.tier;
  const oldStatus = currentPlan?.status;
  const tierChanged = oldTier && oldTier !== tier;
  
  // Determine new status
  const isTrialing = subscription.status === 'trialing';
  const newStatus = isTrialing ? 'trialing' :
                    subscription.status === 'active' ? 'active' : 
                    subscription.status === 'past_due' ? 'past_due' :
                    subscription.status === 'canceled' ? 'canceled' : 'active';
  
  // Detect resubscription: status changed from canceled to active
  const isResubscription = oldStatus === 'canceled' && newStatus === 'active';

  const billingPeriod = billingPeriodFromStripeSubscription(subscription);
  const nowSec = Date.now() / 1000;
  const trialEnd = subscription.trial_end as number | undefined;
  const trialStart = subscription.trial_start as number | undefined;
  const onTrial = isTrialing || (typeof trialEnd === 'number' && trialEnd > nowSec);
  const hadTrial = typeof trialStart === 'number' && trialStart > 0;

  // Update user_plans table (single source of truth for tiers)
  const { error: planError } = await supabase
    .from('user_plans')
    .upsert({
      user_id: userId,
      tier: tier,
      billing_period: billingPeriod,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      last_payment_source: 'stripe',
      status: newStatus,
      on_trial: onTrial,
      ...(hadTrial ? { had_trial: true } : {}),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (planError) {
    console.error('Error updating user_plans:', planError);
    console.error('Full error details:', JSON.stringify(planError, null, 2));
    // Don't throw - log and return to prevent webhook failure
    return;
  }

  if (newStatus === 'canceled' || newStatus === 'past_due') {
    const { error: cancelRemErr } = await supabase
      .from('board_reminders')
      .update({ status: 'cancelled' })
      .eq('user_id', userId)
      .eq('status', 'scheduled');
    if (cancelRemErr) {
      console.warn('board_reminders cancel on plan status change:', cancelRemErr);
    }
  }

  await attachAppUserIdToStripeSubscription(stripeSecretKey, subscription.id, userId);
  await postStripePurchaseToRevenueCat(userId, subscription.id);

  // Send welcome-back email if resubscribing
  if (isResubscription) {
    try {
      // Get user email and profile info
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user || !user.user?.email) {
        console.warn('User not found or no email for welcome-back notification');
      } else {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, username')
          .eq('id', userId)
          .single();

        const userName = profile?.first_name || profile?.username || 'there';
        const userEmail = user.user.email;

        // Get site URL for links
        const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://paletteplot.com';
        const appUrl = siteUrl;
        const privacyPolicyUrl = `${siteUrl}/privacy`;

        // Send welcome-back email via Postmark
        const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
        const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');

        if (!POSTMARK_SERVER_TOKEN) {
          console.warn('POSTMARK_SERVER_TOKEN not configured, skipping welcome-back email');
        } else {
          const templateModel = {
            name: userName,
            app_url: appUrl,
            privacy_policy_url: privacyPolicyUrl,
            tiktok_url: 'https://www.tiktok.com/@paletteplotting',
            youtube_url: 'https://www.youtube.com/@paletteplotting',
            instagram_url: 'https://www.instagram.com/paletteplotting',
          };

          const emailResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
            method: 'POST',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json',
              'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
            },
            body: JSON.stringify({
              To: userEmail,
              TemplateAlias: 'welcome-back',
              TemplateModel: templateModel,
              MessageStream: 'outbound',
              Tag: 'welcome-back',
              Metadata: { 
                email_type: 'welcome_back',
                user_id: userId,
              },
              From: POSTMARK_FROM_EMAIL || undefined,
            }),
          });

          if (!emailResponse.ok) {
            const errorText = await emailResponse.text();
            console.error('Failed to send welcome-back email:', errorText);
          } else {
            const emailData = await emailResponse.json().catch(() => ({}));
            console.log('Welcome-back email sent successfully:', emailData);
          }
        }
      }
    } catch (emailError) {
      console.warn('Error sending welcome-back email (non-fatal):', emailError);
      // Don't throw - email failure shouldn't break webhook
    }
  }

  // Send subscription change email if tier changed
  if (tierChanged && oldTier) {
    try {
      // Get user email and profile info
      const { data: user } = await supabase.auth.admin.getUserById(userId);
      if (!user || !user.user?.email) {
        console.warn('User not found or no email for subscription change notification');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('first_name, username')
        .eq('id', userId)
        .single();

      const userName = profile?.first_name || profile?.username || 'there';
      const userEmail = user.user.email;

      // Map tiers to plan names
      const planNames: Record<string, string> = {
        basic: 'Basic',
        plus: 'Plus',
        premium: 'Premium',
      };
      const oldPlanName = planNames[oldTier] || oldTier;
      const newPlanName = planNames[tier] || tier;

      // Determine if upgrade or downgrade
      const tierOrder: Record<string, number> = { basic: 1, plus: 2, premium: 3 };
      const isUpgrade = (tierOrder[tier] || 0) > (tierOrder[oldTier] || 0);
      const subscriptionMessage = isUpgrade
        ? `You've upgraded from ${oldPlanName} to ${newPlanName}. You now have access to all ${newPlanName} features.`
        : `You've changed from ${oldPlanName} to ${newPlanName}. Your plan features have been updated accordingly.`;

      // Calculate effective date (usually current period start or end)
      const effectiveDate = subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })
        : 'immediately';

      // Get site URL for links
      const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://paletteplot.com';
      const billingUrl = `${siteUrl}/settings`;
      const privacyPolicyUrl = `${siteUrl}/privacy`;

      // Send subscription change email via Postmark
      const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
      const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');

      if (!POSTMARK_SERVER_TOKEN) {
        console.warn('POSTMARK_SERVER_TOKEN not configured, skipping subscription change email');
        return;
      }

      const templateModel = {
        name: userName,
        new_plan_name: newPlanName,
        effective_date: effectiveDate,
        subscription_message: subscriptionMessage,
        billing_url: billingUrl,
        privacy_policy_url: privacyPolicyUrl,
        tiktok_url: 'https://www.tiktok.com/@paletteplotting',
        youtube_url: 'https://www.youtube.com/@paletteplotting',
        instagram_url: 'https://www.instagram.com/paletteplotting',
      };

      const emailResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
          'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
        },
        body: JSON.stringify({
          To: userEmail,
          TemplateAlias: 'subscription-change',
          TemplateModel: templateModel,
          MessageStream: 'outbound',
          Tag: 'subscription-change',
          Metadata: { 
            email_type: 'subscription_change',
            old_tier: oldTier,
            new_tier: tier,
            is_upgrade: isUpgrade.toString(),
          },
          From: POSTMARK_FROM_EMAIL || undefined,
        }),
      });

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text();
        console.error('Failed to send subscription change email:', errorText);
      } else {
        const emailData = await emailResponse.json().catch(() => ({}));
        console.log('Subscription change email sent successfully:', emailData);
      }
    } catch (emailError) {
      console.warn('Error sending subscription change email (non-fatal):', emailError);
      // Don't throw - email failure shouldn't break webhook
    }
  }
}

async function handleSubscriptionCancellation(supabase: any, subscription: any) {
  const userId = subscription.metadata?.user_id;
  let finalUserId = userId;
  
  if (!userId) {
    const { data: planRow } = await supabase
      .from('user_plans')
      .select('user_id')
      .eq('stripe_subscription_id', subscription.id)
      .maybeSingle();

    if (!planRow?.user_id) {
      console.error('No user_id found for subscription cancellation');
      return;
    }

    finalUserId = planRow.user_id;
  }

  // Update user_plans (single source of truth)
    const { error: planError } = await supabase
      .from('user_plans')
      .update({
        status: 'canceled',
        last_payment_source: 'stripe',
        updated_at: new Date().toISOString(),
      })
    .eq('user_id', finalUserId);

    if (planError) {
      console.error('Error canceling user_plans:', planError);
    } else {
      const { error: cancelRemErr } = await supabase
        .from('board_reminders')
        .update({ status: 'cancelled' })
        .eq('user_id', finalUserId)
        .eq('status', 'scheduled');
      if (cancelRemErr) {
        console.warn('board_reminders cancel on subscription deletion:', cancelRemErr);
      }
    }

  // Send cancellation email
  try {
    // Get user email and profile info
    const { data: user } = await supabase.auth.admin.getUserById(finalUserId);
    if (!user || !user.user?.email) {
      console.warn('User not found or no email for cancellation notification');
    return;
  }

    const { data: profile } = await supabase
      .from('profiles')
      .select('first_name, username')
      .eq('id', finalUserId)
      .single();

    const userName = profile?.first_name || profile?.username || 'there';
    const userEmail = user.user.email;

    // Get expiry date from subscription (current_period_end)
    const expiryDate = subscription.current_period_end
      ? new Date(subscription.current_period_end * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      : 'the end of your current billing period';

    // Get site URL for reactivate link
    const siteUrl = Deno.env.get('SITE_URL') || Deno.env.get('APP_URL') || 'https://paletteplot.com';
    const reactivateUrl = `${siteUrl}/resubscribe`;
    const privacyPolicyUrl = `${siteUrl}/privacy`;

    // Send cancellation email via Postmark
    const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
    const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');

    if (!POSTMARK_SERVER_TOKEN) {
      console.warn('POSTMARK_SERVER_TOKEN not configured, skipping cancellation email');
      return;
    }

    const templateModel = {
      name: userName,
      expiry_date: expiryDate,
      reactivate_url: reactivateUrl,
      privacy_policy_url: privacyPolicyUrl,
      tiktok_url: 'https://www.tiktok.com/@paletteplotting',
      youtube_url: 'https://www.youtube.com/@paletteplotting',
      instagram_url: 'https://www.instagram.com/paletteplotting',
    };

    const emailResponse = await fetch('https://api.postmarkapp.com/email/withTemplate', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
      },
      body: JSON.stringify({
        To: userEmail,
        TemplateAlias: 'cancellation',
        TemplateModel: templateModel,
        MessageStream: 'outbound',
        Tag: 'cancellation',
        Metadata: { email_type: 'cancellation' },
        From: POSTMARK_FROM_EMAIL || undefined,
      }),
    });

    if (!emailResponse.ok) {
      const errorText = await emailResponse.text();
      console.error('Failed to send cancellation email:', errorText);
    } else {
      const emailData = await emailResponse.json().catch(() => ({}));
      console.log('Cancellation email sent successfully:', emailData);
    }
  } catch (emailError) {
    console.warn('Error sending cancellation email (non-fatal):', emailError);
    // Don't throw - email failure shouldn't break webhook
  }
}

async function handleInvoicePaymentSucceeded(supabase: any, invoice: any) {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log('Invoice is not associated with a subscription');
    return;
  }

  const { data: planRow } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (!planRow?.user_id) {
    console.error('No user_plans row for subscription', subscriptionId);
    return;
  }

  const updateFields: Record<string, unknown> = {
    last_payment_source: 'stripe',
    current_period_end: new Date(invoice.period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };
  if (typeof invoice.amount_paid === 'number' && invoice.amount_paid > 0) {
    updateFields.status = 'active';
    updateFields.on_trial = false;
  }

  const { error: planError } = await supabase
    .from('user_plans')
    .update(updateFields)
    .eq('user_id', planRow.user_id);

  if (planError) {
    console.error('Error updating user_plans after payment:', planError);
  }
}

async function handleInvoicePaymentFailed(supabase: any, invoice: any) {
  const subscriptionId = typeof invoice.subscription === 'string' 
    ? invoice.subscription 
    : invoice.subscription?.id;

  if (!subscriptionId) {
    console.log('Invoice is not associated with a subscription');
    return;
  }

  const { data: planRow } = await supabase
    .from('user_plans')
    .select('user_id')
    .eq('stripe_subscription_id', subscriptionId)
    .maybeSingle();

  if (!planRow?.user_id) {
    console.error('No user_plans row for failed payment subscription', subscriptionId);
    return;
  }

  const { error: planError } = await supabase
    .from('user_plans')
    .update({
      status: 'past_due',
      last_payment_source: 'stripe',
      updated_at: new Date().toISOString(),
    })
    .eq('user_id', planRow.user_id);

  if (planError) {
    console.error('Error updating user_plans after failed payment:', planError);
  }
}

async function handleCheckoutSessionCompleted(supabase: any, session: any, stripeSecretKey: string) {
  try {
  // One-time digital guide purchase: grant a lifetime entitlement to the buyer's email.
  if (session.metadata?.product === GUIDE_PRODUCT_SLUG) {
    if (session.payment_status !== 'paid') {
      console.log('Skipping guide entitlement - payment not completed:', session.payment_status);
      return;
    }
    const guideEmail = session.customer_details?.email || session.customer_email || null;
    if (!guideEmail) {
      console.error('Guide checkout completed but no email on session', session.id);
      return;
    }
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;
    await grantGuideEntitlement(supabase, {
      email: guideEmail,
      checkoutSessionId: session.id,
      paymentIntentId,
    });
    console.log('GUIDE_ENTITLEMENT_GRANTED', { email: guideEmail, session: session.id });
    return;
  }

  // Physical board order paid through Stripe Checkout.
  if (session.metadata?.product === 'board-order') {
    if (session.payment_status !== 'paid') {
      console.log('Skipping board order - payment not completed:', session.payment_status);
      return;
    }
    const orderId = session.metadata?.order_id || session.client_reference_id;
    if (!orderId) {
      console.error('Board order checkout completed but no order_id on session', session.id);
      return;
    }

    const boardEmail = session.customer_details?.email || session.customer_email || null;
    const shipping = session.shipping_details || session.customer_details || null;
    const paymentIntentId = typeof session.payment_intent === 'string'
      ? session.payment_intent
      : session.payment_intent?.id || null;

    const { data: order, error: orderErr } = await supabase
      .from('board_orders')
      .update({
        status: 'paid',
        email: boardEmail,
        amount_total: typeof session.amount_total === 'number' ? session.amount_total : null,
        shipping_name: shipping?.name || null,
        shipping_address: shipping?.address || null,
        stripe_payment_intent_id: paymentIntentId,
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', String(orderId))
      .select('id,email,amount_total,currency,lines,shipping_name,shipping_address,guide_granted')
      .single();

    if (orderErr) {
      console.error('BOARD_ORDER_UPDATE_FAILED', { orderId, error: JSON.stringify(orderErr, null, 2) });
      return;
    }
    console.log('BOARD_ORDER_PAID', { orderId });

    // Board purchase includes the digital guide â€” grant a lifetime entitlement.
    if (boardEmail && !order?.guide_granted) {
      try {
        await grantGuideEntitlement(supabase, {
          email: boardEmail,
          checkoutSessionId: session.id,
          paymentIntentId,
        });
        await supabase
          .from('board_orders')
          .update({ guide_granted: true, updated_at: new Date().toISOString() })
          .eq('id', String(orderId));
      } catch (grantErr) {
        console.warn('Board order guide grant failed (non-fatal):', grantErr);
      }
    }

    // Notify fulfillment by email (best-effort).
    try {
      const POSTMARK_SERVER_TOKEN = Deno.env.get('POSTMARK_SERVER_TOKEN');
      const POSTMARK_FROM_EMAIL = Deno.env.get('POSTMARK_FROM_EMAIL');
      const notifyTo = Deno.env.get('ORDER_NOTIFY_EMAIL') || POSTMARK_FROM_EMAIL;
      if (POSTMARK_SERVER_TOKEN && POSTMARK_FROM_EMAIL && notifyTo) {
        const lines = Array.isArray(order?.lines) ? order.lines : [];
        const itemsText = lines
          .map((l: any) => `- ${l.title} Ã— ${l.quantity} ($${((l.unit_amount * l.quantity) / 100).toFixed(2)})`)
          .join('\n');
        const addr = order?.shipping_address || {};
        const shipText = [
          order?.shipping_name || '',
          addr.line1 || '',
          addr.line2 || '',
          [addr.city, addr.state, addr.postal_code].filter(Boolean).join(', '),
          addr.country || '',
        ].filter(Boolean).join('\n');
        const total = typeof order?.amount_total === 'number' ? `$${(order.amount_total / 100).toFixed(2)}` : 'n/a';

        const emailRes = await fetch('https://api.postmarkapp.com/email', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-Postmark-Server-Token': POSTMARK_SERVER_TOKEN,
          },
          body: JSON.stringify({
            From: POSTMARK_FROM_EMAIL,
            To: notifyTo,
            Subject: `New board order â€” ${total} (${orderId})`,
            TextBody:
              `New paid board order.\n\nOrder: ${orderId}\nEmail: ${boardEmail}\nTotal: ${total}\n\nItems:\n${itemsText}\n\nShip to:\n${shipText}\n`,
            MessageStream: 'outbound',
            Tag: 'board-order',
          }),
        });
        if (!emailRes.ok) {
          console.error('Board order notify email failed:', await emailRes.text());
        }
      } else {
        console.warn('Postmark not fully configured, skipping board order notify email');
      }
    } catch (emailErr) {
      console.warn('Board order notify email exception (non-fatal):', emailErr);
    }

    return;
  }

  const userId = session.metadata?.user_id;
  if (!userId) {
    // New flow: payment-first onboarding (no auth user yet).
    // Step 1: Only proceed if checkout completed (paid or subscription trial)
    const checkoutOk =
      session.payment_status === "paid" ||
      (session.mode === "subscription" &&
        session.payment_status === "no_payment_required");
    if (!checkoutOk) {
      console.log('Skipping checkout.session.completed - checkout not completed:', session.payment_status);
      return;
    }

    // Attach Stripe result to onboarding_sessions using client_reference_id / metadata.
    const onboardingSessionId = session.metadata?.onboarding_session_id || session.client_reference_id;
    if (!onboardingSessionId) {
      console.error('No user_id and no onboarding_session_id/client_reference_id on checkout.session.completed', {
        metadata: session.metadata,
        client_reference_id: session.client_reference_id,
        session_id: session.id
      });
      return;
    }

    console.log('Processing checkout.session.completed for onboarding session:', onboardingSessionId);

      // Validate UUID format (case-insensitive, allows any hex characters)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const sessionIdStr = String(onboardingSessionId).trim();
      if (!uuidRegex.test(sessionIdStr)) {
        console.error('Invalid onboarding session ID format (not a UUID):', onboardingSessionId);
        return;
      }

    const customerId = typeof session.customer === 'string'
      ? session.customer
      : session.customer?.id;

    const subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    const customerEmail =
      session.customer_details?.email ||
      session.customer_email ||
      null;

    const tier = session.metadata?.tier || null;
    const billing = session.metadata?.billing || null;

    // Step 1: Mark onboarding session as paid (webhook is source of truth)
    const updateData = {
      status: 'paid',
      stripe_checkout_session_id: session.id,
      stripe_customer_id: customerId,
      stripe_customer_email: customerEmail,
      stripe_subscription_id: subscriptionId,
      selected_tier: tier,
      billing: billing,
      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: updatedSession, error: obErr } = await supabase
      .from('onboarding_sessions')
      .update(updateData)
      .eq('id', onboardingSessionId)
      .select('id,status,email,first_name,username,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at')
      .single();

    if (obErr) {
      console.error('STEP1_PAID_UPDATE_FAILED', {
        onboardingSessionId,
        error: JSON.stringify(obErr, null, 2),
        updateData: JSON.stringify(updateData, null, 2)
      });
      return;
    }
    console.log('STEP1_PAID_UPDATE_OK', { onboardingSessionId, status: updatedSession?.status });

    // Step 2: Create the auth user (always, because this is payment-first)
    if (!updatedSession.user_id && updatedSession.email) {
      let finalUserId: string | null = null;
      
      // Generate secure temporary password
      const tempPasswordBytes = new Uint8Array(32);
      crypto.getRandomValues(tempPasswordBytes);
      const tempPassword = Array.from(tempPasswordBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('') + 'A1!'; // Add uppercase, digit, special char to meet requirements
      
      // Attempt to create account
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: updatedSession.email,
        password: tempPassword,
        email_confirm: true, // Auto-confirm email
        user_metadata: {
          first_name: updatedSession.first_name || null,
          username: updatedSession.username || null,
        },
      });

      if (createError) {
        // If user already exists, try to resolve by email
        if (createError.message?.includes('already exists') || createError.message?.includes('already registered')) {
          // Try getUserByEmail if available (Supabase admin API)
          try {
            // Use listUsers with filter if getUserByEmail not available
            const { data: usersData, error: listError } = await supabase.auth.admin.listUsers();
            if (listError) {
              console.error('STEP2_AUTH_FAILED', {
                onboardingSessionId,
                reason: 'listUsers failed',
                error: JSON.stringify(listError, null, 2)
              });
              return;
            }
            const existingUser = usersData.users.find((u) => u.email?.toLowerCase() === updatedSession.email.toLowerCase());
            if (existingUser) {
              finalUserId = existingUser.id;
            } else {
              console.error('STEP2_AUTH_FAILED', {
                onboardingSessionId,
                reason: 'user exists but not found in list'
              });
              return;
            }
          } catch (lookupErr) {
            console.error('STEP2_AUTH_FAILED', {
              onboardingSessionId,
              reason: 'lookup exception',
              error: String(lookupErr)
            });
            return;
          }
        } else {
          console.error('STEP2_AUTH_FAILED', {
            onboardingSessionId,
            reason: 'createUser error',
            error: JSON.stringify(createError, null, 2)
          });
          return;
        }
      } else if (newUser?.user) {
        finalUserId = newUser.user.id;
      } else {
        console.error('STEP2_AUTH_FAILED', {
          onboardingSessionId,
          reason: 'no user returned from createUser'
        });
        return;
      }

      if (!finalUserId) {
        console.error('STEP2_AUTH_FAILED', {
          onboardingSessionId,
          reason: 'finalUserId is null'
        });
        return;
      }

      console.log('STEP2_AUTH_OK', { onboardingSessionId, finalUserId });

      // Step 3: Attach onboarding session â†’ auth + persist onboarding data
      // 3A) Attach + activate onboarding session
      const paidAtIso = updatedSession.paid_at ? new Date(updatedSession.paid_at).toISOString() : new Date().toISOString();
      
      // Determine current_period_end
      let currentPeriodEndIso: string | null = null;
      let subscriptionStatus: string | null = null;
      let subscriptionOnTrial = false;
      let subscriptionHadTrial = false;
      let subscriptionBillingPeriod: "monthly" | "annual" | "weekly" =
        billing === "annual" ? "annual" : billing === "weekly" ? "weekly" : "monthly";

      if (subscriptionId) {
        try {
          const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
            headers: { Authorization: `Bearer ${stripeSecretKey}` },
          });
          if (subResp.ok) {
            const sub = await subResp.json();
            subscriptionStatus = sub.status || null;
            subscriptionOnTrial = sub.status === "trialing";
            subscriptionHadTrial = typeof sub.trial_start === "number" && sub.trial_start > 0;
            subscriptionBillingPeriod = billingPeriodFromStripeSubscription(sub);
            if (sub.current_period_end) {
              currentPeriodEndIso = new Date(sub.current_period_end * 1000).toISOString();
            }
          }
        } catch (err) {
          console.warn('Error fetching subscription for period end (non-fatal):', err);
        }
      } else if (billing === "annual") {
        const periodEnd = new Date();
        periodEnd.setFullYear(periodEnd.getFullYear() + 1);
        currentPeriodEndIso = periodEnd.toISOString();
      }

      // Validate tier
      const finalTier = (updatedSession.selected_tier || tier) as "basic" | "plus" | "premium" | null;
      if (!finalTier || !["basic", "plus", "premium"].includes(finalTier)) {
        console.warn('Missing or invalid tier, defaulting to basic:', finalTier);
      }
      const safeTier = (finalTier && ["basic", "plus", "premium"].includes(finalTier)) ? finalTier : "basic";

      // Attach onboarding session to user
      const { error: attachErr } = await supabase
        .from("onboarding_sessions")
        .update({
          user_id: finalUserId,
          status: "active",
          stripe_checkout_session_id: session.id,
          stripe_customer_id: customerId,
          stripe_customer_email: customerEmail,
          stripe_subscription_id: subscriptionId,
          paid_at: paidAtIso,
          selected_tier: safeTier,
          billing: billing,
        })
        .eq("id", String(onboardingSessionId));

      if (attachErr) {
        console.error("STEP3_ATTACH_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(attachErr, null, 2)
        });
      } else {
        console.log("STEP3_ATTACH_OK", { onboardingSessionId, finalUserId });
      }

      // 3B) Upsert profiles (best-effort)
      const { error: profileErr } = await supabase.from("profiles").upsert(
        {
          id: finalUserId,
          first_name: updatedSession.first_name || null,
          username: updatedSession.username || null,
          onboarding_answers: updatedSession.onboarding_answers || {},
        },
        { onConflict: "id" },
      );

      if (profileErr) {
        console.error("STEP4_PROFILE_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(profileErr, null, 2)
        });
      } else {
        console.log("STEP4_PROFILE_OK", { onboardingSessionId, finalUserId });
      }

      // 3C) Upsert user_preferences (best-effort)
      const finalEmailConsent = updatedSession.email_consent ?? false;
      const finalSmsConsent = updatedSession.sms_consent ?? false;
      const { error: prefsErr } = await supabase.from("user_preferences").upsert(
        {
          user_id: finalUserId,
          texts_enabled: finalSmsConsent,
          preferred_send_window: "both",
          email_marketing: finalEmailConsent,
        },
        { onConflict: "user_id" },
      );

      if (prefsErr) {
        console.error("STEP5_PREFS_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(prefsErr, null, 2)
        });
      } else {
        console.log("STEP5_PREFS_OK", { onboardingSessionId, finalUserId });
      }

      // 3D) Guarantee user_plans exists (critical)
      const planStatus =
        subscriptionStatus === "trialing"
          ? "trialing"
          : subscriptionStatus === "past_due"
            ? "past_due"
            : subscriptionStatus === "canceled"
              ? "canceled"
              : "active";
      
      // Try upsert first (preferred method)
      let planErr = null;
      const { error: upsertErr } = await supabase.from("user_plans").upsert(
        {
          id: finalUserId, // Set id to user_id to satisfy FK constraint on id column (migration should have removed this, but handle it)
          user_id: finalUserId,
          tier: safeTier,
          billing_period: subscriptionBillingPeriod,
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          last_payment_source: "stripe",
          status: planStatus,
          on_trial: subscriptionOnTrial,
          had_trial: subscriptionHadTrial || subscriptionOnTrial,
          current_period_end: currentPeriodEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );
      
      if (upsertErr && upsertErr.code === "23503" && upsertErr.message?.includes("user_plans_id_fkey")) {
        console.error(
          "STEP6_PLANS_BLOCKED_BY_LEGACY_ID_FK_NO_DELETE_ATTEMPTED",
          JSON.stringify(upsertErr, null, 2),
        );
      }
      planErr = upsertErr;

      if (planErr) {
        console.error("STEP6_PLANS_FAILED", {
          onboardingSessionId,
          finalUserId,
          error: JSON.stringify(planErr, null, 2)
        });
      } else {
        console.log("STEP6_PLANS_OK", { onboardingSessionId, finalUserId, tier: safeTier, status: planStatus });
        if (subscriptionId) {
          await attachAppUserIdToStripeSubscription(stripeSecretKey, subscriptionId, finalUserId);
        }
        const rcToken = subscriptionId || session.id;
        await postStripePurchaseToRevenueCat(finalUserId, rcToken);
      }

      // Step 7: Send password reset email (must not depend on any upsert success)
      const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
      const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
      
      try {
        const resetResponse = await fetch(`${supabaseUrl}/functions/v1/send-password-reset`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
            'apikey': `${SERVICE_ROLE_KEY}`,
          },
          body: JSON.stringify({ email: updatedSession.email }),
        });

        const responseText = await resetResponse.text();
        console.log('STEP7_EMAIL_RESET_ATTEMPTED', {
          onboardingSessionId,
          finalUserId,
          status: resetResponse.status,
          statusText: resetResponse.statusText,
          body: responseText
        });

        if (!resetResponse.ok) {
          console.error('Password reset email failed:', responseText);
        }
      } catch (emailError) {
        console.error('STEP7_EMAIL_RESET_EXCEPTION', {
          onboardingSessionId,
          finalUserId,
          error: String(emailError)
        });
      }

      // Sanity check: Verify user_plans was created
      const { data: planCheck, error: planCheckErr } = await supabase
        .from("user_plans")
        .select("user_id,tier,status,current_period_end")
        .eq("user_id", finalUserId)
        .maybeSingle();

      console.log("PLAN_CHECK", {
        onboardingSessionId,
        finalUserId,
        planCheck,
        planCheckErr: planCheckErr ? JSON.stringify(planCheckErr, null, 2) : null
      });
    } else {
      console.log('âŒ Conditions NOT met - skipping account creation', {
        reason: updatedSession?.user_id ? 'user_id already set' : 'email is missing',
        user_id: updatedSession?.user_id,
        email: updatedSession?.email
      });
    }

    return;
  }

    // Old flow: user already exists (has user_id in metadata)
    // userId is already declared above, so we can use it here
    // If we reach this point, userId exists (otherwise we would have returned above)

  const customerId = typeof session.customer === 'string' 
    ? session.customer 
    : session.customer?.id;

  // Get tier from metadata (set during checkout)
  const tier = session.metadata?.tier || 'basic';
  
  if (!['basic', 'plus', 'premium'].includes(tier)) {
    console.error(`Invalid tier in checkout session: ${tier}`);
    return;
  }

  let periodEnd: Date | null = null;
  let subscriptionId: string | null = null;
  let planStatus = 'active';
  let onTrial = false;
  let hadTrial = false;
  let billingPeriod: 'monthly' | 'annual' | 'weekly' =
    session.metadata?.billing === 'annual'
      ? 'annual'
      : session.metadata?.billing === 'weekly'
        ? 'weekly'
        : 'monthly';

  if (session.mode === 'subscription') {
    subscriptionId = typeof session.subscription === 'string'
      ? session.subscription
      : session.subscription?.id;

    if (subscriptionId) {
      const subscriptionResponse = await fetch(
        `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
        {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (subscriptionResponse.ok) {
        const subscription = await subscriptionResponse.json();
        periodEnd = new Date(subscription.current_period_end * 1000);
        billingPeriod = billingPeriodFromStripeSubscription(subscription);
        onTrial = subscription.status === 'trialing';
        hadTrial = typeof subscription.trial_start === 'number' && subscription.trial_start > 0;
        planStatus =
          subscription.status === 'trialing'
            ? 'trialing'
            : subscription.status === 'past_due'
              ? 'past_due'
              : subscription.status === 'canceled'
                ? 'canceled'
                : 'active';
      }
    }
  } else {
    periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    billingPeriod = 'annual';
  }

  const { error: planError } = await supabase
    .from('user_plans')
    .upsert({
      user_id: userId,
      tier: tier,
      billing_period: billingPeriod,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      last_payment_source: 'stripe',
      status: planStatus,
      on_trial: onTrial,
      had_trial: hadTrial || onTrial,
      current_period_end: periodEnd ? periodEnd.toISOString() : null,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'user_id',
    });

  if (planError) {
    console.error('Error saving user_plans from checkout session:', planError);
      console.error('Full error details:', JSON.stringify(planError, null, 2));
      // Don't throw - log and return to prevent webhook failure
      return;
  }

  {
    if (subscriptionId) {
      await attachAppUserIdToStripeSubscription(stripeSecretKey, subscriptionId, userId);
    }
    const rcToken = subscriptionId || session.id;
    await postStripePurchaseToRevenueCat(userId, rcToken);
  }

  } catch (error) {
    console.error('Unexpected error in handleCheckoutSessionCompleted:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // Don't rethrow - let caller handle gracefully
    return;
  }
}





```

---

## supabase/functions/create-payment-intent/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// Allowed origins for CORS
const getAllowedOrigin = (origin: string | null): string => {
  if (!origin) {
    // In development, allow all origins if none specified
    return '*';
  }
  
  const allowedOrigins = [
    'https://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://127.0.0.1:8080',
    'https://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
    // Add production domain here when ready
    // 'https://yourdomain.com',
  ];
  
  // Normalize origin (remove trailing slash, handle variations)
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  // Check if origin matches any allowed origin
  if (allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }
  
  // In development, allow localhost origins even if not exact match
  if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
    return normalizedOrigin;
  }
  
  // Default: return the origin if it's a localhost variant, otherwise deny
  return '*';
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
});

// Get Stripe Price ID for tier and billing period
function getPriceIdForTier(tier: 'basic' | 'plus' | 'premium', billing: 'monthly' | 'annual' | 'weekly'): string {
  const config = {
    basic: {
      monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || '',
      weekly: '',
    },
    plus: {
      monthly: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL') || '',
      weekly: '',
    },
    premium: {
      monthly: Deno.env.get('P_STRIPE_PRICE_PREMIUM_MONTHLY') || '',
      annual: Deno.env.get('P_STRIPE_PRICE_PREMIUM_ANNUAL') || '',
      weekly: Deno.env.get('STRIPE_PRICE_PREMIUM_WEEKLY') || '',
    },
  };
  
  return config[tier][billing];
}

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle OPTIONS preflight request - MUST return immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0',
      }
    });
  }

  // Wrap everything in try-catch to ensure CORS headers are always returned
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'User not found'}`);
    }

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      throw new Error(`Invalid request body: ${parseError instanceof Error ? parseError.message : 'Failed to parse JSON'}`);
    }

    const { tier, billing } = requestBody;
    
    if (!tier || !billing) {
      throw new Error(`Missing required fields: tier=${tier}, billing=${billing}`);
    }

    // Validate tier
    if (!['basic', 'plus', 'premium'].includes(tier)) {
      throw new Error('Invalid tier. Must be basic, plus, or premium');
    }

    // Validate billing
    if (!['monthly', 'annual', 'weekly'].includes(billing)) {
      throw new Error('Invalid billing period. Must be monthly, annual, or weekly');
    }

    if (billing === 'weekly' && tier !== 'premium') {
      throw new Error('Weekly billing is only available for premium tier');
    }

    // Get Price ID for this tier and billing period
    const priceId = getPriceIdForTier(tier as 'basic' | 'plus' | 'premium', billing as 'monthly' | 'annual' | 'weekly');
    
    // Validate price_id exists
    if (!priceId || priceId.trim() === '') {
      console.error(`Price ID not configured for tier=${tier}, billing=${billing}`);
      return new Response(
        JSON.stringify({ 
          error: `Price ID not configured for ${tier} ${billing}. Please set STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()} environment variable.`,
          details: { tier, billing }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Validate price_id format (should start with 'price_')
    if (!priceId.startsWith('price_')) {
      console.error(`Invalid Price ID format: ${priceId}`);
      return new Response(
        JSON.stringify({ 
          error: `Invalid Price ID format for ${tier} ${billing}. Price ID should start with 'price_'.`,
          details: { tier, billing, priceId: priceId.substring(0, 20) + '...' }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get origin from request headers for success/cancel URLs
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:8080';
    const baseUrl = requestOrigin.replace(/\/$/, ''); // Remove trailing slash

    // Get or create Stripe customer
    let customerId: string;
    
    // Check if user already has a Stripe customer ID in user_plans
    const { data: existingPlan, error: planError } = await supabase
      .from('user_plans')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
      console.error('Error checking user_plans:', planError);
      throw new Error(`Database error: ${planError.message}`);
    }
    
    if (existingPlan?.stripe_customer_id) {
      customerId = existingPlan.stripe_customer_id;
    } else {
      // Create new Stripe customer
      // Stripe metadata must be sent as individual key-value pairs, not JSON string
      const customerParams = new URLSearchParams({
        email: user.email || '',
      });
      
      // Add metadata as individual parameters (metadata[key]=value format)
      customerParams.append('metadata[user_id]', user.id);
      
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: customerParams,
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('Stripe customer creation error:', errorText);
        throw new Error('Failed to create customer');
      }

      const customer = await customerResponse.json();
      customerId = customer.id;
    }

    // Create Checkout Session using Price ID
    // IMPORTANT: We're creating a Checkout Session, NOT a PaymentIntent
    // For subscriptions, mode must be 'subscription'
    const mode = 'subscription'; // Always subscription for monthly/annual plans
    
    // Build line_items as a plain array - this is what Stripe expects
    // line_items must be: [{ price: 'price_xxx', quantity: 1 }]
    // NOT wrapped in another object, NOT empty, NOT an object directly
    const lineItems = [{
      price: priceId,
      quantity: 1,
    }];
    
    // Validate line_items structure before sending
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error('line_items must be a non-empty array');
    }
    
    if (!lineItems[0].price || !lineItems[0].quantity) {
      throw new Error('line_items[0] must have price and quantity');
    }
    
    // Convert line_items array to JSON string for form-encoded request
    // Stripe's form-encoded API expects line_items as a JSON string
    const lineItemsJson = JSON.stringify(lineItems);
    
    // Build form-encoded body manually
    // Stripe accepts line_items in two formats for form-encoded:
    // 1. JSON string: line_items=[{"price":"price_xxx","quantity":1}]
    // 2. Bracket notation: line_items[0][price]=price_xxx&line_items[0][quantity]=1
    // 
    // We'll use bracket notation as it's more reliable and doesn't require JSON encoding/decoding
    const formParts: string[] = [];
    
    // Helper to safely encode form values (values only, not keys)
    const encodeValue = (value: string) => encodeURIComponent(value);
    
    // Add standard fields
    formParts.push(`customer=${encodeValue(customerId)}`);
    formParts.push(`mode=${encodeValue(mode)}`);
    
    // Use bracket notation for line_items (brackets in keys are NOT encoded)
    // This format: line_items[0][price]=price_xxx&line_items[0][quantity]=1
    formParts.push(`line_items[0][price]=${encodeValue(priceId)}`);
    formParts.push(`line_items[0][quantity]=${encodeValue('1')}`);
    
    formParts.push(`success_url=${encodeValue(`${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`)}`);
    formParts.push(`cancel_url=${encodeValue(`${baseUrl}/`)}`);
    
    // Add metadata with bracket notation (brackets in keys are NOT encoded)
    formParts.push(`metadata[user_id]=${encodeValue(user.id)}`);
    formParts.push(`metadata[tier]=${encodeValue(tier)}`);
    formParts.push(`metadata[billing]=${encodeValue(billing)}`);
    // Copy onto the created Subscription so webhooks + RevenueCat Stripe notifications see app user id
    formParts.push(`subscription_data[metadata][user_id]=${encodeValue(user.id)}`);
    formParts.push(`subscription_data[metadata][app_user_id]=${encodeValue(user.id)}`);
    
    // Enable promo codes in Checkout
    formParts.push(`allow_promotion_codes=true`);
    
    const formBody = formParts.join('&');
    
    // Log the exact form body being sent (first 500 chars to see line_items format)
    console.log('Form body being sent to Stripe (first 500 chars):', formBody.substring(0, 500));
    console.log('line_items in form body:', formBody.match(/line_items\[0\]\[price\]=([^&]+)/)?.[1]);
    
    // Log the payload (safe - no secrets) - this is critical for debugging
    console.log('Creating Stripe Checkout Session - Payload:', {
      customerId,
      mode,
      priceId,
      tier,
      billing,
      lineItems: lineItems, // Log the actual array structure
      lineItemsJson: lineItemsJson, // Log the JSON string we're sending
      lineItemsType: typeof lineItems,
      lineItemsIsArray: Array.isArray(lineItems),
      lineItemsLength: lineItems.length,
      baseUrl,
      formBodyPreview: formBody.substring(0, 300), // First 300 chars of form body
    });
    
    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Stripe Checkout Session creation error:', errorText);
      
      // Try to parse the error for more details
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `Stripe error: ${errorJson.error.message}`;
        } else if (errorJson.message) {
          errorMessage = `Stripe error: ${errorJson.message}`;
        }
      } catch (e) {
        // If parsing fails, use the raw error text
        errorMessage = `Stripe API error: ${errorText.substring(0, 200)}`;
      }
      
      throw new Error(errorMessage);
    }

    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        type: mode,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-payment-intent:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // Always return CORS headers, even on error
    const errorOrigin = req.headers.get('origin') || req.headers.get('referer') || '*';
    const errorCorsHeaders = getCorsHeaders(errorOrigin);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
    } : { message: String(error) };
    
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { 
          ...errorCorsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});



```

---

## supabase/functions/get-pricing/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }

    // Get Price IDs: premium only (Basic and Plus columns removed)
    const priceIds = {
      monthly: Deno.env.get("P_STRIPE_PRICE_PREMIUM_MONTHLY") || "price_1T7iz4JIPqOk4csD742fcYv3",
      annual: Deno.env.get("P_STRIPE_PRICE_PREMIUM_ANNUAL") || "price_1T7izIJIPqOk4csDOtzyaEBW",
      weekly: Deno.env.get("STRIPE_PRICE_PREMIUM_WEEKLY") || "",
    };

    const fetchPrice = async (priceId: string) => {
      if (!priceId) return null;
      const response = await fetch(`https://api.stripe.com/v1/prices/${priceId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });
      if (!response.ok) {
        console.error(`Failed to fetch price ${priceId}:`, response.status);
        return null;
      }
      return await response.json();
    };

    const [premiumMonthly, premiumAnnual, premiumWeekly] = await Promise.all([
      fetchPrice(priceIds.monthly),
      fetchPrice(priceIds.annual),
      priceIds.weekly ? fetchPrice(priceIds.weekly) : Promise.resolve(null),
    ]);

    const pricingData = [
      {
        tier: "premium",
        monthly_display_price: premiumMonthly?.unit_amount ? premiumMonthly.unit_amount / 100 : 0,
        annual_display_price: premiumAnnual?.unit_amount ? premiumAnnual.unit_amount / 100 : 0,
        weekly_display_price:
          premiumWeekly?.unit_amount != null ? premiumWeekly.unit_amount / 100 : null,
      },
    ];

    return new Response(JSON.stringify(pricingData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Error fetching pricing from Stripe:", e);
    return new Response(JSON.stringify({ error: "Failed to fetch pricing" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


```

---

## supabase/functions/sync-stripe-customer/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('Not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    let customerId: string | null = null;
    let subscriptionId: string | null = null;

    // Method 1: Search Stripe by email
    if (user.email) {
      try {
        const customersResponse = await fetch(
          `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=10`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (customersResponse.ok) {
          const customers = await customersResponse.json();
          // Find customer that matches this user (check metadata or find most recent)
          if (customers.data && customers.data.length > 0) {
            // Try to find one with matching user_id in metadata
            const matchingCustomer = customers.data.find((c: any) => 
              c.metadata?.user_id === user.id
            );
            
            if (matchingCustomer) {
              customerId = matchingCustomer.id;
            } else {
              // Use the most recent customer with this email
              customerId = customers.data[0].id;
            }
          }
        }
      } catch (err) {
        console.error('Error searching customers by email:', err);
      }
    }

    // Method 2: If we found a customer, get their subscriptions
    if (customerId) {
      try {
        const subscriptionsResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=all`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (subscriptionsResponse.ok) {
          const subscriptions = await subscriptionsResponse.json();
          if (subscriptions.data && subscriptions.data.length > 0) {
            subscriptionId = subscriptions.data[0].id;
          }
        }
      } catch (err) {
        console.error('Error fetching subscriptions:', err);
      }
    }

    // Method 3: Search by user_id in customer metadata (if customer was created with metadata)
    if (!customerId) {
      try {
        // List all customers and search metadata (this is less efficient but works)
        const allCustomersResponse = await fetch(
          `https://api.stripe.com/v1/customers?limit=100`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (allCustomersResponse.ok) {
          const allCustomers = await allCustomersResponse.json();
          const matchingCustomer = allCustomers.data?.find((c: any) => 
            c.metadata?.user_id === user.id
          );
          
          if (matchingCustomer) {
            customerId = matchingCustomer.id;
            
            // Get subscriptions for this customer
            const subscriptionsResponse = await fetch(
              `https://api.stripe.com/v1/subscriptions?customer=${customerId}&limit=1&status=all`,
              {
                headers: {
                  'Authorization': `Bearer ${stripeSecretKey}`,
                },
              }
            );

            if (subscriptionsResponse.ok) {
              const subscriptions = await subscriptionsResponse.json();
              if (subscriptions.data && subscriptions.data.length > 0) {
                subscriptionId = subscriptions.data[0].id;
              }
            }
          }
        }
      } catch (err) {
        console.error('Error searching customers by metadata:', err);
      }
    }

    if (!customerId) {
      throw new Error('No Stripe customer found for this user. Please subscribe first.');
    }

    // Update user_plans with the found customer_id and subscription_id
    const { error: updateError } = await supabase
      .from('user_plans')
      .upsert({
        user_id: user.id,
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        last_payment_source: 'stripe',
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });

    if (updateError) {
      console.error('Error updating user_plans:', updateError);
      throw new Error('Failed to sync customer data to database');
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        customer_id: customerId,
        subscription_id: subscriptionId,
        message: 'Customer data synced successfully'
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in sync-stripe-customer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return new Response(
      JSON.stringify({
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});



















```

---

## supabase/functions/create-customer-portal/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// Get allowed origin for CORS
const getAllowedOrigin = (origin: string | null): string => {
  if (!origin) {
    return '*';
  }
  
  const allowedOrigins = [
    'https://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://127.0.0.1:8080',
    'https://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
  ];
  
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  if (allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }
  
  // For production, you might want to check against your actual domain
  // For now, allow all in development
  return '*';
};

function isHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function resolvePortalReturnUrl(req: Request, bodyReturnUrl?: unknown): string {
  const candidates: string[] = [];

  if (typeof bodyReturnUrl === "string" && bodyReturnUrl.trim()) {
    candidates.push(bodyReturnUrl.trim());
  }

  const origin = req.headers.get("origin") || req.headers.get("referer");
  if (origin) {
    try {
      const url = new URL(origin);
      if (url.protocol === "http:" || url.protocol === "https:") {
        candidates.push(`${url.protocol}//${url.host}/dashboard/settings`);
      }
    } catch {
      // ignore invalid origin
    }
  }

  const siteUrl = (
    Deno.env.get("SITE_URL") ||
    Deno.env.get("APP_URL") ||
    Deno.env.get("VITE_APP_URL") ||
    "https://paletteplot.com"
  ).replace(/\/$/, "");
  candidates.push(`${siteUrl}/dashboard/settings`);

  for (const candidate of candidates) {
    if (isHttpUrl(candidate)) return candidate;
  }

  return "https://paletteplot.com/dashboard/settings";
}

async function findStripeCustomerId(
  stripeSecretKey: string,
  user: { id: string; email?: string | null },
): Promise<string | null> {
  if (user.email) {
    try {
      const customersResponse = await fetch(
        `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=10`,
        {
          headers: {
            Authorization: `Bearer ${stripeSecretKey}`,
          },
        },
      );

      if (customersResponse.ok) {
        const customers = await customersResponse.json();
        const rows = customers.data ?? [];
        const byMetadata = rows.find((c: { metadata?: { user_id?: string } }) =>
          c.metadata?.user_id === user.id
        );
        if (byMetadata?.id) return byMetadata.id;
        if (rows[0]?.id) return rows[0].id;
      }
    } catch (err) {
      console.error("Error searching Stripe customers by email:", err);
    }
  }

  return null;
}

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ url: null, error: "not_configured" }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ url: null, error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(
        JSON.stringify({ url: null, error: "unauthorized" }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    let bodyReturnUrl: unknown = undefined;
    try {
      const body = await req.json();
      bodyReturnUrl = body?.returnUrl;
    } catch {
      // empty body is fine
    }

    // Get user's Stripe customer ID from user_plans first
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = userPlan?.stripe_customer_id?.trim() || null;
    let subscriptionId = userPlan?.stripe_subscription_id?.trim() || null;

    if (!customerId || !subscriptionId) {
      const { data: obSession } = await supabase
        .from('onboarding_sessions')
        .select('stripe_customer_id, stripe_subscription_id')
        .eq('user_id', user.id)
        .order('paid_at', { ascending: false, nullsFirst: false })
        .limit(1)
        .maybeSingle();

      if (!customerId && typeof obSession?.stripe_customer_id === 'string') {
        customerId = obSession.stripe_customer_id.trim() || null;
      }
      if (!subscriptionId && typeof obSession?.stripe_subscription_id === 'string') {
        subscriptionId = obSession.stripe_subscription_id.trim() || null;
      }
    }

    // If no customer_id but we have a subscription_id, fetch customer from Stripe
    if (!customerId && subscriptionId) {
      try {
        const subscriptionResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer?.id;
          
          // Update user_plans with the customer_id we found
          if (customerId && userPlan) {
            await supabase
              .from('user_plans')
              .update({ stripe_customer_id: customerId, last_payment_source: 'stripe' })
              .eq('user_id', user.id);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    }

    // Last resort: Try to find customer by email / metadata in Stripe
    if (!customerId) {
      customerId = await findStripeCustomerId(stripeSecretKey, user);
      if (customerId) {
        await supabase
          .from('user_plans')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscriptionId,
            last_payment_source: 'stripe',
          }, {
            onConflict: 'user_id'
          });
      }
    }

    if (!customerId) {
      return new Response(
        JSON.stringify({
          url: null,
          error: "no_customer",
          message: "No Stripe billing profile found for this account. Subscribe first, or use the email from checkout.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    // Verify customer exists in Stripe before creating portal session
    try {
      const customerCheckResponse = await fetch(
        `https://api.stripe.com/v1/customers/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (!customerCheckResponse.ok) {
        console.warn(`Customer ${customerId} not found in Stripe, searching by email...`);
        const resolved = await findStripeCustomerId(stripeSecretKey, user);
        if (!resolved) {
          return new Response(
            JSON.stringify({
              url: null,
              error: "no_customer",
              message: "No Stripe billing profile found for this account. Subscribe first, or use the email from checkout.",
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
          );
        }

        customerId = resolved;
        await supabase
          .from('user_plans')
          .upsert({
            user_id: user.id,
            stripe_customer_id: customerId,
            last_payment_source: 'stripe',
          }, {
            onConflict: 'user_id'
          });
      }
    } catch (err) {
      console.error('Error verifying customer:', err);
      return new Response(
        JSON.stringify({
          url: null,
          error: "no_customer",
          message: "No Stripe billing profile found for this account. Subscribe first, or use the email from checkout.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const returnUrl = resolvePortalReturnUrl(req, bodyReturnUrl);

    // Create Customer Portal session
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      console.error('Stripe Customer Portal creation error:', errorText);
      return new Response(
        JSON.stringify({
          url: null,
          error: "portal_failed",
          message: "Could not open the billing portal. Check that Stripe Customer Portal is enabled in your Stripe dashboard.",
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      );
    }

    const portal = await portalResponse.json();

    return new Response(
      JSON.stringify({ 
        url: portal.url,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-customer-portal:', error);
    return new Response(
      JSON.stringify({
        url: null,
        error: "portal_failed",
        message: sanitizeErrorMessage(error),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    );
  }
});














```

---

## supabase/functions/get-revenuecat-billing-portal/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  subscriberHasActiveWebBilling,
  webBillingManagementUrlFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Content-Length": "0" } });
  }

  try {
    const secretKey = getRevenueCatServerSecretKey();
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return new Response(JSON.stringify({ url: null, webBilling: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Unauthorized");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    const rc = await fetchRevenueCatSubscriber(secretKey, user.id);
    if (!rc.ok) {
      console.warn("[get-revenuecat-billing-portal] RevenueCat API error:", rc.status);
      return new Response(JSON.stringify({ url: null, webBilling: false }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webBilling = subscriberHasActiveWebBilling(rc.data.subscriber);
    const url = webBillingManagementUrlFromRevenueCatPayload(rc.data);
    return new Response(JSON.stringify({ url, webBilling }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in get-revenuecat-billing-portal:", error);
    return new Response(JSON.stringify({ url: null, webBilling: false, error: "Unauthorized" }), {
      status: 401,
      headers: { ...getCorsHeaders(req.headers.get("origin")), "Content-Type": "application/json" },
    });
  }
});


```

---

## supabase/functions/end-stripe-trial/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      return new Response(JSON.stringify({ error: "Stripe is not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: plan, error: planError } = await supabase
      .from("user_plans")
      .select("stripe_subscription_id, on_trial, status")
      .eq("user_id", user.id)
      .maybeSingle();

    if (planError || !plan) {
      return new Response(JSON.stringify({ error: "No subscription found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const onTrial = plan.on_trial === true || plan.status === "trialing";
    if (!onTrial) {
      return new Response(JSON.stringify({ ok: true, alreadyActive: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscriptionId =
      typeof plan.stripe_subscription_id === "string" ? plan.stripe_subscription_id.trim() : "";
    if (!subscriptionId) {
      return new Response(JSON.stringify({ error: "No Stripe subscription on file" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stripeResponse = await fetch(
      `https://api.stripe.com/v1/subscriptions/${encodeURIComponent(subscriptionId)}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${stripeSecretKey}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({ trial_end: "now" }),
      },
    );

    if (!stripeResponse.ok) {
      const errorText = await stripeResponse.text();
      console.error("[end-stripe-trial] Stripe error:", errorText);
      return new Response(JSON.stringify({ error: "Could not start subscription billing" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const subscription = await stripeResponse.json();
    const stillTrialing = subscription.status === "trialing";
    const newStatus = stillTrialing
      ? "trialing"
      : subscription.status === "past_due"
        ? "past_due"
        : subscription.status === "canceled"
          ? "canceled"
          : "active";

    await supabase
      .from("user_plans")
      .update({
        on_trial: stillTrialing,
        status: newStatus,
        current_period_end: subscription.current_period_end
          ? new Date(subscription.current_period_end * 1000).toISOString()
          : null,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    return new Response(
      JSON.stringify({
        ok: true,
        status: newStatus,
        onTrial: stillTrialing,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (e) {
    console.error("[end-stripe-trial] unhandled:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});


```

---

## supabase/functions/create-board-checkout/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Server-authoritative pricing (cents). Never trust client-sent prices.
const SIZE_PRICE_CENTS: Record<string, number> = {
  "12x24": 9999,
  "18x24": 13999,
  "24x36": 19999,
};

const SIZE_LABEL: Record<string, string> = {
  "12x24": "12Ã—24",
  "18x24": "18Ã—24",
  "24x36": "24Ã—36",
};

const STANDOFFS = new Set(["silver", "gold"]);

const COLOR_LABEL: Record<string, string> = {
  rose_gold: "Rose Gold",
  neon_pink: "Neon Pink",
  light_pink: "Light Pink",
  yellow: "Yellow",
  blue: "Blue",
  sky_blue: "Sky Blue",
  black_opaque: "Black",
  white_opaque: "White",
  clear: "Clear",
  orange: "Orange",
  green: "Green",
  light_green: "Light Green",
  red: "Red",
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

type IncomingLine = { size?: string; standoff?: string; color?: string; quantity?: number };

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 200, headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return json({ error: "Server not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const rawLines: IncomingLine[] = Array.isArray(body.lines) ? body.lines : [];
    const email = typeof body.email === "string" ? body.email.trim() : "";

    if (rawLines.length === 0) return json({ error: "Your cart is empty." }, 400);

    // Validate + normalize lines against the server catalog.
    const lines: Array<{
      size: string;
      standoff: string;
      color: string;
      quantity: number;
      unit_amount: number;
      title: string;
    }> = [];
    let amountSubtotal = 0;

    for (const line of rawLines) {
      const size = String(line.size ?? "");
      const standoff = String(line.standoff ?? "");
      const color = String(line.color ?? "");
      const quantity = Math.min(10, Math.max(1, Math.floor(Number(line.quantity) || 0)));

      if (!SIZE_PRICE_CENTS[size] || !STANDOFFS.has(standoff) || !COLOR_LABEL[color] || quantity < 1) {
        return json({ error: "One of the items in your cart is invalid. Refresh and try again." }, 400);
      }

      const unit_amount = SIZE_PRICE_CENTS[size];
      const title = `Acrylic Wall Board â€” ${COLOR_LABEL[color]} Â· ${SIZE_LABEL[size]} Â· ${standoff.charAt(0).toUpperCase() + standoff.slice(1)} standoffs`;
      lines.push({ size, standoff, color, quantity, unit_amount, title });
      amountSubtotal += unit_amount * quantity;
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Persist a pending order first so the webhook can reconcile by id.
    const { data: order, error: orderErr } = await supabase
      .from("board_orders")
      .insert({
        status: "pending",
        email: email || null,
        currency: "usd",
        amount_subtotal: amountSubtotal,
        lines,
      })
      .select("id")
      .single();

    if (orderErr || !order) {
      console.error("Failed to create board order:", orderErr);
      return json({ error: "Could not start checkout. Please try again." }, 500);
    }

    const requestOrigin =
      req.headers.get("origin") || Deno.env.get("DIGITAL_SITE_ORIGIN") || "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");
    const successUrl = `${baseUrl}/cart?order=success`;
    const cancelUrl = `${baseUrl}/cart?order=cancelled`;

    const formParts: string[] = [];
    formParts.push(`mode=${enc("payment")}`);
    formParts.push(`success_url=${enc(successUrl)}`);
    formParts.push(`cancel_url=${enc(cancelUrl)}`);
    formParts.push(`allow_promotion_codes=true`);
    formParts.push(`shipping_address_collection[allowed_countries][0]=${enc("US")}`);
    formParts.push(`phone_number_collection[enabled]=true`);
    formParts.push(`client_reference_id=${enc(order.id)}`);
    formParts.push(`metadata[product]=${enc("board-order")}`);
    formParts.push(`metadata[order_id]=${enc(order.id)}`);
    formParts.push(`payment_intent_data[metadata][product]=${enc("board-order")}`);
    formParts.push(`payment_intent_data[metadata][order_id]=${enc(order.id)}`);
    if (email) formParts.push(`customer_email=${enc(email)}`);
    else formParts.push(`customer_creation=${enc("always")}`);

    lines.forEach((line, i) => {
      formParts.push(`line_items[${i}][price_data][currency]=${enc("usd")}`);
      formParts.push(`line_items[${i}][price_data][product_data][name]=${enc(line.title)}`);
      formParts.push(`line_items[${i}][price_data][unit_amount]=${enc(String(line.unit_amount))}`);
      formParts.push(`line_items[${i}][quantity]=${enc(String(line.quantity))}`);
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParts.join("&"),
    });

    if (!stripeRes.ok) {
      const errorText = await stripeRes.text();
      console.error("Stripe board checkout error:", errorText);
      return json({ error: "Failed to create checkout session" }, 500);
    }

    const session = await stripeRes.json();

    await supabase
      .from("board_orders")
      .update({ stripe_checkout_session_id: session.id, updated_at: new Date().toISOString() })
      .eq("id", order.id);

    return json({ url: session.url });
  } catch (e) {
    console.error("create-board-checkout error:", e);
    return json({ error: "Internal error" }, 500);
  }
});


```

---

## supabase/functions/create-guide-checkout/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GUIDE_PRODUCT_SLUG, GUIDE_PRODUCT_TITLE, corsHeaders } from "../_shared/digitalGuide.ts";

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function enc(value: string): string {
  return encodeURIComponent(value);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return json({ error: "Server not configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const email = typeof body.email === "string" ? body.email.trim() : "";

    const requestOrigin =
      req.headers.get("origin") ||
      Deno.env.get("DIGITAL_SITE_ORIGIN") ||
      "http://localhost:8080";
    const baseUrl = requestOrigin.replace(/\/$/, "");

    const successUrl = `${baseUrl}/palette-plotting-guide?purchase=success`;
    const cancelUrl = `${baseUrl}/palette-plotting-guide?purchase=cancelled`;

    const formParts: string[] = [];
    formParts.push(`mode=${enc("payment")}`);
    formParts.push(`success_url=${enc(successUrl)}`);
    formParts.push(`cancel_url=${enc(cancelUrl)}`);
    formParts.push(`allow_promotion_codes=true`);
    formParts.push(`metadata[product]=${enc(GUIDE_PRODUCT_SLUG)}`);
    formParts.push(`payment_intent_data[metadata][product]=${enc(GUIDE_PRODUCT_SLUG)}`);

    if (email) {
      formParts.push(`customer_email=${enc(email)}`);
    } else {
      // Ask Stripe to collect the email so the webhook can grant the entitlement.
      formParts.push(`customer_creation=${enc("always")}`);
    }

    const priceId = (Deno.env.get("P_STRIPE_PRICE_GUIDE") || "").trim();
    if (priceId.startsWith("price_")) {
      formParts.push(`line_items[0][price]=${enc(priceId)}`);
      formParts.push(`line_items[0][quantity]=${enc("1")}`);
    } else {
      // Fallback: inline price so the guide can sell without a preconfigured Stripe Price.
      const amount = (Deno.env.get("P_STRIPE_GUIDE_AMOUNT") || "1499").trim();
      formParts.push(`line_items[0][price_data][currency]=${enc("usd")}`);
      formParts.push(`line_items[0][price_data][product_data][name]=${enc(GUIDE_PRODUCT_TITLE)}`);
      formParts.push(`line_items[0][price_data][unit_amount]=${enc(amount)}`);
      formParts.push(`line_items[0][quantity]=${enc("1")}`);
    }

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formParts.join("&"),
    });

    if (!stripeRes.ok) {
      const errorText = await stripeRes.text();
      console.error("Stripe guide checkout error:", errorText);
      return json({ error: "Failed to create checkout session" }, 500);
    }

    const session = await stripeRes.json();
    return json({ url: session.url });
  } catch (e) {
    console.error("create-guide-checkout error:", e);
    return json({ error: "Internal error" }, 500);
  }
});


```

---

## supabase/functions/revenuecat-webhook/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  syncUserPlansFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";
import {
  revenueCatEventIsWebInitialPurchase,
  sendTikTokServerEvent,
  tikTokEventIdFromRevenueCatEvent,
} from "../_shared/tiktokEventsApi.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function collectAppUserIdsFromEvent(event: Record<string, unknown>): string[] {
  const type = typeof event.type === "string" ? event.type : "";
  const out: string[] = [];

  if (type === "TRANSFER") {
    const from = event.transferred_from;
    const to = event.transferred_to;
    if (Array.isArray(from)) {
      for (const x of from) {
        if (typeof x === "string" && x) out.push(x);
      }
    }
    if (Array.isArray(to)) {
      for (const x of to) {
        if (typeof x === "string" && x) out.push(x);
      }
    }
    return out;
  }

  if (typeof event.app_user_id === "string" && event.app_user_id) out.push(event.app_user_id);
  if (typeof event.original_app_user_id === "string" && event.original_app_user_id) {
    out.push(event.original_app_user_id);
  }
  const aliases = event.aliases;
  if (Array.isArray(aliases)) {
    for (const a of aliases) {
      if (typeof a === "string" && a) out.push(a);
    }
  }
  return out;
}

function isSupabaseStyleUserId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

async function maybeMarkOnboardingSessionPaidForRcWeb(
  supabase: ReturnType<typeof createClient>,
  appUserId: string,
  event: Record<string, unknown>,
): Promise<void> {
  if (!revenueCatEventIsWebInitialPurchase(event)) return;

  const paidStatuses = new Set(["paid", "account_created", "active"]);
  let sessionRow: { id: string; status: string; user_id: string | null } | null = null;

  const { data: byUser } = await supabase
    .from("onboarding_sessions")
    .select("id, status, user_id")
    .eq("user_id", appUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byUser?.id) sessionRow = byUser;

  if (!sessionRow) {
    let email: string | null = null;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(appUserId);
      if (!error && data?.user?.email) email = data.user.email.trim().toLowerCase();
    } catch {
      /* ignore */
    }

    if (email) {
      const { data: byEmail } = await supabase
        .from("onboarding_sessions")
        .select("id, status, user_id")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byEmail?.id) sessionRow = byEmail;
    }
  }

  if (!sessionRow?.id) {
    console.log("[revenuecat-webhook] onboarding_sessions: no row to mark paid", { appUserId });
    return;
  }

  if (sessionRow.user_id && sessionRow.user_id !== appUserId) {
    console.warn("[revenuecat-webhook] onboarding_sessions: user_id mismatch", {
      sessionId: sessionRow.id,
      sessionUserId: sessionRow.user_id,
      appUserId,
    });
    return;
  }

  const paidAt = new Date().toISOString();
  const update: Record<string, unknown> = {
    user_id: appUserId,
    updated_at: paidAt,
  };
  if (!paidStatuses.has(sessionRow.status)) {
    update.status = "paid";
    update.paid_at = paidAt;
  }

  const { error } = await supabase
    .from("onboarding_sessions")
    .update(update)
    .eq("id", sessionRow.id);
  if (error) {
    console.warn("[revenuecat-webhook] onboarding_sessions mark paid failed", error.message, {
      sessionId: sessionRow.id,
      appUserId,
    });
  } else {
    console.log("[revenuecat-webhook] onboarding_sessions marked paid", {
      sessionId: sessionRow.id,
      appUserId,
      previousStatus: sessionRow.status,
    });
  }
}

async function maybeSendTikTokCompletePayment(
  supabase: ReturnType<typeof createClient>,
  event: Record<string, unknown>,
  appUserId: string,
): Promise<void> {
  if (!revenueCatEventIsWebInitialPurchase(event)) return;

  let email: string | null = null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(appUserId);
    if (!error && data?.user?.email) {
      email = data.user.email;
    }
  } catch (err) {
    console.warn("[revenuecat-webhook] TikTok: auth lookup failed", err);
  }

  let ttclid: string | null = null;
  try {
    const { data: visitRow } = await supabase
      .from("web_onboarding_sessions")
      .select("ttclid")
      .eq("user_id", appUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (visitRow?.ttclid && String(visitRow.ttclid).trim()) {
      ttclid = String(visitRow.ttclid).trim();
    }
  } catch (err) {
    console.warn("[revenuecat-webhook] TikTok: web onboarding lookup failed", err);
  }

  const price = typeof event.price_in_purchased_currency === "number"
    ? event.price_in_purchased_currency
    : typeof event.price === "number"
    ? event.price
    : null;
  const currency = typeof event.currency === "string" ? event.currency : "USD";
  const eventTimeMs = typeof event.event_timestamp_ms === "number"
    ? event.event_timestamp_ms
    : Date.now();

  const tiktok = await sendTikTokServerEvent({
    event: "Purchase",
    eventId: tikTokEventIdFromRevenueCatEvent(event),
    eventTimeSec: Math.floor(eventTimeMs / 1000),
    email,
    externalId: appUserId,
    ttclid,
    url: "https://paletteplot.com/onboarding/web-paywall",
    contentId: "/onboarding/web-paywall",
    contentName: "web_revenuecat_paywall",
    value: price,
    currency,
  });

  if (!tiktok.ok) {
    console.warn("[revenuecat-webhook] TikTok Purchase not sent", tiktok.detail, {
      appUserId,
      rcEventId: event.id,
    });
  } else {
    console.log("[revenuecat-webhook] TikTok Purchase sent", {
      appUserId,
      eventId: tikTokEventIdFromRevenueCatEvent(event),
    });
  }
}

/**
 * Must match the Authorization header value configured in RevenueCat â†’ Integrations â†’ Webhooks (exact string).
 */
function webhookAuthValid(req: Request): boolean {
  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION");
  if (!expected || expected.trim() === "") {
    console.error("[revenuecat-webhook] REVENUECAT_WEBHOOK_AUTHORIZATION is not set");
    return false;
  }
  const got = req.headers.get("Authorization")?.trim() ?? "";
  return got === expected.trim();
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!webhookAuthValid(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secretKey = getRevenueCatServerSecretKey();
  if (!secretKey || !secretKey.startsWith("sk_")) {
    console.error(
      "[revenuecat-webhook] RevenueCat server secret missing or invalid (set REVENUECAT_SECRET_KEY or revenuecat_secret_key to sk_...)"
    );
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const root = payload as Record<string, unknown>;
  const event = (root.event && typeof root.event === "object" && root.event !== null
    ? root.event
    : root) as Record<string, unknown>;

  const eventType = typeof event.type === "string" ? event.type : "";
  if (eventType === "TEST") {
    return new Response(JSON.stringify({ ok: true, ignored: "TEST" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawIds = collectAppUserIdsFromEvent(event);
  const userIds = [...new Set(rawIds.filter(isSupabaseStyleUserId))];

  if (userIds.length === 0) {
    console.log("[revenuecat-webhook] No UUID app_user_ids in event", { eventType, event_id: event.id });
    return new Response(JSON.stringify({ ok: true, synced: 0, note: "no_matching_user_ids" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: { user_id: string; ok: boolean; detail?: string }[] = [];

  for (const appUserId of userIds) {
    const rc = await fetchRevenueCatSubscriber(secretKey, appUserId);
    if (!rc.ok) {
      if (rc.status === 404) {
        results.push({ user_id: appUserId, ok: true, detail: "subscriber_not_found" });
        continue;
      }
      console.error("[revenuecat-webhook] RC fetch failed", appUserId, rc.status, rc.body);
      results.push({ user_id: appUserId, ok: false, detail: `rc_${rc.status}` });
      continue;
    }

    const sync = await syncUserPlansFromRevenueCatPayload(supabase, appUserId, rc.data, {
      sendWelcomeEmail: false,
      webhookEvent: event,
    });
    if (!sync.ok) {
      results.push({ user_id: appUserId, ok: false, detail: sync.error });
      continue;
    }

    try {
      await maybeMarkOnboardingSessionPaidForRcWeb(supabase, appUserId, event);
    } catch (obErr) {
      console.warn("[revenuecat-webhook] onboarding_sessions hook failed (non-fatal)", obErr);
    }

    try {
      await maybeSendTikTokCompletePayment(supabase, event, appUserId);
    } catch (tiktokErr) {
      console.warn("[revenuecat-webhook] TikTok hook failed (non-fatal)", tiktokErr);
    }

    results.push({
      user_id: appUserId,
      ok: true,
      detail: sync.preservedStripe
        ? "preserved_stripe"
        : "preservedExistingPlan" in sync && sync.preservedExistingPlan
        ? "preserved_existing_plan"
        : sync.active
        ? "active"
        : sync.downgraded
        ? "downgraded"
        : "inactive_noop",
    });
  }

  const anyFailed = results.some((r) => !r.ok);
  if (anyFailed) {
    console.error("[revenuecat-webhook] One or more syncs failed", { eventType, results });
  }
  // Always 200 so RevenueCat does not retry the same payload indefinitely; failures are logged above.
  return new Response(JSON.stringify({ ok: !anyFailed, event_type: eventType, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});


```

---

## supabase/functions/sync-revenuecat-entitlement/index.ts

```ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  syncUserPlansFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";

function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  if (!(error instanceof Error)) return defaultMessage;
  const message = error.message.toLowerCase();
  if (
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("rls") ||
    message.includes("permission")
  ) {
    return "Permission denied. Please ensure you're logged in.";
  }
  return defaultMessage;
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

/** Optional payload from iOS client: onboarding choices to write to user_preferences, profiles, and user_plans. */
interface OnboardingPrefs {
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  routine_intensity?: string | null;
  routine_items?: unknown[] | null;
  routine_notification_times?: string[] | null;
  timezone?: string | null;
  notification_permission_status?: string | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
  preferred_locale?: string | null;
  preferred_reminder_channels?: string | null;
  phone_number_e164?: string | null;
  sms_reminders_enabled?: boolean | null;
  sms_reminder_consent_at?: string | null;
  sms_reminder_consent_source?: string | null;
}

const VALID_ROUTINE_INTENSITIES = new Set(["light", "consistent", "locked_in"]);

async function markOnboardingSessionPaidForUser(
  supabase: ReturnType<typeof createClient>,
  appUserId: string,
): Promise<void> {
  const paidStatuses = new Set(["paid", "account_created", "active"]);
  let sessionRow: { id: string; status: string; user_id: string | null } | null = null;

  const { data: byUser } = await supabase
    .from("onboarding_sessions")
    .select("id, status, user_id")
    .eq("user_id", appUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byUser?.id) sessionRow = byUser;

  if (!sessionRow) {
    let email: string | null = null;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(appUserId);
      if (!error && data?.user?.email) email = data.user.email.trim().toLowerCase();
    } catch {
      /* ignore */
    }

    if (email) {
      const { data: byEmail } = await supabase
        .from("onboarding_sessions")
        .select("id, status, user_id")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byEmail?.id) sessionRow = byEmail;
    }
  }

  if (!sessionRow?.id) return;

  if (sessionRow.user_id && sessionRow.user_id !== appUserId) return;

  const paidAt = new Date().toISOString();
  const update: Record<string, unknown> = {
    user_id: appUserId,
    updated_at: paidAt,
  };
  if (!paidStatuses.has(sessionRow.status)) {
    update.status = "paid";
    update.paid_at = paidAt;
  }

  const { error } = await supabase
    .from("onboarding_sessions")
    .update(update)
    .eq("id", sessionRow.id);
  if (error) {
    console.warn("[sync-revenuecat-entitlement] onboarding_sessions mark paid failed", error.message);
  }
}

function applyOnboardingPrefs(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  prefs: OnboardingPrefs
): Promise<void> {
  const prefsKeys = Object.keys(prefs) as (keyof OnboardingPrefs)[];
  if (prefsKeys.length === 0) return Promise.resolve();

  const profileUpdates: Record<string, unknown> = {};
  if (prefs.first_name !== undefined) profileUpdates.first_name = prefs.first_name;
  if (prefs.username !== undefined) profileUpdates.username = prefs.username;
  if (prefs.onboarding_answers !== undefined) profileUpdates.onboarding_answers = prefs.onboarding_answers;
  if (prefs.app_notifications_enabled !== undefined) {
    profileUpdates.app_notifications_enabled = prefs.app_notifications_enabled;
  }
  if (
    typeof prefs.routine_intensity === "string" &&
    VALID_ROUTINE_INTENSITIES.has(prefs.routine_intensity)
  ) {
    profileUpdates.routine_intensity = prefs.routine_intensity;
  }
  if (prefs.routine_items !== undefined) {
    profileUpdates.routine_items = Array.isArray(prefs.routine_items) ? prefs.routine_items : [];
  }
  if (prefs.routine_notification_times !== undefined) {
    profileUpdates.routine_notification_times = Array.isArray(prefs.routine_notification_times)
      ? prefs.routine_notification_times
      : [];
  }
  if (typeof prefs.timezone === "string" && prefs.timezone.trim()) {
    profileUpdates.timezone = prefs.timezone.trim();
  }
  if (
    prefs.notification_permission_status === "granted" ||
    prefs.notification_permission_status === "denied" ||
    prefs.notification_permission_status === "skipped"
  ) {
    profileUpdates.notification_permission_status = prefs.notification_permission_status;
  }

  const prefUpdates: Record<string, unknown> = {
    user_id: userId,
  };
  if (prefs.app_notifications_enabled !== undefined) prefUpdates.app_notifications_enabled = prefs.app_notifications_enabled;
  if (
    typeof prefs.routine_intensity === "string" &&
    VALID_ROUTINE_INTENSITIES.has(prefs.routine_intensity)
  ) {
    prefUpdates.routine_intensity = prefs.routine_intensity;
  }
  if (prefs.routine_items !== undefined) {
    prefUpdates.routine_items = Array.isArray(prefs.routine_items) ? prefs.routine_items : [];
  }
  if (prefs.routine_notification_times !== undefined) {
    prefUpdates.routine_notification_times = Array.isArray(prefs.routine_notification_times)
      ? prefs.routine_notification_times
      : [];
  }
  if (typeof prefs.timezone === "string" && prefs.timezone.trim()) {
    prefUpdates.timezone = prefs.timezone.trim();
  }
  if (
    prefs.notification_permission_status === "granted" ||
    prefs.notification_permission_status === "denied" ||
    prefs.notification_permission_status === "skipped"
  ) {
    prefUpdates.notification_permission_status = prefs.notification_permission_status;
  }
  if (prefs.texts_enabled !== undefined) prefUpdates.texts_enabled = prefs.texts_enabled;
  if (prefs.email_marketing !== undefined) prefUpdates.email_marketing = prefs.email_marketing;
  if (prefs.preferred_send_window !== undefined) {
    const w = prefs.preferred_send_window;
    prefUpdates.preferred_send_window = w === "morning" || w === "evening" || w === "both" ? w : "both";
  }
  if (prefs.embody_active_practices !== undefined) {
    prefUpdates.embody_active_practices = Array.isArray(prefs.embody_active_practices) ? prefs.embody_active_practices : null;
  }
  const locale = typeof prefs.preferred_locale === "string" ? prefs.preferred_locale.trim() : "";
  if (locale === "en" || locale === "es-419" || locale === "pt-BR") {
    prefUpdates.preferred_locale = locale;
    profileUpdates.preferred_locale = locale;
  }
  if (typeof prefs.preferred_reminder_channels === "string" && prefs.preferred_reminder_channels.trim()) {
    prefUpdates.preferred_reminder_channels = prefs.preferred_reminder_channels.trim();
  }
  if (typeof prefs.phone_number_e164 === "string" && prefs.phone_number_e164.trim()) {
    prefUpdates.phone_number_e164 = prefs.phone_number_e164.trim();
    profileUpdates.phone = prefs.phone_number_e164.trim();
  }
  if (prefs.sms_reminders_enabled !== undefined) {
    prefUpdates.sms_reminders_enabled = prefs.sms_reminders_enabled === true;
  }
  if (typeof prefs.sms_reminder_consent_at === "string" && prefs.sms_reminder_consent_at.trim()) {
    prefUpdates.sms_reminder_consent_at = prefs.sms_reminder_consent_at.trim();
  }
  if (typeof prefs.sms_reminder_consent_source === "string" && prefs.sms_reminder_consent_source.trim()) {
    prefUpdates.sms_reminder_consent_source = prefs.sms_reminder_consent_source.trim();
  }

  return (async () => {
    if (Object.keys(profileUpdates).length > 0) {
      try {
        await supabase.from("profiles").upsert(
          { id: userId, ...profileUpdates },
          { onConflict: "id" }
        );
      } catch (e) {
        console.warn("Non-fatal: failed to upsert profiles from onboarding_prefs:", e);
      }
    }
    if (Object.keys(prefUpdates).length > 1) {
      try {
        await supabase.from("user_preferences").upsert(prefUpdates, { onConflict: "user_id" });
      } catch (e) {
        console.warn("Non-fatal: failed to upsert user_preferences from onboarding_prefs:", e);
      }
    }
  })();
}

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Content-Length": "0" } });
  }

  try {
    const secretKey = getRevenueCatServerSecretKey();
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return new Response(
        JSON.stringify({ error: "RevenueCat secret key not configured" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    let body: { onboarding_prefs?: OnboardingPrefs } = {};
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw) as { onboarding_prefs?: OnboardingPrefs };
      }
    } catch {
      // no body or invalid JSON â€“ do not break payment path
    }

    const appUserId = user.id;
    const rc = await fetchRevenueCatSubscriber(secretKey, appUserId);
    if (!rc.ok) {
      console.error("[sync-revenuecat-entitlement] RevenueCat API error:", rc.status, rc.body);
      return new Response(
        JSON.stringify({ error: "Could not verify subscription" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await syncUserPlansFromRevenueCatPayload(supabase, appUserId, rc.data, {});

    if (!result.ok) {
      throw new Error(result.error);
    }

    if (result.preservedStripe) {
      console.log(
        "[sync-revenuecat-entitlement] Sync applied; Stripe cus_/sub_ identity kept (latest expiry vs RC).",
      );
      try {
        await markOnboardingSessionPaidForUser(supabase, appUserId);
      } catch (e) {
        console.warn("[sync-revenuecat-entitlement] onboarding_sessions mark paid failed (non-fatal):", e);
      }
      return new Response(
        JSON.stringify({
          success: true,
          active: true,
          preservedStripeBilling: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if ("preservedExistingPlan" in result && result.preservedExistingPlan) {
      console.error(
        "[sync-revenuecat-entitlement] RC reports inactive entitlement but DB plan active with future period; left unchanged",
      );
      return new Response(
        JSON.stringify({
          success: false,
          active: false,
          preservedExisting: true,
          error:
            "Subscription sync did not show an active entitlement; your existing plan with a future period was left unchanged.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!result.active) {
      return new Response(
        JSON.stringify({
          success: true,
          active: false,
          downgraded: result.downgraded === true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body?.onboarding_prefs && typeof body.onboarding_prefs === "object") {
      try {
        await applyOnboardingPrefs(supabase, user.id, body.onboarding_prefs);
      } catch (e) {
        console.warn("[sync-revenuecat-entitlement] onboarding_prefs apply failed (non-fatal):", e);
      }
    }

    try {
      await markOnboardingSessionPaidForUser(supabase, appUserId);
    } catch (e) {
      console.warn("[sync-revenuecat-entitlement] onboarding_sessions mark paid failed (non-fatal):", e);
    }

    return new Response(JSON.stringify({ success: true, active: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-revenuecat-entitlement:", error);
    const errorOrigin = req.headers.get("origin") || req.headers.get("referer") || "*";
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 500,
        headers: { ...getCorsHeaders(errorOrigin), "Content-Type": "application/json" },
      }
    );
  }
});


```

---

## supabase/functions/_shared/postStripeToRevenueCat.ts

```ts
/**
 * Sends a Stripe subscription or Checkout Session to RevenueCat so web purchases unlock the same
 * entitlements as mobile (Stripe Billing integration).
 *
 * @see https://www.revenuecat.com/docs/web/integrations/stripe
 *
 * Env: REVENUECAT_STRIPE_APP_PUBLIC_API_KEY â€” "Stripe public API key" from RevenueCat â†’ your app â†’
 *      API keys (NOT the sk_ secret used for /v1/subscribers). If unset, calls are no-ops.
 *
 * Dashboard: Connect Stripe to RevenueCat; add each Stripe *product* to an entitlement with a
 * product identifier matching Stripe's prod_â€¦ id exactly. Your existing Stripe Price IDs on
 * Checkout do not need separate REST setup â€” RC reads the subscription from Stripe using the token.
 */
/** @returns true when RC accepted the Stripe token, false when skipped or failed (non-throwing). */
export async function postStripePurchaseToRevenueCat(
  appUserId: string,
  fetchToken: string | null | undefined,
): Promise<boolean> {
  if (Deno.env.get("SYNC_WEB_STRIPE_TO_REVENUECAT") !== "true") {
    return false;
  }

  if (!fetchToken || typeof fetchToken !== "string" || !fetchToken.trim()) return false;

  const apiKey = Deno.env.get("REVENUECAT_STRIPE_APP_PUBLIC_API_KEY")?.trim();
  if (!apiKey) {
    console.warn("[postStripeToRevenueCat] REVENUECAT_STRIPE_APP_PUBLIC_API_KEY not set; skipping");
    return false;
  }

  try {
    const res = await fetch("https://api.revenuecat.com/v1/receipts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "X-Platform": "stripe",
      },
      body: JSON.stringify({
        app_user_id: appUserId,
        fetch_token: fetchToken.trim(),
      }),
    });

    const text = await res.text();
    if (!res.ok) {
      console.warn(
        "[postStripeToRevenueCat] RevenueCat /v1/receipts failed:",
        res.status,
        text.slice(0, 800),
      );
      return false;
    }
    console.log("[postStripeToRevenueCat] synced Stripe token for app_user_id", appUserId);
    return true;
  } catch (e) {
    console.warn("[postStripeToRevenueCat] request error (non-fatal):", e);
    return false;
  }
}


```

---

## supabase/functions/_shared/revenueCatSecretEnv.ts

```ts
/**
 * RevenueCat REST API secret (`sk_...`) for Edge Functions.
 * Standard Supabase secret name: `REVENUECAT_SECRET_KEY`.
 * Also accepts `revenuecat_secret_key` for projects that created the secret under that name.
 */
export function getRevenueCatServerSecretKey(): string | undefined {
  const primary = Deno.env.get("REVENUECAT_SECRET_KEY")?.trim();
  if (primary) return primary;
  return Deno.env.get("revenuecat_secret_key")?.trim();
}


```

---

## supabase/functions/_shared/revenuecatUserPlansSync.ts

```ts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type SupabaseServiceClient = ReturnType<typeof createClient>;

export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";
export const REVENUECAT_API = "https://api.revenuecat.com/v1/subscribers";

/** Parse user_plans.current_period_end â†’ ms, or NaN. */
function parsePeriodEndMs(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return NaN;
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * RC entitlement expiry for max() comparison. Empty expires_date â‡’ still subscribed (treat as +âˆž).
 */
function revenueCatEntitlementExpiresEndMs(entitlement: RevenueCatEntitlement): number {
  if (entitlement.expires_date == null || String(entitlement.expires_date).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }
  const t = new Date(String(entitlement.expires_date)).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export interface RevenueCatEntitlement {
  expires_date?: string | null;
  product_identifier?: string;
  purchase_date?: string;
  /** Trial / intro / normal â€” RevenueCat REST (often lowercase). */
  period_type?: string | null;
}

export interface RevenueCatSubscriptionEntry {
  period_type?: string | null;
  expires_date?: string | null;
  /** e.g. APP_STORE, PLAY_STORE â€” RevenueCat REST subscriber.subscriptions[productId].store */
  store?: string | null;
  store_transaction_id?: string | null;
  original_store_transaction_id?: string | null;
}

export interface RevenueCatSubscriberResponse {
  subscriber?: {
    /** Platform-correct portal link from GET /v1/subscribers (web billing â†’ billing.revenuecat.com or RC portal redirect). */
    management_url?: string | null;
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscriptionEntry>;
  };
}

function normPeriodType(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Initial profile â†’ user_plans copy only when this column on user_plans is not set yet (later RC syncs do not replace). */
function userPlansIdentityUnset(v: unknown): boolean {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/** Sticky signal from RC snapshot: any subscription row or entitlement shows trial period type. */
export function revenueCatIndicatesHadTrialFromSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (ent && normPeriodType(ent.period_type) === "trial") return true;

  const subs = subscriber?.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const entry = subs[key];
    if (!entry || typeof entry !== "object") continue;
    if (normPeriodType(entry.period_type) === "trial") return true;
  }
  return false;
}

function subscriptionExpiresMs(entry: RevenueCatSubscriptionEntry): number {
  const raw = entry.expires_date;
  if (raw == null || raw === "") return NaN;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * True if the Palette Plotting entitlement is active and RC reports the current period is a free trial
 * (entitlement.period_type or the linked subscription row).
 */
export function revenueCatOnTrialNow(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  nowMs: number,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (!ent) return false;
  const entActive =
    ent.expires_date == null || ent.expires_date === "" || new Date(String(ent.expires_date)).getTime() > nowMs;
  if (!entActive) return false;

  if (normPeriodType(ent.period_type) === "trial") return true;

  const pid = ent.product_identifier;
  if (pid && subscriber?.subscriptions?.[pid]) {
    const sub = subscriber.subscriptions[pid]!;
    const subMs = subscriptionExpiresMs(sub);
    const subActive = Number.isNaN(subMs) || subMs > nowMs;
    if (subActive && normPeriodType(sub.period_type) === "trial") return true;
  }

  return false;
}

/** Webhook event fields (uppercase TRIAL in docs) â€” trial start or conversion off trial still counts as ever had trial. */
export function webhookEventImpliesHadTrial(event: Record<string, unknown>): boolean {
  if (normPeriodType(event.period_type) === "trial") return true;
  if (event.is_trial_conversion === true) return true;
  return false;
}

function normalizedRevenueCatStore(store: unknown): string {
  return String(store ?? "").trim().toUpperCase().replace(/-/g, "_");
}

function isAppleStoreFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "APP_STORE" || s === "MAC_APP_STORE";
}

/** RC Web Billing (purchases-js / Stripe gateway under RC). v1 REST often reports store `stripe`. */
function isWebBillingFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "STRIPE" || s === "RC_BILLING" || s === "RCBILLING" || s === "WEB";
}

function isGooglePlayFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "PLAY_STORE" || s === "GOOGLE_PLAY";
}

/** True when RC subscriber payload or webhook shows Stripe / RC Web Billing (not App Store). */
function isWebBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  activeProductId: string,
  nowMs: number,
): boolean {
  if (webhookEvent && isWebBillingFromRcStore(webhookEvent.store)) return true;
  if (subscriberHasActiveWebBilling(subscriber, entitlementId, nowMs)) return true;

  const mgmt = subscriber?.management_url;
  if (typeof mgmt === "string" && isRevenueCatWebBillingPortalUrl(mgmt)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isWebBillingFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isWebBillingFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

function isAppleBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  appleCustomerId: string | null,
  activeProductId: string,
): boolean {
  if (appleCustomerId) return true;
  if (webhookEvent && isAppleStoreFromRcStore(webhookEvent.store)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isAppleStoreFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isAppleStoreFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

function isGooglePlayBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  webhookEvent: Record<string, unknown> | undefined,
  activeProductId: string,
): boolean {
  if (webhookEvent && isGooglePlayFromRcStore(webhookEvent.store)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isGooglePlayFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isGooglePlayFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

/** Never label RC Web Billing / Stripe as apple â€” default RC-placeholder rows to stripe unless App Store is confirmed. */
function lastPaymentSourceFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  appleCustomerId: string | null,
  activeProductId: string,
  nowMs: number,
  existingLastPaymentSource: string | null | undefined,
): "stripe" | "apple" | "google_play" {
  if (isWebBillingFromRcContext(subscriber, entitlementId, webhookEvent, activeProductId, nowMs)) {
    return "stripe";
  }
  if (isAppleBillingFromRcContext(subscriber, entitlementId, webhookEvent, appleCustomerId, activeProductId)) {
    return "apple";
  }
  if (isGooglePlayBillingFromRcContext(subscriber, webhookEvent, activeProductId)) {
    return "google_play";
  }
  if (existingLastPaymentSource === "stripe" || existingLastPaymentSource === "apple" ||
    existingLastPaymentSource === "google_play") {
    return existingLastPaymentSource;
  }
  return "stripe";
}

/** Tokenized portal or RC API redirect used by Web Billing management emails. */
export function isRevenueCatWebBillingPortalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "billing.revenuecat.com") return true;
    if (parsed.hostname === "api.revenuecat.com" && /\/rcbilling\//i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

export function subscriberHasActiveWebBilling(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string = REVENUECAT_ENTITLEMENT_ID,
  nowMs = Date.now(),
): boolean {
  if (!subscriber) return false;

  const ent = subscriber.entitlements?.[entitlementId];
  if (ent) {
    const entActive =
      ent.expires_date == null ||
      ent.expires_date === "" ||
      new Date(String(ent.expires_date)).getTime() > nowMs;
    if (entActive) {
      const pid = ent.product_identifier?.trim();
      if (pid && subscriber.subscriptions?.[pid]) {
        if (isWebBillingFromRcStore(subscriber.subscriptions[pid].store)) return true;
      }
    }
  }

  const subs = subscriber.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const sub = subs[key];
    if (!sub || typeof sub !== "object" || !isWebBillingFromRcStore(sub.store)) continue;
    const subMs = subscriptionExpiresMs(sub);
    if (Number.isNaN(subMs) || subMs > nowMs) return true;
  }
  return false;
}

/** Resolve RC Web Billing customer portal URL from GET /v1/subscribers payload. */
export function webBillingManagementUrlFromRevenueCatPayload(
  data: RevenueCatSubscriberResponse,
  entitlementId: string = REVENUECAT_ENTITLEMENT_ID,
): string | null {
  const subscriber = data.subscriber;
  if (!subscriber || !subscriberHasActiveWebBilling(subscriber, entitlementId)) return null;

  const url = typeof subscriber.management_url === "string" ? subscriber.management_url.trim() : "";
  if (url && isRevenueCatWebBillingPortalUrl(url)) return url;
  return null;
}

/**
 * Apple transaction id for user_plans.apple_customer_id from GET /subscribers (subscription row for entitlement product).
 * Prefers original_store_transaction_id when present (stable across renewals), else store_transaction_id.
 */
export function appleCustomerIdFromRevenueCatSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): string | null {
  if (!subscriber) return null;
  const ent = subscriber.entitlements?.[entitlementId];
  const pid = ent?.product_identifier?.trim();
  if (!pid) return null;
  const sub = subscriber.subscriptions?.[pid] as RevenueCatSubscriptionEntry | undefined;
  if (!sub || typeof sub !== "object") return null;
  if (!isAppleStoreFromRcStore(sub.store)) return null;
  const orig = sub.original_store_transaction_id?.trim();
  if (orig) return orig;
  const cur = sub.store_transaction_id?.trim();
  if (cur) return cur;
  return null;
}

/** Webhook payload may include transaction ids when store is App Store. */
function appleCustomerIdFromWebhookEvent(event: Record<string, unknown>): string | null {
  if (!isAppleStoreFromRcStore(event.store)) return null;
  const o = event.original_transaction_id;
  const t = event.transaction_id;
  if (typeof o === "string" && o.trim()) return o.trim();
  if (typeof t === "string" && t.trim()) return t.trim();
  const st = event.store_transaction_id;
  if (typeof st === "string" && st.trim()) return st.trim();
  return null;
}

export async function fetchRevenueCatSubscriber(
  secretKey: string,
  appUserId: string,
): Promise<{ ok: true; data: RevenueCatSubscriberResponse } | { ok: false; status: number; body: string }> {
  const encodedId = encodeURIComponent(appUserId);
  const rcRes = await fetch(`${REVENUECAT_API}/${encodedId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!rcRes.ok) {
    const body = await rcRes.text();
    return { ok: false, status: rcRes.status, body };
  }
  const data = (await rcRes.json()) as RevenueCatSubscriberResponse;
  return { ok: true, data };
}

export type RevenueCatSyncResult =
  /** `preservedStripe`: after sync, row uses real Stripe `cus_`/`sub_` + `last_payment_source: stripe` (latest expiry vs RC favored Stripe identity). */
  | { ok: true; active: true; preservedStripe: true }
  | { ok: true; active: true; preservedStripe?: false }
  | { ok: true; active: false; preservedExistingPlan: true }
  | { ok: true; active: false; downgraded?: boolean }
  | { ok: false; error: string };

/**
 * Applies RevenueCat subscriber payload to user_plans (same fields as client sync-revenuecat-entitlement).
 * Active entitlement: compares Stripe `current_period_end` vs RC entitlement end; **latest expiry wins** for
 * `current_period_end` and for billing identity: sets `stripe_customer_id`, `stripe_subscription_id`, and
 * `last_payment_source` together (Stripe `cus_`/`sub_` vs RC placeholders) so rows stay consistent.
 * Does not read or write `stripe_customer_id_official` â€” documentation-only (Stripe checkout).
 * When entitlement is inactive: if DB still shows active with a future current_period_end, leaves row unchanged.
 * Otherwise marks canceled, keeping last period end when possible.
 */
export async function syncUserPlansFromRevenueCatPayload(
  supabase: SupabaseServiceClient,
  appUserId: string,
  rcData: RevenueCatSubscriberResponse,
  opts: { webhookEvent?: Record<string, unknown> },
): Promise<RevenueCatSyncResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const entitlement = rcData.subscriber?.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  const isActive =
    !!entitlement &&
    (entitlement.expires_date == null ||
      entitlement.expires_date === "" ||
      new Date(entitlement.expires_date) > now);

  const { data: existingBeforeRc } = await supabase
    .from("user_plans")
    .select(
      "last_payment_source, stripe_customer_id, stripe_subscription_id, status, current_period_end, had_trial, on_trial",
    )
    .eq("user_id", appUserId)
    .maybeSingle();

  const appleCustomerId =
    appleCustomerIdFromRevenueCatSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID) ??
    (opts.webhookEvent ? appleCustomerIdFromWebhookEvent(opts.webhookEvent) : null);

  if (!isActive) {
    if (!existingBeforeRc) {
      return { ok: true, active: false };
    }
    const rowForPreserve = existingBeforeRc as {
      status?: string | null;
      current_period_end?: string | null;
    };
    const periodEndMsForPreserve = rowForPreserve.current_period_end
      ? new Date(rowForPreserve.current_period_end).getTime()
      : NaN;
    const hasFuturePeriodInDb =
      !Number.isNaN(periodEndMsForPreserve) && periodEndMsForPreserve > nowMs;
    const isActiveStatusInDb = rowForPreserve.status === "active";
    if (isActiveStatusInDb && hasFuturePeriodInDb) {
      console.error(
        "[revenuecatUserPlansSync] RC inactive but user_plans active with future period; leaving row unchanged",
      );
      return { ok: true, active: false, preservedExistingPlan: true };
    }

    const hadTrial = Boolean((existingBeforeRc as { had_trial?: boolean | null }).had_trial);
    let periodEndToKeep: string | null = null;
    const rawExp = entitlement?.expires_date;
    if (rawExp != null && String(rawExp).trim() !== "") {
      const d = new Date(String(rawExp));
      if (Number.isFinite(d.getTime())) periodEndToKeep = d.toISOString();
    }
    if (!periodEndToKeep) {
      const existingEnd = (existingBeforeRc as { current_period_end?: string | null }).current_period_end;
      if (existingEnd) periodEndToKeep = existingEnd;
    }
    // Do not set tier to "basic" â€” keep monthly/annual for reactivation UX. Keep last period end instead of null.
    const prevLps = (existingBeforeRc as { last_payment_source?: string | null }).last_payment_source;
    const cancelProductId = entitlement?.product_identifier?.trim() ?? "";
    const lastPaymentSource = lastPaymentSourceFromRcContext(
      rcData.subscriber,
      REVENUECAT_ENTITLEMENT_ID,
      opts.webhookEvent,
      appleCustomerId,
      cancelProductId,
      nowMs,
      prevLps,
    );
    const { error: downErr } = await supabase
      .from("user_plans")
      .update({
        status: "canceled",
        last_payment_source: lastPaymentSource,
        ...(periodEndToKeep != null ? { current_period_end: periodEndToKeep } : {}),
        ...(appleCustomerId != null ? { apple_customer_id: appleCustomerId } : {}),
        updated_at: now.toISOString(),
        had_trial: hadTrial,
        on_trial: false,
      })
      .eq("user_id", appUserId);
    if (downErr) {
      console.error("[revenuecatUserPlansSync] downgrade error:", downErr);
      return { ok: false, error: downErr.message };
    }
    const { error: cancelRemErr } = await supabase
      .from("board_reminders")
      .update({ status: "cancelled" })
      .eq("user_id", appUserId)
      .eq("status", "scheduled");
    if (cancelRemErr) {
      console.warn("[revenuecatUserPlansSync] board_reminders cancel:", cancelRemErr);
    }
    return { ok: true, active: false, downgraded: true };
  }

  const productId = (entitlement!.product_identifier ?? "").toLowerCase();
  const billing = productId.includes("annual")
    ? "annual"
    : productId.includes("weekly")
      ? "weekly"
      : "monthly";

  const dbEndMs = parsePeriodEndMs(
    (existingBeforeRc as { current_period_end?: string | null } | null)?.current_period_end,
  );
  const rcEndRaw = revenueCatEntitlementExpiresEndMs(entitlement!);
  const stripeComparable = Number.isFinite(dbEndMs) ? dbEndMs : Number.NEGATIVE_INFINITY;
  const rcComparable = rcEndRaw === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : (Number.isFinite(rcEndRaw) ? rcEndRaw : Number.NEGATIVE_INFINITY);

  const mergedEndMs = Math.max(stripeComparable, rcComparable);
  const finalPeriodEndIso =
    mergedEndMs === Number.POSITIVE_INFINITY || !Number.isFinite(mergedEndMs)
      ? null
      : new Date(mergedEndMs).toISOString();

  const ex = existingBeforeRc as {
    last_payment_source?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
  /** Both required to keep a coherent Stripe row (portal + webhooks resolve by `sub_`). */
  const hasFullStripeIds =
    !!ex?.stripe_customer_id?.trim().startsWith("cus_") &&
    !!ex?.stripe_subscription_id?.trim().startsWith("sub_");

  /** Apple/RC placeholders win when RC expiry is later, or we lack real Stripe ids to compare. */
  let billingIsApple: boolean;
  if (!hasFullStripeIds) {
    billingIsApple = true;
  } else if (rcComparable > stripeComparable) {
    billingIsApple = true;
  } else if (stripeComparable > rcComparable) {
    billingIsApple = false;
  } else {
    // Tie: prefer existing Stripe-backed row when `last_payment_source` is already stripe
    billingIsApple = ex?.last_payment_source !== "stripe";
  }

  const rcHadTrialSnapshot = revenueCatIndicatesHadTrialFromSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID);
  const eventHintHadTrial = opts.webhookEvent ? webhookEventImpliesHadTrial(opts.webhookEvent) : false;
  const hadTrialMerged =
    Boolean((existingBeforeRc as { had_trial?: boolean | null } | null)?.had_trial) ||
    rcHadTrialSnapshot ||
    eventHintHadTrial;

  const onTrialNow = revenueCatOnTrialNow(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID, nowMs);

  let userEmail: string | null = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(appUserId);
    userEmail = authData.user?.email ?? null;
  } catch {
    /* non-fatal */
  }

  // Billing columns on upsert (omit stripe_customer_id_official â€” documentation column only).
  const planData: Record<string, unknown> = {
    user_id: appUserId,
    tier: "premium",
    billing_period: billing,
    status: "active",
    current_period_end: finalPeriodEndIso,
    updated_at: now.toISOString(),
    had_trial: hadTrialMerged,
    on_trial: onTrialNow,
  };
  if (billingIsApple) {
    planData.stripe_customer_id = `revenuecat:${appUserId}`;
    planData.stripe_subscription_id = `rc_${appUserId}`;
    const activeProductId = entitlement!.product_identifier?.trim() ?? "";
    planData.last_payment_source = lastPaymentSourceFromRcContext(
      rcData.subscriber,
      REVENUECAT_ENTITLEMENT_ID,
      opts.webhookEvent,
      appleCustomerId,
      activeProductId,
      nowMs,
      ex?.last_payment_source,
    );
  } else {
    planData.stripe_customer_id = ex!.stripe_customer_id;
    planData.stripe_subscription_id = ex!.stripe_subscription_id ?? null;
    planData.last_payment_source = "stripe";
  }
  if (appleCustomerId != null) planData.apple_customer_id = appleCustomerId;

  const { error: planError } = await supabase.from("user_plans").upsert(planData, {
    onConflict: "user_id",
  });
  if (planError) {
    console.error("[revenuecatUserPlansSync] upsert error:", planError);
    return { ok: false, error: planError.message };
  }

  try {
    const [{ data: planRow }, { data: prof }] = await Promise.all([
      supabase
        .from("user_plans")
        .select("first_name, username, phone, email")
        .eq("user_id", appUserId)
        .maybeSingle(),
      supabase.from("profiles").select("first_name, username, phone, email").eq("id", appUserId).maybeSingle(),
    ]);
    const identityPatch: Record<string, unknown> = {};
    if (planRow && prof) {
      if (userPlansIdentityUnset(planRow.first_name) && prof.first_name != null && String(prof.first_name).trim() !== "") {
        identityPatch.first_name = prof.first_name;
      }
      if (userPlansIdentityUnset(planRow.username) && prof.username != null && String(prof.username).trim() !== "") {
        identityPatch.username = prof.username;
      }
      if (userPlansIdentityUnset(planRow.phone) && prof.phone != null && String(prof.phone).trim() !== "") {
        identityPatch.phone = prof.phone;
      }
      if (userPlansIdentityUnset(planRow.email) && prof.email != null && String(prof.email).trim() !== "") {
        identityPatch.email = prof.email;
      }
    }
    if (Object.keys(identityPatch).length > 0) {
      const { error: idErr } = await supabase.from("user_plans").update(identityPatch).eq("user_id", appUserId);
      if (idErr) console.warn("[revenuecatUserPlansSync] profile mirror to user_plans failed (non-fatal):", idErr);
    }
  } catch (e) {
    console.warn("[revenuecatUserPlansSync] profile mirror to user_plans exception (non-fatal):", e);
  }

  const preservedStripe = !billingIsApple;
  return { ok: true, active: true, preservedStripe };
}


```

---

## supabase/functions/_shared/stripeSubscriptionMetadata.ts

```ts
/**
 * Attach Supabase user id to a Stripe subscription so Stripeâ†’RevenueCat webhooks and
 * renewal events resolve the same app_user_id as mobile (UUID = RC app user id).
 */
export async function attachAppUserIdToStripeSubscription(
  stripeSecretKey: string,
  subscriptionId: string,
  appUserId: string,
): Promise<void> {
  if (!subscriptionId?.trim() || !appUserId?.trim()) return;

  const encode = (v: string) => encodeURIComponent(v);
  const body = [
    `metadata[user_id]=${encode(appUserId)}`,
    `metadata[app_user_id]=${encode(appUserId)}`,
  ].join("&");

  try {
    const res = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn(
        "[stripeSubscriptionMetadata] Could not attach app user id to subscription:",
        res.status,
        text.slice(0, 400),
      );
    }
  } catch (e) {
    console.warn("[stripeSubscriptionMetadata] Stripe subscription metadata update failed:", e);
  }
}


```

---

## supabase/functions/_shared/stripe-config.ts

```ts
// Stripe Price ID Configuration
// Map tiers to Stripe Price IDs
// These should be set as environment variables in Supabase

export interface StripePriceConfig {
  basic: {
    monthly: string;
    annual: string;
  };
  plus: {
    monthly: string;
    annual: string;
  };
  premium: {
    monthly: string;
    annual: string;
    weekly: string;
  };
}

export function getStripePriceIds(): StripePriceConfig {
  // Get from environment variables
  // Format: STRIPE_PRICE_BASIC_MONTHLY, STRIPE_PRICE_BASIC_ANNUAL, etc.
  return {
    basic: {
      monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || '',
    },
    plus: {
      monthly: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL') || '',
    },
    premium: {
      monthly: Deno.env.get('P_STRIPE_PRICE_PREMIUM_MONTHLY') || '',
      annual: Deno.env.get('P_STRIPE_PRICE_PREMIUM_ANNUAL') || '',
      weekly: Deno.env.get('STRIPE_PRICE_PREMIUM_WEEKLY') || '',
    },
  };
}

// Map Stripe Price ID to tier
export function getTierFromPriceId(priceId: string): 'basic' | 'plus' | 'premium' | null {
  const config = getStripePriceIds();
  
  // Check all price IDs
  if (priceId === config.basic.monthly || priceId === config.basic.annual) {
    return 'basic';
  }
  if (priceId === config.plus.monthly || priceId === config.plus.annual) {
    return 'plus';
  }
  if (priceId === config.premium.monthly || priceId === config.premium.annual || priceId === config.premium.weekly) {
    return 'premium';
  }
  
  return null;
}

// Get Price ID for a tier and billing period
export function getPriceIdForTier(
  tier: 'basic' | 'plus' | 'premium',
  billing: 'monthly' | 'annual' | 'weekly',
): string {
  const config = getStripePriceIds();
  if (billing === 'weekly') {
    if (tier !== 'premium') return '';
    return config.premium.weekly;
  }
  return config[tier][billing as 'monthly' | 'annual'];
}























































```

---

## src/integrations/supabase/types.ts

```ts
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          requested_at: string
          user_id: string
        }
        Insert: {
          requested_at?: string
          user_id: string
        }
        Update: {
          requested_at?: string
          user_id?: string
        }
        Relationships: []
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_usage: {
        Row: {
          call_name: string
          characters: number | null
          created_at: string
          id: string
          input_cost_usd: number | null
          input_tokens: number | null
          meta: Json | null
          model: string
          output_cost_usd: number | null
          output_tokens: number | null
          route: string | null
          total_cost_usd: number | null
          total_tokens: number | null
          user_id: string | null
        }
        Insert: {
          call_name: string
          characters?: number | null
          created_at?: string
          id?: string
          input_cost_usd?: number | null
          input_tokens?: number | null
          meta?: Json | null
          model: string
          output_cost_usd?: number | null
          output_tokens?: number | null
          route?: string | null
          total_cost_usd?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Update: {
          call_name?: string
          characters?: number | null
          created_at?: string
          id?: string
          input_cost_usd?: number | null
          input_tokens?: number | null
          meta?: Json | null
          model?: string
          output_cost_usd?: number | null
          output_tokens?: number | null
          route?: string | null
          total_cost_usd?: number | null
          total_tokens?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      app_support_reports: {
        Row: {
          attachment_storage_paths: string[]
          billing_purchase_channel: string | null
          created_at: string
          description: string
          id: string
          submission_type: string
          tool_label: string
          tool_value: string
          user_email: string
          user_first_name: string | null
          user_id: string
        }
        Insert: {
          attachment_storage_paths?: string[]
          billing_purchase_channel?: string | null
          created_at?: string
          description: string
          id?: string
          submission_type: string
          tool_label: string
          tool_value: string
          user_email: string
          user_first_name?: string | null
          user_id: string
        }
        Update: {
          attachment_storage_paths?: string[]
          billing_purchase_channel?: string | null
          created_at?: string
          description?: string
          id?: string
          submission_type?: string
          tool_label?: string
          tool_value?: string
          user_email?: string
          user_first_name?: string | null
          user_id?: string
        }
        Relationships: []
      }
      board_reminder_deliveries: {
        Row: {
          channel: string
          created_at: string
          error: string | null
          id: string
          provider_message_id: string | null
          reminder_id: string
          status: string
        }
        Insert: {
          channel: string
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          reminder_id: string
          status: string
        }
        Update: {
          channel?: string
          created_at?: string
          error?: string | null
          id?: string
          provider_message_id?: string | null
          reminder_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_reminder_deliveries_reminder_id_fkey"
            columns: ["reminder_id"]
            isOneToOne: false
            referencedRelation: "board_reminders"
            referencedColumns: ["id"]
          },
        ]
      }
      board_reminders: {
        Row: {
          board_id: string
          body: string | null
          channels: string[]
          created_at: string
          fabric_object_id: string | null
          ical_uid: string | null
          id: string
          last_sent_at: string | null
          remind_at: string
          source: string
          status: string
          timezone: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          board_id: string
          body?: string | null
          channels?: string[]
          created_at?: string
          fabric_object_id?: string | null
          ical_uid?: string | null
          id?: string
          last_sent_at?: string | null
          remind_at: string
          source?: string
          status?: string
          timezone?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          board_id?: string
          body?: string | null
          channels?: string[]
          created_at?: string
          fabric_object_id?: string | null
          ical_uid?: string | null
          id?: string
          last_sent_at?: string | null
          remind_at?: string
          source?: string
          status?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "board_reminders_board_id_fkey"
            columns: ["board_id"]
            isOneToOne: false
            referencedRelation: "boards"
            referencedColumns: ["id"]
          },
        ]
      }
      board_workspaces: {
        Row: {
          created_at: string
          id: string
          name: string
          preset_slug: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string
          preset_slug?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          preset_slug?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      boards: {
        Row: {
          artboard_height: number
          artboard_width: number
          color_key: string
          created_at: string
          id: string
          layout_json: Json
          layout_mode: string
          role: Database["public"]["Enums"]["board_role"]
          sort_order: number
          title: string
          updated_at: string
          user_id: string
          workspace_id: string
        }
        Insert: {
          artboard_height?: number
          artboard_width?: number
          color_key?: string
          created_at?: string
          id?: string
          layout_json?: Json
          layout_mode?: string
          role?: Database["public"]["Enums"]["board_role"]
          sort_order?: number
          title: string
          updated_at?: string
          user_id: string
          workspace_id: string
        }
        Update: {
          artboard_height?: number
          artboard_width?: number
          color_key?: string
          created_at?: string
          id?: string
          layout_json?: Json
          layout_mode?: string
          role?: Database["public"]["Enums"]["board_role"]
          sort_order?: number
          title?: string
          updated_at?: string
          user_id?: string
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "boards_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "board_workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      community_daily_prompts: {
        Row: {
          category: string
          day_index: number
          prompt_text: string
        }
        Insert: {
          category: string
          day_index: number
          prompt_text: string
        }
        Update: {
          category?: string
          day_index?: number
          prompt_text?: string
        }
        Relationships: []
      }
      community_feed_posts: {
        Row: {
          body_text: string
          category: string
          created_at: string
          id: string
          image_path: string | null
          post_kind: string
          published: boolean
          published_at: string
          title: string | null
        }
        Insert: {
          body_text: string
          category?: string
          created_at?: string
          id?: string
          image_path?: string | null
          post_kind?: string
          published?: boolean
          published_at?: string
          title?: string | null
        }
        Update: {
          body_text?: string
          category?: string
          created_at?: string
          id?: string
          image_path?: string | null
          post_kind?: string
          published?: boolean
          published_at?: string
          title?: string | null
        }
        Relationships: []
      }
      community_poll_options: {
        Row: {
          id: string
          image_path: string | null
          label: string
          poll_id: string
          sort_order: number
          submission_id: string | null
        }
        Insert: {
          id?: string
          image_path?: string | null
          label: string
          poll_id: string
          sort_order?: number
          submission_id?: string | null
        }
        Update: {
          id?: string
          image_path?: string | null
          label?: string
          poll_id?: string
          sort_order?: number
          submission_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_options_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "community_setup_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "community_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          id: string
          reward_note: string | null
          starts_at: string | null
          status: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          reward_note?: string | null
          starts_at?: string | null
          status?: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          id?: string
          reward_note?: string | null
          starts_at?: string | null
          status?: string
          title?: string
        }
        Relationships: []
      }
      community_setup_submissions: {
        Row: {
          body_text: string
          category: string
          created_at: string
          feature_opt_in: boolean
          id: string
          image_paths: string[]
          setup_medium: string
          status: string
          title: string | null
          user_id: string
        }
        Insert: {
          body_text: string
          category: string
          created_at?: string
          feature_opt_in?: boolean
          id?: string
          image_paths?: string[]
          setup_medium?: string
          status?: string
          title?: string | null
          user_id: string
        }
        Update: {
          body_text?: string
          category?: string
          created_at?: string
          feature_opt_in?: boolean
          id?: string
          image_paths?: string[]
          setup_medium?: string
          status?: string
          title?: string | null
          user_id?: string
        }
        Relationships: []
      }
      demo_access_tokens: {
        Row: {
          created_at: string | null
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      email_captures: {
        Row: {
          created_at: string
          email: string
          feedback: string | null
          first_name: string | null
          id: string
          marketing_consent: boolean
          page_path: string | null
          referrer: string | null
          source: string | null
        }
        Insert: {
          created_at?: string
          email: string
          feedback?: string | null
          first_name?: string | null
          id?: string
          marketing_consent?: boolean
          page_path?: string | null
          referrer?: string | null
          source?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          feedback?: string | null
          first_name?: string | null
          id?: string
          marketing_consent?: boolean
          page_path?: string | null
          referrer?: string | null
          source?: string | null
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          token_hash: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          token_hash: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          token_hash?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      feature_flags: {
        Row: {
          config: Json | null
          description: string | null
          feature_name: string
          id: string
          is_enabled: boolean | null
          updated_at: string | null
        }
        Insert: {
          config?: Json | null
          description?: string | null
          feature_name: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Update: {
          config?: Json | null
          description?: string | null
          feature_name?: string
          id?: string
          is_enabled?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gamification_settings: {
        Row: {
          description: string | null
          id: string
          setting_key: string
          setting_value: Json
          updated_at: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          setting_key: string
          setting_value: Json
          updated_at?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          setting_key?: string
          setting_value?: Json
          updated_at?: string | null
        }
        Relationships: []
      }
      inbox_messages: {
        Row: {
          attachment_storage_paths: string[]
          body_text: string
          case_id: string | null
          created_at: string
          edited_at: string | null
          id: string
          sender: string
          thread_id: string
        }
        Insert: {
          attachment_storage_paths?: string[]
          body_text: string
          case_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          sender: string
          thread_id: string
        }
        Update: {
          attachment_storage_paths?: string[]
          body_text?: string
          case_id?: string | null
          created_at?: string
          edited_at?: string | null
          id?: string
          sender?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_messages_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "support_cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "inbox_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_threads: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          source: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          source: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          source?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          created_at: string
          entry_date: string
          entry_text: string
          entry_time: string
          has_wins: boolean | null
          id: string
          journal_day_experience_rating: string | null
          journal_env_3d_rating: string | null
          latitude: number | null
          location_name: string | null
          location_type: string | null
          longitude: number | null
          photo_url: string | null
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date: string
          entry_text: string
          entry_time?: string
          has_wins?: boolean | null
          id?: string
          journal_day_experience_rating?: string | null
          journal_env_3d_rating?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          entry_text?: string
          entry_time?: string
          has_wins?: boolean | null
          id?: string
          journal_day_experience_rating?: string | null
          journal_env_3d_rating?: string | null
          latitude?: number | null
          location_name?: string | null
          location_type?: string | null
          longitude?: number | null
          photo_url?: string | null
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      marketing_homepage_events: {
        Row: {
          browser_language: string | null
          city: string | null
          click_source: string | null
          country_code: string | null
          created_at: string
          device_os: string | null
          event_type: string
          id: string
          in_app_browser: string | null
          is_from_tiktok: boolean | null
          is_mobile_viewport: boolean | null
          landing_query: string | null
          page_path: string | null
          pixel_ratio: number | null
          referrer: string | null
          region: string | null
          routed_store_url: string | null
          screen_height: number | null
          screen_width: number | null
          store_target: string | null
          timezone: string | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visit_id: string
        }
        Insert: {
          browser_language?: string | null
          city?: string | null
          click_source?: string | null
          country_code?: string | null
          created_at?: string
          device_os?: string | null
          event_type: string
          id?: string
          in_app_browser?: string | null
          is_from_tiktok?: boolean | null
          is_mobile_viewport?: boolean | null
          landing_query?: string | null
          page_path?: string | null
          pixel_ratio?: number | null
          referrer?: string | null
          region?: string | null
          routed_store_url?: string | null
          screen_height?: number | null
          screen_width?: number | null
          store_target?: string | null
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id: string
        }
        Update: {
          browser_language?: string | null
          city?: string | null
          click_source?: string | null
          country_code?: string | null
          created_at?: string
          device_os?: string | null
          event_type?: string
          id?: string
          in_app_browser?: string | null
          is_from_tiktok?: boolean | null
          is_mobile_viewport?: boolean | null
          landing_query?: string | null
          page_path?: string | null
          pixel_ratio?: number | null
          referrer?: string | null
          region?: string | null
          routed_store_url?: string | null
          screen_height?: number | null
          screen_width?: number | null
          store_target?: string | null
          timezone?: string | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visit_id?: string
        }
        Relationships: []
      }
      onboarding_session_setup: {
        Row: {
          conditional_specificity: Json
          current_friction: string | null
          desire_category: string | null
          desire_text: string | null
          desired_identity: string | null
          email: string | null
          first_name: string | null
          onboarding_session_id: string
          tool_preferences: string[]
          updated_at: string
          why_it_matters: string | null
        }
        Insert: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          first_name?: string | null
          onboarding_session_id: string
          tool_preferences?: string[]
          updated_at?: string
          why_it_matters?: string | null
        }
        Update: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          first_name?: string | null
          onboarding_session_id?: string
          tool_preferences?: string[]
          updated_at?: string
          why_it_matters?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_session_setup_onboarding_session_id_fkey"
            columns: ["onboarding_session_id"]
            isOneToOne: true
            referencedRelation: "onboarding_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_sessions: {
        Row: {
          app_notifications_consent: boolean | null
          attribution_payload: Json | null
          billing: string | null
          created_at: string
          email: string | null
          email_consent: boolean | null
          expires_at: string | null
          first_name: string | null
          first_touch_ad_id: string | null
          first_touch_adset_id: string | null
          first_touch_at: string | null
          first_touch_campaign: string | null
          first_touch_campaign_id: string | null
          first_touch_click_id_type: string | null
          first_touch_click_id_value: string | null
          first_touch_content: string | null
          first_touch_creative_id: string | null
          first_touch_landing_page: string | null
          first_touch_medium: string | null
          first_touch_referrer: string | null
          first_touch_source: string | null
          first_touch_term: string | null
          id: string
          last_touch_ad_id: string | null
          last_touch_adset_id: string | null
          last_touch_at: string | null
          last_touch_campaign: string | null
          last_touch_campaign_id: string | null
          last_touch_click_id_type: string | null
          last_touch_click_id_value: string | null
          last_touch_content: string | null
          last_touch_creative_id: string | null
          last_touch_landing_page: string | null
          last_touch_medium: string | null
          last_touch_referrer: string | null
          last_touch_source: string | null
          last_touch_term: string | null
          offering_id: string | null
          onboarding_answers: Json
          package_id: string | null
          paid_at: string | null
          paywall_id: string | null
          paywall_variant: string | null
          product_id: string | null
          resume_token_hash: string
          revenuecat_app_user_id: string | null
          revenuecat_attributes_synced_at: string | null
          selected_tier: string | null
          shell_appearance: string | null
          sms_consent: boolean | null
          status: Database["public"]["Enums"]["onboarding_session_status"]
          stripe_checkout_session_id: string | null
          stripe_customer_email: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          tracking_authorization_status: string | null
          tracking_permission_asked_at: string | null
          tracking_pre_permission_choice: string | null
          updated_at: string
          user_id: string | null
          username: string | null
        }
        Insert: {
          app_notifications_consent?: boolean | null
          attribution_payload?: Json | null
          billing?: string | null
          created_at?: string
          email?: string | null
          email_consent?: boolean | null
          expires_at?: string | null
          first_name?: string | null
          first_touch_ad_id?: string | null
          first_touch_adset_id?: string | null
          first_touch_at?: string | null
          first_touch_campaign?: string | null
          first_touch_campaign_id?: string | null
          first_touch_click_id_type?: string | null
          first_touch_click_id_value?: string | null
          first_touch_content?: string | null
          first_touch_creative_id?: string | null
          first_touch_landing_page?: string | null
          first_touch_medium?: string | null
          first_touch_referrer?: string | null
          first_touch_source?: string | null
          first_touch_term?: string | null
          id?: string
          last_touch_ad_id?: string | null
          last_touch_adset_id?: string | null
          last_touch_at?: string | null
          last_touch_campaign?: string | null
          last_touch_campaign_id?: string | null
          last_touch_click_id_type?: string | null
          last_touch_click_id_value?: string | null
          last_touch_content?: string | null
          last_touch_creative_id?: string | null
          last_touch_landing_page?: string | null
          last_touch_medium?: string | null
          last_touch_referrer?: string | null
          last_touch_source?: string | null
          last_touch_term?: string | null
          offering_id?: string | null
          onboarding_answers?: Json
          package_id?: string | null
          paid_at?: string | null
          paywall_id?: string | null
          paywall_variant?: string | null
          product_id?: string | null
          resume_token_hash: string
          revenuecat_app_user_id?: string | null
          revenuecat_attributes_synced_at?: string | null
          selected_tier?: string | null
          shell_appearance?: string | null
          sms_consent?: boolean | null
          status?: Database["public"]["Enums"]["onboarding_session_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_email?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tracking_authorization_status?: string | null
          tracking_permission_asked_at?: string | null
          tracking_pre_permission_choice?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Update: {
          app_notifications_consent?: boolean | null
          attribution_payload?: Json | null
          billing?: string | null
          created_at?: string
          email?: string | null
          email_consent?: boolean | null
          expires_at?: string | null
          first_name?: string | null
          first_touch_ad_id?: string | null
          first_touch_adset_id?: string | null
          first_touch_at?: string | null
          first_touch_campaign?: string | null
          first_touch_campaign_id?: string | null
          first_touch_click_id_type?: string | null
          first_touch_click_id_value?: string | null
          first_touch_content?: string | null
          first_touch_creative_id?: string | null
          first_touch_landing_page?: string | null
          first_touch_medium?: string | null
          first_touch_referrer?: string | null
          first_touch_source?: string | null
          first_touch_term?: string | null
          id?: string
          last_touch_ad_id?: string | null
          last_touch_adset_id?: string | null
          last_touch_at?: string | null
          last_touch_campaign?: string | null
          last_touch_campaign_id?: string | null
          last_touch_click_id_type?: string | null
          last_touch_click_id_value?: string | null
          last_touch_content?: string | null
          last_touch_creative_id?: string | null
          last_touch_landing_page?: string | null
          last_touch_medium?: string | null
          last_touch_referrer?: string | null
          last_touch_source?: string | null
          last_touch_term?: string | null
          offering_id?: string | null
          onboarding_answers?: Json
          package_id?: string | null
          paid_at?: string | null
          paywall_id?: string | null
          paywall_variant?: string | null
          product_id?: string | null
          resume_token_hash?: string
          revenuecat_app_user_id?: string | null
          revenuecat_attributes_synced_at?: string | null
          selected_tier?: string | null
          shell_appearance?: string | null
          sms_consent?: boolean | null
          status?: Database["public"]["Enums"]["onboarding_session_status"]
          stripe_checkout_session_id?: string | null
          stripe_customer_email?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          tracking_authorization_status?: string | null
          tracking_permission_asked_at?: string | null
          tracking_pre_permission_choice?: string | null
          updated_at?: string
          user_id?: string | null
          username?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          app_notifications_enabled: boolean
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_verified_at: string | null
          first_name: string | null
          id: string
          last_activity: string | null
          notification_permission_status: string | null
          onboarding_answers: Json | null
          onboarding_data: Json | null
          phone: string | null
          preferred_locale: string | null
          preset_theme: string | null
          routine_intensity: string | null
          routine_items: Json
          routine_notification_times: Json
          signup_code: string | null
          timezone: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          id: string
          last_activity?: string | null
          notification_permission_status?: string | null
          onboarding_answers?: Json | null
          onboarding_data?: Json | null
          phone?: string | null
          preferred_locale?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          signup_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified_at?: string | null
          first_name?: string | null
          id?: string
          last_activity?: string | null
          notification_permission_status?: string | null
          onboarding_answers?: Json | null
          onboarding_data?: Json | null
          phone?: string | null
          preferred_locale?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          signup_code?: string | null
          timezone?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      routine_push_delivery_log: {
        Row: {
          alert_slot: number
          id: string
          onesignal_response: Json | null
          scheduled_for_date: string
          scheduled_time: string
          sent_at: string
          user_id: string
        }
        Insert: {
          alert_slot: number
          id?: string
          onesignal_response?: Json | null
          scheduled_for_date: string
          scheduled_time: string
          sent_at?: string
          user_id: string
        }
        Update: {
          alert_slot?: number
          id?: string
          onesignal_response?: Json | null
          scheduled_for_date?: string
          scheduled_time?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      support_case_internal_notes: {
        Row: {
          admin_user_id: string
          body_text: string
          case_id: string
          created_at: string
          id: string
        }
        Insert: {
          admin_user_id: string
          body_text: string
          case_id: string
          created_at?: string
          id?: string
        }
        Update: {
          admin_user_id?: string
          body_text?: string
          case_id?: string
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "support_case_internal_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "support_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      support_cases: {
        Row: {
          admin_unread: boolean
          attachment_storage_paths: string[]
          closed_at: string | null
          closed_by_admin_id: string | null
          created_at: string
          id: string
          latest_message_preview: string
          message_type: string
          original_submission_text: string
          report_id: string | null
          status: string
          subject: string
          submission_type: string | null
          thread_id: string | null
          tool_label: string | null
          tool_or_area: string | null
          updated_at: string
          user_email: string
          user_first_name: string | null
          user_id: string
          user_unread: boolean
        }
        Insert: {
          admin_unread?: boolean
          attachment_storage_paths?: string[]
          closed_at?: string | null
          closed_by_admin_id?: string | null
          created_at?: string
          id?: string
          latest_message_preview?: string
          message_type: string
          original_submission_text?: string
          report_id?: string | null
          status?: string
          subject?: string
          submission_type?: string | null
          thread_id?: string | null
          tool_label?: string | null
          tool_or_area?: string | null
          updated_at?: string
          user_email?: string
          user_first_name?: string | null
          user_id: string
          user_unread?: boolean
        }
        Update: {
          admin_unread?: boolean
          attachment_storage_paths?: string[]
          closed_at?: string | null
          closed_by_admin_id?: string | null
          created_at?: string
          id?: string
          latest_message_preview?: string
          message_type?: string
          original_submission_text?: string
          report_id?: string | null
          status?: string
          subject?: string
          submission_type?: string | null
          thread_id?: string | null
          tool_label?: string | null
          tool_or_area?: string | null
          updated_at?: string
          user_email?: string
          user_first_name?: string | null
          user_id?: string
          user_unread?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "support_cases_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "app_support_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "support_cases_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "inbox_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      user_action_history: {
        Row: {
          action_date: string
          actions: Json
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_date: string
          actions?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_date?: string
          actions?: Json
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_daily_progress: {
        Row: {
          completed_actions: Json
          created_at: string
          id: string
          progress: number
          progress_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_actions?: Json
          created_at?: string
          id?: string
          progress?: number
          progress_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_actions?: Json
          created_at?: string
          id?: string
          progress?: number
          progress_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_gamification_stats: {
        Row: {
          created_at: string | null
          current_streak: number | null
          id: string
          last_activity_date: string | null
          longest_streak: number | null
          milestones_achieved: Json | null
          tools_used_this_week: Json | null
          total_tools_used: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          milestones_achieved?: Json | null
          tools_used_this_week?: Json | null
          total_tools_used?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_streak?: number | null
          id?: string
          last_activity_date?: string | null
          longest_streak?: number | null
          milestones_achieved?: Json | null
          tools_used_this_week?: Json | null
          total_tools_used?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_plan_brevo_cancellation_queue: {
        Row: {
          created_at: string
          preferred_locale: string | null
          send_after: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferred_locale?: string | null
          send_after: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferred_locale?: string | null
          send_after?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_brevo_cancellation_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_plans"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_plan_brevo_welcome_queue: {
        Row: {
          created_at: string
          preferred_locale: string | null
          send_after: string
          user_id: string
        }
        Insert: {
          created_at?: string
          preferred_locale?: string | null
          send_after: string
          user_id: string
        }
        Update: {
          created_at?: string
          preferred_locale?: string | null
          send_after?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_plan_brevo_welcome_queue_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user_plans"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_plans: {
        Row: {
          apple_customer_id: string | null
          billing_period: string | null
          brevo_cancellation_list_synced_at: string | null
          created_at: string | null
          current_period_end: string | null
          first_payment_source: string | null
          google_play_customer_id: string | null
          had_trial: boolean
          id: string
          last_payment_source: string | null
          on_trial: boolean
          review_prompt_attempted_at: string | null
          starter_provisioned: boolean
          status: string
          stripe_customer_id: string | null
          stripe_customer_id_official: string | null
          stripe_subscription_id: string | null
          tier: string
          updated_at: string | null
          user_id: string
          welcome_email_sent_at: string | null
        }
        Insert: {
          apple_customer_id?: string | null
          billing_period?: string | null
          brevo_cancellation_list_synced_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          first_payment_source?: string | null
          google_play_customer_id?: string | null
          had_trial?: boolean
          id?: string
          last_payment_source?: string | null
          on_trial?: boolean
          review_prompt_attempted_at?: string | null
          starter_provisioned?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier: string
          updated_at?: string | null
          user_id: string
          welcome_email_sent_at?: string | null
        }
        Update: {
          apple_customer_id?: string | null
          billing_period?: string | null
          brevo_cancellation_list_synced_at?: string | null
          created_at?: string | null
          current_period_end?: string | null
          first_payment_source?: string | null
          google_play_customer_id?: string | null
          had_trial?: boolean
          id?: string
          last_payment_source?: string | null
          on_trial?: boolean
          review_prompt_attempted_at?: string | null
          starter_provisioned?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_customer_id_official?: string | null
          stripe_subscription_id?: string | null
          tier?: string
          updated_at?: string | null
          user_id?: string
          welcome_email_sent_at?: string | null
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          app_notifications_enabled: boolean
          avatar_url: string | null
          created_at: string
          data_training_opt_in: boolean
          email_marketing: boolean | null
          embody_active_practices: string[] | null
          first_name: string | null
          first_tutorial_shown: boolean | null
          id: string
          last_name: string | null
          marketing_sms_enabled: boolean | null
          notification_permission_status: string | null
          phone: string | null
          preferred_locale: string | null
          preferred_send_window: string | null
          preset_theme: string | null
          routine_intensity: string | null
          routine_items: Json
          routine_notification_times: Json
          texts_enabled: boolean | null
          timezone: string | null
          tutorial_completed: Json | null
          tutorial_last_slide: number | null
          updated_at: string
          user_id: string
          weekly_checkin_enabled: boolean | null
          weekly_goals_sms: boolean | null
        }
        Insert: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string
          data_training_opt_in?: boolean
          email_marketing?: boolean | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          first_tutorial_shown?: boolean | null
          id?: string
          last_name?: string | null
          marketing_sms_enabled?: boolean | null
          notification_permission_status?: string | null
          phone?: string | null
          preferred_locale?: string | null
          preferred_send_window?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          texts_enabled?: boolean | null
          timezone?: string | null
          tutorial_completed?: Json | null
          tutorial_last_slide?: number | null
          updated_at?: string
          user_id: string
          weekly_checkin_enabled?: boolean | null
          weekly_goals_sms?: boolean | null
        }
        Update: {
          app_notifications_enabled?: boolean
          avatar_url?: string | null
          created_at?: string
          data_training_opt_in?: boolean
          email_marketing?: boolean | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          first_tutorial_shown?: boolean | null
          id?: string
          last_name?: string | null
          marketing_sms_enabled?: boolean | null
          notification_permission_status?: string | null
          phone?: string | null
          preferred_locale?: string | null
          preferred_send_window?: string | null
          preset_theme?: string | null
          routine_intensity?: string | null
          routine_items?: Json
          routine_notification_times?: Json
          texts_enabled?: boolean | null
          timezone?: string | null
          tutorial_completed?: Json | null
          tutorial_last_slide?: number | null
          updated_at?: string
          user_id?: string
          weekly_checkin_enabled?: boolean | null
          weekly_goals_sms?: boolean | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_setup_path: {
        Row: {
          conditional_specificity: Json
          current_friction: string | null
          desire_category: string | null
          desire_text: string | null
          desired_identity: string | null
          email: string | null
          embody_active_practices: string[] | null
          first_name: string | null
          post_paywall_provisioned_at: string | null
          tool_preferences: string[]
          updated_at: string
          user_id: string
          why_it_matters: string | null
        }
        Insert: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          post_paywall_provisioned_at?: string | null
          tool_preferences?: string[]
          updated_at?: string
          user_id: string
          why_it_matters?: string | null
        }
        Update: {
          conditional_specificity?: Json
          current_friction?: string | null
          desire_category?: string | null
          desire_text?: string | null
          desired_identity?: string | null
          email?: string | null
          embody_active_practices?: string[] | null
          first_name?: string | null
          post_paywall_provisioned_at?: string | null
          tool_preferences?: string[]
          updated_at?: string
          user_id?: string
          why_it_matters?: string | null
        }
        Relationships: []
      }
      web_onboarding_sessions: {
        Row: {
          client_visit_id: string
          created_at: string
          entry_path: string
          fast_path: Json
          from_tiktok: boolean | null
          id: string
          is_mobile_viewport: boolean | null
          is_paid: boolean | null
          make_my_board_cta_clicked: boolean
          page_path: string | null
          referrer: string | null
          ttclid: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
        }
        Insert: {
          client_visit_id: string
          created_at?: string
          entry_path?: string
          fast_path?: Json
          from_tiktok?: boolean | null
          id?: string
          is_mobile_viewport?: boolean | null
          is_paid?: boolean | null
          make_my_board_cta_clicked?: boolean
          page_path?: string | null
          referrer?: string | null
          ttclid?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Update: {
          client_visit_id?: string
          created_at?: string
          entry_path?: string
          fast_path?: Json
          from_tiktok?: boolean | null
          id?: string
          is_mobile_viewport?: boolean | null
          is_paid?: boolean | null
          make_my_board_cta_clicked?: boolean
          page_path?: string | null
          referrer?: string | null
          ttclid?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
        }
        Relationships: []
      }
      weekly_goals: {
        Row: {
          category: string | null
          completed: boolean
          created_at: string
          goal_text: string
          id: string
          updated_at: string
          user_id: string
          week_start_date: string
        }
        Insert: {
          category?: string | null
          completed?: boolean
          created_at?: string
          goal_text: string
          id?: string
          updated_at?: string
          user_id: string
          week_start_date: string
        }
        Update: {
          category?: string | null
          completed?: boolean
          created_at?: string
          goal_text?: string
          id?: string
          updated_at?: string
          user_id?: string
          week_start_date?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_email_exists: { Args: { check_email: string }; Returns: boolean }
      check_username_exists: {
        Args: { check_username: string }
        Returns: boolean
      }
      get_email_by_username: {
        Args: { lookup_username: string }
        Returns: string
      }
      has_active_plotting_subscription: {
        Args: { check_user_id?: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      link_web_onboarding_session_user: {
        Args: { p_client_visit_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_web_onboarding_make_my_board_cta_clicked: {
        Args: { p_client_visit_id: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      board_role: "focus" | "plan"
      onboarding_session_status:
        | "started"
        | "checkout_created"
        | "paid"
        | "account_created"
        | "active"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      board_role: ["focus", "plan"],
      onboarding_session_status: [
        "started",
        "checkout_created",
        "paid",
        "account_created",
        "active",
      ],
    },
  },
} as const


```
