-- Populate premade affirmation sets with existing content (using UUIDs)
INSERT INTO public.premade_affirmation_sets (title, description, category, is_active) VALUES
('Wealth & Abundance', 'Attract wealth and financial prosperity', 'Finance', true),
('Love & Relationships', 'Manifest healthy and fulfilling relationships', 'Relationships', true),
('Business Success', 'Grow and prosper in business', 'Business', true),
('Job Interview Success', 'Excel in job interviews', 'Career', true),
('Career Success', 'Advance in your career', 'Career', true),
('Home Purchase', 'Manifest your dream home', 'Lifestyle', true),
('Education & Learning', 'Excel in learning and education', 'Personal Growth', true)
ON CONFLICT DO NOTHING
RETURNING id, title;

-- Create a temporary table to store the IDs and titles for reference
CREATE TEMP TABLE temp_set_ids AS
SELECT id, title FROM public.premade_affirmation_sets;

-- Populate affirmations for Wealth & Abundance
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'I am a money magnet and attract wealth effortlessly',
  'Abundance flows to me from multiple sources',
  'I am worthy of financial prosperity and success',
  'Money comes to me easily and frequently',
  'I am financially free and secure',
  'I create wealth through my talents and abilities',
  'My income exceeds my expenses consistently',
  'I make smart financial decisions with confidence'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Wealth & Abundance';

-- Populate affirmations for Love & Relationships
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'I am worthy of deep, authentic love',
  'I attract healthy and fulfilling relationships',
  'Love flows freely to and from me',
  'I am open to giving and receiving love',
  'My heart is open and ready for true connection',
  'I deserve a partner who respects and values me',
  'I am surrounded by loving, supportive people',
  'My relationships grow stronger every day'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Love & Relationships';

-- Populate affirmations for Business Success
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'My business grows and prospers every day',
  'I am a successful and confident entrepreneur',
  'I attract ideal clients who value my services',
  'My business generates consistent revenue',
  'I make decisions that benefit my business growth',
  'Success comes naturally to me in business',
  'I am innovative and ahead of the competition',
  'My business makes a positive impact on others'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Business Success';

-- Populate affirmations for Job Interview Success
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'I am the perfect candidate for this position',
  'I communicate my skills confidently and clearly',
  'The interviewer sees my value and potential',
  'I answer every question with poise and confidence',
  'This job is mine and I am excited to start',
  'I make an excellent impression in interviews',
  'My experience and skills speak for themselves',
  'I am calm, confident, and prepared for success'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Job Interview Success';

-- Populate affirmations for Career Success
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'I am advancing in my career with ease',
  'I am recognized and rewarded for my contributions',
  'Opportunities for growth come to me naturally',
  'I am a valuable asset to my organization',
  'I deserve success and promotion in my career',
  'My skills and talents are appreciated and valued',
  'I achieve my professional goals with confidence',
  'My career path is filled with exciting opportunities'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Career Success';

-- Populate affirmations for Home Purchase
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'I am manifesting my dream home with ease',
  'The perfect home is waiting for me',
  'I have the financial means to purchase my ideal home',
  'My new home brings me joy, peace, and comfort',
  'I am worthy of a beautiful, safe living space',
  'Everything aligns perfectly for my home purchase',
  'I make my house a warm and welcoming home',
  'My dream home is becoming my reality now'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Home Purchase';

-- Populate affirmations for Education & Learning
INSERT INTO public.premade_affirmations (set_id, text, order_index)
SELECT id, affirmation, row_number FROM temp_set_ids,
LATERAL unnest(ARRAY[
  'I am an excellent student and eager learner',
  'Knowledge comes easily and naturally to me',
  'I absorb information quickly and retain it well',
  'I am focused, disciplined, and motivated to learn',
  'My education opens doors to amazing opportunities',
  'I succeed in all my academic endeavors',
  'I am intelligent and capable of achieving my goals',
  'Learning is enjoyable and rewarding for me'
]) WITH ORDINALITY AS t(affirmation, row_number)
WHERE title = 'Education & Learning';

-- Add some initial feature flags
INSERT INTO public.feature_flags (feature_name, is_enabled, description) VALUES
('subliminal_audio', true, 'Enable subliminal audio feature'),
('ai_visualizations', true, 'Enable AI-powered visualizations'),
('mirror_mode', true, 'Enable mirror mode with camera'),
('notifications', true, 'Enable manifestation notifications'),
('journal', true, 'Enable daily journal feature')
ON CONFLICT (feature_name) DO NOTHING;