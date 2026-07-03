import { Capacitor } from "@capacitor/core";

/**
 * First-touch / last-touch campaign attribution for web and native onboarding.
 * First-touch is immutable once stored; last-touch updates on new attributed visits.
 */

const FIRST_TOUCH_STORAGE_KEY = "sv_attribution_first_touch_v2";
const LAST_TOUCH_STORAGE_KEY = "sv_attribution_last_touch_v2";
const FIRST_TOUCH_COOKIE = "sv_aff_first_v1";

const TRACKED_QUERY_KEYS = [
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_content",
  "utm_term",
  "source",
  "campaign",
  "ad_id",
  "adset_id",
  "campaign_id",
  "creative_id",
  "placement",
  "ttclid",
  "fbclid",
  "gclid",
] as const;

export type AttributionTouch = {
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  utm_term: string | null;
  source: string | null;
  campaign: string | null;
  ad_id: string | null;
  adset_id: string | null;
  campaign_id: string | null;
  creative_id: string | null;
  placement: string | null;
  click_id_type: string | null;
  click_id_value: string | null;
  referrer: string | null;
  landing_page: string | null;
  initial_path: string | null;
  locale: string | null;
  country: string | null;
  platform: string | null;
  device_os: string | null;
  app_version: string | null;
  captured_at: string;
};

export type StoredAttribution = {
  first_touch: AttributionTouch | null;
  last_touch: AttributionTouch | null;
  payload: Record<string, unknown>;
};

function trimOrNull(value: string | null | undefined, max = 500): string | null {
  if (value == null) return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function readStorageJson(key: string): unknown | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function writeStorageJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* ignore */
  }
}

function readFirstTouchCookie(): AttributionTouch | null {
  if (typeof document === "undefined") return null;
  try {
    const match = document.cookie.match(new RegExp(`(?:^|; )${FIRST_TOUCH_COOKIE}=([^;]*)`));
    if (!match?.[1]) return null;
    const decoded = decodeURIComponent(match[1]);
    const parsed = JSON.parse(decoded) as Partial<AttributionTouch>;
    if (!parsed || typeof parsed !== "object" || !parsed.captured_at) return null;
    return parsed as AttributionTouch;
  } catch {
    return null;
  }
}

function writeFirstTouchCookie(touch: AttributionTouch) {
  if (typeof document === "undefined") return;
  try {
    const value = encodeURIComponent(JSON.stringify(touch));
    const maxAge = 60 * 60 * 24 * 90;
    document.cookie = `${FIRST_TOUCH_COOKIE}=${value}; path=/; max-age=${maxAge}; SameSite=Lax`;
  } catch {
    /* ignore */
  }
}

function resolveClickId(params: URLSearchParams): { type: string | null; value: string | null } {
  for (const [type, key] of [
    ["ttclid", "ttclid"],
    ["fbclid", "fbclid"],
    ["gclid", "gclid"],
  ] as const) {
    const value = trimOrNull(params.get(key));
    if (value) return { type, value };
  }
  return { type: null, value: null };
}

function hasCampaignSignal(touch: AttributionTouch): boolean {
  return Boolean(
    touch.utm_source ||
      touch.utm_medium ||
      touch.utm_campaign ||
      touch.utm_content ||
      touch.utm_term ||
      touch.source ||
      touch.campaign ||
      touch.ad_id ||
      touch.adset_id ||
      touch.campaign_id ||
      touch.creative_id ||
      touch.placement ||
      touch.click_id_value,
  );
}

function readLocale(): string | null {
  try {
    const fromDoc = typeof document !== "undefined" ? document.documentElement.lang : null;
    if (fromDoc && fromDoc.trim()) return trimOrNull(fromDoc, 32);
    if (typeof navigator !== "undefined" && navigator.language) {
      return trimOrNull(navigator.language, 32);
    }
  } catch {
    /* ignore */
  }
  return null;
}

function readPlatform(): { platform: string | null; device_os: string | null } {
  const platform = Capacitor.isNativePlatform() ? Capacitor.getPlatform() : "web";
  let deviceOs: string | null = null;
  try {
    if (typeof navigator !== "undefined" && navigator.userAgent) {
      const ua = navigator.userAgent;
      if (/iPhone|iPad|iPod/i.test(ua)) deviceOs = "ios";
      else if (/Android/i.test(ua)) deviceOs = "android";
      else if (/Windows/i.test(ua)) deviceOs = "windows";
      else if (/Mac OS X/i.test(ua)) deviceOs = "macos";
      else if (/Linux/i.test(ua)) deviceOs = "linux";
    }
  } catch {
    /* ignore */
  }
  return { platform, device_os: deviceOs };
}

function normalizeTouch(raw: Partial<AttributionTouch>): AttributionTouch {
  const { platform, device_os } = readPlatform();
  return {
    utm_source: trimOrNull(raw.utm_source ?? null, 120),
    utm_medium: trimOrNull(raw.utm_medium ?? null, 120),
    utm_campaign: trimOrNull(raw.utm_campaign ?? null, 200),
    utm_content: trimOrNull(raw.utm_content ?? null, 200),
    utm_term: trimOrNull(raw.utm_term ?? null, 200),
    source: trimOrNull(raw.source ?? null, 120),
    campaign: trimOrNull(raw.campaign ?? null, 200),
    ad_id: trimOrNull(raw.ad_id ?? null, 120),
    adset_id: trimOrNull(raw.adset_id ?? null, 120),
    campaign_id: trimOrNull(raw.campaign_id ?? null, 120),
    creative_id: trimOrNull(raw.creative_id ?? null, 120),
    placement: trimOrNull(raw.placement ?? null, 120),
    click_id_type: trimOrNull(raw.click_id_type ?? null, 32),
    click_id_value: trimOrNull(raw.click_id_value ?? null, 500),
    referrer: trimOrNull(raw.referrer ?? null, 2000),
    landing_page: trimOrNull(raw.landing_page ?? null, 500),
    initial_path: trimOrNull(raw.initial_path ?? null, 500),
    locale: trimOrNull(raw.locale ?? null, 32) ?? readLocale(),
    country: trimOrNull(raw.country ?? null, 8),
    platform: trimOrNull(raw.platform ?? null, 32) ?? platform,
    device_os: trimOrNull(raw.device_os ?? null, 32) ?? device_os,
    app_version: trimOrNull(raw.app_version ?? null, 64),
    captured_at: raw.captured_at ?? new Date().toISOString(),
  };
}

function parseTouchFromSearch(search: string, opts?: { referrer?: string | null; path?: string | null }) {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  const click = resolveClickId(params);
  const path =
    opts?.path ??
    (typeof window !== "undefined" ? window.location.pathname || "/" : "/");
  const touch = normalizeTouch({
    utm_source: params.get("utm_source"),
    utm_medium: params.get("utm_medium"),
    utm_campaign: params.get("utm_campaign"),
    utm_content: params.get("utm_content"),
    utm_term: params.get("utm_term"),
    source: params.get("source"),
    campaign: params.get("campaign"),
    ad_id: params.get("ad_id"),
    adset_id: params.get("adset_id"),
    campaign_id: params.get("campaign_id"),
    creative_id: params.get("creative_id"),
    placement: params.get("placement"),
    click_id_type: click.type,
    click_id_value: click.value,
    referrer: opts?.referrer ?? (typeof document !== "undefined" ? document.referrer || null : null),
    landing_page: path,
    initial_path: path,
    captured_at: new Date().toISOString(),
  });
  return hasCampaignSignal(touch) ? touch : null;
}

/** Parse attribution from a full URL (web or native deep link). */
export function captureAttributionFromUrl(url: string): AttributionTouch | null {
  try {
    const parsed = new URL(url);
    return parseTouchFromSearch(parsed.search, {
      referrer: null,
      path: parsed.pathname || "/",
    });
  } catch {
    return null;
  }
}

function readPersistedTouch(key: string): AttributionTouch | null {
  const raw = readStorageJson(key);
  if (!raw || typeof raw !== "object") return null;
  const touch = normalizeTouch(raw as Partial<AttributionTouch>);
  return hasCampaignSignal(touch) ? touch : null;
}

function persistFirstTouch(touch: AttributionTouch) {
  writeStorageJson(FIRST_TOUCH_STORAGE_KEY, touch);
  writeFirstTouchCookie(touch);
}

function persistLastTouch(touch: AttributionTouch) {
  writeStorageJson(LAST_TOUCH_STORAGE_KEY, touch);
}

/** Read stored first/last touch without scanning the current URL. */
export function readStoredAttribution(): StoredAttribution {
  const firstFromStorage = readPersistedTouch(FIRST_TOUCH_STORAGE_KEY);
  const firstFromCookie = readFirstTouchCookie();
  const first_touch = firstFromStorage ?? firstFromCookie;
  const last_touch = readPersistedTouch(LAST_TOUCH_STORAGE_KEY);
  return {
    first_touch,
    last_touch: last_touch ?? first_touch,
    payload: {
      first_touch,
      last_touch: last_touch ?? first_touch,
      read_at: new Date().toISOString(),
    },
  };
}

/**
 * Capture attribution from the current URL (or deep link), persist first/last touch,
 * and return the merged state for onboarding session sync.
 */
export function captureAndPersistAttribution(opts?: { url?: string }): StoredAttribution {
  let fromUrl: AttributionTouch | null = null;
  if (opts?.url) {
    fromUrl = captureAttributionFromUrl(opts.url);
  } else if (typeof window !== "undefined") {
    fromUrl = parseTouchFromSearch(window.location.search, {
      referrer: typeof document !== "undefined" ? document.referrer || null : null,
      path: window.location.pathname || "/",
    });
  }

  const existing = readStoredAttribution();
  let first_touch = existing.first_touch;
  let last_touch = existing.last_touch;

  if (fromUrl) {
    if (!first_touch) {
      first_touch = fromUrl;
      persistFirstTouch(fromUrl);
    }
    last_touch = fromUrl;
    persistLastTouch(fromUrl);
  }

  const payload: Record<string, unknown> = {
    first_touch,
    last_touch,
    latest_url_capture: fromUrl,
    captured_at: new Date().toISOString(),
    query_keys_seen: TRACKED_QUERY_KEYS,
  };

  return { first_touch, last_touch, payload };
}

/**
 * TikTok / paid-social app deep link — opens native welcome and stores UTMs + ttclid.
 * Example:
 *   paletteplotting://welcome?utm_source=tiktok&utm_medium=paid_social&utm_campaign=mx_spanish_test&ttclid=…
 * Hosts `open` and `campaign` also route to welcome.
 */
export const CAMPAIGN_WELCOME_DEEP_LINK_PREFIX = "paletteplotting://welcome";

/** Payload for create/update-onboarding-session edge functions. */
export function buildOnboardingAttributionPatch(): Record<string, unknown> {
  const state = captureAndPersistAttribution();
  return {
    attribution: {
      first_touch: state.first_touch,
      last_touch: state.last_touch,
      payload: state.payload,
    },
  };
}
