-- Allow users to update their own plan
CREATE POLICY "Users can update their own plan"
ON public.user_plans
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);