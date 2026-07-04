import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ALLOWED_EVENT_TYPES = new Set(["page_view", "store_click"]);
const ALLOWED_STORE_TARGETS = new Set(["apple", "google", "qr_scroll"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type RequestBody = {
  event_type?: string;
  visit_id?: string;
  page_path?: string | null;
  landing_query?: string | null;
  referrer?: string | null;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  click_source?: string | null;
  store_target?: string | null;
  routed_store_url?: string | null;
  is_mobile_viewport?: boolean | null;
  device_os?: string | null;
  browser_language?: string | null;
  timezone?: string | null;
  screen_width?: number | null;
  screen_height?: number | null;
  pixel_ratio?: number | null;
  user_agent?: string | null;
  in_app_browser?: string | null;
  is_from_tiktok?: boolean | null;
};

function trimOrNull(value: unknown, max: number): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function trimText(value: unknown, max: number): string | null {
  return trimOrNull(value, max);
}

function readGeo(req: Request): { country_code: string | null; region: string | null; city: string | null } {
  const country =
    trimOrNull(req.headers.get("cf-ipcountry"), 8) ??
    trimOrNull(req.headers.get("x-vercel-ip-country"), 8);
  const region =
    trimOrNull(req.headers.get("cf-region"), 120) ??
    trimOrNull(req.headers.get("x-vercel-ip-country-region"), 120);
  const city =
    trimOrNull(req.headers.get("cf-ipcity"), 120) ??
    trimOrNull(req.headers.get("x-vercel-ip-city"), 120);
  return { country_code: country, region, city };
}

function readAllowedHosts(): string[] {
  const base = [
    "paletteplot.com",
    "www.paletteplot.com",
    "localhost",
    "127.0.0.1",
  ];
  const extra = Deno.env.get("MARKETING_HOMEPAGE_LOG_ALLOWED_HOSTS")?.trim();
  if (!extra) return base;
  const fromEnv = extra
    .split(",")
    .map((h) => h.trim().toLowerCase())
    .filter(Boolean);
  return [...base, ...fromEnv];
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

function boundedInt(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  const n = Math.round(value);
  if (n < min || n > max) return null;
  return n;
}

function boundedFloat(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  if (value < min || value > max) return null;
  return Math.round(value * 100) / 100;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "method_not_allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!isAllowedOrigin(req)) {
    return new Response(JSON.stringify({ error: "forbidden_origin" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "invalid_json" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const eventType = typeof body.event_type === "string" ? body.event_type.trim() : "";
  if (!ALLOWED_EVENT_TYPES.has(eventType)) {
    return new Response(JSON.stringify({ error: "invalid_event_type" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const visitId = typeof body.visit_id === "string" ? body.visit_id.trim() : "";
  if (!UUID_RE.test(visitId)) {
    return new Response(JSON.stringify({ error: "invalid_visit_id" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const storeTargetRaw = trimOrNull(body.store_target, 32);
  if (storeTargetRaw && !ALLOWED_STORE_TARGETS.has(storeTargetRaw)) {
    return new Response(JSON.stringify({ error: "invalid_store_target" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (eventType === "store_click" && !storeTargetRaw) {
    return new Response(JSON.stringify({ error: "store_target_required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const geo = readGeo(req);

  const row = {
    event_type: eventType,
    visit_id: visitId,
    page_path: trimText(body.page_path, 500) ?? "/",
    landing_query: trimText(body.landing_query, 2000),
    referrer: trimText(body.referrer, 2000),
    utm_source: trimText(body.utm_source, 120),
    utm_medium: trimText(body.utm_medium, 120),
    utm_campaign: trimText(body.utm_campaign, 200),
    utm_content: trimText(body.utm_content, 200),
    utm_term: trimText(body.utm_term, 200),
    click_source: eventType === "store_click" ? trimText(body.click_source, 120) : null,
    store_target: storeTargetRaw,
    routed_store_url: trimText(body.routed_store_url, 2000),
    is_mobile_viewport: typeof body.is_mobile_viewport === "boolean" ? body.is_mobile_viewport : null,
    device_os: trimText(body.device_os, 32),
    browser_language: trimText(body.browser_language, 32),
    timezone: trimText(body.timezone, 64),
    screen_width: boundedInt(body.screen_width, 0, 10000),
    screen_height: boundedInt(body.screen_height, 0, 10000),
    pixel_ratio: boundedFloat(body.pixel_ratio, 0.5, 5),
    user_agent: trimText(body.user_agent, 1000),
    in_app_browser: trimText(body.in_app_browser, 64),
    country_code: geo.country_code,
    region: geo.region,
    city: geo.city,
    is_from_tiktok: typeof body.is_from_tiktok === "boolean" ? body.is_from_tiktok : null,
  };

  const supabaseUrl = Deno.env.get("SUPABASE_URL")?.trim();
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")?.trim();
  if (!supabaseUrl || !serviceKey) {
    return new Response(JSON.stringify({ error: "server_misconfigured" }), {
      status: 503,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceKey);
  const { error } = await supabase.from("marketing_homepage_events").insert(row);

  if (error) {
    console.error("[log-marketing-homepage-event] insert failed:", error);
    return new Response(JSON.stringify({ error: "insert_failed" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
