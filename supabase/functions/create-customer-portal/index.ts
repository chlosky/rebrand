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

// Get allowed origin for CORS
const getAllowedOrigin = (origin: string | null): string => {
  if (!origin) {
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
  ];
  
  const normalizedOrigin = origin.replace(/\/$/, '');
  
  if (allowedOrigins.includes(normalizedOrigin)) {
    return normalizedOrigin;
  }
  
  // For production, you might want to check against your actual domain
  // For now, allow all in development
  return '*';
};

serve(async (req) => {
  // Get origin early and set up CORS headers - MUST be first thing
  const origin = req.headers.get('origin');
  const allowedOrigin = getAllowedOrigin(origin);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      status: 200,
      headers: corsHeaders 
    });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    
    if (!stripeSecretKey) {
      throw new Error('Not configured');
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) throw new Error('No authorization header');

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    if (userError || !user) throw new Error('Unauthorized');

    // Get user's Stripe customer ID from user_plans first
    const { data: userPlan } = await supabase
      .from('user_plans')
      .select('stripe_customer_id, stripe_subscription_id')
      .eq('user_id', user.id)
      .maybeSingle();

    let customerId = userPlan?.stripe_customer_id;
    let subscriptionId = userPlan?.stripe_subscription_id;

    // If no customer_id but we have a subscription_id, fetch customer from Stripe
    if (!customerId && subscriptionId) {
      try {
        const subscriptionResponse = await fetch(
          `https://api.stripe.com/v1/subscriptions/${subscriptionId}`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (subscriptionResponse.ok) {
          const subscription = await subscriptionResponse.json();
          customerId = typeof subscription.customer === 'string' 
            ? subscription.customer 
            : subscription.customer?.id;
          
          // Update user_plans with the customer_id we found
          if (customerId && userPlan) {
            await supabase
              .from('user_plans')
              .update({ stripe_customer_id: customerId, last_payment_source: 'stripe' })
              .eq('user_id', user.id);
          }
        }
      } catch (err) {
        console.error('Error fetching subscription:', err);
      }
    }

    // Last resort: Try to find customer by email in Stripe
    if (!customerId && user.email) {
      try {
        const customersResponse = await fetch(
          `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`,
          {
            headers: {
              'Authorization': `Bearer ${stripeSecretKey}`,
            },
          }
        );

        if (customersResponse.ok) {
          const customers = await customersResponse.json();
          if (customers.data && customers.data.length > 0) {
            customerId = customers.data[0].id;
            
            // Update user_plans with the customer_id we found
            await supabase
              .from('user_plans')
              .upsert({
                user_id: user.id,
                stripe_customer_id: customerId,
              }, {
                onConflict: 'user_id'
              });
          }
        }
      } catch (err) {
        console.error('Error searching for customer by email:', err);
      }
    }

    if (!customerId) {
      throw new Error('No Stripe customer found. Please subscribe first to manage billing.');
    }

    // Verify customer exists in Stripe before creating portal session
    try {
      const customerCheckResponse = await fetch(
        `https://api.stripe.com/v1/customers/${customerId}`,
        {
          headers: {
            'Authorization': `Bearer ${stripeSecretKey}`,
          },
        }
      );

      if (!customerCheckResponse.ok) {
        // Customer doesn't exist in Stripe - try to find by email
        console.warn(`Customer ${customerId} not found in Stripe, searching by email...`);
        
        if (user.email) {
          const customersResponse = await fetch(
            `https://api.stripe.com/v1/customers?email=${encodeURIComponent(user.email)}&limit=1`,
            {
              headers: {
                'Authorization': `Bearer ${stripeSecretKey}`,
              },
            }
          );

          if (customersResponse.ok) {
            const customers = await customersResponse.json();
            if (customers.data && customers.data.length > 0) {
              const validCustomerId = customers.data[0].id;
              
              // Update database with valid customer ID
              await supabase
                .from('user_plans')
                .upsert({
                  user_id: user.id,
                  stripe_customer_id: validCustomerId,
                  last_payment_source: 'stripe',
                }, {
                  onConflict: 'user_id'
                });
              
              customerId = validCustomerId;
              console.log(`Updated customer ID to ${validCustomerId} from email search`);
            } else {
              throw new Error('No Stripe customer found. Please subscribe first to manage billing.');
            }
          } else {
            throw new Error('No Stripe customer found. Please subscribe first to manage billing.');
          }
        } else {
          throw new Error('No Stripe customer found. Please subscribe first to manage billing.');
        }
      }
    } catch (err) {
      if (err instanceof Error && err.message.includes('No Stripe customer found')) {
        throw err;
      }
      console.error('Error verifying customer:', err);
      throw new Error('No Stripe customer found. Please subscribe first to manage billing.');
    }

    // Get origin for return URL
    let returnUrl: string | null = null;
    
    try {
      const origin = req.headers.get('origin') || req.headers.get('referer');
      if (origin) {
        const baseUrl = origin.replace(/\/$/, '');
        const url = new URL(baseUrl);
        returnUrl = `${url.protocol}//${url.host}/settings`;
      }
    } catch (err) {
      console.error('Error parsing origin URL:', err);
    }
    
    // Fallback to environment variable if origin detection failed
    if (!returnUrl) {
      const appUrl = Deno.env.get('APP_URL') || Deno.env.get('VITE_APP_URL');
      if (appUrl) {
        returnUrl = `${appUrl.replace(/\/$/, '')}/settings`;
      } else {
        // Last resort: construct from Supabase URL (if it's a custom domain)
        const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
        if (supabaseUrl) {
          try {
            const url = new URL(supabaseUrl);
            // Extract base domain (remove .supabase.co or custom domain)
            const host = url.host.replace(/\.supabase\.co$/, '');
            returnUrl = `https://${host}/settings`;
          } catch {
            // If all else fails, throw error - we need a valid return URL
            throw new Error('Unable to determine return URL. Please set APP_URL environment variable or ensure origin header is present.');
          }
        } else {
          throw new Error('Unable to determine return URL. Please set APP_URL environment variable or ensure origin header is present.');
        }
      }
    }

    // Create Customer Portal session
    const portalResponse = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        customer: customerId,
        return_url: returnUrl,
      }),
    });

    if (!portalResponse.ok) {
      const errorText = await portalResponse.text();
      console.error('Stripe Customer Portal creation error:', errorText);
      throw new Error('Failed to create customer portal session');
    }

    const portal = await portalResponse.json();

    return new Response(
      JSON.stringify({ 
        url: portal.url,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in create-customer-portal:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Error details:', {
      message: errorMessage,
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return new Response(
      JSON.stringify({ 
        error: sanitizeErrorMessage(error)
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});












