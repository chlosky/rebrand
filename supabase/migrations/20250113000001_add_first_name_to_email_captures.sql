-- Add first_name column to email_captures table
ALTER TABLE public.email_captures 
ADD COLUMN IF NOT EXISTS first_name text;

-- Update comment
COMMENT ON TABLE public.email_captures IS 'Simple email capture funnel for homepage. Separate from user profiles and onboarding. Tracks email, first name, and marketing consent.';
