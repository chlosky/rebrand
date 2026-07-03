import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { normalizeConditionalSpecificity } from "../_shared/conditionalSpecificityNormalize.ts";
import { attributionPatchFromClient } from "../_shared/onboardingAttribution.ts";

/** Inlined: deploy bundle does not reliably include `../_shared/` for this helper. */
const EMBODY_ACTIVE_SLUGS = new Set([
  "rest",
  "self-care",
  "clean",
  "drink-water",
  "have-fun",
  "exercise",
  "glam-up",
  "connect",
  "seen",
  "work",
]);

function normalizeEmbodyActivePractices(value: unknown): string[] | null {
  if (!Array.isArray(value) || value.length !== 5) return null;
  const cleaned: string[] = [];
  for (const x of value) {
    if (typeof x !== "string") return null;
    const s = x.trim();
    if (!EMBODY_ACTIVE_SLUGS.has(s)) return null;
    cleaned.push(s);
  }
  if (new Set(cleaned).size !== 5) return null;
  return cleaned;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(input: string) {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return toHex(new Uint8Array(digest));
}

const SHELL_APPEARANCES = new Set(["light", "dark"]);

function normalizeShellAppearance(value: unknown): string | null {
  return typeof value === "string" && SHELL_APPEARANCES.has(value) ? value : null;
}

const GUIDE_IDS = new Set(["river", "sage", "rose", "oliver"]);

function normalizeGuideCharacterId(value: unknown): string | null {
  return typeof value === "string" && GUIDE_IDS.has(value) ? value : null;
}

/** Normalized setup-path fields (mirrors app SetupDraft → DB columns). */
type SetupPathPatch = {
  first_name?: string | null;
  email?: string | null;
  desire_category?: string | null;
  desire_text?: string | null;
  why_it_matters?: string | null;
  current_friction?: string | null;
  desired_identity?: string | null;
  tool_preferences?: string[] | null;
  conditional_specificity?: Record<string, unknown> | null;
  shell_appearance?: string | null;
  guide_character_id?: string | null;
  /** Five distinct embody catalog slugs (same as `user_preferences.embody_active_practices`). */
  embody_active_practices?: string[] | null;
};

/** Deep-merge `setup_journey_v1` into session answers (alongside legacy `setup_path_v1` when used). */
function mergeSetupJourneyV1IntoOnboardingAnswers(
  sessionAnswers: unknown,
  existingPatchAnswers: unknown,
  journeySlice: Record<string, unknown>,
): Record<string, unknown> {
  const base =
    existingPatchAnswers && typeof existingPatchAnswers === "object" && existingPatchAnswers !== null
      ? { ...(existingPatchAnswers as Record<string, unknown>) }
      : sessionAnswers && typeof sessionAnswers === "object" && sessionAnswers !== null
        ? { ...(sessionAnswers as Record<string, unknown>) }
        : {};
  const prev =
    base.setup_journey_v1 && typeof base.setup_journey_v1 === "object" && base.setup_journey_v1 !== null
      ? { ...(base.setup_journey_v1 as Record<string, unknown>) }
      : {};
  base.setup_journey_v1 = { ...prev, ...journeySlice };
  return base;
}

type AllowedPatch = {
  email?: string | null;
  first_name?: string | null;
  username?: string | null;
  email_consent?: boolean | null;
  sms_consent?: boolean | null;
  app_notifications_consent?: boolean | null;
  tracking_pre_permission_choice?: string | null;
  tracking_authorization_status?: string | null;
  tracking_permission_asked_at?: string | null;
  character_id?: "river" | "sage" | "rose" | "oliver" | null;
  onboarding_answers?: Record<string, unknown>;
  selected_tier?: "basic" | "plus" | "premium" | null;
  billing?: "monthly" | "annual" | "weekly" | null;
  /** Persisted to onboarding_sessions.onboarding_answers (setup_path_v1) and, if present, onboarding_session_setup. */
  setup_path?: SetupPathPatch;
  attribution?: {
    first_touch?: Record<string, unknown> | null;
    last_touch?: Record<string, unknown> | null;
    payload?: Record<string, unknown> | null;
  };
  revenuecat_app_user_id?: string | null;
  paywall_id?: string | null;
  paywall_variant?: string | null;
  offering_id?: string | null;
  package_id?: string | null;
  product_id?: string | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { sessionId, resumeToken, patch } = await req.json();
    if (!sessionId || !resumeToken || !patch) {
      return new Response(JSON.stringify({ error: "Missing sessionId, resumeToken, or patch" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: session, error: fetchErr } = await supabase
      .from("onboarding_sessions")
      .select(
        "id, resume_token_hash, status, onboarding_answers, user_id, email, first_touch_at, first_touch_source, attribution_payload",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (fetchErr || !session) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (session.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Build safe updates only from allowed keys
    const allowedPatch = patch as AllowedPatch;
    const updates: Record<string, unknown> = {};

    if ("email" in allowedPatch) updates.email = allowedPatch.email;
    if ("first_name" in allowedPatch) updates.first_name = allowedPatch.first_name;
    if ("username" in allowedPatch) updates.username = allowedPatch.username;
    if ("email_consent" in allowedPatch) updates.email_consent = allowedPatch.email_consent;
    if ("sms_consent" in allowedPatch) updates.sms_consent = allowedPatch.sms_consent;
    if ("app_notifications_consent" in allowedPatch) {
      updates.app_notifications_consent = allowedPatch.app_notifications_consent;
    }
    if ("tracking_pre_permission_choice" in allowedPatch) {
      updates.tracking_pre_permission_choice = allowedPatch.tracking_pre_permission_choice;
    }
    if ("tracking_authorization_status" in allowedPatch) {
      updates.tracking_authorization_status = allowedPatch.tracking_authorization_status;
    }
    if ("tracking_permission_asked_at" in allowedPatch) {
      updates.tracking_permission_asked_at = allowedPatch.tracking_permission_asked_at;
    }
    if ("character_id" in allowedPatch) updates.character_id = allowedPatch.character_id;
    if ("onboarding_answers" in allowedPatch) {
      const current =
        session?.onboarding_answers && typeof session.onboarding_answers === "object" && session.onboarding_answers !== null
          ? (session.onboarding_answers as Record<string, unknown>)
          : {};
      const patchAnswers =
        allowedPatch.onboarding_answers && typeof allowedPatch.onboarding_answers === "object" &&
          allowedPatch.onboarding_answers !== null
          ? (allowedPatch.onboarding_answers as Record<string, unknown>)
          : {};
      updates.onboarding_answers = { ...current, ...patchAnswers };
    }
    if ("selected_tier" in allowedPatch) updates.selected_tier = allowedPatch.selected_tier;
    if ("billing" in allowedPatch) updates.billing = allowedPatch.billing;
    if ("revenuecat_app_user_id" in allowedPatch) {
      updates.revenuecat_app_user_id = allowedPatch.revenuecat_app_user_id;
    }
    if ("paywall_id" in allowedPatch) updates.paywall_id = allowedPatch.paywall_id;
    if ("paywall_variant" in allowedPatch) updates.paywall_variant = allowedPatch.paywall_variant;
    if ("offering_id" in allowedPatch) updates.offering_id = allowedPatch.offering_id;
    if ("package_id" in allowedPatch) updates.package_id = allowedPatch.package_id;
    if ("product_id" in allowedPatch) updates.product_id = allowedPatch.product_id;

    if ("attribution" in allowedPatch && allowedPatch.attribution) {
      const attrPatch = attributionPatchFromClient(
        session as Record<string, unknown>,
        allowedPatch.attribution,
      );
      Object.assign(updates, attrPatch);
    }

    // If the user is choosing a plan / editing plan, move to started unless already beyond paid
    // (We don't want accidental regressions from 'paid'/'active')
    if (session.status === "started" || session.status === "checkout_created") {
      // keep current
    }

    if (
      "setup_path" in allowedPatch &&
      allowedPatch.setup_path &&
      typeof allowedPatch.setup_path === "object"
    ) {
      const sp = allowedPatch.setup_path as SetupPathPatch;
      const spec =
        sp.conditional_specificity &&
        typeof sp.conditional_specificity === "object" &&
        sp.conditional_specificity !== null
          ? sp.conditional_specificity
          : {};

      const desireCatRaw = typeof sp.desire_category === "string" ? sp.desire_category : null;
      const normalizedConditional = normalizeConditionalSpecificity(spec, desireCatRaw);

      const shellAppearance = normalizeShellAppearance(sp.shell_appearance);
      const guideCharacterId = normalizeGuideCharacterId(sp.guide_character_id);
      const embodySlugs = normalizeEmbodyActivePractices(sp.embody_active_practices);

      const pathRow = {
        onboarding_session_id: String(sessionId),
        first_name: typeof sp.first_name === "string" ? sp.first_name : null,
        email: typeof sp.email === "string" ? sp.email : null,
        desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
        desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
        why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
        current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
        desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
        tool_preferences: Array.isArray(sp.tool_preferences)
          ? (sp.tool_preferences as unknown[]).filter((x): x is string => typeof x === "string")
          : [],
        conditional_specificity: normalizedConditional,
        shell_appearance: shellAppearance,
        guide_character_id: guideCharacterId,
        embody_active_practices: embodySlugs,
      };

      const journeySlice: Record<string, unknown> = {
        schema_version: 1,
        updated_at: new Date().toISOString(),
        desire_category: pathRow.desire_category,
        conditional_specificity: normalizedConditional,
      };
      if (pathRow.first_name != null) journeySlice.first_name = pathRow.first_name;
      if (pathRow.email != null) journeySlice.email = pathRow.email;
      if (pathRow.desire_text != null) journeySlice.desire_text = pathRow.desire_text;
      if (pathRow.why_it_matters != null) journeySlice.why_it_matters = pathRow.why_it_matters;
      if (pathRow.current_friction != null) journeySlice.current_friction = pathRow.current_friction;
      if (pathRow.desired_identity != null) journeySlice.desired_identity = pathRow.desired_identity;
      if (pathRow.tool_preferences.length > 0) journeySlice.tool_preferences = pathRow.tool_preferences;
      if (shellAppearance != null) journeySlice.shell_appearance = shellAppearance;
      if (guideCharacterId != null) journeySlice.guide_character_id = guideCharacterId;
      if (embodySlugs) journeySlice.embody_active_practices = embodySlugs;

      updates.shell_appearance = shellAppearance;

      const { error: pathErr } = await supabase
        .from("onboarding_session_setup")
        .upsert(pathRow, { onConflict: "onboarding_session_id" });

      if (pathErr) {
        const msg = pathErr.message || "";
        const tableMissing =
          pathErr.code === "42P01" ||
          msg.includes("does not exist") ||
          msg.includes("schema cache") ||
          msg.includes("onboarding_session_setup");
        if (tableMissing) {
          const setupPathV1: Record<string, unknown> = { ...pathRow };
          delete setupPathV1.onboarding_session_id;
          const mergedJourney = mergeSetupJourneyV1IntoOnboardingAnswers(
            session.onboarding_answers,
            updates.onboarding_answers,
            journeySlice,
          );
          updates.onboarding_answers = { ...mergedJourney, setup_path_v1: setupPathV1 };
          console.warn(
            "onboarding_session_setup unavailable; persisted setup_path to onboarding_sessions.onboarding_answers.setup_path_v1",
          );
        } else {
          console.error("onboarding_session_setup upsert error (falling back to JSON):", pathErr);
          const setupPathV1: Record<string, unknown> = { ...pathRow };
          delete setupPathV1.onboarding_session_id;
          const mergedJourney = mergeSetupJourneyV1IntoOnboardingAnswers(
            session.onboarding_answers,
            updates.onboarding_answers,
            journeySlice,
          );
          updates.onboarding_answers = { ...mergedJourney, setup_path_v1: setupPathV1 };
        }
      } else {
        updates.onboarding_answers = mergeSetupJourneyV1IntoOnboardingAnswers(
          session.onboarding_answers,
          updates.onboarding_answers,
          journeySlice,
        );
      }
    }

    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      const { data: authData } = await supabase.auth.getUser(token);
      const authUser = authData?.user;
      if (authUser?.id) {
        const sessionUserId = typeof session.user_id === "string" ? session.user_id : null;
        if (!sessionUserId || sessionUserId === authUser.id) {
          const patchEmail =
            typeof allowedPatch.email === "string" ? allowedPatch.email.trim().toLowerCase() : null;
          const sessionEmail =
            typeof session.email === "string" ? session.email.trim().toLowerCase() : null;
          const authEmail = authUser.email?.trim().toLowerCase() ?? null;
          const emailsAlign =
            !authEmail ||
            ((!patchEmail && !sessionEmail) ||
              patchEmail === authEmail ||
              sessionEmail === authEmail);
          if (emailsAlign) {
            updates.user_id = authUser.id;
          }
        }
      }
    }

    const hasSessionColumnUpdates = Object.keys(updates).length > 0;

    let updated: Record<string, unknown> | null = null;

    if (hasSessionColumnUpdates) {
      const { data: upd, error: updateErr } = await supabase
        .from("onboarding_sessions")
        .update(updates)
        .eq("id", String(sessionId))
        .select(
          "id,status,email,first_name,username,email_consent,sms_consent,app_notifications_consent,tracking_pre_permission_choice,tracking_authorization_status,tracking_permission_asked_at,character_id,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at",
        )
        .single();

      if (updateErr) {
        console.error("Error updating onboarding session:", updateErr);
        return new Response(JSON.stringify({ error: "Failed to update onboarding session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = upd as Record<string, unknown>;
    } else {
      const { data: refetch, error: refetchErr } = await supabase
        .from("onboarding_sessions")
        .select(
          "id,status,email,first_name,username,email_consent,sms_consent,app_notifications_consent,tracking_pre_permission_choice,tracking_authorization_status,tracking_permission_asked_at,character_id,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id,created_at,updated_at",
        )
        .eq("id", String(sessionId))
        .single();

      if (refetchErr) {
        console.error("Error loading onboarding session:", refetchErr);
        return new Response(JSON.stringify({ error: "Failed to load onboarding session" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      updated = refetch as Record<string, unknown>;
    }

    return new Response(JSON.stringify({ session: updated }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in update-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

