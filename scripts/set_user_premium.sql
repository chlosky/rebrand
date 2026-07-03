-- Set user to premium tier by email
-- This script updates or creates a user_plans entry for the specified email
-- Replace 'YOUR_EMAIL_HERE' with the email you want to upgrade

DO $$
DECLARE
  target_email TEXT := 'YOUR_EMAIL_HERE';
  target_user_id UUID;
  period_end TIMESTAMP WITH TIME ZONE;
BEGIN
  -- Find user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  IF target_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', target_email;
  END IF;
  
  -- Set period end to 1 year from now
  period_end := NOW() + INTERVAL '1 year';
  
  -- Upsert user_plans entry with premium tier
  INSERT INTO public.user_plans (
    user_id,
    tier,
    status,
    current_period_end,
    updated_at
  )
  VALUES (
    target_user_id,
    'premium',
    'active',
    period_end,
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    tier = 'premium',
    status = 'active',
    current_period_end = period_end,
    updated_at = NOW();
  
  -- Also update subscriptions table for backward compatibility
  INSERT INTO public.subscriptions (
    user_id,
    plan,
    billing_period,
    status,
    current_period_start,
    current_period_end,
    started_at,
    updated_at
  )
  VALUES (
    target_user_id,
    'premium',
    'monthly',
    'active',
    NOW(),
    period_end,
    NOW(),
    NOW()
  )
  ON CONFLICT (user_id)
  DO UPDATE SET
    plan = 'premium',
    status = 'active',
    current_period_start = NOW(),
    current_period_end = period_end,
    updated_at = NOW();
  
  RAISE NOTICE 'Successfully set user % (email: %) to premium tier', target_user_id, target_email;
END $$;

-- Verify the update
SELECT 
  u.email,
  up.tier,
  up.status,
  up.current_period_end,
  up.updated_at
FROM auth.users u
JOIN public.user_plans up ON u.id = up.user_id
WHERE u.email = 'YOUR_EMAIL_HERE';




























