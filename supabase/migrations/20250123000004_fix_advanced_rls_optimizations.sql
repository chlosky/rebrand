-- Fix advanced RLS policy issues:
-- 1. Replace FOR ALL with specific operations
-- 2. Add TO authenticated clause where appropriate
-- 3. Fix JOIN-based policy checks to use EXISTS
-- 4. Fix split_part usage in triggers
-- 5. Optimize broad policies
--
-- NOTE: This migration depends on helper functions created in previous migrations:
-- - public.has_role() from 20250123000001_fix_has_role_policies_optimization.sql
-- - public.is_organization_admin() from 20250123000002_fix_organization_rls_optimization.sql
-- If you get errors about missing functions, run those migrations first.

-- ============================================================================
-- Ensure required helper functions exist (create if they don't)
-- ============================================================================

-- Ensure has_role function exists and is STABLE
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

-- Ensure is_organization_admin function exists (if organizations table exists)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) THEN
    -- Create is_organization_admin function if organizations table exists
    EXECUTE '
    CREATE OR REPLACE FUNCTION public.is_organization_admin(_organization_id uuid, _user_id uuid)
    RETURNS boolean
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = public
    AS $func$
      SELECT EXISTS (
        SELECT 1
        FROM public.organization_members
        WHERE organization_id = _organization_id
          AND user_id = _user_id
          AND role IN (''owner'', ''admin'')
      )
    $func$';
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- If function creation fails, continue (might already exist with different signature)
    NULL;
END $$;

-- ============================================================================
-- Fix profiles table policies - Add TO authenticated and optimize
-- ============================================================================
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING ((SELECT auth.uid()) = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- Fix premade_affirmation_sets - Split FOR ALL and add TO clause
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage premade sets" ON public.premade_affirmation_sets;

CREATE POLICY "Admins can view all premade sets"
  ON public.premade_affirmation_sets FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert premade sets"
  ON public.premade_affirmation_sets FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update premade sets"
  ON public.premade_affirmation_sets FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete premade sets"
  ON public.premade_affirmation_sets FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- Fix premade_affirmations - Split FOR ALL and add TO clause
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage premade affirmations" ON public.premade_affirmations;

CREATE POLICY "Admins can view all premade affirmations"
  ON public.premade_affirmations FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert premade affirmations"
  ON public.premade_affirmations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update premade affirmations"
  ON public.premade_affirmations FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete premade affirmations"
  ON public.premade_affirmations FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- Fix system_announcements - Split FOR ALL and add TO clause
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.system_announcements;

CREATE POLICY "Admins can view all announcements"
  ON public.system_announcements FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert announcements"
  ON public.system_announcements FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update announcements"
  ON public.system_announcements FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete announcements"
  ON public.system_announcements FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- Fix feature_flags - Split FOR ALL and add TO clause
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage feature flags" ON public.feature_flags;

CREATE POLICY "Admins can view all feature flags"
  ON public.feature_flags FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update feature flags"
  ON public.feature_flags FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- Fix organization policies - Split FOR ALL into specific operations
-- ============================================================================
DROP POLICY IF EXISTS "Admins can manage all organizations" ON public.organizations;
DROP POLICY IF EXISTS "Organization owners and admins can manage members" ON public.organization_members;
DROP POLICY IF EXISTS "Admins can manage all organization members" ON public.organization_members;
DROP POLICY IF EXISTS "Organization owners and admins can manage presets" ON public.organization_presets;
DROP POLICY IF EXISTS "Admins can manage all organization presets" ON public.organization_presets;

CREATE POLICY "Admins can view all organizations"
  ON public.organizations FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert organizations"
  ON public.organizations FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update organizations"
  ON public.organizations FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete organizations"
  ON public.organizations FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Organization owners and admins can view members"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can insert members"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can update members"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can delete members"
  ON public.organization_members FOR DELETE
  TO authenticated
  USING (public.is_organization_admin(organization_members.organization_id, (SELECT auth.uid())));

CREATE POLICY "Admins can view all organization members"
  ON public.organization_members FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert organization members"
  ON public.organization_members FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update organization members"
  ON public.organization_members FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete organization members"
  ON public.organization_members FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Organization owners and admins can view presets"
  ON public.organization_presets FOR SELECT
  TO authenticated
  USING (public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can insert presets"
  ON public.organization_presets FOR INSERT
  TO authenticated
  WITH CHECK (public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can update presets"
  ON public.organization_presets FOR UPDATE
  TO authenticated
  USING (public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid())));

CREATE POLICY "Organization owners and admins can delete presets"
  ON public.organization_presets FOR DELETE
  TO authenticated
  USING (public.is_organization_admin(organization_presets.organization_id, (SELECT auth.uid())));

CREATE POLICY "Admins can view all organization presets"
  ON public.organization_presets FOR SELECT
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can insert organization presets"
  ON public.organization_presets FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can update organization presets"
  ON public.organization_presets FOR UPDATE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

CREATE POLICY "Admins can delete organization presets"
  ON public.organization_presets FOR DELETE
  TO authenticated
  USING (public.has_role((SELECT auth.uid()), 'admin'::app_role));

-- ============================================================================
-- Fix character_messages and user_message_limits - Replace FOR ALL
-- Only apply if tables exist (using dynamic SQL to avoid errors)
-- ============================================================================
DO $$
BEGIN
  -- Only create policies for character_messages if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'character_messages'
  ) THEN
    -- Drop existing policies using dynamic SQL
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage all messages" ON public.character_messages';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own messages" ON public.character_messages';

    -- Service role policies should use service_role, not FOR ALL
    EXECUTE 'CREATE POLICY "Service role can view all messages"
      ON public.character_messages FOR SELECT
      TO service_role
      USING (true)';

    EXECUTE 'CREATE POLICY "Service role can insert messages"
      ON public.character_messages FOR INSERT
      TO service_role
      WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Service role can update messages"
      ON public.character_messages FOR UPDATE
      TO service_role
      USING (true)';

    EXECUTE 'CREATE POLICY "Service role can delete messages"
      ON public.character_messages FOR DELETE
      TO service_role
      USING (true)';

    EXECUTE 'CREATE POLICY "Users can view their own messages"
      ON public.character_messages FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;

  -- Only create policies for user_message_limits if table exists
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_message_limits'
  ) THEN
    -- Drop existing policies using dynamic SQL
    EXECUTE 'DROP POLICY IF EXISTS "Service role can manage all message limits" ON public.user_message_limits';
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own message limits" ON public.user_message_limits';

    EXECUTE 'CREATE POLICY "Service role can view all message limits"
      ON public.user_message_limits FOR SELECT
      TO service_role
      USING (true)';

    EXECUTE 'CREATE POLICY "Service role can insert message limits"
      ON public.user_message_limits FOR INSERT
      TO service_role
      WITH CHECK (true)';

    EXECUTE 'CREATE POLICY "Service role can update message limits"
      ON public.user_message_limits FOR UPDATE
      TO service_role
      USING (true)';

    EXECUTE 'CREATE POLICY "Service role can delete message limits"
      ON public.user_message_limits FOR DELETE
      TO service_role
      USING (true)';

    EXECUTE 'CREATE POLICY "Users can view their own message limits"
      ON public.user_message_limits FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- Fix handle_new_user_profile function - Optimize split_part usage
-- Store parsed value in a variable to avoid repeated parsing
-- Note: Trigger functions cannot be STABLE, but we minimize parsing
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  username_value TEXT;
BEGIN
  -- Parse once and store in variable (avoids repeated parsing)
  username_value := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );
  
  INSERT INTO public.profiles (id, email, username)
  VALUES (NEW.id, NEW.email, username_value);
  
  RETURN NEW;
END;
$$;

-- ============================================================================
-- Fix user_stories policies - Add TO authenticated and optimize
-- Only apply if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stories'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own stories" ON public.user_stories';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own stories" ON public.user_stories';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own stories" ON public.user_stories';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own stories" ON public.user_stories';

    EXECUTE 'CREATE POLICY "Users can view their own stories"
      ON public.user_stories FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own stories"
      ON public.user_stories FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own stories"
      ON public.user_stories FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own stories"
      ON public.user_stories FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- Fix chrono_entries policies - Add TO authenticated and optimize
-- Only apply if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'chrono_entries'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own chrono entries" ON public.chrono_entries';
    EXECUTE 'DROP POLICY IF EXISTS "Users can create their own chrono entries" ON public.chrono_entries';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own chrono entries" ON public.chrono_entries';
    EXECUTE 'DROP POLICY IF EXISTS "Users can delete their own chrono entries" ON public.chrono_entries';

    EXECUTE 'CREATE POLICY "Users can view their own chrono entries"
      ON public.chrono_entries FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can create their own chrono entries"
      ON public.chrono_entries FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own chrono entries"
      ON public.chrono_entries FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can delete their own chrono entries"
      ON public.chrono_entries FOR DELETE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- Note: character_messages and user_message_limits policies are handled above
-- in the "Replace FOR ALL" section with table existence checks
-- ============================================================================

-- ============================================================================
-- Fix user_character_preferences - Add TO authenticated
-- Only apply if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_character_preferences'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Users can view their own character preferences" ON public.user_character_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users can update their own character preferences" ON public.user_character_preferences';
    EXECUTE 'DROP POLICY IF EXISTS "Users can insert their own character preferences" ON public.user_character_preferences';

    EXECUTE 'CREATE POLICY "Users can view their own character preferences"
      ON public.user_character_preferences FOR SELECT
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can update their own character preferences"
      ON public.user_character_preferences FOR UPDATE
      TO authenticated
      USING ((SELECT auth.uid()) = user_id)';

    EXECUTE 'CREATE POLICY "Users can insert their own character preferences"
      ON public.user_character_preferences FOR INSERT
      TO authenticated
      WITH CHECK ((SELECT auth.uid()) = user_id)';
  END IF;
END $$;

-- ============================================================================
-- Fix activity_logs - Add TO authenticated
-- Only apply if table exists
-- ============================================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'activity_logs'
  ) THEN
    EXECUTE 'DROP POLICY IF EXISTS "Admins can view all logs" ON public.activity_logs';

    EXECUTE 'CREATE POLICY "Admins can view all logs"
      ON public.activity_logs FOR SELECT
      TO authenticated
      USING (public.has_role((SELECT auth.uid()), ''admin''::app_role))';
  END IF;
END $$;

