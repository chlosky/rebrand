-- Add JSONB config column to feature_flags for structured per-flag settings.
ALTER TABLE public.feature_flags
ADD COLUMN IF NOT EXISTS config JSONB;

-- Set server-controlled review prompt config defaults.
UPDATE public.feature_flags
SET
  is_enabled = false,
  config = '{
    "audience": "trial_only",
    "allowed_screen": "dashboard",
    "trigger_label": "dashboard_after_trial_start",
    "delay_ms": 1200,
    "require_pending_post_paywall": true
  }'::jsonb
WHERE feature_name = 'review_prompt';
