-- Create pricing_display table for UI display prices
-- This is separate from Stripe - just for showing prices in the UI
-- Can be edited in Supabase dashboard when prices change

CREATE TABLE IF NOT EXISTS public.pricing_display (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tier TEXT NOT NULL UNIQUE CHECK (tier IN ('basic', 'plus', 'premium')),
  monthly_display_price NUMERIC(10, 2) NOT NULL,
  annual_display_price NUMERIC(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pricing_display ENABLE ROW LEVEL SECURITY;

-- Anyone can view pricing (public table)
CREATE POLICY "Anyone can view pricing display"
  ON public.pricing_display
  FOR SELECT
  USING (true);

-- Insert initial pricing (can be updated later)
INSERT INTO public.pricing_display (tier, monthly_display_price, annual_display_price) VALUES
  ('basic', 29.00, 250.00),
  ('plus', 49.00, 450.00),
  ('premium', 79.00, 800.00)
ON CONFLICT (tier) DO NOTHING;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_pricing_display_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER update_pricing_display_updated_at
  BEFORE UPDATE ON public.pricing_display
  FOR EACH ROW
  EXECUTE FUNCTION update_pricing_display_updated_at();





















































