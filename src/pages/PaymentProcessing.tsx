import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { armWebGetAppPromptPending } from "@/lib/webFirstPurchaseGetAppPrompt";

type ProcessingPhase = "checking" | "confirmed" | "needs_sign_in";

function buildPaymentProcessingPath(sid: string, token: string, checkoutSessionId: string): string {
  const params = new URLSearchParams({ sid, token });
  if (checkoutSessionId) {
    params.set("checkout_session_id", checkoutSessionId);
  }
  return `/payment-processing?${params.toString()}`;
}

async function waitForAuthUserId(maxAttempts = 15): Promise<string | null> {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const userId = session?.user?.id ?? null;
    if (userId) return userId;
    await new Promise((resolve) => window.setTimeout(resolve, 200));
  }
  return null;
}

function runConfirmSubscriptionInBackground(stripeCheckoutSessionId: string): void {
  void supabase.functions
    .invoke("confirm-subscription", { body: { sessionId: stripeCheckoutSessionId } })
    .then(({ error }) => {
      if (error) {
        console.warn("[PaymentProcessing] confirm-subscription failed (background):", error);
      }
    })
    .catch((e) => {
      console.warn("[PaymentProcessing] confirm-subscription threw (background):", e);
    });
}

export default function PaymentProcessing() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";
  const checkoutSessionId = searchParams.get("checkout_session_id") || "";

  const [phase, setPhase] = useState<ProcessingPhase>("checking");
  const attemptsRef = useRef(0);
  const checkInFlightRef = useRef(false);
  const continuedRef = useRef(false);
  const maxAttempts = 30;

  const returnPath = buildPaymentProcessingPath(sid, token, checkoutSessionId);

  const continueToPostPaywall = (stripeCheckoutSessionId: string) => {
    if (continuedRef.current) return;
    continuedRef.current = true;
    if (stripeCheckoutSessionId) {
      runConfirmSubscriptionInBackground(stripeCheckoutSessionId);
    }
    armWebGetAppPromptPending();
    setPhase("confirmed");
    window.setTimeout(() => {
      navigate("/onboarding/post-paywall", { replace: true });
    }, 150);
  };

  useEffect(() => {
    if (phase !== "needs_sign_in" || !user?.id || continuedRef.current) return;
    continueToPostPaywall(checkoutSessionId);
  }, [phase, user?.id, checkoutSessionId]);

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
      if (!active || continuedRef.current || checkInFlightRef.current) return;
      checkInFlightRef.current = true;
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-onboarding-session",
          { body: { sessionId: sid, resumeToken: token, checkoutSessionId } },
        );
        if (!active || continuedRef.current) return;

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
          const stripeCheckoutSessionId =
            checkoutSessionId ||
            (typeof session.stripe_checkout_session_id === "string"
              ? session.stripe_checkout_session_id
              : "");

          const userId = await waitForAuthUserId();
          if (!active || continuedRef.current) return;

          if (userId) {
            if (interval != null) {
              window.clearInterval(interval);
              interval = null;
            }
            continueToPostPaywall(stripeCheckoutSessionId);
            return;
          }

          if (interval != null) {
            window.clearInterval(interval);
            interval = null;
          }
          setPhase("needs_sign_in");
          return;
        }

        if (attemptsRef.current >= maxAttempts) {
          finishWithError(t("paymentProcessing.verificationSlow"));
          return;
        }
        attemptsRef.current += 1;
      } catch (e) {
        if (!active || continuedRef.current) return;
        console.error("Error checking payment status:", e);
        if (attemptsRef.current >= maxAttempts) {
          finishWithError(t("paymentProcessing.verificationFailed"));
          return;
        }
        attemptsRef.current += 1;
      } finally {
        checkInFlightRef.current = false;
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

  const subtitle =
    phase === "confirmed"
      ? t("paymentProcessing.paymentConfirmed")
      : phase === "needs_sign_in"
        ? t("paymentProcessing.signInToContinueSubtitle")
        : t("paymentProcessing.subtitle");

  const title =
    phase === "needs_sign_in"
      ? t("paymentProcessing.signInToContinueTitle")
      : t("paymentProcessing.title");

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-16 font-sans text-neutral-900 antialiased"
      style={{ backgroundColor: "#faf8f5" }}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        {phase !== "needs_sign_in" ? (
          <Loader2 className="mx-auto h-12 w-12 animate-spin text-neutral-900" aria-hidden />
        ) : null}
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-neutral-600">{subtitle}</p>
        {phase === "needs_sign_in" ? (
          <Button
            className="w-full"
            onClick={() =>
              navigate("/login", {
                replace: true,
                state: { from: returnPath },
              })
            }
          >
            {t("paymentProcessing.signInToContinueCta")}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
