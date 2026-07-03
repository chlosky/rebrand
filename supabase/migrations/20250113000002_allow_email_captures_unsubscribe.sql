-- Allow anonymous users to update their marketing_consent for unsubscribe functionality
CREATE POLICY "Allow anonymous email captures unsubscribe"
  ON public.email_captures
  FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);
fine wit