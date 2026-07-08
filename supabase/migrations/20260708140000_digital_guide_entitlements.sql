-- Digital product catalog + entitlements for the server-side Palette Plotting Guide reader.
-- Access is enforced in edge functions running as service_role; no public RLS policies.

CREATE TABLE IF NOT EXISTS public.digital_products (
  slug text PRIMARY KEY,
  title text NOT NULL,
  reader_path text NOT NULL,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO public.digital_products (slug, title, reader_path)
VALUES (
  'palette-plotting-guide',
  'Palette Plotting Guide',
  '/palette-plotting-guide/read/start-here'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  reader_path = EXCLUDED.reader_path,
  active = EXCLUDED.active;

CREATE TABLE IF NOT EXISTS public.digital_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  product_slug text NOT NULL REFERENCES public.digital_products (slug),
  source text NOT NULL DEFAULT 'stripe',
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- One active entitlement per (email, product).
CREATE UNIQUE INDEX IF NOT EXISTS digital_entitlements_active_unique_idx
  ON public.digital_entitlements (lower(email), product_slug)
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS digital_entitlements_email_idx
  ON public.digital_entitlements (lower(email));

CREATE INDEX IF NOT EXISTS digital_entitlements_checkout_idx
  ON public.digital_entitlements (stripe_checkout_session_id);

ALTER TABLE public.digital_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_entitlements ENABLE ROW LEVEL SECURITY;

-- Service role reaches these tables via table GRANTs (not RLS). Explicit grants so
-- edge functions can read/write regardless of default-privilege timing.
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digital_entitlements TO service_role;
