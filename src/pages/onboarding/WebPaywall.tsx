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
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-zinc-500">palette plotting</p>
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
