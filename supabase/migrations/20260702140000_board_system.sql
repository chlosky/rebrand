-- Palette Plotting Boards: workspaces, artboards, reminders, private uploads.

CREATE TYPE public.board_role AS ENUM ('focus', 'plan');

CREATE TABLE IF NOT EXISTS public.board_workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'My board system',
  preset_slug text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS board_workspaces_user_id_idx ON public.board_workspaces (user_id);

CREATE TABLE IF NOT EXISTS public.boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES public.board_workspaces (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  role public.board_role NOT NULL DEFAULT 'focus',
  color_key text NOT NULL DEFAULT 'light_pink',
  sort_order int NOT NULL DEFAULT 0,
  layout_json jsonb NOT NULL DEFAULT '{}'::jsonb,
  artboard_width int NOT NULL DEFAULT 1080,
  artboard_height int NOT NULL DEFAULT 1350,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS boards_workspace_sort_idx ON public.boards (workspace_id, sort_order);
CREATE INDEX IF NOT EXISTS boards_user_id_idx ON public.boards (user_id);

CREATE TABLE IF NOT EXISTS public.board_reminders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id uuid NOT NULL REFERENCES public.boards (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  title text NOT NULL,
  body text,
  remind_at timestamptz NOT NULL,
  timezone text,
  channels text[] NOT NULL DEFAULT ARRAY['email']::text[],
  source text NOT NULL DEFAULT 'user'
    CHECK (source IN ('user', 'ai_extracted', 'affirmation', 'plan_item')),
  fabric_object_id text,
  status text NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'sent', 'cancelled', 'failed')),
  ical_uid text,
  last_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS board_reminders_due_idx
  ON public.board_reminders (status, remind_at)
  WHERE status = 'scheduled';

CREATE INDEX IF NOT EXISTS board_reminders_user_idx ON public.board_reminders (user_id);

CREATE TABLE IF NOT EXISTS public.board_reminder_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reminder_id uuid NOT NULL REFERENCES public.board_reminders (id) ON DELETE CASCADE,
  channel text NOT NULL,
  status text NOT NULL,
  provider_message_id text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_board_workspaces_updated ON public.board_workspaces;
CREATE TRIGGER trg_board_workspaces_updated
  BEFORE UPDATE ON public.board_workspaces
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_boards_updated ON public.boards;
CREATE TRIGGER trg_boards_updated
  BEFORE UPDATE ON public.boards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

DROP TRIGGER IF EXISTS trg_board_reminders_updated ON public.board_reminders;
CREATE TRIGGER trg_board_reminders_updated
  BEFORE UPDATE ON public.board_reminders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

ALTER TABLE public.board_workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.boards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.board_reminder_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "board_workspaces_select_own" ON public.board_workspaces FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "board_workspaces_insert_own" ON public.board_workspaces FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "board_workspaces_update_own" ON public.board_workspaces FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "board_workspaces_delete_own" ON public.board_workspaces FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "boards_select_own" ON public.boards FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "boards_insert_own" ON public.boards FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "boards_update_own" ON public.boards FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "boards_delete_own" ON public.boards FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "board_reminders_select_own" ON public.board_reminders FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "board_reminders_insert_own" ON public.board_reminders FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "board_reminders_update_own" ON public.board_reminders FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "board_reminders_delete_own" ON public.board_reminders FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "board_reminder_deliveries_select_own" ON public.board_reminder_deliveries FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.board_reminders r WHERE r.id = reminder_id AND r.user_id = auth.uid()));

CREATE POLICY "board_reminder_deliveries_service" ON public.board_reminder_deliveries FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Private user uploads for board artboards
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('board-uploads', 'board-uploads', false, 10485760)
ON CONFLICT (id) DO UPDATE SET file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "board_uploads_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "board_uploads_select_own" ON storage.objects;
DROP POLICY IF EXISTS "board_uploads_delete_own" ON storage.objects;

CREATE POLICY "board_uploads_insert_own" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'board-uploads' AND (SELECT auth.uid())::text = split_part(name, '/', 1));

CREATE POLICY "board_uploads_select_own" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'board-uploads' AND (SELECT auth.uid())::text = split_part(name, '/', 1));

CREATE POLICY "board_uploads_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'board-uploads' AND (SELECT auth.uid())::text = split_part(name, '/', 1));

COMMENT ON TABLE public.board_workspaces IS 'User vision-board workspace (default 4-board Palette Plotting setup).';
COMMENT ON COLUMN public.boards.layout_json IS 'Fabric.js JSON for Canva-style artboard layout.';
COMMENT ON COLUMN public.board_reminders.channels IS 'email | sms | push | ical_export';
