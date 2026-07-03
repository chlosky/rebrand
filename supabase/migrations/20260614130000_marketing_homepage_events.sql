-- Homepage / link-in-bio analytics (store routing). Real table — not a view.
-- Writes: service_role only (log-marketing-homepage-event edge function).
-- Reads: admin_users only via RLS. No anon/authenticated client access.

CREATE TABLE IF NOT EXISTS public.marketing_homepage_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'store_click')),
  visit_id uuid NOT NULL,
  page_path text,
  landing_query text,
  referrer text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  click_source text,
  store_target text CHECK (
    store_target IS NULL OR store_target IN ('apple', 'google', 'qr_scroll')
  ),
  routed_store_url text,
  is_mobile_viewport boolean,
  device_os text,
  browser_language text,
  timezone text,
  screen_width int,
  screen_height int,
  pixel_ratio numeric(4, 2),
  user_agent text,
  in_app_browser text,
  country_code text,
  region text,
  city text,
  is_from_tiktok boolean,
  CONSTRAINT marketing_homepage_events_visit_id_check CHECK (
    visit_id IS NOT NULL
  )
);

COMMENT ON TABLE public.marketing_homepage_events IS
  'Web homepage visits and store download clicks. Insert via edge function only; select for admins only.';

CREATE INDEX IF NOT EXISTS idx_marketing_homepage_events_created_at
  ON public.marketing_homepage_events (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_homepage_events_event_type_created_at
  ON public.marketing_homepage_events (event_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketing_homepage_events_utm_campaign
  ON public.marketing_homepage_events (utm_campaign)
  WHERE utm_campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_marketing_homepage_events_visit_id
  ON public.marketing_homepage_events (visit_id);

ALTER TABLE public.marketing_homepage_events ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.marketing_homepage_events FROM PUBLIC;
REVOKE ALL ON public.marketing_homepage_events FROM anon;
REVOKE ALL ON public.marketing_homepage_events FROM authenticated;

GRANT ALL ON public.marketing_homepage_events TO service_role;
GRANT SELECT ON public.marketing_homepage_events TO authenticated;

DROP POLICY IF EXISTS "marketing_homepage_events_select_admin"
  ON public.marketing_homepage_events;

CREATE POLICY "marketing_homepage_events_select_admin"
  ON public.marketing_homepage_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.admin_users a
      WHERE a.user_id = auth.uid()
    )
  );

-- No INSERT/UPDATE/DELETE policies for authenticated or anon — clients cannot write.
