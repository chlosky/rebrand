import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

type SupabaseServiceClient = ReturnType<typeof createClient>;

export const REVENUECAT_ENTITLEMENT_ID = "Palette Plotting Pro";
export const REVENUECAT_API = "https://api.revenuecat.com/v1/subscribers";

/** Parse user_plans.current_period_end → ms, or NaN. */
function parsePeriodEndMs(value: string | null | undefined): number {
  if (value == null || String(value).trim() === "") return NaN;
  const t = new Date(String(value)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * RC entitlement expiry for max() comparison. Empty expires_date ⇒ still subscribed (treat as +∞).
 */
function revenueCatEntitlementExpiresEndMs(entitlement: RevenueCatEntitlement): number {
  if (entitlement.expires_date == null || String(entitlement.expires_date).trim() === "") {
    return Number.POSITIVE_INFINITY;
  }
  const t = new Date(String(entitlement.expires_date)).getTime();
  return Number.isFinite(t) ? t : Number.POSITIVE_INFINITY;
}

export interface RevenueCatEntitlement {
  expires_date?: string | null;
  product_identifier?: string;
  purchase_date?: string;
  /** Trial / intro / normal — RevenueCat REST (often lowercase). */
  period_type?: string | null;
}

export interface RevenueCatSubscriptionEntry {
  period_type?: string | null;
  expires_date?: string | null;
  /** e.g. APP_STORE, PLAY_STORE — RevenueCat REST subscriber.subscriptions[productId].store */
  store?: string | null;
  store_transaction_id?: string | null;
  original_store_transaction_id?: string | null;
}

export interface RevenueCatSubscriberResponse {
  subscriber?: {
    /** Platform-correct portal link from GET /v1/subscribers (web billing → billing.revenuecat.com or RC portal redirect). */
    management_url?: string | null;
    entitlements?: Record<string, RevenueCatEntitlement>;
    subscriptions?: Record<string, RevenueCatSubscriptionEntry>;
  };
}

function normPeriodType(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

/** Initial profile → user_plans copy only when this column on user_plans is not set yet (later RC syncs do not replace). */
function userPlansIdentityUnset(v: unknown): boolean {
  return v == null || (typeof v === "string" && v.trim() === "");
}

/** Sticky signal from RC snapshot: any subscription row or entitlement shows trial period type. */
export function revenueCatIndicatesHadTrialFromSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (ent && normPeriodType(ent.period_type) === "trial") return true;

  const subs = subscriber?.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const entry = subs[key];
    if (!entry || typeof entry !== "object") continue;
    if (normPeriodType(entry.period_type) === "trial") return true;
  }
  return false;
}

function subscriptionExpiresMs(entry: RevenueCatSubscriptionEntry): number {
  const raw = entry.expires_date;
  if (raw == null || raw === "") return NaN;
  const t = new Date(String(raw)).getTime();
  return Number.isFinite(t) ? t : NaN;
}

/**
 * True if the Palette Plotting entitlement is active and RC reports the current period is a free trial
 * (entitlement.period_type or the linked subscription row).
 */
export function revenueCatOnTrialNow(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  nowMs: number,
): boolean {
  const ent = subscriber?.entitlements?.[entitlementId];
  if (!ent) return false;
  const entActive =
    ent.expires_date == null || ent.expires_date === "" || new Date(String(ent.expires_date)).getTime() > nowMs;
  if (!entActive) return false;

  if (normPeriodType(ent.period_type) === "trial") return true;

  const pid = ent.product_identifier;
  if (pid && subscriber?.subscriptions?.[pid]) {
    const sub = subscriber.subscriptions[pid]!;
    const subMs = subscriptionExpiresMs(sub);
    const subActive = Number.isNaN(subMs) || subMs > nowMs;
    if (subActive && normPeriodType(sub.period_type) === "trial") return true;
  }

  return false;
}

/** Webhook event fields (uppercase TRIAL in docs) — trial start or conversion off trial still counts as ever had trial. */
export function webhookEventImpliesHadTrial(event: Record<string, unknown>): boolean {
  if (normPeriodType(event.period_type) === "trial") return true;
  if (event.is_trial_conversion === true) return true;
  return false;
}

function normalizedRevenueCatStore(store: unknown): string {
  return String(store ?? "").trim().toUpperCase().replace(/-/g, "_");
}

function isAppleStoreFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "APP_STORE" || s === "MAC_APP_STORE";
}

/** RC Web Billing (purchases-js / Stripe gateway under RC). v1 REST often reports store `stripe`. */
function isWebBillingFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "STRIPE" || s === "RC_BILLING" || s === "RCBILLING" || s === "WEB";
}

function isGooglePlayFromRcStore(store: unknown): boolean {
  const s = normalizedRevenueCatStore(store);
  return s === "PLAY_STORE" || s === "GOOGLE_PLAY";
}

/** True when RC subscriber payload or webhook shows Stripe / RC Web Billing (not App Store). */
function isWebBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  activeProductId: string,
  nowMs: number,
): boolean {
  if (webhookEvent && isWebBillingFromRcStore(webhookEvent.store)) return true;
  if (subscriberHasActiveWebBilling(subscriber, entitlementId, nowMs)) return true;

  const mgmt = subscriber?.management_url;
  if (typeof mgmt === "string" && isRevenueCatWebBillingPortalUrl(mgmt)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isWebBillingFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isWebBillingFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

function isAppleBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  appleCustomerId: string | null,
  activeProductId: string,
): boolean {
  if (appleCustomerId) return true;
  if (webhookEvent && isAppleStoreFromRcStore(webhookEvent.store)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isAppleStoreFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isAppleStoreFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

function isGooglePlayBillingFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  webhookEvent: Record<string, unknown> | undefined,
  activeProductId: string,
): boolean {
  if (webhookEvent && isGooglePlayFromRcStore(webhookEvent.store)) return true;

  const activeSub = activeProductId ? subscriber?.subscriptions?.[activeProductId] : undefined;
  if (activeSub && isGooglePlayFromRcStore(activeSub.store)) return true;

  const subs = subscriber?.subscriptions;
  if (subs && typeof subs === "object") {
    for (const key of Object.keys(subs)) {
      const sub = subs[key];
      if (sub && isGooglePlayFromRcStore(sub.store)) return true;
    }
  }
  return false;
}

/** Never label RC Web Billing / Stripe as apple — default RC-placeholder rows to stripe unless App Store is confirmed. */
function lastPaymentSourceFromRcContext(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
  webhookEvent: Record<string, unknown> | undefined,
  appleCustomerId: string | null,
  activeProductId: string,
  nowMs: number,
  existingLastPaymentSource: string | null | undefined,
): "stripe" | "apple" | "google_play" {
  if (isWebBillingFromRcContext(subscriber, entitlementId, webhookEvent, activeProductId, nowMs)) {
    return "stripe";
  }
  if (isAppleBillingFromRcContext(subscriber, entitlementId, webhookEvent, appleCustomerId, activeProductId)) {
    return "apple";
  }
  if (isGooglePlayBillingFromRcContext(subscriber, webhookEvent, activeProductId)) {
    return "google_play";
  }
  if (existingLastPaymentSource === "stripe" || existingLastPaymentSource === "apple" ||
    existingLastPaymentSource === "google_play") {
    return existingLastPaymentSource;
  }
  return "stripe";
}

/** Tokenized portal or RC API redirect used by Web Billing management emails. */
export function isRevenueCatWebBillingPortalUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    if (parsed.hostname === "billing.revenuecat.com") return true;
    if (parsed.hostname === "api.revenuecat.com" && /\/rcbilling\//i.test(parsed.pathname)) return true;
    return false;
  } catch {
    return false;
  }
}

export function subscriberHasActiveWebBilling(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string = REVENUECAT_ENTITLEMENT_ID,
  nowMs = Date.now(),
): boolean {
  if (!subscriber) return false;

  const ent = subscriber.entitlements?.[entitlementId];
  if (ent) {
    const entActive =
      ent.expires_date == null ||
      ent.expires_date === "" ||
      new Date(String(ent.expires_date)).getTime() > nowMs;
    if (entActive) {
      const pid = ent.product_identifier?.trim();
      if (pid && subscriber.subscriptions?.[pid]) {
        if (isWebBillingFromRcStore(subscriber.subscriptions[pid].store)) return true;
      }
    }
  }

  const subs = subscriber.subscriptions;
  if (!subs || typeof subs !== "object") return false;
  for (const key of Object.keys(subs)) {
    const sub = subs[key];
    if (!sub || typeof sub !== "object" || !isWebBillingFromRcStore(sub.store)) continue;
    const subMs = subscriptionExpiresMs(sub);
    if (Number.isNaN(subMs) || subMs > nowMs) return true;
  }
  return false;
}

/** Resolve RC Web Billing customer portal URL from GET /v1/subscribers payload. */
export function webBillingManagementUrlFromRevenueCatPayload(
  data: RevenueCatSubscriberResponse,
  entitlementId: string = REVENUECAT_ENTITLEMENT_ID,
): string | null {
  const subscriber = data.subscriber;
  if (!subscriber || !subscriberHasActiveWebBilling(subscriber, entitlementId)) return null;

  const url = typeof subscriber.management_url === "string" ? subscriber.management_url.trim() : "";
  if (url && isRevenueCatWebBillingPortalUrl(url)) return url;
  return null;
}

/**
 * Apple transaction id for user_plans.apple_customer_id from GET /subscribers (subscription row for entitlement product).
 * Prefers original_store_transaction_id when present (stable across renewals), else store_transaction_id.
 */
export function appleCustomerIdFromRevenueCatSubscriber(
  subscriber: RevenueCatSubscriberResponse["subscriber"],
  entitlementId: string,
): string | null {
  if (!subscriber) return null;
  const ent = subscriber.entitlements?.[entitlementId];
  const pid = ent?.product_identifier?.trim();
  if (!pid) return null;
  const sub = subscriber.subscriptions?.[pid] as RevenueCatSubscriptionEntry | undefined;
  if (!sub || typeof sub !== "object") return null;
  if (!isAppleStoreFromRcStore(sub.store)) return null;
  const orig = sub.original_store_transaction_id?.trim();
  if (orig) return orig;
  const cur = sub.store_transaction_id?.trim();
  if (cur) return cur;
  return null;
}

/** Webhook payload may include transaction ids when store is App Store. */
function appleCustomerIdFromWebhookEvent(event: Record<string, unknown>): string | null {
  if (!isAppleStoreFromRcStore(event.store)) return null;
  const o = event.original_transaction_id;
  const t = event.transaction_id;
  if (typeof o === "string" && o.trim()) return o.trim();
  if (typeof t === "string" && t.trim()) return t.trim();
  const st = event.store_transaction_id;
  if (typeof st === "string" && st.trim()) return st.trim();
  return null;
}

export async function fetchRevenueCatSubscriber(
  secretKey: string,
  appUserId: string,
): Promise<{ ok: true; data: RevenueCatSubscriberResponse } | { ok: false; status: number; body: string }> {
  const encodedId = encodeURIComponent(appUserId);
  const rcRes = await fetch(`${REVENUECAT_API}/${encodedId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${secretKey}`,
      "Content-Type": "application/json",
    },
  });
  if (!rcRes.ok) {
    const body = await rcRes.text();
    return { ok: false, status: rcRes.status, body };
  }
  const data = (await rcRes.json()) as RevenueCatSubscriberResponse;
  return { ok: true, data };
}

export type RevenueCatSyncResult =
  /** `preservedStripe`: after sync, row uses real Stripe `cus_`/`sub_` + `last_payment_source: stripe` (latest expiry vs RC favored Stripe identity). */
  | { ok: true; active: true; preservedStripe: true }
  | { ok: true; active: true; preservedStripe?: false }
  | { ok: true; active: false; preservedExistingPlan: true }
  | { ok: true; active: false; downgraded?: boolean }
  | { ok: false; error: string };

/**
 * Applies RevenueCat subscriber payload to user_plans (same fields as client sync-revenuecat-entitlement).
 * Active entitlement: compares Stripe `current_period_end` vs RC entitlement end; **latest expiry wins** for
 * `current_period_end` and for billing identity: sets `stripe_customer_id`, `stripe_subscription_id`, and
 * `last_payment_source` together (Stripe `cus_`/`sub_` vs RC placeholders) so rows stay consistent.
 * Does not read or write `stripe_customer_id_official` — documentation-only (Stripe checkout).
 * When entitlement is inactive: if DB still shows active with a future current_period_end, leaves row unchanged.
 * Otherwise marks canceled, keeping last period end when possible.
 */
export async function syncUserPlansFromRevenueCatPayload(
  supabase: SupabaseServiceClient,
  appUserId: string,
  rcData: RevenueCatSubscriberResponse,
  opts: { webhookEvent?: Record<string, unknown> },
): Promise<RevenueCatSyncResult> {
  const now = new Date();
  const nowMs = now.getTime();
  const entitlement = rcData.subscriber?.entitlements?.[REVENUECAT_ENTITLEMENT_ID];
  const isActive =
    !!entitlement &&
    (entitlement.expires_date == null ||
      entitlement.expires_date === "" ||
      new Date(entitlement.expires_date) > now);

  const { data: existingBeforeRc } = await supabase
    .from("user_plans")
    .select(
      "last_payment_source, stripe_customer_id, stripe_subscription_id, status, current_period_end, had_trial, on_trial",
    )
    .eq("user_id", appUserId)
    .maybeSingle();

  const appleCustomerId =
    appleCustomerIdFromRevenueCatSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID) ??
    (opts.webhookEvent ? appleCustomerIdFromWebhookEvent(opts.webhookEvent) : null);

  if (!isActive) {
    if (!existingBeforeRc) {
      return { ok: true, active: false };
    }
    const rowForPreserve = existingBeforeRc as {
      status?: string | null;
      current_period_end?: string | null;
    };
    const periodEndMsForPreserve = rowForPreserve.current_period_end
      ? new Date(rowForPreserve.current_period_end).getTime()
      : NaN;
    const hasFuturePeriodInDb =
      !Number.isNaN(periodEndMsForPreserve) && periodEndMsForPreserve > nowMs;
    const isActiveStatusInDb = rowForPreserve.status === "active";
    if (isActiveStatusInDb && hasFuturePeriodInDb) {
      console.error(
        "[revenuecatUserPlansSync] RC inactive but user_plans active with future period; leaving row unchanged",
      );
      return { ok: true, active: false, preservedExistingPlan: true };
    }

    const hadTrial = Boolean((existingBeforeRc as { had_trial?: boolean | null }).had_trial);
    let periodEndToKeep: string | null = null;
    const rawExp = entitlement?.expires_date;
    if (rawExp != null && String(rawExp).trim() !== "") {
      const d = new Date(String(rawExp));
      if (Number.isFinite(d.getTime())) periodEndToKeep = d.toISOString();
    }
    if (!periodEndToKeep) {
      const existingEnd = (existingBeforeRc as { current_period_end?: string | null }).current_period_end;
      if (existingEnd) periodEndToKeep = existingEnd;
    }
    // Do not set tier to "basic" — keep monthly/annual for reactivation UX. Keep last period end instead of null.
    const prevLps = (existingBeforeRc as { last_payment_source?: string | null }).last_payment_source;
    const cancelProductId = entitlement?.product_identifier?.trim() ?? "";
    const lastPaymentSource = lastPaymentSourceFromRcContext(
      rcData.subscriber,
      REVENUECAT_ENTITLEMENT_ID,
      opts.webhookEvent,
      appleCustomerId,
      cancelProductId,
      nowMs,
      prevLps,
    );
    const { error: downErr } = await supabase
      .from("user_plans")
      .update({
        status: "canceled",
        last_payment_source: lastPaymentSource,
        ...(periodEndToKeep != null ? { current_period_end: periodEndToKeep } : {}),
        ...(appleCustomerId != null ? { apple_customer_id: appleCustomerId } : {}),
        updated_at: now.toISOString(),
        had_trial: hadTrial,
        on_trial: false,
      })
      .eq("user_id", appUserId);
    if (downErr) {
      console.error("[revenuecatUserPlansSync] downgrade error:", downErr);
      return { ok: false, error: downErr.message };
    }
    return { ok: true, active: false, downgraded: true };
  }

  const productId = (entitlement!.product_identifier ?? "").toLowerCase();
  const billing = productId.includes("annual")
    ? "annual"
    : productId.includes("weekly")
      ? "weekly"
      : "monthly";

  const dbEndMs = parsePeriodEndMs(
    (existingBeforeRc as { current_period_end?: string | null } | null)?.current_period_end,
  );
  const rcEndRaw = revenueCatEntitlementExpiresEndMs(entitlement!);
  const stripeComparable = Number.isFinite(dbEndMs) ? dbEndMs : Number.NEGATIVE_INFINITY;
  const rcComparable = rcEndRaw === Number.POSITIVE_INFINITY
    ? Number.POSITIVE_INFINITY
    : (Number.isFinite(rcEndRaw) ? rcEndRaw : Number.NEGATIVE_INFINITY);

  const mergedEndMs = Math.max(stripeComparable, rcComparable);
  const finalPeriodEndIso =
    mergedEndMs === Number.POSITIVE_INFINITY || !Number.isFinite(mergedEndMs)
      ? null
      : new Date(mergedEndMs).toISOString();

  const ex = existingBeforeRc as {
    last_payment_source?: string | null;
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
  } | null;
  /** Both required to keep a coherent Stripe row (portal + webhooks resolve by `sub_`). */
  const hasFullStripeIds =
    !!ex?.stripe_customer_id?.trim().startsWith("cus_") &&
    !!ex?.stripe_subscription_id?.trim().startsWith("sub_");

  /** Apple/RC placeholders win when RC expiry is later, or we lack real Stripe ids to compare. */
  let billingIsApple: boolean;
  if (!hasFullStripeIds) {
    billingIsApple = true;
  } else if (rcComparable > stripeComparable) {
    billingIsApple = true;
  } else if (stripeComparable > rcComparable) {
    billingIsApple = false;
  } else {
    // Tie: prefer existing Stripe-backed row when `last_payment_source` is already stripe
    billingIsApple = ex?.last_payment_source !== "stripe";
  }

  const rcHadTrialSnapshot = revenueCatIndicatesHadTrialFromSubscriber(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID);
  const eventHintHadTrial = opts.webhookEvent ? webhookEventImpliesHadTrial(opts.webhookEvent) : false;
  const hadTrialMerged =
    Boolean((existingBeforeRc as { had_trial?: boolean | null } | null)?.had_trial) ||
    rcHadTrialSnapshot ||
    eventHintHadTrial;

  const onTrialNow = revenueCatOnTrialNow(rcData.subscriber, REVENUECAT_ENTITLEMENT_ID, nowMs);

  let userEmail: string | null = null;
  try {
    const { data: authData } = await supabase.auth.admin.getUserById(appUserId);
    userEmail = authData.user?.email ?? null;
  } catch {
    /* non-fatal */
  }

  // Billing columns on upsert (omit stripe_customer_id_official — documentation column only).
  const planData: Record<string, unknown> = {
    user_id: appUserId,
    tier: "premium",
    billing_period: billing,
    status: "active",
    current_period_end: finalPeriodEndIso,
    updated_at: now.toISOString(),
    had_trial: hadTrialMerged,
    on_trial: onTrialNow,
  };
  if (billingIsApple) {
    planData.stripe_customer_id = `revenuecat:${appUserId}`;
    planData.stripe_subscription_id = `rc_${appUserId}`;
    const activeProductId = entitlement!.product_identifier?.trim() ?? "";
    planData.last_payment_source = lastPaymentSourceFromRcContext(
      rcData.subscriber,
      REVENUECAT_ENTITLEMENT_ID,
      opts.webhookEvent,
      appleCustomerId,
      activeProductId,
      nowMs,
      ex?.last_payment_source,
    );
  } else {
    planData.stripe_customer_id = ex!.stripe_customer_id;
    planData.stripe_subscription_id = ex!.stripe_subscription_id ?? null;
    planData.last_payment_source = "stripe";
  }
  if (appleCustomerId != null) planData.apple_customer_id = appleCustomerId;

  const { error: planError } = await supabase.from("user_plans").upsert(planData, {
    onConflict: "user_id",
  });
  if (planError) {
    console.error("[revenuecatUserPlansSync] upsert error:", planError);
    return { ok: false, error: planError.message };
  }

  try {
    const [{ data: planRow }, { data: prof }] = await Promise.all([
      supabase
        .from("user_plans")
        .select("first_name, username, phone, email")
        .eq("user_id", appUserId)
        .maybeSingle(),
      supabase.from("profiles").select("first_name, username, phone, email").eq("id", appUserId).maybeSingle(),
    ]);
    const identityPatch: Record<string, unknown> = {};
    if (planRow && prof) {
      if (userPlansIdentityUnset(planRow.first_name) && prof.first_name != null && String(prof.first_name).trim() !== "") {
        identityPatch.first_name = prof.first_name;
      }
      if (userPlansIdentityUnset(planRow.username) && prof.username != null && String(prof.username).trim() !== "") {
        identityPatch.username = prof.username;
      }
      if (userPlansIdentityUnset(planRow.phone) && prof.phone != null && String(prof.phone).trim() !== "") {
        identityPatch.phone = prof.phone;
      }
      if (userPlansIdentityUnset(planRow.email) && prof.email != null && String(prof.email).trim() !== "") {
        identityPatch.email = prof.email;
      }
    }
    if (Object.keys(identityPatch).length > 0) {
      const { error: idErr } = await supabase.from("user_plans").update(identityPatch).eq("user_id", appUserId);
      if (idErr) console.warn("[revenuecatUserPlansSync] profile mirror to user_plans failed (non-fatal):", idErr);
    }
  } catch (e) {
    console.warn("[revenuecatUserPlansSync] profile mirror to user_plans exception (non-fatal):", e);
  }

  const preservedStripe = !billingIsApple;
  return { ok: true, active: true, preservedStripe };
}
