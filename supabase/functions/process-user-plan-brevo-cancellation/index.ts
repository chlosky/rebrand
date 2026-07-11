/**
 * Server-only Brevo cancellation list worker (Supabase cron + CRON_SECRET).
 * Not imported or invoked from the web/mobile app build.
 * Email: optional when BREVO_CANCELLATION_TEMPLATE_ID is set (not required yet).
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
/** Brevo cancellations list (#8). Override with BREVO_CANCELLATION_LIST_ID secret. */
const BREVO_CANCELLATION_LIST_ID_DEFAULT = 8;

function isEnabledFlag(value: string | null | undefined): boolean {
  if (!value) return true;
  const s = value.trim().toLowerCase();
  if (s === "false" || s === "0" || s === "no" || s === "off") return false;
  return s === "true" || s === "1" || s === "yes" || s === "on";
}

function resolveCancellationTemplateId(locale: AppLocale, defaultTemplateId: number): number {
  if (locale === "es-419") {
    const raw = Deno.env.get("BREVO_CANCELLATION_TEMPLATE_ID_ES_419");
    const id = raw ? Number(raw) : NaN;
    if (Number.isFinite(id) && id > 0) return id;
  }
  if (locale === "pt-BR") {
    const raw = Deno.env.get("BREVO_CANCELLATION_TEMPLATE_ID_PT_BR");
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
      console.error("[process-user-plan-brevo-cancellation] CRON_SECRET not configured");
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

    const envEnabled = isEnabledFlag(Deno.env.get("BREVO_CANCELLATION_ENABLED"));
    const enabled = typeof body.enabled === "boolean" ? body.enabled : envEnabled;
    const dryRun = body.dryRun === true;

    if (!enabled) {
      console.log("[process-user-plan-brevo-cancellation] disabled (BREVO_CANCELLATION_ENABLED or body.enabled)");
      return new Response(
        JSON.stringify({
          success: true,
          enabled: false,
          processed: 0,
          failed: 0,
          message:
            "Brevo cancellation sync is off. Set BREVO_CANCELLATION_ENABLED=false to disable; omit or set true to enable.",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    if (!brevoApiKey) {
      console.error("[process-user-plan-brevo-cancellation] BREVO_API_KEY not configured");
      return new Response(JSON.stringify({ error: "Brevo not configured" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listIdRaw = Deno.env.get("BREVO_CANCELLATION_LIST_ID");
    const cancellationListId = listIdRaw ? Number(listIdRaw) : BREVO_CANCELLATION_LIST_ID_DEFAULT;
    if (!Number.isFinite(cancellationListId) || cancellationListId <= 0) {
      console.error("[process-user-plan-brevo-cancellation] invalid BREVO_CANCELLATION_LIST_ID");
      return new Response(JSON.stringify({ error: "Invalid BREVO_CANCELLATION_LIST_ID" }), {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const templateIdRaw = Deno.env.get("BREVO_CANCELLATION_TEMPLATE_ID");
    const cancellationTemplateId = templateIdRaw ? Number(templateIdRaw) : NaN;
    const sendEmail = Number.isFinite(cancellationTemplateId) && cancellationTemplateId > 0;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const nowIso = new Date().toISOString();
    const { data: queueRows, error: queueErr } = await supabase
      .from("user_plan_brevo_cancellation_queue")
      .select("user_id, send_after, preferred_locale")
      .lte("send_after", nowIso)
      .order("send_after", { ascending: true })
      .limit(BATCH_SIZE);

    if (queueErr) {
      console.error("[process-user-plan-brevo-cancellation] queue select:", queueErr);
      return new Response(JSON.stringify({ error: queueErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!queueRows?.length) {
      return new Response(
        JSON.stringify({ success: true, enabled: true, dryRun, processed: 0, failed: 0, emailSent: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    let processed = 0;
    let failed = 0;
    let emailSent = 0;

    for (const row of queueRows) {
      const userId = row.user_id as string;

      const { data: planRow } = await supabase
        .from("user_plans")
        .select("status, brevo_cancellation_list_synced_at")
        .eq("user_id", userId)
        .maybeSingle();

      if (planRow?.brevo_cancellation_list_synced_at) {
        await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
        continue;
      }

      if (planRow?.status !== "canceled") {
        await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
        continue;
      }

      let userEmail: string | null = null;
      try {
        const { data: authData, error: authErr } = await supabase.auth.admin.getUserById(userId);
        if (authErr || !authData?.user?.email) {
          console.error("[process-user-plan-brevo-cancellation] no email for user:", userId, authErr);
          await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
          failed += 1;
          continue;
        }
        userEmail = authData.user.email.trim();
      } catch (e) {
        console.error("[process-user-plan-brevo-cancellation] auth lookup failed:", userId, e);
        await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
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
        console.log(
          "[process-user-plan-brevo-cancellation] dryRun would sync list:",
          cancellationListId,
          userEmail,
          userId,
          sendEmail ? "with email" : "list only",
        );
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
        listIds: [cancellationListId],
      };

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
        console.error(
          "[process-user-plan-brevo-cancellation] Brevo contact failed (not retrying):",
          userId,
          contactRes.status,
          contactErr,
        );
        await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
        failed += 1;
        continue;
      }

      if (sendEmail) {
        const emailPayload: Record<string, unknown> = {
          templateId: resolveCancellationTemplateId(preferredLocale, cancellationTemplateId),
          to: [{ email: userEmail, name: firstName !== "there" ? firstName : undefined }],
          params: {
            FIRSTNAME: firstName,
            name: firstName,
          },
          tags: ["cancellation", "paywall"],
        };

        const fromEmail = Deno.env.get("BREVO_AUTH_FROM_EMAIL")?.trim();
        const fromName = Deno.env.get("BREVO_AUTH_FROM_NAME")?.trim() || "Palette Plotting";
        if (fromEmail) {
          emailPayload.sender = { email: fromEmail, name: fromName };
        }

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
          console.error(
            "[process-user-plan-brevo-cancellation] Brevo email failed (not retrying):",
            userId,
            emailRes.status,
            emailErr,
          );
          await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
          failed += 1;
          continue;
        }
        emailSent += 1;
      }

      const syncedAt = new Date().toISOString();
      const { error: claimErr } = await supabase
        .from("user_plans")
        .update({ brevo_cancellation_list_synced_at: syncedAt })
        .eq("user_id", userId)
        .is("brevo_cancellation_list_synced_at", null);

      if (claimErr) {
        console.warn("[process-user-plan-brevo-cancellation] claim error:", userId, claimErr);
      }

      await supabase.from("user_plan_brevo_cancellation_queue").delete().eq("user_id", userId);
      processed += 1;
    }

    return new Response(
      JSON.stringify({
        success: true,
        enabled: true,
        dryRun,
        processed,
        failed,
        emailSent,
        queued: queueRows.length,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("[process-user-plan-brevo-cancellation] unexpected:", e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
