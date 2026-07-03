-- Create quantum challenges table (admin creates weekly challenges)
CREATE TABLE IF NOT EXISTS public.quantum_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  week_start DATE NOT NULL,
  week_end DATE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create quantum completions table (users complete challenges)
CREATE TABLE IF NOT EXISTS public.quantum_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  challenge_id UUID NOT NULL REFERENCES public.quantum_challenges(id) ON DELETE CASCADE,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completion_note TEXT,
  photo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS on quantum_challenges
ALTER TABLE public.quantum_challenges ENABLE ROW LEVEL SECURITY;

-- Everyone can view active challenges
CREATE POLICY "Anyone can view active challenges"
ON public.quantum_challenges
FOR SELECT
USING (is_active = true);

-- Admins can manage challenges
CREATE POLICY "Admins can manage challenges"
ON public.quantum_challenges
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Enable RLS on quantum_completions
ALTER TABLE public.quantum_completions ENABLE ROW LEVEL SECURITY;

-- Users can view their own completions
CREATE POLICY "Users can view their own completions"
ON public.quantum_completions
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own completions
CREATE POLICY "Users can create their own completions"
ON public.quantum_completions
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can view all completions
CREATE POLICY "Admins can view all completions"
ON public.quantum_completions
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create trigger for updated_at
CREATE TRIGGER update_quantum_challenges_updated_at
  BEFORE UPDATE ON public.quantum_challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Create index for performance
CREATE INDEX idx_quantum_challenges_active ON public.quantum_challenges(is_active, week_start, week_end);
CREATE INDEX idx_quantum_completions_user ON public.quantum_completions(user_id);
CREATE INDEX idx_quantum_completions_challenge ON public.quantum_completions(challenge_id);