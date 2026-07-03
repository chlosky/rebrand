-- Daily plot prompts (read-only inspiration; feed stays admin one-way).
CREATE TABLE IF NOT EXISTS public.community_daily_prompts (
  category text NOT NULL
    CHECK (category IN ('vision_board_rebrand', 'moodboard', 'home_organization', 'office_organization')),
  day_index int NOT NULL CHECK (day_index >= 0 AND day_index <= 6),
  prompt_text text NOT NULL,
  PRIMARY KEY (category, day_index)
);

ALTER TABLE public.community_daily_prompts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "community_daily_prompts_select_auth" ON public.community_daily_prompts;
CREATE POLICY "community_daily_prompts_select_auth"
  ON public.community_daily_prompts FOR SELECT TO authenticated
  USING (true);

INSERT INTO public.community_daily_prompts (category, day_index, prompt_text)
VALUES
  ('moodboard', 0, 'What color is your moodboard missing right now — and what lane does it belong to?'),
  ('moodboard', 1, 'Share one screenshot you almost deleted. What made you keep it?'),
  ('moodboard', 2, 'Four-corner check: which corner feels weakest — money, body, space, or plot twist?'),
  ('moodboard', 3, 'Post a palette (2–4 colors) that matches the week you want.'),
  ('moodboard', 4, 'What would you cut if you could only keep five images?'),
  ('moodboard', 5, 'Show your desk or wall — messy is fine. What is one edit you will make tonight?'),
  ('moodboard', 6, 'Sunday plot: what vibe are you importing into next week?'),
  ('vision_board_rebrand', 0, 'Quiet rebrand check — what is one thing you changed visibly this month?'),
  ('vision_board_rebrand', 1, 'Share an image that represents a lane you are not ready to announce yet.'),
  ('vision_board_rebrand', 2, 'Three lanes, not twelve: name your three focus areas this season.'),
  ('vision_board_rebrand', 3, 'What is on your plan board this week that scares you a little?'),
  ('vision_board_rebrand', 4, 'Before / after: one corner of your space or aesthetic that shifted.'),
  ('vision_board_rebrand', 5, 'Drop a phrase you are repeating this week — no context needed.'),
  ('vision_board_rebrand', 6, 'What proof habit made your rebrand feel real lately?'),
  ('office_organization', 0, 'Monday Now column: what three tasks actually earned a spot?'),
  ('office_organization', 1, 'Share your desk or planner — what is one thing you will delete today?'),
  ('office_organization', 2, 'Weird-girl money row: one revenue move you are making this week.'),
  ('office_organization', 3, 'What lives on Later that you are finally killing this Friday?'),
  ('office_organization', 4, 'Color-code check: what project gets which accent on your board?'),
  ('office_organization', 5, 'Waiting-on list dump — what is stuck because of someone else?'),
  ('office_organization', 6, 'Win post: something you shipped or sent this week.'),
  ('home_organization', 0, 'Zone map: which blob is lying — enter, work, rest, or stash?'),
  ('home_organization', 1, 'Sunday reset — surfaces before or after (both welcome).'),
  ('home_organization', 2, 'Launchpad photo: keys, charger, tomorrow outfit — what is yours?'),
  ('home_organization', 3, 'One bin or basket that actually has a job. Show it.'),
  ('home_organization', 4, 'What purchase almost made you a storage goblin?'),
  ('home_organization', 5, 'Maintain zone brag: desk, vanity, or coffee station — show the one you keep.'),
  ('home_organization', 6, 'What object finally went back to the right blob this week?')
ON CONFLICT (category, day_index) DO UPDATE
SET prompt_text = EXCLUDED.prompt_text;
