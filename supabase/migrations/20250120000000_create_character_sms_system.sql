-- Create character enum
CREATE TYPE public.character_type AS ENUM ('river', 'sage', 'rose', 'oliver');

-- Create user character preferences table
CREATE TABLE public.user_character_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_character character_type NOT NULL,
  texts_enabled BOOLEAN NOT NULL DEFAULT true,
  preferred_send_window TEXT CHECK (preferred_send_window IN ('morning', 'evening', 'both')) DEFAULT 'both',
  timezone TEXT DEFAULT 'America/New_York',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create character messages table
CREATE TABLE public.character_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_type character_type NOT NULL,
  message_text TEXT NOT NULL,
  message_type TEXT NOT NULL CHECK (message_type IN ('proactive', 'reactive', 'soft_close', 'crisis_response')),
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMP WITH TIME ZONE,
  twilio_message_sid TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Create message limits tracking table (for daily limits)
CREATE TABLE public.user_message_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  proactive_sent BOOLEAN NOT NULL DEFAULT false,
  reactive_count INTEGER NOT NULL DEFAULT 0,
  total_messages INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL CHECK (tier IN ('basic', 'plus', 'premium')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Create index for faster lookups
CREATE INDEX idx_character_messages_user_date ON public.character_messages(user_id, created_at DESC);
CREATE INDEX idx_message_limits_user_date ON public.user_message_limits(user_id, date DESC);
CREATE INDEX idx_user_character_preferences_user ON public.user_character_preferences(user_id);

-- Enable RLS
ALTER TABLE public.user_character_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_message_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_character_preferences
CREATE POLICY "Users can view their own character preferences"
  ON public.user_character_preferences
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own character preferences"
  ON public.user_character_preferences
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own character preferences"
  ON public.user_character_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for character_messages
CREATE POLICY "Users can view their own messages"
  ON public.character_messages
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all messages"
  ON public.character_messages
  FOR ALL
  USING (true);

-- RLS Policies for user_message_limits
CREATE POLICY "Users can view their own message limits"
  ON public.user_message_limits
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all message limits"
  ON public.user_message_limits
  FOR ALL
  USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_user_character_preferences_updated_at
  BEFORE UPDATE ON public.user_character_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_message_limits_updated_at
  BEFORE UPDATE ON public.user_message_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

