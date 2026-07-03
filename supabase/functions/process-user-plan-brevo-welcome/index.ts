/**
 * Server-only Brevo welcome worker (Supabase cron + CRON_SECRET).
 * Not imported or invoked from the web/mobile app build.
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { type AppLocale, resolveUserAppLocale } from "../_shared/aiLocale.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BATCH_SIZE = 25;
/** Brevo transactional template "Welcome to Palette Plotting" (#2). Override with BREVO_WELCOME_TEMPLATE_ID secret. */
const BREVO_WELCOME_TEMPLATE_ID_DEFAULT = 2;
/** Brevo paywall contacts list (#7). Override with BREVO_PAYWALL_LIST_ID secret. */
const BREVO_PAYWALL_LIST_ID_DEFAULT = 7;

function isEnabledFlag(value: string | null | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function resolveWelcomeTemplateId(locale: AppLocale, defaultTemplateId: number): number {
  if (locale === "es-419") {
    const raw = Deno.env.get("BREVO_WELCOME_TEMPLATE_ID_ES_419");
    const id = raw ? Number(raw) : NaN;
    if (Number.isFinite(id) && id > 0) return id;
  }
  if (locale === "pt-BR") {
    const raw = Deno.env.get("BREVO_WELCOME_TEMPLATE_ID_PT_BR");
    const id = raw ? Number(raw) : NaN;
    if (Number.isFinite(id) && id > 0) return id;
  }
  return defaultTemplateId;
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
      console.error("[process-user-plan-brevo-welcome] CRON_SECRET not configured");
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

    let body: { enabled?: boolean; dryRun?: boolean } = {};
    try {
      const raw = await req.text();
      if (raw && raw.trim().length > 0) {
        body = JSON.parse(raw) as { enabled?: boolean; dryRun?: boolean };
      }
    } catch {
      /* empty body is fine for cron */
    }

    const envEnabled = isEnabledFlag(Deno.env.get("BREVO_WELCOME_ENABLED"));
    const enabled = typeof body.enabled === "boolean" ? body.enabled : envEnabled;
    const dryRun = body.dryRun === true;

    if (!enabled) {
      console.log("[process-user-plan-brevo-welcome] disabled (BREVO_WELCOME_ENABLED or body.enabled)");
      return new Response(
        JSON.stringify({
          success: true,
          enabled: false,
          processed: 0,
          failed: 0,
          message:
            "Brevo welcome is off. Set BREVO_WELCOME_ENABLED=false to disable; omit or set true to enable.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("[process-user-plan-brevo-welcome] BREVO_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Brevo not configured" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateIdRaw = Deno.env.get("BREVO_WELCOME_TEMPLATE_ID");
    const templateId = templateIdRaw ? Number(templateIdRaw) : BREVO_WELCOME_TEMPLATE_ID_DEFAULT;
    if (!Number.isFinite(templateId) || templateId <= 0) {
      console.error("[process-user-plan-brevo-welcome] invalid BREVO_WELCOME_TEMPLATE_ID");
      return new Response(JSON.stringify({ error: "Invalid BREVO_WELCOME_TEMPLATE_ID" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const nowIso = new Date().toISOString();
    const { data: queueRows, error: queueErr } = await supabase
      .from("user_plan_brevo_welcome_queue")
      .select("user_id, send_after, preferred_locale")
      .lte("send_after", nowIso)
      .order("send_after", { ascending: true })
      .limit(BATCH_SIZE);

    if (queueErr) {
      console.error("[process-user-plan-brevo-welcome] queue select:", queueErr);
      return new Response(JSON.stringify({ error: queueErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!queueRows?.length) {
      return new Response(
        JSON.stringify({ success: true, enabled: true, dryRun, processed: 0, failed: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const listIdRaw = Deno.env.get("BREVO_PAYWALL_LIST_ID");
    const paywallListId = listIdRaw ? Number(listIdRaw) : BREVO_PAYWALL_LIST_ID_DEFAULT;
    const siteUrl =
      Deno.env.get("SITE_URL") || Deno.env.get("APP_URL") || "https://paletteplot.com";
    const privacyPolicyUrl = `${siteUrl.replace(/\/$/, "")}/privacy`;

    let processed = 0;
    let failed = 0;

    for (const row of queueRows) {
      const userId = row.user_id as string;

      const { data: planRow } = await supabase
        .from("user_plans")
        .select("welcome_email_sent_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (planRow?.welcome_email_sent_at) {
        await supabase.from("user_plan_brevo_welcome_queue").delete().eq("user_id", userId);
        continue;
      }

      let userEmail: string | null = null;
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(userId);
        if (authErr || !authData?.user?.email) {
          console.error("[process-user-plan-brevo-welcome] no email for user:", userId, authErr);
          await supabase.from("user_plan_brevo_welcome_queue").delete().eq("user_id", userId);
          failed += 1;
          continue;
        }
        userEmail = authData.user.email.trim();
      } catch (e) {
        console.error("[process-user-plan-brevo-welcome] auth lookup failed:", userId, e);
        await supabase.from("user_plan_brevo_welcome_queue").delete().eq("user_id", userId);
        failed += 1;
        continue;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, username")
        .eq("id", userId)
        .maybeSingle();

      const firstName =
        (typeof profile?.first_name === "string" && profile.first_name.trim()) ||
        (typeof profile?.username === "string" && profile.username.trim()) ||
        "there";

      const preferredLocale = await resolveUserAppLocale(
        supabase,
        userId,
        typeof row.preferred_locale === "string" ? row.preferred_locale : null,
      );

      if (dryRun) {
        console.log("[process-user-plan-brevo-welcome] dryRun would send to:", userEmail, userId);
        processed += 1;
        continue;
      }

      const contactPayload: Record<string, unknown> = {
        email: userEmail,
        updateEnabled: true,
        attributes: {
          FIRSTNAME: firstName,
          USER_ID: userId,
          PREFERRED_LOCALE: preferredLocale,
        },
      };
      if (Number.isFinite(paywallListId) && paywallListId > 0) {
        contactPayload.listIds = [paywallListId];
      }

      const contactRes = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(contactPayload),
      });

      if (!contactRes.ok) {
        const contactErr = await contactRes.text();
        console.error("[process-user-plan-brevo-welcome] Brevo contact failed (not retrying):", userId, contactRes.status, contactErr);
        await supabase.from("user_plan_brevo_welcome_queue").delete().eq("user_id", userId);
        failed += 1;
        continue;
      }

      const emailPayload: Record<string, unknown> = {
        templateId: resolveWelcomeTemplateId(preferredLocale, templateId),
        to: [{ email: userEmail, name: firstName !== "there" ? firstName : undefined }],
        params: {
          FIRSTNAME: firstName,
          name: firstName,
          app_url: siteUrl,
          privacy_policy_url: privacyPolicyUrl,
        },
        tags: ["welcome", "paywall"],
      };

      const emailRes = await fetch("https://api.brevo.com/v3/smtp/email", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(emailPayload),
      });

      if (!emailRes.ok) {
        const emailErr = await emailRes.text();
        console.error("[process-user-plan-brevo-welcome] Brevo email failed (not retrying):", userId, emailRes.status, emailErr);
        await supabase.from("user_plan_brevo_welcome_queue").delete().eq("user_id", userId);
        failed += 1;
        continue;
      }

      const sentAt = new Date().toISOString();
      const { data: claimed, error: claimErr } = await supabase
        .from("user_plans")
        .update({ welcome_email_sent_at: sentAt })
        .eq("user_id", userId)
        .is("welcome_email_sent_at", null)
        .select("user_id")
        .maybeSingle();

      if (claimErr || !claimed) {
        console.warn("[process-user-plan-brevo-welcome] claim race or error:", userId, claimErr);
      }

      await supabase.from("user_plan_brevo_welcome_queue").delete().eq("user_id", userId);
      processed += 1;
    }

    return new Response(
      JSON.stringify({
        success: true,
        enabled: true,
        dryRun,
        processed,
        failed,
        queued: queueRows.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[process-user-plan-brevo-welcome] unexpected:", e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
