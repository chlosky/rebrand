/** TikTok, Meta Pixel, and GA4 helpers — base loaders live in index.html. */

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (
      command: string,
      eventOrId: string,
      params?: Record<string, unknown>,
      options?: { eventID?: string },
    ) => void;
    ttq?: {
      page: (payload?: Record<string, unknown>) => void;
      identify: (payload: Record<string, string>) => void;
      track: (
        event: string,
        payload?: Record<string, unknown>,
        options?: { event_id?: string },
      ) => void;
      ready?: (callback: () => void) => void;
    };
  }
}

/** Lets queued pixel events attempt to flush before navigation, but never blocks checkout forever. */
export function flushTikTokEvents(ms = 400, maxWaitMs = 900): Promise<void> {
  return new Promise((resolve) => {
    if (!isTikTokEnabled() || typeof window === "undefined") {
      resolve();
      return;
    }

    let done = false;

    const finish = () => {
      if (done) return;
      done = true;
      window.setTimeout(resolve, ms);
    };

    const hardTimeout = window.setTimeout(() => {
      finish();
    }, maxWaitMs);

    const queue = ttq();

    try {
      if (queue?.ready) {
        queue.ready(() => {
          window.clearTimeout(hardTimeout);
          finish();
        });
        return;
      }
    } catch {
      window.clearTimeout(hardTimeout);
      finish();
      return;
    }

    window.clearTimeout(hardTimeout);
    finish();
  });
}

export const BOARD_PRICE_USD = 259.99;
const CURRENCY = "USD";

export type TikTokContent = {
  contentId: string;
  contentName: string;
  contentType?: "product" | "product_group";
  price?: number;
  quantity?: number;
};

function pixelId(): string | undefined {
  const id = import.meta.env.VITE_TIKTOK_PIXEL_ID?.trim();
  if (!id || id.startsWith("YOUR_")) return undefined;
  return id;
}

export function isTikTokEnabled(): boolean {
  return Boolean(pixelId());
}

function ttq() {
  if (typeof window === "undefined") return undefined;
  return window.ttq;
}

export async function sha256(value: string): Promise<string> {
  const normalized = value.trim().toLowerCase();
  const data = new TextEncoder().encode(normalized);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return phone.trim().startsWith("+") ? phone.trim() : `+${digits}`;
}

/** Call only when you have PII the user provided (e.g. checkout). Values are hashed before send. */
export async function identifyTikTok(params: {
  email?: string | null;
  phone?: string | null;
  externalId?: string | null;
}): Promise<void> {
  if (!isTikTokEnabled()) return;

  const payload: Record<string, string> = {};
  if (params.email?.trim()) {
    payload.email = await sha256(params.email);
  }
  if (params.phone?.trim()) {
    payload.phone_number = await sha256(normalizePhone(params.phone));
  }
  if (params.externalId?.trim()) {
    payload.external_id = await sha256(params.externalId.trim());
  }

  if (Object.keys(payload).length === 0) return;
  ttq()?.identify(payload);
}

function buildContents(items: TikTokContent[]) {
  return items.map((item) => ({
    content_id: item.contentId,
    content_type: item.contentType ?? "product",
    content_name: item.contentName,
    ...(item.price != null ? { price: item.price } : {}),
    ...(item.quantity != null ? { quantity: item.quantity } : {}),
  }));
}

function lineValue(items: TikTokContent[], fallbackUnitPrice = BOARD_PRICE_USD): number {
  return items.reduce((sum, item) => {
    const unit = item.price ?? fallbackUnitPrice;
    const qty = item.quantity ?? 1;
    return sum + unit * qty;
  }, 0);
}

export function makeTikTokEventId(prefix: string, key: string | number): string {
  return `${prefix}_${String(key).replace(/\W/g, "")}_${Date.now()}`;
}

function metaPixelId(): string | undefined {
  const id = import.meta.env.VITE_META_PIXEL_ID?.trim();
  if (!id || id.startsWith("YOUR_")) return undefined;
  return id;
}

export function isMetaEnabled(): boolean {
  return Boolean(metaPixelId());
}

function fbq(
  command: string,
  eventOrId: string,
  params?: Record<string, unknown>,
  options?: { eventID?: string },
): void {
  if (typeof window === "undefined" || !isMetaEnabled()) return;
  window.fbq?.(command, eventOrId, params, options);
}

/** Brief delay so Meta can queue events before checkout redirect. */
export function flushMetaEvents(ms = 400): Promise<void> {
  return new Promise((resolve) => {
    if (!isMetaEnabled() || typeof window === "undefined") {
      resolve();
      return;
    }
    window.setTimeout(resolve, ms);
  });
}

export async function flushAnalyticsBeforeCheckout(): Promise<void> {
  await Promise.all([flushTikTokEvents(), flushMetaEvents()]);
}

function metaContents(items: TikTokContent[]) {
  return {
    content_ids: items.map((item) => item.contentId),
    content_type: items[0]?.contentType ?? "product",
    contents: items.map((item) => ({
      id: item.contentId,
      quantity: item.quantity ?? 1,
      item_price: item.price ?? BOARD_PRICE_USD,
    })),
    content_name: items[0]?.contentName,
    num_items: items.reduce((sum, item) => sum + (item.quantity ?? 1), 0),
  };
}

export function trackMetaPageView(): void {
  fbq("track", "PageView");
}

export function trackMetaViewContent(item: TikTokContent, value?: number): void {
  fbq(
    "track",
    "ViewContent",
    {
      ...metaContents([item]),
      value: value ?? item.price ?? BOARD_PRICE_USD,
      currency: CURRENCY,
    },
    { eventID: makeTikTokEventId("viewcontent", item.contentId) },
  );
}

export function trackMetaAddToCart(item: TikTokContent & { quantity: number }): void {
  fbq(
    "track",
    "AddToCart",
    {
      ...metaContents([{ ...item, quantity: item.quantity }]),
      value: (item.price ?? BOARD_PRICE_USD) * item.quantity,
      currency: CURRENCY,
    },
    { eventID: makeTikTokEventId("addtocart", item.contentId) },
  );
}

export function trackMetaInitiateCheckout(items: TikTokContent[]): void {
  fbq(
    "track",
    "InitiateCheckout",
    {
      ...metaContents(items),
      value: lineValue(items),
      currency: CURRENCY,
    },
    { eventID: makeTikTokEventId("checkout", items[0]?.contentId ?? "cart") },
  );
}

function trackEvent(
  event: string,
  items: TikTokContent[],
  options?: { value?: number; currency?: string; eventId?: string; extra?: Record<string, unknown> },
): void {
  if (!isTikTokEnabled()) return;
  const contents = buildContents(items);
  const value = options?.value ?? lineValue(items);
  const payload = {
    contents,
    value,
    currency: options?.currency ?? CURRENCY,
    ...options?.extra,
  };
  const eventOptions = options?.eventId ? { event_id: options.eventId } : undefined;
  ttq()?.track(event, payload, eventOptions);
}

export function trackTikTokPageView(path: string, name?: string): void {
  if (!isTikTokEnabled()) return;
  ttq()?.page({
    content_id: path,
    content_type: "product",
    content_name: name ?? path,
  });
}

export function trackTikTokViewContent(item: TikTokContent, value?: number): void {
  trackEvent("ViewContent", [item], {
    value: value ?? item.price ?? BOARD_PRICE_USD,
    eventId: makeTikTokEventId("viewcontent", item.contentId),
  });
}

export function trackTikTokAddToCart(item: TikTokContent & { quantity: number }): void {
  trackEvent(
    "AddToCart",
    [{ ...item, quantity: item.quantity }],
    {
      value: (item.price ?? BOARD_PRICE_USD) * item.quantity,
      eventId: makeTikTokEventId("addtocart", item.contentId),
    },
  );
}

export function trackTikTokInitiateCheckout(items: TikTokContent[]): void {
  trackEvent("InitiateCheckout", items, {
    eventId: makeTikTokEventId("checkout", items[0]?.contentId ?? "cart"),
  });
}

/** Fires AddToCart + InitiateCheckout and waits for the pixel to send before leaving the page. */
export async function trackTikTokCheckoutStart(
  item: TikTokContent & { quantity: number },
): Promise<void> {
  trackTikTokAddToCart(item);
  trackTikTokInitiateCheckout([item]);
  await flushTikTokEvents();
}

function gaMeasurementId(): string | undefined {
  const id = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim();
  if (!id || id.startsWith("YOUR_")) return undefined;
  return id;
}

export function isGAEnabled(): boolean {
  return Boolean(gaMeasurementId());
}

function gtag(...args: unknown[]): void {
  if (typeof window === "undefined") return;
  window.gtag?.(...args);
}

function gaItems(items: TikTokContent[]) {
  return items.map((item) => ({
    item_id: item.contentId,
    item_name: item.contentName,
    price: item.price ?? BOARD_PRICE_USD,
    quantity: item.quantity ?? 1,
  }));
}

/** GA4 page_view for SPA route changes (initial config uses send_page_view: false). */
export function trackGAPageView(path: string, title?: string): void {
  if (!isGAEnabled()) return;
  gtag("event", "page_view", {
    page_path: path,
    ...(title ? { page_title: title } : {}),
  });
}

export function trackGAViewItem(item: TikTokContent): void {
  if (!isGAEnabled()) return;
  gtag("event", "view_item", {
    currency: CURRENCY,
    value: item.price ?? BOARD_PRICE_USD,
    items: gaItems([item]),
  });
}

export function trackGAAddToCart(item: TikTokContent & { quantity: number }): void {
  if (!isGAEnabled()) return;
  gtag("event", "add_to_cart", {
    currency: CURRENCY,
    value: (item.price ?? BOARD_PRICE_USD) * item.quantity,
    items: gaItems([{ ...item, quantity: item.quantity }]),
  });
}

export function trackGABeginCheckout(items: TikTokContent[]): void {
  if (!isGAEnabled()) return;
  gtag("event", "begin_checkout", {
    currency: CURRENCY,
    value: lineValue(items),
    items: gaItems(items),
  });
}
