-- Remove onboarding-related columns from user_character_preferences
-- These should only be in profiles.onboarding_answers (JSONB), not in user_character_preferences
-- user_character_preferences should only contain: selected_character, texts_enabled, preferred_send_window, timezone

DO $$ 
BEGIN
  -- Remove support_focus column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_character_preferences' AND column_name = 'support_focus'
  ) THEN
    ALTER TABLE public.user_character_preferences DROP COLUMN support_focus;
    RAISE NOTICE 'Removed support_focus column from user_character_preferences';
  END IF;

  -- Remove accountability_preference column if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_character_preferences' AND column_name = 'accountability_preference'
  ) THEN
    ALTER TABLE public.user_character_preferences DROP COLUMN accountability_preference;
    RAISE NOTICE 'Removed accountability_preference column from user_character_preferences';
  END IF;
END $$;























































