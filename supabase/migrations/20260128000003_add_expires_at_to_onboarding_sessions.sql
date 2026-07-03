-- Add expiration column to onboarding_sessions
-- Sessions expire after 7 days if not claimed
ALTER TABLE onboarding_sessions 
ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ DEFAULT (now() + interval '7 days');

-- Add index for cleanup queries
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_expires_at 
ON onboarding_sessions(expires_at) 
WHERE expires_at IS NOT NULL;

-- Function to clean expired sessions (run periodically via cron or manually)
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM onboarding_sessions 
  WHERE expires_at < now() 
  AND user_id IS NULL; -- Only delete unclaimed sessions
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION cleanup_expired_sessions() TO service_role;
