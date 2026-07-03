-- Create email_captures table for homepage email funnel
-- Separate from user profiles and onboarding - simple email capture with marketing consent

CREATE TABLE IF NOT EXISTS public.email_captures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  marketing_consent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create index on email for lookups
CREATE INDEX IF NOT EXISTS email_captures_email_idx ON public.email_captures(email);
CREATE INDEX IF NOT EXISTS email_captures_created_at_idx ON public.email_captures(created_at);

-- Enable RLS
ALTER TABLE public.email_captures ENABLE ROW LEVEL SECURITY;

-- Allow anonymous users to insert email captures (for homepage form)
CREATE POLICY "Allow anonymous email captures"
  ON public.email_captures
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only authenticated users with admin role can view email captures
-- (This can be adjusted based on your admin role setup)
-- For now, we'll allow service role only via Edge Functions

-- Add comment
COMMENT ON TABLE public.email_captures IS 'Simple email capture funnel for homepage. Separate from user profiles and onboarding. Tracks email and marketing consent.';
