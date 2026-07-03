-- Fix: production has a misnamed constraint "profiles_tier_check" on user_plans.
-- Drop it, set all existing users to premium, and allow monthly/annual (new) + basic/plus/premium (legacy).
-- Idempotent: safe to run multiple times.

-- 1) Drop any existing tier check constraints (wrongly named or old definition)
ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS profiles_tier_check;

ALTER TABLE public.user_plans
  DROP CONSTRAINT IF EXISTS user_plans_tier_check;

-- 2) Overwrite all existing users to premium
UPDATE public.user_plans
  SET tier = 'premium';

-- 3) Add canonical tier check (new subs use monthly/annual; legacy/backfill use basic/plus/premium)
ALTER TABLE public.user_plans
  ADD CONSTRAINT user_plans_tier_check
  CHECK (tier IN ('monthly', 'annual', 'basic', 'plus', 'premium'));
