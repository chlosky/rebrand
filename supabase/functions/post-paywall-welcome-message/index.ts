/**
 * Idempotent programmatic welcome message in Chat (character_messages) after paywall provisioning.
 * No LLM — fixed template from setup path + guide preference.
 *
 * Auth: Bearer JWT (anon client + auth.getUser()).
 * Write: service role (RLS allows only service_role to INSERT character_messages).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { displayLabelForCanonical } from "../_shared/supportCategories.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const WELCOME_METADATA_SOURCE = "post_paywall_welcome";

const SUPPORT_CATEGORY_NAMES = new Set([
  "Career",
  "Business",
  "Learning",
  "Finances",
  "Productivity",
  "Organization",
  "Confidence",
  "Self-Love",
  "Connections",
  "Fitness",
  "Nutrition",
  "Discipline",
]);

/** Mirrors `src/lib/postPaywallProvisioning.ts` */
const DESIRE_SETUP_KEY_TO_CATEGORY: Record<string, string> = {
  sp_love: "Self-Love",
  money_wealth: "Finances",
  self_concept: "Confidence",
  beauty_self_image: "Self-Love",
  career_success: "Career",
  peace_detachment: "Confidence",
  multiple: "Productivity",
  custom: "Productivity",
};

function mapDesireSetupKeyToWeeklyCategory(desireCategory?: string | null): string {
  const raw = (desireCategory || "").trim();
  if (SUPPORT_CATEGORY_NAMES.has(raw)) return raw;
  const mapped = DESIRE_SETUP_KEY_TO_CATEGORY[raw];
  const category = mapped && SUPPORT_CATEGORY_NAMES.has(mapped) ? mapped : "Confidence";
  return category;
}

const GUIDE_DISPLAY: Record<string, string> = {
  river: "River",
  sage: "Sage",
  rose: "Rose",
  oliver: "Oliver",
};

function resolveCharacter(char: string | null | undefined): keyof typeof GUIDE_DISPLAY {
  const c = String(char || "river").toLowerCase();
  if (c === "river" || c === "sage" || c === "rose" || c === "oliver") return c;
  return "river";
}

function buildWelcomeText(params: {
  firstName: string;
  guideName: string;
  categoryLabel: string;
  desireFocusLabel: string;
}): string {
  const { firstName, guideName, categoryLabel, desireFocusLabel } = params;
  return [
    `Hi ${firstName} — I'm ${guideName}, and your ${categoryLabel} path is ready.`,
    `I used what you shared about ${desireFocusLabel} to prepare your first affirmations, subliminal draft, mirror work, and belief-work starting point.`,
    "Start with the tool that feels strongest today, then let the rest of the stack reinforce the same assumption.",
    "Come to me anytime you want help with affirmations, subliminal settings, belief work, or staying in your new story.",
  ].join("\n\n");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user?.id) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const admin = createClient(supabaseUrl, serviceKey);

    const { data: existing } = await admin
      .from("character_messages")
      .select("id")
      .eq("user_id", userId)
      .eq("message_type", "chat")
      .contains("metadata", { source: WELCOME_METADATA_SOURCE })
      .maybeSingle();

    if (existing?.id) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: "already_welcomed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const [{ data: setup }, { data: prefs }] = await Promise.all([
      admin
        .from("user_setup_path")
        .select("first_name, desire_category")
        .eq("user_id", userId)
        .maybeSingle(),
      admin.from("user_preferences").select("selected_character").eq("user_id", userId).maybeSingle(),
    ]);

    const firstRaw = setup?.first_name;
    const firstName =
      typeof firstRaw === "string" && firstRaw.trim().length > 0 ? firstRaw.trim() : "there";

    const weekly = mapDesireSetupKeyToWeeklyCategory(setup?.desire_category);
    const categoryLabel = displayLabelForCanonical(weekly) || weekly;
    const desireFocusLabel = categoryLabel;

    const charId = resolveCharacter(prefs?.selected_character);
    const guideName = GUIDE_DISPLAY[charId];
    const messageText = buildWelcomeText({
      firstName,
      guideName,
      categoryLabel,
      desireFocusLabel,
    });

    const { error: insErr } = await admin.from("character_messages").insert({
      user_id: userId,
      character_type: charId,
      message_text: messageText,
      message_type: "chat",
      is_sent: true,
      sent_at: new Date().toISOString(),
      metadata: { is_user: false, source: WELCOME_METADATA_SOURCE },
    });

    if (insErr) {
      console.error("[post-paywall-welcome-message] insert:", insErr);
      return new Response(JSON.stringify({ error: "Failed to save welcome message" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true, skipped: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[post-paywall-welcome-message]", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
