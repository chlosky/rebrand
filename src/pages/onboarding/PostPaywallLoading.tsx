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
        window.setTimeout(() => navigateRef.current("/workspace?tab=projects", { replace: true }), 250);
      } catch (e) {
        console.error("[post-paywall] provisioning failed:", e);
        logPostPaywall("provisioning error", { error: String((e as Error)?.message ?? e) });
        if (!alive) return;
        markIapSubscriptionConfirmed(getIapPostPurchaseLatchUserId());
        clearIapPostPurchaseEntitlementLatch();
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
