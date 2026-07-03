-- Backfill text_message_enablement_log with existing texts_enabled status from user_preferences
-- This creates an initial log entry for users who already have a texts_enabled setting

DO $$
BEGIN
  -- Insert initial log entries for users who have texts_enabled set in user_preferences
  -- but no corresponding log entry
  INSERT INTO public.text_message_enablement_log (user_id, texts_enabled, previous_status, source, created_at)
  SELECT 
    up.user_id,
    up.texts_enabled,
    NULL as previous_status, -- Initial setting, no previous
    'backfill' as source, -- Mark as backfilled
    COALESCE(up.created_at, now()) as created_at
  FROM public.user_preferences up
  WHERE up.texts_enabled IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 
      FROM public.text_message_enablement_log tmel
      WHERE tmel.user_id = up.user_id
    )
  ON CONFLICT DO NOTHING; -- Avoid duplicates if run multiple times

  RAISE NOTICE 'Backfilled text message enablement log with existing user preferences';
END $$;













































