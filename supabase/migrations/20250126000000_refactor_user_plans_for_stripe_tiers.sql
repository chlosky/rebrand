-- Refactor user_plans table to match new Stripe + tiers architecture
-- This table will be the single source of truth for user tiers and feature access

-- Drop old trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created_plan ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_plan();

-- Update user_plans table structure
ALTER TABLE public.user_plans 
  DROP COLUMN IF EXISTS plan_name;

-- Add new columns for tier-based system
ALTER TABLE public.user_plans 
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'plus', 'premium')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Create index for faster tier lookups
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_tier ON public.user_plans(tier);
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_customer_id ON public.user_plans(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_subscription_id ON public.user_plans(stripe_subscription_id);

-- Migrate existing data from subscriptions table to user_plans
-- This ensures existing users have their tier set
INSERT INTO public.user_plans (user_id, tier, stripe_customer_id, stripe_subscription_id, status, current_period_end, updated_at)
SELECT 
  s.user_id,
  s.plan as tier,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.status,
  s.current_period_end,
  s.updated_at
FROM public.subscriptions s
WHERE s.status = 'active'
ON CONFLICT (user_id) 
DO UPDATE SET
  tier = EXCLUDED.tier,
  stripe_customer_id = COALESCE(EXCLUDED.stripe_customer_id, user_plans.stripe_customer_id),
  stripe_subscription_id = COALESCE(EXCLUDED.stripe_subscription_id, user_plans.stripe_subscription_id),
  status = EXCLUDED.status,
  current_period_end = EXCLUDED.current_period_end,
  updated_at = EXCLUDED.updated_at;

-- Update RLS policies to ensure users can view their own plan
DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans;
DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans;

CREATE POLICY "Users can view their own plan"
  ON public.user_plans
  FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update their own plan"
  ON public.user_plans
  FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

-- Note: Webhooks will update user_plans using service role key (bypasses RLS)





















































