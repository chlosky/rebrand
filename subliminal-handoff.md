# Web subliminal fast-path handoff — full code

**Repo:** belief-craft-nexus (Palette Plotting)  
**Branch:** Mobile-app  
**Supabase project:** hyckwyjznishkjijrhcw  
**Generated:** 2026-06-05

---

## 1. Goal

User builds a subliminal on **web** → signs up → downloads **iOS app** → pays in app → **"Your custom track"** appears in Subliminal Maker (`subliminal_tracks`) as **MP3**.

---

## 2. Hard constraints (do not violate)

| Rule | Detail |
|------|--------|
| **No `user_setup_path`** | Handoff data lives in `onboarding_sessions.onboarding_answers.subliminal_fast_path_v1` only |
| **No `postPaywallProvisioning.ts` changes** | Standard iOS starter onboarding is separate; web handoff bypasses it |
| **No RevenueCat sync hook** | Worker is DB trigger + cron only |
| **Final track** | Name must be `"Your custom track"`, format **MP3** |
| **No server audio mix on edge** | WASM mix caused `546 WORKER_RESOURCE_LIMIT`; worker only inserts DB row pointing at browser-mixed file |

---

## 3. Architecture

```
Web: /onboarding/subliminal/welcomepre
  → /onboarding/subliminal/welcome (build: affirmations + record voice)
  → /onboarding/subliminal/setup/plot-loading → path-ready → email
  → SubliminalEmail: AudioProcessor mix in browser → upload MP3 to storage
  → save onboarding_sessions.subliminal_fast_path_v1 (handoffPending: true)
  → /onboarding/subliminal/get-the-app

App: same email → pay → user_plans.status = active
  → DB trigger enqueues user_plan_subliminal_handoff_queue (process_after = now + 1 min)
  → pg_cron → process-user-plan-subliminal-handoff edge function
  → INSERT subliminal_tracks row (audio_url = public URL of pre-mixed file)
  → App loads tracks from subliminal_tracks on Subliminal Maker open
```

### Source of truth JSON shape (`onboarding_sessions.onboarding_answers.subliminal_fast_path_v1`)

```json
{
  "schema_version": 1,
  "saved_at": "ISO8601",
  "handoffPending": true,
  "handoffProcessedAt": null,
  "onboardingMixedStoragePath": "{userId}/onboarding-mixed-{timestamp}.mp3",
  "subliminalBinauralBeat": "theta",
  "subliminalBackgroundSound": "Rain v2.WAV",
  "subliminalLayers": 3,
  "subliminalTrackMinutes": 5,
  "starterAffirmations": ["..."],
  "subliminalVocalMode": "karaoke"
}
```

### Tables touched

| Table | Role |
|-------|------|
| `onboarding_sessions` | Stores `subliminal_fast_path_v1` |
| `user_plans` | Trigger when status becomes `active` |
| `user_plan_subliminal_handoff_queue` | 1-minute delay queue |
| `subliminal_tracks` | Final track row for app |
| `subliminal_generation_log` | Audit log on insert |
| Storage `subliminal-tracks` | Pre-mixed MP3 at signup |

---

## 4. Web routes (App.tsx)

Direct URLs (no homepage CTA required):

- `/onboarding/subliminal/welcomepre`
- `/onboarding/subliminal/welcome`
- `/onboarding/subliminal/setup/plot-loading`
- `/onboarding/subliminal/setup/path-ready`
- `/onboarding/subliminal/setup/name`
- `/onboarding/subliminal/setup/email`
- `/onboarding/subliminal/get-the-app`

---

## 5. Deploy checklist

1. **Migrations applied:** `20260605200000_user_plans_subliminal_handoff_queue.sql`, `20260605300000_subliminal_handoff_enqueue_on_session.sql`
2. **Edge function:** `supabase functions deploy process-user-plan-subliminal-handoff --project-ref hyckwyjznishkjijrhcw`
3. **Secrets:** `CRON_SECRET` (required), `SUBLIMINAL_HANDOFF_WORKER_ENABLED=true` (default on when unset)
4. **pg_cron job** (Supabase SQL, every minute):

```sql
SELECT net.http_post(
  url := 'https://hyckwyjznishkjijrhcw.supabase.co/functions/v1/process-user-plan-subliminal-handoff',
  headers := jsonb_build_object(
    'Content-Type', 'application/json',
    'Authorization', 'Bearer ' || (SELECT decrypted_secret FROM vault.decrypted_secrets WHERE name = 'CRON_SECRET' LIMIT 1)
  ),
  body := '{}'::jsonb
);
```

(Adjust to match how Brevo welcome cron is configured in your project.)

5. **Prod web deploy** must include client-side mix at signup (`SubliminalEmail.tsx` + `AudioProcessor`).

---

## 6. Diagnostics SQL

```sql
-- Handoff saved at signup?
SELECT user_id, email,
  onboarding_answers->'subliminal_fast_path_v1'->>'handoffPending' AS pending,
  onboarding_answers->'subliminal_fast_path_v1'->>'onboardingMixedStoragePath' AS mixed_path,
  updated_at
FROM onboarding_sessions
WHERE onboarding_answers ? 'subliminal_fast_path_v1'
ORDER BY updated_at DESC LIMIT 10;

-- Queue state
SELECT user_id,
  handoff_draft->>'onboardingMixedStoragePath' AS mixed_path,
  process_after, processed_at, created_at
FROM user_plan_subliminal_handoff_queue
ORDER BY created_at DESC LIMIT 10;

-- Final track
SELECT user_id, name, audio_url, created_at
FROM subliminal_tracks
WHERE name = 'Your custom track'
ORDER BY created_at DESC LIMIT 10;

-- Re-trigger queue for a paid user who has mixed_path
UPDATE user_plan_subliminal_handoff_queue
SET processed_at = NULL, process_after = now()
WHERE user_id = 'YOUR_USER_UUID';
```

---

## 7. Known failures

| Symptom | Cause | Fix |
|---------|-------|-----|
| `546 WORKER_RESOURCE_LIMIT` | Old worker tried server-side WASM audio mix | Fixed: worker v13+ only inserts DB row, no mix |
| `missing_premixed_path` | Signup before client mix deploy, or no recording in localStorage | Fresh test: record voice, wait for "Creating your subliminal..." |
| `skipped_existing` | Row already in subliminal_tracks for that user | New email or delete old row |
| No queue row | Pay before handoff saved, or email mismatch | Migration 053 session trigger + RPC at signup |
| Track not in app | Need to leave/re-enter Subliminal Maker to refresh | Expected |

---

## 8. Vocal blob localStorage key

- Key: `sv_subliminal_onboarding_vocal_blob_v1`
- Set in `WelcomeSubliminal.tsx` `saveDraftAndContinue()` when user finishes builder
- Read in `SubliminalEmail.tsx` at signup for browser mix

---

## 9. Full source files


### supabase/functions/process-user-plan-subliminal-handoff/index.ts

```typescript
/**
 * Server-only web subliminal handoff worker (Supabase cron + CRON_SECRET).
 * Triggered by user_plans INSERT/UPDATE â†’ active when onboarding_sessions has a pending subliminal handoff.
 * Not invoked from RevenueCat sync, post-paywall provisioning, or the mobile app build.
 *
 * Inserts subliminal_tracks using the browser-mixed MP3 already uploaded at web signup.
 * No server audio decode/mix â€” edge workers hit WORKER_RESOURCE_LIMIT on WASM mix.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 25;
const HANDOFF_SUBLIMINAL_TRACK_NAME = "Your custom track";
const RETRY_AFTER_MINUTES = 5;

function isEnabledFlag(value: string | null | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

type HandoffDraft = {
  subliminalBinauralBeat?: string | null;
  subliminal_background_sound?: string | null;
  subliminalBackgroundSound?: string | null;
  subliminalLayers?: number | null;
  subliminalTrackMinutes?: number | null;
  onboardingMixedStoragePath?: string | null;
};

function draftBackgroundSound(draft: HandoffDraft): string {
  const camel =
    typeof draft.subliminalBackgroundSound === "string" ? draft.subliminalBackgroundSound.trim() : "";
  if (camel) return camel;
  const snake =
    typeof draft.subliminal_background_sound === "string" ? draft.subliminal_background_sound.trim() : "";
  return snake || "Rain v2.WAV";
}

async function markHandoffProcessed(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  processedAt: string,
): Promise<void> {
  const { data: rows } = await supabase
    .from("onboarding_sessions")
    .select("id, onboarding_answers")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1);

  const row = rows?.[0];
  if (!row?.id) return;

  const answers =
    row.onboarding_answers && typeof row.onboarding_answers === "object" && !Array.isArray(row.onboarding_answers)
      ? (row.onboarding_answers as Record<string, unknown>)
      : {};
  const fastPath =
    answers.subliminal_fast_path_v1 &&
    typeof answers.subliminal_fast_path_v1 === "object" &&
    !Array.isArray(answers.subliminal_fast_path_v1)
      ? (answers.subliminal_fast_path_v1 as Record<string, unknown>)
      : {};

  const { error } = await supabase
    .from("onboarding_sessions")
    .update({
      onboarding_answers: {
        ...answers,
        subliminal_fast_path_v1: {
          ...fastPath,
          handoffPending: false,
          handoffProcessedAt: processedAt,
        },
      },
    })
    .eq("id", row.id);

  if (error) {
    console.warn("[process-user-plan-subliminal-handoff] mark handoff processed failed:", userId, error.message);
  }
}

async function deferQueueRetry(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  minutes = RETRY_AFTER_MINUTES,
): Promise<void> {
  const retryAfter = new Date(Date.now() + minutes * 60_000).toISOString();
  await supabase
    .from("user_plan_subliminal_handoff_queue")
    .update({ process_after: retryAfter })
    .eq("user_id", userId);
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const cronSecret = Deno.env.get("CRON_SECRET");
    const authHeader = req.headers.get("Authorization");
    if (!cronSecret) {
      return new Response(JSON.stringify({ error: "Cron not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const envEnabled = isEnabledFlag(Deno.env.get("SUBLIMINAL_HANDOFF_WORKER_ENABLED"));
    if (!envEnabled) {
      return new Response(
        JSON.stringify({ success: true, enabled: false, processed: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const nowIso = new Date().toISOString();
    const { data: queueRows, error: queueErr } = await supabase
      .from("user_plan_subliminal_handoff_queue")
      .select("user_id, handoff_draft, process_after")
      .lte("process_after", nowIso)
      .is("processed_at", null)
      .order("process_after", { ascending: true })
      .limit(BATCH_SIZE);

    if (queueErr) {
      console.error("[process-user-plan-subliminal-handoff] queue select:", queueErr);
      return new Response(JSON.stringify({ error: queueErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!queueRows?.length) {
      return new Response(
        JSON.stringify({ success: true, enabled: true, processed: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processed = 0;
    let failed = 0;
    const details: Array<{ user_id: string; status: string; reason?: string; track_id?: string }> = [];

    for (const row of queueRows) {
      const userId = row.user_id as string;

      const { data: planRow } = await supabase
        .from("user_plans")
        .select("status, current_period_end")
        .eq("user_id", userId)
        .maybeSingle();

      const planActive = !!(
        planRow &&
        planRow.status === "active" &&
        (!planRow.current_period_end || new Date(planRow.current_period_end) > new Date())
      );

      if (!planActive) {
        await supabase.from("user_plan_subliminal_handoff_queue").delete().eq("user_id", userId);
        continue;
      }

      const { data: existingTrack } = await supabase
        .from("subliminal_tracks")
        .select("id")
        .eq("user_id", userId)
        .eq("name", HANDOFF_SUBLIMINAL_TRACK_NAME)
        .limit(1)
        .maybeSingle();

      if (existingTrack?.id) {
        await supabase.from("user_plan_subliminal_handoff_queue").update({ processed_at: nowIso }).eq("user_id", userId);
        await markHandoffProcessed(supabase, userId, nowIso);
        processed += 1;
        details.push({ user_id: userId, status: "skipped_existing", track_id: existingTrack.id });
        continue;
      }

      const draft = row.handoff_draft as HandoffDraft | null;
      if (!draft || typeof draft !== "object") {
        await supabase.from("user_plan_subliminal_handoff_queue").update({ processed_at: nowIso }).eq("user_id", userId);
        failed += 1;
        details.push({ user_id: userId, status: "failed", reason: "missing_handoff_draft" });
        continue;
      }

      const binauralType =
        typeof draft.subliminalBinauralBeat === "string" && draft.subliminalBinauralBeat.trim()
          ? draft.subliminalBinauralBeat.trim()
          : "theta";
      const backgroundSound = draftBackgroundSound(draft);
      const layers =
        typeof draft.subliminalLayers === "number" && draft.subliminalLayers > 0 ? draft.subliminalLayers : 1;
      const lengthMinutes =
        typeof draft.subliminalTrackMinutes === "number" && draft.subliminalTrackMinutes > 0
          ? draft.subliminalTrackMinutes
          : 5;

      const mixedPath =
        typeof draft.onboardingMixedStoragePath === "string" ? draft.onboardingMixedStoragePath.trim() : "";

      if (!mixedPath) {
        console.error("[process-user-plan-subliminal-handoff] no onboardingMixedStoragePath:", userId);
        await deferQueueRetry(supabase, userId);
        failed += 1;
        details.push({ user_id: userId, status: "failed", reason: "missing_premixed_path" });
        continue;
      }

      const { data: publicData } = supabase.storage.from("subliminal-tracks").getPublicUrl(mixedPath);
      const publicUrl = publicData?.publicUrl;
      if (!publicUrl) {
        console.error("[process-user-plan-subliminal-handoff] public url failed:", userId, mixedPath);
        await deferQueueRetry(supabase, userId);
        failed += 1;
        details.push({ user_id: userId, status: "failed", reason: "public_url_failed" });
        continue;
      }

      const { data: dbTrack, error: dbErr } = await supabase
        .from("subliminal_tracks")
        .insert({
          user_id: userId,
          name: HANDOFF_SUBLIMINAL_TRACK_NAME,
          binaural_beat: binauralType,
          binaural_volume: 0.07,
          background_sound: backgroundSound,
          affirmation_volume: 0.04,
          background_volume: 1,
          layers,
          length: lengthMinutes,
          audio_url: publicUrl,
        })
        .select("id")
        .single();

      if (dbErr || !dbTrack?.id) {
        console.error("[process-user-plan-subliminal-handoff] db insert failed:", userId, dbErr);
        await deferQueueRetry(supabase, userId);
        failed += 1;
        details.push({
          user_id: userId,
          status: "failed",
          reason: `db_insert:${dbErr?.message ?? "unknown"}`,
        });
        continue;
      }

      await supabase.from("subliminal_generation_log").insert({
        user_id: userId,
        track_id: dbTrack.id,
        generated_at: nowIso,
      });

      await supabase.from("user_plan_subliminal_handoff_queue").update({ processed_at: nowIso }).eq("user_id", userId);
      await markHandoffProcessed(supabase, userId, nowIso);
      processed += 1;
      details.push({ user_id: userId, status: "inserted", track_id: dbTrack.id, reason: mixedPath });
    }

    return new Response(
      JSON.stringify({ success: true, enabled: true, processed, failed, details }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[process-user-plan-subliminal-handoff] unhandled:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

```

### supabase/migrations/20260605200000_user_plans_subliminal_handoff_queue.sql

```sql
-- Queue web subliminal handoff mix when user_plans becomes active (INSERT or status UPDATE).
-- Source of truth is public.onboarding_sessions.onboarding_answers->'subliminal_fast_path_v1'.
-- No user_setup_path dependency and no RevenueCat sync hook. Cron drains queue.

CREATE TABLE IF NOT EXISTS public.user_plan_subliminal_handoff_queue (
  user_id uuid PRIMARY KEY REFERENCES public.user_plans(user_id) ON DELETE CASCADE,
  handoff_draft jsonb NOT NULL,
  onboarding_vocal_storage_path text,
  process_after timestamptz NOT NULL,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.user_plan_subliminal_handoff_queue IS
  'Web subliminal builder handoff mix after user_plans is active; sourced from onboarding_sessions and drained by process-user-plan-subliminal-handoff.';

ALTER TABLE public.user_plan_subliminal_handoff_queue ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.user_plan_subliminal_handoff_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_subliminal_handoff_queue TO service_role;

DROP TRIGGER IF EXISTS trg_user_plan_subliminal_handoff_queue_updated ON public.user_plan_subliminal_handoff_queue;
CREATE TRIGGER trg_user_plan_subliminal_handoff_queue_updated
  BEFORE UPDATE ON public.user_plan_subliminal_handoff_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_subliminal_handoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  handoff jsonb;
  vocal_path text;
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  SELECT os.onboarding_answers->'subliminal_fast_path_v1',
         os.onboarding_answers #>> '{subliminal_fast_path_v1,onboardingVocalStoragePath}'
    INTO handoff, vocal_path
  FROM public.onboarding_sessions os
  LEFT JOIN auth.users au ON au.id = NEW.user_id
  WHERE (
      os.user_id = NEW.user_id
      OR (au.email IS NOT NULL AND lower(os.email) = lower(au.email))
    )
    AND os.onboarding_answers ? 'subliminal_fast_path_v1'
    AND COALESCE((os.onboarding_answers #>> '{subliminal_fast_path_v1,handoffPending}')::boolean, false) = true
  ORDER BY os.updated_at DESC NULLS LAST, os.created_at DESC
  LIMIT 1;

  IF handoff IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.user_plan_subliminal_handoff_queue (
    user_id,
    handoff_draft,
    onboarding_vocal_storage_path,
    process_after
  )
  VALUES (
    NEW.user_id,
    handoff,
    NULLIF(vocal_path, ''),
    now() + interval '1 minute'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET handoff_draft = EXCLUDED.handoff_draft,
      onboarding_vocal_storage_path = EXCLUDED.onboarding_vocal_storage_path,
      process_after = EXCLUDED.process_after,
      processed_at = NULL;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_plans_insert_subliminal_handoff ON public.user_plans;
DROP TRIGGER IF EXISTS on_user_plans_update_subliminal_handoff ON public.user_plans;

CREATE TRIGGER on_user_plans_insert_subliminal_handoff
  AFTER INSERT ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_subliminal_handoff();

CREATE TRIGGER on_user_plans_update_subliminal_handoff
  AFTER UPDATE OF status ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_user_plan_subliminal_handoff();

```

### supabase/migrations/20260605300000_subliminal_handoff_enqueue_on_session.sql

```sql
-- Enqueue subliminal handoff when onboarding_sessions saves handoff data (not only user_plans flip).
-- Fixes race: user_plans active before handoff row exists, or handoff saved after paywall.

CREATE OR REPLACE FUNCTION public.try_enqueue_subliminal_handoff_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  handoff jsonb;
  vocal_path text;
  plan_active boolean;
BEGIN
  IF p_user_id IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.user_plans up
    WHERE up.user_id = p_user_id
      AND up.status = 'active'
      AND (up.current_period_end IS NULL OR up.current_period_end > now())
  )
  INTO plan_active;

  IF NOT plan_active THEN
    RETURN;
  END IF;

  SELECT os.onboarding_answers->'subliminal_fast_path_v1',
         os.onboarding_answers #>> '{subliminal_fast_path_v1,onboardingVocalStoragePath}'
    INTO handoff, vocal_path
  FROM public.onboarding_sessions os
  LEFT JOIN auth.users au ON au.id = p_user_id
  WHERE (
      os.user_id = p_user_id
      OR (au.email IS NOT NULL AND os.email IS NOT NULL AND lower(os.email) = lower(au.email))
    )
    AND os.onboarding_answers ? 'subliminal_fast_path_v1'
    AND COALESCE((os.onboarding_answers #>> '{subliminal_fast_path_v1,handoffPending}')::boolean, false) = true
  ORDER BY os.updated_at DESC NULLS LAST, os.created_at DESC
  LIMIT 1;

  IF handoff IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.user_plan_subliminal_handoff_queue (
    user_id,
    handoff_draft,
    onboarding_vocal_storage_path,
    process_after
  )
  VALUES (
    p_user_id,
    handoff,
    NULLIF(vocal_path, ''),
    now() + interval '1 minute'
  )
  ON CONFLICT (user_id) DO UPDATE
  SET handoff_draft = EXCLUDED.handoff_draft,
      onboarding_vocal_storage_path = EXCLUDED.onboarding_vocal_storage_path,
      process_after = EXCLUDED.process_after,
      processed_at = NULL;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_user_plan_subliminal_handoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' AND OLD.status IS NOT DISTINCT FROM 'active' THEN
    RETURN NEW;
  END IF;

  PERFORM public.try_enqueue_subliminal_handoff_for_user(NEW.user_id);
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.enqueue_onboarding_session_subliminal_handoff()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  resolved_user_id uuid;
  handoff_pending boolean;
BEGIN
  IF NOT (NEW.onboarding_answers ? 'subliminal_fast_path_v1') THEN
    RETURN NEW;
  END IF;

  handoff_pending := COALESCE(
    (NEW.onboarding_answers #>> '{subliminal_fast_path_v1,handoffPending}')::boolean,
    false
  );

  IF NOT handoff_pending THEN
    RETURN NEW;
  END IF;

  resolved_user_id := NEW.user_id;

  IF resolved_user_id IS NULL AND NEW.email IS NOT NULL THEN
    SELECT au.id
      INTO resolved_user_id
    FROM auth.users au
    WHERE lower(au.email) = lower(NEW.email)
    LIMIT 1;
  END IF;

  IF resolved_user_id IS NOT NULL THEN
    PERFORM public.try_enqueue_subliminal_handoff_for_user(resolved_user_id);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_onboarding_sessions_subliminal_handoff ON public.onboarding_sessions;

CREATE TRIGGER on_onboarding_sessions_subliminal_handoff
  AFTER INSERT OR UPDATE OF onboarding_answers, user_id, email ON public.onboarding_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.enqueue_onboarding_session_subliminal_handoff();

CREATE OR REPLACE FUNCTION public.enqueue_subliminal_handoff_if_ready(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.try_enqueue_subliminal_handoff_for_user(p_user_id);
END;
$$;

REVOKE ALL ON FUNCTION public.enqueue_subliminal_handoff_if_ready(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enqueue_subliminal_handoff_if_ready(uuid) TO authenticated;

```

### src/pages/onboarding/subliminal/SubliminalEmail.tsx

```tsx
import { useEffect, useMemo, useRef, useState } from "react";
import "@/styles/welcome-web-effects.css";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  SETUP_FIELD_CLASS,
  SETUP_LABEL_CLASS,
  SETUP_MUTED_TEXT_CLASS,
} from "@/lib/onboardingSetupTheme";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { Capacitor } from "@capacitor/core";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { supabase } from "@/integrations/supabase/client";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";
import { runIosPaywallFlowAfterSignup } from "@/lib/runIosPaywallFlow";
import { runAndroidPaywallFlowAfterSignup } from "@/lib/runAndroidPaywallFlow";
import { shouldUseRevenueCatPaywallUi } from "@/lib/iosRevenueCatUiGate";
import { isAndroidPaywallContext } from "@/lib/isAndroidPaywallContext";
import { toast } from "sonner";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { linkWebOnboardingSessionToUser } from "@/lib/webOnboardingSessionInsert";

const SUBLIMINAL_GET_THE_APP_PATH = "/onboarding/subliminal/get-the-app";
const SUBLIMINAL_ONBOARDING_VOCAL_KEY = "sv_subliminal_onboarding_vocal_blob_v1";

export default function SubliminalEmail() {
  const navigate = useNavigate();
  const { ensureSession, updateSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft(), []);
  const [firstName, setFirstName] = useState(initial.firstName ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailMarketingConsent, setEmailMarketingConsent] = useState(
    initial.emailMarketingConsent === true,
  );
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [paywallNeedsRetry, setPaywallNeedsRetry] = useState(false);
  const [isRetryingPaywall, setIsRetryingPaywall] = useState(false);
  const emailCheckTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const fontId = "sv-welcome-proxima-nova";
    if (document.getElementById(fontId)) return;
    const fontLink = document.createElement("link");
    fontLink.id = fontId;
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
    document.head.appendChild(fontLink);
  }, []);

  useEffect(() => {
    if (!password) {
      setPasswordError(null);
      return;
    }
    if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      return;
    }
    setPasswordError(null);
  }, [password]);

  useEffect(() => {
    if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    if (!email || !email.includes("@")) {
      setEmailError(null);
      setIsCheckingEmail(false);
      return;
    }
    setIsCheckingEmail(true);
    setEmailError(null);
    emailCheckTimeoutRef.current = setTimeout(async () => {
      try {
        const { data: emailExists, error: checkError } = await supabase.rpc("check_email_exists", {
          check_email: email.trim(),
        });
        if (checkError) {
          setEmailError(null);
        } else if (emailExists) {
          setEmailError("This email is already registered. Sign in instead.");
        } else {
          setEmailError(null);
        }
      } catch {
        setEmailError(null);
      } finally {
        setIsCheckingEmail(false);
      }
    }, 500);
    return () => {
      if (emailCheckTimeoutRef.current) clearTimeout(emailCheckTimeoutRef.current);
    };
  }, [email]);

  const normalizedEmail = email.trim().toLowerCase();
  const firstNameTrimmed = firstName.trim();
  const usernameForAuth = normalizedEmail;

  const formValid =
    normalizedEmail.length > 3 &&
    normalizedEmail.includes("@") &&
    password.length >= 8 &&
    acceptedTerms &&
    firstNameTrimmed.length > 0 &&
    !emailError &&
    !passwordError &&
    !isCheckingEmail;

  const handleRetryPaywall = async () => {
    setIsRetryingPaywall(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (isAndroidPaywallContext()) {
        const outcome = await runAndroidPaywallFlowAfterSignup({
          userId: userData.user?.id ?? null,
          navigate,
        });
        if (outcome === "success") {
          setPaywallNeedsRetry(false);
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }
      const outcome = await runIosPaywallFlowAfterSignup({
        userId: userData.user?.id ?? null,
        navigate,
      });
      if (outcome === "success") {
        setPaywallNeedsRetry(false);
        return;
      }
      if (outcome === "skipped") {
        navigate("/onboarding/ios-paywall", { replace: true });
        return;
      }
      setPaywallNeedsRetry(true);
    } finally {
      setIsRetryingPaywall(false);
    }
  };

  const handleContinue = async () => {
    if (!normalizedEmail.includes("@")) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (!firstNameTrimmed) {
      toast.error("Please enter your first name");
      return;
    }
    if (!password || password.length < 8) {
      toast.error("Please enter a password with at least 8 characters");
      return;
    }
    if (!acceptedTerms) {
      toast.error("Please accept the Terms of Service and Privacy Policy");
      return;
    }
    if (emailError) {
      toast.error(emailError);
      if (emailError.includes("already registered")) navigate("/login");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            first_name: firstNameTrimmed,
            username: usernameForAuth,
          },
        },
      });

      if (signUpError) throw signUpError;

      if (!signUpData.session) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (signInError) {
          throw new Error(
            "Account created, but sign-in is blocked. Verify your email, then sign in.",
          );
        }
      }

      const {
        data: { user: authedUser },
      } = await supabase.auth.getUser();

      const draftSnapshot = readSetupDraft();
      const sessionPatch: Record<string, unknown> = {
        email: normalizedEmail,
        first_name: firstNameTrimmed,
        username: usernameForAuth,
        email_consent: emailMarketingConsent,
        sms_consent: false,
      };
      if (typeof draftSnapshot.appNotificationsConsent === "boolean") {
        sessionPatch.app_notifications_consent = draftSnapshot.appNotificationsConsent;
      }
      if (
        draftSnapshot.trackingPrePermissionChoice === "yes" ||
        draftSnapshot.trackingPrePermissionChoice === "no"
      ) {
        sessionPatch.tracking_pre_permission_choice = draftSnapshot.trackingPrePermissionChoice;
      }
      if (typeof draftSnapshot.trackingAuthorizationStatus === "string") {
        sessionPatch.tracking_authorization_status = draftSnapshot.trackingAuthorizationStatus;
      }
      if (typeof draftSnapshot.trackingPermissionAskedAt === "string") {
        sessionPatch.tracking_permission_asked_at = draftSnapshot.trackingPermissionAskedAt;
      }

      const uid = signUpData.user?.id ?? authedUser?.id ?? null;
      if (uid) {
        await linkWebOnboardingSessionToUser(uid);
      }
      const isNativeIos = Capacitor.isNativePlatform() && Capacitor.getPlatform() === "ios";

      if (isNativeIos) {
        ensureSession()
          .then(() => updateSession(sessionPatch))
          .then(() =>
            writeSetupDraft({
              firstName: firstNameTrimmed,
              email: normalizedEmail,
              emailMarketingConsent,
            }),
          )
          .catch(() => {});

        let useRcUi = true;
        try {
          useRcUi = await shouldUseRevenueCatPaywallUi();
        } catch {
          useRcUi = false;
        }

        if (!useRcUi) {
          setPaywallNeedsRetry(false);
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }

        setPaywallNeedsRetry(false);
        const outcome = await runIosPaywallFlowAfterSignup({ userId: uid, navigate });
        if (outcome === "success") {
          return;
        }
        if (outcome === "skipped") {
          navigate("/onboarding/ios-paywall", { replace: true });
          return;
        }
        setPaywallNeedsRetry(true);
        return;
      }

      await ensureSession();
      await writeSetupDraft({
        firstName: firstNameTrimmed,
        email: normalizedEmail,
        emailMarketingConsent,
        subliminalFastFlow: true,
      });

      let onboardingMixedStoragePath: string | null = null;
      if (uid) {
        try {
          const rawVocal = localStorage.getItem(SUBLIMINAL_ONBOARDING_VOCAL_KEY);
          const storedVocal = rawVocal ? JSON.parse(rawVocal) : null;
          if (storedVocal && typeof storedVocal.dataUrl === "string" && storedVocal.dataUrl.startsWith("data:")) {
            const vocalResponse = await fetch(storedVocal.dataUrl);
            const vocalBlob = await vocalResponse.blob();
            if (vocalBlob.size === 0) {
              throw new Error("Your recording is empty. Please go back and record again.");
            }

            const binauralBeat = (draftSnapshot.subliminalBinauralBeat?.trim() || "theta") as
              | "none"
              | "delta"
              | "theta"
              | "alpha"
              | "beta"
              | "gamma";
            const backgroundSound = draftSnapshot.subliminalBackgroundSound?.trim() || "Rain v2.WAV";
            const layers =
              typeof draftSnapshot.subliminalLayers === "number" && draftSnapshot.subliminalLayers > 0
                ? draftSnapshot.subliminalLayers
                : 3;
            const durationMinutes =
              typeof draftSnapshot.subliminalTrackMinutes === "number" && draftSnapshot.subliminalTrackMinutes > 0
                ? draftSnapshot.subliminalTrackMinutes
                : 5;

            const { AudioProcessor } = await import("@/lib/audioProcessor");
            const processor = new AudioProcessor();
            let mixedBlob: Blob;
            try {
              mixedBlob = await processor.generateSubliminalTrack({
                affirmationBlob: vocalBlob,
                binauralType: binauralBeat,
                binauralVolume: 0.07,
                backgroundSound,
                affirmationVolume: 0.04,
                backgroundVolume: 1,
                layers,
                duration: durationMinutes,
              });
            } finally {
              processor.dispose();
            }

            if (mixedBlob.size === 0) {
              throw new Error("Could not create your subliminal. Please try again.");
            }

            onboardingMixedStoragePath = `${uid}/onboarding-mixed-${Date.now()}.mp3`;
            const { error: uploadErr } = await supabase.storage
              .from("subliminal-tracks")
              .upload(onboardingMixedStoragePath, mixedBlob, { contentType: "audio/mpeg", upsert: false });
            if (uploadErr) {
              throw new Error("Could not save your subliminal. Please try again.");
            }
          }
        } catch (e) {
          if (e instanceof Error) throw e;
          throw new Error("Could not save your subliminal. Please try again.");
        }

        const handoffDraft = {
          subliminalFastFlow: true,
          manifestTopic: draftSnapshot.manifestTopic ?? null,
          desireCategory: draftSnapshot.desireCategory ?? null,
          currentFriction: draftSnapshot.currentFriction ?? "",
          desiredIdentity: draftSnapshot.desiredIdentity ?? null,
          starterAffirmations: draftSnapshot.starterAffirmations ?? [],
          starterAffirmationCategory: draftSnapshot.starterAffirmationCategory ?? null,
          subliminalVocalMode: draftSnapshot.subliminalVocalMode ?? null,
          subliminalBinauralBeat: draftSnapshot.subliminalBinauralBeat ?? null,
          subliminalBackgroundSound: draftSnapshot.subliminalBackgroundSound ?? null,
          subliminalLayers: draftSnapshot.subliminalLayers ?? null,
          subliminalTrackMinutes: draftSnapshot.subliminalTrackMinutes ?? null,
          toolPreferences: draftSnapshot.toolPreferences ?? [],
          embodyDailyPractices: draftSnapshot.embodyDailyPractices ?? [],
        };

        await updateSession({
          ...sessionPatch,
          onboarding_answers: {
            subliminal_fast_path_v1: {
              schema_version: 1,
              saved_at: new Date().toISOString(),
              ...handoffDraft,
              onboardingMixedStoragePath,
              handoffPending: true,
              handoffProcessedAt: null,
            },
          },
        });

        const { error: enqueueErr } = await (supabase as any).rpc("enqueue_subliminal_handoff_if_ready", {
          p_user_id: uid,
        });
        if (enqueueErr && import.meta.env.DEV) {
          console.warn("[SubliminalEmail] enqueue handoff:", enqueueErr.message);
        }
      }

      trackMarketingConversion("web_onboarding_signup_complete", {
        source: "subliminal_setup_email",
        target_path: SUBLIMINAL_GET_THE_APP_PATH,
      });
      navigate(SUBLIMINAL_GET_THE_APP_PATH, { replace: true });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Something went wrong. Try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const footerContinue = paywallNeedsRetry ? handleRetryPaywall : handleContinue;
  const footerCanContinue = paywallNeedsRetry ? !isRetryingPaywall : formValid && !isSubmitting;
  const footerContinueText = paywallNeedsRetry
    ? "Try again"
    : isSubmitting
      ? "Creating your subliminal..."
      : "Continue";
  return (
    <OnboardingLayout
      currentPage={3}
      nativeFormPage
      setupCosmicPage
      onContinue={footerContinue}
      canContinue={footerCanContinue}
      continueText={footerContinueText}
      hideProgress
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-6 text-white">
        <SetupHeadingBlock
          centered
          title="Save your subliminal"
          subtitle="Create your account to keep your track and finish setup. Everything is tied to this email."
          titleClassName="sv-subliminal-headline !text-white"
          subtitleClassName="!text-white/55 [&_p+p]:mt-1"
        />

        <div className="grid w-full grid-cols-2 gap-3 text-left">
          <div className="min-w-0 space-y-2">
            <Label htmlFor="subliminal-setup-firstName" className={SETUP_LABEL_CLASS}>
              First name
            </Label>
            <Input
              id="subliminal-setup-firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder="Your first name"
              autoComplete="given-name"
              className={SETUP_FIELD_CLASS}
            />
          </div>

          <div className="min-w-0 space-y-2">
            <Label htmlFor="subliminal-setup-email" className={`${SETUP_LABEL_CLASS} !text-white/70`}>
              Email
            </Label>
            <Input
              id="subliminal-setup-email"
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              inputMode="email"
              className={`${SETUP_FIELD_CLASS} !bg-white/95 !text-zinc-900 placeholder:!text-zinc-400 [color-scheme:light] ${emailError ? "border-destructive" : ""}`}
              style={{
                color: "#18181b",
                WebkitTextFillColor: "#18181b",
                backgroundColor: "rgba(255, 255, 255, 0.95)",
              }}
            />
            {isCheckingEmail ? <p className={SETUP_MUTED_TEXT_CLASS}>Checking availabilityâ€¦</p> : null}
            {emailError ? <p className="text-xs text-destructive">{emailError}</p> : null}
          </div>
        </div>

        <div className="w-full space-y-2 text-left">
          <Label htmlFor="subliminal-setup-password" className={SETUP_LABEL_CLASS}>
            Password
          </Label>
          <div className="relative">
            <Input
              id="subliminal-setup-password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="8+ characters"
              autoComplete="new-password"
              className={`${SETUP_FIELD_CLASS} pr-11 ${passwordError ? "border-destructive" : ""}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-0 top-0 h-12 w-11 rounded-2xl text-zinc-500 hover:text-zinc-800"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? "Hide password" : "Show password"}
              aria-pressed={showPassword}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" aria-hidden />
              ) : (
                <Eye className="h-4 w-4" aria-hidden />
              )}
            </Button>
          </div>
          {passwordError ? <p className="text-xs text-destructive pt-1">{passwordError}</p> : null}
        </div>

        <div className="w-full space-y-4 text-left">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id="subliminal-setup-terms"
              checked={acceptedTerms}
              onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label htmlFor="subliminal-setup-terms" className="text-xs text-white/55 leading-tight cursor-pointer">
              I accept the{" "}
              <button
                type="button"
                onClick={() => navigate("/terms")}
                className="font-medium text-white/90 hover:underline"
              >
                Terms of Service
              </button>{" "}
              and{" "}
              <button
                type="button"
                onClick={() => navigate("/privacy")}
                className="font-medium text-white/90 hover:underline"
              >
                Privacy Policy
              </button>
              .
            </Label>
          </div>

          <div className="flex items-start gap-2.5">
            <Checkbox
              id="subliminal-setup-email-marketing"
              checked={emailMarketingConsent}
              onCheckedChange={(checked) => setEmailMarketingConsent(checked === true)}
              className="mt-[3px] shrink-0 border-white/30 data-[state=checked]:border-white data-[state=checked]:bg-white data-[state=checked]:text-zinc-900"
            />
            <Label
              htmlFor="subliminal-setup-email-marketing"
              className="text-xs text-white/55 leading-snug cursor-pointer"
            >
              Send me manifestation tips and updates. By checking this box, you consent to marketing communications.
              You can opt out anytime.
            </Label>
          </div>
        </div>
      </div>
    </OnboardingLayout>
  );
}

```

### src/pages/onboarding/subliminal/SubliminalGetTheApp.tsx

```tsx
import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { useAuth } from "@/contexts/AuthContext";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { MarketingStoreBadges } from "@/components/marketing/MarketingStoreBadges";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { getMobileStoreHref } from "@/lib/mobileStoreHandoff";
import { preloadStoreBadgeImagesOnce } from "@/lib/appStore";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { SETUP_MUTED_TEXT_CLASS } from "@/lib/onboardingSetupTheme";
import { cn } from "@/lib/utils";

export const SUBLIMINAL_GET_THE_APP_PATH = "/onboarding/subliminal/get-the-app";

const STEPS = [
  "Download Palette Plotting from the App Store.",
  "Open the app and sign in with the same email you just used.",
  "Finish your subscription in the app â€” your subliminal will appear in your track library automatically.",
] as const;

export default function SubliminalGetTheApp() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const inAppBrowser = useMemo(() => detectInAppBrowser(), []);
  const signInEmail = user?.email?.trim() ?? "";

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      navigate("/dashboard", { replace: true });
      return;
    }
    preloadStoreBadgeImagesOnce();
    trackMarketingConversion("web_onboarding_signup_complete", {
      source: "subliminal_get_the_app",
      target_path: SUBLIMINAL_GET_THE_APP_PATH,
    });
  }, [navigate]);

  useEffect(() => {
    if (isLoading) return;
    if (!user?.id) {
      navigate("/login", { replace: true, state: { from: SUBLIMINAL_GET_THE_APP_PATH } });
    }
  }, [isLoading, navigate, user?.id]);

  if (isLoading || !user?.id) {
    return <div className="min-h-screen bg-background" />;
  }

  return (
    <OnboardingLayout
      currentPage={4}
      nativeFormPage
      setupCosmicPage
      hideProgress
      onContinue={() => {}}
      continueText=""
      canContinue={false}
    >
      <div className="relative z-[1] mx-auto w-full max-w-md space-y-8 text-white">
        <SetupHeadingBlock
          centered
          title="Your account is ready"
          subtitle="Get the app to finish setup, unlock your subliminal, and start your path."
          titleClassName="sv-subliminal-headline !text-white"
          subtitleClassName="!text-white/55 [&_p+p]:mt-1"
        />

        <div className="flex justify-center">
          <MarketingStoreBadges
            size="lg"
            layout="inline"
            getStoreHref={(store) => getMobileStoreHref(store, inAppBrowser)}
            onStoreClick={(store) => {
              trackMarketingConversion("cta_app_store_click", {
                source: "subliminal_get_the_app",
                store,
              });
            }}
          />
        </div>

        <ol className="space-y-4 text-left">
          {STEPS.map((step, index) => (
            <li key={step} className="flex gap-3">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full",
                  "border border-white/20 bg-white/10 text-xs font-semibold text-white",
                )}
                aria-hidden
              >
                {index + 1}
              </span>
              <p className={cn("pt-0.5 text-sm leading-relaxed", SETUP_MUTED_TEXT_CLASS, "!text-white/75")}>
                {index === 1 && signInEmail ? (
                  <>
                    Open the app and sign in with{" "}
                    <span className="font-medium text-white/95">{signInEmail}</span>.
                  </>
                ) : (
                  step
                )}
              </p>
            </li>
          ))}
        </ol>

        <p className={cn("text-center text-xs leading-relaxed", SETUP_MUTED_TEXT_CLASS, "!text-white/55")}>
          You can close this page after signup. Once your subscription is active, we build your subliminal in the
          background and add it to your account â€” no need to keep this tab open.
        </p>
      </div>
    </OnboardingLayout>
  );
}

```

### src/pages/onboarding/subliminal/SubliminalPathLoading.tsx

```tsx
import { SetupPage } from "@/components/onboarding/SetupPage";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import {
  SETUP_GLASS_PANEL_CLASS,
  SETUP_PROGRESS_FILL_CLASS,
  SETUP_PROGRESS_TRACK_CLASS,
  SETUP_TESTIMONIAL_STAR_CLASS,
} from "@/lib/onboardingSetupTheme";

const SUBLIMINAL_PATH_READY_PATH = "/onboarding/subliminal/setup/path-ready";

type Testimonial = { readonly quote: string; readonly author: string };

const TESTIMONIALS_ROW_1: readonly Testimonial[] = [
  { quote: "This finally made my new story feel normal.", author: "Jordan M." },
  { quote: "I stopped checking the 3D and stayed consistentâ€”finally.", author: "Riley T." },
  { quote: "The tool path was exactly what I needed.", author: "Casey L." },
  { quote: "The affirmations actually sounded like me, not generic fluff.", author: "Morgan P." },
] as const;

const TESTIMONIALS_ROW_2: readonly Testimonial[] = [
  { quote: "My self-concept shifted fast once I had structure.", author: "Dev S." },
  { quote: "Having one place for mirror work and subliminals kept me honest.", author: "Avery K." },
  { quote: "Small daily wins added up quicker than I expected.", author: "Quinn R." },
  { quote: "I actually finish sessions now instead of doom-scrolling.", author: "Jamie H." },
] as const;

function TestimonialMarqueeRow({
  cards,
  animationClass,
}: {
  cards: readonly Testimonial[];
  animationClass: string;
}) {
  return (
    <div
      className="relative z-[1] -mx-1 w-[calc(100%+0.5rem)] overflow-hidden py-1 sm:mx-0 sm:w-full"
      style={{
        maskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <div
        className={cn(
          "flex w-max flex-nowrap gap-2.5 motion-reduce:!animate-none pointer-events-none",
          animationClass,
        )}
        aria-hidden
      >
        {[0, 1].map((dup) =>
          cards.map((card, i) => (
            <figure
              key={`${dup}-${i}-${card.author}`}
              className={cn(SETUP_GLASS_PANEL_CLASS, "w-[min(260px,72vw)] shrink-0 px-3 py-3")}
            >
              <div className="mb-1.5 flex gap-0.5" aria-hidden>
                {Array.from({ length: 5 }).map((_, j) => (
                  <Star key={j} className={SETUP_TESTIMONIAL_STAR_CLASS} />
                ))}
              </div>
              <blockquote className="font-sans text-sm font-medium leading-snug text-white/90">
                &ldquo;{card.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-2 font-sans text-xs text-white/50">{card.author}</figcaption>
            </figure>
          )),
        )}
      </div>
    </div>
  );
}

export default function SubliminalPathLoading() {
  const navigate = useNavigate();
  const [pct, setPct] = useState(0);

  useEffect(() => {
    const id = window.setInterval(() => {
      setPct((p) => Math.min(100, p + Math.floor(Math.random() * 7 + 3)));
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    if (pct >= 100) {
      const tid = window.setTimeout(() => navigate(SUBLIMINAL_PATH_READY_PATH), 450);
      return () => window.clearTimeout(tid);
    }
  }, [pct, navigate]);

  return (
    <SetupPage canContinue={false} continueText="Loading" disableNativeScrollViewport onContinue={undefined}>
      <div className="relative z-[1] flex min-h-0 flex-1 flex-col gap-2">
        <SetupHeadingBlock
          centered
          className="shrink-0 mb-1"
          title="Building your subliminalâ€¦"
          subtitle="Layering your vocals, background, and binaural beat."
          titleClassName="sv-subliminal-headline"
        />

        <div className="relative z-[1] flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 space-y-6 pt-1">
            <div className={SETUP_PROGRESS_TRACK_CLASS}>
              <div className={SETUP_PROGRESS_FILL_CLASS} style={{ width: `${pct}%` }} />
            </div>
          </div>

          <div className="relative z-[1] flex min-h-0 flex-1 flex-col justify-center gap-4 pt-4 pb-1">
            <p className="px-2 text-center font-sans text-sm text-white/55">
              You&apos;re not starting from zeroâ€”your first track is taking shape.
            </p>
            <TestimonialMarqueeRow cards={TESTIMONIALS_ROW_1} animationClass="animate-palette-plotting-testimonials-marquee" />
            <TestimonialMarqueeRow
              cards={TESTIMONIALS_ROW_2}
              animationClass="animate-palette-plotting-testimonials-marquee-slow"
            />
          </div>
        </div>
      </div>
    </SetupPage>
  );
}

```

### src/pages/onboarding/subliminal/SubliminalName.tsx

```tsx
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { SetupPage } from "@/components/onboarding/SetupPage";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { SetupHeadingBlock } from "@/components/onboarding/SetupHeadingBlock";
import { SETUP_FIELD_CLASS, SETUP_LABEL_CLASS } from "@/lib/onboardingSetupTheme";
import { useOnboardingSession } from "@/hooks/useOnboardingSession";

const SUBLIMINAL_PATH_LOADING = "/onboarding/subliminal/setup/plot-loading";
const SUBLIMINAL_EMAIL_PATH = "/onboarding/subliminal/setup/email";

export default function SubliminalName() {
  const navigate = useNavigate();
  const { ensureSession } = useOnboardingSession();
  const initial = useMemo(() => readSetupDraft().firstName ?? "", []);
  const [firstName, setFirstName] = useState(initial);
  const [isSaving, setIsSaving] = useState(false);

  const canContinue = firstName.trim().length > 0 && !isSaving;

  return (
    <SetupPage
      canContinue={canContinue}
      onBack={() => navigate(SUBLIMINAL_PATH_LOADING)}
      onContinue={async () => {
        const trimmed = firstName.trim();
        if (!trimmed || isSaving) return;
        setIsSaving(true);
        try {
          await ensureSession();
          await writeSetupDraft({ firstName: trimmed }, { awaitBackendSync: true });
          navigate(SUBLIMINAL_EMAIL_PATH);
        } catch (e) {
          console.warn("[SubliminalName] failed to save first_name:", e);
          toast.error("Could not save your name. Check your connection and try again.");
        } finally {
          setIsSaving(false);
        }
      }}
    >
      <SetupHeadingBlock
        centered
        title="What should we call you?"
        subtitle="Your first name is used for your account and in the app."
        titleClassName="sv-subliminal-headline"
      />

      <div className="space-y-2 pt-6">
        <Label htmlFor="subliminal-firstName" className={SETUP_LABEL_CLASS}>
          First name
        </Label>
        <Input
          id="subliminal-firstName"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder="Your first name"
          autoComplete="given-name"
          className={SETUP_FIELD_CLASS}
        />
      </div>
    </SetupPage>
  );
}

```

### src/pages/onboarding/SubliminalWelcomePre.tsx

```tsx
import { Fragment, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Star } from "lucide-react";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import { WELCOME_ACCENT } from "@/components/onboarding/WelcomeCosmicBackground";
import { SETUP_NATIVE_CONTINUE_BTN_CLASS } from "@/lib/onboardingSetupTheme";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { cn } from "@/lib/utils";
import "@/styles/welcome-web-effects.css";

const WELCOME_LOGO = "/welcome-logo.png";
const WELCOME_EYEBROW = "subliminals Â· LOA Â· SP Â· scripting Â· self-concept";
const WELCOME_CONTINUE_TEXT = "Continue";
const WELCOME_PRIMARY_CTA_CLASS = cn("w-full", SETUP_NATIVE_CONTINUE_BTN_CLASS, "flex-none");

const WELCOME_TOOL_ROWS: readonly (readonly string[])[] = [
  ["Subliminal Maker", "Robotic Affirming", "Scripting"],
  ["Mirror Work", "Belief Work", "Inspired Action"],
  ["Manifestation Lists", "AI Manifesting Guide"],
];

const WELCOME_TOOL_TEXT_CLASS = cn(
  "font-welcome-serif text-[13px] font-normal leading-[1.45] text-[#e8b8cc]",
);

const WELCOME_TOOL_BULLET_CLASS = cn(
  "px-1.5 font-welcome-serif text-[13px] text-[#e8b8cc]/65",
);

const AWARD_STAR_CLASS = "h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]";

const STAR_PAREN_OFFSETS = {
  left: ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"],
  right: ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"],
} as const;

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets = STAR_PAREN_OFFSETS[side];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center gap-[6px] py-1",
        side === "left" ? "items-end" : "items-start",
      )}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeLogo() {
  return (
    <div className="mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center">
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={120}
        height={120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeEyebrow() {
  return (
    <p className="text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
      {WELCOME_EYEBROW}
    </p>
  );
}

function WelcomeTitleNative() {
  return (
    <h1 className="font-welcome-serif mt-0 max-w-[19rem] text-center text-[28px] font-normal leading-[1.14] tracking-[-0.02em] text-white md:mt-3 sm:text-[31px]">
      Your manifesting methods,{" "}
      <span style={{ color: WELCOME_ACCENT }}>in one place</span>
    </h1>
  );
}

function WelcomeDescriptionNative() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
  );
}

function WelcomeAwardLineNative() {
  return (
    <div
      className="relative z-10 flex w-full items-center justify-center gap-3 px-1"
      aria-label="One of the most comprehensive manifesting apps"
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-white">
        <span className="block">One of the most</span>
        <span className="block">comprehensive</span>
        <span className="block">manifesting apps</span>
      </p>
      <StarParen side="right" />
    </div>
  );
}

function WelcomeFeatureGrid() {
  return (
    <div className="relative z-10 flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2.5 text-center">
        {WELCOME_TOOL_ROWS.map((row) => (
          <p key={row[0]} className={WELCOME_TOOL_TEXT_CLASS}>
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <span className={WELCOME_TOOL_BULLET_CLASS} aria-hidden>
                    Â·
                  </span>
                ) : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

export default function SubliminalWelcomePre() {
  const navigate = useNavigate();

  const handleContinue = () => {
    trackMarketingConversion("web_onboarding_click", {
      source: "subliminal_welcome_pre",
      button_label: WELCOME_CONTINUE_TEXT,
      target_path: "/onboarding/subliminal/welcome",
      is_subliminal_traffic: true,
    });
    navigate("/onboarding/subliminal/welcome");
  };

  useEffect(() => {
    const fontId = "sv-welcome-proxima-nova";
    if (document.getElementById(fontId)) return;
    const fontLink = document.createElement("link");
    fontLink.id = fontId;
    fontLink.rel = "stylesheet";
    fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
    document.head.appendChild(fontLink);
  }, []);

  return (
    <OnboardingLayout
      currentPage={1}
      welcomePage
      stackedNativeButtons
      stackedNativePrimaryButtonClassName={WELCOME_PRIMARY_CTA_CLASS}
      welcomeSoloContinueButtonClassName={WELCOME_PRIMARY_CTA_CLASS}
      welcomeSignInAsTextLink
      onContinue={handleContinue}
      canContinue={true}
      continueText={WELCOME_CONTINUE_TEXT}
      contentMaxWidthClass="max-w-[22rem]"
      reserveProgressSpace
    >
      <div className="relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5 pt-[calc(env(safe-area-inset-top,0px)+1.25rem)]">
        <WelcomeLogo />
        <WelcomeEyebrow />
        <WelcomeTitleNative />
        <WelcomeDescriptionNative />
        <WelcomeAwardLineNative />
        <WelcomeFeatureGrid />
      </div>
    </OnboardingLayout>
  );
}

```

### src/lib/onboardingFlow.ts

```typescript
/** Native + default path list (full suite funnel). */
export const ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/name",
  "/onboarding/setup/desire-category",
  "/onboarding/setup/conditional-specificity",
  "/onboarding/setup/current-friction",
  "/onboarding/setup/affirmations",
  "/onboarding/setup/embody-daily",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/guide",
  "/onboarding/setup/manifestation-intensity",
  "/onboarding/setup/notifications",
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/email",
] as const;

/** Preserved suite web funnel for comprehensive-app ad work (`/onboarding/suite/...`). */
export const SUITE_WEB_ONBOARDING_ROUTES = [
  "/onboarding/suite/welcome",
  "/onboarding/suite/setup/name",
  "/onboarding/suite/setup/desire-category",
  "/onboarding/suite/setup/conditional-specificity",
  "/onboarding/suite/setup/current-friction",
  "/onboarding/suite/setup/affirmations",
  "/onboarding/suite/setup/embody-daily",
  "/onboarding/suite/setup/begin-journey",
  "/onboarding/suite/setup/guide",
  "/onboarding/suite/setup/manifestation-intensity",
  "/onboarding/suite/setup/notifications",
  "/onboarding/suite/setup/tool-preference",
  "/onboarding/suite/setup/plot-loading",
  "/onboarding/suite/setup/plot-synthesis",
  "/onboarding/suite/setup/email",
] as const;

/** Web default: subliminal-fast funnel (shorter path, name before account). */
export const WEB_FAST_ONBOARDING_ROUTES = [
  "/onboarding/welcome",
  "/onboarding/setup/desire-category",
  "/onboarding/setup/conditional-specificity",
  "/onboarding/setup/tool-preference",
  "/onboarding/setup/begin-journey",
  "/onboarding/setup/manifestation-intensity",
  "/onboarding/setup/plot-loading",
  "/onboarding/setup/plot-synthesis",
  "/onboarding/setup/name",
  "/onboarding/setup/email",
] as const;

/** Setup steps only (after Welcome, before pricing): used for top progress bar. */
export const ONBOARDING_SETUP_PROGRESS_ROUTES = ONBOARDING_ROUTES.slice(1, -1);

export const SUITE_WEB_SETUP_PROGRESS_ROUTES = SUITE_WEB_ONBOARDING_ROUTES.slice(1, -1);

export const WEB_FAST_SETUP_PROGRESS_ROUTES = WEB_FAST_ONBOARDING_ROUTES.slice(1, -1);

/** Web subliminal builder funnel â€” welcome â†’ build â†’ account (dedicated routes only). */
export const SUBLIMINAL_BUILDER_ONBOARDING_ROUTES = [
  "/onboarding/subliminal/welcomepre",
  "/onboarding/subliminal/welcome",
  "/onboarding/subliminal/setup/plot-loading",
  "/onboarding/subliminal/setup/path-ready",
  "/onboarding/subliminal/setup/email",
  "/onboarding/subliminal/get-the-app",
] as const;

export const SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES = [
  "/onboarding/subliminal/welcome#manifest",
  "/onboarding/subliminal/welcome#vocals",
  "/onboarding/subliminal/welcome#finetune",
  "/onboarding/subliminal/setup/plot-loading",
  "/onboarding/subliminal/setup/path-ready",
  "/onboarding/subliminal/setup/email",
] as const;

export const ONBOARDING_STEP_LABELS = [
  "Welcome",
  "Your Name",
  "Manifesting",
  "Specifics",
  "Friction",
  "Affirmations",
  "Daily embody",
  "Your journey",
  "Guide",
  "Routine",
  "Permissions",
  "Tools",
  "Building Path",
  "Your Path",
  "Account",
] as const;

export const ONBOARDING_STEP_COUNT = ONBOARDING_ROUTES.length;

```

### src/App.tsx (subliminal route imports + routes excerpt)

```tsx
const WelcomeSubliminal = lazy(() => import("./pages/onboarding/WelcomeSubliminal"));
const SubliminalWelcomePre = lazy(() => import("./pages/onboarding/SubliminalWelcomePre"));
const SubliminalPathLoading = lazy(() => import("./pages/onboarding/subliminal/SubliminalPathLoading"));
const SubliminalPathReady = lazy(() => import("./pages/onboarding/setup/PathReadyDuplicate"));
const SubliminalName = lazy(() => import("./pages/onboarding/subliminal/SubliminalName"));
const SubliminalEmail = lazy(() => import("./pages/onboarding/subliminal/SubliminalEmail"));
const SubliminalGetTheApp = lazy(() => import("./pages/onboarding/subliminal/SubliminalGetTheApp"));

{/* Subliminal builder web funnel */}
<Route path="/onboarding/subliminal/welcomepre" element={<Suspense fallback={null}><SubliminalWelcomePre /></Suspense>} />
<Route path="/onboarding/subliminal/welcome" element={<Suspense fallback={null}><WelcomeSubliminal /></Suspense>} />
<Route path="/onboarding/subliminal/setup/plot-loading" element={<Suspense fallback={null}><SubliminalPathLoading /></Suspense>} />
<Route path="/onboarding/subliminal/setup/path-ready" element={<Suspense fallback={null}><SubliminalPathReady /></Suspense>} />
<Route path="/onboarding/subliminal/setup/name" element={<Suspense fallback={null}><SubliminalName /></Suspense>} />
<Route path="/onboarding/subliminal/setup/email" element={<Suspense fallback={null}><SubliminalEmail /></Suspense>} />
<Route path="/onboarding/subliminal/get-the-app" element={<Suspense fallback={null}><SubliminalGetTheApp /></Suspense>} />
```

### src/pages/onboarding/WelcomeSubliminal.tsx (vocal save + continue excerpt)

Large file (~1400 lines). Full builder UI. Critical handoff section:

```tsx
const SUBLIMINAL_ONBOARDING_VOCAL_KEY = "sv_subliminal_onboarding_vocal_blob_v1";

// In saveDraftAndContinue():
if (audioBlob) {
  const reader = new FileReader();
  const dataUrl = await new Promise<string>((resolve, reject) => {
    reader.onerror = () => reject(reader.error);
    reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
    reader.readAsDataURL(audioBlob);
  });
  if (dataUrl) {
    localStorage.setItem(
      SUBLIMINAL_ONBOARDING_VOCAL_KEY,
      JSON.stringify({
        type: audioBlob.type || "audio/mpeg",
        dataUrl,
        mode: vocalMode,
        savedAt: Date.now(),
      }),
    );
  }
}
await writeSetupDraft({ subliminalFastFlow: true, /* affirmations, binaural, background, layers, minutes */ });
navigate(SUBLIMINAL_PATH_LOADING); // → path-ready → email
```

Web only: logged-in users are NOT redirected to dashboard (native still redirects).

### supabase/config.toml (function entry)

```toml
[functions.process-user-plan-subliminal-handoff]
verify_jwt = false
```

### .env.example (secrets comment)

```
# Web subliminal handoff mix (cron: process-user-plan-subliminal-handoff):
# SUBLIMINAL_HANDOFF_WORKER_ENABLED=true
# Deploy: supabase functions deploy process-user-plan-subliminal-handoff
# Migrations: 052 + 053
```

### src/lib/audioProcessor.ts

```typescript
import { supabase } from "@/integrations/supabase/client";
import { createMp3Encoder } from "wasm-media-encoders";
import { Capacitor } from "@capacitor/core";

// Type definitions for binaural frequencies (structure only, values come from edge function)
export type BinauralType = 'none' | 'delta' | 'theta' | 'alpha' | 'beta' | 'gamma';

export interface SubliminalSettings {
  affirmationBlob: Blob;
  binauralType: BinauralType;
  /** 0â€“1; scales proprietary binaural gain. Ignored when binauralType is none. */
  binauralVolume: number;
  backgroundSound: string;
  backgroundSoundUrl?: string; // Optional URL for user-created tracks
  affirmationVolume: number;
  backgroundVolume: number;
  layers: number;
  duration: number; // in seconds
  /** 0â€“100 during offline mix + MP3 encode (post-paywall progress UI). */
  onMixProgress?: (percent: number) => void;
}

// Subliminal audio mixing parameters (fetched from edge function)
interface SubliminalParams {
  binauralFrequencies: {
    delta: { base: number; offset: number };
    theta: { base: number; offset: number };
    alpha: { base: number; offset: number };
    beta: { base: number; offset: number };
    gamma: { base: number; offset: number };
  };
  binauralAmplitude: number;
  binauralGain: number;
  affirmationGainMultiplier: number;
  layerDelaySeconds: number;
  layerAttenuation: number;
  targetSampleRate: number;
  audioDetectionThreshold: number;
}

export class AudioProcessor {
  private audioContext: AudioContext;
  private masterGain: GainNode;
  private subliminalParams: SubliminalParams | null = null;
  private paramsFetchPromise: Promise<SubliminalParams> | null = null;

  constructor() {
    this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();
    this.masterGain.connect(this.audioContext.destination);
  }

  // Fetch proprietary mixing parameters from edge function
  private async getSubliminalParams(): Promise<SubliminalParams> {
    // Return cached params if available
    if (this.subliminalParams) {
      return this.subliminalParams;
    }

    // Return existing fetch promise if in progress
    if (this.paramsFetchPromise) {
      return this.paramsFetchPromise;
    }

    // Fetch params from edge function
    this.paramsFetchPromise = (async () => {
      try {
        const { data, error } = await supabase.functions.invoke("get-subliminal-params");

        if (error) {
          console.error("Error fetching subliminal params:", error);
          // Fallback to default values if fetch fails
          return this.getDefaultParams();
        }

        if (data?.params) {
          this.subliminalParams = data.params;
          return data.params;
        }

        return this.getDefaultParams();
      } catch (err) {
        console.error("Error fetching subliminal params:", err);
        return this.getDefaultParams();
      }
    })();

    return this.paramsFetchPromise;
  }

  // Default fallback parameters (used if edge function fails)
  private getDefaultParams(): SubliminalParams {
    return {
      binauralFrequencies: {
        delta: { base: 200, offset: 2 },
        theta: { base: 200, offset: 6 },
        alpha: { base: 250, offset: 10 },
        beta: { base: 300, offset: 20 },
        gamma: { base: 400, offset: 40 },
      },
      binauralAmplitude: 0.3,
      binauralGain: 0.33,
      affirmationGainMultiplier: 0.25,
      layerDelaySeconds: 0.5,
      layerAttenuation: 0.05,
      targetSampleRate: 22050,
      audioDetectionThreshold: 0.001,
    };
  }

  // Generate binaural beat tones
  private async createBinauralBeat(
    ctx: BaseAudioContext,
    type: Exclude<BinauralType, "none">,
    duration: number,
    sampleRate: number
  ): Promise<AudioBuffer> {
    const params = await this.getSubliminalParams();
    const { base, offset } = params.binauralFrequencies[type];
    const amplitude = params.binauralAmplitude;
    
    const length = sampleRate * duration;
    const buffer = ctx.createBuffer(2, length, sampleRate);

    const leftChannel = buffer.getChannelData(0);
    const rightChannel = buffer.getChannelData(1);

    // Left ear frequency (proprietary amplitude)
    for (let i = 0; i < length; i++) {
      leftChannel[i] = Math.sin(2 * Math.PI * base * (i / sampleRate)) * amplitude;
    }

    // Right ear frequency (offset creates the binaural beat) - proprietary amplitude
    for (let i = 0; i < length; i++) {
      rightChannel[i] = Math.sin(2 * Math.PI * (base + offset) * (i / sampleRate)) * amplitude;
    }

    return buffer;
  }

  // Load audio file as AudioBuffer
  private async loadAudioBuffer(source: Blob | string, ctx: BaseAudioContext): Promise<AudioBuffer> {
    let arrayBuffer: ArrayBuffer;
    let blobType: string | undefined;

    if (source instanceof Blob) {
      if (source.size === 0) {
        throw new Error("Affirmation blob is empty (0 bytes)");
      }
      blobType = source.type;
      console.log("Loading blob, size:", source.size, "type:", blobType);
      arrayBuffer = await source.arrayBuffer();
      if (arrayBuffer.byteLength === 0) {
        throw new Error("Affirmation blob arrayBuffer is empty");
      }
    } else {
      const response = await fetch(source);
      if (!response.ok) {
        throw new Error(`Failed to fetch audio: ${response.status} ${response.statusText}`);
      }
      blobType = response.headers.get('content-type') || undefined;
      arrayBuffer = await response.arrayBuffer();
    }

    try {
      // Try to decode with the original arrayBuffer
      const buffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
      console.log("Audio buffer decoded successfully:", {
        sampleRate: buffer.sampleRate,
        length: buffer.length,
        duration: buffer.length / buffer.sampleRate,
        channels: buffer.numberOfChannels
      });
      return buffer;
    } catch (error) {
      console.error("Failed to decode audio data:", error);
      console.error("Blob type:", blobType, "ArrayBuffer size:", arrayBuffer.byteLength);
      
      // Provide more helpful error message
      if (blobType && !blobType.startsWith('audio/')) {
        throw new Error(`Invalid audio format. The recording format (${blobType}) may not be supported. Please try recording again. If the issue persists, try using a different browser.`);
      }
      
      if (arrayBuffer.byteLength < 100) {
        throw new Error("Audio file appears to be corrupted or too small. Please record again.");
      }
      
      throw new Error(`Failed to decode audio: ${error instanceof Error ? error.message : String(error)}. The audio format may not be supported. Please try recording again.`);
    }
  }

  // Get or generate background sound
  private async getBackgroundSound(type: string, duration: number, sampleRate: number, ctx: BaseAudioContext): Promise<AudioBuffer> {
    // Check if this is a user track (prefixed with "user:")
    if (type.startsWith("user:")) {
      const trackId = type.replace("user:", "");
      // Load track URL from database - we'll need to pass this or fetch it
      // For now, we'll expect the full URL to be passed or fetch it
      // This will be handled by the caller providing the URL
      throw new Error("User tracks should be loaded with their full URL");
    }

    // type may be a full filename (with extension) or a base name (default .wav)
    const filename = type.includes(".") ? type : `${type}.wav`;
    // Native: fetch from sounds host (files at root). Default to Cloudflare sounds project so we get real WAV, not SPA HTML from main site.
    const soundsBase =
      typeof window !== "undefined" && Capacitor.isNativePlatform()
        ? (import.meta.env.VITE_SOUNDS_ORIGIN as string | undefined) ||
          (import.meta.env.VITE_PUBLIC_ORIGIN as string | undefined) ||
          "https://sounds-1og.pages.dev"
        : typeof window !== "undefined"
          ? window.location.origin
          : "";
    // Native: sounds project has files at root. Web: main site has /sounds/ subpath.
    const useSoundsSubpath = typeof window !== "undefined" && !Capacitor.isNativePlatform();
    const url = useSoundsSubpath
      ? `${soundsBase}/sounds/${encodeURIComponent(filename)}`
      : `${soundsBase.replace(/\/$/, "")}/${encodeURIComponent(filename)}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Background sound "${filename}" could not be loaded (${response.status}). Make sure files exist in public/sounds/.`);
    }
    const arrayBuffer = await response.arrayBuffer();
    const baseBuffer = await ctx.decodeAudioData(arrayBuffer.slice(0));
    return this.loopBuffer(baseBuffer, duration, sampleRate);
  }

  // Loop a short buffer to match target duration with crossfade at seams
  private loopBuffer(sourceBuffer: AudioBuffer, targetDuration: number, targetSampleRate: number): AudioBuffer {
    const ratio = sourceBuffer.sampleRate / targetSampleRate;
    const resampledLen = Math.floor(sourceBuffer.length / ratio);
    const targetLength = Math.ceil(targetDuration * targetSampleRate);
    const fadeSamples = Math.min(Math.floor(0.15 * targetSampleRate), Math.floor(resampledLen * 0.25));
    const stride = resampledLen - fadeSamples;
    const loopCount = Math.ceil(targetLength / stride) + 1;

    const outputBuffer = this.audioContext.createBuffer(
      sourceBuffer.numberOfChannels,
      targetLength,
      targetSampleRate
    );

    for (let channel = 0; channel < sourceBuffer.numberOfChannels; channel++) {
      const src = sourceBuffer.getChannelData(channel);
      const out = outputBuffer.getChannelData(channel);

      for (let loop = 0; loop < loopCount; loop++) {
        const loopStart = loop * stride;
        for (let i = 0; i < resampledLen; i++) {
          const outIdx = loopStart + i;
          if (outIdx >= targetLength) break;
          const srcIdx = Math.min(Math.floor(i * ratio), src.length - 1);
          let sample = src[srcIdx];
          if (loop > 0 && i < fadeSamples) {
            sample *= Math.sqrt(i / fadeSamples);
          }
          if (i >= resampledLen - fadeSamples) {
            sample *= Math.sqrt((resampledLen - i) / fadeSamples);
          }
          out[outIdx] += sample;
        }
      }
    }

    return outputBuffer;
  }

  // Mix all audio layers into final subliminal track
  async generateSubliminalTrack(settings: SubliminalSettings): Promise<Blob> {
    const duration = settings.duration * 60; // convert minutes to seconds

    settings.onMixProgress?.(40);
    
    // Get proprietary mixing parameters from edge function
    const params = await this.getSubliminalParams();
    
    // Use the target sample rate from params - client-side WASM encoding handles any size
    // Only reduce for very long tracks to keep encoding time reasonable
    let targetSampleRate = params.targetSampleRate; // Default: 22050 Hz
    
    // For tracks over 20 minutes, reduce sample rate slightly to speed up encoding
    // This is optional for quality vs. speed tradeoff
    if (duration >= 1200) { // >= 20 minutes
      targetSampleRate = 16000;
      console.log(`Long track detected (${duration}s), using ${targetSampleRate} Hz for faster encoding`);
    }
    
    const estimatedPcmMB = (duration * targetSampleRate * 2 * 4) / (1024 * 1024); // Float32 = 4 bytes
    console.log(`Creating audio: ${duration}s at ${targetSampleRate} Hz, estimated PCM: ${estimatedPcmMB.toFixed(1)} MB`);
    
    // Create offline context for rendering with reduced sample rate
    const offlineContext = new OfflineAudioContext(
      2,
      targetSampleRate * duration,
      targetSampleRate
    );

    // 1. Optional binaural beats (use target sample rate)
    if (settings.binauralType !== "none") {
      const binauralBuffer = await this.createBinauralBeat(
        offlineContext,
        settings.binauralType,
        duration,
        targetSampleRate
      );
      const binauralSource = offlineContext.createBufferSource();
      binauralSource.buffer = binauralBuffer;
      const binauralGain = offlineContext.createGain();
      const vol = Math.max(0, Math.min(1, settings.binauralVolume));
      binauralGain.gain.value = params.binauralGain * vol;
      binauralSource.connect(binauralGain);
      binauralGain.connect(offlineContext.destination);
      binauralSource.start(0);
    }

    // 2. Generate/load background sound (use target sample rate)
    let backgroundBuffer: AudioBuffer;
    console.log("Loading background sound:", settings.backgroundSound, "URL:", settings.backgroundSoundUrl);
    if (!settings.backgroundSound || settings.backgroundSound === "" || settings.backgroundSound === "none") {
      // No background sound - create silent buffer
      backgroundBuffer = offlineContext.createBuffer(2, duration * targetSampleRate, targetSampleRate);
    } else if (settings.backgroundSound.startsWith("user:")) {
      // User track - must have URL provided
      console.log("Processing user track, URL:", settings.backgroundSoundUrl);
      if (!settings.backgroundSoundUrl) {
        throw new Error(`User track selected but URL not provided. Track ID: ${settings.backgroundSound.replace("user:", "")}`);
      }
      try {
        console.log("Fetching user track from:", settings.backgroundSoundUrl);
        const response = await fetch(settings.backgroundSoundUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch user track: ${response.status} ${response.statusText}`);
        }
        const arrayBuffer = await response.arrayBuffer();
        const baseBuffer = await offlineContext.decodeAudioData(arrayBuffer.slice(0));
        backgroundBuffer = this.loopBuffer(baseBuffer, duration, targetSampleRate);
        console.log("User track loaded successfully");
      } catch (error) {
        console.error("Error loading user track:", error);
        throw new Error(`Failed to load user track from URL: ${error instanceof Error ? error.message : String(error)}`);
      }
    } else {
      // Regular background sound
      backgroundBuffer = await this.getBackgroundSound(settings.backgroundSound, duration, targetSampleRate, offlineContext);
    }

    const backgroundSource = offlineContext.createBufferSource();
    backgroundSource.buffer = backgroundBuffer;
    backgroundSource.loop = true; // Loop background sound
    const backgroundGain = offlineContext.createGain();
    backgroundGain.gain.value = settings.backgroundVolume;
    backgroundSource.connect(backgroundGain);
    backgroundGain.connect(offlineContext.destination);
    backgroundSource.start(0);

    // 3. Load affirmation audio and resample if needed
    console.log("Loading affirmation audio, blob size:", settings.affirmationBlob.size);
    const affirmationBuffer = await this.loadAudioBuffer(settings.affirmationBlob, offlineContext);
    console.log("Affirmation buffer loaded:", {
      sampleRate: affirmationBuffer.sampleRate,
      length: affirmationBuffer.length,
      duration: affirmationBuffer.length / affirmationBuffer.sampleRate,
      channels: affirmationBuffer.numberOfChannels
    });
    
    // Resample affirmation buffer to match target sample rate if needed
    const resampledAffirmationBuffer = affirmationBuffer.sampleRate !== targetSampleRate
      ? await this.resampleAudioBuffer(affirmationBuffer, targetSampleRate)
      : affirmationBuffer;
    
    console.log("Resampled affirmation buffer:", {
      sampleRate: resampledAffirmationBuffer.sampleRate,
      length: resampledAffirmationBuffer.length,
      duration: resampledAffirmationBuffer.length / resampledAffirmationBuffer.sampleRate
    });
    
    // Check if buffer has audio data (use a sample to avoid stack overflow)
    const channelData = resampledAffirmationBuffer.getChannelData(0);
    let maxAmplitude = 0;
    const sampleSize = Math.min(10000, channelData.length); // Sample first 10k samples
    for (let i = 0; i < sampleSize; i++) {
      const abs = Math.abs(channelData[i]);
      if (abs > maxAmplitude) maxAmplitude = abs;
    }
    const hasAudio = maxAmplitude > params.audioDetectionThreshold; // Proprietary detection threshold
    console.log("Affirmation buffer audio check:", {
      maxAmplitude,
      hasAudio,
      bufferLength: channelData.length,
      firstSamples: Array.from(channelData.slice(0, 10))
    });
    
    if (!hasAudio) {
      console.warn("WARNING: Affirmation buffer appears to be silent!");
    }

    // 4. Layer affirmations multiple times at subliminal volume
    // Divide by layer count so total volume stays consistent regardless of layers
    // (layers are additive - without this, more layers = louder total volume)
    const totalGain = Math.min(1, settings.affirmationVolume * params.affirmationGainMultiplier);
    const baseAffirmationGain = totalGain / settings.layers;
    console.log("Affirmation settings:", {
      volume: settings.affirmationVolume,
      totalGain: totalGain,
      perLayerGain: baseAffirmationGain,
      layers: settings.layers
    });

    // Ensure affirmations play for the full duration
    const affirmationDuration = resampledAffirmationBuffer.length / resampledAffirmationBuffer.sampleRate;
    console.log("Affirmation duration:", affirmationDuration, "Track duration:", duration);

    for (let layer = 0; layer < settings.layers; layer++) {
      const layerDelay = layer * params.layerDelaySeconds; // Proprietary layer delay
      const affirmationSource = offlineContext.createBufferSource();
      affirmationSource.buffer = resampledAffirmationBuffer;
      affirmationSource.loop = true; // Loop affirmations
      
      const affirmationGain = offlineContext.createGain();
      // Proprietary layer attenuation: each layer slightly quieter to create subliminal whisper effect
      const layerAttenuation = Math.max(0, 1 - layer * params.layerAttenuation);
      affirmationGain.gain.value = baseAffirmationGain * layerAttenuation;
      
      console.log(`Layer ${layer}: gain=${affirmationGain.gain.value}, delay=${layerDelay}, will play until ${duration}s`);
      
      affirmationSource.connect(affirmationGain);
      affirmationGain.connect(offlineContext.destination);
      affirmationSource.start(layerDelay);
      // Stop at the end of the track duration
      affirmationSource.stop(duration);
    }

    settings.onMixProgress?.(55);

    // Render the mixed audio
    const renderedBuffer = await offlineContext.startRendering();

    settings.onMixProgress?.(72);

    // 1.5s fade-in at the very start of the final track
    const fadeInSamples = Math.min(Math.floor(1.5 * renderedBuffer.sampleRate), renderedBuffer.length);
    for (let ch = 0; ch < renderedBuffer.numberOfChannels; ch++) {
      const data = renderedBuffer.getChannelData(ch);
      for (let i = 0; i < fadeInSamples; i++) {
        data[i] *= i / fadeInSamples;
      }
    }

    // Convert to MP3 using client-side WASM encoder
    const mp3Blob = await this.bufferToMp3(renderedBuffer, settings.onMixProgress);
    return mp3Blob;
  }

  // Convert AudioBuffer to MP3 Blob using client-side WASM encoder
  private async bufferToMp3(
    buffer: AudioBuffer,
    onMixProgress?: (percent: number) => void
  ): Promise<Blob> {
    const sampleRate = buffer.sampleRate;
    const numChannels = buffer.numberOfChannels;
    const samples = buffer.length;
    
    console.log(`Starting client-side MP3 encoding: ${samples} samples, ${sampleRate} Hz, ${numChannels} channels`);
    const startTime = performance.now();
    
    // Get Float32 channel data
    const leftChannel = buffer.getChannelData(0);
    const rightChannel = numChannels > 1 ? buffer.getChannelData(1) : leftChannel;
    
    // Initialize WASM MP3 encoder
    const encoder = await createMp3Encoder();
    
    // Configure encoder: use VBR quality 2 for good quality, or can use bitrate: 128
    encoder.configure({
      sampleRate,
      channels: numChannels as 1 | 2, // WASM encoder expects 1 or 2 channels
      vbrQuality: 2, // Good quality VBR (0=best, 9=worst)
    });
    
    // Encode in chunks to allow for progress reporting and prevent blocking
    const chunkSize = 1152 * 32; // Process ~32 frames at a time
    const mp3Chunks: Uint8Array[] = [];
    let totalMp3Size = 0;
    
    for (let i = 0; i < samples; i += chunkSize) {
      const end = Math.min(i + chunkSize, samples);
      const leftChunk = leftChannel.subarray(i, end);
      const rightChunk = numChannels > 1 ? rightChannel.subarray(i, end) : leftChunk;
      
      // Encode chunk - wasm-media-encoders expects Float32Array per channel
      const mp3Data = encoder.encode([leftChunk, rightChunk]);
      
      if (mp3Data.length > 0) {
        // IMPORTANT: Must copy the data as it's owned by the encoder
        const copy = new Uint8Array(mp3Data.length);
        copy.set(mp3Data);
        mp3Chunks.push(copy);
        totalMp3Size += copy.length;
      }
      
      const progress = Math.floor((i / samples) * 100);
      onMixProgress?.(72 + Math.round(progress * 0.28));
      if (progress % 10 === 0 && i > 0) {
        console.log(`MP3 encoding progress: ${progress}%`);
      }
    }
    
    // Finalize encoding
    const finalData = encoder.finalize();
    if (finalData.length > 0) {
      const copy = new Uint8Array(finalData.length);
      copy.set(finalData);
      mp3Chunks.push(copy);
      totalMp3Size += copy.length;
    }
    
    // Combine all chunks into single buffer
    const mp3Buffer = new Uint8Array(totalMp3Size);
    let offset = 0;
    for (const chunk of mp3Chunks) {
      mp3Buffer.set(chunk, offset);
      offset += chunk.length;
    }
    
    const endTime = performance.now();
    const encodingTime = ((endTime - startTime) / 1000).toFixed(2);
    const sizeMB = (totalMp3Size / (1024 * 1024)).toFixed(2);
    console.log(`MP3 encoding complete: ${sizeMB} MB in ${encodingTime}s`);
    
    return new Blob([mp3Buffer], { type: "audio/mpeg" });
  }

  // Resample AudioBuffer to target sample rate
  private async resampleAudioBuffer(buffer: AudioBuffer, targetSampleRate: number): Promise<AudioBuffer> {
    const offlineContext = new OfflineAudioContext(
      buffer.numberOfChannels,
      Math.ceil(buffer.length * targetSampleRate / buffer.sampleRate),
      targetSampleRate
    );
    
    const source = offlineContext.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineContext.destination);
    source.start(0);
    
    return await offlineContext.startRendering();
  }

  async encodeBlobToMp3(blob: Blob): Promise<Blob> {
    const arrayBuffer = await blob.arrayBuffer();
    const decoded = await this.audioContext.decodeAudioData(arrayBuffer.slice(0));
    return this.bufferToMp3(decoded);
  }

  // Clean up resources
  dispose() {
    if (this.audioContext.state !== 'closed') {
      this.audioContext.close();
    }
  }
}

```

### src/pages/onboarding/WelcomeSubliminal.tsx

```tsx
import { Fragment, useCallback, useEffect, useMemo, useRef, useState, type Ref } from "react";
import { useNavigate } from "react-router-dom";
import { OnboardingLayout } from "@/components/onboarding/OnboardingLayout";
import {
  WELCOME_ACCENT,
} from "@/components/onboarding/WelcomeCosmicBackground";
import { Heart, Loader2, Mic, Star } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useIsMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useIsNativeApp } from "@/hooks/use-native-app";
import { supabase, SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "@/integrations/supabase/client";
import {
  markWebOnboardingMakeMySubliminalCtaClicked,
  recordWebOnboardingSessionStart,
  writeWebOnboardingSubliminalFastPath,
} from "@/lib/webOnboardingSessionInsert";
import { ensureOnboardingSessionCreds } from "@/lib/setupDraftBackendSync";
import { readSetupDraft, writeSetupDraft } from "@/lib/setupDraft";
import { trackMarketingConversion } from "@/lib/marketingConversionTrack";
import { SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES } from "@/lib/onboardingFlow";
import {
  AFFIRMATION_LINE_MAX_LENGTH,
  AFFIRMATION_SET_NAME_MAX_LENGTH,
  SUPPORT_CATEGORIES,
} from "@/lib/affirmations-data";
import {
  MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
} from "@/lib/marketingConversionCopy";
import { readMarketingAttribution } from "@/lib/useMarketingAttribution";
import { detectInAppBrowser } from "@/lib/inAppBrowserDetection";
import { cn } from "@/lib/utils";
import { signalNativeSplashReadyToHide } from "@/components/NativeAppRootRedirect";
import "@/styles/welcome-web-effects.css";

/** Transparent brand logo Ã¢â‚¬â€ native splash + welcome native body. */
const WELCOME_LOGO = "/welcome-logo.png";
/** Rounded app icon Ã¢â‚¬â€ web welcome hero (matches App Store icon). */
/** Web welcome only Ã¢â‚¬â€ resized from apple-ios-logo.png (App Store master stays full-res). */
const WELCOME_APP_ICON = "/apple-ios-logo-hero.png";
const WELCOME_EYEBROW = "subliminals Ã‚Â· LOA Ã‚Â· SP Ã‚Â· scripting Ã‚Â· self-concept";

const WELCOME_CONTINUE_TEXT = "Start my path";
const WELCOME_CTA_SUBTEXT = "Personalize your first subliminal in less than 3 minutes";
const WELCOME_CTA_SUBTEXT_NATIVE = "~3 min set up";

const WELCOME_PRIMARY_CTA_CLASS =
  "h-12 rounded-xl border-0 bg-white font-sans text-[15px] font-semibold tracking-[-0.01em] text-zinc-900 shadow-[0_1px_2px_rgba(0,0,0,0.24),0_8px_28px_rgba(0,0,0,0.28)] hover:bg-zinc-50 active:bg-zinc-100 focus:bg-white";

const WELCOME_WEB_LAVENDER = "#e8b8d4";

const WELCOME_AVATAR_VERSION = "genz-v5-webp92";

const WELCOME_COMMUNITY_AVATARS = [
  `/marketing/welcome-avatars/welcome-community-avatar-1.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-2.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-3.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-4.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-5.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-6.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-7.webp?v=${WELCOME_AVATAR_VERSION}`,
  `/marketing/welcome-avatars/welcome-community-avatar-8.webp?v=${WELCOME_AVATAR_VERSION}`,
] as const;

/** Centered rows with dot separators Ã¢â‚¬â€ native only. */
const WELCOME_TOOL_ROWS: readonly (readonly string[])[] = [
  ["Subliminal Maker", "Robotic Affirming", "Scripting"],
  ["Mirror Work", "Belief Work", "Inspired Action"],
  ["Manifestation Lists", "AI Manifesting Guide"],
];

const WELCOME_TOOL_TEXT_CLASS = cn(
  "font-welcome-serif text-[13px] font-normal leading-[1.45] text-[#e8b8cc]",
);

const WELCOME_TOOL_BULLET_CLASS = cn(
  "px-1.5 font-welcome-serif text-[13px] text-[#e8b8cc]/65",
);

const SUBLIMINAL_WELCOME_PATH = "/onboarding/subliminal/welcome";
const SUBLIMINAL_PATH_LOADING = "/onboarding/subliminal/setup/plot-loading";
const SUBLIMINAL_ONBOARDING_VOCAL_KEY = "sv_subliminal_onboarding_vocal_blob_v1";

const ONBOARDING_STARTER_LAYERS = 3;
const ONBOARDING_STARTER_MINUTES = 5;
const ONBOARDING_STARTER_BACKGROUND = "Rain v2.WAV";
const ONBOARDING_STARTER_BINAURAL = "theta";
const ONBOARDING_BACKGROUND_OPTIONS = [
  { label: "Rain", value: "Rain v2.WAV" },
  { label: "Ocean", value: "Ocean v2.WAV" },
  { label: "Nature Park", value: "Nature Park.wav" },
  { label: "Fireplace", value: "Fireplace.wav" },
  { label: "City Corner", value: "City Corner.wav" },
  { label: "Gold Coins", value: "Gold Coins.wav" },
  { label: "Your Custom Sound", value: "Your Custom Sound" },
] as const;

const ONBOARDING_FLOW_CARD_CLASS =
  "w-full min-w-0 rounded-xl border border-white/12 bg-transparent text-white backdrop-blur-sm shadow-sm !bg-transparent !shadow-none";
const ONBOARDING_INPUT_CLASS = "!bg-transparent !border-white/12 !text-white placeholder:!text-white/40";
const ONBOARDING_GHOST_BTN =
  "bg-transparent border border-white/12 text-white shadow-none hover:bg-white/[0.06] hover:text-white active:bg-transparent disabled:opacity-50";
const ONBOARDING_AFFIRM_LIST_ROW =
  "p-2 rounded-lg border border-white/12 bg-transparent text-sm";
const ONBOARDING_SCRIPT_MAX_CHARS = 350;
const ONBOARDING_RECORDING_MAX_MS = 60_000;

const ONBOARDING_MANIFEST_CATEGORY_ORDER = [
  "Connections",
  "Self-Love",
  "Confidence",
  "Fitness",
  "Finances",
  "Career",
  "Business",
  "Learning",
  "Productivity",
  "Organization",
  "Nutrition",
  "Discipline",
] as const;

const ONBOARDING_MANIFEST_CATEGORY_LABEL: Partial<Record<(typeof ONBOARDING_MANIFEST_CATEGORY_ORDER)[number], string>> = {
  "Self-Love": "Glow Up",
  Fitness: "Dream Body",
};

/** Pill glow/border only on this page â€” backend still uses SUPPORT_CATEGORIES `name` + `color`. */
const ONBOARDING_MANIFEST_CATEGORY_UI_COLOR: Partial<
  Record<(typeof ONBOARDING_MANIFEST_CATEGORY_ORDER)[number], string>
> = {
  Fitness: "#FFB6C1",
  Learning: "#8fbf76",
  Productivity: "#4AC7FF",
  Organization: "#4AC7FF",
  Nutrition: "#4AC7FF",
  Discipline: "#4AC7FF",
};

const ONBOARDING_STEP_LABELS: Record<OnboardingPageStep, string> = {
  manifest: "Step 1 of 3 Â· Your Subliminal + Manifesting Goal",
  vocals: "Step 2 of 3 Â· Choose Your Vocals",
  finetune: "Step 3 of 3 Â· Fine-tune Your Track",
};
const ONBOARDING_STEP_PROGRESS_ROUTE: Record<
  OnboardingPageStep,
  (typeof SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES)[number]
> = {
  manifest: "/onboarding/subliminal/welcome#manifest",
  vocals: "/onboarding/subliminal/welcome#vocals",
  finetune: "/onboarding/subliminal/welcome#finetune",
};

const ONBOARDING_HERO_HEADLINES: Record<
  OnboardingPageStep,
  { line: string; accent: string; accentNowrap?: boolean }
> = {
  manifest: {
    line: "Manifest your desires,",
    accent: "make a subliminal first",
    accentNowrap: true,
  },
  vocals: {
    line: "Use your own voice,",
    accent: "or generate vocals fast",
    accentNowrap: true,
  },
  finetune: {
    line: "Supercharge your subliminal",
    accent: "with fine-tuned settings",
  },
};

type OnboardingPageStep = "manifest" | "vocals" | "finetune";

const BINURAL_BEATS = [
  { value: "none", label: "No binaural beat", desc: "Affirmations and background only; no binaural tones in the mix." },
  { value: "delta", label: "Delta (0.5-4 Hz beat, ~200 Hz carrier)", desc: "Deep sleep, healing, regeneration" },
  { value: "theta", label: "Theta (4-8 Hz beat, ~200 Hz carrier)", desc: "Meditation, deep focus, deep relaxation" },
  { value: "alpha", label: "Alpha (8-13 Hz beat, ~250 Hz carrier)", desc: "Relaxation, learning, light meditation" },
  { value: "beta", label: "Beta (13-30 Hz beat, ~300 Hz carrier)", desc: "Focus, concentration, alertness" },
  { value: "gamma", label: "Gamma (30-100 Hz beat, ~400 Hz carrier)", desc: "Peak awareness, cognitive enhancement" },
] as const;

type OnboardingManifestCardProps = {
  manifestTopic: string;
  category: string | null;
  isGeneratingAffirmations: boolean;
  onTopicChange: (value: string) => void;
  onCategoryChange: (value: string) => void;
  onCreateAffirmations: () => void;
};

function OnboardingManifestCard({
  manifestTopic,
  category,
  isGeneratingAffirmations,
  onTopicChange,
  onCategoryChange,
  onCreateAffirmations,
}: OnboardingManifestCardProps) {
  const topicTrimmed = manifestTopic.trim();

  return (
    <Card className={cn("animate-fade-in", ONBOARDING_FLOW_CARD_CLASS)}>
      <CardHeader className="space-y-2 pb-3">
        <CardTitle className="sv-subliminal-headline text-center text-lg">What do you want to manifest?</CardTitle>
        <p className="text-center text-sm leading-relaxed text-white/75">
          Scroll â†’ to provide a category &amp; details
        </p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 pt-0">
        <div className="min-w-0 space-y-3">
          <div className="min-w-0">
            <div className="flex gap-1 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] snap-x snap-mandatory">
            {ONBOARDING_MANIFEST_CATEGORY_ORDER.map((name) => {
              const cat = SUPPORT_CATEGORIES.find((c) => c.name === name);
              if (!cat) return null;
              const selected = category === cat.name;
              const label = ONBOARDING_MANIFEST_CATEGORY_LABEL[name] ?? cat.label;
              const pillColor = ONBOARDING_MANIFEST_CATEGORY_UI_COLOR[name] ?? cat.color;
              return (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => onCategoryChange(cat.name)}
                  className={cn(
                    "shrink-0 snap-start rounded-full border px-3 py-1.5 font-sans text-[12px] font-medium transition-colors",
                    selected
                      ? "text-white"
                      : "border-white/15 bg-transparent text-white/65 hover:border-white/25",
                  )}
                  style={
                    selected
                      ? {
                          borderColor: `${pillColor}99`,
                          boxShadow: `0 0 14px ${pillColor}40`,
                          backgroundColor: "transparent",
                        }
                      : undefined
                  }
                >
                  {label}
                </button>
              );
            })}
            </div>
          </div>
          <Input
            placeholder="Be specific (e.g., new job, boyfriend, grades)"
            value={manifestTopic}
            onChange={(e) => onTopicChange(e.target.value.slice(0, AFFIRMATION_SET_NAME_MAX_LENGTH))}
            onKeyDown={(e) =>
              e.key === "Enter" && !isGeneratingAffirmations && topicTrimmed && category && onCreateAffirmations()
            }
            maxLength={AFFIRMATION_SET_NAME_MAX_LENGTH}
            className={cn("w-full !text-sm", ONBOARDING_INPUT_CLASS)}
          />
          <Button
            type="button"
            variant="ghost"
            disabled={!topicTrimmed || !category || isGeneratingAffirmations}
            onClick={onCreateAffirmations}
            className={cn("w-full", ONBOARDING_GHOST_BTN)}
          >
            {isGeneratingAffirmations ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              "Let's record your subliminal vocals"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

type OnboardingVocalsCardProps = {
  affirmations: string[];
  onAffirmationsChange: (lines: string[]) => void;
  vocalTab: "read" | "generate";
  onVocalTabChange: (tab: "read" | "generate") => void;
  isRecording: boolean;
  hasAudio: boolean;
  isGeneratingTTS: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  generateAffirmationAudio: () => void;
  onContinue: () => void;
};

function OnboardingVocalsCard({
  affirmations,
  onAffirmationsChange,
  vocalTab,
  onVocalTabChange,
  isRecording,
  hasAudio,
  isGeneratingTTS,
  startRecording,
  stopRecording,
  generateAffirmationAudio,
  onContinue,
}: OnboardingVocalsCardProps) {
  const scriptTitle =
    vocalTab === "generate"
      ? "Let a voice read your affirmations"
      : "Read lines karaoke-style or freestyle";
  const [scriptEditable, setScriptEditable] = useState(false);
  const [scriptDraft, setScriptDraft] = useState("");
  const scriptTextareaRef = useRef<HTMLTextAreaElement>(null);
  const scriptText = affirmations.join(" ").slice(0, ONBOARDING_SCRIPT_MAX_CHARS);

  useEffect(() => {
    if (!scriptEditable) {
      setScriptDraft(scriptText);
    }
  }, [scriptText, scriptEditable]);

  const commitScriptDraft = () => {
    const trimmed = scriptDraft.slice(0, ONBOARDING_SCRIPT_MAX_CHARS).trim();
    if (!trimmed) return;
    const lines = trimmed
      .split(/(?<=[.!?])\s+/)
      .map((line) => line.trim().slice(0, AFFIRMATION_LINE_MAX_LENGTH))
      .filter((line) => line.length > 0);
    onAffirmationsChange(
      lines.length > 0 ? lines : [trimmed.slice(0, AFFIRMATION_LINE_MAX_LENGTH)],
    );
  };

  const scriptBlock =
    affirmations.length > 0 ? (
      <div className={cn("flex min-h-0 flex-col overflow-hidden rounded-lg border", ONBOARDING_INPUT_CLASS)}>
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/12 px-3 py-2">
          <h3 className="text-xs font-semibold text-white">{scriptTitle}</h3>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => {
              setScriptDraft(scriptText);
              setScriptEditable(true);
              globalThis.requestAnimationFrame(() => scriptTextareaRef.current?.focus());
            }}
            className="h-6 px-1.5 text-[10px] font-semibold tracking-[0.08em] text-muted-foreground hover:text-white"
            title="Edit affirmations"
          >
            EDIT
          </Button>
        </div>
        <div className="max-h-[11rem] min-h-0 overflow-y-auto overscroll-contain px-3 py-2 [-webkit-overflow-scrolling:touch]">
          <Textarea
            ref={scriptTextareaRef}
            value={scriptEditable ? scriptDraft : scriptText}
            readOnly={!scriptEditable}
            maxLength={ONBOARDING_SCRIPT_MAX_CHARS}
            onChange={(e) => setScriptDraft(e.target.value.slice(0, ONBOARDING_SCRIPT_MAX_CHARS))}
            onBlur={() => {
              if (!scriptEditable) return;
              commitScriptDraft();
              setScriptEditable(false);
            }}
            className={cn(
              "min-h-[5rem] resize-none border-0 bg-transparent p-0 text-xs leading-relaxed text-white shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
              !scriptEditable && "cursor-default",
            )}
          />
        </div>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Generate affirmations on the previous step first.</p>
    );

  const recordControls = (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="ghost"
        onClick={isRecording ? stopRecording : startRecording}
        className={cn(
          "flex-1",
          ONBOARDING_GHOST_BTN,
          isRecording
            ? "border-red-400/60 text-red-200 shadow-[0_0_18px_rgba(248,113,113,0.22)] hover:bg-red-500/10 hover:text-red-100"
            : hasAudio
              ? "border-emerald-400/60 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)] hover:bg-emerald-500/10 hover:text-emerald-100"
              : "",
        )}
      >
        <Mic className="mr-2 h-4 w-4" />
        {isRecording ? "Stop" : "Record"}
      </Button>
      <Button
        type="button"
        variant="ghost"
        onClick={onContinue}
        disabled={!hasAudio}
        className={cn("flex-1", ONBOARDING_GHOST_BTN)}
      >
        Continue
      </Button>
    </div>
  );

  const ttsControls =
    affirmations.length > 0 ? (
      <div className="flex gap-2">
        <Button
          type="button"
          variant="ghost"
          disabled={isGeneratingTTS}
          onClick={() => void generateAffirmationAudio()}
          className={cn(
            "flex-1",
            ONBOARDING_GHOST_BTN,
            hasAudio &&
              "border-emerald-400/60 text-emerald-200 shadow-[0_0_18px_rgba(52,211,153,0.22)] hover:bg-emerald-500/10 hover:text-emerald-100",
          )}
        >
          {isGeneratingTTS ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Generate Audio"
          )}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={onContinue}
          disabled={!hasAudio}
          className={cn("flex-1", ONBOARDING_GHOST_BTN)}
        >
          Continue
        </Button>
      </div>
    ) : (
      <p className="text-sm text-muted-foreground">Generate affirmations on the previous step first.</p>
    );

  const readPanel = (
    <>
      {scriptBlock}
      {recordControls}
    </>
  );

  return (
    <Card className={cn("animate-fade-in", ONBOARDING_FLOW_CARD_CLASS)}>
      <Tabs
        value={vocalTab}
        onValueChange={(v) => onVocalTabChange(v as "read" | "generate")}
        className="w-full"
      >
        <CardHeader className="flex flex-nowrap flex-row items-center justify-between gap-2 space-y-0 pb-3">
          <CardTitle className="sv-subliminal-headline shrink-0 whitespace-nowrap text-lg leading-tight">
            {vocalTab === "read" ? "Speak" : "Generate"}
          </CardTitle>
          <TabsList className="grid h-9 min-w-0 shrink-0 grid-cols-2 border border-white/12 bg-transparent p-0.5">
            <TabsTrigger
              value="read"
              className="whitespace-nowrap rounded-sm border border-transparent bg-transparent px-2 py-0.5 text-xs leading-tight data-[state=active]:border-white/70 data-[state=active]:bg-transparent data-[state=active]:text-white"
            >
              Use Your Voice
            </TabsTrigger>
            <TabsTrigger
              value="generate"
              className="whitespace-nowrap rounded-sm border border-transparent bg-transparent px-2 py-0.5 text-xs leading-tight data-[state=active]:border-white/70 data-[state=active]:bg-transparent data-[state=active]:text-white"
            >
              Text-to-Speech
            </TabsTrigger>
          </TabsList>
        </CardHeader>
        <CardContent className="min-w-0 space-y-4 pt-0">
          <TabsContent value="read" className="mt-0 space-y-4">
            {readPanel}
          </TabsContent>
          <TabsContent value="generate" className="mt-0 space-y-4">
            {scriptBlock}
            {ttsControls}
          </TabsContent>
        </CardContent>
      </Tabs>
    </Card>
  );
}

type OnboardingBinauralCardProps = {
  binauralBeat: string;
  onBinauralChange: (value: string) => void;
  backgroundSound: string;
  onBackgroundChange: (value: string) => void;
  onContinue: () => void;
};

function OnboardingBinauralCard({
  binauralBeat,
  onBinauralChange,
  backgroundSound,
  onBackgroundChange,
  onContinue,
}: OnboardingBinauralCardProps) {
  const selectedBeat = BINURAL_BEATS.find((b) => b.value === binauralBeat);
  const [backgroundPickerOpen, setBackgroundPickerOpen] = useState(false);
  const [binauralPickerOpen, setBinauralPickerOpen] = useState(false);
  const binauralBubbleLabel =
    selectedBeat?.value === "none"
      ? "No binaural"
      : `${selectedBeat?.label.split(" (")[0] ?? "Theta"} waves`;
  const selectedBackground =
    ONBOARDING_BACKGROUND_OPTIONS.find((o) => o.value === backgroundSound) ??
    ONBOARDING_BACKGROUND_OPTIONS[0];
  const selectableBubbleClass =
    "flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/30 bg-transparent px-2 py-1 text-xs leading-none text-white/90 shadow-[0_0_16px_rgba(255,255,255,0.28)] transition-colors hover:border-white/45 hover:bg-transparent hover:shadow-[0_0_20px_rgba(255,255,255,0.38)]";

  return (
    <Card className={cn("animate-fade-in", ONBOARDING_FLOW_CARD_CLASS)}>
      <CardHeader className="space-y-1.5 px-6 pt-4 pb-4">
        <CardTitle className="sv-subliminal-headline text-center text-lg leading-tight">
          Fine-tune Your Track for Intensity
        </CardTitle>
        <p className="text-sm leading-relaxed text-white/75">
          Presets for speed. Full options after signup.
        </p>
      </CardHeader>
      <CardContent className="min-w-0 space-y-4 px-6 pb-6 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex gap-2">
            <div className="flex min-w-0 flex-1">
              <Popover open={backgroundPickerOpen} onOpenChange={setBackgroundPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setBackgroundPickerOpen(true)}
                    className={selectableBubbleClass}
                  >
                    {selectedBackground.label} background
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="start"
                  className="w-56 border-white/15 bg-transparent p-3 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md"
                >
                  <TooltipProvider delayDuration={200}>
                    <div className="flex flex-wrap gap-1.5">
                      {ONBOARDING_BACKGROUND_OPTIONS.map((option) => {
                        const active = backgroundSound === option.value;
                        const locked = option.label === "Your Custom Sound";
                        const bubbleClass = cn(
                          "rounded-full border px-2 py-1 text-xs transition-colors",
                          active
                            ? "border-white/35 bg-transparent text-white"
                            : "border-white/12 bg-transparent text-white/55",
                          locked
                            ? "cursor-not-allowed opacity-40"
                            : "hover:border-white/25 hover:text-white/80",
                        );
                        if (locked) {
                          return (
                            <Tooltip key={option.value}>
                              <TooltipTrigger asChild>
                                <span className="inline-flex">
                                  <button type="button" disabled className={bubbleClass}>
                                    {option.label}
                                  </button>
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side="top"
                                className="border-white/15 bg-[#141018] text-xs text-white"
                              >
                                Available after signup
                              </TooltipContent>
                            </Tooltip>
                          );
                        }
                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                              onBackgroundChange(option.value);
                              setBackgroundPickerOpen(false);
                            }}
                            className={bubbleClass}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </TooltipProvider>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex min-w-0 flex-1">
              <Popover open={binauralPickerOpen} onOpenChange={setBinauralPickerOpen}>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    onClick={() => setBinauralPickerOpen(true)}
                    className={selectableBubbleClass}
                  >
                    {binauralBubbleLabel}
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  align="end"
                  className="w-56 border-white/15 bg-transparent p-3 text-white shadow-[0_12px_40px_rgba(0,0,0,0.35)] backdrop-blur-md"
                >
                  <div className="flex flex-wrap gap-1.5">
                    {BINURAL_BEATS.map((beat) => {
                      const shortLabel =
                        beat.value === "none" ? "None" : (beat.label.split(" (")[0] ?? beat.label);
                      const active = binauralBeat === beat.value;
                      return (
                        <button
                          key={beat.value}
                          type="button"
                          onClick={() => {
                            onBinauralChange(beat.value);
                            setBinauralPickerOpen(false);
                          }}
                          className={cn(
                            "rounded-full border px-2 py-1 text-xs transition-colors",
                            active
                              ? "border-white/35 bg-transparent text-white"
                              : "border-white/12 bg-transparent text-white/55 hover:border-white/25 hover:text-white/80",
                          )}
                        >
                          {shortLabel}
                        </button>
                      );
                    })}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="flex gap-2">
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              {ONBOARDING_STARTER_LAYERS}x layered vocals
            </span>
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              {ONBOARDING_STARTER_MINUTES} min track (loopable)
            </span>
          </div>
          <div className="flex gap-2">
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              4% affirmation volume
            </span>
            <span className="flex min-h-[1.75rem] flex-1 items-center justify-center whitespace-nowrap rounded-full border border-white/20 bg-transparent px-2 py-1 text-xs leading-none text-white/90">
              7% binaural volume
            </span>
          </div>
        </div>
        <Button type="button" variant="ghost" onClick={onContinue} className={cn("w-full", ONBOARDING_GHOST_BTN)}>
          Build my first subliminal
        </Button>
      </CardContent>
    </Card>
  );
}

function detectSubliminalTraffic(): boolean {
  const attr = readMarketingAttribution();
  if (!attr) return false;
  const fields = [attr.utmCampaign, attr.utmContent, attr.utmTerm].join(" ").toLowerCase();
  return fields.includes("subliminal") || fields.includes("subs ");
}

const AWARD_STAR_CLASS = "h-3 w-3 fill-[#d4d4d8] text-[#e4e4e7]";

const STAR_PAREN_OFFSETS = {
  left: ["translate-x-[7px]", "translate-x-[3px]", "translate-x-0", "translate-x-[3px]", "translate-x-[7px]"],
  right: ["-translate-x-[7px]", "-translate-x-[3px]", "translate-x-0", "-translate-x-[3px]", "-translate-x-[7px]"],
} as const;

function StarParen({ side }: { side: "left" | "right" }) {
  const offsets = STAR_PAREN_OFFSETS[side];
  return (
    <div
      className={cn(
        "flex shrink-0 flex-col justify-center gap-[6px] py-1",
        side === "left" ? "items-end" : "items-start",
      )}
      aria-hidden
    >
      {offsets.map((offset, i) => (
        <Star key={i} className={cn(AWARD_STAR_CLASS, offset)} />
      ))}
    </div>
  );
}

function WelcomeAwardLineNative() {
  return (
    <div
      className="relative z-10 flex w-full items-center justify-center gap-3 px-1"
      aria-label="One of the most comprehensive manifesting apps"
    >
      <StarParen side="left" />
      <p className="text-center font-sans text-[11px] font-medium uppercase leading-[1.35] tracking-[0.14em] text-white">
        <span className="block">One of the most</span>
        <span className="block">comprehensive</span>
        <span className="block">manifesting apps</span>
      </p>
      <StarParen side="right" />
    </div>
  );
}

function WelcomeFeatureGrid() {
  return (
    <div className="relative z-10 flex w-full justify-center px-1">
      <div className="flex flex-col items-center gap-2.5 text-center">
        {WELCOME_TOOL_ROWS.map((row) => (
          <p key={row[0]} className={WELCOME_TOOL_TEXT_CLASS}>
            {row.map((label, index) => (
              <Fragment key={label}>
                {index > 0 ? (
                  <span className={WELCOME_TOOL_BULLET_CLASS} aria-hidden>
                    Ã‚Â·
                  </span>
                ) : null}
                <span>{label}</span>
              </Fragment>
            ))}
          </p>
        ))}
      </div>
    </div>
  );
}

function WelcomeLogo({ size = "full" }: { size?: "full" | "compact" }) {
  const sizeClass = size === "compact"
    ? "mb-2 flex h-[5rem] w-[5rem] shrink-0 items-center justify-center"
    : "mb-3 flex h-[7.5rem] w-[7.5rem] shrink-0 items-center justify-center";
  return (
    <div className={sizeClass}>
      <img
        src={WELCOME_LOGO}
        alt="Palette Plotting"
        className="h-full w-full object-contain"
        width={size === "compact" ? 80 : 120}
        height={size === "compact" ? 80 : 120}
        decoding="async"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeAppIcon() {
  return (
    <div className="sv-logo-glow-wrap mb-2">
      <img
        src={WELCOME_APP_ICON}
        alt="Palette Plotting"
        className="sv-logo-glow-img"
        width={138}
        height={138}
        decoding="sync"
        fetchPriority="high"
      />
    </div>
  );
}

function WelcomeEyebrow() {
  return (
    <p className="text-center font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-white/40">
      {WELCOME_EYEBROW}
    </p>
  );
}

function WelcomeTitleNative() {
  return (
    <h1 className="font-welcome-serif mt-0 max-w-[19rem] text-center text-[28px] font-normal leading-[1.14] tracking-[-0.02em] text-white md:mt-3 sm:text-[31px]">
      Your manifesting methods,{" "}
      <span style={{ color: WELCOME_ACCENT }}>in one place</span>
    </h1>
  );
}

function WelcomeHeadlineWeb({ pageStep }: { pageStep: OnboardingPageStep }) {
  const { line, accent, accentNowrap = false } = ONBOARDING_HERO_HEADLINES[pageStep];
  return (
    <div className="sv-hero-headline-wrap sv-hero-headline-wrap--welcome relative z-10">
      <h1 className="sv-hero-headline">
        <span className="sv-hero-headline-line">{line}</span>
        <span
          className={cn("sv-hero-headline-accent", accentNowrap && "whitespace-nowrap")}
        >
          {accent}
        </span>
      </h1>

      <div className="sv-headline-underline" aria-hidden="true">
        <svg viewBox="0 0 420 24" preserveAspectRatio="none">
          <path d="M8 14 C120 10 300 10 412 14" />
        </svg>
      </div>
    </div>
  );
}

function WelcomeCommunityProofWeb() {
  return (
    <div className="relative z-10 flex w-full items-center justify-center gap-2 pt-0.5">
      <div className="flex shrink-0 items-center pl-0.5" aria-hidden>
        {WELCOME_COMMUNITY_AVATARS.map((src, index) => (
          <div
            key={src}
            className="relative -ml-2 h-7 w-7 shrink-0 overflow-hidden rounded-full border border-[#c994b8]/45 shadow-[0_0_10px_rgba(200,148,184,0.25)] first:ml-0 sm:h-8 sm:w-8 sm:-ml-2.5"
            style={{ zIndex: WELCOME_COMMUNITY_AVATARS.length - index }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover object-center"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
            />
          </div>
        ))}
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Heart className="h-3 w-3 shrink-0 fill-[#e8a8c8] text-[#e8a8c8]" aria-hidden />
        <p
          className="shrink-0 text-left font-sans text-[10px] font-medium leading-[1.2] tracking-[0.02em]"
          style={{ color: `${WELCOME_WEB_LAVENDER}e6` }}
        >
          Loved by manifestors
        </p>
        <Heart className="h-3 w-3 shrink-0 fill-[#e8a8c8] text-[#e8a8c8]" aria-hidden />
      </div>
    </div>
  );
}

function WelcomeDescriptionNative() {
  return (
    <p className="max-w-[21rem] text-center font-sans text-[14px] leading-[1.55] text-white/58">
      Manifest on easy mode with one solution for all core techniques. Make your own
      subliminals, customize your affirmations, do mirror work, and more.
    </p>
  );
}

type WelcomeBodyNativeProps = {
  topPaddingClass?: string;
  contentLiftClass?: string;
};

function WelcomeBodyNative({ topPaddingClass, contentLiftClass }: WelcomeBodyNativeProps) {
  return (
    <div
      className={cn(
        "relative z-10 mx-auto flex w-full max-w-[26rem] flex-col items-center gap-5",
        topPaddingClass,
        contentLiftClass,
      )}
    >
      <WelcomeLogo size="full" />
      <WelcomeEyebrow />
      <WelcomeTitleNative />
      <WelcomeDescriptionNative />
      <WelcomeAwardLineNative />
      <WelcomeFeatureGrid />
    </div>
  );
}

const welcomeLayoutPropsBase = {
  currentPage: 1 as const,
  welcomePage: true,
  stackedNativeButtons: true,
  stackedNativePrimaryButtonClassName: WELCOME_PRIMARY_CTA_CLASS,
  welcomeSignInAsTextLink: true,
};

const WelcomeSubliminal = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const isNative = useIsNativeApp();
  const isMobileViewport = useIsMobile();
  const { setTheme } = useTheme();
  const savedDraft = useMemo(() => readSetupDraft(), []);

  const [pageStep, setPageStep] = useState<OnboardingPageStep>("manifest");
  const [manifestTopic, setManifestTopic] = useState(savedDraft.manifestTopic ?? "");
  const [category, setCategory] = useState<string | null>(null);
  const [affirmations, setAffirmations] = useState<string[]>(savedDraft.starterAffirmations ?? []);
  const [isGeneratingAffs, setIsGeneratingAffs] = useState(false);
  const [vocalMode, setVocalMode] = useState<"karaoke" | "freestyle" | "tts">(
    savedDraft.subliminalVocalMode ?? "karaoke",
  );
  const [vocalTab, setVocalTab] = useState<"read" | "generate">("read");

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [affirmationVolume] = useState([0.04]);
  const [binauralBeat, setBinauralBeat] = useState(savedDraft.subliminalBinauralBeat ?? ONBOARDING_STARTER_BINAURAL);
  const [backgroundSound, setBackgroundSound] = useState(
    savedDraft.subliminalBackgroundSound ?? ONBOARDING_STARTER_BACKGROUND,
  );
  const subliminalProgressStepIndex = SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES.indexOf(
    ONBOARDING_STEP_PROGRESS_ROUTE[pageStep],
  );
  const subliminalProgressFillPct =
    ((subliminalProgressStepIndex + 1) / SUBLIMINAL_BUILDER_SETUP_PROGRESS_ROUTES.length) * 100;
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);

  const isSubliminalTraffic = useMemo(() => !isNative && detectSubliminalTraffic(), [isNative]);

  useEffect(() => {
    if (isNative) return;
    setTheme("dark");
  }, [isNative, setTheme]);

  const handleGenerateAffirmations = useCallback(async () => {
    const topic = manifestTopic.trim();
    if (!topic || !category) {
      return;
    }
    trackMarketingConversion("web_onboarding_click", {
      source: "subliminal_fast_path_manifest",
      button_label: "Let's record your subliminal vocals",
      target_path: "/onboarding/subliminal/welcome#vocals",
      is_subliminal_traffic: isSubliminalTraffic,
    });
    setIsGeneratingAffs(true);
    try {
      const creds = await ensureOnboardingSessionCreds();

      const { data, error } = await supabase.functions.invoke("generate-affirmations", {
        body: {
          topic,
          category,
          sessionId: creds.sessionId,
          resumeToken: creds.resumeToken,
        },
      });
      if (data?.blocked) {
        return;
      }
      if (data?.error) {
        return;
      }
      if (error) {
        console.warn("[WelcomeSubliminal] generate affirmations failed:", error);
        return;
      }
      const lines = Array.isArray(data?.affirmations) ? (data.affirmations as string[]) : [];
      if (lines.length === 0) {
        return;
      }
      const clippedLines: string[] = [];
      let used = 0;
      for (const raw of lines) {
        const line = raw.trim();
        if (!line) continue;
        const sep = clippedLines.length ? 1 : 0;
        if (used + sep + line.length > ONBOARDING_SCRIPT_MAX_CHARS) {
          const room = ONBOARDING_SCRIPT_MAX_CHARS - used - sep;
          if (room > 0) clippedLines.push(line.slice(0, room));
          break;
        }
        clippedLines.push(line);
        used += sep + line.length;
      }
      if (clippedLines.length === 0) {
        return;
      }
      setAffirmations(clippedLines);
      writeWebOnboardingSubliminalFastPath({
        stage: "affirmations_generated",
        manifest_topic: topic,
        starter_affirmation_category: category,
        starter_affirmations: clippedLines,
        starter_affirmations_count: clippedLines.length,
        generated_at: new Date().toISOString(),
      });
      void writeSetupDraft({
        subliminalFastFlow: true,
        manifestTopic: topic,
        starterAffirmations: clippedLines,
        starterAffirmationCategory: category,
      });
      setVocalTab("read");
      setVocalMode("karaoke");
      setPageStep("vocals");
    } finally {
      setIsGeneratingAffs(false);
    }
  }, [category, isSubliminalTraffic, manifestTopic]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      let mimeType = "audio/webm";
      if (MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
        mimeType = "audio/webm;codecs=opus";
      } else if (MediaRecorder.isTypeSupported("audio/mp4")) {
        mimeType = "audio/mp4";
      }
      let mediaRecorder: MediaRecorder;
      try {
        mediaRecorder = new MediaRecorder(stream, { mimeType, audioBitsPerSecond: 128000 });
      } catch {
        mediaRecorder = new MediaRecorder(stream);
      }
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = () => {
        if (recordingTimeoutRef.current) {
          clearTimeout(recordingTimeoutRef.current);
          recordingTimeoutRef.current = null;
        }
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
      };
      mediaRecorder.start(100);
      setIsRecording(true);
      recordingTimeoutRef.current = setTimeout(() => {
        if (mediaRecorder.state === "recording") {
          mediaRecorder.stop();
          setIsRecording(false);
        }
      }, ONBOARDING_RECORDING_MAX_MS);
    } catch {
      /* keep onboarding toast-free */
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (recordingTimeoutRef.current) {
        clearTimeout(recordingTimeoutRef.current);
        recordingTimeoutRef.current = null;
      }
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const togglePlayback = async () => {
    if (!audioBlob) {
      return;
    }
    if (isPlaying) {
      audioRef.current?.pause();
      setIsPlaying(false);
      return;
    }
    try {
      if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
      const audioUrl = URL.createObjectURL(audioBlob);
      audioUrlRef.current = audioUrl;
      const audio = new Audio(audioUrl);
      audio.volume = affirmationVolume[0] * 0.5;
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    } catch {
      /* keep onboarding toast-free */
    }
  };

  const generateAffirmationAudio = async () => {
    if (!affirmations.length) {
      return;
    }
    setIsGeneratingTTS(true);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/generate-affirmation-audio`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
          apikey: SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ affirmations, voice: "nova" }),
      });
      const responseText = await response.text();
      const responseData = responseText ? JSON.parse(responseText) : null;
      if (!response.ok || responseData?.error) {
        throw new Error(responseData?.error || "Failed to generate audio");
      }
      if (responseData?.audioContent) {
        const binaryString = atob(responseData.audioContent);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);
        setAudioBlob(new Blob([bytes], { type: "audio/mpeg" }));
      }
    } catch {
      /* keep onboarding toast-free */
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  const saveDraftAndContinue = async () => {
    if (affirmations.length === 0) {
      setPageStep("manifest");
      return;
    }

    trackMarketingConversion("web_onboarding_click", {
      source: "welcome_page",
      button_label: MARKETING_CTA_MAKE_FIRST_SUBLIMINAL,
      target_path: SUBLIMINAL_PATH_LOADING,
      is_subliminal_traffic: isSubliminalTraffic,
    });
    markWebOnboardingMakeMySubliminalCtaClicked();
    if (audioBlob) {
      try {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onerror = () => reject(reader.error);
          reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : "");
          reader.readAsDataURL(audioBlob);
        });
        if (dataUrl) {
          localStorage.setItem(
            SUBLIMINAL_ONBOARDING_VOCAL_KEY,
            JSON.stringify({
              type: audioBlob.type || "audio/mpeg",
              dataUrl,
              mode: vocalMode,
              savedAt: Date.now(),
            }),
          );
        }
      } catch {
        localStorage.removeItem(SUBLIMINAL_ONBOARDING_VOCAL_KEY);
      }
    }
    await writeSetupDraft({
      subliminalFastFlow: true,
      manifestTopic: manifestTopic.trim(),
      desireCategory: category,
      desireCategories: category ? [category] : [],
      currentFriction: "",
      desiredIdentity: manifestTopic.trim().slice(0, 50),
      conditionalSpecificity: {},
      starterAffirmations: affirmations,
      starterAffirmationCategory: category,
      subliminalVocalMode: vocalMode,
      subliminalBinauralBeat: binauralBeat,
      subliminalBackgroundSound: backgroundSound,
      subliminalLayers: ONBOARDING_STARTER_LAYERS,
      subliminalTrackMinutes: ONBOARDING_STARTER_MINUTES,
      toolPreferences: ["custom_subliminals"],
      guideCharacterId: "rose",
      appNotificationsConsent: false,
      embodyDailyPractices: [
        "embody_rest",
        "embody_clean_environment",
        "embody_move",
        "embody_nutrition",
        "embody_self_care",
      ],
    }, {
      awaitBackendSync: true,
    });
    writeWebOnboardingSubliminalFastPath({
      stage: "completed",
      manifest_topic: manifestTopic.trim(),
      desire_category: category,
      starter_affirmation_category: category,
      starter_affirmations: affirmations,
      starter_affirmations_count: affirmations.length,
      subliminal_vocal_mode: vocalMode,
      subliminal_audio_present: Boolean(audioBlob),
      subliminal_audio_type: audioBlob?.type || null,
      subliminal_binaural_beat: binauralBeat,
      subliminal_background_sound: backgroundSound,
      subliminal_layers: ONBOARDING_STARTER_LAYERS,
      subliminal_track_minutes: ONBOARDING_STARTER_MINUTES,
      tool_preferences: ["custom_subliminals"],
      guide_character_id: "rose",
      completed_at: new Date().toISOString(),
    });
    navigate(SUBLIMINAL_PATH_LOADING);
  };

  useEffect(() => {
    if (isNative) return;

    const recordWelcomeView = () => {
      void ensureOnboardingSessionCreds().catch((err) => {
        console.warn("[WelcomeSubliminal] ensureOnboardingSessionCreds failed:", err);
      });
      recordWebOnboardingSessionStart({
        isMobileViewport: isMobileViewport,
        entryPath: SUBLIMINAL_WELCOME_PATH,
      });
      trackMarketingConversion("web_onboarding_welcome_view", {
        source: "welcome_page",
        page_path: SUBLIMINAL_WELCOME_PATH,
        is_subliminal_traffic: isSubliminalTraffic,
      });
    };

    if (!detectInAppBrowser().isInAppBrowser) {
      recordWelcomeView();
      return;
    }

    let idleId: number | undefined;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    if ("requestIdleCallback" in window) {
      idleId = window.requestIdleCallback(() => recordWelcomeView(), { timeout: 4000 });
    } else {
      timeoutId = globalThis.setTimeout(recordWelcomeView, 1500);
    }

    return () => {
      if (idleId != null) window.cancelIdleCallback(idleId);
      if (timeoutId != null) window.clearTimeout(timeoutId);
    };
  }, [isNative, isMobileViewport, isSubliminalTraffic]);

  useEffect(() => {
    if (isNative) return;

    const preload = (href: string) => {
      if (document.querySelector(`link[rel="preload"][as="image"][href="${href}"]`)) return;
      const link = document.createElement("link");
      link.rel = "preload";
      link.as = "image";
      link.href = href;
      document.head.appendChild(link);
    };

    preload(WELCOME_APP_ICON);

    const fontId = "sv-welcome-proxima-nova";
    if (!document.getElementById(fontId)) {
      const fontLink = document.createElement("link");
      fontLink.id = fontId;
      fontLink.rel = "stylesheet";
      fontLink.href = "https://fonts.cdnfonts.com/css/proxima-nova";
      document.head.appendChild(fontLink);
    }
  }, [isNative, isMobileViewport, isSubliminalTraffic]);

  useEffect(() => {
    if (!isNative) return;
    if (!isLoading && user) {
      navigate("/dashboard", { replace: true });
    }
  }, [user, isLoading, navigate, isNative]);

  useEffect(() => {
    if (!isNative) return;
    let cancelled = false;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        window.setTimeout(() => {
          if (cancelled) return;
          signalNativeSplashReadyToHide();
        }, 75);
      });
    });
    return () => {
      cancelled = true;
    };
  }, [isNative]);

  const onContinue = () => {
    if (isNative) {
      navigate("/onboarding/setup/name");
    }
  };

  return (
    <OnboardingLayout
      {...welcomeLayoutPropsBase}
      onContinue={onContinue}
      canContinue={isNative}
      continueText={isNative ? WELCOME_CONTINUE_TEXT : ""}
      welcomeCtaSubtext={isNative ? WELCOME_CTA_SUBTEXT_NATIVE : undefined}
      welcomeSoloContinueButtonClassName={isNative ? WELCOME_PRIMARY_CTA_CLASS : undefined}
      contentMaxWidthClass="max-w-[22rem]"
      reserveProgressSpace={!isNative}
    >
      {isNative ? (
        <WelcomeBodyNative
          topPaddingClass="pt-[calc(var(--app-safe-area-top)+1.25rem)]"
          contentLiftClass="-translate-y-[0.32in]"
        />
      ) : (
        <div className="relative z-10 mx-auto flex w-full min-w-0 max-w-[22rem] -translate-y-[0.08in] flex-col items-center gap-2 pt-1 md:pt-1.5">
          <WelcomeAppIcon />
          <WelcomeHeadlineWeb pageStep={pageStep} />
          <p className="sv-subliminal-headline mb-3 text-center text-[11px] font-medium uppercase tracking-[0.14em] text-white/45">
            {ONBOARDING_STEP_LABELS[pageStep]}
          </p>
          {pageStep === "manifest" ? (
            <OnboardingManifestCard
              manifestTopic={manifestTopic}
              category={category}
              isGeneratingAffirmations={isGeneratingAffs}
              onTopicChange={setManifestTopic}
              onCategoryChange={setCategory}
              onCreateAffirmations={() => void handleGenerateAffirmations()}
            />
          ) : pageStep === "vocals" ? (
            <OnboardingVocalsCard
              affirmations={affirmations}
              onAffirmationsChange={(lines) => {
                setAffirmations(lines);
                void writeSetupDraft({
                  subliminalFastFlow: true,
                  manifestTopic: manifestTopic.trim(),
                  starterAffirmations: lines,
                  starterAffirmationCategory: category,
                });
              }}
              vocalTab={vocalTab}
              onVocalTabChange={(tab) => {
                setVocalTab(tab);
                setVocalMode(tab === "read" ? "karaoke" : "tts");
              }}
              isRecording={isRecording}
              hasAudio={!!audioBlob}
              isGeneratingTTS={isGeneratingTTS}
              startRecording={() => void startRecording()}
              stopRecording={stopRecording}
              generateAffirmationAudio={() => void generateAffirmationAudio()}
              onContinue={() => {
                trackMarketingConversion("web_onboarding_click", {
                  source: "subliminal_fast_path_vocals",
                  button_label: "Continue",
                  target_path: "/onboarding/subliminal/welcome#finetune",
                  is_subliminal_traffic: isSubliminalTraffic,
                });
                setPageStep("finetune");
              }}
            />
          ) : (
            <OnboardingBinauralCard
              binauralBeat={binauralBeat}
              onBinauralChange={setBinauralBeat}
              backgroundSound={backgroundSound}
              onBackgroundChange={setBackgroundSound}
              onContinue={() => void saveDraftAndContinue()}
            />
          )}
          <WelcomeCommunityProofWeb />
        </div>
      )}
    </OnboardingLayout>
  );
};

export default WelcomeSubliminal;

```
