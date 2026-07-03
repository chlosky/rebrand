export type AttributionTouchInput = {
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
  utm_content?: string | null;
  utm_term?: string | null;
  source?: string | null;
  campaign?: string | null;
  ad_id?: string | null;
  adset_id?: string | null;
  campaign_id?: string | null;
  creative_id?: string | null;
  placement?: string | null;
  click_id_type?: string | null;
  click_id_value?: string | null;
  referrer?: string | null;
  landing_page?: string | null;
  initial_path?: string | null;
  locale?: string | null;
  country?: string | null;
  platform?: string | null;
  device_os?: string | null;
  app_version?: string | null;
  captured_at?: string | null;
};

function trimOrNull(value: unknown, max = 500): string | null {
  if (typeof value !== "string") return null;
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function hasTouchSignal(touch: AttributionTouchInput | null | undefined): boolean {
  if (!touch || typeof touch !== "object") return false;
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

function touchToFirstColumns(touch: AttributionTouchInput, prefix: "first_touch" | "last_touch") {
  const atKey = prefix === "first_touch" ? "first_touch_at" : "last_touch_at";
  const capturedAt = trimOrNull(touch.captured_at, 64) ?? new Date().toISOString();
  return {
    [`${prefix}_source`]: trimOrNull(touch.utm_source ?? touch.source, 120),
    [`${prefix}_medium`]: trimOrNull(touch.utm_medium, 120),
    [`${prefix}_campaign`]: trimOrNull(touch.utm_campaign ?? touch.campaign, 200),
    [`${prefix}_content`]: trimOrNull(touch.utm_content, 200),
    [`${prefix}_term`]: trimOrNull(touch.utm_term, 200),
    [`${prefix}_ad_id`]: trimOrNull(touch.ad_id, 120),
    [`${prefix}_adset_id`]: trimOrNull(touch.adset_id, 120),
    [`${prefix}_campaign_id`]: trimOrNull(touch.campaign_id, 120),
    [`${prefix}_creative_id`]: trimOrNull(touch.creative_id, 120),
    [`${prefix}_click_id_type`]: trimOrNull(touch.click_id_type, 32),
    [`${prefix}_click_id_value`]: trimOrNull(touch.click_id_value, 500),
    [`${prefix}_referrer`]: trimOrNull(touch.referrer, 2000),
    [`${prefix}_landing_page`]: trimOrNull(touch.landing_page ?? touch.initial_path, 500),
    [atKey]: capturedAt,
  };
}

/** Map client attribution payload → onboarding_sessions insert columns (create). */
export function attributionInsertFromClient(input: {
  first_touch?: AttributionTouchInput | null;
  last_touch?: AttributionTouchInput | null;
  payload?: Record<string, unknown> | null;
}): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const first = hasTouchSignal(input.first_touch) ? input.first_touch! : null;
  const last = hasTouchSignal(input.last_touch) ? input.last_touch! : first;

  if (first) Object.assign(out, touchToFirstColumns(first, "first_touch"));
  if (last) Object.assign(out, touchToFirstColumns(last, "last_touch"));
  if (input.payload && typeof input.payload === "object") {
    out.attribution_payload = input.payload;
  } else if (first || last) {
    out.attribution_payload = { first_touch: first, last_touch: last };
  }
  return out;
}

/**
 * Merge attribution on update: never overwrite first-touch columns when already set;
 * update last-touch when new campaign data is present.
 */
export function attributionPatchFromClient(
  existing: Record<string, unknown>,
  input: {
    first_touch?: AttributionTouchInput | null;
    last_touch?: AttributionTouchInput | null;
    payload?: Record<string, unknown> | null;
  },
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const hasExistingFirst = Boolean(existing.first_touch_at || existing.first_touch_source);

  if (!hasExistingFirst && hasTouchSignal(input.first_touch)) {
    Object.assign(out, touchToFirstColumns(input.first_touch!, "first_touch"));
  }

  if (hasTouchSignal(input.last_touch)) {
    Object.assign(out, touchToFirstColumns(input.last_touch!, "last_touch"));
  }

  if (input.payload && typeof input.payload === "object") {
    const prev =
      existing.attribution_payload &&
      typeof existing.attribution_payload === "object" &&
      existing.attribution_payload !== null
        ? (existing.attribution_payload as Record<string, unknown>)
        : {};
    out.attribution_payload = { ...prev, ...input.payload, updated_at: new Date().toISOString() };
  }

  return out;
}
