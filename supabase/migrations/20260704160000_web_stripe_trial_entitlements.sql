-- Web Stripe launch: trialing subscriptions unlock Pro (3-day trial then monthly).
CREATE OR REPLACE FUNCTION public.has_active_plotting_subscription(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.user_plans up
    WHERE up.user_id = check_user_id
      AND up.status IN ('active', 'trialing')
      AND (up.current_period_end IS NULL OR up.current_period_end > now())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.has_active_plotting_subscription(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_active_plotting_subscription(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_active_plotting_subscription(uuid) TO service_role;
