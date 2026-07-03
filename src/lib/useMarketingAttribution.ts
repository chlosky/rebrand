import { useEffect, useMemo, useState } from "react";
import { captureAndPersistAttribution } from "@/lib/attribution";

/**
 * Marketing attribution: read UTM params on mount, persist for the session,
 * and expose convenience flags (`isPaid`, `isFromTikTok`) for analytics only.
 * The homepage layout is identical for all visitors.
 *
 * Persists in sessionStorage so back-navigation / hash changes / route
 * changes during the session keep the attribution.
 */

const ATTRIBUTION_KEY = "marketing_attribution_v1";
const TTCLID_KEY = "marketing_ttclid_v1";

const PAID_SOURCES = new Set([
  "tiktok",
  "tiktok-ads",
  "tiktokads",
  "tt",
  "facebook",
  "fb",
  "meta",
  "instagram",
  "ig",
  "snap",
  "snapchat",
  "reddit",
  "google-ads",
  "googleads",
  "youtube-ads",
  "pinterest-ads",
  "linkedin-ads",
]);

const PAID_MEDIUMS = new Set([
  "paid",
  "cpc",
  "ppc",
  "ads",
  "ad",
  "social-paid",
  "paid-social",
  "paidsocial",
  "display",
  "video",
]);

export type MarketingAttribution = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
  ttclid: string | null;
  landing: string;
  at: string;
  /** True when source/medium look like a paid ad placement. */
  isPaid: boolean;
  isFromTikTok: boolean;
};

function readPersistedTtclid(): string | null {
  try {
    const raw = sessionStorage.getItem(TTCLID_KEY);
    return raw && raw.trim() ? raw.trim() : null;
  } catch {
    return null;
  }
}

function persistTtclid(ttclid: string) {
  try {
    sessionStorage.setItem(TTCLID_KEY, ttclid.trim());
  } catch {
    /* ignore */
  }
}

/** TikTok click id from ad URL — persisted for the tab session. */
export function readMarketingTtclid(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const fromUrl = new URLSearchParams(window.location.search).get("ttclid")?.trim();
    if (fromUrl) {
      persistTtclid(fromUrl);
      return fromUrl;
    }
  } catch {
    /* ignore */
  }
  return readPersistedTtclid();
}

function readPersisted(): MarketingAttribution | null {
  try {
    const raw = sessionStorage.getItem(ATTRIBUTION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<MarketingAttribution>;
    if (!parsed || typeof parsed !== "object") return null;
    return {
      utmSource: parsed.utmSource ?? null,
      utmMedium: parsed.utmMedium ?? null,
      utmCampaign: parsed.utmCampaign ?? null,
      utmContent: parsed.utmContent ?? null,
      utmTerm: parsed.utmTerm ?? null,
      ttclid: parsed.ttclid ?? readPersistedTtclid(),
      landing: parsed.landing ?? "/",
      at: parsed.at ?? new Date().toISOString(),
      isPaid: Boolean(parsed.isPaid),
      isFromTikTok: Boolean(parsed.isFromTikTok),
    };
  } catch {
    return null;
  }
}

function classify(source: string | null, medium: string | null) {
  const src = (source ?? "").toLowerCase().trim();
  const med = (medium ?? "").toLowerCase().trim();
  const isFromTikTok = src.includes("tiktok") || src === "tt";
  const isPaid = PAID_SOURCES.has(src) || PAID_MEDIUMS.has(med) || med.startsWith("paid");
  return { isPaid, isFromTikTok };
}

function readFromLocation(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  try {
    const params = new URLSearchParams(window.location.search);
    const utmSource = params.get("utm_source");
    const utmMedium = params.get("utm_medium");
    const utmCampaign = params.get("utm_campaign");
    const utmContent = params.get("utm_content");
    const utmTerm = params.get("utm_term");
    const ttclid = readMarketingTtclid();

    if (!utmSource && !utmMedium && !utmCampaign && !ttclid) return null;

    const { isPaid, isFromTikTok } = classify(utmSource, utmMedium);

    return {
      utmSource,
      utmMedium,
      utmCampaign,
      utmContent,
      utmTerm,
      ttclid,
      landing: window.location.pathname || "/",
      at: new Date().toISOString(),
      isPaid,
      isFromTikTok,
    };
  } catch {
    return null;
  }
}

function persist(attribution: MarketingAttribution) {
  try {
    sessionStorage.setItem(ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {
    /* ignore */
  }
}

export function useMarketingAttribution(): MarketingAttribution | null {
  const initial = useMemo(() => {
    if (typeof window === "undefined") return null;
    return readMarketingAttribution();
  }, []);

  const [attribution, setAttribution] = useState<MarketingAttribution | null>(initial);

  useEffect(() => {
    const onPop = () => {
      const fromUrl = readFromLocation();
      if (fromUrl) {
        persist(fromUrl);
        setAttribution(fromUrl);
      }
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  return attribution;
}

function touchToMarketingAttribution(
  touch: ReturnType<typeof captureAndPersistAttribution>["last_touch"],
): MarketingAttribution | null {
  if (!touch) return null;
  const { isPaid, isFromTikTok } = classify(touch.utm_source, touch.utm_medium);
  return {
    utmSource: touch.utm_source,
    utmMedium: touch.utm_medium,
    utmCampaign: touch.utm_campaign,
    utmContent: touch.utm_content,
    utmTerm: touch.utm_term,
    ttclid: touch.click_id_type === "ttclid" ? touch.click_id_value : readMarketingTtclid(),
    landing: touch.landing_page ?? touch.initial_path ?? "/",
    at: touch.captured_at,
    isPaid,
    isFromTikTok,
  };
}

/** Read attribution outside React (e.g. inside event handlers or libs). */
export function readMarketingAttribution(): MarketingAttribution | null {
  if (typeof window === "undefined") return null;
  const state = captureAndPersistAttribution();
  const fromTouch = touchToMarketingAttribution(state.last_touch ?? state.first_touch);
  if (fromTouch) {
    persist(fromTouch);
    return fromTouch;
  }
  const ttclid = readMarketingTtclid();
  const persisted = readPersisted();
  if (persisted) {
    if (ttclid && !persisted.ttclid) {
      const merged = { ...persisted, ttclid };
      persist(merged);
      return merged;
    }
    return persisted;
  }
  if (ttclid) {
    const minimal: MarketingAttribution = {
      utmSource: null,
      utmMedium: null,
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
      ttclid,
      landing: window.location.pathname || "/",
      at: new Date().toISOString(),
      isPaid: false,
      isFromTikTok: false,
    };
    persist(minimal);
    return minimal;
  }
  return null;
}
