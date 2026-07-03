-- Track where each email capture came from (newsletter, demo popup, demo feedback, etc.)
ALTER TABLE public.email_captures
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS page_path text,
  ADD COLUMN IF NOT EXISTS referrer text;

CREATE INDEX IF NOT EXISTS email_captures_source_idx ON public.email_captures(source);

COMMENT ON COLUMN public.email_captures.source IS 'Capture funnel: homepage_newsletter, homepage_demo_popup, demo_feedback, etc.';
COMMENT ON COLUMN public.email_captures.page_path IS 'Path where the user submitted the form.';
COMMENT ON COLUMN public.email_captures.referrer IS 'document.referrer when available.';
