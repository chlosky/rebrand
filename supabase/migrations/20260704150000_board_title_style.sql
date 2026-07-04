ALTER TABLE public.boards
  ADD COLUMN IF NOT EXISTS title_color text,
  ADD COLUMN IF NOT EXISTS title_font text;
