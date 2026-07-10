import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  sendTikTokServerEvent,
  TIKTOK_SERVER_EVENTS,
} from "../_shared/tiktokEventsApi.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SITE_ORIGIN = "https://paletteplotting.com";

type RequestBody = {
  event?: string;
  event_id?: string;
  url?: string;
  page_path?: string;
  content_id?: string;
  content_name?: string;
  value?: number;
  currency?: string;
  ttclid?: string;
  ttp?: string;
  client_visit_id?: string;
  referrer?: string;
};

function clientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const cfIp = req.headers.get("cf-connecting-ip")?.trim();
  if (cfIp) return cfIp;
  return null;
}

function resolvePageUrl(body: RequestBody): string {
  if (body.url && body.url.startsWith("http")) return body.url;
  const path = typeof body.page_path === "string" && body.page_path.startsWith("/")
    ? body.page_path
    : "/";
  return `${SITE_ORIGIN}${path}`;
}

async function resolveTtclid(
  supabase: ReturnType<typeof createClient>,
  body: RequestBody,
  userId: string | null,
): Promise<string | null> {
  const fromBody = typeof body.ttclid === "string" ? body.ttclid.trim() : "";
  if (fromBody) return fromBody;

  const visitId = typeof body.client_visit_id === "string" ? body.client_visit_id.trim() : "";
  if (visitId) {
    const { data } = await supabase
      .from("web_onboarding_sessions")
      .select("ttclid")
      .eq("client_visit_id", visitId)
      .maybeSingle();
    if (data?.ttclid && String(data.ttclid).trim()) {
      return String(data.ttclid).trim();
    }
  }

  if (userId) {
    const { data } = await supabase
      .from("web_onboarding_sessions")
      .select("ttclid")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data?.ttclid && String(data.ttclid).trim()) {
      return String(data.ttclid).trim();
    }
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let body: RequestBody;
  try {
    body = (await req.json()) as RequestBody;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const event = typeof body.event === "string" ? body.event.trim() : "";
  const eventId = typeof body.event_id === "string" ? body.event_id.trim() : "";

  if (!event || !TIKTOK_SERVER_EVENTS.has(event)) {
    return new Response(JSON.stringify({ error: "Unsupported event" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!eventId) {
    return new Response(JSON.stringify({ error: "event_id is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let userId: string | null = null;
  let email: string | null = null;

  const authHeader = req.headers.get("Authorization");
  if (authHeader) {
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await userClient.auth.getUser();
    if (userData?.user) {
      userId = userData.user.id;
      email = userData.user.email ?? null;
    }
  }

  const ttclid = await resolveTtclid(supabase, body, userId);
  const ttp = typeof body.ttp === "string" ? body.ttp.trim() : null;
  const userAgent = req.headers.get("user-agent");
  const ip = clientIp(req);

  const result = await sendTikTokServerEvent({
    event,
    eventId,
    email,
    externalId: userId,
    ttclid,
    ttp,
    ip,
    userAgent,
    url: resolvePageUrl(body),
    referrer: typeof body.referrer === "string" ? body.referrer : null,
    contentId: typeof body.content_id === "string" ? body.content_id : body.page_path ?? null,
    contentName: typeof body.content_name === "string" ? body.content_name : null,
    value: typeof body.value === "number" && Number.isFinite(body.value) ? body.value : null,
    currency: typeof body.currency === "string" ? body.currency : "USD",
  });

  if (!result.ok) {
    return new Response(JSON.stringify({ ok: false, detail: result.detail }), {
      status: result.detail === "missing_token" ? 503 : 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ ok: true, event, event_id: eventId }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
