-- Add onboarding_data column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN onboarding_data jsonb DEFAULT '{}'::jsonb;