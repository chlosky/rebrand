import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { armIapPostPurchaseEntitlementLatch } from "@/lib/iosPostPurchaseEntitlementGate";
import { armWebGetAppPromptPending } from "@/lib/webFirstPurchaseGetAppPrompt";

/**
 * Platform-aware paywall fallback so a non-iOS web user doesn't get stranded on
 * `/onboarding/ios-paywall`, which toasts "Subscriptions are only available in
 * the iOS app." and offers no path forward.
 */
function paywallRouteForCurrentPlatform(): string {
  if (isIosPaywallContext()) return "/onboarding/ios-paywall";
  if (isAndroidPaywallContext()) return "/onboarding/android-paywall";
  return "/onboarding/web-paywall";
}

export default function PaymentProcessing() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sid = searchParams.get("sid") || "";
  const token = searchParams.get("token") || "";

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
        () => navigate(paywallRouteForCurrentPlatform()),
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
        () => navigate(paywallRouteForCurrentPlatform()),
        3000,
      );
    };

    const checkPaymentStatus = async () => {
      if (!active) return;
      try {
        const { data, error } = await supabase.functions.invoke(
          "get-onboarding-session",
          { body: { sessionId: sid, resumeToken: token } },
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
            armIapPostPurchaseEntitlementLatch(userId);
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
  }, [sid, token, navigate, t]);

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
