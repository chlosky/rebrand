-- Temporary Shopify/Recharge web billing: allow shopify as a payment source on user_plans.
ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_first_payment_source_check;

ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_last_payment_source_check;

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_first_payment_source_check
  CHECK (first_payment_source IS NULL OR first_payment_source IN ('stripe', 'apple', 'google_play', 'shopify'));

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_last_payment_source_check
  CHECK (last_payment_source IS NULL OR last_payment_source IN ('stripe', 'apple', 'google_play', 'shopify'));
