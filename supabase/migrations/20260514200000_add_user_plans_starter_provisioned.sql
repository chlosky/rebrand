ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS starter_provisioned BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.user_plans.starter_provisioned IS
  'True after first purchase provisioning (starter affirmations, subliminal). Never reverts to false.';
