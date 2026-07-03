import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

// Sanitize error messages to prevent exposing sensitive information
function sanitizeErrorMessage(error: unknown): string {
  const defaultMessage = "An error occurred. Please try again.";
  
  if (!(error instanceof Error)) {
    return defaultMessage;
  }
  
  const message = error.message.toLowerCase();
  
  // Database errors - hide table/column names
  if (message.includes('relation') || message.includes('column') || 
      message.includes('table') || message.includes('does not exist') ||
      message.includes('syntax error') || message.includes('sql') ||
      message.includes('constraint') || message.includes('violates')) {
    return "Database error. Please try again.";
  }
  
  // RLS/security errors
  if (message.includes('row-level security') || message.includes('rls') || 
      message.includes('permission') || message.includes('unauthorized') ||
      message.includes('pgrst')) {
    return "Permission denied. Please ensure you're logged in.";
  }
  
  // API errors - hide raw responses
  if (message.includes('stripe') || message.includes('openai') || 
      message.includes('api error') || message.includes('api') ||
      message.includes('twilio')) {
    return "Service temporarily unavailable. Please try again.";
  }
  
  // Network errors
  if (message.includes('fetch') || message.includes('network') || 
      message.includes('connection') || message.includes('timeout') ||
      message.includes('econnrefused')) {
    return "Connection error. Please check your internet and try again.";
  }
  
  // Configuration errors - hide env var names
  if (message.includes('not configured') || message.includes('missing') || 
      message.includes('env') || message.includes('environment') ||
      message.includes('secret') || message.includes('key')) {
    return "Service configuration error. Please contact support.";
  }
  
  // File/module errors - hide paths
  if (message.includes('cannot find module') || message.includes('file') || 
      message.includes('path') || message.includes('import') ||
      message.includes('module')) {
    return "Internal error. Please try again.";
  }
  
  // Default safe message
  return defaultMessage;
}

// Allowed origins for CORS
const getAllowedOrigin = (origin: string | null): string => {
  if (!origin) {
    // In development, allow all origins if none specified
    return '*';
  }
  
  const allowedOrigins = [
    'https://localhost:8080',
    'http://localhost:8080',
    'http://localhost:5173',
    'https://localhost:5173',
    'http://127.0.0.1:8080',
    'https://127.0.0.1:8080',
    'http://127.0.0.1:5173',
    'https://127.0.0.1:5173',
    // Add production domain here when ready
    // 'https://yourdomain.com',
  ];
  
  // Normalize origin (remove trailing slash, handle variations)
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  // Check if origin matches any allowed origin
  if (allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }
  
  // In development, allow localhost origins even if not exact match
  if (normalizedOrigin.includes('localhost') || normalizedOrigin.includes('127.0.0.1')) {
    return normalizedOrigin;
  }
  
  // Default: return the origin if it's a localhost variant, otherwise deny
  return '*';
};

const getCorsHeaders = (origin: string | null) => ({
  'Access-Control-Allow-Origin': getAllowedOrigin(origin),
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Credentials': 'true',
});

// Get Stripe Price ID for tier and billing period
function getPriceIdForTier(tier: 'basic' | 'plus' | 'premium', billing: 'monthly' | 'annual' | 'weekly'): string {
  const config = {
    basic: {
      monthly: Deno.env.get('STRIPE_PRICE_BASIC_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_BASIC_ANNUAL') || '',
      weekly: '',
    },
    plus: {
      monthly: Deno.env.get('STRIPE_PRICE_PLUS_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PLUS_ANNUAL') || '',
      weekly: '',
    },
    premium: {
      monthly: Deno.env.get('STRIPE_PRICE_PREMIUM_MONTHLY') || '',
      annual: Deno.env.get('STRIPE_PRICE_PREMIUM_ANNUAL') || '',
      weekly: Deno.env.get('STRIPE_PRICE_PREMIUM_WEEKLY') || '',
    },
  };
  
  return config[tier][billing];
}

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin') || req.headers.get('referer') || '*';
  const corsHeaders = getCorsHeaders(origin);
  
  // Handle OPTIONS preflight request - MUST return immediately
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Length': '0',
      }
    });
  }

  // Wrap everything in try-catch to ensure CORS headers are always returned
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) {
      throw new Error(`Unauthorized: ${userError?.message || 'User not found'}`);
    }

    // Parse request body with error handling
    let requestBody;
    try {
      requestBody = await req.json();
    } catch (parseError) {
      throw new Error(`Invalid request body: ${parseError instanceof Error ? parseError.message : 'Failed to parse JSON'}`);
    }

    const { tier, billing } = requestBody;
    
    if (!tier || !billing) {
      throw new Error(`Missing required fields: tier=${tier}, billing=${billing}`);
    }

    // Validate tier
    if (!['basic', 'plus', 'premium'].includes(tier)) {
      throw new Error('Invalid tier. Must be basic, plus, or premium');
    }

    // Validate billing
    if (!['monthly', 'annual', 'weekly'].includes(billing)) {
      throw new Error('Invalid billing period. Must be monthly, annual, or weekly');
    }

    if (billing === 'weekly' && tier !== 'premium') {
      throw new Error('Weekly billing is only available for premium tier');
    }

    // Get Price ID for this tier and billing period
    const priceId = getPriceIdForTier(tier as 'basic' | 'plus' | 'premium', billing as 'monthly' | 'annual' | 'weekly');
    
    // Validate price_id exists
    if (!priceId || priceId.trim() === '') {
      console.error(`Price ID not configured for tier=${tier}, billing=${billing}`);
      return new Response(
        JSON.stringify({ 
          error: `Price ID not configured for ${tier} ${billing}. Please set STRIPE_PRICE_${tier.toUpperCase()}_${billing.toUpperCase()} environment variable.`,
          details: { tier, billing }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    // Validate price_id format (should start with 'price_')
    if (!priceId.startsWith('price_')) {
      console.error(`Invalid Price ID format: ${priceId}`);
      return new Response(
        JSON.stringify({ 
          error: `Invalid Price ID format for ${tier} ${billing}. Price ID should start with 'price_'.`,
          details: { tier, billing, priceId: priceId.substring(0, 20) + '...' }
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get origin from request headers for success/cancel URLs
    const requestOrigin = req.headers.get('origin') || req.headers.get('referer') || 'http://localhost:8080';
    const baseUrl = requestOrigin.replace(/\/$/, ''); // Remove trailing slash

    // Get or create Stripe customer
    let customerId: string;
    
    // Check if user already has a Stripe customer ID in user_plans
    const { data: existingPlan, error: planError } = await supabase
      .from('user_plans')
      .select('stripe_customer_id')
      .eq('user_id', user.id)
      .maybeSingle();
    
    if (planError && planError.code !== 'PGRST116') { // PGRST116 = no rows returned, which is fine
      console.error('Error checking user_plans:', planError);
      throw new Error(`Database error: ${planError.message}`);
    }
    
    if (existingPlan?.stripe_customer_id) {
      customerId = existingPlan.stripe_customer_id;
    } else {
      // Create new Stripe customer
      // Stripe metadata must be sent as individual key-value pairs, not JSON string
      const customerParams = new URLSearchParams({
        email: user.email || '',
      });
      
      // Add metadata as individual parameters (metadata[key]=value format)
      customerParams.append('metadata[user_id]', user.id);
      
      const customerResponse = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${stripeSecretKey}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: customerParams,
      });

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text();
        console.error('Stripe customer creation error:', errorText);
        throw new Error('Failed to create customer');
      }

      const customer = await customerResponse.json();
      customerId = customer.id;
    }

    // Create Checkout Session using Price ID
    // IMPORTANT: We're creating a Checkout Session, NOT a PaymentIntent
    // For subscriptions, mode must be 'subscription'
    const mode = 'subscription'; // Always subscription for monthly/annual plans
    
    // Build line_items as a plain array - this is what Stripe expects
    // line_items must be: [{ price: 'price_xxx', quantity: 1 }]
    // NOT wrapped in another object, NOT empty, NOT an object directly
    const lineItems = [{
      price: priceId,
      quantity: 1,
    }];
    
    // Validate line_items structure before sending
    if (!Array.isArray(lineItems) || lineItems.length === 0) {
      throw new Error('line_items must be a non-empty array');
    }
    
    if (!lineItems[0].price || !lineItems[0].quantity) {
      throw new Error('line_items[0] must have price and quantity');
    }
    
    // Convert line_items array to JSON string for form-encoded request
    // Stripe's form-encoded API expects line_items as a JSON string
    const lineItemsJson = JSON.stringify(lineItems);
    
    // Build form-encoded body manually
    // Stripe accepts line_items in two formats for form-encoded:
    // 1. JSON string: line_items=[{"price":"price_xxx","quantity":1}]
    // 2. Bracket notation: line_items[0][price]=price_xxx&line_items[0][quantity]=1
    // 
    // We'll use bracket notation as it's more reliable and doesn't require JSON encoding/decoding
    const formParts: string[] = [];
    
    // Helper to safely encode form values (values only, not keys)
    const encodeValue = (value: string) => encodeURIComponent(value);
    
    // Add standard fields
    formParts.push(`customer=${encodeValue(customerId)}`);
    formParts.push(`mode=${encodeValue(mode)}`);
    
    // Use bracket notation for line_items (brackets in keys are NOT encoded)
    // This format: line_items[0][price]=price_xxx&line_items[0][quantity]=1
    formParts.push(`line_items[0][price]=${encodeValue(priceId)}`);
    formParts.push(`line_items[0][quantity]=${encodeValue('1')}`);
    
    formParts.push(`success_url=${encodeValue(`${baseUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}`)}`);
    formParts.push(`cancel_url=${encodeValue(`${baseUrl}/`)}`);
    
    // Add metadata with bracket notation (brackets in keys are NOT encoded)
    formParts.push(`metadata[user_id]=${encodeValue(user.id)}`);
    formParts.push(`metadata[tier]=${encodeValue(tier)}`);
    formParts.push(`metadata[billing]=${encodeValue(billing)}`);
    // Copy onto the created Subscription so webhooks + RevenueCat Stripe notifications see app user id
    formParts.push(`subscription_data[metadata][user_id]=${encodeValue(user.id)}`);
    formParts.push(`subscription_data[metadata][app_user_id]=${encodeValue(user.id)}`);
    
    // Enable promo codes in Checkout
    formParts.push(`allow_promotion_codes=true`);
    
    const formBody = formParts.join('&');
    
    // Log the exact form body being sent (first 500 chars to see line_items format)
    console.log('Form body being sent to Stripe (first 500 chars):', formBody.substring(0, 500));
    console.log('line_items in form body:', formBody.match(/line_items\[0\]\[price\]=([^&]+)/)?.[1]);
    
    // Log the payload (safe - no secrets) - this is critical for debugging
    console.log('Creating Stripe Checkout Session - Payload:', {
      customerId,
      mode,
      priceId,
      tier,
      billing,
      lineItems: lineItems, // Log the actual array structure
      lineItemsJson: lineItemsJson, // Log the JSON string we're sending
      lineItemsType: typeof lineItems,
      lineItemsIsArray: Array.isArray(lineItems),
      lineItemsLength: lineItems.length,
      baseUrl,
      formBodyPreview: formBody.substring(0, 300), // First 300 chars of form body
    });
    
    const sessionResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formBody,
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('Stripe Checkout Session creation error:', errorText);
      
      // Try to parse the error for more details
      let errorMessage = 'Failed to create checkout session';
      try {
        const errorJson = JSON.parse(errorText);
        if (errorJson.error?.message) {
          errorMessage = `Stripe error: ${errorJson.error.message}`;
        } else if (errorJson.message) {
          errorMessage = `Stripe error: ${errorJson.message}`;
        }
      } catch (e) {
        // If parsing fails, use the raw error text
        errorMessage = `Stripe API error: ${errorText.substring(0, 200)}`;
      }
      
      throw new Error(errorMessage);
    }

    const session = await sessionResponse.json();

    return new Response(
      JSON.stringify({ 
        sessionId: session.id,
        url: session.url,
        type: mode,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-payment-intent:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    // Always return CORS headers, even on error
    const errorOrigin = req.headers.get('origin') || req.headers.get('referer') || '*';
    const errorCorsHeaders = getCorsHeaders(errorOrigin);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    const errorDetails = error instanceof Error ? {
      message: error.message,
      name: error.name,
    } : { message: String(error) };
    
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { 
          ...errorCorsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});

