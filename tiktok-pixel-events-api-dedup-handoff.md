# TikTok Pixel + Events API deduplication — handoff

Generated: 2026-06-01  
Branch: `Mobile-app`  
Commit: `6ab17432`

---

## What to audit

Palette Plotting fires TikTok conversions two ways:

1. **Browser pixel** — `ttq.load` / `ttq.track` / `ttq.page` in `index.html` + `trackMarketingConversion()` in `src/lib/marketingConversionTrack.ts`
2. **Events API (server)** — Supabase edge function `tiktok-events` + second server path in `revenuecat-webhook` for Purchase

**TikTok dedup rule:** same **`event` name** + same **`event_id`** + same **`event_source_id` (pixel id)** within 48h → counted once (pixel + Events API merge).

**Pixel ID (both sides):** `D8ERPC3C77U91RGD4HQG` (Pixel 062026)

---

## Architecture

```
trackMarketingConversion(action, detail)
  ├─ ensureEventId(detail)          // one ID per hybrid event (sv_<uuid> or caller-supplied)
  ├─ fireTtq(action, withEventId)    // ttq.track(..., { event_id, content_id, ttclid, ... })
  └─ fireTikTokEventsApi(...)       // supabase.functions.invoke("tiktok-events", { event, event_id, ... })
                                        └─ sendTikTokServerEvent() → TikTok v1.3 event/track

index.html (every page load)
  └─ ttq.page({ content_id: pathname })   // NO event_id — separate from ViewContent below

revenuecat-webhook (INITIAL_PURCHASE, web billing only)
  └─ sendTikTokServerEvent({ event: "Purchase", eventId: tikTokEventIdFromRevenueCatEvent(rcEvent) })
       // separate event_id from browser Purchase — see audit gaps
```

---

## Event mapping (pixel vs Events API)

| `trackMarketingConversion` action | Pixel (`ttq.track`) | Events API server event | Shared `event_id`? |
|-----------------------------------|---------------------|-------------------------|-------------------|
| `landing_view` | ViewContent | ViewContent | **Yes** — `ensureEventId` → `sv_<uuid>` |
| `web_onboarding_welcome_view` | ViewContent | ViewContent | **Yes** |
| `web_onboarding_signup_complete` | CompleteRegistration | CompleteRegistration | **Yes** |
| `paywall_view` | InitiateCheckout | InitiateCheckout | **Yes** |
| `subscription_complete` | Purchase | Purchase | **Yes** — caller passes `paywallResult.purchaseEventId` |
| `web_onboarding_click` | ClickButton | *(none)* | **N/A** — pixel only |
| `cta_app_store_click` / store CTAs | ClickButton (+ Download) | *(none)* | **N/A** |
| `newsletter_subscribe` | Subscribe + CompleteRegistration | *(none)* | **N/A** — no server for newsletter |

**Call sites (hybrid funnel):**

| Step | File | Action |
|------|------|--------|
| Homepage | `src/pages/Index.tsx` | `landing_view` |
| Welcome | `src/pages/onboarding/Welcome.tsx` | `web_onboarding_welcome_view`, `web_onboarding_click` (pixel only) |
| Email signup | `src/pages/onboarding/setup/Email.tsx` | `web_onboarding_signup_complete` |
| Paywall open | `src/pages/onboarding/WebPaywall.tsx` | `paywall_view` |
| Purchase success | `src/pages/onboarding/WebPaywall.tsx` | `subscription_complete` |

---

## Deduplication audit

### ✅ Likely deduped correctly

For `landing_view`, `web_onboarding_welcome_view`, `web_onboarding_signup_complete`, `paywall_view`, and `subscription_complete`:

1. `trackMarketingConversion` runs `ensureEventId()` once when the action has a server mapping.
2. **Pixel** receives that `event_id` in `buildTtqTrackParams` → `ttq.track(event, { event_id, ... })`.
3. **Events API** receives the same `event_id` in the POST body to `tiktok-events`.
4. Server payload uses `event_source_id: TIKTOK_PIXEL_ID` matching `ttq.load('D8ERPC3C77U91RGD4HQG')`.

**Verification in TikTok Events Manager → Test Events:** for each funnel step, look for browser + server events with **identical `event_id`** and **identical event name**; TikTok should show deduplicated/merged.

Debug breadcrumb: `sessionStorage` key `marketing_conversions_v1` (last 20 events with `event_id`).

### ⚠️ Gaps / double-count risks

1. **Purchase — two server senders**
   - **Browser:** `subscription_complete` → pixel Purchase + Events API Purchase with `purchaseEventIdFromCustomerInfo()` → prefers `rc_${storeTransactionId}`.
   - **Webhook:** `revenuecat-webhook` → Events API Purchase with `tikTokEventIdFromRevenueCatEvent()` → prefers `rc_${transaction_id}` from RC webhook payload.
   - **Deduped only if those IDs match.** If client falls back to `rc_${userId}_${randomUUID}` (no transaction id in CustomerInfo yet), webhook sends a **different** `event_id` → **two Purchase events** counted.

2. **`web_onboarding_click` / ClickButton — pixel only**
   - No Events API backup. TikTok in-app browser often blocks pixel → clicks invisible to TikTok with no server dedup path.

3. **`ttq.page()` on every load (`index.html`)**
   - Fires without `event_id`. Not the same as `ViewContent` from `trackMarketingConversion`, but adds extra pixel activity.

4. **`content_id` mismatch (does not break event_id dedup, but payloads differ)**
   - Pixel uses `resolveContentId(detail)` (product id on paywall/purchase).
   - Events API body sets `content_id: pagePath` in `fireTikTokEventsApi` (pathname), while edge function can also use `body.content_id` if passed — client currently sends `content_id: pagePath` not `detail.content_id`.

5. **Timing:** TikTok merges pixel + Events API when identical `event_id` arrives after ~5 minutes and within 48h of first event (per TikTok docs).

---

## Purchase `event_id` formulas (compare these)

**Client** (`src/services/revenueCatWeb.ts` → `purchaseEventIdFromCustomerInfo`):

```text
rc_${storeTransactionId}                    // preferred
rc_${appUserId}_${originalPurchaseDate}     // fallback
rc_${appUserId}_${crypto.randomUUID()}      // last resort — breaks webhook dedup
```

**Webhook** (`supabase/functions/_shared/tiktokEventsApi.ts` → `tikTokEventIdFromRevenueCatEvent`):

```text
rc_${event.transaction_id}                   // preferred
rc_${event.original_transaction_id}        // fallback
rc_${event.id}                               // fallback
rc_${crypto.randomUUID()}                    // last resort
```

**Task:** confirm whether RC web billing `storeTransactionId` === webhook `transaction_id` for the same purchase. If not, recommend single Purchase source (webhook-only or client-only) or unified ID function.

---

## Env / deploy

| Item | Detail |
|------|--------|
| Edge function | `supabase/functions/tiktok-events` — needs `TIKTOK_EVENTS_API_ACCESS_TOKEN` |
| Optional test mode | `TIKTOK_TEST_EVENT_CODE` on edge function |
| Pixel | Hardcoded in `index.html` + `TIKTOK_PIXEL_ID` in shared API module |
| GTM | **Removed** — direct gtag + direct ttq only (commit `6ab17432`) |

---

## How to test dedup manually

1. TikTok Events Manager → your pixel → **Test Events**.
2. Open site with `?ttclid=test` (or real ad click).
3. Walk funnel: `/` → `/onboarding/welcome` → setup → email → paywall → purchase (or stop before purchase).
4. For each hybrid step, compare:
   - Browser event name + `event_id`
   - Server event name + `event_id`
5. In DevTools → Application → Session Storage → `marketing_conversions_v1` for fired IDs.
6. In Network, filter `tiktok-events` (Supabase function) and `analytics.tiktok.com` (pixel).

---

## FILE: index.html (TikTok pixel bootstrap excerpt)

```html
<!-- TikTok: ttq.load below + ttq.track in marketingConversionTrack.ts (direct browser pixel). -->
<!-- TikTok Pixel Code Start — Pixel 062026 (D8ERPC3C77U91RGD4HQG) -->
<script>
!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(
var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};n=document.createElement("script")
;n.type="text/javascript",n.async=!0,n.src=r+"?sdkid="+e+"&lib="+t;e=document.getElementsByTagName("script")[0];e.parentNode.insertBefore(n,e)};


  ttq.load('D8ERPC3C77U91RGD4HQG');
  var pagePath = window.location.pathname || '/';
  ttq.page({
    content_id: pagePath,
    content_type: 'product',
    content_name: pagePath,
    contents: [{
      content_id: pagePath,
      content_type: 'product',
      content_name: pagePath,
      quantity: 1
    }]
  });
}(window, document, 'ttq');
</script>
<!-- TikTok Pixel Code End -->
```

---

## FILE: src/lib/marketingConversionTrack.ts

```typescript
/**
 * Marketing conversion event helper.
 *
 * Fires the same event into:
 *   1. sessionStorage (debug breadcrumb, last 20 events)
 *   2. Google Analytics (gtag) — G-64SFCH1EBW in index.html
 *   3. TikTok Pixel (ttq) — Pixel 062026 in index.html
 *   4. TikTok Events API (server) — supabase/functions/tiktok-events + revenuecat-webhook
 *
 * Browser + server share event_id for TikTok deduplication.
 *
 * Web funnel server events:
 *   - web_onboarding_welcome_view / landing_view -> ViewContent
 *   - web_onboarding_signup_complete -> CompleteRegistration
 *   - paywall_view -> InitiateCheckout
 *   - subscription_complete -> Purchase
 */

import { supabase } from "@/integrations/supabase/client";
import { readMarketingTtclid } from "@/lib/useMarketingAttribution";
import { readWebOnboardingClientVisitId } from "@/lib/webOnboardingSessionInsert";

export type MarketingConversionAction =
  | "landing_view"
  | "cta_app_store_click"
  | "cta_play_store_click"
  | "cta_header_app_click"
  | "in_app_prompt_shown"
  | "in_app_open_in_browser"
  | "in_app_copy_link"
  | "newsletter_subscribe"
  | "paywall_view"
  | "subscription_complete"
  | "web_onboarding_welcome_view"
  | "web_onboarding_signup_complete"
  | "store_click"
  | "web_onboarding_click";

const SESSION_KEY = "marketing_conversions_v1";

type EventDetail = Record<string, string | number | boolean | undefined>;

type TtqShape = {
  track?: (event: string, params?: Record<string, unknown>) => void;
  page?: (params?: Record<string, unknown>) => void;
};

function persistBreadcrumb(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown[]) : [];
    list.push({ action, detail, at: new Date().toISOString() });
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(list.slice(-20)));
  } catch {
    /* ignore */
  }
}

function fireGtag(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { gtag?: (...args: unknown[]) => void };
    w.gtag?.("event", action, {
      event_category: "marketing_conversion",
      ...detail,
    });
  } catch {
    /* ignore */
  }
}

function ttqEventsForAction(action: MarketingConversionAction): string[] {
  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
      return ["ViewContent"];
    case "cta_app_store_click":
    case "cta_play_store_click":
      return ["ClickButton", "Download"];
    case "cta_header_app_click":
    case "in_app_prompt_shown":
    case "in_app_open_in_browser":
    case "in_app_copy_link":
    case "store_click":
    case "web_onboarding_click":
      return ["ClickButton"];
    case "newsletter_subscribe":
      return ["Subscribe", "CompleteRegistration"];
    case "web_onboarding_signup_complete":
      return ["CompleteRegistration"];
    case "paywall_view":
      return ["InitiateCheckout"];
    case "subscription_complete":
      return ["Purchase"];
  }
}

function tikTokServerEventForAction(action: MarketingConversionAction): string | null {
  switch (action) {
    case "landing_view":
    case "web_onboarding_welcome_view":
      return "ViewContent";
    case "web_onboarding_signup_complete":
      return "CompleteRegistration";
    case "paywall_view":
      return "InitiateCheckout";
    case "subscription_complete":
      return "Purchase";
    default:
      return null;
  }
}

function readTtpCookie(): string | undefined {
  try {
    const match = document.cookie.match(/(?:^|;\s*)_ttp=([^;]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  } catch {
    return undefined;
  }
}

function ensureEventId(detail?: EventDetail): EventDetail {
  if (detail?.event_id != null && String(detail.event_id).trim()) {
    return detail;
  }
  return { ...(detail ?? {}), event_id: `sv_${crypto.randomUUID()}` };
}

function resolveContentId(detail?: EventDetail): string {
  if (typeof detail?.content_id === "string" && detail.content_id.trim()) {
    return detail.content_id.trim();
  }
  if (typeof detail?.page_path === "string" && detail.page_path.trim()) {
    return detail.page_path.trim();
  }
  if (typeof window !== "undefined") {
    return window.location.pathname || "/";
  }
  return "/";
}

function buildTtqTrackParams(detail?: EventDetail): Record<string, unknown> {
  const contentId = resolveContentId(detail);
  const contentName =
    typeof detail?.content_name === "string"
      ? detail.content_name
      : typeof detail?.source === "string"
      ? detail.source
      : contentId;

  const ttclid = readMarketingTtclid();
  const eventId = detail?.event_id != null ? String(detail.event_id) : undefined;
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${window.location.pathname || "/"}`
      : undefined;

  const rawValue =
    typeof detail?.value === "number" && Number.isFinite(detail.value) ? detail.value : null;
  const hasValue = rawValue != null && rawValue > 0;
  const currency = typeof detail?.currency === "string" ? detail.currency : "USD";

  const contentItem: Record<string, unknown> = {
    content_id: contentId,
    content_type: "product",
    content_name: contentName,
    quantity: 1,
  };
  if (hasValue) {
    contentItem.price = rawValue;
  }

  const params: Record<string, unknown> = {
    content_id: contentId,
    content_type: "product",
    content_name: contentName,
    contents: [contentItem],
    ...(pageUrl ? { url: pageUrl } : {}),
    ...(ttclid ? { ttclid } : {}),
    ...(eventId ? { event_id: eventId } : {}),
  };
  if (hasValue) {
    params.value = rawValue;
    params.currency = currency;
  }

  return params;
}

function fireTtq(action: MarketingConversionAction, detail?: EventDetail) {
  try {
    const w = window as Window & { ttq?: TtqShape };
    if (!w.ttq?.track) return;
    const events = ttqEventsForAction(action);
    const params = buildTtqTrackParams(detail);
    for (const e of events) {
      w.ttq.track(e, params);
    }
  } catch {
    /* ignore */
  }
}

function fireTikTokEventsApi(action: MarketingConversionAction, detail?: EventDetail) {
  const serverEvent = tikTokServerEventForAction(action);
  if (!serverEvent) return;

  const eventId = detail?.event_id != null ? String(detail.event_id) : "";
  if (!eventId) return;

  const pagePath =
    typeof detail?.page_path === "string"
      ? detail.page_path
      : typeof window !== "undefined"
      ? window.location.pathname || "/"
      : "/";

  const body: Record<string, string | number | undefined> = {
    event: serverEvent,
    event_id: eventId,
    page_path: pagePath,
    content_id: pagePath,
    ttclid: readMarketingTtclid() ?? undefined,
    ttp: readTtpCookie(),
    client_visit_id: readWebOnboardingClientVisitId() ?? undefined,
    referrer: typeof document !== "undefined" && document.referrer ? document.referrer : undefined,
  };

  if (typeof detail?.content_name === "string") {
    body.content_name = detail.content_name;
  } else if (typeof detail?.source === "string") {
    body.content_name = detail.source;
  }

  if (typeof detail?.value === "number" && Number.isFinite(detail.value) && detail.value > 0) {
    body.value = detail.value;
  }
  if (typeof detail?.currency === "string" && body.value != null) {
    body.currency = detail.currency;
  }

  void supabase.functions.invoke("tiktok-events", { body }).catch(() => {
    /* non-blocking */
  });
}

export function trackMarketingConversion(
  action: MarketingConversionAction,
  detail?: EventDetail,
): void {
  const withEventId = tikTokServerEventForAction(action) ? ensureEventId(detail) : detail;

  persistBreadcrumb(action, withEventId);
  fireGtag(action, withEventId);
  fireTtq(action, withEventId);
  fireTikTokEventsApi(action, withEventId);
}
```

---

## FILE: src/pages/onboarding/WebPaywall.tsx (TikTok call sites)

```typescript
    trackMarketingConversion("paywall_view", {
      source: "web_revenuecat_paywall",
      page_path: "/onboarding/web-paywall",
      content_id: quote?.contentId ?? "/onboarding/web-paywall",
      content_name: quote?.contentName ?? "web_revenuecat_paywall",
      ...(quote ? { value: quote.value, currency: quote.currency } : {}),
    });
    // ... presentWebRevenueCatPaywall ...
    if (paywallResult.ok) {
      trackMarketingConversion("subscription_complete", {
        source: "web_revenuecat_paywall",
        target_path: "/onboarding/post-paywall",
        event_id: paywallResult.purchaseEventId,
        content_id: paywallResult.productId,
        content_name: paywallResult.productName,
        ...(paywallResult.purchaseValue > 0
          ? { value: paywallResult.purchaseValue, currency: paywallResult.purchaseCurrency }
          : {}),
      });
```

---

## FILE: src/services/revenueCatWeb.ts (client Purchase event_id)

```typescript
function purchaseEventIdFromCustomerInfo(
  customerInfo: { entitlements: { active: Record<string, unknown> } },
  appUserId: string | null,
): string {
  try {
    const ent = customerInfo.entitlements.active[REVENUECAT_WEB_ENTITLEMENT_ID] as
      | { productIdentifier?: string; originalPurchaseDate?: string }
      | undefined;
    const pid = ent?.productIdentifier;
    if (pid) {
      const subs = (customerInfo as {
        subscriptionsByProductIdentifier?: Record<
          string,
          { storeTransactionId?: string; originalPurchaseDate?: string }
        >;
      }).subscriptionsByProductIdentifier;
      const tx = subs?.[pid]?.storeTransactionId?.trim();
      if (tx) return `rc_${tx}`;
      const purchaseDate = subs?.[pid]?.originalPurchaseDate ?? ent?.originalPurchaseDate;
      if (purchaseDate) return `rc_${appUserId ?? "web"}_${purchaseDate}`;
    }
  } catch {
    /* ignore */
  }
  return `rc_${appUserId ?? "web"}_${crypto.randomUUID()}`;
}
```

---

## FILE: supabase/functions/tiktok-events/index.ts

```typescript
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

const SITE_ORIGIN = "https://paletteplot.com";

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

// ... clientIp, resolvePageUrl, resolveTtclid ...

serve(async (req) => {
  // OPTIONS + POST only
  const event = typeof body.event === "string" ? body.event.trim() : "";
  const eventId = typeof body.event_id === "string" ? body.event_id.trim() : "";

  if (!event || !TIKTOK_SERVER_EVENTS.has(event)) {
    return new Response(JSON.stringify({ error: "Unsupported event" }), { status: 400, ... });
  }
  if (!eventId) {
    return new Response(JSON.stringify({ error: "event_id is required" }), { status: 400, ... });
  }

  // auth user → email, externalId
  const ttclid = await resolveTtclid(supabase, body, userId);

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
    referrer: body.referrer ?? null,
    contentId: body.content_id ?? body.page_path ?? null,
    contentName: body.content_name ?? null,
    value: body.value,
    currency: body.currency,
  });

  return new Response(JSON.stringify({ ok: true, event, event_id: eventId }), { status: 200, ... });
});
```

(Full file in repo: `supabase/functions/tiktok-events/index.ts`)

---

## FILE: supabase/functions/_shared/tiktokEventsApi.ts

```typescript
export const TIKTOK_PIXEL_ID = "D8ERPC3C77U91RGD4HQG";

export const TIKTOK_SERVER_EVENTS = new Set([
  "ViewContent",
  "CompleteRegistration",
  "InitiateCheckout",
  "Purchase",
]);

export function tikTokEventIdFromRevenueCatEvent(event: Record<string, unknown>): string {
  const tx = typeof event.transaction_id === "string" ? event.transaction_id.trim() : "";
  if (tx) return `rc_${tx}`;
  const orig = typeof event.original_transaction_id === "string" ? event.original_transaction_id.trim() : "";
  if (orig) return `rc_${orig}`;
  const id = typeof event.id === "string" ? event.id.trim() : "";
  return id ? `rc_${id}` : `rc_${crypto.randomUUID()}`;
}

export async function sendTikTokServerEvent(payload: TikTokServerEvent): Promise<{ ok: boolean; detail?: string }> {
  // POST https://business-api.tiktok.com/open_api/v1.3/event/track/
  const body = {
    event_source: "web",
    event_source_id: TIKTOK_PIXEL_ID,
    data: [{
      event: payload.event,
      event_time: payload.eventTimeSec ?? Math.floor(Date.now() / 1000),
      event_id: payload.eventId,
      user: { /* sha256 email, external_id, ttclid, ttp, ip, user_agent */ },
      page: { url, referrer },
      properties: { content_id, content_name, value, currency, contents },
    }],
  };
  // Access-Token: TIKTOK_EVENTS_API_ACCESS_TOKEN
}
```

(Full file in repo: `supabase/functions/_shared/tiktokEventsApi.ts`)

---

## FILE: supabase/functions/revenuecat-webhook/index.ts (second Purchase path)

```typescript
async function maybeSendTikTokCompletePayment(
  supabase: ReturnType<typeof createClient>,
  event: Record<string, unknown>,
  appUserId: string,
): Promise<void> {
  if (!revenueCatEventIsWebInitialPurchase(event)) return;

  // lookup email + ttclid from web_onboarding_sessions by user_id

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
}
```

Called after RC webhook sync on `INITIAL_PURCHASE` where `store` is RC Web Billing / Stripe.

---

## Open questions

1. For each funnel event, is **pixel `event_id` === Events API `event_id` === same event name**?
2. Can **Purchase** double-count because webhook `event_id` ≠ client `purchaseEventId`?
3. Should **ClickButton** get a server Events API twin with shared `event_id`?
4. Should **`fireTikTokEventsApi`** send `detail.content_id` instead of `pagePath` for server `content_id`?
5. Is **`ttq.page()`** on every load causing duplicate ViewContent-style noise?

---

## Related repo files (not inlined)

- `src/pages/Index.tsx` — `landing_view`
- `src/pages/onboarding/Welcome.tsx` — `web_onboarding_welcome_view`, `web_onboarding_click`
- `src/pages/onboarding/setup/Email.tsx` — `web_onboarding_signup_complete`
- `src/lib/useMarketingAttribution.ts` — `ttclid` persistence
- `src/lib/webOnboardingSessionInsert.ts` — `client_visit_id` for server ttclid lookup
