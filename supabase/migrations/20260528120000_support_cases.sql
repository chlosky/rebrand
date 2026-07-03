-- Admin case management (per submission). User-facing inbox stays on inbox_threads/messages.

CREATE TABLE IF NOT EXISTS public.support_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_email text NOT NULL DEFAULT '',
  message_type text NOT NULL CHECK (message_type IN ('help_me_create', 'app_support_feedback')),
  submission_type text,
  tool_or_area text,
  tool_label text,
  subject text NOT NULL DEFAULT '',
  original_submission_text text NOT NULL DEFAULT '',
  latest_message_preview text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  admin_unread boolean NOT NULL DEFAULT true,
  user_unread boolean NOT NULL DEFAULT false,
  attachment_storage_paths text[] NOT NULL DEFAULT '{}',
  report_id uuid REFERENCES public.app_support_reports (id) ON DELETE SET NULL,
  thread_id uuid REFERENCES public.inbox_threads (id) ON DELETE SET NULL,
  closed_at timestamptz,
  closed_by_admin_id uuid REFERENCES auth.users (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_cases_user_id ON public.support_cases (user_id);
CREATE INDEX IF NOT EXISTS idx_support_cases_status ON public.support_cases (status);
CREATE INDEX IF NOT EXISTS idx_support_cases_updated_at ON public.support_cases (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_support_cases_admin_unread ON public.support_cases (admin_unread) WHERE admin_unread = true;

DROP TRIGGER IF EXISTS update_support_cases_updated_at ON public.support_cases;
CREATE TRIGGER update_support_cases_updated_at
  BEFORE UPDATE ON public.support_cases
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.support_cases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_cases_select_admin" ON public.support_cases;
DROP POLICY IF EXISTS "support_cases_insert_admin" ON public.support_cases;
DROP POLICY IF EXISTS "support_cases_update_admin" ON public.support_cases;
DROP POLICY IF EXISTS "support_cases_delete_admin" ON public.support_cases;

CREATE POLICY "support_cases_select_admin"
  ON public.support_cases
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_insert_admin"
  ON public.support_cases
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_update_admin"
  ON public.support_cases
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_cases_delete_admin"
  ON public.support_cases
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- Admin-only internal notes (never exposed to user inbox).
CREATE TABLE IF NOT EXISTS public.support_case_internal_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  case_id uuid NOT NULL REFERENCES public.support_cases (id) ON DELETE CASCADE,
  admin_user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  body_text text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_support_case_internal_notes_case_id
  ON public.support_case_internal_notes (case_id, created_at DESC);

ALTER TABLE public.support_case_internal_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "support_case_internal_notes_select_admin" ON public.support_case_internal_notes;
DROP POLICY IF EXISTS "support_case_internal_notes_insert_admin" ON public.support_case_internal_notes;
DROP POLICY IF EXISTS "support_case_internal_notes_delete_admin" ON public.support_case_internal_notes;

CREATE POLICY "support_case_internal_notes_select_admin"
  ON public.support_case_internal_notes
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_case_internal_notes_insert_admin"
  ON public.support_case_internal_notes
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "support_case_internal_notes_delete_admin"
  ON public.support_case_internal_notes
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- Link chat messages to cases (user-visible messages only; internal notes stay separate).
ALTER TABLE public.inbox_messages
  ADD COLUMN IF NOT EXISTS case_id uuid REFERENCES public.support_cases (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_inbox_messages_case_id ON public.inbox_messages (case_id);
