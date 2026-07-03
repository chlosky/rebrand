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
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
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
  const appLocale = resolveAppLocale(i18n.language);
  const termsUrl = legalTermsUrl(appLocale);
  const privacyUrl = legalPrivacyUrl(appLocale);
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
    const shellBg = WELCOME_DEEP_BLACK_SHELL_BG;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", shellBg, "important");
    html.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    body.style.setProperty("background", shellBg, "important");
    body.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    root?.style.setProperty("background", shellBg, "important");
    root?.style.setProperty("background-color", WELCOME_DEEP_BLACK_BASE, "important");
    themeMeta?.setAttribute("content", WELCOME_DEEP_BLACK_BASE);

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
      setTimeout(() => navigate("/dashboard"), 500);
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
      className="relative min-h-screen font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground
        className="pointer-events-none fixed inset-0 z-0"
        tone="deep-black"
      />
      <IosAppHeader signOutInsteadOfLogin={!!user} cosmicShell />

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
