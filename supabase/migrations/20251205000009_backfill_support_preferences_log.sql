-- Backfill support_preferences_log with existing support focus and accountability from profiles.onboarding_answers
-- This creates an initial log entry for users who already have these preferences but no log entry yet

DO $$
BEGIN
  -- Insert initial log entries for users who have support focus or accountability in onboarding_answers
  -- but no corresponding log entry
  INSERT INTO public.support_preferences_log (user_id, support_focus, previous_support_focus, support_style, previous_support_style, source, created_at)
  SELECT 
    p.id as user_id,
    CASE 
      WHEN p.onboarding_answers->>'supportFocus' IS NOT NULL THEN
        string_to_array(p.onboarding_answers->>'supportFocus', ', ')
      ELSE NULL
    END as support_focus,
    NULL as previous_support_focus, -- Initial selection, no previous
    p.onboarding_answers->>'accountability' as support_style,
    NULL as previous_support_style, -- Initial selection, no previous
    'backfill' as source, -- Mark as backfilled
    COALESCE(p.created_at, now()) as created_at
  FROM public.profiles p
  WHERE (p.onboarding_answers->>'supportFocus' IS NOT NULL OR p.onboarding_answers->>'accountability' IS NOT NULL)
    AND NOT EXISTS (
      SELECT 1 
      FROM public.support_preferences_log spl
      WHERE spl.user_id = p.id
    )
  ON CONFLICT DO NOTHING; -- Avoid duplicates if run multiple times

  RAISE NOTICE 'Backfilled support preferences log with existing onboarding answers';
END $$;













































