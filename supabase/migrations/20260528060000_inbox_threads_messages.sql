-- In-app inbox (user-facing) + simple support/admin console.

-- ---------------------------------------------------------------------------
-- Admin allowlist (minimal; add your own user_id rows manually)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_users (
  user_id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_users_select_self" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_none" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_update_none" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_none" ON public.admin_users;

-- Users can only see whether they are an admin (used for UI gating).
CREATE POLICY "admin_users_select_self"
  ON public.admin_users
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No client-side writes.
CREATE POLICY "admin_users_insert_none"
  ON public.admin_users
  FOR INSERT
  TO authenticated
  WITH CHECK (false);

CREATE POLICY "admin_users_update_none"
  ON public.admin_users
  FOR UPDATE
  TO authenticated
  USING (false);

CREATE POLICY "admin_users_delete_none"
  ON public.admin_users
  FOR DELETE
  TO authenticated
  USING (false);

-- ---------------------------------------------------------------------------
-- Threads
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inbox_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  -- For email categorization / internal filters; the UI uses a single chat per user.
  source text NOT NULL CHECK (source IN ('help_me_create', 'support_report', 'other')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  -- Optional label; not used as the primary UI organization.
  subject text,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_inbox_threads_user_id ON public.inbox_threads (user_id);
CREATE INDEX IF NOT EXISTS idx_inbox_threads_last_message_at ON public.inbox_threads (last_message_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_inbox_threads_updated_at ON public.inbox_threads (updated_at DESC);

DROP TRIGGER IF EXISTS update_inbox_threads_updated_at ON public.inbox_threads;
CREATE TRIGGER update_inbox_threads_updated_at
  BEFORE UPDATE ON public.inbox_threads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.inbox_threads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inbox_threads_select_own" ON public.inbox_threads;
DROP POLICY IF EXISTS "inbox_threads_select_admin" ON public.inbox_threads;
DROP POLICY IF EXISTS "inbox_threads_insert_admin" ON public.inbox_threads;
DROP POLICY IF EXISTS "inbox_threads_update_admin" ON public.inbox_threads;
DROP POLICY IF EXISTS "inbox_threads_delete_admin" ON public.inbox_threads;

CREATE POLICY "inbox_threads_select_own"
  ON public.inbox_threads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "inbox_threads_select_admin"
  ON public.inbox_threads
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_threads_insert_admin"
  ON public.inbox_threads
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_threads_update_admin"
  ON public.inbox_threads
  FOR UPDATE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_threads_delete_admin"
  ON public.inbox_threads
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- One conversation per user (keeps UX simple).
CREATE UNIQUE INDEX IF NOT EXISTS uniq_inbox_threads_user_id ON public.inbox_threads (user_id);

-- ---------------------------------------------------------------------------
-- Messages
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inbox_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id uuid NOT NULL REFERENCES public.inbox_threads (id) ON DELETE CASCADE,
  sender text NOT NULL CHECK (sender IN ('user', 'support', 'system')),
  body_text text NOT NULL,
  attachment_storage_paths text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  edited_at timestamptz
);

CREATE INDEX IF NOT EXISTS idx_inbox_messages_thread_id ON public.inbox_messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_inbox_messages_created_at ON public.inbox_messages (created_at DESC);

ALTER TABLE public.inbox_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inbox_messages_select_own" ON public.inbox_messages;
DROP POLICY IF EXISTS "inbox_messages_select_admin" ON public.inbox_messages;
DROP POLICY IF EXISTS "inbox_messages_insert_admin" ON public.inbox_messages;
DROP POLICY IF EXISTS "inbox_messages_update_admin" ON public.inbox_messages;
DROP POLICY IF EXISTS "inbox_messages_delete_admin" ON public.inbox_messages;

CREATE POLICY "inbox_messages_select_own"
  ON public.inbox_messages
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inbox_threads t
      WHERE t.id = inbox_messages.thread_id
        AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "inbox_messages_select_admin"
  ON public.inbox_messages
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_messages_insert_admin"
  ON public.inbox_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

CREATE POLICY "inbox_messages_update_admin"
  ON public.inbox_messages
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
    AND inbox_messages.sender = 'support'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid())
    AND inbox_messages.sender = 'support'
  );

CREATE POLICY "inbox_messages_delete_admin"
  ON public.inbox_messages
  FOR DELETE
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

-- ---------------------------------------------------------------------------
-- Read state (per-user per-thread)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.inbox_thread_reads (
  thread_id uuid NOT NULL REFERENCES public.inbox_threads (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  last_read_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (thread_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_inbox_thread_reads_user_id ON public.inbox_thread_reads (user_id);

ALTER TABLE public.inbox_thread_reads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inbox_thread_reads_select_own" ON public.inbox_thread_reads;
DROP POLICY IF EXISTS "inbox_thread_reads_upsert_own" ON public.inbox_thread_reads;
DROP POLICY IF EXISTS "inbox_thread_reads_select_admin" ON public.inbox_thread_reads;

CREATE POLICY "inbox_thread_reads_select_own"
  ON public.inbox_thread_reads
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "inbox_thread_reads_upsert_own"
  ON public.inbox_thread_reads
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "inbox_thread_reads_select_admin"
  ON public.inbox_thread_reads
  FOR SELECT
  TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

