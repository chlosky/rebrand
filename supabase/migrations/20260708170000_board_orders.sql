-- Physical board orders placed through Stripe Checkout (replaces Shopify order records).
-- Written by the stripe-webhook (service_role). Admin-only read; no public policies.

CREATE TABLE IF NOT EXISTS public.board_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'fulfilled', 'canceled')),
  email text,
  currency text NOT NULL DEFAULT 'usd',
  amount_subtotal integer NOT NULL DEFAULT 0,
  amount_total integer,
  lines jsonb NOT NULL DEFAULT '[]'::jsonb,
  shipping_name text,
  shipping_address jsonb,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  guide_granted boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  paid_at timestamptz
);

CREATE INDEX IF NOT EXISTS board_orders_created_at_idx
  ON public.board_orders (created_at DESC);

CREATE INDEX IF NOT EXISTS board_orders_status_idx
  ON public.board_orders (status);

CREATE INDEX IF NOT EXISTS board_orders_checkout_idx
  ON public.board_orders (stripe_checkout_session_id);

ALTER TABLE public.board_orders ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.board_orders FROM PUBLIC;
REVOKE ALL ON public.board_orders FROM anon;
REVOKE ALL ON public.board_orders FROM authenticated;

GRANT ALL ON public.board_orders TO service_role;

DROP POLICY IF EXISTS "board_orders_select_admin" ON public.board_orders;

CREATE POLICY "board_orders_select_admin"
  ON public.board_orders
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()
    )
  );
