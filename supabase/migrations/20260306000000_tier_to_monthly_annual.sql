-- Replace basic/plus/premium with monthly/annual (single plan, two billing options)
-- All existing subscribers get 'monthly'; new subscriptions set from Stripe price (monthly vs annual).

-- user_plans: allow monthly/annual, migrate existing
ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_tier_check;

UPDATE public.user_plans
  SET tier = 'monthly'
  WHERE tier IN ('basic', 'plus', 'premium');

ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_tier_check
  CHECK (tier IN ('monthly', 'annual'));

-- onboarding_sessions.selected_tier: allow monthly/annual
ALTER TABLE public.onboarding_sessions DROP CONSTRAINT IF EXISTS onboarding_sessions_selected_tier_check;
UPDATE public.onboarding_sessions SET selected_tier = 'monthly' WHERE selected_tier IN ('basic', 'plus', 'premium');
ALTER TABLE public.onboarding_sessions ADD CONSTRAINT onboarding_sessions_selected_tier_check
  CHECK (selected_tier IN ('monthly', 'annual'));
