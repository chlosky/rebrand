-- Store scheduled account deletion requests (30-day hold per privacy policy).
-- Cron or process-scheduled-account-deletions Edge Function deletes users where requested_at < now() - interval '30 days'.

CREATE TABLE IF NOT EXISTS public.account_deletion_requests (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.account_deletion_requests IS 'Users who requested account deletion; actual deletion runs 30 days after requested_at';

ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;

-- Only the user can read/delete their own row (for cancel). Service role can insert/update/delete for scheduling and processing.
CREATE POLICY "Users can view own deletion request"
  ON public.account_deletion_requests FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own deletion request (cancel)"
  ON public.account_deletion_requests FOR DELETE
  USING (auth.uid() = user_id);

-- Service role (Edge Functions) need to insert and delete; RLS is bypassed with service_role key.
-- No INSERT policy for users: scheduling is done server-side via delete-account Edge Function.
