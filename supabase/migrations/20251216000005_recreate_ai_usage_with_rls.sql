-- Recreate ai_usage table with RLS enabled
-- This migration drops and recreates the table to ensure RLS is properly configured

-- Drop existing table (if it exists)
DROP TABLE IF EXISTS public.ai_usage CASCADE;

-- Create AI usage logging table for granular OpenAI cost tracking
-- Tracks token and character-based usage across Textto, Aff, Chat, and BR
CREATE TABLE public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  call_name text not null check (call_name in ('Textto','Aff','Chat','BR')),
  user_id uuid,
  route text,
  model text not null,
  -- token-based usage (Chat/Aff/BR)
  input_tokens int,
  output_tokens int,
  total_tokens int,
  -- character-based usage (Textto TTS)
  characters int,
  -- computed costs
  input_cost_usd numeric,
  output_cost_usd numeric,
  total_cost_usd numeric,
  meta jsonb
);

-- Create indexes
CREATE INDEX ai_usage_created_at_idx ON public.ai_usage(created_at);
CREATE INDEX ai_usage_call_name_idx ON public.ai_usage(call_name);
CREATE INDEX ai_usage_user_id_idx ON public.ai_usage(user_id);

-- Enable RLS
ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view their own AI usage logs
CREATE POLICY "Users can view their own AI usage logs"
  ON public.ai_usage FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = user_id);

-- Inserts are done via Edge Functions using service role (bypasses RLS)
-- No INSERT policy needed as service role has full access

-- Add comment
COMMENT ON TABLE public.ai_usage IS 'Granular OpenAI cost logging for Textto (TTS), Aff (Affirmation Builder), Chat (Your Double), and BR (Belief Refactor). Best-effort logging that never blocks the main function.';

