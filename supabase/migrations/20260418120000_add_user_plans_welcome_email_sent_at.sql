-- One-time welcome email idempotency (native iOS / RevenueCat sync).
ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS welcome_email_sent_at TIMESTAMPTZ;

COMMENT ON COLUMN public.user_plans.welcome_email_sent_at IS
  'When the Postmark welcome template was first sent; prevents duplicate welcomes on repeat sync.';
