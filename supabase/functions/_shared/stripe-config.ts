// Stripe Price ID Configuration
// Map tiers to Stripe Price IDs
// These should be set as environment variables in Supabase

export interface StripePriceConfig {
  basic: {
    monthly: string;
    annual: string;
  };
  plus: {
    monthly: string;
    annual: string;
  };
  premium: {
    monthly: string;
    annual: string;
    weekly: string;
  };
}

export function getStripePriceIds(): StripePriceConfig {
  // Get from environment variables
  // Format: STRIPE_PRICE_BASIC_MONTHLY, STRIPE_PRICE_BASIC_ANNUAL, etc.
  return {
    basic: {
      monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || '',
    },
    plus: {
      monthly: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL') || '',
    },
    premium: {
      monthly: Deno.env.get('P_STRIPE_PRICE_PREMIUM_MONTHLY') || '',
      annual: Deno.env.get('P_STRIPE_PRICE_PREMIUM_ANNUAL') || '',
      weekly: Deno.env.get('STRIPE_PRICE_PREMIUM_WEEKLY') || '',
    },
  };
}

// Map Stripe Price ID to tier
export function getTierFromPriceId(priceId: string): 'basic' | 'plus' | 'premium' | null {
  const config = getStripePriceIds();
  
  // Check all price IDs
  if (priceId === config.basic.monthly || priceId === config.basic.annual) {
    return 'basic';
  }
  if (priceId === config.plus.monthly || priceId === config.plus.annual) {
    return 'plus';
  }
  if (priceId === config.premium.monthly || priceId === config.premium.annual || priceId === config.premium.weekly) {
    return 'premium';
  }
  
  return null;
}

// Get Price ID for a tier and billing period
export function getPriceIdForTier(
  tier: 'basic' | 'plus' | 'premium',
  billing: 'monthly' | 'annual' | 'weekly',
): string {
  const config = getStripePriceIds();
  if (billing === 'weekly') {
    if (tier !== 'premium') return '';
    return config.premium.weekly;
  }
  return config[tier][billing as 'monthly' | 'annual'];
}





















































