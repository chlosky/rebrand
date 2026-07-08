-- Let signed-in users read their own board orders (matched by checkout email).
GRANT SELECT ON public.board_orders TO authenticated;

DROP POLICY IF EXISTS "board_orders_select_own" ON public.board_orders;

CREATE POLICY "board_orders_select_own"
  ON public.board_orders
  FOR SELECT
  TO authenticated
  USING (email IS NOT NULL AND lower(email) = lower(auth.jwt() ->> 'email'));
