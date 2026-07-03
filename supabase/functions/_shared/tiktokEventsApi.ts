/** Pixel 062026 — same id as index.html ttq.load. */
export const TIKTOK_PIXEL_ID = "D8RDRHJC77U677EP2BF0";

const TIKTOK_EVENT_TRACK_URL = "https://business-api.tiktok.com/open_api/v1.3/event/track/";

/** Standard events we send for the web onboarding funnel (+ Purchase from RC webhook). */
export const TIKTOK_SERVER_EVENTS = new Set([
  "ViewContent",
  "CompleteRegistration",
  "InitiateCheckout",
  "Purchase",
]);

export type TikTokServerEvent = {
  event: string;
  eventId: string;
  eventTimeSec?: number;
  email?: string | null;
  externalId?: string | null;
  ttclid?: string | null;
  ttp?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  url?: string | null;
  referrer?: string | null;
  contentId?: string | null;
  contentName?: string | null;
  value?: number | null;
  currency?: string | null;
};

async function sha256Hex(input: string): Promise<string> {
  const data = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function isWebBillingStore(store: unknown): boolean {
  const s = String(store ?? "").trim().toUpperCase().replace(/-/g, "_");
  return s === "STRIPE" || s === "RC_BILLING" || s === "RCBILLING";
}

export function revenueCatEventIsWebInitialPurchase(event: Record<string, unknown>): boolean {
  if (event.type !== "INITIAL_PURCHASE") return false;
  return isWebBillingStore(event.store);
}

export function tikTokEventIdFromRevenueCatEvent(event: Record<string, unknown>): string {
  const tx = typeof event.transaction_id === "string" ? event.transaction_id.trim() : "";
  if (tx) return `rc_${tx}`;
  const orig = typeof event.original_transaction_id === "string" ? event.original_transaction_id.trim() : "";
  if (orig) return `rc_${orig}`;
  const id = typeof event.id === "string" ? event.id.trim() : "";
  return id ? `rc_${id}` : `rc_${crypto.randomUUID()}`;
}

export async function sendTikTokServerEvent(
  payload: TikTokServerEvent,
): Promise<{ ok: boolean; detail?: string }> {
  const token = Deno.env.get("TIKTOK_EVENTS_API_ACCESS_TOKEN")?.trim();
  if (!token) {
    console.warn("[tiktok-events] TIKTOK_EVENTS_API_ACCESS_TOKEN is not set");
    return { ok: false, detail: "missing_token" };
  }

  if (!TIKTOK_SERVER_EVENTS.has(payload.event)) {
    console.warn("[tiktok-events] Unsupported event", payload.event);
    return { ok: false, detail: "unsupported_event" };
  }

  const user: Record<string, string> = {};
  if (payload.email) {
    user.email = await sha256Hex(payload.email.trim().toLowerCase());
  }
  if (payload.externalId) {
    user.external_id = await sha256Hex(payload.externalId.trim());
  }
  if (payload.ttclid) {
    user.ttclid = payload.ttclid.trim();
  }
  if (payload.ttp) {
    user.ttp = payload.ttp.trim();
  }
  if (payload.ip) {
    user.ip = payload.ip.trim();
  }
  if (payload.userAgent) {
    user.user_agent = payload.userAgent.trim();
  }

  const properties: Record<string, string | number | Array<Record<string, string>>> = {
    content_type: "product",
  };
  if (payload.contentId) {
    properties.content_id = payload.contentId;
    properties.contents = [
      {
        content_id: payload.contentId,
        content_type: "product",
        ...(payload.contentName ? { content_name: payload.contentName } : {}),
      },
    ];
  }
  if (payload.contentName) {
    properties.content_name = payload.contentName;
  }
  if (payload.value != null && Number.isFinite(payload.value) && payload.value > 0) {
    properties.value = payload.value;
  }
  if (payload.currency && properties.value != null) {
    properties.currency = payload.currency;
  }

  const page: Record<string, string> = {};
  if (payload.url) {
    page.url = payload.url;
  }
  if (payload.referrer) {
    page.referrer = payload.referrer;
  }

  const body: Record<string, unknown> = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    data: [
      {
        event: payload.event,
        event_time: payload.eventTimeSec ?? Math.floor(Date.now() / 1000),
        event_id: payload.eventId,
        user,
        ...(Object.keys(page).length > 0 ? { page } : {}),
        properties,
      },
    ],
  };

  const testEventCode = Deno.env.get("TIKTOK_TEST_EVENT_CODE")?.trim();
  if (testEventCode) {
    body.test_event_code = testEventCode;
  }

  try {
    const res = await fetch(TIKTOK_EVENT_TRACK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Access-Token": token,
      },
      body: JSON.stringify(body),
    });
    const text = await res.text();
    if (!res.ok) {
      console.error("[tiktok-events] HTTP error", res.status, text);
      return { ok: false, detail: `http_${res.status}` };
    }
    let parsed: { code?: number; message?: string } | null = null;
    try {
      parsed = JSON.parse(text) as { code?: number; message?: string };
    } catch {
      /* ignore */
    }
    if (parsed?.code != null && parsed.code !== 0) {
      console.error("[tiktok-events] API error", parsed.code, parsed.message ?? text);
      return { ok: false, detail: `api_${parsed.code}` };
    }
    return { ok: true };
  } catch (err) {
    console.error("[tiktok-events] Request failed", err);
    return { ok: false, detail: "fetch_failed" };
  }
}
