-- Create stories table to store user narratives
CREATE TABLE public.user_stories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  art_style text DEFAULT 'graphic_novel',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create story chapters
CREATE TABLE public.story_chapters (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  story_id uuid NOT NULL REFERENCES public.user_stories(id) ON DELETE CASCADE,
  chapter_number integer NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create story panels (illustrated scenes)
CREATE TABLE public.story_panels (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chapter_id uuid NOT NULL REFERENCES public.story_chapters(id) ON DELETE CASCADE,
  panel_number integer NOT NULL,
  scene_description text NOT NULL,
  caption text,
  image_url text,
  image_prompt text,
  is_generating boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_stories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_panels ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_stories
CREATE POLICY "Users can view their own stories"
  ON public.user_stories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own stories"
  ON public.user_stories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own stories"
  ON public.user_stories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own stories"
  ON public.user_stories FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for story_chapters
CREATE POLICY "Users can view their story chapters"
  ON public.story_chapters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_stories
      WHERE user_stories.id = story_chapters.story_id
      AND user_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create chapters for their stories"
  ON public.story_chapters FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.user_stories
      WHERE user_stories.id = story_chapters.story_id
      AND user_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their story chapters"
  ON public.story_chapters FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_stories
      WHERE user_stories.id = story_chapters.story_id
      AND user_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their story chapters"
  ON public.story_chapters FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_stories
      WHERE user_stories.id = story_chapters.story_id
      AND user_stories.user_id = auth.uid()
    )
  );

-- RLS Policies for story_panels
CREATE POLICY "Users can view their story panels"
  ON public.story_panels FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.story_chapters
      JOIN public.user_stories ON user_stories.id = story_chapters.story_id
      WHERE story_chapters.id = story_panels.chapter_id
      AND user_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create panels for their chapters"
  ON public.story_panels FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.story_chapters
      JOIN public.user_stories ON user_stories.id = story_chapters.story_id
      WHERE story_chapters.id = story_panels.chapter_id
      AND user_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their story panels"
  ON public.story_panels FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.story_chapters
      JOIN public.user_stories ON user_stories.id = story_chapters.story_id
      WHERE story_chapters.id = story_panels.chapter_id
      AND user_stories.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their story panels"
  ON public.story_panels FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.story_chapters
      JOIN public.user_stories ON user_stories.id = story_chapters.story_id
      WHERE story_chapters.id = story_panels.chapter_id
      AND user_stories.user_id = auth.uid()
    )
  );

-- Create indexes for better performance
CREATE INDEX idx_story_chapters_story_id ON public.story_chapters(story_id);
CREATE INDEX idx_story_panels_chapter_id ON public.story_panels(chapter_id);
CREATE INDEX idx_user_stories_user_id ON public.user_stories(user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_story_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_user_stories_updated_at
  BEFORE UPDATE ON public.user_stories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_updated_at();

CREATE TRIGGER update_story_chapters_updated_at
  BEFORE UPDATE ON public.story_chapters
  FOR EACH ROW
  EXECUTE FUNCTION public.update_story_updated_at();