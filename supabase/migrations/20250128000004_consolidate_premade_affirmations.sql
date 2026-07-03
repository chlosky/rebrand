-- Consolidate premade_affirmations into premade_affirmation_sets
-- This migration adds affirmations JSONB column to premade_affirmation_sets and migrates data

-- ============================================================================
-- Step 1: Add affirmations JSONB column to premade_affirmation_sets
-- ============================================================================

ALTER TABLE public.premade_affirmation_sets 
  ADD COLUMN IF NOT EXISTS affirmations JSONB DEFAULT '[]'::jsonb;

-- ============================================================================
-- Step 2: Migrate affirmations data from premade_affirmations to premade_affirmation_sets
-- ============================================================================

-- Aggregate affirmations by set_id, preserving order_index
UPDATE public.premade_affirmation_sets pas
SET affirmations = COALESCE(
  (
    SELECT jsonb_agg(
      jsonb_build_object(
        'text', pa.text,
        'order_index', COALESCE(pa.order_index, 0)
      ) ORDER BY COALESCE(pa.order_index, 0), pa.created_at
    )
    FROM public.premade_affirmations pa
    WHERE pa.set_id = pas.id
  ),
  '[]'::jsonb
)
WHERE EXISTS (
  SELECT 1 FROM public.premade_affirmations pa WHERE pa.set_id = pas.id
);

-- ============================================================================
-- Step 3: Drop foreign key constraint and indexes on premade_affirmations
-- ============================================================================

-- Drop foreign key constraint
ALTER TABLE public.premade_affirmations 
  DROP CONSTRAINT IF EXISTS premade_affirmations_set_id_fkey;

-- Drop indexes
DROP INDEX IF EXISTS idx_premade_affirmations_set_id;

-- ============================================================================
-- Step 4: Drop RLS policies on premade_affirmations
-- ============================================================================

DROP POLICY IF EXISTS "Anyone can view premade affirmations" ON public.premade_affirmations;
DROP POLICY IF EXISTS "Admins can manage premade affirmations" ON public.premade_affirmations;

-- ============================================================================
-- Step 5: Drop premade_affirmations table
-- ============================================================================

DROP TABLE IF EXISTS public.premade_affirmations CASCADE;

-- ============================================================================
-- Step 6: Create index on affirmations column for performance (GIN index for JSONB)
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_premade_affirmation_sets_affirmations 
  ON public.premade_affirmation_sets USING GIN (affirmations);

-- ============================================================================
-- Verification Query (run this after migration to check results)
-- ============================================================================

-- SELECT 
--   id,
--   title,
--   description,
--   category,
--   jsonb_array_length(affirmations) as affirmation_count,
--   affirmations
-- FROM public.premade_affirmation_sets
-- ORDER BY created_at DESC
-- LIMIT 10;





