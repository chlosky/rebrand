-- Add feedback column to email_captures table
ALTER TABLE public.email_captures 
ADD COLUMN IF NOT EXISTS feedback text;

-- Update comment
COMMENT ON TABLE public.email_captures IS 'Simple email capture funnel for homepage. Separate from user profiles and onboarding. Tracks email, first name, marketing consent, and feedback.';
