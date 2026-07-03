-- Report & feedback / AI flag / feature request: table, RLS, and private screenshot storage (single migration).
-- Applies: app_support_reports + support-reports bucket policies.

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.app_support_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  user_email text NOT NULL,
  submission_type text NOT NULL CHECK (submission_type IN ('report', 'ai_flag', 'feature_request')),
  tool_value text NOT NULL,
  tool_label text NOT NULL,
  description text NOT NULL,
  attachment_storage_paths text[] NOT NULL DEFAULT '{}',
  billing_purchase_channel text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT app_support_reports_billing_purchase_channel_check CHECK (
    billing_purchase_channel IS NULL
    OR billing_purchase_channel IN ('apple_app_store', 'google_play', 'web')
  )
);

CREATE INDEX IF NOT EXISTS idx_app_support_reports_user_id ON public.app_support_reports (user_id);
CREATE INDEX IF NOT EXISTS idx_app_support_reports_created_at ON public.app_support_reports (created_at DESC);

COMMENT ON TABLE public.app_support_reports IS
  'User-submitted app issues, AI flags, and feature requests (columns kept separate for reporting).';

COMMENT ON COLUMN public.app_support_reports.attachment_storage_paths IS
  'Object paths within support-reports bucket, format: {user_id}/{uuid}_{filename}.';

COMMENT ON COLUMN public.app_support_reports.billing_purchase_channel IS
  'Set when tool is billing: apple_app_store | google_play | web.';

ALTER TABLE public.app_support_reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "app_support_reports_insert_own" ON public.app_support_reports;
DROP POLICY IF EXISTS "app_support_reports_select_own" ON public.app_support_reports;

CREATE POLICY "app_support_reports_insert_own"
  ON public.app_support_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "app_support_reports_select_own"
  ON public.app_support_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Storage: private bucket + RLS (authenticated users only under their user_id prefix)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('support-reports', 'support-reports', false, 5242880)
ON CONFLICT (id) DO UPDATE
SET file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "support_reports_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "support_reports_select_own" ON storage.objects;
DROP POLICY IF EXISTS "support_reports_delete_own" ON storage.objects;

CREATE POLICY "support_reports_insert_own"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'support-reports' AND
    (SELECT auth.uid())::text = split_part("name", '/', 1)
  );

CREATE POLICY "support_reports_select_own"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'support-reports' AND
    (SELECT auth.uid())::text = split_part("name", '/', 1)
  );

CREATE POLICY "support_reports_delete_own"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'support-reports' AND
    (SELECT auth.uid())::text = split_part("name", '/', 1)
  );
