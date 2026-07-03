-- Create rejection_log table for tracking guardrail violations
-- Used to block users after 30 rejections per feature in 24 hours

CREATE TABLE IF NOT EXISTS rejection_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feature text NOT NULL CHECK (feature IN ('BR', 'Aff', 'Textto')),
  rejected_at timestamptz NOT NULL DEFAULT now(),
  reason text,
  input_preview text, -- First 100 chars of rejected input for admin review
  CONSTRAINT rejection_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Index for fast lookups of recent rejections per user per feature
CREATE INDEX idx_rejection_log_user_feature_time ON rejection_log(user_id, feature, rejected_at DESC);

-- Enable RLS
ALTER TABLE rejection_log ENABLE ROW LEVEL SECURITY;

-- Users can only view their own rejection logs (for transparency)
CREATE POLICY "Users can view own rejection logs"
  ON rejection_log
  FOR SELECT
  USING (auth.uid() = user_id);

-- Only the system (via service role) can insert rejection logs
-- No policy needed for INSERT as it will be done via Edge Functions with service role

-- Add comment
COMMENT ON TABLE rejection_log IS 'Tracks guardrail violations for BR, Aff, and Textto features. Users are blocked for 24 hours after 30 rejections per feature.';

