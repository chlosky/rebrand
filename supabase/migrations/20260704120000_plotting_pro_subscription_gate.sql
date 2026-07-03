-- Gate board system + uploads behind active Palette Plotting Pro subscription (server-side RLS).

CREATE OR REPLACE FUNCTION public.has_active_plotting_subscription(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_plans up
    WHERE up.user_id = check_user_id
      AND up.status = 'active'
      AND (up.current_period_end IS NULL OR up.current_period_end > now())
  );
$$;

REVOKE ALL ON FUNCTION public.has_active_plotting_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_plotting_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_plotting_subscription(uuid) TO service_role;

COMMENT ON FUNCTION public.has_active_plotting_subscription IS
  'True when user_plans row is active and current_period_end is null or in the future.';

-- board_workspaces
DROP POLICY IF EXISTS "board_workspaces_select_own" ON public.board_workspaces;
DROP POLICY IF EXISTS "board_workspaces_insert_own" ON public.board_workspaces;
DROP POLICY IF EXISTS "board_workspaces_update_own" ON public.board_workspaces;
DROP POLICY IF EXISTS "board_workspaces_delete_own" ON public.board_workspaces;

CREATE POLICY "board_workspaces_select_pro" ON public.board_workspaces
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_workspaces_insert_pro" ON public.board_workspaces
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_workspaces_update_pro" ON public.board_workspaces
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_workspaces_delete_pro" ON public.board_workspaces
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

-- boards
DROP POLICY IF EXISTS "boards_select_own" ON public.boards;
DROP POLICY IF EXISTS "boards_insert_own" ON public.boards;
DROP POLICY IF EXISTS "boards_update_own" ON public.boards;
DROP POLICY IF EXISTS "boards_delete_own" ON public.boards;

CREATE POLICY "boards_select_pro" ON public.boards
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "boards_insert_pro" ON public.boards
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "boards_update_pro" ON public.boards
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "boards_delete_pro" ON public.boards
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

-- board_reminders
DROP POLICY IF EXISTS "board_reminders_select_own" ON public.board_reminders;
DROP POLICY IF EXISTS "board_reminders_insert_own" ON public.board_reminders;
DROP POLICY IF EXISTS "board_reminders_update_own" ON public.board_reminders;
DROP POLICY IF EXISTS "board_reminders_delete_own" ON public.board_reminders;

CREATE POLICY "board_reminders_select_pro" ON public.board_reminders
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_reminders_insert_pro" ON public.board_reminders
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_reminders_update_pro" ON public.board_reminders
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()))
  WITH CHECK (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

CREATE POLICY "board_reminders_delete_pro" ON public.board_reminders
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND public.has_active_plotting_subscription(auth.uid()));

-- board-uploads storage
DROP POLICY IF EXISTS "board_uploads_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "board_uploads_select_own" ON storage.objects;
DROP POLICY IF EXISTS "board_uploads_delete_own" ON storage.objects;

CREATE POLICY "board_uploads_insert_pro" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'board-uploads'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
    AND public.has_active_plotting_subscription(auth.uid())
  );

CREATE POLICY "board_uploads_select_pro" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'board-uploads'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
    AND public.has_active_plotting_subscription(auth.uid())
  );

CREATE POLICY "board_uploads_delete_pro" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'board-uploads'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
    AND public.has_active_plotting_subscription(auth.uid())
  );
