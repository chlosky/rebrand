-- Structured board layout modes (Kanban, Gantt, Eisenhower, etc.) alongside classic vision artboards.

ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS layout_mode text NOT NULL DEFAULT 'vision';

COMMENT ON COLUMN public.boards.layout_mode IS
  'vision | kanban | gantt | eisenhower | okrs | five_s | checklist | gallery';
