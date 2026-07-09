import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SIGNUP_SOURCES = new Set(["homepage", "footer", "product_page", "digital_guide"]);
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readAllowedHosts(): string[] {
  const base = [
    "paletteplot.com",
    "www.paletteplot.com",
    "tool.paletteplot.com",
    "localhost",
    "127.0.0.1",
  ];
  const extra = Deno.env.get("NEWSLETTER_SUBSCRIBE_ALLOWED_HOSTS")?.trim();
  if (!extra) return base;
  return [
    ...base,
    ...extra.split(",").map((h) => h.trim().toLowerCase()).filter(Boolean),
  ];
}

function isAllowedOrigin(req: Request): boolean {
  const origin = req.headers.get("origin")?.trim() ?? "";
  const referer = req.headers.get("referer")?.trim() ?? "";
  const allowedHosts = readAllowedHosts();
  for (const url of [origin, referer]) {
    if (!url) continue;
    try {
      const host = new URL(url).hostname.toLowerCase();
      if (allowedHosts.some((h) => host === h || host.endsWith(`.${h}`))) return true;
    } catch {
      /* ignore */
    }
  }
  return false;
}

function tagsForSource(source: string) {
  return {
    tag_palette_letter: true,
    tag_palette_plotting_interest: true,
    tag_board_interest: source === "product_page",
    tag_digital_system_interest: source === "digital_guide",
    tag_general_interest: source === "homepage" || source === "footer",
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ ok: false, error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAllowedOrigin(req)) {
    return new Response(JSON.stringify({ ok: false, error: "forbidden" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: {
    email?: string;
    firstName?: string;
    source?: string;
    pagePath?: string;
  } = {};

  try {
    body = (await req.json()) as typeof body;
  } catch {
    return new Response(JSON.stringify({ ok: false, error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const source = typeof body.source === "string" ? body.source.trim() : "homepage";
  const firstName =
    typeof body.firstName === "string" && body.firstName.trim()
      ? body.firstName.trim().slice(0, 80)
      : null;
  const pagePath =
    typeof body.pagePath === "string" && body.pagePath.trim()
      ? body.pagePath.trim().slice(0, 240)
      : null;

  if (!EMAIL_RE.test(email)) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_email" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!SIGNUP_SOURCES.has(source)) {
    return new Response(JSON.stringify({ ok: false, error: "invalid_source" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ ok: false, error: "not_configured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const now = new Date().toISOString();
  const tags = tagsForSource(source);

  const { data: existing } = await supabase
    .from("palette_plot_letter_subscribers")
    .select("id, tag_board_interest, tag_digital_system_interest, tag_general_interest")
    .eq("email", email)
    .maybeSingle();

  const row = {
    email,
    first_name: firstName,
    signup_source: source,
    signup_page_path: pagePath,
    marketing_consent: true,
    consent_recorded_at: now,
    updated_at: now,
    tag_palette_letter: true,
    tag_palette_plotting_interest: true,
    tag_board_interest: existing?.tag_board_interest || tags.tag_board_interest,
    tag_digital_system_interest:
      existing?.tag_digital_system_interest || tags.tag_digital_system_interest,
    tag_general_interest: existing?.tag_general_interest || tags.tag_general_interest,
  };

  const { error: upsertError } = await supabase
    .from("palette_plot_letter_subscribers")
    .upsert(row, { onConflict: "email" });

  if (upsertError) {
    console.error("[subscribe-palette-letter] upsert failed:", upsertError);
    return new Response(JSON.stringify({ ok: false, error: "save_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const brevoApiKey = Deno.env.get("BREVO_API_KEY")?.trim();
  const listIdRaw = Deno.env.get("BREVO_PALETTE_LETTER_LIST_ID");
  const listId = listIdRaw ? Number(listIdRaw) : NaN;

  if (brevoApiKey) {
    const contactPayload: Record<string, unknown> = {
      email,
      updateEnabled: true,
    };
    if (firstName) {
      contactPayload.attributes = { FIRSTNAME: firstName };
    }
    if (Number.isFinite(listId) && listId > 0) {
      contactPayload.listIds = [listId];
    }

    try {
      const contactRes = await fetch("https://api.brevo.com/v3/contacts", {
        method: "POST",
        headers: {
          "api-key": brevoApiKey,
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(contactPayload),
      });

      if (contactRes.ok) {
        const contactJson = (await contactRes.json()) as { id?: number | string };
        await supabase
          .from("palette_plot_letter_subscribers")
          .update({
            brevo_synced_at: now,
            brevo_contact_id:
              contactJson.id !== undefined && contactJson.id !== null
                ? String(contactJson.id)
                : null,
            brevo_last_error: null,
          })
          .eq("email", email);
      } else {
        const brevoErr = await contactRes.text();
        await supabase
          .from("palette_plot_letter_subscribers")
          .update({ brevo_last_error: brevoErr.slice(0, 500) })
          .eq("email", email);
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      await supabase
        .from("palette_plot_letter_subscribers")
        .update({ brevo_last_error: message.slice(0, 500) })
        .eq("email", email);
    }
  }

  return new Response(
    JSON.stringify({
      ok: true,
      message: "You're on the list. Watch for The Palette Letter in your inbox.",
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    },
  );
});
