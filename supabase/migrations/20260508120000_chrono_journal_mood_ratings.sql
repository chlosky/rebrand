-- =============================================================================
-- Manifestation Journal — persisted reflection answers on public.chrono_entries
-- =============================================================================
-- UI (ChronoEntryForm) asks two questions per entry; both map to three options:
--   (1) How was the 3D (external environment) today?     → journal_env_3d_rating
--   (2) How did you experience the day?                  → journal_day_experience_rating
--
-- Stored values (text): NULL | 'negative' | 'neutral' | 'positive'
--   negative = rough/heavy (sad face), neutral = meh, positive = smiley
--
-- Legacy column has_wins (boolean) may still exist on older rows; new saves use
-- these two columns instead.
-- =============================================================================

ALTER TABLE public.chrono_entries
  ADD COLUMN IF NOT EXISTS journal_env_3d_rating text;

ALTER TABLE public.chrono_entries
  ADD COLUMN IF NOT EXISTS journal_day_experience_rating text;

ALTER TABLE public.chrono_entries
  DROP CONSTRAINT IF EXISTS chrono_entries_journal_env_3d_rating_check;

ALTER TABLE public.chrono_entries
  ADD CONSTRAINT chrono_entries_journal_env_3d_rating_check
  CHECK (journal_env_3d_rating IS NULL OR journal_env_3d_rating IN ('negative', 'neutral', 'positive'));

ALTER TABLE public.chrono_entries
  DROP CONSTRAINT IF EXISTS chrono_entries_journal_day_experience_rating_check;

ALTER TABLE public.chrono_entries
  ADD CONSTRAINT chrono_entries_journal_day_experience_rating_check
  CHECK (
    journal_day_experience_rating IS NULL
    OR journal_day_experience_rating IN ('negative', 'neutral', 'positive')
  );

COMMENT ON COLUMN public.chrono_entries.journal_env_3d_rating IS
  'Manifestation journal Q1: external / 3D environment felt negative | neutral | positive (maps to sad | neutral | smile UI).';

COMMENT ON COLUMN public.chrono_entries.journal_day_experience_rating IS
  'Manifestation journal Q2: subjective experience of the day (negative | neutral | positive).';
