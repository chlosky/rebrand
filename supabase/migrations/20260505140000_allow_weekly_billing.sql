-- Weekly subscription cadence (RevenueCat "Weekly", Apple com.paletteplotting.app.weekly, Stripe weekly price)

-- onboarding_sessions.billing (used by web checkout)
ALTER TABLE public.onboarding_sessions DROP CONSTRAINT IF EXISTS onboarding_sessions_billing_check;
ALTER TABLE public.onboarding_sessions ADD CONSTRAINT onboarding_sessions_billing_check
  CHECK (billing IS NULL OR billing IN ('monthly', 'annual', 'weekly'));

-- user_plans.billing_period (RevenueCat + Stripe sync)
ALTER TABLE public.user_plans ADD COLUMN IF NOT EXISTS billing_period TEXT;
ALTER TABLE public.user_plans DROP CONSTRAINT IF EXISTS user_plans_billing_period_check;
ALTER TABLE public.user_plans ADD CONSTRAINT user_plans_billing_period_check
  CHECK (billing_period IS NULL OR billing_period IN ('monthly', 'annual', 'weekly'));

-- Legacy subscriptions table (if present)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'subscriptions') THEN
    EXECUTE 'ALTER TABLE public.subscriptions DROP CONSTRAINT IF EXISTS subscriptions_billing_period_check';
    EXECUTE $c$
      ALTER TABLE public.subscriptions ADD CONSTRAINT subscriptions_billing_period_check
      CHECK (billing_period IN ('monthly', 'annual', 'weekly'))
    $c$;
  END IF;
END $$;
