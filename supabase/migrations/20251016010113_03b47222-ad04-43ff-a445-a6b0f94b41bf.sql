-- Create notification settings table (admin configures default notification types)
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_type text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  default_enabled boolean DEFAULT true,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create gamification settings table (admin configures milestones and thresholds)
CREATE TABLE IF NOT EXISTS public.gamification_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text NOT NULL UNIQUE,
  setting_value jsonb NOT NULL,
  description text,
  updated_at timestamptz DEFAULT now()
);

-- Create user gamification stats table (track user progress)
CREATE TABLE IF NOT EXISTS public.user_gamification_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_activity_date date,
  tools_used_this_week jsonb DEFAULT '[]'::jsonb,
  milestones_achieved jsonb DEFAULT '[]'::jsonb,
  total_tools_used integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

-- Create user notification preferences table
CREATE TABLE IF NOT EXISTS public.user_notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  enabled boolean DEFAULT true,
  inactivity_days integer DEFAULT 10,
  email_consent boolean DEFAULT false,
  sms_consent boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, notification_type)
);

-- Create notifications table (actual in-app notifications)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  notification_type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gamification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_gamification_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for notification_settings
CREATE POLICY "Anyone can view active notification settings"
  ON public.notification_settings FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage notification settings"
  ON public.notification_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for gamification_settings
CREATE POLICY "Anyone can view gamification settings"
  ON public.gamification_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage gamification settings"
  ON public.gamification_settings FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_gamification_stats
CREATE POLICY "Users can view their own stats"
  ON public.user_gamification_stats FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own stats"
  ON public.user_gamification_stats FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own stats"
  ON public.user_gamification_stats FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all stats"
  ON public.user_gamification_stats FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for user_notification_preferences
CREATE POLICY "Users can view their own preferences"
  ON public.user_notification_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences"
  ON public.user_notification_preferences FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create triggers for updated_at
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON public.notification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_gamification_settings_updated_at
  BEFORE UPDATE ON public.gamification_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_gamification_stats_updated_at
  BEFORE UPDATE ON public.user_gamification_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_user_notification_preferences_updated_at
  BEFORE UPDATE ON public.user_notification_preferences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Insert default notification types
INSERT INTO public.notification_settings (notification_type, name, description, default_enabled) VALUES
  ('streak_protection', 'Streak Protection', 'Remind users after inactivity period', true),
  ('community_reply', 'Community Replies', 'Notify when someone replies to your post', true),
  ('new_tool', 'New Tool Alerts', 'Notify about new features and tools', true),
  ('milestone', 'Milestone Celebrations', 'Celebrate streak and usage milestones', true);

-- Insert default gamification settings
INSERT INTO public.gamification_settings (setting_key, setting_value, description) VALUES
  ('milestones', '{"days": [7, 30, 90, 180, 365], "messages": {"7": "7-Day Streak! You''re building momentum!", "30": "30 Days Strong! You''re committed!", "90": "90-Day Warrior! Transformation in progress!", "180": "6 Months of Growth! Incredible dedication!", "365": "1 YEAR CHAMPION! You''ve mastered consistency!"}}', 'Milestone days and celebration messages'),
  ('weekly_tool_goal', '{"target": 7, "message": "Week Complete! All 7 tools mastered!"}', 'Weekly tool usage goal'),
  ('inactivity_default', '{"days": 10, "message": "We miss you! Your transformation awaits..."}', 'Default inactivity reminder settings');