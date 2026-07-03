-- READ-ONLY: Just verify user_id column exists in user_plans table
-- This does NOT change anything, just shows you what columns exist

-- Show all columns in user_plans table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'user_plans'
ORDER BY ordinal_position;

-- Check specifically if user_id exists
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_plans'
      AND column_name = 'user_id'
    ) THEN 'user_id EXISTS ✓'
    ELSE 'user_id MISSING ✗'
  END AS user_id_status;

