-- Fix search_path for validate_and_redeem_code function
CREATE OR REPLACE FUNCTION public.validate_and_redeem_code(
  p_code TEXT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Fix search_path for update_referral_codes_updated_at function
CREATE OR REPLACE FUNCTION public.update_referral_codes_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;