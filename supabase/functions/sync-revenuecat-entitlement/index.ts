import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  syncUserPlansFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";

function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  if (!(error instanceof Error)) return defaultMessage;
  const message = error.message.toLowerCase();
  if (
    message.includes("relation") ||
    message.includes("column") ||
    message.includes("rls") ||
    message.includes("permission")
  ) {
    return "Permission denied. Please ensure you're logged in.";
  }
  return defaultMessage;
}

const getCorsHeaders = (origin: string | null) => ({
  "Access-Control-Allow-Origin": origin || "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
});

/** Optional payload from iOS client: onboarding choices to write to user_preferences, profiles, and user_plans. */
interface OnboardingPrefs {
  selected_character?: string | null;
  first_name?: string | null;
  username?: string | null;
  phone?: string | null;
  app_notifications_enabled?: boolean | null;
  manifestation_intensity?: string | null;
  manifest_routine_items?: unknown[] | null;
  routine_notification_times?: string[] | null;
  timezone?: string | null;
  notification_permission_status?: string | null;
  texts_enabled?: boolean | null;
  email_marketing?: boolean | null;
  preferred_send_window?: string | null;
  onboarding_answers?: Record<string, unknown> | null;
  embody_active_practices?: string[] | null;
  preferred_locale?: string | null;
}

const VALID_CHARACTERS = ["river", "sage", "rose", "oliver"] as const;

async function markOnboardingSessionPaidForUser(
  supabase: ReturnType<typeof createClient>,
  appUserId: string,
): Promise<void> {
  const paidStatuses = new Set(["paid", "account_created", "active"]);
  let sessionRow: { id: string; status: string; user_id: string | null } | null = null;

  const { data: byUser } = await supabase
    .from("onboarding_sessions")
    .select("id, status, user_id")
    .eq("user_id", appUserId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (byUser?.id) sessionRow = byUser;

  if (!sessionRow) {
    let email: string | null = null;
    try {
      const { data, error } = await supabase.auth.admin.getUserById(appUserId);
      if (!error && data?.user?.email) email = data.user.email.trim().toLowerCase();
    } catch {
      /* ignore */
    }

    if (email) {
      const { data: byEmail } = await supabase
        .from("onboarding_sessions")
        .select("id, status, user_id")
        .eq("email", email)
        .order("updated_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (byEmail?.id) sessionRow = byEmail;
    }
  }

  if (!sessionRow?.id) return;

  if (sessionRow.user_id && sessionRow.user_id !== appUserId) return;

  const paidAt = new Date().toISOString();
  const update: Record<string, unknown> = {
    user_id: appUserId,
    updated_at: paidAt,
  };
  if (!paidStatuses.has(sessionRow.status)) {
    update.status = "paid";
    update.paid_at = paidAt;
  }

  const { error } = await supabase
    .from("onboarding_sessions")
    .update(update)
    .eq("id", sessionRow.id);
  if (error) {
    console.warn("[sync-revenuecat-entitlement] onboarding_sessions mark paid failed", error.message);
  }
}

function applyOnboardingPrefs(
  supabase: ReturnType<typeof createClient>,
  userId: string,
  prefs: OnboardingPrefs
): Promise<void> {
  const prefsKeys = Object.keys(prefs) as (keyof OnboardingPrefs)[];
  if (prefsKeys.length === 0) return Promise.resolve();

  const profileUpdates: Record<string, unknown> = {};
  if (prefs.first_name !== undefined) profileUpdates.first_name = prefs.first_name;
  if (prefs.username !== undefined) profileUpdates.username = prefs.username;
  if (prefs.onboarding_answers !== undefined) profileUpdates.onboarding_answers = prefs.onboarding_answers;
  if (prefs.app_notifications_enabled !== undefined) {
    profileUpdates.app_notifications_enabled = prefs.app_notifications_enabled;
  }
  if (
    prefs.manifestation_intensity === "light" ||
    prefs.manifestation_intensity === "consistent" ||
    prefs.manifestation_intensity === "locked_in"
  ) {
    profileUpdates.manifestation_intensity = prefs.manifestation_intensity;
  }
  if (prefs.manifest_routine_items !== undefined) {
    profileUpdates.manifest_routine_items = Array.isArray(prefs.manifest_routine_items)
      ? prefs.manifest_routine_items
      : [];
  }
  if (prefs.routine_notification_times !== undefined) {
    profileUpdates.routine_notification_times = Array.isArray(prefs.routine_notification_times)
      ? prefs.routine_notification_times
      : [];
  }
  if (typeof prefs.timezone === "string" && prefs.timezone.trim()) {
    profileUpdates.timezone = prefs.timezone.trim();
  }
  if (
    prefs.notification_permission_status === "granted" ||
    prefs.notification_permission_status === "denied" ||
    prefs.notification_permission_status === "skipped"
  ) {
    profileUpdates.notification_permission_status = prefs.notification_permission_status;
  }

  const prefUpdates: Record<string, unknown> = {
    user_id: userId,
  };
  if (prefs.selected_character !== undefined) {
    const c = String(prefs.selected_character || "").toLowerCase();
    prefUpdates.selected_character = VALID_CHARACTERS.includes(c as typeof VALID_CHARACTERS[number])
      ? c
      : null;
  }
  if (prefs.app_notifications_enabled !== undefined) prefUpdates.app_notifications_enabled = prefs.app_notifications_enabled;
  if (
    prefs.manifestation_intensity === "light" ||
    prefs.manifestation_intensity === "consistent" ||
    prefs.manifestation_intensity === "locked_in"
  ) {
    prefUpdates.manifestation_intensity = prefs.manifestation_intensity;
  }
  if (prefs.manifest_routine_items !== undefined) {
    prefUpdates.manifest_routine_items = Array.isArray(prefs.manifest_routine_items)
      ? prefs.manifest_routine_items
      : [];
  }
  if (prefs.routine_notification_times !== undefined) {
    prefUpdates.routine_notification_times = Array.isArray(prefs.routine_notification_times)
      ? prefs.routine_notification_times
      : [];
  }
  if (typeof prefs.timezone === "string" && prefs.timezone.trim()) {
    prefUpdates.timezone = prefs.timezone.trim();
  }
  if (
    prefs.notification_permission_status === "granted" ||
    prefs.notification_permission_status === "denied" ||
    prefs.notification_permission_status === "skipped"
  ) {
    prefUpdates.notification_permission_status = prefs.notification_permission_status;
  }
  if (prefs.texts_enabled !== undefined) prefUpdates.texts_enabled = prefs.texts_enabled;
  if (prefs.email_marketing !== undefined) prefUpdates.email_marketing = prefs.email_marketing;
  if (prefs.preferred_send_window !== undefined) {
    const w = prefs.preferred_send_window;
    prefUpdates.preferred_send_window = w === "morning" || w === "evening" || w === "both" ? w : "both";
  }
  if (prefs.embody_active_practices !== undefined) {
    prefUpdates.embody_active_practices = Array.isArray(prefs.embody_active_practices) ? prefs.embody_active_practices : null;
  }
  const locale = typeof prefs.preferred_locale === "string" ? prefs.preferred_locale.trim() : "";
  if (locale === "en" || locale === "es-419" || locale === "pt-BR") {
    prefUpdates.preferred_locale = locale;
    profileUpdates.preferred_locale = locale;
  }

  return (async () => {
    if (Object.keys(profileUpdates).length > 0) {
      try {
        await supabase.from("profiles").upsert(
          { id: userId, ...profileUpdates },
          { onConflict: "id" }
        );
      } catch (e) {
        console.warn("Non-fatal: failed to upsert profiles from onboarding_prefs:", e);
      }
    }
    if (Object.keys(prefUpdates).length > 1) {
      try {
        await supabase.from("user_preferences").upsert(prefUpdates, { onConflict: "user_id" });
      } catch (e) {
        console.warn("Non-fatal: failed to upsert user_preferences from onboarding_prefs:", e);
      }
    }
    if (prefs.selected_character && VALID_CHARACTERS.includes(prefs.selected_character as typeof VALID_CHARACTERS[number])) {
      try {
        await supabase.from("character_selection_log").insert({
          user_id: userId,
          selected_character: prefs.selected_character,
          previous_character: null,
          source: "ios_onboarding_activation",
        });
      } catch (e) {
        console.warn("Non-fatal: failed to insert character_selection_log:", e);
      }
    }
  })();
}

serve(async (req) => {
  const origin = req.headers.get("origin") || req.headers.get("referer") || "*";
  const corsHeaders = getCorsHeaders(origin);

  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: { ...corsHeaders, "Content-Length": "0" } });
  }

  try {
    const secretKey = getRevenueCatServerSecretKey();
    if (!secretKey || !secretKey.startsWith("sk_")) {
      return new Response(
        JSON.stringify({ error: "RevenueCat secret key not configured" }),
        { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");
    const token = authHeader.replace("Bearer ", "");
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error("Unauthorized");

    let body: { onboarding_prefs?: OnboardingPrefs } = {};
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw) as { onboarding_prefs?: OnboardingPrefs };
      }
    } catch {
      // no body or invalid JSON – do not break payment path
    }

    const appUserId = user.id;
    const rc = await fetchRevenueCatSubscriber(secretKey, appUserId);
    if (!rc.ok) {
      console.error("[sync-revenuecat-entitlement] RevenueCat API error:", rc.status, rc.body);
      return new Response(
        JSON.stringify({ error: "Could not verify subscription" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await syncUserPlansFromRevenueCatPayload(supabase, appUserId, rc.data, {});

    if (!result.ok) {
      throw new Error(result.error);
    }

    if (result.preservedStripe) {
      console.log(
        "[sync-revenuecat-entitlement] Sync applied; Stripe cus_/sub_ identity kept (latest expiry vs RC).",
      );
      try {
        await markOnboardingSessionPaidForUser(supabase, appUserId);
      } catch (e) {
        console.warn("[sync-revenuecat-entitlement] onboarding_sessions mark paid failed (non-fatal):", e);
      }
      return new Response(
        JSON.stringify({
          success: true,
          active: true,
          preservedStripeBilling: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if ("preservedExistingPlan" in result && result.preservedExistingPlan) {
      console.error(
        "[sync-revenuecat-entitlement] RC reports inactive entitlement but DB plan active with future period; left unchanged",
      );
      return new Response(
        JSON.stringify({
          success: false,
          active: false,
          preservedExisting: true,
          error:
            "Subscription sync did not show an active entitlement; your existing plan with a future period was left unchanged.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (!result.active) {
      return new Response(
        JSON.stringify({
          success: true,
          active: false,
          downgraded: result.downgraded === true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    if (body?.onboarding_prefs && typeof body.onboarding_prefs === "object") {
      try {
        await applyOnboardingPrefs(supabase, user.id, body.onboarding_prefs);
      } catch (e) {
        console.warn("[sync-revenuecat-entitlement] onboarding_prefs apply failed (non-fatal):", e);
      }
    }

    try {
      await markOnboardingSessionPaidForUser(supabase, appUserId);
    } catch (e) {
      console.warn("[sync-revenuecat-entitlement] onboarding_sessions mark paid failed (non-fatal):", e);
    }

    return new Response(JSON.stringify({ success: true, active: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in sync-revenuecat-entitlement:", error);
    const errorOrigin = req.headers.get("origin") || req.headers.get("referer") || "*";
    return new Response(
      JSON.stringify({ error: sanitizeErrorMessage(error) }),
      {
        status: 500,
        headers: { ...getCorsHeaders(errorOrigin), "Content-Type": "application/json" },
      }
    );
  }
});
