-- Create aesthetic_profiles table for storing user's aesthetic customizations
CREATE TABLE public.aesthetic_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Current self photo
  current_photo_url TEXT,
  
  -- Physical appearance customizations
  body_type TEXT, -- slim, athletic, average, curvy, muscular
  skin_tone TEXT,
  hair_style TEXT,
  hair_color TEXT,
  facial_features JSONB DEFAULT '{}', -- for future expansion
  
  -- Style & outfit
  outfit_style TEXT, -- casual, business, streetwear, athletic, artistic, etc.
  accessories JSONB DEFAULT '[]', -- array of selected accessories
  
  -- Environment & location
  location_vibe TEXT, -- urban, beach, mountains, studio, home, office, etc.
  background_setting TEXT, -- specific like "NYC skyline", "Malibu beach", etc.
  
  -- Hobbies & interests
  hobbies JSONB DEFAULT '[]', -- array of hobby selections
  
  -- Goals & aspirations
  goals JSONB DEFAULT '[]', -- array of goal selections
  
  -- Generated aesthetic image
  aesthetic_image_url TEXT,
  image_prompt TEXT, -- the prompt used to generate the image
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS
ALTER TABLE public.aesthetic_profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own aesthetic profiles
CREATE POLICY "Users can view their own aesthetic profiles"
  ON public.aesthetic_profiles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own aesthetic profiles
CREATE POLICY "Users can create their own aesthetic profiles"
  ON public.aesthetic_profiles
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own aesthetic profiles
CREATE POLICY "Users can update their own aesthetic profiles"
  ON public.aesthetic_profiles
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own aesthetic profiles
CREATE POLICY "Users can delete their own aesthetic profiles"
  ON public.aesthetic_profiles
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can view all aesthetic profiles
CREATE POLICY "Admins can view all aesthetic profiles"
  ON public.aesthetic_profiles
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger
CREATE TRIGGER update_aesthetic_profiles_updated_at
  BEFORE UPDATE ON public.aesthetic_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();