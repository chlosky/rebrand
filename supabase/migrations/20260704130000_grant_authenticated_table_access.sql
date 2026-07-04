-- Baseline created RLS policies but omitted PostgREST table privileges for authenticated/anon.
-- Without these GRANTs, client .from() queries return 403 even when RLS would allow the row.

GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated, anon;

ALTER DEFAULT PRIVILEGES IN SCHEMA public
  GRANT USAGE, SELECT ON SEQUENCES TO authenticated, anon;

-- Service-only tables (explicit revokes from baseline).
REVOKE ALL ON public.user_plan_brevo_welcome_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_welcome_queue TO service_role;

REVOKE ALL ON public.user_plan_brevo_cancellation_queue FROM anon, authenticated;
GRANT ALL ON public.user_plan_brevo_cancellation_queue TO service_role;

REVOKE ALL ON public.routine_push_delivery_log FROM anon, authenticated;
GRANT ALL ON public.routine_push_delivery_log TO service_role;

-- Dev/staging test account: ensure active Pro (idempotent).
DO $ensure$
DECLARE
  v_user_id uuid;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE lower(email) = 'support@test.com'
  LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE 'support@test.com not found — skip pro plan ensure';
    RETURN;
  END IF;

  INSERT INTO public.user_plans (
    user_id,
    tier,
    status,
    billing_period,
    last_payment_source,
    first_payment_source,
    current_period_end,
    starter_provisioned,
    on_trial,
    had_trial,
    updated_at
  ) VALUES (
    v_user_id,
    'monthly',
    'active',
    'monthly',
    'stripe',
    'stripe',
    now() + interval '1 year',
    true,
    false,
    false,
    now()
  )
  ON CONFLICT (user_id) DO UPDATE SET
    tier = 'monthly',
    status = 'active',
    billing_period = 'monthly',
    last_payment_source = 'stripe',
    first_payment_source = coalesce(public.user_plans.first_payment_source, 'stripe'),
    current_period_end = now() + interval '1 year',
    starter_provisioned = true,
    on_trial = false,
    updated_at = now();
END
$ensure$;
