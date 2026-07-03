import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { isIosPaywallContext } from "@/lib/isIosPaywallContext";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";

/**
 * Platform-aware paywall fallback so a non-iOS web user doesn't get stranded on
 * `/onboarding/ios-paywall`, which would toast "Subscriptions are only available
 * in the iOS app." and offer no path forward.
 */
function paywallRouteForCurrentPlatform(): string {
  if (isIosPaywallContext()) return "/onboarding/ios-paywall";
  if (isAndroidPaywallContext()) return "/onboarding/android-paywall";
  return "/onboarding/web-paywall";
}

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
            <Button onClick={() => navigate(paywallRouteForCurrentPlatform())}>{t("activate.goToSubscriptions")}</Button>
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

