-- Fix user_plans table: Remove plan_name column and ensure tier is the only field
-- Tiers are: basic, plus, premium (no plan_name needed)

-- ============================================================================
-- Step 1: Ensure tier column exists with proper constraint
-- ============================================================================

ALTER TABLE public.user_plans 
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'plus', 'premium')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- Step 2: Migrate any existing plan_name data to tier (one-time migration)
-- ============================================================================

-- If plan_name column exists and has data, migrate it to tier
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
    AND column_name = 'plan_name'
  ) THEN
    -- Map plan_name to tier if tier is NULL
    UPDATE public.user_plans
    SET tier = CASE 
      WHEN plan_name = 'Starter' THEN 'basic'
      WHEN plan_name = 'Pro' THEN 'plus'
      WHEN plan_name = 'Elite' THEN 'premium'
      WHEN plan_name ILIKE '%starter%' OR plan_name ILIKE '%basic%' THEN 'basic'
      WHEN plan_name ILIKE '%pro%' OR plan_name ILIKE '%plus%' THEN 'plus'
      WHEN plan_name ILIKE '%elite%' OR plan_name ILIKE '%premium%' THEN 'premium'
      ELSE tier
    END
    WHERE tier IS NULL OR tier = '';
  END IF;
END $$;

-- ============================================================================
-- Step 3: Set default tier for any remaining NULL values
-- ============================================================================

UPDATE public.user_plans
SET tier = 'basic'
WHERE tier IS NULL OR tier = '';

-- ============================================================================
-- Step 4: Ensure tier constraint is properly enforced
-- ============================================================================

ALTER TABLE public.user_plans 
  DROP CONSTRAINT IF EXISTS user_plans_tier_check;

ALTER TABLE public.user_plans 
  ADD CONSTRAINT user_plans_tier_check 
  CHECK (tier IN ('basic', 'plus', 'premium'));

-- Make tier NOT NULL
ALTER TABLE public.user_plans 
  ALTER COLUMN tier SET NOT NULL;

-- ============================================================================
-- Step 5: Drop plan_name column (no longer needed - tier is the source of truth)
-- ============================================================================

ALTER TABLE public.user_plans 
  DROP COLUMN IF EXISTS plan_name;

-- ============================================================================
-- Step 6: Create/update indexes for performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_tier ON public.user_plans(tier);
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_customer_id ON public.user_plans(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_subscription_id ON public.user_plans(stripe_subscription_id);

