-- Combine multiple permissive policies into single policies using OR conditions
-- This resolves Supabase warnings about multiple permissive policies for the same action
-- Multiple policies are combined with OR logic, which is more efficient and clearer

-- ============================================================================
-- Ensure helper functions exist
-- ============================================================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.is_organization_member(_organization_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = _user_id
  )
$$;

CREATE OR REPLACE FUNCTION public.is_organization_admin(_organization_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members
    WHERE organization_id = _organization_id
      AND user_id = _user_id
      AND role IN ('owner', 'admin')
  )
$$;

-- ============================================================================
-- code_redemptions - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'code_redemptions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all redemptions" ON public.code_redemptions';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own redemptions" ON public.code_redemptions';

    EXECUTE 'CREATE POLICY "Users can view their own redemptions or admins can view all"
      ON public.code_redemptions FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = redeemed_by 
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- community_posts - Combine SELECT and INSERT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view approved posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts';

    EXECUTE 'CREATE POLICY "Users can view approved posts or their own, admins can view all"
      ON public.community_posts FOR SELECT
      TO authenticated
      USING (
        status = ''approved'' 
        OR (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Users can create posts, admins can create any"
      ON public.community_posts FOR INSERT
      TO authenticated
      WITH CHECK (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Admins can update and delete all posts"
      ON public.community_posts FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can delete all posts"
      ON public.community_posts FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- feature_flags - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_flags'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all feature flags" ON public.feature_flags';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view feature flags" ON public.feature_flags';

    EXECUTE 'CREATE POLICY "Anyone can view feature flags"
      ON public.feature_flags FOR SELECT
      TO authenticated
      USING (true)';

    -- Keep admin-only update policy separate
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update feature flags" ON public.feature_flags';
    EXECUTE 'CREATE POLICY "Admins can update feature flags"
      ON public.feature_flags FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- gamification_settings - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gamification_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage gamification settings" ON public.gamification_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view gamification settings" ON public.gamification_settings';

    EXECUTE 'CREATE POLICY "Anyone can view gamification settings"
      ON public.gamification_settings FOR SELECT
      TO authenticated
      USING (true)';

    EXECUTE 'CREATE POLICY "Admins can update gamification settings"
      ON public.gamification_settings FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- notification_settings - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage notification settings" ON public.notification_settings';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active notification settings" ON public.notification_settings';

    EXECUTE 'CREATE POLICY "Anyone can view active notification settings"
      ON public.notification_settings FOR SELECT
      TO authenticated
      USING (true)';

    EXECUTE 'CREATE POLICY "Admins can update notification settings"
      ON public.notification_settings FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- organization_members - Combine all policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
  ) THEN
    -- Drop all existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all organization members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Organization members can view other members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can view members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert organization members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can insert members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update organization members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can update members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete organization members" ON public.organization_members';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can delete members" ON public.organization_members';

    -- Create combined policies
    EXECUTE 'CREATE POLICY "Organization members can view other members or admins can view all"
      ON public.organization_members FOR SELECT
      TO authenticated
      USING (
        public.is_organization_member(organization_members.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can insert members, or admins can insert any"
      ON public.organization_members FOR INSERT
      TO authenticated
      WITH CHECK (
        public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can update members, or admins can update any"
      ON public.organization_members FOR UPDATE
      TO authenticated
      USING (
        public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can delete members, or admins can delete any"
      ON public.organization_members FOR DELETE
      TO authenticated
      USING (
        public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- organization_presets - Combine all policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_presets'
  ) THEN
    -- Drop all existing policies
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all organization presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Organization members can view presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can view presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert organization presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can insert presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update organization presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can update presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete organization presets" ON public.organization_presets';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can delete presets" ON public.organization_presets';

    -- Create combined policies
    EXECUTE 'CREATE POLICY "Organization members can view presets or admins can view all"
      ON public.organization_presets FOR SELECT
      TO authenticated
      USING (
        public.is_organization_member(organization_presets.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can insert presets, or admins can insert any"
      ON public.organization_presets FOR INSERT
      TO authenticated
      WITH CHECK (
        public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can update presets, or admins can update any"
      ON public.organization_presets FOR UPDATE
      TO authenticated
      USING (
        public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can delete presets, or admins can delete any"
      ON public.organization_presets FOR DELETE
      TO authenticated
      USING (
        public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- organizations - Combine SELECT and UPDATE policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all organizations" ON public.organizations';
    EXECUTE 'DROP POLICY IF EXISTS "Organization members can view their organization" ON public.organizations';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update organizations" ON public.organizations';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can update organization" ON public.organizations';

    EXECUTE 'CREATE POLICY "Organization members can view their organization or admins can view all"
      ON public.organizations FOR SELECT
      TO authenticated
      USING (
        public.is_organization_member(organizations.id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Organization owners and admins can update organization, or admins can update any"
      ON public.organizations FOR UPDATE
      TO authenticated
      USING (
        public.is_organization_admin(organizations.id, (SELECT auth.uid()))
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- premade_affirmation_sets - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'premade_affirmation_sets'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all premade sets" ON public.premade_affirmation_sets';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active premade sets" ON public.premade_affirmation_sets';

    -- Combined SELECT policy: anyone can view active sets OR admins can view all
    EXECUTE 'CREATE POLICY "Anyone can view active premade sets or admins can view all"
      ON public.premade_affirmation_sets FOR SELECT
      TO authenticated
      USING (
        is_active = true
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- premade_affirmations - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'premade_affirmations'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all premade affirmations" ON public.premade_affirmations';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view premade affirmations" ON public.premade_affirmations';

    -- Combined SELECT policy: anyone can view affirmations OR admins can view all
    -- Since "Anyone can view" means true, this is effectively the same, but we combine for clarity
    EXECUTE 'CREATE POLICY "Anyone can view premade affirmations"
      ON public.premade_affirmations FOR SELECT
      TO authenticated
      USING (true)';
  END IF;
END $$;

-- ============================================================================
-- profiles - Combine SELECT and UPDATE policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles';

    EXECUTE 'CREATE POLICY "Users can view their own profile or admins can view all"
      ON public.profiles FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = profiles.id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Users can update their own profile or admins can update all"
      ON public.profiles FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) = profiles.id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- quantum_challenges - Combine SELECT policies (if table exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'quantum_challenges'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage challenges" ON public.quantum_challenges';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active challenges" ON public.quantum_challenges';

    -- Combined SELECT policy: anyone can view active challenges OR admins can view all
    EXECUTE 'CREATE POLICY "Anyone can view active challenges or admins can view all"
      ON public.quantum_challenges FOR SELECT
      TO authenticated
      USING (
        is_active = true
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Admin-only policies for other operations
    EXECUTE 'CREATE POLICY "Admins can insert challenges"
      ON public.quantum_challenges FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can update challenges"
      ON public.quantum_challenges FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can delete challenges"
      ON public.quantum_challenges FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- quantum_completions - Combine SELECT policies (if table exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'quantum_completions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all completions" ON public.quantum_completions';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own completions" ON public.quantum_completions';

    EXECUTE 'CREATE POLICY "Users can view their own completions or admins can view all"
      ON public.quantum_completions FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- referral_codes - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'referral_codes'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all codes" ON public.referral_codes';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active codes" ON public.referral_codes';

    -- Combined SELECT policy: anyone can view active codes OR admins can view all
    EXECUTE 'CREATE POLICY "Anyone can view active codes or admins can view all"
      ON public.referral_codes FOR SELECT
      TO authenticated
      USING (
        (
          is_active = true 
          AND (expires_at IS NULL OR expires_at > now())
          AND (max_uses IS NULL OR current_uses < max_uses)
        )
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Admin-only policies for other operations
    EXECUTE 'CREATE POLICY "Admins can insert codes"
      ON public.referral_codes FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can update codes"
      ON public.referral_codes FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can delete codes"
      ON public.referral_codes FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- sacred_texts - Combine SELECT policies (if table exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sacred_texts'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage texts" ON public.sacred_texts';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active texts" ON public.sacred_texts';

    -- Combined SELECT policy: anyone can view active texts OR admins can view all
    EXECUTE 'CREATE POLICY "Anyone can view active texts or admins can view all"
      ON public.sacred_texts FOR SELECT
      TO authenticated
      USING (
        is_active = true
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Admin-only policies for other operations
    EXECUTE 'CREATE POLICY "Admins can insert texts"
      ON public.sacred_texts FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can update texts"
      ON public.sacred_texts FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can delete texts"
      ON public.sacred_texts FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- system_announcements - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'system_announcements'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all announcements" ON public.system_announcements';
    EXECUTE 'DROP POLICY IF EXISTS "Anyone can view active announcements" ON public.system_announcements';

    -- Combined SELECT policy: anyone can view active announcements OR admins can view all
    EXECUTE 'CREATE POLICY "Anyone can view active announcements or admins can view all"
      ON public.system_announcements FOR SELECT
      TO authenticated
      USING (
        is_active = true
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Keep admin-only policies for other operations
    EXECUTE 'DROP POLICY IF EXISTS "Admins can insert announcements" ON public.system_announcements';
    EXECUTE 'CREATE POLICY "Admins can insert announcements"
      ON public.system_announcements FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can update announcements" ON public.system_announcements';
    EXECUTE 'CREATE POLICY "Admins can update announcements"
      ON public.system_announcements FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete announcements" ON public.system_announcements';
    EXECUTE 'CREATE POLICY "Admins can delete announcements"
      ON public.system_announcements FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- user_gamification_stats - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_gamification_stats'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all stats" ON public.user_gamification_stats';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_gamification_stats';

    EXECUTE 'CREATE POLICY "Users can view their own stats or admins can view all"
      ON public.user_gamification_stats FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';
  END IF;
END $$;

-- ============================================================================
-- user_notification_preferences - Combine SELECT policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notification_preferences'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_notification_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_notification_preferences';

    -- Single policy for SELECT
    EXECUTE 'CREATE POLICY "Users can view their own preferences"
      ON public.user_notification_preferences FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    -- Separate policies for INSERT, UPDATE, DELETE
    EXECUTE 'CREATE POLICY "Users can insert their own preferences"
      ON public.user_notification_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own preferences"
      ON public.user_notification_preferences FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own preferences"
      ON public.user_notification_preferences FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- user_plans - Combine SELECT and UPDATE policies
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans';

    EXECUTE 'CREATE POLICY "Users can view their own plan or admins can view all"
      ON public.user_plans FOR SELECT
      TO authenticated
      USING (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    EXECUTE 'CREATE POLICY "Users can update their own plan or admins can update all"
      ON public.user_plans FOR UPDATE
      TO authenticated
      USING (
        (SELECT auth.uid()) = user_id
        OR public.has_role((SELECT auth.uid()), ''admin''::app_role)
      )';

    -- Keep admin-only policies for other operations
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete all plans" ON public.user_plans';
    EXECUTE 'CREATE POLICY "Admins can delete all plans"
      ON public.user_plans FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'DROP POLICY IF EXISTS "Admins can create user plans" ON public.user_plans';
    EXECUTE 'CREATE POLICY "Admins can create user plans"
      ON public.user_plans FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

