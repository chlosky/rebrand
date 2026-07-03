-- Add chat support: separate in-app chat from SMS
-- Frequency Model: Chat limits are 15/30/60 for basic/plus/premium (no proactive/reactive split)
-- SMS limits remain 4/8/10 (with proactive/reactive split)
-- Add chat_count column to track chat messages separately from SMS

-- ============================================================================
-- Step 0: Create character_type enum if it doesn't exist
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'character_type') THEN
    CREATE TYPE public.character_type AS ENUM ('river', 'sage', 'rose', 'oliver');
  END IF;
END $$;

-- ============================================================================
-- Step 1: Create character_messages table if it doesn't exist, then update it
-- ============================================================================

DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'character_messages'
  ) THEN
    CREATE TABLE public.character_messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      character_type character_type NOT NULL,
      message_text TEXT NOT NULL,
      message_type TEXT NOT NULL CHECK (message_type IN ('proactive', 'reactive', 'soft_close', 'crisis_response', 'chat')),
      is_sent BOOLEAN NOT NULL DEFAULT false,
      sent_at TIMESTAMP WITH TIME ZONE,
      twilio_message_sid TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      metadata JSONB DEFAULT '{}'::jsonb
    );

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_character_messages_user_date ON public.character_messages(user_id, created_at DESC);

    -- Enable RLS
    ALTER TABLE public.character_messages ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view their own messages"
      ON public.character_messages
      FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Service role can manage all messages"
      ON public.character_messages
      FOR ALL
      USING (true);
  ELSE
    -- Table exists, update the constraint
    -- Drop the old constraint if it exists
    IF EXISTS (
      SELECT 1 FROM information_schema.table_constraints 
      WHERE constraint_name = 'character_messages_message_type_check'
      AND table_schema = 'public'
      AND table_name = 'character_messages'
    ) THEN
      ALTER TABLE public.character_messages 
        DROP CONSTRAINT character_messages_message_type_check;
    END IF;

    -- Add new constraint that includes 'chat'
    ALTER TABLE public.character_messages 
      ADD CONSTRAINT character_messages_message_type_check 
      CHECK (message_type IN ('proactive', 'reactive', 'soft_close', 'crisis_response', 'chat'));
  END IF;
END $$;

-- ============================================================================
-- Step 2: Create user_message_limits table if it doesn't exist, then add chat_count
-- ============================================================================

DO $$
BEGIN
  -- Create table if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits'
  ) THEN
    CREATE TABLE public.user_message_limits (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      proactive_sent BOOLEAN NOT NULL DEFAULT false,
      reactive_count INTEGER NOT NULL DEFAULT 0,
      total_messages INTEGER NOT NULL DEFAULT 0,
      chat_count INTEGER NOT NULL DEFAULT 0,
      tier TEXT NOT NULL CHECK (tier IN ('basic', 'plus', 'premium')),
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
      UNIQUE(user_id, date)
    );

    -- Create index
    CREATE INDEX IF NOT EXISTS idx_message_limits_user_date ON public.user_message_limits(user_id, date DESC);

    -- Enable RLS
    ALTER TABLE public.user_message_limits ENABLE ROW LEVEL SECURITY;

    -- Create RLS policies
    CREATE POLICY "Users can view their own message limits"
      ON public.user_message_limits
      FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Service role can manage all message limits"
      ON public.user_message_limits
      FOR ALL
      USING (true);
  END IF;
END $$;

-- Create trigger function for updated_at (outside DO block)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for user_message_limits if table exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_message_limits_updated_at'
  ) THEN
    CREATE TRIGGER update_user_message_limits_updated_at
      BEFORE UPDATE ON public.user_message_limits
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- Add chat_count column if table already existed (and it wasn't created above)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits'
  ) THEN
    -- Table exists, add chat_count column if it doesn't exist
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'user_message_limits' 
      AND column_name = 'chat_count'
    ) THEN
      ALTER TABLE public.user_message_limits 
        ADD COLUMN chat_count INTEGER NOT NULL DEFAULT 0;
    END IF;
  END IF;
END $$;

-- ============================================================================
-- Step 3: Add comment for clarity
-- ============================================================================

DO $$
BEGIN
  -- Add comment to user_message_limits.chat_count if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits' 
    AND column_name = 'chat_count'
  ) THEN
    COMMENT ON COLUMN public.user_message_limits.chat_count IS 'Number of in-app chat messages sent today (separate from SMS messages)';
  END IF;

  -- Add comment to character_messages.message_type if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'character_messages'
  ) THEN
    COMMENT ON COLUMN public.character_messages.message_type IS 'Type of message: proactive, reactive, soft_close, crisis_response, or chat (in-app chat)';
  END IF;
END $$;

