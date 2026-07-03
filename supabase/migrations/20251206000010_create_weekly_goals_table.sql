-- Create weekly_goals table for storing user's weekly goals
CREATE TABLE IF NOT EXISTS public.weekly_goals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start_date DATE NOT NULL, -- Monday of the week (YYYY-MM-DD)
  goal_text TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, week_start_date, goal_text)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_weekly_goals_user_week ON public.weekly_goals(user_id, week_start_date DESC);

-- Enable RLS
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own weekly goals"
  ON public.weekly_goals
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own weekly goals"
  ON public.weekly_goals
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own weekly goals"
  ON public.weekly_goals
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own weekly goals"
  ON public.weekly_goals
  FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all weekly goals"
  ON public.weekly_goals
  FOR ALL
  USING (true);

-- Create trigger for updated_at
CREATE TRIGGER update_weekly_goals_updated_at
  BEFORE UPDATE ON public.weekly_goals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment
COMMENT ON TABLE public.weekly_goals IS 'Stores user weekly goals with completion status';
COMMENT ON COLUMN public.weekly_goals.week_start_date IS 'Monday of the week (YYYY-MM-DD format)';









































