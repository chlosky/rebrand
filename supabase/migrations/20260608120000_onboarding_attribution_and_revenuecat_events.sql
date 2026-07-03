-- Phase 1: first-touch / last-touch attribution on onboarding_sessions
ALTER TABLE public.onboarding_sessions
  ADD COLUMN IF NOT EXISTS first_touch_source text,
  ADD COLUMN IF NOT EXISTS first_touch_medium text,
  ADD COLUMN IF NOT EXISTS first_touch_campaign text,
  ADD COLUMN IF NOT EXISTS first_touch_content text,
  ADD COLUMN IF NOT EXISTS first_touch_term text,
  ADD COLUMN IF NOT EXISTS first_touch_ad_id text,
  ADD COLUMN IF NOT EXISTS first_touch_adset_id text,
  ADD COLUMN IF NOT EXISTS first_touch_campaign_id text,
  ADD COLUMN IF NOT EXISTS first_touch_creative_id text,
  ADD COLUMN IF NOT EXISTS first_touch_click_id_type text,
  ADD COLUMN IF NOT EXISTS first_touch_click_id_value text,
  ADD COLUMN IF NOT EXISTS first_touch_referrer text,
  ADD COLUMN IF NOT EXISTS first_touch_landing_page text,
  ADD COLUMN IF NOT EXISTS first_touch_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_touch_source text,
  ADD COLUMN IF NOT EXISTS last_touch_medium text,
  ADD COLUMN IF NOT EXISTS last_touch_campaign text,
  ADD COLUMN IF NOT EXISTS last_touch_content text,
  ADD COLUMN IF NOT EXISTS last_touch_term text,
  ADD COLUMN IF NOT EXISTS last_touch_ad_id text,
  ADD COLUMN IF NOT EXISTS last_touch_adset_id text,
  ADD COLUMN IF NOT EXISTS last_touch_campaign_id text,
  ADD COLUMN IF NOT EXISTS last_touch_creative_id text,
  ADD COLUMN IF NOT EXISTS last_touch_click_id_type text,
  ADD COLUMN IF NOT EXISTS last_touch_click_id_value text,
  ADD COLUMN IF NOT EXISTS last_touch_referrer text,
  ADD COLUMN IF NOT EXISTS last_touch_landing_page text,
  ADD COLUMN IF NOT EXISTS last_touch_at timestamptz,
  ADD COLUMN IF NOT EXISTS attribution_payload jsonb,
  ADD COLUMN IF NOT EXISTS revenuecat_app_user_id text,
  ADD COLUMN IF NOT EXISTS revenuecat_attributes_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS paywall_id text,
  ADD COLUMN IF NOT EXISTS paywall_variant text,
  ADD COLUMN IF NOT EXISTS offering_id text,
  ADD COLUMN IF NOT EXISTS package_id text,
  ADD COLUMN IF NOT EXISTS product_id text;

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_revenuecat_app_user_id
  ON public.onboarding_sessions (revenuecat_app_user_id)
  WHERE revenuecat_app_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_first_touch_source
  ON public.onboarding_sessions (first_touch_source)
  WHERE first_touch_source IS NOT NULL;

-- Phase 2: RevenueCat subscription events (webhook store)
CREATE TABLE IF NOT EXISTS public.revenuecat_subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id text UNIQUE NOT NULL,
  app_user_id text,
  original_app_user_id text,
  event_type text,
  product_id text,
  entitlement_id text,
  store text,
  environment text,
  country text,
  currency text,
  price numeric,
  price_in_purchased_currency numeric,
  period_type text,
  purchased_at timestamptz,
  expiration_at timestamptz,
  cancellation_at timestamptz,
  cancel_reason text,
  transaction_id text,
  original_transaction_id text,
  raw_event jsonb NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rc_subscription_events_app_user_id
  ON public.revenuecat_subscription_events (app_user_id);

CREATE INDEX IF NOT EXISTS idx_rc_subscription_events_event_type
  ON public.revenuecat_subscription_events (event_type);

ALTER TABLE public.revenuecat_subscription_events ENABLE ROW LEVEL SECURITY;

-- Service role / edge functions only; no client access
CREATE POLICY "revenuecat_subscription_events_service_only"
  ON public.revenuecat_subscription_events
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Reporting view: attribution × subscription lifecycle
CREATE OR REPLACE VIEW public.onboarding_attribution_subscription_report AS
WITH session_base AS (
  SELECT
    os.id,
    os.user_id,
    os.revenuecat_app_user_id,
    os.first_touch_source,
    os.first_touch_campaign,
    os.first_touch_content,
    os.last_touch_source,
    os.last_touch_campaign,
    os.last_touch_content,
    os.created_at
  FROM public.onboarding_sessions os
),
events AS (
  SELECT
    e.app_user_id,
    e.event_type,
    e.period_type,
    COALESCE(e.price_in_purchased_currency, e.price, 0)::numeric AS revenue_amount
  FROM public.revenuecat_subscription_events e
  WHERE e.app_user_id IS NOT NULL
)
SELECT
  sb.first_touch_source,
  sb.first_touch_campaign,
  sb.first_touch_content,
  sb.last_touch_source,
  sb.last_touch_campaign,
  sb.last_touch_content,
  COUNT(DISTINCT sb.id)::bigint AS onboarding_sessions,
  COUNT(DISTINCT sb.user_id) FILTER (WHERE sb.user_id IS NOT NULL)::bigint AS accounts_created,
  COUNT(DISTINCT e.app_user_id) FILTER (
    WHERE e.event_type = 'INITIAL_PURCHASE'
      AND (e.period_type ILIKE '%trial%' OR e.period_type = 'TRIAL')
  )::bigint AS trials_started,
  COUNT(*) FILTER (WHERE e.event_type = 'INITIAL_PURCHASE')::bigint AS initial_purchases,
  COUNT(*) FILTER (WHERE e.event_type = 'RENEWAL')::bigint AS renewals,
  COALESCE(SUM(e.revenue_amount) FILTER (
    WHERE e.event_type IN ('INITIAL_PURCHASE', 'RENEWAL', 'NON_RENEWING_PURCHASE')
  ), 0)::numeric AS revenue,
  COUNT(*) FILTER (WHERE e.event_type IN ('CANCELLATION', 'EXPIRATION'))::bigint AS expirations_cancellations
FROM session_base sb
LEFT JOIN events e ON e.app_user_id = sb.revenuecat_app_user_id
GROUP BY
  sb.first_touch_source,
  sb.first_touch_campaign,
  sb.first_touch_content,
  sb.last_touch_source,
  sb.last_touch_campaign,
  sb.last_touch_content;

COMMENT ON VIEW public.onboarding_attribution_subscription_report IS
  'Joins onboarding_sessions attribution to RevenueCat subscription events by revenuecat_app_user_id.';
