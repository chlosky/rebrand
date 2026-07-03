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
import i18n from "@/i18n";
import { resolveAppLocale, legalTermsUrl, legalPrivacyUrl } from "@/lib/locale";

/**
 * Native Android subscription paywall. Uses RevenueCat paywall UI to present
 * Google Play subscriptions. Completely separate from the iOS paywall.
 */
const AndroidPaywall = () => {
  const { t } = useTranslation(["paywall", "common"]);
  const appLocale = resolveAppLocale(i18n.language);
  const termsUrl = legalTermsUrl(appLocale);
  const privacyUrl = legalPrivacyUrl(appLocale);
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
