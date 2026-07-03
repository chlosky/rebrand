-- Update tier names from actor/lead/writer/director to basic/plus/premium
-- Mapping: actor -> basic (Tier 1), lead -> plus (Tier 2), writer/director -> premium (Tier 3)
-- This migration updates existing data and constraints

-- Update subscriptions table plan values
UPDATE public.subscriptions 
SET plan = CASE 
  WHEN plan = 'actor' THEN 'basic'  -- Tier 1: $29/month
  WHEN plan = 'lead' THEN 'plus'    -- Tier 2: $59/month
  WHEN plan = 'writer' THEN 'premium'  -- Tier 3: $99/month
  WHEN plan = 'director' THEN 'premium'  -- Tier 3: $99/month
  ELSE plan
END
WHERE plan IN ('actor', 'lead', 'writer', 'director');

-- Update user_message_limits table tier values
UPDATE public.user_message_limits 
SET tier = CASE 
  WHEN tier = 'actor' THEN 'basic'
  WHEN tier = 'lead' THEN 'plus'
  WHEN tier = 'writer' THEN 'premium'
  WHEN tier = 'director' THEN 'premium'
  ELSE tier
END
WHERE tier IN ('actor', 'lead', 'writer', 'director');

-- Drop and recreate subscriptions table constraint
ALTER TABLE public.subscriptions 
DROP CONSTRAINT IF EXISTS subscriptions_plan_check;

ALTER TABLE public.subscriptions 
ADD CONSTRAINT subscriptions_plan_check 
CHECK (plan IN ('basic', 'plus', 'premium'));

-- Drop and recreate user_message_limits table constraint
ALTER TABLE public.user_message_limits 
DROP CONSTRAINT IF EXISTS user_message_limits_tier_check;

ALTER TABLE public.user_message_limits 
ADD CONSTRAINT user_message_limits_tier_check 
CHECK (tier IN ('basic', 'plus', 'premium'));

