-- New boards default to white background.
ALTER TABLE public.boards
  ALTER COLUMN color_key SET DEFAULT 'white_opaque';
