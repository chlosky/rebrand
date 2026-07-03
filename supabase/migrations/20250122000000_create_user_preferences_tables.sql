-- Create user_preferences table for storing user settings
CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  selected_character TEXT,
  email_reminders BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_preferences_user_id ON public.user_preferences(user_id);

-- Trigger for updated_at
CREATE TRIGGER update_user_preferences_updated_at
BEFORE UPDATE ON public.user_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create user_double_progress table for daily progress
CREATE TABLE IF NOT EXISTS public.user_double_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  progress_date DATE NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, progress_date)
);

-- Enable RLS
ALTER TABLE public.user_double_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own double progress"
  ON public.user_double_progress FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own double progress"
  ON public.user_double_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own double progress"
  ON public.user_double_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_double_progress_user_date ON public.user_double_progress(user_id, progress_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_double_progress_updated_at
BEFORE UPDATE ON public.user_double_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Create user_double_action_history table
CREATE TABLE IF NOT EXISTS public.user_double_action_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_date DATE NOT NULL,
  actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_date)
);

-- Enable RLS
ALTER TABLE public.user_double_action_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own action history"
  ON public.user_double_action_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own action history"
  ON public.user_double_action_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own action history"
  ON public.user_double_action_history FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index
CREATE INDEX idx_user_double_action_history_user_date ON public.user_double_action_history(user_id, action_date DESC);

-- Trigger for updated_at
CREATE TRIGGER update_user_double_action_history_updated_at
BEFORE UPDATE ON public.user_double_action_history
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();



























































