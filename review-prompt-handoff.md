# Handoff: Post-Paywall Native Review Prompt

This handoff is for reviewing the in-app review prompt implementation before running the Supabase migration and before committing/pushing.

## Goal

Add a native App Store / Play Store review prompt immediately after successful post-paywall provisioning, while keeping the targeting flexible from Supabase.

The owner wants to be able to change the prompt audience later without shipping a new app binary:

- trial-only users
- all new subscribers
- disabled entirely

## Files Changed

- `package.json`
- `package-lock.json`
- `src/pages/onboarding/PostPaywallLoading.tsx`
- `src/pages/onboarding/AndroidPostPaywallLoading.tsx`
- `supabase/migrations/20260603200000_seed_review_prompt_feature_flag.sql`

## Dependency Added

Installed:

```json
"@capacitor-community/in-app-review": "^8.0.0"
```

This was added because the project is on Capacitor 8 and the plugin exposes:

```ts
import { InAppReview } from "@capacitor-community/in-app-review";

await InAppReview.requestReview();
```

Before shipping native builds, Capacitor sync still needs to run:

```bash
npx cap sync
```

The repo also has scripts:

```json
"cap:sync": "npm run build && npx cap sync",
"cap:sync:android": "npm run build && npx cap sync android"
```

## Supabase Feature Flag Control

The project already has a `feature_flags` table with:

- `feature_name`
- `is_enabled`
- `description`

Existing RLS allows public select:

```sql
CREATE POLICY "Anyone can view feature flags"
ON public.feature_flags FOR SELECT
USING (true);
```

The implementation uses one row:

- `feature_name`: `review_prompt`
- `is_enabled`: master on/off toggle
- `description`: audience selector

Valid `description` values:

- `trial_only`
- `all_new`

Disable behavior:

- set `is_enabled = false`

## Migration Added

File: `supabase/migrations/20260603200000_seed_review_prompt_feature_flag.sql`

```sql
-- Seed the review-prompt feature flag.
-- description doubles as the audience selector:
--   "trial_only"  → only users whose on_trial = true
--   "all_new"     → every new subscriber (trial or not)
-- Toggle is_enabled = false to disable the prompt entirely.
INSERT INTO public.feature_flags (feature_name, is_enabled, description)
VALUES ('review_prompt', true, 'trial_only')
ON CONFLICT (feature_name) DO NOTHING;
```

Notes for review:

- This does not alter schema.
- This does not overwrite an existing `review_prompt` row because of `DO NOTHING`.
- Default rollout is enabled for `trial_only`.
- If the owner wants migration to seed disabled by default, change `true` to `false`.

## Review Prompt Logic

The same inline logic was added in both native post-paywall loading screens.

No shared helper was created, per project rule.

The flow is:

1. post-purchase entitlement gate completes
2. post-paywall provisioning completes
3. finishing state/progress is set
4. client reads `feature_flags.review_prompt`
5. if disabled, skip
6. if `description = "all_new"`, prompt
7. if `description = "trial_only"`, read current user session, query `user_plans.on_trial`, prompt only if true
8. errors are caught and only logged as warnings
9. app still navigates to `/dashboard`

Important behavior:

- iOS/native path checks `Capacitor.isNativePlatform()` before attempting prompt.
- Android-only screen does not call `Capacitor.isNativePlatform()` because the screen itself is Android-only.
- Review prompt errors are non-blocking.
- Apple/Google may throttle or suppress the actual prompt even when `requestReview()` is called.

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
        if (Capacitor.isNativePlatform()) {
          try {
            const { data: flag } = await supabase
              .from("feature_flags")
              .select("is_enabled, description")
              .eq("feature_name", "review_prompt")
              .maybeSingle();

            if (flag?.is_enabled) {
              const audience = (flag.description ?? "").trim().toLowerCase();
              let eligible = false;

              if (audience === "all_new") {
                eligible = true;
              } else if (audience === "trial_only") {
                const { data: session } = await supabase.auth.getSession();
                const uid = session?.session?.user?.id;
                if (uid) {
                  const { data: plan } = await supabase
                    .from("user_plans")
                    .select("on_trial")
                    .eq("id", uid)
                    .maybeSingle();
                  eligible = plan?.on_trial === true;
                }
              }

              if (eligible) {
                await InAppReview.requestReview();
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

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InAppReview } from "@capacitor-community/in-app-review";
import { supabase } from "@/integrations/supabase/client";
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

        // --- Review prompt gate (server-controlled via feature_flags) ---
        try {
          const { data: flag } = await supabase
            .from("feature_flags")
            .select("is_enabled, description")
            .eq("feature_name", "review_prompt")
            .maybeSingle();

          if (flag?.is_enabled) {
            const audience = (flag.description ?? "").trim().toLowerCase();
            let eligible = false;

            if (audience === "all_new") {
              eligible = true;
            } else if (audience === "trial_only") {
              const { data: session } = await supabase.auth.getSession();
              const uid = session?.session?.user?.id;
              if (uid) {
                const { data: plan } = await supabase
                  .from("user_plans")
                  .select("on_trial")
                  .eq("id", uid)
                  .maybeSingle();
                eligible = plan?.on_trial === true;
              }
            }

            if (eligible) {
              await InAppReview.requestReview();
            }
          }
        } catch (reviewErr) {
          console.warn("[android-post-paywall] review prompt skipped:", reviewErr);
        }

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

## `package.json` Relevant Dependency Section

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

## Things To Review Carefully

1. Is `feature_flags.description` acceptable as the audience selector?
   - Advantage: no schema change.
   - Tradeoff: the column name is generic and not strongly typed.

2. Should the migration default be enabled?
   - Current default is `true` + `trial_only`.
   - Safer launch default might be `false` + `trial_only`.

3. Should `all_new` include users even when `user_plans` cannot be fetched?
   - Current behavior: yes, `all_new` does not query `user_plans`.
   - This matches "any new subscriber" at that exact post-paywall success point.

4. Should there be a local "already attempted review prompt" flag?
   - Current implementation does not add one.
   - Apple/Google throttle prompts themselves.
   - But a local flag could prevent repeated calls if a user re-enters the post-paywall loading route.

5. Does `user_plans.id = auth user id` hold everywhere?
   - Existing codebase appears to treat `user_plans.id` as the user id in related billing/provisioning flows.
   - The review logic uses `.eq("id", uid)`.

6. Is the Android file guaranteed Android-only?
   - Current implementation assumes yes.
   - If that route can be rendered on web/iOS, add `Capacitor.isNativePlatform()` / platform checks.

7. Does `@capacitor-community/in-app-review` v8 require any additional native setup beyond `npx cap sync`?
   - Expected answer: no special setup beyond sync, but verify against the package README/current native build output.

8. Should review prompt be iOS-only instead of iOS + Android?
   - Current code prompts on both native post-paywall paths.
   - If the business only wants iOS, remove Android import/call and keep only `PostPaywallLoading.tsx` guarded by `Capacitor.getPlatform() === "ios"`.

## Verification Already Done

ReadLints was run against:

- `src/pages/onboarding/PostPaywallLoading.tsx`
- `src/pages/onboarding/AndroidPostPaywallLoading.tsx`

Result:

```text
No linter errors found.
```

## Verification Not Yet Done

These have not been run yet:

```bash
npm run build
npx cap sync
```

The Supabase migration has not been deployed yet.

No commit/push has been performed yet.

## Operational Control After Migration

To keep review prompt off:

```sql
UPDATE public.feature_flags
SET is_enabled = false
WHERE feature_name = 'review_prompt';
```

To allow trial users only:

```sql
UPDATE public.feature_flags
SET is_enabled = true,
    description = 'trial_only'
WHERE feature_name = 'review_prompt';
```

To allow all new subscribers:

```sql
UPDATE public.feature_flags
SET is_enabled = true,
    description = 'all_new'
WHERE feature_name = 'review_prompt';
```

## Commit/Push Safety Notes

Current shipped native app versions do not contain this JS code or plugin wiring, so committing/pushing source changes alone does not affect already-installed native app binaries.

The migration only inserts a feature flag row. Existing app versions do not read this row, so it should not affect them.

The web app will include the imported package after deployment, but `PostPaywallLoading.tsx` only calls `InAppReview.requestReview()` when `Capacitor.isNativePlatform()` is true. The Android-only screen should not be reached by web users under current routing assumptions.

