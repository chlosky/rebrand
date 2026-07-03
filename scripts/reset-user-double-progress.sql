-- Reset daily power progress and activity tracking for a user (today only)
-- Run this in Supabase SQL Editor (runs with service role, bypasses RLS)
-- Replace 'YOUR_EMAIL_HERE' with the email you want to reset

DO $$
DECLARE
  target_email TEXT := 'YOUR_EMAIL_HERE';
  target_user_id UUID;
  today_date DATE;
  deleted_progress INTEGER;
  deleted_history INTEGER;
BEGIN
  -- Find user by exact email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email
  LIMIT 1;

  -- Check if user was found
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email "%" not found', target_email;
  END IF;

  -- Get today's date (in UTC, but we'll check multiple date formats)
  today_date := CURRENT_DATE;
  
  RAISE NOTICE 'Found user: %', target_user_id;
  RAISE NOTICE 'Resetting data for date: % (and checking yesterday/tomorrow in case of timezone issues)', today_date;

  -- First, show what exists
  RAISE NOTICE 'Checking existing records...';
  
  -- Delete user_double_progress for today and nearby dates (timezone safety)
  DELETE FROM public.user_double_progress
  WHERE user_id = target_user_id
    AND progress_date IN (
      today_date,
      today_date - INTERVAL '1 day',
      today_date + INTERVAL '1 day'
    );
  
  GET DIAGNOSTICS deleted_progress = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_double_progress record(s)', deleted_progress;

  -- Delete user_double_action_history for today and nearby dates (timezone safety)
  DELETE FROM public.user_double_action_history
  WHERE user_id = target_user_id
    AND action_date IN (
      today_date,
      today_date - INTERVAL '1 day',
      today_date + INTERVAL '1 day'
    );
  
  GET DIAGNOSTICS deleted_history = ROW_COUNT;
  RAISE NOTICE 'Deleted % user_double_action_history record(s)', deleted_history;

  -- Also try to update any remaining records to 0 (in case delete didn't work)
  UPDATE public.user_double_progress
  SET progress = 0,
      completed_actions = '[]'::jsonb
  WHERE user_id = target_user_id
    AND progress_date IN (
      today_date,
      today_date - INTERVAL '1 day',
      today_date + INTERVAL '1 day'
    );
  
  UPDATE public.user_double_action_history
  SET actions = '[]'::jsonb
  WHERE user_id = target_user_id
    AND action_date IN (
      today_date,
      today_date - INTERVAL '1 day',
      today_date + INTERVAL '1 day'
    );

  RAISE NOTICE 'Reset complete! User daily power and activity tracking reset to 0.';
  RAISE NOTICE 'Please refresh your browser to see the changes.';
END $$;

