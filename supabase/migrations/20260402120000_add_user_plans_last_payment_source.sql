-- Payment channel + canonical IDs (legacy stripe_customer_id stays as blended compat field).

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS first_payment_source TEXT
  CHECK (first_payment_source IS NULL OR first_payment_source IN ('stripe', 'apple'));

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS last_payment_source TEXT
  CHECK (last_payment_source IS NULL OR last_payment_source IN ('stripe', 'apple'));

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS stripe_customer_id_official TEXT;

ALTER TABLE public.user_plans
  ADD COLUMN IF NOT EXISTS apple_customer_id TEXT;

COMMENT ON COLUMN public.user_plans.first_payment_source IS
  'First known payment channel; set once when last_payment_source is first set (trigger).';

COMMENT ON COLUMN public.user_plans.last_payment_source IS
  'Most recent substantive billing write: stripe vs App Store (IAP / RevenueCat App Store).';

COMMENT ON COLUMN public.user_plans.stripe_customer_id_official IS
  'Real Stripe customer id (cus_…); legacy stripe_customer_id may still hold blended values.';

COMMENT ON COLUMN public.user_plans.apple_customer_id IS
  'App Store transaction / subscription id (no apple: prefix); separate from Stripe id.';

-- When last_payment_source is set and first is still null, copy last → first (once).
CREATE OR REPLACE FUNCTION public.user_plans_set_first_payment_source()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.first_payment_source IS NULL AND NEW.last_payment_source IS NOT NULL THEN
    NEW.first_payment_source := NEW.last_payment_source;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_user_plans_first_payment_source ON public.user_plans;

CREATE TRIGGER trg_user_plans_first_payment_source
  BEFORE INSERT OR UPDATE ON public.user_plans
  FOR EACH ROW
  EXECUTE FUNCTION public.user_plans_set_first_payment_source();

-- Backfill last_payment_source from legacy stripe_customer_id
UPDATE public.user_plans
SET last_payment_source = 'apple'
WHERE last_payment_source IS NULL
  AND stripe_customer_id IS NOT NULL
  AND (
    stripe_customer_id LIKE 'apple:%'
    OR stripe_customer_id LIKE 'revenuecat:%'
  );

UPDATE public.user_plans
SET last_payment_source = 'stripe'
WHERE last_payment_source IS NULL
  AND stripe_customer_id IS NOT NULL
  AND stripe_customer_id NOT LIKE 'apple:%'
  AND stripe_customer_id NOT LIKE 'revenuecat:%';

-- first_payment_source = last for existing rows (best effort)
UPDATE public.user_plans
SET first_payment_source = last_payment_source
WHERE first_payment_source IS NULL
  AND last_payment_source IS NOT NULL;

-- Canonical Stripe id
UPDATE public.user_plans
SET stripe_customer_id_official = stripe_customer_id
WHERE stripe_customer_id IS NOT NULL
  AND stripe_customer_id LIKE 'cus_%';

-- Apple id without prefix
UPDATE public.user_plans
SET apple_customer_id = SUBSTRING(stripe_customer_id FROM 7)
WHERE stripe_customer_id LIKE 'apple:%'
  AND LENGTH(stripe_customer_id) > 7;
