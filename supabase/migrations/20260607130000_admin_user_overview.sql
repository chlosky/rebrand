-- Admin ops snapshot table. Populated only by refresh_admin_user_overview().
-- Run after:
--   20260604210000_user_preferences_manifestation_routine.sql
--   20260607120000_routine_notification_times.sql
--   manifestation_power_daily_signals charge migrations (May 2025 chain)

DROP VIEW IF EXISTS public.admin_user_overview;

CREATE TABLE public.admin_user_overview (
  user_id uuid PRIMARY KEY,

  profiles_email text,
  profiles_first_name text,
  profiles_username text,
  profiles_selected_character text,
  profiles_created_at timestamptz,
  profiles_updated_at timestamptz,
  profiles_last_activity timestamptz,

  user_preferences_selected_character text,

  onboarding_session_id uuid,
  onboarding_session_status text,
  onboarding_session_first_name text,
  onboarding_session_email text,
  onboarding_session_username text,
  onboarding_session_email_consent boolean,
  onboarding_session_sms_consent boolean,
  onboarding_session_character_id text,
  onboarding_session_selected_tier text,
  onboarding_session_billing text,
  onboarding_session_paid_at timestamptz,
  onboarding_session_app_notifications_consent boolean,
  onboarding_session_expires_at timestamptz,
  onboarding_session_created_at timestamptz,
  onboarding_session_updated_at timestamptz,

  onboarding_has_session boolean NOT NULL DEFAULT false,
  onboarding_reached_checkout boolean NOT NULL DEFAULT false,
  onboarding_is_paid boolean NOT NULL DEFAULT false,
  onboarding_account_created boolean NOT NULL DEFAULT false,
  onboarding_is_active boolean NOT NULL DEFAULT false,

  web_onboarding_has_attribution boolean NOT NULL DEFAULT false,
  web_entry_path text,
  web_page_path text,
  web_referrer text,
  web_utm_source text,
  web_utm_medium text,
  web_utm_campaign text,
  web_utm_content text,
  web_utm_term text,
  web_from_tiktok boolean,
  web_ttclid text,
  web_is_mobile_viewport boolean,
  web_make_my_subliminal_cta_clicked boolean NOT NULL DEFAULT false,
  web_is_paid boolean,
  web_attribution_recorded_at timestamptz,
  web_onboarding_client_visit_id text,

  user_plans_id uuid,
  user_plans_tier text,
  user_plans_billing_period text,
  user_plans_status text,
  user_plans_on_trial boolean,
  user_plans_had_trial boolean,
  user_plans_current_period_end timestamptz,
  user_plans_first_payment_source text,
  user_plans_last_payment_source text,
  user_plans_review_prompt_attempted_at timestamptz,
  user_plans_review_prompt_shown boolean NOT NULL DEFAULT false,
  user_plans_starter_provisioned boolean,
  user_plans_welcome_email_sent_at timestamptz,
  user_plans_apple_customer_id text,
  user_plans_stripe_customer_id text,
  user_plans_stripe_subscription_id text,
  user_plans_created_at timestamptz,
  user_plans_updated_at timestamptz,
  user_has_plan boolean NOT NULL DEFAULT false,

  support_open_case_count bigint NOT NULL DEFAULT 0,
  support_has_admin_unread boolean NOT NULL DEFAULT false,
  support_latest_case_updated_at timestamptz,

  manifestation_intensity text,
  app_notifications_enabled boolean,
  notification_permission_status text,
  manifest_routine_items_count integer NOT NULL DEFAULT 0,
  routine_notification_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  routine_notification_times_count integer NOT NULL DEFAULT 0,

  manifestation_charge_target integer NOT NULL DEFAULT 2,
  manifestation_charge_checkpoints_today integer NOT NULL DEFAULT 0,
  manifestation_charge_status_today text,
  manifestation_charge_last_signal_date date,

  refreshed_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_admin_user_overview_profiles_last_activity
  ON public.admin_user_overview (profiles_last_activity DESC NULLS LAST);

CREATE INDEX IF NOT EXISTS idx_admin_user_overview_manifestation_intensity
  ON public.admin_user_overview (manifestation_intensity);

CREATE INDEX IF NOT EXISTS idx_admin_user_overview_manifestation_charge_status_today
  ON public.admin_user_overview (manifestation_charge_status_today);

CREATE INDEX IF NOT EXISTS idx_admin_user_overview_support_admin_unread
  ON public.admin_user_overview (support_has_admin_unread)
  WHERE support_has_admin_unread = true;

COMMENT ON COLUMN public.admin_user_overview.routine_notification_times IS
  'Daily routine alert times (HH:mm JSON array). COALESCE(user_preferences, profiles).';
COMMENT ON COLUMN public.admin_user_overview.manifestation_charge_target IS
  'Checkpoints required for Locked In today: light=1, consistent=2, locked_in=3.';
COMMENT ON COLUMN public.admin_user_overview.manifestation_charge_checkpoints_today IS
  'Qualifying manifestation_power_daily_signals rows for server CURRENT_DATE (four charge kinds).';
COMMENT ON COLUMN public.admin_user_overview.manifestation_charge_status_today IS
  'needs_persistence | aligned | locked_in — derived from checkpoints vs target.';
COMMENT ON COLUMN public.admin_user_overview.manifestation_charge_last_signal_date IS
  'Most recent signal_date on record for the user (any kind).';

COMMENT ON TABLE public.admin_user_overview IS
  'Admin snapshot (one row per profiles.id). Refreshed via refresh_admin_user_overview(); app reads only; never mutates source tables.';

-- Rebuild snapshot from live tables (SELECT-only on sources).
CREATE OR REPLACE FUNCTION public.refresh_admin_user_overview()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row_count integer;
BEGIN
  TRUNCATE public.admin_user_overview;

  INSERT INTO public.admin_user_overview (
    user_id,
    profiles_email,
    profiles_first_name,
    profiles_username,
    profiles_selected_character,
    profiles_created_at,
    profiles_updated_at,
    profiles_last_activity,
    user_preferences_selected_character,
    onboarding_session_id,
    onboarding_session_status,
    onboarding_session_first_name,
    onboarding_session_email,
    onboarding_session_username,
    onboarding_session_email_consent,
    onboarding_session_sms_consent,
    onboarding_session_character_id,
    onboarding_session_selected_tier,
    onboarding_session_billing,
    onboarding_session_paid_at,
    onboarding_session_app_notifications_consent,
    onboarding_session_expires_at,
    onboarding_session_created_at,
    onboarding_session_updated_at,
    onboarding_has_session,
    onboarding_reached_checkout,
    onboarding_is_paid,
    onboarding_account_created,
    onboarding_is_active,
    web_onboarding_has_attribution,
    web_entry_path,
    web_page_path,
    web_referrer,
    web_utm_source,
    web_utm_medium,
    web_utm_campaign,
    web_utm_content,
    web_utm_term,
    web_from_tiktok,
    web_ttclid,
    web_is_mobile_viewport,
    web_make_my_subliminal_cta_clicked,
    web_is_paid,
    web_attribution_recorded_at,
    web_onboarding_client_visit_id,
    user_plans_id,
    user_plans_tier,
    user_plans_billing_period,
    user_plans_status,
    user_plans_on_trial,
    user_plans_had_trial,
    user_plans_current_period_end,
    user_plans_first_payment_source,
    user_plans_last_payment_source,
    user_plans_review_prompt_attempted_at,
    user_plans_review_prompt_shown,
    user_plans_starter_provisioned,
    user_plans_welcome_email_sent_at,
    user_plans_apple_customer_id,
    user_plans_stripe_customer_id,
    user_plans_stripe_subscription_id,
    user_plans_created_at,
    user_plans_updated_at,
    user_has_plan,
    support_open_case_count,
    support_has_admin_unread,
    support_latest_case_updated_at,
    manifestation_intensity,
    app_notifications_enabled,
    notification_permission_status,
    manifest_routine_items_count,
    routine_notification_times,
    routine_notification_times_count,
    manifestation_charge_target,
    manifestation_charge_checkpoints_today,
    manifestation_charge_status_today,
    manifestation_charge_last_signal_date,
    refreshed_at
  )
  SELECT
    p.id,
    p.email,
    p.first_name,
    p.username,
    p.selected_character::text,
    p.created_at,
    p.updated_at,
    p.last_activity,
    pref.selected_character::text,
    ob.id,
    ob.status::text,
    ob.first_name,
    ob.email,
    ob.username,
    ob.email_consent,
    ob.sms_consent,
    ob.character_id::text,
    ob.selected_tier,
    ob.billing,
    ob.paid_at,
    ob.app_notifications_consent,
    ob.expires_at,
    ob.created_at,
    ob.updated_at,
    (ob.id IS NOT NULL),
    (ob.status IN ('checkout_created', 'paid', 'account_created', 'active')),
    (ob.paid_at IS NOT NULL OR ob.status IN ('paid', 'account_created', 'active')),
    (ob.status IN ('account_created', 'active')),
    (ob.status = 'active'),
    (
      (ob_att.onboarding_answers ? 'web_onboarding_v1')
      OR web_first.id IS NOT NULL
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,entry_path}',
      web_first.entry_path,
      web_latest.entry_path
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,page_path}',
      web_first.page_path,
      web_latest.page_path
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,referrer}',
      web_first.referrer,
      web_latest.referrer
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,utm_source}',
      web_first.utm_source,
      web_latest.utm_source
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,utm_medium}',
      web_first.utm_medium,
      web_latest.utm_medium
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,utm_campaign}',
      web_first.utm_campaign,
      web_latest.utm_campaign
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,utm_content}',
      web_first.utm_content,
      web_latest.utm_content
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,utm_term}',
      web_first.utm_term,
      web_latest.utm_term
    ),
    COALESCE(
      NULLIF(ob_att.onboarding_answers #>> '{web_onboarding_v1,from_tiktok}', '')::boolean,
      web_first.from_tiktok,
      web_latest.from_tiktok
    ),
    COALESCE(
      ob_att.onboarding_answers #>> '{web_onboarding_v1,ttclid}',
      web_first.ttclid,
      web_latest.ttclid
    ),
    COALESCE(
      NULLIF(ob_att.onboarding_answers #>> '{web_onboarding_v1,is_mobile_viewport}', '')::boolean,
      web_first.is_mobile_viewport,
      web_latest.is_mobile_viewport
    ),
    COALESCE(
      NULLIF(ob.onboarding_answers #>> '{web_onboarding_cta_v1,make_my_subliminal_cta_clicked}', '')::boolean,
      web_latest.make_my_subliminal_cta_clicked,
      false
    ),
    COALESCE(
      NULLIF(ob_att.onboarding_answers #>> '{web_onboarding_v1,is_paid}', '')::boolean,
      web_first.is_paid,
      web_latest.is_paid
    ),
    COALESCE(
      (ob_att.onboarding_answers #>> '{web_onboarding_v1,recorded_at}')::timestamptz,
      web_first.created_at,
      web_latest.created_at
    ),
    web_first.client_visit_id,
    up.id,
    up.tier,
    up.billing_period,
    up.status,
    up.on_trial,
    up.had_trial,
    up.current_period_end,
    up.first_payment_source,
    up.last_payment_source,
    up.review_prompt_attempted_at,
    (up.review_prompt_attempted_at IS NOT NULL),
    up.starter_provisioned,
    up.welcome_email_sent_at,
    up.apple_customer_id,
    up.stripe_customer_id,
    up.stripe_subscription_id,
    up.created_at,
    up.updated_at,
    (up.user_id IS NOT NULL),
    COALESCE(sup.support_open_case_count, 0)::bigint,
    COALESCE(sup.support_has_admin_unread, false),
    sup.support_latest_case_updated_at,
    COALESCE(pref.manifestation_intensity, p.manifestation_intensity),
    COALESCE(pref.app_notifications_enabled, p.app_notifications_enabled),
    COALESCE(pref.notification_permission_status, p.notification_permission_status),
    jsonb_array_length(
      COALESCE(pref.manifest_routine_items, p.manifest_routine_items, '[]'::jsonb)
    )::integer,
    COALESCE(pref.routine_notification_times, p.routine_notification_times, '[]'::jsonb),
    jsonb_array_length(
      COALESCE(pref.routine_notification_times, p.routine_notification_times, '[]'::jsonb)
    )::integer,
    CASE COALESCE(pref.manifestation_intensity, p.manifestation_intensity)
      WHEN 'light' THEN 1
      WHEN 'locked_in' THEN 3
      ELSE 2
    END,
    COALESCE(charge.manifestation_charge_checkpoints_today, 0),
    CASE
      WHEN COALESCE(charge.manifestation_charge_checkpoints_today, 0) = 0 THEN 'needs_persistence'
      WHEN COALESCE(charge.manifestation_charge_checkpoints_today, 0) >=
        CASE COALESCE(pref.manifestation_intensity, p.manifestation_intensity)
          WHEN 'light' THEN 1
          WHEN 'locked_in' THEN 3
          ELSE 2
        END
      THEN 'locked_in'
      ELSE 'aligned'
    END,
    charge.manifestation_charge_last_signal_date,
    now()
  FROM public.profiles p
  LEFT JOIN public.user_preferences pref ON pref.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT os.*
    FROM public.onboarding_sessions os
    WHERE os.user_id = p.id
      AND os.onboarding_answers ? 'web_onboarding_v1'
    ORDER BY os.created_at ASC
    LIMIT 1
  ) ob_att ON true
  LEFT JOIN LATERAL (
    SELECT w.*
    FROM public.web_onboarding_sessions w
    WHERE w.user_id = p.id
    ORDER BY w.created_at ASC
    LIMIT 1
  ) web_first ON true
  LEFT JOIN LATERAL (
    SELECT w.*
    FROM public.web_onboarding_sessions w
    WHERE w.user_id = p.id
    ORDER BY w.created_at DESC
    LIMIT 1
  ) web_latest ON true
  LEFT JOIN LATERAL (
    SELECT os.*
    FROM public.onboarding_sessions os
    WHERE os.user_id = p.id
    ORDER BY os.updated_at DESC NULLS LAST, os.created_at DESC
    LIMIT 1
  ) ob ON true
  LEFT JOIN public.user_plans up ON up.user_id = p.id
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (WHERE sc.status = 'open') AS support_open_case_count,
      BOOL_OR(sc.admin_unread) AS support_has_admin_unread,
      MAX(sc.updated_at) AS support_latest_case_updated_at
    FROM public.support_cases sc
    WHERE sc.user_id = p.id
  ) sup ON true
  LEFT JOIN LATERAL (
    SELECT
      COUNT(*) FILTER (
        WHERE m.signal_date = CURRENT_DATE
          AND m.signal_kind IN (
            'affirm_visualize',
            'mirror_work',
            'subliminal_listen',
            'belief_view'
          )
      )::integer AS manifestation_charge_checkpoints_today,
      MAX(m.signal_date) AS manifestation_charge_last_signal_date
    FROM public.manifestation_power_daily_signals m
    WHERE m.user_id = p.id
  ) charge ON true;

  GET DIAGNOSTICS row_count = ROW_COUNT;
  RETURN row_count;
END;
$$;

COMMENT ON FUNCTION public.refresh_admin_user_overview() IS
  'Rebuilds admin_user_overview from profiles and related tables (read-only on sources). Returns inserted row count.';

REVOKE ALL ON FUNCTION public.refresh_admin_user_overview() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.refresh_admin_user_overview() TO service_role;

SELECT public.refresh_admin_user_overview();

ALTER TABLE public.admin_user_overview ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.admin_user_overview FROM PUBLIC;
GRANT SELECT ON public.admin_user_overview TO authenticated;

DROP POLICY IF EXISTS "admin_user_overview_select_admin" ON public.admin_user_overview;

CREATE POLICY "admin_user_overview_select_admin"
  ON public.admin_user_overview
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users a
      WHERE a.user_id = (SELECT auth.uid())
    )
  );

-- Studio may still read manifestation_power_daily_signals for per-kind history;
-- snapshot includes today's charge summary for list/filter views.
DROP POLICY IF EXISTS "manifestation_power_daily_signals_select_admin"
  ON public.manifestation_power_daily_signals;

CREATE POLICY "manifestation_power_daily_signals_select_admin"
  ON public.manifestation_power_daily_signals
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users a
      WHERE a.user_id = (SELECT auth.uid())
    )
  );
