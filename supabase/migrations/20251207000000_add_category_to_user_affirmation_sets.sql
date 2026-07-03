-- Add category column to user_affirmation_sets table
-- Categories match the 12 support focus options from onboarding

DO $$
BEGIN
  -- Add category column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_affirmation_sets' 
    AND column_name = 'category'
  ) THEN
    ALTER TABLE public.user_affirmation_sets 
      ADD COLUMN category TEXT;
    
    -- Add CHECK constraint to ensure only valid categories
    ALTER TABLE public.user_affirmation_sets
      ADD CONSTRAINT user_affirmation_sets_category_check 
      CHECK (category IS NULL OR category IN (
        'Career', 'Business', 'Learning',
        'Finances', 'Productivity', 'Organization',
        'Confidence', 'Self-Love', 'Connections',
        'Fitness', 'Nutrition', 'Discipline'
      ));
    
    -- Add comment
    COMMENT ON COLUMN public.user_affirmation_sets.category IS 'Support category for the affirmation set (Career, Business, Learning, Finances, Productivity, Organization, Confidence, Self-Love, Connections, Fitness, Nutrition, Discipline)';
  ELSE
    -- If column exists but constraint doesn't, add the constraint
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_schema = 'public' 
      AND constraint_name = 'user_affirmation_sets_category_check'
    ) THEN
      ALTER TABLE public.user_affirmation_sets
        ADD CONSTRAINT user_affirmation_sets_category_check 
        CHECK (category IS NULL OR category IN (
          'Career', 'Business', 'Learning',
          'Finances', 'Productivity', 'Organization',
          'Confidence', 'Self-Love', 'Connections',
          'Fitness', 'Nutrition', 'Discipline'
        ));
    END IF;
  END IF;
END $$;

