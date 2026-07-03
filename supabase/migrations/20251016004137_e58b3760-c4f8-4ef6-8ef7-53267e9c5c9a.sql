-- Create enum for code types
CREATE TYPE public.code_type AS ENUM ('discount', 'referral', 'group', 'enterprise');

-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  code_type code_type NOT NULL DEFAULT 'discount',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  
  -- Code settings
  discount_percentage INTEGER CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  discount_amount DECIMAL(10,2),
  max_uses INTEGER,
  current_uses INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create code_redemptions table to track usage
CREATE TABLE public.code_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code_id UUID REFERENCES public.referral_codes(id) ON DELETE CASCADE NOT NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What they got
  discount_applied DECIMAL(10,2),
  
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  UNIQUE(code_id, redeemed_by)
);

-- Add code_used field to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS signup_code TEXT;

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.code_redemptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
-- Admins can manage all codes
CREATE POLICY "Admins can manage all codes"
  ON public.referral_codes
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view active, non-expired codes (to validate)
CREATE POLICY "Anyone can view active codes"
  ON public.referral_codes
  FOR SELECT
  USING (
    is_active = true 
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses)
  );

-- RLS Policies for code_redemptions
-- Admins can view all redemptions
CREATE POLICY "Admins can view all redemptions"
  ON public.code_redemptions
  FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Users can view their own redemptions
CREATE POLICY "Users can view their own redemptions"
  ON public.code_redemptions
  FOR SELECT
  USING (auth.uid() = redeemed_by);

-- Function to validate and redeem a code
CREATE OR REPLACE FUNCTION public.validate_and_redeem_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code_record RECORD;
  v_discount DECIMAL(10,2) := 0;
  v_result JSONB;
BEGIN
  -- Find the code
  SELECT * INTO v_code_record
  FROM public.referral_codes
  WHERE code = p_code
    AND is_active = true
    AND (expires_at IS NULL OR expires_at > now())
    AND (max_uses IS NULL OR current_uses < max_uses);
  
  -- Check if code exists
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Invalid or expired code'
    );
  END IF;
  
  -- Check if user already redeemed this code
  IF EXISTS (
    SELECT 1 FROM public.code_redemptions
    WHERE code_id = v_code_record.id
      AND redeemed_by = p_user_id
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Code already used'
    );
  END IF;
  
  -- Calculate discount
  IF v_code_record.discount_amount IS NOT NULL THEN
    v_discount := v_code_record.discount_amount;
  END IF;
  
  -- Record redemption
  INSERT INTO public.code_redemptions (
    code_id,
    redeemed_by,
    discount_applied
  ) VALUES (
    v_code_record.id,
    p_user_id,
    v_discount
  );
  
  -- Update usage count
  UPDATE public.referral_codes
  SET current_uses = current_uses + 1,
      updated_at = now()
  WHERE id = v_code_record.id;
  
  -- Return success with code details
  RETURN jsonb_build_object(
    'success', true,
    'code_type', v_code_record.code_type,
    'discount_percentage', v_code_record.discount_percentage,
    'discount_amount', v_discount,
    'description', v_code_record.description
  );
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_referral_codes_code ON public.referral_codes(code);
CREATE INDEX idx_referral_codes_active ON public.referral_codes(is_active, expires_at);
CREATE INDEX idx_code_redemptions_user ON public.code_redemptions(redeemed_by);
CREATE INDEX idx_code_redemptions_code ON public.code_redemptions(code_id);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION public.update_referral_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_referral_codes_updated_at
  BEFORE UPDATE ON public.referral_codes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_referral_codes_updated_at();