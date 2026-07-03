-- Community v2: admin one-way feed + user submissions (reviewed separately) + polls.
-- UI gated by COMMUNITY_IN_APP_ENABLED. No user posts in feed; no AI moderation.

-- Remove prior chat-style tables if this migration is re-run during dev.
DROP TABLE IF EXISTS public.community_posts CASCADE;
DROP TABLE IF EXISTS public.community_prompts CASCADE;
DROP TABLE IF EXISTS public.community_channels CASCADE;

-- ---------------------------------------------------------------------------
-- Admin-curated feed (users read only)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_feed_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  body_text text NOT NULL CHECK (char_length(body_text) >= 1 AND char_length(body_text) <= 4000),
  image_path text,
  post_kind text NOT NULL DEFAULT 'announcement'
    CHECK (post_kind IN ('announcement', 'featured_setup', 'poll_winner', 'tip')),
  category text NOT NULL DEFAULT 'general'
    CHECK (category IN ('general', 'vision_board', 'moodboard', 'home_org', 'office_org')),
  published boolean NOT NULL DEFAULT true,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_community_feed_published
  ON public.community_feed_posts (published, published_at DESC);

-- ---------------------------------------------------------------------------
-- User setup submissions (never auto-appear in feed)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_setup_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  category text NOT NULL
    CHECK (category IN ('vision_board_rebrand', 'moodboard', 'home_organization', 'office_organization')),
  setup_medium text NOT NULL DEFAULT 'off_app'
    CHECK (setup_medium IN ('in_app', 'off_app', 'both')),
  title text CHECK (title IS NULL OR char_length(title) <= 120),
  body_text text NOT NULL CHECK (char_length(body_text) >= 10 AND char_length(body_text) <= 2000),
  image_paths text[] NOT NULL DEFAULT '{}',
  feature_opt_in boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'reviewed', 'featured', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT community_setup_submissions_images_max CHECK (cardinality(image_paths) <= 3)
);

CREATE INDEX IF NOT EXISTS idx_community_submissions_user
  ON public.community_setup_submissions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_community_submissions_status
  ON public.community_setup_submissions (status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Polls (admin picks finalists from featured submissions)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_polls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL CHECK (char_length(title) <= 200),
  description text,
  reward_note text,
  status text NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'active', 'closed')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_poll_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls (id) ON DELETE CASCADE,
  submission_id uuid REFERENCES public.community_setup_submissions (id) ON DELETE SET NULL,
  label text NOT NULL CHECK (char_length(label) <= 120),
  image_path text,
  sort_order int NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS public.community_poll_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id uuid NOT NULL REFERENCES public.community_polls (id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.community_poll_options (id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (poll_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_community_poll_votes_poll
  ON public.community_poll_votes (poll_id);

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
ALTER TABLE public.community_feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_setup_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_feed_select_published" ON public.community_feed_posts;
CREATE POLICY "community_feed_select_published"
  ON public.community_feed_posts FOR SELECT TO authenticated
  USING (published = true);

DROP POLICY IF EXISTS "community_feed_admin_all" ON public.community_feed_posts;
CREATE POLICY "community_feed_admin_all"
  ON public.community_feed_posts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "community_submissions_insert_own" ON public.community_setup_submissions;
CREATE POLICY "community_submissions_insert_own"
  ON public.community_setup_submissions FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

DROP POLICY IF EXISTS "community_submissions_select_own" ON public.community_setup_submissions;
CREATE POLICY "community_submissions_select_own"
  ON public.community_setup_submissions FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_submissions_admin_all" ON public.community_setup_submissions;
CREATE POLICY "community_submissions_admin_all"
  ON public.community_setup_submissions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "community_polls_select_active" ON public.community_polls;
CREATE POLICY "community_polls_select_active"
  ON public.community_polls FOR SELECT TO authenticated
  USING (status IN ('active', 'closed'));

DROP POLICY IF EXISTS "community_polls_admin_all" ON public.community_polls;
CREATE POLICY "community_polls_admin_all"
  ON public.community_polls FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "community_poll_options_select" ON public.community_poll_options;
CREATE POLICY "community_poll_options_select"
  ON public.community_poll_options FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_polls p
      WHERE p.id = poll_id AND p.status IN ('active', 'closed')
    )
  );

DROP POLICY IF EXISTS "community_poll_options_admin_all" ON public.community_poll_options;
CREATE POLICY "community_poll_options_admin_all"
  ON public.community_poll_options FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.admin_users a WHERE a.user_id = auth.uid()));

DROP POLICY IF EXISTS "community_poll_votes_insert_own" ON public.community_poll_votes;
CREATE POLICY "community_poll_votes_insert_own"
  ON public.community_poll_votes FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_poll_votes_select_own" ON public.community_poll_votes;
CREATE POLICY "community_poll_votes_select_own"
  ON public.community_poll_votes FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "community_poll_votes_select_tallies" ON public.community_poll_votes;
CREATE POLICY "community_poll_votes_select_tallies"
  ON public.community_poll_votes FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.community_polls p
      WHERE p.id = poll_id AND p.status IN ('active', 'closed')
    )
  );

-- ---------------------------------------------------------------------------
-- Storage (submissions + feed images)
-- ---------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('community-posts', 'community-posts', true, 5242880)
ON CONFLICT (id) DO UPDATE
SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit;

DROP POLICY IF EXISTS "community_posts_storage_insert_own" ON storage.objects;
DROP POLICY IF EXISTS "community_posts_storage_select_public" ON storage.objects;
DROP POLICY IF EXISTS "community_posts_storage_delete_own" ON storage.objects;

CREATE POLICY "community_posts_storage_insert_own"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'community-posts'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );

CREATE POLICY "community_posts_storage_select_public"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'community-posts');

CREATE POLICY "community_posts_storage_delete_own"
  ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id = 'community-posts'
    AND (SELECT auth.uid())::text = split_part(name, '/', 1)
  );

-- Welcome post (admin adds featured setups & poll winners manually until admin UI exists).
INSERT INTO public.community_feed_posts (title, body_text, post_kind, category, published_at)
SELECT
  'Community is coming',
  'This feed is curated by the Palette Plotting team — featured setups, poll winners, and tips. Submit your vision board rebrand or org setup separately; we review everything before anything goes live here.',
  'announcement',
  'general',
  now()
WHERE NOT EXISTS (SELECT 1 FROM public.community_feed_posts LIMIT 1);
