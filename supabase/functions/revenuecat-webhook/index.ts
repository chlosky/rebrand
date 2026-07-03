import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";
import {
  fetchRevenueCatSubscriber,
  syncUserPlansFromRevenueCatPayload,
} from "../_shared/revenuecatUserPlansSync.ts";
import { getRevenueCatServerSecretKey } from "../_shared/revenueCatSecretEnv.ts";
import {
  revenueCatEventIsWebInitialPurchase,
  sendTikTokServerEvent,
  tikTokEventIdFromRevenueCatEvent,
} from "../_shared/tiktokEventsApi.ts";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function collectAppUserIdsFromEvent(event: Record<string, unknown>): string[] {
  const type = typeof event.type === "string" ? event.type : "";
  const out: string[] = [];

  if (type === "TRANSFER") {
    const from = event.transferred_from;
    const to = event.transferred_to;
    if (Array.isArray(from)) {
      for (const x of from) {
        if (typeof x === "string" && x) out.push(x);
      }
    }
    if (Array.isArray(to)) {
      for (const x of to) {
        if (typeof x === "string" && x) out.push(x);
      }
    }
    return out;
  }

  if (typeof event.app_user_id === "string" && event.app_user_id) out.push(event.app_user_id);
  if (typeof event.original_app_user_id === "string" && event.original_app_user_id) {
    out.push(event.original_app_user_id);
  }
  const aliases = event.aliases;
  if (Array.isArray(aliases)) {
    for (const a of aliases) {
      if (typeof a === "string" && a) out.push(a);
    }
  }
  return out;
}

function isSupabaseStyleUserId(id: string): boolean {
  return UUID_RE.test(id.trim());
}

async function maybeMarkOnboardingSessionPaidForRcWeb(
  supabase: ReturnType<typeof createClient>,
  appUserId: string,
  event: Record<string, unknown>,
): Promise<void> {
  if (!revenueCatEventIsWebInitialPurchase(event)) return;

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

  if (!sessionRow?.id) {
    console.log("[revenuecat-webhook] onboarding_sessions: no row to mark paid", { appUserId });
    return;
  }

  if (sessionRow.user_id && sessionRow.user_id !== appUserId) {
    console.warn("[revenuecat-webhook] onboarding_sessions: user_id mismatch", {
      sessionId: sessionRow.id,
      sessionUserId: sessionRow.user_id,
      appUserId,
    });
    return;
  }

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
    console.warn("[revenuecat-webhook] onboarding_sessions mark paid failed", error.message, {
      sessionId: sessionRow.id,
      appUserId,
    });
  } else {
    console.log("[revenuecat-webhook] onboarding_sessions marked paid", {
      sessionId: sessionRow.id,
      appUserId,
      previousStatus: sessionRow.status,
    });
  }
}

async function maybeSendTikTokCompletePayment(
  supabase: ReturnType<typeof createClient>,
  event: Record<string, unknown>,
  appUserId: string,
): Promise<void> {
  if (!revenueCatEventIsWebInitialPurchase(event)) return;

  let email: string | null = null;
  try {
    const { data, error } = await supabase.auth.admin.getUserById(appUserId);
    if (!error && data?.user?.email) {
      email = data.user.email;
    }
  } catch (err) {
    console.warn("[revenuecat-webhook] TikTok: auth lookup failed", err);
  }

  let ttclid: string | null = null;
  try {
    const { data: visitRow } = await supabase
      .from("web_onboarding_sessions")
      .select("ttclid")
      .eq("user_id", appUserId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (visitRow?.ttclid && String(visitRow.ttclid).trim()) {
      ttclid = String(visitRow.ttclid).trim();
    }
  } catch (err) {
    console.warn("[revenuecat-webhook] TikTok: web onboarding lookup failed", err);
  }

  const price = typeof event.price_in_purchased_currency === "number"
    ? event.price_in_purchased_currency
    : typeof event.price === "number"
    ? event.price
    : null;
  const currency = typeof event.currency === "string" ? event.currency : "USD";
  const eventTimeMs = typeof event.event_timestamp_ms === "number"
    ? event.event_timestamp_ms
    : Date.now();

  const tiktok = await sendTikTokServerEvent({
    event: "Purchase",
    eventId: tikTokEventIdFromRevenueCatEvent(event),
    eventTimeSec: Math.floor(eventTimeMs / 1000),
    email,
    externalId: appUserId,
    ttclid,
    url: "https://paletteplot.com/onboarding/web-paywall",
    contentId: "/onboarding/web-paywall",
    contentName: "web_revenuecat_paywall",
    value: price,
    currency,
  });

  if (!tiktok.ok) {
    console.warn("[revenuecat-webhook] TikTok Purchase not sent", tiktok.detail, {
      appUserId,
      rcEventId: event.id,
    });
  } else {
    console.log("[revenuecat-webhook] TikTok Purchase sent", {
      appUserId,
      eventId: tikTokEventIdFromRevenueCatEvent(event),
    });
  }
}

/**
 * Must match the Authorization header value configured in RevenueCat → Integrations → Webhooks (exact string).
 */
function webhookAuthValid(req: Request): boolean {
  const expected = Deno.env.get("REVENUECAT_WEBHOOK_AUTHORIZATION");
  if (!expected || expected.trim() === "") {
    console.error("[revenuecat-webhook] REVENUECAT_WEBHOOK_AUTHORIZATION is not set");
    return false;
  }
  const got = req.headers.get("Authorization")?.trim() ?? "";
  return got === expected.trim();
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!webhookAuthValid(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  const secretKey = getRevenueCatServerSecretKey();
  if (!secretKey || !secretKey.startsWith("sk_")) {
    console.error(
      "[revenuecat-webhook] RevenueCat server secret missing or invalid (set REVENUECAT_SECRET_KEY or revenuecat_secret_key to sk_...)"
    );
    return new Response(JSON.stringify({ error: "Server misconfigured" }), {
      status: 501,
      headers: { "Content-Type": "application/json" },
    });
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const root = payload as Record<string, unknown>;
  const event = (root.event && typeof root.event === "object" && root.event !== null
    ? root.event
    : root) as Record<string, unknown>;

  const eventType = typeof event.type === "string" ? event.type : "";
  if (eventType === "TEST") {
    return new Response(JSON.stringify({ ok: true, ignored: "TEST" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const rawIds = collectAppUserIdsFromEvent(event);
  const userIds = [...new Set(rawIds.filter(isSupabaseStyleUserId))];

  if (userIds.length === 0) {
    console.log("[revenuecat-webhook] No UUID app_user_ids in event", { eventType, event_id: event.id });
    return new Response(JSON.stringify({ ok: true, synced: 0, note: "no_matching_user_ids" }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  const results: { user_id: string; ok: boolean; detail?: string }[] = [];

  for (const appUserId of userIds) {
    const rc = await fetchRevenueCatSubscriber(secretKey, appUserId);
    if (!rc.ok) {
      if (rc.status === 404) {
        results.push({ user_id: appUserId, ok: true, detail: "subscriber_not_found" });
        continue;
      }
      console.error("[revenuecat-webhook] RC fetch failed", appUserId, rc.status, rc.body);
      results.push({ user_id: appUserId, ok: false, detail: `rc_${rc.status}` });
      continue;
    }

    const sync = await syncUserPlansFromRevenueCatPayload(supabase, appUserId, rc.data, {
      sendWelcomeEmail: false,
      webhookEvent: event,
    });
    if (!sync.ok) {
      results.push({ user_id: appUserId, ok: false, detail: sync.error });
      continue;
    }

    try {
      await maybeMarkOnboardingSessionPaidForRcWeb(supabase, appUserId, event);
    } catch (obErr) {
      console.warn("[revenuecat-webhook] onboarding_sessions hook failed (non-fatal)", obErr);
    }

    try {
      await maybeSendTikTokCompletePayment(supabase, event, appUserId);
    } catch (tiktokErr) {
      console.warn("[revenuecat-webhook] TikTok hook failed (non-fatal)", tiktokErr);
    }

    results.push({
      user_id: appUserId,
      ok: true,
      detail: sync.preservedStripe
        ? "preserved_stripe"
        : "preservedExistingPlan" in sync && sync.preservedExistingPlan
        ? "preserved_existing_plan"
        : sync.active
        ? "active"
        : sync.downgraded
        ? "downgraded"
        : "inactive_noop",
    });
  }

  const anyFailed = results.some((r) => !r.ok);
  if (anyFailed) {
    console.error("[revenuecat-webhook] One or more syncs failed", { eventType, results });
  }
  // Always 200 so RevenueCat does not retry the same payload indefinitely; failures are logged above.
  return new Response(JSON.stringify({ ok: !anyFailed, event_type: eventType, results }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
});
