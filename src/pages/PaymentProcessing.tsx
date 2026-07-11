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
   * started a new one — and on top of that, `setInterval` and an inline
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
    <div
      className="flex min-h-screen items-center justify-center px-6 py-16 font-sans text-neutral-900 antialiased"
      style={{ backgroundColor: "#faf8f5" }}
    >
      <div className="w-full max-w-md space-y-6 text-center">
        <Loader2 className="mx-auto h-12 w-12 animate-spin text-neutral-900" aria-hidden />
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
          {t("paymentProcessing.title")}
        </h1>
        <p className="text-sm leading-relaxed text-neutral-600">{t("paymentProcessing.subtitle")}</p>
      </div>
    </div>
  );
}
