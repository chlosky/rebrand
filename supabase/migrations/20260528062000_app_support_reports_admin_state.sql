-- Admin-only state for triaging app_support_reports (open/closed) without changing the user-submitted record.

CREATE TABLE IF NOT EXISTS public.app_support_report_admin_state (
  report_id uuid PRIMARY KEY REFERENCES public.app_support_reports (id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_app_support_report_admin_state_status
  ON public.app_support_report_admin_state (status);

ALTER TABLE public.app_support_report_admin_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_support_report_admin_state_select_admin" ON public.app_support_report_admin_state;
DROP POLICY IF EXISTS "app_support_report_admin_state_write_admin" ON public.app_support_report_admin_state;

CREATE POLICY "app_support_report_admin_state_select_admin"
  ON public.app_support_report_admin_state
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "app_support_report_admin_state_write_admin"
  ON public.app_support_report_admin_state
  FOR ALL
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

