-- Fix all remaining RLS policies that use auth.uid() instead of (SELECT auth.uid())
-- This migration handles all tables that weren't covered in previous migrations
-- or were created/updated after the initial optimization
--
-- IMPORTANT: This migration uses dynamic SQL (EXECUTE) to safely handle tables
-- that may or may not exist. It will only update policies for tables that exist.
-- Run this migration to fix all remaining auth.uid() warnings from Supabase.

-- ============================================================================
-- Ensure helper functions exist before using them
-- ============================================================================

-- Ensure has_role function is STABLE and SECURITY DEFINER
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

-- ============================================================================
-- user_plans table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_plans'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own plan" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own plan" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can update all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can delete all plans" ON public.user_plans';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can create user plans" ON public.user_plans';

    EXECUTE 'CREATE POLICY "Users can view their own plan"
      ON public.user_plans FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own plan"
      ON public.user_plans FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Admins can view all plans"
      ON public.user_plans FOR SELECT
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can update all plans"
      ON public.user_plans FOR UPDATE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can delete all plans"
      ON public.user_plans FOR DELETE
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Admins can create user plans"
      ON public.user_plans FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- user_roles table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_roles'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles';

    EXECUTE 'CREATE POLICY "Users can view their own roles"
      ON public.user_roles FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- community_posts table (if it still exists)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view approved posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all posts" ON public.community_posts';

    EXECUTE 'CREATE POLICY "Users can view approved posts"
      ON public.community_posts FOR SELECT
      TO authenticated
      USING (status = ''approved'' OR (SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create posts"
      ON public.community_posts FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Admins can manage all posts"
      ON public.community_posts FOR ALL
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- sacred_texts and sacred_text_bookmarks (if they still exist)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sacred_texts'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage texts" ON public.sacred_texts';

    EXECUTE 'CREATE POLICY "Admins can manage texts"
      ON public.sacred_texts FOR ALL
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sacred_text_bookmarks'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.sacred_text_bookmarks';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.sacred_text_bookmarks';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.sacred_text_bookmarks';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.sacred_text_bookmarks';

    EXECUTE 'CREATE POLICY "Users can view their own bookmarks"
      ON public.sacred_text_bookmarks FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own bookmarks"
      ON public.sacred_text_bookmarks FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own bookmarks"
      ON public.sacred_text_bookmarks FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own bookmarks"
      ON public.sacred_text_bookmarks FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- referral_codes table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'referral_codes'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage all codes" ON public.referral_codes';

    EXECUTE 'CREATE POLICY "Admins can manage all codes"
      ON public.referral_codes FOR ALL
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- code_redemptions table
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

    EXECUTE 'CREATE POLICY "Admins can view all redemptions"
      ON public.code_redemptions FOR SELECT
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';

    EXECUTE 'CREATE POLICY "Users can view their own redemptions"
      ON public.code_redemptions FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = redeemed_by)';
  END IF;
END $$;

-- ============================================================================
-- notification_settings table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage notification settings" ON public.notification_settings';

    EXECUTE 'CREATE POLICY "Admins can manage notification settings"
      ON public.notification_settings FOR ALL
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- gamification_settings table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gamification_settings'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage gamification settings" ON public.gamification_settings';

    EXECUTE 'CREATE POLICY "Admins can manage gamification settings"
      ON public.gamification_settings FOR ALL
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- user_gamification_stats table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_gamification_stats'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_gamification_stats';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_gamification_stats';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_gamification_stats';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all stats" ON public.user_gamification_stats';

    EXECUTE 'CREATE POLICY "Users can view their own stats"
      ON public.user_gamification_stats FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own stats"
      ON public.user_gamification_stats FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can insert their own stats"
      ON public.user_gamification_stats FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Admins can view all stats"
      ON public.user_gamification_stats FOR SELECT
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- user_notification_preferences table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notification_preferences'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_notification_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_notification_preferences';

    EXECUTE 'CREATE POLICY "Users can view their own preferences"
      ON public.user_notification_preferences FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can manage their own preferences"
      ON public.user_notification_preferences FOR ALL
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- notifications table
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications';

    EXECUTE 'CREATE POLICY "Users can view their own notifications"
      ON public.notifications FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own notifications"
      ON public.notifications FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Admins can create notifications"
      ON public.notifications FOR INSERT
      TO authenticated
      WITH CHECK (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- story_chapters and story_panels (if they still exist)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'story_chapters'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their story chapters" ON public.story_chapters';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create chapters for their stories" ON public.story_chapters';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their story chapters" ON public.story_chapters';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their story chapters" ON public.story_chapters';

    EXECUTE 'CREATE POLICY "Users can view their story chapters"
      ON public.story_chapters FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_stories
          WHERE user_stories.id = story_chapters.story_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can create chapters for their stories"
      ON public.story_chapters FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.user_stories
          WHERE user_stories.id = story_chapters.story_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update their story chapters"
      ON public.story_chapters FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_stories
          WHERE user_stories.id = story_chapters.story_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete their story chapters"
      ON public.story_chapters FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_stories
          WHERE user_stories.id = story_chapters.story_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'story_panels'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their story panels" ON public.story_panels';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create panels for their chapters" ON public.story_panels';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their story panels" ON public.story_panels';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their story panels" ON public.story_panels';

    EXECUTE 'CREATE POLICY "Users can view their story panels"
      ON public.story_panels FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.story_chapters
          JOIN public.user_stories ON user_stories.id = story_chapters.story_id
          WHERE story_chapters.id = story_panels.chapter_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can create panels for their chapters"
      ON public.story_panels FOR INSERT
      TO authenticated
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM public.story_chapters
          JOIN public.user_stories ON user_stories.id = story_chapters.story_id
          WHERE story_chapters.id = story_panels.chapter_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update their story panels"
      ON public.story_panels FOR UPDATE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.story_chapters
          JOIN public.user_stories ON user_stories.id = story_chapters.story_id
          WHERE story_chapters.id = story_panels.chapter_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete their story panels"
      ON public.story_panels FOR DELETE
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.story_chapters
          JOIN public.user_stories ON user_stories.id = story_chapters.story_id
          WHERE story_chapters.id = story_panels.chapter_id
            AND user_stories.user_id = (SELECT auth.uid())
        )
      )';
  END IF;
END $$;

-- ============================================================================
-- organizations, organization_members, organization_presets
-- These should already be fixed, but let's ensure they are
-- ============================================================================

-- Create helper functions if they don't exist
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

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) THEN
    -- Check if policies need updating (they should already use helper functions)
    -- But if they use auth.uid() directly, update them
    EXECUTE 'DROP POLICY IF EXISTS "Organization members can view their organization" ON public.organizations';
    EXECUTE 'DROP POLICY IF EXISTS "Organization owners and admins can update organization" ON public.organizations';

    EXECUTE 'CREATE POLICY "Organization members can view their organization"
      ON public.organizations FOR SELECT
      TO authenticated
      USING (public.is_organization_member(organizations.id, (SELECT auth.uid())))';

    EXECUTE 'CREATE POLICY "Organization owners and admins can update organization"
      ON public.organizations FOR UPDATE
      TO authenticated
      USING (public.is_organization_admin(organizations.id, (SELECT auth.uid())))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_members'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Organization members can view other members" ON public.organization_members';

    EXECUTE 'CREATE POLICY "Organization members can view other members"
      ON public.organization_members FOR SELECT
      TO authenticated
      USING (public.is_organization_member(organization_members.organization_id, (SELECT auth.uid())))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_presets'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Organization members can view presets" ON public.organization_presets';

    EXECUTE 'CREATE POLICY "Organization members can view presets"
      ON public.organization_presets FOR SELECT
      TO authenticated
      USING (public.is_organization_member(organization_presets.organization_id, (SELECT auth.uid())))';
  END IF;
END $$;


-- ============================================================================
-- quantum_challenges and quantum_completions (if they still exist)
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'quantum_challenges'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can manage challenges" ON public.quantum_challenges';

    EXECUTE 'CREATE POLICY "Admins can manage challenges"
      ON public.quantum_challenges FOR ALL
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'quantum_completions'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own completions" ON public.quantum_completions';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own completions" ON public.quantum_completions';
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all completions" ON public.quantum_completions';

    EXECUTE 'CREATE POLICY "Users can view their own completions"
      ON public.quantum_completions FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own completions"
      ON public.quantum_completions FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Admins can view all completions"
      ON public.quantum_completions FOR SELECT
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

-- ============================================================================
-- Note: The following tables should already be fixed in migration 20250123000000:
-- - user_affirmation_sets
-- - belief_refactor_entries
-- - user_preferences
-- - user_double_progress
-- - user_double_action_history
-- - subliminal_tracks
-- 
-- But if they're still showing warnings, we'll re-apply the fixes here
-- ============================================================================
DO $$
BEGIN
  -- user_affirmation_sets
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_affirmation_sets'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own affirmation sets" ON public.user_affirmation_sets';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own affirmation sets" ON public.user_affirmation_sets';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own affirmation sets" ON public.user_affirmation_sets';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own affirmation sets" ON public.user_affirmation_sets';

    EXECUTE 'CREATE POLICY "Users can view their own affirmation sets"
      ON public.user_affirmation_sets FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own affirmation sets"
      ON public.user_affirmation_sets FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own affirmation sets"
      ON public.user_affirmation_sets FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own affirmation sets"
      ON public.user_affirmation_sets FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;

  -- belief_refactor_entries
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'belief_refactor_entries'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own belief refactor entries" ON public.belief_refactor_entries';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own belief refactor entries" ON public.belief_refactor_entries';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own belief refactor entries" ON public.belief_refactor_entries';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own belief refactor entries" ON public.belief_refactor_entries';

    EXECUTE 'CREATE POLICY "Users can view their own belief refactor entries"
      ON public.belief_refactor_entries FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own belief refactor entries"
      ON public.belief_refactor_entries FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own belief refactor entries"
      ON public.belief_refactor_entries FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own belief refactor entries"
      ON public.belief_refactor_entries FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;

  -- user_preferences
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_preferences'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own preferences" ON public.user_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own preferences" ON public.user_preferences';

    EXECUTE 'CREATE POLICY "Users can view their own preferences"
      ON public.user_preferences FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own preferences"
      ON public.user_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own preferences"
      ON public.user_preferences FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;

  -- user_double_progress
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_double_progress'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own double progress" ON public.user_double_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own double progress" ON public.user_double_progress';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own double progress" ON public.user_double_progress';

    EXECUTE 'CREATE POLICY "Users can view their own double progress"
      ON public.user_double_progress FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own double progress"
      ON public.user_double_progress FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own double progress"
      ON public.user_double_progress FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;

  -- user_double_action_history
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_double_action_history'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own action history" ON public.user_double_action_history';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own action history" ON public.user_double_action_history';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own action history" ON public.user_double_action_history';

    EXECUTE 'CREATE POLICY "Users can view their own action history"
      ON public.user_double_action_history FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own action history"
      ON public.user_double_action_history FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own action history"
      ON public.user_double_action_history FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;

  -- subliminal_tracks
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'subliminal_tracks'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own subliminal tracks" ON public.subliminal_tracks';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own subliminal tracks" ON public.subliminal_tracks';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own subliminal tracks" ON public.subliminal_tracks';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own subliminal tracks" ON public.subliminal_tracks';

    EXECUTE 'CREATE POLICY "Users can view their own subliminal tracks"
      ON public.subliminal_tracks FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own subliminal tracks"
      ON public.subliminal_tracks FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own subliminal tracks"
      ON public.subliminal_tracks FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own subliminal tracks"
      ON public.subliminal_tracks FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

