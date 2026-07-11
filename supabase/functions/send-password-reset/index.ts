/**
 * Password reset via Brevo transactional template + Supabase recovery link.
 * Does not use Supabase Auth built-in recovery emails (disable those in the dashboard).
 */
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import { type AppLocale, resolveUserAppLocale } from "../_shared/aiLocale.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BREVO_PASSWORD_RESET_TEMPLATE_ID_DEFAULT = 2;

function resolvePasswordResetTemplateId(locale: AppLocale, defaultTemplateId: number): number {
  if (locale === "es-419") {
    const raw = Deno.env.get("BREVO_PASSWORD_RESET_TEMPLATE_ID_ES_419");
    const id = raw ? Number(raw) : NaN;
    if (Number.isFinite(id) && id > 0) return id;
  }
  if (locale === "pt-BR") {
    const raw = Deno.env.get("BREVO_PASSWORD_RESET_TEMPLATE_ID_PT_BR");
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
    const { email, redirectTo } = await req.json();
    const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
    if (!normalizedEmail || !normalizedEmail.includes("@")) {
      return new Response(JSON.stringify({ error: "Valid email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const templateIdRaw = Deno.env.get("BREVO_PASSWORD_RESET_TEMPLATE_ID");
    const templateId = templateIdRaw ? Number(templateIdRaw) : BREVO_PASSWORD_RESET_TEMPLATE_ID_DEFAULT;
    if (!brevoApiKey || !Number.isFinite(templateId) || templateId <= 0) {
      console.error("[send-password-reset] Brevo not configured (BREVO_API_KEY / BREVO_PASSWORD_RESET_TEMPLATE_ID)");
      return new Response(JSON.stringify({ error: "Password reset email is not configured" }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const siteUrl =
      Deno.env.get("SITE_URL") || Deno.env.get("APP_URL") || "https://paletteplotting.com";
    const resetRedirect =
      typeof redirectTo === "string" && redirectTo.startsWith("http")
        ? redirectTo
        : `${siteUrl.replace(/\/$/, "")}/reset-password`;

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: normalizedEmail,
      options: { redirectTo: resetRedirect },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.info("[send-password-reset] no recovery link (user may not exist):", linkError?.message ?? "missing link");
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let resetPasswordUrl = String(linkData.properties.action_link);
    try {
      const url = new URL(resetPasswordUrl);
      url.searchParams.set("redirect_to", resetRedirect);
      resetPasswordUrl = url.toString();
    } catch {
      /* use action_link as-is */
    }
    const userId = linkData.user?.id ?? null;
    let firstName = "there";

    if (userId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, username")
        .eq("id", userId)
        .maybeSingle();
      firstName =
        (typeof profile?.first_name === "string" && profile.first_name.trim()) ||
        (typeof profile?.username === "string" && profile.username.trim()) ||
        (typeof linkData.user?.user_metadata?.first_name === "string"
          ? linkData.user.user_metadata.first_name.trim()
          : "") ||
        "there";
    }

    const preferredLocale = userId
      ? await resolveUserAppLocale(supabase, userId, null)
      : ("en" as AppLocale);

    const emailPayload: Record<string, unknown> = {
      templateId: resolvePasswordResetTemplateId(preferredLocale, templateId),
      to: [{ email: normalizedEmail, name: firstName !== "there" ? firstName : undefined }],
      params: {
        name: firstName,
        reset_password_url: resetPasswordUrl,
      },
      tags: ["password_reset"],
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
      console.error("[send-password-reset] Brevo send failed:", emailRes.status, emailErr);
      return new Response(JSON.stringify({ error: "Could not send password reset email" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("[send-password-reset] unexpected:", e);
    return new Response(JSON.stringify({ error: "An error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
