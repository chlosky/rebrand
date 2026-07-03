-- Check character selection for a user
-- Run this in Supabase SQL Editor
-- Replace 'YOUR_EMAIL_HERE' with the email you want to check

-- First, find the user ID
SELECT 
  id as user_id,
  email,
  created_at
FROM auth.users
WHERE email = 'YOUR_EMAIL_HERE';

-- Then check their character preference
-- Replace 'USER_ID_HERE' with the user_id from above query, or use this combined query:
SELECT 
  u.email,
  u.id as user_id,
  up.selected_character,
  up.created_at as pref_created_at,
  up.updated_at as pref_updated_at
FROM auth.users u
LEFT JOIN public.user_preferences up ON u.id = up.user_id
WHERE u.email = 'YOUR_EMAIL_HERE';

-- Also check all character preferences to see what's in the table
SELECT 
  user_id,
  selected_character,
  created_at,
  updated_at
FROM public.user_preferences
ORDER BY updated_at DESC
LIMIT 20;





















