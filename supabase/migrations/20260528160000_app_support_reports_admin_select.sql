-- Admins can read all app_support_reports (App Reports page). Users still only see their own.

DROP POLICY IF EXISTS "app_support_reports_select_admin" ON public.app_support_reports;

CREATE POLICY "app_support_reports_select_admin"
  ON public.app_support_reports
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));
