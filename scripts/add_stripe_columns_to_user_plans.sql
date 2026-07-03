-- Add Stripe-related columns to user_plans table if they don't exist
-- This is idempotent and safe to run multiple times

-- Add new columns for tier-based system
ALTER TABLE public.user_plans 
  ADD COLUMN IF NOT EXISTS tier TEXT CHECK (tier IN ('basic', 'plus', 'premium')),
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMP WITH TIME ZONE;

-- Update status column if it exists with old values, otherwise add it
DO $$
BEGIN
  -- Check if status column exists and has old values
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_plans' 
    AND column_name = 'status'
    AND table_schema = 'public'
  ) THEN
    -- Check if status has old values that need updating
    IF EXISTS (
      SELECT 1 FROM public.user_plans 
      WHERE status IN ('suspended', 'disabled')
    ) THEN
      -- Update old status values to 'active' (or handle as needed)
      UPDATE public.user_plans 
      SET status = 'active' 
      WHERE status IN ('suspended', 'disabled');
    END IF;
    
    -- Drop old check constraint if it exists
    ALTER TABLE public.user_plans 
      DROP CONSTRAINT IF EXISTS user_plans_status_check;
  END IF;
END $$;

-- Add/update status column with new check constraint
ALTER TABLE public.user_plans 
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active';

-- Update check constraint for status
DO $$
BEGIN
  -- Drop old constraint if it exists
  ALTER TABLE public.user_plans 
    DROP CONSTRAINT IF EXISTS user_plans_status_check;
  
  -- Add new constraint
  ALTER TABLE public.user_plans 
    ADD CONSTRAINT user_plans_status_check 
    CHECK (status IN ('active', 'past_due', 'canceled', 'trialing'));
END $$;

-- Create indexes for faster lookups (idempotent)
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_tier ON public.user_plans(tier);
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_customer_id ON public.user_plans(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_user_plans_stripe_subscription_id ON public.user_plans(stripe_subscription_id);

-- Verify columns were added
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_plans' 
    AND column_name = 'stripe_customer_id'
    AND table_schema = 'public'
  ) THEN
    RAISE EXCEPTION 'Failed to add stripe_customer_id column';
  END IF;
  
  RAISE NOTICE 'Successfully added Stripe columns to user_plans table';
END $$;




















































