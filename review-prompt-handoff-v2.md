# Handoff v2: Post-Paywall iOS Review Prompt

This is the final handoff after incorporating first-round review feedback. Changes since v1:

- Migration seeds `is_enabled = false` (disabled by default; owner turns on manually after testing)
- Review prompt is iOS-only (`Capacitor.getPlatform() === "ios"`)
- Android post-paywall loading has no review prompt wiring
- Duplicate guard uses both localStorage AND a DB column (`user_plans.review_prompt_attempted_at`)
- Console logging at every decision point (`[review_prompt]` prefix)
- New nullable column `review_prompt_attempted_at` on `user_plans` for durable audit trail

## Files Changed

| File | What changed |
|---|---|
| `package.json` / `package-lock.json` | Added `@capacitor-community/in-app-review` ^8.0.0 |
| `src/pages/onboarding/PostPaywallLoading.tsx` | Review prompt gate added (iOS-only) |
| `src/pages/onboarding/AndroidPostPaywallLoading.tsx` | Review prompt wiring REMOVED (was added in v1, now reverted) |
| `src/integrations/supabase/types.ts` | `review_prompt_attempted_at` added to `user_plans` Row/Insert/Update |
| `supabase/migrations/20260603200000_seed_review_prompt_feature_flag.sql` | Seeds feature flag + adds column |

## Dependency Added

```json
"@capacitor-community/in-app-review": "^8.0.0"
```

Capacitor 8 compatible. Exposes:

```ts
import { InAppReview } from "@capacitor-community/in-app-review";
await InAppReview.requestReview();
```

Before shipping native builds:

```bash
npx cap sync
```

## Migration

File: `supabase/migrations/20260603200000_seed_review_prompt_feature_flag.sql`

```sql
-- Seed the review-prompt feature flag.
-- description doubles as the audience selector:
--   "trial_only"  → only users whose on_trial = true
--   "all_new"     → every new subscriber (trial or not)
-- Turn is_enabled on manually after testing the native build.
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES ('review_prompt', false, 'trial_only')
ON CONFLICT (feature_name) DO NOTHING;

-- Nullable timestamp on user_plans — null = never prompted.
ALTER TABLE public.user_plans
ADD COLUMN IF NOT EXISTS review_prompt_attempted_at TIMESTAMPTZ;
```

Key points:

- `is_enabled` defaults to `false`. Owner manually enables after testing.
- `ON CONFLICT DO NOTHING` — safe to re-run if the row already exists.
- `review_prompt_attempted_at` is nullable. Existing rows stay NULL. No data migration.
- No schema changes to `feature_flags` itself. Uses existing `description` column as audience selector.

## Feature Flag Control

The `feature_flags` table already has public SELECT RLS:

```sql
CREATE POLICY "Anyone can view feature flags"
ON public.feature_flags FOR SELECT
USING (true);
```

Admin-only write:

```sql
CREATE POLICY "Admins can manage feature flags"
ON public.feature_flags FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));
```

### Operational SQL

Disable entirely:

```sql
UPDATE public.feature_flags
SET is_enabled = false
WHERE feature_name = 'review_prompt';
```

Enable for trial users only:

```sql
UPDATE public.feature_flags
SET is_enabled = true, description = 'trial_only'
WHERE feature_name = 'review_prompt';
```

Enable for all new subscribers:

```sql
UPDATE public.feature_flags
SET is_enabled = true, description = 'all_new'
WHERE feature_name = 'review_prompt';
```

Query who has been prompted:

```sql
SELECT id, user_id, on_trial, review_prompt_attempted_at
FROM user_plans
WHERE review_prompt_attempted_at IS NOT NULL;
```

## Review Prompt Decision Flow

This runs only in `PostPaywallLoading.tsx`, only on iOS native, only after provisioning succeeds:

1. Check `Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"` — skip entirely on web/Android.
2. Read `feature_flags` row where `feature_name = 'review_prompt'`.
3. Log: `[review_prompt] flag { enabled, audience }`.
4. If `is_enabled` is false, stop.
5. Get authenticated user session → `uid`.
6. Read `user_plans` for that uid: `on_trial` and `review_prompt_attempted_at`.
7. Determine audience eligibility:
   - `"all_new"` → eligible = true
   - `"trial_only"` → eligible = (on_trial === true)
8. Check duplicate guards:
   - `alreadyAttempted` = `review_prompt_attempted_at != null` (DB)
   - `alreadyAttemptedLocal` = localStorage key `paletteplotting_review_prompt_attempted_post_paywall_v1` === "true"
9. Log: `[review_prompt] eligibility { eligible, uid, onTrial, alreadyAttempted, alreadyAttemptedLocal }`.
10. If eligible AND not already attempted (both guards clear):
    - Set localStorage key to "true" (fast local guard)
    - Write `review_prompt_attempted_at = now()` to `user_plans` (durable DB guard)
    - Log: `[review_prompt] requested`
    - Call `InAppReview.requestReview()`
11. If eligible but already attempted, log: `[review_prompt] skipped already attempted`.
12. If any error occurs, catch and log as warning. Non-blocking. App still navigates to dashboard.

## Full File: `src/pages/onboarding/PostPaywallLoading.tsx`

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { InAppReview } from "@capacitor-community/in-app-review";
import { supabase } from "@/integrations/supabase/client";
import {
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
  WelcomeCosmicBackground,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import { persistWebGuideCharacterFromDraft } from "@/lib/persistWebGuideCharacterFromDraft";
import {
  clearIapPostPurchaseEntitlementLatch,
  runIapPostPurchaseGateIfNeeded,
} from "@/lib/iosPostPurchaseEntitlementGate";
import { getLastPaywallError, syncRevenueCatEntitlementAfterPurchaseWithRetries } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { toast } from "sonner";

const REVIEW_PROMPT_ATTEMPTED_KEY = "paletteplotting_review_prompt_attempted_post_paywall_v1";

/** Progress after entitlement gate — provisioning reports 0–100 above this. */
const PROGRESS_AFTER_GATE = 28;

/** Ring % when each sims line advances (maps to real provisioning milestones). */
const STEP_DONE_AT = [PROGRESS_AFTER_GATE, 64, 76, 95, 100] as const;

const COMMITMENT_LABEL = "Say this once, out loud:";

const COMMITMENT_TEXT =
  "I have named what I want, and I will not abandon it when doubt shows up. " +
  "I commit to giving my desire my voice, my attention, and my follow-through. " +
  "I will not wait to feel ready — I will act like the person who is already on this path. " +
  "What I want deserves more than a passing thought; it deserves my full yes.";

/** One sims-style line per step — loading status + hint combined. */
const SIMS_LINES = [
  "Making it official — membership locked in, overthinking not required.",
  "Writing affirmations from your setup — we actually used your answers.",
  "Giving your affirmations a voice — loop-friendly by design.",
  "Layering sound, whispers & theta into your starter track…",
  "Unlocking your dashboard — built from everything you shared, almost there.",
] as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-white">{pct}%</div>
      </div>
    </div>
  );
}

function getActiveStepIndex(progress: number, phase: "provisioning" | "finishing"): number {
  if (phase === "finishing") return SIMS_LINES.length - 1;
  for (let i = 0; i < STEP_DONE_AT.length; i += 1) {
    if (progress < STEP_DONE_AT[i]) return i;
  }
  return SIMS_LINES.length - 1;
}

function CommitmentBlock() {
  return (
    <div className="space-y-3 border-b border-white/10 pb-4">
      <p className={cn("text-xs font-medium uppercase tracking-wide", SETUP_MUTED_TEXT_CLASS)}>
        {COMMITMENT_LABEL}
      </p>
      <p className="text-[0.9375rem] leading-[1.65] text-white/90 text-pretty">{COMMITMENT_TEXT}</p>
    </div>
  );
}

function SimsTicker({ lineIndex }: { lineIndex: number }) {
  return (
    <div className="relative h-10 overflow-hidden" aria-live="polite" aria-label="Loading status">
      <p
        key={lineIndex}
        className={cn(
          "absolute inset-x-0 top-0 text-xs leading-relaxed",
          SETUP_MUTED_TEXT_CLASS,
          "animate-in fade-in-0 slide-in-from-right-4 duration-300"
        )}
      >
        {SIMS_LINES[lineIndex]}
      </p>
    </div>
  );
}

export default function PostPaywallLoading() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(8);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");
  const runningRef = useRef(false);

  const activeStepIndex = getActiveStepIndex(progress, phase);

  const subtitle = useMemo(() => {
    if (phase === "finishing") return "Almost there — finishing your dashboard.";
    return SIMS_LINES[activeStepIndex];
  }, [activeStepIndex, phase]);

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

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let alive = true;
    let tickId: number | null = null;

    const startSmoothing = (cap: number) => {
      if (tickId != null) window.clearInterval(tickId);
      tickId = window.setInterval(() => {
        setProgress((p) => {
          const next = p + Math.max(0.2, (cap - p) * 0.06);
          return next >= cap ? cap : next;
        });
      }, 120);
    };

    (async () => {
      startSmoothing(92);
      try {
        const gate = await runIapPostPurchaseGateIfNeeded();
        if (!alive) return;

        if (gate === "failed") {
          if (tickId != null) window.clearInterval(tickId);
          debugLog({
            location: "PostPaywallLoading.tsx",
            message: "Native IAP entitlement sync failed on loading screen",
            data: { lastPaywallError: getLastPaywallError() },
            hypothesisId: "H5",
          });
          toast.error("Purchase completed, but we could not activate your plan yet. Try again from subscriptions.");
          clearIapPostPurchaseEntitlementLatch();
          const failRoute = Capacitor.isNativePlatform()
            ? "/onboarding/ios-paywall"
            : "/onboarding/web-paywall";
          window.setTimeout(() => navigate(failRoute, { replace: true }), 450);
          return;
        }

        if (!Capacitor.isNativePlatform()) {
          // Web: entitlement sync handled by runIapPostPurchaseGateIfNeeded above.
          // Guarantee guide → selected_character before provisioning may clear the draft.
          await persistWebGuideCharacterFromDraft();
        } else if (Capacitor.getPlatform() === "android") {
          const ok = await syncRevenueCatEntitlementAfterPurchaseWithRetries();
          if (!alive) return;
          if (!ok) {
            if (tickId != null) window.clearInterval(tickId);
            toast.error("Purchase completed, but we could not activate your plan yet. Please try again.");
            window.setTimeout(() => navigate("/onboarding/android-paywall", { replace: true }), 450);
            return;
          }
        }

        await provisionPostPaywallIfNeeded({ quiet: true });
        if (!alive) return;
        setPhase("finishing");
        if (tickId != null) window.clearInterval(tickId);
        setProgress(100);
        clearIapPostPurchaseEntitlementLatch();

        // --- Review prompt gate (server-controlled via feature_flags) ---
        if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios") {
          try {
            const { data: flag } = await supabase
              .from("feature_flags")
              .select("is_enabled, description")
              .eq("feature_name", "review_prompt")
              .maybeSingle();

            const audience = (flag?.description ?? "").trim().toLowerCase();
            console.info("[review_prompt] flag", { enabled: flag?.is_enabled, audience });

            if (flag?.is_enabled) {
              const { data: session } = await supabase.auth.getSession();
              const uid = session?.session?.user?.id;

              let eligible = false;
              let onTrial: boolean | null | undefined;
              let alreadyAttempted = false;

              if (uid) {
                const { data: plan } = await supabase
                  .from("user_plans")
                  .select("on_trial, review_prompt_attempted_at")
                  .eq("id", uid)
                  .maybeSingle();

                onTrial = plan?.on_trial;
                alreadyAttempted = plan?.review_prompt_attempted_at != null;

                if (audience === "all_new") {
                  eligible = true;
                } else if (audience === "trial_only") {
                  eligible = onTrial === true;
                }
              }

              const alreadyAttemptedLocal = localStorage.getItem(REVIEW_PROMPT_ATTEMPTED_KEY) === "true";
              console.info("[review_prompt] eligibility", { eligible, uid, onTrial, alreadyAttempted, alreadyAttemptedLocal });

              if (eligible && !alreadyAttempted && !alreadyAttemptedLocal && uid) {
                localStorage.setItem(REVIEW_PROMPT_ATTEMPTED_KEY, "true");
                await supabase
                  .from("user_plans")
                  .update({ review_prompt_attempted_at: new Date().toISOString() })
                  .eq("id", uid);
                console.info("[review_prompt] requested");
                await InAppReview.requestReview();
              } else if (eligible && (alreadyAttempted || alreadyAttemptedLocal)) {
                console.info("[review_prompt] skipped already attempted");
              }
            }
          } catch (reviewErr) {
            console.warn("[post-paywall] review prompt skipped:", reviewErr);
          }
        }

        window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
      } catch (e) {
        console.error("[post-paywall] provisioning failed:", e);
        if (!alive) return;
        if (!Capacitor.isNativePlatform()) {
          await persistWebGuideCharacterFromDraft();
        }
        clearIapPostPurchaseEntitlementLatch();
        toast.error("We hit a snag finishing setup. Taking you to the dashboard…");
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 650);
      }
    })();

    return () => {
      alive = false;
      if (tickId != null) window.clearInterval(tickId);
    };
  }, [navigate]);

  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" tone="deep-black" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title="Your path is ready" subtitle={subtitle} />

          <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
            <CommitmentBlock />

            <div className="flex items-center gap-4">
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white/90">Building your dashboard…</div>
              </div>
            </div>

            <SimsTicker lineIndex={activeStepIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## Full File: `src/pages/onboarding/AndroidPostPaywallLoading.tsx`

No review prompt code. This file was reverted to its pre-review-prompt state. Included for completeness so the reviewer can confirm no review prompt wiring is present.

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  WelcomeCosmicBackground,
  WELCOME_DEEP_BLACK_BASE,
  WELCOME_DEEP_BLACK_SHELL_BG,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";
import { provisionPostPaywallIfNeeded } from "@/lib/postPaywallProvisioning";
import {
  clearAndroidPostPurchaseEntitlementLatch,
  getAndroidPostPurchaseLatchUserId,
  markAndroidSubscriptionConfirmed,
  retryAndroidPostPurchaseEntitlementSyncInBackground,
  runAndroidPostPurchaseGateIfNeeded,
} from "@/lib/androidPostPurchaseEntitlementGate";
import { getLastPaywallError } from "@/services/revenueCat";
import { debugLog } from "@/debugLog";
import { toast } from "sonner";

/** Progress after entitlement gate — provisioning reports 0–100 above this. */
const PROGRESS_AFTER_GATE = 28;

/** Ring % when each sims line advances (maps to real provisioning milestones). */
const STEP_DONE_AT = [PROGRESS_AFTER_GATE, 64, 76, 95, 100] as const;

const COMMITMENT_LABEL = "Say this once, out loud:";

const COMMITMENT_TEXT =
  "I have named what I want, and I will not abandon it when doubt shows up. " +
  "I commit to giving my desire my voice, my attention, and my follow-through. " +
  "I will not wait to feel ready — I will act like the person who is already on this path. " +
  "What I want deserves more than a passing thought; it deserves my full yes.";

/** One sims-style line per step — loading status + hint combined. */
const SIMS_LINES = [
  "Making it official — membership locked in, overthinking not required.",
  "Writing affirmations from your setup — we actually used your answers.",
  "Giving your affirmations a voice — loop-friendly by design.",
  "Layering sound, whispers & theta into your starter track…",
  "Unlocking your dashboard — built from everything you shared, almost there.",
] as const;

function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

function getActiveStepIndex(progress: number, phase: "provisioning" | "finishing"): number {
  if (phase === "finishing") return SIMS_LINES.length - 1;
  for (let i = 0; i < STEP_DONE_AT.length; i += 1) {
    if (progress < STEP_DONE_AT[i]) return i;
  }
  return SIMS_LINES.length - 1;
}

function ProgressRing({ value }: { value: number }) {
  const pct = clamp(Math.round(value), 0, 100);
  const r = 46;
  const c = 2 * Math.PI * r;
  const dash = (pct / 100) * c;

  return (
    <div className="relative size-28 shrink-0">
      <svg viewBox="0 0 120 120" className="absolute inset-0">
        <circle cx="60" cy="60" r={r} stroke="rgba(255,255,255,0.15)" strokeWidth="10" fill="none" />
        <circle
          cx="60"
          cy="60"
          r={r}
          stroke="rgba(255,255,255,0.9)"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c - dash}`}
          transform="rotate(-90 60 60)"
        />
      </svg>
      <div className="absolute inset-0 grid place-items-center">
        <div className="text-xl font-semibold tabular-nums text-white">{pct}%</div>
      </div>
    </div>
  );
}

function CommitmentBlock() {
  return (
    <div className="space-y-3 border-b border-white/10 pb-4">
      <p className={cn("text-xs font-medium uppercase tracking-wide", SETUP_MUTED_TEXT_CLASS)}>
        {COMMITMENT_LABEL}
      </p>
      <p className="text-[0.9375rem] leading-[1.65] text-white/90 text-pretty">{COMMITMENT_TEXT}</p>
    </div>
  );
}

function SimsTicker({ lineIndex }: { lineIndex: number }) {
  return (
    <div className="relative h-10 overflow-hidden" aria-live="polite" aria-label="Loading status">
      <p
        key={lineIndex}
        className={cn(
          "absolute inset-x-0 top-0 text-xs leading-relaxed",
          SETUP_MUTED_TEXT_CLASS,
          "animate-in fade-in-0 slide-in-from-right-4 duration-300"
        )}
      >
        {SIMS_LINES[lineIndex]}
      </p>
    </div>
  );
}

/**
 * Android-only post-paywall loading screen. Waits for entitlement sync, then full
 * provisioning before dashboard — with progress tied to real pipeline milestones.
 *
 * Entitlement sync failure is treated as delayed verification (no paywall bounce).
 */
export default function AndroidPostPaywallLoading() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(5);
  const [phase, setPhase] = useState<"provisioning" | "finishing">("provisioning");
  const runningRef = useRef(false);

  const activeStepIndex = getActiveStepIndex(progress, phase);

  const subtitle = useMemo(() => {
    if (phase === "finishing") return "Almost there — finishing your dashboard.";
    return SIMS_LINES[activeStepIndex];
  }, [activeStepIndex, phase]);

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

  useEffect(() => {
    if (runningRef.current) return;
    runningRef.current = true;

    let alive = true;
    const mountTs = performance.now();

    (async () => {
      try {
        setProgress(8);
        const gate = await runAndroidPostPurchaseGateIfNeeded();
        if (!alive) return;

        if (gate.status === "delayed") {
          console.warn(
            "[android-post-paywall] entitlement verification delayed after purchase",
            gate
          );
          retryAndroidPostPurchaseEntitlementSyncInBackground();
        }

        setProgress(PROGRESS_AFTER_GATE);

        await provisionPostPaywallIfNeeded({
          quiet: true,
          onProgress: (provisionPct) => {
            if (!alive) return;
            const mapped =
              PROGRESS_AFTER_GATE +
              Math.round((provisionPct / 100) * (98 - PROGRESS_AFTER_GATE));
            setProgress(clamp(mapped, PROGRESS_AFTER_GATE, 98));
          },
        });

        if (!alive) return;

        const totalMs = Math.round(performance.now() - mountTs);
        const userId = getAndroidPostPurchaseLatchUserId();
        markAndroidSubscriptionConfirmed(userId);
        clearAndroidPostPurchaseEntitlementLatch();

        setPhase("finishing");
        setProgress(100);

        debugLog({
          location: "AndroidPostPaywallLoading.tsx:exit",
          message: "Android post-paywall navigating to dashboard",
          data: { gate, totalMs, lastPaywallError: getLastPaywallError() },
          hypothesisId: "ANDROID-GATE",
        });
        console.info("[android-post-paywall] exit to dashboard", { gate, totalMs });

        window.setTimeout(() => navigate("/dashboard", { replace: true }), 250);
      } catch (e) {
        console.error("[android-post-paywall] provisioning failed:", e);
        if (!alive) return;
        clearAndroidPostPurchaseEntitlementLatch();
        toast.error("We hit a snag finishing setup. Taking you to the dashboard…");
        window.setTimeout(() => navigate("/dashboard", { replace: true }), 650);
      }
    })();

    return () => {
      alive = false;
    };
  }, [navigate]);

  return (
    <div
      className="relative min-h-screen overflow-hidden font-sans text-white antialiased"
      style={{ backgroundColor: WELCOME_DEEP_BLACK_BASE }}
    >
      <WelcomeCosmicBackground className="pointer-events-none fixed inset-0 z-0" tone="deep-black" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-8 py-16">
        <div className="w-full max-w-md space-y-6">
          <SetupHeadingBlock title="Your path is ready" subtitle={subtitle} />

          <div className="space-y-4 rounded-2xl border border-white/12 bg-white/[0.06] p-4 backdrop-blur-md">
            <CommitmentBlock />

            <div className="flex items-center gap-4">
              <ProgressRing value={progress} />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-white/90">Building your dashboard…</div>
              </div>
            </div>

            <SimsTicker lineIndex={activeStepIndex} />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## TypeScript Types Changed: `src/integrations/supabase/types.ts`

`user_plans` Row, Insert, and Update all gained:

```ts
review_prompt_attempted_at: string | null   // Row
review_prompt_attempted_at?: string | null  // Insert
review_prompt_attempted_at?: string | null  // Update
```

No other types were changed.

## `package.json` Dependencies (Capacitor Section)

```json
{
  "dependencies": {
    "@capacitor-community/in-app-review": "^8.0.0",
    "@capacitor/android": "^8.3.3",
    "@capacitor/app": "^8.1.0",
    "@capacitor/browser": "^8.0.0",
    "@capacitor/camera": "^8.0.0",
    "@capacitor/cli": "^8.0.1",
    "@capacitor/core": "^8.0.1",
    "@capacitor/device": "^8.0.2",
    "@capacitor/filesystem": "^8.0.0",
    "@capacitor/haptics": "^8.0.2",
    "@capacitor/ios": "^8.0.1",
    "@capacitor/keyboard": "^8.0.3",
    "@capacitor/local-notifications": "^8.2.0",
    "@capacitor/push-notifications": "^8.0.0",
    "@capacitor/share": "^8.0.0",
    "@capacitor/splash-screen": "^8.0.0",
    "@capacitor/status-bar": "^8.0.2"
  }
}
```

## Duplicate Guard Summary

Two independent guards. Either one blocks the prompt:

| Guard | Storage | Survives reinstall | Survives logout/new device | Queryable |
|---|---|---|---|---|
| localStorage key `paletteplotting_review_prompt_attempted_post_paywall_v1` | Device localStorage | No | No | No |
| `user_plans.review_prompt_attempted_at` | Supabase DB | Yes | Yes | Yes |

localStorage is set first (before DB write), so even if the DB write fails, the device won't re-prompt in the same install. The DB column is the durable record and the one you query from the dashboard.

## What Has Been Verified

- `ReadLints` on `PostPaywallLoading.tsx`: no linter errors
- `ReadLints` on `AndroidPostPaywallLoading.tsx`: no linter errors
- `ReadLints` on `types.ts`: no linter errors

## What Has NOT Been Done

- `npm run build` has not been run
- `npx cap sync` has not been run
- The Supabase migration has not been deployed
- No commit or push has been performed
- No phone testing has been done

## Review questions

1. Is the `user_plans.review_prompt_attempted_at` column addition safe given the existing RLS policies on that table? (The authenticated user should already have UPDATE on their own row.)

2. Is it correct that `user_plans.id` equals the auth user id? The code does `.eq("id", uid)`. Other billing/provisioning flows in the codebase use the same pattern.

3. Does `on_trial` reliably reflect trial status by the time this code runs? Provisioning has completed, entitlement gate has passed, and `user_plans` should have been synced by RevenueCat webhook or client-side sync. If there is a timing risk, the fallback is `all_new` which skips the trial check entirely.

4. Is writing the DB timestamp before calling `requestReview()` the right order? Current logic: localStorage set → DB write → requestReview(). If requestReview() throws, the attempt is still recorded (no re-prompt). If the DB write fails, localStorage still blocks on this device. This is intentional to prevent duplicate prompts at the cost of potentially marking an attempt that Apple suppressed.

5. Should `description` be used as the audience selector long-term, or should a dedicated `variant` or `config jsonb` column be added to `feature_flags` later?

## Commit/Push Safety

- Migration only adds a nullable column and inserts a disabled feature flag row. No risk to existing data.
- Code changes only take effect in builds that include the new source. Existing native binaries are unaffected.
- The web build will include the import of `@capacitor-community/in-app-review`, but the review prompt code path is gated behind `Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios"`, which is false on web.
- The feature flag seeds as disabled. No user will see a prompt until the owner manually enables it.
