-- Ensure upsert works in load-sacred-texts by adding a unique index on title
-- This satisfies ON CONFLICT (title)
CREATE UNIQUE INDEX IF NOT EXISTS sacred_texts_title_unique_idx
ON public.sacred_texts (title);
