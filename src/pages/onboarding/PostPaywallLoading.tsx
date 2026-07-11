import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/integrations/supabase/client";
import { invalidatePlottingProCache } from "@/hooks/usePlottingPro";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import { markIapSubscriptionConfirmed } from "@/lib/postPurchaseEntitlementGate";
import { syncWebStripeEntitlementAfterPurchaseWithRetries } from "@/lib/webStripeEntitlementSync";
import { readSetupDraft } from "@/lib/setupDraft";
import { readStoredPreferredLocale, resolveAppLocale } from "@/lib/locale";
import i18n from "@/i18n";

const SHELL_BG = "#faf8f5";

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
  const r = 52;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-32 shrink-0" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <svg viewBox="0 0 120 120" className="absolute inset-0 size-full">
        <circle cx="60" cy="60" r={r} stroke="#e7e5e4" strokeWidth="8" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="#171717"
          strokeWidth="8"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-neutral-900">{pct}%</div>
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

export default function PostPaywallLoading() {
  const { t } = useTranslation("paywall");
  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;
  const provisionRunRef = useRef(0);

  const [progress, setProgress] = useState(8);
  const [backendProvisionPct, setBackendProvisionPct] = useState(0);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");

  const activeStepIndex = getActiveStepIndexFromBackendPct(backendProvisionPct, phase);
  const simsLinesRaw = t("postPaywall.simsLines", { returnObjects: true });
  const simsLines = Array.isArray(simsLinesRaw) ? simsLinesRaw : [];

  const statusLine = useMemo(() => {
    if (phase === "finishing") return t("postPaywall.finishingSubtitle");
    return simsLines[activeStepIndex] ?? simsLines[simsLines.length - 1] ?? "";
  }, [activeStepIndex, phase, simsLines, t]);

  useEffect(() => {
    logPostPaywall("screen mounted");
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById("root");
    const themeMeta = document.querySelector('meta[name="theme-color"]');

    html.style.setProperty("background", SHELL_BG, "important");
    html.style.setProperty("background-color", SHELL_BG, "important");
    body.style.setProperty("background", SHELL_BG, "important");
    body.style.setProperty("background-color", SHELL_BG, "important");
    root?.style.setProperty("background", SHELL_BG, "important");
    root?.style.setProperty("background-color", SHELL_BG, "important");
    themeMeta?.setAttribute("content", SHELL_BG);

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
    const runId = ++provisionRunRef.current;
    let tickId: number | null = null;
    let navigateTimer: number | null = null;

    logPostPaywall("provisioning effect started", { runId });

    const isCurrentRun = () => runId === provisionRunRef.current;

    const startVisualProgress = () => {
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        if (!isCurrentRun()) return;
        setProgress((current) => {
          if (current >= VISUAL_PROGRESS_CAP) return VISUAL_PROGRESS_CAP;
          const distance = VISUAL_PROGRESS_CAP - current;
          const increment = Math.max(0.25, distance * 0.035);
          return Math.min(VISUAL_PROGRESS_CAP, current + increment);
        });
      }, VISUAL_PROGRESS_INTERVAL_MS);
    };

    const finishToWorkspace = (userId: string, delayMs: number) => {
      markIapSubscriptionConfirmed(userId);
      invalidatePlottingProCache(userId);
      setPhase("finishing");
      if (tickId != null) window.clearInterval(tickId);
      setProgress(100);
      logPostPaywall("navigate dashboard", { userId, delayMs });
      navigateTimer = window.setTimeout(() => {
        if (!isCurrentRun()) return;
        navigateRef.current("/workspace?tab=projects", { replace: true });
      }, delayMs);
    };

    (async () => {
      startVisualProgress();
      try {
        logPostPaywall("entitlement sync start");
        await syncWebStripeEntitlementAfterPurchaseWithRetries();
        logPostPaywall("entitlement sync end");

        if (!isCurrentRun()) {
          logPostPaywall("aborted after entitlement sync (stale run)");
          return;
        }

        logPostPaywall("provisioning start");
        const provisionResult = await provisionPostPaywallIfNeeded({
          quiet: true,
          onProgress: (provisionPct) => {
            if (!isCurrentRun()) return;
            setBackendProvisionPct(provisionPct);
            logPostPaywall("provisioning milestone", { provisionPct });
          },
        });
        logPostPaywall("provisioning end", { provisionResult });
        if (!isCurrentRun()) {
          logPostPaywall("aborted after provisioning (stale run)");
          return;
        }

        const userId = await waitForAuthUserId();
        if (!isCurrentRun()) return;

        if (!userId) {
          logPostPaywall("navigate login (no auth session after payment)");
          navigateRef.current("/login", {
            replace: true,
            state: { from: "/onboarding/post-paywall" },
          });
          return;
        }

        finishToWorkspace(userId, 250);
      } catch (e) {
        console.error("[post-paywall] provisioning failed:", e);
        logPostPaywall("provisioning error", { error: String((e as Error)?.message ?? e) });
        if (!isCurrentRun()) return;

        const userId = await waitForAuthUserId();
        if (!isCurrentRun()) return;

        if (!userId) {
          navigateRef.current("/login", {
            replace: true,
            state: { from: "/onboarding/post-paywall" },
          });
          return;
        }

        finishToWorkspace(userId, 650);
      }
    })();

    return () => {
      logPostPaywall("provisioning effect cleanup", { runId });
      if (tickId != null) window.clearInterval(tickId);
      if (navigateTimer != null) window.clearTimeout(navigateTimer);
    };
  }, []);

  return (
    <div
      className="flex min-h-screen items-center justify-center px-6 py-16 font-sans text-neutral-900 antialiased"
      style={{ backgroundColor: SHELL_BG }}
    >
      <div className="w-full max-w-md space-y-10 text-center">
        <div className="space-y-3">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl">
            {t("postPaywall.title")}
          </h1>
          <p className="min-h-[2.75rem] text-sm leading-relaxed text-neutral-600">{statusLine}</p>
        </div>

        <div className="flex justify-center">
          <ProgressRing value={progress} />
        </div>

        <p className="text-xs text-neutral-500">{t("postPaywall.buildingDashboard")}</p>
      </div>
    </div>
  );
}
