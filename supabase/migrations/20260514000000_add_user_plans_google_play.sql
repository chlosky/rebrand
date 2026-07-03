-- Add Google Play subscriber ID column to user_plans (mirrors apple_customer_id).

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS google_play_customer_id TEXT;

COMMENT ON COLUMN public.user_plans.google_play_customer_id IS
  'Google Play subscription/purchase token or RevenueCat subscriber id for Google Play billing.';

-- Expand last_payment_source and first_payment_source to allow 'google_play'.

ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_last_payment_source_check;

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_last_payment_source_check
  CHECK (last_payment_source IS NULL OR last_payment_source IN ('stripe', 'apple', 'google_play'));

ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_first_payment_source_check;

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_first_payment_source_check
  CHECK (first_payment_source IS NULL OR first_payment_source IN ('stripe', 'apple', 'google_play'));
