-- Add user_id column to user_plans table
-- Remove foreign key constraint from id column (if it exists)
-- Ensure ONLY user_id references auth.users.id with ON DELETE CASCADE
-- This migration is idempotent and safe to run multiple times

-- ============================================================================
-- Step 1: Remove foreign key constraint from id column if it exists
-- ============================================================================
DO $$
DECLARE
  fk_constraint_name TEXT;
BEGIN
  -- Find the foreign key constraint on id column
  SELECT tc.constraint_name INTO fk_constraint_name
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
    AND tc.table_name = kcu.table_name
  JOIN information_schema.referential_constraints rc
    ON tc.constraint_name = rc.constraint_name
    AND tc.table_schema = rc.constraint_schema
  JOIN information_schema.constraint_column_usage ccu
    ON rc.unique_constraint_name = ccu.constraint_name
    AND rc.unique_constraint_schema = ccu.constraint_schema
  WHERE tc.table_schema = 'public'
    AND tc.table_name = 'user_plans'
    AND tc.constraint_type = 'FOREIGN KEY'
    AND kcu.column_name = 'id'
    AND ccu.table_schema = 'auth'
    AND ccu.table_name = 'users'
  LIMIT 1;
  
  -- Drop the foreign key constraint if it exists
  IF fk_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.user_plans DROP CONSTRAINT IF EXISTS %I', fk_constraint_name);
    RAISE NOTICE 'Dropped foreign key constraint % from id column', fk_constraint_name;
  ELSE
    RAISE NOTICE 'No foreign key constraint found on id column';
  END IF;
END $$;

-- ============================================================================
-- Step 2: Ensure id is just a normal UUID primary key (no foreign key)
-- ============================================================================
-- The id column should already be a primary key, we just removed any FK constraint
-- No action needed here as primary key constraint remains

-- ============================================================================
-- Step 3: Add user_id column if it doesn't exist (without FK constraint initially)
-- Step 4: Ensure user_id has the correct foreign key constraint with ON DELETE CASCADE
-- ============================================================================
DO $$
DECLARE
  column_exists BOOLEAN;
  fk_exists BOOLEAN;
BEGIN
  -- Check if user_id column exists
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
    AND column_name = 'user_id'
  ) INTO column_exists;
  
  -- Check if user_id already has a foreign key constraint
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu 
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
      AND tc.table_name = kcu.table_name
    JOIN information_schema.referential_constraints rc
      ON tc.constraint_name = rc.constraint_name
      AND tc.table_schema = rc.constraint_schema
    JOIN information_schema.constraint_column_usage ccu
      ON rc.unique_constraint_name = ccu.constraint_name
      AND rc.unique_constraint_schema = ccu.constraint_schema
    WHERE tc.table_schema = 'public'
      AND tc.table_name = 'user_plans'
      AND tc.constraint_type = 'FOREIGN KEY'
      AND kcu.column_name = 'user_id'
      AND ccu.table_schema = 'auth'
      AND ccu.table_name = 'users'
  ) INTO fk_exists;
  
  -- Add column if it doesn't exist
  IF NOT column_exists THEN
    -- Add user_id column without foreign key first
    ALTER TABLE public.user_plans 
      ADD COLUMN user_id UUID;
    
    RAISE NOTICE 'user_id column added to user_plans table';
  ELSE
    RAISE NOTICE 'user_id column already exists in user_plans table';
  END IF;
  
  -- Add foreign key constraint if it doesn't exist
  -- Check both the complex query result and the specific constraint name to be safe
  IF NOT fk_exists AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
    AND constraint_name = 'user_plans_user_id_fkey'
  ) THEN
    ALTER TABLE public.user_plans 
      ADD CONSTRAINT user_plans_user_id_fkey 
      FOREIGN KEY (user_id) 
      REFERENCES auth.users(id) 
      ON DELETE CASCADE;
    
    RAISE NOTICE 'Added foreign key constraint to user_id column with ON DELETE CASCADE';
  ELSE
    RAISE NOTICE 'user_id already has foreign key constraint (skipping)';
  END IF;
END $$;

-- ============================================================================
-- Step 5: Populate user_id from id column (if id was previously the user_id)
-- ============================================================================
UPDATE public.user_plans
SET user_id = id
WHERE user_id IS NULL
  AND id IS NOT NULL
  AND EXISTS (SELECT 1 FROM auth.users WHERE id = user_plans.id);

-- ============================================================================
-- Step 6: Create index and update RLS policy
-- ============================================================================

-- Ensure the index exists (idempotent)
CREATE INDEX IF NOT EXISTS idx_user_plans_user_id ON public.user_plans(user_id);

-- Update RLS policy to ensure it uses user_id correctly
DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans;
CREATE POLICY "Users can view their own plan"
  ON public.user_plans
  FOR SELECT
  USING (auth.uid() = user_id);

