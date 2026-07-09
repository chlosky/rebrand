-- The Palette Letter — newsletter / email list subscribers (palette plotting).

CREATE TABLE IF NOT EXISTS public.palette_plot_letter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  email text NOT NULL,
  first_name text,
  signup_source text NOT NULL
    CHECK (signup_source IN ('homepage', 'footer', 'product_page', 'digital_guide')),
  signup_page_path text,
  marketing_consent boolean NOT NULL DEFAULT true,
  consent_recorded_at timestamptz NOT NULL DEFAULT now(),
  tag_palette_letter boolean NOT NULL DEFAULT true,
  tag_palette_plotting_interest boolean NOT NULL DEFAULT true,
  tag_board_interest boolean NOT NULL DEFAULT false,
  tag_digital_system_interest boolean NOT NULL DEFAULT false,
  tag_general_interest boolean NOT NULL DEFAULT false,
  brevo_contact_id text,
  brevo_synced_at timestamptz,
  brevo_last_error text,
  CONSTRAINT palette_plot_letter_subscribers_email_unique UNIQUE (email)
);

COMMENT ON TABLE public.palette_plot_letter_subscribers IS
  'The Palette Letter email list. One row per email; tags are boolean columns for segmentation.';

COMMENT ON COLUMN public.palette_plot_letter_subscribers.signup_source IS
  'First or latest signup surface: homepage, footer, product_page, digital_guide.';

COMMENT ON COLUMN public.palette_plot_letter_subscribers.tag_palette_letter IS
  'Subscribed to The Palette Letter.';

COMMENT ON COLUMN public.palette_plot_letter_subscribers.tag_palette_plotting_interest IS
  'Interested in the palette plotting System / method.';

COMMENT ON COLUMN public.palette_plot_letter_subscribers.tag_board_interest IS
  'Signed up from a board product page.';

COMMENT ON COLUMN public.palette_plot_letter_subscribers.tag_digital_system_interest IS
  'Signed up from the digital guide / palette plotting System page.';

COMMENT ON COLUMN public.palette_plot_letter_subscribers.tag_general_interest IS
  'Signed up from homepage or footer.';

CREATE INDEX IF NOT EXISTS palette_plot_letter_subscribers_created_at_idx
  ON public.palette_plot_letter_subscribers (created_at DESC);

CREATE INDEX IF NOT EXISTS palette_plot_letter_subscribers_signup_source_idx
  ON public.palette_plot_letter_subscribers (signup_source);

ALTER TABLE public.palette_plot_letter_subscribers ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.palette_plot_letter_subscribers FROM PUBLIC;
REVOKE ALL ON public.palette_plot_letter_subscribers FROM anon;
REVOKE ALL ON public.palette_plot_letter_subscribers FROM authenticated;

GRANT ALL ON public.palette_plot_letter_subscribers TO service_role;

DROP POLICY IF EXISTS "palette_plot_letter_subscribers_select_admin"
  ON public.palette_plot_letter_subscribers;

CREATE POLICY "palette_plot_letter_subscribers_select_admin"
  ON public.palette_plot_letter_subscribers
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()
    )
  );
