-- Create demo_access_tokens table for time-limited demo access
CREATE TABLE IF NOT EXISTS public.demo_access_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  token text NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT token_expires_check CHECK (expires_at > created_at)
);

-- Create index for fast token lookups
CREATE INDEX IF NOT EXISTS idx_demo_access_tokens_token ON public.demo_access_tokens(token);
CREATE INDEX IF NOT EXISTS idx_demo_access_tokens_email ON public.demo_access_tokens(email);
CREATE INDEX IF NOT EXISTS idx_demo_access_tokens_expires_at ON public.demo_access_tokens(expires_at);

-- Enable RLS
ALTER TABLE public.demo_access_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: Allow anonymous users to read tokens (for verification)
CREATE POLICY "Allow anonymous read of demo tokens"
  ON public.demo_access_tokens
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Policy: Allow service role to insert tokens (via edge function)
CREATE POLICY "Allow service role to insert demo tokens"
  ON public.demo_access_tokens
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Allow service role to update tokens (mark as used)
CREATE POLICY "Allow service role to update demo tokens"
  ON public.demo_access_tokens
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

COMMENT ON TABLE public.demo_access_tokens IS 'Time-limited demo access tokens sent via email. Tokens expire after 15 minutes and can only be used once.';
