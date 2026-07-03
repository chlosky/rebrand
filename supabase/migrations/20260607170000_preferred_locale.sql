ALTER TABLE user_preferences ADD COLUMN IF NOT EXISTS preferred_locale TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS preferred_locale TEXT;
