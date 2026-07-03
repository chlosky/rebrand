-- Ensure user_plans.id has a default value for auto-generation
-- This is required for upsert operations that insert new rows

DO $$
BEGIN
  -- Check if id column has a default value
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'user_plans'
    AND column_name = 'id'
    AND column_default IS NOT NULL
  ) THEN
    -- Add default value if it doesn't exist
    ALTER TABLE public.user_plans
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
    
    RAISE NOTICE 'Added DEFAULT gen_random_uuid() to user_plans.id';
  ELSE
    RAISE NOTICE 'user_plans.id already has a default value';
  END IF;
END $$;
