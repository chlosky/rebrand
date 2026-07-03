-- Remove all unused tables: sacred_texts, sacred_text_bookmarks, story_chapters, story_panels, community_posts, user_stories, user_gamification_stats, gamification_settings, notifications, notification_settings, user_notification_preferences
-- This migration is idempotent and can be run multiple times safely
-- Drops tables, indexes, triggers, policies, and related objects

-- ============================================================================
-- Drop tables in correct order (respecting foreign key dependencies)
-- ============================================================================

-- Drop story_panels first (has foreign key to story_chapters)
DROP TABLE IF EXISTS public.story_panels CASCADE;

-- Drop story_chapters (has foreign key to user_stories)
DROP TABLE IF EXISTS public.story_chapters CASCADE;

-- Drop user_stories (not used in frontend code)
DROP TABLE IF EXISTS public.user_stories CASCADE;

-- Drop sacred_text_bookmarks (has foreign key to sacred_texts)
DROP TABLE IF EXISTS public.sacred_text_bookmarks CASCADE;

-- Drop sacred_texts
DROP TABLE IF EXISTS public.sacred_texts CASCADE;

-- Drop community_posts
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- Drop user_gamification_stats (gamification feature not used)
DROP TABLE IF EXISTS public.user_gamification_stats CASCADE;

-- Drop gamification_settings (gamification feature not used)
DROP TABLE IF EXISTS public.gamification_settings CASCADE;

-- Drop notification-related tables (notification feature not used)
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.notification_settings CASCADE;
DROP TABLE IF EXISTS public.user_notification_preferences CASCADE;

-- ============================================================================
-- Drop indexes related to these tables (if they exist)
-- ============================================================================

DROP INDEX IF EXISTS public.idx_bookmarks_user;
DROP INDEX IF EXISTS public.idx_bookmarks_text;
DROP INDEX IF EXISTS public.idx_story_chapters_story_id;
DROP INDEX IF EXISTS public.idx_story_panels_chapter_id;
DROP INDEX IF EXISTS public.idx_user_stories_user_id;
DROP INDEX IF EXISTS public.sacred_texts_title_unique_idx;
DROP INDEX IF EXISTS public.idx_user_gamification_stats_user_id;
DROP INDEX IF EXISTS public.idx_user_notification_preferences_user_type;

-- ============================================================================
-- Drop triggers related to these tables (if they exist)
-- ============================================================================

-- Drop triggers using DO block to check table existence first
DO $$
BEGIN
  -- Drop trigger for sacred_texts (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sacred_texts'
  ) THEN
    DROP TRIGGER IF EXISTS update_sacred_texts_updated_at ON public.sacred_texts;
  END IF;

  -- Drop trigger for story_chapters (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'story_chapters'
  ) THEN
    DROP TRIGGER IF EXISTS update_story_chapters_updated_at ON public.story_chapters;
  END IF;

  -- Drop trigger for user_stories (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stories'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_stories_updated_at ON public.user_stories;
  END IF;

  -- Drop trigger for community_posts (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    DROP TRIGGER IF EXISTS update_community_posts_updated_at ON public.community_posts;
  END IF;

  -- Drop trigger for user_gamification_stats (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_gamification_stats'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_gamification_stats_updated_at ON public.user_gamification_stats;
  END IF;

  -- Drop trigger for notification_settings (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_settings'
  ) THEN
    DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON public.notification_settings;
  END IF;

  -- Drop trigger for user_notification_preferences (if table exists)
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notification_preferences'
  ) THEN
    DROP TRIGGER IF EXISTS update_user_notification_preferences_updated_at ON public.user_notification_preferences;
  END IF;
END $$;

-- ============================================================================
-- Drop functions that reference these tables
-- ============================================================================

DROP FUNCTION IF EXISTS public.user_owns_chapter(uuid, uuid) CASCADE;
DROP FUNCTION IF EXISTS public.user_owns_story(uuid, uuid) CASCADE;

-- ============================================================================
-- Remove feature flags for these features (if table exists)
-- ============================================================================

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'feature_flags'
  ) THEN
    DELETE FROM public.feature_flags 
    WHERE feature_name IN ('community_posts', 'sacred_texts', 'user_stories', 'story_chapters', 'story_panels', 'gamification', 'notifications');
  END IF;
END $$;

-- ============================================================================
-- Drop any remaining policies (using DO block for safety)
-- ============================================================================

DO $$
BEGIN
  -- Drop policies for sacred_texts
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sacred_texts'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view active texts" ON public.sacred_texts;
    DROP POLICY IF EXISTS "Anyone can view active texts or admins can view all" ON public.sacred_texts;
    DROP POLICY IF EXISTS "Admins can manage texts" ON public.sacred_texts;
    DROP POLICY IF EXISTS "Admins can insert texts" ON public.sacred_texts;
    DROP POLICY IF EXISTS "Admins can update texts" ON public.sacred_texts;
    DROP POLICY IF EXISTS "Admins can delete texts" ON public.sacred_texts;
  END IF;

  -- Drop policies for sacred_text_bookmarks
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'sacred_text_bookmarks'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.sacred_text_bookmarks;
    DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.sacred_text_bookmarks;
    DROP POLICY IF EXISTS "Users can update their own bookmarks" ON public.sacred_text_bookmarks;
    DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.sacred_text_bookmarks;
  END IF;

  -- Drop policies for story_chapters
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'story_chapters'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their story chapters" ON public.story_chapters;
    DROP POLICY IF EXISTS "Users can create chapters for their stories" ON public.story_chapters;
    DROP POLICY IF EXISTS "Users can update their story chapters" ON public.story_chapters;
    DROP POLICY IF EXISTS "Users can delete their story chapters" ON public.story_chapters;
  END IF;

  -- Drop policies for story_panels
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'story_panels'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their story panels" ON public.story_panels;
    DROP POLICY IF EXISTS "Users can create panels for their chapters" ON public.story_panels;
    DROP POLICY IF EXISTS "Users can update their story panels" ON public.story_panels;
    DROP POLICY IF EXISTS "Users can delete their story panels" ON public.story_panels;
  END IF;

  -- Drop policies for user_stories
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_stories'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own stories" ON public.user_stories;
    DROP POLICY IF EXISTS "Users can create their own stories" ON public.user_stories;
    DROP POLICY IF EXISTS "Users can update their own stories" ON public.user_stories;
    DROP POLICY IF EXISTS "Users can delete their own stories" ON public.user_stories;
  END IF;

  -- Drop policies for community_posts
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'community_posts'
  ) THEN
    DROP POLICY IF EXISTS "Users can view approved posts" ON public.community_posts;
    DROP POLICY IF EXISTS "Users can create posts" ON public.community_posts;
    DROP POLICY IF EXISTS "Admins can manage all posts" ON public.community_posts;
    DROP POLICY IF EXISTS "Admins can manage posts" ON public.community_posts;
  END IF;

  -- Drop policies for user_gamification_stats
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_gamification_stats'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own stats" ON public.user_gamification_stats;
    DROP POLICY IF EXISTS "Users can update their own stats" ON public.user_gamification_stats;
    DROP POLICY IF EXISTS "Users can insert their own stats" ON public.user_gamification_stats;
    DROP POLICY IF EXISTS "Admins can view all stats" ON public.user_gamification_stats;
  END IF;

  -- Drop policies for gamification_settings
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'gamification_settings'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view gamification settings" ON public.gamification_settings;
    DROP POLICY IF EXISTS "Admins can manage gamification settings" ON public.gamification_settings;
  END IF;

  -- Drop policies for notifications
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notifications'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
    DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
  END IF;

  -- Drop policies for notification_settings
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'notification_settings'
  ) THEN
    DROP POLICY IF EXISTS "Anyone can view active notification settings" ON public.notification_settings;
    DROP POLICY IF EXISTS "Admins can manage notification settings" ON public.notification_settings;
    DROP POLICY IF EXISTS "Admins can update notification settings" ON public.notification_settings;
  END IF;

  -- Drop policies for user_notification_preferences
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'user_notification_preferences'
  ) THEN
    DROP POLICY IF EXISTS "Users can view their own preferences" ON public.user_notification_preferences;
    DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_notification_preferences;
  END IF;
END $$;

