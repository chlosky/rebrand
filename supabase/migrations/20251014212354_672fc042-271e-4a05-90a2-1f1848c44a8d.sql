-- Add account status to user_plans table
ALTER TABLE public.user_plans 
ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('active', 'suspended', 'disabled'));

-- Add policy for admins to insert user plans
CREATE POLICY "Admins can create user plans"
  ON public.user_plans
  FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'admin'));