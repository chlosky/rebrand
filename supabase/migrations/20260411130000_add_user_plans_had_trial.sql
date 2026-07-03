-- Sticky flag: true once the customer ever started with a free trial (Apple or Stripe).
-- Not cleared when the trial ends; use for analytics / UX, not live gating.

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS had_trial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_plans.had_trial IS
  'True if this user ever used a subscription free trial (Apple is_trial_period in receipt history, Stripe trial_start, or RevenueCat period_type trial while syncing). Stays true after trial ends.';
