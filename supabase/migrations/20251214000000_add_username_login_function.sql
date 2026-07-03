-- Create function to get email by username (for login purposes)
-- Uses SECURITY DEFINER to bypass RLS for this specific lookup
-- This allows unauthenticated users to look up their email by username during login
CREATE OR REPLACE FUNCTION public.get_email_by_username(lookup_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
BEGIN
  SELECT email 
  INTO user_email
  FROM public.profiles 
  WHERE LOWER(TRIM(username)) = LOWER(TRIM(lookup_username))
  LIMIT 1;
  
  RETURN user_email;
END;
$$;

-- Grant execute permissions to anon and authenticated users
-- anon is needed because users aren't authenticated yet when logging in
GRANT EXECUTE ON FUNCTION public.get_email_by_username(TEXT) TO anon, authenticated;

