-- Backfill character_selection_log with existing character selections from user_preferences
-- This creates an initial log entry for users who already have a selected_character
-- but no log entry yet (users who selected before logging was implemented)

DO $$
BEGIN
  -- Insert initial log entries for users who have a selected_character in user_preferences
  -- but no corresponding log entry
  INSERT INTO public.character_selection_log (user_id, selected_character, previous_character, source, created_at)
  SELECT 
    up.user_id,
    up.selected_character,
    NULL as previous_character, -- Initial selection, no previous
    'backfill' as source, -- Mark as backfilled
    COALESCE(up.created_at, up.updated_at, now()) as created_at
  FROM public.user_preferences up
  WHERE up.selected_character IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM public.character_selection_log csl
      WHERE csl.user_id = up.user_id
    )
  ON CONFLICT DO NOTHING; -- Avoid duplicates if run multiple times

  -- Also backfill from profiles table if it has selected_character and user doesn't have a log entry
  -- This handles cases where character might be in profiles but not in user_preferences
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'selected_character'
  ) THEN
    INSERT INTO public.character_selection_log (user_id, selected_character, previous_character, source, created_at)
    SELECT 
      p.id as user_id,
      CASE 
        WHEN LOWER(p.selected_character::text) = 'river' THEN 'river'::character_type
        WHEN LOWER(p.selected_character::text) = 'sage' THEN 'sage'::character_type
        WHEN LOWER(p.selected_character::text) = 'rose' THEN 'rose'::character_type
        WHEN LOWER(p.selected_character::text) = 'oliver' THEN 'oliver'::character_type
        ELSE NULL
      END as selected_character,
      NULL as previous_character, -- Initial selection, no previous
      'backfill' as source, -- Mark as backfilled
      COALESCE(p.created_at, now()) as created_at
    FROM public.profiles p
    WHERE p.selected_character IS NOT NULL
      AND CASE 
        WHEN LOWER(p.selected_character::text) = 'river' THEN 'river'::character_type
        WHEN LOWER(p.selected_character::text) = 'sage' THEN 'sage'::character_type
        WHEN LOWER(p.selected_character::text) = 'rose' THEN 'rose'::character_type
        WHEN LOWER(p.selected_character::text) = 'oliver' THEN 'oliver'::character_type
        ELSE NULL
      END IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 
        FROM public.character_selection_log csl
        WHERE csl.user_id = p.id
      )
    ON CONFLICT DO NOTHING; -- Avoid duplicates if run multiple times
  END IF;

  RAISE NOTICE 'Backfilled character selection log with existing selections';
END $$;













































