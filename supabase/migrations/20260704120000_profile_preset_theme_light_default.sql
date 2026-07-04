-- Light shell matches onboarding; legacy `command` was the old cosmic default.
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_preset_theme_check;

UPDATE public.profiles
SET preset_theme = 'light'
WHERE preset_theme IS NULL OR preset_theme = 'command';

UPDATE public.profiles
SET preset_theme = 'dark'
WHERE preset_theme IN ('glow', 'volt', 'ground', 'blush', 'pale-blue', 'sage');

ALTER TABLE public.profiles
  ALTER COLUMN preset_theme SET DEFAULT 'light';

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_preset_theme_check
  CHECK (preset_theme IN ('light', 'dark'));
