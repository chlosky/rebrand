-- Live flag: user is in a free trial right now (Stripe trialing, Apple receipt line, or RC period_type trial).
-- Unlike had_trial, this should reflect current state and go false when trial ends.

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS on_trial boolean NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_plans.on_trial IS
  'True while the subscription is currently in a free trial (RevenueCat/Apple period, or Stripe status trialing). Cleared when trial ends or access is removed.';
