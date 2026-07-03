-- Enhance sacred_texts table to support structured content
ALTER TABLE public.sacred_texts ADD COLUMN IF NOT EXISTS book_structure jsonb;
ALTER TABLE public.sacred_texts ADD COLUMN IF NOT EXISTS total_chapters integer;
ALTER TABLE public.sacred_texts ADD COLUMN IF NOT EXISTS language text DEFAULT 'en';
ALTER TABLE public.sacred_texts ADD COLUMN IF NOT EXISTS version text;

-- Create a table for bookmarks and highlights
CREATE TABLE IF NOT EXISTS public.sacred_text_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  text_id uuid REFERENCES public.sacred_texts(id) ON DELETE CASCADE NOT NULL,
  chapter integer,
  verse integer,
  bookmark_type text DEFAULT 'bookmark', -- 'bookmark' or 'highlight'
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, text_id, chapter, verse, bookmark_type)
);

-- Enable RLS
ALTER TABLE public.sacred_text_bookmarks ENABLE ROW LEVEL SECURITY;

-- RLS policies for bookmarks
CREATE POLICY "Users can view their own bookmarks"
  ON public.sacred_text_bookmarks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookmarks"
  ON public.sacred_text_bookmarks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookmarks"
  ON public.sacred_text_bookmarks FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookmarks"
  ON public.sacred_text_bookmarks FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON public.sacred_text_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_text ON public.sacred_text_bookmarks(text_id);