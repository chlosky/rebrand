-- Add avatar_url column to profiles table
ALTER TABLE public.profiles
ADD COLUMN avatar_url TEXT;

-- Add comment explaining the column
COMMENT ON COLUMN public.profiles.avatar_url IS 'URL of the user''s generated avatar image';