-- Ensure user_plans.user_id has a UNIQUE constraint for ON CONFLICT to work
-- This is required for upsert operations in claim-onboarding-session and other functions
-- The original table creation had this constraint, but it may have been lost in later migrations

DO $$
BEGIN
  -- Check if unique constraint already exists
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'public.user_plans'::regclass
    AND conname LIKE '%user_id%'
    AND contype = 'u'  -- 'u' = unique constraint
  ) THEN
    -- Add unique constraint if it doesn't exist
    ALTER TABLE public.user_plans
      ADD CONSTRAINT user_plans_user_id_key UNIQUE (user_id);
    
    RAISE NOTICE 'Added UNIQUE constraint on user_plans.user_id';
  ELSE
    RAISE NOTICE 'UNIQUE constraint on user_plans.user_id already exists';
  END IF;
END $$;
