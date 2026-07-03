-- Remove unused tables: sacred_texts, story_chapters, story_panels, community_posts
-- and their related tables and functions

-- ============================================================================
-- Drop tables and related objects
-- ============================================================================

-- Drop story_panels first (has foreign key to story_chapters)
DROP TABLE IF EXISTS public.story_panels CASCADE;

-- Drop story_chapters (has foreign key to user_stories)
DROP TABLE IF EXISTS public.story_chapters CASCADE;

-- Drop sacred_text_bookmarks (has foreign key to sacred_texts)
DROP TABLE IF EXISTS public.sacred_text_bookmarks CASCADE;

-- Drop sacred_texts
DROP TABLE IF EXISTS public.sacred_texts CASCADE;

-- Drop community_posts
DROP TABLE IF EXISTS public.community_posts CASCADE;

-- ============================================================================
-- Drop helper functions that reference these tables
-- ============================================================================
DROP FUNCTION IF EXISTS public.user_owns_chapter(uuid, uuid) CASCADE;

-- Note: user_owns_story function is kept as user_stories table is still in use

-- ============================================================================
-- Remove feature flags for these features
-- ============================================================================
DELETE FROM public.feature_flags 
WHERE feature_name IN ('community_posts', 'sacred_texts');

