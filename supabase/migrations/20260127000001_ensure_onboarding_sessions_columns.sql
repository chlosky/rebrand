-- Ensure onboarding_sessions table has all required columns
-- This migration is idempotent and safe to run multiple times
-- It handles cases where the table was created before migrations were applied

DO $$
BEGIN
  -- First, ensure the table exists with all base columns
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'onboarding_sessions'
  ) THEN
    -- Table doesn't exist, create it with all columns
    CREATE EXTENSION IF NOT EXISTS pgcrypto;
    
    -- Ensure enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_session_status') THEN
      CREATE TYPE public.onboarding_session_status AS ENUM (
        'started',
        'checkout_created',
        'paid',
        'account_created',
        'active'
      );
    END IF;
    
    -- Ensure character_type enum exists
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'character_type') THEN
      CREATE TYPE public.character_type AS ENUM ('river', 'sage', 'rose', 'oliver');
    END IF;
    
    CREATE TABLE public.onboarding_sessions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      resume_token_hash TEXT NOT NULL,
      status public.onboarding_session_status NOT NULL DEFAULT 'started',
      email TEXT,
      first_name TEXT,
      username TEXT,
      email_consent BOOLEAN DEFAULT false,
      sms_consent BOOLEAN DEFAULT false,
      character_id public.character_type,
      onboarding_answers JSONB NOT NULL DEFAULT '{}'::jsonb,
      selected_tier TEXT CHECK (selected_tier IN ('basic', 'plus', 'premium')),
      billing TEXT CHECK (billing IN ('monthly', 'annual')),
      stripe_checkout_session_id TEXT UNIQUE,
      stripe_customer_id TEXT,
      stripe_customer_email TEXT,
      stripe_subscription_id TEXT,
      paid_at TIMESTAMPTZ,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
    
    ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;
    
    CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
    CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON public.onboarding_sessions(status);
    CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_stripe_customer_id ON public.onboarding_sessions(stripe_customer_id);
    
    RAISE NOTICE 'Created onboarding_sessions table with all columns';
  ELSE
    -- Table exists, add missing columns one by one
    RAISE NOTICE 'Table exists, checking for missing columns...';
    
    -- Add email if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'email'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN email TEXT;
      RAISE NOTICE 'Added email column';
    END IF;
    
    -- Add first_name if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'first_name'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN first_name TEXT;
      RAISE NOTICE 'Added first_name column';
    END IF;
    
    -- Add username if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'username'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN username TEXT;
      RAISE NOTICE 'Added username column';
    END IF;
    
    -- Add email_consent if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'email_consent'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN email_consent BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added email_consent column';
    END IF;
    
    -- Add sms_consent if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'sms_consent'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN sms_consent BOOLEAN DEFAULT false;
      RAISE NOTICE 'Added sms_consent column';
    END IF;
    
    -- Add onboarding_answers if missing
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'onboarding_answers'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN onboarding_answers JSONB NOT NULL DEFAULT '{}'::jsonb;
      RAISE NOTICE 'Added onboarding_answers column';
    END IF;
    
    -- Add other columns if missing (stripe fields, etc.)
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'stripe_checkout_session_id'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN stripe_checkout_session_id TEXT UNIQUE;
      RAISE NOTICE 'Added stripe_checkout_session_id column';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'stripe_customer_id'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN stripe_customer_id TEXT;
      RAISE NOTICE 'Added stripe_customer_id column';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'stripe_customer_email'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN stripe_customer_email TEXT;
      RAISE NOTICE 'Added stripe_customer_email column';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'stripe_subscription_id'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN stripe_subscription_id TEXT;
      RAISE NOTICE 'Added stripe_subscription_id column';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'paid_at'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN paid_at TIMESTAMPTZ;
      RAISE NOTICE 'Added paid_at column';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'created_at'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT now();
      RAISE NOTICE 'Added created_at column';
    END IF;
    
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'onboarding_sessions' 
      AND column_name = 'updated_at'
    ) THEN
      ALTER TABLE public.onboarding_sessions ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT now();
      RAISE NOTICE 'Added updated_at column';
    END IF;
  END IF;
  
  -- Ensure indexes exist
  CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON public.onboarding_sessions(status);
  CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_stripe_customer_id ON public.onboarding_sessions(stripe_customer_id);
  
  RAISE NOTICE 'Migration complete - all columns verified';
END $$;

-- Ensure trigger function exists (outside DO block to avoid $$ delimiter conflict)
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure trigger exists
DROP TRIGGER IF EXISTS update_onboarding_sessions_updated_at ON public.onboarding_sessions;
CREATE TRIGGER update_onboarding_sessions_updated_at
BEFORE UPDATE ON public.onboarding_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();
