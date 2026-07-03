-- Create onboarding_sessions table for payment-first onboarding flow
-- and add Postmark-managed email verification support.
--
-- Key design:
-- - onboarding_sessions is the canonical source of truth before auth exists
-- - Edge Functions (service role) are the only writers/readers for anonymous flows
-- - Resume/claim is authorized via resume_token_hash (never store raw token)

-- Ensure pgcrypto is available for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Ensure update_updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create enum for onboarding session status (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'onboarding_session_status') THEN
    CREATE TYPE public.onboarding_session_status AS ENUM (
      'started',
      'checkout_created',
      'paid',
      'account_created',
      'active'
    );
  END IF;
END $$;

-- Create onboarding_sessions table
CREATE TABLE IF NOT EXISTS public.onboarding_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resume_token_hash TEXT NOT NULL,
  status public.onboarding_session_status NOT NULL DEFAULT 'started',

  -- Onboarding data (pre-auth)
  email TEXT,
  first_name TEXT,
  username TEXT,
  email_consent BOOLEAN DEFAULT false,
  sms_consent BOOLEAN DEFAULT false,
  character_id public.character_type,
  onboarding_answers JSONB NOT NULL DEFAULT '{}'::jsonb, -- Only support_focus and accountability
  selected_tier TEXT CHECK (selected_tier IN ('basic', 'plus', 'premium')),
  billing TEXT CHECK (billing IN ('monthly', 'annual')),

  -- Stripe linkage (pre-auth)
  stripe_checkout_session_id TEXT UNIQUE,
  stripe_customer_id TEXT,
  stripe_customer_email TEXT,
  stripe_subscription_id TEXT,
  paid_at TIMESTAMPTZ,

  -- Link to user after account creation
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS enabled; no policies for anon/authenticated (service role only for anonymous flow)
ALTER TABLE public.onboarding_sessions ENABLE ROW LEVEL SECURITY;

-- Useful indexes
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_user_id ON public.onboarding_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_status ON public.onboarding_sessions(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_sessions_stripe_customer_id ON public.onboarding_sessions(stripe_customer_id);

-- updated_at trigger
DROP TRIGGER IF EXISTS update_onboarding_sessions_updated_at ON public.onboarding_sessions;
CREATE TRIGGER update_onboarding_sessions_updated_at
BEFORE UPDATE ON public.onboarding_sessions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add Postmark-managed email verification field to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email_verified_at TIMESTAMPTZ;

-- Store short-lived email verification tokens (service role only)
CREATE TABLE IF NOT EXISTS public.email_verification_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.email_verification_tokens ENABLE ROW LEVEL SECURITY;

-- Indexes for lookup
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token_hash ON public.email_verification_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user_id ON public.email_verification_tokens(user_id);

