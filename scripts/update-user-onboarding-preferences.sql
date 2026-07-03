-- Update user onboarding preferences and phone number
-- Replace 'YOUR_EMAIL_HERE' with the email you want to update
-- Replace 'YOUR_PHONE_HERE' with the phone number (format: +1234567890 or 123-456-7890)
-- Support focus: Business, Finances, Self-Love
-- Accountability preference: Daily motivation
-- Note: Onboarding answers go to profiles.onboarding_answers (JSONB), NOT user_character_preferences

DO $$
DECLARE
  target_email TEXT := 'YOUR_EMAIL_HERE';
  target_phone TEXT := 'YOUR_PHONE_HERE';
  target_user_id UUID;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;

  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;

  -- Update phone number in profiles table
  UPDATE public.profiles
  SET 
    phone_number = target_phone,
    phone = target_phone -- Also update phone column if it exists
  WHERE id = target_user_id;

  -- Mark phone as verified in auth.users (requires service role)
  -- Note: This requires service role permissions. If running as regular user, 
  -- you may need to use Supabase Admin API or run this with service role key
  UPDATE auth.users
  SET 
    phone = target_phone,
    phone_confirmed_at = now()
  WHERE id = target_user_id;

  -- Update onboarding answers in profiles.onboarding_answers (JSONB)
  UPDATE public.profiles
  SET 
    onboarding_answers = jsonb_build_object(
      'supportFocus', 'Business, Finances, Self-Love',
      'accountability', 'Daily motivation'
    )
  WHERE id = target_user_id;

  -- Ensure user_character_preferences exists (for character selection and SMS settings only)
  -- This does NOT include onboarding form answers
  INSERT INTO public.user_character_preferences (
    user_id,
    selected_character,
    texts_enabled,
    preferred_send_window
  )
  VALUES (
    target_user_id,
    'river', -- Default character, update if needed
    true,
    'both'
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    updated_at = now();

  RAISE NOTICE 'Successfully updated preferences and phone for user: %', target_user_id;
  RAISE NOTICE 'Phone number set to: % (verified)', target_phone;
  RAISE NOTICE 'Onboarding answers saved to profiles.onboarding_answers';
END $$;

