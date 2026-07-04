import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

/** Inlined: deploy bundle does not reliably include `../_shared/` (matches app embody slug set). */
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

const SHELL_APPEARANCES = ["light", "dark"] as const;

function pickShellAppearance(value: unknown): string | null {
  return typeof value === "string" && (SHELL_APPEARANCES as readonly string[]).includes(value) ? value : null;
}

type ActivationProfile = {
  firstName?: string | null;
  username?: string | null;
  emailMarketingConsent?: boolean | null;
  smsMarketingConsent?: boolean | null;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) throw new Error("STRIPE_SECRET_KEY is not configured");

    const supabase = createClient(supabaseUrl, serviceKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const user = userData.user;

    const { sessionId, resumeToken, checkoutSessionId, profile } = await req.json();
    if (!sessionId || !resumeToken) {
      return new Response(JSON.stringify({ error: "Missing sessionId or resumeToken" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const resumeTokenHash = await sha256Hex(String(resumeToken));

    const { data: obSession, error: obErr } = await supabase
      .from("onboarding_sessions")
      .select(
        "id,resume_token_hash,status,email,first_name,username,email_consent,sms_consent,shell_appearance,onboarding_answers,selected_tier,billing,stripe_checkout_session_id,stripe_customer_id,stripe_customer_email,stripe_subscription_id,paid_at,user_id",
      )
      .eq("id", String(sessionId))
      .maybeSingle();

    if (obErr || !obSession) {
      return new Response(JSON.stringify({ error: "Onboarding session not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (obSession.resume_token_hash !== resumeTokenHash) {
      return new Response(JSON.stringify({ error: "Invalid session token" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent a paid session from being claimed by a different user once linked
    // But allow idempotent claims by the same user (in case of retries or partial completions)
    if (obSession.user_id) {
      if (obSession.user_id !== user.id) {
        console.error("Session already claimed by different user", {
          sessionUserId: obSession.user_id,
          currentUserId: user.id,
          sessionId: sessionId
        });
        return new Response(JSON.stringify({ error: "Session already claimed by another user" }), {
          status: 409,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      } else {
        // Session already claimed by this user - allow idempotent completion
        console.log("Session already claimed by this user, completing activation idempotently", {
          userId: user.id,
          sessionId: sessionId,
          sessionStatus: obSession.status
        });
      }
    }

    const csId = String(checkoutSessionId || obSession.stripe_checkout_session_id || "");
    if (!csId) {
      return new Response(JSON.stringify({ error: "Missing Stripe checkout session id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch Stripe checkout session (authoritative) and verify it belongs to this onboarding session
    const csResp = await fetch(`https://api.stripe.com/v1/checkout/sessions/${csId}`, {
      headers: { Authorization: `Bearer ${stripeSecretKey}` },
    });

    if (!csResp.ok) {
      const txt = await csResp.text();
      console.error("Stripe checkout session fetch failed:", txt);
      return new Response(JSON.stringify({ error: "Unable to verify payment" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cs = await csResp.json();
    const clientRef = cs.client_reference_id;
    if (clientRef && String(clientRef) !== String(sessionId)) {
      return new Response(JSON.stringify({ error: "Checkout session does not match onboarding session" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const checkoutOk =
      cs.payment_status === "paid" ||
      (cs.mode === "subscription" && cs.payment_status === "no_payment_required");
    if (!checkoutOk) {
      return new Response(JSON.stringify({ error: "Payment not completed" }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const customerId: string | null = typeof cs.customer === "string" ? cs.customer : cs.customer?.id || null;
    const subscriptionId: string | null =
      typeof cs.subscription === "string" ? cs.subscription : cs.subscription?.id || null;

    const tierFromStripe = cs.metadata?.tier as "basic" | "plus" | "premium" | undefined;
    const billingFromStripe = cs.metadata?.billing as "monthly" | "annual" | undefined;
    const tier = (obSession.selected_tier || tierFromStripe) as "basic" | "plus" | "premium" | null;
    const billing = (obSession.billing || billingFromStripe) as "monthly" | "annual" | null;

    if (!tier || !["basic", "plus", "premium"].includes(tier)) {
      return new Response(JSON.stringify({ error: "Missing tier" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Determine current_period_end (for subscription mode)
    let currentPeriodEndIso: string | null = null;
    let subscriptionStatus: string | null = null;
    let subscriptionOnTrial = false;
    let subscriptionHadTrial = false;

    if (subscriptionId) {
      const subResp = await fetch(`https://api.stripe.com/v1/subscriptions/${subscriptionId}`, {
        headers: { Authorization: `Bearer ${stripeSecretKey}` },
      });

      if (subResp.ok) {
        const sub = await subResp.json();
        subscriptionStatus = sub.status || null;
        subscriptionOnTrial = sub.status === "trialing";
        subscriptionHadTrial = typeof sub.trial_start === "number" && sub.trial_start > 0;
        if (sub.current_period_end) {
          currentPeriodEndIso = new Date(sub.current_period_end * 1000).toISOString();
        }
      }
    } else if (billing === "annual") {
      // Fallback for one-time annual (not expected in current setup, but safe)
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
      currentPeriodEndIso = periodEnd.toISOString();
    }

    const paidAtIso = obSession.paid_at ? new Date(obSession.paid_at).toISOString() : new Date().toISOString();
    const customerEmail =
      obSession.stripe_customer_email || cs.customer_details?.email || cs.customer_email || null;

    // 1) Attach onboarding session to user + persist stripe linkage (idempotent)
    const { error: attachErr } = await supabase
      .from("onboarding_sessions")
      .update({
        user_id: user.id,
        status: "active",
        stripe_checkout_session_id: csId,
        stripe_customer_id: customerId,
        stripe_customer_email: customerEmail,
        stripe_subscription_id: subscriptionId,
        paid_at: obSession.paid_at || paidAtIso,
        selected_tier: tier,
        billing: billing,
      })
      .eq("id", String(sessionId));

    if (attachErr) {
      console.error("Error attaching onboarding session:", attachErr);
      return new Response(JSON.stringify({ error: "Failed to activate session" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Upsert entitlement (user_plans is the gating source of truth)
    const planStatus =
      subscriptionStatus === "trialing"
        ? "trialing"
        : subscriptionStatus === "past_due"
          ? "past_due"
          : subscriptionStatus === "canceled"
            ? "canceled"
            : "active";

    // Upsert user_plans - don't include id, let PostgreSQL generate it via DEFAULT
    // The onConflict uses user_id (which has UNIQUE constraint) to match existing rows
    const { error: planErr } = await supabase
      .from("user_plans")
      .upsert(
        {
          user_id: user.id,
          tier,
          billing_period: billing ?? "monthly",
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          last_payment_source: "stripe",
          status: planStatus,
          on_trial: subscriptionOnTrial,
          had_trial: subscriptionHadTrial || subscriptionOnTrial,
          current_period_end: currentPeriodEndIso,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "user_id" },
      );

    if (planErr) {
      console.error("Error upserting user_plans:", planErr);
      return new Response(JSON.stringify({ error: "Failed to activate plan" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 3) Persist onboarding data into canonical user tables
    const activationProfile = (profile || {}) as ActivationProfile;

    // Legacy JSON (e.g. support_focus) — keep on profiles.onboarding_answers where that column exists
    const mergedOnboardingAnswers: Record<string, unknown> =
      obSession.onboarding_answers && typeof obSession.onboarding_answers === "object" &&
        obSession.onboarding_answers !== null
        ? { ...(obSession.onboarding_answers as Record<string, unknown>) }
        : {};
    const legacySetupAppearance = pickShellAppearance(mergedOnboardingAnswers["setup_appearance"]);
    delete mergedOnboardingAnswers["setup_appearance"];

    const legacyJourney =
      mergedOnboardingAnswers &&
      typeof mergedOnboardingAnswers === "object" &&
      Object.prototype.hasOwnProperty.call(mergedOnboardingAnswers, "setup_journey_v1")
        ? (mergedOnboardingAnswers as Record<string, unknown>).setup_journey_v1
        : null;

    // profiles: update (or insert if missing)
    // Use first_name from onboarding_sessions if not provided in profile
    const finalFirstName = activationProfile.firstName || obSession.first_name || null;
    // Use username from onboarding_sessions column if not provided in profile
    const finalUsername = activationProfile.username || obSession.username || null;
    // Use consents from onboarding_sessions columns if not provided in profile
    const finalEmailConsent = activationProfile.emailMarketingConsent ?? obSession.email_consent ?? false;
    const finalSmsConsent = activationProfile.smsMarketingConsent ?? obSession.sms_consent ?? false;

    // Routine reminders + app notifications are applied via sync-revenuecat-entitlement
    // (gatherOnboardingPrefs from setup draft). This legacy Stripe Checkout claim path does not write them.

    try {
      await supabase.from("profiles").upsert(
        {
          id: user.id,
          first_name: finalFirstName,
          username: finalUsername,
          onboarding_answers: mergedOnboardingAnswers,
        },
        { onConflict: "id" },
      );
    } catch (e) {
      console.warn("Non-fatal: failed to upsert profiles:", e);
    }

    // Normalized setup path → user_setup_path. Anonymous answers usually live on
    // onboarding_sessions.onboarding_answers (setup_path_v1 / setup_journey_v1); optional
    // onboarding_session_setup row is read first when that table exists.
    let embodyForUserPrefs: string[] | null = null;
    try {
      const { data: sessionPath, error: sessionPathErr } = await supabase
        .from("onboarding_session_setup")
        .select("*")
        .eq("onboarding_session_id", String(sessionId))
        .maybeSingle();

      if (sessionPathErr) {
        console.warn("onboarding_session_setup read skipped:", sessionPathErr.message);
      }

      let pathPayload: Record<string, unknown> | null = null;

      if (!sessionPathErr && sessionPath && typeof sessionPath === "object") {
        const sp = sessionPath as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof sp.first_name === "string" ? sp.first_name : null,
          email: typeof sp.email === "string" ? sp.email : null,
          desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
          desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
          why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
          current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
          desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
          tool_preferences: Array.isArray(sp.tool_preferences) ? sp.tool_preferences : [],
          conditional_specificity:
            sp.conditional_specificity && typeof sp.conditional_specificity === "object" &&
              sp.conditional_specificity !== null
              ? sp.conditional_specificity
              : {},
          embody_active_practices: normalizeEmbodyActivePractices(sp.embody_active_practices),
        };
      } else if (legacyJourney && typeof legacyJourney === "object") {
        const j = legacyJourney as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof j.firstName === "string" ? j.firstName : null,
          email: typeof j.email === "string" ? j.email : null,
          desire_category: typeof j.desireCategory === "string" ? j.desireCategory : null,
          desire_text: typeof j.desireText === "string" ? j.desireText : null,
          why_it_matters: typeof j.whyItMatters === "string" ? j.whyItMatters : null,
          current_friction: typeof j.currentFriction === "string" ? j.currentFriction : null,
          desired_identity: typeof j.desiredIdentity === "string" ? j.desiredIdentity : null,
          tool_preferences: Array.isArray(j.toolPreferences)
            ? (j.toolPreferences as unknown[]).filter((x): x is string => typeof x === "string")
            : [],
          conditional_specificity:
            j.conditionalSpecificity && typeof j.conditionalSpecificity === "object" && j.conditionalSpecificity !== null
              ? j.conditionalSpecificity
              : {},
          embody_active_practices: normalizeEmbodyActivePractices(
            (j as Record<string, unknown>).embody_active_practices ??
              (j as Record<string, unknown>).embodyActivePractices,
          ),
        };
      } else if (
        typeof mergedOnboardingAnswers.setup_path_v1 === "object" &&
        mergedOnboardingAnswers.setup_path_v1 !== null
      ) {
        const sp = mergedOnboardingAnswers.setup_path_v1 as Record<string, unknown>;
        pathPayload = {
          user_id: user.id,
          first_name: typeof sp.first_name === "string" ? sp.first_name : null,
          email: typeof sp.email === "string" ? sp.email : null,
          desire_category: typeof sp.desire_category === "string" ? sp.desire_category : null,
          desire_text: typeof sp.desire_text === "string" ? sp.desire_text : null,
          why_it_matters: typeof sp.why_it_matters === "string" ? sp.why_it_matters : null,
          current_friction: typeof sp.current_friction === "string" ? sp.current_friction : null,
          desired_identity: typeof sp.desired_identity === "string" ? sp.desired_identity : null,
          tool_preferences: Array.isArray(sp.tool_preferences) ? sp.tool_preferences : [],
          conditional_specificity:
            sp.conditional_specificity && typeof sp.conditional_specificity === "object" &&
              sp.conditional_specificity !== null
              ? sp.conditional_specificity
              : {},
          embody_active_practices: normalizeEmbodyActivePractices(sp.embody_active_practices),
        };
      }

      if (pathPayload) {
        embodyForUserPrefs = normalizeEmbodyActivePractices(pathPayload.embody_active_practices);
        const { error: pathUpsertErr } = await supabase
          .from("user_setup_path")
          .upsert(pathPayload, { onConflict: "user_id" });
        if (pathUpsertErr) {
          console.warn("Non-fatal: user_setup_path upsert failed:", pathUpsertErr);
        }
      }
    } catch (pathErr) {
      console.warn("Non-fatal: user_setup_path copy skipped:", pathErr);
    }

    // user_preferences: comms prefs + embody (from same pathPayload as user_setup_path)
    try {
      const prefRow: Record<string, unknown> = {
        user_id: user.id,
        texts_enabled: finalSmsConsent,
        preferred_send_window: "both",
        email_marketing: finalEmailConsent,
      };
      if (embodyForUserPrefs) prefRow.embody_active_practices = embodyForUserPrefs;

      await supabase.from("user_preferences").upsert(prefRow, { onConflict: "user_id" });
    } catch (e) {
      console.warn("Non-fatal: failed to upsert user_preferences:", e);
    }

    return new Response(JSON.stringify({ success: true, tier }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Unhandled error in claim-onboarding-session:", e);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

